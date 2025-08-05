import * as db from './databaseQueries';

const puzzleIDs: Array<string> = ["2x2x2", "3x3x3", "4x4x4", "5x5x5"];

export async function topQuery(puzzle_id: string = "3x3x3"): Promise<string> {
  const { leaderboardText } = await db.getTopSolveTimes(puzzle_id);
  return leaderboardText ;
}

export async function userTopQuery(message: string, user: string): Promise<string> {
  const parts = message.split(" ").filter(part => part.trim() !== '');
  let username = user; // Default to user who sent msg
  let puzzleId = "3x3x3"; // Default puzzle
  if (parts.length > 1) { // Check if first argument is a user mention
    const potentialUser = parts[1].replace(/^@/, '');
    // Check if a puzzle ID was given
    if (parts.length > 2 && puzzleIDs.includes(parts[2])) {
      username = potentialUser;
      puzzleId = parts[2];
    } else if (puzzleIDs.includes(parts[1])) { // Part is only a puzzle ID
      puzzleId = parts[1];
    } else { // Otherwise treat as username (with default puzzle)
      username = potentialUser;
      }
  }
  const userTops = await db.getUserTopSolveTimes(username, puzzleId);
  return userTops;
}
