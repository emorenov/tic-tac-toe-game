# Frontend Architecture

Frontend logic and component structure for the Tic-Tac-Toe Multiplayer Game.

---

## Page Structure

```
src/
├── app/
│   ├── page.tsx              # Home page - Create game
│   └── game/
│       └── [joinCode]/
│           └── page.tsx      # Game board page
└── components/
    └── (none yet)
```

---

## Home Page (`/`)

**File:** `app/page.tsx`

### Purpose
Displays the landing page with a button to create a new game.

### State Management

```typescript
const [message, setMessage] = useState('');        // Display response message
const [loading, setLoading] = useState(false);     // Button loading state
```

### Flow

```
User clicks "Create Game"
    ↓
handleCreateGame() executes
    ↓
POST /api/games (with loading=true)
    ↓
Response received
    ↓
setMessage() displays join code + URL
    ↓
User shares code/URL with friend
```

### Key Functions

**`handleCreateGame()`**
- Sends POST request to `/api/games`
- Sets loading state during request
- Displays game code and shareable URL
- Handles errors gracefully

### UI Elements

- **"Create Game" Button** - Disabled while loading
- **Message Box** - Shows join code and URL after creation
- **Status Text** - "Creating..." while pending

---

## Game Page (`/game/[joinCode]`)

**File:** `app/game/[joinCode]/page.tsx`

The main game board page where players interact.

### State Management

```typescript
const [game, setGame] = useState<Game | null>(null);           // Current game state
const [playerSymbol, setPlayerSymbol] = useState<string | null>(null);  // "X" or "O"
const [playerId, setPlayerId] = useState<string | null>(null);  // Player's UUID
const [loading, setLoading] = useState(true);                   // Initial load
const [error, setError] = useState('');                         // Error messages
const [makeMovePending, setMakeMovePending] = useState(false);  // Move in progress
const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Polling timer
```

### Component Lifecycle

```
Component Mounts
    ↓
useEffect(() => { joinGame() })
    ↓
joinGame() executes
    ├─ POST /api/games/[code]/join
    ├─ Get player symbol (X or O)
    ├─ Set playerId
    └─ startPolling()
    ↓
Component Renders
    ├─ If loading: "Loading game..."
    ├─ If error & no game: Error screen
    └─ If game loaded: Game board
    ↓
Polling Active (every 1 second)
    ├─ GET /api/games/[code]
    ├─ setGame(newGameState)
    └─ Board re-renders
    ↓
User clicks cell
    ├─ handleCellClick(position)
    ├─ POST /api/games/[code]/move
    └─ setGame(updatedGame)
    ↓
Component Unmounts
    ├─ clearInterval(pollingInterval)
    └─ Cleanup complete
```

### Key Functions

**`joinGame()`**
- Attempts to join the game via POST
- If successful: Sets player symbol and starts polling
- If failed (full/finished): Fetches game state as spectator
- Sets loading to false when complete

**`startPolling()`**
- Creates interval that runs every 1 second
- Calls `fetchGameState()`
- Stored in `pollingIntervalRef` for cleanup

**`fetchGameState()`**
- GET request to `/api/games/[code]`
- Updates `game` state with latest board
- Called automatically by polling interval
- Keeps both players' boards in sync

**`handleCellClick(position)`**
- Validates player is in game
- POST `/api/games/[code]/move` with position and playerId
- Sets `makeMovePending=true` (disables board)
- Updates game state on response
- Shows result message if game ends

**`getStatusMessage()`**
- Returns contextual message based on game state
- "Waiting for another player..." (status: waiting)
- "Your turn!" or "X's turn" (status: active)
- "Player X wins!" (status: finished)

**`renderBoard()`**
- Maps game board array (9 cells) to 3x3 grid
- Each cell is a button with:
  - Click handler: `onClick={() => handleCellClick(index)}`
  - Disabled state: If cell filled, not player's turn, or move pending
  - Display: Shows "X", "O", or empty

### Real-Time Sync Strategy

**Polling (1-second interval)**
```
Player A makes move
    ↓
POST /api/games/ABC123/move
    ↓
Database updated
    ↓
Player B's polling detects change
    ↓
GET /api/games/ABC123 (every 1 sec)
    ↓
Board updates on Player B's screen
    ↓
Total sync time: ~1 second (acceptable for happy path)
```

### UI Rendering

**Loading State**
```typescript
if (loading) {
  return <div>"Loading game..."</div>;
}
```

**Error State** (no game found)
```typescript
if (error && !game) {
  return <div>Error message + "Go back home" link</div>;
}
```

**Game Board State**
```typescript
return (
  <div>
    <h1>Tic-Tac-Toe</h1>
    <GameInfo>
      - Join code
      - Your player symbol (X or O)
      - Status message (whose turn)
    </GameInfo>
    <Board>
      - 3x3 grid of clickable cells
      - Each cell shows "" | "X" | "O"
      - Disabled if: filled, not your turn, game over
    </Board>
    <GameStatus>
      - Show result if game ended
      - Show error if move failed
    </GameStatus>
  </div>
);
```

---

## Data Flow Diagram

### Creating & Joining

```
┌─────────────────┐
│  Home Page      │
│ Click "Create"  │
└────────┬────────┘
         │ POST /api/games
         ▼
    ┌────────────┐
    │ Backend    │
    │ Create     │
    └────────┬───┘
             │ Response: joinCode
             ▼
    ┌──────────────────┐
    │ Show message:    │
    │ "Share ABC123"   │
    └──────────────────┘
         │
         │ Share link
         ▼
┌──────────────────────┐
│ Friend clicks link   │
│ /game/ABC123         │
└────────┬─────────────┘
         │ Page loads
         │ joinGame()
         │ POST /api/games/ABC123/join
         ▼
    ┌────────────┐
    │ Backend    │
    │ Assign "O" │
    │ status→    │
    │ "active"   │
    └────────┬───┘
             │ Response
             ▼
    ┌──────────────────────┐
    │ setPlayerSymbol("O") │
    │ setPlayerId(...)     │
    │ startPolling()       │
    │ Show board           │
    └──────────────────────┘
         ↑ Meanwhile...
         │
    Creator sees polling
    updates game from
    "waiting" to "active"
```

### Making Moves

```
Player clicks cell (position 4)
    ↓
setMakeMovePending(true) [disable board]
    ↓
POST /api/games/ABC123/move
Body: { position: 4, playerId: "uuid" }
    ↓
┌─────────────────┐
│    Backend      │
│ - Validate move │
│ - Update board  │
│ - Check winner  │
│ - Switch turn   │
└────────┬────────┘
         │ Response: { game, result }
         ▼
setGame(updatedGame)
setMakeMovePending(false) [enable board]
    ↓
Board re-renders with new state
    ↓
Other player's polling (1 sec later)
    ↓
GET /api/games/ABC123
    ↓
setGame(newGameState)
    ↓
Other player's board updates
```

---

## Component Props & Types

### Game Interface
```typescript
interface Game {
  id: string;
  join_code: string;
  board: string[];              // 9 elements
  current_turn: string;         // "X" or "O"
  status: string;               // "waiting" | "active" | "finished"
  winner: string | null;        // null | "X" | "O" | "draw"
  player_x_id: string | null;
  player_o_id: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Conditional Rendering Logic

**Show Board?**
```typescript
{game && renderBoard()}
// Only shows if game data loaded
```

**Show "Waiting for Player"?**
```typescript
{game?.status === 'waiting' && !playerSymbol && (
  <div>Share this link with a friend!</div>
)}
// Only spectators see this
```

**Show Error?**
```typescript
{error && (
  <div>Error message</div>
)}
// Shows all error states
```

**Disable Board Cells?**
```typescript
disabled={
  game.status !== 'active' ||           // Game not started/finished
  playerSymbol !== game.current_turn ||  // Not your turn
  cell !== '' ||                         // Cell occupied
  makeMovePending                        // Move in progress
}
// Cell clickable only if all conditions false
```

---

## User Interactions

| Action | Triggers | Result |
|--------|----------|--------|
| Click "Create Game" | `handleCreateGame()` | Game created, code displayed |
| Copy join code | N/A | Share with friend |
| Visit `/game/ABC123` | `useEffect(joinGame)` | Auto-join as X or O |
| Click board cell | `handleCellClick(pos)` | Move sent, board disabled |
| Board updates | Polling (1 sec) | `setGame()` re-renders |
| Game ends | Move detection | Show winner/draw message |

---

## Error Handling

**Frontend Error Cases:**

1. **Game not found**
   - Happens if: Invalid code, game deleted
   - Shows: "Game not found" screen

2. **Invalid move**
   - Happens if: Cell filled, wrong turn, game ended
   - Shows: Error message, board stays enabled

3. **Network error**
   - Happens if: Server unreachable, timeout
   - Shows: "Error making move" message

4. **Join failed (game full)**
   - Happens if: Two players already joined
   - Shows: Game state as spectator

---

## Performance Notes

- **Polling interval:** 1 second (configurable)
- **Board size:** 9 cells (fixed, no optimization needed)
- **State updates:** Only when data changes
- **Memory:** Polling cleanup on unmount prevents leaks
- **No external UI libraries:** Uses Tailwind CSS only

---

## Browser Support

- Modern browsers with ES2020+ support
- Uses `fetch` API (IE11+ with polyfill)
- Uses `useRef`, `useState`, `useEffect` hooks
- Dynamic routing via Next.js App Router

---

## Development Tips

**Debugging Game State:**
```typescript
// Add to component to log state changes
useEffect(() => {
  console.log('Game state:', game);
  console.log('Player symbol:', playerSymbol);
  console.log('Current turn:', game?.current_turn);
}, [game]);
```

**Testing Moves:**
1. Open two browser windows to same game
2. Click cell in window 1
3. Wait 1 second (polling)
4. Window 2 should update automatically

**Common Issues:**
- Board not updating: Check if polling is running (check browser network tab)
- Move fails: Check console for error, verify turn order
- Can't join: Likely game is full or already finished
