import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Home')

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Navbar 
        toggleSidebar={toggleSidebar}
        title={activeTab}
      />
      <main className="lg:ml-64 p-4 transition-all duration-300 mt-15 md:mt-14">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout