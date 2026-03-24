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
import { attendanceApi, segmentApi } from "../api/Api";
import formatWorkDate from "../utils/formatWorkDate";
import { useNavigate } from "react-router-dom";

function Layout() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [status, setStatus] = useState("Not Started");
  const [attendance, setAttendance] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const {
    setOpenSegmentModal,
    setSelectedSegment,
    setRecordType,
    segments,
    setSegments,
    setStartSegment,
  } = useSegmentContext();
  const navigate = useNavigate();
  const { setStartTime, setEndTime } = useManualTimeContext();

  const today = new Date().toDateString();

  const fetchSegments = async () => {
    try {
      const res = await segmentApi.getAll();
      const data = res.data.data || res.data;

      const todayDate = new Date().toDateString();
      const todaySegments = data.filter((seg) => {
        if (!seg.start_time) return false;
        return new Date(seg.start_time).toDateString() === todayDate;
      });

      setSegments(todaySegments);
      if (todaySegments.length > 0) {
        const attendanceId = todaySegments[0].attendance_id;
        const attendanceRes = await attendanceApi.getById(attendanceId);
        setAttendance(attendanceRes.data.data || attendanceRes.data);
      } else {
        setAttendance(null);
      }

    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await attendanceApi.getAll({
        employee_id: 1
      });

      const data = res.data.data || res.data;
      console.log('Attendance: ', data)
      setAttendance(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  useEffect(() => {
    fetchAttendance;
  }, []);
  
  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    const channel = echo.channel("segments");

    const todayDate = new Date().toDateString();

    const handler = (e) => {
      const seg = e.segment;
      if (
        !seg.start_time ||
        new Date(seg.start_time).toDateString() !== todayDate
      ) {
        return;
      }

      setSegments((prev) => {
        const index = prev.findIndex(
          (s) => s.segment_id === seg.segment_id
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = seg;
          return updated;
        }

        return [seg, ...prev];
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
      setAttendance({ data: e.attendance });
    };

    channel.listen(".attendances.event", handler);

    return () => {
      channel.stopListening(".attendances.event", handler);
      echo.leave("attendances");
    };
  }, []);

  useEffect(() => {
  const attendanceStatus = attendance?.status;

  if (attendanceStatus === "END_OF_DAY") {
    setStatus("End Of Day");
    return;
  }

  if (segments.length === 0) {
    setStatus("Not Started");
    return;
  }

  const anyActive = segments.some(
    (seg) => seg.start_time && !seg.end_time
  );

  setStatus(anyActive ? "Working" : "Completed");

}, [segments, attendance]);

  console.log('THIS IS SEGMENTS: ', segments)
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

  // ✅ End segment
  const handleEndSegment = async (seg) => {
    const now = new Date().toISOString();

    const payload = {
      ...seg,
      end_time: now,
    };

    try {
      await segmentApi.update(seg.segment_id, payload);

      await attendanceApi.update(seg.attendance_id, {
        status: "COMPLETED",
        end_time: now,
      });

      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
    }

    setOpenConfirm(false);
  };

  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", async () => {
      setConfirmLoading(true);

      const now = getCurrentTime();

      try {
        const attendanceId = segments[0]?.attendance_id;
        const attendanceRes = await attendanceApi.getById(attendanceId);
        const attendanceData = attendanceRes.data;

        await Promise.all(
          segments.map((seg) => {
            if (!seg.end_time) {
              return segmentApi.update(seg.segment_id, {
                ...seg,
                end_time: now,
              });
            }
          })
        );

        await attendanceApi.update(attendanceId, {
          employee_id: attendanceData.data.employee_id,
          work_date: attendanceData.data.work_date,
          status: "END_OF_DAY",
          end_time: now,
        });

        await fetchSegments();
        navigate("/transportation-expenses");
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

  const isEnded = status === "End Of Day";

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">
          {attendance?.data?.work_date
            ? formatWorkDate(attendance.data.work_date)
            : today}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className={`font-semibold text-lg ${
            status === "Working" ? "text-green-600" : "text-gray-600"
          }`}>
            Status: {status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.segment_id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4
              ${isEnded ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-gray-100"}
            `}
            onClick={() => {
              if (isEnded) return;
              handleEditSegment(seg);
            }}
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
                  {formattedTime(seg.start_time)} – {formattedTime(seg.end_time)}{" "}
                  {seg.segment_type}
                </p>

                {seg.segment_type !== "OFFICE" && (
                  <p className="text-sm text-gray-500">
                    → {seg.site_id || "No Selected Site"}
                  </p>
                )}
              </div>
            </div>

            {!isEnded && !seg.end_time && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirmation(
                    `End "${seg.segment_type}" segment?`,
                    () => handleEndSegment(seg)
                  );
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