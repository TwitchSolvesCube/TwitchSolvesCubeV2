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
    private timeSinceSolved: number;
    private turnTime: number;
    private totalMoves: number;

    private queue: Array<string> = new Array();
    private currentTurn: boolean;
    private isSolved: boolean;
    private turns: boolean;
    private speedNotation: boolean;
    private movable: boolean;

    private showLabels: boolean = true;
    private timeLabel: HTMLElement;
    private movesLabel: HTMLElement;
    private userLabel: HTMLElement;

    constructor(eventID: string){
        //Type of Cube
        this.eventID = eventID;

        // Top right timer
        this.timeSinceSolved = 0;
        this.timeLabel = document.getElementById("timeSinceSolved") as HTMLElement;

        // Top right moves counter
        this.totalMoves = 0;
        this.movesLabel = document.getElementById("moveCount") as HTMLElement;

        // Bottom center user turn
        this.turnTime = 301;
        this.currentTurn = false;
        this.userLabel = document.getElementById("userTurn") as HTMLElement;

        this.scramble = [];
        this.isSolved = false;
        this.turns = true;
        this.speedNotation = false;
    }

    getQ(): Array<string> {
        return this.queue;
    }

    getQLength(): number {
        return this.queue.length;
    }

    addToQ(user: string): void {
        this.queue.push(user);
    }

    shiftQ(): void {
        this.queue.shift();
    }

    getEventID(): string {
        return this.eventID;
    }

    getPuzzleID() {
        return wcaEventInfo(this.eventID)!.puzzleID;
    }

    incTimeSS(): void {
        ++this.timeSinceSolved;
        if (this.showLabels){
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
        if (this.showLabels){
            this.movesLabel.innerHTML = pad(this.totalMoves); //Updates moves top right
        }
    }
    
    resetMoves(): void {
        this.totalMoves = 0;
        if (this.showLabels){
            this.movesLabel.innerHTML = pad(0);
        }
    }
    
    decTurnTime(): boolean {
        if (this.getTurnTime() > 0 && this.getQLength() > 0 && this.getCurrentUser() != undefined){
            --this.turnTime;
            if (this.showLabels){
                this.userLabel.innerHTML = pad(this.getCurrentUser() + "\'s turn ") + pad(parseInt((this.getTurnTime() / 60).toString())) + ":" + pad(this.turnTime % 60); //Updates bottom user timer
            }
            return true;
        }
        return false;
    }
    
    setTurnTime(turnTime: number): void {
        this.turnTime = turnTime;
    }

    getTurnTime(): number{
        return this.turnTime;
    }

    setUserLabel(username: string): void {
        this.userLabel.innerHTML = username;
    }

    getCurrentUser(): string {
        console.log(this.queue[0]); //undefined when using !remove
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
    
    isTurns(): boolean{
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

    getScrambleArray(): Array<string>  {
        return this.scramble;
    }

    // Reset turnTime, clear label, stop user timer, remove player
    fullReset(): void {
        this.setTurnTime(301);
        this.setCurrentTurn(false);
        this.setSpeedNotation(false);
    }
}
