import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp } from "./tokens.json";
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
const chatClient = new ChatClient({ authProvider, channels: ["twitchsolvesbot"] });

var isSub = false;

export function isSubscriber(){
    return this.isSub;
}

export function say(message: string){
    chatClient.say("twitchsolvesbot", message);
}
  
chatClient.connect().catch(console.error);
chatClient.onMessage((channel, user, message, tags) => {
    var msg = message.toLowerCase();
    
    // Command names not to interfere with current TSCv1
  
    if (msg === "!qq") {
      if (cube.queue.length > 0) {
        say(`${cube.queue}`);
      }
      else {
        say(`There's currently no one in the queue, do !joinq`);
      }
    }
    if (msg.includes("!jq")) {
      /* if (msg.slice(msg.length - 8, msg.length) === "scramble" && msg.length < 16){
        newScramble();
      } */
      if (msg === "!jq") {
        cube.joinQueue(user);
      }
    }
    if (msg === "!lq") {
        cube.leaveQueue(user);
    }
    if (msg.includes('!rm') && tags.userInfo.isMod) {
      var userToRemove = message.split(' ').pop().split('@').pop(); //this seems like it should break, but doesn't! Keep an eye on this
  
      if (cube.queue.find(name => name === userToRemove) === userToRemove) {
        if (cube.queue[0] === userToRemove) {
          say(`@${cube.queue[0]} has been removed from the queue.`)
          cube.removeCurrentPlayer();
        }
        else {
          say(`@${userToRemove} has been removed from the queue.`);
          cube.queue.splice(cube.queue.indexOf(userToRemove), 1);//Possible error here
        }
        cube.clearAfkCountdown();
      } else {
        say(`@${user} this user is not in the queue.`);
      }
    }
  
    if (cube.queue[0] === user) {
      if (!cube.tsc.currentTurnState()) {
        cube.userTurnTimeThing();
        cube.tsc.setCurrentTurn(true);
      }
      isSub = tags.userInfo.isSubscriber;
      cube.doCubeMoves(message);
    }
  
    // Debug
    // doCubeMoves(channel, tags, message);
    // console.log(queue);
});

export async function isFollowing(username: string) {
    //Gets UserID from UserName
    const userID = (await apiClient.users.getUserByName(username)).id;
    //console.log(userID);
    //return console.log(await apiClient.users.userFollowsBroadcaster(userID, 664794842));
}