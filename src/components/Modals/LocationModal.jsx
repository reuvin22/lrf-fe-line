import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import ActionCard from '../ActionCard';
import { useSegmentContext } from '../../context/SegmentContext';
import { useManualTimeContext } from '../../context/ManualTimeContext';
import { attendanceApi, segmentApi, siteAssignmentApi } from '../../api/Api';
import { useAttendanceContext } from '../../context/AttendanceContext';

function LocationModal({ open: openProp, onClose: onCloseProp, onSelectSite }) {
  const {
    openLocationModal,
    setOpenLocationModal,
    recordType,
    selectedSegment,
    setTempSegment,
    tempSegment,
    setSegments
  } = useSegmentContext();

  const { setOpenTimeModal } = useManualTimeContext();
  const { attendance, employee } = useAttendanceContext();
  const [sites, setSites] = useState([]);
  const tempIdRef = useRef(0);

  const isOpen = openProp !== undefined ? openProp : openLocationModal;

  useEffect(() => {
    const employeeId = employee?.employee_id ?? attendance?.employee_id;
    if (!isOpen || !employeeId) return;

    const fetchAssignedSites = async () => {
      try {
        const res = await siteAssignmentApi.getAll();
        const inner = res.data?.data;
        const allAssignments = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data) ? inner.data : [];

        const matchedSites = allAssignments
          .filter((v) => v != null && String(v.worker_id ?? v.employee_id ?? "") === String(employeeId))
          .map((v) => ({
            site_id: v.site_id ?? v.site?.site_id,
            site_name: v.site_name ?? v.site?.site_name,
          }))
          .filter((s) => s.site_id != null);

        console.log("[LocationModal] assigned sites:", matchedSites);
        setSites(matchedSites);
      } catch (err) {
        console.error("[LocationModal] Failed to fetch assigned sites:", err);
      }
    };

    fetchAssignedSites();
  }, [isOpen, employee?.employee_id, attendance?.employee_id]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onCloseProp) onCloseProp();
    else setOpenLocationModal(false);
  };

  const handleSelectSite = async (site) => {
    if (onSelectSite) {
      onSelectSite(site);
      console.log(site)
      handleClose();
      return;
    }

    const attendanceId =
      tempSegment?.attendance_id || attendance?.attendance_id;
    const employeeId =
      tempSegment?.employee_id || attendance?.employee_id;
    const workDate =
      tempSegment?.work_date || attendance?.work_date;

    if (!attendanceId || !employeeId) {
      console.error("Missing attendance or employee ID");
      return;
    }

    const payload = {
      ...tempSegment,
      attendance_id: attendanceId,
      employee_id: employeeId,
      work_date: workDate,
      site_id: String(site.site_id || site.site?.site_id),
      site_name: site.site_name || site.site?.site_name,
      start_time: tempSegment?.start_time
        ? new Date(tempSegment.start_time).toISOString()
        : new Date().toISOString(),
      end_time: tempSegment?.end_time
        ? new Date(tempSegment.end_time).toISOString()
        : null,
    };

    const tempId = ++tempIdRef.current;
    setSegments(prev => [
      { ...payload, segment_id: tempId, _temp: true },
      ...prev
    ]);

    setOpenLocationModal(false);

    if (recordType === "manual") {
      setTempSegment(payload);
      setOpenTimeModal(true);
      return;
    }

    try {
      attendanceApi.update(attendanceId, {
        attendance_id: attendanceId,
        employee_id: employeeId,
        site_id: payload.site_id,
        site_name: payload.site_name,
        status: "WORKING",
        work_date: workDate,
      });

      const realSegment = await segmentApi.create(payload);
      const segmentData = realSegment.data?.data ?? realSegment.data;

      setSegments(prev =>
        prev.map(s =>
          s.segment_id === tempId ? (segmentData ?? s) : s
        )
      );

      setTempSegment(payload);
    } catch (err) {
      console.error("Failed to create segment:", err);
      setSegments(prev =>
        prev.filter(s => s.segment_id !== tempId)
      );
    }
  };

  const handleSkip = async () => {
    const attendanceId =
      tempSegment?.attendance_id || attendance?.attendance_id;
    const employeeId =
      tempSegment?.employee_id || attendance?.employee_id;
    const workDate =
      tempSegment?.work_date || attendance?.work_date;

    if (!attendanceId || !employeeId) {
      console.error("Missing attendance or employee ID");
      return;
    }

    const payload = {
      ...tempSegment,
      attendance_id: attendanceId,
      employee_id: employeeId,
      work_date: workDate,
      site_id: null,
      site_name: "No Selected Site",
      start_time: tempSegment?.start_time
        ? new Date(tempSegment.start_time).toISOString()
        : new Date().toISOString(),
      end_time: tempSegment?.end_time
        ? new Date(tempSegment.end_time).toISOString()
        : null,
    };

    const tempId = ++tempIdRef.current;
    setSegments(prev => [
      { ...payload, segment_id: tempId, _temp: true },
      ...prev
    ]);

    setOpenLocationModal(false);

    if (recordType === "manual") {
      setTempSegment(payload);
      setOpenTimeModal(true);
      return;
    }

    try {
      attendanceApi.update(attendanceId, {
        attendance_id: attendanceId,
        employee_id: employeeId,
        site_id: payload.site_id,
        site_name: payload.site_name,
        status: "WORKING",
        work_date: workDate,
      });

      const realSegment = await segmentApi.create(payload);
      const segmentData = realSegment.data?.data ?? realSegment.data;

      setSegments(prev =>
        prev.map(s =>
          s.segment_id === tempId ? (segmentData ?? s) : s
        )
      );

      setTempSegment(payload);
    } catch (err) {
      console.error("Failed to create segment:", err);
      setSegments(prev =>
        prev.filter(s => s.segment_id !== tempId)
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white w-full max-w-sm h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Select Site
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
          {sites?.map((site, index) => (
            <ActionCard
              key={index}
              icon={MapPin}
              name={site.site_name}
              onClick={() => handleSelectSite(site)}
            />
          ))}
        </div>

        {selectedSegment === 'TRAVEL' && (
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleSkip}
              className="w-full py-3 text-green-500 font-semibold rounded-lg hover:text-green-700"
            >
              Skip (No Site)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationModal;