import Phaser from 'phaser';
import Board from '../../PuyoEngine/PuyoLogic.js';
export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
    }
    preload(){
        // ここで必要なアセットをプリロードする
    }
    create(){
      const board1 = new Board();
/*
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
*/
      // 盤面データ（二次元配列）を元に、マス目を描画する
      board1.board((row, y) => {
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

      // --- 操作ぷよを描画 ---
      const puyoData = PuyoLogic.currentPuyo;

      // ぷよの絵を作成し、this.puyo1, this.puyo2 に保存する
      this.puyo1 = this.add.circle(0, 0, TILE_SIZE / 2, puyoColors[puyoData.color1]);
      this.puyo2 = this.add.circle(0, 0, TILE_SIZE / 2, puyoColors[puyoData.color2]);

      // --- キーボード設定 ---
      this.cursors = this.input.keyboard.createCursorKeys();

      // --- 自動落下タイマー ---
      this.fallTimer = this.time.addEvent({
        delay: 1000, // 1000ミリ秒（1秒）ごとに
        callback: PuyoLogic.fallOneStep, // PuyoLogicの落下関数を呼び出す
        callbackScope: this,
        loop: true, // ずっと繰り返す
      });

      this.boardPuyoGroup = this.add.group();

    }

    update() {
      // --- キー入力の処理 ---
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        PuyoLogic.movePuyoLeft();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        PuyoLogic.movePuyoRight();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        PuyoLogic.rotatePuyo();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        PuyoLogic.rotatePuyoCounterClockwise();
      }

      // --- 定義（毎回使うのでupdate内に書く） ---
      const puyoData = PuyoLogic.currentPuyo;
      const puyoColors = { 1: 0xff0000, 2: 0x00ff00, 3: 0x0000ff };
      const TILE_SIZE = 40;
      const BOARD_OFFSET_X = 100;
      const BOARD_OFFSET_Y = 50;
      
      // 軸ぷよの位置を更新
      this.puyo1.x = BOARD_OFFSET_X + puyoData.x * TILE_SIZE;
      this.puyo1.y = BOARD_OFFSET_Y + puyoData.y * TILE_SIZE;
      this.puyo1.setFillStyle(puyoColors[puyoData.color1]); // ✨この行を追加

      // (回転部分のコードは省略... 前回のままでOK)
      switch (puyoData.rotation) {
        case 0: this.puyo2.x = this.puyo1.x; this.puyo2.y = this.puyo1.y - TILE_SIZE; break;
        case 1: this.puyo2.x = this.puyo1.x + TILE_SIZE; this.puyo2.y = this.puyo1.y; break;
        case 2: this.puyo2.x = this.puyo1.x; this.puyo2.y = this.puyo1.y + TILE_SIZE; break;
        case 3: this.puyo2.x = this.puyo1.x - TILE_SIZE; this.puyo2.y = this.puyo1.y; break;
      }
      this.puyo2.setFillStyle(puyoColors[puyoData.color2]);
      
      // --- ✨着地したぷよの描画 ---
      // 1. まず古いぷよを全部消す
      this.boardPuyoGroup.clear(true, true);
      
      // 2. 盤面データをもとに、新しいぷよを描画する
      const boardData = PuyoLogic.board;
      boardData.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell > 0) { // 0より大きい（＝ぷよがある）マスだけ描画
            const puyoX = BOARD_OFFSET_X + x * TILE_SIZE;
            const puyoY = BOARD_OFFSET_Y + y * TILE_SIZE;
            const puyoColor = puyoColors[cell];
            // グループに新しいぷよ（円）を追加する
            this.boardPuyoGroup.add(this.add.circle(puyoX, puyoY, TILE_SIZE / 2, puyoColor));
          }
        });
      });
    }
}
