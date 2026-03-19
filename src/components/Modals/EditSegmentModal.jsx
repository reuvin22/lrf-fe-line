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
  const [type, setType] = useState("");
  const [site_name, setSiteName] = useState("")
  useEffect(() => {
    if (segmentData) {
      setSegment(segmentData.segment || "");
      setSite(segmentData.site || "");
      setStartTime(segmentData.startTime || "");
      setEndTime(segmentData.endTime || "");
      setType(segmentData.type || "");
      setSiteName(segmentData.site_name || "");
    }
  }, [segmentData?.segment_id]);

  if (!open) return null;

  const isManual = segmentData?.type === "manual";

  const handleSegmentChange = (value) => {
    setSegment(value);

    if (value === "OFFICE") {
      setSite("");
    }

    if (value === "TRAVEL") {
      setSite("No Selected Site");
    }

    if (value === "SITE") {
      setSite("");
    }
  };

  const handleSave = () => {
    onSave({
      ...segmentData,
      type: type,
      segment_type: segment,
      site_id: site,
      start_time: startTime,
      end_time: endTime,
      site_name: site_name
    });

    onClose();
  };

  const showSite = segment !== "Office";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[90%] max-w-md p-6 space-y-4">

        <h2 className="text-lg font-semibold">Edit Segment</h2>

        <div>
          <label className="text-sm text-gray-500">Segment</label>
          <select
            value={segment}
            onChange={(e) => handleSegmentChange(e.target.value)}
            className="w-full border rounded-lg p-2 mt-1"
          >
            {segments.map((seg, i) => (
              <option key={i} value={seg}>
                {seg}
              </option>
            ))}
          </select>
        </div>

        {segment !== "OFFICE" && (
          <div>
            <label className="text-sm text-gray-500">Site</label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {segment === "TRAVEL" && (
                <option value="No Selected Site">No Selected Site</option>
              )}

              {sites.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

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