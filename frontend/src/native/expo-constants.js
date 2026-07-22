// expo-constants shim. Only `expoConfig.hostUri` is read (to find the dev machine's LAN
// address from a phone); on the web the page origin already is the host, so it's null
// and lib/config.ts falls back to its default API base URL.
const Constants = {
  expoConfig: { hostUri: null, name: 'CREDO', slug: 'credo' },
  executionEnvironment: 'bare',
  platform: { web: {} },
};

export default Constants;
