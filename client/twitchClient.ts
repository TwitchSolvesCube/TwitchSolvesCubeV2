import tscCube from "./cube";

export class twitchClient {

  private ws: WebSocket;
  private cube: tscCube = new tscCube("333");

  constructor() {
    this.ws = new WebSocket('ws://localhost:8080');
    this.cube.scramblePuzzle();
    
    this.ws.addEventListener('open', this.onOpen.bind(this));
    this.ws.addEventListener('message', this.onMessage.bind(this));
  }

  private onOpen(event: Event) {
    console.log('WebSocket connection opened:', event);
    //ws.send('Hello, Server!');
  }

  private async onMessage(event: MessageEvent) {
    try {
      const jsonData = JSON.parse(event.data);
  
      const user = jsonData.user;
      const move = jsonData.message;
      const message = jsonData.message.toLowerCase();
  
      const isFollower = jsonData.isFollower;
      const isSub = jsonData.isSub;
      const isMod = jsonData.isMod;
  
      const queue = this.cube.tsc.getQueue();
      let currentUser = this.cube.tsc.getCurrentUser();
  
      if (message === "!queue" || message === "!q") {
        if (queue.length > 0) {
            this.send(`${queue}`);
        } else {
            this.send("There's currently no one in the queue, do !joinq");
        }
      } else if (message.startsWith("!joinq") || message.startsWith("!jq")) {
          this.send(await this.cube.tsc.joinQueue(user));
      } else if (message === "!leaveq" || message === "!lq") {
          this.send(await this.cube.tsc.removePlayer(user, true));
      } else if ( (message.startsWith("!remove") || message.startsWith("!rm")) && isMod) {
          const userToRemove = message!.split(' ').pop()?.split('@').pop()!;
          if (queue.includes(userToRemove)) {
            this.send(await this.cube.tsc.removePlayer(userToRemove, true));
          } else {
              this.send(`@${user} this user is not in the queue.`);
          }
      } else if ( (message === "!clearq" || message === "!cq") && isMod) {
        this.cube.tsc.clearQueue(); //Bug: Undefined user is mentioned, but it's okay 
        this.send(`The queue has now been cleared.`);
      }
      
      currentUser = this.cube.tsc.getCurrentUser();
      //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + currentUser);
      if (currentUser === user) { //If the message sent by the user is the currentUser do cube moves 
          if (this.cube.tsc.isCubeEnabled()) {
              this.cube.doCubeMoves(move);
              //cube.tsc.scheduleUserRemoval(30);
              //TODO
              console.log(this.cube.tsc.getSolvedState());
              if (this.cube.tsc.getSolvedState()){
                this.send(this.cube.tsc.getSolvedMessage());
              }
          }
      }
  
      if (message === '!followage') {
        if (isFollower) {
          this.send(`@${user} You have been following`);
        } else {
          this.send(`@${user} You are not following!`);
        }
      }
  
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
