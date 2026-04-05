import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import SegmentModal from "../components/Modals/SegmentModal";
import LocationModal from "../components/Modals/LocationModal";
import { useSegmentContext } from "../context/SegmentContext";
import { getCurrentTime } from "../utils/getCurrentTime";
import ManualTimeModal from "../components/Modals/ManualTime";
import { useManualTimeContext } from "../context/ManualTimeContext";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { Square } from "lucide-react";
import EditSegmentModal from "../components/Modals/EditSegmentModal";
import echo from "../echo";
import { formattedTime } from "../utils/formattedTime";
import { attendanceApi, constructionSiteApi, segmentApi, siteAssignmentApi } from "../api/Api";
import formatWorkDate from "../utils/formatWorkDate";
import { data, useLocation, useNavigate } from "react-router-dom";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext } from "../context/LocationContext";
import { loggedInUser } from "../utils/loggedInUser";

function Layout({ employee }) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [status, setStatus] = useState("Not Started");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isLeader, setIsLeader] = useState(false)
  const { sites, setSites } = useLocationContext()
  const {
    setOpenSegmentModal,
    setSelectedSegment,
    setRecordType,
    segments,
    setSegments,
    setStartSegment,
  } = useSegmentContext();
  const loggedIn = loggedInUser
  const navigate = useNavigate();
  const { setStartTime, setEndTime } = useManualTimeContext();
  const { attendance, setAttendance } = useAttendanceContext()
  const today = new Date().toDateString();
  const fetchSegments = async () => {
    if (!attendance?.attendance_id) return;

    try {
      const res = await segmentApi.getAll({
        attendance_id: attendance.attendance_id,
      });
      const data = res.data.data || res.data;
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!employee?.id) return;

    try {
      const res = await attendanceApi.getAll({ employee_id: employee.id });
      const data = res.data.data || res.data;

      const todayAttendance = Array.isArray(data)
        ? data.find((att) => att.work_date === formatWorkDate(new Date()))
        : data;

      setAttendance(todayAttendance || null);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };
  const fetchSiteAssignment = async () => {
    try {
      const res = await siteAssignmentApi.getAll();

      const data = res.data.data.find(
        v => v.employee.id === loggedIn.employee_id
      );

      if (data?.is_leader === true) {
        setIsLeader(true);
      }
      setSites(data ? [data] : []);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  useEffect(() => {
    fetchSiteAssignment()
  }, [])
  // const fetchSite = async () => {
  //   try {
  //     const res = await constructionSiteApi.getAll();
  //     const data = res.data.data || res.data;
  //     setSites(data);
  //   } catch (error) {
  //     console.error("Error fetching sites:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchSite();
  // }, []);

  useEffect(() => {
    if (!employee || attendance) return;
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (segments.length === 0) fetchSegments();
  }, [attendance]);

  useEffect(() => {
    const channel = echo.channel("segments");
    const todayDate = new Date().toDateString();

    const handler = (e) => {
      const seg = e.segment;
      if (!seg.start_time || new Date(seg.start_time).toDateString() !== todayDate) return;

      setSegments((prev) => {
        const withoutTemp = prev.filter(p => !p._temp);

        const exists = withoutTemp.some(s => s.segment_id === seg.segment_id);
        if (exists) return withoutTemp;

        return [seg, ...withoutTemp];
      });
    };

    channel.listen(".segment.event", handler);

    return () => {
      channel.stopListening(".segment.event", handler);
      echo.leave("segments");
    };
  }, []);

  useEffect(() => {
    const channel = echo.channel("attendances");

    const handler = (e) => {
      setAttendance(e.attendance);
    };

    channel.listen(".attendances.event", handler);

    return () => {
      channel.stopListening(".attendances.event", handler);
      echo.leave("attendances");
    };
  }, []);

  useEffect(() => {
    const attendanceStatus = attendance?.status;

    if (segments.length === 0) {
      setStatus("Not Started");
      return;
    }

    if (attendanceStatus === "END_OF_DAY") {
      setStatus("End Of Day");
      return;
    }

    const anyActive = segments.some((seg) => seg.start_time && !seg.end_time);
    setStatus(anyActive ? "Working" : "Completed");
  }, [segments, attendance]);

  const openConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setOpenConfirm(true);
  };

  const handleStartSegment = (type) => {
    setRecordType(type);
    setSelectedSegment("");
    setOpenSegmentModal(true);

    setStartTime(getCurrentTime());
    setEndTime("");
  };

  const handleEditSegment = (segment) => {
    const normalized = {
      ...segment,
      segment: segment.segment_type,
      site: segment.site_id,
      site_name: segment.site_name,
      startTime: segment.start_time,
      endTime: segment.end_time,
    };
    setEditingSegment(normalized);
    setOpenEditModal(true);
  };

  const handleEndSegment = async (seg) => {
    const now = new Date().toISOString();
    const payload = { ...seg, employee_id: loggedInUser.employee_id, end_time: now };

    setSegments((prev) =>
      prev.map((s) =>
        s.segment_id === seg.segment_id ? { ...s, end_time: now } : s
      )
    );

    setOpenConfirm(false);

    try {
      await segmentApi.update(seg.segment_id, payload);
      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
      await fetchSegments();
    }
  };

  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", async () => {
      setConfirmLoading(true);
      const now = getCurrentTime();

      try {
        const attendanceId = segments[0]?.attendance_id;
        if (!attendanceId) throw new Error("Attendance not found");

        const attendanceRes = await attendanceApi.getById(attendanceId);
        const attendanceData = attendanceRes.data.data;

        await Promise.all(
          segments.map((seg) => {
            if (!seg.end_time) return segmentApi.update(seg.segment_id, { ...seg, end_time: now });
          })
        );

        const updatedAttendance = {
          ...attendanceData,
          status: "END_OF_DAY",
          end_time: now,
        };
        await attendanceApi.update(attendanceId, updatedAttendance);
        setAttendance(updatedAttendance);

        await fetchSegments();
        navigate(isLeader ? 'subcontractor' : '/transportation-expenses');
      } catch (err) {
        console.error("End of day update failed:", err);
      }

      setConfirmLoading(false);
      setOpenConfirm(false);
    });
  };
  
  const handleUpdateSegment = async (updatedSegment) => {
    try {
      const payload = {
        ...updatedSegment,
        start_time: updatedSegment.start_time,
        end_time: updatedSegment.end_time
      };

      console.log('THIS IS PAYLOAD: ', payload)
      await segmentApi.update(updatedSegment.segment_id, payload);
      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const isEnded = attendance?.status === "END_OF_DAY";

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">
          {attendance?.data?.work_date ? formatWorkDate(attendance.data.work_date) : today}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`font-semibold text-lg ${status === "Working" ? "text-green-600" : "text-gray-600"}`}>
            Status: {status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.segment_id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4 ${
              isEnded ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-gray-100"
            }`}
            onClick={() => !isEnded && !seg._temp && handleEditSegment(seg)}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-2 h-10 rounded-full ${
                  seg.segment_type === "TRAVEL"
                    ? "bg-orange-400"
                    : seg.segment_type === "OFFICE"
                    ? "bg-blue-500"
                    : seg.segment_type === "SITE"
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {formattedTime(seg.start_time)} – {formattedTime(seg.end_time)} {seg.segment_type}
                </p>
                {seg.segment_type !== "OFFICE" && (
                  <p className="text-sm text-gray-500">→ {seg.site_name || "No Selected Site"}</p>
                )}
              </div>
            </div>

            {!isEnded && !seg.end_time && !seg._temp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirmation(`End "${seg.segment_type}" segment?`, () => handleEndSegment(seg));
                }}
                className="p-1 rounded-full hover:bg-red-100 text-red-500"
              >
                <Square size={18} fill="currentColor" />
              </button>
            )}
          </div>
        ))}

        {!isEnded && (
          <div className="space-y-2">
            <Button
              text={segments.length > 0 ? "+ Add Segment" : "▶ Start"}
              customButton="bg-green-500 text-white py-4 hover:bg-green-600"
              onClick={() => handleStartSegment("default")}
            />
            <Button
              text="+ Add Segment (manual)"
              customButton="bg-lime-500 text-white py-4 hover:bg-lime-600"
              onClick={() => handleStartSegment("manual")}
            />
            <Button
              text="↪ End Work Day"
              customButton="border border-gray-300 py-4"
              onClick={handleEndOfDay}
              disabled={segments.length === 0}
            />
          </div>
        )}
      </div>

      <SegmentModal />
      <LocationModal/>
      <ManualTimeModal />

      <EditSegmentModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        segmentData={editingSegment}
        segments={["OFFICE", "TRAVEL", "SITE"]}
        sites={["Site A - Shinjuku Tower", "Site B - Shibuya Office", "Site C - Roppongi Hills"]}
        onSave={handleUpdateSegment}
      />

      {openConfirm && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={confirmAction}
          onCancel={() => {
            if (!confirmLoading) setOpenConfirm(false);
          }}
          loading={confirmLoading}
        />
      )}
    </div>
  );
}

export default Layout;