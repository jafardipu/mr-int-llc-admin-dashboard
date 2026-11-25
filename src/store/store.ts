import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { api } from "./api";
import { authSlice, logout } from "./authSlice";

// Any logout (sign-out button, expired session, another tab) also drops every cached response, so
// no customer or order data stays in memory for the next login.
const logoutListener = createListenerMiddleware();
logoutListener.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(logoutListener.middleware).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
