/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Plus, Edit2, Trash2, Shield, UserPlus, Table, BookOpen, Check, ClipboardList, RefreshCw, X, Eye } from 'lucide-react';
import { MenuItem, User, AuditLog, UserRole } from '../types';

interface AdminPanelProps {
  user: { id: string; username: string; role: string };
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'users' | 'tables' | 'audits' | 'security' | 'privacy'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Menu Form
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCategory, setMenuCategory] = useState<'Food' | 'Drink' | 'Fruit'>('Food');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [menuImageUrl, setMenuImageUrl] = useState('');
  const [menuBase64, setMenuBase64] = useState('');

  // User Form
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('Waiter');

  // QR Viewer
  const [viewingTableId, setViewingTableId] = useState<number | null>(null);

  // Security Tooling States
  const [selectedUserToModify, setSelectedUserToModify] = useState<User | null>(null);
  const [newSecurePassword, setNewSecurePassword] = useState('');
  const [confirmSecurePassword, setConfirmSecurePassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetStatusMsg, setResetStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Privacy Settings States
  const [maskMetrics, setMaskMetrics] = useState(false);
  const [maskData, setMaskData] = useState(false);
  const [maskPayments, setMaskPayments] = useState(false);
  const [privacySaveStatus, setPrivacySaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'menu') {
        const res = await fetch('/api/menu');
        if (res.ok) setMenuItems(await res.json());
      } else if (activeTab === 'users' || activeTab === 'security') {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'tables') {
        // No heavy DB target needed, managed procedurally (1-100)
      } else if (activeTab === 'audits') {
        const res = await fetch('/api/audit-logs');
        if (res.ok) setAuditLogs(await res.json());
      } else if (activeTab === 'privacy') {
        const res = await fetch('/api/privacy-status');
        if (res.ok) {
          const settings = await res.json();
          setMaskMetrics(settings.maskFinancialMetrics);
          setMaskData(settings.maskCustomerData);
          setMaskPayments(settings.maskPayments);
        }
      }
    } catch (err) {
      console.error('Error fetching admin panels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    try {
      setPrivacySaveStatus('Saving settings...');
      const res = await fetch('/api/privacy-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maskFinancialMetrics: maskMetrics,
          maskCustomerData: maskData,
          maskPayments: maskPayments
        })
      });
      if (res.ok) {
        setPrivacySaveStatus('Settings updated and audited successfully!');
        setTimeout(() => setPrivacySaveStatus(null), 3500);
      } else {
        setPrivacySaveStatus('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setPrivacySaveStatus('Error saving privacy settings.');
    }
  };

  const handleSaveMenuItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuPrice) return;

    try {
      const payload = {
        name: menuName,
        price: Number(menuPrice),
        category: menuCategory,
        description: menuDescription,
        isAvailable: menuAvailable,
        base64Data: menuBase64 || undefined,
        userId: user.id,
        username: user.username,
        userRole: user.role
      };

      let res;
      if (editingItemId) {
        res = await fetch(`/api/menu/${editingItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setMenuFormOpen(false);
        resetMenuForm();
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to save menu product:', err);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setMenuName(item.name);
    setMenuPrice(String(item.price));
    setMenuCategory(item.category);
    setMenuDescription(item.description);
    setMenuAvailable(item.isAvailable);
    setMenuImageUrl(item.imageUrl || '');
    setMenuBase64('');
    setMenuFormOpen(true);
  };

  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/menu/${id}?userId=${user.id}&username=${user.username}&userRole=${user.role}&name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to remove menu item:', err);
    }
  };

  const resetMenuForm = () => {
    setEditingItemId(null);
    setMenuName('');
    setMenuPrice('');
    setMenuCategory('Food');
    setMenuDescription('');
    setMenuAvailable(true);
    setMenuImageUrl('');
    setMenuBase64('');
  };

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword,
          role: registerRole,
          creatorId: user.id,
          creatorName: user.username,
          creatorRole: user.role
        })
      });

      if (res.ok) {
        setUserFormOpen(false);
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterRole('Waiter');
        fetchAdminData();
        alert('Staff user registered successfully.');
      } else {
        const data = await res.json();
        alert(data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error('Failed registration:', err);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserToModify || !newSecurePassword || !confirmSecurePassword) {
      setPasswordStatusMsg({ type: 'error', text: 'Please fill in all security fields.' });
      return;
    }

    if (newSecurePassword !== confirmSecurePassword) {
      setPasswordStatusMsg({ type: 'error', text: 'Confirmation Mismatch: Passwords do not match.' });
      return;
    }

    if (newSecurePassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'Weak Credentials: Passwords must contain 6+ characters.' });
      return;
    }

    try {
      setPasswordStatusMsg(null);
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserToModify.id, newPassword: newSecurePassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordStatusMsg({ type: 'success', text: `Changed password successfully for user: ${selectedUserToModify.username}!` });
        setNewSecurePassword('');
        setConfirmSecurePassword('');
        // Clean selection state after 3 seconds
        setTimeout(() => {
          setSelectedUserToModify(null);
          setPasswordStatusMsg(null);
        }, 3000);
      } else {
        setPasswordStatusMsg({ type: 'error', text: data.error || 'Password update failed.' });
      }
    } catch (err) {
      setPasswordStatusMsg({ type: 'error', text: 'System offline: Password change server route inaccessible.' });
    }
  };

  const handleDeleteUserAction = async (targetUser: User) => {
    if (targetUser.id === user.id) {
      alert('Self-destruction blocked: Cannot delete your own active running session.');
      return;
    }
    if (!confirm(`CRITICAL SECURITY WARNING: Deleting user account "${targetUser.username}" cannot be undone. Do you wish to proceed?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(`User "${targetUser.username}" removed from registry.`);
        fetchAdminData();
        if (selectedUserToModify?.id === targetUser.id) {
          setSelectedUserToModify(null);
        }
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error('User deletion failure:', err);
    }
  };

  const handleFactoryResetSystemOrders = async (e: FormEvent) => {
    e.preventDefault();
    if (resetConfirmInput !== 'RESET') {
      setResetStatusMsg({ type: 'error', text: 'Validation Error: Please exactly type "RESET" in capital letters.' });
      return;
    }

    try {
      setIsResetting(true);
      setResetStatusMsg(null);
      const res = await fetch('/api/system/reset-orders', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetStatusMsg({ type: 'success', text: 'SUCCESS: Restaurant Transaction Ledger, Live orders, and Tables completely re-initialized.' });
        setResetConfirmInput('');
      } else {
        setResetStatusMsg({ type: 'error', text: data.error || 'Reset failed.' });
      }
    } catch (err) {
      setResetStatusMsg({ type: 'error', text: 'System recovery unreachable.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-2xl">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Admin Control Core</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Role: {user.username} ({user.role})</p>
          </div>
        </div>

        {/* Tab row */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/55 dark:border-slate-800 flex-wrap gap-1">
          {[
            { id: 'menu', label: '📖 Menu' },
            { id: 'users', label: '👥 Staff' },
            { id: 'tables', label: '🖨️ QR Tables' },
            { id: 'audits', label: '🗒️ Audits' },
            ...(user.role === 'Super Admin' ? [{ id: 'security', label: '🔒 Security System' }] : []),
            { id: 'privacy', label: '🕵️ Privacy Controls' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Rendering Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
        
        {/* TAB 1: MENU MANAGER */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Inventory Products Stock ({menuItems.length} seeded)</h2>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Manage details and instant availability for customers</p>
              </div>
              <button
                onClick={() => { resetMenuForm(); setMenuFormOpen(true); }}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 text-black hover:bg-amber-600 font-black rounded-xl text-xs uppercase tracking-wider shadow"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                Add Menu Item
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading items inventory...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
                      <th className="py-3 px-2">Item Name</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all font-semibold">
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 min-w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-3xs"
                              />
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-sm">{item.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-medium italic mt-1 font-mono truncate max-w-xs">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 uppercase tracking-wide font-bold">{item.category}</td>
                        <td className="py-3.5 px-2 font-mono">{item.price.toLocaleString()} TZS</td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            item.isAvailable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-605'
                          }`}>
                            {item.isAvailable ? 'Active' : 'Off-menu'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right space-x-2.5">
                          <button
                            onClick={() => handleEditMenuItem(item)}
                            className="text-amber-500 hover:text-amber-600"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4 inline" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="text-rose-600 hover:text-rose-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGER */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Restaurant Employee Registry</h2>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Role based access parameters controls (RBAC)</p>
              </div>
              <button
                onClick={() => setUserFormOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow"
              >
                <UserPlus className="h-4 w-4" />
                Register Staff
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Opening rosters...</div>
            ) : (
              <div className="space-y-3.5">
                {users.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">{item.username}</div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Employee ID: {item.id}</span>
                    </div>

                    <span className="px-3.5 py-1.5 rounded-xl border border-slate-200/50 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 text-xs font-black font-mono">
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TABLES QR CODE EXPORTS */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Physical Tables QR Generators (1 to 100)</h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Physical table signs mapped dynamically. Clicking displays or saves table trigger links.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
              {Array.from({ length: 100 }, (_, i) => i + 1).map((tId) => (
                <button
                  key={tId}
                  onClick={() => setViewingTableId(tId)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/55 dark:border-slate-800/80 hover:border-amber-400 hover:bg-amber-500/5 hover:-translate-y-0.5 rounded-xl text-center shadow-xs transition-all cursor-pointer group"
                >
                  <Eye className="h-4 w-4 mx-auto text-slate-400 group-hover:text-amber-500 mb-1" />
                  <div className="text-xs font-black text-slate-900 dark:text-white font-mono">Table {tId}</div>
                  <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mt-1">Get QR</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audits' && (
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Audit Security Log Registrars</h2>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Detailed employee chronological action monitoring</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Exposing logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">No action entries recorded in the log file.</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold font-mono">
                    <div className="space-y-1">
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white font-sans">{log.username} ({log.role})</span> • {log.action}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SUPER ADMIN CORE SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <span className="p-1 bg-rose-500/10 text-rose-500 rounded-lg">🔒</span>
                Core Cybersecurity Control Center
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                Restricted System Administration and Security Override Panels. Actions logged dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Panel: Employee Registry Override (Change PIN/Password or Deletion) */}
              <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    System-Wide Credential Manager
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    Select any employee roster profile below to override or change their system PIN/password.
                  </p>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {users.map((item) => {
                    const isSelected = selectedUserToModify?.id === item.id;
                    const isSelf = item.id === user.id;

                    return (
                      <div 
                        key={item.id} 
                        className={`transition-all border p-3.5 rounded-xl flex flex-col gap-3 ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/30' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                              {item.username}
                              {isSelf && (
                                <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block mt-1">
                              Role: {item.role} • ID: {item.id.substring(0, 8)}
                            </span>
                          </div>

                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordStatusMsg(null);
                                setSelectedUserToModify(isSelected ? null : item);
                                setNewSecurePassword('');
                                setConfirmSecurePassword('');
                              }}
                              className={`cursor-pointer text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                                isSelected
                                ? 'bg-amber-500 border-amber-500 text-white shadow-xs font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Cancel' : 'Change PIN'}
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleDeleteUserAction(item)}
                              className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1.5 rounded-lg transition-all ${
                                isSelf
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-350 dark:text-slate-650 cursor-not-allowed opacity-50'
                                : 'bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/10 text-rose-500 cursor-pointer'
                              }`}
                              title={isSelf ? 'Self destruction protection' : 'Remove user completely'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Expandable Password Reset Form */}
                        {isSelected && (
                          <form 
                            onSubmit={handleChangePassword} 
                            className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in text-xs font-bold font-sans"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">
                                  New PIN or Password
                                </label>
                                <input
                                  type="password"
                                  placeholder="Minimum 6 characters"
                                  required
                                  value={newSecurePassword}
                                  onChange={(e) => setNewSecurePassword(e.target.value)}
                                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-slate-400">
                                  Confirm PIN
                                </label>
                                <input
                                  type="password"
                                  placeholder="Repeat new PIN"
                                  required
                                  value={confirmSecurePassword}
                                  onChange={(e) => setConfirmSecurePassword(e.target.value)}
                                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {passwordStatusMsg && (
                              <div className={`p-2.5 rounded-lg text-[10px] font-bold ${
                                passwordStatusMsg.type === 'success' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                {passwordStatusMsg.text}
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                type="submit"
                                className="cursor-pointer px-4.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg shadow-sm"
                              >
                                Commit Password Change
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: Advanced Disaster Override Panel */}
              <div className="lg:col-span-5 space-y-6">
                {/* Statistics Box */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                    Security Telemetry Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-rose-500 font-mono">
                        {users.length}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                        Accounts Active
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="text-xl font-black text-blue-500 font-mono">
                        100
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                        Table Signposts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Flash / Wipe Factory Card */}
                <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-rose-500/10 text-rose-500 rounded-xl font-bold shrink-0">⚠️</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-500">
                        Disaster Recovery & Reset
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 leading-relaxed">
                        Destructive Action: Wipes all live orders, history, and payment tickets. Retains menu configuration. Tables reset to Empty.
                      </p>
                    </div>
                  </div>

                  <form 
                    onSubmit={handleFactoryResetSystemOrders} 
                    className="space-y-3 font-sans text-xs font-semibold"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-rose-500 uppercase font-black tracking-wider">
                        Type "RESET" to confirm action
                      </label>
                      <input
                        type="text"
                        placeholder="RESET"
                        required
                        disabled={isResetting}
                        value={resetConfirmInput}
                        onChange={(e) => setResetConfirmInput(e.target.value)}
                        className="w-full text-xs font-black text-slate-900 dark:text-white uppercase p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none bg-white focus:ring-1 focus:ring-rose-500 dark:bg-slate-950"
                      />
                    </div>

                    {resetStatusMsg && (
                      <div className={`p-3 rounded-xl leading-relaxed text-[10px] font-bold ${
                        resetStatusMsg.type === 'success' 
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                      }`}>
                        {resetStatusMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isResetting || resetConfirmInput !== 'RESET'}
                      className={`cursor-pointer w-full py-2.5 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm ${
                        isResetting || resetConfirmInput !== 'RESET'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/15'
                      }`}
                    >
                      {isResetting ? 'Processing wipe...' : 'Factory Reset Whole System'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GLOBAL SECURITY PRIVACY FILTERS */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-fade-in text-slate-700 dark:text-slate-300">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">🕵️</span>
                Roster & Financial Privacy Control Center
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                Protect sensitive business indexes, transaction IDs, and customer telemetry on monitors.
              </p>
            </div>

            <div className="max-w-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="space-y-4">
                {/* Switch 1: Mask Financial Metrics */}
                <div className="flex items-start justify-between gap-4 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white block uppercase tracking-wider">
                      Censor Financial Aggregates & Metrics
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Masks "Total Revenue", "Net Profits", and payment summaries on all active dashboard displays unless unhidden with hover.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maskMetrics}
                    onChange={(e) => setMaskMetrics(e.target.checked)}
                    className="cursor-pointer h-5 w-10 rounded-full appearance-none bg-slate-200 dark:bg-slate-800 checked:bg-amber-500 transition-all relative before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:translate-x-5"
                  />
                </div>

                {/* Switch 2: Mask Customers Identifier Data */}
                <div className="flex items-start justify-between gap-4 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white block uppercase tracking-wider">
                      Obfuscate Customer Identity Data
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Conceals precise SOS phone numbers, table instructions, and private note entries from the standard terminal list.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maskData}
                    onChange={(e) => setMaskData(e.target.checked)}
                    className="cursor-pointer h-5 w-10 rounded-full appearance-none bg-slate-200 dark:bg-slate-800 checked:bg-amber-500 transition-all relative before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:translate-x-5"
                  />
                </div>

                {/* Switch 3: Mask Payment Platform Transaction IDs */}
                <div className="flex items-start justify-between gap-4 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white block uppercase tracking-wider">
                      Mask Transaction operator IDs
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Restricts exposure of live operator transaction reference codes (e.g. Airtel Money, M-Pesa, Card serials) into standard table registers.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maskPayments}
                    onChange={(e) => setMaskPayments(e.target.checked)}
                    className="cursor-pointer h-5 w-10 rounded-full appearance-none bg-slate-200 dark:bg-slate-800 checked:bg-amber-500 transition-all relative before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:translate-x-5"
                  />
                </div>
              </div>

              {privacySaveStatus && (
                <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase text-center tracking-wider animate-pulse">
                  {privacySaveStatus}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrivacySettings}
                  className="cursor-pointer px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Save Privacy Controls
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD / EDIT MENU ITEM */}
      {menuFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveMenuItem} 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingItemId ? 'Edit Menu Dish' : 'Add New Cuisine'}
              </h3>
              <button 
                type="button" 
                onClick={() => setMenuFormOpen(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-550 dark:text-slate-400">
              <div className="space-y-1">
                <label>Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Pilau Classic"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label>Price (TZS)</label>
                  <input
                    type="number"
                    required
                    placeholder="E.g. 10000"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label>Category</label>
                  <select
                    value={menuCategory}
                    onChange={(e) => setMenuCategory(e.target.value as any)}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                  >
                    <option value="Food">🍛 Food</option>
                    <option value="Drink">🥤 Drink</option>
                    <option value="Fruit">🍎 Fruit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label>Ingredients/Description</label>
                <textarea
                  placeholder="Traditional spices, basmati rice, choice lean meat..."
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                  className="w-full h-20 text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Product Image Form Field */}
              <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Product Image (800x800 px JPG/PNG/WEBP)</label>
                
                {/* Image Preview & Delete Action */}
                {(menuBase64 || menuImageUrl) && (
                  <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 group">
                    <img 
                      src={menuBase64 || menuImageUrl} 
                      alt="Preview" 
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (editingItemId && menuImageUrl) {
                          if (confirm('Are you sure you want to delete this product picture?')) {
                            const res = await fetch(`/api/menu/${editingItemId}/image?userId=${user.id}&username=${user.username}&userRole=${user.role}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) {
                              setMenuImageUrl('');
                              setMenuItems(prev => prev.map(m => m.id === editingItemId ? { ...m, imageUrl: '', image_url: '', image_name: '' } : m));
                            }
                          }
                        } else {
                          setMenuBase64('');
                        }
                      }}
                      className="absolute inset-0 bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-155 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {/* File Input */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setMenuBase64(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-[11px] text-slate-500 file:mr-3.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wide file:bg-slate-900 file:text-white file:hover:bg-slate-800 dark:file:bg-white dark:file:text-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="avail-check"
                  checked={menuAvailable}
                  onChange={(e) => setMenuAvailable(e.target.checked)}
                  className="h-4 w-4 bg-white dark:bg-slate-950 border-slate-300 p-1"
                />
                <label htmlFor="avail-check" className="text-xs text-slate-650 dark:text-slate-300 select-none cursor-pointer">
                  Is available in stock for active table QR digital menus
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMenuFormOpen(false)}
                className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl"
              >
                Close
              </button>
              
              <button
                type="submit"
                className="cursor-pointer px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-600 font-extrabold rounded-xl"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW EMPLOYEE STAFF USER */}
      {userFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleRegisterUser} 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <UserPlus className="h-5 w-5 text-amber-500" />
                Register Staff Member
              </h3>
              <button 
                type="button" 
                onClick={() => setUserFormOpen(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-bold text-slate-550 dark:text-slate-400">
              <div className="space-y-1">
                <label>Login Username</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. kassim_waiter"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value.toLowerCase())}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label>Password key code</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters code"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label>Roster Job Role Role</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as any)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-1 bg-white dark:bg-slate-950 focus:ring-amber-500 text-slate-900 dark:text-white"
                >
                  <option value="Admin">Admin (Full Control Workspace)</option>
                  <option value="Manager">Manager (View Stats & Lists)</option>
                  <option value="Cashier">Cashier (Billing & Cash Registry)</option>
                  <option value="Waiter">Waiter (Floor Order Attendant)</option>
                  <option value="Kitchen Staff">Kitchen Staff (Culinary Cook)</option>
                  <option value="Bar Staff">Bar Staff (Drink pourer)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUserFormOpen(false)}
                className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl"
              >
                Close
              </button>
              
              <button
                type="submit"
                className="cursor-pointer px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-50 font-extrabold rounded-xl"
              >
                Assemble User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: UNIQUE TABLE QR INSPECTOR */}
      {viewingTableId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col p-6 items-center text-center space-y-4">
            <div className="w-full flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-mono uppercase">Table {viewingTableId} QR Registry Code</h3>
              <button 
                type="button" 
                onClick={() => setViewingTableId(null)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Render stored path physical QR card code image */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4.5 border border-slate-100 dark:border-slate-800 rounded-[20px] shadow-inner">
              <img 
                src={`/api/qr/${viewingTableId}`} 
                alt={`Table ${viewingTableId} QR link`}
                className="h-48 w-48 mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Scan Destination URL Target</h4>
              <p className="font-mono text-[10px] break-all text-blue-500 underline font-bold select-all bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800">
                {window.location.origin}/table/{viewingTableId}
              </p>
            </div>

            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              Print this code and attach to glass holders or menus of Table {viewingTableId}. When scanned, it logs table orders automatically.
            </p>

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = `/api/qr/${viewingTableId}`;
                link.download = `table_${viewingTableId}_qr.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="cursor-pointer font-black text-xs uppercase tracking-wider text-amber-500 py-1"
            >
              📥 Download PNG Asset
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
