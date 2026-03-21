import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./layout/Main";
import Manual from "./pages/Manual";
import Calendar from "./pages/Calendar";
import OcrUpload from "./pages/OcrUpload";
import AppLayout from "./layout/AppLayout";
import CalendarDetail from "./pages/CalendarDetail";
import Dashboard from "./pages/Dashboard";

import { initLiff } from "./api/Liff";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initLiff();
      setLoading(false);
    };

    initialize();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Main />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/:year/:month/:day" element={<CalendarDetail />} />
          <Route path="/ocr" element={<OcrUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;