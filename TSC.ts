import { wcaEventInfo } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";

function pad(val: any): string {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

export default class TSC {

  private eventID: string;
  private scramble: Array<string> = new Array();
  private timeSinceSolved: number = 0;
  private turnTime: number = 300;
  private totalMoves: number = 0;

  private queue: Array<string> = new Array();
  private currentTurn: boolean = false;
  private isSolved: boolean = false;
  private turns: boolean = true;
  private speedNotation: boolean = false;
  private movable: boolean;

  private showLabels: boolean = true;
  private timeLabel: HTMLElement = document.getElementById("timeSinceSolved") as HTMLElement;
  private movesLabel: HTMLElement = document.getElementById("moveCount") as HTMLElement;
  private userLabel: HTMLElement = document.getElementById("userTurn") as HTMLElement;

  // Timers
  private userTurnTimer: NodeJS.Timer;

  constructor(eventID: string) {
    this.eventID = eventID;
  }

  async joinQueue(username: string): Promise<string> {
    let response = '';

    if (this.isTurns()) {
      const queue = this.getQueue();
      const qLength = this.getQLength();

      if (qLength === 0) {
        this.enqueue(username);
        //twitch.isFollowing(username);
        response = `@${username}, it's your turn! Do !leaveQ when done`;
        //response = await this.kickAFK(); //TODO: Response
      } else if (this.getCurrentUser() === username) {
        response = `@${username}, it's currently your turn!`;
      } else if (!queue.includes(username)) {
        this.enqueue(username);
        response = `@${username}, you have joined the queue! There ${qLength > 2 ? 'are' : 'is'} ${qLength} user${qLength > 2 ? 's' : ''} in front of you`;
      } else {
        response = `@${username}, you're already in the queue. Please wait :)`;
      }
    } else {
      response = "The cube is currently in Vote mode. No need to !joinq, just type a move in chat";
    }

    console.log(response);
    return response;
  }

  async leaveQueue(username: string): Promise<string> {
    this.fullReset();
    let response = "";

    if (this.isTurns()) {
      const queue = this.getQueue();
      const currentUser = this.getCurrentUser();
      const userIndex = queue.indexOf(username);

      if (userIndex !== -1) {
        if (currentUser === username) {
          this.removeCurrentPlayer(username); //TODO: Response
        } else {
          queue.splice(userIndex, 1);
        }

        //this.clearAfkCountdown();
        response = `@${username}, you have now left the queue`;
      } else {
        response = `@${username}, you are not in the queue. Type !joinQ to join`;
      }
    } else {
      response = "The cube is currently in Vote mode. No need to !leaveq, just type a move in chat";
    }

    console.log(response);
    return response;
  }

  async removeCurrentPlayer(username: string): Promise<string> {
    this.fullReset();
    let response = "";

    const queue = this.getQueue();
    let currentUser = this.getCurrentUser();
    const userIndex = queue.indexOf(username);

    if (this.getQLength() > 0) {
      response = `@${username}, time is up, you may !joinq again`;
      this.queue.splice(userIndex, 1);
    }

    //If someone is in the queue after the removal of a user
    currentUser = this.getCurrentUser();
    if (currentUser) {
      //twitch.isFollowing(currentUser);
      response = `@${currentUser}, it's your turn! Do !leaveQ when done`;
      //this.kickAFK(); //TODO: Response
    } else { //If there is no user left in the queue
      // Restarts and clears the bottom timer, response gets sent before person leaves queue
      response = `The queue is currently empty. Anyone is free to !joinQ`;
      this.clearUserTurnTimer();
      this.setUserLabel("");
    }

    console.log(response);
    return response;
  }

  clearUserTurnTimer() {
    clearInterval(this.userTurnTimer);
  }

  async userTurnTime() {
    this.clearUserTurnTimer();

    this.userTurnTimer = setInterval(() => {
      if (!this.decTurnTime()) {
        //this.clearAfkCountdown();
        this.setSpeedNotation(false);
        this.removeCurrentPlayer(this.getCurrentUser()); //TODO: Response
      }
    }, 1000);
  }

  enqueue(username: string): void {
    this.queue.push(username);
  }

  shiftQ(): void {
    this.queue.shift();
  }

  getQueue() {
    return this.queue;
  }

  getQLength(): number {
    return this.queue.length;
  }

  getEventID(): string {
    return this.eventID;
  }

  getPuzzleID() {
    return wcaEventInfo(this.eventID)!.puzzleID;
  }

  incTimeSS(): void {
    ++this.timeSinceSolved;
    if (this.showLabels) {
      var date = new Date(null!);
      date.setSeconds(this.timeSinceSolved);
      var result = date.toISOString().slice(12, 19);
      this.timeLabel.innerHTML = pad(result); // Updates top right timer
    }
  }

  resetTimeSS(): void {
    this.timeSinceSolved = 0;
  }

  incMoves(): void {
    ++this.totalMoves;
    if (this.showLabels) {
      this.movesLabel.innerHTML = pad(this.totalMoves); //Updates moves top right
    }
  }

  resetMoves(): void {
    this.totalMoves = 0;
    if (this.showLabels) {
      this.movesLabel.innerHTML = pad(0);
    }
  }

  decTurnTime(): boolean {
    if (this.getTurnTime() > 0 && this.getQLength() > 0 && this.getCurrentUser() != undefined) {
      if (this.showLabels) {
        this.userLabel.innerHTML = pad(this.getCurrentUser() + "\'s turn ") + pad(parseInt((this.getTurnTime() / 60).toString())) + ":" + pad(this.turnTime % 60); //Updates bottom user timer
      }
      --this.turnTime;
      return true;
    }
    return false;
  }

  setTurnTime(turnTime: number): void {
    this.turnTime = turnTime;
  }

  getTurnTime(): number {
    return this.turnTime;
  }

  setUserLabel(username: string): void {
    this.userLabel.innerHTML = username;
  }

  getUserName(index: number): string | null {
    if (index >= 0 && index < this.queue.length) {
      return this.queue[index];
    }
    return null;
  }

  // getCurrentUser(): string {
  //   if (this.queue && this.queue.length > 0) {
  //       console.log(this.queue[0]);
  //       return this.queue[0]!;
  //   } else {
  //       return "Queue is empty";
  //   }
  // }

  getCurrentUser(): string {
    //console.log(this.queue[0]); //undefined when using !remove
    return this.queue[0]!;
  }

  setCurrentTurn(currentTurn: boolean): void {
    this.currentTurn = currentTurn;
  }

  isCurrentTurn(): boolean {
    return this.currentTurn;
  }

  setCubeSolved(isSolved: boolean): void {
    this.isSolved = isSolved;
  }

  isCubeSolved(): boolean {
    return this.isSolved;
  }

  setTurns(turns: boolean): void {
    this.turns = turns;
  }

  isTurns(): boolean {
    return this.turns;
  }

  setSpeedNotation(speedNotation: boolean): void {
    this.speedNotation = speedNotation;
  }

  isSpeedNotation(): boolean {
    return this.speedNotation;
  }

  enableCube(movable: boolean): void {
    this.movable = movable;
  }

  isCubeEnabled(): boolean {
    return this.movable;
  }

  async newScrambleArray(): Promise<string[][]> {
    var scramString = await randomScrambleForEvent(this.eventID);
    // Turn scramble string into an array
    this.scramble = scramString.toString().split(' ');
    //console.log(this.scramble);
    return Array(this.scramble);
  }

  setScrambleArray(scramArray: Array<string>): void {
    this.scramble = scramArray;
  }

  getScrambleArray(): Array<string> {
    return this.scramble;
  }

  // Reset turnTime, clear label, stop user timer, remove player
  fullReset(): void {
    this.setTurnTime(300);
    this.setCurrentTurn(false);
    this.setSpeedNotation(false);
  }
}
