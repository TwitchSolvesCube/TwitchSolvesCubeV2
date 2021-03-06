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
    private scramble: Array<string>;
    private timeSinceSolved: number;
    private turnTime: number;
    private totalMoves: number;
    private currentUser: string;

    private currentTurn: boolean;
    private isSolved: boolean;
    private turns: boolean;
    private speedNotation: boolean;

    private showLabels: boolean = true;
    private timeLabel: HTMLElement;
    private movesLabel: HTMLElement;
    private userLabel: HTMLElement;

    constructor(eventID: string){
        //Type of Cube
        this.eventID = eventID;

        // Top right timer
        this.timeSinceSolved = 0;
        this.timeLabel = document.getElementById("timeSinceSolved");

        // Top right moves counter
        this.totalMoves = 0;
        this.movesLabel = document.getElementById("moveCount");

        // Bottom center user turn
        this.turnTime = 300;
        this.currentTurn = false;
        this.userLabel = document.getElementById("userTurn");

        this.scramble = [];
        this.isSolved = false;
        this.turns = true;
        this.speedNotation = false;
    }

    getEventID(){
        return this.eventID;
    }

    getPuzzleID(){
        return wcaEventInfo(this.eventID).puzzleID;
    }

    incTimeSS() {
        ++this.timeSinceSolved;
        if (this.showLabels){
            this.timeLabel.innerHTML = pad(parseInt((this.timeSinceSolved / 60).toString())) + ":" + pad(this.timeSinceSolved % 60); // Updates top right timer
        }
    }
    
    resetTimeSS() {
        this.timeSinceSolved = 0;
    }
    
    incMoves() {
        ++this.totalMoves;
        if (this.showLabels){
            this.movesLabel.innerHTML = pad(this.totalMoves); //Updates moves top right
        }
    }
    
    resetMoves() {
        this.totalMoves = 0;
        if (this.showLabels){
            this.movesLabel.innerHTML = pad(0);
        }
    }
    
    decTurnTime(currentUser: string){
        this.currentUser = currentUser;
        --this.turnTime;
        if (this.showLabels){
            this.userLabel.innerHTML = pad(this.currentUser + "\'s turn ") + pad(parseInt((this.turnTime / 60).toString())) + ":" + pad(this.turnTime % 60); //Updates bottom user timer
        }
    }
    
    setTurnTime(turnTime: number){
        this.turnTime = turnTime;
    }

    getTurnTime(){
        return this.turnTime;
    }

    setUserLabel(username: string){
        this.userLabel.innerHTML = username;
    }

    setCurrentUser(currentUser: string){
        this.currentUser = currentUser;
    }

    getCurrentUser(){
        return this.currentUser;
    }
    
    setCurrentTurn(currentTurn: boolean){
        this.currentTurn = currentTurn;
    }
    
    isCurrentTurn(){
        return this.currentTurn;
    }

    setCubeSolved(isSolved: boolean){
        this.isSolved = isSolved;
    }
    
    isCubeSolved(){
        return this.isSolved;
    }

    setTurns(turns: boolean){
        this.turns = turns;
    }
    
    isTurns(){
        return this.turns;
    }

    setSpeedNotation(speedNotation: boolean){
        this.speedNotation = speedNotation;
    }
    
    isSpeedNotation(){
        return this.speedNotation;
    }

    async newScrambleArray(){
        var scramString = await randomScrambleForEvent(this.eventID);
        // Turn scramble string into an array
        this.scramble = scramString.toString().split(' ');
        console.log(this.scramble);
        return Array(this.scramble);
    }

    setScrambleArray(scramArray: Array<string>){
        this.scramble = scramArray;
    }

    getScrambleArray(){
        return this.scramble;
    }

    // Reset turnTime, clear label, stop user timer, remove player
    fullReset(){
        this.setTurnTime(300);
        this.setCurrentTurn(false);
        this.setCurrentUser("");
        this.setSpeedNotation(false);
    }

    //fucntion to turn scramble string into array?
}
