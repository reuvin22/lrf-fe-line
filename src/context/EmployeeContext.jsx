import React, { createContext, useContext, useState } from "react";

export const AttendanceContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);

  return (
    <EmployeeProviderContext.Provider
      value={{
        employee,
        setEmployee,
        employeeLoading,
        setEmployeeLoading,
        employeeError,
        setEmployeeError,
      }}
    >
      {children}
    </EmployeeProviderContext.Provider>
  );
};

export const useEmployeeProviderContext = () => useContext(EmployeeProviderContext);