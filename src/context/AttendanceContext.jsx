import React, { createContext, useContext, useState } from "react";

export const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceCalendar, setAttendanceCalendar] = useState(null)
  return (
    <AttendanceContext.Provider
      value={{
        attendance,
        setAttendance,
        attendanceLoading,
        setAttendanceLoading,
        attendanceError,
        setAttendanceError,
        attendanceCalendar,
        setAttendanceCalendar
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendanceContext = () => useContext(AttendanceContext);