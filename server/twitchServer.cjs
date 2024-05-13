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
let chatClient = new ChatClient();

const wss = new WebSocket.Server({ port: 8080 });
let wsConnection;

wss.on('connection', (ws) => {
  timeStampLog('Client connected');

  // Send initial data or perform actions here
  ws.on('open', () => {
    timeStampLog('WebSocket connection is open.');
  });

  // Send a message to the connected client
  ws.send('Welcome to the WebSocket server!');

  wsConnection = ws;

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
    timeStampLog('Client disconnected');
  });
});

async function main() {
  try {
    const tokenData = JSON.parse(await fs.readFile('./server/tokens.668628308.json', 'utf-8')); //NOTE: Change this line to your tokens.json file, it will be renamed onRefresh

    const authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret
    });

    authProvider.onRefresh(async (userId, newTokenData) => {
      await fs.writeFile(`./server/tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8');
    });

    //await authProvider.addUserForToken(tokenData, ['chat']);
    authProvider.addUser("668628308", tokenData, ['chat']);

    const apiClient = new ApiClient({ authProvider });
    chatClient = new ChatClient({ authProvider, channels: [ channelName ] });
    chatClient.connect();

    chatClient.onMessage(async (channel, user, message, tags) => {
      //const { data: [follow] } = await apiClient.channels.getChannelFollowers(channelID, tags.userInfo.userId); //If channelID == userID then userID can be used here instead

      // timeStampLog(channel);
      // timeStampLog(user);
      timeStampLog(user + ": " + message);

      const twitch = {
        "user": user,
        "message": message,
        // "isFollower": follow,
        "isSub": tags.userInfo.isSubscriber,
        "isMod": tags.userInfo.isMod
      };

      const twitchData = JSON.stringify(twitch);
      wsConnection.send(twitchData);
    });

	} catch (error) {
	  console.error('Error:', error);
	}
}

function timeStampLog(message) {
  const currentDate = new Date();
  const formattedDateTime = '[' + currentDate.toLocaleString() + '] ';
  const timestampedMessage = formattedDateTime + message;
  console.log(timestampedMessage);
}

main();
