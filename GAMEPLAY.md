# Tic-Tac-Toe Multiplayer Game - User Flow

A real-time multiplayer tic-tac-toe game built with Next.js, React, TypeScript, and Supabase PostgreSQL.

## Game Overview

Two players can join the same game session via a shared URL/code and play tic-tac-toe in real-time. Both players see board updates instantly through polling.

---

## User Flow

### 1. Creating a Game

```
┌──────────────────────────────────────────────────────────────┐
│ PLAYER 1: Visits http://localhost:3000                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Sees "Create Game"     │
        │ button on homepage     │
        └────────────┬───────────┘
                     │
                     ▼ (Clicks button)
        ┌────────────────────────────────────────┐
        │ Frontend: handleCreateGame()           │
        │ - Sends POST /api/games               │
        │ - Button shows "Creating..."           │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Backend: POST /api/games               │
        │ - Generates 6-char join code (ABC123) │
        │ - Creates empty board: [9 empty cells]│
        │ - Creates game in PostgreSQL:          │
        │   {                                    │
        │     id: "uuid-x",                      │
        │     join_code: "ABC123",               │
        │     board: ['','','','','','','','',''],
        │     status: "waiting",                 │
        │     current_turn: "X",                 │
        │     player_x_id: null,                 │
        │     player_o_id: null                  │
        │   }                                    │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Response: {                            │
        │   message: "Game created! Share...",  │
        │   joinCode: "ABC123",                  │
        │   gameUrl: "localhost:3000/game/ABC123"
        │ }                                      │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Frontend: Display message              │
        │ "Game created! Share this code: ABC123"│
        │ or                                      │
        │ "Join at: localhost:3000/game/ABC123"  │
        │                                        │
        │ Player 1 shares link/code with friend │
        └────────────────────────────────────────┘
```

---

### 2. Joining a Game

```
┌──────────────────────────────────────────────────────────────┐
│ PLAYER 2: Receives link or code from Player 1               │
│           Visits: http://localhost:3000/game/ABC123          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Frontend: GamePage     │
        │ component loads        │
        │ joinCode = "ABC123"    │
        └────────────┬───────────┘
                     │
                     ▼ (On mount)
        ┌────────────────────────────────────────┐
        │ Frontend: joinGame()                   │
        │ - Sends POST /api/games/ABC123/join   │
        │ - Shows "Loading game..."              │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Backend: POST /api/games/ABC123/join   │
        │ - Fetches game by join_code            │
        │ - Checks if game exists                │
        │ - Checks if game is full               │
        │ - Checks if game is finished           │
        │ - Determines player symbol:            │
        │   * player_x_id = null → Assign "X"   │
        │   * player_o_id = null → Assign "O"   │
        │                                        │
        │ Update game in database:               │
        │   {                                    │
        │     player_x_id: "uuid-player1"       │
        │     player_o_id: "uuid-player2"       │
        │     status: "active"  ← Changed!      │
        │   }                                    │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Response: {                            │
        │   message: "You joined as Player O",  │
        │   playerSymbol: "O",                   │
        │   game: {...updated game object...}   │
        │ }                                      │
        └────────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ Frontend: Update state                 │
        │ - playerSymbol = "O"                   │
        │ - playerId = "uuid-player2"            │
        │ - Start polling (1-sec intervals)      │
        │ - Display: "You are Player: O"         │
        │ - Display board                        │
        │ - Display: "Your turn!" (X goes first)│
        └────────────────────────────────────────┘

Meanwhile, PLAYER 1 (already on game page):
        │
        ▼
        ┌────────────────────────────────────────┐
        │ Polling detects game status changed    │
        │ from "waiting" → "active"              │
        │ Both players now see:                   │
        │ - Game board enabled                   │
        │ - Status shows it's X's turn           │
        └────────────────────────────────────────┘
```

---

### 3. Gameplay Flow

```
PLAYER 1 (X) makes a move:

┌──────────────────────────────────────┐
│ Clicks empty cell at position 4      │
│ (center of board)                    │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend: handleCellClick(4)          │
│ - Validates it's player's turn       │
│ - POST /api/games/ABC123/move        │
│ - Body: {                            │
│     position: 4,                     │
│     playerId: "uuid-player1"         │
│   }                                  │
│ - Board disabled during request      │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Backend: POST /api/games/ABC123/move │
│                                      │
│ 1. Fetch game from database          │
│ 2. Validate move:                    │
│    - Position is 0-8                 │
│    - Cell is empty                   │
│    - It's player's turn              │
│    - Game is active                  │
│ 3. Apply move using TicTacToeLogic:  │
│    - New board: ['','','','','X',...]│
│ 4. Check for winner:                 │
│    - Check all 8 win patterns        │
│    - Check for draw (board full)     │
│ 5. Update database:                  │
│    {                                 │
│      board: ['','','','','X',...],  │
│      current_turn: "O",              │
│      status: "active" or "finished"  │
│      winner: null or "X" or "draw"   │
│    }                                 │
│ 6. Return updated game               │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend: Update state                │
│ - game.board updated                 │
│ - current_turn = "O"                 │
│ - Re-render board                    │
│ - Board re-enabled                   │
│ - Display: "O's turn"                │
└────────────┬──────────────────────────┘

Simultaneously, PLAYER 2's polling:

┌──────────────────────────────────────┐
│ Polling interval (1 second)           │
│ GET /api/games/ABC123                │
│ Fetches latest game state            │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend: Board updates               │
│ - Sees X at position 4               │
│ - current_turn = "O"                 │
│ - Display: "Your turn!"              │
│ - Board now enabled for O            │
└────────────────────────────────────────┘

PLAYER 2 (O) makes move → Same cycle repeats
```

---

### 4. Game End

```
After moves, someone wins or draws:

┌──────────────────────────────────────┐
│ Player gets 3 in a row (e.g., X)     │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Backend detects winner:              │
│ - Checks all win patterns            │
│ - Updates database:                  │
│   {                                  │
│     status: "finished",              │
│     winner: "X"                      │
│   }                                  │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Both players see:                     │
│ - Board disabled                     │
│ - Message: "Player X wins!"          │
│ - Link to create new game            │
└────────────────────────────────────────┘
```

---

## Architecture

### Database Schema

```
games table:
├── id (UUID) - Primary key
├── join_code (VARCHAR) - Unique 6-char code
├── board (TEXT[]) - 9-element array of board state
├── current_turn (X or O)
├── status (waiting, active, finished)
├── winner (X, O, draw, or null)
├── player_x_id (UUID)
├── player_o_id (UUID)
└── timestamps

players table:
├── id (UUID) - Primary key
├── game_id (UUID) - Foreign key
├── player_symbol (X or O)
├── player_name
├── is_connected
└── joined_at

moves table (optional):
├── id (UUID)
├── game_id (UUID)
├── player_id (UUID)
├── position (0-8)
├── symbol (X or O)
├── move_number
└── created_at
```

### API Routes

```
POST   /api/games                    - Create new game
POST   /api/games/[code]/join        - Join game by code
GET    /api/games/[code]             - Get game state
POST   /api/games/[code]/move        - Make a move
```

### Frontend Pages

```
/                           - Home page (create game button)
/game/[joinCode]           - Game board page
```

---

## Key Technologies

- **Next.js 16** - React framework with API routes
- **React 19** - UI components with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - PostgreSQL database
- **Custom Game Logic** - Pure TicTacToeLogic class (no external libs)

---

## Running the Project

```bash
# Install dependencies
npm install

# Set up environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Run dev server
npm run dev

# Visit http://localhost:3000
```

---

## Happy Path Assumptions

- Both players connect and stay connected
- No disconnections/reconnections
- Moves are made in proper turn order
- Game completes to win or draw
