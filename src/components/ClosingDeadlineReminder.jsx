import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { systemSettingsApi } from "../api/Api";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function ClosingDeadlineReminder() {
  const navigate = useNavigate();
  const [closingDay, setClosingDay] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await systemSettingsApi.getAll();
        const inner = res.data?.data;
        const settings = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [];
        const closingEntry = settings.find((s) => s?.key === "closing_day");
        const day = Number(closingEntry?.value);
        setClosingDay(Number.isFinite(day) && day >= 1 && day <= 31 ? day : null);
      } catch (error) {
        console.error("Error fetching system settings:", error);
      }
    };

    fetchSettings();
  }, []);

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
    const diff = deadline.getTime() - now.getTime();
    const result = diff > 0 && diff <= ONE_DAY_MS;
    console.log("[ClosingDeadlineReminder]", {
      closingDay,
      deadline: deadline.toString(),
      now: now.toString(),
      hoursRemaining: (diff / 1000 / 60 / 60).toFixed(2),
      inWindow: result,
    });
    return result;
  }, [deadline, now, closingDay]);

  const targetMonthName = useMemo(() => {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return prevMonth.toLocaleString("en-US", { month: "long" });
  }, [now]);

  useEffect(() => {
    if (!inWindow) return;
    const key = `closingReminderDismissed:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key) === "1") {
      setDismissed(true);
    }
  }, [inWindow]);

  const handleDismiss = () => {
    const key = `closingReminderDismissed:${new Date().toDateString()}`;
    sessionStorage.setItem(key, "1");
    setDismissed(true);
  };

  if (!inWindow || dismissed) return null;

  return (
    <div className="max-w-md mx-auto px-4 pt-3">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
            <Clock className="w-4 h-4" />
            <span>Closing Deadline Approaching</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2 text-sm text-gray-700">
          <p>
            Edit deadline for <span className="font-semibold">{targetMonthName}</span>:{" "}
            <span className="font-semibold">{closingDay} 23:59</span>
          </p>
          <p>Please check for any missing entries.</p>
          <p className="text-xs text-gray-500">
            ※ If corrections are complete, please ignore this message.
          </p>
        </div>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-xl cursor-pointer"
          >
            Check Input/Edit →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClosingDeadlineReminder;
