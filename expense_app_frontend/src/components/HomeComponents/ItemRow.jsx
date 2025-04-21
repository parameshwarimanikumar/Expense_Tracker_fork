import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

const ItemRow = ({ item, index, updateItem, deleteItem, allItems, editMode }) => {
  const [price, setPrice] = useState(item.price || 0);
  const [total, setTotal] = useState(item.total || 0);

  useEffect(() => {
    // Find the matching item from allItems
    const matched = allItems.find((i) => i.id === item.item_id || i.item_name === item.item_name);
    
    if (matched) {
      const newPrice = parseFloat(matched.item_price);
      const newTotal = item.count * newPrice;
      
      setPrice(newPrice);
      setTotal(newTotal);
      updateItem(index, { 
        ...item, 
        price: newPrice, 
        total: newTotal,
        item_id: matched.id
      });
    }
  }, [item.item_name, item.count, allItems, index, item, updateItem]);

  // item price fetching based on selection
  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };
    
    // If changing the item name, find and set the new price
    if (field === 'item_name') {
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
    <tr className="text-sm">
      <td className="p-2">
        <select
          className="border border-gray-200 px-2 py-1 rounded-full w-30"
          value={item.item_name}
          onChange={(e) => handleChange("item_name", e.target.value)}
          disabled={editMode && item.id}  // ✅ disable only for existing items
        >
          <option value="">Select</option>
          {allItems.map((itm) => (
            <option key={itm.id} value={itm.item_name}>
              {itm.item_name}
            </option>
          ))}
        </select>
      </td>

      <td className="p-2">
        <input
          type="number"
          min="1"
          value={item.count}
          className="border border-gray-200 px-2 py-1 rounded w-15"
          onChange={(e) => handleChange("count", parseInt(e.target.value) || 1)}
        />
      </td>

      <td className="p-2 text-center">₹ {price.toFixed(2)}</td>

      <td className="p-2 text-center font-semibold">₹{total.toFixed(2)}</td>

      <td className="p-2 text-center">
        <button
          onClick={() => deleteItem(index)}
          className="text-red-500 hover:text-red-700 cursor-pointer"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default ItemRow;
