import React from 'react'
import Button from '../components/Button'

function Layout() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-green-600 text-white p-6">
        <p className="text-sm">Thursday</p>
        <h1 className="text-2xl font-bold">March 5, 2026</h1>

        <div className="mt-3 inline-flex items-center bg-green-500 px-3 py-1 rounded-full text-sm">
          ● Working
        </div>
      </div>


      <div className="p-4 space-y-4">
        <div className="bg-gray-200 rounded-xl p-4">
          <p className="font-semibold">09:00 – 10:30</p>
          <p className="text-sm text-gray-600">Travel</p>
          <p className="text-sm text-gray-500">→ Site A - Shinjuku Tower</p>
        </div>

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

        <Button buttonStyle="secondary" text="End Segment" customButton="border border-green-500 text-green-500"/>
        <Button buttonStyle="secondary" text="+ Add Segment (Manual)"/>
        <Button buttonStyle="danger" text="End Work"/>

      </div>

    </div>
  )
}

export default Layout