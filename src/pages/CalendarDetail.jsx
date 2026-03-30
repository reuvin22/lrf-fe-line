import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import Button from "../components/Button";
import ManualTimeModal from "../components/Modals/ManualTime";
import SubContractorModal from "../components/Modals/SubContractorModal";
import TransportationExpenseModal from "../components/Modals/TransportationExpenseModal";
import SegmentModal from "../components/Modals/SegmentModal";
import EditSegmentModal from "../components/Modals/EditSegmentModal";

import { useManualTimeContext } from "../context/ManualTimeContext";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useSegmentContext } from "../context/SegmentContext";

import {
  constructionSiteApi,
  segmentApi,
  sitesApi,
  siteSubContractorApi,
  subContractorApi,
  transportationExpensesApi,
} from "../api/Api";

import formattedDate from "../utils/formattedDate";
import { formattedTime } from "../utils/formattedTime";
import formatWorkDate from "../utils/formatWorkDate";
import CONSTANTS from "../constants/Constants";

function CalendarDetail() {
  const SITE_OPTIONS = CONSTANTS.SITE_OPTIONS
  const navigate = useNavigate();
  const { attendanceCalendar } = useAttendanceContext();
  const { year, month, day } = useParams();

  const displayDate = formattedDate(year, month, day);

  const { setOpenTimeModal } = useManualTimeContext();
  const { setOpenSegmentModal } = useSegmentContext();

  const [openSubcontractorModal, setOpenSubcontractorModal] = useState(false);
  const [openTransportModal, setOpenTransportModal] = useState(false);

  const [openEditSegmentModal, setOpenEditSegmentModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [constructionSites, setConstructionSites] = useState([]);
  const [siteSubcontractor, setSiteSubcontractor] = useState([]);
  const [subContractor, setSubContractor] = useState([]);
  const attendanceRaw = attendanceCalendar?.[0];
  
  const attendance = useMemo(() => {
    if (!attendanceRaw) return null;

    return {
      ...attendanceRaw,
      attendance_id: attendanceRaw.attendance_id || attendanceRaw.id
    };
  }, [attendanceRaw]);

  const [localSegments, setLocalSegments] = useState([]);

  useEffect(() => {
    if (attendance?.segments) {
      setLocalSegments(attendance.segments);
    }
  }, [attendance]);

  useEffect(() => {
    const fetchConstructionSites = async () => {
      try {
        const res = await sitesApi.getAll();

        console.log("Construction Sites:", res.data.data);

        setConstructionSites(res?.data.data || []);
      } catch (err) {
        console.error("Failed to fetch construction sites:", err);
      }
    };

    fetchConstructionSites();
  }, []);

  useEffect(() => {
    const fetchSiteSubcontractor = async () => {
      try {
        const res = await siteSubContractorApi.getAll();

        console.log("Construction Sites:", res.data.data);

        setSiteSubcontractor(res?.data.data || []);
      } catch (err) {
        console.error("Failed to fetch construction sites:", err);
      }
    };

    fetchSiteSubcontractor();
  }, []);

  useEffect(() => {
    const fetchSubcontractor = async () => {
      try {
        const res = await subContractorApi.getAll();

        console.log("Subcontractor Sites:", res.data.data);

        setSubContractor(res?.data.data || []);
      } catch (err) {
        console.error("Failed to fetch Subcontractor sites:", err);
      }
    };

    fetchSubcontractor();
  }, []);

  const segments = localSegments;
  const hasData = segments.length > 0;

  const sites = ["Site A", "Site B", "Site C"];

  const [localExpenses, setLocalExpenses] = useState([]);

  const fetchUpdatedTransportExpenses = async () => {
    if (!attendance) return;

    try {
      const res = await transportationExpensesApi.getAll({
        attendance_id: attendance.attendance_id
      });

      const updatedExpenses = res?.data?.data || [];
      setLocalExpenses(updatedExpenses);
    } catch (err) {
      console.error("Failed to refetch transportation expenses:", err);
    }
  };

  useEffect(() => {
    if (attendance) {
      fetchUpdatedTransportExpenses();
    }
  }, [attendance]);

  const totalTransportAmount = useMemo(() => {
    return localExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [localExpenses]);

  const totalHours = useMemo(() => {
    if (!segments.length) return "0h 0m 0s";

    let totalMs = 0;

    segments.forEach((seg) => {
      if (seg.start_time && seg.end_time) {
        const start = new Date(seg.start_time);
        const end = new Date(seg.end_time);

        if (end > start) {
          totalMs += end - start;
        }
      }
    });

    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }, [segments]);

  const handleEditSegment = (seg) => {
    setSelectedSegment(seg);
    setOpenEditSegmentModal(true);
  };

  const handleSaveSegment = async (payload) => {
    try {
      await segmentApi.update(payload.segment_id, payload);

      setLocalSegments((prev) =>
        prev.map((seg) =>
          seg.segment_id === payload.segment_id
            ? {
                ...seg,
                ...payload
              }
            : seg
        )
      );

      setOpenEditSegmentModal(false);
    } catch (err) {
      console.error("Failed to update segment", err);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Input / Edit</span>
      </div>

      <div className="p-4 space-y-4">
        <button
          onClick={() => navigate("/calendar")}
          className="text-green-600 text-sm cursor-pointer"
        >
          ← Back to Calendar
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-xl">
            {attendance?.work_date
              ? formatWorkDate(attendance.work_date)
              : displayDate}
          </h2>

          <div className="flex items-center gap-2">
            <span>Status:</span>
            <span
              className={`text-sm ${
                !hasData ? "text-red-600" : "text-green-600"
              }`}
            >
              {!hasData ? "Empty" : "Entered"}
            </span>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center text-gray-500 py-10">
            No Data Available
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {segments.map((seg) => {
                const start = formattedTime(seg.start_time);
                const end = formattedTime(seg.end_time);

                return (
                  <div
                    key={seg.segment_id}
                    onClick={() => handleEditSegment(seg)}
                    className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start cursor-pointer hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {start && end ? `${start}-${end}` : start}{" "}
                        {seg.segment_type}
                      </h3>

                      <p className="text-gray-500 text-sm">
                        {seg.segment_type === "TRAVEL"
                          ? `→ ${seg.site_name || seg.site_id || "(unspecified)"}`
                          : seg.site_name || seg.site_id || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex justify-between">
                <span>Actual</span>
                <span className="font-semibold">{totalHours}</span>
              </div>

              <div className="flex justify-between">
                <span>Overtime</span>
                <span className="font-semibold">0h</span>
              </div>

              <hr />

              <div className="flex justify-between">
                <span>Transport</span>
                <span className="font-semibold">
                  ¥{totalTransportAmount.toLocaleString()}
                </span>
              </div>

              <hr />

              <div>
                <span>Subcontractors</span>
                <p className="text-sm mt-1">○○ Elect. 3 ppl 09:00-17:30</p>
              </div>
            </div>

            {/* Actions */}
            <Button
              buttonStyle="primary"
              text={
                <div className="flex justify-center items-center gap-2">
                  <Plus size={18} />
                  Add Segment
                </div>
              }
              onClick={() => setOpenSegmentModal(true)}
            />

            <Button
              buttonStyle="primary"
              text="Edit Transport"
              customButton="bg-lime-500"
              onClick={() => navigate('/transportation-expenses')}
            />

            <Button
              buttonStyle="primary"
              text="Edit Subcontractor"
              customButton="bg-lime-500"
              onClick={() => navigate('/subcontractor')}
            />
          </>
        )}
      </div>

      <ManualTimeModal />

      {/* <SubContractorModal
        open={openSubcontractorModal}
        setOpen={setOpenSubcontractorModal}
        sites={SITE_OPTIONS}
        expenses={localExpenses}
        attendanceId={attendance?.attendance_id}
        onRefetch={fetchUpdatedTransportExpenses}
        employeeId={attendance.employee_id}
        openTransportModalParent={setOpenTransportModal}
        constructionSite={constructionSites}
        siteSubcontractor={siteSubcontractor}
        subContractor={subContractor}
      />

      <TransportationExpenseModal
        open={openTransportModal}
        setOpen={setOpenTransportModal}
        sites={SITE_OPTIONS}
        expenses={localExpenses}
        attendanceId={attendance?.attendance_id}
        onRefetch={fetchUpdatedTransportExpenses}
        employeeId={attendance.employee_id}
      /> */}

      <SegmentModal />

      <EditSegmentModal
        open={openEditSegmentModal}
        onClose={() => setOpenEditSegmentModal(false)}
        segmentData={selectedSegment}
        segments={["OFFICE", "SITE", "TRAVEL"]}
        sites={constructionSites}
        onSave={handleSaveSegment
        }
      />
    </div>
  );
}

export default CalendarDetail;