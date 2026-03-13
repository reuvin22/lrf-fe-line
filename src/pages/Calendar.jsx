import { useState } from "react";
import { useNavigate } from "react-router-dom";
const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const statusData = {
  2: "done",
  3: "done",
  4: "done",
  5: "done",
  6: "done",
  9: "done",
  10: "done",
  11: "missing",
  12: "done",
  13: "done",
  16: "done",
  17: "done",
  18: "done",
  19: "done",
  20: "done",
  23: "done",
  24: "done",
  25: "done",
  26: "done",
  27: "done"
};

function Calendar() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date(2026, 2));
  const [selectedDay, setSelectedDay] = useState(13);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const handleClick = (day) => {
    if (!day) return;

    setSelectedDay(day);

    navigate(`/calendar/${year}/${month + 1}/${day}`);
  };

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let d = 1; d <= lastDate; d++) {
    calendarDays.push(d);
  }

  const renderStatus = (day) => {
    const status = statusData[day];

    if (status === "done") {
      return <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></span>;
    }

    if (status === "missing") {
      return <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1"></span>;
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
          <span className='font-semibold text-lg'>
            Input / Edit
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
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
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-3">
            {days.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center gap-y-4">

            {calendarDays.map((day, i) => {
              const isSelected = day === selectedDay;

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
        <div className="flex gap-6 text-xs mt-4 text-gray-600">

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Entered
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            Missing
          </div>

          <div className="flex items-center gap-1">
            🔒 Locked
          </div>

        </div>

      </div>
    </div>
  );
}

export default Calendar;