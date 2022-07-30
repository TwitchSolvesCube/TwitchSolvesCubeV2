import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp, channelName } from "./config.json";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

import * as cube from "./cube"

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

var isSub: boolean = false;
var isFollower: boolean = false;

export function isSubscriber(): boolean{
    return isSub;
}

export function say(message: string){
    chatClient.say(channelName, message);
}
  
chatClient.connect().catch(console.error);
chatClient.onMessage((channel:string, user: string, message: string, tags: TwitchPrivateMessage) => {
    var msg = message.toLowerCase();
  
    if (msg === "!queue" || msg === "!q") {
      if (cube.queue.length > 0) {
        say(`${cube.queue}`);
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
        cube.joinQueue(user);
      }
    }
    if (msg === "!leaveq" || msg === "!lq") {
        cube.leaveQueue(user);
    }
    if ((msg.includes("!remove") || msg.includes("!rm")) && tags.userInfo.isMod) {
      var userToRemove = message.split(' ').pop()!.split('@').pop()!; //Non-null assertion operator in use
  
      if (cube.queue.find(name => name === userToRemove) === userToRemove) {
        if (cube.queue[0] === userToRemove) {
          say(`@${cube.queue[0]} has been removed from the queue.`)
          cube.removeCurrentPlayer();
        }
        else {
          say(`@${userToRemove} has been removed from the queue.`);
          cube.queue.splice(cube.queue.indexOf(userToRemove!), 1);//Possible error here
        }
        cube.clearAfkCountdown();
      } else {
        say(`@${user} this user is not in the queue.`);
      }
    }
  
    if (cube.queue[0] === user) {
      if (!cube.tsc.isCurrentTurn()) {
        cube.userTurnTimeThing();
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

export async function isFollowing(username: string) {
    //Gets UserID from UserName
    const userID = (await apiClient.users.getUserByName(username))!.id;
    isFollower = await apiClient.users.userFollowsBroadcaster(userID, 664794842);
    
    //Sets user play time to 8 minutes if they're following
    if (isFollower) {
      cube.tsc.setTurnTime(481);
    }
    //Default time for players is 5 minutes
    cube.tsc.setTurnTime(301);
}
