export class WebSocketManager {
    private ws: WebSocket;
  
    constructor(url: string) {
      if (typeof WebSocket !== 'undefined') {
        this.ws = new WebSocket(url);
  
        this.ws.addEventListener('open', (event) => {
          console.log('WebSocket connection is open.');
        });
  
        this.ws.addEventListener('message', (event) => {
          console.log(`Received from server: ${event.data}`);
        });
  
        this.ws.addEventListener('close', (event) => {
          console.log('WebSocket connection is closed.');
        });
      } else {
        console.error('WebSocket is not supported in this environment.');
      }
    }
  
    sendMessage(message: string) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(message);
      } else {
        console.error('WebSocket connection is not open.');
      }
    }
  }
  