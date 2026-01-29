import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/games/[joinCode]/join
 * 
 * Joins an existing game session. Assigns the player as either X or O
 * based on which slot is available. When the second player joins, 
 * the game status changes from "waiting" to "active".
 * 
 * @param {Promise<{joinCode: string}>} params - URL parameters
 * @param {string} params.joinCode - 6-character game join code (e.g., "ABC123")
 * 
 * @returns {Object} Response object
 * @returns {string} message - Confirmation message with assigned symbol
 * @returns {string} playerSymbol - Either "X" or "O"
 * @returns {string} playerId - UUID of the player
 * @returns {Object} game - Updated game object with player assigned
 * 
 * @example
 * // Request
 * POST /api/games/ABC123/join
 * 
 * // Response (200) - First player
 * {
 *   message: "You joined as Player X",
 *   playerSymbol: "X",
 *   playerId: "uuid-player1",
 *   game: { ... status: "waiting" ... }
 * }
 * 
 * // Response (200) - Second player
 * {
 *   message: "You joined as Player O",
 *   playerSymbol: "O",
 *   playerId: "uuid-player2",
 *   game: { ... status: "active" ... }
 * }
 * 
 * // Response (400)
 * { error: "Game is full" }
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

    // Find game by join code
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

    // Check if game is already full
    if (game.player_x_id && game.player_o_id) {
      return NextResponse.json(
        { error: 'Game is full' },
        { status: 400 }
      );
    }

    // Check if game is finished
    if (game.status === 'finished') {
      return NextResponse.json(
        { error: 'Game has ended' },
        { status: 400 }
      );
    }

    // Determine which symbol to assign
    let playerSymbol = 'X';
    let updateData: any = {};

    if (!game.player_x_id) {
      playerSymbol = 'X';
      updateData.player_x_id = crypto.randomUUID();
    } else if (!game.player_o_id) {
      playerSymbol = 'O';
      updateData.player_o_id = crypto.randomUUID();
      updateData.status = 'active'; // Game starts when second player joins
    }

    // Update game with player
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', game.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to join game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `You joined as Player ${playerSymbol}`,
      game: updatedGame,
      playerSymbol,
      playerId: playerSymbol === 'X' ? updatedGame.player_x_id : updatedGame.player_o_id
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
