//ぷよぷよのコア機能をまとめたクラス
export default class PuyoLogic {
  /**
   * @param {object} options - 盤面の設定オプション
   * @param {number} [options.width=6] - 盤面の列数
   * @param {number} [options.height=12] - 盤面の行数（ぷよが表示されるエリア）
   * @param {string[]} [options.colors] - ぷよの色の配列
   * @param {number} [options.size=40] - 1マスのサイズ (描画用)
   * @param {number} [options.offsetX=100] - 盤面のX座標オフセット (描画用)
   * @param {number} [options.offsetY=50] - 盤面のY座標オフセット (描画用)
   * @param {object[]} [options.deadTiles] - ゲームオーバーになるマス
   */
    constructor({
      // 盤面のサイズや、ぷよの色数、マスのサイズなどのデフォルト値を設定
      width = 6,
      height = 12,
      colors = [
        0x000000, // 空マス
        0xFF0000, // 赤
        0x00FF00, // 緑
        0x0000FF, // 青
        0xFFFF00, // 黄
      ],
      size = 40,
      offsetX = 100,
      offsetY = 50,
      deadTiles = [{x:2, y:12}] //ここにぷよがたまったらゲームオーバー
    }={}){
      this.width = width; // 盤面の列数
      this.height = height; // 盤面の行数
      this.colors = colors; // ぷよの色の配列
      this.size = size; // 1マスのサイズ
      this.offsetX = offsetX; // 盤面のX座標オフセット(盤面左端の座標)
      this.offsetY = offsetY; // 盤面のY座標オフセット
      this.deadTiles = deadTiles; // ゲームオーバーの条件となるぷよの位置
      // --- 盤面の状態 ---
      // 盤面の上部に見えない行を2行追加して、ぷよの出現や回転を処理しやすくする
      this.board = Array(this.height+2).fill(null).map(() => Array(this.width).fill(0));
      // --- 操作中のぷよの状態 ---
      this.currentPuyo = null; // ゲーム開始時にspawnNewPuyoで初期化
      
      this.spawnNewPuyo(); // 最初のぷよを生成
    }
    // ========== ぷよの操作 ==========
    /**
     * 操作ぷよを左に1マス移動する
     */
    movePuyoLeft() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      if (this.isPositionValid(x - 1, y, rotation)) {
        this.currentPuyo.x--;
      }
    }

    /**
     * 操作ぷよを右に1マス移動する
     */
    movePuyoRight() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      if (this.isPositionValid(x + 1, y, rotation)) {
        this.currentPuyo.x++;
      }
    }

    /**
     * 操作ぷよを時計回りに回転させる
     */
    rotatePuyo() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      const newRotation = (rotation + 1) % 4;
      if (this.isPositionValid(x, y, newRotation)) {
        this.currentPuyo.rotation = newRotation;
      }
    }

    /**
     * 操作ぷよを反時計回りに回転させる
     */
    rotatePuyoCounterClockwise() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      const newRotation = (rotation - 1 + 4) % 4;
      if (this.isPositionValid(x, y, newRotation)) {
        this.currentPuyo.rotation = newRotation;
      }
    }

    // ========== ゲームの進行 ==========
    /**
     * ぷよを1マス落下させるメイン処理
     * @returns {boolean} - ゲームオーバーならtrueを返す
     */
    fallOneStep() { 
      if (!this.currentPuyo) return false;
        
      const { x, y, rotation } = this.currentPuyo;

      // 1マス下に移動可能かチェック
      if (this.isPositionValid(x, y + 1, rotation)) {
        // 衝突しなければ1マス下に動かす
        this.currentPuyo.y++;
      } else {
        // 衝突したら、ぷよを着地させる
        this.landPuyo();

        // 連鎖処理
        this.handleChain();

        // ゲームオーバー判定
        if (this.isGameOver()) {
          console.log("GAME OVER");
          this.currentPuyo = null; // ゲームオーバー後は操作不能に
          return true;
        }

        // 新しいぷよを生成
        this.spawnNewPuyo();
      }
      return false;
    }

    /**
     * 操作ぷよを盤面に固定（着地）させる
     */
    landPuyo() {
      if (!this.currentPuyo) return;
      const { x, y, color1, color2, rotation } = this.currentPuyo;

      // 軸ぷよを盤面に書き込む
      this.board[y][x] = color1;

      // 子ぷよの位置を計算して盤面に書き込む
      const childPos = this.getChildPuyoPosition(x, y, rotation);
      this.board[childPos.y][childPos.x] = color2;

      this.currentPuyo = null; // 固定したら操作対象をなくす
    }

    /**
     * 連鎖処理（ぷよの削除と落下を繰り返す）
     */
    handleChain() {
      let chainCount = 0;
      while (true) {
        // 4つ以上繋がったぷよを消す
        const cleared = this.checkAndClearPuyos();
        if (cleared) {
          chainCount++;
          console.log(`${chainCount}連鎖！`);
          // ぷよが消えたら、重力を適用してぷよを落とす
          this.applyGravity();
        } else {
          // 何も消えなくなったらループを抜ける
          break;
        }
      }
    }
    
    /**
     * 新しい操作ぷよを生成する
     */
    spawnNewPuyo() {
      // 色は1から始まる整数とする（0は空マス）
      const color1 = Math.floor(Math.random() * this.colors.length) + 1;
      const color2 = Math.floor(Math.random() * this.colors.length) + 1;

      this.currentPuyo = {
        x: 2,        // 盤面の中央上部
        y: 1,        // 盤面の見えないエリアから出現
        rotation: 0, // 0:上, 1:右, 2:下, 3:左
        color1: color1,
        color2: color2,
      };
    }
    
    /**
     * ゲームオーバー状態か判定する
     * @returns {boolean} - ゲームオーバーならtrue
     */
    isGameOver() {
      return this.deadTiles.some(tile => this.board[tile.y][tile.x] !== 0);
    }


    // ========== 判定・計算ロジック ==========
    
    /**
     * 指定した座標のぷよと繋がっている同色のぷよのグループを探す
     * @param {number} startX - 探索を開始するX座標
     * @param {number} startY - 探索を開始するY座標
     * @returns {Array<{x: number, y: number}>} - 繋がっているぷよの座標リスト
     */
    findConnectedPuyos(startX, startY) {

      const targetColor = this.board[startY][startX];
      if (targetColor === 0) return [];

      const connected = [];
      const queue = [{ x: startX, y: startY }];
      const visited = new Set([`${startX},${startY}`]);

      while (queue.length > 0) {

        const { x, y } = queue.shift();
        connected.push({ x, y });

        const neighbors = [
            { x, y: y - 1 }, // 上
            { x, y: y + 1 }, // 下
            { x: x - 1, y }, // 左
            { x: x + 1, y }, // 右
        ];

        for (const neighbor of neighbors) {
          const nx = neighbor.x;
          const ny = neighbor.y;
          const key = `${nx},${ny}`;

          if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height + 2 || visited.has(key) || this.board[ny][nx] !== targetColor) {
            continue;
          }
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
      return connected;
    }

    /**
     * 盤面全体をチェックして、4つ以上繋がっているぷよを消す
     * @returns {boolean} - ぷよを1つでも消したらtrue
     */
    checkAndClearPuyos() {
        const puyosToClear = new Set();
        const checked = new Set();

        for (let y = 0; y < this.height + 2; y++) {
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`;
                if (this.board[y][x] !== 0 && !checked.has(key)) {
                    const connected = this.findConnectedPuyos(x, y);
                    if (connected.length >= 4) {
                        connected.forEach(puyo => puyosToClear.add(`${puyo.x},${puyo.y}`));
                    }
                    connected.forEach(puyo => checked.add(`${puyo.x},${puyo.y}`));
                }
            }
        }

        if (puyosToClear.size > 0) {
            puyosToClear.forEach(key => {
                const [x, y] = key.split(',').map(Number);
                this.board[y][x] = 0;
            });
            return true;
        }
        return false;
    }

    /**
     * 空中に浮いているぷよを下に落とす（重力適用）
     */
    applyGravity() {
      for (let x = 0; x < this.width; x++) {
        let emptyRow = -1;
        for (let y = this.height + 1; y >= 0; y--) {
            if (this.board[y][x] === 0) {
                emptyRow = y;
                break;
            }
        }

        if (emptyRow !== -1) {
          for (let y = emptyRow - 1; y >= 0; y--) {
            if (this.board[y][x] !== 0) {
              this.board[emptyRow][x] = this.board[y][x];
              this.board[y][x] = 0;
              emptyRow--;
            }
          }
        }
      }
    }
    
    /**
     * 指定した位置・回転でぷよが存在できるかチェックする
     * @param {number} x - 軸ぷよのX座標
     * @param {number} y - 軸ぷよのY座標
     * @param {number} rotation - ぷよの回転状態
     * @returns {boolean} - 配置可能ならtrue
     */
    isPositionValid(x, y, rotation) {

      // 軸ぷよの位置をチェック
      if (this.checkCollision(x, y)) return false;

      // 子ぷよの位置をチェック
      const childPos = this.getChildPuyoPosition(x, y, rotation);
      if (this.checkCollision(childPos.x, childPos.y)) return false;
      
      return true; // どこにも衝突しなければOK
    }
    
    /**
     * 1つのぷよが指定した座標に存在できるかチェック（衝突判定）
     * @param {number} puyoX - ぷよのX座標
     * @param {number} puyoY - ぷよのY座標
     * @returns {boolean} - 存在できない(衝突する)ならtrue
     */
    checkCollision(puyoX, puyoY) {
        // 盤面の範囲外かチェック (左右の壁と床)
        if (puyoX < 0 || puyoX >= this.width || puyoY >= this.height + 2) {
            return true;
        }
        // 天井より上はOKとする（ぷよの出現や回転のため）
        if (puyoY < 0) {
            return false;
        }
        // 盤面にすでにぷよがあるかチェック
        if (this.board[puyoY][puyoX] !== 0) {
            return true;
        }
        return false;
    }
    
    /**
     * 子ぷよの相対位置を取得する
     * @param {number} x - 軸ぷよのX座標
     * @param {number} y - 軸ぷよのY座標
     * @param {number} rotation - 回転状態
     * @returns {{x: number, y: number}} - 子ぷよの絶対座標
     */
    getChildPuyoPosition(x, y, rotation) {
      switch (rotation) {
          case 0: return { x: x, y: y - 1 }; // 上
          case 1: return { x: x + 1, y: y }; // 右
          case 2: return { x: x, y: y + 1 }; // 下
          case 3: return { x: x - 1, y: y }; // 左
          default: return { x, y };
      }
    }
}