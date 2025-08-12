import Phaser from 'phaser';
import PuyoLogic from '../../PuyoEngine/PuyoLogic.js';
import PuyoController from '../../PuyoEngine/PuyoController.js';
import PuyoView from '../../PuyoEngine/PuyoView.js';

export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
        this.puyoLogic = null; // PuyoLogicのインスタンス
        this.puyoController = null; // PuyoControllerのインスタンス
        this.puyoView = null; // PuyoViewのインスタンス
    }
    preload(){
        // ここで必要なアセットをプリロードする
    }
    create(){
      this.puyoLogic = new PuyoLogic();// PuyoLogicのインスタンスを生成
      this.puyoController = new PuyoController(this, this.puyoLogic);// PuyoControllerのインスタンスを生成
      this.puyoView = new PuyoView(this, this.puyoLogic);// PuyoViewのインスタンスを生成

    }

    update() {
      this.puyoController.update(); // PuyoControllerの更新-常に操作を受け付ける
      this.puyoView.update(); // PuyoViewの更新-常に描画

    }
}
