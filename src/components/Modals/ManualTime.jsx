import React, { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { useManualTimeContext } from "../../context/ManualTimeContext";
import { useSegmentContext } from "../../context/SegmentContext";
import { segmentApi } from "../../api/Api";

function ManualTimeModal() {
  const {
    openTimeModal,
    setOpenTimeModal,
    setStartTime,
    setEndTime
  } = useManualTimeContext();

  const { tempSegment, setSegments } = useSegmentContext();
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tempStartTime && tempEndTime && tempEndTime < tempStartTime) {
      setErrorMessage("End time cannot be before start time.");
    } else {
      setErrorMessage("");
    }
  }, [tempStartTime, tempEndTime]);

  const handleSave = async () => {
    if (tempEndTime && tempEndTime < tempStartTime) {
      alert("End time cannot be before start time.");
      return;
    }

    setIsLoading(true);

    const buildDateTime = (time) => {
      if (!time) return null;

      const [hours, minutes] = time.split(":");
      const d = new Date();

      d.setHours(Number(hours));
      d.setMinutes(Number(minutes));
      d.setSeconds(0);
      d.setMilliseconds(0);

      return d.toISOString();
    };

    const segmentToSave = {
      ...tempSegment,
      start_time: buildDateTime(tempStartTime),
      end_time: tempEndTime ? buildDateTime(tempEndTime) : null,
    };

    try {
      await segmentApi.create(segmentToSave);
    } catch (err) {
      console.error("Create segment failed:", err);
    } finally {
      setIsLoading(false);
      setOpenTimeModal(false);
    }
  };
  
  // **Render nothing if modal is closed**
  if (!openTimeModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpenTimeModal(false)}
      />

      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">時間を設定</h2>
          <button
            onClick={() => setOpenTimeModal(false)}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500 mb-2">{errorMessage}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">開始時間</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Clock className="text-gray-400 mr-2" size={18} />
              <input
                type="time"
                value={tempStartTime}
                onChange={(e) => setTempStartTime(e.target.value)}
                className="w-full outline-none text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">終了時間</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Clock className="text-gray-400 mr-2" size={18} />
              <input
                type="time"
                value={tempEndTime}
                onChange={(e) => setTempEndTime(e.target.value)}
                className="w-full outline-none text-gray-700"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!!errorMessage || isLoading}
            className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center ${
              errorMessage || isLoading
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "セグメント追加"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualTimeModal;