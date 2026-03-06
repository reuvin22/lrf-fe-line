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
    <div className="max-w-md mx-auto">
      <div className="bg-green-600 text-white p-6">
        <p className="text-sm">Thursday</p>
        <h1 className="text-2xl font-bold">March 5, 2026</h1>
        {startSegment && (
          <div className="mt-3 inline-flex items-center bg-green-500 px-3 py-1 rounded-full text-sm">
            ● Working
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {endTime && (
          <div className="bg-gray-200 rounded-xl p-4 flex items-center gap-2">
            {getSegmentIcon(selectedSegment)}
            <div>
              <p className="font-semibold">{startTime} – {endTime}</p>
              <p className="text-sm text-gray-600">{selectedSegment}</p>
              {selectedSegment !== "Office" && (
                <p className="text-sm text-gray-500">{`→ ${selectedSite || 'No Selected Site'}`}</p>
              )}
            </div>
          </div>
        )}

        {startSegment && (
          <div className="bg-white border-2 border-green-400 rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getSegmentIcon(selectedSegment)}
              <div>
                <p className="font-semibold">
                  {startTime}
                  {endTime ? ` – ${endTime}` : ''}
                </p>
                <span className="text-sm text-gray-600"> {selectedSegment}</span>
                {selectedSegment !== "Office" && (
                  <p className="text-sm text-gray-500">{`→ ${selectedSite || 'No Selected Site'}`}</p>
                )}
              </div>
            </div>

            <div className="bg-red-100 text-red-500 text-sm px-3 py-1 rounded-full">
              ● Recording
            </div>
          </div>
        )}

        <Button
          buttonStyle={startSegment ? "secondary" : "active"}
          text={startSegment ? "End Segment" : "Segment Start"}
          customButton={startSegment ? "border border-red-600 text-red-600" : ""}
          onClick={() => handleSegment('default')}
        />

        <Button
          buttonStyle="secondary"
          text="+ Add Segment (Manual)"
          onClick={() => handleSegment('manual')}
        />

        <Button
          buttonStyle="danger"
          text="End Work"
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