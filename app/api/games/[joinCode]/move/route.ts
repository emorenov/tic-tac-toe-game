import { NextResponse } from 'next/server';
import { TicTacToeLogic } from '@/lib/game-logic';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/games/[joinCode]/move
 * 
 * Makes a move in an active game. Validates that:
 * - The move is legal (cell is empty, position 0-8)
 * - It's the player's turn
 * - The player is registered in the game
 * - The game is active
 * 
 * Automatically detects game end (win/draw) and updates status.
 * 
 * @param {Promise<{joinCode: string}>} params - URL parameters
 * @param {string} params.joinCode - 6-character game join code
 * @param {Object} body - Request body
 * @param {number} body.position - Board position (0-8): 
 *                                   0|1|2
 *                                   -----
 *                                   3|4|5
 *                                   -----
 *                                   6|7|8
 * @param {string} body.playerId - UUID of the player making the move
 * 
 * @returns {Object} Response object
 * @returns {string} message - "Move successful"
 * @returns {Object} game - Updated game state
 * @returns {string|null} result - "X", "O", "draw", or null
 * @returns {string} resultMessage - Human-readable result message
 * 
 * @example
 * // Request
 * POST /api/games/ABC123/move
 * {
 *   "position": 4,
 *   "playerId": "uuid-player1"
 * }
 * 
 * // Response (200) - Move successful, game continues
 * {
 *   message: "Move successful",
 *   result: null,
 *   resultMessage: "Game in progress",
 *   game: {
 *     board: ["", "", "", "", "X", "", "", "", ""],
 *     current_turn: "O",
 *     status: "active",
 *     winner: null
 *   }
 * }
 * 
 * // Response (200) - Move successful, game ends (X wins)
 * {
 *   message: "Move successful",
 *   result: "X",
 *   resultMessage: "Player X wins!",
 *   game: {
 *     status: "finished",
 *     winner: "X"
 *   }
 * }
 * 
 * // Response (400) - Invalid move
 * { error: "Invalid move" }
 * 
 * // Response (403) - Not a player in this game
 * { error: "Invalid player" }
 * 
 * // Response (404)
 * { error: "Game not found" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  try {
    const { joinCode } = await params;
    const { position, playerId } = await request.json();

    // Validate position
    if (typeof position !== 'number' || position < 0 || position > 8) {
      return NextResponse.json(
        { error: 'Invalid position' },
        { status: 400 }
      );
    }

    // Fetch game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('join_code', joinCode)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game is active
    if (game.status !== 'active') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      );
    }

    // Determine player symbol from ID
    let playerSymbol: 'X' | 'O';
    if (playerId === game.player_x_id) {
      playerSymbol = 'X';
    } else if (playerId === game.player_o_id) {
      playerSymbol = 'O';
    } else {
      return NextResponse.json(
        { error: 'Invalid player' },
        { status: 403 }
      );
    }

    // Validate move using game logic
    const canMove = TicTacToeLogic.canMakeMove(
      game.board,
      position,
      game.current_turn,
      playerSymbol
    );

    if (!canMove) {
      return NextResponse.json(
        { error: 'Invalid move' },
        { status: 400 }
      );
    }

    // Apply move to board
    const newBoard = TicTacToeLogic.applyMove(game.board, position, playerSymbol);

    // Check for winner or draw
    const result = TicTacToeLogic.checkGameResult(newBoard);

    // Prepare update data
    const updateData: any = {
      board: newBoard,
      current_turn: TicTacToeLogic.switchTurn(game.current_turn),
    };

    // If game is over, update status and winner
    if (result !== null) {
      updateData.status = 'finished';
      updateData.winner = result;
    }

    // Update game in database
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', game.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Move successful',
      game: updatedGame,
      result: result,
      resultMessage: TicTacToeLogic.getResultMessage(result),
    });
  } catch (error) {
    console.error('Error making move:', error);
    return NextResponse.json(
      { error: 'Failed to make move' },
      { status: 500 }
    );
  }
}
