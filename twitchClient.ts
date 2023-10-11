import * as cube from "./cube";
const ws = new WebSocket('ws://localhost:8080');

// Event handler for when the connection is established
ws.addEventListener('open', (event) => {
  console.log('WebSocket connection opened:', event);
  //ws.send('Hello, Server!');
});

// Event handler for when a message is received from the server
ws.addEventListener('message', (event) => {
  try {
    const jsonData = JSON.parse(event.data);

    const user = jsonData.user;
    const move = jsonData.message;
    const message = jsonData.message.toLowerCase();

    const isMod = jsonData.isMod;
    const isSub = jsonData.isSub;

    const queue = cube.tsc.getQueue();
    let currentUser = cube.tsc.getCurrentUser();

    if (message === "!queue" || message === "!q") {
      if (queue.length > 0) {
          send(`${queue}`);
      } else {
          send("There's currently no one in the queue, do !joinq");
      }
    } else if (message.startsWith("!joinq") || message.startsWith("!jq")) {
        cube.tsc.joinQueue(user);
    } else if (message === "!leaveq" || message === "!lq") {
        cube.tsc.removePlayer(user);
    } else if (message.startsWith("!remove") || message.startsWith("!rm")) {
        const userToRemove = message!.split(' ').pop()?.split('@').pop()!;
        if (queue.includes(userToRemove)) {
            if (currentUser === userToRemove) { //Check: Duplicate sends?
                send(`@${currentUser} has been removed from the queue.`);
                cube.tsc.removePlayer(currentUser);
            } else {
                send(`@${userToRemove} has been removed from the queue.`);
                queue.splice(queue.indexOf(userToRemove!), 1);
            }
        } else {
            send(`@${user} this user is not in the queue.`);
        }
    }
    
    currentUser = cube.tsc.getCurrentUser();
    //console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + currentUser);
    if (currentUser === user) { //If the message sent by the user is the currentUser do cube moves 
            cube.tsc.userTurnTime();
        if (cube.tsc.isCubeEnabled()) {
            cube.doCubeMoves(move);
            //cube.tsc.scheduleUserRemoval(30);
        }
    }

    // timeStampLog('User: ' + user);
    // timeStampLog('Message: ' + message);
    // timeStampLog('isMod: ' + isMod);
    // timeStampLog('isSub: ' + isSub);

    // Debug
    // cube.doCubeMoves(message);
    // console.log('[' + getCurrentDate().toLocaleTimeString() + '] ' + queue);
  } catch (error) {
    console.log('Received non-JSON data:', event.data);
  }
});

// Event handler for when the connection is closed
ws.addEventListener('close', (event) => {
  console.log('WebSocket connection closed:', event);
});

// Event handler for any errors that occur
ws.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});

export function send(message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    timeStampLog(message);
    ws.send(JSON.stringify({ "type": "twitchChatMsg", "message": message }));
  } else {
    console.error('WebSocket is not open. Message not sent:', message);
  }
}

function timeStampLog(message) {
  const currentDate = new Date();
  const formattedDate = '[' + currentDate.toLocaleTimeString() + '] ';
  const timestampedMessage = formattedDate + message;
  console.log(timestampedMessage);
}
