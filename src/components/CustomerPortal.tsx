/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, MessageSquare, Bell, CreditCard, Search, Check, Plus, Minus, AlertCircle, Sparkles, Star, ArrowLeft, AlertTriangle, PhoneCall, ShieldAlert, Siren } from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { motion } from 'motion/react';

interface CustomerPortalProps {
  tableId: number;
  onBack?: () => void;
}

const TRANSLATIONS = {
  sw: {
    backToHub: "Rudi Mwanzo",
    fineDining: "Huduma Bora ya Chakula",
    smartLogo: "Orodha ya Smart Luxe • Nyota 5",
    beachfront: "Mstari wa Ufukweni",
    table: "Meza",
    requestAssist: "Omba Msaada Mezani",
    assistDispatched: "Msaidizi ametumwa mezani kwako!",
    requestBill: "Omba Ankara ya Malipo",
    billRequested: "Inasubiri Risiti ya Malipo...",
    triggerSos: "Anzisha Dharura ya SOS",
    incidentEmergency: "Wito wa Dharura wa Haraka",
    incidentDesc: "Ripoti ya haraka ya matibabu, moto, usalama au hatari ya kuteleza",
    activeTracker: "Mfuatiliaji wa Agizo Lako",
    searchingFood: "Tafuta vyakula, vinywaji, matunda...",
    completeMenu: "Orodha Kamili",
    foods: "🍛 Vyakula",
    drinks: "🥤 Vinywaji",
    fruits: "🍎 Matunda",
    gatheringIngredients: "Tunakusanya viungo vipya...",
    noItemsFound: "Hakuna Kipengele Kilichopatikana",
    noItemsDesc: "Hatukuweza kupata chakula kinacholingana. Tafadhali rekebisha utafutaji wako.",
    cooked: "🍛 Kupikwa",
    cellar: "🥤 Vinywaji Baridi",
    orchards: "🍎 Bustanini",
    soldOut: "Kimeisha",
    price: "Bei",
    addToCart: "Weka Kwenye Kikapu",
    cartTotal: "Jumla",
    reviewOrder: "Kagua Kikapu",
    confirmOrder: "Thibitisha Agizo Lako",
    tableIdLabel: "Meza namba",
    close: "Funga",
    each: "kila kimoja",
    specialInstructions: "Maagizo Maalum kwa Mpishi",
    specialInstructionsPlaceholder: "Mfano: Usiweke vitunguu, ongeza pilipili kidogo, maji ya kutosha juu ya matunda...",
    subtotal: "Jumla ya Kikapu",
    vatService: "Kodi ya VAT & Huduma (Imejumuishwa)",
    grandTotal: "Jumla Kuu",
    submitOrder: "Wasilisha Agizo kwa Muhudumu",
    highPrioritySos: "Tangazo la Dharura la SOS (Kipaumbele cha Juu)",
    securityDispatcher: "Ujumbe wa moja kwa moja kwa wasimamizi wa ulinzi",
    sosDispatched: "Dharura ya SOS Imetumwa na Kurekodiwa!",
    sosDesc: "Kingora cha dharura kimewashwa. Wasimamizi na walinzi wameelekezwa kwenye MEZA yako kwa haraka sana. Tafadhali tulia.",
    emergencyCategory: "Chagua Aina ya Dharura:",
    optionalNote: "Ongeza Maelezo ya Ziada ya Tukio (Hiari)",
    optionalNotePlaceholder: "Mfano: Kuna moto mdogo mikoani au mteja ameanguka chini...",
    cancel: "Ghairi",
    dispatchAlert: "Tuma Dharura Sasa",
    medicalEmergency: "Dharura ya Matibabu",
    medicalDesc: "Kukabwa, kuzimia, kifafa au hatari ya mzio ya chakula",
    fireHazard: "Usalama / Hatari ya Moto",
    fireDesc: "Moto wa gridi, kuvunjika kwa glasi au moshi mezani",
    spillSlip: "Mwagiko / Hatari ya Kuteleza",
    spillDesc: "Mwagiko wa mafuta au kuteleza kwenye vigae",
    altercation: "Tukio / Ugomvi",
    altercationDesc: "Ugomvi wa wateja unaohitaji usimamizi wa walinzi",
    notifSuccess: "Agizo lako limewasilishwa vizuri! Muhudumu anaandaa sasa.",
    notifError: "Imeshindwa kuagiza. Tafadhali jaribu tena baada ya muda.",
    billSuccess: "Mombi ya malipo yamefika kwa Mhasibu! Risiti inatayarishwa.",
    assistanceDispatchedMsg: "Ombi la msaada limefika kwa wahudumu wedu. Wanakuja!",
    activeOrderTrackerEmpty: "Hakuna maagizo yoyote yanayofanya kazi kwa sasa kwenye meza hii.",
    order_id: "Namba ya Agizo",
    checkout_receipt: "Tayari Risiti",
    checkout_pending: "Inasubiri Uhakiki",
  },
  en: {
    backToHub: "Back to Login",
    fineDining: "Fine Dining Suite",
    smartLogo: "SmartMenu Luxe • 5-Star Experience",
    beachfront: "Beachfront Row",
    table: "Table",
    requestAssist: "Request Table Assistance",
    assistDispatched: "Concierge Assistance Dispatched",
    requestBill: "Request Checkout Bill",
    billRequested: "Checkout Pending receipt",
    triggerSos: "Trigger SOS",
    incidentEmergency: "Incident Emergency Call",
    incidentDesc: "Urgent medical, safety hazard, fire alert or slip danger reporting",
    activeTracker: "Active Order Tracker",
    searchingFood: "Search foods, drinks, traditional dishes...",
    completeMenu: "Complete Menu",
    foods: "🍛 Foods",
    drinks: "🥤 Drinks",
    fruits: "🍎 Fruits",
    gatheringIngredients: "Gathering fresh ingredients...",
    noItemsFound: "No Items Found",
    noItemsDesc: "We couldn't find matching menu options. Please refine your search criteria.",
    cooked: "🍛 Cooked",
    cellar: "🥤 Cellar",
    orchards: "🍎 Orchards",
    soldOut: "Sold Out",
    price: "Price",
    addToCart: "Add To Cart",
    cartTotal: "Cart Total",
    reviewOrder: "Review Order",
    confirmOrder: "Confirm Your Order",
    tableIdLabel: "Table #",
    close: "Close",
    each: "each",
    specialInstructions: "Special Instructions",
    specialInstructionsPlaceholder: "E.g. Extra hot sauce, no onions, ice separate, fruits cut into smaller portions...",
    subtotal: "Basket Subtotal",
    vatService: "VAT & Service (Included)",
    grandTotal: "Grand Total",
    submitOrder: "Submit Order to Waiter",
    highPrioritySos: "High-Priority Emergency SOS Broadcast",
    securityDispatcher: "Direct dispatcher to floor managers & security",
    sosDispatched: "SOS Emergency Dispatched!",
    sosDesc: "Siren beacon triggered. Floor manager, security guards, and medical/fire stewards have been dispatched to TABLE with highest urgency. Please remain calm.",
    emergencyCategory: "Select Emergency Category:",
    optionalNote: "Add Optional Incident Note",
    optionalNotePlaceholder: "E.g. Hot grease fire on table griddle, need dry extinguisher...",
    cancel: "Cancel",
    dispatchAlert: "Dispatch Alert",
    medicalEmergency: "Medical Emergency",
    medicalDesc: "Choking, fainting, seizure or allergy hazard",
    fireHazard: "Safety / Fire Hazard",
    fireDesc: "Active burner fire, glass shattering or smoke",
    spillSlip: "Spill / Slip Threat",
    spillDesc: "Oil/liquid spill, slippery tile hazard",
    altercation: "Diner Incident / Conflict",
    altercationDesc: "Diner altercation requiring security staff",
    notifSuccess: "Order submitted successfully! Your server has been notified.",
    notifError: "Failed to place order. Please try again.",
    billSuccess: "Billing request sent to Cashier. Generating receipt...",
    assistanceDispatchedMsg: "Concierge alerts sent. Waiter is on their way!",
    activeOrderTrackerEmpty: "No active orders for this table at the moment.",
    order_id: "Order ID",
    checkout_receipt: "Receipt Ready",
    checkout_pending: "Payment Pending Validation",
  }
};

const getItemRating = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.4 + (hash % 6) * 0.1).toFixed(1);
  const reviews = 24 + (hash % 85);
  return { rating, reviews };
};

export default function CustomerPortal({ tableId, onBack }: CustomerPortalProps) {
  const [lang, setLang] = useState<'sw' | 'en'>('sw');
  const t = (key: keyof typeof TRANSLATIONS.sw) => TRANSLATIONS[lang][key];

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Food' | 'Drink' | 'Fruit'>('All');
  
  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Active Customer Orders (for tracking checkout)
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  // Emergency SOS state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState<'medical' | 'hazard' | 'spill' | 'incident' | null>(null);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencyDispatched, setEmergencyDispatched] = useState(false);

  // Subtle web audio sound synthesizer to emit real haptic-like scanner feedback
  const playConfirmSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playChimeNode = (timeOffset: number, freq: number, size: number) => {
        const osc = audioCtx.createOscillator();
        const amp = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + timeOffset);
        
        amp.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
        amp.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + timeOffset + 0.02);
        amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + timeOffset + size);
        
        osc.connect(amp);
        amp.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + timeOffset);
        osc.stop(audioCtx.currentTime + timeOffset + size);
      };

      // Double harmonized clean notification "ding-ding" chime
      playChimeNode(0, 523.25, 0.12); // High C principal
      playChimeNode(0.06, 659.25, 0.20); // Harmonized high E interval
    } catch (e) {
      console.warn('Audio feedback context prevented or not supported:', e);
    }
  };

  // Load menu and check for active orders for this table
  useEffect(() => {
    fetchMenu();
    // Poll active orders and table status every 5 seconds for tracking workflow status
    fetchActiveOrders();
    const interval = setInterval(() => {
      fetchActiveOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [tableId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
        playConfirmSound();
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // Get active orders for this table (excluding Completed / Paid / Cancelled)
        const filtered = data.filter((o: any) => 
          o.tableId === tableId && 
          !['Paid', 'Completed', 'Cancelled'].includes(o.status)
        );
        setActiveOrders(filtered);
      }
    } catch (err) {
      console.error('Error tracking active orders:', err);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, {
          id: '',
          menuItemId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: 1
        }];
      }
    });
  };

  const handleUpdateQuantity = (menuItemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          items: cart,
          notes: specialNotes
        })
      });
      if (res.ok) {
        setCart([]);
        setSpecialNotes('');
        setIsCartOpen(false);
        fetchActiveOrders();
        alert(t('notifSuccess'));
      } else {
        alert(t('notifError'));
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
    }
  };

  const handleCallWaiter = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Table ${tableId} requests assistance (At table call)`,
          type: 'CallWaiter',
          role: 'Waiter'
        })
      });
      if (res.ok) {
        setWaiterCalled(true);
        setTimeout(() => setWaiterCalled(false), 8000);
      }
    } catch (err) {
      console.error('Error calling waiter:', err);
    }
  };

  const handleTriggerEmergencySOS = async (typeDesc: string) => {
    try {
      const formattedNotes = emergencyNotes ? ` Detail: "${emergencyNotes}"` : '';
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🚨 [EMERGENCY SOS] Table ${tableId} triggered a Priority ALERT for [${typeDesc}]!${formattedNotes}`,
          type: 'Emergency',
          role: 'Manager'
        })
      });
      if (res.ok) {
        setEmergencyDispatched(true);
        playSirenSound();
        setTimeout(() => {
          setEmergencyDispatched(false);
          setShowEmergencyModal(false);
          setEmergencyType(null);
          setEmergencyNotes('');
        }, 5000);
      }
    } catch (err) {
      console.error('SOS dispatch failure:', err);
    }
  };

  const playSirenSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playWobble = (timeOffset: number) => {
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        const amp = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(680, audioCtx.currentTime + timeOffset);
        
        lfo.frequency.setValueAtTime(5, audioCtx.currentTime + timeOffset);
        lfoGain.gain.setValueAtTime(160, audioCtx.currentTime + timeOffset);
        
        amp.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
        amp.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + timeOffset + 0.05);
        amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + timeOffset + 1.8);
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(amp);
        amp.connect(audioCtx.destination);
        
        lfo.start(audioCtx.currentTime + timeOffset);
        osc.start(audioCtx.currentTime + timeOffset);
        
        lfo.stop(audioCtx.currentTime + timeOffset + 1.8);
        osc.stop(audioCtx.currentTime + timeOffset + 1.8);
      };

      playWobble(0);
      playWobble(1.5);
    } catch (e) {
      console.warn('Audio contextual limit:', e);
    }
  };

  const handleRequestBill = async () => {
    if (activeOrders.length === 0) {
      alert(t('activeOrderTrackerEmpty'));
      return;
    }
    try {
      const res = await fetch(`/api/orders/table/${tableId}/bill`, {
        method: 'POST'
      });
      if (res.ok) {
        setBillRequested(true);
        setTimeout(() => setBillRequested(false), 8000);
        alert(t('billSuccess'));
      }
    } catch (err) {
      console.error('Error requesting checkout receipt:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Preparing': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Served': return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Filter menu items
  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      {/* Sticky Premium Navigation Bar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                id="customer-nav-back-button"
                onClick={onBack}
                className="mr-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer flex items-center justify-center transition-all duration-150 relative active:scale-95"
                title={t('backToHub')}
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 bg-emerald-500 animate-pulse rounded-full flex items-center justify-center" />
              <div>
                <span className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-white block">Chelsea Palace</span>
                <span className="text-[8px] text-slate-400 font-bold block -mt-1 tracking-widest uppercase">{t('fineDining')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Swahili - English Interactive Selector Toggles */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={() => setLang('sw')}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                  lang === 'sw'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                SW
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                  lang === 'en'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full font-mono font-black text-[11px] uppercase tracking-wide">
              {t('table')} #{tableId}
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Header Section */}
      <div className="relative bg-charcoal-gradient text-white border-b border-slate-850 shadow-xl overflow-hidden">
        {/* Abstract subtle background highlights */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-slate-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 font-heading">
                <Sparkles className="h-3.5 w-3.5 text-amber-550" />
                {t('smartLogo')}
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-white mb-2 leading-tight">
                Chelsea Palace <span className="text-amber-500">{lang === 'sw' ? 'Kumbi la Chakula' : 'Fine Dining'}</span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  <Star className="h-3.5 w-3.5 fill-amber-400/80 stroke-none" />
                  <span className="font-extrabold text-white ml-1">4.9</span>
                  <span className="text-slate-400 font-medium text-[11px]">(1,480+ Reviews)</span>
                </div>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] tracking-wide bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 font-semibold border border-slate-700/50">{t('beachfront')}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end justify-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 block">{lang === 'sw' ? 'Meza Yako ya QR' : 'Your QR Table'}</span>
              <span className="inline-flex items-center justify-center px-6 py-3 text-lg font-black font-mono bg-white/5 dark:bg-white/10 backdrop-blur-md rounded-2xl border-2 border-amber-500/60 shadow-lg text-amber-500">
                {t('table').toUpperCase()} {tableId}
              </span>
            </div>
          </div>

          {/* Quick Concierge Assist Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCallWaiter}
              disabled={waiterCalled}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                waiterCalled 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-white/5 hover:bg-white/10 border-slate-700/80 text-slate-100 cursor-pointer active:scale-95 hover:border-amber-500/40'
              }`}
            >
              <Bell className={`h-4 w-4 ${waiterCalled ? 'animate-bounce' : ''}`} />
              {waiterCalled ? t('assistDispatched') : t('requestAssist')}
            </button>
            <button
              onClick={handleRequestBill}
              disabled={billRequested || activeOrders.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                billRequested 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-500 text-slate-950 border-transparent shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              {billRequested ? t('billRequested') : t('requestBill')}
            </button>
          </div>

          {/* Emergency SOS Accessor */}
          <div className="mt-5 border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row justify-between items-center bg-rose-500/[0.04] p-4.5 rounded-2xl border border-rose-500/10 gap-3">
            <div className="flex items-start gap-2.5 text-rose-500 text-xs">
              <Siren className="h-4.5 w-4.5 animate-pulse shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wide">{t('incidentEmergency')}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{t('incidentDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowEmergencyModal(true);
                setEmergencyDispatched(false);
              }}
              className="w-full sm:w-auto font-black uppercase tracking-wider text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer shrink-0"
            >
              <ShieldAlert className="h-4 w-4" />
              {t('triggerSos')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Active Order Progress Panel */}
        {activeOrders.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-md">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-3.5 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t('activeTracker')}
            </h2>
            
            {activeOrders.map((order) => (
              <div key={order.id} className="last:border-b-0 border-b border-dashed border-slate-100 dark:border-slate-800 py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {order.id.slice(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono border ${getStatusColor(order.status)}`}>
                    {lang === 'sw' ? (order.status === 'Pending' ? 'Inasubiri' : order.status === 'Accepted' ? 'Imekubaliwa' : order.status === 'Preparing' ? 'Inaandalishwa' : order.status === 'Ready' ? 'Iko Tayari' : order.status === 'Served' ? 'Kuhudumiwa' : order.status) : order.status}
                  </span>
                </div>

                {/* Stepper Progress Visual Nodes */}
                <div className="relative my-6 px-1.5">
                  {/* Background Track Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-700 ease-out" 
                      style={{
                        width: 
                          order.status === 'Pending' ? '12.5%' :
                          order.status === 'Accepted' ? '37.5%' :
                          order.status === 'Preparing' ? '62.5%' :
                          order.status === 'Ready' ? '87.5%' : '100%'
                      }}
                    />
                  </div>

                  {/* Stepper Nodes */}
                  <div className="relative flex justify-between z-10">
                    {[
                      { step: 'Pending', label: lang === 'sw' ? 'Imeagizwa' : 'Ordered', icon: '🕒', activeColor: 'bg-amber-500' },
                      { step: 'Accepted', label: lang === 'sw' ? 'Imekubaliwa' : 'Accepted', icon: '👍', activeColor: 'bg-blue-500' },
                      { step: 'Preparing', label: lang === 'sw' ? 'Kwenye Jiko' : 'Preparing', icon: '🍳', activeColor: 'bg-purple-500' },
                      { step: 'Ready', label: lang === 'sw' ? 'Iko Tayari' : 'Ready', icon: '🍽️', activeColor: 'bg-emerald-500' },
                      { step: 'Served', label: lang === 'sw' ? 'Imepokewa' : 'Served', icon: '✨', activeColor: 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-950' }
                    ].map((stepObj, index) => {
                      const stepsList = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Served'];
                      const orderStatusIdx = stepsList.indexOf(order.status);
                      const isCompleted = index <= orderStatusIdx;
                      const isCurrent = index === orderStatusIdx;

                      return (
                        <div key={stepObj.step} className="flex flex-col items-center">
                          <div 
                            className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-300 shadow-sm ${
                              isCompleted 
                                ? `${stepObj.activeColor} border-transparent scale-110` 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-305'
                            } ${isCurrent ? 'ring-4 ring-amber-500/20 animate-pulse' : ''}`}
                          >
                            <span>{stepObj.icon}</span>
                          </div>
                          <span className={`text-[9px] sm:text-[10px] mt-1.5 font-black uppercase tracking-wider ${
                            isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-404'
                          }`}>
                            {stepObj.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3.5 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t('searchingFood')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10.5 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all font-medium text-sm shadow-sm"
            />
          </div>

          {/* Core Categories Filter */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Food', 'Drink', 'Fruit'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'All' ? t('completeMenu') : cat === 'Food' ? t('foods') : cat === 'Drink' ? t('drinks') : t('fruits')}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            <span className="inline-block h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></span>
            <div>{t('gatheringIngredients')}</div>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-6 flex flex-col items-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-400 mb-3" />
            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">{t('noItemsFound')}</div>
            <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">{t('noItemsDesc')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item) => {
              const itemRating = getItemRating(item.id);
              return (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  whileHover={{ y: -6 }}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Product Image & Floating Rating Badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-300">
                        <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}

                    {/* Highly aesthetic Glassmorphism rating badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md text-[11px] font-black text-white flex items-center gap-1 shadow-md border border-white/5">
                      <Star className="h-3 w-3 fill-amber-400 stroke-none" />
                      <span className="text-amber-400">{itemRating.rating}</span>
                      <span className="text-slate-300 font-medium text-[9.5px]">({itemRating.reviews})</span>
                    </div>

                    {/* Category overlay */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm text-[9.5px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100/10">
                      {item.category === 'Food' ? t('cooked') : item.category === 'Drink' ? t('cellar') : t('orchards')}
                    </div>

                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-[10.5px] font-black uppercase tracking-widest shadow-md">
                          {t('soldOut')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold font-heading text-slate-950 dark:text-slate-100 text-[15.5px] tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-200">
                        {item.name}
                      </h3>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-1.5 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold">{t('price')}</div>
                        <span className="text-slate-900 dark:text-white font-extrabold font-mono text-[14.5px] tracking-tight">
                          {(item.price).toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-bold">TZS</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable}
                        className="cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all duration-200"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        {t('addToCart')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar for Cart */}
      {cart.length > 0 && (
        <div id="floating-cart-anchor" className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-4.5 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-md border border-amber-300">
                <ShoppingBag className="h-5 w-5 stroke-[2.5]" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-extrabold font-mono rounded-full h-5.5 w-5.5 flex items-center justify-center text-[10px] border border-white">
                  {getCartCount()}
                </span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{t('cartTotal')}</div>
                <div className="font-extrabold font-mono text-slate-900 dark:text-slate-200 text-base">
                  {getCartTotal().toLocaleString()} TZS
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold rounded-2xl text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all duration-250 cursor-pointer"
            >
              {t('reviewOrder')}
              <ChevronRight className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div id="cart-drawer-backdrop" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          {/* Main Backdrop click closer */}
          <div className="flex-1" onClick={() => setIsCartOpen(false)} />
          
          <div className="w-full max-w-md bg-white dark:bg-slate-950 h-full flex flex-col shadow-2xl overflow-hidden border-l border-slate-200 dark:border-slate-900">
            <div className="p-5 border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black font-sans text-slate-900 dark:text-slate-200">{t('confirmOrder')}</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{t('tableIdLabel')} #{tableId} • SmartMenu TZ</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm text-slate-500"
              >
                {t('close')}
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.map((item) => {
                const menuItem = menu.find(m => m.id === item.menuItemId);
                return (
                  <div key={item.menuItemId} className="flex justify-between items-center gap-4 py-3 border-b border-dashed border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 flex-1">
                      {menuItem?.imageUrl && (
                        <img 
                          src={menuItem.imageUrl} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 min-w-10 rounded-lg object-cover border border-slate-200/50 dark:border-slate-800"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200">{item.name}</h4>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-0.5">
                          {item.price.toLocaleString()} TZS {t('each')}
                        </span>
                      </div>
                    </div>

                  <div className="flex items-center gap-3.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                    <button
                      onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                      className="p-1 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                    <span className="font-black font-mono text-slate-900 dark:text-slate-200 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                      className="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
               );
             })}

              {/* Special Instructions */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-amber-500" />
                  {t('specialInstructions')}
                </label>
                <textarea
                  placeholder={t('specialInstructionsPlaceholder')}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full h-24 p-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none focus:ring-1.5 focus:ring-amber-400 font-medium text-slate-805 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Bottom Checkout Panel */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/20">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{t('subtotal')}</span>
                  <span className="font-mono">{getCartTotal().toLocaleString()} TZS</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{t('vatService')}</span>
                  <span className="font-mono">0 TZS</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 font-black text-slate-900 dark:text-slate-200">
                  <span>{t('grandTotal')}</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400 font-black">
                    {getCartTotal().toLocaleString()} TZS
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-50 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-transparent shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Check className="h-4.5 w-4.5 stroke-[3]" />
                {t('submitOrder')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 Emergency SOS Modal Overlay */}
      {showEmergencyModal && (
        <div id="emergency-sos-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-55 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 text-slate-100">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <span className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl animate-pulse">
                <Siren className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-sm font-black uppercase text-rose-500 tracking-widest">
                  {t('highPrioritySos')}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  {t('table')} {tableId} • {t('securityDispatcher')}
                </p>
              </div>
            </div>

            {emergencyDispatched ? (
              <div className="py-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-rose-500 rounded-full text-white animate-bounce">
                  <ShieldAlert className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-rose-450 uppercase tracking-wide">
                    {t('sosDispatched')}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                    {t('sosDesc')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">
                    {t('emergencyCategory')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {[
                      { 
                        id: 'medical', 
                        label: lang === 'sw' ? 'Dharura ya Afya' : 'Medical Emergency', 
                        desc: lang === 'sw' ? 'Kukabiliwa na kikohozi, kuzimia, au mzio hatari' : 'Choking, fainting, seizure or allergy hazard', 
                        color: 'border-rose-500/30 hover:bg-rose-500/10 text-rose-400' 
                      },
                      { 
                        id: 'hazard', 
                        label: lang === 'sw' ? 'Hatari ya Usalama/Moto' : 'Safety / Fire Hazard', 
                        desc: lang === 'sw' ? 'Moto wa jiko, glasi kuvunjika au moshi' : 'Active burner fire, glass shattering or smoke', 
                        color: 'border-orange-500/30 hover:bg-orange-500/10 text-orange-400' 
                      },
                      { 
                        id: 'spill', 
                        label: lang === 'sw' ? 'Kumwagika / Kuteleza' : 'Spill / Slip Threat', 
                        desc: lang === 'sw' ? 'Mafuta au maji kumwagika kwenye vigae' : 'Oil/liquid spill, slippery tile hazard', 
                        color: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400' 
                      },
                      { 
                        id: 'incident', 
                        label: lang === 'sw' ? 'Ugomvi / Vurugu' : 'Diner Incident / Conflict', 
                        desc: lang === 'sw' ? 'Mzozo wa wateja unaohitaji walinzi' : 'Diner altercation requiring security staff', 
                        color: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-400' 
                      }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setEmergencyType(item.id as any);
                          playConfirmSound();
                        }}
                        className={`text-left p-3.5 rounded-2xl border bg-slate-950 transition-all ${item.color} ${
                          emergencyType === item.id 
                            ? 'ring-2 ring-rose-500 bg-rose-500/20 border-rose-500 font-bold' 
                            : 'border-slate-800'
                        }`}
                      >
                        <p className="text-[11px] font-black uppercase text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    {t('optionalNote')}
                  </label>
                  <textarea
                    placeholder={t('optionalNotePlaceholder')}
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    className="w-full h-16 p-3 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="cursor-pointer flex-1 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 font-extrabold uppercase tracking-wider transition-all text-center"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={!emergencyType}
                    onClick={() => {
                      const selected = [
                        { id: 'medical', label: lang === 'sw' ? 'Dharura ya Afya' : 'Medical Emergency' },
                        { id: 'hazard', label: lang === 'sw' ? 'Hatari ya Usalama/Moto' : 'Safety/Fire Hazard' },
                        { id: 'spill', label: lang === 'sw' ? 'Kumwagika / Kuteleza' : 'Spill / Slip Threat' },
                        { id: 'incident', label: lang === 'sw' ? 'Ugomvi / Vurugu' : 'Diner Incident / Conflict' }
                      ].find(x => x.id === emergencyType);
                      if (selected) {
                        handleTriggerEmergencySOS(selected.label);
                      }
                    }}
                    className={`cursor-pointer flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      emergencyType
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <Siren className="h-4 w-4 animate-bounce" />
                    {t('dispatchAlert')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
