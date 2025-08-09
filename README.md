# TwitchSolvesCubeV2

[![](https://img.shields.io/badge/Powered_By-cubing.js-blueviolet?logo=github)](https://github.com/cubing/cubing.js)  

Head over to [twitch.tv/twitchsolvescube](https://www.twitch.tv/twitchsolvescube) to try out this project!

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

# Contributing / Setting up

For developing/contributing or setting up refer to the [CONTRIBUTING.md](CONTRIBUTING.md) doc.

# License

This project is under GPL3 which means you are free to use this program, but **must publicly publish any code that uses it.** View full license for exact details [here](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/LICENSE).
