interface Props {
  myName: string;
  sessionCode: string;
  onCopyCode: () => void;
  onShowQR: () => void;
  onLeave: () => void;
  onShowPrivacy: () => void;
}

function Header({ myName, sessionCode, onCopyCode, onShowQR, onLeave, onShowPrivacy }: Props) {
  return (
    <header>
      <div className="header-left">
        <h1><i className="fas fa-utensils"></i>Euromania</h1>
        <div className="subtitle">Conectado como {myName}</div>
      </div>
      <div className="header-right">
        <div className="code-badge" onClick={onCopyCode} title="Copiar código">
          <i className="fas fa-link"></i> {sessionCode}
        </div>
        <button className="qr-btn" onClick={onShowQR} title="Mostrar código QR">
          <i className="fas fa-qrcode"></i>
        </button>
        <button className="privacy-btn" onClick={onShowPrivacy} title="Aviso legal y privacidad">
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
