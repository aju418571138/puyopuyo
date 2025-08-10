import Phaser from 'phaser';
export default class GameScene extends Phaser.Scene{
    constructor(){
        super({ key: 'GameScene' });
    }
    preload(){
        // ここで必要なアセットをプリロードする
    }
    create(){
        // ゲームの初期化処理
        //this.add.text(100, 100, 'Game Scene', { font: '32px Arial', fill: '#ffffff' });
    }
}
