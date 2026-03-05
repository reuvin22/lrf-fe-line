import React from 'react'

function Layout() {
  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="bg-green-600 text-white p-6">
        <p className="text-sm">Thursday</p>
        <h1 className="text-2xl font-bold">March 5, 2026</h1>

        <div className="mt-3 inline-flex items-center bg-green-500 px-3 py-1 rounded-full text-sm">
          ● Working
        </div>
      </div>


      <div className="p-4 space-y-4">

        {/* Travel Segment */}
        <div className="bg-gray-200 rounded-xl p-4">
          <p className="font-semibold">09:00 – 10:30</p>
          <p className="text-sm text-gray-600">Travel</p>
          <p className="text-sm text-gray-500">→ Site A - Shinjuku Tower</p>
        </div>


        {/* Current Segment */}
        <div className="bg-white border-2 border-green-400 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">10:30 –</p>
            <p className="text-sm text-gray-600">On Site</p>
            <p className="text-sm text-gray-500">→ Site A - Shinjuku Tower</p>
          </div>

          <div className="bg-red-100 text-red-500 text-sm px-3 py-1 rounded-full">
            ● Recording
          </div>
        </div>


        {/* End Segment Button */}
        <button className="w-full border border-green-500 text-green-600 py-3 rounded-xl font-semibold">
          End Segment
        </button>


        {/* Add Segment */}
        <button className="w-full bg-gray-200 py-3 rounded-xl font-semibold">
          + Add Segment (Manual)
        </button>


        {/* End Work */}
        <button className="w-full bg-red-600 text-white py-4 rounded-xl font-bold">
          End Work
        </button>

      </div>

    </div>
  )
}

export default Layout