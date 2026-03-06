import React, { useState } from "react";
import { X, Clock } from "lucide-react";
import { useManualTimeContext } from "../context/ManualTimeContext";

function ManualTimeModal() {
  const {
    openTimeModal,
    setOpenTimeModal,
    setStartTime,
    setEndTime
  } = useManualTimeContext();

  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");

  if (!openTimeModal) return null;

  const handleSave = () => {
    setStartTime(tempStartTime);
    setEndTime(tempEndTime);
    setOpenTimeModal(false);
  };

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
            className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
          >
            セグメント追加
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualTimeModal;