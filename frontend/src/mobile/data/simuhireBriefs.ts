import type { SimulationType } from "../lib/api";

// Scenario framing shown on the setup screen and in the chat screen's collapsible
// brief. The live scenario itself comes from the backend (opening_message onwards);
// these set the scene per simulation type before the session starts.
export interface ScenarioBrief {
  situation: string;
  access: string[];
  constraints: string[];
}

export const SCENARIO_BRIEFS: Record<SimulationType, ScenarioBrief> = {
  technical: {
    situation:
      "You are a junior software engineer, 3 months into your first job at a startup. A bug report has come in: users are saying the Submit button on the contact form stops responding after they fill it in — they click it, nothing happens and no error message appears. It's affecting roughly 20% of form submissions. Your tech lead just entered a 2-hour all-hands meeting.",
    access: [
      "Browser console logs from affected users",
      "Backend API server logs (last 2 hours)",
      "Full codebase read access",
      "Staging environment for testing",
    ],
    constraints: [
      "Cannot deploy to production without tech lead approval",
      "No direct database access — use the admin panel only",
      "Tech lead reachable on Slack with ~15 min response time",
    ],
  },
  business: {
    situation:
      "You are an account executive at a B2B SaaS company. Your largest client has just emailed that a promised feature slipped from this quarter's roadmap, and they are threatening to pause their renewal. Your product manager disagrees with the client's reading of the commitment, and your VP wants a recommendation by end of day.",
    access: [
      "The original proposal and email thread with the client",
      "Current product roadmap and release notes",
      "Renewal contract terms and pricing history",
      "30 minutes of the product manager's time",
    ],
    constraints: [
      "Cannot promise dates that engineering has not committed to",
      "Discounts above 10% require VP approval",
      "The client's decision meeting is in 48 hours",
    ],
  },
  general: {
    situation:
      "You are coordinating a cross-functional launch involving design, engineering and marketing. Two days before the announcement, engineering flags a blocking defect, marketing has already scheduled the press embargo, and design wants to pull a headline feature that isn't polished. Everyone is looking to you for the call.",
    access: [
      "The launch checklist and current defect report",
      "Direct channels to each team lead",
      "The announcement draft and press timeline",
      "Authority to move the date by up to one week",
    ],
    constraints: [
      "The press embargo can be moved once, at most",
      "Engineering cannot estimate the fix before tomorrow",
      "Leadership reviews your recommendation before it ships",
    ],
  },
};
