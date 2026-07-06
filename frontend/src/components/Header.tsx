interface Props {
  myName: string;
  sessionCode: string;
  onCopyCode: () => void;
  onShowQR: () => void;
  onLeave: () => void;
  onShowPrivacy: () => void;
  sessionUrl: string;
  menuName?: string;
}

function Header({ myName, sessionCode, onCopyCode, onShowQR, onLeave, onShowPrivacy, sessionUrl, menuName }: Props) {
  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      ` *100Bocas — Pedido Colaborativo*\\n\\nCódigo: *${sessionCode}*\\n\\nÚnete aquí: ${sessionUrl}\\n\\nAñade tus montaditos y coordinamos el pedido `
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <header>
      <div className="header-left">
        <h1><i className="fas fa-utensils"></i>100Bocas</h1>
        <div className="subtitle">Conectado como {myName}{menuName ? <span className="menu-badge"> · <i className="fas fa-tag"></i> {menuName}</span> : ''}</div>
      </div>
      <div className="header-right">
        <div className="code-badge" onClick={onCopyCode} title="Copiar código">
          <i className="fas fa-link"></i> {sessionCode}
        </div>
        <button className="header-btn" onClick={onShowQR} title="Mostrar código QR">
          <i className="fas fa-qrcode"></i>
        </button>
        <button className="header-btn whatsapp" onClick={handleShareWhatsApp} title="Compartir por WhatsApp">
          <i className="fab fa-whatsapp"></i>
        </button>
        <a href="https://github.com/cabrasky/100bocas-pedidos" target="_blank" rel="noopener" className="header-btn github" title="Ver en GitHub (código abierto)">
          <i className="fab fa-github"></i>
        </a>
        <button className="header-btn" onClick={onShowPrivacy} title="Aviso legal y privacidad">
          <i className="fas fa-shield-halved"></i>
        </button>
        <button className="leave-btn" onClick={onLeave} title="Salir de la sesión">
          <i className="fas fa-right-from-bracket"></i> Salir
        </button>
      </div>
    </header>
  );
}

export default Header;
