import React from "react";
import { useNavigate } from "react-router-dom";
import ExpenseTable from "../OtherExpense/ExpenseTable";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faFileAlt,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

const COLORS = ["#0E4351", "#971C8A", "#6B4BB0"];

const data1 = [
  { name: "Total", value: 1770 },
  { name: "Refunded", value: 650 },
  { name: "Pending", value: 1170 },
];

const data2 = [
  { name: "Total", value: 2000 },
  { name: "Other Expense", value: 1000 },
  { name: "Regular Expense", value: 1000 },
];

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    // Container fixed and full screen to overlay
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50 p-4">

      {/* Profile Card */}
      <div className="bg-blue-50 rounded-2xl shadow-xl flex max-w-6xl w-full h-[90vh] overflow-hidden">
        {/* Sidebar */}
        <div className="bg-cyan-900 text-white w-64 rounded-l-2xl p-6 flex flex-col items-center">
          <button
            className="self-start mb-4 text-white hover:text-gray-300"
            onClick={() => navigate("/")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
          </button>
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="User"
            className="w-24 h-24 rounded-full mb-4"
          />
          <h2 className="text-xl font-semibold">Paramesh</h2>
          <p className="text-sm mb-6">28/07/2000 (25)</p>
          <div className="bg-cyan-900 text-white w-64 rounded-l-2xl p-6 flex flex-col items-center justify-center"></div>
          <ul className="w-full text-left space-y-4">
            <li className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <FontAwesomeIcon icon={faUser} />
              Personal Info
            </li>
            <li className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <FontAwesomeIcon icon={faFileAlt} />
              My Expense
            </li>
            <li className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-1 ml-6 overflow-auto p-6">
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold mb-4">Expense Summary</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data1}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {data1.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold mb-4">Category Summary</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data2}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                  >
                    {data2.map((entry, index) => (
                      <Cell
                        key={`cell2-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Table */}
          <div
            className="bg-white rounded-xl p-4 shadow overflow-auto"
            style={{ maxHeight: "40vh" }}
          >
            <ExpenseTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
