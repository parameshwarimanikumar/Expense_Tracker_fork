import React from 'react'
import {faIndianRupeeSign} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Card = () => {
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 flex flex-col lg:flex-row gap-4">

      <div className="relative md:w-64 ">
        <div className=" bg-linear-to-bl from-violet-500 to-fuchsia-500 h-60 md:h-full md:w-50 p-4 md:p-6 rounded-lg flex flex-col items-center justify-center text-center">
          <h1 className="text-white font-bold text-xl md:text-lg mb-2 w-full tracking-wide">Today Expense</h1>
          <h1 className="text-white font-bold text-xl md:text-lg"><FontAwesomeIcon icon={faIndianRupeeSign} /> 1000</h1>
        </div>
        <span className="absolute -right-2 top-1/2 transform -translate-y-1/2 h-full w-0.5 bg-[#d4d4d4] rounded hidden lg:block"></span>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-[3] place-items-center">
        
        <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-4 md:p-6 h-50 w-full md:h-full md:w-50 rounded-lg flex flex-col items-center justify-center text-center">
          <h1 className="text-white font-bold text-xl md:text-lg mb-2 w-full">Monthly Regular Expense</h1>
          <h1 className="text-white font-bold text-xl md:text-lg"><FontAwesomeIcon icon={faIndianRupeeSign}/> 1000</h1>
        </div>

        
        <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-4 md:p-6 h-50 w-full md:h-full md:w-50 rounded-lg flex flex-col items-center justify-center text-center">
          <h1 className="text-white font-bold text-xl md:text-lg mb-2 w-full">Monthly Other Expense</h1>
          <h1 className="text-white font-bold text-xl md:text-lg"><FontAwesomeIcon icon={faIndianRupeeSign} /> 1000</h1>
        </div>

        
        <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-4 md:p-6 h-50 w-full md:h-full md:w-50 rounded-lg flex flex-col items-center justify-center text-center">
          <h1 className="text-white font-bold text-xl md:text-lg mb-2 w-full ">Total Expense</h1>
          <h1 className="text-white font-bold text-xl md:text-lg"><FontAwesomeIcon icon={faIndianRupeeSign}/> 1000</h1>
        </div>
      </div>
    </div>
  )
}

export default Card

