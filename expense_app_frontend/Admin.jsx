// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const monthlyData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    regularExpenses: [252, 420, 256, 221, 338, 176, 252, 271, 364, 229, 242, 301],
    otherExpenses: [180, 199, 102, 51, 137, 285, 207, 87, 179, 241, 227, 70]
  };

  useEffect(() => {
    const chartDom = document.getElementById('expenses-chart');
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      const option = {
        animation: false,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: function (params) {
            const regularValue = params[0].value;
            const otherValue = params[1].value;
            const total = regularValue + otherValue;
            return `${params[0].name}<br/>Regular Expenses: ₹${regularValue}<br/>Other Expenses: ₹${otherValue}<br/>Total: ₹${total}`;
          }
        },
        legend: {
          data: ['Regular Expenses', 'Other Expenses'],
          right: 10,
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: monthlyData.months,
          name: 'Month (2025)',
          nameLocation: 'middle',
          nameGap: 35
        },
        yAxis: {
          type: 'value',
          name: 'Amount (₹)',
          nameLocation: 'middle',
          nameGap: 50
        },
        series: [
          {
            name: 'Regular Expenses',
            type: 'bar',
            data: monthlyData.regularExpenses,
            itemStyle: { color: '#4285F4' }
          },
          {
            name: 'Other Expenses',
            type: 'bar',
            data: monthlyData.otherExpenses,
            itemStyle: { color: '#FF6B6B' }
          }
        ]
      };

      myChart.setOption(option);
      const handleResize = () => myChart.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        myChart.dispose();
      };
    }
  }, []);

  useEffect(() => {
    const chartDom = document.getElementById('expense-breakdown-chart');
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      const regularTotal = monthlyData.regularExpenses.reduce((a, b) => a + b, 0);
      const otherTotal = monthlyData.otherExpenses.reduce((a, b) => a + b, 0);
      const option = {
        animation: false,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: ['Regular', 'Other']
        },
        series: [
          {
            name: 'Expense Breakdown',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{c} ({d}%)'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '14',
                fontWeight: 'bold'
              }
            },
            labelLine: { show: true },
            data: [
              { value: regularTotal, name: 'Regular', itemStyle: { color: '#4285F4' } },
              { value: otherTotal, name: 'Other', itemStyle: { color: '#FF6B6B' } }
            ]
          }
        ]
      };

      myChart.setOption(option);
      const handleResize = () => myChart.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        myChart.dispose();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-56 bg-white shadow-md z-10">
        <div className="p-6">
          <h1 className="text-lg font-bold">Brillersys</h1>
        </div>
        <nav className="mt-6">
          {['dashboard', 'regular', 'other', 'update', 'history', 'logout'].map((tab) => (
            <div
              key={tab}
              className={`flex items-center px-6 py-3 cursor-pointer ${
                activeTab === tab ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="font-medium capitalize">{tab}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="ml-56 min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-8 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="fas fa-search text-gray-500"></i>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="fas fa-bell text-gray-500"></i>
              </button>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer">
                JD
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Monthly Expenses Breakdown</h2>
              <div className="flex items-center space-x-4">
                <select className="bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg">
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center">
                  <i className="fas fa-download mr-2"></i> Export
                </button>
              </div>
            </div>
            <div id="expenses-chart" className="w-full h-96"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ExpenseCard title="Regular Expense" value="₹ 3000" color="from-blue-500 to-blue-600" trend="up" percent="8.5%" />
            <ExpenseCard title="Other Expense" value="₹ 3000" color="from-red-400 to-red-500" trend="down" percent="4.2%" />
            <ExpenseCard title="Total Expense" value="₹ 6000" color="from-teal-700 to-teal-800" trend="up" percent="2.8%" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-1">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Expense Breakdown</h3>
              <div id="expense-breakdown-chart" className="w-full h-64"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  <tr>
                    <td className="px-6 py-4">Grocery Shopping</td>
                    <td className="px-6 py-4">Regular</td>
                    <td className="px-6 py-4">Apr 12, 2025</td>
                    <td className="px-6 py-4 font-medium">₹ 450</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Electricity Bill</td>
                    <td className="px-6 py-4">Regular</td>
                    <td className="px-6 py-4">Apr 10, 2025</td>
                    <td className="px-6 py-4 font-medium">₹ 850</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Restaurant Dinner</td>
                    <td className="px-6 py-4">Other</td>
                    <td className="px-6 py-4">Apr 8, 2025</td>
                    <td className="px-6 py-4 font-medium">₹ 1200</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const ExpenseCard = ({ title, value, color, trend, percent }) => (
  <div className={`bg-gradient-to-r ${color} rounded-lg shadow-sm overflow-hidden text-white`}>
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <div className="text-4xl font-bold mb-4">{value}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className={`fas fa-arrow-${trend === 'up' ? 'up' : 'down'} mr-1`}></i>
          <span>{percent} from last month</span>
        </div>
        <button className="bg-white text-sm text-blue-600 px-3 py-1 rounded-full">View Details</button>
      </div>
    </div>
  </div>
);

export default App;
