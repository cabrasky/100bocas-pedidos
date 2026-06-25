import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionUrl: string;
}

// Global QRCode type from CDN
declare const QRCode: any;

function QRModal({ open, onClose, sessionUrl }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<any>(null);

  useEffect(() => {
    if (open && qrRef.current && !qrInstance.current) {
      qrRef.current.innerHTML = '';
      qrInstance.current = new QRCode(qrRef.current, {
        text: sessionUrl,
        width: 200,
        height: 200,
        colorDark: '#1e293b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
    }
    if (!open) {
      qrInstance.current = null;
    }
  }, [open, sessionUrl]);

  if (!open) return null;

  return (
    <div className="qr-overlay open" onClick={onClose}>
      <div className="qr-card" onClick={e => e.stopPropagation()}>
        <h3><i className="fas fa-qrcode" style={{ color: '#2563eb' }}></i> Escanea para unirte</h3>
        <div className="qr-sub">Abre la cámara y escanea este código</div>
        <div ref={qrRef} id="qrContainer"></div>
        <div className="qr-url">{sessionUrl}</div>
        <button className="qr-close" onClick={onClose}>
          <i className="fas fa-times"></i> Cerrar
        </button>
      </div>
    </div>
  );
}

export default QRModal;
