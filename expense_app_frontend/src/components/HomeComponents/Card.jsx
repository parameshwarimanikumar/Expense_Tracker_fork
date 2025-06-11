import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import dayjs from "dayjs";

const Card = () => {
  const [monthlyRegular, setMonthlyRegular] = useState("0.00");
  const [monthlyOther, setMonthlyOther] = useState("0.00");
  const [todayTotal, setTodayTotal] = useState("0.00");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const currentMonth = dayjs().format("YYYY-MM");
      const todayDate = dayjs().format("YYYY-MM-DD");

      let todayExpense = 0;
      let otherTotal = 0;
      let regTotal = 0;

      // 🔹 Fetch OTHER EXPENSES
      try {
        const res = await axios.get("http://localhost:8000/api/expenses/", {
          headers,
        });

        const data = res.data || [];

        otherTotal = data.reduce((sum, exp) => {
          const expMonth = dayjs(exp.date).format("YYYY-MM");
          const expDate = dayjs(exp.date).format("YYYY-MM-DD");
          const amt = parseFloat(exp.amount);

          if (!isNaN(amt)) {
            if (expMonth === currentMonth) sum += amt;
            if (expDate === todayDate) todayExpense += amt;
          }
          return sum;
        }, 0);

        setMonthlyOther(otherTotal.toFixed(2));
      } catch (err) {
        console.error("Error fetching other expenses:", err);
      }

      // 🔹 Fetch REGULAR EXPENSES
      try {
        const regRes = await axios.get(
          "http://localhost:8000/api/orders/grouped-by-date/",
          {
            headers,
            params: { month: currentMonth },
          }
        );

        const grouped = regRes.data.results || {};

        Object.entries(grouped).forEach(([date, items]) => {
          items.forEach((item) => {
            const itemTotal = item.count * item.price;
            regTotal += itemTotal;
            if (date === todayDate) {
              todayExpense += itemTotal;
            }
          });
        });

        setMonthlyRegular(regTotal.toFixed(2));
        setTodayTotal(todayExpense.toFixed(2));
      } catch (err) {
        console.error("Error fetching regular expenses:", err);
      }
    };

    fetchData();
  }, []);

  const totalExpense = (
    parseFloat(monthlyRegular || 0) + parseFloat(monthlyOther || 0)
  ).toFixed(2);

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 flex flex-col lg:flex-row gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
        {[
          { title: "Today's Expense", value: todayTotal },
          { title: "Monthly Regular Expense", value: monthlyRegular },
          { title: "Monthly Other Expense", value: monthlyOther },
          { title: "Total Monthly Expense", value: totalExpense },
        ].map(({ title, value }, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: "#124451" }}
          >
            <h1 className="text-white font-bold text-lg mb-2 w-full">
              {title}
            </h1>
            <h1 className="text-white font-bold text-xl">
              <FontAwesomeIcon icon={faIndianRupeeSign} /> {value}
            </h1>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;
