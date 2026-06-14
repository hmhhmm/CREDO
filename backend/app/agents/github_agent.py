"""
F2 Agent A — GitHub Agent.
Runs as an ARQ async job; called by the /verify/github endpoint.

Checks:
  1. Commit Authenticity  — email consistency, ≥5 commits, span >1 day
  2. Code Complexity (AST) — tree-sitter (JS/TS) or stdlib ast (Python)
  3. Originality Flags    — boilerplate README, generic vars, tutorial filenames

Final confidence = commit_score×0.4 + ast_score×0.4 + orig_bonus×0.2
"""
import ast as python_ast
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

# tree-sitter is optional; falls back to keyword-count heuristic if unavailable
try:
    from tree_sitter_languages import get_parser as _get_ts_parser

    _TS_AVAILABLE = True
except ImportError:
    _TS_AVAILABLE = False

# ── Commit Authenticity ───────────────────────────────────────────────────────

def compute_commit_score(commits: list) -> tuple[float, dict]:
    """
    Returns (score 0-100, detail dict).
    Checks: commit count ≥5, author email consistency, commit span >1 day.
    """
    if not commits:
        return 0.0, {"commit_count": 0, "email_consistency": 0.0, "span_days": 0}

    n = len(commits)

    # Count: 40 points if ≥5 commits, proportional below
    count_points = 40.0 if n >= 5 else (n / 5) * 40

    # Email consistency: 30 points
    emails = []
    for c in commits:
        try:
            emails.append((c.commit.author.email or "").lower())
        except Exception:
            emails.append("")
    primary = max(set(emails), key=emails.count) if emails else ""
    consistency = (emails.count(primary) / len(emails)) if emails else 0.0
    email_points = consistency * 30

    # Commit span: 30 points if first → last commit > 1 day
    try:
        dates = sorted(c.commit.author.date for c in commits)
        span_seconds = (dates[-1] - dates[0]).total_seconds()
        span_days = span_seconds / 86400
        span_points = 30.0 if span_days > 1 else 0.0
    except Exception:
        span_days = 0.0
        span_points = 0.0

    score = min(100.0, count_points + email_points + span_points)
    return score, {
        "commit_count": n,
        "email_consistency": round(consistency, 2),
        "span_days": round(span_days, 2),
    }


# ── AST Complexity ────────────────────────────────────────────────────────────

def _collect_ts_node_types(node, types: set) -> None:
    types.add(node.type)
    for child in node.children:
        _collect_ts_node_types(child, types)


def _js_ast_diversity(code_bytes: bytes) -> float:
    """Parse JS/TS with tree-sitter; score = unique node types / 25, capped at 100."""
    if not _TS_AVAILABLE:
        return _keyword_complexity(code_bytes.decode(errors="ignore"))
    try:
        parser = _get_ts_parser("javascript")
        tree = parser.parse(code_bytes)
        node_types: set[str] = set()
        _collect_ts_node_types(tree.root_node, node_types)
        return min(100.0, len(node_types) / 25 * 100)
    except Exception:
        return _keyword_complexity(code_bytes.decode(errors="ignore"))


def _python_ast_diversity(code: str) -> float:
    """Parse Python with stdlib ast; score = unique node types / 20, capped at 100."""
    try:
        tree = python_ast.parse(code)
        node_types = {type(n).__name__ for n in python_ast.walk(tree)}
        return min(100.0, len(node_types) / 20 * 100)
    except SyntaxError:
        return _keyword_complexity(code)


def _keyword_complexity(code: str) -> float:
    """Fallback: count distinct programming keywords as a rough complexity proxy."""
    keywords = {
        "function", "class", "return", "async", "await", "import", "export",
        "try", "catch", "finally", "for", "while", "if", "else", "switch",
        "case", "break", "continue", "new", "this", "super", "yield", "throw",
        "def", "lambda", "with", "assert", "raise", "except", "pass",
    }
    found = {kw for kw in keywords if re.search(rf"\b{kw}\b", code)}
    return min(100.0, len(found) / 15 * 100)


def compute_ast_score(file_samples: list[tuple[str, bytes]]) -> tuple[float, str]:
    """
    file_samples: list of (filename, content_bytes), up to 5 files.
    Returns (score 0-100, complexity_label).
    """
    if not file_samples:
        return 0.0, "None"

    scores = []
    for filename, content_bytes in file_samples:
        lower = filename.lower()
        if lower.endswith(".py"):
            scores.append(_python_ast_diversity(content_bytes.decode(errors="ignore")))
        elif lower.endswith((".js", ".ts", ".jsx", ".tsx")):
            scores.append(_js_ast_diversity(content_bytes))
        else:
            scores.append(_keyword_complexity(content_bytes.decode(errors="ignore")))

    avg = sum(scores) / len(scores)
    if avg >= 70:
        label = "High"
    elif avg >= 40:
        label = "Medium"
    else:
        label = "Low"
    return round(avg, 1), label


# ── Originality Flags ─────────────────────────────────────────────────────────

_BOILERPLATE_PHRASES = [
    "getting started", "prerequisites", "how to install", "step 1", "step 2",
    "todo: add", "your name here", "lorem ipsum", "replace this with",
    "created by [your name]", "[your name]", "sample project", "starter template",
    "this is a", "clone this repo",
]

_GENERIC_VAR_PATTERNS = [
    r"\bfoo\b", r"\bbar\b", r"\bbaz\b", r"\bvar x\b", r"\bvar y\b",
    r"\blet x\s*=", r"\blet y\s*=", r"\btemp\s*=", r"\btmp\s*=",
    r"def test_\w+\(self\):\s*pass",
]

_TUTORIAL_FILENAME_PATTERNS = [
    "tutorial", "lesson", "exercise", "homework", "lab_",
    "assignment", "workshop", "starter", "template",
]


def count_originality_flags(
    readme_content: str,
    code_contents: list[str],
    file_names: list[str],
) -> tuple[int, list[str]]:
    """
    Returns (flag_count, list_of_triggered_flag_names).
    ≥2 flags → orig_bonus = 0.
    """
    triggered = []

    # Flag 1: boilerplate README
    readme_lower = (readme_content or "").lower()
    hits = sum(1 for p in _BOILERPLATE_PHRASES if p in readme_lower)
    if hits >= 3:
        triggered.append("boilerplate_readme")

    # Flag 2: generic variable names
    combined = "\n".join(code_contents)
    generic_hits = sum(1 for p in _GENERIC_VAR_PATTERNS if re.search(p, combined))
    if generic_hits >= 3:
        triggered.append("generic_variable_names")

    # Flag 3: tutorial file structure
    names_lower = [f.lower() for f in file_names]
    tutorial_hits = sum(
        1 for pat in _TUTORIAL_FILENAME_PATTERNS if any(pat in n for n in names_lower)
    )
    if tutorial_hits >= 2:
        triggered.append("tutorial_file_structure")

    return len(triggered), triggered


# ── Confidence Formula ────────────────────────────────────────────────────────

def compute_github_confidence(
    commit_score: float,
    ast_score: float,
    flag_count: int,
) -> float:
    """confidence = commit_score×0.4 + ast_score×0.4 + orig_bonus×0.2"""
    orig_bonus = 0.0 if flag_count >= 2 else 100.0
    return round(commit_score * 0.4 + ast_score * 0.4 + orig_bonus * 0.2, 1)


# ── ARQ Job ───────────────────────────────────────────────────────────────────

CODE_EXTENSIONS = (".py", ".js", ".ts", ".jsx", ".tsx")
README_NAMES = ("readme.md", "readme.txt", "readme.rst", "readme")


async def run_github_analysis(ctx: dict, artifact_id: str, repo_full_name: str) -> None:
    """
    ARQ job: analyses a GitHub repo and writes result to verified_artifacts.
    On confidence ≥ 60: atomically writes to credential_ledger.
    On confidence < 60: marks artifact as 'failed'.

    ctx must contain 'session_factory' (set up in worker.py startup).
    """
    from github import Github, GithubException
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User
    from app.models.verified_artifact import VerifiedArtifact
    from app.services.ledger_service import atomic_ledger_write
    from app.utils.crypto import decrypt_token

    artifact_uuid = uuid.UUID(artifact_id)

    async with ctx["session_factory"]() as db:
        async with db.begin():
            # Fetch artifact + owner
            result = await db.execute(
                select(VerifiedArtifact).where(VerifiedArtifact.id == artifact_uuid)
            )
            artifact = result.scalar_one_or_none()
            if artifact is None:
                return

            user_result = await db.execute(select(User).where(User.id == artifact.user_id))
            user = user_result.scalar_one_or_none()
            if user is None or not user.github_token:
                artifact.status = "failed"
                artifact.metadata_ = {"error": "No GitHub token found for user"}
                return

            # Decrypt stored token
            try:
                from app.config import settings
                token = decrypt_token(user.github_token) if settings.FERNET_KEY else user.github_token
            except Exception:
                artifact.status = "failed"
                artifact.metadata_ = {"error": "Token decryption failed"}
                return

            # Analyse repo
            try:
                g = Github(token)
                repo = g.get_repo(repo_full_name)

                # ── 1. Commits ──────────────────────────────────────────────
                commits = list(repo.get_commits()[:100])
                commit_score, commit_detail = compute_commit_score(commits)

                # ── 2. Code files (AST) ────────────────────────────────────
                try:
                    tree = repo.get_git_tree(repo.default_branch, recursive=True)
                    code_files = [
                        f for f in tree.tree
                        if f.type == "blob" and f.path.lower().endswith(CODE_EXTENSIONS)
                    ][:5]
                except Exception:
                    code_files = []

                file_samples: list[tuple[str, bytes]] = []
                code_contents: list[str] = []
                file_names: list[str] = []

                for file_obj in code_files:
                    try:
                        content_file = repo.get_contents(file_obj.path)
                        raw = content_file.decoded_content  # bytes
                        file_samples.append((file_obj.path, raw))
                        code_contents.append(raw.decode(errors="ignore"))
                        file_names.append(file_obj.path)
                    except Exception:
                        continue

                ast_score, complexity_label = compute_ast_score(file_samples)

                # ── 3. README (originality) ────────────────────────────────
                readme_content = ""
                try:
                    all_files = [f for f in tree.tree if f.type == "blob"]
                    readme_file = next(
                        (f for f in all_files if f.path.lower() in README_NAMES), None
                    )
                    if readme_file:
                        readme_obj = repo.get_contents(readme_file.path)
                        readme_content = readme_obj.decoded_content.decode(errors="ignore")
                except Exception:
                    pass

                all_file_names = [f.path for f in (tree.tree if hasattr(tree, "tree") else [])]
                flag_count, flags = count_originality_flags(
                    readme_content, code_contents, all_file_names
                )

                # ── 4. Confidence ──────────────────────────────────────────
                confidence = compute_github_confidence(commit_score, ast_score, flag_count)

                metadata = {
                    "commit_count": commit_detail["commit_count"],
                    "commit_score": round(commit_score, 1),
                    "email_consistency": commit_detail["email_consistency"],
                    "span_days": commit_detail["span_days"],
                    "ast_score": ast_score,
                    "complexity_label": complexity_label,
                    "flag_count": flag_count,
                    "flags": flags,
                    "orig_bonus": 0 if flag_count >= 2 else 100,
                }

                if confidence >= 60:
                    await atomic_ledger_write(
                        db=db,
                        artifact=artifact,
                        confidence=confidence,
                        extra_metadata=metadata,
                    )
                    # artifact.status set to 'verified' inside atomic_ledger_write
                else:
                    artifact.status = "failed"
                    artifact.confidence = confidence
                    artifact.metadata_ = metadata

            except GithubException as exc:
                artifact.status = "failed"
                artifact.metadata_ = {"error": f"GitHub API error: {exc.status} {exc.data}"}
            except Exception as exc:
                artifact.status = "failed"
                artifact.metadata_ = {"error": str(exc)}
