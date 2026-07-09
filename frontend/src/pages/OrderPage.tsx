import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import OrderViewModal from '../components/modals/OrderViewModal';
import OrderHistoryModal from '../components/modals/OrderHistoryModal';
import HistoryPanel from '../components/HistoryPanel';
import LiquidacionModal from '../components/modals/LiquidacionModal';
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [orderViewMode, setOrderViewMode] = useState<'by-person' | 'consolidated' | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showLiquidacion, setShowLiquidacion] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pendingItemOps, setPendingItemOps] = useState<Record<string, boolean>>({});
  const wsRef = useRef<SessionWebSocket | null>(null);
  const prevPersonsRef = useRef<Person[]>([]);
  const sessionValidationTimeRef = useRef<{ code: string; timestamp: number } | null>(null);

  const applySessionPeople = useCallback((nextPeople?: Person[]) => {
    if (!nextPeople) return;
    const previousPeople = prevPersonsRef.current;
    setPersons(nextPeople);
    setCurrentPersonIdx(prevIdx => {
      if (nextPeople.length === 0) return 0;

      const prevSelectedName = previousPeople[prevIdx]?.name;
      if (prevSelectedName) {
        const preservedIdx = nextPeople.findIndex(p => p.name === prevSelectedName);
        if (preservedIdx >= 0) return preservedIdx;
      }

      if (myName) {
        const myIdx = nextPeople.findIndex(p => p.name === myName);
        if (myIdx >= 0) return myIdx;
      }

      return Math.min(prevIdx, nextPeople.length - 1);
    });
  }, [myName]);

  useEffect(() => {
    prevPersonsRef.current = persons;
  }, [persons]);

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
      applySessionPeople(msg.people);
      if (myName && !msg.people.find(p => p.name === myName)) {
        addPerson(sessionCode, myName);
      }
    }
  }, [myName, sessionCode, applySessionPeople]);

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
    
    // Record session validation time to prevent race conditions
    sessionValidationTimeRef.current = { code, timestamp: Date.now() };

    const ws = new SessionWebSocket(
      code,
      onWsMessage,
      (reason: string) => {
        addToast(`⚠ ${reason}`, 'error', 5000);
      }
    );
    wsRef.current = ws;
  }, [onWsMessage, addToast]);

  // Load session data from server
  const loadSession = useCallback(async (code: string, name: string) => {
    try {
      const data = await joinSession(code);
      if (data.error) {
        clearSessionCookie();
        setLoading(false);
        sessionValidationTimeRef.current = null;
        return;
      }
      if (data.people) {
        setPersons(data.people);
        const idx = Math.max(0, data.people.findIndex((p: any) => p.name === name));
        setCurrentPersonIdx(idx < 0 ? 0 : idx);
        // Store validation timestamp to prevent race conditions
        sessionValidationTimeRef.current = { code, timestamp: Date.now() };
      }
    } catch (error) {
      console.warn(`[loadSession] Error loading session ${code}:`, error);
      sessionValidationTimeRef.current = null;
    }
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
      const url = `https://100bocas.cabrasky.net/app?session=${data.code}`;
      navigator.clipboard.writeText(url).then(() => {
        addToast(' Link de la sesión copiado al portapapeles', 'info', 4000);
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

  // Adjust item quantity from menu cards
  const adjustItemQty = useCallback(async (catKey: string, itemKey: string, delta: number) => {
    if (!delta) return;
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;

    const opKey = `${person.name}::${itemKey}`;
    if (pendingItemOps[opKey]) return;
    setPendingItemOps(prev => ({ ...prev, [opKey]: true }));

    try {
      const currentQty = person.items[itemKey]?.qty || 0;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        if (currentQty > 0) {
          const data = await removeItem(sessionCode, person.name, itemKey);
          applySessionPeople(data?.people);
        }
      } else {
        const existing = person.items[itemKey];
        if (existing) {
          const data = await upsertItem(
            sessionCode,
            person.name,
            itemKey,
            existing.item.name,
            existing.item.code || '',
            existing.category,
            nextQty
          );
          applySessionPeople(data?.people);
          return;
        }

        const found = findItem(itemKey);
        if (!found) return;
        const data = await upsertItem(
          sessionCode,
          person.name,
          itemKey,
          found.item.name,
          found.item.code || '',
          catKey || found.category,
          nextQty
        );
        applySessionPeople(data?.people);
      }
    } catch (error: any) {
      console.error('[API] Error adjusting item quantity:', error);
      const message = error?.message || 'Error al actualizar el artículo';
      addToast(`✗ ${message}`, 'error');
    } finally {
      setPendingItemOps(prev => {
        const next = { ...prev };
        delete next[opKey];
        return next;
      });
    }
  }, [sessionCode, myName, persons, currentPersonIdx, addToast, pendingItemOps, applySessionPeople]);

  // Change qty
  const changeQty = useCallback(async (itemKey: string, delta: number) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || !person.items[itemKey]) return;

    try {
      const newQty = person.items[itemKey].qty + delta;
      if (newQty <= 0) {
        const data = await removeItem(sessionCode, person.name, itemKey);
        applySessionPeople(data?.people);
      } else {
        const oi = person.items[itemKey];
        const data = await upsertItem(
          sessionCode, person.name,
          itemKey, oi.item.name, oi.item.code || '',
          oi.category, newQty
        );
        applySessionPeople(data?.people);
      }
    } catch (error: any) {
      console.error('[API] Error changing quantity:', error);
      const message = error?.message || 'Error al cambiar la cantidad';
      addToast(`✗ ${message}`, 'error');
    }
  }, [sessionCode, myName, persons, currentPersonIdx, addToast, applySessionPeople]);

  // Remove item
  const removeItemAction = useCallback(async (itemKey: string) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;
    try {
      const data = await removeItem(sessionCode, person.name, itemKey);
      applySessionPeople(data?.people);
    } catch (error: any) {
      console.error('[API] Error removing item:', error);
      const message = error?.message || 'Error al quitar el artículo';
      addToast(`✗ ${message}`, 'error');
    }
  }, [sessionCode, myName, persons, currentPersonIdx, addToast, applySessionPeople]);

  // Clear person
  const handleClear = useCallback(async () => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || Object.keys(person.items).length === 0) return;
    try {
      const data = await clearPerson(sessionCode, person.name);
      applySessionPeople(data?.people);
    } catch (error: any) {
      console.error('[API] Error clearing person:', error);
      const message = error?.message || 'Error al vaciar el pedido';
      addToast(`✗ ${message}`, 'error');
    }
  }, [sessionCode, myName, persons, currentPersonIdx, addToast, applySessionPeople]);

  // Add person
  const handleAddPerson = useCallback(async () => {
    const name = prompt('Nombre de la persona:');
    if (!name?.trim()) return;
    if (!sessionCode) return;
    try {
      await addPerson(sessionCode, name.trim());
    } catch (error: any) {
      console.error('[API] Error adding person:', error);
      const message = error?.message || 'Error al añadir la persona';
      addToast(`✗ ${message}`, 'error');
    }
  }, [sessionCode, addToast]);

  // Delete person
  const handleDeletePerson = useCallback(async (idx: number) => {
    if (persons.length <= 1) { addToast('Debe haber al menos una persona', 'info'); return; }
    const name = persons[idx].name;
    if (name === myName) { addToast('No puedes eliminarte a ti mismo', 'info'); return; }
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    if (!sessionCode) return;
    try {
      await removePerson(sessionCode, name);
    } catch (error: any) {
      console.error('[API] Error removing person:', error);
      const message = error?.message || 'Error al eliminar la persona';
      addToast(`✗ ${message}`, 'error');
    }
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
    addToast(' Código copiado: ' + sessionCode, 'info');
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

  // Show Liquidacion view
  const showLiquidacionView = useCallback(() => {
    setShowLiquidacion(true);
  }, []);

  // Place order — save to history and clear only current user's items
  const handlePlaceOrder = useCallback(async () => {
    if (!sessionCode || !myName || placingOrder) return;
    setPlacingOrder(true);
    try {
      const result: any = await placeOrder(sessionCode, myName);
      addToast(` Pedido #${result.order_number} realizado (${result.total_items} ud)`, 'add', 4000);
      // Force-update persons from the HTTP response (items are now empty)
      if (result.people) {
        setPersons(result.people);
      }
    } catch {
      addToast(' Error al realizar el pedido', 'remove');
    } finally {
      setPlacingOrder(false);
    }
  }, [sessionCode, myName, addToast, placingOrder]);

  const sessionUrl = `https://100bocas.cabrasky.net/app?session=${sessionCode}`;
  const currentPerson = persons[currentPersonIdx] || persons[0] || null;
  const pendingItemKeys = useMemo(() => {
    if (!currentPerson) return new Set<string>();
    const prefix = `${currentPerson.name}::`;
    return new Set(
      Object.keys(pendingItemOps)
        .filter(k => k.startsWith(prefix))
        .map(k => k.slice(prefix.length))
    );
  }, [currentPerson, pendingItemOps]);

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
            pendingItemKeys={pendingItemKeys}
            onSetCategory={setActiveCat}
            onSearchChange={setSearchTerm}
            onAdjustItem={adjustItemQty}
            onRemoveItem={removeItemAction}
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
          onExportLiquidacion={showLiquidacionView}
          onPlaceOrder={handlePlaceOrder}
          onShowHistory={() => setShowOrderHistory(true)}
          placingOrder={placingOrder}
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

      <LiquidacionModal
        open={showLiquidacion}
        onClose={() => setShowLiquidacion(false)}
        persons={persons}
        sessionCode={sessionCode}
      />

      {/* ── Loading overlay during payment ── */}
      {placingOrder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(0,0,0,.55)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, backdropFilter: 'blur(4px)',
          animation: 'fadeIn .2s ease',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2.5rem 3rem',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,.25)',
            animation: 'modalSlideUp .3s ease',
          }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 40, color: '#059669' }}></i>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>Procesando pedido…</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Guardando y cerrando la ronda</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
