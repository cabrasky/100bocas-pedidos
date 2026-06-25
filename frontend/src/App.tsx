import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Person, Toast, WsMessage, MenuItem, MENU, getKey, getCatLabel,
  CATEGORY_ICONS, CATEGORY_LABELS, parsePrice, getPrice, findItem,
} from './types';
import {
  createSession, joinSession, addPerson, removePerson,
  upsertItem, removeItem, clearPerson,
  setSessionCookie, getSessionCookie, clearSessionCookie,
} from './api';
import { SessionWebSocket } from './websocket';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import PersonBar from './components/PersonBar';
import MenuGrid from './components/MenuGrid';
import OrderPanel from './components/OrderPanel';
import QRModal from './components/QRModal';
import PrivacyModal from './components/PrivacyModal';
import ToastContainer from './components/ToastContainer';

let toastId = 0;

function App() {
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
  const wsRef = useRef<SessionWebSocket | null>(null);
  const prevPersonsRef = useRef<Person[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 3500) => {
    const id = ++toastId;
    // Use function updater to avoid stale state issues
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
      // Ensure current user exists
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

    // Connect WebSocket
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
    } catch {
      // ignore
    }
  }, []);

  // Handle login
  const handleLogin = useCallback(async (name: string, code?: string) => {
    if (code) {
      // Join existing
      const data = await joinSession(code);
      if (data.error) throw new Error(data.error);
      await addPerson(code, name);
      enterSession(code, name);
      loadSession(code, name);
    } else {
      // Create new
      const data = await createSession();
      await addPerson(data.code, name);
      enterSession(data.code, name);
      loadSession(data.code, name);
    }
  }, [enterSession, loadSession]);

  // Auto-reconnect on mount
  useEffect(() => {
    const saved = getSessionCookie();
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');

    if (sessionFromUrl) {
      // QR code scan — fill the form
      (window as any).__joinCode = sessionFromUrl.toUpperCase();
      setLoading(false);
    } else if (saved?.code && saved?.name) {
      // Auto reconnect from cookie
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

  // Export order
  const exportOrder = useCallback(() => {
    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }

    let lines: string[] = [];
    let groupTotal = 0;
    persons.forEach(p => {
      const items = Object.values(p.items);
      if (items.length === 0) return;
      lines.push(`── ${p.name} ──`);
      let pTotal = 0;
      items.forEach(o => {
        const pr = parsePrice(getPrice(o.category, o.item));
        const sub = pr * o.qty;
        pTotal += sub;
        lines.push(`  ${o.item.code ? '#' + o.item.code + ' ' : ''}${o.item.name}  ${o.qty}ud = ${sub.toFixed(2).replace('.', ',')}€`);
      });
      lines.push(`  Subtotal: ${pTotal.toFixed(2).replace('.', ',')}€\n`);
      groupTotal += pTotal;
    });
    lines.unshift(`📋 EUROMANIA — Sesión: ${sessionCode}`);
    lines.unshift('═══════════════════════════════');
    lines.push('═══════════════════════════════');
    lines.push(`TOTAL GRUPO: ${groupTotal.toFixed(2).replace('.', ',')}€`);
    const totalUd = persons.reduce((s, p) => s + Object.values(p.items).reduce((a, o) => a + o.qty, 0), 0);
    lines.push(`${totalUd} ud — ${persons.filter(p => Object.keys(p.items).length > 0).length} personas`);
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => addToast('📋 Copiado al portapapeles', 'info'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        addToast('📋 Copiado', 'info');
      });
  }, [persons, sessionCode, addToast]);

  // Consolidated order summary (grouped by item, not by person)
  const exportConsolidated = useCallback(() => {
    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }

    // Consolidate all items across all people
    const consolidated: Record<string, { name: string; code: string; qty: number; category: string; price: number }> = {};
    persons.forEach(p => {
      Object.entries(p.items).forEach(([key, o]) => {
        if (consolidated[key]) {
          consolidated[key].qty += o.qty;
        } else {
          consolidated[key] = {
            name: o.item.name,
            code: o.item.code || key,
            qty: o.qty,
            category: o.category,
            price: parsePrice(getPrice(o.category, o.item)),
          };
        }
      });
    });

    // Sort by category order then by code
    const catOrder = ['casa', 'clasicos', 'imprescindibles', 'especiales', 'montycookie', 'montydinas', 'montyperros', 'montyburgers', 'montypizzas', 'montygourmet', 'aperitivos', 'postres', 'bebidas', 'extras'];
    const sorted = Object.entries(consolidated).sort((a, b) => {
      const ca = catOrder.indexOf(a[1].category);
      const cb = catOrder.indexOf(b[1].category);
      if (ca !== cb) return ca - cb;
      return a[1].code.localeCompare(b[1].code, undefined, { numeric: true });
    });

    let lines: string[] = [];
    lines.push('═══════════════════════════════');
    lines.push(`📋 PEDIDO — Sesión: ${sessionCode}`);
    lines.push('═══════════════════════════════');
    lines.push('');

    let currentCat = '';
    let totalUd = 0;
    let totalPrice = 0;

    sorted.forEach(([_, o]) => {
      const catLabel = CATEGORY_LABELS[o.category] || o.category;
      if (catLabel !== currentCat) {
        currentCat = catLabel;
        lines.push(`── ${catLabel} ──`);
      }
      const codeStr = o.code ? `#${o.code}` : '';
      lines.push(`  ${codeStr} ${o.name}  ${o.qty}ud = ${(o.price * o.qty).toFixed(2).replace('.', ',')}€`);
      totalUd += o.qty;
      totalPrice += o.price * o.qty;
    });

    lines.push('');
    lines.push('═══════════════════════════════');
    lines.push(`TOTAL: ${totalPrice.toFixed(2).replace('.', ',')}€ — ${totalUd} ud`);
    lines.push('═══════════════════════════════');

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => addToast('📋 Pedido copiado al portapapeles', 'info'))
      .catch(() => addToast('❌ Error al copiar', 'remove'));
  }, [persons, sessionCode, addToast]);

  // Get session URL
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
          onExport={exportOrder}
          onExportConsolidated={exportConsolidated}
        />
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
    </div>
  );
}

export default App;
