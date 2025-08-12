import { tscSupabaseClient } from "./databaseQueries";

const db = new tscSupabaseClient();

const puzzleIDs: Array<string> = ["2x2x2", "3x3x3", "4x4x4", "5x5x5"];

function secToTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseUserAndPuzzle(message: string, defaultUser: string): { username: string, puzzle_id: string } {
  const parts = message.split(" ").filter(part => part.trim() !== '');
  let username = defaultUser;
  let puzzle_id = "3x3x3";

  if (parts.length > 1) {
    const potentialUser = parts[1].replace(/^@/, '');
    if (parts.length > 2 && puzzleIDs.includes(parts[2])) {
      username = potentialUser;
      puzzle_id = parts[2];
    } else if (puzzleIDs.includes(parts[1])) {
      puzzle_id = parts[1];
    } else {
      username = potentialUser;
    }
  }

  return { username, puzzle_id };
}

//!top
export async function topQuery(message: string): Promise<string> {
  const parts = message.split(" ");
  const puzzle_id = parts[1] || "3x3x3";
  const { leaderboardText } = await db.getTopSolveTimes(puzzle_id);
  return leaderboardText ;
}

//!topsolvers
export async function topSolversQuery(message: string): Promise<string> {
  const parts = message.split(" ");
  const puzzle_id = parts[1] || "3x3x3";
  const topSolvers = await db.getTopSolvers(puzzle_id);
  return topSolvers;
}

//!pb
export async function userPBQuery(message: string, user: string): Promise<string> {
  const { username, puzzle_id } = parseUserAndPuzzle(message, user);
  return await db.getUserPB(username, puzzle_id);
}

//!view
export async function viewSolve(message: string, chatMsg: boolean = true): Promise<string> {
  const uuid = chatMsg ? message.split(" ")[1] : message;
  const solveData = await db.getSolveByUUID(uuid);
  if (solveData){ 
    return `Solve #${solveData.global_puzzle_solve_number} for the ${solveData.puzzle_id} ` +
      `was solved in ${secToTime(solveData.solve_time_sec)} & finished by @${solveData.username} in ` +
      `${solveData.total_moves} moves on ${solveData.created_at.split('.')[0]} ` +
      `UTC.${solveData.solve_ao5_sec ? ` Average of 5: ${solveData.solve_ao5_sec}` : ``} Scramble: ` +
      `${solveData.scramble} ${solveData.shortlink ? `Replay: ${solveData.shortlink}`: `ID: ${solveData.uuid}` }`;
  }
  return `The solve id ${uuid} does not exist.`;
}

//!solves
export async function userSolves(message: string, user: string): Promise<string> {
  const { username, puzzle_id } = parseUserAndPuzzle(message, user);
  return await db.getSolveTotal(username, puzzle_id);
}
