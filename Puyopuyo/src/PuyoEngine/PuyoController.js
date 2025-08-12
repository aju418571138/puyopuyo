//ぷよぷよの操作、進行を管理するクラス
export default class PuyoController {
    constructor(scene, PuyoLogic){
        this.scene = scene; // Phaserのシーンオブジェクト
        this.PuyoLogic = PuyoLogic; // PuyoLogicのインスタンス
        // --- キーボード設定 ---
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys('X,Z');
        // --- 自動落下タイマー ---
        this.fallTimer = this.scene.time.addEvent({
        delay: 1000, // 1000ミリ秒（1秒）ごとに
        callback: this.PuyoLogic.fallOneStep, // PuyoLogicの落下関数を呼び出す
        callbackScope: this.PuyoLogic, // コールバックのスコープをPuyoLogicに設定
        loop: true, // ずっと繰り返す
        });

    }

    update(){
        // --- キー入力の処理 ---
        if (this.cursors.left.isDown) {
            this.PuyoLogic.movePuyoLeft();
        }
        if (this.cursors.right.isDown) {
            this.PuyoLogic.movePuyoRight();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
            this.PuyoLogic.rotatePuyo();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
            this.PuyoLogic.rotatePuyoCounterClockwise();
        }
    }

}