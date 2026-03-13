import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import SegmentModal from '../components/SegmentModal';
import LocationModal from '../components/LocationModal';
import { useSegmentContext } from '../context/SegmentContext';
import { useLocationContext } from '../context/LocationContext';
import { getCurrentTime } from '../utils/getCurrentTime';
import ManualTimeModal from '../components/ManualTime';
import { useManualTimeContext } from '../context/ManualTimeContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { Car, MapPin, Building2 } from 'lucide-react'; // ✅ Import icons

function Layout() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [locked, setLocked] = useState(false);

  const {
    startSegment,
    setStartSegment,
    setOpenSegmentModal,
    selectedSegment,
    setSelectedSegment,
    setRecordType,
    recordType
  } = useSegmentContext();

  const { selectedSite, setSelectedSite } = useLocationContext();
  const { startTime, setStartTime, endTime, setEndTime } = useManualTimeContext();

  const handleSegment = (type) => {
    setRecordType(type);
    if (!startSegment) {
      setSelectedSegment('');
      setOpenSegmentModal(true);
      setStartTime(getCurrentTime());
      setEndTime('');
    } else {
      setEndTime(getCurrentTime());
      setStartSegment(false);
    }
  };

  const openConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setOpenConfirm(true);
  };

  const getSegmentIcon = (segment) => {
    switch (segment) {
      case 'Travel':
        return <Car className="inline-block mr-2" size={16} />;
      case 'Office':
        return <Building2 className="inline-block mr-2" size={16} />;
      default:
        return <MapPin className="inline-block mr-2" size={16} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen">

      <div className="bg-white px-5 py-4 border-b">
        <p className="text-sm text-gray-500">Fri, Mar 13, 2026</p>

        <div className="flex items-center gap-2 mt-1">
          <span className={`font-semibold text-lg ${startSegment ? 'text-green-600' : 'text-gray-600'}`}>
            Status: {startSegment ? "Working" : "Not Started"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {endTime && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">

            <div
              className={`w-2 h-10 rounded-full ${
                selectedSegment === "Travel"
                  ? "bg-orange-400"
                  : "bg-green-500"
              }`}
            />

            <div>
              <p className="font-semibold text-gray-800">
                {startTime}–{endTime} {selectedSegment}
              </p>

              {selectedSegment !== "Office" && (
                <p className="text-sm text-gray-500">
                  → {selectedSite || "No Selected Site"}
                </p>
              )}
            </div>

          </div>
        )}

        {startSegment && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">

            <div className="flex items-center gap-4">

              <div className="w-2 h-10 bg-green-500 rounded-full" />

              <div>
                <p className="font-semibold text-gray-800">
                  {startTime}–...
                </p>

                <p className="text-sm text-gray-600">
                  {selectedSegment}
                </p>

                {selectedSegment !== "Office" && (
                  <p className="text-sm text-gray-500">
                    → {selectedSite || "No Selected Site"}
                  </p>
                )}
              </div>

            </div>

            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
              ● REC
            </span>

          </div>
        )}

        <Button
          buttonStyle={startSegment ? "danger" : "active"}
          text={startSegment ? "⏹ End Segment" : "▶ Start"}
          customButton={!startSegment ? "bg-emerald-600 hover:bg-emerald-700 text-white py-4" : ""}
          onClick={() => handleSegment('default')}
        />

        {startSegment === false && (
          <Button
            buttonStyle="secondary"
            text="+ Add Segment (manual)"
            customButton="bg-lime-500 text-white py-4 hover:bg-lime-600"
            onClick={() => handleSegment('manual')}
          />
        )}

        <Button
          buttonStyle="secondary"
          text="↪ End Work Day"
          customButton="border border-gray-300 py-4"
          onClick={() =>
            openConfirmation("Are you sure you want to end work?", () => {
              console.log("Work ended!");
              setStartSegment(false);
              setEndTime(getCurrentTime());
              setOpenConfirm(false);
            })
          }
        />

      </div>

      <SegmentModal />
      <LocationModal />
      <ManualTimeModal />

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