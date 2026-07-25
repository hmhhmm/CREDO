// Rule-based analysis of a spoken practice answer's transcript — three independent checks,
// each a real computation over the actual words (not a fixed script per question, and not a
// fake AI score). There's no LLM in this build, so this is explicitly a heuristic reading of
// structure/length/filler density, not a judgment of whether the content itself was good.
export interface AnswerAnalysisResult {
  label: string;
  pass: boolean;
  detail: string;
}

const FILLER_WORDS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally"];

// STAR-shaped answers tend to use these signal words for each phase; presence of at least
// one from two-plus phases is a reasonable proxy for "this had a structure," not proof of it.
const SITUATION_WORDS = ["when", "during", "at the time", "situation", "project", "team", "role"];
const ACTION_WORDS = ["i decided", "i built", "i started", "i asked", "i created", "i led", "i reached out", "i wrote", "so i"];
const RESULT_WORDS = ["result", "outcome", "ended up", "eventually", "in the end", "afterwards", "learned", "improved"];

function countOccurrences(text: string, phrases: string[]): number {
  return phrases.reduce((sum, phrase) => sum + (text.includes(phrase) ? 1 : 0), 0);
}

export function analyzeInterviewAnswer(transcript: string): AnswerAnalysisResult[] {
  const text = transcript.trim().toLowerCase();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;

  const depthResult: AnswerAnalysisResult =
    wordCount === 0
      ? { label: "Answer length", pass: false, detail: "No answer captured yet." }
      : wordCount < 25
        ? { label: "Answer length", pass: false, detail: `${wordCount} words — likely too short to cover a full example. Aim for 45–90 seconds of speaking.` }
        : wordCount > 220
          ? { label: "Answer length", pass: false, detail: `${wordCount} words — probably running long. Tighten it toward the outcome.` }
          : { label: "Answer length", pass: true, detail: `${wordCount} words — a reasonable length for one example.` };

  const phasesHit = [
    countOccurrences(text, SITUATION_WORDS) > 0,
    countOccurrences(text, ACTION_WORDS) > 0,
    countOccurrences(text, RESULT_WORDS) > 0,
  ].filter(Boolean).length;
  const structureResult: AnswerAnalysisResult =
    wordCount === 0
      ? { label: "Structure", pass: false, detail: "Nothing to check yet." }
      : phasesHit >= 2
        ? { label: "Structure", pass: true, detail: "Sounds like it covers a situation, an action, and an outcome." }
        : { label: "Structure", pass: false, detail: "Hard to tell if this has a clear situation → action → result — try naming what happened, what you did, then what changed." };

  const fillerCount = FILLER_WORDS.reduce((sum, w) => sum + (text.split(w).length - 1), 0);
  const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
  const fillerResult: AnswerAnalysisResult =
    wordCount === 0
      ? { label: "Filler words", pass: false, detail: "Nothing to check yet." }
      : fillerRate > 0.06
        ? { label: "Filler words", pass: false, detail: `${fillerCount} filler word${fillerCount === 1 ? "" : "s"} caught (like "um", "like", "sort of") — a bit high for this length.` }
        : { label: "Filler words", pass: true, detail: fillerCount === 0 ? "None caught — clean delivery." : `Only ${fillerCount} caught — not distracting.` };

  return [depthResult, structureResult, fillerResult];
}
