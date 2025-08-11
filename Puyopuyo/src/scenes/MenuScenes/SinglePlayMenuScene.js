import Phaser from 'phaser';

export default class SinglePlayMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SinglePlayMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // タイトル
    this.add.text(width / 2, height * 0.2, '一人プレイ', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // AI対戦プレイボタン
    const aiButton = this.add.text(width / 2, height * 0.4, 'AI対戦プレイ', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    aiButton.on('pointerdown', () => {
      console.log('AI対戦は現在準備中です'); // 今はコンソールにメッセージを出すだけ
    });

    // 練習プレイボタン
    const practiceButton = this.add.text(width / 2, height * 0.6, '練習プレイ', {
      fontSize: '32px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    practiceButton.on('pointerdown', () => {
      this.scene.start('GameScene'); // ゲーム本編を開始
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