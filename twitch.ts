import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp, channelName, channelId } from "./config.json";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

import * as cube from "./cube";

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
const chatClient = new ChatClient({ authProvider, channels: [ channelName ] });

let isSub: boolean = false;
let isFollower: boolean = false;

export function isSubscriber(): boolean{
    return isSub;
}

export function say(message: string): void{
    chatClient.say(channelName, message);
}
  
chatClient.connect().catch(console.error);
chatClient.onMessage((channel:string, user: string, message: string, tags: TwitchPrivateMessage) => {
    var msg = message.toLowerCase();

    if (msg === "test"){
      cube.tsc.joinQueue("twitchsolvesbot");
    }
  
    if (msg === "!queue" || msg === "!q") {
      if (cube.tsc.getQLength() > 0) {
        say(`${cube.tsc.getQueue()}`);
      }
      else {
        say(`There's currently no one in the queue, do !joinq`);
      }
    }
    if (msg.includes("!joinq") || msg.includes("!jq")) {
      //Code for !joinq (scramble)
      /* if (msg.slice(msg.length - 8, msg.length) === "scramble" && msg.length < 16){
        newScramble();
      } */
      if (msg === "!joinq" || msg === "!jq") {
        cube.tsc.joinQueue(user);
      }
    }
    if (msg === "!leaveq" || msg === "!lq") {
        cube.tsc.leaveQueue(user);
    }
    if ((msg.includes("!remove") || msg.includes("!rm")) && tags.userInfo.isMod) {
      var userToRemove = message.split(' ').pop()!.split('@').pop()!; //Non-null assertion operator in use
  
      if (cube.tsc.getQueue().find(name => name === userToRemove) === userToRemove) {
        if (cube.tsc.getCurrentUser() === userToRemove) {
          say(`@${cube.tsc.getCurrentUser()} has been removed from the queue.`)
          cube.tsc.removeCurrentPlayer();
        }
        else {
          say(`@${userToRemove} has been removed from the queue.`);
          cube.tsc.getQueue().splice(cube.tsc.getQueue().indexOf(userToRemove!), 1);//Possible error here
        }
        cube.tsc.clearAfkCountdown();
      } else {
        say(`@${user} this user is not in the queue.`);
      }
    }
  
    if (cube.tsc.getCurrentUser() === user) {
      if (!cube.tsc.isCurrentTurn()) { //No idea what this does
        cube.tsc.userTurnTime();
        cube.tsc.setCurrentTurn(true);
      }
      isSub = tags.userInfo.isSubscriber;
      if (cube.tsc.isCubeEnabled()){
        cube.doCubeMoves(message);
      }
    }
  
    // Debug
    // doCubeMoves(channel, tags, message);
    // console.log(queue);
});

export async function isFollowing(username: string): Promise <void> {
  //Gets UserID from UserName
  const userID = (await apiClient.users.getUserByName(username))!.id;
  isFollower = await apiClient.users.userFollowsBroadcaster(userID, channelId);
  //Sets user play time to 8 minutes if they're following, default time for players is 5 minutes
  //Added one second to visually see "correct" time
  cube.tsc.setTurnTime(isFollower ? 481 : 301);
}
