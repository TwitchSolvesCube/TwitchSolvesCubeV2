import { randomScrambleForEvent } from "cubing/scramble";

function pad(val: any) {
    var valString = val + "";
    if (valString.length < 2) {
      return "0" + valString;
    } else {
      return valString;
    }
  }

export default class TSC {
    public scramble: Array<string>;
    public timeSinceSolved: number;
    public turnTime: number;
    public totalMoves: number;
    public currentUser: string; //TODO: setUser function and remove decTurnTime parameter for username

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
        this.timeLabel.innerHTML = pad(parseInt((this.timeSinceSolved / 60).toString())) + ":" + pad(this.timeSinceSolved % 60); // Updates top right timer
    }
    
    resetTimeSS() {
        this.timeSinceSolved = 0;
    }
    
    incMoves() {
        ++this.totalMoves;
        this.movesLabel.innerHTML = pad(this.totalMoves); //Updates moves top right
    }
    
    resetMoves() {
        this.totalMoves = 0;
        this.movesLabel.innerHTML = pad(0);
    }
    
    decTurnTime(username: string){
        --this.turnTime;
        this.userLabel.innerHTML = pad(username + "\'s turn ") + pad(parseInt((this.turnTime / 60).toString())) + ":" + pad(this.turnTime % 60); //Updates bottom user timer
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

    //TODO: Include parameter for eventID
    async newScrambleArray(){
        var scramString = await randomScrambleForEvent("333");
        // Turn scramble string into an array
        this.scramble = scramString.toString().split(' ');
        console.log(this.scramble);
        return Array(this.scramble);
    }

    setScrambleArray(scramArray: Array<string>){
        this.scramble = scramArray;
    }

    // Reset turnTime, clear label, stop user timer, remove player
    fullReset(){
        this.setTurnTime(300);
        this.setCurrentTurn(false);
        this.userLabel.innerHTML = ""; //TODO: this.setUser("")
        this.setSpeedNotation(false);
    }

    //fucntion to turn scramble string into array?
}
