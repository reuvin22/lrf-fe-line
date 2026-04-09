import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceApi, transportationExpensesApi } from "../api/Api";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useTransportationExpensesContext } from "../context/TransportationExpensesContext";

const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Calendar() {
  const { setAttendance, setAttendanceCalendar, setSelectedDate } = useAttendanceContext();

  const navigate = useNavigate();
  const { setTransportationExpenses } = useTransportationExpensesContext();

  const today = new Date();
  const [date, setDate] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [calendar, setCalendar] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const formatDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await attendanceApi.getAll({ year, month: month + 1 });

        const data = (res.data.data || []).map((item) => ({
          ...item,
          work_date: item.work_date.split("T")[0],
        }));
        console.log(data)
        setAttendanceCalendar(data);
        setCalendar(data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, [year, month]);

  // ✅ CLICK DAY
  const handleClick = async (day) => {
    if (!day) return;

    setSelectedDay(day);

    const formatted = formatDate(year, month, day);

    // ✅ SAVE SELECTED DATE (IMPORTANT FIX)
    setSelectedDate(formatted);

    const selectedAttendance = calendar.find(
      (item) => item.work_date === formatted
    );
    setAttendance(selectedAttendance || null);
    try {
      const allExpensesResponses = await Promise.all(
        filtered.map((att) =>
          transportationExpensesApi
            .getAll({ attendance_id: att.attendance_id || att.id })
            .then((res) => res?.data?.data || [])
            .catch((err) => {
              console.error(
                "Error fetching transport for attendance:",
                att.attendance_id,
                err
              );
              return [];
            })
        )
      );

      setTransportationExpenses(allExpensesResponses.flat());
    } catch (err) {
      console.error("Error fetching transportation expenses:", err);
      setTransportationExpenses([]);
    }

    navigate("/calendar/detail");
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= lastDate; d++) calendarDays.push(d);

  const getStatusForDay = (day) => {
    const formattedDate = formatDate(year, month, day);

    const found = calendar.find(
      (item) => item.work_date === formattedDate
    );

    if (!found) return "missing";
    if (found.status === "LOCKED") return "locked";
    if (
      (found.status === "WORKING" || found.status === "END_OF_DAY") &&
      found.segments?.length > 0
    )
      return "done";

    return "missing";
  };

  const renderStatus = (day) => {
    const status = getStatusForDay(day);
    if (status === "done")
      return <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></span>;
    if (status === "missing")
      return <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1"></span>;
    if (status === "locked") return <span className="text-xs mt-1">🔒</span>;
    return null;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Input / Edit</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-3xl cursor-pointer">‹</button>
          <h2 className="font-semibold text-gray-800">
            {date.toLocaleString("en-US", { month: "long" })} {year}
          </h2>
          <button onClick={nextMonth} className="text-3xl cursor-pointer">›</button>
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
              const isToday =
                day &&
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const isSelected =
                day && (day === selectedDay || (!selectedDay && isToday));

              return (
                <button
                  key={i}
                  onClick={() => handleClick(day)}
                  className={`flex flex-col items-center justify-center h-10 w-10 mx-auto rounded-lg cursor-pointer
                    ${isSelected ? "border-2 border-blue-500" : ""}`}
                >
                  <span className={`${day ? "text-gray-800" : "text-gray-300"}`}>
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
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Entered
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span> Missing
          </div>
          <div className="flex items-center gap-1">🔒 Locked</div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;