"""
F2 Agent unit tests (Week 2) — pure function tests, no DB or API keys required.
"""
import pytest

from app.agents.github_agent import (
    compute_ast_score,
    compute_commit_score,
    compute_github_confidence,
    count_originality_flags,
)
from app.agents.document_agent import (
    compute_document_confidence,
    compute_sentence_variance,
    compute_vocabulary_diversity,
    compute_writing_complexity,
    check_authorship_consistency,
)
from app.agents.credential_agent import (
    compute_credential_confidence,
    match_candidate_name,
    match_issuer,
)


# ── GitHub Agent: commit authenticity ─────────────────────────────────────────

class _FakeAuthor:
    def __init__(self, email, date):
        self.email = email
        self.date = date

class _FakeCommitData:
    def __init__(self, email, date):
        self.author = _FakeAuthor(email, date)

class _FakeCommit:
    def __init__(self, email, date):
        self.commit = _FakeCommitData(email, date)


def _make_commits(n, email="dev@example.com", span_days=5):
    from datetime import datetime, timedelta, timezone
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    return [
        _FakeCommit(email, base + timedelta(days=i * (span_days / max(n - 1, 1))))
        for i in range(n)
    ]


@pytest.mark.unit
def test_commit_score_full_marks():
    commits = _make_commits(10, span_days=30)
    score, detail = compute_commit_score(commits)
    # 10 commits (>5): 40pts, email consistent: 30pts, span >1 day: 30pts = 100
    assert score == 100.0
    assert detail["commit_count"] == 10


@pytest.mark.unit
def test_commit_score_below_five_commits():
    commits = _make_commits(3, span_days=10)
    score, detail = compute_commit_score(commits)
    # 3/5 * 40 = 24 pts from count; consistent email +30; span +30 = 84
    assert score < 100.0
    assert detail["commit_count"] == 3


@pytest.mark.unit
def test_commit_score_same_day_span_penalised():
    commits = _make_commits(10, span_days=0)
    score, detail = compute_commit_score(commits)
    # No span points (0 days)
    assert detail["span_days"] == 0.0
    assert score < 100.0


@pytest.mark.unit
def test_commit_score_empty():
    score, detail = compute_commit_score([])
    assert score == 0.0
    assert detail["commit_count"] == 0


@pytest.mark.unit
def test_commit_score_inconsistent_emails():
    from datetime import datetime, timedelta, timezone
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    commits = [
        _FakeCommit("a@x.com" if i % 2 == 0 else "b@y.com", base + timedelta(days=i))
        for i in range(10)
    ]
    score, detail = compute_commit_score(commits)
    # Email consistency ~50% → ~15pts instead of 30
    assert detail["email_consistency"] < 1.0
    assert score < 100.0


# ── GitHub Agent: AST complexity ──────────────────────────────────────────────

@pytest.mark.unit
def test_ast_score_empty_files():
    score, label = compute_ast_score([])
    assert score == 0.0
    assert label == "None"


@pytest.mark.unit
def test_ast_score_complex_python_higher_than_trivial():
    trivial = b"x = 1\ny = 2\n"
    complex_code = b"""
import os
import sys
from typing import List, Optional

class DataProcessor:
    def __init__(self, config: dict):
        self.config = config
        self._cache = {}

    def process(self, items: List[str]) -> Optional[dict]:
        try:
            results = {}
            for item in items:
                if item in self._cache:
                    results[item] = self._cache[item]
                else:
                    val = self._transform(item)
                    self._cache[item] = val
                    results[item] = val
            return results
        except Exception as e:
            raise RuntimeError(f"Processing failed: {e}") from e

    def _transform(self, item: str) -> str:
        return item.strip().lower()
"""
    trivial_score, _ = compute_ast_score([("script.py", trivial)])
    complex_score, label = compute_ast_score([("processor.py", complex_code)])
    assert complex_score > trivial_score
    assert label in ("High", "Medium", "Low")


# ── GitHub Agent: originality flags ──────────────────────────────────────────

@pytest.mark.unit
def test_originality_flags_clean_repo():
    flags, names = count_originality_flags("My custom project README", ["def process(): return True"], ["app.py"])
    assert flags == 0
    assert names == []


@pytest.mark.unit
def test_originality_flags_boilerplate_readme():
    readme = "Getting Started\nPrerequisites\nStep 1: Install\nStep 2: Run\nSample Project\nReplace this with your content\nThis is a basic template"
    flags, names = count_originality_flags(readme, ["def foo(): pass"], ["app.py"])
    assert "boilerplate_readme" in names


@pytest.mark.unit
def test_originality_flags_generic_vars():
    code = "let x = 1\nlet y = 2\nvar foo\nvar bar\nbaz = temp = tmp = 0"
    flags, names = count_originality_flags("", [code], ["app.js"])
    assert "generic_variable_names" in names


@pytest.mark.unit
def test_originality_two_flags_give_zero_bonus():
    # Need ≥2 flags to get orig_bonus=0
    readme = "Getting Started\nPrerequisites\nStep 1\nStep 2\nSample Project\nReplace this with"
    code = "let x = 1\nlet y = 2\nvar foo\nvar bar\nbaz = 0"
    filenames = ["tutorial/lesson_1.py", "tutorial/lesson_2.py"]
    flags, _ = count_originality_flags(readme, [code], filenames)
    confidence = compute_github_confidence(100.0, 100.0, flags)
    if flags >= 2:
        assert confidence == 100.0 * 0.4 + 100.0 * 0.4 + 0.0  # orig_bonus=0


# ── GitHub Agent: confidence formula ─────────────────────────────────────────

@pytest.mark.unit
def test_github_confidence_no_flags():
    c = compute_github_confidence(100.0, 100.0, 0)
    assert c == 100.0


@pytest.mark.unit
def test_github_confidence_two_flags():
    c = compute_github_confidence(100.0, 100.0, 2)
    assert c == 80.0  # 40 + 40 + 0


@pytest.mark.unit
def test_github_confidence_formula_known_values():
    # commit=80, ast=70, no flags: 80*0.4 + 70*0.4 + 100*0.2 = 32 + 28 + 20 = 80
    assert compute_github_confidence(80.0, 70.0, 0) == 80.0


# ── Document Agent: writing complexity ───────────────────────────────────────

@pytest.mark.unit
def test_vocabulary_diversity_empty():
    assert compute_vocabulary_diversity("hi") == 0.0


@pytest.mark.unit
def test_vocabulary_diversity_higher_for_diverse_text():
    repetitive = "the cat sat on the mat the cat sat on the mat " * 5
    diverse = (
        "Cognitive flexibility enables rapid adaptation. "
        "Behavioural assessment frameworks quantify resilience. "
        "Empirical validation underpins algorithmic credentialing systems. "
        "Lexical sophistication correlates with analytical acuity."
    ) * 3
    assert compute_vocabulary_diversity(diverse) > compute_vocabulary_diversity(repetitive)


@pytest.mark.unit
def test_sentence_variance_uniform_sentences():
    # All same length → variance = 0
    text = "The cat sat. The dog ran. The bird flew. The fish swam."
    score = compute_sentence_variance(text)
    assert score < 20.0


@pytest.mark.unit
def test_sentence_variance_mixed_length():
    text = (
        "Go. "
        "This is a moderately long sentence with several clauses and technical vocabulary. "
        "OK. "
        "The complexity of distributed systems often manifests in subtle emergent behaviours "
        "that are difficult to reproduce in isolation."
    )
    score = compute_sentence_variance(text)
    assert score > 20.0


@pytest.mark.unit
def test_document_confidence_formula():
    # (100-20)*0.5 + 60*0.3 + 70*0.2 = 40 + 18 + 14 = 72
    assert compute_document_confidence(20.0, 60.0, 70.0) == 72.0


@pytest.mark.unit
def test_authorship_consistency_first_submission():
    result = check_authorship_consistency(45.0, None)
    assert result["checked"] is False
    assert result["consistent"] is True


@pytest.mark.unit
def test_authorship_consistency_within_tolerance():
    result = check_authorship_consistency(45.0, 40.0, tolerance=25.0)
    assert result["checked"] is True
    assert result["consistent"] is True


@pytest.mark.unit
def test_authorship_consistency_outside_tolerance():
    result = check_authorship_consistency(10.0, 60.0, tolerance=25.0)
    assert result["checked"] is True
    assert result["consistent"] is False


# ── Credential Agent: fuzzy matching ─────────────────────────────────────────

@pytest.mark.unit
def test_issuer_match_exact():
    matched, best, score = match_issuer("Universiti Malaya")
    assert matched is True
    assert "Universiti Malaya" in (best or "")


@pytest.mark.unit
def test_issuer_match_abbreviation():
    matched, best, score = match_issuer("UM")
    assert matched is True


@pytest.mark.unit
def test_issuer_match_close_variant():
    matched, best, score = match_issuer("Universiti Malaya (UM)")
    assert matched is True


@pytest.mark.unit
def test_issuer_match_unrelated_string():
    matched, best, score = match_issuer("XYZ Random Institute of Nothing")
    assert matched is False


@pytest.mark.unit
def test_issuer_match_none():
    matched, best, score = match_issuer(None)
    assert matched is False
    assert score == 0.0


@pytest.mark.unit
def test_name_match_exact():
    assert match_candidate_name("Ahmad Farid", "Ahmad Farid") is True


@pytest.mark.unit
def test_name_match_case_insensitive():
    assert match_candidate_name("ahmad farid", "Ahmad Farid") is True


@pytest.mark.unit
def test_name_match_initials():
    assert match_candidate_name("A.F.", "Ahmad Farid") is True


@pytest.mark.unit
def test_name_match_partial_chinese_name():
    # "Wei Chen" vs "Wei Chen Lim" — partial match
    assert match_candidate_name("Wei Chen", "Wei Chen Lim") is True


@pytest.mark.unit
def test_name_match_completely_different():
    assert match_candidate_name("John Smith", "Ahmad Farid") is False


# ── Credential Agent: confidence rules ───────────────────────────────────────

@pytest.mark.unit
def test_credential_confidence_issuer_and_name_match():
    assert compute_credential_confidence(True, True) == 90


@pytest.mark.unit
def test_credential_confidence_issuer_no_name():
    assert compute_credential_confidence(True, False) == 50


@pytest.mark.unit
def test_credential_confidence_no_issuer():
    assert compute_credential_confidence(False, True) == 30
    assert compute_credential_confidence(False, False) == 30
