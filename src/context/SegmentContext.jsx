import React, { createContext, useContext, useState } from "react";

export const SegmentContext = createContext();

export const SegmentProvider = ({ children }) => {
  const [selectedSegment, setSelectedSegment] = useState("");
  const [startSegment, setStartSegment] = useState(false);
  const [openSegmentModal, setOpenSegmentModal] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [recordType, setRecordType] = useState("");
  const [dayEnded, setDayEnded] = useState(false);
  const [tempSegment, setTempSegment] = useState(null);
  const [segments, setSegments] = useState([]);

  return (
    <SegmentContext.Provider
      value={{
        recordType,
        setRecordType,
        selectedSegment,
        setSelectedSegment,
        startSegment,
        setStartSegment,
        openSegmentModal,
        setOpenSegmentModal,
        openLocationModal,
        setOpenLocationModal,
        tempSegment,
        setTempSegment,
        segments,
        setSegments,
        dayEnded,
        setDayEnded
      }}
    >
      {children}
    </SegmentContext.Provider>
  );
};

export const useSegmentContext = () => useContext(SegmentContext);