//ぷよぷよのコア機能をまとめたクラス
export default class PuyoLogic {
  /**
   * @param {object} options - 盤面の設定オプション
   * @param {Number} [options.width=6] - 盤面の列数
   * @param {Number} [options.height=12] - 盤面の行数（ぷよが表示されるエリア）
   * @param {string[]} [options.colors] - ぷよの色の配列
   * @param {Number} [options.size=40] - 1マスのサイズ (描画用)
   * @param {Number} [options.offsetX=100] - 盤面のX座標オフセット (描画用)
   * @param {Number} [options.offsetY=50] - 盤面のY座標オフセット (描画用)
   * @param {object[]} [options.deadTiles] - ゲームオーバーになるマス
   * @param {Number} [options.nexts=2] - ネクストの数
   * @param {object[]} [options.nextPos] - ネクストの表示位置とサイズの配列. {x: X座標, y: Y座標, size: サイズ}のオブジェクトを要素に持つ配列
   * @param {class} PuyoController - PuyoControllerのクラス
  */
    constructor({
      // 盤面のサイズや、ぷよの色数、マスのサイズなどのデフォルト値を設定
      width = 6,
      height = 12,
      nextPos = [{x:8,y:4,size:1},{x:8,y:1,size:1}], //ネクストの表示位置 最後の要素が次の手
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
      deadTiles = [{x:2, y:2}], //ここにぷよがたまったらゲームオーバー
      nexts = 2, //ネクストの数
    }={},PuyoController){
      this.PuyoController=PuyoController; //親クラス(PuyoController)を取得
      /**
       * @type {Array<{color1: string, color2: string}>}
       */
      this.nextTsumos = []; //ネクストのぷよを格納する配列
      /**
       * ネクストの数
       */
      this.nexts = nexts; //ネクストの数
      this.nextPos = nextPos; //ネクストの表示位置
      this.score = 0; // ゲーム中の点数
      this.allCleared = false; //全消ししたらtrueになるフラグ
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
      this.virtualRotation = 0; //回転できないときに回転方向を記憶しておくための変数
      this.tsumoManageList = []; //ツモのリストを管理する配列
    }
    // ========== ぷよの操作 ==========
    /**
     * 操作ぷよを左に1マス移動する
     * @return {boolean} - 移動に成功したらtrue、失敗したらfalseを返す
     */
    movePuyoLeft() {
      if (!this.currentPuyo) return false;
      const { x, y, rotation } = this.currentPuyo;
      if (this.isPositionValid(x - 1, y, rotation)) {
        this.currentPuyo.x--;
        return true;
      }else{
        return false;
      }
    }

    /**
     * 操作ぷよを右に1マス移動する
     * @return {boolean} - 移動に成功したらtrue、失敗したらfalseを返す
     */
    movePuyoRight() {
      if (!this.currentPuyo) return false;
      const { x, y, rotation } = this.currentPuyo;
      if (this.isPositionValid(x + 1, y, rotation)) {
        this.currentPuyo.x++;
        return true;
      }else{
        return false;
      }
    }

    /**
     * 操作ぷよを時計回りに回転させる
     */
    rotatePuyo() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      this.virtualRotation = (this.virtualRotation +1) % 4;
      const newRotation = this.virtualRotation;
      if(this.rotationSystem({x,y,newRotation})){
        this.virtualRotation =(this.virtualRotation -1) % 4;
      }

    }

    /**
     * 操作ぷよを反時計回りに回転させる
     */
    rotatePuyoCounterClockwise() {
      if (!this.currentPuyo) return;
      const { x, y, rotation } = this.currentPuyo;
      this.virtualRotation = (this.virtualRotation -1 + 4) % 4;
      const newRotation = this.virtualRotation;
      if(this.rotationSystem({x,y,newRotation})){
        this.virtualRotation =(this.virtualRotation +1) % 4;
      }
    }

    /**
     * AIが考えた手に従って、ぷよを実際に操作する関数
     * @param {object} move - { rotation: 回転回数, x: 目標X座標 }
     */
    performAIMove(move) {
      if (!this.currentPuyo || !move) return;
      
      let targetRotation = move.rotation;
      while (this.currentPuyo.rotation !== targetRotation) {
        this.rotatePuyo();
      }

      while (this.currentPuyo.x < move.x) {
        this.movePuyoRight();
      }
      while (this.currentPuyo.x > move.x) {
        this.movePuyoLeft();
      }
    }

    /**
     * AIが次にどの手を指すかを考えるメイン関数
     */
    thinkNextMove() {
      // このメソッドは実際にはAILogic.jsの関数を呼び出すための窓口となるか、
      // PuyoController側で直接AILogic.jsの関数を呼び出す。
      // 今回はPuyoControllerで直接呼び出すため、このメソッドは厳密には不要だが、
      // 役割分担として残しておいても良い。
      // ここでは、AIの思考ロジックがPuyoLogicの外にあることを示す。
    }

    /**
     * 移動先候補を順番にチェックし、回転した時の移動を決定
     * @return {boolean} - 天井に当たったらtrue
     */
    rotationSystem(puyo){
      const checkDicts = {
        0: {0:{x:0,y:0}},//上向きの時
        1: {0:{x:0,y:0},1:{x:-1,y:0},2:{x:1,y:0}},//右向きの時
        3: {0:{x:0,y:0},1:{x:-1,y:0},2:{x:1,y:0}},//左向きの時
        2: {0:{x:0,y:0},1:{x:0,y:-0.5},2:{x:0,y:-1}},//下向きの時
      }
      const checks = checkDicts[puyo.newRotation];
      for(const check in checks){
        if(this.isPositionValid(puyo.x+checks[check].x, puyo.y+checks[check].y, puyo.newRotation)){
          if(this.checkCollisionCeiling(puyo.x+checks[check].x, puyo.y+checks[check].y)){
            console.log("天井にぶつかった");
            return true; //天井に当たったときは回転を無効化
          }
          this.currentPuyo.x += checks[check].x;
          this.currentPuyo.y += checks[check].y;
          if(Math.abs(this.currentPuyo.rotation-puyo.newRotation)===2){ //回転が上下反転の時(挟まれているときの回転)の挙動
            switch (puyo.newRotation){
              case 0: //上を向いたとき
                this.currentPuyo.y+=1;
                break;
              case 2: //下を向いたとき
                this.currentPuyo.y-=1;
                break;
            }

          }
          this.currentPuyo.rotation = puyo.newRotation;
          break;
        }
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
      if (this.isPositionValid(x, y + 0.5, rotation)) {
        // 衝突しなければ1マス下に動かす
        this.currentPuyo.y+=0.5;
        if(this.PuyoController.FallIntervalNow===this.PuyoController.FallIntervalFast){
          if(Number.isInteger(this.currentPuyo.y)) this.score++;
        }
      } else {
        // 衝突
        return;
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
      if(y!=0){ //天井の段には書き込まない
        this.board[y][x] = color1;
      }

      // 子ぷよの位置を計算して盤面に書き込む
      const childPos = this.getChildPuyoPosition(x, y, rotation);
      if(childPos.y!=0){ //天井の段には書き込まない
        this.board[childPos.y][childPos.x] = color2;
      }

      this.currentPuyo = null; // 固定したら操作対象をなくす
    }
    
    /**
     * 新しい操作ぷよを生成する
     */
    spawnNewPuyo() {
      // 色は1から始まる整数とする（0は空マス）
      const colorObj = this.nextTsumos.pop();
      const color1 = colorObj.color1;
      const color2 = colorObj.color2;
      this.nextTsumos.unshift(this.generateNextTsumo()); //新たにネクストを生成して追加

      this.currentPuyo = {
        x: 2,        // 盤面の中央上部
        y: 1,        // 盤面の見えないエリアから出現
        rotation: 0, // 0:上, 1:右, 2:下, 3:左
        color1: color1,
        color2: color2,
      };
      this.virtualRotation = this.currentPuyo.rotation; //回転できないときに回転方向を記憶しておくための変数を初期化
      // 関数を呼び出して、PuyoControllerにぷよ生成を通知
      this.PuyoController.puyoGenerated();
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
     * @param {string} startX - 探索を開始するX座標
     * @param {string} startY - 探索を開始するY座標
     * @returns {[Array<{x: string, y: string}>,{color:string,number:Number}]} - 繋がっているぷよの座標リスト(インデックス0)、それの情報オブジェクト(インデックス1)
     */
    findConnectedPuyos(startX, startY) {

      /**
       * @type {Array<{color:string,number:Number}>} -消すぷよの数、色の情報オブジェクトの配列
       */
      let puyoInfo = {};
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

          if (nx < 0 || nx >= this.width || ny < 2 || ny >= this.height + 2 || visited.has(key) || this.board[ny][nx] !== targetColor) {
            continue;
          }
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
      puyoInfo={color:targetColor,number:connected.length}
      return [connected,puyoInfo];
    }

    /**
     * 盤面全体をチェックして、4つ以上繋がっているぷよを消す
     * @returns {Array<{color:string,number:Number}>} - ぷよを1つでも消したら消したぷよの情報オブジェクトの配列を返す
     * 
     */
    checkAndClearPuyos() {
        const puyosToClear = new Set();
        const checked = new Set();
        const puyoToClearInfo = []; //消すぷよの色、数が入るオブジェクトの配列

        for (let y = 2; y < this.height + 2; y++) {
            for (let x = 0; x < this.width; x++) {
                const key = `${x},${y}`;
                if (this.board[y][x] !== 0 && !checked.has(key)) {
                    const [connected,puyoInfo] = this.findConnectedPuyos(x, y);
                    if (connected.length >= 4) {
                        puyoToClearInfo.push(puyoInfo);
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
            return puyoToClearInfo;
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
     * @param {Number} x - 軸ぷよのX座標
     * @param {Number} y - 軸ぷよのY座標の切り上げ
     * @param {Number} rotation - ぷよの回転状態
     * @returns {boolean} - 配置可能ならtrue
     */
    isPositionValid(x, y, rotation) {
      const judgeY = Math.ceil(y);//半マス落下に対応するため、y座標を切り上げ
      // 軸ぷよの位置をチェック
      if (this.checkCollision(x, judgeY)) return false;

      // 子ぷよの位置をチェック
      const childPos = this.getChildPuyoPosition(x, judgeY, rotation);
      if (this.checkCollision(childPos.x, childPos.y)) return false;
      
      return true; // どこにも衝突しなければOK
    }
    
    /**
     * 1つのぷよが指定した座標に存在できるかチェック（衝突判定）
     * @param {string} puyoX - ぷよのX座標
     * @param {string} puyoY - ぷよのY座標
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
     * 
     * @param {Number} puyoX 
     * @param {Number} puyoY 
     * @return {boolean} - 天井に当たったらtrue
     */
    checkCollisionCeiling(puyoX, puyoY){ //一番上の行(1行目,14段目)に軸ぷよがぶつかったらいけない
      if(Math.ceil(puyoY) <= 0){
        return true;
      }
      return false;
    }
    
    /**
     * 子ぷよの相対位置を取得する
     * @param {Number} x - 軸ぷよのX座標
     * @param {Number} y - 軸ぷよのY座標
     * @param {Number} rotation - 回転状態
     * @returns {{x: Number, y: Number}} - 子ぷよの絶対座標
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
    /**
     * 次の手を生成する関数
     * @return {{color1: Number, color2: Number}} - 次の手の色情報のオブジェクトの配列
     */
    generateNextTsumo(){
      const colors =  Array.from({length: this.colors.length - 1}, (_, i) => i + 1); //0は空マスなので除外[1,2,3,4,...,this.colors.length-1]
      if(this.tsumoManageList.length === 0){ //ツモの管理リストが空なら新たに生成
        this.tsumoManageList = createPileOfColors().slice(0); //配列のコピーを作成
        this.makeListRandom(this.tsumoManageList); //配列の順番をランダムにする
        return {color1: this.tsumoManageList.pop(), color2: this.tsumoManageList.pop()};
      }else{
        this.makeListRandom(this.tsumoManageList); //配列の順番をランダムにする
        return {color1: this.tsumoManageList.pop(), color2: this.tsumoManageList.pop()};
      }
      function createPileOfColors(){ //一巡用(4色なら128手,256色分)のツモの色の配列を生成
        let pileOfColors = [];
        for(const color of colors){
          for(let i=0; i<64; i++){ //64個ずつ
            pileOfColors.push(color);
          }
        }
        return pileOfColors;
      }
    }
    /**
     * 
     * @returns {Array<{color1: Number, color2: Number}>} - 最初の二手の色情報のオブジェクトの配列
     */
    generateFirstTsumo(){
      const tsumoList = [];
      const colors = Array.from({length: this.colors.length - 1}, (_, i) => i + 1); //0は空マスなので除外[1,2,3,4,...]
      this.makeListRandom(colors);
      const threeColors = colors.slice(0,3); //最初の二手は3色から選ぶ
      for(let i=0; i<2; i++){ //二手分生成
        const randomThreeColors = [];
        this.makeListRandom(threeColors);
        randomThreeColors[0] = threeColors[0];
        this.makeListRandom(threeColors);
        randomThreeColors[1] = threeColors[0];
        tsumoList.push({color1: randomThreeColors[0], color2: randomThreeColors[1]});
      }
      return tsumoList;
    }
    /**
     * 与えられた配列の順番をランダムにする
     * @param {Array} list 
     */
    makeListRandom(list){
      list.sort(() => Math.random() - 0.5);
    }

    // スコア計算
/**
 * 点数計算を行う
 * @param {[{color:string,number:Number}]} puyoInfoArray - 消えたぷよの色、連結数
 * @param {Number} chain - 計算するときの連鎖数
 * @returns {Number} - 点数を返す
 */
    scoreCalculator(puyoInfoArray,chain){
        const chainPower = [0,0,8,16,32,64,96,128,160,192,224,256,288,320,352,384,416,448,480,512]; //連鎖ボーナス(1~19連鎖)
        const colorBonus = [0,0,3,6,12,24]; //色数ボーナス(1~5色)
        const groupBonus = [0,0,0,0,0,2,3,4,5,6,7,10];  //連結ボーナス(1~11連結)
        //連鎖、色数、連結ボーナスの変数
        let cp = 0;
        let cb = 0;
        let gb = 0;
        let colorsNum = 0; //同時に消した色の種類の数
        let colors = [];
        let puyoNum = 0; //消えたぷよの数
        for(const puyoInfoObj of puyoInfoArray){
            colors.push(puyoInfoObj.color);
            puyoNum += puyoInfoObj.number;
            //色数が色数ボーナスに用意されてない程多いとき
            if(puyoInfoObj.number >= groupBonus.length){
                gb += 10; //12連結以上は連結ボーナス+10
            }else{
                gb += groupBonus[puyoInfoObj.number];
            }
        }
        colorsNum = [...new Set(colors)].length; //色の種類の数
        if(colorsNum >= colorBonus.length){
            cb += 3*(2**(colorsNum-2));
        }else{
            cb += colorBonus[colorsNum];
        }
        if(chain >= chainPower.length){
            cp += 32*(chain - 3);
        }else{
            cp += chainPower[chain];
        }
        let score = 10*puyoNum*(cp+cb+gb);
        if(score===0) score =40; //4連結1連鎖の場合、40点とする
        if(this.allClear()){
            console.log("全消し");
            this.allCleared = true;
        }
        return score;
    }
    /**
     * 全消しかを判定する
     * @returns {boolean} - 全消しならtrue
     */
    allClear(){
      const board = this.board;
      for(const row of board){
        for(const tile of row){
          if(tile > 0) return false; //空でなかったらfalse
        }
      }
      return true;
    }
}