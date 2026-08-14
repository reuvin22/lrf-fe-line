import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { useAttendanceContext } from "../context/AttendanceContext";

const ONE_HOUR_MS = 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 48 * ONE_HOUR_MS;

const REMINDER_ROUTES = ["/", "/calendar", "/ocr", "/dashboard"];

const dismissKey = () => `closingReminderDismissed:${new Date().toDateString()}`;

function ClosingDeadlineReminder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { closingDay } = useAttendanceContext();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(dismissKey()) === "1"
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(tick);
  }, []);

  const deadline = useMemo(() => {
    if (!closingDay) return null;
    let candidate = new Date(now.getFullYear(), now.getMonth(), closingDay, 23, 59, 0, 0);
    if (candidate.getTime() <= now.getTime()) {
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, closingDay, 23, 59, 0, 0);
    }
    return candidate;
  }, [closingDay, now]);

  const inWindow = useMemo(() => {
    if (!deadline) return false;
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );
    const diffFromStart = deadline.getTime() - startOfToday.getTime();
    return diffFromStart > 0 && diffFromStart <= REMINDER_WINDOW_MS;
  }, [deadline, now]);

  const countdown = useMemo(() => {
    if (!deadline) return null;
    const diff = Math.max(0, deadline.getTime() - now.getTime());
    const hours = Math.floor(diff / ONE_HOUR_MS);
    const minutes = Math.floor((diff % ONE_HOUR_MS) / (60 * 1000));
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }, [deadline, now]);

  const targetMonthName = useMemo(() => {
    if (!deadline) return "";
    return deadline.toLocaleString("en-US", { month: "long" });
  }, [deadline]);

  const handleDismiss = () => {
    sessionStorage.setItem(dismissKey(), "1");
    setDismissed(true);
    navigate(location.pathname + location.search, { replace: true });
  };

  const handleGoToCalendar = () => {
    sessionStorage.setItem(dismissKey(), "1");
    setDismissed(true);
    navigate("/calendar");
  };

  const onAllowedRoute = REMINDER_ROUTES.includes(location.pathname);

  if (!onAllowedRoute || !inWindow || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center gap-2 text-orange-700 font-semibold">
            <Clock className="w-5 h-5" />
            <span>Closing Deadline Approaching</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-4 text-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500">Edit deadline for</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {targetMonthName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {closingDay} · 23:59
            </p>
          </div>

          <div className="bg-orange-50 rounded-xl py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">
              Time remaining
            </p>
            <p className="text-3xl font-bold text-orange-700 mt-1">
              {countdown}
            </p>
          </div>

          <p className="text-sm text-center">
            Please check for any missing entries.
          </p>
          <p className="text-xs text-gray-500 text-center">
            ※ If corrections are complete, you can dismiss this message.
          </p>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleGoToCalendar}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl cursor-pointer"
          >
            Check Input/Edit →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClosingDeadlineReminder;
