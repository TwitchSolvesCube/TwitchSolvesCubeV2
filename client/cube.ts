import "cubing/twisty";
import { TwistyPlayer } from "cubing/twisty";
import { Move, Alg } from "cubing/alg";
import { cube2x2x2, cube3x3x3, puzzles } from "cubing/puzzles";
import { KPuzzle, KPattern } from "cubing/kpuzzle";
import { tscSupabaseClient } from "./database/databaseQueries";
import * as query from './database/chatQueries';

import TSC from "./TSC";
import delay from "delay";

export default class tscCube {
  private player: TwistyPlayer;
  private db: tscSupabaseClient;
  public tsc: TSC;

  //Not Supported upstream "clock", "pyram", "skewb", "minx"
  private validPuzzle: Array<string> = ["222", "333", "444", "555"];
  private moreKpuzzles: Array<string> = ["4x4x4", "5x5x5", "skewb", "pyraminx", "megaminx", "clock"];

  // Cubingjs does understand valid moves per puzzle, but that includes R* for any number. Ex, R100.
  // This is not desirable for a future database, and is not standard notation.
  private baseMoves = ["", "'", "2"];
  private rotations = ["x", "y", "z"];
  private standardFaces = ["R", "L", "U", "D", "F", "B"];
  private wideFaces = ["r", "l", "u", "d", "f", "b"];
  private sliceMoves = ["M", "E", "S"];
  private wideNotationFaces = ["Rw", "Lw", "Uw", "Dw", "Fw", "Bw"];
  private innerSliceFaces = ["3Rw", "3Lw", "3Uw", "3Dw", "3Fw", "3Bw"];

  private generateMoves(faces: string[], suffixes: string[]): string[] {
    return faces.flatMap(face => 
      suffixes.map(suffix => `${face}${suffix}`)
    );
  }

  private faceMoves = {
    "222": [
      ...this.generateMoves(this.standardFaces, this.baseMoves)
    ],
    "333": [
      ...this.generateMoves(this.standardFaces, this.baseMoves),
      ...this.generateMoves(this.wideFaces, this.baseMoves),
      ...this.generateMoves(this.sliceMoves, this.baseMoves)
    ],
    "444": [
      ...this.generateMoves(this.standardFaces, this.baseMoves),
      ...this.generateMoves(this.wideFaces, this.baseMoves),
      ...this.generateMoves(this.wideNotationFaces, this.baseMoves),
      ...this.generateMoves(this.innerSliceFaces, this.baseMoves)
    ],
    "555": [
      ...this.generateMoves(this.standardFaces, this.baseMoves),
      ...this.generateMoves(this.wideFaces, this.baseMoves),
      ...this.generateMoves(this.sliceMoves, this.baseMoves),
      ...this.generateMoves(this.wideNotationFaces, this.baseMoves),
      ...this.generateMoves(this.innerSliceFaces, this.baseMoves)
    ]
  };

  private rotationMoves = this.generateMoves(this.rotations, this.baseMoves);

  private movesMap = {
    "222": [...this.faceMoves["222"], ...this.rotationMoves],
    "333": [...this.faceMoves["333"], ...this.rotationMoves],
    "444": [...this.faceMoves["444"], ...this.rotationMoves],
    "555": [...this.faceMoves["555"], ...this.rotationMoves]
  };

  private scrambleMap = {
    "222": [...this.faceMoves["222"]],
    "333": [...this.faceMoves["333"]],
    "444": [...this.faceMoves["444"]],
    "555": [...this.faceMoves["555"]]
  };

  private validMove: Array<string> = [];
  private validScramble: Array<string> = [];

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
  private puzzleState: KPattern;

  private send: (message: string) => void;
  private sendLinkData: (uuid: string, link: string) => void;

  // Date
  // let currentDate = new Date();
  constructor(eventID: string, send: (message: string) => void, sendLinkData: (uuid: string, link: string) => void) {
    this.send = send;
    this.sendLinkData = sendLinkData;
    this.tsc = new TSC(eventID, this.send.bind(this));
    this.newCube();
    this.db = new tscSupabaseClient();
    this.updateTopUsers(); //Update the topleft with the top 3 users
  }

  private async newCube() {
    const newPuzzleID = this.tsc.getPuzzleID();

    if (this.movesMap[this.tsc.getEventID()]) {
      this.validMove = this.movesMap[this.tsc.getEventID()];
      this.validScramble = this.scrambleMap[this.tsc.getEventID()];
    }

    this.player = document.body.appendChild(new TwistyPlayer({
      puzzle: newPuzzleID,
      hintFacelets: "floating",
      backView: "top-right",
      background: "none",
      controlPanel: "none",
      experimentalDragInput: "none"
    }));

    // kpuzzle needs to match the puzzleID in order to validate moves.
    if (newPuzzleID === "2x2x2") {
      this.kpuzzle = await cube2x2x2.kpuzzle();
    }
    if (newPuzzleID === "3x3x3") {
      this.kpuzzle = await cube3x3x3.kpuzzle();
    }
    if (this.moreKpuzzles.includes(newPuzzleID)) {
      this.kpuzzle = await puzzles[newPuzzleID].kpuzzle();
    }
    
    this.puzzleState = this.kpuzzle.identityTransformation().toKPattern();
  }

  playAudio(url: string): void {
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Audio playback failed:", e));
  }

  appendMove(myMove: string) {
    if (this.validMove.includes(myMove)) {
      const newMove = new Move(myMove);
      this.player.experimentalAddMove(newMove);
      this.puzzleState = this.puzzleState.applyMove(newMove);
      if (myMove.includes("2") ) {
        this.playAudio('./sounds/doubleMove.mp3');
      }
      this.playAudio('./sounds/singleMove.mp3');
      this.checkSolved();
    } else {
      this.tsc.timeStampLog(`${myMove} is not a move.`);
    }
  }

  async appendAlg(myAlg: Array<string>) {
    this.tsc.enableCube(false); //Can't move cube while appending move
    for (var i = 0; i <= myAlg.length - 1; i++) {
      await delay(400);
      this.appendMove(myAlg[i]);
    }
    this.tsc.enableCube(true); //Allows moves on cube again
    //Debug
    //appendMove(myAlg[0]);
  }

  async scramblePuzzle(scramble?: Array<string>) {
    this.newCube();
    this.tsc.setSolvedState(false);

    if (scramble == null) { //If user does not provide scramble
      await this.tsc.newScrambleArray(); //Generate random scramble
      await this.appendAlg(this.tsc.getScrambleArray());  //Apply alg to cube
      this.tsc.setCustomScramble(false);
    } else if (scramble.length > 40) { //If custom scramble is too long 
      this.send("Your custom scramble is too long, applying random scramble.");
      await this.tsc.newScrambleArray(); //Generate random scramble
      await this.appendAlg(this.tsc.getScrambleArray());  //Apply alg to cube
      this.tsc.setCustomScramble(false);
    } else {
      this.tsc.setScrambleArray(scramble);
      await this.appendAlg(scramble); //Apply user provided scramble to cube
      this.tsc.setCustomScramble(true);
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
      } else {
        //Allows a user to use their own scrambles
        const scramblePart = message.slice(8).trim(); // Remove "scramble" prefix
        const userScramble = scramblePart.split(/\s+/); // Split on any whitespace

        if (userScramble.every(move => this.validScramble.includes(move))) {
          this.scramblePuzzle(userScramble);
        } else {
          const invalidMoves = userScramble.filter(move => !this.validScramble.includes(move));
          this.send(`Invalid move/scramble detected: ${invalidMoves.join(', ')}`);
        }
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
    if (this.validPuzzle.includes(message)) {
      this.tsc.setEventID(message);
      this.updateTopUsers(); //Update the topleft with the top 3 users
      this.scramblePuzzle();
    }

    if (!this.isCubeStateSolved()) {
      if (!this.tsc.isSpeedNotation()) {
        // Ensure moves can be done
        msg = message.replace("`", "\'")
          .replace("‘", "\'").replace("’", "\'").replace("\"", "\'")
          .replace("X", "x").replace("Y", "y").replace("Z", "z")
          .replace("m", "M").replace("e", "E").replace("s", "S");

          // Moves with a "." are valid to prevent spam detection
          if (this.validMove.includes(msg) || this.validMove.some(move => msg.includes(move + "."))) {
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
          this.puzzleState = this.puzzleState.applyMove(newMove);

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
    }
  }

  async handleMessage(user: string, move: string, message: string, isFollowing: boolean, isSub: boolean, isMod: boolean) {
    const queue = this.tsc.getQueue();
    let currentUser = this.tsc.getCurrentUser();

    const joinCommands = ["!join", "!j", "!joinq", "!jq"];
    const leaveCommands = ["!leave", "!l", "!leaveq", "!lq"];
  
    if (message === "!queue" || message === "!q") {
      if (queue.length > 0) {
        this.send(`${queue}`);
      } else {
        this.send("There's currently no one in the queue, do !join");
      }
    } else if (joinCommands.includes(message)) {
      await this.tsc.joinQueue(user);
    } else if (leaveCommands.includes(message)) {
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
      }
    }

    //Database queries
    const topCommands: Array<string> = ["!top", "!leaderboard", "!lb"];
    if (this.db.isInitialized()) {
      if (topCommands.includes(message) || topCommands.some(cmd => message.startsWith(cmd + " "))) {
        const topQueryResult = await query.topQuery(message);
        this.send(topQueryResult);
      }
      if (message.startsWith("!topsolvers")) {
        const topSolversResult: string = await query.topSolversQuery(message);
        this.send(topSolversResult);
      }
      if (message.startsWith("!pb")) {
        const userTopResult: string = await query.userPBQuery(message, user);
        this.send(userTopResult);
      }
      if (message.startsWith("!view")) {
        const viewResult: string = await query.viewSolve(message);
        this.send(viewResult);
      }
      if (message.startsWith("!solves")) {
        const userSolvesResult: string = await query.userSolves(message, user);
        this.send(userSolvesResult);
      }
    }
  }

  isCubeStateSolved() {
    return this.puzzleState.experimentalIsSolved({
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

      //This is a long and complicated way to get the scramble to show in setup in the twizzle player
      //This is because 'experimentalSetupAlg' cannot be used to animate cube movements
      this.player.experimentalSetupAlg = this.tsc.getScramble(); //The cube can no longer be changed, so we configure the setupalg here to be the scramble
      const twizzleLink = await this.player.experimentalModel.twizzleLink(); //The twizzlelink still has a scramble applied and needs to be removed

      //Parse the twizzle URL
      const url = new URL(twizzleLink);

      //Get the value of 'alg=' and 'setup-alg='
      let algValue = url.searchParams.get('alg');
      const setupAlgValue = url.searchParams.get('setup-alg');

      //Remove 'setup-alg=' from the beginning of 'alg=' which is the scramble from this.player.experimentalSetupAlg = this.tsc.getScramble(); above
      if (algValue.startsWith(setupAlgValue)) {
        algValue = algValue.slice(setupAlgValue.length).trim();
      }
      //Update the 'alg=' parameter with the new value that has the scramble removed
      url.searchParams.set('alg', algValue);
      //Get the updated URL
      const updatedTwizzleLink = url.toString();
      this.tsc.timeStampLog(updatedTwizzleLink);
      this.tsc.setTwizzleLink(updatedTwizzleLink);
      this.tsc.setSolvedAlg(algValue);
      this.tsc.sendSolvedMsg();

      //Store if solve is under an hour and do not store if solves is custom
      if (this.tsc.getSecondsSinceSolved() <= 3600 && !this.tsc.isCustomScramble() && this.db.isInitialized()){
        //These set of lines allows it so the uuid from the database can append to the kutt URL
        const insertedData = await this.db.insertData(this.tsc.getSolvedData());
        this.sendLinkData(this.tsc.getTwizzleLink(), insertedData.uuid);
        await delay(1000); //Required to to avoid undefined shortlinkResult
        await this.db.setShortlinkForUUID(insertedData.uuid, this.tsc.getShortLink());
        this.tsc.sendShortLinkMsg();

        //Update the topleft with the top 3 users
        await this.updateTopUsers();
      }

      // Pause for 15 seconds to view Solved State
      await delay(15000);

      // Reset
      this.tsc.resetTimeSS();
      this.scramblePuzzle();
    }
  }

  async updateTopUsers(): Promise<void> {
    const result = await this.db.getTopSolveTimes(this.tsc.getPuzzleID());
    if (result) {
      this.tsc.setTopUsers(result.topUser1, result.topUser2, result.topUser3);
      return;
    }
    this.tsc.setTopUsers(null, null, null);
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
}
