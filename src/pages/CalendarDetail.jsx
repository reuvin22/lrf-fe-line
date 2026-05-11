import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";

import Button from "../components/Button";
import SegmentModal from "../components/Modals/SegmentModal";
import EditSegmentModal from "../components/Modals/EditSegmentModal";
import LocationModal from "../components/Modals/LocationModal";

import { useAttendanceContext } from "../context/AttendanceContext";
import { useSegmentContext } from "../context/SegmentContext";
import { useLocationContext } from "../context/LocationContext";

import {
  segmentApi,
  siteAssignmentApi,
  transportationExpensesApi,
} from "../api/Api";

import { formattedTime } from "../utils/formattedTime";
import formatWorkDate from "../utils/formatWorkDate";
import { toast } from "react-toastify";

function CalendarDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { attendanceCalendar, selectedDate, employee, fetchAttendanceCalendar } = useAttendanceContext();
  const displayDate = selectedDate
    ? formatWorkDate(selectedDate)
    : "No Date";

  const { segments, setSegments, setOpenSegmentModal, setRecordType, setSelectedSegment: setSegmentType } = useSegmentContext();
  const { sites, setSites } = useLocationContext();
  const [openEditSegmentModal, setOpenEditSegmentModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [siteAssign, setSiteAssign] = useState([]);
  const [localExpenses, setLocalExpenses] = useState([]);

  const attendanceRaw = attendanceCalendar.find(a => a.work_date === selectedDate)

  const attendance = useMemo(() => {
    if (!attendanceRaw) return null;
    return {
      ...attendanceRaw,
      attendance_id: attendanceRaw.attendance_id || attendanceRaw.id,
    };
  }, [attendanceRaw]);

  const hasData = !!attendance;

  useEffect(() => {
    if (!employee?.employee_id) return;

    const fetchSiteAssignment = async () => {
      try {
        const res = await siteAssignmentApi.getAll();
        const inner = res.data?.data;
        const all = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [];

        const data = all.filter(
          (v) => v != null && String(v.employee_id) === String(employee.employee_id)
        );
        setSiteAssign(data);

        const mappedSites = data
          .filter(v => v.site != null)
          .map((v) => ({
            site_id: v.site.site_id,
            site_name: v.site.site_name,
            address: v.site?.address,
            client_name: v.site?.client_name,
            is_leader: v.is_leader,
          }));
        setSites(mappedSites);
      } catch (err) {
        console.error("Error fetching site assignments:", err);
      }
    };

    fetchSiteAssignment();
  }, [employee]);

  const subcontractors = useMemo(() => {
    if (!attendance) return [];

    const raw = attendance.attendance_subcontractor_segments || [];

    const unique = Array.from(
      new Map(raw.map(item => [item.company_name, item])).values()
    );

    return unique;
  }, [attendance]);

  const fetchSegments = useCallback(async () => {
    const attendanceId = attendance?.attendance_id;

    if (!attendanceId) {
      setSegments([]);
      return;
    }

    try {
      const res = await segmentApi.getAll();
      const raw = res?.data?.data ?? res?.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const matched = list.filter((seg) => seg.attendance_id === attendanceId);
      console.log("[CalendarDetail] segments for attendance_id", attendanceId, matched);
      setSegments(matched);
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    }
  }, [attendance?.attendance_id, setSegments]);

  useEffect(() => {
    if (attendance) {
      fetchSegments();
    }
  }, [attendance, fetchSegments])

  const fetchTransportExpenses = async () => {
    if (!attendance) {
      setLocalExpenses([]);
      return;
    }
    try {
      const res = await transportationExpensesApi.getAll({
        attendance_id: attendance.attendance_id,
      });
      setLocalExpenses(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch transport expenses:", err);
    }
  };

  useEffect(() => {
    fetchTransportExpenses();
  }, [attendance, location.key]);

  const totalTransportAmount = useMemo(() => {
    return localExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [localExpenses]);

  const totalHours = useMemo(() => {
    if (!segments.length) return "0h 0m 0s";
    let totalMs = 0;
    segments.forEach((seg) => {
      if (seg.start_time && seg.end_time) {
        const start = new Date(seg.start_time);
        const end = new Date(seg.end_time);
        if (end > start) totalMs += end - start;
      }
    });
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [segments]);

  const handleEditSegment = (seg) => {
    setEditingSegment(seg);
    setOpenEditSegmentModal(true);
    console.log(seg)
  };

  const handleSaveSegment = async (payload) => {
    try {
      await segmentApi.update(payload.segment_id, {
        ...payload,
        employee_id: employee?.employee_id,
        attendance_id: attendance?.attendance_id,
      });

      setOpenEditSegmentModal(false);
      await fetchSegments();
      toast.success("Segment updated successfully");
    } catch (err) {
      console.error("Failed to update segment", err);
    }
  };

  const handleAddSegment = async (newSegment) => {
    try {
      const res = await segmentApi.create({
        ...newSegment,
        attendance_id: attendance?.attendance_id,
      });

      const createdSegment = res?.data?.data;

      if (createdSegment) {
        setSegments((prev) => [...prev, createdSegment]);
      } else {
        fetchSegments();
      }

      toast.success("New segment added successfully!");
    } catch (err) {
      console.error("Failed to add segment:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Input / Edit</span>
      </div>

      <div className="p-4 space-y-4">
        <button
          onClick={() => navigate("/calendar")}
          className="text-green-600 text-sm cursor-pointer"
        >
          ← Back to Calendar
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-xl">
            {attendance?.work_date ? formatWorkDate(attendance.work_date) : displayDate}
          </h2>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <span className={`text-sm ${!hasData ? "text-red-600" : "text-green-600"}`}>
              {!hasData ? "Missing" : "Entered"}
            </span>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center text-gray-500 py-10">No Data Available</div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {segments.map((seg) => {
                const start = formattedTime(seg.start_time);
                const end = formattedTime(seg.end_time);
                return (
                  <div
                    key={seg.segment_id}
                    onClick={() => handleEditSegment(seg)}
                    className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start cursor-pointer hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {start && end ? `${start}-${end}` : start} {seg.segment_type}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {seg.segment_type === "TRAVEL"
                          ? `→ ${seg.site_name || seg.site_id || "(unspecified)"}`
                          : seg.site_name || seg.site_id || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex justify-between">
                <span>Actual</span>
                <span className="font-semibold">{totalHours}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime</span>
                <span className="font-semibold">0h</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span>Transport</span>
                <span className="font-semibold">
                  ¥{totalTransportAmount.toLocaleString()}
                </span>
              </div>
              <hr />

              <div className="space-y-1">
                <span>Subcontractors</span>
                {subcontractors.length > 0 ? (
                  subcontractors.map((item) => (
                    <p key={item.uuid} className="text-sm mt-1">
                      {item.subcontractor?.company_name || item.company_name || "Unknown"} —{" "}
                      {" "}
                      {item.start_time?.slice(11, 16)}–{item.end_time?.slice(11, 16)}
                    </p>
                  ))
                ) : (
                  <p className="text-sm mt-1 text-gray-500">No subcontractors assigned</p>
                )}
              </div>
            </div>

            <Button
              buttonStyle="primary"
              text={
                <div className="flex justify-center items-center gap-2">
                  <Plus size={18} />
                  Add Segment
                </div>
              }
              onClick={() => {
                setRecordType("default");
                setSegmentType("");
                setOpenSegmentModal(true);
              }}
            />

            <Button
              buttonStyle="primary"
              text="Edit Transport"
              customButton="bg-lime-500"
              onClick={() =>
                navigate("/transportation-expenses", { state: { from: "calendar-detail" } })
              }
            />

            <Button
              buttonStyle="primary"
              text="Edit Subcontractor"
              customButton="bg-lime-500"
              onClick={() =>
                navigate("/subcontractor", {
                  state: {
                    from: "subcontractor",
                    attendance_id: attendance?.attendance_id,
                  },
                })
              }
            />
          </>
        )}
      </div>

      <SegmentModal onSave={handleAddSegment} />
      <LocationModal sites={sites} />
      <EditSegmentModal
        open={openEditSegmentModal}
        onClose={() => setOpenEditSegmentModal(false)}
        segmentData={editingSegment}
        segments={["OFFICE", "SITE", "TRAVEL"]}
        sites={sites}
        onSave={handleSaveSegment}
      />
    </div>
  );
}

export default CalendarDetail;