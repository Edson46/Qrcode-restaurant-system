/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Shield, ChefHat, GlassWater, Table, DollarSign, Bell, LogIn, LogOut, Check, Sparkles, AlertCircle, ArrowLeft, ShieldAlert, Siren } from 'lucide-react';
import CustomerPortal from './components/CustomerPortal';
import WaiterDashboard from './components/WaiterDashboard';
import KitchenDashboard from './components/KitchenDashboard';
import BarDashboard from './components/BarDashboard';
import CashierDashboard from './components/CashierDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminPanel from './components/AdminPanel';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  // Navigation Routing States
  const [tableId, setTableId] = useState<number | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; code: number } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  // Login variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const activeEmergency = notifications.find(n => n.type === 'Emergency' && !n.isRead);
  const [superAdminDashboard, setSuperAdminDashboard] = useState<'Admin' | 'Manager' | 'Cashier' | 'Waiter' | 'Kitchen Staff' | 'Bar Staff'>('Admin');

  useEffect(() => {
    // 1. Check if the URL matches /table/<id>
    const path = window.location.pathname;
    const match = path.match(/^\/table\/(\d+)$/);
    
    if (path !== '/' && !match) {
      setIsNotFound(true);
    } else if (match && match[1]) {
      const parsedId = Number(match[1]);
      if (parsedId >= 1 && parsedId <= 100) {
        setTableId(parsedId);
        setIsNotFound(false);
      } else {
        setIsNotFound(true);
      }
    } else {
      setIsNotFound(false);
    }

    // Update notifications if staff is logged in
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 6000);
      return () => clearInterval(interval);
    }
  }, [currentUser, superAdminDashboard]);

  // Handle global or unrecognized connection issues gracefully as custom 500/504 pages
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      setServerError({
        message: 'A background service or database worker failed to fetch data. Please re-check the local gateway or Wi-Fi status.',
        code: 500
      });
    };

    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Captured Global Error:', event.error);
      if (event.message?.toLowerCase().includes('failed to fetch') || event.message?.toLowerCase().includes('load resource')) {
        setServerError({
          message: 'The local restaurant server is not responding. Please make sure the service is online or refresh the web page.',
          code: 504
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const activeRole = currentUser.role === 'Super Admin' ? superAdminDashboard : currentUser.role;
      const res = await fetch(`/api/notifications?role=${encodeURIComponent(activeRole)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setNotifCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch {
      // Ignore background errors
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const activeRole = currentUser.role === 'Super Admin' ? superAdminDashboard : currentUser.role;
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: activeRole })
      });
      if (res.ok) {
        setNotifications([]);
        setNotifCount(0);
        setShowNotifDropdown(false);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleAcknowledgeEmergency = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/read-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error acknowledging emergency alert:', err);
    }
  };

  const handleLogin = async (e: FormEvent, customCredentials?: { u: string; p: string }) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const targetUser = customCredentials ? customCredentials.u : username;
    const targetPass = customCredentials ? customCredentials.p : password;

    if (!targetUser || !targetPass) {
      setErrorMsg('Please supply username and credentials.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: targetPass })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUsername('');
        setPassword('');
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Authentication failure.');
      }
    } catch (err) {
      setErrorMsg('Backend Connection Error.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setCurrentUser(null);
    setNotifCount(0);
  };

  // Custom Branded 404 Page Not Found Screen
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col justify-between p-6">
        <div className="max-w-md mx-auto my-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 text-center animate-fade-in">
          <span className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-sm">
            404
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
              Seat Location / Page Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              The digital menu page or dining table reservation URL you followed could not be verified on the local floor map registry list.
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-[10px] font-mono text-slate-400 text-left space-y-1">
            <div>URL: <span className="text-rose-500 select-all font-semibold font-sans">{window.location.pathname}</span></div>
            <div>STATUS: UNREGISTERED_TABLE_INDEX</div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setIsNotFound(false);
                setTableId(null);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Back to Floor Hub / Login
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/table/1');
                setTableId(1);
                setIsNotFound(false);
              }}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              View Menu at Table 1
            </button>
          </div>
        </div>
        <footer className="text-center font-semibold text-[10px] text-slate-400 uppercase tracking-widest leading-loose mt-8">
          <div>SmartMenu TZ Platform Suite • 2026 Edition</div>
        </footer>
      </div>
    );
  }

  // Custom Branded 500 / 504 Internal Server / Database Error Screen
  if (serverError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col justify-between p-6">
        <div className="max-w-md mx-auto my-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 text-center animate-fade-in">
          <span className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-sm">
            500
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
              Internal Server / Database Alert
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {serverError.message}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-[10px] font-mono text-slate-400 text-left space-y-1">
            <div>GATEWAY: OFFLINE_OR_INVALID_ADDRESS</div>
            <div>SUITE: SMARTMENU_TZ_FULLSTACK_MODULE</div>
            <div>PORTS: BINDING_PORT_3000</div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setServerError(null);
                window.location.reload();
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Re-establish Connection / Refresh
            </button>
            <button
              onClick={() => {
                setServerError(null);
              }}
              className="w-full py-2 text-[10px] text-slate-400 font-bold hover:text-slate-600 uppercase tracking-wide cursor-pointer text-center"
            >
              Dismiss and continue offline
            </button>
          </div>
        </div>
        <footer className="text-center font-semibold text-[10px] text-slate-400 uppercase tracking-widest leading-loose mt-8">
          <div>SmartMenu TZ Platform Suite • 2026 Edition</div>
        </footer>
      </div>
    );
  }

  // If path is a customer table QR landing path, display matching menu immediately!
  if (tableId !== null) {
    const handleNavigationHome = () => {
      window.history.pushState({}, '', '/');
      setTableId(null);
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Floating Quick Navigation Anchor in customer portal to visit Login easily */}
        <div className="fixed top-5 right-5 z-50 flex gap-2.5">
          <ThemeToggle />
          <button
            onClick={handleNavigationHome}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Go Back to Login"
          >
            <ArrowLeft className="h-4 w-4 text-amber-500" />
            <span>Staff Login</span>
          </button>
        </div>
        <CustomerPortal tableId={tableId} onBack={handleNavigationHome} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col justify-between">
      
      {/* Top Banner Toolbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shadow-xs z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()}>
            <span className="h-9 w-9 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl flex items-center justify-center font-black font-sans text-sm shadow-md">
              SM
            </span>
            <div>
              <span className="text-sm font-black tracking-wider block">SmartMenu TZ</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block -mt-0.5">Tanzanian Hospitality Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {currentUser && (
              <div className="flex items-center gap-3">
                {/* Notification Badge inside workspace nav */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800 flex items-center justify-center"
                    title="View Notifications"
                  >
                    <Bell className={`h-4 w-4 ${notifCount > 0 ? 'animate-bounce text-rose-500' : 'text-slate-500'}`} />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold h-4 w-4 rounded-full flex items-center justify-center text-[9px]">
                        {notifCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Box */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      <div className="p-3.5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {currentUser.role === 'Super Admin' ? `${superAdminDashboard} Alerts` : `Service Alerts`}
                        </span>
                        {notifCount > 0 && (
                          <button
                            onClick={handleMarkNotificationsAsRead}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider bg-rose-500/10 px-2 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 font-medium">
                            No active notifications for this deck.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 text-xs flex flex-col gap-1 transition-all ${
                                notif.isRead
                                  ? 'bg-transparent text-slate-400 dark:text-slate-500'
                                  : 'bg-rose-500/5 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-100 dark:divide-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={notif.isRead ? 'line-through opacity-75' : ''}>{notif.message}</span>
                                {!notif.isRead && (
                                  <span className="h-2 w-2 bg-rose-500 rounded-full shrink-0 mt-1" />
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono self-end">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <span className="hidden sm:inline px-3 py-1.5 rounded-xl border border-slate-300/50 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 text-xs font-black font-mono text-slate-700 dark:text-slate-300">
                  {currentUser.role}: {currentUser.username}
                </span>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/5 hover:border-rose-500/10 text-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4.5 py-6">
        {currentUser ? (
          // Authorized Dashboards panels mapping
          <div className="space-y-6">
            
             {/* Super Admin Dashboard Selector Switcher Row */}
            {currentUser.role === 'Super Admin' && (
              <div className="bg-amber-400 text-slate-950 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-md animate-fade-in font-sans">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-slate-950 rounded-full animate-pulse shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">Super Admin Console — Switch Workspace view:</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-slate-950/10 p-1 rounded-2xl">
                  {(['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Bar Staff'] as const).map(dash => (
                    <button
                      key={dash}
                      onClick={() => setSuperAdminDashboard(dash)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                        superAdminDashboard === dash
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-900 hover:bg-slate-950/5'
                      }`}
                    >
                      {dash}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🚨 ACTIVE EMERGENCY SOS BROADCAST SIREN PANEL */}
            {activeEmergency && (
              <div className="bg-rose-600 text-white p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border-4 border-rose-500 animate-pulse font-sans">
                <div className="flex items-start gap-3.5">
                  <span className="p-2.5 bg-white/10 rounded-2xl animate-spin text-white">
                    <Siren className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="text-[10px] bg-white/20 text-white font-black uppercase px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Critical SOS Alert
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide leading-tight">
                      {activeEmergency.message}
                    </h3>
                    <p className="text-[10px] text-rose-100 font-bold uppercase mt-1">
                      Reported at: {new Date(activeEmergency.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => handleAcknowledgeEmergency(activeEmergency.id)}
                    className="w-full md:w-auto bg-slate-950 hover:bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider px-5 py-3 rounded-2xl cursor-pointer transition-all border border-transparent shadow shadow-slate-950/20 active:scale-95"
                  >
                    Acknowledge & Clear SOS
                  </button>
                </div>
              </div>
            )}

            {/* Quick dashboard profile banners */}
            {((currentUser.role === 'Admin') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Admin')) && (
              <AdminPanel user={currentUser} />
            )}
            {((currentUser.role === 'Manager') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Manager')) && (
              <ManagerDashboard />
            )}
            {((currentUser.role === 'Cashier') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Cashier')) && (
              <CashierDashboard user={currentUser} />
            )}
            {((currentUser.role === 'Waiter') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Waiter')) && (
              <WaiterDashboard user={currentUser} />
            )}
            {((currentUser.role === 'Kitchen Staff') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Kitchen Staff')) && (
              <KitchenDashboard user={currentUser} />
            )}
            {((currentUser.role === 'Bar Staff') || (currentUser.role === 'Super Admin' && superAdminDashboard === 'Bar Staff')) && (
              <BarDashboard user={currentUser} />
            )}
            
          </div>
        ) : (
          // Unauthorized Workspace: Renders modern login forms with helpful demo aids
          <div className="max-w-md mx-auto py-12 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-7 animate-fade-in mt-6">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <LogIn className="h-6 w-6 stroke-[2.5]" />
              </span>
              <h2 className="text-xl font-black font-sans text-slate-900 dark:text-white mt-3 pb-1">Floor Staff Login</h2>
              <p className="text-xs font-medium text-slate-500">Enter your employee login credentials or click a test user below.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-500/10 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs font-bold text-slate-500">
              <div className="space-y-1.5">
                <label htmlFor="login-username">Login Name</label>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="E.g. waiter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1.5 focus:ring-amber-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password">PIN Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="E.g. waiter123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1.5 focus:ring-amber-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-905 dark:hover:bg-slate-50 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md mt-2 cursor-pointer"
              >
                Enter Workspace
              </button>
            </form>

            {/* Quick Demo Staff Accellerator Buttons */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3.5">
              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                Staff Dashboard Emulator Roster
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center">
                {[
                  { r: 'Super Admin', u: 'superadmin', p: 'superadmin123', icon: <Shield className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> },
                  { r: 'Admin', u: 'admin', p: 'admin123', icon: <Shield className="h-3.5 w-3.5" /> },
                  { r: 'Manager', u: 'manager', p: 'manager123', icon: <DollarSign className="h-3.5 w-3.5" /> },
                  { r: 'Cashier', u: 'cashier', p: 'cashier123', icon: <DollarSign className="h-3.5 w-3.5" /> },
                  { r: 'Waiter', u: 'waiter', p: 'waiter123', icon: <Table className="h-3.5 w-3.5" /> },
                  { r: 'Kitchen', u: 'kitchen', p: 'kitchen123', icon: <ChefHat className="h-3.5 w-3.5" /> },
                  { r: 'Bar / Fruit', u: 'bar', p: 'bar123', icon: <GlassWater className="h-3.5 w-3.5 text-cyan-500" /> }
                ].map((demo) => (
                  <button
                    key={demo.r}
                    onClick={() => handleLogin(null as any, { u: demo.u, p: demo.p })}
                    className="cursor-pointer py-2.5 px-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-slate-700 dark:text-slate-300"
                  >
                    <span className="text-slate-500 dark:text-slate-400">{demo.icon}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide truncate">{demo.r}</span>
                  </button>
                ))}
              </div>

              {/* Extra Mile Helper: Dynamic Quick test links for Customer Table Views! */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1 mt-2 text-xs">
                <span className="font-extrabold text-[10px] text-slate-400 uppercase block">Simulator Table QR Scanners</span>
                <p className="text-[10px] text-slate-400 italic leading-relaxed">Emulate table QR codes immediately without scanning. Visit a specific dining table check:</p>
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {[1, 5, 12, 42, 100].map(tbl => (
                    <button
                      key={tbl}
                      onClick={() => {
                        window.history.pushState({}, '', `/table/${tbl}`);
                        setTableId(tbl);
                      }}
                      className="cursor-pointer px-2 py-1 text-[9px] font-black font-mono bg-amber-400 text-slate-950 hover:bg-amber-500 rounded border border-amber-300 transition-all"
                    >
                      Table {tbl} scan
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Elegant Standard Hotel Footer Block */}
      <footer className="py-6 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 text-center font-semibold text-[10px] text-slate-400 uppercase tracking-widest leading-loose">
        <div>SmartMenu TZ Platform Suite • 2026 Edition</div>
        <div className="text-[9px] text-slate-500 font-mono font-medium lowercase tracking-normal">Built with premium full-stack node React controls • Port 3000 Ingress</div>
      </footer>

    </div>
  );
}
