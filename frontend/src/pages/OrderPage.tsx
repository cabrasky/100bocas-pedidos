import { useState, useEffect, useCallback, useRef } from 'react';
import { Person, Toast, WsMessage } from '../types';
import {
  getKey, getCatLabel, getCatIcon, findItem, setActiveMenu, getActiveMenu,
} from '../services/menuStore';
import { CATEGORY_LABELS } from '../data/menuData';
import {
  createSession, joinSession, addPerson, removePerson,
  upsertItem, removeItem, clearPerson,
  setSessionCookie, getSessionCookie, clearSessionCookie,
  fetchActiveMenu,
} from '../services/api';
import { SessionWebSocket } from '../services/websocket';
import LoginScreen from '../components/LoginScreen';
import Header from '../components/Header';
import PersonBar from '../components/PersonBar';
import MenuGrid from '../components/MenuGrid';
import OrderPanel from '../components/OrderPanel';
import QRModal from '../components/modals/QRModal';
import PrivacyModal from '../components/modals/PrivacyModal';
import ToastContainer from '../components/ui/ToastContainer';
import AdminPanel from '../components/admin/AdminPanel';
import OrderViewModal from '../components/modals/OrderViewModal';
import OrderHistoryModal from '../components/modals/OrderHistoryModal';
import HistoryPanel from '../components/HistoryPanel';
import SplitwiseModal from '../components/modals/SplitwiseModal';
import { placeOrder } from '../services/api';

let toastId = 0;

function OrderPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [myName, setMyName] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [currentPersonIdx, setCurrentPersonIdx] = useState(0);
  const [activeCat, setActiveCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [orderViewMode, setOrderViewMode] = useState<'by-person' | 'consolidated' | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showSplitwise, setShowSplitwise] = useState(false);
  const wsRef = useRef<SessionWebSocket | null>(null);
  const prevPersonsRef = useRef<Person[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Process action from WS to show toast
  const handleAction = useCallback((action: WsMessage['action']) => {
    if (!action) return;
    switch (action.type) {
      case 'item_added':
        addToast(`${action.person} añadió ${action.item_name}`, 'add');
        break;
      case 'item_removed':
        addToast(`${action.person} quitó #${action.item_key}`, 'remove');
        break;
      case 'item_updated':
        addToast(`${action.person} cambió #${action.item_key} a ${action.qty}ud`, 'update');
        break;
      case 'person_joined':
        addToast(`${action.name} se conectó`, 'info');
        break;
      case 'person_left':
        addToast(`${action.name} salió`, 'remove');
        break;
      case 'person_cleared':
        addToast(`${action.person} vació su pedido`, 'update');
        break;
    }
  }, [addToast]);

  // Sync persons from WS message
  const syncPersons = useCallback((msg: WsMessage) => {
    if (msg.people) {
      setPersons(msg.people);
      if (myName && !msg.people.find(p => p.name === myName)) {
        addPerson(sessionCode, myName);
      }
    }
  }, [myName, sessionCode]);

  // Handle WS message
  const onWsMessage = useCallback((msg: WsMessage) => {
    if (msg.action) handleAction(msg.action);
    syncPersons(msg);
  }, [handleAction, syncPersons]);

  // Enter a session
  const enterSession = useCallback((code: string, name: string) => {
    setSessionCode(code);
    setMyName(name);
    setSessionCookie(code, name);
    setLoading(false);

    const ws = new SessionWebSocket(code, onWsMessage);
    wsRef.current = ws;
  }, [onWsMessage]);

  // Load session data from server
  const loadSession = useCallback(async (code: string, name: string) => {
    try {
      const data = await joinSession(code);
      if (data.error) {
        clearSessionCookie();
        setLoading(false);
        return;
      }
      if (data.people) {
        setPersons(data.people);
        const idx = Math.max(0, data.people.findIndex(p => p.name === name));
        setCurrentPersonIdx(idx < 0 ? 0 : idx);
      }
    } catch { /* ignore */ }
  }, []);

  // Handle login
  const handleLogin = useCallback(async (name: string, code?: string) => {
    if (code) {
      const data = await joinSession(code);
      if (data.error) throw new Error(data.error);
      await addPerson(code, name);
      enterSession(code, name);
      loadSession(code, name);
    } else {
      const data = await createSession();
      await addPerson(data.code, name);
      enterSession(data.code, name);
      loadSession(data.code, name);
      const url = `https://euromania.cabrasky.net/app?session=${data.code}`;
      navigator.clipboard.writeText(url).then(() => {
        addToast('📋 Link de la sesión copiado al portapapeles', 'info', 4000);
      }).catch(() => {});
    }
  }, [enterSession, loadSession]);

  // Auto-reconnect on mount
  useEffect(() => {
    fetchActiveMenu().then(menu => {
      setActiveMenu(menu);
    }).catch(() => {
      setActiveMenu(null);
    });

    const saved = getSessionCookie();
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');

    if (sessionFromUrl) {
      (window as any).__joinCode = sessionFromUrl.toUpperCase();
      setLoading(false);
    } else if (saved?.code && saved?.name) {
      joinSession(saved.code).then(data => {
        if (data.error) {
          clearSessionCookie();
          setLoading(false);
          return;
        }
        enterSession(saved.code, saved.name);
        loadSession(saved.code, saved.name);
      }).catch(() => {
        clearSessionCookie();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle item
  const toggleItem = useCallback(async (catKey: string, itemKey: string) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;

    if (person.items[itemKey]) {
      await removeItem(sessionCode, person.name, itemKey);
    } else {
      const found = findItem(itemKey);
      if (!found) return;
      await upsertItem(
        sessionCode, person.name,
        itemKey, found.item.name, found.item.code || '',
        found.category, 1
      );
    }
  }, [sessionCode, myName, persons, currentPersonIdx]);

  // Change qty
  const changeQty = useCallback(async (itemKey: string, delta: number) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || !person.items[itemKey]) return;

    const newQty = person.items[itemKey].qty + delta;
    if (newQty <= 0) {
      await removeItem(sessionCode, person.name, itemKey);
    } else {
      const oi = person.items[itemKey];
      await upsertItem(
        sessionCode, person.name,
        itemKey, oi.item.name, oi.item.code || '',
        oi.category, newQty
      );
    }
  }, [sessionCode, myName, persons, currentPersonIdx]);

  // Remove item
  const removeItemAction = useCallback(async (itemKey: string) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;
    await removeItem(sessionCode, person.name, itemKey);
  }, [sessionCode, myName, persons, currentPersonIdx]);

  // Clear person
  const handleClear = useCallback(async () => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || Object.keys(person.items).length === 0) return;
    await clearPerson(sessionCode, person.name);
  }, [sessionCode, myName, persons, currentPersonIdx]);

  // Add person
  const handleAddPerson = useCallback(async () => {
    const name = prompt('Nombre de la persona:');
    if (!name?.trim()) return;
    if (!sessionCode) return;
    await addPerson(sessionCode, name.trim());
  }, [sessionCode]);

  // Delete person
  const handleDeletePerson = useCallback(async (idx: number) => {
    if (persons.length <= 1) { addToast('Debe haber al menos una persona', 'info'); return; }
    const name = persons[idx].name;
    if (name === myName) { addToast('No puedes eliminarte a ti mismo', 'info'); return; }
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    if (!sessionCode) return;
    await removePerson(sessionCode, name);
  }, [persons, myName, sessionCode, addToast]);

  // Select person
  const selectPerson = useCallback((idx: number) => {
    setCurrentPersonIdx(idx);
  }, []);

  // Leave session
  const handleLeave = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    clearSessionCookie();
    setSessionCode('');
    setMyName('');
    setPersons([]);
    setCurrentPersonIdx(0);
    setActiveCat('all');
    setSearchTerm('');
  }, []);

  // Copy code
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(sessionCode);
    addToast('📋 Código copiado: ' + sessionCode, 'info');
  }, [sessionCode, addToast]);

  // Show order view per person
  const showOrderByPerson = useCallback(() => {
    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }
    setOrderViewMode('by-person');
  }, [persons, addToast]);

  // Show consolidated order view
  const showOrderConsolidated = useCallback(() => {
    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }
    setOrderViewMode('consolidated');
  }, [persons, addToast]);

  // Show Splitwise view
  const showSplitwiseView = useCallback(() => {
    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }
    setShowSplitwise(true);
  }, [persons, addToast]);

  // Place order — save to history and clear only current user's items
  const handlePlaceOrder = useCallback(async () => {
    if (!sessionCode || !myName) return;
    try {
      const result = await placeOrder(sessionCode, myName);
      addToast(`✅ Pedido #${result.order_number} realizado (${result.total_items} ud)`, 'add', 4000);
    } catch {
      addToast('❌ Error al realizar el pedido', 'remove');
    }
  }, [sessionCode, myName, addToast]);

  const sessionUrl = `https://euromania.cabrasky.net/app?session=${sessionCode}`;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginRight: 8 }} /> Conectando...
    </div>;
  }

  if (!sessionCode) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  const currentPerson = persons[currentPersonIdx] || persons[0] || null;

  return (
    <div className="app">
      <Header
        myName={myName}
        sessionCode={sessionCode}
        sessionUrl={sessionUrl}
        menuName={getActiveMenu()?.name}
        onCopyCode={copyCode}
        onShowQR={() => setQrOpen(true)}
        onShowPrivacy={() => setPrivacyOpen(true)}
        onLeave={handleLeave}
      />

      <PersonBar
        persons={persons}
        myName={myName}
        currentPersonIdx={currentPersonIdx}
        onSelectPerson={selectPerson}
        onDeletePerson={handleDeletePerson}
        onAddPerson={handleAddPerson}
      />

      <div className="layout">
        <div>
          <MenuGrid
            persons={persons}
            currentPersonIdx={currentPersonIdx}
            activeCat={activeCat}
            searchTerm={searchTerm}
            onSetCategory={setActiveCat}
            onSearchChange={setSearchTerm}
            onToggleItem={toggleItem}
          />
        </div>

        <OrderPanel
          currentPerson={currentPerson}
          persons={persons}
          onChangeQty={changeQty}
          onRemoveItem={removeItemAction}
          onClear={handleClear}
          onExport={showOrderByPerson}
          onExportConsolidated={showOrderConsolidated}
          onExportSplitwise={showSplitwiseView}
          onPlaceOrder={handlePlaceOrder}
          onShowHistory={() => setShowOrderHistory(true)}
        />
        <HistoryPanel sessionCode={sessionCode} />
      </div>

      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        sessionUrl={sessionUrl}
      />

      <PrivacyModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />

      <ToastContainer toasts={toasts} />

      <OrderViewModal
        open={orderViewMode !== null}
        onClose={() => setOrderViewMode(null)}
        persons={persons}
        sessionCode={sessionCode}
        mode={orderViewMode || 'by-person'}
      />

      <OrderHistoryModal
        open={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        sessionCode={sessionCode}
      />

      <SplitwiseModal
        open={showSplitwise}
        onClose={() => setShowSplitwise(false)}
        persons={persons}
        sessionCode={sessionCode}
      />

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}

export default OrderPage;
