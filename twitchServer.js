const WebSocket = require('ws');
const fs = require('fs').promises;
const { RefreshingAuthProvider } = require('@twurple/auth');
const { ApiClient  } = require('@twurple/api');
const { ChatClient  } = require('@twurple/chat');
const clientCredentials = require('./config.json');

const clientId = clientCredentials.clientId;
const clientSecret = clientCredentials.clientSecret;
let chatClient = new ChatClient();

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
    try {
      const jsonData = JSON.parse(message);
      console.log(jsonData.message);
      chatClient.say("twitchsolvesbot", jsonData.message)
    } catch (error) {
      console.log('Received non-JSON data:', message);
    }

    // Handle client messages here if needed
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

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
    chatClient = new ChatClient({ authProvider, channels: ['twitchsolvesbot'] });
    chatClient.connect();

    chatClient.onMessage(async (channel, user, message, tags) => {
      timeStampLog(channel);
      timeStampLog(user);
      timeStampLog(message);

      const twitch = {
        "user": user,
        "message": message,
        "isMod": tags.userInfo.isMod,
        "isSub": tags.userInfo.isSubscriber
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
  const formattedDate = '[' + currentDate.toLocaleTimeString() + '] ';
  const timestampedMessage = formattedDate + message;
  console.log(timestampedMessage);
}

main();
