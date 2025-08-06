// ゲームの設定
const config = {
    type: Phaser.AUTO, // WebGLを優先し、対応していなければCanvasを使用
    width: 800,        // ゲーム画面の幅
    height: 600,       // ゲーム画面の高さ
    physics: {
        default: 'arcade', // シンプルな物理演算エンジン
        arcade: {
            gravity: { y: 0 }, // このゲームでは全体的な重力は不要
            debug: false
        }
    },
    scene: {
        preload: preload, // アセットの事前読み込み
        create: create,   // ゲームオブジェクトの作成
        update: update    // ゲームの更新ループ
    }
};

// ゲームインスタンスの作成
const game = new Phaser.Game(config);

// グローバル変数
let player;
let stars;
let score = 0;
let scoreText;
let cursors;

/**
 * @description アセット（画像、音声など）を事前に読み込むための関数
 */
function preload() {
    // 今回は画像を使わず図形を描画するため、読み込みは不要です
}

/**
 * @description ゲーム開始時に一度だけ呼ばれ、オブジェクトを配置する関数
 */
function create() {
    // プレイヤーを作成（四角形）
    // this.add.rectangle(x, y, width, height, color)
    player = this.physics.add.sprite(400, 550, null).setSize(100, 20);
    player.setCollideWorldBounds(true); // 画面端に衝突するように設定

    // 四角形を描画してプレイヤーのスプライトにテクスチャとして使う
    let graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1); // 白色
    graphics.fillRect(0, 0, 100, 20);
    graphics.generateTexture('playerTexture', 100, 20);
    player.setTexture('playerTexture');
    graphics.destroy();


    // 星のグループを作成
    stars = this.physics.add.group();

    // 1秒ごとに星を生成するタイマーイベント
    this.time.addEvent({
        delay: 1000,
        callback: spawnStar,
        callbackScope: this,
        loop: true
    });

    // スコア表示テキストを作成
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });

    // プレイヤーと星が重なった時の処理を設定
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // キーボード入力を受け付ける準備
    cursors = this.input.keyboard.createCursorKeys();
}

/**
 * @description ゲームループ。毎フレーム呼ばれ、状態を更新する関数
 */
function update() {
    // プレイヤーの操作
    if (cursors.left.isDown) {
        player.setVelocityX(-350);
    } else if (cursors.right.isDown) {
        player.setVelocityX(350);
    } else {
        player.setVelocityX(0);
    }
    
    // 画面外に出た星を削除
    stars.children.iterate(function (star) {
        if (star && star.y > 600) {
            star.destroy();
        }
    });
}

/**
 * @description 星を生成する関数
 */
function spawnStar() {
    const x = Phaser.Math.Between(50, 750); // 画面上部のランダムなX座標
    const star = stars.create(x, 0, null).setSize(20, 20);
    star.setVelocityY(200); // 下に落ちる速度を設定

    // 星の見た目（黄色い円）を描画
    let graphics = this.add.graphics();
    graphics.fillStyle(0xffff00, 1); // 黄色
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture('starTexture', 20, 20);
    star.setTexture('starTexture');
    graphics.destroy();
}

/**
 * @description プレイヤーが星をキャッチした時の処理
 * @param {Phaser.Physics.Arcade.Sprite} player - プレイヤーオブジェクト
 * @param {Phaser.Physics.Arcade.Sprite} star - 星オブジェクト
 */
function collectStar(player, star) {
    star.destroy(); // 星を消す

    // スコアを加算してテキストを更新
    score += 10;
    scoreText.setText('Score: ' + score);
}