import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "credo_access_token";
const REFRESH_KEY = "credo_refresh_token";

export const tokenStore = {
  async getAccessToken() {
    return AsyncStorage.getItem(ACCESS_KEY);
  },
  async getRefreshToken() {
    return AsyncStorage.getItem(REFRESH_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, accessToken],
      [REFRESH_KEY, refreshToken],
    ]);
  },
  async clear() {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  },
};
