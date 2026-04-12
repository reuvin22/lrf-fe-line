import React from "react";
import { useAttendanceContext } from "../context/AttendanceContext";
import Loading from "../components/Loading";
import Attendance from "../pages/Attendance";

function Main() {
  const { attendance, employee, attendanceLoading } = useAttendanceContext();

  if (attendanceLoading || !attendance || !employee) return <Loading />;

  return <Attendance employee={employee} />;
}

export default Main;