import { createClient, SupabaseClient } from '@supabase/supabase-js';

const confInfo = require('../../server/config.json');

interface SolveData {
  username: string;
  solve_participants: string;
  puzzle_id: string;
  solve_time_sec: number;
  total_moves: number;
  scramble: string;
  solve_alg: string;
  twizzle_link: string;
  //Optional
  uuid?: string;
  created_at?: string;
  solve_ao5_sec?: number;
  solve_number?: number;
  global_puzzle_solve_number?: number;
  shortlink?: string;
}

interface LeaderboardResult {
  leaderboardText: string;
  topUser1?: string;
  topUser2?: string;
  topUser3?: string;
}

export class tscSupabaseClient {
  private supabase: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    try {
      if (confInfo.supabaseUrl && confInfo.supabaseKey && confInfo.supabaseTable) {
        this.supabase = createClient(confInfo.supabaseUrl, confInfo.supabaseKey);
        this.initialized = true;
      } else {
        console.warn('Supabase URL or Key missing - running in offline mode');
      }
    } catch (error) {
      console.warn('Config loading failed - running in offline mode', error);
    }
  }

  //TODO: Break this function down into helper functions
  async insertData(solve: SolveData): Promise<SolveData | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { username, solve_participants, puzzle_id, solve_time_sec, total_moves, scramble, solve_alg, twizzle_link } = solve;

    //Get current highest solve_number for this user and puzzle
    const { data: existingUserSolves, error: userFetchError } = await this.supabase
      .from(confInfo.supabaseTable)
      .select('solve_number')
      .eq('username', username)
      .eq('puzzle_id', puzzle_id)
      .order('solve_number', { ascending: false })
      .limit(1);

    if (userFetchError) {
      console.error('Error fetching user solve_number:', userFetchError);
      return null;
    }

    const currentSolveNumber = existingUserSolves?.[0]?.solve_number || 0;
    const newSolveNumber = currentSolveNumber + 1;

    //Get current highest global_puzzle_solve_number for this puzzle_id
    const { data: existingGlobalSolves, error: globalFetchError } = await this.supabase
      .from(confInfo.supabaseTable)
      .select('global_puzzle_solve_number')
      .eq('puzzle_id', puzzle_id)
      .order('global_puzzle_solve_number', { ascending: false })
      .limit(1);

    if (globalFetchError) {
      console.error('Error fetching global_puzzle_solve_number:', globalFetchError);
      return null;
    }

    const currentGlobalSolveNumber = existingGlobalSolves?.[0]?.global_puzzle_solve_number || 0;
    const newGlobalSolveNumber = currentGlobalSolveNumber + 1;

    let solve_ao5_sec: number | null = null;

    //Calculate ao5 if solve_number is divisible by 5 and there are at least 4 previous solves
    if (newSolveNumber % 5 === 0) {
      //Fetch last 4 solves before this one
      const { data: lastFourSolves, error: lastFourError } = await this.supabase
        .from(confInfo.supabaseTable)
        .select('solve_time_sec')
        .eq('username', username)
        .eq('puzzle_id', puzzle_id)
        .order('solve_number', { ascending: false })
        .limit(4);

      if (lastFourError) {
        console.error('Error fetching last four solves for ao5:', lastFourError);
        return null;
      }

      if (lastFourSolves && lastFourSolves.length === 4) {
        //Collect the current solve time + the last 4 solves
        const times = [
          ...lastFourSolves.map(s => s.solve_time_sec),
          solve_time_sec
        ];

        //Compute AO5 (remove best & worst, average the rest)
        const trimmed = times.sort((a, b) => a - b).slice(1, -1);
        solve_ao5_sec = trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length;
      }
    }

    //Insert new data with incremented solve_number and calculated ao5
    const { data, error } = await this.supabase
      .from(confInfo.supabaseTable)
      .insert([
        {
          username,
          solve_participants,
          puzzle_id,
          solve_time_sec,
          solve_ao5_sec: Math.round(solve_ao5_sec * 1000) / 1000,
          solve_number: newSolveNumber,
          global_puzzle_solve_number: newGlobalSolveNumber,
          total_moves,
          scramble,
          solve_alg,
          twizzle_link
        }
      ])
      .select('*');

    if (error) {
      console.error('Error inserting data:', error);
      return null;
    }

    return data?.[0] ?? null;
  }

  async setShortlinkForUUID(uuid: string, shortlink: string): Promise<string | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data, error } = await this.supabase
      .from(confInfo.supabaseTable)
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

  //!top
  async getTopSolveTimes(puzzle_id: string): Promise<LeaderboardResult | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data, error } = await this.supabase
      .rpc('get_top3_solve_times', { puzzle_id: puzzle_id });

    if (error) {
      console.error('Error fetching top solve times:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      const errorMsg = `${puzzle_id} is not a valid puzzle. Valid puzzles: 2x2x2, 3x3x3, 4x4x4, 5x5x5.`;
      return { leaderboardText: errorMsg };
    }

    const leaderboardText = data
      .map((solve, index) => `${index + 1}. @${solve.username}: ${this.secToTime(solve.solve_time_sec)}`)
      .join(' | ');

    return {
      leaderboardText: `Top ${puzzle_id} Solves | ${leaderboardText}`,
      topUser1: data[0] ? `1. ${data[0].username}: ${this.secToTime(data[0].solve_time_sec)}` : undefined,
      topUser2: data[1] ? `2. ${data[1].username}: ${this.secToTime(data[1].solve_time_sec)}` : undefined,
      topUser3: data[2] ? `3. ${data[2].username}: ${this.secToTime(data[2].solve_time_sec)}` : undefined,
    };
  }

  //!topsolvers
  async getTopSolvers(puzzle_id: string): Promise<string | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data, error } = await this.supabase
      .rpc('get_top3_solvers', {puzzle_id: puzzle_id});

    if (error) {
      console.error('Error fetching top solvers:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return `No one has solved ${puzzle_id} or it doesn't exist.`;
    }
    
    let header = `Top solvers for puzzle ${puzzle_id} |`;
    const solversList = data
      .map((solver, index) => `${index + 1}. @${solver.username}: ${solver.solve_number} solves`);

    return `${header} ${solversList.join(' | ')}`;
  }

  //!pb
  async getUserPB(username: string, puzzle_id: string): Promise<string | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data, error } = await this.supabase
      .from(confInfo.supabaseTable)
      .select('solve_time_sec')
      .eq('username', username)
      .eq('puzzle_id', puzzle_id)
      .order('solve_time_sec', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching user solve times:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return `@${username} does not have any ${puzzle_id} entries`;
    }

    const header = `Top ${puzzle_id} solves by @${username} | `;
    const timesList = data
      .map((solve, index) => `${index + 1}. ${this.secToTime(solve.solve_time_sec)}`);
    
    return `${header} ${timesList.join(' | ')}`;
  }

  //!view
  async getSolveByUUID(uuid: string): Promise<SolveData | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data: solve, error: solveError } = await this.supabase
      .from(confInfo.supabaseTable)
      .select('*')
      .eq('uuid', uuid)
      .single();

    if (solveError || !solve) {
      console.error('Error fetching solve by UUID:', solveError);
      return null;
    }

    return solve as SolveData;
  }

  //!solves
  async getSolveTotal(username: string, puzzle_id: string): Promise<string | null> {
    if (!this.isInitialized()) {
      return null;
    }

    const { data, error } = await this.supabase
      .from(confInfo.supabaseTable)
      .select('solve_number,username,puzzle_id')
      .eq('username', username)
      .eq('puzzle_id', puzzle_id)
      .order('solve_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching solve number:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return `@${username} has no solves for ${puzzle_id}`;
    }

    return `@${username} has ${data[0].solve_number} solves for ${puzzle_id}`;
  }

  secToTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  isInitialized(printLog: boolean = true): boolean {
    if (printLog) {
      if (this.initialized) {
        console.log("Supabase is configured.");
      } else {
        console.log("Supabase is not configured.");
      }
    }
    return this.initialized;
  }
}
