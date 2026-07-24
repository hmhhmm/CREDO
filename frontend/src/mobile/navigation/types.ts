// Shared navigation escape-hatch type: reaching a sibling tab from a screen nested inside
// its own stack (navigation.getParent()) needs a minimal navigate() shape, since the
// shim's real NavigationProp type doesn't parameterize per-parent. Used wherever a screen
// jumps out of its own stack — Home's quick actions, Card's cross-tab links, Settings'
// links to Card/Grow.
export type ParentNav = { navigate: (name: string, params?: object) => void } | undefined;
