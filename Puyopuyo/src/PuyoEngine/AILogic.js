/**
 * AIが次にどの手を指すかを考えるメイン関数。
 * 待機ぷよを考慮した2手読みを行う。
 * @param {PuyoLogic} puyoLogic - 現在のゲームロジックのインスタンス。
 * @returns {object} - 最も評価の高い手 { rotation: 回転の回数, x: 目標のX座標 }。
 */
export function thinkNextMove(puyoLogic) {
  // --- AIの賢さと思考時間に関わる設定 ---
  // 候補手をいくつに絞るか。数を増やすとAIは強くなりますが、処理が重くなります。(推奨: 3〜5)
  const BEAM_WIDTH = 4; 

  const currentPuyo = puyoLogic.currentPuyo;
  
  // --- 待機ぷよ（ネクストぷよ）の取得 ---
  // PuyoLogic.jsの実装より、pop()で現在のぷよを取り出すため、
  // 次のぷよは配列の末尾から2番目になります。
  if (puyoLogic.nextTsumos.length < 2) {
    // ぷよが足りない場合は、とりあえず現在のぷよだけで判断
    return findBestMoveForPuyo(puyoLogic.board, currentPuyo).move;
  }
  const nextPuyo = puyoLogic.nextTsumos[puyoLogic.nextTsumos.length - 2];

  // --- ステップ1：現在のぷよの全パターンを評価し、有望な候補手を絞り込む ---
  const candidateMoves = findBestCandidateMoves(puyoLogic.board, currentPuyo, BEAM_WIDTH);

  if (candidateMoves.length === 0) {
    return { rotation: 0, x: 2 }; // 万が一有効な手がない場合
  }

  // --- ステップ2：各候補手について、待機ぷよを置いた未来を評価する ---
  let bestMove = candidateMoves[0].move; // 最善手（仮）
  let maxFinalScore = -Infinity;

  for (const candidate of candidateMoves) {
    const boardAfterMove1 = candidate.boardAfterMove;
    
    // 待機ぷよを置いた場合に得られる最高の評価点を計算
    const bestMoveForNextPuyo = findBestMoveForPuyo(boardAfterMove1, nextPuyo);
    
    // 最終スコア = 1手目の評価点 + 2手目の最高評価点
    // これにより、未来が最も有望な1手目を探す
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
 * @param {Array<Array<number>>} board
 * @param {object} puyo
 * @returns {{move: object, score: number}}
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
 * @param {Array<Array<number>>} board
 * @param {object} puyo
 * @param {number} count - 候補手の数
 * @returns {Array<{move: object, score: number, boardAfterMove: Array<Array<number>>}>}
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


// ##############################################
// ### AIの評価関数とシミュレーション用ヘルパー関数 ###
// ##############################################

/**
 * 盤面を評価し、「連鎖」につながる形にボーナスを与える
 */
function calculateChainPotential(board) {
    let potentialScore = 0;
    const visited = new Set();
    const height = board.length;
    const width = board[0].length;

    for (let y = 2; y < height; y++) {
        for (let x = 0; x < width; x++) {
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

/**
 * 盤面状態を点数化する評価関数
 */
function evaluate(board, chainCount, clearedCount) {
    let score = 0;
    if (chainCount > 0) {
        score += Math.pow(chainCount, 3) * 100;
        score += clearedCount * 20;
        return score;
    }
    score += calculateChainPotential(board);
    let maxHeight = 0;
    let deadSpaces = 0;
    const height = board.length;
    const width = board[0].length;
    for (let x = 0; x < width; x++) {
        for (let y = 2; y < height; y++) {
            if (board[y][x] !== 0) {
                const colHeight = height - y;
                if (colHeight > maxHeight) maxHeight = colHeight;
                for (let under_y = y + 1; under_y < height; under_y++) {
                    if (board[under_y][x] === 0) deadSpaces++;
                }
                break;
            }
        }
    }
    if (maxHeight > 3) {
        score -= Math.pow(maxHeight, 2.8);
    }
    if (maxHeight > 8) {
        score -= 350;
    }
    score -= deadSpaces * 40;
    return score;
}

// --- 以下、PuyoLogic.jsから移植・改造したシミュレーション用関数 ---

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