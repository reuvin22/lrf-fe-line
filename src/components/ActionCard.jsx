import React from 'react'

function ActionCard({ icon: Icon, name, description, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center p-4 mb-3 border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-left cursor-pointer"
    >
      <div className="bg-emerald-50 p-3 rounded-xl mr-4 flex items-center justify-center">
        <Icon size={24} className="text-emerald-500" strokeWidth={2} />
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight">{name}</h3>
        <p className="text-gray-400 text-sm font-medium">{description}</p>
      </div>
    </button>
  )
}

export default ActionCard