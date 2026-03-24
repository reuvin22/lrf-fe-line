import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./layout/Main";
import Manual from "./pages/Manual";
import Calendar from "./pages/Calendar";
import OcrUpload from "./pages/OcrUpload";
import AppLayout from "./layout/AppLayout";
import CalendarDetail from "./pages/CalendarDetail";
import Dashboard from "./pages/Dashboard";
import TransportationExpense from "./pages/TransportationExpenses";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Main />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/detail" element={<CalendarDetail />} />
          <Route path="/ocr" element={<OcrUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/transportation-expenses"
            element={<TransportationExpense />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;