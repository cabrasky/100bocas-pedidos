1|interface Props {
2|  myName: string;
3|  sessionCode: string;
4|  onCopyCode: () => void;
5|  onShowQR: () => void;
6|  onLeave: () => void;
7|  onShowPrivacy: () => void;
8|  sessionUrl: string;
9|  menuName?: string;
10|}
11|
12|function Header({ myName, sessionCode, onCopyCode, onShowQR, onLeave, onShowPrivacy, sessionUrl, menuName }: Props) {
13|  const handleShareWhatsApp = () => {
14|    const msg = encodeURIComponent(
15|      ` *100Bocas — Pedido Colaborativo*\\n\\nCódigo: *${sessionCode}*\\n\\nÚnete aquí: ${sessionUrl}\\n\\nAñade tus montaditos y coordinamos el pedido `
16|    );
17|    window.open(`https://wa.me/?text=${msg}`, '_blank');
18|  };
19|
20|  return (
21|    <header>
22|      <div className="header-left">
23|        <h1><i className="fas fa-utensils"></i>100Bocas</h1>
24|        <div className="subtitle">Conectado como {myName}{menuName ? <span className="menu-badge"> · <i className="fas fa-tag"></i> {menuName}</span> : ''}</div>
25|      </div>
26|      <div className="header-right">
27|        <div className="code-badge" onClick={onCopyCode} title="Copiar código">
28|          <i className="fas fa-link"></i> {sessionCode}
29|        </div>
30|        <button className="header-btn" onClick={onShowQR} title="Mostrar código QR">
31|          <i className="fas fa-qrcode"></i>
32|        </button>
33|        <button className="header-btn whatsapp" onClick={handleShareWhatsApp} title="Compartir por WhatsApp">
34|          <i className="fab fa-whatsapp"></i>
35|        </button>
36|        <a href="https://github.com/cabrasky/100bocas-pedidos" target="_blank" rel="noopener" className="header-btn github" title="Ver en GitHub (código abierto)">
37|          <i className="fab fa-github"></i>
38|        </a>
39|        <button className="header-btn" onClick={onShowPrivacy} title="Aviso legal y privacidad">
40|          <i className="fas fa-shield-halved"></i>
41|        </button>
42|        <button className="leave-btn" onClick={onLeave} title="Salir de la sesión">
43|          <i className="fas fa-right-from-bracket"></i> Salir
44|        </button>
45|      </div>
46|    </header>
47|  );
48|}
49|
50|export default Header;
51|