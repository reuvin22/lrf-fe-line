import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";

const LiffContext = createContext();

export const LiffProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const init = async () => {
    try {
      await initLiff();

      const loginStatus = isLoggedIn();
      setLoggedIn(loginStatus);

      if (loginStatus) {
        const userProfile = await getProfile();
        setProfile(userProfile);
      }
    } catch (err) {
      console.error("LIFF init error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const value = {
    liff,
    profile,
    loggedIn,
    loading,
  };

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => {
  return useContext(LiffContext);
};