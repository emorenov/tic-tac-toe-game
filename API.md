# API Documentation

Complete API reference for the Tic-Tac-Toe Multiplayer Game.

---

## Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/games` | Create a new game |
| GET | `/api/games/[joinCode]` | Get game state |
| POST | `/api/games/[joinCode]/join` | Join an existing game |
| POST | `/api/games/[joinCode]/move` | Make a move |

---

## Endpoints

### 1. Create Game

**Endpoint:** `POST /api/games`

Creates a new tic-tac-toe game session with a unique join code.

**Request:**
```bash
curl -X POST http://localhost:3000/api/games
```

**Response (200 OK):**
```json
{
  "message": "Game created! Share this code: ABC123 or link: http://localhost:3000/game/ABC123",
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "joinCode": "ABC123",
  "gameUrl": "http://localhost:3000/game/ABC123",
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["", "", "", "", "", "", "", "", ""],
    "current_turn": "X",
    "status": "waiting",
    "winner": null,
    "player_x_id": null,
    "player_o_id": null,
    "created_at": "2026-01-29T10:00:00.000Z",
    "updated_at": "2026-01-29T10:00:00.000Z"
  }
}
```

**Error Response (500):**
```json
{
  "error": "Failed to create game"
}
```

---

### 2. Get Game State

**Endpoint:** `GET /api/games/[joinCode]`

Fetches the current state of a game. Used for polling to keep both players' boards synchronized.

**Request:**
```bash
curl http://localhost:3000/api/games/ABC123
```

**Parameters:**
- `joinCode` (string, required) - 6-character game code from create game response

**Response (200 OK):**
```json
{
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["X", "", "", "", "O", "", "", "", ""],
    "current_turn": "X",
    "status": "active",
    "winner": null,
    "player_x_id": "uuid-player1",
    "player_o_id": "uuid-player2",
    "created_at": "2026-01-29T10:00:00.000Z",
    "updated_at": "2026-01-29T10:05:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Game not found"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch game"
}
```

---

### 3. Join Game

**Endpoint:** `POST /api/games/[joinCode]/join`

Joins an existing game. Automatically assigns the player as either X (first player) or O (second player). When the second player joins, the game status changes from "waiting" to "active".

**Request:**
```bash
curl -X POST http://localhost:3000/api/games/ABC123/join
```

**Parameters:**
- `joinCode` (string, required) - 6-character game code

**Response (200 OK) - First Player:**
```json
{
  "message": "You joined as Player X",
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["", "", "", "", "", "", "", "", ""],
    "current_turn": "X",
    "status": "waiting",
    "winner": null,
    "player_x_id": "uuid-player1",
    "player_o_id": null
  },
  "playerSymbol": "X",
  "playerId": "uuid-player1"
}
```

**Response (200 OK) - Second Player:**
```json
{
  "message": "You joined as Player O",
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["", "", "", "", "", "", "", "", ""],
    "current_turn": "X",
    "status": "active",
    "winner": null,
    "player_x_id": "uuid-player1",
    "player_o_id": "uuid-player2"
  },
  "playerSymbol": "O",
  "playerId": "uuid-player2"
}
```

**Error Response (400) - Game Full:**
```json
{
  "error": "Game is full"
}
```

**Error Response (400) - Game Finished:**
```json
{
  "error": "Game has ended"
}
```

**Error Response (404):**
```json
{
  "error": "Game not found"
}
```

---

### 4. Make Move

**Endpoint:** `POST /api/games/[joinCode]/move`

Makes a move in an active game. Validates the move, updates the board, and automatically detects game end conditions (win/draw).

**Request:**
```bash
curl -X POST http://localhost:3000/api/games/ABC123/move \
  -H "Content-Type: application/json" \
  -d '{
    "position": 4,
    "playerId": "uuid-player1"
  }'
```

**Parameters:**
- `joinCode` (string, required) - 6-character game code
- `position` (number, required) - Board position (0-8)
- `playerId` (string, required) - UUID of the player making the move

**Board Position Layout:**
```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

**Response (200 OK) - Move Successful (Game Continues):**
```json
{
  "message": "Move successful",
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["", "", "", "", "X", "", "", "", ""],
    "current_turn": "O",
    "status": "active",
    "winner": null,
    "player_x_id": "uuid-player1",
    "player_o_id": "uuid-player2"
  },
  "result": null,
  "resultMessage": "Game in progress"
}
```

**Response (200 OK) - Move Successful (X Wins):**
```json
{
  "message": "Move successful",
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "join_code": "ABC123",
    "board": ["X", "X", "X", "O", "O", "", "", "", ""],
    "current_turn": "O",
    "status": "finished",
    "winner": "X",
    "player_x_id": "uuid-player1",
    "player_o_id": "uuid-player2"
  },
  "result": "X",
  "resultMessage": "Player X wins!"
}
```

**Response (200 OK) - Move Successful (Draw):**
```json
{
  "message": "Move successful",
  "game": {
    "board": ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
    "current_turn": "O",
    "status": "finished",
    "winner": "draw"
  },
  "result": "draw",
  "resultMessage": "It's a draw!"
}
```

**Error Response (400) - Invalid Position:**
```json
{
  "error": "Invalid position"
}
```

**Error Response (400) - Cell Already Occupied:**
```json
{
  "error": "Invalid move"
}
```

**Error Response (400) - Not Your Turn:**
```json
{
  "error": "Invalid move"
}
```

**Error Response (400) - Game Not Active:**
```json
{
  "error": "Game is not active"
}
```

**Error Response (403) - Invalid Player:**
```json
{
  "error": "Invalid player"
}
```

**Error Response (404):**
```json
{
  "error": "Game not found"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to make move"
}
```

---

## Game States

| Status | Description |
|--------|-------------|
| `waiting` | Game created, waiting for second player to join |
| `active` | Both players joined, game is being played |
| `finished` | Game ended (someone won or draw) |

## Winner Values

| Value | Description |
|-------|-------------|
| `null` | Game still in progress |
| `"X"` | Player X won |
| `"O"` | Player O won |
| `"draw"` | Board full, no winner |

---

## Data Types

### Game Object

```typescript
interface Game {
  id: string;                    // UUID
  join_code: string;             // 6-char code
  board: string[];               // 9 elements: "", "X", or "O"
  current_turn: string;          // "X" or "O"
  status: string;                // "waiting" | "active" | "finished"
  winner: string | null;         // "X" | "O" | "draw" | null
  player_x_id: string | null;    // UUID of X player
  player_o_id: string | null;    // UUID of O player
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

---

## Example Workflow

### 1. Player 1 Creates Game
```bash
POST /api/games
→ Response: gameId, joinCode, gameUrl
```

### 2. Player 1 Shares Code/URL with Player 2

### 3. Player 2 Joins Game
```bash
POST /api/games/ABC123/join
→ Response: playerSymbol="O", game.status changes to "active"
```

### 4. Both Players Poll for Updates
```bash
GET /api/games/ABC123  (every 1 second)
```

### 5. Player X Makes First Move
```bash
POST /api/games/ABC123/move
Body: { position: 4, playerId: "uuid-player1" }
→ Response: updated board, current_turn="O"
```

### 6. Player O Makes Move
```bash
POST /api/games/ABC123/move
Body: { position: 0, playerId: "uuid-player2" }
→ Response: updated board, current_turn="X"
```

### 7. Players Continue Until Win/Draw
```bash
POST /api/games/ABC123/move
→ Response: status="finished", winner="X"
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid input, move not allowed) |
| 403 | Forbidden (not a player in this game) |
| 404 | Not found (game doesn't exist) |
| 500 | Server error |

---

## Notes

- All timestamps are ISO 8601 format
- Board array is 0-indexed (positions 0-8)
- Join codes are 6 characters (alphanumeric)
- Player IDs are UUIDs generated server-side
- No authentication required (happy path)
- Real-time sync via client-side polling (1-second intervals)
