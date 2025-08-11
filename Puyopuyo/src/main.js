import Phaser from 'phaser';
import GameScene from './scenes/GameScenes/GameScene.js';
import TitleScene from './scenes/MenuScenes/TitleScene.js';
import ModeSelectScene from './scenes/MenuScenes/ModeSelectScene.js';
import SinglePlayMenuScene from './scenes/MenuScenes/SinglePlayMenuScene.js';
import OnlineMenuScene from './scenes/MenuScenes/OnlineMenuScene.js';

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
  scene: [TitleScene, ModeSelectScene, SinglePlayMenuScene, OnlineMenuScene, GameScene]
};

// ゲームインスタンスを生成
const game = new Phaser.Game(config);
