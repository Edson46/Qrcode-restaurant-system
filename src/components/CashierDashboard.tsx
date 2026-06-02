/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DollarSign, Printer, Check, CreditCard, RefreshCw, FileText, AlertCircle, Sparkles, Building2, Smartphone } from 'lucide-react';
import { Order, Payment, MenuItem } from '../types';

interface CashierDashboardProps {
  user: { id: string; username: string; role: string };
}

export default function CashierDashboard({ user }: CashierDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bill print modal context
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'MPesa' | 'Airtel Money' | 'Card'>('Cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Local success notifier
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchBillingData();
    const interval = setInterval(fetchBillingData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchBillingData = async () => {
    try {
      const ordRes = await fetch('/api/orders');
      const payRes = await fetch('/api/payments');
      const notRes = await fetch('/api/notifications?role=Cashier');
      const menuRes = await fetch('/api/menu');
      const privacyRes = await fetch('/api/privacy-status');

      if (ordRes.ok) setOrders(await ordRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (notRes.ok) setNotifications(await notRes.json());
      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (privacyRes.ok) setPrivacySettings(await privacyRes.json());
    } catch (err) {
      console.error('Error fetching billing matrices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async (tableId: number, total: number) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          method: paymentMethod,
          amount: total,
          userId: user.id,
          username: user.username,
          userRole: user.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecentReceipt({
          tableId,
          method: paymentMethod,
          amount: total,
          cashReceived: paymentMethod === 'Cash' ? Number(cashGiven) || total : total,
          change: paymentMethod === 'Cash' ? Math.max(0, (Number(cashGiven) || total) - total) : 0,
          date: new Date().toISOString(),
          id: data.payment?.id || 'SM-PAY-MOCK'
        });
        
        // Settle notifications or table logs in backend
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'Cashier' })
        });

        fetchBillingData();
        setCashGiven('');
        setReceiptModalOpen(false);
      } else {
        alert('Could not record payment. Please ensure order is served.');
      }
    } catch (err) {
      console.error('Failed to register check settlement:', err);
    }
  };

  // Group active orders by table to sum outstanding checkout quantities
  const activeTablesList = Array.from({ length: 100 }, (_, i) => i + 1).map(tId => {
    const tableOrders = orders.filter(o => o.tableId === tId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status));
    const totalAmount = tableOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const hasBillingAlert = notifications.some(n => n.type === 'BillRequested' && n.message.includes(`Table ${tId}`));

    return {
      tableId: tId,
      activeOrders: tableOrders,
      totalAmount,
      status: tableOrders.length > 0 ? (hasBillingAlert ? 'BillingRequested' : 'Occupied') : 'Available'
    };
  }).filter(t => t.status !== 'Available');

  // Compute daily parameters
  const todayRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayTransactions = payments.length;

  // Local child component to mask financial figures on cashier screen
  const MaskableValue = ({ value }: { value: number }) => {
    const [revealed, setRevealed] = useState(false);
    const isMasked = privacySettings?.maskFinancialMetrics && !revealed;
    return (
      <span 
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        className="group relative cursor-help inline-block font-mono"
      >
        <span className={isMasked ? 'blur-sm select-none opacity-45' : ''}>
          {isMasked ? '888,888' : value.toLocaleString()} TZS
        </span>
        {isMasked && (
          <span className="absolute inset-x-0 -top-0.5 bottom-0 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded px-1 text-[8px] font-black tracking-widest uppercase select-none leading-none animate-pulse">
            Locked
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Money Handled</span>
            <h3 className="text-xl font-black mt-0.5 text-slate-900 dark:text-white">
              <MaskableValue value={todayRevenue} />
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-450 rounded-xl">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Electronic Pay shares</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              {payments.filter(p => p.paymentMethod !== 'Cash').length} Settlements
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Receipts Closed</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              {todayTransactions} Transacted
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Billing list (Left 2/3) */}
        <div className="lg:col-span-2 space-y-45">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Tables Requiring Bills</h2>
            <button
              onClick={fetchBillingData}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading active balance lists...</div>
          ) : activeTablesList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl py-14 p-6 text-center">
              <Sparkles className="h-10 w-10 text-slate-350 dark:text-slate-700 mx-auto mb-2.5" />
              <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">All Accounts Settle</div>
              <p className="text-slate-400 dark:text-slate-550 text-xs mt-1.5 max-w-sm mx-auto">There are no tables waiting for check-out. Register payment when new orders finish.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {activeTablesList.map((tableObj) => (
                <div 
                  key={tableObj.tableId} 
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all ${
                    tableObj.status === 'BillingRequested' 
                    ? 'border-amber-300 dark:border-amber-900 ring-2 ring-amber-50 dark:ring-amber-950/20' 
                    : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex gap-4.5 items-center">
                    <span className="h-11 w-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black font-mono text-sm shadow-sm shrink-0">
                      T{tableObj.tableId}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-200">Table {tableObj.tableId} Checkout</span>
                        {tableObj.status === 'BillingRequested' && (
                          <span className="px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase rounded-md tracking-wider animate-pulse border border-amber-400">
                            Requested Bill Call
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {tableObj.activeOrders.length} active orders • {privacySettings?.maskFinancialMetrics ? '•••••• Outstanding' : `TZS ${tableObj.totalAmount.toLocaleString()} Outstanding`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setSelectedTableId(tableObj.tableId);
                        setReceiptModalOpen(true);
                        setRecentReceipt(null);
                      }}
                      className="cursor-pointer flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                    >
                      <Printer className="h-4 w-4" />
                      Print Bill & Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action / Receipt Sidebar logs (Right 1/3) */}
        <div>
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2.5 border-b border-slate-100 dark:border-slate-800">
              Concluded Handshake Payments
            </h2>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No settlements completed since cash box boot.</div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {payments.slice().reverse().map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/65 rounded-xl border border-slate-200/50 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-slate-900 dark:text-slate-200">Table {p.tableId} Paid</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Method: {p.paymentMethod} • ID: {privacySettings?.maskPayments ? '••••••••' : (p.transactionId || 'COLL-CH-XXXXXX').substring(0, 11)}
                      </span>
                    </div>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-right">
                      +{privacySettings?.maskFinancialMetrics ? '•••••• TZS' : `${p.amount.toLocaleString()} TZS`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realistic Receipt Settle Modal Dialog */}
      {receiptModalOpen && selectedTableId && (
        <div id="receipt-modal-backdrop" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-dashed border-slate-200 bg-slate-50 flex justify-between items-center text-slate-950">
              <div>
                <h3 className="font-black text-sm tracking-wide">SMARTMENU BILLING CORE</h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest mt-0.5">Settle Desk Table #{selectedTableId}</p>
              </div>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-slate-400 text-[11px] font-black uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

            {/* Simulated thermal receipt paper container */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-800 space-y-4 bg-slate-50/50">
              <div className="text-center pt-2 pb-4 border-b border-dashed border-slate-350 space-y-1">
                <Building2 className="h-8 w-8 mx-auto text-slate-900 border p-1 rounded-lg" />
                <h4 className="font-mono text-sm font-bold uppercase tracking-wider">SMARTMENU TZ</h4>
                <div className="text-[9px] text-slate-500">Mlimani City Gate, Dar Es Salaam</div>
                <div className="text-[9px] text-slate-550">Date: {new Date().toLocaleDateString()} • Cashier Desk</div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-dashed border-slate-350 pb-4 pt-1 text-[11px]">
                {orders
                  .filter(o => o.tableId === selectedTableId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status))
                  .map(order => 
                    order.items.map((it, itemIdx) => {
                      const menuItem = menuItems.find(m => m.id === it.menuItemId);
                      return (
                        <div key={itemIdx} className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {menuItem?.imageUrl && (
                              <img 
                                src={menuItem.imageUrl} 
                                alt={it.name}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 min-w-7 rounded object-cover border border-slate-200"
                              />
                            )}
                            <span className="font-semibold truncate">{it.quantity}x {it.name.substring(0, 16)}</span>
                          </div>
                          <span className="shrink-0 font-mono">{(it.price * it.quantity).toLocaleString()} TZS</span>
                        </div>
                      );
                    })
                  )}
              </div>

              {/* Calculations Box */}
              <div className="space-y-1.5 text-right border-b border-dashed border-slate-350 pb-4">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Subtotal sum</span>
                  <span>
                    {orders
                      .filter(o => o.tableId === selectedTableId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status))
                      .reduce((sum, o) => sum + o.totalAmount, 0)
                      .toLocaleString()}{' '}
                    TZS
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>VAT (18% inclusive)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>AMOUNT OUTSTANDING</span>
                  <span className="font-extrabold font-mono text-emerald-600 underline">
                    {orders
                      .filter(o => o.tableId === selectedTableId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status))
                      .reduce((sum, o) => sum + o.totalAmount, 0)
                      .toLocaleString()}{' '}
                    TZS
                  </span>
                </div>
              </div>

              {/* Settle Method Selector */}
              <div className="space-y-3 font-sans mt-3">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Settle Sinks Method</label>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  {['Cash', 'MPesa', 'Airtel Money', 'Card'].map((meth) => (
                    <button
                      key={meth}
                      onClick={() => setPaymentMethod(meth as any)}
                      className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === meth 
                        ? 'bg-slate-900 text-white border-transparent shadow' 
                        : 'bg-white border-slate-200 text-slate-705 text-xs hover:bg-slate-50'
                      }`}
                    >
                      {meth}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Cash' && (
                  <div className="space-y-1.5 mt-2 transition-all">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Cash Received</label>
                    <input
                      type="number"
                      placeholder="E.g. 50000"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    />
                    
                    {/* Calculated Change Indicator */}
                    {Number(cashGiven) > 0 && (
                      <div className="text-right text-[11px] font-bold text-slate-600 mt-1 font-mono">
                        Cash Change: {Math.max(0, Number(cashGiven) - orders
                          .filter(o => o.tableId === selectedTableId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status))
                          .reduce((sum, o) => sum + o.totalAmount, 0)).toLocaleString()}{' '}
                        TZS
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Settle Submit Action Button */}
            <div className="p-5 border-t border-slate-200 bg-slate-100 flex justify-end">
              <button
                onClick={() => handleRegisterPayment(
                  selectedTableId,
                  orders
                    .filter(o => o.tableId === selectedTableId && ['Accepted', 'Preparing', 'Ready', 'Served'].includes(o.status))
                    .reduce((sum, o) => sum + o.totalAmount, 0)
                )}
                className="cursor-pointer w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 border border-transparent text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow"
              >
                <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                Finalize Payments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual concluded Print Receipt Summary */}
      {recentReceipt && (
        <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans animate-fade-in shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-teal-900 dark:text-teal-400">
              <Check className="h-4.5 w-4.5 stroke-[3]" />
              Settle Handshake Success
            </div>
            <p className="text-xs text-teal-700 mt-1 uppercase tracking-wide">
              Receipt ID: <span className="font-mono font-bold text-[11px]">{recentReceipt.id.substring(0, 18)}</span> • Paid {recentReceipt.amount.toLocaleString()} TZS via {recentReceipt.method}
            </p>
          </div>
          {recentReceipt.change > 0 && (
            <span className="text-xs font-bold font-mono text-teal-950 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-3 py-2 rounded-xl text-right">
              Change: {recentReceipt.change.toLocaleString()} TZS
            </span>
          )}
        </div>
      )}
    </div>
  );
}
