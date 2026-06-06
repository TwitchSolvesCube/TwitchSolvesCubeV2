import { wcaEventInfo } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";
import type { PuzzleID } from "cubing/twisty";

interface SolveDataEntry {
  username: string;
  solve_participants: string;
  puzzle_id: string;
  solve_time_sec: number;
  total_moves: number;
  scramble: string;
  solve_alg: string;
  twizzle_link: string;
}

export default class TSC {

  private eventID: string;
  private scramble: Array<string> = new Array();
  private customScramble: boolean = false;
  private secondsSinceSolved: number = 0;
  private turnTime: number = 300;
  private followerTurnTime: number = 480;
  private totalMoves: number = 0;
  private solve_alg: string = '';
  private twizzleLink: string = '';
  private shortLink: string = '';

  private queue: Array<string> = new Array();
  private followers: Set<string> = new Set();
  private solveParticipants: Array<string> = new Array();
  private turns: boolean = true;
  private speedNotation: boolean = false;
  private movable: boolean = false;
  private solved: boolean = false;
  private enableDebug = false;

  private showLabels: boolean = true;
  private timeLabel: HTMLElement = document.getElementById("timeSinceSolved") as HTMLElement;
  private movesLabel: HTMLElement = document.getElementById("moveCount") as HTMLElement;
  private userLabel: HTMLElement = document.getElementById("userTurn") as HTMLElement;

  private topUserHeader: HTMLElement = document.getElementById("topUserHeader") as HTMLElement;
  private topUser1: HTMLElement = document.getElementById("topUser1") as HTMLElement;
  private topUser2: HTMLElement = document.getElementById("topUser2") as HTMLElement;
  private topUser3: HTMLElement = document.getElementById("topUser3") as HTMLElement;

  //Timers
  private userTurnTimer: ReturnType<typeof setInterval> | undefined;

  private send: (message: string) => void;

  constructor(eventID: string, send: (message: string) => void) {
    this.eventID = eventID;
    this.send = send;
  }

  async joinQueue(username: string, isFollowing: boolean = false): Promise<boolean> {
    let resetcube: boolean = false;
    username = username.toLowerCase();

    if (this.isTurns()) {
      const queue = this.getQueue();
      const qLength = this.getQLength();

      if (qLength === 0) {
        if ( this.getSecondsSinceSolved() >= 10800 ) {
          resetcube = true;
        }
        this.enqueue(username);
        if (isFollowing) {
          this.addFollower(username);
        }
        this.setTurnTime(this.isFollower(username) ? this.followerTurnTime : 300);
        this.userTurnTime();
        this.send(`@${username}, it's your turn! Do !leave when done`);
        //response = await this.kickAFK(); //TODO: Response
      } else if (this.getCurrentUser() === username) {
        this.send(`@${username}, it's currently your turn!`);
      } else if (!queue.includes(username)) {
        this.enqueue(username);
        if (isFollowing) {
          this.addFollower(username);
        }
        this.send(`@${username}, you have joined the queue! There ${qLength > 1 ? 'are' : 'is'} ${qLength} user${qLength > 1 ? 's' : ''} in front of you`);
      } else {
        this.send(`@${username}, you're already in the queue. Please wait :)`);
      }
    } else {
       this.send("The cube is currently in Vote mode. No need to !join, just type a move in chat");
    }
    return resetcube;
  }

  async removePlayer(username: string, chatRemoval: boolean = false) {
    username = username.toLowerCase();
    const userIndex = this.getQueue().indexOf(username);
  
    if (this.isTurns()) {
      if (userIndex !== -1) {
        this.queue.splice(userIndex, 1);
        const currentUser = this.getCurrentUser();
        //If the removed user was at index 0 then reset the timer for the next user
        if (userIndex === 0) {
          this.setSpeedNotation(false);
          this.setTurnTime(currentUser != null ? (this.isFollower(currentUser) ? this.followerTurnTime : 300) : 300);
        }
        //this.clearAfkCountdown();
        if (currentUser != null && !chatRemoval) { //If the user is removed by the timer queue next player
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
    if (this.userTurnTimer != null) {
      clearInterval(this.userTurnTimer);
      this.userTurnTimer = undefined;
    }
  }

  async userTurnTime(): Promise<void> {
    this.userTurnTimer = setInterval(() => {
      if (!this.decTurnTime()) {
        //this.clearAfkCountdown();
        this.setTurnTime(300);
        this.setSpeedNotation(false);
        const expiredUser = this.getCurrentUser();
        if (expiredUser != null) {
          //TODO: Once a player's time is out there is no return to twitch chat because messages are only sent on moves
          this.removePlayer(expiredUser, false).catch(err => this.timeStampLog(`removePlayer error: ${err.message}`));
        }
      }
    }, 1000);
  }

  addFollower(username: string): void {
    this.followers.add(username.toLowerCase());
  }

  isFollower(username: string): boolean {
    return this.followers.has(username.toLowerCase());
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

  addParticipant(username: string): void {
    this.solveParticipants.push(username);
  }

  getParticipants(): string {
    return this.solveParticipants.toString();
  }

  clearParticipants(): void {
    this.solveParticipants = new Array();
  }

  dedupParticipants(): void {
    this.solveParticipants = [...new Set(this.solveParticipants)];
    this.solveParticipants = this.solveParticipants.filter(user => user !== this.getCurrentUser());
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
    date.setSeconds(this.secondsSinceSolved);
    var result = date.toISOString().slice(11, 19);
    return result;
  }

  getSecondsSinceSolved(): number {
    return this.secondsSinceSolved;
  }

  incTimeSS(): void {
    ++this.secondsSinceSolved;
    if (this.showLabels) {
      this.timeLabel.textContent = `${this.getTimeSinceSolved()}`;
    }
  }

  resetTimeSS(): void {
    this.secondsSinceSolved = 0;
    if (this.showLabels) {
      this.timeLabel.textContent = "00:00:00";
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
    if (this.getQLength() === 1){ //length is 1 before last player is removed where this function is called
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

  getCurrentUser(): string | undefined {
    return this.queue[0];
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
  
  async newScrambleArray(): Promise<string[]> {
    var scramString = await randomScrambleForEvent(this.eventID);
    //Turn scramble string into an array
    this.scramble = scramString.toString().split(' ');
    this.timeStampLog(`Scramble: ${this.scramble}`);
    return this.scramble;
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

  setSolvedAlg(solve_alg: string): void {
    this.solve_alg = solve_alg;
  }

  getSolvedAlg(): string {
    return this.solve_alg;
  }

  setTwizzleLink(twizzleLink: string): void {
    this.twizzleLink = twizzleLink;
  }

  getTwizzleLink(): string {
    return this.twizzleLink;
  }

  setShortLink(shortLink: string): void {
    this.shortLink = shortLink;
  }

  getShortLink(): string {
    return this.shortLink;
  }

  sendShortLinkMsg(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser == null) return;
    this.send(`@${currentUser} view your replay here ${this.getShortLink()} ` +
      `Save this link id to view stats with !view.`);
  }

  sendSolvedMsg(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser == null) return;
    this.send(`This ${this.getPuzzleID()} was solved in ${this.getTimeSinceSolved()} and ` +
       `finished by @${currentUser} in ${this.getTotalMoves()} moves. The` +
       `${this.isCustomScramble() ? ' custom' : ''} scramble was ${this.getScramble()}.` +
       `${this.getParticipants() ? ` Participants: ${this.getParticipants()}` : ''}`);
  }

  getSolvedData(): SolveDataEntry | null {
    const currentUser = this.getCurrentUser();
    if (currentUser == null) return null;
    const solveData: SolveDataEntry = {
      username: currentUser,
      solve_participants: this.getParticipants(),
      puzzle_id: this.getPuzzleID(),
      solve_time_sec: this.getSecondsSinceSolved(),
      total_moves: this.getTotalMoves(),
      scramble: this.getScramble(),
      solve_alg: this.getSolvedAlg(),
      twizzle_link: this.getTwizzleLink()
    };

    return solveData;
  }

  setTopUsers(puzzle_id: string, topUser1: string, topUser2: string, topUser3: string): void {
    this.topUserHeader.textContent = `Top ${puzzle_id} Solves`;
    this.topUser1.textContent = topUser1;
    this.topUser2.textContent = topUser2;
    this.topUser3.textContent = topUser3;
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
