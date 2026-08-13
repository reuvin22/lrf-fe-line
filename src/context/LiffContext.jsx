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

    const init = async () => {
      try {
        setLoading(true);
        // Capture the route the user was actually headed to (e.g. /ocr) before
        // liff.init()/login() can touch the URL, and hand it back as the
        // redirectUri so LINE's login flow returns here instead of dropping
        // the user on the default route.
        const intendedUrl = window.location.href;
        await liff.init({ liffId: environment.VITE_LIFF_KEY });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: intendedUrl });
          return;
        }

        setLoggedIn(true);
        const userProfile = await liff.getProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("LIFF init error:", err);
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
