import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser } from "@/lib/types";
import { clearSession, getToken, getUser, setAccessToken, setSession } from "@/lib/auth";

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  hydrated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (state) => {
      state.token = getToken();
      state.user = getUser();
      state.hydrated = true;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string;
        user: AdminUser;
      }>,
    ) => {
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
      setSession(action.payload);
    },
    /** A refresh returned a new access token. The refresh token and user stay as they are. */
    tokenRefreshed: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      setAccessToken(action.payload);
    },
    /** Another tab refreshed or logged out: take whatever is in storage now. */
    syncFromStorage: (state) => {
      state.token = getToken();
      state.user = getUser();
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      clearSession();
    },
  },
});

export const { hydrateAuth, setCredentials, tokenRefreshed, syncFromStorage, logout } = authSlice.actions;
