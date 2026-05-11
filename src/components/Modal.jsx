import React from 'react'
import LocationModal from './Modals/LocationModal'

function Modal({ isOpen, onClose }) {
  return (
    <LocationModal
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

export default Modal