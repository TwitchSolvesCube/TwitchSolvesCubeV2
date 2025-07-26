import { wcaEventInfo } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";
import type { PuzzleID } from "cubing/twisty";

export default class TSC {

  private eventID: string;
  private scramble: Array<string> = new Array();
  private customScramble: boolean = false;
  private timeSinceSolved: number = 0;
  private turnTime: number = 300;
  private totalMoves: number = 0;

  private queue: Array<string> = new Array();
  private turns: boolean = true;
  private speedNotation: boolean = false;
  private movable: boolean;
  private solved: boolean = false;
  private enableDebug = false;

  private showLabels: boolean = true;
  private timeLabel: HTMLElement = document.getElementById("timeSinceSolved") as HTMLElement;
  private movesLabel: HTMLElement = document.getElementById("moveCount") as HTMLElement;
  private userLabel: HTMLElement = document.getElementById("userTurn") as HTMLElement;

  // Timers
  private userTurnTimer: NodeJS.Timer;

  private send: (message: string) => void;

  constructor(eventID: string, send: (message: string) => void) {
    this.eventID = eventID;
    this.send = send;
  }

  async joinQueue(username: string) {
    username = username.toLowerCase();
    if (this.isTurns()) {
      const queue = this.getQueue();
      const qLength = this.getQLength();

      if (qLength === 0) {
        this.enqueue(username);
        //isFollowing(username);
        this.userTurnTime();
        this.send(`@${username}, it's your turn! Do !leave when done`);
        //response = await this.kickAFK(); //TODO: Response
      } else if (this.getCurrentUser() === username) {
        this.send(`@${username}, it's currently your turn!`);
      } else if (!queue.includes(username)) {
        this.enqueue(username);
        this.send(`@${username}, you have joined the queue! There ${qLength > 2 ? 'are' : 'is'} ${qLength} user${qLength > 2 ? 's' : ''} in front of you`);
      } else {
        this.send(`@${username}, you're already in the queue. Please wait :)`);
      }
    } else {
       this.send("The cube is currently in Vote mode. No need to !join, just type a move in chat");
    }

    //this.timeStampLog(`Response ${response}`);
  }

  async removePlayer(username: string, chatRemoval: boolean = false) {
    username = username.toLowerCase();
    const userIndex = this.getQueue().indexOf(username);
  
    if (this.isTurns()) {
      if (userIndex !== -1) {
        this.queue.splice(userIndex, 1);
        let currentUser = this.getCurrentUser();
        // If the removed user was at index 0 then reset the timer for the next user
        if (userIndex === 0) {
          this.setTurnTime(300);
          this.setSpeedNotation(false);
        }
        //this.clearAfkCountdown();
        if (currentUser && !chatRemoval) { // If the user is removed by the timer queue next player
          //isFollowing(currentUser);
          this.userTurnTime();
          this.send(`@${currentUser}, it's your turn! Do !leave when done. `);
          //this.kickAFK();
        } else if (this.getQLength() === 0) { //If there is no user left in the queue
          //Restarts and clears the bottom timer, response gets sent before the person leaves the queue
          this.clearUserTurnTimer();
          this.setUserLabel("");
          this.send(`The queue is currently empty. Anyone is free to !join. `);
        }
        this.send(`@${username}, you have been removed from the queue. `);
      } else {
          this.send(`@${username}, you are not in the queue. Type !join to join. `);
      }
    } else {
        this.send(`The cube is currently in Vote mode. No need to !leave, just type a move in chat. `);
    }
  
    //this.timeStampLog(`responses.join ${responses.join('\n')}`);
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
        this.setTurnTime(300);
        this.setSpeedNotation(false);
        if (this.getQLength() > 0) {
          //TODO: Once a player's time is out there is no return to twitch chat because messages are only sent on moves
          this.removePlayer(this.getCurrentUser(), false);
        }
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
    this.queue = new Array();
    this.setTurnTime(10);
    this.setSpeedNotation(false);
    this.clearUserTurnTimer();
    this.setUserLabel("");
  }

  getQLength(): number {
    return this.queue.length;
  }

  setEventID(eventID: string): void {
    this.eventID = eventID;
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
    if (this.showLabels) {
      this.timeLabel.textContent = `${this.getTimeSinceSolved()}`;
    }
    ++this.timeSinceSolved;
  }

  resetTimeSS(): void {
    if (this.showLabels) {
      this.timeSinceSolved = 0;
    }
  }

  getTotalMoves(): number {
    return this.totalMoves;
  }

  incMoves(): void {
    ++this.totalMoves;
    if (this.showLabels) {
      this.movesLabel.textContent = `${this.totalMoves}`; //Updates moves top right
    }
  }

  resetMoves(): void {
    this.totalMoves = 0;
    if (this.showLabels) {
      this.movesLabel.textContent = "0";
    }
  }

  decTurnTime(): boolean {
    const currentUser = this.getCurrentUser();
    if (this.getTurnTime() >= 0 && this.getQLength() > 0 && currentUser != undefined) {
      if (this.showLabels) {
        this.userLabel.textContent = `${currentUser}'s turn ${String(Math.floor(this.getTurnTime() / 60)).padStart(2, '0')}:${String(this.turnTime % 60).padStart(2, '0')}`;
      }
      --this.turnTime;
      return true;
    }
    this.clearUserTurnTimer();
    this.timeStampLog(`Queue Length: ${this.getQLength()}`);
    if (this.getQLength() === 1){ // length is 1 before last player is removed where this function is called
      this.setUserLabel("");
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
    this.userLabel.textContent = username;
  }

  getUserName(index: number): string | null {
    if (index >= 0 && index < this.getQLength()) {
      return this.queue[index];
    }
    return null;
  }

  // getCurrentUser(): string {
  //   if (this.queue && getQLength() > 0) {
  //       this.timeStampLog(`${this.queue[0]}`);  //undefined when using !remove
  //       return this.queue[0]!;
  //   } else {
  //       return "Queue is empty"; // This will return "@Queue is empty, it's your turn! Do !leave when done."
  //   }
  // }

  getCurrentUser(): string {
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

  setSolvedState(solved: boolean): void {
    this.solved = solved;
  }

  getSolvedState(): boolean {
    this.timeStampLog(`Solved: ${this.solved}`);
    return this.solved;
  }
  
  async newScrambleArray(): Promise<string[][]> {
    var scramString = await randomScrambleForEvent(this.eventID);
    // Turn scramble string into an array
    this.scramble = scramString.toString().split(' ');
    this.timeStampLog(`Scramble: ${this.scramble}`);
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

  isCustomScramble(): boolean {
    return this.customScramble;
  }

  setCustomScramble(customScramble: boolean): void {
    this.customScramble = customScramble;
  }

  getSolvedMessage(): string {
    return `The ${this.getPuzzleID()} was solved in ${this.getTimeSinceSolved()} ` +
       `and in ${this.getTotalMoves()} moves. The ` +
       `${this.isCustomScramble() ? 'custom' : ''} scramble was ${this.getScramble()}.`;
  }

  setDebug(enableDebug: boolean): void {
    this.enableDebug = enableDebug;
  }

  timeStampLog(message: string): void {
    if (this.enableDebug) {
      const timestamp = new Date().toLocaleString();
      console.log(`[${timestamp}] ${message}`);
    }
  }
}
