import tmi from "tmi.js"
import { BOT_USERNAME, TOKEN, CHANNEL_NAME } from "./config"
import { TwistyPlayer } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg"
import { randomScrambleForEvent } from "cubing/scramble"
import { experimentalCube3x3x3KPuzzle } from "cubing/puzzles"
import { experimentalIs3x3x3Solved, KPuzzle } from "cubing/kpuzzle"

// Top right timer
var timeSinceSolved = 0;
var timeLabel = document.getElementById("timeSinceSolved");

// Top right moves counter
var totalMoves = 0;
var movesLabel = document.getElementById("moveCount");
movesLabel.innerHTML = pad(totalMoves);

// Bottom center user turn
var turnTime = 300;
var currentTurn = false;
var userLabel = document.getElementById("userTurn");

// Timers
let timeSinceSolvedTimer;
let userTurnTimer;

// Array of all supported moves
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

var scramble;
var isSolved = false;

const queue = new Array();
var turns = true;

const kpuzzle = new KPuzzle(experimentalCube3x3x3KPuzzle);
var player;

// Updates top right timer
function timeSS() {
  timeLabel.innerHTML = pad(parseInt(timeSinceSolved / 60)) + ":" + pad(timeSinceSolved % 60); //Error? but works
  ++timeSinceSolved;
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

async function newScramble() {
  // Starts new player, replaces old one
  player = document.body.appendChild(new TwistyPlayer({
    puzzle: "3x3x3",
    hintFacelets: "floating",
    backView: "top-right",
    background: "none",
    "controlPanel": "none",
  }));

  scramble = await randomScrambleForEvent("333");
  // Turn scramble string into an array
  const scramArray = scramble.toString().split(' ');
  console.log(scramArray);

  // "Animates" scramble
  var i = -1;
  var intervalID = setInterval(function () {
    ++i;
    if (i >= scramArray.length - 1) {
      clearInterval(intervalID);
      clearInterval(timeSinceSolvedTimer);
      timeSinceSolved = 0;
      timeSinceSolvedTimer = setInterval(timeSS, 1000);
    }
    const newMove = new Move(scramArray[i]);
    player.experimentalAddMove(newMove);
    kpuzzle.applyMove(newMove);
    console.log(scramArray[i]);
  }, 100);

  totalMoves = 0;
  movesLabel.innerHTML = pad(totalMoves);

  // Debug
  // const newMove = new Move(scramArray[0]);
  // player.experimentalAddMove(newMove);
  // kpuzzle.applyMove(newMove);
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

  // Command names not to interfere with current TSCv1
  if (msg === "!qq") {
    if (queue.length > 0) {
      client.say(channel, `${queue}`);
    }
    else {
      client.say(channel, `There's currently no one in the queue, do !joinq`);
    }
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

  // Debug
  // doCubeMoves(channel, tags, message);
  // console.log(queue);
});

// Updates bottom center user label
function userTurnTime(channel, tags, message) {
  if (turnTime >= 0) {
    userLabel.innerHTML = pad(queue[0] + "\'s turn ") + pad(parseInt(turnTime / 60)) + ":" + pad(turnTime % 60); //Error? but works
    --turnTime;
  }
  else {
    removeCurrentPlayer(channel, tags, message, true);
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

function removeCurrentPlayer(channel, tags, message, timeup = false) {
  // Reset turnTime, clear label, stop user timer, remove player
  turnTime = 300;
  currentTurn = false;
  userLabel.innerHTML = "";

  if (timeup) {
    client.say(channel, `@${queue.shift()}, time is up, you may !joinq again`);
  }
  else {
    queue.shift();
  }

  // If someone is in queue the @ user else clear user label
  if (queue.length > 0) {
    client.say(channel, `@${queue[0]}, it\'s your turn! Do !leaveQ when done`);
  }
  else {
    clearInterval(userTurnTimer);
  }
}

function doCubeMoves(channel, tags, message) {
  // Player commands/settings
  var msg = message.toLowerCase();
  if (msg === "scramble") {
    newScramble();
  }
  if (msg === "!none") {
    player.backView = "none";
  }
  if (msg === "!top-right") {
    player.backView = "top-right";
  }
  if (msg === "!side-by-side") {
    player.backView = "side-by-side";
  }

  if (!isSolved) {
    msg = message.replace("`", "\'").replace("‘", "\'").replace("’", "\'").replace("\"", "\'")
      .replace("X", "x").replace("Y", "y").replace("Z", "z")
      .replace("m", "M").replace("e", "E").replace("s", "S");

    //Apply moves to player and kpuzzle
    if (moves333.find(elem => elem === msg) != undefined) {
      const newMove = new Move(moves333.find(elem => elem === msg));
      player.experimentalAddMove(newMove);
      kpuzzle.applyMove(newMove);

      // Update top right moves
      ++totalMoves;
      movesLabel.innerHTML = pad(totalMoves);
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

    isSolved = experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true });
    console.log("Is cube solved? " + isSolved);
  }
  if (isSolved) {
    // Do a little spin
    setTimeout(function () { player.backView = "none" }, 1000)
    spinCamera({ numSpins: 4, durationMs: 6000 });

    // Pause for 15 seconds to view Solved State
    setTimeout(function () {
      // Reconstruction of Solve
      // player.experimentalModel.twizzleLink().then(
      //   function (value) {
      //     console.log(value)
      //     client.say(channel, `Here's the complete reconstruction of the solve! ${value}`);
      //   },
      //   function (error) { }
      // );

      // Reset
      timeSinceSolved = 0;
      newScramble();
      isSolved = false;
    }, 15 * 1000)
  }
}

export function smootherStep(x: number): number {
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
newScramble();
