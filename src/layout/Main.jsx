import React from 'react'
import Navigation from './Navigation'
import Layout from './Layout'

function Main() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      <div className="flex-1">
        <Layout />
      </div>

      <Navigation />

    </div>
  )
}

export default Main