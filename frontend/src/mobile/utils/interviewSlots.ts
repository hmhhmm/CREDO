// Real, parseable interview scheduling — no native date-picker dependency is installed in
// this project, and adding one is a platform-specific undertaking (iOS/Android linking)
// out of scope for this pass. A short list of concrete upcoming slots gets the same
// outcome (a real ISO datetime, not free text) with zero new dependencies.
const SLOT_TIMES = [{ hour: 10, label: "10:00 AM" }, { hour: 14, label: "2:00 PM" }] as const;
const SLOT_DAYS_AHEAD = [1, 2, 3, 5, 7] as const;

export interface InterviewSlot {
  iso: string;
  label: string; // e.g. "Tomorrow, 10:00 AM" or "Mon, Aug 3, 2:00 PM"
}

function dayLabel(date: Date, daysAhead: number): string {
  if (daysAhead === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function getUpcomingInterviewSlots(now: Date = new Date()): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  for (const daysAhead of SLOT_DAYS_AHEAD) {
    for (const { hour, label: timeLabel } of SLOT_TIMES) {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      d.setHours(hour, 0, 0, 0);
      slots.push({ iso: d.toISOString(), label: `${dayLabel(d, daysAhead)}, ${timeLabel}` });
    }
  }
  return slots;
}

export function formatInterviewDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // defensive: pre-migration free-text values
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(iso: string, reference: Date = new Date()): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}
