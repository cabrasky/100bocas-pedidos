import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionUrl: string;
}

function QRModal({ open, onClose, sessionUrl }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (open && sessionUrl) {
      QRCode.toDataURL(sessionUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      }).then(setQrDataUrl).catch(() => {});
    } else {
      setQrDataUrl('');
    }
  }, [open, sessionUrl]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <i className="fas fa-qrcode"></i>
          <h2>Escanea para unirte</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="qr-code-wrap">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
            ) : (
              <div style={{ width: 200, height: 200, background: '#f1f5f9', borderRadius: 12 }} />
            )}
          </div>
          <div className="qr-link">
            <a href={sessionUrl} target="_blank" rel="noopener">{sessionUrl}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRModal;
