import Phaser from 'phaser';

// ゲームの設定オブジェクト
const config = {
  type: Phaser.AUTO, // WebGLを優先的に使用し、対応していなければCanvasにフォールバック
  width: 800,
  height: 600,
  parent: 'game-container', // ゲームキャンバスを描画するDOM要素のID（index.htmlには不要）
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    },
  },
  // 使用するシーンのリスト
  scene: [
  ]
};

// ゲームインスタンスを生成
const game = new Phaser.Game(config);
