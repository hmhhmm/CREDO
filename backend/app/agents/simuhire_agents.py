"""
F6 SimuHire Agents — all four use claude-sonnet-4-6.

  1. Scenario Master  — drives session through Setup→Challenge→Escalation→Resolution (≤120 words)
  2. Stakeholder      — plays a difficult persona, triggered at stage transitions (≤80 words)
  3. Evaluator        — scores FULL transcript on 5 dimensions; called ONCE at session end
  4. Feedback         — writes Behavioral Traits Report from Evaluator scores ONLY (no transcript)
"""
import json
import logging

logger = logging.getLogger(__name__)

DIMENSIONS = [
    "Adaptability",
    "Communication",
    "Problem-Solving",
    "Stress Response",
    "Systems Thinking",
]

STAKEHOLDER_PERSONAS = {
    "Scope Creeper": (
        "You are a client who keeps expanding the project scope beyond what was agreed. "
        "You are enthusiastic and oblivious to the constraints this creates. "
        "Add new requirements framed as 'small additions' that actually represent significant extra work."
    ),
    "Sceptic": (
        "You are a sceptical senior stakeholder who doubts the proposed approach. "
        "Challenge assumptions, question feasibility, and push back on timelines. "
        "You are not hostile — just rigorous and unconvinced."
    ),
    "Escalator": (
        "You are an anxious manager who escalates every minor issue to upper management. "
        "You catastrophise and threaten to bring things to the director at the slightest friction. "
        "You are worried about your own performance review."
    ),
}

SCENARIO_CONTEXTS = {
    "technical": {
        "description": "a software engineering production incident",
        "stages": {
            "Setup": (
                "You're the on-call engineer. At 2am, monitoring alerts fire: "
                "the payment service is returning 503 errors. Orders are failing. "
                "You have 30 minutes before the SLA breach window opens."
            ),
            "Challenge": (
                "Initial investigation shows the database connection pool is exhausted. "
                "Decide: roll back last night's deployment, or apply a hotfix directly to production? "
                "Both have serious risks."
            ),
            "Escalation": (
                "The hotfix is taking longer than expected. Your CTO has joined the Slack channel. "
                "A key enterprise client is threatening to cancel their contract."
            ),
            "Resolution": (
                "The immediate crisis is stabilising. Guide the candidate to articulate "
                "a clear resolution decision and a post-mortem plan."
            ),
        },
    },
    "business": {
        "description": "a project management client scope escalation",
        "stages": {
            "Setup": (
                "You're a project manager. Twenty minutes before a milestone demo, "
                "your biggest client emails asking to 'add a few things' that would double the scope."
            ),
            "Challenge": (
                "The development team says the changes need two extra weeks. "
                "Your contract locks in the original deadline. "
                "You must negotiate with both the client and the dev team simultaneously."
            ),
            "Escalation": (
                "The client has escalated directly to your CEO. "
                "Internally, the lead developer is threatening to quit if scope keeps expanding "
                "without timeline relief."
            ),
            "Resolution": (
                "Both sides are waiting for your decision. Guide the candidate to "
                "propose a concrete stakeholder alignment plan."
            ),
        },
    },
    "general": {
        "description": "a cross-functional team conflict",
        "stages": {
            "Setup": (
                "You've just joined a cross-functional team for a high-visibility initiative. "
                "In your first week you discover two senior team members have fundamentally "
                "different visions for the project direction."
            ),
            "Challenge": (
                "Both team members come to you separately expecting your backing. "
                "The project deadline is fixed and a decision must be made today."
            ),
            "Escalation": (
                "Word gets out you're mediating. The conflict becomes visible to senior leadership "
                "who want a resolution briefing by end of day."
            ),
            "Resolution": (
                "Leadership is waiting. Guide the candidate to articulate a concrete "
                "conflict resolution approach and their next step."
            ),
        },
    },
}


def get_stage(candidate_message_count: int) -> str:
    """Determine session stage from the number of candidate messages sent so far."""
    if candidate_message_count <= 1:
        return "Setup"
    if candidate_message_count <= 4:
        return "Challenge"
    if candidate_message_count <= 7:
        return "Escalation"
    return "Resolution"


def should_trigger_stakeholder(candidate_message_count: int) -> bool:
    """
    Stakeholder appears at the first message of Challenge (count=2)
    and the first message of Escalation (count=5) — twice per session max.
    """
    return candidate_message_count in (2, 5)


def format_transcript(conversation: list[dict]) -> str:
    lines = []
    for msg in conversation:
        speaker = msg.get("speaker", "unknown").title()
        text = msg.get("text", "")
        lines.append(f"{speaker}: {text}")
    return "\n".join(lines)


def _get_client():
    """Return an AsyncAnthropic client, raising RuntimeError if key is missing."""
    from anthropic import AsyncAnthropic
    from app.config import settings

    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. "
            "Provide it in .env to run SimuHire agents."
        )
    return AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


def _parse_json_response(raw: str) -> dict:
    """Strip markdown fences and parse JSON from a model response."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        # parts[1] is the content inside the first fence pair
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ── 1. Scenario Master ────────────────────────────────────────────────────────

async def call_scenario_master(
    conversation: list[dict],
    simulation_type: str,
    stage: str,
) -> str:
    """Drive the session. Returns the interviewer's next message (≤120 words)."""
    client = _get_client()
    ctx = SCENARIO_CONTEXTS.get(simulation_type, SCENARIO_CONTEXTS["general"])
    stage_text = ctx["stages"].get(stage, ctx["stages"]["Resolution"])

    system = (
        f"You are the Scenario Master running a behavioral simulation: {ctx['description']}.\n\n"
        f"Current stage: {stage}\n"
        f"Stage context: {stage_text}\n\n"
        "Rules:\n"
        "- Stay fully in character as the unfolding workplace situation\n"
        "- Drive the scenario forward; never break character\n"
        "- Respond in 120 words or fewer\n"
        "- End with a clear question or decision point requiring a concrete candidate response\n"
        "- Do not score or evaluate the candidate"
    )

    # Build message history for the model
    messages = []
    for msg in conversation:
        if msg["speaker"] == "candidate":
            messages.append({"role": "user", "content": msg["text"]})
        elif msg["speaker"] in ("interviewer", "stakeholder"):
            messages.append({"role": "assistant", "content": msg["text"]})

    if not messages:
        messages = [{"role": "user", "content": "Please begin the simulation."}]

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        system=system,
        messages=messages,
    )
    return response.content[0].text.strip()


# ── 2. Stakeholder ────────────────────────────────────────────────────────────

async def call_stakeholder(
    conversation: list[dict],
    persona: str,
    simulation_type: str,
) -> str:
    """Interject as a difficult stakeholder. Returns their message (≤80 words)."""
    client = _get_client()
    ctx = SCENARIO_CONTEXTS.get(simulation_type, SCENARIO_CONTEXTS["general"])
    persona_desc = STAKEHOLDER_PERSONAS.get(persona, STAKEHOLDER_PERSONAS["Sceptic"])

    system = (
        f"You are a difficult stakeholder intervening in {ctx['description']}.\n\n"
        f"Your persona: {persona_desc}\n\n"
        "Rules:\n"
        "- Stay fully in character; never break the fourth wall\n"
        "- Respond in 80 words or fewer\n"
        "- Create realistic pressure the candidate must manage\n"
        "- Do not resolve the conflict yourself — make the candidate work for it"
    )

    # React to the candidate's most recent message
    last_candidate = next(
        (m["text"] for m in reversed(conversation) if m["speaker"] == "candidate"),
        "The situation is developing.",
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=150,
        system=system,
        messages=[{"role": "user", "content": last_candidate}],
    )
    return response.content[0].text.strip()


# ── 3. Evaluator ──────────────────────────────────────────────────────────────

async def call_evaluator(conversation: list[dict]) -> dict:
    """
    Score the full transcript on 5 behavioral dimensions.
    Called ONCE at session end — never per-message.
    Returns: {dimension: {score: int, evidence: str}, ...}
    """
    client = _get_client()
    transcript = format_transcript(conversation)

    system = (
        "You are an objective behavioral assessor scoring a job candidate's performance "
        "in a workplace simulation. Analyse the full transcript and score on exactly 5 dimensions.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        '  "Adaptability":    {"score": <0-100>, "evidence": "<direct quote ≤30 words>"},\n'
        '  "Communication":   {"score": <0-100>, "evidence": "<direct quote ≤30 words>"},\n'
        '  "Problem-Solving": {"score": <0-100>, "evidence": "<direct quote ≤30 words>"},\n'
        '  "Stress Response": {"score": <0-100>, "evidence": "<direct quote ≤30 words>"},\n'
        '  "Systems Thinking":{"score": <0-100>, "evidence": "<direct quote ≤30 words>"}\n'
        "}\n\n"
        "Rules:\n"
        "- Base scores ONLY on what the candidate actually said\n"
        "- Evidence must be a direct quote or close paraphrase from the transcript\n"
        "- If the candidate said very little, reflect that in lower scores\n"
        "- Return valid JSON only, no markdown, no explanation"
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": f"Transcript:\n\n{transcript}"}],
    )

    try:
        data = _parse_json_response(response.content[0].text)
    except (json.JSONDecodeError, IndexError) as exc:
        logger.error("Evaluator returned invalid JSON: %s", exc)
        data = {}

    # Ensure all dimensions present and scores are in range
    for dim in DIMENSIONS:
        if dim not in data:
            data[dim] = {"score": 50, "evidence": "Insufficient transcript evidence."}
        data[dim]["score"] = max(0, min(100, int(data[dim].get("score", 50))))

    logger.info("Evaluator scores: %s", {d: data[d]["score"] for d in DIMENSIONS})
    return data


# ── 4. Feedback ───────────────────────────────────────────────────────────────

async def call_feedback(evaluator_scores: dict, simulation_type: str) -> dict:
    """
    Generate the Behavioral Traits Report from Evaluator scores + evidence ONLY.
    Must NOT re-read the raw transcript — system prompt enforces this.
    Returns the full report dict.
    """
    client = _get_client()
    eval_json = json.dumps(evaluator_scores, indent=2)

    system = (
        "You are a professional career coach writing a Behavioral Traits Report.\n"
        "You will receive an evaluation JSON with dimension scores and evidence quotes.\n"
        "Base EVERY comment ONLY on the evidence provided — do not invent, infer, "
        "or use any information beyond the evaluation below.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        '  "overall_score": <integer 0-100, equal-weighted average of all 5 dimension scores>,\n'
        '  "dimensions": [\n'
        '    {"name": "<dim>", "score": <0-100>, '
        '"strength": "<≤25 words grounded in evidence>", '
        '"growth": "<≤25 words concrete improvement>"}\n'
        "  ],\n"
        '  "key_observations": [\n'
        '    "<observation 1, ≤25 words>",\n'
        '    "<observation 2, ≤25 words>",\n'
        '    "<observation 3, ≤25 words>"\n'
        "  ]\n"
        "}\n\n"
        "Return valid JSON only, no markdown, no explanation."
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=system,
        messages=[{"role": "user", "content": f"Evaluation data:\n\n{eval_json}"}],
    )

    try:
        data = _parse_json_response(response.content[0].text)
    except (json.JSONDecodeError, IndexError) as exc:
        logger.error("Feedback agent returned invalid JSON: %s", exc)
        data = {}

    # Override overall_score with equal-weighted average for correctness
    dim_scores = [d["score"] for d in data.get("dimensions", []) if "score" in d]
    if dim_scores:
        data["overall_score"] = round(sum(dim_scores) / len(dim_scores))

    # Ensure key_observations has exactly 3 items
    obs = data.get("key_observations", [])
    while len(obs) < 3:
        obs.append("No additional observation available.")
    data["key_observations"] = obs[:3]

    logger.info("Feedback report generated: overall_score=%s", data.get("overall_score"))
    return data
