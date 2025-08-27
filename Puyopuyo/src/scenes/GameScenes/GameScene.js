import Phaser from 'phaser';
import PuyoLogic from '../../PuyoEngine/PuyoLogic.js';
import PuyoController from '../../PuyoEngine/PuyoController.js';
import PuyoView from '../../PuyoEngine/PuyoView.js';

export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
        this.puyoController = null; // PuyoControllerのインスタンス
    }
    preload(){
        // ここで必要なアセットをプリロードする
    }
    create(){
      this.puyoController = new PuyoController({scene: this});// PuyoControllerのインスタンスを生成するとゲームが始まる

    }

    update() {
      this.puyoController.update(); // PuyoControllerの更新-常に操作を受け付ける

    }
}
