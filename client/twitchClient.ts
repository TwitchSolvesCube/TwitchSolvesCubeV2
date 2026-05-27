import tscCube from "./cube";
import { serverPort } from '../config.json';

export class twitchClient {

  private ws: WebSocket;
  private cube: tscCube;
  private pendingShortlinks: Map<string, { resolve: (link: string | null) => void }> = new Map();

  constructor() {
    this.ws = new WebSocket(`ws://localhost:${serverPort}`);
    this.timeStampLog(`Running Websocket on Port ${serverPort}`);
    this.cube = new tscCube("333", this.send.bind(this), this.sendLinkData.bind(this));
    this.cube.scramblePuzzle();
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.ws.addEventListener('open', this.onOpen);
    this.ws.addEventListener('message', this.onMessage);
    this.ws.addEventListener('close', this.onClose);
    this.ws.addEventListener('error', this.onError);
  }

  private onOpen = (event: Event) => {
    this.timeStampLog(`WebSocket connection opened: ${event}`);
  }

  private onMessage = async (event: MessageEvent) => {
    try {
      const jsonData = JSON.parse(event.data);

      if (jsonData.type === 'shortlink') {
        this.cube.tsc.setShortLink(jsonData.shortLink);
        console.log(`Replay: ${jsonData.shortLink}`);
        const pending = this.pendingShortlinks.get(jsonData.uuid);
        if (pending) {
          pending.resolve(jsonData.shortLink);
          this.pendingShortlinks.delete(jsonData.uuid);
        }
        return;
      }

      this.cube.handleMessage(
        jsonData.user,
        jsonData.message, //This is the puzzle move
        jsonData.message.toLowerCase(),
        jsonData.isFollowing,
        jsonData.isSub,
        jsonData.isMod
      ).catch(err => this.timeStampLog(`handleMessage error: ${err.message}`));

      this.timeStampLog((`${jsonData.user}: ${jsonData.message}`));
      this.cube.tsc.timeStampLog(`isMod: ${jsonData.isMod}`);
      this.cube.tsc.timeStampLog(`isSub: ${jsonData.isSub}`);
      this.cube.tsc.timeStampLog(`isFollowing: ${jsonData.isFollowing}`);
  
    } catch (error) {
      this.timeStampLog(`Error handling message: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  private onClose = (event: CloseEvent) => {
    this.timeStampLog(`WebSocket connection closed: ${event}`);
  }

  private onError = (event: Event) => {
    console.error('WebSocket error:', event);
  }

    //TODO: This does not return/send json messages if used directly with this.send() as its been done...
  public send(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ "type": "twitchChatMsg", "message": message }));
      this.timeStampLog(`Sent message: ${message}`);
    } else {
      console.error('WebSocket is not open. Message not sent:', message);
    }
  }

  public sendLinkData(twizzle_link: string, uuid: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.pendingShortlinks.set(uuid, { resolve });
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ "type": "twizzleLink", "twizzle_link": twizzle_link, "uuid": uuid }));
          this.timeStampLog(`Sent link data for ${twizzle_link} and ${uuid}`);
        } catch (err) {
          console.error('WebSocket send failed:', err);
          resolve(null);
          this.pendingShortlinks.delete(uuid);
        }
      } else {
        console.error('WebSocket is not open. Link data not sent.');
        resolve(null);
        this.pendingShortlinks.delete(uuid);
      }
    });
  }
  
  private timeStampLog(message: string): void {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
  }
}
