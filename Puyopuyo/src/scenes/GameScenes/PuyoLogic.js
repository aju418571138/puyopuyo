export class Grid {
    
}

// 盤面のサイズを定義
const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 12;

// 盤面の初期状態（すべて空っぽ=0）を生成
export const board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

// 操作中のぷよの初期データ
export let currentPuyo = {
  x: 2,
  y: 0,
  color1: 1,
  color2: 2,
  rotation:0, 
};

// ゲームのロジックに関する関数は、今後ここに追加していく

/**
 * ぷよを左に1マス動かす関数
 */
export function movePuyoLeft() {
  // 壁にぶつからないかチェック
  if (currentPuyo.x > 0) {
    currentPuyo.x--;
  }
}

/**
 * ぷよを右に1マス動かす関数
 */
export function movePuyoRight() {
  // 壁にぶつからないかチェック
  if (currentPuyo.x < BOARD_WIDTH - 1) {
    currentPuyo.x++;
  }
}

/**
 * ぷよを時計回りに90度回転させる関数
 */
export function rotatePuyo() {
  currentPuyo.rotation = (currentPuyo.rotation + 1) % 4;
}

/**
 * ぷよを反時計回りに90度回転させる関数
 */
export function rotatePuyoCounterClockwise() {
  // 0から-1になった時に、ちゃんと3に戻すための計算
  currentPuyo.rotation = (currentPuyo.rotation - 1 + 4) % 4;
}

/**
 * ぷよが指定した座標に移動できるかチェックする関数 (衝突判定)
 * @param {number} puyoX - ぷよのX座標
 * @param {number} puyoY - ぷよのY座標
 * @returns {boolean} - 移動できなければtrue (衝突), 移動できればfalse
 */
function checkCollision(puyoX, puyoY) {
  // 盤面の範囲外かどうかをチェック
  if (puyoX < 0 || puyoX >= BOARD_WIDTH || puyoY >= BOARD_HEIGHT) {
    return true; // 壁や床に衝突
  }
  // 盤面にすでにぷよがあるかをチェック
  if (board[puyoY][puyoX] !== 0) {
    return true; // 他ぷよに衝突
  }
  return false; // 衝突なし
}

/**
 * 操作ぷよを盤面に固定（着地）させる関数
 */
function landPuyo() {
  const { x, y, color1, color2, rotation } = currentPuyo;
  
  // 軸ぷよと子ぷよを盤面に書き込む
  board[y][x] = color1;
  switch (rotation) {
    case 0: board[y - 1][x] = color2; break;
    case 1: board[y][x + 1] = color2; break;
    case 2: board[y + 1][x] = color2; break;
    case 3: board[y][x - 1] = color2; break;
  }

  // ✨着地後に、ぷよを消す処理を呼び出す
  checkAndClearPuyos();
}

/**
 * 新しいぷよを生成する関数
 */
function spawnNewPuyo() {
  currentPuyo.x = 2;
  currentPuyo.y = 0;
  currentPuyo.rotation = 0;
  currentPuyo.color1 = Math.floor(Math.random() * 3) + 1; // 1〜3の色をランダムに
  currentPuyo.color2 = Math.floor(Math.random() * 3) + 1;
}

/**
 * ぷよを1マス落下させるメインの関数
 */
export function fallOneStep() {
  const { x, y, rotation } = currentPuyo;
  let isCollided = false;

  // 軸ぷよと子ぷよ、両方の着地先をチェック
  if (checkCollision(x, y + 1)) {
    isCollided = true;
  }
  switch (rotation) {
    case 0: if (checkCollision(x, y)) isCollided = true; break;
    case 1: if (checkCollision(x + 1, y + 1)) isCollided = true; break;
    case 2: if (checkCollision(x, y + 2)) isCollided = true; break;
    case 3: if (checkCollision(x - 1, y + 1)) isCollided = true; break;
  }
  
  if (isCollided) {
    // 衝突したら、着地させて新しいぷよを出す
    landPuyo();
    spawnNewPuyo();
  } else {
    // 衝突しなければ、1マス下に動かす
    currentPuyo.y++;
  }
}

/**
 * (x, y)から繋がっている同じ色のぷよのグループを探す関数
 * @param {number} startX - 探索を開始するX座標
 * @param {number} startY - 探索を開始するY座標
 * @returns {Array} - 繋がっているぷよの座標リスト [{x, y}, ...]
 */
function findConnectedPuyos(startX, startY) {
  const targetColor = board[startY][startX];
  if (targetColor === 0) return []; // 空の場所からは探さない

  const connected = []; // 繋がっているぷよのリスト
  const queue = [{ x: startX, y: startY }]; // 探索待ちのリスト
  const visited = new Set([`${startX},${startY}`]); // チェック済みの座標を記録

  while (queue.length > 0) {
    const { x, y } = queue.shift(); // 先頭を取り出す
    connected.push({ x, y });

    // 上下左右の4方向をチェック
    const neighbors = [
      { x, y: y - 1 }, // 上
      { x, y: y + 1 }, // 下
      { x: x - 1, y }, // 左
      { x: x + 1, y }, // 右
    ];

    for (const neighbor of neighbors) {
      const nx = neighbor.x;
      const ny = neighbor.y;
      const key = `${nx},${ny}`;

      // 盤面の外か、既にチェック済みか、色が違う場合はスキップ
      if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT || visited.has(key) || board[ny][nx] !== targetColor) {
        continue;
      }

      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return connected;
}

/**
 * 盤面全体をチェックして、4つ以上繋がっているぷよを消す関数
 */
function checkAndClearPuyos() {
  const puyosToClear = new Set();
  const checked = new Set();

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const key = `${x},${y}`;
      if (board[y][x] !== 0 && !checked.has(key)) {
        const connected = findConnectedPuyos(x, y);
        if (connected.length >= 4) {
          connected.forEach(puyo => puyosToClear.add(`${puyo.x},${puyo.y}`));
        }
        connected.forEach(puyo => checked.add(`${puyo.x},${puyo.y}`));
      }
    }
  }

  // 消すべきぷよを盤面データから消す（0にする）
  puyosToClear.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    board[y][x] = 0;
  });
}