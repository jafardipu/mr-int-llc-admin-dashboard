import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser } from "@/lib/types";
import { clearSession, getToken, getUser, setSession } from "@/lib/auth";

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
    logout: (state) => {
      state.token = null;
      state.user = null;
      clearSession();
    },
  },
});

export const { hydrateAuth, setCredentials, logout } = authSlice.actions;
