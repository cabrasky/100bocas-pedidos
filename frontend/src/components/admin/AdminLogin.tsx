1|import { useState, useEffect } from 'react';
2|
3|interface Props {
4|  onLogin: (token: string) => void;
5|}
6|
7|function AdminLogin({ onLogin }: Props) {
8|  const [password, setPassword] = useState('');
9|  const [loginError, setLoginError] = useState('');
10|  const [loginBusy, setLoginBusy] = useState(false);
11|  const base = window.location.origin;
12|
13|  useEffect(() => {
14|    setTimeout(() => {
15|      const el = document.querySelector('.admin-login-input') as HTMLInputElement;
16|      if (el) el.focus();
17|    }, 200);
18|  }, []);
19|
20|  const handleLogin = async () => {
21|    if (!password.trim()) return;
22|    setLoginError('');
23|    setLoginBusy(true);
24|    try {
25|      const r = await fetch(`${base}/api/admin/login`, {
26|        method: 'POST',
27|        headers: { 'Content-Type': 'application/json' },
28|        body: JSON.stringify({ password: password.trim() }),
29|      });
30|      const data = await r.json();
31|      if (data.error) {
32|        setLoginError(data.error);
33|        setLoginBusy(false);
34|      } else {
35|        onLogin(data.token);
36|        setLoginBusy(false);
37|      }
38|    } catch {
39|      setLoginError('Error de conexión');
40|      setLoginBusy(false);
41|    }
42|  };
43|
44|  return (
45|    <div className="admin-body">
46|      <div className="admin-login">
47|        <div className="admin-login-icon"><i className="fas fa-lock"></i></div>
48|        <h3>Acceso restringido</h3>
49|        <p className="admin-login-desc">Introduce la contraseña de administrador para acceder al panel.</p>
50|        <input
51|          type="password"
52|          className="admin-login-input"
53|          placeholder="Contraseña de administrador"
54|          value={password}
55|          onChange={e => setPassword(e.target.value)}
56|          onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
57|          autoComplete="off"
58|        />
59|        {loginError && <div className="admin-login-error"> {loginError}</div>}
60|        <button className="admin-login-btn" onClick={handleLogin} disabled={loginBusy || !password.trim()}>
61|          {loginBusy ? <><i className="fas fa-spinner fa-spin"></i> Verificando...</> : <><i className="fas fa-right-to-bracket"></i> Entrar</>}
62|        </button>
63|      </div>
64|    </div>
65|  );
66|}
67|
68|export default AdminLogin;
69|