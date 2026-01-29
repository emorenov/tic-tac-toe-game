import { TicTacToeLogic } from '../game-logic';
import { BoardCell } from '@/types/game';

/**
 * Manual test examples for the game logic
 * You can run these in the browser console or Node.js
 */
export function testGameLogic() {
  console.log('🎮 Testing Tic-Tac-Toe Logic...\n');

  // Test 1: Empty board
  console.log('Test 1: Empty Board');
  const emptyBoard = TicTacToeLogic.createEmptyBoard();
  console.log('Empty board:', emptyBoard);
  console.log('Is game over?', TicTacToeLogic.isGameOver(emptyBoard)); // false
  console.log('Available positions:', TicTacToeLogic.getAvailablePositions(emptyBoard));
  console.log('');

  // Test 2: Horizontal win
  console.log('Test 2: Horizontal Win (Top Row)');
  const horizontalWin: BoardCell[] = ['X', 'X', 'X', '', '', '', '', '', ''];
  const result1 = TicTacToeLogic.checkGameResult(horizontalWin);
  console.log('Board:', horizontalWin);
  console.log('Result:', result1); // 'X'
  console.log('Message:', TicTacToeLogic.getResultMessage(result1));
  console.log('');

  // Test 3: Diagonal win
  console.log('Test 3: Diagonal Win');
  const diagonalWin: BoardCell[] = ['O', '', '', '', 'O', '', '', '', 'O'];
  const result2 = TicTacToeLogic.checkGameResult(diagonalWin);
  console.log('Board:', diagonalWin);
  console.log('Result:', result2); // 'O'
  console.log('Message:', TicTacToeLogic.getResultMessage(result2));
  console.log('');

  // Test 4: Draw
  console.log('Test 4: Draw Game');
  const drawBoard: BoardCell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  const result3 = TicTacToeLogic.checkGameResult(drawBoard);
  console.log('Board:', drawBoard);
  console.log('Result:', result3); // 'draw'
  console.log('Message:', TicTacToeLogic.getResultMessage(result3));
  console.log('');

  // Test 5: Apply move
  console.log('Test 5: Apply Move');
  const board = TicTacToeLogic.createEmptyBoard();
  console.log('Before move:', board);
  const newBoard = TicTacToeLogic.applyMove(board, 4, 'X');
  console.log('After move at center (position 4):', newBoard);
  console.log('Original board unchanged?', board[4] === ''); // true (immutable)
  console.log('');

  // Test 6: Move validation
  console.log('Test 6: Move Validation');
  const testBoard: BoardCell[] = ['X', '', '', '', 'O', '', '', '', ''];
  console.log('Board:', testBoard);
  console.log('Can X move to position 1?', TicTacToeLogic.canMakeMove(testBoard, 1, 'X', 'X')); // true
  console.log('Can X move to position 0?', TicTacToeLogic.canMakeMove(testBoard, 0, 'X', 'X')); // false (occupied)
  console.log('Can O move to position 1 (but it\'s X\'s turn)?', TicTacToeLogic.canMakeMove(testBoard, 1, 'X', 'O')); // false
  console.log('');

  // Test 7: Turn switching
  console.log('Test 7: Turn Switching');
  console.log('Current turn: X, next turn:', TicTacToeLogic.switchTurn('X')); // 'O'
  console.log('Current turn: O, next turn:', TicTacToeLogic.switchTurn('O')); // 'X'
  console.log('');

  // Test 8: Join code generation
  console.log('Test 8: Join Code Generation');
  const code1 = TicTacToeLogic.generateJoinCode();
  const code2 = TicTacToeLogic.generateJoinCode();
  const code3 = TicTacToeLogic.generateJoinCode();
  console.log('Generated codes:', code1, code2, code3);
  console.log('All unique?', code1 !== code2 && code2 !== code3 && code1 !== code3);
  console.log('Valid format?', TicTacToeLogic.isValidJoinCode(code1));
  console.log('Invalid code test:', TicTacToeLogic.isValidJoinCode('abc')); // false
  console.log('');

  console.log('✅ All tests completed!');
}

// Uncomment to run tests immediately when imported
// testGameLogic();
