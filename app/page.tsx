'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Error creating game. Please try again.');
      }
    } catch (error) {
      setMessage('Error creating game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Tic-Tac-Toe Multiplayer
        </h1>
        
        <button
          onClick={handleCreateGame}
          disabled={loading}
          className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md max-w-md">
            <p className="text-gray-800 dark:text-white break-words">{message}</p>
          </div>
        )}
      </main>
    </div>
  );
}
