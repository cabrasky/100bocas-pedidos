import { WsMessage } from './types';

type WsCallback = (msg: WsMessage) => void;

export class SessionWebSocket {
  private ws: WebSocket | null = null;
  private code: string;
  private onMessage: WsCallback;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(code: string, onMessage: WsCallback) {
    this.code = code;
    this.onMessage = onMessage;
    this.connect();
  }

  private connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${proto}//${location.host}/ws/${this.code}`);

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage;
        this.onMessage(msg);
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };
    this.ws.onerror = () => this.ws?.close();

    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send('ping');
    }, 30000);
  }

  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
  }
}
