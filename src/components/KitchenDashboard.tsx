/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ChefHat, Play, Check, Flame, Clock, Filter, List, RefreshCw } from 'lucide-react';
import { Order, OrderStatus, MenuItem } from '../types';

interface KitchenDashboardProps {
  user: { id: string; username: string; role: string };
}

export default function KitchenDashboard({ user }: KitchenDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState<string>('All');
  const [systemTime, setSystemTime] = useState<number>(Date.now());

  // Update clocks every second to display precise elapsed preparation timers
  useEffect(() => {
    fetchOrders();
    const fetchInterval = setInterval(fetchOrders, 4000);
    const clockInterval = setInterval(() => setSystemTime(Date.now()), 1000);
    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // Keep orders that are Pending, Accepted, Preparing, or Ready (not Served/Completed)
        setOrders(data);
      }
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userId: user.id,
          username: user.username,
          userRole: user.role
        })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error kitchen updating status:', err);
    }
  };

  // Helper to format elapsed kitchen prep times
  const getElapsedMinutes = (createdAtString: string) => {
    const elapsedMs = systemTime - new Date(createdAtString).getTime();
    const totalSecs = Math.max(0, Math.floor(elapsedMs / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter for orders containing (1) Food items, (2) are Pending, Accepted, Preparing or Ready (not Served/Paid)
  const kitchenOrders = orders.filter(order => {
    // Check if the order has any Food category item
    const hasFood = order.items.some(item => item.category === 'Food');
    const isCookingState = ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(order.status);
    const matchesTable = tableFilter === 'All' || order.tableId === Number(tableFilter);
    return hasFood && isCookingState && matchesTable;
  });

  // Get index list of tables we can filter by that have active food tickets
  const activeFoodTables = Array.from(
    new Set(orders.filter(o => o.items.some(it => it.category === 'Food') && ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status)).map(o => o.tableId))
  ).sort((a: number, b: number) => a - b);

  return (
    <div className="space-y-6">
      {/* Upper Status Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-2xl">
            <ChefHat className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Kitchen Cooking Deck</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Role: {user.username} (Food Preparation Executive Chef)</p>
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none pr-2"
            >
              <option value="All">All Tables</option>
              {activeFoodTables.map(tNum => (
                <option key={tNum} value={tNum}>Table {tNum}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"
            title="Refresh Orders"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Synchronizing recipes and queues...</div>
      ) : kitchenOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl py-16 p-6 text-center shadow-xs">
          <Flame className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <div className="font-extrabold text-slate-800 dark:text-slate-300 text-sm">No Pending Cuisine Tickets</div>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 max-w-sm mx-auto">All customer dishes are prepared and served. The grills are ready for the next incoming scans!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map((order) => {
            const foodItems = order.items.filter(it => it.category === 'Food');
            
            return (
              <div 
                key={order.id} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4.5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 ${
                  order.status === 'Preparing' 
                  ? 'border-purple-200 dark:border-purple-900/40 ring-2 ring-purple-100 dark:ring-purple-950/20' 
                  : order.status === 'Ready'
                  ? 'border-emerald-200 dark:border-emerald-900/40 ring-2 ring-emerald-50 dark:ring-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800/75'
                }`}
              >
                <div>
                  {/* Header info */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-8.5 w-8.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl flex items-center justify-center font-black font-mono text-sm shadow-sm">
                        {order.tableId}
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Table {order.tableId}</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                          ID: {order.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold font-mono" title="Total order duration since submitted">
                        <span className="opacity-80">Total:</span>
                        <span>{getElapsedMinutes(order.createdAt)}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        order.status === 'Preparing' ? 'bg-purple-500 text-white font-extrabold animate-pulse' :
                        order.status === 'Ready' ? 'bg-emerald-500 text-white font-extrabold' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {order.status}
                      </span>
                      <div className="flex items-center gap-1 text-[10.5px] font-extrabold text-amber-500 dark:text-amber-400 font-mono" title="Time spent in this current status">
                        <Clock className="h-2.5 w-2.5 animate-pulse" />
                        <span>{getElapsedMinutes(order.updatedAt || order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Food Items List */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1.5">Dishes to Cook</h4>
                    {foodItems.map((item, idx) => {
                      const menuItem = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <div key={idx} className="flex justify-between items-start text-xs font-semibold text-slate-800 dark:text-slate-250 border-b border-dashed border-slate-100 dark:border-slate-800/40 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-2.5 max-w-xs">
                            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black px-1.5 py-0.5 rounded text-[10.5px]">
                              {item.quantity}x
                            </span>
                            
                            {menuItem?.imageUrl && (
                              <img 
                                src={menuItem.imageUrl} 
                                alt={item.name} 
                                referrerPolicy="no-referrer"
                                className="h-9 w-9 min-w-9 rounded-lg object-cover border border-slate-100 dark:border-slate-800"
                              />
                            )}
                            
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{item.name}</div>
                              {item.notes && (
                                <div className="text-[9.5px] font-semibold text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 italic mt-1 flex items-center gap-1">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {order.notes && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 italic text-[10px] font-semibold text-slate-500 mt-3">
                        Total Ticket Notes: {order.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status action */}
                <div className="pt-4.5 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex justify-end gap-2 text-right">
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      className="cursor-pointer w-full py-2.5 bg-blue-500 text-white hover:bg-blue-600 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <ChefHat className="h-4 w-4" />
                      Accept & Cook
                    </button>
                  )}

                  {order.status === 'Accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      className="cursor-pointer w-full py-2.5 bg-purple-500 text-white hover:bg-purple-600 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <ChefHat className="h-4 w-4" />
                      Start Cooking
                    </button>
                  )}

                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Ready')}
                      className="cursor-pointer w-full py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                      Mark Ready
                    </button>
                  )}

                  {order.status === 'Ready' && (
                    <span className="w-full text-center text-xs font-black text-emerald-605 italic bg-emerald-500/5 py-2 rounded-xl border border-emerald-500/10">
                      Food ready, waiter is serving
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
