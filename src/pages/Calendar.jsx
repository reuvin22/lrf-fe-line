import { useState } from "react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const [date, setDate] = useState(new Date(2026, 1));

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const handleClick = (day) => {
    if (!day) return;
    console.log(`${year}-${month + 1}-${day}`);
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
      return <span className="text-green-500 text-sm">✓</span>;
    }

    if (status === "missing") {
      return <span className="text-red-500 text-sm">–</span>;
    }

    if (status === "locked") {
      return <span className="text-yellow-500 text-sm">🔒</span>;
    }

    return null;
  };

  return (
    <div className="max-w-md mx-auto">

      <div className="bg-green-600 text-white p-6">
        <h1 className="text-xl font-semibold">Input / Edit</h1>
        <p className="text-sm opacity-90">
          Check and edit past attendance data
        </p>
      </div>

      <div className="max-w-md mx-auto mt-6">

        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={prevMonth} className="text-xl cursor-pointer">
            ‹
          </button>

          <h2 className="text-lg font-semibold">
            {date.toLocaleString("en-US", { month: "long" })} {year}
          </h2>

          <button onClick={nextMonth} className="text-xl cursor-pointer">
            ›
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-4">

          <div className="grid grid-cols-7 text-center text-gray-500 text-sm mb-2">
            {days.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-y-3">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => handleClick(day)}
                className="flex flex-col items-center justify-center h-12 hover:bg-gray-100 rounded-lg"
              >
                <span>{day}</span>
                {day && renderStatus(day)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm mt-4 text-gray-600 px-2">
          <div className="flex items-center gap-1">
            <span className="text-green-500">●</span> Completed
          </div>

          <div className="flex items-center gap-1">
            <span className="text-red-500">●</span> Missing
          </div>

          <div className="flex items-center gap-1">
            <span>🔒</span> Locked
          </div>
        </div>

      </div>
    </div>
  );
}

export default Calendar;