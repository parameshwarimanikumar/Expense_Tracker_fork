import React from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/HomeComponents/Card';
import AddItemTable from '../components/HomeComponents/AddItemTable';

const Home = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="space-y-6">
            {/* Summary Cards */}
            <Card />

            {/* Recent Table and Add/Edit Form */}
            <AddItemTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
