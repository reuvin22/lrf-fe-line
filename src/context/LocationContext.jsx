import React, { createContext, useContext, useState } from 'react';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');

  return (
    <LocationContext.Provider
      value={{
        openLocationModal,
        setOpenLocationModal,
        selectedSite,
        setSelectedSite
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);