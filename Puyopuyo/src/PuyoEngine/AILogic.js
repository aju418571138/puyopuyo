/**
 * AIが次にどの手を指すかを考えるメイン関数。
 * 待機ぷよを考慮した2手読みを行う。
 */
export function thinkNextMove(puyoLogic) {
  const BEAM_WIDTH = 4;
  const currentPuyo = puyoLogic.currentPuyo;

  if (puyoLogic.nextTsumos.length < 2) {
    return findBestMoveForPuyo(puyoLogic.board, currentPuyo).move;
  }
  const nextPuyo = puyoLogic.nextTsumos[puyoLogic.nextTsumos.length - 2];

  const candidateMoves = findBestCandidateMoves(puyoLogic.board, currentPuyo, BEAM_WIDTH);

  if (candidateMoves.length === 0) {
    return { rotation: 0, x: 2 };
  }

  let bestMove = candidateMoves[0].move;
  let maxFinalScore = -Infinity;

  for (const candidate of candidateMoves) {
    const boardAfterMove1 = candidate.boardAfterMove;
    const bestMoveForNextPuyo = findBestMoveForPuyo(boardAfterMove1, nextPuyo);
    const finalScore = candidate.score + bestMoveForNextPuyo.score;

    if (finalScore > maxFinalScore) {
      maxFinalScore = finalScore;
      bestMove = candidate.move;
    }
  }
  return bestMove;
}

/**
 * 特定のぷよと盤面に対して、最も評価の高い手を返す
 */
function findBestMoveForPuyo(board, puyo) {
    let bestMove = { rotation: 0, x: 2 };
    let maxScore = -Infinity;

    const allPossibleMoves = generatePossibleMoves({ board, width: board[0].length });
    for (const move of allPossibleMoves) {
        const simBoard = JSON.parse(JSON.stringify(board));
        const landedY = getLandedY(simBoard, puyo, move);
        if (landedY < 0) continue;

        placePuyo(simBoard, puyo, move.x, landedY, move.rotation);
        const chainResult = simulateChain(simBoard);
        const score = evaluate(simBoard, chainResult.chainCount, chainResult.clearedCount);

        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }
    return { move: bestMove, score: maxScore };
}

/**
 * 特定のぷよと盤面に対して、評価の高い候補手をいくつか返す
 */
function findBestCandidateMoves(board, puyo, count) {
    let moveEvaluations = [];
    const allPossibleMoves = generatePossibleMoves({ board, width: board[0].length });

    for (const move of allPossibleMoves) {
        const simBoard = JSON.parse(JSON.stringify(board));
        const landedY = getLandedY(simBoard, puyo, move);
        if (landedY < 0) continue;

        placePuyo(simBoard, puyo, move.x, landedY, move.rotation);
        const chainResult = simulateChain(simBoard);
        const score = evaluate(simBoard, chainResult.chainCount, chainResult.clearedCount);
        moveEvaluations.push({ move, score, boardAfterMove: simBoard });
    }

    moveEvaluations.sort((a, b) => b.score - a.score);
    return moveEvaluations.slice(0, count);
}


// #################################################
// ### GTR特化型AIの頭脳：新しい評価関数 ##############
// #################################################

/**
 * GTRの形になっているかを評価し、スコアを返す (解説の「完成度スコア」に相当)
 * @param {Array<Array<number>>} board
 * @returns {number} GTRの完成度に応じたスコア
 */
function calculateGTRScore(board) {
    const height = board.length;
    const H = height - 1; // 一番下の行のインデックス
    let score = 0;

    // GTRのキーとなるぷよの色を特定 (2列目の底)
    const keyColor = board[H][1];
    if (keyColor === 0) return 0; // GTRの土台がまだない

    // GTR基本構造のチェック
    // 1. (1, H-1)がキーぷよと同じ色か (発火点の真上)
    if (board[H - 1][1] === keyColor) score += 200;
    // 2. (2, H) のぷよがキーぷよと違う色か (折り返しの土台)
    if (board[H][2] !== 0 && board[H][2] !== keyColor) score += 150;
    // 3. (2, H-1)が(2,H)と同じ色か (折り返しの壁)
    if (board[H][2] !== 0 && board[H - 1][2] === board[H][2]) score += 250;
    // 4. (2, H-2)が(2,H)と同じ色か (折り返しの壁)
    if (board[H][2] !== 0 && board[H - 2][2] === board[H][2]) score += 300;

    // 発火点(1, H-2)が空いているかは最重要
    if (board[H - 2][1] === 0) {
        score += 500; // 発火点が空いていれば超高評価
    } else if (board[H - 2][1] === keyColor) {
        score -= 100; // 発火点にキーぷよを置くのはまだ早い（暴発の可能性）
    } else {
        score -= 2000; // 発火点が違う色で埋まっていたら致命的なので超減点
    }
    
    return score;
}


/**
 * 盤面状態を点数化する評価関数 (GTR特化版)
 */
function evaluate(board, chainCount, clearedCount) {
    // 即時的な利益：連鎖が発生したら、それが最優先
    if (chainCount > 0) {
        return 10000 * chainCount; // GTR構築より連鎖を優先
    }

    // --- GTRの評価基準 ---
    // 1. GTR完成度スコア
    let score = calculateGTRScore(board);

    // 2. 伸ばし余地：右側のスペースが空いているかを評価
    let rightSideMaxHeight = 0;
    for (let x = 3; x < board[0].length; x++) {
        for (let y = 2; y < board.length; y++) {
            if (board[y][x] !== 0) {
                const colHeight = board.length - y;
                if (colHeight > rightSideMaxHeight) {
                    rightSideMaxHeight = colHeight;
                }
                break;
            }
        }
    }
    score -= Math.pow(rightSideMaxHeight, 2) * 5; // 右側が高いほど減点

    // 3. 連鎖ポテンシャル（右側のみを対象）
    score += calculateChainPotential(board, 3); // 3列目以降を評価

    // 4. 全体のリスク評価
    let maxHeight = 0;
    // ... (maxHeightを計算するロジックは省略)
    if (rightSideMaxHeight > maxHeight) maxHeight = rightSideMaxHeight;
    
    if (maxHeight > 8) {
        score -= Math.pow(maxHeight, 3);
    }

    return score;
}

/**
 * 盤面を評価し、「連鎖」につながる形にボーナスを与える（評価範囲の指定を追加）
 * @param {Array<Array<number>>} board
 * @param {number} startCol - 評価を開始する列のインデックス
 */
function calculateChainPotential(board, startCol = 0) {
    let potentialScore = 0;
    const visited = new Set();
    const height = board.length;
    const width = board[0].length;

    for (let y = 2; y < height; y++) {
        for (let x = startCol; x < width; x++) {
            const puyoColor = board[y][x];
            if (puyoColor === 0) continue;
            if (y < height - 1) {
                const underPuyoColor = board[y + 1][x];
                if (underPuyoColor !== 0 && puyoColor !== underPuyoColor) {
                    potentialScore += 20;
                }
            }
            const key = `${x},${y}`;
            if (!visited.has(key)) {
                const connected = findConnectedPuyos(board, x, y, visited);
                if (connected.length === 3) {
                    const groupCenterY = connected.reduce((sum, p) => sum + p.y, 0) / 3;
                    potentialScore += Math.pow(height - groupCenterY, 2);
                }
            }
        }
    }
    return potentialScore;
}


// --- 以下、シミュレーション用ヘルパー関数群 ---
// (generatePossibleMoves, getLandedY, placePuyo, isPositionValid, checkCollision, 
//  simulateChain, checkAndFindClearPuyos, findConnectedPuyos, applyGravity, getChildPuyoPosition)
function generatePossibleMoves(puyoLogic) {
  const moves = [];
  for (let rotation = 0; rotation < 4; rotation++) {
    for (let x = 0; x < puyoLogic.width; x++) {
      const childPos = getChildPuyoPosition(x, 0, rotation);
      if (childPos.x >= 0 && childPos.x < puyoLogic.width) {
        moves.push({ rotation, x });
      }
    }
  }
  return moves;
}

function getLandedY(board, puyo, move) {
    let y = 1;
    while (isPositionValid(board, move.x, y + 1, move.rotation)) {
        y++;
    }
    return y;
}

function placePuyo(board, puyo, x, y, rotation) {
  if (y >= 2) board[y][x] = puyo.color1;
  const childPos = getChildPuyoPosition(x, y, rotation);
  if (childPos.y >= 2) board[childPos.y][childPos.x] = puyo.color2;
}

function isPositionValid(board, x, y, rotation) {
  if (checkCollision(board, x, y)) return false;
  const childPos = getChildPuyoPosition(x, y, rotation);
  if (checkCollision(board, childPos.x, childPos.y)) return false;
  return true;
}

function checkCollision(board, puyoX, puyoY) {
  const height = board.length;
  const width = board[0].length;
  if (puyoX < 0 || puyoX >= width || puyoY >= height) return true;
  if (puyoY < 0) return false;
  if (board[puyoY][puyoX] !== 0) return true;
  return false;
}

function simulateChain(board) {
  let chainCount = 0;
  let clearedCount = 0;
  while (true) {
    const puyosToClear = checkAndFindClearPuyos(board);
    if (puyosToClear.size > 0) {
      chainCount++;
      clearedCount += puyosToClear.size;
      puyosToClear.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        board[y][x] = 0;
      });
      applyGravity(board);
    } else {
      break;
    }
  }
  return { chainCount, clearedCount };
}

function checkAndFindClearPuyos(board) {
  const puyosToClear = new Set();
  const checked = new Set();
  for (let y = 2; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const key = `${x},${y}`;
      if (board[y][x] !== 0 && !checked.has(key)) {
        const connected = findConnectedPuyos(board, x, y, new Set()); // 毎回新しいSetでチェック
        if (connected.length >= 4) {
          connected.forEach(p => puyosToClear.add(`${p.x},${p.y}`));
        }
        connected.forEach(p => checked.add(`${p.x},${p.y}`));
      }
    }
  }
  return puyosToClear;
}

function findConnectedPuyos(board, startX, startY, visited) {
  const targetColor = board[startY][startX];
  if (targetColor === 0) return [];
  const connected = [];
  const queue = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    connected.push({ x, y });
    const neighbors = [{ x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y }];
    for (const neighbor of neighbors) {
      const nx = neighbor.x;
      const ny = neighbor.y;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && !visited.has(key) && board[ny][nx] === targetColor) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return connected;
}

function applyGravity(board) {
    const height = board.length;
    const width = board[0].length;
    for (let x = 0; x < width; x++) {
      let emptyRow = -1;
      for (let y = height - 1; y >= 0; y--) {
          if (board[y][x] === 0 && emptyRow === -1) {
              emptyRow = y;
          } else if (board[y][x] !== 0 && emptyRow !== -1) {
              board[emptyRow][x] = board[y][x];
              board[y][x] = 0;
              emptyRow--;
          }
      }
    }
}

function getChildPuyoPosition(x, y, rotation) {
  switch (rotation) {
    case 0: return { x: x, y: y - 1 };
    case 1: return { x: x + 1, y: y };
    case 2: return { x: x, y: y + 1 };
    case 3: return { x: x - 1, y: y };
    default: return { x, y };
  }
}