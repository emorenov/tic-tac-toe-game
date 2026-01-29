export type PlayerSymbol = 'X' | 'O';
export type GameStatus = 'waiting' | 'active' | 'finished';
export type BoardCell = '' | 'X' | 'O';
export type WinnerResult = PlayerSymbol | 'draw' | null;

export interface Game {
  id: string;
  joinCode: string;
  board: BoardCell[];
  currentTurn: PlayerSymbol;
  status: GameStatus;
  winner: WinnerResult;
  playerXId: string | null;
  playerOId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  gameId: string;
  playerSymbol: PlayerSymbol;
  playerName: string;
  isConnected: boolean;
  joinedAt: string;
}

export interface Move {
  gameId: string;
  playerId: string;
  position: number;
  symbol: PlayerSymbol;
}

export interface GameStateResponse {
  game: Game;
  players: Player[];
  mySymbol: PlayerSymbol | null;
  isMyTurn: boolean;
}
