import { wcaEventInfo } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";
import { send } from "./twitchClient";
import { PuzzleID } from "cubing/dist/types/twisty";

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

  async joinQueue(username: string) {

    if (this.isTurns()) {
      const queue = this.getQueue();
      const qLength = this.getQLength();

      if (qLength === 0) {
        this.enqueue(username);
        //isFollowing(username);
        this.userTurnTime();
        send(`@${username}, it's your turn! Do !leaveQ when done`);
        //response = await this.kickAFK(); //TODO: Response
      } else if (this.getCurrentUser() === username) {
        send(`@${username}, it's currently your turn!`);
      } else if (!queue.includes(username)) {
        this.enqueue(username);
        send(`@${username}, you have joined the queue! There ${qLength > 2 ? 'are' : 'is'} ${qLength} user${qLength > 2 ? 's' : ''} in front of you`);
      } else {
        send(`@${username}, you're already in the queue. Please wait :)`);
      }
    } else {
      send("The cube is currently in Vote mode. No need to !joinq, just type a move in chat");
    }

    //console.log('[' + this.getCurrentDate().toLocaleTimeString() + '] ' + response); //TODO: Add timestamps to console logs
  }

  async removePlayer(username: string) {
    //Reset the Cube
    this.setTurnTime(300);
    this.setSpeedNotation(false);
  
    const queue = this.getQueue();
    let currentUser = this.getCurrentUser();
    const userIndex = queue.indexOf(username);
  
    if (this.isTurns()) {
      if (userIndex !== -1) {
        send(`@${username}, you have been removed from the queue. `);
        this.queue.splice(userIndex, 1);
        this.clearUserTurnTimer();
        this.setUserLabel("");
        //this.clearAfkCountdown();
      } else {
        send(`@${username}, you are not in the queue. Type !joinQ to join. `);
      }
    } else {
      send("The cube is currently in Vote mode. No need to !leaveq, just type a move in chat. ");
    }
  
    //If someone is in the queue after the removal of a user
    currentUser = this.getCurrentUser(); //Bug?: If anyone leaves queue then it will send a msg from below
    if (currentUser) {
      //isFollowing(currentUser);
      send(`@${currentUser}, it's your turn! Do !leaveQ when done. `);
      this.userTurnTime();
      //this.kickAFK(); // TODO: Response
    } else { //If there is no user left in the queue
      //Restarts and clears the bottom timer, response gets sent before the person leaves the queue
      send(`The queue is currently empty. Anyone is free to !joinQ. `);
      this.clearUserTurnTimer();
      this.setUserLabel("");
    }

    //console.log('[' + this.getCurrentDate().toLocaleTimeString() + '] ' + responses.join('\n'));
  }

  clearUserTurnTimer(): void {
    if (typeof this.userTurnTimer === 'number') {
      clearInterval(this.userTurnTimer);
    }
  }

  async userTurnTime(): Promise<void> {
    this.userTurnTimer = setInterval(() => {
      if (!this.decTurnTime()) {
        //this.clearAfkCountdown();
        this.removePlayer(this.getCurrentUser());
      }
    }, 1000);
  }

  enqueue(username: string): void {
    this.queue.push(username);
  }

  getQueue(): Array<String> {
    return this.queue;
  }

  clearQueue(): void {
    this.queue= new Array();
  }

  getQLength(): number {
    return this.queue.length;
  }

  getEventID(): string {
    return this.eventID;
  }

  getPuzzleID(): PuzzleID {
    return wcaEventInfo(this.eventID)!.puzzleID;
  }

  getTimeSinceSolved(): string {
    var date = new Date(null!);
    date.setSeconds(this.timeSinceSolved);
    var result = date.toISOString().slice(12, 19);
    return result;
  }

  incTimeSS(): void {
    ++this.timeSinceSolved;
    if (this.showLabels) {
      this.timeLabel.innerHTML = pad(this.getTimeSinceSolved()); // Updates top right timer
    }
  }

  resetTimeSS(): void {
    this.timeSinceSolved = 0;
  }

  getTotalMoves(): number {
    return this.totalMoves;
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
    this.clearUserTurnTimer();
    this.setUserLabel("");
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
  //       console.log('[' + this.currentDate.toLocaleTimeString() + '] ' + this.queue[0]);
  //       return this.queue[0]!;
  //   } else {
  //       return "Queue is empty";
  //   }
  // }

  getCurrentUser(): string {
    //console.log('[' + this.currentDate.toLocaleTimeString() + '] ' + this.queue[0]); //undefined when using !remove
    return this.queue[0]!;
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
    //console.log('[' + this.currentDate.toLocaleTimeString() + '] ' + this.scramble);
    return Array(this.scramble);
  }

  setScrambleArray(scramArray: Array<string>): void {
    this.scramble = scramArray;
  }

  getScrambleArray(): Array<string> {
    return this.scramble;
  }

  getScramble(): string {
    return this.scramble.join(' ');
  }

  getSolvedMessage(): string {
    return "The cube was solved in " + this.getTimeSinceSolved() + " and in " + this.getTotalMoves() + " moves. The scramble was " + this.getScramble() + ".";
  }
}
