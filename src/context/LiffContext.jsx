import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";
import environment from "../environment";

const LiffContext = createContext(null);

export const LiffProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // LINE login is disabled via environment.VITE_LIFF_ENABLED.
    // When disabled, inject a mock profile so the rest of the app can run
    // without going through the LIFF login flow.
    if (!environment.VITE_LIFF_ENABLED) {
      setProfile({
        userId: environment.VITE_LIFF_MOCK_USER_ID,
        displayName: environment.VITE_LIFF_MOCK_DISPLAY_NAME,
      });
      setLoggedIn(true);
      setLoading(false);
      return;
    }

    // After LINE's login redirect lands back here, the URL carries
    // ?code=...&state=...&liffClientId=...&liffRedirectUri=... — strip those
    // so the address bar doesn't get stuck showing the raw OAuth callback.
    const cleanCallbackParams = () => {
      const url = new URL(window.location.href);
      let changed = false;
      ["code", "state", "liffClientId", "liffRedirectUri"].forEach((param) => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          changed = true;
        }
      });
      if (changed) {
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    };

    const init = async () => {
      try {
        setLoading(true);
        await liff.init({ liffId: environment.VITE_LIFF_KEY });

        if (!liff.isLoggedIn()) {
          // Don't rely on LIFF/LINE preserving the deep-linked path (e.g.
          // /calendar from a rich menu tap) through the OAuth round-trip —
          // remember it ourselves so the app can restore it once logged in,
          // regardless of what URL LINE actually redirects back to.
          sessionStorage.setItem(
            "liff_intended_path",
            window.location.pathname + window.location.search
          );
          liff.login();
          return;
        }

        cleanCallbackParams();

        setLoggedIn(true);
        const userProfile = await liff.getProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("LIFF init error:", err);
        cleanCallbackParams();
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const logout = () => {
    if (!environment.VITE_LIFF_ENABLED) {
      window.location.reload();
      return;
    }
    liff.logout();
    window.location.reload();
  };

  return (
    <LiffContext.Provider value={{ profile, loggedIn, loading, error, logout }}>
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => useContext(LiffContext);
