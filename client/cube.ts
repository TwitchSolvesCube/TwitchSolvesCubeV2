import "cubing/twisty";
import { TwistyPlayer } from "cubing/twisty";
import { Move, Alg } from "cubing/alg";
import { cube3x3x3 } from "cubing/puzzles";
import { KPuzzle, KPattern } from "cubing/kpuzzle";
import { experimentalSolve3x3x3IgnoringCenters } from "cubing/search";

import TSC from "./TSC";
import delay from "delay";

export default class tscCube {
  private player: TwistyPlayer;
  public tsc: TSC;

  // Array of all supported moves
  private moves333: Array<string> =
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

  private snMoves333: Array<string> =
    ["i", "k", "u", "m",
      "d", "e", "v", "r",
      "h", "g",
      "w", "o",
      "s", "l", "z", "?",
      "j", "f", ",", "c",
      "5", "6", "x",
      "t", "y", "b",
      ";", "a",
      "p", "q"];

  // Timers
  private timeSinceSolvedTimer;
  private kpuzzle: KPuzzle;
  private cubeState: KPattern;

  private send: (message: string) => void;

  // Date
  // let currentDate = new Date();
  constructor(puzzleId: string, send: (message: string) => void) {
    this.send = send;
    this.tsc = new TSC(puzzleId, this.send.bind(this));
    this.newCube();
  }

  private async newCube() {
    this.player = document.body.appendChild(new TwistyPlayer({
      puzzle: this.tsc.getPuzzleID(),
      hintFacelets: "floating",
      backView: "top-right",
      background: "none",
      controlPanel: "none",
      experimentalDragInput: "none"
    }));

    this.kpuzzle = await cube3x3x3.kpuzzle();
    this.cubeState = this.kpuzzle.identityTransformation().toKPattern();
  }

  appendMove(myMove: string) {
    if (this.moves333.includes(myMove)) {
      const newMove = new Move(myMove);
      this.player.experimentalAddMove(newMove);
      this.cubeState = this.cubeState.applyMove(newMove);
      this.checkSolved();
    }
  }

  async appendAlg(myAlg: Array<string>) {
    this.tsc.enableCube(false); //Can't move cube while appending move
    if (myAlg.every(move => this.moves333.includes(move))) {
      for (var i = 0; i <= myAlg.length - 1; i++) {
        await delay(400);
        this.appendMove(myAlg[i]);
      }
    }
    this.tsc.enableCube(true); //Allows moves on cube again
    //Debug
    //appendMove(myAlg[0]);
  }

  async scramblePuzzle(scramble?: Array<string>) {
    this.newCube();
    this.tsc.setSolvedState(false);

    if (scramble == null || scramble.length > 40) { //If user does not provide scramble or if custom scramble is too long 
      await this.tsc.newScrambleArray(); //Generate random scramble
      await this.appendAlg(this.tsc.getScrambleArray());  //Apply alg to cube

      //  Dev
      // const myAlg = new Alg(await experimentalSolve3x3x3IgnoringCenters(kpuzzle.algToTransformation("R").toKPattern()));
      // console.log(myAlg.toString());
    }
    else {
      this.tsc.setScrambleArray(scramble);
      await this.appendAlg(scramble); //Apply user provided scramble to cube
    }
    
    this.tsc.resetMoves();
    this.tsc.resetTimeSS();
    
    if (typeof this.timeSinceSolvedTimer === 'number') {
      clearInterval(this.timeSinceSolvedTimer);
    }

    this.timeSinceSolvedTimer = setInterval(() => { this.tsc.incTimeSS(); }, 1000); //Starts timer, timeSS is a function
  }

  doCubeMoves(message: string) {
    //Player commands/settings
    var msg = message.toLowerCase();

    if (msg.startsWith("scramble")) {
      if (msg === "scramble") {
        this.scramblePuzzle();
      } else { //Allows a user to use their own scrambles
        // TODO: Mention scramble is custom in getSolvedMessage()
        this.scramblePuzzle(message.slice(9, message.length).split(" "));
      }
    }
    if (msg === "!speednotation" || msg === "!sn") {
      this.tsc.setSpeedNotation(true)
    }
    if (msg === "!normalnotation" || msg === "!nn") {
      this.tsc.setSpeedNotation(false);
    }
    if (msg === "!none") {
      this.player.backView = "none";
    }
    if (msg === "!topright" || msg === "!tr") {
      this.player.backView = "top-right";
    }
    if (msg === "!sidebyside" || msg === "!sbs") {
      this.player.backView = "side-by-side";
    }
    if (msg === "!blind" || msg === "!bld") {
      this.player.experimentalStickering = "invisible";
    }
    if (msg === "!normal" || msg === "!norm") {
      this.player.experimentalStickering = "full";
    }

    if (!this.isCubeStateSolved()) {
      if (!this.tsc.isSpeedNotation()) {
        // Ensure moves can be done
        msg = message.replace("`", "\'")
          .replace("‘", "\'").replace("’", "\'").replace("\"", "\'")
          .replace("X", "x").replace("Y", "y").replace("Z", "z")
          .replace("m", "M").replace("e", "E").replace("s", "S");

          // Moves with a "." are valid to prevent spam detection
          if (this.moves333.includes(msg) || this.moves333.some(move => msg.includes(move + "."))) {
            this.appendMove(msg.replace(/\.$/, ''));
          
            // Update top right moves
            this.tsc.incMoves();
          }
      } else if (this.tsc.isSpeedNotation()) {
        msg = message.toLowerCase();

        if (this.snMoves333.find(elem => elem === msg) != undefined) {
          msg = msg.replace("5", "M").replace("6", "M").replace("x", "M\'").replace("t", "x")
            .replace("y", "x").replace("b", "x\'").replace("n", "x\'").replace(";", "y")
            .replace("a", "y\'").replace("d", "L").replace("z", "d").replace("?", "d'")
            .replace("q", "z\'").replace("w", "B").replace("e", "L\'").replace("i", "R")
            .replace("o", "B\'").replace("p", "z").replace("s", "D").replace("f", "U\'")
            .replace("g", "F\'").replace("h", "F").replace("j", "U").replace("k", "R\'")
            .replace("l", "D\'").replace("v", "l").replace("r", "l'").replace("m", "r'")
            .replace("u", "r").replace(",", "u").replace("c", "u'");

          const newMove = new Move(msg);
          this.player.experimentalAddMove(newMove);
          this.cubeState = this.cubeState.applyMove(newMove);

          // Update top right moves
          this.tsc.incMoves();
        }
      }

      // if (twitch.isSubscriber() && message.length >= 3) {
      //   //User is subscribed and typed a message longer than 2 characters (i.e R U)
      //   let algArray = message.split(' ');

      //   if (algArray.every(v => moves333.includes(v))) {
      //     appendAlg(algArray);
      //   }
      // }

      // This would be better but gets stuck in a loop once an error catches
      // This error gets thrown from kpuzzple.ts 
      //  "throw new Error("Unknown move: " + move.toString());"
      // try{
      //   player.experimentalAddMove(new Move(String(message)));
      // }
      // catch(Error){
      //   console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + "Invalid Move or Not a Move");
      // }
      // This would be better because with other puzzles we don't need to know the moves

      //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + "Is cube solved? " + tsc.isCubeSolved());
    }
  }

  async handleMessage(user: string, move: string, message: string, isFollower: boolean, isSub: boolean, isMod: boolean) {
    const queue = this.tsc.getQueue();
    let currentUser = this.tsc.getCurrentUser();
  
    if (message === "!queue" || message === "!q") {
      if (queue.length > 0) {
        this.send(`${queue}`);
      } else {
        this.send("There's currently no one in the queue, do !joinq");
      }
    } else if (message.startsWith("!joinq") || message.startsWith("!jq")) {
      await this.tsc.joinQueue(user);
    } else if (message === "!leaveq" || message === "!lq") {
      await this.tsc.removePlayer(user, true);
    } else if ((message.startsWith("!remove") || message.startsWith("!rm")) && isMod) {
      const userToRemove = message!.split(' ').pop()?.split('@').pop()!;
      if (queue.includes(userToRemove)) {
        await this.tsc.removePlayer(userToRemove, true);
      } else {
        this.send(`@${user} this user is not in the queue.`);
      }
    } else if ((message === "!clearq" || message === "!cq") && isMod) {
      this.tsc.clearQueue();
      this.send(`The queue has now been cleared.`);
    }
  
    currentUser = this.tsc.getCurrentUser();
  
    if (currentUser === user) {
      if (this.tsc.isCubeEnabled()) {
        this.doCubeMoves(move);
        console.log(this.tsc.getSolvedState());
        if (this.tsc.getSolvedState()){
          this.send(this.tsc.getSolvedMessage());
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
  }

  isCubeStateSolved() {
    return this.cubeState.experimentalIsSolved({
      ignorePuzzleOrientation: true,
      ignoreCenterOrientation: true
    });
  }

  async checkSolved() {

    if (this.isCubeStateSolved()) {
      this.tsc.setSolvedState(true);
      this.tsc.enableCube(false); //Can't move cube once solved

      await delay(1000)
      this.player.backView = "none";

      clearInterval(this.timeSinceSolvedTimer); //"Pauses Timer"
      this.spinCamera({ numSpins: 4, durationMs: 6000 });

      // Pause for 15 seconds to view Solved State
      await delay(15000);
      // Shorten links only if moves/timeSS is less than x or send to discord?
      // Reconstruction of Solve need to shrink/shorten link
      // player.experimentalModel.twizzleLink().then(
      //   function (value) {
      //     console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + value)
      //     chatClient.say(channel, `Here's the complete reconstruction of the solve! ${value}`);
      //   },
      //   function (error) { }
      // );

      // Reset
      this.tsc.resetTimeSS();
      this.scramblePuzzle();
    }
  }

  spinCamera(options?: { numSpins?: number, durationMs: number }): void {
    const durationMs = options?.durationMs ?? 2000;
    const start = performance.now();
    const end = start + durationMs;
    let lastFraction = 0;
    const animFrame = async (now: number) => {
      if (now > end) {
        now = end;
      }
      const currentFraction = (now - start) / durationMs;
      const elapsed = this.smootherStep(currentFraction) - this.smootherStep(lastFraction);
      const deltaDegrees = 360 * (options?.numSpins ?? 2) * elapsed;
      this.player.cameraLongitude = (await this.player.experimentalModel.twistySceneModel.orbitCoordinates.get()).longitude + deltaDegrees;
      lastFraction = currentFraction;
      if (now !== end) {
        requestAnimationFrame(animFrame)
      }
    }
    requestAnimationFrame(animFrame);
  }

  smootherStep(x: number): number {
    return x * x * x * (10 - x * (15 - 6 * x));
  }

  getCurrentDate() {
    return new Date();
  }
  
}
