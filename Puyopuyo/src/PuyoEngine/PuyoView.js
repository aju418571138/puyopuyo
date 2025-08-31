//盤面の描画に関するクラス
export default class PuyoView {
    constructor(scene, PuyoLogic) {
        this.scene = scene; // Phaserのシーン
        this.PuyoLogic = PuyoLogic; // PuyoLogicのインスタンス

        // コンテナを作成（すべての描画オブジェクトの親要素）
        /**
         * @type {Phaser.GameObjects.Container}
         * 盤面全体をまとめるコンテナ
         */
        this.boardContainer = this.scene.add.container(0, 0); //0,0はコンテナの位置

        // マスクの設定
        const maskGraphics = this.scene.make.graphics();
        // 表示したい領域を指定（1,2行目を除いた部分）
        maskGraphics.fillStyle(0x000000);
        maskGraphics.fillRect(
            this.PuyoLogic.offsetX-this.PuyoLogic.size/2, 
            0,
            //this.PuyoLogic.offsetY + (2 * this.PuyoLogic.size)-this.PuyoLogic.size/2, // 3行目から表示
            this.PuyoLogic.width * this.PuyoLogic.size,
            this.PuyoLogic.height * this.PuyoLogic.size+1000
        );

        // マスクを作成
        const mask = maskGraphics.createGeometryMask();
        this.boardContainer.setMask(mask);

        // 盤面データ（二次元配列）を元に、マス目を描画する
        this.PuyoLogic.board.forEach((row, y) => {
            row.forEach((cell, x) => {
                // マス目の座標を計算
                const tileX = this.PuyoLogic.offsetX + x * this.PuyoLogic.size;
                const tileY = this.PuyoLogic.offsetY + y * this.PuyoLogic.size;

                // マス目と枠線を描画してコンテナに追加
                const rect = this.scene.add.rectangle(tileX, tileY, this.PuyoLogic.size, this.PuyoLogic.size, 0x000000, 0.2);
                const border = this.scene.add.rectangle(tileX, tileY, this.PuyoLogic.size, this.PuyoLogic.size).setStrokeStyle(1, 0xffffff, 0.5);
                this.boardContainer.add([rect, border]);
            });
        });
        // --- 操作ぷよを描画 ---
        //const puyoData = this.PuyoLogic.currentPuyo;

        // ぷよの絵を作成し、this.puyo1, this.puyo2 に保存する
        this.puyo1 = this.scene.add.circle(0, 0, this.PuyoLogic.size / 2, this.PuyoLogic.colors[0]); // 初期色は透明
        this.puyo2 = this.scene.add.circle(0, 0, this.PuyoLogic.size / 2, this.PuyoLogic.colors[0]);
        // コンテナに追加
        this.boardContainer.add([this.puyo1, this.puyo2]);

        this.boardPuyoGroup = this.scene.add.group();
        // コンテナに追加
        this.boardContainer.add(this.boardPuyoGroup.getChildren());

        this.nextPuyoGroup = this.scene.add.group();
         //ネクストはコンテナに追加しない 盤面の外のため
    }
    update(){

        // --- 定義（毎回使うのでupdate内に書く） ---
        const puyoData = this.PuyoLogic.currentPuyo;
        const puyoColors = this.PuyoLogic.colors;
        const TILE_SIZE = this.PuyoLogic.size; // 1マスのサイズ
        const BOARD_OFFSET_X = this.PuyoLogic.offsetX; // 盤面のX座標オフセット
        const BOARD_OFFSET_Y = this.PuyoLogic.offsetY; // 盤面のY座標オフセット

        // --- 操作ぷよを描画 ---
        if(puyoData){
            // currentPuyoが存在する場合は表示
            this.puyo1.visible = true;
            this.puyo2.visible = true;
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

            // --- 操作ぷよの深度を設定 ---
            // 操作ぷよの深度を設定して、他のオブジェクトより前面に表示する
            this.puyo1.setDepth(10);
            this.puyo2.setDepth(10);
        }else{
            // currentPuyoがnullの場合は非表示
            this.puyo1.visible = false;
            this.puyo2.visible = false;        
        }
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
                const puyo = this.scene.add.circle(puyoX, puyoY, TILE_SIZE / 2, puyoColor);
                this.boardPuyoGroup.add(puyo);
                // コンテナに追加
                this.boardContainer.add(puyo);
            }
            });
        });

        // --- ネクストの描画 ---
        // 1. まず古いぷよを全部消す
        this.nextPuyoGroup.clear(true, true);
        const nextTsumos = this.PuyoLogic.nextTsumos;
        const nextPos = this.PuyoLogic.nextPos;
        for(const nextPosObj of nextPos){
            const index = nextPos.indexOf(nextPosObj); //nextPosObjのインデックス
            this.nextPuyoGroup.add(this.scene.add.circle(nextPosObj.x * TILE_SIZE + BOARD_OFFSET_X, nextPosObj.y * TILE_SIZE + BOARD_OFFSET_Y, (TILE_SIZE * nextPosObj.size) / 2, puyoColors[nextTsumos[index].color2]));
            this.nextPuyoGroup.add(this.scene.add.circle(nextPosObj.x * TILE_SIZE + BOARD_OFFSET_X, nextPosObj.y * TILE_SIZE + BOARD_OFFSET_Y + TILE_SIZE*nextPosObj.size, (TILE_SIZE * nextPosObj.size) / 2, puyoColors[nextTsumos[index].color1]));
        }

    }
}