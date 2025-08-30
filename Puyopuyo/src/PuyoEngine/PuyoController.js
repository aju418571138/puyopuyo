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
        this.landCount = 0; // ぷよが着地してからのフレーム数をカウントする変数
        this.landed = false; // ぷよが着地したかどうかのフラグ
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
        this.landFrames = 30; // ぷよが着地してから何フレームで着地確定にするか
        this.fallInterval = 333; // ミリ秒単位で落下間隔を設定
        this.fallIntervalFast = 30; // ミリ秒単位で高速落下間隔を設定
        this.fallIntervalNow = this.fallInterval; //現在の落下間隔
        this.moveInterval = 30; // ミリ秒単位で左右移動の連続入力間隔を設定
        // --- ネクストツモを生成 ---
        this.PuyoLogic.nextTsumos.unshift(...this.PuyoLogic.generateFirstTsumo()); //最初のネクストを生成
        for(let i=2; i<this.PuyoLogic.nexts; i++){
            this.PuyoLogic.nextTsumos.unshift(this.PuyoLogic.generateNextTsumo()); //ネクストを生成
        }
        
        this.PuyoLogic.spawnNewPuyo(); // 最初のぷよを生成
        this.puyoView = new PuyoView(scene, this.PuyoLogic); // PuyoViewのインスタンス
        this.isFastButtonPressed=false;
    }
    
    puyoGenerated(){
        console.log("PuyoController: ぷよが生成されました");
        this.falled = false; // 新しいぷよが生成されたので落下フラグをリセット
        this.landCount = 0; // 着地カウントをリセット
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

        // --- 着地の判定 ---
        this.landed = false; // フレームごとにリセット
        if(this.PuyoLogic.currentPuyo){ // currentPuyoが存在する場合のみ判定
            const {x,y,rotation} = this.PuyoLogic.currentPuyo;
            if(this.PuyoLogic.isPositionValid(x, y+0.5, rotation)===false){ // 1マス下に移動できないなら
                this.landed = true; // ぷよが着地したことを記録
            }
        }
        if(this.landed){
            this.landCount++;
        }else{
            if(this.landCount>0) {
                this.fallReset(); // 着地していたのが解除されたら落下タイマーをリセット
                console.log("PuyoController: 着地が解除されました");
            }
            this.landCount=0;
        }
        if(this.landCount>=this.landFrames){ //
            this.puyoLanded();
            this.landCount=0; // カウントをリセット
        }

        console.log(this.landCount);
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
        console.log("PuyoController: 落下タイマーをリセットしました");
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