/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Play, Check, Navigation, AlertTriangle, Table, Clock, MessageSquare, RefreshCw, Bell, User } from 'lucide-react';
import { Order, OrderStatus, MenuItem } from '../types';

interface WaiterDashboardProps {
  user: { id: string; username: string; role: string };
}

export default function WaiterDashboard({ user }: WaiterDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Served'>('All');

  useEffect(() => {
    fetchOrdersAndNotifications();
    const interval = setInterval(fetchOrdersAndNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrdersAndNotifications = async () => {
    try {
      const ordRes = await fetch('/api/orders');
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      }
      const notRes = await fetch('/api/notifications?role=Waiter');
      if (notRes.ok) {
        const notData = await notRes.json();
        setNotifications(notData);
      }
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }
    } catch (err) {
      console.error('Error in waiter sync:', err);
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
        fetchOrdersAndNotifications();
      }
    } catch (err) {
      console.error('Error updating waiter status:', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Waiter' })
      });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing read alerts:', err);
    }
  };

  const activeOrders = orders.filter(o => 
    !['Paid', 'Completed', 'Cancelled'].includes(o.status) &&
    (filterStatus === 'All' || o.status === filterStatus)
  );

  return (
    <div className="space-y-6">
      {/* Header Profile Dashboard Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-2xl">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Waiter Service Desk</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Logged in: {user.username} (Table Attendant)</p>
          </div>
        </div>
        
        {/* Sync Button */}
        <button
          onClick={fetchOrdersAndNotifications}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Orders Column (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Active Table Service Tickets</h2>
            
            {/* Horizontal Filter Row */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[280px] sm:max-w-none scrollbar-none">
              {['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Served'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border transition-all ${
                    filterStatus === st
                    ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Searching order tickets...</div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl py-12 p-6 text-center shadow-xs">
              <Table className="h-10 w-10 text-slate-300 dark:text-slate-750 mx-auto mb-2.5" />
              <div className="font-extrabold text-slate-800 dark:text-slate-300 text-sm">No Active Tickets</div>
              <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">There are no orders matching selection for the floor plan.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 p-4.5 shadow-sm space-y-4">
                  
                  {/* Ticket Title Row */}
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-9 w-9 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl flex items-center justify-center font-black font-mono text-sm shadow-sm">
                        {order.tableId}
                      </span>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">Ticket #{order.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-slate-900 dark:text-slate-200 text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-bold text-xs text-slate-550 dark:text-slate-400">
                        {order.items.length} dishes
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 px-2 py-0.5 rounded-md">
                        {order.totalAmount.toLocaleString()} TZS
                      </span>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => {
                      const menuItem = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-900 text-slate-550 dark:text-slate-400 font-semibold px-1.5 py-0.5 rounded">
                              {item.quantity}x
                            </span>
                            {menuItem?.imageUrl && (
                              <img 
                                src={menuItem.imageUrl} 
                                alt={item.name} 
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 min-w-8 rounded-lg object-cover border border-slate-100 dark:border-slate-800"
                              />
                            )}
                            <span>{item.name}</span>
                            <span className="text-[10px] text-slate-400">({item.category})</span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 italic font-medium flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {item.notes}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    
                    {order.notes && (
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 italic mt-2.5">
                        Waiter Note: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar according to State flow */}
                  <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{order.status}</span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Accepted')}
                          className="cursor-pointer flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-500 text-white hover:bg-blue-600 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0" />
                          Accept Ticket
                        </button>
                      )}

                      {order.status === 'Accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                          className="cursor-pointer flex items-center gap-1.5 px-4.5 py-2.5 bg-purple-500 text-white hover:bg-purple-600 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0" />
                          Send to Kitchen/Bar
                        </button>
                      )}

                      {order.status === 'Ready' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Served')}
                          className="cursor-pointer flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-605 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          Mark as Served
                        </button>
                      )}

                      {['Preparing', 'Served'].includes(order.status) && (
                        <span className="text-xs font-semibold text-slate-400 italic bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          {order.status === 'Preparing' ? 'Chef is cooking...' : 'Awaiting cashier receipt'}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Alerts Notification Column (Right 1/3) */}
        <div className="space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500 animate-swing" />
                Floor Call Notifications Filter
              </h2>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearNotifications}
                  className="cursor-pointer text-[10px] font-black text-rose-500 hover:text-rose-600 dark:text-rose-400 uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No active bells or customer calls at present. Ready for summons.</div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800 flex gap-2.5">
                    {n.type === 'CallWaiter' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Table className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{n.message}</p>
                      <span className="text-[9px] font-bold text-slate-400 block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Table Status Mapping */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl">
            <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-4">Floor Map Overview</h2>
            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((tId) => (
                <div 
                  key={tId} 
                  className="h-9 rounded-lg border text-[11px] font-mono font-black flex items-center justify-center bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50 select-none cursor-default"
                  title={`Table ${tId}`}
                >
                  {tId}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-450 mt-3.5 text-center font-bold">Showing tables 1 - 25. Complete 100 table index generated under static QR database codes.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
