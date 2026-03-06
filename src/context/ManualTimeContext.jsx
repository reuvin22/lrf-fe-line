import React, { createContext, useContext, useState } from "react";

export const ManualTimeContext = createContext();

export const ManualTimeProvider = ({ children }) => {
  const [selectedTime, setSelectedTime] = useState("");
  const [openTimeModal, setOpenTimeModal] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  return (
    <ManualTimeContext.Provider
      value={{
        selectedTime,
        setSelectedTime,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        openTimeModal,
        setOpenTimeModal,
      }}
    >
      {children}
    </ManualTimeContext.Provider>
  );
};

export const useManualTimeContext = () => useContext(ManualTimeContext);