import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Main from "./layout/Main";
import Manual from "./pages/Manual";
import Calendar from "./pages/Calendar";
import OcrUpload from "./pages/OcrUpload";
import OcrReview from "./pages/OcrReview";
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
  const { loading: liffLoading, loggedIn: liffLoggedIn, error: liffError } = useLiff();

  if (liffError && !liffLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-600">Something went wrong signing you in.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (liffLoading || !liffLoggedIn) return <Loading />;
  if (attendanceLoading) return <Loading />;
  if (isProfileIncomplete) return <PendingApproval />;
  if (!attendance || !employee) return <Loading />;
  return (
    <ErrorBoundary>
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Main />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/detail" element={<CalendarDetail />} />
          <Route path="/ocr" element={<OcrUpload />} />
          <Route path="/review" element={<OcrReview />} />
          <Route path="/ocr/:id/review" element={<OcrReview />} />
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
    </ErrorBoundary>
  );
}

export default App;