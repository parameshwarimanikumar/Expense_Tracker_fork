import React, { useState, useEffect } from "react";
import { FaTrash, FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance, { fetchItems, submitOrder } from "../../api_service/api";
import ItemRow from "./ItemRow";


export default function AddItemTable({ editMode, editingData, onCancel, onUpdateSuccess }) {

    const [items, setItems] = useState([{ item_name: "", count: 0, price: 0, total: 0, item_id: null }]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [allItems, setAllItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletedItemIds, setDeletedItemIds] = useState([]);


    console.log("items now",items)
  
    //Fetch items for dropdown
    useEffect(() => {
      fetchItems()
        .then(setAllItems)
        .catch(console.error);
    }, []);
  

    useEffect(() => {
      if (editMode && editingData) {
        setSelectedDate(new Date(editingData.date)); 
        const groupedItems = {};
    
        editingData.orderItems.forEach(item => {
          const datetime = new Date(item.added_date).toISOString();
          if (!groupedItems[datetime]) groupedItems[datetime] = [];
          groupedItems[datetime].push({
            ...item,
            id: item.id,
            item_name: item.item.item_name,
            item_id: item.item.id,
            price: item.item.item_price,
            total: item.count * item.item.item_price,
            added_date: item.added_date,
          });
        });
    
        const itemsWithGrouping = [];
        Object.entries(groupedItems).forEach(([date, group]) => {
          group.forEach((item, index) => {
            itemsWithGrouping.push({
              ...item,
              showDateTime: index === 0,
              groupDateTime: date,
            });
          });
        });
    
        setItems(itemsWithGrouping);
        setSelectedDate(new Date(editingData.date));
      }
    }, [editMode, editingData]);
    
    

    // const addItem = () => {
    //   setItems([
    //     ...items,
    //     {
    //       item_name: "",
    //       count: 0,
    //       price: 0,
    //       total: 0,
    //       item_id: null,
    //       added_date: selectedDate.toISOString(), // ✅ set added_date for new items
    //     }
    //   ]);
    // };
    const addItem = () => {
      setItems([
        ...items,
        {
          item_name: "",
          count: 1,
          price: 0,
          total: 0,
          item_id: null,
          added_date: selectedDate.toISOString(), // ✅ from date picker
        }
      ]);
    };
    
  
    //updateitem button

    const updateItem = (index, updatedItem) => {
      const newItems = [...items];
      newItems[index] = updatedItem;
      setItems(newItems);
    };
  
    const deleteItem = (index) => {
      const itemToDelete = items[index];
      const filtered = [...items];
      filtered.splice(index, 1);
      setItems(filtered);
    
      // If the item exists in the DB, track it for deletion
      if (itemToDelete?.id) {
        setDeletedItemIds(prev => [...prev, itemToDelete.id]);
      }
    };
    
  

    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);
    
    const handleUpdate = async () => {
      setIsSubmitting(true);
    
      try {
        if (!editingData?.orderId) {
          throw new Error("Missing order ID for update.");
        }
    
        const updatePromises = [];
        const createPayload = [];
    
        for (const item of items) {
          // Format added_date as full ISO datetime string
          const addedDateISO = new Date(item.added_date).toISOString();
    
          const payload = {
            item: item.item_id,
            count: item.count,
            added_date: addedDateISO,
          };
    
          if (!payload.item || !payload.count) {
            console.warn("Skipping incomplete item:", item);
            continue;
          }
    
          if (item.id) {
            // Existing item → update via PUT
            updatePromises.push(
              axiosInstance.put(`/order-items/${item.id}/`, payload)
            );
          } else {
            // New item → create via POST with order ID
            createPayload.push({
              ...payload,
              order: editingData.orderId,
            });
          }
        }
    
        // PUT updates
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
    
        // POST new items
        if (createPayload.length > 0) {
          await Promise.all(
            createPayload.map((item) =>
              axiosInstance.post('/order-items/', item)
            )
          );
        }

        // DELETE removed items from DB
        if (deletedItemIds.length > 0) {
          await Promise.all(
            deletedItemIds.map(id =>
              axiosInstance.delete(`/order-items/${id}/`)
            )
          );
        }

        alert("Order updated successfully!");

        // Reset form state
        setItems([
          {
            item_name: "",
            count: 0,
            item_id: null,
            price: 0,
            total: 0,
            // added_date: new Date().toISOString(),
            added_date: selectedDate.toISOString()

          }
        ]);

        setSelectedDate(new Date()); // optional: reset calendar to today
        setDeletedItemIds([]);       // clear any tracked deletes

        if (onUpdateSuccess) onUpdateSuccess(); // tell RecentTable to refresh and exit edit mode

    
      } catch (error) {
        console.error("Update error:", error);
        console.error("Server response:", error.response?.data);
        alert(error.response?.data?.error || error.message || "Update failed");
      } finally {
        setIsSubmitting(false);
      }
    };
    

    const handleSubmit = async () => {
      setIsSubmitting(true);
    
      try {
        if (editMode && editingData?.orderItems) {
          const updatePromises = [];
          const createPayload = [];
    
          for (let item of items) {
            const payload = {
              item: item.item_id,
              count: item.count,
              added_date: item.added_date,
            };
    
            if (item.id) {
              // Existing item — update via PUT
              updatePromises.push(
                axiosInstance.put(`/order-items/${item.id}/`, payload)
              );
            } else {
              // New item — prepare for bulk creation
              payload.order = editingData.orderId;
              createPayload.push(payload);
            }
          }
    
          // Run all updates
          await Promise.all(updatePromises);
    
          // Create new ones if any
          if (createPayload.length > 0) {
            await Promise.all(
              createPayload.map(p =>
                axiosInstance.post('/order-items/', p)
              )
            );
          }
        } else {
          // New order creation
          // const payload = {
          //   order_items: items
          //     .filter(item => item.item_id)
          //     .map(item => ({
          //       item: item.item_id,
          //       count: item.count,
          //       added_date: item.added_date,
          //     })),
          // };

          const payload = {
            order_items: items
              .filter(item => item.item_name && item.item_id)
              .map(item => ({
                item: item.item_id,
                count: item.count,
                added_date: item.added_date
                  ? new Date(item.added_date).toISOString()
                  : selectedDate.toISOString()
              }))
          };
          
          await submitOrder(payload);
          // setItems([{ item_name: "", count: 1, price: 0, total: 0, item_id: null }]);
          setItems([{
            item_name: "",
            count: 1,
            price: 0,
            total: 0,
            item_id: null,
            added_date: selectedDate.toISOString(), // ✅ retain selected date
          }]);
          
        }
    
        if (onUpdateSuccess) onUpdateSuccess();
      } catch (error) {
        console.error("Submit error:", error);
        alert(error.response?.data?.error || error.message || 'Submit failed');
      } finally {
        setIsSubmitting(false);
      }
    };

    useEffect(() => {
      if (!editMode) {
        // Reset to default new item row
        setItems([
          {
            item_name: "",
            count: 0,
            price: 0,
            total: 0,
            item_id: null,
            added_date: new Date().toISOString(),
          }
        ]);
    
        setSelectedDate(new Date());
        setDeletedItemIds([]);
      }
    }, [editMode]);
    
    
  
    return (
      <div className="flex-1 bg-white rounded-xl h-[384px] flex flex-col overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#124451]">
            {editMode ? 'Edit Order' : 'Add New Order'}
          </h2>
          <div className="flex items-center gap-2">
            {editMode && (
              <button 
                onClick={onCancel}
                className="text-red-500 flex items-center gap-1"
              >
                <FaTimes /> Cancelhandle
              </button>
            )}
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="border border-gray-200 rounded-full px-2 text-center py-1"
              disabled={editMode}
            />
          </div>
        </div>
  
        <div className="flex justify-end mb-2">
          <button
            onClick={addItem}
            className="bg-[#124451] text-white px-4 py-1 text-md rounded-full cursor-pointer"
          >
            + Add Item
          </button>
        </div>
  
        <div className={`flex-1 ${items.length > 4 ? 'overflow-y-auto max-h-[260px]' : ''}`}>
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-100 text-[14px] sticky top-0 bg-white">
                <th className="p-2 w-30">Item</th>
                <th className="p-2 font-semibold w-17">Count</th>
                <th className="p-2 font-semibold text-center">Price</th>
                <th className="p-2 font-semibold text-center">Total</th>
                <th className="p-2 font-semibold text-center">Delete</th>
              </tr>
            </thead>
            {/* <tbody>
              {items.map((item, index) => (
                <ItemRow
                  key={index}
                  index={index}
                  item={item}
                  updateItem={updateItem}
                  deleteItem={deleteItem}
                  allItems={allItems}
                  editMode={editMode}
                  addedDate={item.added_date}
                />
              ))}
            </tbody> */}
            <tbody>
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  {item.showDateTime && (
                    <tr>
                      <td colSpan="5" className="py-2 font-semibold text-[#124451] text-sm bg-gray-100 rounded">
                        {new Date(item.groupDateTime).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <ItemRow
                    index={index}
                    item={item}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    allItems={allItems}
                    editMode={editMode}
                  />
                </React.Fragment>
              ))}
            </tbody>

          </table>
        </div>
  
        <div className="border-t border-gray-200 pt-3 sticky bottom-0 bg-white">
          <div className="flex justify-between items-center">

            {editMode ?
            <button 
              onClick={handleUpdate} 
              
              className="bg-[#124451] text-white px-4 py-1 rounded-full cursor-pointer ml-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : editMode ? 'Update Order' : 'Submit Order'}
            </button>
            :
            
                <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-[#124451] text-white px-4 py-1 rounded-full cursor-pointer ml-2 disabled:opacity-50"
            >
                {isSubmitting ? 'Processing...' : 'Submit Order'}
            </button>
            }
            <div className="text-lg font-bold text-[#124451] mr-4">
              Total: ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }
