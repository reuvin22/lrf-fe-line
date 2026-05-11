import React, { createContext, useContext, useEffect, useState } from "react";
// import liff from "@line/liff";
// import environment from "../environment";

const LiffContext = createContext();

export const LiffProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const init = async () => {
  //     try {
  //       await liff.init({ liffId: environment.VITE_LIFF_KEY });
  //       const loginStatus = liff.isLoggedIn();
  //       setLoggedIn(loginStatus);
  //       if (loginStatus) {
  //         const userProfile = await liff.getProfile();
  //         setProfile(userProfile);
  //       } else {
  //         liff.login();
  //       }
  //     } catch (err) {
  //       console.error("LIFF init error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   init();
  // }, []);

  return (
    <LiffContext.Provider value={{ profile, loggedIn, loading }}>
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => useContext(LiffContext);
