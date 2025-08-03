import { createClient } from '@supabase/supabase-js'
import { supabaseUrl } from '../../server/config.json';
import { supabaseKey } from '../../server/config.json';

const supabase = createClient(supabaseUrl, supabaseKey)

interface SolveData {
  username: string;
  puzzle_id: string;
  solve_time: string;
  total_moves: number;
  scramble: string;
  twizzle_link: string;
}

export async function insertData(solve: SolveData): Promise<string | null> {
  const { username, puzzle_id, solve_time, total_moves, scramble, twizzle_link } = solve;
  // TODO: shorten twizzlelink, add to database, return short link to chat
  // Get current highest solve_number for this user and puzzle
  const { data: existingSolves, error: fetchError } = await supabase
    .from('user_stats_dev')
    .select('solve_number')
    .eq('username', username)
    .eq('puzzle_id', puzzle_id)
    .order('solve_number', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching current solve_number:', fetchError);
    return null;
  }

  const currentSolveNumber = existingSolves?.[0]?.solve_number || 0;
  const newSolveNumber = currentSolveNumber + 1;

  // Insert new data with incremented solve_number
  const { data, error } = await supabase
    .from('user_stats_dev')
    .insert([
      {
        username,
        puzzle_id,
        solve_time,
        solve_number: newSolveNumber,
        total_moves,
        scramble,
        twizzle_link
      }
    ])
    .select('uuid');

  if (error) {
    console.error('Error inserting data:', error);
    return null;
  }
  
  //return data?.[0]?.shortlink ?? null;
  return data?.[0]?.uuid ?? null;
}

// Function to get top 5 solve times for a puzzle
export async function getTopSolveTimes(puzzle_id: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_stats_dev')
    .select('username, solve_time')
    .eq('puzzle_id', puzzle_id)
    .order('solve_time', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching top solve times:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return `${puzzle_id} is not a valid puzzle. Valid puzzles: 2x2x2, 3x3x3, 4x4x4, 5x5x5.`;
  }

  const header = `Top ${puzzle_id} Solves of All Time | `;
  const timesList = data
    .map((solve, index) => `${index + 1}. ${solve.username}: ${solve.solve_time}`);
  
  return `${header} ${timesList.join(' | ')}`;
}

export async function getUserTopSolveTimes(username: string, puzzle_id: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_stats_dev')
    .select('solve_time')
    .eq('username', username)
    .eq('puzzle_id', puzzle_id)
    .order('solve_time', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching user solve times:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return `${username} does not have any ${puzzle_id} entries`;
  }

  const header = `Top ${puzzle_id} solves by ${username} | `;
  const timesList = data
    .map((solve, index) => `${index + 1}. ${solve.solve_time}`);
  
  return `${header} ${timesList.join(' | ')}`;
}
