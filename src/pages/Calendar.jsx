import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceApi } from "../api/Api";
import { useAttendanceContext } from "../context/AttendanceContext";

const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Calendar() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date(2026, 2));
  const [calendar, setCalendar] = useState([]);

  // ✅ DRY: store today's values once
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // ✅ start with no selected day (so today is auto-highlighted)
  const [selectedDay, setSelectedDay] = useState(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const cleanDate = (dateString) => dateString.split("T")[0];

  // ✅ DRY: reusable date formatter
  const formatDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const { setAttendanceCalendar } = useAttendanceContext();

  // Fetch attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceApi.getAll();

        const filtered = res.data.data
          .map((item) => ({
            ...item,
            work_date: item.work_date.split("T")[0],
          }))
          .filter((item) => {
            const itemDate = new Date(item.work_date);
            return (
              itemDate.getFullYear() === year &&
              itemDate.getMonth() === month
            );
          });

        setCalendar(filtered);
      } catch (error) {
        console.error("Error fetching calendar:", error);
      }
    };

    fetchData();
  }, [year, month]);

  const handleClick = (day) => {
    if (!day) return;

    setSelectedDay(day);

    const formattedDate = formatDate(year, month, day);

    const filtered = calendar.filter(
      (item) => cleanDate(item.work_date) === formattedDate
    );

    setAttendanceCalendar(filtered);
    navigate(`/calendar/detail`);
  };

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let d = 1; d <= lastDate; d++) {
    calendarDays.push(d);
  }

  const getStatusForDay = (day) => {
    const formattedDate = formatDate(year, month, day);

    const found = calendar.find(
      (item) => cleanDate(item.work_date) === formattedDate
    );

    if (!found) return "missing";

    const hasSegments = found.segments && found.segments.length > 0;

    if (
      (found.status === "WORKING" || found.status === "END_OF_DAY") &&
      hasSegments
    ) {
      return "done";
    }

    return "missing";
  };

  const renderStatus = (day) => {
    const status = getStatusForDay(day);

    if (status === "done") {
      return (
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></span>
      );
    }

    if (status === "missing") {
      return (
        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1"></span>
      );
    }

    if (status === "locked") {
      return <span className="text-xs mt-1">🔒</span>;
    }

    return null;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-lg">Input / Edit</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-3xl cursor-pointer">
            ‹
          </button>

          <h2 className="font-semibold text-gray-800">
            {date.toLocaleString("en-US", { month: "long" })} {year}
          </h2>

          <button onClick={nextMonth} className="text-3xl cursor-pointer">
            ›
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-3">
            {days.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-y-4">
            {calendarDays.map((day, i) => {
              // ✅ check if this day is today
              const isToday =
                day &&
                day === todayDay &&
                month === todayMonth &&
                year === todayYear;

              // ✅ selected OR default today
              const isSelected =
                day &&
                (day === selectedDay || (!selectedDay && isToday));

              return (
                <button
                  key={i}
                  onClick={() => handleClick(day)}
                  className={`flex flex-col items-center justify-center h-10 w-10 mx-auto rounded-lg cursor-pointer
                  ${isSelected ? "border-2 border-blue-500" : ""}`}
                >
                  <span
                    className={`${
                      day ? "text-gray-800" : "text-gray-300"
                    }`}
                  >
                    {day || ""}
                  </span>

                  {day && renderStatus(day)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-xs mt-4 text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Entered
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            Missing
          </div>

          <div className="flex items-center gap-1">🔒 Locked</div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;