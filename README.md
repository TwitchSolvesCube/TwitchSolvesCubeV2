# TwitchSolvesCubeV2

[![](https://img.shields.io/badge/Powered_By-cubing.js-blueviolet?logo=github)](https://github.com/cubing/cubing.js)  

## Features

Various cube perspectives  
Back of cube is visible with "hints"  
Multiple Puzzles
Database functions to store solves and times  
TODO: Followers 8 Minutes vs Non-Followers 5 Minutes  

## 💬 Chat Commands!

### ⏳ Queue commands

| Command        | Aliases  | Description                      |
|----------------|----------|----------------------------------|
| `!join`        | `!j`     | Join the current game/queue      |
| `!leave`       | `!l`     | Leave the current game/queue     |
| `!queue`       | `!q`     | Show the current player queue    |

### 🎮 Playing commands

These are commands that can only be used when its a players turn.

| Command              | Aliases   | Description                                                                 | Example                                                                 |
|----------------------|-----------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `scramble`           | –         | Performs a random scramble on the current puzzle                           | –                                                                       |
| `scramble <alg>`     | –         | Sets a custom scramble using the provided algorithm                        | `scramble R U' L2 U2 B R2 B2 R2 D2 B' F2 L2 U2 F' U' F' L B' U2 L' F2`   |
| `222`, `333`, `444`, `555`   | –         | Sets the puzzle type: 2x2x2, 3x3x3, 4x4x4, 5x5x5                             |                                                                   |
| `!topright`          | `!tr`     | Changes camera to top-right view *(default)*                               | ![TopRight](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/TopRight.png)       |
| `!sidebyside`        | `!sbs`    | Changes camera to side-by-side view                                        | ![SideBySide](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/SideBySide.png)   |
| `!blind`             | `!bld`    | Enables blind mode (hides cube)                                            | ![Blind](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/Blind.png)             |
| `!normal`            | `!norm`   | Returns cube from blind mode to normal view                                | –                                                                       |
| `!speednotation`     | `!sn`     | Enables CSTimer-style keyboard shortcuts                                   | ![KeyMap](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/VirtualCubeKeyMap.png) |
| `!normalnotation`    | `!nn`     | Disables speednotation mode                                                | –                                                                       |                                                                    |

### 📊 Statistics commands

| Command                          | Aliases                     | Description                                                                 | Examples                                                                 |
|----------------------------------|-----------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------|
| `!top <puzzle_id>`               | `!leaderboard`, `!lb`       | Shows top solvers for a puzzle. Defaults to 3x3x3 puzzle.     | `!top`<br>`!top 2x2x2`                                                   |
| `!topsolvers <puzzle_id>`        | –                           | Shows users with most solves overall for a puzzle. Defaults to 3x3x3 puzzle.                      | `!topsolvers`<br>`!topsolvers 2x2x2`                                     |
| `!pb <username> <puzzle_id>`     |                        | Shows personal best for a user and puzzle. Defaults to your PB and 3x3x3 puzzle.    | `!pb`<br>`!pb 2x2x2`<br>`!pb @user`<br>`!pb @user 2x2x2`                  |
| `!view <uuid>`                   | –                           | Shows stats of a specific solve by its UUID.                                         | `!view 01234567-89ab-cdef-ghij-klmnopqrstuv`                             |
| `!solves <username> <puzzle_id>` | –                           | Shows how many times a user has solved a puzzle. Defaults to your solves and 3x3x3 puzzle.  | `!solves`<br>`!solves 2x2x2`<br>`!solves @user`<br>`!solves @user 2x2x2` |

# Contributing

## Install Requirements

[NodeJs >=22.3.0](https://nodejs.org/en/download) and [Git](https://git-scm.com/download/win)

#### Font (Optional)

[Rubik](https://fonts.google.com/specimen/Rubik)

## How to create `tokens.*.json`

Follow Steps 1 & 2 from here https://twurple.js.org/docs/examples/chat/basic-bot.html  
To make things easier you may use https://reqbin.com/post-online for your POST request (Use this site at your own risk)   

Example link for scopes, enter your CLIENT_ID and REDIRECT_URI.

```
https://id.twitch.tv/oauth2/authorize?client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>&response_type=code&scope=chat:read+chat:edit+whispers:edit+whispers:read+channel:moderate+moderator:read:followers
```

Place the `tokens.*.json` file in the server folder.   

## How to create `config.json`

Paste in your `clientId`, `clientSecret`, and `channelName` you want to connect to.

Edit `clientPort` and `serverPort` if running more than two instances.


### Optional configs

If a database, aka leaderboards and stats, is desired add `supabaseUrl` and `supabaseKey`. More details at [supabase.com](https://supabase.com).

[Kutt](https://github.com/thedevs-network/kutt) shortens twizzle links to meet the character limit of twitchchat and is only used if supabase is configured. To use this feature set `kuttURL` `kuttDomain` and `kuttKey`.

## Setting Up Dev Enviroment

Run line by line

```
git clone https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2  
```

```
cd TwitchSolvesCubeV2
```

Installs npm packages

```
npm run packages
```

Starts the client and server

```
npm run tsc
```

# License

This project is under GPL3 which means you are free to use this program, but **must publicly publish any code that uses it.** View full license for exact details [here](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/LICENSE).
