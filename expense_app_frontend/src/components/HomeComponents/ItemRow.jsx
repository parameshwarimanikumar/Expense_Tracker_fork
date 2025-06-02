import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";

const ItemRow = ({ item, index, updateItem, deleteItem, allItems = [], editMode }) => {
  const [price, setPrice] = useState(item.price || 0);
  const [total, setTotal] = useState(item.total || 0);

 useEffect(() => {
  const matchedByName = allItems.find((i) => i.item_name === item.item_name);
  const matchedById = allItems.find((i) => i.id === item.item_id);
  const matched = matchedByName || matchedById;

  if (matched) {
    const newPrice = parseFloat(matched.item_price);
    const newTotal = item.count * newPrice;
    setPrice(newPrice);
    setTotal(newTotal);
    updateItem(index, {
      ...item,
      price: newPrice,
      total: newTotal,
      item_id: matched.id,
      item_name: matched.item_name,
    });
  }
}, [item, allItems, index, updateItem]);


  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };

    if (field === "item_name") {
      const matched = allItems.find((i) => i.item_name === value);
      if (matched) {
        updated.price = matched.item_price;
        updated.item_id = matched.id;
      }
    }

    const newTotal = updated.count * (updated.price || 0);
    setTotal(newTotal);
    updateItem(index, { ...updated, total: newTotal });
  };

  return (
    <tr className="text-[#1e2a52] border-t border-gray-200 text-sm">
      <td className="py-3 text-center">
        <select
          className="border border-gray-300 rounded-full px-3 py-1 text-sm w-32 focus:outline-none"
          value={
            item.item_name || allItems.find((i) => i.id === item.item_id)?.item_name || ""
          }
          onChange={(e) => handleChange("item_name", e.target.value)}
          disabled={editMode && item.id}
        >
          <option value="">Select</option>
          {(allItems || []).map((itm) => (
            <option key={itm.id} value={itm.item_name}>
              {itm.item_name}
            </option>
          ))}
        </select>
      </td>

      <td className="py-3 text-center">
        <input
          type="number"
          min="1"
          value={item.count}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center focus:outline-none"
          onChange={(e) => handleChange("count", parseInt(e.target.value) || 1)}
        />
      </td>

      <td className="py-3 text-center">₹ {price.toFixed(2)}</td>
      <td className="py-3 text-center font-semibold">₹ {total.toFixed(2)}</td>
      <td className="py-3 text-center">
        <button
          onClick={() => deleteItem(index)}
          className="text-red-500 hover:text-red-700"
        >
          <FaTrash size={14} />
        </button>
      </td>
    </tr>
  );
};

export default ItemRow;
