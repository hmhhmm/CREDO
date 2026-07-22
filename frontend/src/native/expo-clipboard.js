// expo-clipboard shim over the async Clipboard API, with a execCommand fallback for
// non-secure origins (plain http://localhost dev servers on some browsers).
export async function setStringAsync(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

export async function getStringAsync() {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

export default { setStringAsync, getStringAsync };
