import { attendanceApi } from "../api/Api";

export const attendanceChecker = async () => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await attendanceApi.getAll({
      params: { work_date: today }
    });

    if (res.data.data.length > 0) {
      return res.data.data[0];
    }

    const newAttendance = await attendanceApi.create({
      employee_id: 1,
      work_date: today,
      status: "WORKING",
      total_work_minutes: 0,
      overtime_minutes: 0
    });

    return newAttendance.data.data;

  } catch (err) {
    console.error("Attendance error:", err);
    throw err;
  }
};