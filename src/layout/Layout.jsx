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
import { formattedLaravelDate } from "../utils/formattedLaravelDate";
import echo from "../echo";
import { formattedTime } from "../utils/formattedTime";
import { attendanceApi, segmentApi } from "../api/Api";
import formatWorkDate from "../utils/formatWorkDate";

function Layout() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [status, setStatus] = useState("Not Started");
  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState("");
  const {
    setOpenSegmentModal,
    setSelectedSegment,
    setRecordType,
    segments,
    setSegments,
    setTempSegment,
    setDayEnded,
    dayEnded,
    setStartSegment,
    tempSegment
  } = useSegmentContext();

  const { setStartTime, setEndTime } = useManualTimeContext();
  const today = new Date().toDateString();
  const fetchSegments = async () => {
    try {
      setError(""); // reset error
      const res = await segmentApi.getAll();
      const data = res.data.data || res.data;

      setSegments(data);

      if (data.length > 0) {
        const attendanceId = data[0].attendance_id;
        const attendanceRes = await attendanceApi.getById(attendanceId);
        setAttendance(attendanceRes.data.data || attendanceRes.data);
      }

    } catch (error) {
      console.error("Error fetching segments:", error);
      setError("Failed to load segments. Please try again.");
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchAttendance = async () => {
    try {
      const attendanceId = segments[0]?.attendance_id;
      if (!attendanceId) return;

      const res = await attendanceApi.getById(attendanceId);
      setAttendance(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

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

  const convertToMinutes = (time) => {
    if (!time) return 0;
    const date = new Date(time);
    return date.getHours() * 60 + date.getMinutes();
  };

  useEffect(() => {
    if (attendance?.status === "END_OF_DAY") {
      setStatus("End Of Day");
      setDayEnded(true);
      return;
    }

    if (dayEnded) {
      setStatus("End Of Day");
      return;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const anyActive = segments.some(seg => {
      if (!seg.start_time) return false;

      const startMinutes = convertToMinutes(seg.start_time);
      const endMinutes = seg.end_time
        ? convertToMinutes(seg.end_time)
        : nowMinutes;

      return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    });

    setStatus(anyActive ? "Working" : "Not Started");

  }, [segments, dayEnded, attendance]);

  const handleEndSegment = async (seg) => {
    const payload = {
      attendance_id: seg.attendance_id,
      segment_type: seg.segment_type,
      site_id: seg.site_id,
      site_name: seg.site_name,
      type: seg.type,
      start_time: seg.start_time,
      end_time: new Date().toISOString(),
    };

    console.log("🛑 UPDATE Segment Payload:", payload);

    try {
      await segmentApi.update(seg.segment_id, payload);
      await attendanceApi.update(seg.attendance_id, {
        status: "COMPLETED",
        end_time: now
      });
      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
    }

    setStartSegment(false);
    setSelectedSegment("");
    setRecordType("");
    setStartTime("");
    setEndTime("");
    setTempSegment(null);

    setOpenConfirm(false);
  };

  console.log(segments)
  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", async () => {
      const now = getCurrentTime();

      try {
        const attendanceId = segments[0]?.attendance_id;
        const attendanceRes = await attendanceApi.getById(attendanceId);
        const attendance = attendanceRes.data;
        console.log(attendance)
        await Promise.all(
          segments.map(seg => {
            if (!seg.end_time) {
              return segmentApi.update(seg.segment_id, {
                ...seg,
                end_time: now
              });
            }
          })
        );

        await attendanceApi.update(attendanceId, {
          employee_id: attendance.data.employee_id,
          work_date: attendance.data.work_date,
          status: "END_OF_DAY",
          end_time: now
        });

        await fetchSegments();

      } catch (err) {
        console.error("End of day update failed:", err);
      }

      setStatus("End Of Day");
      setStartSegment(false);
      setSelectedSegment("");
      setRecordType("");
      setStartTime("");
      setEndTime("");
      setDayEnded(true);
      setTempSegment(null);
      setOpenConfirm(false);
    });
  };

  const handleUpdateSegment = async (updatedSegment) => {
    try {
      const payload = {
        attendance_id: updatedSegment.attendance_id,
        segment_type: updatedSegment.segment_type,
        site_id: updatedSegment.site_id,
        type: updatedSegment.type,
        site_name: updatedSegment.site_name,
        start_time: updatedSegment.start_time
          ? new Date(updatedSegment.start_time).toISOString()
          : null,

        end_time: updatedSegment.end_time
          ? new Date(updatedSegment.end_time).toISOString()
          : null,
      };

      await segmentApi.update(updatedSegment.segment_id, payload);

      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  useEffect(() => {
    const channel = echo.channel("segments");

    const handler = (e) => {
      console.log("Realtime update:", e);

      setSegments((prev) => {
        const index = prev.findIndex(
          (s) => s.segment_id === e.segment.segment_id
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = e.segment;
          return updated;
        }

        return [...prev, e.segment];
      });
    };

    channel.listen(".segment.event", handler);

    return () => {
      channel.stopListening(".segment.event", handler);
      echo.leave("segments");
    };
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">
            {attendance?.work_date
              ? formatWorkDate(attendance.work_date)
              : today}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className={`font-semibold text-lg ${
            status === "Working" ? "text-green-600" : "text-gray-600"
          }`}>
            Status: {attendance?.status?.replace(/_/g, " ") || "Not Started"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.segment_id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4
              ${!dayEnded ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-gray-100"}
            `}
            onClick={() => {
              if (!dayEnded) return;
              handleEditSegment(seg);
            }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-10 rounded-full ${
                seg.segment_type === "TRAVEL"
                  ? "bg-orange-400"
                  : seg.segment_type === "OFFICE"
                  ? "bg-blue-500"
                  : seg.segment_type === "SITE"
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`} />

              <div>
                <p className="font-semibold text-gray-800">
                  {formattedTime(seg.start_time)} – {formattedTime(seg.end_time)} {seg.segment_type}
                </p>

                {seg.segment_type !== "OFFICE" && (
                  <p className="text-sm text-gray-500">
                    → {seg.site_id || "No Selected Site"}
                  </p>
                )}
              </div>
            </div>

            {!dayEnded && !seg.end_time && (
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  openConfirmation(
                    `End "${seg.segment_type}" segment?`,
                    () => handleEndSegment(seg)
                  );
                }}
                className="p-1 rounded-full hover:bg-red-100 text-red-500 cursor-pointer"
              >
                <Square size={18} fill="currentColor" />
              </button>
            )}
          </div>
        ))}

          <div className="space-y-2">
            <Button
              text={segments.length > 0 ? "+ Add Segment" : "▶ Start"}
              customButton={
                segments.length === 0
                  ? "bg-green-500 text-white py-4 hover:bg-green-600"
                  : "bg-green-500 text-white py-4 hover:bg-green-600"
              }
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
              disabled={segments.length === 0} // optional
            />
          </div>
      </div>

      <SegmentModal />
      <LocationModal />
      <ManualTimeModal />

      <EditSegmentModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        segmentData={editingSegment}
        segments={["OFFICE", "TRAVEL", "SITE"]}
        sites={[
          "Site A - Shinjuku Tower",
          "Site B - Shibuya Office",
          "Site C - Roppongi Hills"
        ]}
        onSave={handleUpdateSegment}
      />

      {openConfirm && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={confirmAction}
          onCancel={() => setOpenConfirm(false)}
        />
      )}
    </div>
  );
}

export default Layout;