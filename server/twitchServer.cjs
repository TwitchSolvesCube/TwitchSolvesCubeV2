const WebSocket = require('ws');
const fs = require('fs').promises;

const { RefreshingAuthProvider } = require('@twurple/auth');
const { ApiClient  } = require('@twurple/api');
const { ChatClient  } = require('@twurple/chat');

const confInfo = require('./config.json');

const clientId = confInfo.clientId;
const clientSecret = confInfo.clientSecret;
const channelName = confInfo.channelName;
const channelID = confInfo.channelID;
const serverPort = confInfo.serverPort;

let chatClient = new ChatClient();

const wss = new WebSocket.Server({ port: serverPort });
let activeConnection = null; 

wss.on('connection', (ws) => {
  if (activeConnection) {
    ws.close(1008, 'Only one client allowed at a time');
    timeStampLog('Rejected duplicate client');
    return;
  }

  activeConnection = ws;
  timeStampLog('Client connected');

  // Send a message to the connected client
  ws.send('Welcome to the WebSocket server!');

  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const jsonData = JSON.parse(message);
      timeStampLog(jsonData.message);
      chatClient.say(channelName, jsonData.message);
    } catch (error) {
      timeStampLog('Received non-JSON data:' + message);
    }

    // Handle client messages here if needed
  });

  // Handle disconnection
  ws.on('close', () => {
    activeConnection = null;
    timeStampLog('Client disconnected');
  });

  ws.on('error', (err) => {
    activeConnection = null;
    timeStampLog(`WebSocket error: ${err}`);
  });
});

async function main() {
  timeStampLog(`Server running on port ${serverPort}`);
  try {
    const tokenData = JSON.parse(await fs.readFile(`./server/tokens.${channelID}.json`, 'utf-8')); //NOTE: Change this line to your tokens.json file, it will be renamed onRefresh
    
    const authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret
    });

    authProvider.onRefresh(async (userId, newTokenData) => {
      await fs.writeFile(`./server/tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8');
    });

    //await authProvider.addUserForToken(tokenData, ['chat']);
    authProvider.addUser(channelID, tokenData, ['chat']);

    const apiClient = new ApiClient({ authProvider });
    chatClient = new ChatClient({ authProvider, channels: [ channelName ] });
    chatClient.connect();

    chatClient.onMessage(async (channel, user, message, tags) => {
      if (!activeConnection) {
        timeStampLog('No client connected.');
        return; 
      }

      //https://twurple.js.org/reference/api/classes/HelixChannelFollower.html
      const { data: [follow] } = await apiClient.channels.getChannelFollowers(channelID, tags.userInfo.userId);
      const isFollowing = typeof follow !== 'undefined' && follow !== '';
      timeStampLog(user + ": " + message);

      const twitchData = JSON.stringify({
        "user": user,
        "message": message,
        "isFollowing": isFollowing,
        "isSub": tags.userInfo.isSubscriber,
        "isMod": tags.userInfo.isMod
      });

      activeConnection.send(twitchData);
    });

	} catch (error) {
	  console.error('Error:', error);
	}
}

const timeStampLog = (message) => console.log(`[${new Date().toLocaleString()}] ${message}`);

main();
