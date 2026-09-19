import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import liff from "@line/liff";
import environment from "./environment";
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

// Once logged in, restore whatever route the user was actually headed to
// (e.g. /calendar from a LINE rich menu tap) — set by LiffContext right
// before it sent the user through LINE's login flow. This doesn't trust
// LIFF/LINE to preserve the path through that redirect on its own.
function RestoreIntendedRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const intended = sessionStorage.getItem("liff_intended_path");
    if (!intended) return;

    sessionStorage.removeItem("liff_intended_path");
    if (intended !== location.pathname + location.search) {
      navigate(intended, { replace: true });
    }
    // Run once on mount — this is a one-time redirect after login, not a
    // reaction to route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// Safety net for when LINE hands back a path our router doesn't recognize
// (e.g. a garbled /{liffId}-ish path) and RestoreIntendedRoute above has
// nothing to recover to. Rather than leaving a blank screen, ask the user
// to reopen the app and close the LIFF window for them on confirmation.
function RouteFallback() {
  const handleContinue = () => {
    if (environment.VITE_LIFF_ENABLED) {
      liff.closeWindow();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-gray-700">
        Something went wrong opening this page. Please reopen the app from LINE to continue.
      </p>
      <button
        onClick={handleContinue}
        className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold cursor-pointer"
      >
        Continue
      </button>
    </div>
  );
}

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
      <RestoreIntendedRoute />
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
        <Route path="*" element={<RouteFallback />} />
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