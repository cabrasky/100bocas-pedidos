1|import { useState, useEffect } from 'react';
2|import { Link } from 'react-router-dom';
3|import AdminPanel from './admin/AdminPanel';
4|
5|interface Props {
6|  onLogin: (name: string, code?: string) => Promise<void>;
7|}
8|
9|function LoginScreen({ onLogin }: Props) {
10|  const [name, setName] = useState('');
11|  const [code, setCode] = useState('');
12|  const [error, setError] = useState('');
13|  const [busy, setBusy] = useState(false);
14|  const [showAdmin, setShowAdmin] = useState(false);
15|
16|  useEffect(() => {
17|    // Check if we have a join code from URL param (injected by App)
18|    const joinCode = (window as any).__joinCode as string | undefined;
19|    if (joinCode) {
20|      setCode(joinCode);
21|      (window as any).__joinCode = undefined;
22|    }
23|  }, []);
24|
25|  const handleCreate = async () => {
26|    if (!name.trim()) { setError('Escribe tu nombre'); return; }
27|    setError('');
28|    setBusy(true);
29|    try {
30|      await onLogin(name.trim());
31|    } catch {
32|      setError('Error al crear sesión');
33|      setBusy(false);
34|    }
35|  };
36|
37|  const handleJoin = async () => {
38|    if (!name.trim()) { setError('Escribe tu nombre'); return; }
39|    if (!code.trim() || code.trim().length < 4) { setError('Código inválido'); return; }
40|    setError('');
41|    setBusy(true);
42|    try {
43|      await onLogin(name.trim(), code.trim().toUpperCase());
44|    } catch (e: any) {
45|      setError(e.message || 'Sesión no encontrada');
46|      setBusy(false);
47|    }
48|  };
49|
50|  return (
51|    <>
52|      <div className="login-overlay">
53|        <div className="login-card">
54|          <h2><i className="fas fa-utensils"></i> 100Bocas</h2>
55|          <div className="login-sub">Pedidos colaborativos en tiempo real</div>
56|
57|          {error && <div className="login-error"> {error}</div>}
58|
59|          <label htmlFor="loginName">Tu nombre</label>
60|          <input
61|            id="loginName"
62|            type="text"
63|            placeholder="Ej: Ainoha"
64|            value={name}
65|            onChange={e => setName(e.target.value)}
66|            onKeyDown={e => e.key === 'Enter' && handleCreate()}
67|            autoComplete="off"
68|          />
69|
70|          <button className="btn-primary" onClick={handleCreate} disabled={busy}>
71|            <i className="fas fa-plus-circle"></i> Crear sesión nueva
72|          </button>
73|
74|          <div className="divider">o únete a una existente</div>
75|
76|          <div className="join-row">
77|            <input
78|              type="text"
79|              placeholder="CÓDIGO"
80|              maxLength={6}
81|              value={code}
82|              onChange={e => setCode(e.target.value.toUpperCase())}
83|              onKeyDown={e => e.key === 'Enter' && handleJoin()}
84|              autoComplete="off"
85|            />
86|            <button onClick={handleJoin} disabled={busy}>
87|              <i className="fas fa-right-to-bracket"></i>
88|            </button>
89|          </div>
90|          <div className="my-name-hint">
91|            <i className="fas fa-info-circle"></i> Usa el mismo nombre para reconectar a tu pedido
92|          </div>
93|
94|          <div className="login-footer-links">
95|            <button className="admin-link" onClick={() => setShowAdmin(true)}>
96|              <i className="fas fa-chart-simple"></i> Estadísticas
97|            </button>
98|            <Link to="/" className="admin-link">
99|              <i className="fas fa-circle-info"></i> Acerca de
100|            </Link>
101|          </div>
102|        </div>
103|      </div>
104|
105|      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
106|    </>
107|  );
108|}
109|
110|export default LoginScreen;
111|