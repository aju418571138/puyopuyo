import Phaser from 'phaser';

export default class OnlineMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OnlineMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // タイトル
    this.add.text(width / 2, height * 0.2, 'オンライン対戦', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // フレンド対戦プレイボタン
    const friendButton = this.add.text(width / 2, height * 0.4, 'フレンド対戦', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    friendButton.on('pointerdown', () => {
      console.log('フレンド対戦は現在準備中です');
    });

    // レート対戦プレイボタン
    const rateButton = this.add.text(width / 2, height * 0.6, 'レート対戦', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    rateButton.on('pointerdown', () => {
      console.log('レート対戦は現在準備中です');
    });

    // 戻るボタン
    const backButton = this.add.text(width / 2, height * 0.8, '戻る', {
      fontSize: '24px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    backButton.on('pointerdown', () => {
      this.scene.start('ModeSelectScene'); // モード選択画面に戻る
    });
  }
}