import React, { createContext, useContext, useState } from 'react';
import environment from '../environment';

export const LocationContext = createContext();

// Dev-only stand-in so pages that need an assigned site/location have
// something to work with when testing without a real LIFF/backend assignment.
export const MOCK_SITE = { site_id: "3f1a9c2e-6b4d-4e7a-9c3f-8d2b5a6e1f0c", site_name: 'Dev Test Site' };

export const LocationProvider = ({ children }) => {
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(() =>
    environment.VITE_LIFF_ENABLED ? '' : MOCK_SITE.site_id
  );
  const [sites, setSites] = useState(() =>
    environment.VITE_LIFF_ENABLED ? [] : [MOCK_SITE]
  );
  return (
    <LocationContext.Provider
      value={{
        sites,
        setSites,
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