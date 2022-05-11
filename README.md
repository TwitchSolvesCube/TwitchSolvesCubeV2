# TwitchSolvesCubeV2
Powered by https://github.com/cubing/cubing.js

## Features
Various cube perspectives  
Back of cube is visible with "hints"  
Play Time: Followers 8 Minutes vs Non-Followers 5 Minutes  
Users get kicked after 2 minutes of not entering a valid move

## Chat Commands!
- `!joinq` or `!jq`
- `!leaveq` or `!lq`
- `!queue` or `!q`
- `scramble` completes a random scramble on the puzzle
- `scramble <alg>` set a custom scramble. Example `scramble R U' L2 U2 B R2 B2 R2 D2 B' F2 L2 U2 F' U' F' L B' U2 L' F2`
- `!topright` or `!tr` (this is the default)
<img src="https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/TopRight.png"  width="478" height="269">

- `!sidebyside` or `!sbs`
<img src="https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/SideBySide.png"  width="478" height="269">

- `!blind` or `!bld`
<img src="https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/media/Blind.png"  width="478" height="269">

- `!normal` or `!norm` (brings back cube from blind)
- `!speednotation` or `!sn`

## Examples

## How to create `tokens.json`
Follow Steps 1 & 2 from here https://twurple.js.org/docs/examples/chat/basic-bot.html  
To make things easier you may use https://reqbin.com/post-online for your POST request (Use this site at your own risk)

# Contributing

## Install
https://nodejs.org/en/

## Setting Up Dev Enviroment
Run line by line
```
git clone https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2  
```
```
cd TwitchSolvesCubeV2
```
```
npm install parcel cubing@0.22.0 @twurple/auth @twurple/chat @twurple/api delay
```
```
npx parcel .\cube.html
```

# License
This project is under GPL3 which means you are free to use this program, but **must publicly publish any code that uses it.** View full license for exact details [here](https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2/blob/main/LICENSE).
