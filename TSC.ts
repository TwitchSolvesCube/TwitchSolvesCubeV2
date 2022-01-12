import { randomScrambleForEvent } from "cubing/scramble"
//Global constants
export const channelName = "TwitchSolvesCube";

// Array of all supported moves
export const moves333 =
    ["R", "R'", "R2", "r", "r'", "r2",
        "L", "L'", "L2", "l", "l'", "l2",
        "F", "F'", "F2", "f", "f'", "f2",
        "B", "B'", "B2", "b", "b'", "b2",
        "D", "D'", "D2", "d", "d'", "d2",
        "U", "U'", "U2", "u", "u'", "u2",
        "E", "E'", "E2",
        "S", "S'", "S2",
        "M", "M'", "M2",
        "x", "x'", "x2",
        "y", "y'", "y2",
        "z", "z'", "z2"];

export const snMoves333 =
    ["i", "k", "u", "m",
        "d", "e", "v", "r",
        "h", "g",
        "w", "o",
        "s", "l", "z", "?",
        "j", "f", ",", "c",
        "5", "6", "x",
        "t", "y", "b",
        ";", "a",
        "p", "q"]

export default class TSC {
    public scramble: Array<string>;
    public timeSinceSolved: number;
    public turnTime: number;
    public totalMoves: number;
    private currentTurn: boolean;
    private isSolved: boolean;
    private turns: boolean;
    private speedNotation: boolean;
    public timeLabel: HTMLElement;
    public movesLabel: HTMLElement;
    public userLabel: HTMLElement;

    constructor(){
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

    incTimeSS() {
        ++this.timeSinceSolved;
    }
    
    resetTimeSS() {
        this.timeSinceSolved = 0;
    }
    
    incMoves() {
        ++this.totalMoves;
    }
    
    resetMoves() {
        this.totalMoves = 0;
    }
    
    decTurnTime(){
        --this.turnTime;
    }
    
    setTurnTime(turnTime: number){
        this.turnTime = turnTime;
    }
    
    setCurrentTurn(currentTurn: boolean){
        this.currentTurn = currentTurn;
    }
    
    currentTurnState(){
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
    
    turnsState(){
        return this.turns;
    }

    setSpeedNotation(speedNotation: boolean){
        this.speedNotation = speedNotation;
    }
    
    speedNotationState(){
        return this.speedNotation;
    }

    async newScrambleArray(){
        var scramString = await randomScrambleForEvent("333");
        // Turn scramble string into an array
        this.scramble = scramString.toString().split(' ');
        console.log(this.scramble);
        return Array(this.scramble);
    }
}
