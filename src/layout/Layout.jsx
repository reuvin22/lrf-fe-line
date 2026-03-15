import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import SegmentModal from "../components/Modals/SegmentModal";
import LocationModal from "../components/Modals/LocationModal";
import { useSegmentContext } from "../context/SegmentContext";
import { useLocationContext } from "../context/LocationContext";
import { getCurrentTime } from "../utils/getCurrentTime";
import ManualTimeModal from "../components/Modals/ManualTime";
import { useManualTimeContext } from "../context/ManualTimeContext";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { Car, MapPin, Building2, Square } from "lucide-react";
import EditSegmentModal from "../components/Modals/EditSegmentModal";

function Layout() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [activeSegmentExists, setActiveSegmentExists] = useState(false);
  const [status, setStatus] = useState("Not Started");

  const {
    startSegment,
    setStartSegment,
    setOpenSegmentModal,
    selectedSegment,
    setSelectedSegment,
    setRecordType,
    segments,
    setSegments,
    setTempSegment,
    setDayEnded,
    dayEnded
  } = useSegmentContext()

  const { selectedSite } = useLocationContext();

  const { startTime, setStartTime, endTime, setEndTime } =
    useManualTimeContext();

  const handleStartSegment = (type) => {
    setRecordType(type);
    setSelectedSegment("");
    setOpenSegmentModal(true);

    setStartTime(getCurrentTime());
    setEndTime("");
  };

  const handleEndSegment = () => {
    const now = getCurrentTime();

    setSegments(prevSegments => {
      const updated = [...prevSegments];
      let updatedFlag = false;

      [...updated].reverse().forEach((seg, index) => {
        if (!updatedFlag && seg.type === "default" && !seg.endTime) {
          const realIndex = updated.length - 1 - index;
          updated[realIndex] = {
            ...seg,
            endTime: now,
            status: "completed"
          };
          updatedFlag = true;
        }
      });

      return updated;
    });

    setStartSegment(false);
    setSelectedSegment("");
    setRecordType("");
    setStartTime("");
    setEndTime("");
    setTempSegment(null);
  };

  const openConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setOpenConfirm(true);
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setOpenEditModal(true);
  };

  const convertToMinutes = (time) => {
    const date = new Date(`1970-01-01 ${time}`);
    return date.getHours() * 60 + date.getMinutes();
  };

  const isSegmentActive = (start, end) => {
    if (!start || !end) return false;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const startMinutes = convertToMinutes(start);
    const endMinutes = convertToMinutes(end);

    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  };

  useEffect(() => {
    if (dayEnded) {
      setStatus("End Of Day");
      setActiveSegmentExists(false);
      return;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const anyActive = segments.some(seg => {
      if (!seg.startTime) return false;

      const startMinutes = convertToMinutes(seg.startTime);
      const endMinutes = seg.endTime ? convertToMinutes(seg.endTime) : nowMinutes;

      return nowMinutes >= startMinutes && nowMinutes <= endMinutes && seg.status !== "completed";
    });

    if (anyActive) {
      setStatus("Working");
    } else {
      setStatus("Not Started");
    }

    setActiveSegmentExists(anyActive);

  }, [segments, dayEnded]);

  const handleEndOfDay = () => {
    openConfirmation("Are you sure you want to end work?", () => {
      const now = getCurrentTime();

      setSegments(prevSegments =>
        prevSegments.map(seg => ({
          ...seg,
          endTime: seg.endTime || now,
          status: "completed"
        }))
      );

      setStatus("End Of Day");

      setStartSegment(false);
      setSelectedSegment("");
      setRecordType("");
      setStartTime("");
      setEndTime("");
      setDayEnded(true);
      setTempSegment(null);
      setActiveSegmentExists(false);
      setOpenConfirm(false);
    });
  };
  
  console.log('THIS IS SEGMENTS: ', segments)
  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">Fri, Mar 13, 2026</p>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`font-semibold text-lg ${
              status === "Working" ? "text-green-600" : "text-gray-600"
            }`}
          >
            Status: {status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4
              ${dayEnded ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-gray-100"}
            `}
            onClick={() => {
              if (dayEnded) return;
              handleEditSegment(seg);
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-2 h-10 rounded-full ${
                  seg.segment === "Travel"
                    ? "bg-orange-400"
                    : seg.segment === "Office"
                    ? "bg-blue-500"
                    : seg.segment === "Site"
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {seg.startTime}–{seg.endTime || "..."} {seg.segment}
                </p>
                {seg.segment !== "Office" && (
                  <p className="text-sm text-gray-500">→ {seg.site || "No Selected Site"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {seg.status === "active" && (
                <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                  ● REC
                </span>
              )}

              {/* Stop icon button */}
              {!dayEnded && !seg.endTime && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent edit modal
                    openConfirmation(
                      `Are you sure you want to end the "${seg.segment}" segment?`,
                      () => {
                        const now = getCurrentTime();
                        setSegments(prevSegments =>
                          prevSegments.map(s =>
                            s.id === seg.id ? { ...s, endTime: now, status: "completed" } : s
                          )
                        );

                        // Reset context if this was the active segment
                        setStartSegment(false);
                        setSelectedSegment("");
                        setRecordType("");
                        setStartTime("");
                        setEndTime("");
                        setTempSegment(null);
                        setOpenConfirm(false);
                      }
                    );
                  }}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500 cursor-pointer transition"
                  title="End Segment"
                >
                  <Square size={18} className="text-red-600" fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        ))}

        {status !== 'End Of Day' && (
          <div className="space-y-2">
            <Button
              buttonStyle={activeSegmentExists ? "active" : "active"}
              text={activeSegmentExists ? "+ Add Another Segment" : "▶ Start"}
              onClick={activeSegmentExists ? () => handleStartSegment("default") : () => handleStartSegment("default")}
            />

            <Button
              buttonStyle="secondary"
              text="+ Add Segment (manual)"
              customButton="bg-lime-500 text-white py-4 hover:bg-lime-600"
              onClick={() => handleStartSegment("manual")}
            />

            <Button
              buttonStyle="secondary"
              text="↪ End Work Day"
              customButton="border border-gray-300 py-4"
              onClick={() => handleEndOfDay()}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SegmentModal />
      <LocationModal />
      <ManualTimeModal />
      <EditSegmentModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        segmentData={editingSegment}
        segments={["Office", "Travel", "Site"]}
        sites={["Site A", "Site B", "Site C"]}
        onSave={(updatedSegment) => {
          setSegments(prev =>
            prev.map(seg =>
              seg.id === updatedSegment.id ? updatedSegment : seg
            )
          );
        }}
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