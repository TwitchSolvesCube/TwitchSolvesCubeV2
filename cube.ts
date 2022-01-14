import { TwistyPlayer, ExperimentalStickering } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg"
import { experimentalCube3x3x3KPuzzle } from "cubing/puzzles"
import { experimentalIs3x3x3Solved, KPuzzle } from "cubing/kpuzzle"
// import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

import TSC, * as global from "./TSC";
import * as twitch from "./twitch"

export const tsc = new TSC();

// Timers
let timeSinceSolvedTimer: NodeJS.Timer;
let userTurnTimer: NodeJS.Timer;
let afkCountdown: NodeJS.Timer;

export function clearAfkCountdown(){
  clearInterval(afkCountdown);
}

export function userTurnTimeThing(){
  userTurnTimer = setInterval(() => userTurnTime(), 1000);
}

const scrambleMoves333 =
  ["R", "R'", "R2",
    "L", "L'", "L2",
    "U", "U'", "U2",
    "D", "D'", "D2",
    "B", "B'", "B2",
    "F", "F'", "F2"]


export const queue = new Array();
var kpuzzle = new KPuzzle(experimentalCube3x3x3KPuzzle);
var player = new TwistyPlayer;

// Updates top right timer
function timeSS() {
  tsc.timeLabel.innerHTML = pad(parseInt((tsc.timeSinceSolved / 60).toString())) + ":" + pad(tsc.timeSinceSolved % 60);
  tsc.incTimeSS();
}

function pad(val: any) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

async function newScramble(eventID: string, scramble: string) {

  // Starts new player, replaces old one
  player = document.body.appendChild(new TwistyPlayer({
    puzzle: "3x3x3",
    hintFacelets: "floating",
    backView: "top-right",
    background: "none",
    controlPanel: "none",
  }));
  
  // if (scramble.toString() === '') {
  //   scramble = (await randomScrambleForEvent(eventID)).toString();
  //   scramArray = scramble.split(' ');
  // } else {
  //   //Convert input to Array of moves without the empty string as 1st element
  //   scramArray = scramble.split(' ').splice(1);
  // }

  await tsc.newScrambleArray();
  kpuzzle.reset();

  if (tsc.scramble.every(move => scrambleMoves333.includes(move))) {
    // "Animates" scramble, replaced once AddAlg is supported for animation
    var i = -1;
    var intervalID = setInterval(function () {
      ++i;
      if (i >= tsc.scramble.length - 1) {
        clearInterval(intervalID);
        clearInterval(timeSinceSolvedTimer);
        tsc.resetTimeSS();
        timeSinceSolvedTimer = setInterval(timeSS, 1000);
      }
      const newMove = new Move(tsc.scramble[i]);
      player.experimentalAddMove(newMove);
      kpuzzle.applyAlg(new Alg(tsc.scramble[i]));
    }, 400);

    //Debug
    // const newMove = new Move(tsc.scramble[0]);
    // player.experimentalAddMove(newMove);
    // kpuzzle.applyAlg(new Alg(tsc.scramble[0]));

    tsc.resetMoves();
    tsc.movesLabel.innerHTML = pad(tsc.totalMoves);
  }
}

// Updates bottom center user label
function userTurnTime() {
  if (tsc.turnTime >= 0) {
    tsc.userLabel.innerHTML = pad(queue[0] + "\'s turn ") + pad(parseInt((tsc.turnTime / 60).toString())) + ":" + pad(tsc.turnTime % 60);
    tsc.decTurnTime();
  }
  else {
    clearInterval(afkCountdown);
    tsc.setSpeedNotation(false);
    removeCurrentPlayer(true);
  }
}

function kickAFK() {
  var afkTimer = 120;
  clearInterval(afkCountdown);
  afkCountdown = setInterval(() => {
    afkTimer--;
    //console.log(afkTimer);
    if (afkTimer === 0) {
      twitch.say(`@${queue[0]}, you have been kicked after not making any moves for 2 minutes!`);
      clearInterval(afkCountdown);
      removeCurrentPlayer();
    }
  }, 1000)
}

export function joinQueue(user: string) {
  if (tsc.turnsState()) {
    if (queue.length === 0) {
      queue.push(user);
      if (twitch.isFollowing(user)) {
        tsc.setTurnTime(480);
      }
      else {
        tsc.setTurnTime(300);
      }
      twitch.say(`@${user}, it\'s your turn! Do !leaveQ when done`);
      kickAFK();
    }
    else if (queue[0] === user) {
      twitch.say(`@${user}, it\'s currently your turn!`);
    }
    else if (queue.find(name => name === user) === undefined) {
      queue.push(user);
      if (queue.length > 2) {
        twitch.say(`@${user}, you have joined the queue! There are ${queue.length - 1} users in front of you`)
      } else {
        twitch.say(`@${user}, you have joined the queue! There is ${queue.length - 1} user in front of you`);
      }
    }
    else if (queue.find(name => name === user) === user) {
      twitch.say(`@${user}, you\'re already in the queue please wait :)`);
    }
  }
  else {
    twitch.say("The cube is currently in Vote mode no need to !joinq just type a move in chat");
  }
}

export function leaveQueue(user: string) {
  if (tsc.turnsState()) {
    if (queue.find(name => name === user) === user) {
      if (queue[0] === user) {
        removeCurrentPlayer(false);
      }
      else {
        queue.splice(queue.indexOf(user), 1)
      }
      clearInterval(afkCountdown);
      twitch.say(`@${user}, you have now left the queue`);
    }
    else {
      twitch.say(`@${user}, you are not in the queue. Type !joinQ to join`);
    }
  }
  else {
    twitch.say("The cube is currently in Vote mode no need to !leaveq just type a move in chat");
  }
}

export function removeCurrentPlayer(timeup = false) {
  // Reset turnTime, clear label, stop user timer, remove player
  tsc.setTurnTime(300);
  tsc.setCurrentTurn(false);
  tsc.userLabel.innerHTML = "";
  tsc.setSpeedNotation(false);

  if (timeup) {
    twitch.say(`@${queue.shift()}, time is up, you may !joinq again`);
  }
  else {
    queue.shift();
  }

  // If someone is in queue the @ user else clear user label
  if (queue.length > 0) {
    if (twitch.isFollowing(queue[0])) {
      tsc.setTurnTime(480);
    }
    else {
      tsc.setTurnTime(300);
    }
    twitch.say(`@${queue[0]}, it\'s your turn! Do !leaveQ when done`);
    kickAFK();
  }
  else {
    clearInterval(userTurnTimer);
  }
}

export function doCubeMoves(message: string) {
  // Player commands/settings
  var msg = message.toLowerCase();
  
  if (msg.includes("scramble")) {
    if (msg === "scramble") {
      newScramble("333", "");
    } else {
      newScramble("333", message.slice(8, message.length));
    }
  }
  if (msg === "!speednotation" || msg === "!sn") {
    if (tsc.speedNotationState()) {
      tsc.setSpeedNotation(false);
    } else {
      tsc.setSpeedNotation(true);
    }
  }
  if (msg === "!none") {
    player.backView = "none";
  }
  if (msg === "!topright" || msg === "!tr") {
    player.backView = "top-right";
  }
  if (msg === "!sidebyside" || msg === "!sbs") {
    player.backView = "side-by-side";
  }
  if (msg === "!blind" || msg === "!bld") {
    player.experimentalStickering = "invisible";
  }
  if (msg === "!normal" || msg === "!norm") {
    player.experimentalStickering = "full";
  }

  if (!tsc.isCubeSolved()) {
    if (!tsc.speedNotationState()) {
      // Ensure moves can be done
      msg = message.replace("`", "\'")
        .replace("‘", "\'").replace("’", "\'").replace("\"", "\'")
        .replace("X", "x").replace("Y", "y").replace("Z", "z")
        .replace("m", "M").replace("e", "E").replace("s", "S");


      if (global.moves333.find(elem => elem === msg) != undefined) {
        kickAFK();
        const newMove = new Move(msg);
        player.experimentalAddMove(newMove);
        kpuzzle.applyMove(newMove);

        // Update top right moves
        tsc.incMoves();
        tsc.movesLabel.innerHTML = pad(tsc.totalMoves);
      }
    } else if (tsc.speedNotationState()) {
      msg = message.toLowerCase();

      if (global.snMoves333.find(elem => elem === msg) != undefined) {
        msg = msg.replace("5", "M").replace("6", "M").replace("x", "M\'").replace("t", "x")
          .replace("y", "x").replace("b", "x\'").replace("n", "x\'").replace(";", "y")
          .replace("a", "y\'").replace("d", "L").replace("z", "d").replace("?", "d'")
          .replace("q", "z\'").replace("w", "B").replace("e", "L\'").replace("i", "R")
          .replace("o", "B\'").replace("p", "z").replace("s", "D").replace("f", "U\'")
          .replace("g", "F\'").replace("h", "F").replace("j", "U").replace("k", "R\'")
          .replace("l", "D\'").replace("v", "l").replace("r", "l'").replace("m", "r'")
          .replace("u", "r").replace(",", "u").replace("c", "u'");

        kickAFK();

        const newMove = new Move(msg);
        player.experimentalAddMove(newMove);
        kpuzzle.applyMove(newMove);

        // Update top right moves
        tsc.incMoves();
        tsc.movesLabel.innerHTML = pad(tsc.totalMoves);
      }
    }

    if (twitch.isSubscriber() && message.length >= 3) {
      //User is subscribed and typed a message longer than 2 characters (i.e R U)
      let algArray = message.split(' ');

      if (algArray.every(v => global.moves333.includes(v))) {

        kickAFK();
        var i = -1;
        var doMoves = setInterval(function () {
          ++i;

          if (i === algArray.length) {
            clearInterval(doMoves);

          } else {
            const newMove = new Move(algArray[i]);
            player.experimentalAddMove(newMove);
            kpuzzle.applyMove(newMove);
            checkSolved();
          }
        }, 100);
      }
    }

    // This would be better but gets stuck in a loop once an error catches
    // This error gets thrown from kpuzzple.ts 
    //  "throw new Error("Unknown move: " + move.toString());"
    // try{
    //   player.experimentalAddMove(new Move(String(message)));
    // }
    // catch(Error){
    //   console.log("Invalid Move or Not a Move");
    // }
    // This would be better because with other puzzles we don't need to know the moves

    tsc.setCubeSolved(experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true }));
    console.log("Is cube solved? " + tsc.isCubeSolved());
  }
  checkSolved();
}

function checkSolved() {
  tsc.setCubeSolved(experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true }));
  if (tsc.isCubeSolved()) {
    setTimeout(function () { player.backView = "none" }, 1000)
    spinCamera({ numSpins: 4, durationMs: 6000 });

    // Pause for 15 seconds to view Solved State
    setTimeout(function () {
      // Reconstruction of Solve need to shrink/shorten link
      // player.experimentalModel.twizzleLink().then(
      //   function (value) {
      //     console.log(value)
      //     chatClient.say(channel, `Here's the complete reconstruction of the solve! ${value}`);
      //   },
      //   function (error) { }
      // );

      // Reset

      tsc.resetTimeSS();
      newScramble("333", "");
      tsc.setCubeSolved(false);
    }, 15 * 1000)
  }
}

// async function isFollowing(username: string) {
//   //Gets UserID from UserName
//   const userID = (await apiClient.users.getUserByName(username)).id;
//   //console.log(userID);
//   //return console.log(await apiClient.users.userFollowsBroadcaster(userID, 664794842));
// }

function smootherStep(x: number): number {
  return x * x * x * (10 - x * (15 - 6 * x));
}

function spinCamera(options?: { numSpins?: number, durationMs: number }): void {
  const durationMs = options?.durationMs ?? 2000;
  const start = performance.now();
  const end = start + durationMs;
  let lastFraction = 0;
  const animFrame = async (now: number) => {
    if (now > end) {
      now = end;
    }
    const currentFraction = (now - start) / durationMs;
    const elapsed = smootherStep(currentFraction) - smootherStep(lastFraction);
    const deltaDegrees = 360 * (options?.numSpins ?? 2) * elapsed;
    player.cameraLongitude = (await player.experimentalModel.orbitCoordinatesProp.get()).longitude + deltaDegrees;
    lastFraction = currentFraction;
    if (now !== end) {
      requestAnimationFrame(animFrame)
    }
  }
  requestAnimationFrame(animFrame);
}

// Starts cube scrambled
newScramble("333", "");
