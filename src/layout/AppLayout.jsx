import React from "react";
import { Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-1 max-w-md mx-auto w-full">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;