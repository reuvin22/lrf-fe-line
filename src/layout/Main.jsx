import React from "react";
import Layout from "./Layout";
import { useAttendanceContext } from "../context/AttendanceContext";
import Loading from "../components/Loading";

function Main() {
  const { attendance, employee, attendanceLoading } = useAttendanceContext();

  if (attendanceLoading || !attendance || !employee) return <Loading />;

  return <Layout employee={employee} />;
}

export default Main;