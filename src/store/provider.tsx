"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { hydrateAuth } from "./authSlice";
import { store } from "./store";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());
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
