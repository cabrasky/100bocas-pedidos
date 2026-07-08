export class SessionWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: (msg: any) => void;
  private onConnectionError: ((reason: string) => void) | null = null;
  private code: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 1000; // Start with 1 second
  private reconnectTimeoutId: number | null = null;
  private heartbeatIntervalId: number | null = null;
  private closed = false;

  constructor(code: string, onMessage: (msg: any) => void, onConnectionError?: (reason: string) => void) {
    this.code = code;
    this.onMessage = onMessage;
    this.onConnectionError = onConnectionError || null;
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}/ws/${this.code}`);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.reconnectDelayMs = 1000;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.onMessage(msg);
        } catch (e) {
          console.error('[WS] Parse error:', e, 'Raw:', event.data);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[WS] Error:', event);
        if (this.onConnectionError) {
          this.onConnectionError('Conexión WebSocket fallida');
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Closed with code:', event.code, 'reason:', event.reason);
        this.stopHeartbeat();
        
        if (!this.closed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          this.reconnectTimeoutId = window.setTimeout(() => {
            if (!this.closed) {
              this.connect();
            }
          }, delay);
        } else if (!this.closed && this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[WS] Max reconnect attempts reached');
          if (this.onConnectionError) {
            this.onConnectionError('Conexión perdida: no se pudo reconectar');
          }
        }
      };
    } catch (e) {
      console.error('[WS] Connection error:', e);
      if (this.onConnectionError) {
        this.onConnectionError('Error al conectar con WebSocket');
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatIntervalId = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  close() {
    this.closed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        console.error('[WS] Error closing:', e);
      }
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
