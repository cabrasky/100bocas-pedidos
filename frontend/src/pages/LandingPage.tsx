1|import { useState, useCallback, useEffect } from 'react';
2|import { Link } from 'react-router-dom';
3|import { Helmet } from 'react-helmet-async';
4|
5|const FEATURES = [
6|  { icon: 'fa-users', title: 'Pedidos en grupo', desc: 'Cada persona añade sus montaditos en su propio perfil. Todo en una misma sesión.' },
7|  { icon: 'fa-bolt', title: 'Tiempo real', desc: 'Los cambios se ven al instante gracias a WebSockets. Nada de recargar la página.' },
8|  { icon: 'fa-qrcode', title: 'Código QR', desc: 'Comparte la sesión al instante. Escanea y únete sin escribir códigos largos.' },
9|  { icon: 'fa-calculator', title: 'Resumen consolidado', desc: 'Agrupa todos los pedidos por producto para hacer el pedido al restaurante de un vistazo.' },
10|  { icon: 'fa-shield-halved', title: 'Sin registro', desc: 'Solo necesitas un nombre. No pedimos email, teléfono ni contraseñas. Tus datos se borran en 5 días.' },
11|  { icon: 'fa-chart-simple', title: 'Estadísticas anónimas', desc: 'Consulta métricas de uso totalmente anonimizadas. Sin seguimiento personal.' },
12|];
13|
14|const STEPS = [
15|  { num: 1, title: 'Crea una sesión', desc: 'Escribe tu nombre y pulsa "Crear sesión nueva". Se generará un código único de 6 caracteres.' },
16|  { num: 2, title: 'Comparte el código', desc: 'Envía el código o el QR a tus amigos. Pueden unirse desde cualquier dispositivo.' },
17|  { num: 3, title: 'Cada uno pide', desc: 'Cada persona añade sus montaditos favoritos del menú. Todo se sincroniza al instante.' },
18|  { num: 4, title: 'Pedido listo', desc: 'Usa el resumen consolidado para ver todo lo que hay que pedir, agrupado y con totales.' },
19|];
20|
21|const SCREENSHOTS = [
22|  { src: '/screenshots/desktop.png', alt: 'Vista de escritorio', label: ' Vista de escritorio' },
23|  { src: '/screenshots/liquidacion.png', alt: 'Liquidación de cuentas', label: ' Liquidación de cuentas' },
24|  { src: '/screenshots/history.png', alt: 'Historial de comandas', label: ' Historial de comandas' },
25|];
26|
27|function LandingPage() {
28|  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
29|
30|  const open = useCallback((i: number) => setSelectedIdx(i), []);
31|  const close = useCallback(() => setSelectedIdx(null), []);
32|  const prev = useCallback(() => setSelectedIdx(i => i !== null ? (i - 1 + SCREENSHOTS.length) % SCREENSHOTS.length : null), []);
33|  const next = useCallback(() => setSelectedIdx(i => i !== null ? (i + 1) % SCREENSHOTS.length : null), []);
34|
35|  useEffect(() => {
36|    if (!('keyboard' in navigator)) return; // SSR guard
37|    const handler = (e: KeyboardEvent) => {
38|      if (e.key === 'Escape') close();
39|      if (e.key === 'ArrowLeft') prev();
40|      if (e.key === 'ArrowRight') next();
41|    };
42|    if (selectedIdx !== null) {
43|      document.addEventListener('keydown', handler);
44|      document.body.style.overflow = 'hidden';
45|    }
46|    return () => {
47|      document.removeEventListener('keydown', handler);
48|      document.body.style.overflow = '';
49|    };
50|  }, [selectedIdx, close, prev, next]);
51|
52|  return (
53|    <div>
54|      <Helmet>
55|        <title>100Bocas — Pedidos Colaborativos en Tiempo Real</title>
56|        <meta name="description" content="Crea una sesión de pedidos en grupo, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones. Proyecto independiente by cabrasky." />
57|        <meta name="keywords" content="100bocas, 100 montaditos, 100mon, montaditos, pedidos colaborativos, pedidos en grupo, comida, tiempo real, menú, pedir montaditos online, menú 100 montaditos, cena grupo, comida rápida, montaditos online, pedido restaurante, montaditos a domicilio" />
58|        <meta name="author" content="cabrasky — Javier Mateos Mata" />
59|        <meta name="robots" content="index, follow" />
60|        <link rel="canonical" href="https://100bocas.cabrasky.net/" />
61|        <meta property="og:type" content="website" />
62|        <meta property="og:url" content="https://100bocas.cabrasky.net/" />
63|        <meta property="og:title" content="100Bocas — Pedidos Colaborativos en Tiempo Real" />
64|        <meta property="og:description" content="Crea una sesión, comparte el código QR y haced el pedido juntos en tiempo real. Sin registros. Proyecto independiente." />
65|        <meta property="og:image" content="https://100bocas.cabrasky.net/favicon.svg" />
66|        <meta property="og:locale" content="es_ES" />
67|        <meta property="og:site_name" content="100Bocas — Pedidos Colaborativos" />
68|        <meta name="twitter:card" content="summary" />
69|        <meta name="twitter:title" content="100Bocas — Pedidos Colaborativos" />
70|        <meta name="twitter:description" content="Crea una sesión, comparte el código y haced el pedido juntos en tiempo real. Sin registros." />
71|        <meta name="twitter:image" content="https://100bocas.cabrasky.net/favicon.svg" />
72|        <script type="application/ld+json">{JSON.stringify({
73|          "@context": "https://schema.org",
74|          "@type": "WebApplication",
75|          "name": "100Bocas — Pedidos Colaborativos",
76|          "url": "https://100bocas.cabrasky.net/",
77|          "description": "Aplicación web para crear sesiones de pedidos en grupo en tiempo real.",
78|          "applicationCategory": "LifestyleApplication",
79|          "author": { "@type": "Person", "name": "Javier Mateos Mata", "url": "https://github.com/cabrasky" },
80|          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
81|        })}</script>
82|      </Helmet>
83|
84|      {/* Hero */}
85|      <section className="landing-hero">
86|        <div className="landing-hero-inner">
87|          <div className="landing-hero-icon">
88|            <i className="fas fa-utensils" />
89|          </div>
90|          <div className="landing-hero-badge">
91|            <i className="fas fa-code-branch" /> Proyecto independiente
92|          </div>
93|          <h1><i>100Bocas</i><br />Pedidos Colaborativos</h1>
94|          <p>Crea una sesión, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones.</p>
95|          <Link to="/app" className="landing-cta">
96|            <i className="fas fa-right-to-bracket" /> Entrar a la App
97|          </Link>
98|        </div>
99|      </section>
100|
101|      {/* Features */}
102|      <section className="landing-section landing-features">
103|        <div className="landing-container">
104|          <h2><i className="fas fa-star" /> ¿Qué puedes hacer?</h2>
105|          <div className="landing-grid">
106|            {FEATURES.map((f, i) => (
107|              <div className="landing-card" key={i}>
108|                <div className="landing-card-icon"><i className={`fas ${f.icon}`} /></div>
109|                <h3>{f.title}</h3>
110|                <p>{f.desc}</p>
111|              </div>
112|            ))}
113|          </div>
114|        </div>
115|      </section>
116|
117|      {/* How it works */}
118|      <section className="landing-section landing-how">
119|        <div className="landing-container">
120|          <h2><i className="fas fa-circle-play" /> Cómo funciona</h2>
121|          <div className="landing-steps">
122|            {STEPS.map((s, i) => (
123|              <div className="landing-step" key={i}>
124|                <div className="landing-step-num">{s.num}</div>
125|                <h3>{s.title}</h3>
126|                <p>{s.desc}</p>
127|              </div>
128|            ))}
129|          </div>
130|        </div>
131|      </section>
132|
133|      {/* Screenshots */}
134|      <section className="landing-section landing-screenshots-section">
135|        <div className="landing-container">
136|          <h2><i className="fas fa-camera" /> Así se ve</h2>
137|          <div className="landing-screenshots">
138|            {SCREENSHOTS.map((s, i) => (
139|              <div className="landing-screenshot" key={i} onClick={() => open(i)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && open(i)}>
140|                <img src={s.src} alt={s.alt} loading="lazy" />
141|                <div className="landing-screenshot-label">{s.label}</div>
142|              </div>
143|            ))}
144|          </div>
145|        </div>
146|      </section>
147|
148|      {/* Image Modal */}
149|      {selectedIdx !== null && (
150|        <div className="screenshot-modal-overlay" onClick={close} role="presentation">
151|          <button className="screenshot-modal-close" onClick={close} aria-label="Cerrar">
152|            <i className="fas fa-xmark" />
153|          </button>
154|          <button className="screenshot-modal-nav screenshot-modal-prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Anterior">
155|            <i className="fas fa-chevron-left" />
156|          </button>
157|          <button className="screenshot-modal-nav screenshot-modal-next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Siguiente">
158|            <i className="fas fa-chevron-right" />
159|          </button>
160|          <div className="screenshot-modal-content" onClick={e => e.stopPropagation()}>
161|            <img src={SCREENSHOTS[selectedIdx].src} alt={SCREENSHOTS[selectedIdx].alt} />
162|            <div className="screenshot-modal-label">{SCREENSHOTS[selectedIdx].label}</div>
163|          </div>
164|          <div className="screenshot-modal-counter">
165|            {selectedIdx + 1} / {SCREENSHOTS.length}
166|          </div>
167|        </div>
168|      )}
169|
170|      {/* Legal */}
171|      <section className="landing-section landing-legal">
172|        <div className="landing-container">
173|          <div className="landing-legal-box">
174|            <i className="fas fa-scale-balanced" />
175|            <h3>Aviso importante</h3>
176|            <p>
177|              Esta aplicación es un <strong>proyecto independiente y no oficial</strong>.
178|              No está vinculada, patrocinada ni aprobada por la marca{' '}
179|              <strong>100 Montaditos</strong>.
180|              Todos los nombres de productos y marcas registradas pertenecen a sus respectivos propietarios.
181|              Esta herramienta se ofrece como un servicio de utilidad para facilitar
182|              la toma de pedidos en grupo de forma colaborativa.
183|            </p>
184|          </div>
185|        </div>
186|      </section>
187|
188|      {/* Footer */}
189|      <footer className="landing-footer">
190|        <div className="landing-footer-inner">
191|          <div className="landing-footer-icon"><i className="fas fa-utensils" /></div>
192|          <h3>100Bocas — Pedidos Colaborativos</h3>
193|          <p><i className="fas fa-code" /> Desarrollado por <a href="https://github.com/cabrasky" target="_blank" rel="noopener">cabrasky</a> — Javier Mateos Mata</p>
194|          <p><i className="fas fa-tools" /> Proyecto personal de código abierto</p>
195|
196|          <div className="landing-oss-box">
197|            <i className="fab fa-github" />
198|            <p>Este proyecto es <strong>código abierto</strong>.</p>
199|            <p>
200|              <a href="https://github.com/cabrasky/100bocas-pedidos" target="_blank" rel="noopener">Ver en GitHub</a>
201|              {' · '}
202|              <a href="https://github.com/cabrasky/100bocas-pedidos/issues/new" target="_blank" rel="noopener">Abrir issue</a>
203|              {' · '}
204|              <a href="https://github.com/cabrasky/100bocas-pedidos/issues" target="_blank" rel="noopener">Sugerir mejora</a>
205|            </p>
206|          </div>
207|
208|          <div className="landing-footer-divider" />
209|          <p style={{ fontSize: 12, color: '#64748b' }}>Los datos se almacenan únicamente durante 5 días. No compartimos información con terceros.</p>
210|          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}><i className="fas fa-shield" /> Este proyecto no está afiliado a 100 Montaditos®</p>
211|          <p style={{ marginTop: 16 }}><Link to="/app" style={{ fontSize: 13, color: '#6ee7b7' }}><i className="fas fa-arrow-right" /> Ir a la aplicación</Link></p>
212|        </div>
213|      </footer>
214|    </div>
215|  );
216|}
217|
218|export default LandingPage;
219|