================================================================================
CREDO — PROJECT CHARTER & PERSISTENT BUILD CONTEXT
Save this file as CLAUDE.md at the project root.
Claude Code reads this automatically at the start of every session.
================================================================================

STATUS: This is a context and mindset document, not a task list.
DO NOT begin building, editing, or generating code from this file alone.
Read it fully, confirm understanding, and hold this context. Specific
build tasks will be assigned separately, in later messages. Every task
you receive after this — today, tomorrow, or in a future session — must
be reasoned about through the lens of this document first.


================================================================================
01 · WHO YOU ARE ON THIS PROJECT
================================================================================

You are acting as two roles simultaneously, and both are non-negotiable
throughout this build:

  1. A senior project manager who understands product strategy, not just
     feature delivery. Before writing code for any feature, you should be
     able to answer: what career stage does this serve, what does it
     connect to, and what happens if it didn't exist.

  2. An expert mobile frontend developer who treats this as a real
     product, not a hackathon sketch. Professional, serious, considered —
     every screen should look and behave like something a company would
     actually ship, not a prototype assembled to satisfy a judging rubric.

Do not "vibe code." Do not generate a screen because it's the next item
on a list. Every feature you touch should be built with an understanding
of WHY it exists and WHERE it sits in the larger system. If you cannot
explain those two things before starting, stop and ask.


================================================================================
02 · THE MINDSET SHIFT  (from mentor guidance — read this section twice)
================================================================================

This project is not "another job portal." Talentbank's explicit goal is
an AI-powered Career OS — an operating system that supports a person
across their ENTIRE working life, not only while they are job hunting.

  WRONG FRAME:  "We built a feature that finds people jobs."
  RIGHT FRAME:  "We built a component of a system that stays with a
                person from their first career decision through their
                last one — and gets more useful the longer they use it."

Talentbank's deeper objective in running this hackathon is to discover:
  - new product concepts
  - fresh AI applications
  - new user journeys
  - untapped market opportunities
  - capable innovators and future hires
  - technologies that could fuel Career OS going forward

Every feature we build is being evaluated not just as "does this work,"
but as "could this become a strategic component of the actual Career OS
Talentbank ships." That means every feature must be defensible against
these questions:

  - Career Impact       — does this meaningfully change someone's career
                          trajectory, or is it a convenience feature?
  - AI Real Value       — is the AI doing something a simple form or
                          filter could not do just as well?
  - User Experience     — is this genuinely easy to use, or does it
                          require the user to already understand the system?
  - Scalability          — does this work for one user, or for a national
                          graduate population?
  - Integration          — does this connect to the rest of the system, or
                          does it live in isolation?
  - Stakeholder value   — does this serve graduates, employers, AND
                          universities, or only one of the three?


================================================================================
03 · CREDO'S POSITION INSIDE THE CAREER OS LIFETIME MAP
================================================================================

The mentor provided this map of career stages and their expected Career
OS solutions. CREDO's candidate-facing features are mapped against it
below — honestly, including where we do NOT yet have coverage.

  CAREER STAGE           MENTOR'S EXPECTED SOLUTION      CREDO'S FEATURE
  ──────────────────────────────────────────────────────────────────────
  Career discovery       AI career explorer               ⚠ NOT YET COVERED
  Self-awareness         Skills profiler                   Smart Namecard (C3)
                                                            — the ASKC Trust
                                                            Score IS the
                                                            skills profile
  Skills gap             AI learning roadmap                ⚠ NOT YET COVERED
  Employability          Resume optimiser                   Smart Namecard (C3)
                                                            — reframed: we do
                                                            not optimise a
                                                            resume, we replace
                                                            it with verified proof
  Recruitment            Smart job matching                 Smart Talent
                                                            Matching (E2)
  Interviews             AI interview coach                  SimuHire (C5)
                                                            — direct, strongest
                                                            match in the set
  Early career           Workplace mentor                    AI Career Coach (C8)
  Leadership              Leadership growth coach            ⚠ NOT YET COVERED
  Career transition       Career pivot advisor               Life Chapter
                                                            Designer (C9)
                                                            — partial fit,
                                                            frames transitions
                                                            around life events
  Lifelong learning       Personal career dashboard          Smart Namecard (C3)
                                                            + Living Portfolio
                                                            — grows for as long
                                                            as the candidate
                                                            keeps verifying

  THE HONEST GAP
  ───────────────
  Three stages — Career Discovery, Skills Gap, and Leadership Growth —
  are not yet covered by any feature in our current build scope. This is
  disclosed intentionally, not hidden. If asked directly, the answer is:
  "These are real, named gaps in our current build. Career Path Navigator
  (an existing but currently unbuilt feature) would close the first two.
  Leadership Growth Coach is an identified roadmap item, not yet scoped."
  Do not overstate coverage. A judge or mentor who catches an unstated
  gap will trust the rest of the pitch less. A judge who hears us name
  our own gap unprompted will trust the rest of the pitch more.

  WHY EMPLOYER AND UNIVERSITY FEATURES SIT OUTSIDE THIS MAP
  ───────────────────────────────────────────────────────────
  The mentor's lifetime map describes ONE individual's journey. CREDO's
  Employer and University-side features are not additional journey
  stages — they are the infrastructure that makes each stage's data
  trustworthy and connected across the whole ecosystem. A Career OS is
  not complete if it only serves the individual; it has to connect the
  individual to the people who validate them (employers) and the
  institutions that shaped them (universities). This is CREDO's actual
  structural argument for why it is a system, not a tool — detailed in
  Section 04 below.


================================================================================
04 · THE ECOSYSTEM — END-TO-END CONNECTIVITY ACROSS ALL THREE ROLES
================================================================================

Nothing in this build may exist as an island. Every feature must be
reasoned about in terms of what it sends, what it receives, and who else
in the system depends on it. The system is not Candidate -> Employer ->
University as a one-way chain. It is a triangle. Every pair of sides has
a direct, named, bidirectional connection.

  BRIDGE A · "Verify Together"          Candidate <-> University
  ─────────────────────────────────────────────────────────────
  A university is not a passive dashboard viewer. Through Institutional
  Credential Issuer (U5), a university becomes a trusted issuer node
  inside the verification engine itself — capable of co-signing a
  student's credential directly into their ledger at the moment of
  verification, not after the fact.

  BRIDGE B · "Discover with Proof"       Candidate <-> Employer
  ─────────────────────────────────────────────────────────────
  Verified-skills discovery, Smart Namecard as the trust artifact,
  SimuHire as behavioral evidence, Smart Talent Matching as the
  discovery mechanism, and Talent Re-Engagement Pipeline keeping the
  relationship alive even after a "no."

  BRIDGE C · "Close the Loop"            Employer <-> University
  ─────────────────────────────────────────────────────────────
  Downstream: hire outcomes and Hire Intelligence data (E7) flow to
  Outcome Loop Tracker (U9), anonymised and aggregated.
  Upstream: employers can publish anonymised skill-demand signals back
  to Curriculum Gap Detector (U2) — completing the triangle in both
  directions, not just one.

  THE STANDING RULE FOR EVERY BUILD TASK
  ───────────────────────────────────────
  Before building any single feature, answer: which bridge does this
  belong to, and what does it send or receive from the other two sides?
  If a feature cannot answer that question, it is not yet ready to build
  — flag it and ask before proceeding.


================================================================================
05 · THE TRUST SCORE  (ASKC — the connective tissue underneath everything)
================================================================================

Every verification feature across all three sides ultimately feeds one
model: the ASKC Trust Score.

  A — Attitude      how someone responds under real pressure, verified
                    by SimuHire's behavioral simulation
  S — Skills        what someone can actually build, verified by a
                    field-adaptive agent (GitHub for CS/Engineering,
                    C2PA for Design, Document Agent variants for
                    Business/Humanities, institutional co-sign for
                    Medical and non-CS Engineering)
  K — Knowledge     what someone understands, verified by Document and
                    Credential agents
  C — Consistency   a small modifier (not a fourth pillar) capturing
                    verification depth, time span, and recency

  FAIRNESS IS NON-NEGOTIABLE. A candidate who has not yet verified a
  dimension is shown as "Not yet verified" in neutral grey — never as a
  red zero, never excluded punitively, never treated as equivalent to a
  poor verified score. Coverage and quality are always shown separately.
  No score may ever be presented as the sole, automated basis for
  rejecting a candidate.


================================================================================
06 · THE 13 FEATURES IN CURRENT BUILD SCOPE
================================================================================

  CANDIDATE  (4)
  ───────────────────────────────────────────────────────────────────
  C5  SimuHire                 Career OS stage: Interviews
  C3  Smart Namecard           Career OS stage: Self-awareness,
                                Employability, Lifelong learning
  C8  AI Career Coach          Career OS stage: Early career
  C9  Life Chapter Designer    Career OS stage: Career transition

  EMPLOYER  (3)
  ───────────────────────────────────────────────────────────────────
  E2  Smart Talent Matching           Bridge B — Candidate <-> Employer
  E6  Talent Re-Engagement Pipeline   Bridge B — keeps relationship alive
  E7  Hire Intelligence Dashboard     Bridge C — feeds University side

  UNIVERSITY  (3)
  ───────────────────────────────────────────────────────────────────
  U2  Curriculum Gap Detector         Bridge C — receives employer signal
  U5  Institutional Credential Issuer Bridge A — issues into candidate ledger
  U9  Outcome Loop Tracker            Bridge C — receives hire outcome data

  GENERAL / CROSS-CUTTING  (3)
  ───────────────────────────────────────────────────────────────────
  G1  Verified Career Fair Mode       All three bridges, physical layer
  G2  Verified Professional Network   Peer Attestation extends verification
                                      into soft-skill/teamwork claims no
                                      AI agent alone can check
  G3  Verification API / Widget       Proves CREDO is infrastructure, not
                                      a destination — same trust data
                                      travels to any external surface


================================================================================
07 · STANDING RULES FOR EVERY FUTURE BUILD TASK
================================================================================

  1. Before writing any UI, state in one sentence: which career stage
     this serves, and which bridge it belongs to.
  2. Never build a feature in isolation. If a feature produces data,
     name where that data goes next. If it consumes data, name where
     it came from.
  3. Never treat an empty or unverified state as a failure state in the
     UI. Reference the fairness principles in Section 05 every time you
     design a zero-state screen.
  4. Reuse existing shared components before creating new visual
     patterns. Consistency across all three role-apps is a product
     requirement, not a nice-to-have.
  5. If a task conflicts with anything in this document, or if a
     feature's Career OS stage or bridge is unclear, stop and ask before
     proceeding. Do not guess and continue.
  6. Maintain a professional, production-grade standard throughout —
     this is being built and evaluated as a real strategic component of
     a national-scale Career OS, not a weekend hackathon sketch.


================================================================================
END OF CHARTER
================================================================================
This file should be saved as CLAUDE.md at the project root and read in
full at the start of every future session before any task is executed.
================================================================================
