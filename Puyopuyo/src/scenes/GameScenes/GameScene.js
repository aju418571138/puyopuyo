import Phaser from 'phaser';
import * as PuyoLogic from './PuyoLogic.js';
export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
    }
    preload(){
        // ここで必要なアセットをプリロードする
    }
    create(){
        // マス1つのサイズや、盤面の表示位置を決める
const TILE_SIZE = 40; // 1マスのサイズ（ピクセル）
const BOARD_OFFSET_X = 100; // 盤面全体のX座標
const BOARD_OFFSET_Y = 50;  // 盤面全体のY座標

const puyoColors = {
  1: 0xff0000, // 1番は赤色
  2: 0x00ff00, // 2番は緑色
  3: 0x0000ff, // 3番は青色
  // ...他の色も必要なら追加
};

// PuyoLogicから盤面データを取得
const boardData = PuyoLogic.board;

// 盤面データ（二次元配列）を元に、マス目を描画する
boardData.forEach((row, y) => {
  row.forEach((cell, x) => {
    // マス目の座標を計算
    const tileX = BOARD_OFFSET_X + x * TILE_SIZE;
    const tileY = BOARD_OFFSET_Y + y * TILE_SIZE;

    // 四角形を描画してマス目を作る
    this.add.rectangle(tileX, tileY, TILE_SIZE, TILE_SIZE, 0x000000, 0.2);
    // 枠線も描画
    this.add.rectangle(tileX, tileY, TILE_SIZE, TILE_SIZE).setStrokeStyle(1, 0xffffff, 0.5);

    });
});

// PuyoLogicから現在のぷよの情報を取得
const puyoData = PuyoLogic.currentPuyo;

// 1つ目のぷよ（軸ぷよ）を描画
const puyo1X = BOARD_OFFSET_X + puyoData.x * TILE_SIZE;
const puyo1Y = BOARD_OFFSET_Y + puyoData.y * TILE_SIZE;
this.add.circle(puyo1X, puyo1Y, TILE_SIZE / 2, puyoColors[puyoData.color1]);

// 2つ目のぷよ（子ぷよ）を描画 (今はとりあえず軸ぷよのすぐ上に描画)
const puyo2X = puyo1X;
const puyo2Y = puyo1Y - TILE_SIZE;
this.add.circle(puyo2X, puyo2Y, TILE_SIZE / 2, puyoColors[puyoData.color2]);


this.cursors = this.input.keyboard.createCursorKeys();

}
update() {
  // 左キーが「押された瞬間」をチェック
  if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
    PuyoLogic.movePuyoLeft(); // PuyoLogicの関数を呼び出す
    console.log('左に移動！ 新しいX座標:', PuyoLogic.currentPuyo.x);
  }
  // 右キーが「押された瞬間」をチェック
  else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
    PuyoLogic.movePuyoRight(); // PuyoLogicの関数を呼び出す
    console.log('右に移動！ 新しいX座標:', PuyoLogic.currentPuyo.x);
  }

  // TODO: ここに、ぷよを再描画する処理を後で追加する
}


}

