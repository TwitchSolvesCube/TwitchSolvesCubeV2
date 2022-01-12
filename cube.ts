import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp } from "./tokens.json";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';

import { TwistyPlayer, ExperimentalStickering } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg"
import { randomScrambleForEvent } from "cubing/scramble"
import { experimentalCube3x3x3KPuzzle } from "cubing/puzzles"
import { experimentalIs3x3x3Solved, KPuzzle } from "cubing/kpuzzle"
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

// Top right timer
var timeSinceSolved = 0;
var timeLabel = document.getElementById("timeSinceSolved");

// Top right moves counter
var totalMoves = 0;
var movesLabel = document.getElementById("moveCount");
movesLabel.innerHTML = pad(totalMoves);

// Bottom center user turn
var turnTime;
var currentTurn = false;
var userLabel = document.getElementById("userTurn");
let afkCountdown;

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
    "z", "z'", "z2"];

const snMoves333 =
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

const scrambleMoves333 =
  ["R", "R'", "R2",
    "L", "L'", "L2",
    "U", "U'", "U2",
    "D", "D'", "D2",
    "B", "B'", "B2",
    "F", "F'", "F2"]

var scramArray: Array<string>;
var isSolved = false;

const queue = new Array();
var turns = true;
var speedNotation = false;

const kpuzzle = new KPuzzle(experimentalCube3x3x3KPuzzle);
var player;

// Updates top right timer
function timeSS() {
  timeLabel.innerHTML = pad(parseInt((timeSinceSolved / 60).toString())) + ":" + pad(timeSinceSolved % 60);
  ++timeSinceSolved;
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
  console.log(scramble);
  
  if (scramble.toString() === '') {
    scramble = (await randomScrambleForEvent(eventID)).toString();
    scramArray = scramble.split(' ');
  } else {
    //Convert input to Array of moves without the empty string as 1st element
    scramArray = scramble.split(' ').splice(1);
  }

  if (scramArray.every(move => scrambleMoves333.includes(move))) {
    // "Animates" scramble, replaced once AddAlg is supported
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
    }, 100);
    kpuzzle.reset();
    kpuzzle.applyAlg(new Alg(scramble))

    totalMoves = 0;
    movesLabel.innerHTML = pad(totalMoves);
    return;
  }
}

const authProvider = new RefreshingAuthProvider(
  {
    clientId,
    clientSecret
  },
  {
    accessToken,
    refreshToken,
    scope,
    expiresIn,
    obtainmentTimestamp
  }
);

const apiClient = new ApiClient({ authProvider });
const chatClient = new ChatClient({ authProvider, channels: ['twitchsolvescube'] });

chatClient.connect().catch(console.error);
chatClient.onMessage((channel, user, message, tags) => {
  var msg = message.toLowerCase();

  // Command names not to interfere with current TSCv1

  if (msg === "!qq") {
    if (queue.length > 0) {
      chatClient.say(channel, `${queue}`);
    }
    else {
      chatClient.say(channel, `There's currently no one in the queue, do !joinq`);
    }
  }
  if (msg.includes("!jq")) {
    /* if (msg.slice(msg.length - 8, msg.length) === "scramble" && msg.length < 16){
      newScramble();
    } */
    if (msg === "!jq") {
      joinQueue(channel, user);
    }
  }
  if (msg === "!lq") {
    leaveQueue(channel, user);
  }
  if (msg.includes('!rm') && tags.userInfo.isMod) {
    var userToRemove = message.split(' ').pop().split('@').pop(); //this seems like it should break, but doesn't! Keep an eye on this

    if (queue.find(name => name === userToRemove) === userToRemove) {
      if (queue[0] === userToRemove) {
        chatClient.say(channel, `@${queue[0]} has been removed from the queue.`)
        removeCurrentPlayer(channel);
      }
      else {
        chatClient.say(channel, `@${userToRemove} has been removed from the queue.`);
        queue.splice(queue.indexOf(userToRemove), 1)
      }
      clearInterval(afkCountdown);
    } else {
      chatClient.say(channel, `@${user} this user is not in the queue.`);
    }
  }


  if (queue[0] === user) {
    if (currentTurn === false) {
      userTurnTimer = setInterval(() => userTurnTime(channel), 1000);
      currentTurn = true;
    }
    doCubeMoves(channel, message, tags);
  }

  // Debug
  // doCubeMoves(channel, tags, message);
  // console.log(queue);
});

// Updates bottom center user label
function userTurnTime(channel: string) {
  if (turnTime >= 0) {
    userLabel.innerHTML = pad(queue[0] + "\'s turn ") + pad(parseInt((turnTime / 60).toString())) + ":" + pad(turnTime % 60);
    --turnTime;
  }
  else {
    clearInterval(afkCountdown);
    speedNotation = false;
    removeCurrentPlayer(channel, true);
  }
}

function kickAFK(channel: string) {
  var afkTimer = 120;
  clearInterval(afkCountdown);
  afkCountdown = setInterval(() => {
    afkTimer--;
    //console.log(afkTimer);
    if (afkTimer === 0) {
      chatClient.say(channel, `@${queue[0]}, you have been kicked after not making any moves for 2 minutes!`);
      clearInterval(afkCountdown);
      removeCurrentPlayer(channel);
    }
  }, 1000)
}

function joinQueue(channel: string, user: string) {
  if (turns === true) {
    if (queue.length === 0) {
      queue.push(user);
      if (isFollowing(user)) {
        turnTime = 480;
      }
      else {
        turnTime = 300;
      }
      chatClient.say(channel, `@${user}, it\'s your turn! Do !leaveQ when done`);
      kickAFK(channel);
    }
    else if (queue[0] === user) {
      chatClient.say(channel, `@${user}, it\'s currently your turn!`);
    }
    else if (queue.find(name => name === user) === undefined) {
      queue.push(user);
      if (queue.length > 2) {
        chatClient.say(channel, `@${user}, you have joined the queue! There are ${queue.length - 1} users in front of you`)
      } else {
        chatClient.say(channel, `@${user}, you have joined the queue! There is ${queue.length - 1} user in front of you`);
      }
    }
    else if (queue.find(name => name === user) === user) {
      chatClient.say(channel, `@${user}, you\'re already in the queue please wait :)`);
    }
  }
  else {
    chatClient.say(channel, "The cube is currently in Vote mode no need to !joinq just type a move in chat");
  }
}

function leaveQueue(channel: string, user: string) {
  if (turns === true) {
    if (queue.find(name => name === user) === user) {
      if (queue[0] === user) {
        removeCurrentPlayer(channel, false);
      }
      else {
        queue.splice(queue.indexOf(user), 1)
      }
      clearInterval(afkCountdown);
      chatClient.say(channel, `@${user}, you have now left the queue`);
    }
    else {
      chatClient.say(channel, `@${user}, you are not in the queue. Type !joinQ to join`);
    }
  }
  else {
    chatClient.say(channel, "The cube is currently in Vote mode no need to !leaveq just type a move in chat");
  }
}

function removeCurrentPlayer(channel: string, timeup = false) {
  // Reset turnTime, clear label, stop user timer, remove player
  turnTime = 300;
  currentTurn = false;
  userLabel.innerHTML = "";
  speedNotation = false;

  if (timeup) {
    chatClient.say(channel, `@${queue.shift()}, time is up, you may !joinq again`);
  }
  else {
    queue.shift();
  }

  // If someone is in queue the @ user else clear user label
  if (queue.length > 0) {
    if (isFollowing(queue[0])) {
      turnTime = 480;
    }
    else {
      turnTime = 300;
    }
    chatClient.say(channel, `@${queue[0]}, it\'s your turn! Do !leaveQ when done`);
    kickAFK(channel);
  }
  else {
    clearInterval(userTurnTimer);
  }
}

function doCubeMoves(channel, message: string, tags: TwitchPrivateMessage) {
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
    if (speedNotation) {
      speedNotation = false;
    } else {
      speedNotation = true;
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

  if (!isSolved) {
    if (!speedNotation) {
      // Ensure moves can be done
      msg = message.replace("`", "\'")
        .replace("‘", "\'").replace("’", "\'").replace("\"", "\'")
        .replace("X", "x").replace("Y", "y").replace("Z", "z")
        .replace("m", "M").replace("e", "E").replace("s", "S");

      if (moves333.find(elem => elem === msg) != undefined) {
        kickAFK(channel);
        const newMove = new Move(msg);
        player.experimentalAddMove(newMove);
        kpuzzle.applyMove(newMove);

        // Update top right moves
        ++totalMoves;
        movesLabel.innerHTML = pad(totalMoves);
      }
    } else if (speedNotation) {
      msg = message.toLowerCase();

      if (snMoves333.find(elem => elem === msg) != undefined) {
        msg = msg.replace("5", "M").replace("6", "M").replace("x", "M\'").replace("t", "x")
          .replace("y", "x").replace("b", "x\'").replace("n", "x\'").replace(";", "y")
          .replace("a", "y\'").replace("d", "L").replace("z", "d").replace("?", "d'")
          .replace("q", "z\'").replace("w", "B").replace("e", "L\'").replace("i", "R")
          .replace("o", "B\'").replace("p", "z").replace("s", "D").replace("f", "U\'")
          .replace("g", "F\'").replace("h", "F").replace("j", "U").replace("k", "R\'")
          .replace("l", "D\'").replace("v", "l").replace("r", "l'").replace("m", "r'")
          .replace("u", "r").replace(",", "u").replace("c", "u'");

        kickAFK(channel);

        const newMove = new Move(msg);
        player.experimentalAddMove(newMove);
        kpuzzle.applyMove(newMove);

        // Update top right moves
        ++totalMoves;
        movesLabel.innerHTML = pad(totalMoves);
      }
    }

    if (tags.userInfo.isSubscriber && message.length >= 3) {
      //User is subscribed and typed a message longer than 2 characters (i.e R U)
      let algArray = message.split(' ');

      if (algArray.every(move => moves333.includes(move))) {
        kickAFK(channel);
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

    isSolved = experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true });
    console.log("Is cube solved? " + isSolved);
  }
  checkSolved();
}

function checkSolved() {
  isSolved = experimentalIs3x3x3Solved(kpuzzle.state, { ignoreCenterOrientation: true });
  if (isSolved) {
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
      timeSinceSolved = 0;
      newScramble("333", "");
      isSolved = false;
    }, 15 * 1000)
  }
}

async function isFollowing(username: string) {
  //Gets UserID from UserName
  const userID = (await apiClient.users.getUserByName(username)).id;
  //console.log(userID);
  //return console.log(await apiClient.users.userFollowsBroadcaster(userID, 664794842));
}

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
