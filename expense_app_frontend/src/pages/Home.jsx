import React from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/HomeComponents/Card';
import RecentTable from '../components/HomeComponents/RecentTable';

const Home = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <Card />

          {/* Recent Entries and Add Item side-by-side */}
          <RecentTable />
        </main>
      </div>
    </div>
  );
};

export default Home;
