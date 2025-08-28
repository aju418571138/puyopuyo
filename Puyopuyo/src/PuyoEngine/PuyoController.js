//ぷよぷよの操作、進行を管理するクラス
import Phaser from 'phaser';
import PuyoLogic from './PuyoLogic.js';
import PuyoView from './PuyoView.js';
export default class PuyoController {
    /**
     * PuyoControllerのコンストラクタ
     * @param {object} object - コンストラクタに代入するオブジェクト
     * @param {Phaser.Scene} object.scene - Phaserのシーンオブジェクト
     * @param {object} object.logicConfig - PuyoLogicの設定オブジェクト. 空の場合、PuyoLogicのコンストラクタのデフォルト値が適用
     * 
     */
    constructor({scene, logicConfig = {}}={}){ // logicConfigはPuyoLogicの設定オブジェクト
        
        if(!scene){
            throw new Error("PuyoControllerのコンストラクタにPhaserのシーンオブジェクトを渡してください");
        }

        this.callBackObj = {
            puyoGenerated: () => this.puyoGenerated(),
            fallReset: () => this.fallReset(),
            puyoLanded: () => this.puyoLanded(),
        }; // PuyoLogicがコールバックするオブジェクトを格納するオブジェクト

        this.scene = scene; // Phaserのシーンオブジェクト
        this.PuyoLogic = new PuyoLogic({...logicConfig, callbackObj: this.callBackObj}); // PuyoLogicのインスタンス

        // --- キーボード設定 ---
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys('X,Z');

        // --- インターバル設定 ---
        this.fallInterval = 280; // ミリ秒単位で落下間隔を設定
        this.fallIntervalFast = 30; // ミリ秒単位で高速落下間隔を設定
        this.fallIntervalNow = this.fallInterval; //現在の落下間隔
        this.moveInterval = 30; // ミリ秒単位で左右移動の連続入力間隔を設定
        
        this.PuyoLogic.spawnNewPuyo(); // 最初のぷよを生成
        this.puyoView = new PuyoView(scene, this.PuyoLogic); // PuyoViewのインスタンス
        this.isFastButtonPressed=false;
    }
    
    puyoGenerated(){
        console.log("PuyoController: ぷよが生成されました");

        this.PuyoLogic.fallOneStep(); // ぷよが生成された瞬間一回落下させる
        this.fallReset(); // ぷよが生成されたら落下タイマーをリセット
        if(this.isFastButtonPressed){
            this.fallFast(); // 落下ボタンが押されているなら高速落下に戻す
        }
    }

    update(){
        this.puyoView.update(); // PuyoViewの更新-常に描画
        // --- キー入力の処理 ---
        if(Phaser.Input.Keyboard.JustDown(this.cursors.left)){
            if(this.PuyoLogic.movePuyoLeft()){// 左キーが押されたら一回左に移動
                this.fallSlow(); // 左右移動したら落下を通常速度に戻す
            }
            this.moveLeftTimer = this.scene.time.addEvent({
                delay: this.moveInterval, // ミリ秒単位で左右移動の連続入力間隔を設定
                callback: ()=>{
                    const isMoved = this.PuyoLogic.movePuyoLeft(); // PuyoLogicの左移動関数を呼び出す
                    if(isMoved){this.fallSlow();} // 左右移動したら落下を通常速度に戻す
                },
                callbackScope: this, // コールバックのスコープをPuyoLogicに設定
                loop: true, // ずっと繰り返す
                paused: true, // 最初は停止状態
            });
            // 一定時間後にタイマーを開始(一瞬の操作で連続移動しないようにする)
            this.scene.time.delayedCall(this.moveInterval, () => {
                if(this.moveLeftTimer) {
                    this.moveLeftTimer.paused = false;
                }
            });
        }
        if(Phaser.Input.Keyboard.JustUp(this.cursors.left)){
            this.moveLeftTimer.remove();
        }
        if(Phaser.Input.Keyboard.JustDown(this.cursors.right)){
            if(this.PuyoLogic.movePuyoRight()){ // 右キーが押されたら一回右に移動
                this.fallSlow(); // 左右移動したら落下を通常速度に戻す      
            }
            this.moveRightTimer = this.scene.time.addEvent({
                delay: this.moveInterval, // ミリ秒単位で左右移動の連続入力間隔を設定
                callback: ()=>{
                    const isMoved = this.PuyoLogic.movePuyoRight(); // PuyoLogicの右移動関数を呼び出す
                    if(isMoved){this.fallSlow();} // 左右移動したら落下を通常速度に戻す
                },
                callbackScope: this,
                loop: true, // ずっと繰り返す
                paused: true, // 最初は停止状態
            });
            // 一定時間後にタイマーを開始(一瞬の操作で連続移動しないようにする)
            this.scene.time.delayedCall(this.moveInterval*3/2, () => {
                if(this.moveRightTimer) {
                    this.moveRightTimer.paused = false;
                }
            });
        }
        if(Phaser.Input.Keyboard.JustUp(this.cursors.right)){
            this.moveRightTimer.remove();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
            this.PuyoLogic.rotatePuyo();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
            this.PuyoLogic.rotatePuyoCounterClockwise();
        }
        if(Phaser.Input.Keyboard.JustDown(this.cursors.down)){
            this.PuyoLogic.fallOneStep();
            this.fallFast();
            this.isFastButtonPressed=true;
        }
        if(Phaser.Input.Keyboard.JustUp(this.cursors.down)){
            this.fallSlow();
            this.isFastButtonPressed=false;
        }
    }

    /**
     * ぷよの落下を高速にする
     */
    fallFast(){
        if(this.fallIntervalNow === this.fallIntervalFast) return; // すでに高速なら何もしない
        this.fallTimer.remove();
        this.fallIntervalNow = this.fallIntervalFast;
        this.fallTimer = this.scene.time.addEvent({
            delay: this.fallIntervalFast, // 高速落下間隔に設定
            callback: this.PuyoLogic.fallOneStep, // PuyoLogicの落下関数を呼び出す
            callbackScope: this.PuyoLogic, // コールバックのスコープをPuyoLogicに設定
            loop: true, // ずっと繰り返す
        });
    }
    /**
     * ぷよの落下を通常に戻す
     */
    fallSlow(){
        if(this.fallIntervalNow === this.fallInterval) return; // すでに通常速度なら何もしない
        this.fallTimer.remove();
        this.fallIntervalNow = this.fallInterval;
        this.fallTimer = this.scene.time.addEvent({
            delay: this.fallInterval, // 通常落下間隔に設定
            callback: ()=>{
                this.PuyoLogic.fallOneStep(); // PuyoLogicの落下関数を呼び出す
                if(this.isFastButtonPressed){
                    this.fallFast(); // 落下ボタンが押されているなら高速落下に戻す
                }
            },
            callbackScope: this.PuyoLogic, // コールバックのスコープをPuyoLogicに設定
            loop: true, // ずっと繰り返す
        });
    }

    /**
     * 落下のタイミングをリセット
     */
    fallReset(){
        if(this.fallTimer){
            this.fallTimer.remove();
        }
        this.fallTimer = this.scene.time.addEvent({
            delay: this.fallIntervalNow, // 現在の落下間隔に設定
            callback: this.PuyoLogic.fallOneStep, // PuyoLogicの落下関数を呼び出す
            callbackScope: this.PuyoLogic, // コールバックのスコープをPuyoLogicに設定
            loop: true, // ずっと繰り返す
        });
    }

    /**
     * ぷよが着地したときに呼ばれるコールバック関数
     * @returns {boolean} - ゲームオーバーならtrueを返す
     */
    async puyoLanded(){
        if(!(await this.isLandedEnough())){
            return false; // まだ着地していないなら何もしない
        }
        // 衝突したら、ぷよを着地させる
        this.PuyoLogic.landPuyo();

        // 重力を適用してぷよを落とす
        this.PuyoLogic.applyGravity();
        await this.sleep(300); // 着地アニメーションの時間を待つ
        // 連鎖処理
        await this.handleChain();

        // ゲームオーバー判定
        if (this.PuyoLogic.isGameOver()) {
          console.log("GAME OVER");
          this.PuyoLogic.currentPuyo = null; // ゲームオーバー後は操作不能に
          return true;
        }

        // 新しいぷよを生成
        this.PuyoLogic.spawnNewPuyo();
    }
    /**
     * 着地後、一定時間後にもう一度着地判定を行う
     * @returns {boolean} - ぷよが一定時間後も着地しているならtrueを返す
     */
    async isLandedEnough(){
      await this.sleep(this.fallInterval); // 落下間隔分待つ
      if(!this.PuyoLogic.currentPuyo) return false; // currentPuyoがnullならfalseを返す(二重で呼ばれた場合の対策)
        // この時点でのぷよの状態を確認して、本当に着地しているかを判定
        return !this.PuyoLogic.isPositionValid(
            this.PuyoLogic.currentPuyo.x,
            this.PuyoLogic.currentPuyo.y+0.5,
            this.PuyoLogic.currentPuyo.rotation
        );

    }

    /**
     * 連鎖処理を行う
     */
    async handleChain() {
        let chainCount = 0;
        while (true) {
            // 4つ以上繋がったぷよを消す
            const cleared = this.PuyoLogic.checkAndClearPuyos();
            if (cleared) {
                chainCount++;
                console.log(`${chainCount}連鎖！`);
                // ぷよが消えたら、重力を適用してぷよを落とす
                await this.sleep(300); // ぷよが消えるアニメーションの時間を待つ
                this.PuyoLogic.applyGravity();
                await this.sleep(300); // ぷよが落ちるアニメーションの時間を待つ
            } else {
                // 何も消えなくなったらリターン
                return;
            }
        }
    }

    /**
    * 指定されたミリ秒だけ待機する非同期関数
    * @param {number} ms - 待機するミリ秒数
    * @returns {Promise} - 指定されたミリ秒後に解決するPromise
    */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }



}