// expo-splash-screen shim. Fonts load via CSS on the web, so there is nothing to hold
// back — every call resolves immediately.
export async function preventAutoHideAsync() {
  return true;
}

export async function hideAsync() {
  return true;
}

export function setOptions() {}

export default { preventAutoHideAsync, hideAsync, setOptions };
