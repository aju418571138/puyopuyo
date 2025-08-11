//盤面の描画に関するクラス
export default class PuyoView {
    constructor(scene, PuyoLogic) {
        this.scene = scene; // Phaserのシーン
        this.PuyoLogic = PuyoLogic; // PuyoLogicのインスタンス
        // 盤面データ（二次元配列）を元に、マス目を描画する
        this.PuyoLogic.board.forEach((row, y) => {
            row.forEach((cell, x) => {
                // マス目の座標を計算
                const tileX = this.PuyoLogic.offsetX + x * this.PuyoLogic.size;
                const tileY = this.PuyoLogic.offsetY + y * this.PuyoLogic.size;

                // 四角形を描画してマス目を作る
                this.scene.add.rectangle(tileX, tileY, this.PuyoLogic.size, this.PuyoLogic.size, 0x000000, 0.2);
                // 枠線も描画
                this.scene.add.rectangle(tileX, tileY, this.PuyoLogic.size, this.PuyoLogic.size).setStrokeStyle(1, 0xffffff, 0.5);

            });
        });
        // --- 操作ぷよを描画 ---
        const puyoData = this.PuyoLogic.currentPuyo;

        // ぷよの絵を作成し、this.puyo1, this.puyo2 に保存する
        this.puyo1 = this.scene.add.circle(0, 0, this.PuyoLogic.size / 2, this.PuyoLogic.colors[puyoData.color1]);
        this.puyo2 = this.scene.add.circle(0, 0, this.PuyoLogic.size / 2, this.PuyoLogic.colors[puyoData.color2]);
        
        this.boardPuyoGroup = this.scene.add.group();
    }
    update(){

        // --- 定義（毎回使うのでupdate内に書く） ---
        const puyoData = this.PuyoLogic.currentPuyo;
        const puyoColors = this.PuyoLogic.colors;
        const TILE_SIZE = this.PuyoLogic.size; // 1マスのサイズ
        const BOARD_OFFSET_X = this.PuyoLogic.offsetX; // 盤面のX座標オフセット
        const BOARD_OFFSET_Y = this.PuyoLogic.offsetY; // 盤面のY座標オフセット

        // --- 操作ぷよを描画 ---
        // 軸ぷよの位置を更新
        this.puyo1.x = BOARD_OFFSET_X + puyoData.x * TILE_SIZE;
        this.puyo1.y = BOARD_OFFSET_Y + puyoData.y * TILE_SIZE;
        this.puyo1.setFillStyle(puyoColors[puyoData.color1]);

        // (回転部分のコードは省略... 前回のままでOK)
        switch (puyoData.rotation) {
            case 0: this.puyo2.x = this.puyo1.x; this.puyo2.y = this.puyo1.y - TILE_SIZE; break;
            case 1: this.puyo2.x = this.puyo1.x + TILE_SIZE; this.puyo2.y = this.puyo1.y; break;
            case 2: this.puyo2.x = this.puyo1.x; this.puyo2.y = this.puyo1.y + TILE_SIZE; break;
            case 3: this.puyo2.x = this.puyo1.x - TILE_SIZE; this.puyo2.y = this.puyo1.y; break;
        }
        this.puyo2.setFillStyle(puyoColors[puyoData.color2]);

        // --- 着地したぷよの描画 ---
        // 1. まず古いぷよを全部消す
        this.boardPuyoGroup.clear(true, true);
        
        // 2. 盤面データをもとに、新しいぷよを描画する
        const boardData = this.PuyoLogic.board;
        boardData.forEach((row, y) => {
            row.forEach((cell, x) => {
            if (cell > 0) { // 0より大きい（＝ぷよがある）マスだけ描画
                const puyoX = BOARD_OFFSET_X + x * TILE_SIZE;
                const puyoY = BOARD_OFFSET_Y + y * TILE_SIZE;
                const puyoColor = puyoColors[cell];
                // グループに新しいぷよ（円）を追加する
                this.scene.boardPuyoGroup.add(this.add.circle(puyoX, puyoY, TILE_SIZE / 2, puyoColor));
            }
            });
        });

    }
}