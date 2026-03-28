import React, { createContext, useContext, useState } from 'react';

export const TransportationExpensesContext = createContext();

export const TransportationExpensesProvider = ({ children }) => {
  const [transportationExpenses, setTransportationExpenses] = useState([]);

  return (
    <TransportationExpensesContext.Provider
      value={{
        transportationExpenses,
        setTransportationExpenses
      }}
    >
      {children}
    </TransportationExpensesContext.Provider>
  );
};

export const useTransportationExpensesContext = () => useContext(TransportationExpensesContext);