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

  const todayDisplay = new Date().toDateString();
  const getToday = () => new Date().toISOString().split("T")[0];

  // ✅ FIXED: FETCH ONLY TODAY'S DATA
  const fetchSegments = async () => {
    try {
      const today = getToday();

      const attendanceRes = await attendanceApi.getAll({
        params: { work_date: today },
      });

      const attendanceData = attendanceRes.data.data?.[0];

      if (!attendanceData) {
        setAttendance(null);
        setSegments([]);
        return;
      }

      setAttendance({ data: attendanceData });

      const res = await segmentApi.getAll({
        params: { attendance_id: attendanceData.id },
      });

      const data = res.data.data || [];
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  // ✅ FIXED: AUTO RESET WHEN NEW DAY COMES
  useEffect(() => {
    let currentDay = getToday();

    const interval = setInterval(() => {
      const nowDay = getToday();

      if (nowDay !== currentDay) {
        currentDay = nowDay;
        fetchSegments();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ✅ PUSHER SEGMENTS (UNCHANGED)
  useEffect(() => {
    const channel = echo.channel("segments");

    const handler = (e) => {
      setSegments((prev) => {
        const index = prev.findIndex(
          (s) => s.segment_id === e.segment.segment_id
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = e.segment;
          return updated;
        }
        return [e.segment, ...prev];
      });
    };

    channel.listen(".segment.event", handler);

    return () => {
      channel.stopListening(".segment.event", handler);
      echo.leave("segments");
    };
  }, []);

  // ✅ PUSHER ATTENDANCE (UNCHANGED)
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

  // ✅ FIXED STATUS LOGIC (CLEAN + CORRECT)
  useEffect(() => {
    const attendanceStatus = attendance?.data?.status;

    if (!attendance) {
      setStatus("Not Started");
      return;
    }

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

  // ✅ END SEGMENT (UNCHANGED)
  const handleEndSegment = async (seg) => {
    const now = new Date().toISOString();

    try {
      await segmentApi.update(seg.segment_id, {
        ...seg,
        end_time: now,
      });

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

  // ✅ END DAY (UNCHANGED)
  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", async () => {
      setConfirmLoading(true);

      const now = getCurrentTime();

      try {
        const attendanceId = attendance?.data?.id;

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
          ...attendance.data,
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
      await segmentApi.update(updatedSegment.segment_id, updatedSegment);
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
            : todayDisplay}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`font-semibold text-lg ${
              status === "Working"
                ? "text-green-600"
                : "text-gray-600"
            }`}
          >
            Status: {status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.segment_id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4
              ${
                isEnded
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer hover:bg-gray-100"
              }
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
                  {formattedTime(seg.start_time)} –{" "}
                  {formattedTime(seg.end_time)} {seg.segment_type}
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
          "Site C - Roppongi Hills",
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