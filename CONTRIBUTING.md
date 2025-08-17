# Contributing

> [!Note]
Feel free to join the [discord](https://discord.gg/YtY7m7stDZ) and ask questions on anything related to this project.

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
More information on setting up supabase can be found below. 

[Kutt](https://github.com/thedevs-network/kutt) shortens twizzle links to meet the character limit of twitchchat and is only used if supabase is configured. To use this feature set `kuttURL` `kuttDomain` and `kuttKey`.

## Setting Up Dev Enviroment

Clone and move into this project directory

```
git clone https://github.com/TwitchSolvesCube/TwitchSolvesCubeV2  
```

```
cd TwitchSolvesCubeV2
```

Install npm packages

```
npm run packages
```

Start the client and server

```
npm run tsc
```

## Supabase Setup (Optional)

### Table Columns

| Name                         | Type       | Default Value       | Description                          |
|------------------------------|------------|---------------------|--------------------------------------|
| `uuid`                       | text       | gen_random_uuid()   | Unique identifier                    |
| `created_at`                 | timestamp  | now()               | Timestamp of solve                   |
| `username`                   | text       | NULL                | User who finished the puzzle         |
| `solve_participants`         | text       | NULL                | Users who added a move to solve      |
| `puzzle_id`                  | text       | NULL                | Puzzle type: "2x2x2" "3x3x3" etc     |
| `solve_time_sec`             | float4     | NULL                | Solve time in seconds                |
| `solve_ao5_sec`              | float4     | NULL                | Average of 5 solves in seconds       |
| `global_puzzle_solve_number` | numeric    | NULL                | Global solve counter for puzzle_id   |
| `solve_number`               | numeric    | NULL                | User's solve counter for puzzle_id   |
| `total_moves`                | numeric    | NULL                | Total moves used in solution         |
| `scramble`                   | text       | NULL                | Scramble algorithm used              |
| `solve_alg`                  | text       | NULL                | Solution algorithm used              |
| `twizzle_link`               | text       | NULL                | Link to Twizzle visualization        |
| `shortlink`                  | text       | NULL                | Shortened Twizzle link               |

### RPC Functions

Replace `<TABLE_NAME>` with the name of the supabase table.

```sql
create or replace function get_top3_solve_times(puzzle_id text)
returns table (username text, solve_time_sec numeric, total_moves numeric) as $$
  with best_times as (
    select distinct on (username)
      username,
      solve_time_sec,
      total_moves
    from <TABLE_NAME>
    where puzzle_id = $1
    order by username, solve_time_sec asc
  )
  select username, solve_time_sec, total_moves
  from best_times
  order by solve_time_sec asc
  limit 3;
$$ language sql;
```

```sql
select * from get_top3_solve_times('3x3x3');
```

```sql
create or replace function get_top3_solvers(puzzle_id text)
returns table (username text, solve_number bigint) as $$
  select username, max(solve_number) as solve_number
  from <TABLE_NAME>
  where puzzle_id = $1
  group by username
  order by solve_number desc
  limit 3;
$$ language sql;
```

```sql
select * from get_top3_solvers('3x3x3');
```
