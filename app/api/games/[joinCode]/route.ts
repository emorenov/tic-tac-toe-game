import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/games/[joinCode]
 * 
 * Fetches the current state of a game by join code.
 * Used for polling to keep both players' boards in sync.
 * 
 * @param {Promise<{joinCode: string}>} params - URL parameters
 * @param {string} params.joinCode - 6-character game join code (e.g., "ABC123")
 * 
 * @returns {Object} Response object
 * @returns {Object} game - Complete current game state
 * 
 * @example
 * // Request
 * GET /api/games/ABC123
 * 
 * // Response (200)
 * {
 *   game: {
 *     id: "550e8400-e29b-41d4-a716-446655440000",
 *     join_code: "ABC123",
 *     board: ["X", "", "", "", "O", "", "", "", ""],
 *     current_turn: "X",
 *     status: "active",
 *     winner: null,
 *     player_x_id: "uuid-player1",
 *     player_o_id: "uuid-player2"
 *   }
 * }
 * 
 * // Response (404)
 * { error: "Game not found" }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  try {
    const { joinCode } = await params;

    // Find game by join code
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('join_code', joinCode)
      .single();

    if (error || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}
