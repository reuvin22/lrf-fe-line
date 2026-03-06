import React from 'react';
import { X } from 'lucide-react';

function ConfirmationModal({ message, onConfirm, onCancel }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel || (() => {})}
      />

      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Confirmation</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-6 text-gray-700">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;