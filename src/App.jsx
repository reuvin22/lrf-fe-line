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
import SubContractor from "./pages/SubContractor";
import { useAttendanceContext } from "./context/AttendanceContext";
import { useLiff } from "./context/LiffContext";
import Loading from "./components/Loading";
import PendingApproval from "./pages/PendingApproval";
import { ToastContainer } from "react-toastify";

function App() {
  const { attendance, employee, attendanceLoading, isProfileIncomplete } = useAttendanceContext();
  const { loading: liffLoading, loggedIn: liffLoggedIn } = useLiff();

  if (liffLoading || !liffLoggedIn) return <Loading />;
  if (attendanceLoading) return <Loading />;
  // if (isProfileIncomplete) return <PendingApproval />;
  if (!attendance || !employee) return <Loading />;
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
          <Route
            path="/subcontractor"
            element={<SubContractor />}
          />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </Router>
  );
}

export default App;