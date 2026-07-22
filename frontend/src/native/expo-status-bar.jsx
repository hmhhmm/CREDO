// expo-status-bar shim — there is no OS status bar to tint in a browser tab. Kept as a
// no-op component so App-level code can stay identical to the native entry point.
export function StatusBar() {
  return null;
}

export default { StatusBar };
