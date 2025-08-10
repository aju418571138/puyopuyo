import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    // 画面の中央座標を取得
    const { width, height } = this.scale;

    // 背景色を設定
    this.cameras.main.setBackgroundColor('#222222');

    // 開始を促すテキストを画面中央に表示
    const startText = this.add.text(width / 2, height / 2, 'Click to Start', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5); // テキストの中心を座標に合わせる

    // 画面全体をクリック可能にする
    this.input.on('pointerdown', () => {
      // クリックされたら'GameScene'を開始する
      this.scene.start('GameScene');
    });
  }
}
