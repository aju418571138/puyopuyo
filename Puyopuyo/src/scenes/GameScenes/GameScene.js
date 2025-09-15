import Phaser from 'phaser';
// import PuyoLogic from '../../PuyoEngine/PuyoLogic.js'; // createで直接使わないので不要
import PuyoController from '../../PuyoEngine/PuyoController.js';
// import PuyoView from '../../PuyoEngine/PuyoView.js'; // createで直接使わないので不要

export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
        this.player1 = null; 
        this.player2 = null; 
        this.isAIMode = false;
        
        // ---ゲームの状態を管理する変数を追加 ---
        this.gameState = 'playing'; // 'playing' または 'gameOver'
    }

    init(data) {
        this.isAIMode = data.isAIMode || false;
        // --- 新しいシーンを開始するたびにゲーム状態をリセット ---
        this.gameState = 'playing';
    }

    preload(){
        // ここで必要なアセットをプリロードする
    }
    create() {
        this.player1 = new PuyoController({
            scene: this,
            isAIMode: false, 
            logicConfig: {
                offsetX: 150 
            }
        });

        if (this.isAIMode) {
            this.player2 = new PuyoController({
                scene: this,
                isAIMode: true,
                logicConfig: {
                    offsetX: 550 
                }
            });
        }
    }

    update() {
        // ---ゲームが終了していたら、以降の処理をすべて中断 ---
        if (this.gameState === 'gameOver') {
            return;
        }

        // 従来通りのプレイヤー更新処理
        if (this.player1) {
            this.player1.update();
        }
        if (this.player2) {
            this.player2.update();
        }

        // --- 毎フレーム、ゲームオーバーかどうかを判定 ---
        this.checkGameOver();
    }

    /**
     *ゲームオーバーをチェックして、勝者を判定する
     */
    checkGameOver() {
        const p1isGameOver = this.player1.PuyoLogic.isGameOver();
        const p2isGameOver = this.player2 ? this.player2.PuyoLogic.isGameOver() : false;

        if (p1isGameOver && p2isGameOver) {
            this.endGame('Draw'); // 引き分け
        } else if (p1isGameOver) {
            this.endGame('Player 2'); // プレイヤー2の勝ち
        } else if (p2isGameOver) {
            this.endGame('Player 1'); // プレイヤー1の勝ち
        }
    }

    /**
     * ゲームを終了させ、結果を表示する
     * @param {string} winner - 'Player 1', 'Player 2', or 'Draw'
     */
    endGame(winner) {
        this.gameState = 'gameOver'; // ゲームの状態を「終了」に更新

        // コンソールに結果を表示
        console.log(`GAME OVER`);
        console.log(`Winner: ${winner}`);

    }
}
