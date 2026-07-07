import { Platform } from "react-native";
import Constants from "expo-constants";

// On web (or the iOS Simulator) "localhost" reaches the Mac directly. On a physical
// device via Expo Go, "localhost" means the phone itself — Metro's own LAN host (the
// same address the Expo Go app used to load this bundle) is the only one guaranteed
// reachable from the phone, so we derive the backend URL from it instead of hardcoding.
function resolveApiBaseUrl(): string {
  const fallback = "http://localhost:8000";

  if (Platform.OS === "web") return fallback;

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.23:8081"
  if (!hostUri) return fallback;

  const host = hostUri.split(":")[0];
  return `http://${host}:8000`;
}

export const API_BASE_URL = resolveApiBaseUrl();

// Mock mode: when true, every API call returns rich local mock data and NEVER touches the
// backend. Lets the whole app (namecard, portfolio, verify, SimuHire, discover) demo fully
// offline. Flip to false to go back to the real FastAPI backend.
export const MOCK_MODE = true;
