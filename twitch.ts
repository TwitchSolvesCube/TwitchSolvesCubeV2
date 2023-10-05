import { clientId, clientSecret, accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp, channelName, channelId } from "./config.json";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

import * as cube from "./cube";

// Date
let currentDate = new Date();

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
const chatClient = new ChatClient({ authProvider, channels: [channelName] });

let isSub: boolean = false;
let isFollower: boolean = false;

export function isSubscriber(): boolean {
    return isSub;
}

function say(message: string): void {
    chatClient.say(channelName, message);
}

chatClient.connect().catch(console.error);
chatClient.onMessage(async (channel: string, user: string, message: string, tags: TwitchPrivateMessage) => {
    const msg = message.toLowerCase();
    const queue = cube.tsc.getQueue();
    let currentUser = cube.tsc.getCurrentUser();
    const isMod = tags.userInfo.isMod;
    let isSub = tags.userInfo.isSubscriber;

    if (msg === "!queue" || msg === "!q") {
        if (queue.length > 0) {
            say(`${queue}`);
        } else {
            say(`There's currently no one in the queue, do !joinq`);
        }
    } else if (msg.startsWith("!joinq") || msg.startsWith("!jq")) {
        //if (msg.endsWith("scramble") && msg.length < 16) {
            // cube.tsc.newScramble();
        //}
        // if (msg === "!joinq" || msg === "!jq") {
        say(await cube.tsc.joinQueue(user));
        //}
    } else if (msg === "!leaveq" || msg === "!lq") {
        say(await cube.tsc.removePlayer(user));
    } else if ((msg.startsWith("!remove") || msg.startsWith("!rm")) && isMod) {
        const userToRemove = message.split(' ').pop()?.split('@').pop()!; //Non-null assertion operator in use
        if (queue.includes(userToRemove)) {
            if (currentUser === userToRemove) {
                say(`@${currentUser} has been removed from the queue.`);
                say(await cube.tsc.removePlayer(currentUser));
            } else {
                say(`@${userToRemove} has been removed from the queue.`);
                queue.splice(queue.indexOf(userToRemove!), 1); //Possible error here
                //cube.tsc.leaveQueue(userToRemove);
            }
            //cube.tsc.clearAfkCountdown();
        } else {
            say(`@${user} this user is not in the queue.`);
        }
    }

    currentUser = cube.tsc.getCurrentUser();
    //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + currentUser);
    if (currentUser === user) { //If the message sent by the user is the currentUser do cube moves 
            say(await cube.tsc.userTurnTime());
        if (cube.tsc.isCubeEnabled()) {
            say(await cube.doCubeMoves(message));
            //cube.tsc.scheduleUserRemoval(currentUser, 30, true);
        }
    }

    // Debug
    // cube.doCubeMoves(message);
    // console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + queue);
});

export async function isFollowing(username: string): Promise<void> {
    //Gets UserID from UserName
    //const userID = (await apiClient.users.getUserByName(username))!.id;
    //isFollower = await apiClient.users.userFollowsBroadcaster(userID, channelId);
    //Sets user play time to 8 minutes if they're following, default time for players is 5 minutes
    //Added one second to visually see "correct" time
    cube.tsc.setTurnTime(isFollower ? 481 : 301);
}

function getCurrentDate() {
    return new Date();
}
