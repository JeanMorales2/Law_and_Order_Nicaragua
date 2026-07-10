import * as SecureStore from "expo-secure-store";
import type { AuthResponse } from "./contracts";

const ACCESS_TOKEN_KEY = "legalnic.accessToken";
const ACCESS_TOKEN_EXPIRES_KEY = "legalnic.accessTokenExpiresAtUtc";
const REFRESH_TOKEN_KEY = "legalnic.refreshToken";
const REFRESH_TOKEN_EXPIRES_KEY = "legalnic.refreshTokenExpiresAtUtc";

export type StoredTokens = AuthResponse;

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, accessTokenExpiresAtUtc, refreshToken, refreshTokenExpiresAtUtc] =
    await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_EXPIRES_KEY),
    ]);

  if (!accessToken || !refreshToken || !accessTokenExpiresAtUtc || !refreshTokenExpiresAtUtc) {
    return null;
  }

  return {
    accessToken,
    accessTokenExpiresAtUtc,
    refreshToken,
    refreshTokenExpiresAtUtc,
  };
}

export async function saveTokens(tokens: StoredTokens) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_KEY, tokens.accessTokenExpiresAtUtc),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_EXPIRES_KEY, tokens.refreshTokenExpiresAtUtc),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_EXPIRES_KEY),
  ]);
}
