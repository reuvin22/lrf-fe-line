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
    const init = async () => {
      try {
        setLoading(true);
        await liff.init({ liffId: environment.VITE_LIFF_KEY });

        if (!liff.isLoggedIn()) {
          liff.login();
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
