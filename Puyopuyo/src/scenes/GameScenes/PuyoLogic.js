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
  color2: 2
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