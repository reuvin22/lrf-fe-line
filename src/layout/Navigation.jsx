import React from 'react'

function Navigation() {
  return (
    <div className="bg-white border-t h-20 flex justify-around items-center text-sm">

      <div className="flex flex-col items-center text-green-600">
        <span>🏠</span>
        <span>Today</span>
      </div>

      <div className="flex flex-col items-center text-gray-500">
        <span>📅</span>
        <span>Input / Edit</span>
      </div>

      <div className="flex flex-col items-center text-gray-500">
        <span>📊</span>
        <span>Status</span>
      </div>

      {/* <div className="flex flex-col items-center text-gray-500">
        <span>📷</span>
        <span>OCR</span>
      </div>

      <div className="flex flex-col items-center text-gray-500">
        <span>📖</span>
        <span>Manual</span>
      </div> */}

    </div>
  )
}

export default Navigation