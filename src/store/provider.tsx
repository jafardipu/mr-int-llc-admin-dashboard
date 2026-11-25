"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { getToken, REFRESH_KEY, TOKEN_KEY, USER_KEY } from "@/lib/auth";
import { ensureFreshToken } from "./authProxy";
import { hydrateAuth, logout, syncFromStorage } from "./authSlice";
import { store } from "./store";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());
    // App start: refresh now if the access token has expired or expires within 24 hours.
    void ensureFreshToken(store.dispatch, store.getState().auth.token);

    // Another tab refreshed the token or logged out: follow it instead of refreshing again or
    // keeping a cleared token.
    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== TOKEN_KEY && event.key !== REFRESH_KEY && event.key !== USER_KEY) return;
      if (getToken()) store.dispatch(syncFromStorage());
      else store.dispatch(logout());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return children;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
