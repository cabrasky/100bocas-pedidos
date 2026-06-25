import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const FEATURES = [
  { icon: 'fa-users', title: 'Pedidos en grupo', desc: 'Cada persona añade sus montaditos en su propio perfil. Todo en una misma sesión.' },
  { icon: 'fa-bolt', title: 'Tiempo real', desc: 'Los cambios se ven al instante gracias a WebSockets. Nada de recargar la página.' },
  { icon: 'fa-qrcode', title: 'Código QR', desc: 'Comparte la sesión al instante. Escanea y únete sin escribir códigos largos.' },
  { icon: 'fa-calculator', title: 'Resumen consolidado', desc: 'Agrupa todos los pedidos por producto para hacer el pedido al restaurante de un vistazo.' },
  { icon: 'fa-shield-halved', title: 'Sin registro', desc: 'Solo necesitas un nombre. No pedimos email, teléfono ni contraseñas. Tus datos se borran en 5 días.' },
  { icon: 'fa-chart-simple', title: 'Estadísticas anónimas', desc: 'Consulta métricas de uso totalmente anonimizadas. Sin seguimiento personal.' },
];

const STEPS = [
  { num: 1, title: 'Crea una sesión', desc: 'Escribe tu nombre y pulsa "Crear sesión nueva". Se generará un código único de 6 caracteres.' },
  { num: 2, title: 'Comparte el código', desc: 'Envía el código o el QR a tus amigos. Pueden unirse desde cualquier dispositivo.' },
  { num: 3, title: 'Cada uno pide', desc: 'Cada persona añade sus montaditos favoritos del menú. Todo se sincroniza al instante.' },
  { num: 4, title: 'Pedido listo', desc: 'Usa el resumen consolidado para ver todo lo que hay que pedir, agrupado y con totales.' },
];

function LandingPage() {
  return (
    <div>
      <Helmet>
        <title>Euromania — Pedidos Colaborativos en Tiempo Real</title>
        <meta name="description" content="Crea una sesión de pedidos en grupo, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones. Proyecto independiente by cabrasky." />
        <meta name="keywords" content="euromania, 100 montaditos, 100mon, montaditos, pedidos colaborativos, pedidos en grupo, comida, tiempo real, menú, pedir montaditos online, menú 100 montaditos, cena grupo, comida rápida, montaditos online, pedido restaurante, montaditos a domicilio" />
        <meta name="author" content="cabrasky — Javier Mateos Mata" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://euromania.cabrasky.net/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://euromania.cabrasky.net/" />
        <meta property="og:title" content="Euromania — Pedidos Colaborativos en Tiempo Real" />
        <meta property="og:description" content="Crea una sesión, comparte el código QR y haced el pedido juntos en tiempo real. Sin registros. Proyecto independiente." />
        <meta property="og:image" content="https://euromania.cabrasky.net/favicon.svg" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="Euromania — Pedidos Colaborativos" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Euromania — Pedidos Colaborativos" />
        <meta name="twitter:description" content="Crea una sesión, comparte el código y haced el pedido juntos en tiempo real. Sin registros." />
        <meta name="twitter:image" content="https://euromania.cabrasky.net/favicon.svg" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Euromania — Pedidos Colaborativos",
          "url": "https://euromania.cabrasky.net/",
          "description": "Aplicación web para crear sesiones de pedidos en grupo en tiempo real.",
          "applicationCategory": "LifestyleApplication",
          "author": { "@type": "Person", "name": "Javier Mateos Mata", "url": "https://github.com/cabrasky" },
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-icon">
            <i className="fas fa-utensils" />
          </div>
          <div className="landing-hero-badge">
            <i className="fas fa-code-branch" /> Proyecto independiente
          </div>
          <h1><i>Euromania</i><br />Pedidos Colaborativos</h1>
          <p>Crea una sesión, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones.</p>
          <Link to="/app" className="landing-cta">
            <i className="fas fa-right-to-bracket" /> Entrar a la App
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section landing-features">
        <div className="landing-container">
          <h2><i className="fas fa-star" /> ¿Qué puedes hacer?</h2>
          <div className="landing-grid">
            {FEATURES.map((f, i) => (
              <div className="landing-card" key={i}>
                <div className="landing-card-icon"><i className={`fas ${f.icon}`} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-how">
        <div className="landing-container">
          <h2><i className="fas fa-circle-play" /> Cómo funciona</h2>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div className="landing-step" key={i}>
                <div className="landing-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal */}
      <section className="landing-section landing-legal">
        <div className="landing-container">
          <div className="landing-legal-box">
            <i className="fas fa-scale-balanced" />
            <h3>Aviso importante</h3>
            <p>
              Esta aplicación es un <strong>proyecto independiente y no oficial</strong>.
              No está vinculada, patrocinada ni aprobada por la marca{' '}
              <strong>100 Montaditos</strong> ni por <strong>Euromania</strong>.
              Todos los nombres de productos y marcas registradas pertenecen a sus respectivos propietarios.
              Esta herramienta se ofrece como un servicio de utilidad para facilitar
              la toma de pedidos en grupo de forma colaborativa.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-icon"><i className="fas fa-utensils" /></div>
          <h3>Euromania — Pedidos Colaborativos</h3>
          <p><i className="fas fa-code" /> Desarrollado por <a href="https://github.com/cabrasky" target="_blank" rel="noopener">cabrasky</a> — Javier Mateos Mata</p>
          <p><i className="fas fa-tools" /> Proyecto personal de código abierto</p>

          <div className="landing-oss-box">
            <i className="fab fa-github" />
            <p>Este proyecto es <strong>código abierto</strong>.</p>
            <p>
              <a href="https://github.com/cabrasky/euromania-pedidos" target="_blank" rel="noopener">Ver en GitHub</a>
              {' · '}
              <a href="https://github.com/cabrasky/euromania-pedidos/issues/new" target="_blank" rel="noopener">Abrir issue</a>
              {' · '}
              <a href="https://github.com/cabrasky/euromania-pedidos/issues" target="_blank" rel="noopener">Sugerir mejora</a>
            </p>
          </div>

          <div className="landing-footer-divider" />
          <p style={{ fontSize: 12, color: '#64748b' }}>Los datos se almacenan únicamente durante 5 días. No compartimos información con terceros.</p>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}><i className="fas fa-shield" /> Este proyecto no está afiliado a 100 Montaditos® ni Euromania®</p>
          <p style={{ marginTop: 16 }}><Link to="/app" style={{ fontSize: 13, color: '#6ee7b7' }}><i className="fas fa-arrow-right" /> Ir a la aplicación</Link></p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
