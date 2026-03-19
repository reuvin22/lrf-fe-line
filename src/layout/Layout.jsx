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
import segmentApi from "../api/Api";
import { formattedLaravelDate } from "../utils/formattedLaravelDate";
import echo from "../echo";
import { formattedTime } from "../utils/formattedTime";

function Layout() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [status, setStatus] = useState("Not Started");

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

  const fetchSegments = async () => {
    try {
      const res = await segmentApi.getAll();
      const data = res.data.data || res.data;

      console.log("📥 SEGMENTS FROM API:", data);
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

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

  }, [segments, dayEnded]);

  const handleEndSegment = async (seg) => {
    const endTimeISO = new Date().toISOString();

    const payload = {
      ...seg,
      start_time: new Date(seg.start_time).toISOString(),
      end_time: endTimeISO,
    };

    console.log("🛑 UPDATE Segment Payload:", payload);

    try {
      await segmentApi.update(seg.segment_id, payload);
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

  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", async () => {
      const now = getCurrentTime();

      try {
        await Promise.all(
          segments.map(seg => {
            if (!seg.end_time) {
              return segmentApi.update(seg.attendance_id, {
                end_time: now
              });
            }
          })
        );

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
      await segmentApi.update(updatedSegment.segment_id, {
        attendance_id: updatedSegment.attendance_id,
        segment_type: updatedSegment.segment_type,
        site_id: updatedSegment.site_id,
        start_time: updatedSegment.start_time,
        end_time: updatedSegment.end_time,
        type: updatedSegment.type,
        site_name: updatedSegment.site_name
      });

      await fetchSegments();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  useEffect(() => {
    const channel = echo.channel("segments");

    channel.listen(".segment.event", (e) => {
      console.log("Realtime update:", e);
        setSegments((prev) => {
          const index = prev.findIndex(
            s => s.segment_id === e.segment.segment_id
          );

          if (index !== -1) {
            const updated = [...prev];
            updated[index] = e.segment;
            return updated;
          }

          return [...prev, e.segment];
        });
    });

    return () => {
      echo.leave("segments");
    };
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">Fri, Mar 13, 2026</p>

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
              ${dayEnded ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-gray-100"}
            `}
            onClick={() => {
              if (dayEnded) return;
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

        {status !== "End Of Day" && (
          <div className="space-y-2">
            <Button
              text={segments.length > 0 ? "+ Add Segment" : "▶ Start"}
              customButton={
                segments.length > 0
                  ? "bg-green-500 text-white py-4 hover:bg-green-600"
                  : "bg-blue-500 text-white py-4 hover:bg-blue-600"
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
          onCancel={() => setOpenConfirm(false)}
        />
      )}
    </div>
  );
}

export default Layout;