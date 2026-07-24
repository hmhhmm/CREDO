// E-Decision default message templates — always editable before sending, never forced
// verbatim. Shared between PipelineScreen (where the decision is actually made) and
// anywhere else that needs to preview what a default message would say.
export function defaultAcceptMessage(name: string): string {
  const firstName = name.split(" ")[0];
  return `Hi ${firstName} — great news! We'd like to move forward and extend you an offer. We'll follow up shortly with next steps.`;
}

export function defaultRejectMessage(name: string): string {
  const firstName = name.split(" ")[0];
  return `Hi ${firstName} — thank you for the time you put into interviewing with us. After careful consideration, we've decided to move forward with other candidates. We wish you the best in your search.`;
}
