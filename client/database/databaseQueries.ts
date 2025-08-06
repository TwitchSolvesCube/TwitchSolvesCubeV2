import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseTable, supabaseKey } from '../../server/config.json';

interface SolveData {
  username: string;
  puzzle_id: string;
  solve_time: string;
  total_moves: number;
  scramble: string;
  twizzle_link: string;
}

interface LeaderboardResult {
  leaderboardText: string;
  topUser1?: string;
  topUser2?: string;
  topUser3?: string;
}

export class tscSupabaseClient {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async insertData(solve: SolveData): Promise<string | null> {
    const { username, puzzle_id, solve_time, total_moves, scramble, twizzle_link } = solve;
    
    // Get current highest solve_number for this user and puzzle
    const { data: existingSolves, error: fetchError } = await this.supabase
      .from(supabaseTable)
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
    const { data, error } = await this.supabase
      .from(supabaseTable)
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
    
    return data?.[0]?.uuid ?? null;
  }

  async setShortlinkForUUID(uuid: string, shortlink: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from(supabaseTable)
      .update({ shortlink })
      .eq('uuid', uuid)
      .select('shortlink')
      .single();

    if (error) {
      console.error('Error updating shortlink:', error);
      return null;
    }

    return data?.shortlink ?? null;
  }

  async getTopSolveTimes(puzzle_id: string): Promise<LeaderboardResult> {
    const { data, error } = await this.supabase
      .from(supabaseTable)
      .select('username, solve_time')
      .eq('puzzle_id', puzzle_id)
      .order('solve_time', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Error fetching top solve times:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      const errorMsg = `${puzzle_id} is not a valid puzzle. Valid puzzles: 2x2x2, 3x3x3, 4x4x4, 5x5x5.`;
      return { leaderboardText: errorMsg };
    }

    const leaderboardText = data
      .map((solve, index) => `${index + 1}. ${solve.username}: ${solve.solve_time}`)
      .join(' | ');

    return {
      leaderboardText: `Top ${puzzle_id} Solves | ${leaderboardText}`,
      topUser1: data[0] ? `1. ${data[0].username}: ${data[0].solve_time}` : undefined,
      topUser2: data[1] ? `2. ${data[1].username}: ${data[1].solve_time}` : undefined,
      topUser3: data[2] ? `3. ${data[2].username}: ${data[2].solve_time}` : undefined,
    };
  }

  async getUserTopSolveTimes(username: string, puzzle_id: string): Promise<string> {
    const { data, error } = await this.supabase
      .from(supabaseTable)
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
}
