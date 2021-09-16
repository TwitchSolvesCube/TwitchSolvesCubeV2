import tmi from "tmi.js"
import {BOT_USERNAME, TOKEN, CHANNEL_NAME} from "./config"
import { TwistyPlayer } from "cubing/twisty"
import { Alg, AlgBuilder, Move } from "cubing/alg";
import { randomScrambleForEvent } from "cubing/scramble";

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

const player = new TwistyPlayer({
  puzzle: "3x3x3",
  hintFacelets: "floating",
  backView: "none",
  background: "none",
  "controlPanel": "none"
});

async function newScramble() {
  player.alg = "";
  const scramble = await randomScrambleForEvent("333");
  console.log(scramble.toString());
  player.alg = scramble;
  document.body.appendChild(player);
}

newScramble();
player.backView = "side-by-side";


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
}
