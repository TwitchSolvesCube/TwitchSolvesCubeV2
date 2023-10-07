// import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp, channelName, channelId } from "./config.json";
// import { RefreshingAuthProvider } from "@twurple/auth";
// import { ChatClient } from '@twurple/chat';
// import { ApiClient } from '@twurple/api';
// import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

//const cube = require("./cube");

// Date
// let currentDate = new Date();

// server.js

const WebSocket = require('ws');
const { RefreshingAuthProvider } = require('@twurple/auth');
const { Bot, createBotCommand } = require('@twurple/easy-bot');
const fs = require('fs').promises;

const wss = new WebSocket.Server({ port: 8080 });
let wsConnection;

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial data or perform actions here
  ws.on('open', () => {
    console.log('WebSocket connection is open.');
  });

  // Send a message to the connected client
  ws.send('Welcome to the WebSocket server!');

  wsConnection = ws;

  // Handle messages from clients
  ws.on('message', (message) => {
    console.log(`Received from client: ${message}`);
    
    // Handle client messages here if needed
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const clientId = '';
const clientSecret = '';
async function main() {
  try {
    const tokenData = JSON.parse(await fs.readFile('./tokens.668628308.json', 'utf-8'));

    const authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret
    });

    authProvider.onRefresh(async (userId, newTokenData) => {
      await fs.writeFile(`./tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8');
    });

    await authProvider.addUserForToken(tokenData, ['chat']);

    const bot = new Bot({
      authProvider,
      channels: ['twitchsolvesbot'],
      commands: [
        createBotCommand('dice', (params, { userName, reply }) => {
          const diceRoll = Math.floor(Math.random() * 6) + 1;
          const message = `You rolled a ${diceRoll}`;
          reply(message);
          //cube.tsc.joinQueue(userName);
          wsConnection.send(message);
          console.log(message);
        }),
        createBotCommand('slap', (params, { userName, say }) => {
          const message = `${userName} slaps ${params.join(' ')} around a bit with a large trout`;
          say(message);
		  
		    //if (wsConnection) {
				wsConnection.send(message);
				console.log(message);
			//}
			
        }),
      ]
    });
	} catch (error) {
	console.error('Error:', error);
	}
}

// Call the async function to start your bot
main();

// let isSub: boolean = false;
// let isFollower: boolean = false;

// export function isSubscriber(): boolean {
//     return isSub;
// }

// export function say(message: string): void {
//     chatClient.say(channelName, message);
// }

// chatClient.connect().catch(console.error);
// chatClient.onMessage(async (channel: string, user: string, message: string, tags: TwitchPrivateMessage) => {
//     const msg = message.toLowerCase();
//     const queue = cube.tsc.getQueue();
//     let currentUser = cube.tsc.getCurrentUser();
//     const isMod = tags.userInfo.isMod;
//     let isSub = tags.userInfo.isSubscriber;

//     if (msg === "!queue" || msg === "!q") {
//         if (queue.length > 0) {
//             say(`${queue}`);
//         } else {
//             say(`There's currently no one in the queue, do !joinq`);
//         }
//     } else if (msg.startsWith("!joinq") || msg.startsWith("!jq")) {
//         //if (msg.endsWith("scramble") && msg.length < 16) {
//             // cube.tsc.newScramble();
//         //}
//         // if (msg === "!joinq" || msg === "!jq") {
//         cube.tsc.joinQueue(user);
//         //}
//     } else if (msg === "!leaveq" || msg === "!lq") {
//         cube.tsc.removePlayer(user);
//     } else if ((msg.startsWith("!remove") || msg.startsWith("!rm")) && isMod) {
//         const userToRemove = message.split(' ').pop()?.split('@').pop()!; //Non-null assertion operator in use
//         if (queue.includes(userToRemove)) {
//             if (currentUser === userToRemove) {
//                 say(`@${currentUser} has been removed from the queue.`);
//                 cube.tsc.removePlayer(currentUser);
//             } else {
//                 say(`@${userToRemove} has been removed from the queue.`);
//                 queue.splice(queue.indexOf(userToRemove!), 1); //Possible error here
//                 //cube.tsc.leaveQueue(userToRemove);
//             }
//             //cube.tsc.clearAfkCountdown();
//         } else {
//             say(`@${user} this user is not in the queue.`);
//         }
//     }

//     currentUser = cube.tsc.getCurrentUser();
//     //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + currentUser);
//     if (currentUser === user) { //If the message sent by the user is the currentUser do cube moves 
//             cube.tsc.userTurnTime();
//         if (cube.tsc.isCubeEnabled()) {
//             cube.doCubeMoves(message);
//             //cube.tsc.scheduleUserRemoval(currentUser, 30, true);
//         }
//     }

//     // Debug
//     // cube.doCubeMoves(message);
//     // console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + queue);
// });

// export async function isFollowing(username: string): Promise<void> {
//     //Gets UserID from UserName
//     //const userID = (await apiClient.users.getUserByName(username))!.id;
//     //isFollower = await apiClient.users.userFollowsBroadcaster(userID, channelId);
//     //Sets user play time to 8 minutes if they're following, default time for players is 5 minutes
//     //Added one second to visually see "correct" time
//     cube.tsc.setTurnTime(isFollower ? 481 : 301);
// }

// function getCurrentDate() {
//     return new Date();
// }
