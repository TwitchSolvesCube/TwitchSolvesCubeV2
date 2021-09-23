import tmi from "tmi.js"
import { BOT_USERNAME, TOKEN, CHANNEL_NAME } from "./config"
import { TwistyPlayer } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg";
import { randomScrambleForEvent } from "cubing/scramble";

import { experimentalIs3x3x3Solved, } from "cubing/kpuzzle";

//https://github.com/cubing/twitchsolves/blob/master/client/index.ts
//https://standards.cubing.net/kpuzzle/

//Use Sim moves when solved for animation?
//https://experiments.cubing.net/cubing.js/twisty/simultaneous.html

var timeLabel = document.getElementById("time");
var totalSeconds = 0;
var timer = setInterval(setTime, 1000);

var totalMoves = 0;
var movesLabel = document.getElementById("moves");
movesLabel.innerHTML = pad(totalMoves);

var user = "";
var userLabel = document.getElementById("user");

const moves333 = 
  [ "R", "R'", "R2", "r", "r'", "r2",
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
    "z", "z'", "y2" ]                

const player = new TwistyPlayer({ //https://experiments.cubing.net/cubing.js/twisty/twisty-player-v1.html
  puzzle: "3x3x3",
  hintFacelets: "floating",
  backView: "side-by-side",
  background: "none",
  "controlPanel": "none",
  // "experimental-camera-latitude-limits": "none" //This could be useful?
});

function setTime() {
  ++totalSeconds;
  timeLabel.innerHTML = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60); //Error? but works
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
  const scramble = await randomScrambleForEvent("333");
  player.alg = scramble;
  document.body.appendChild(player);
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
client.on('message', (channel, tags, message, self) => {
	if(self) return;

  doCubeMoves(channel, tags, message);
});

function doCubeMoves(channel, tags, message){
  player.experimentalAddMove(new Move(moves333.find(elem => elem === message)));
  ++totalMoves;

  movesLabel.innerHTML = pad(totalMoves);
  userLabel.innerHTML = pad(tags.username + "\'s turn");

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
player.backView = "none";