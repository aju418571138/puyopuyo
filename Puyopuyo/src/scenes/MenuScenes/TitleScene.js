import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.scale;

    // ゲームタイトルを表示 [cite: 2]
    this.add.text(width / 2, height * 0.4, 'ゲームタイトル', {
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // プレイボタンを作成 [cite: 3]
    const playButton = this.add.text(width / 2, height * 0.6, 'プレイ', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    // ボタンをインタラクティブにする
    playButton.setInteractive();

    // ボタンがクリックされたら ModeSelectScene に移動
    playButton.on('pointerdown', () => {
      this.scene.start('ModeSelectScene');
    });
  }
}