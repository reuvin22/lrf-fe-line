import React from 'react';
import { X, Car, MapPin, Building2 } from 'lucide-react';
import ActionCard from '../ActionCard';
import { useSegmentContext } from '../../context/SegmentContext';
import { useManualTimeContext } from '../../context/ManualTimeContext';
import { useLocationContext } from '../../context/LocationContext';
import { getCurrentTime } from '../../utils/getCurrentTime';
import { generateSegmentId } from '../../utils/idGenerator';
import { formattedLaravelDate } from '../../utils/formattedLaravelDate';
import { attendanceApi, segmentApi } from '../../api/Api';
import { attendanceChecker } from '../../utils/attendanceChecker';
import { useAttendanceContext } from '../../context/AttendanceContext';

function SegmentModal() {
  const {
    setSelectedSegment,
    setStartSegment,
    openSegmentModal,
    setOpenSegmentModal,
    setOpenLocationModal,
    recordType,
    setSegments,
    setTempSegment,
    tempSegment
  } = useSegmentContext();

  const {
    setSelectedSite
  } = useLocationContext()
  const {
    setOpenTimeModal
  } = useManualTimeContext()

  const { attendance } = useAttendanceContext()
  if (!openSegmentModal) return null;

  const options = [
    { name: "Travel", description: "Movement between sites", icon: Car, value: "TRAVEL"},
    { name: "Site", description: "Construction site work", icon: MapPin, value: "SITE" },
    { name: "Office", description: "Office work", icon: Building2, value: "OFFICE" },
  ];

  const handleSelect = async (segment) => {
    const rawStartTime = tempSegment?.start_time || getCurrentTime();

    try {
      const attendance = await attendanceChecker();

      if (segment.value === "OFFICE") {
        await attendanceApi.update(attendance.attendance_id, {
          employee_id: 1,
          work_date: attendance.work_date,
          status: "WORKING",
        });
      }

      const segmentObj = {
        attendance_id: attendance.attendance_id,
        segment_type: segment.value,
        type: recordType,
        start_time: new Date(rawStartTime).toISOString(),
        site_id: null,
        end_time: null
      };

      setSelectedSegment(segment.value);
      setTempSegment(segmentObj);
      setOpenSegmentModal(false);

      if (segment.value === "OFFICE") {
        if (recordType === "manual") {
          setOpenTimeModal(true);
        } else {
          await segmentApi.create(segmentObj);
        }
      } else {
        setOpenLocationModal(true);
      }

    } catch (err) {
      console.error("Failed to create attendance/segment:", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6 pointer-events-none">
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={() => setOpenSegmentModal(false)}
      />
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 pointer-events-auto">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">Select Segment Type</h2>
          <button
            onClick={() => setOpenSegmentModal(false)}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-1">
          {options.map((opt, index) => (
            <ActionCard
              key={index}
              name={opt.name}
              description={opt.description}
              icon={opt.icon}
              onClick={() => handleSelect(opt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SegmentModal;