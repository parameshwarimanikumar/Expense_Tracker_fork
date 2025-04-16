
import React from 'react'
import Avatar from '../../assets/Avatar.png' 
import { Bars3Icon } from '@heroicons/react/24/outline'
import {faBell} from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Navbar = ({ toggleSidebar, title }) => {
  return (
    <div className="fixed top-0 right-0 left-0 md:left-64 bg-white md:bg-[rgba(244,247,254,1)] z-40">
      <div className="px-4 py-3 flex justify-between items-center">
        <h1 className='text-2xl text-[#124451] hidden font-semibold md:block'>{title}</h1>

        <div className="flex items-center gap-3">
          <button className="text-xl md:hidden" onClick={toggleSidebar}>
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
        </div>
        
        <div className="flex items-center gap-6 bg-white rounded-full px-6 py-2">
          <FontAwesomeIcon icon={faBell} className='text-gray-600 cursor-pointer' />
          <img src={Avatar} alt="Avatar" className="w-8 h-8 rounded-full cursor-pointer"/>
        </div>
      </div>
    </div>
  )
}

export default Navbar