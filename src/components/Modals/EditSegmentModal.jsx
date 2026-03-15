import React, { useState, useEffect } from "react";
import Button from "../Button";

function EditSegmentModal({
  open,
  onClose,
  segmentData,
  segments,
  sites,
  onSave
}) {
  const [segment, setSegment] = useState("");
  const [site, setSite] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (segmentData) {
      setSegment(segmentData.segment || "");
      setSite(segmentData.site || "");
      setStartTime(segmentData.startTime || "");
      setEndTime(segmentData.endTime || "");
    }
  }, [segmentData]);

  if (!open) return null;

  const isManual = segmentData?.type === "manual";

  const handleSave = () => {
    onSave({
      ...segmentData,
      segment,
      site,
      startTime,
      endTime
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[90%] max-w-md p-6 space-y-4">

        <h2 className="text-lg font-semibold">Edit Segment</h2>

        {/* Segment Dropdown */}
        <div>
          <label className="text-sm text-gray-500">Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {segments.map((seg, i) => (
              <option key={i} value={seg}>
                {seg}
              </option>
            ))}
          </select>
        </div>

        {/* Site Dropdown */}
        <div>
          <label className="text-sm text-gray-500">Site</label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full border rounded-lg p-2 mt-1"
          >
            <option value="">Select Site</option>
            {sites.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Show time only if MANUAL */}
        {isManual && (
          <>
            <div>
              <label className="text-sm text-gray-500">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button text="Cancel" buttonStyle="secondary" onClick={onClose} />
          <Button text="Save" buttonStyle="active" onClick={handleSave} />
        </div>

      </div>
    </div>
  );
}

export default EditSegmentModal;