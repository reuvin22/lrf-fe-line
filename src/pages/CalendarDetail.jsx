import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import Button from "../components/Button";
import ManualTimeModal from "../components/ManualTime";
import SubContractorModal from "../components/Modals/SubContractorModal";
import TransportationExpenseModal from "../components/Modals/TransportationExpenseModal";
import { useManualTimeContext } from "../context/ManualTimeContext";
import SegmentModal from "../components/Modals/SegmentModal";
import { useSegmentContext } from "../context/SegmentContext";
import formattedDate from "../utils/formattedDate";

function CalendarDetail() {
  const navigate = useNavigate();
  const { year, month, day } = useParams();

  const displayDate = formattedDate(year, month, day);
  const { setOpenTimeModal } = useManualTimeContext();

  const [openSubcontractorModal, setOpenSubcontractorModal] = useState(false);
  const [openTransportModal, setOpenTransportModal] = useState(false);
  const { openSegmentModal, setOpenSegmentModal } = useSegmentContext();

  const sites = ["Site A", "Site B", "Site C"];

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
          <h2 className="font-semibold text-xl">{displayDate}</h2>
          <p className="text-green-600 text-sm">Status: Entered</p>
        </div>

        {/* SEGMENTS */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start">
          <div>
            <h3 className="font-semibold">09:00-10:30 Travel</h3>
            <p className="text-gray-500 text-sm">→ Site A</p>
          </div>
          <Pencil
            size={16}
            className="text-gray-500 cursor-pointer"
            onClick={() => setOpenTimeModal(true)}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start">
          <div>
            <h3 className="font-semibold">10:30-17:00 Site</h3>
            <p className="text-gray-500 text-sm">Site A</p>
          </div>
          <Pencil
            size={16}
            className="text-gray-500 cursor-pointer"
            onClick={() => setOpenTimeModal(true)}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start">
          <div>
            <h3 className="font-semibold">17:00-18:00 Travel</h3>
            <p className="text-gray-500 text-sm">→ (unspecified)</p>
          </div>
          <Pencil
            size={16}
            className="text-gray-500 cursor-pointer"
            onClick={() => setOpenTimeModal(true)}
          />
        </div>

        {/* SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex justify-between">
            <span>Actual</span>
            <span className="font-semibold">7h 30m (after break)</span>
          </div>

          <div className="flex justify-between">
            <span>Overtime</span>
            <span className="font-semibold">0h</span>
          </div>

          <hr />

          <div className="flex justify-between">
            <span>Transport</span>
            <span className="font-semibold">¥580</span>
          </div>

          <hr />

          <div>
            <span>Subcontractors</span>
            <p className="text-sm mt-1">○○ Elect. 3 ppl 09:00-17:30</p>
          </div>
        </div>

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
          onClick={() => setOpenTransportModal(true)}
        />

        <Button
          buttonStyle="primary"
          text="Edit Subcontractor"
          customButton="bg-lime-500"
          onClick={() => setOpenSubcontractorModal(true)}
        />

      </div>

      {/* MODALS */}
      <ManualTimeModal />

      <SubContractorModal
        open={openSubcontractorModal}
        setOpen={setOpenSubcontractorModal}
      />

      <TransportationExpenseModal
        open={openTransportModal}
        setOpen={setOpenTransportModal}
        sites={sites}
      />

      <SegmentModal />
    </div>
  );
}

export default CalendarDetail;