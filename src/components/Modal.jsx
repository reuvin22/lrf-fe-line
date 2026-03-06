import React from 'react'
import LocationModal from './SegmentModal'

function Modal({ isOpen, onClose }) {
  return (
    <LocationModal
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

export default Modal