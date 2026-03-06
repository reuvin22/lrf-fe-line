import React from 'react';
import { X, Car, MapPin, Building2 } from 'lucide-react';
import ActionCard from './ActionCard';
import { useSegmentContext } from '../context/SegmentContext';
import { useManualTimeContext } from '../context/ManualTimeContext';
import { useLocationContext } from '../context/LocationContext';

function SegmentModal() {
  const {
    setSelectedSegment,
    setStartSegment,
    openSegmentModal,
    setOpenSegmentModal,
    setOpenLocationModal,
    recordType
  } = useSegmentContext();

  const {
    setSelectedSite
  } = useLocationContext()
  const {
    setOpenTimeModal
  } = useManualTimeContext()

  if (!openSegmentModal) return null;

  const options = [
    { name: "Travel", description: "Movement between sites", icon: Car },
    { name: "Site", description: "Construction site work", icon: MapPin },
    { name: "Office", description: "Office work", icon: Building2 },
  ];

  const handleSelect = (segmentName) => {
    setSelectedSegment(segmentName);

    if (segmentName === "Office") {
      if (recordType === 'manual') {
        setOpenSegmentModal(false);
        setOpenTimeModal(true);
      } else {
        setStartSegment(true);
        setSelectedSite('')
        setOpenSegmentModal(false);
      }
    } else {
      setOpenSegmentModal(false);
      setOpenLocationModal(true);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpenSegmentModal(false)}
      />
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6">
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
              onClick={() => handleSelect(opt.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SegmentModal;