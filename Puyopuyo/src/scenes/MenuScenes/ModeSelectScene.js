import Phaser from 'phaser';

export default class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create() {
    const { width, height } = this.scale;

    // タイトル
    this.add.text(width / 2, height * 0.3, 'モード選択', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 一人プレイボタン
    const singlePlayButton = this.add.text(width / 2, height * 0.5, '一人プレイ', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    
    singlePlayButton.on('pointerdown', () => {
      this.scene.start('SinglePlayMenuScene'); // 一人プレイメニューへ
    });

    // オンライン対戦ボタン
    const onlineButton = this.add.text(width / 2, height * 0.7, 'オンライン対戦', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    onlineButton.on('pointerdown', () => {
      this.scene.start('OnlineMenuScene'); // オンラインメニューへ
    });
  }
}