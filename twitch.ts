
// const cube = require("./cube.ts");

// Date
// let currentDate = new Date();

//const { WebSocket } = require('ws');
// const { RefreshingAuthProvider } = require('@twurple/auth');
// const { ApiClient } = require('@twurple/api');
// const { ChatClient } = require('@twurple/chat');
// const fs = require('fs').promises;
//import { WebSocketServer } from "ws";
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { ChatClient } from '@twurple/chat';
import * as fs from 'fs/promises';
import * as cube from "./cube";

//const wss = new WebSocketServer({ port: 8080 });

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

    const apiClient = new ApiClient({ authProvider });
    const chatClient = new ChatClient({ authProvider, channels: ['twitchsolvesbot'] });
    chatClient.connect();

    chatClient.onMessage(async (channel, user, message, tags) => {
      console.log(channel);
      console.log(user);
      console.log(message);
      console.log(tags);

      const msg = message.toLowerCase();
      const queue = cube.tsc.getQueue();
      // let currentUser = cube.tsc.getCurrentUser();
      const isMod = tags.userInfo.isMod;
      let isSub = tags.userInfo.isSubscriber;

      // if (msg === "!queue" || msg === "!q") {
      //     if (queue.length > 0) {
      //         chatClient.say(channel,`${queue}`);
      //     } else {
      //         chatClient.say(channel,`There's currently no one in the queue, do !joinq`);
      //     }
      // }
      // } else if (msg.startsWith("!joinq") || msg.startsWith("!jq")) {
      //     //if (msg.endsWith("scramble") && msg.length < 16) {
      //         // cube.tsc.newScramble();
      //     //}
      //     // if (msg === "!joinq" || msg === "!jq") {
      //     cube.tsc.joinQueue(user);
      //     //}
      // } else if (msg === "!leaveq" || msg === "!lq") {
      //     cube.tsc.removePlayer(user);
      // } else if ((msg.startsWith("!remove") || msg.startsWith("!rm")) && isMod) {
      //     const userToRemove = message.split(' ').pop()?.split('@').pop(); //Non-null assertion operator in use
      //     if (queue.includes(userToRemove)) {
      //         if (currentUser === userToRemove) {
      //             chatClient.say(`@${currentUser} has been removed from the queue.`);
      //             cube.tsc.removePlayer(currentUser);
      //         } else {
      //             chatClient.say(`@${userToRemove} has been removed from the queue.`);
      //             queue.splice(queue.indexOf(userToRemove), 1); //Possible error here
      //             //cube.tsc.leaveQueue(userToRemove);
      //         }
      //         //cube.tsc.clearAfkCountdown();
      //     } else {
      //         chatClient.say(`@${user} this user is not in the queue.`);
      //     }
      // }

      // currentUser = cube.tsc.getCurrentUser();
      // //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + currentUser);
      // if (currentUser === user) { //If the message sent by the user is the currentUser do cube moves 
      //         cube.tsc.userTurnTime();
      //     if (cube.tsc.isCubeEnabled()) {
      //         cube.doCubeMoves(message);
      //         //cube.tsc.scheduleUserRemoval(currentUser, 30, true);
      //     }
      // }

      // Debug
      // cube.doCubeMoves(message);
      // console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + queue);
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
