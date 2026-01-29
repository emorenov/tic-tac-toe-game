import { BoardCell, PlayerSymbol, WinnerResult } from '@/types/game';

export class TicTacToeLogic {
  /**
   * All possible winning combinations on a 3x3 board
   */
  private static readonly WIN_PATTERNS: number[][] = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6], // Diagonal top-right to bottom-left
  ];

  /**
   * Generate a random 6-character alphanumeric join code
   */
  static generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    return code;
  }

  /**
   * Create an empty board (9 cells, all empty strings)
   */
  static createEmptyBoard(): BoardCell[] {
    return Array(9).fill('') as BoardCell[];
  }

  /**
   * Check if a position on the board is valid and empty
   */
  static isValidPosition(board: BoardCell[], position: number): boolean {
    return position >= 0 && position <= 8 && board[position] === '';
  }

  /**
   * Check if it's the current player's turn
   */
  static isPlayerTurn(currentTurn: PlayerSymbol, playerSymbol: PlayerSymbol): boolean {
    return currentTurn === playerSymbol;
  }

  /**
   * Validate if a move can be made
   */
  static canMakeMove(
    board: BoardCell[],
    position: number,
    currentTurn: PlayerSymbol,
    playerSymbol: PlayerSymbol
  ): boolean {
    return (
      this.isValidPosition(board, position) &&
      this.isPlayerTurn(currentTurn, playerSymbol)
    );
  }

  /**
   * Apply a move to the board (returns new board, immutable)
   */
  static applyMove(board: BoardCell[], position: number, symbol: PlayerSymbol): BoardCell[] {
    const newBoard = [...board];
    newBoard[position] = symbol;
    return newBoard as BoardCell[];
  }

  /**
   * Check for a winner or draw
   */
  static checkGameResult(board: BoardCell[]): WinnerResult {
    // Check all winning patterns
    for (const pattern of this.WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as PlayerSymbol;
      }
    }

    // Check for draw (all cells filled, no winner)
    const isBoardFull = board.every(cell => cell !== '');
    if (isBoardFull) {
      return 'draw';
    }

    // Game still in progress
    return null;
  }

  /**
   * Get the next player's turn
   */
  static switchTurn(currentTurn: PlayerSymbol): PlayerSymbol {
    return currentTurn === 'X' ? 'O' : 'X';
  }

  /**
   * Get the opposite symbol
   */
  static getOppositeSymbol(symbol: PlayerSymbol): PlayerSymbol {
    return symbol === 'X' ? 'O' : 'X';
  }

  /**
   * Check if game is over
   */
  static isGameOver(board: BoardCell[]): boolean {
    const result = this.checkGameResult(board);
    return result !== null;
  }

  /**
   * Get available positions on the board
   */
  static getAvailablePositions(board: BoardCell[]): number[] {
    return board
      .map((cell, index) => (cell === '' ? index : -1))
      .filter(index => index !== -1);
  }

  /**
   * Format game result message
   */
  static getResultMessage(result: WinnerResult): string {
    if (result === 'draw') {
      return "It's a draw!";
    }
    if (result) {
      return `Player ${result} wins!`;
    }
    return 'Game in progress';
  }

  /**
   * Validate join code format
   */
  static isValidJoinCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
  }
}
