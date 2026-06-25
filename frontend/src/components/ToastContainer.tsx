import { useState, useEffect } from 'react';
import { Toast } from '../types';

interface Props {
  toasts: Toast[];
}

function ToastContainer({ toasts }: Props) {
  const [exiting, setExiting] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Mark new toasts as entering (not exiting)
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => {
        const typeClass = `toast-${t.type}`;
        let icon = 'fa-circle-info';
        if (t.type === 'add') icon = 'fa-circle-plus';
        else if (t.type === 'remove') icon = 'fa-circle-minus';
        else if (t.type === 'update') icon = 'fa-pen-to-square';

        return (
          <div key={t.id} className={`toast-item ${typeClass}`}>
            <i className={`fas ${icon}`}></i> {t.message}
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
