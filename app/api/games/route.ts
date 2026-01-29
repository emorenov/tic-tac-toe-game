import { NextResponse } from 'next/server';
import { TicTacToeLogic } from '@/lib/game-logic';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/games
 * 
 * Creates a new tic-tac-toe game session.
 * 
 * @returns {Object} Response object
 * @returns {string} message - User-friendly message about the created game
 * @returns {string} gameId - UUID of the created game
 * @returns {string} joinCode - 6-character code to share with other player
 * @returns {string} gameUrl - Full URL to share with other player
 * @returns {Object} game - Complete game object from database
 * 
 * @example
 * // Request
 * POST /api/games
 * 
 * // Response (200)
 * {
 *   message: "Game created! Share this code: ABC123 or link: http://localhost:3000/game/ABC123",
 *   gameId: "550e8400-e29b-41d4-a716-446655440000",
 *   joinCode: "ABC123",
 *   gameUrl: "http://localhost:3000/game/ABC123",
 *   game: {
 *     id: "550e8400-e29b-41d4-a716-446655440000",
 *     join_code: "ABC123",
 *     board: ["", "", "", "", "", "", "", "", ""],
 *     current_turn: "X",
 *     status: "waiting",
 *     winner: null,
 *     player_x_id: null,
 *     player_o_id: null,
 *     created_at: "2026-01-29T10:00:00Z"
 *   }
 * }
 */
export async function POST() {
  try {
    // Generate unique join code
    const joinCode = TicTacToeLogic.generateJoinCode();
    const emptyBoard = TicTacToeLogic.createEmptyBoard();
    
    // Determine the app URL (Vercel sets VERCEL_URL, fallback to NEXT_PUBLIC_APP_URL)
    const appUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Create game in database
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        join_code: joinCode,
        board: emptyBoard,
        current_turn: 'X',
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create game in database' },
        { status: 500 }
      );
    }

    const gameUrl = `${appUrl}/game/${joinCode}`;
    
    return NextResponse.json({
      message: `Game created! Share this code: ${joinCode} or link: ${gameUrl}`,
      gameId: game.id,
      joinCode: joinCode,
      gameUrl: gameUrl,
      game: game
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
