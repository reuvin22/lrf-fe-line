import React from "react";
import { useAttendanceContext } from "../context/AttendanceContext";
import Loading from "../components/Loading";
import Attendance from "../pages/Attendance";
import PendingApproval from "../pages/PendingApproval";

function Main() {
  const { attendance, employee, attendanceLoading, isProfileIncomplete } = useAttendanceContext();

  if (attendanceLoading) return <Loading />;
  if (isProfileIncomplete) return <PendingApproval />;
  if (!attendance || !employee) return <Loading />;

  return <Attendance employee={employee} />;
}

export default Main;