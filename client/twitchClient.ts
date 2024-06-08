import tscCube from "./cube";

export class twitchClient {

  private ws: WebSocket;
  private cube: tscCube;

  constructor() {
    this.ws = new WebSocket('ws://localhost:8080');
    this.cube = new tscCube("333", this.send.bind(this));
    this.cube.scramblePuzzle();
    
    this.ws.addEventListener('open', this.onOpen.bind(this));
    this.ws.addEventListener('message', this.onMessage.bind(this));
  }

  private onOpen(event: Event) {
    console.log('WebSocket connection opened:', event);
    //ws.send('Hello, Server!');
  }

  public async onMessage(event: MessageEvent) {
    try {
      const jsonData = JSON.parse(event.data);
  
      const user = jsonData.user;
      const move = jsonData.message;
      const message = jsonData.message.toLowerCase();
  
      const isFollower = jsonData.isFollower;
      const isSub = jsonData.isSub;
      const isMod = jsonData.isMod;
  
      this.cube.handleMessage(user, move, message, isFollower, isSub, isMod);
  
      // timeStampLog('User: ' + user);
      // timeStampLog('Message: ' + message);
      // timeStampLog('isMod: ' + isMod);
      // timeStampLog('isSub: ' + isSub);
      // timeStampLog('isFollower' + isFollower);
  
      // Debug
      // cube.doCubeMoves(message);
      // console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + queue);
    } catch (error) {
      console.log('Received non-JSON data:', event.data);
    }
  }

  private onClose(event: CloseEvent) {
    console.log('WebSocket connection closed:', event);
  }

  private onError(event: Event) {
    console.error('WebSocket error:', event);
  }

  public send(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.timeStampLog(message);
      this.ws.send(JSON.stringify({ "type": "twitchChatMsg", "message": message }));
    } else {
      console.error('WebSocket is not open. Message not sent:', message);
    }
  }
  
  private timeStampLog(message: string): void {
    const currentDate: Date = new Date();
    const formattedDateTime: string = '[' + currentDate.toLocaleString() + '] ';
    const timestampedMessage: string = formattedDateTime + message;
    console.log(timestampedMessage);
  }
}
