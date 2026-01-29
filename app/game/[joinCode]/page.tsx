'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Game {
  id: string;
  join_code: string;
  board: string[];
  current_turn: string;
  status: string;
  winner: string | null;
  player_x_id: string | null;
  player_o_id: string | null;
}

export default function GamePage() {
  const params = useParams();
  const joinCode = params.joinCode as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [makeMovePending, setMakeMovePending] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    joinGame();
  }, [joinCode]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`/api/games/${joinCode}`);
      const data = await response.json();
      
      if (response.ok) {
        setGame(data.game);
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  };

  const startPolling = () => {
    // Poll every 1 second for board updates
    pollingIntervalRef.current = setInterval(() => {
      fetchGameState();
    }, 1000);
  };

  const joinGame = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to join the game
      const response = await fetch(`/api/games/${joinCode}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setGame(data.game);
        setPlayerSymbol(data.playerSymbol);
        setPlayerId(data.playerId);
        startPolling(); // Start polling for updates
      } else {
        // If can't join (game full), just fetch game state
        const getResponse = await fetch(`/api/games/${joinCode}`);
        const getData = await getResponse.json();
        
        if (getResponse.ok) {
          setGame(getData.game);
          setError(data.error || 'Viewing game as spectator');
        } else {
          setError(getData.error || 'Game not found');
        }
      }
    } catch (err) {
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!game) return '';
    
    if (game.status === 'waiting') {
      return 'Waiting for another player to join...';
    }
    if (game.status === 'active') {
      const isMyTurn = game.current_turn === playerSymbol;
      return isMyTurn ? "Your turn!" : `${game.current_turn}'s turn`;
    }
    if (game.status === 'finished') {
      if (game.winner === 'draw') return "Game ended in a draw";
      return `Game over - ${game.winner} wins!`;
    }
    return '';
  };

  const handleCellClick = async (position: number) => {
    if (!playerId || !playerSymbol) {
      setError('Not a player in this game');
      return;
    }

    setMakeMovePending(true);

    try {
      const response = await fetch(`/api/games/${joinCode}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position,
          playerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGame(data.game);
        if (data.result) {
          setError(`Game Over: ${data.resultMessage}`);
        }
      } else {
        setError(data.error || 'Failed to make move');
      }
    } catch (err) {
      setError('Error making move');
    } finally {
      setMakeMovePending(false);
    }
  };

  const renderBoard = () => {
    if (!game) return null;

    return (
      <div className="grid grid-cols-3 gap-2 bg-gray-200 dark:bg-gray-600 p-2 rounded-lg">
        {game.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={
              game.status !== 'active' ||
              playerSymbol !== game.current_turn ||
              cell !== '' ||
              makeMovePending
            }
            className="w-20 h-20 bg-white dark:bg-gray-700 text-3xl font-bold rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
          >
            {cell}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-semibold text-gray-800 dark:text-white">Loading game...</div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">{error}</div>
          <a href="/" className="text-blue-600 hover:underline">Go back home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-6 p-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Tic-Tac-Toe
        </h1>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 min-w-[300px]">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Game Code: <span className="text-blue-600 dark:text-blue-400">{joinCode}</span>
            </p>
            {playerSymbol && (
              <p className="text-md text-gray-600 dark:text-gray-300 mt-2">
                You are Player: <span className="font-bold">{playerSymbol}</span>
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 mb-6">
            <p className="text-center text-gray-700 dark:text-gray-200 font-semibold">
              {getStatusMessage()}
            </p>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              Status: {game?.status}
            </p>
          </div>

          {game && renderBoard()}

          {game?.status === 'waiting' && !playerSymbol && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                Share this link with a friend to start playing!
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded">
              <p className="text-sm text-red-800 dark:text-red-200 text-center">
                {error}
              </p>
            </div>
          )}
        </div>

        <a 
          href="/" 
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Create new game
        </a>
      </div>
    </div>
  );
}
