import React from 'react'
import Sidebar from '../components/Layout/Sidebar'
import Navbar from '../components/Layout/Navbar'
import Card from '../components/HomeComponents/Card'
import RecentTable from '../components/HomeComponents/RecentTable'

const Home = () => {
  return (
    <div className="">
    
        <div className="space-y-6">
          <Card/>
          <RecentTable />
        </div>
    </div>
  )
}

export default Home