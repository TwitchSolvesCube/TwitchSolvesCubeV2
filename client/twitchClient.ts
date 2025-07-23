import tscCube from "./cube";
import { serverPort } from '../server/config.json';

interface TwitchMessage {
  user: string;
  message: string;
  isFollower: boolean;
  isSub: boolean;
  isMod: boolean;
}

export class twitchClient {

  private ws: WebSocket;
  private cube: tscCube;

  constructor() {
    this.ws = new WebSocket(`ws://localhost:${serverPort}`);
    console.log('Running Websocket on Port ' + serverPort);
    this.cube = new tscCube("333", this.send.bind(this));
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
    console.log('WebSocket connection opened:', event);
  }

  private onMessage = async (event: MessageEvent) => {
    try {
      const jsonData = JSON.parse(event.data) as TwitchMessage;
      this.cube.handleMessage(
        jsonData.user,
        jsonData.message,
        jsonData.message.toLowerCase(),
        jsonData.isFollower,
        jsonData.isSub,
        jsonData.isMod
      );
  
      this.timeStampLog('User: ' + jsonData.user);
      this.timeStampLog('Message: ' + jsonData.message);
      this.timeStampLog('isMod: ' + jsonData.isMod);
      this.timeStampLog('isSub: ' + jsonData.isSub);
      this.timeStampLog('isFollower:' + jsonData.isFollower);
  
    } catch (error) {
      console.log('Received non-JSON data:', event.data);
    }
  }
  
  private onClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.reason);
  }

  private onError = (event: Event) => {
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
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
  }
}
