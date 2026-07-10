import { create } from "zustand";
import type { AuthResponse, CurrentUserResponse } from "../services/api/contracts";
import { login as loginRequest, register as registerRequest } from "../services/api/auth";
import { getCurrentUser } from "../services/api/users";
import { clearStoredTokens, getStoredTokens, saveTokens } from "../services/api/tokenStorage";
import { registerUnauthorizedHandler, setAccessToken } from "../services/api/session";

type AuthStatus = "booting" | "signedOut" | "signedIn";

type SignInCredentials = {
  email: string;
  password: string;
};

type RegisterPayload = Parameters<typeof registerRequest>[0];

type AuthState = {
  status: AuthStatus;
  user: CurrentUserResponse | null;
  role: CurrentUserResponse["role"] | null;
  bootstrap: () => Promise<void>;
  signInWithPassword: (credentials: SignInCredentials) => Promise<void>;
  registerAccount: (payload: RegisterPayload) => Promise<void>;
  hydrateFromAuthResponse: (tokens: AuthResponse) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "booting",
  user: null,
  role: null,
  bootstrap: async () => {
    const storedTokens = await getStoredTokens();

    if (!storedTokens) {
      set({ status: "signedOut", user: null, role: null });
      return;
    }

    setAccessToken(storedTokens.accessToken);

    try {
      const user = await getCurrentUser();
      set({
        status: "signedIn",
        user,
        role: user.role,
      });
    } catch {
      await get().signOut();
    }
  },
  signInWithPassword: async (credentials) => {
    const tokens = await loginRequest(credentials);
    await get().hydrateFromAuthResponse(tokens);
  },
  registerAccount: async (payload) => {
    await registerRequest(payload);
  },
  hydrateFromAuthResponse: async (tokens) => {
    await saveTokens(tokens);
    setAccessToken(tokens.accessToken);

    const user = await getCurrentUser();

    set({
      status: "signedIn",
      user,
      role: user.role,
    });
  },
  refreshProfile: async () => {
    const user = await getCurrentUser();
    set({
      user,
      role: user.role,
      status: "signedIn",
    });
  },
  signOut: async () => {
    await clearStoredTokens();
    setAccessToken(null);
    set({
      status: "signedOut",
      user: null,
      role: null,
    });
  },
}));

registerUnauthorizedHandler(async () => {
  await useAuthStore.getState().signOut();
});
