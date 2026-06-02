/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DollarSign, BarChart2, TrendingUp, ShoppingBag, Users, Clock, Download, RefreshCw, FileText, Percent, ShieldAlert } from 'lucide-react';

export default function ManagerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resStats = await fetch('/api/manager/stats');
      if (resStats.ok) {
        setStats(await resStats.json());
      }
      const resPay = await fetch('/api/payments');
      if (resPay.ok) {
        setPayments(await resPay.json());
      }
      const resPrivacy = await fetch('/api/privacy-status');
      if (resPrivacy.ok) {
        setPrivacySettings(await resPrivacy.json());
      }
    } catch (err) {
      console.error('Error fetching manager metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/manager/export?type=csv', '_blank');
  };

  // Reusable component to mask data dynamically based on Admin configuration
  const MaskableValue = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
    const [revealed, setRevealed] = useState(false);
    const isMasked = privacySettings?.maskFinancialMetrics && !revealed;
    
    return (
      <span 
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        className="group relative cursor-help inline-block min-w-[80px]"
      >
        <span className={`font-mono transition-all duration-200 ${isMasked ? 'blur-sm select-none opacity-40' : ''}`}>
          {prefix}{value.toLocaleString()} {suffix}
        </span>
        {isMasked && (
          <span className="absolute inset-0 flex items-center justify-center bg-amber-500/10 dark:bg-amber-400/5 text-amber-500 rounded px-1 text-[9px] font-black uppercase tracking-widest select-none animate-pulse">
            Censored
          </span>
        )}
      </span>
    );
  };

  const MaskableText = ({ text, isTxId = false }: { text: string; isTxId?: boolean }) => {
    const isMasked = isTxId ? privacySettings?.maskPayments : privacySettings?.maskCustomerData;
    
    if (isMasked && text) {
      if (isTxId) {
        // Redact exact bank transaction ID format to prevent fraud
        const first = text.substring(0, 7);
        return <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-amber-500">••••••••</span>;
      } else {
        // Redacted customer details/names
        return <span className="text-amber-500 font-bold">••••••</span>;
      }
    }
    return <span>{text}</span>;
  };

  if (loading || !stats) {
    return (
      <div className="py-24 text-center text-slate-400 font-medium">
        <span className="inline-block h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></span>
        <div>Assembling intelligence database charts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Metrics Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Manager Intelligence Console</h1>
            {privacySettings?.maskFinancialMetrics && (
              <span className="bg-amber-500/15 text-amber-500 px-2.5 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Filters Active
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Real-time revenue matrices, staff audits, and payment channels</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-slate-900"
            title="Refresh Registry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="cursor-pointer flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow"
          >
            <Download className="h-4 w-4" />
            Export CSV Sales
          </button>
        </div>
      </div>

      {/* 2-Row Stats grid matching standard accounting specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {/* Today's Sales Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/25 text-teal-600 dark:text-teal-400 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Today's Total Sale (Mauzo)</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              <MaskableValue value={stats.dailySalesTotal} suffix="TZS" />
            </h3>
          </div>
        </div>

        {/* Local VAT (18% inclusive) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/25 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Today's Local VAT (TRA 18%)</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              <MaskableValue value={stats.dailyTaxTotal} suffix="TZS" />
            </h3>
          </div>
        </div>

        {/* Net Profits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Today's Net Profit (MDR 65%)</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white flex items-center gap-1.5">
              <MaskableValue value={stats.dailyProfitTotal} suffix="TZS" />
              <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 uppercase px-1.5 py-0.5 rounded font-sans leading-none">
                Est: ~65%
              </span>
            </h3>
          </div>
        </div>

        {/* Weekly sales summary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Weekly Total Sale</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              <MaskableValue value={stats.weeklySalesTotal} suffix="TZS" />
            </h3>
          </div>
        </div>

        {/* Monthly sales summary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/25 text-cyan-600 dark:text-cyan-400 rounded-xl">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Monthly Total Sale</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              <MaskableValue value={stats.monthlySalesTotal} suffix="TZS" />
            </h3>
          </div>
        </div>

        {/* Active QR Tables */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-450 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">Active QR Tables</span>
            <h3 className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-white">
              {stats.activeTablesCount} / 100 Tables
            </h3>
          </div>
        </div>
      </div>

      {/* Area Chart visualization showing Live Revenue Trends & Net Profit Curve side by side */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-amber-500" />
              Live Net Profit Margins & Revenue Trend (Last 7 Days)
            </h2>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Dual-channel revenue curves with local inclusive taxation filters</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase">
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Raw Sales
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Net Profit (EBITDA)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
                labelClassName="font-bold border-b border-slate-800 pb-1 mb-1"
                formatter={(value: any, name: any) => {
                  const label = name === "revenue" ? "Sales" : "Net Profit";
                  return [`${Number(value).toLocaleString()} TZS`, label];
                }}
              />
              {/* Outer Sales Area */}
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#d97706" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#revenueGradient)" 
              />
              {/* Net Profit Margin Area */}
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#profitGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Platform Breakdown - M-Pesa, Airtel Money, Card, Cash */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            📶 live operator channel breakdown
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instant aggregate logs across mobile money aggregates</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['MPesa', 'Airtel Money', 'Card', 'Cash'].map((platform) => {
            const breakdown = stats.paymentBreakdown?.[platform] || { amount: 0, count: 0 };
            
            const detailConfigs: Record<string, { title: string; subtitle: string; icon: string; style: string }> = {
              'MPesa': { title: 'Vodacom M-Pesa', subtitle: 'Mobile Wallet (TZ)', icon: '📱', style: 'border-red-500/[0.15] bg-red-500/[0.01]' },
              'Airtel Money': { title: 'Airtel Money', subtitle: 'Airtel Wallet', icon: '📞', style: 'border-red-600/[0.15] bg-red-600/[0.01]' },
              'Card': { title: 'Visa / Mastercard', subtitle: 'POS Terminal Pay', icon: '💳', style: 'border-blue-500/[0.15] bg-blue-500/[0.01]' },
              'Cash': { title: 'Counter Cash', subtitle: 'Cash Drawer Ledger', icon: '💵', style: 'border-emerald-500/[0.15] bg-emerald-500/[0.01]' }
            };

            const config = detailConfigs[platform];

            return (
              <div key={platform} className={`p-4.5 rounded-2xl border ${config.style} flex flex-col justify-between`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{config.title}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{config.subtitle}</p>
                    </div>
                  </div>
                  <span className="bg-slate-150 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                    {breakdown.count} Txns
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Cleared</span>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    <MaskableValue value={breakdown.amount} suffix="TZS" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Menu Items and Active staff log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Ordered Foods/Drinks rankings */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            🍕 Top Item Preference Leaderboards
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Top Foods */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🏆 Most Ordered Food</h3>
              {stats.popularFoods.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No food orders recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {stats.popularFoods.map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 font-medium font-sans">
                      <span className="truncate pr-2">#{i + 1} <MaskableText text={f.name} /></span>
                      <span className="font-mono text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded">
                        {f.count} orders
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Drinks & Fruits */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🧉 Top Beverages</h3>
              {stats.popularDrinks.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No drink items ordered yet.</div>
              ) : (
                <div className="space-y-2">
                  {stats.popularDrinks.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 font-medium font-sans">
                      <span className="truncate pr-2">#{i + 1} <MaskableText text={d.name} /></span>
                      <span className="font-mono text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold px-1.5 py-0.5 rounded">
                        {d.count} orders
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Audit Log employee tracking (Right 1/3) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-slate-450" />
            Recent Staff Activities
          </h2>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {stats.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No administrative actions logged today.</div>
            ) : (
              stats.recentActivity.map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/40 dark:border-slate-800/60 text-[11px] font-medium leading-relaxed">
                  <div className="flex justify-between items-center text-[10px] text-slate-450 mb-1">
                    <span className="font-extrabold font-sans text-slate-705 dark:text-slate-300">
                      <MaskableText text={log.username} /> ({log.role})
                    </span>
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">{log.action}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Deep transaction ledger showcasing TRA & Platform compliance */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-amber-500" />
            Real-Time Transaction Ledger (Taarifa za Malipo)
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Audit feed containing mobile references, VAT slices, preparation costs, and net coefficients
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-450 font-black text-[9px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Operator ID</th>
                <th className="py-3 px-2">Table #</th>
                <th className="py-3 px-2">Channel</th>
                <th className="py-3 px-2 text-right">Raw Ticket</th>
                <th className="py-3 px-2 text-right">VAT (18%)</th>
                <th className="py-3 px-2 text-right">CUL Cost (35%)</th>
                <th className="py-3 px-2 text-right text-emerald-500">Net Profit</th>
                <th className="py-3 px-2 text-right">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-410 italic text-[11px]">
                    No payment tickets processed in current system session.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 15).map((pay) => {
                  const pTax = pay.taxAmount ?? Math.round(pay.amount * 18 / 118);
                  const pCost = pay.costAmount ?? Math.round(pay.amount * 0.35);
                  const pProfit = pay.netProfit ?? (pay.amount - pTax - pCost);
                  
                  return (
                    <tr key={pay.id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-2 font-mono text-[10px] font-black uppercase text-slate-800 dark:text-white">
                        <MaskableText text={pay.transactionId || 'COLL-CH-XXXXXX'} isTxId={true} />
                      </td>
                      <td className="py-3 px-2 font-bold">Kizimba #{pay.tableId}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          pay.paymentMethod === 'MPesa' ? 'bg-red-500/10 text-red-500' :
                          pay.paymentMethod === 'Airtel Money' ? 'bg-rose-500/10 text-rose-500' :
                          pay.paymentMethod === 'Card' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-800 dark:text-slate-200">
                        <MaskableValue value={pay.amount} />
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-400">
                        <MaskableValue value={pTax} />
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-400">
                        <MaskableValue value={pCost} />
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-500">
                        <MaskableValue value={pProfit} />
                      </td>
                      <td className="py-3 px-2 text-right font-sans font-medium text-[10px] text-slate-400">
                        {new Date(pay.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
