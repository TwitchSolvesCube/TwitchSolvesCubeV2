import tmi from "tmi.js"
import { BOT_USERNAME, TOKEN, CHANNEL_NAME } from "./config"
import { TwistyPlayer, ExperimentalStickering } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg";
import { randomScrambleForEvent } from "cubing/scramble";
import { cube3x3x3, experimentalCube3x3x3KPuzzle } from "cubing/puzzles";
import { experimentalIs3x3x3Solved, KPuzzle } from "cubing/kpuzzle";

var timeSinceSolved = 0;
var timeLabel = document.getElementById("timeSinceSolved");

var totalMoves = 0;
var movesLabel = document.getElementById("moveCount");
movesLabel.innerHTML = pad(totalMoves);

var turnTime = 60;
var currentTurn = false;
var userLabel = document.getElementById("userTurn");

let timeSinceSolvedTimer;
let userTurnTimer;

const moves333 =
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
    "z", "z'", "y2"];

const queue = new Array();
var turns = true;

const kpuzzle = new KPuzzle(experimentalCube3x3x3KPuzzle);
const player = new TwistyPlayer({ //https://experiments.cubing.net/cubing.js/twisty/twisty-player-v1.html
  puzzle: "3x3x3",
  hintFacelets: "floating",
  backView: "top-right",
  background: "none",
  "controlPanel": "none",
  // "experimental-camera-latitude-limits": "none" //This could be useful?
});

function timeSS() {
  ++timeSinceSolved;
  timeLabel.innerHTML = pad(parseInt(timeSinceSolved / 60)) + ":" + pad(timeSinceSolved % 60); //Error? but works
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

//Animate scramble
async function newScramble() {
  //How to get scramble to string? Want to animate scramble
  const scramble = await randomScrambleForEvent("333");
  player.alg = scramble;
  kpuzzle.applyAlg(player.alg);
  document.body.appendChild(player);

  timeSinceSolvedTimer = setInterval(timeSS, 1000);
}

const client = new tmi.Client({
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: BOT_USERNAME,
    password: TOKEN
  },
  channels: [CHANNEL_NAME]
});

client.connect().catch(console.error);
client.on("message", (channel, tags, message, self) => {
  if (self) return;

  var msg = message.toLowerCase();

  //Command names not to interfere with current TSCv1
  if (msg === "!qq") {
    client.say(channel, `${queue}`);
  }
  if (msg === "!jq") {
    joinQueue(channel, tags, message);
  }
  if (msg === "!lq") {
    leaveQueue(channel, tags, message);
  }
  if (queue[0] === tags.username) {
    if (currentTurn == false) {
      userTurnTimer = setInterval(() => userTurnTime(channel, tags, message), 1000);
      currentTurn = true;
    }
    doCubeMoves(channel, tags, message);
  }
  //Debug
  // doCubeMoves(channel, tags, message);
  console.log(queue);
});

function userTurnTime(channel, tags, message) {
  if (turnTime > 0) {
    userLabel.innerHTML = pad(queue[0] + "\'s turn ") + pad(parseInt(turnTime / 60)) + ":" + pad(turnTime % 60); //Error? but works
    --turnTime;
  }
  else {
    turnTime = 60;
    currentTurn = false;
    userLabel.innerHTML = "";
    client.say(channel, `@${queue.shift()}, time is up, you may !joinq again`);
    if (queue.length > 0) {
      client.say(channel, `@${queue[0]}, it\'s your turn! Do !leaveQ when done`);
    }
    else {
      clearInterval(userTurnTimer);
    }
  }
}

function joinQueue(channel, tags, message) {
  if (turns === true) {
    if (queue.length === 0) {
      queue.push(tags.username);
      client.say(channel, `@${tags.username}, it\'s your turn! Do !leaveQ when done`);
    }
    else if (queue[0] === tags.username) {
      client.say(channel, `@${tags.username}, it\'s currently your turn!`);
    }
    else if (queue.find(name => name === tags.username) == undefined) {
      queue.push(tags.username);
      client.say(channel, `@${tags.username}, you have joined the queue! There is ${queue.length - 1} person in front of you`);
    }
    else if (queue.find(name => name === tags.username) == tags.username) {
      client.say(channel, `@${tags.username}, you\'re already in the queue please wait :)`);
    }
  }
  else {
    client.say(channel, "The cube is currently in Vote mode no need to !joinq just type a move in chat");
  }
}

function leaveQueue(channel, tags, message) {
  if (turns === true) {
    if (queue.find(name => name === tags.username) === tags.username) {
      if (queue[0] === tags.username) {
        removeCurrentPlayer(channel, tags, message);
      }
      else {
        queue.splice(queue.indexOf(tags.username), 1)
      }
      client.say(channel, `@${tags.username}, you have now left the queue`);
    }
    else {
      client.say(channel, `@${tags.username}, you are not in the queue. Type !joinQ to join`);
    }
  }
  else {
    client.say(channel, "The cube is currently in Vote mode no need to !leaveq just type a move in chat");
  }
}

function removeCurrentPlayer(channel, tags, message) {
  turnTime = 60;
  currentTurn = false;
  userLabel.innerHTML = "";
  clearInterval(userTurnTimer);
  queue.shift();
  if (queue.length > 0) {
    client.say(channel, `@${queue[0]}, it\'s your turn! Do !leaveQ when done`);
  }
  else {
    clearInterval(userTurnTimer);
  }
}

function doCubeMoves(channel, tags, message) {
  if (message === "scramble") {
    newScramble();
  }
  if (message === "!none") {
    player.backView = "none";
  }
  if (message === "!top-right") {
    player.backView = "top-right";
  }
  if (message === "!side-by-side") {
    player.backView = "side-by-side";
  }

  const newMove = new Move(moves333.find(elem => elem === message));
  player.experimentalAddMove(newMove);
  kpuzzle.applyMove(newMove);

  ++totalMoves;
  movesLabel.innerHTML = pad(totalMoves);

  var isSolved = experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true });
  console.log("Is cube solved? " + isSolved);
  if (isSolved) {
    clearInterval(timeSinceSolvedTimer);
    newScramble();
  }

  //This would be better but gets stuck in a loop once an error catches
  // This error gets thrown from kpuzzple.ts 
  //  "throw new Error("Unknown move: " + move.toString());"
  // try{
  //   player.experimentalAddMove(new Move(String(message)));
  // }
  // catch(Error){
  //   console.log("Invalid Move or Not a Move");
  // }
  //This would be better because with other puzzles we don't need to know the moves
}

newScramble();
