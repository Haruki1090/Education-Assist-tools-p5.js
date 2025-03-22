/**
 * WaveBase - すべての波動シミュレーションの基底クラス
 * このクラスを継承して各波動シミュレーションを実装する
 */
class WaveBase {
    constructor() {
        this.isRunning = false;
        this.time = 0;
        this.timeStep = 0.016; // 60FPSに相当
        this.parameters = {};
        this.dataToDisplay = {};
        this.waveSources = [];
        this.colorScale = ['#0000FF', '#4444FF', '#8888FF', '#CCCCFF', '#FFFFFF', '#FFCCCC', '#FF8888', '#FF4444', '#FF0000'];
    }

    /**
     * シミュレーションを初期化する
     * @param {Object} p5Instance - p5.jsのインスタンス
     */
    init(p5Instance) {
        this.p5 = p5Instance;
        this.reset();
    }

    /**
     * シミュレーションのパラメータを定義する
     * オーバーライドして使用する
     * @returns {Array} パラメータ定義の配列
     */
    defineParameters() {
        return [];
    }

    /**
     * シミュレーションの説明を返す
     * オーバーライドして使用する
     * @returns {String} シミュレーションの説明
     */
    getDescription() {
        return "基本波動シミュレーション";
    }

    /**
     * シミュレーションを開始する
     */
    start() {
        this.isRunning = true;
    }

    /**
     * シミュレーションを停止する
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * シミュレーションをリセットする
     * オーバーライドして使用する
     */
    reset() {
        this.time = 0;
        this.isRunning = false;
        
        // パラメータをデフォルト値に設定
        const paramDefs = this.defineParameters();
        this.parameters = {};
        
        for (const param of paramDefs) {
            this.parameters[param.id] = param.default;
        }
        
        // 波源の初期化
        this.initWaveSources();
        
        this.updateDataDisplay();
    }

    /**
     * 波源を初期化する
     * オーバーライドして使用する
     */
    initWaveSources() {
        this.waveSources = [];
    }

    /**
     * シミュレーションを更新する
     * オーバーライドして使用する
     */
    update() {
        if (this.isRunning) {
            this.time += this.timeStep;
            this.updateDataDisplay();
        }
    }

    /**
     * シミュレーションを描画する
     * オーバーライドして使用する
     */
    draw() {
        // 基本的な実装（オーバーライドして使用）
        this.p5.background(240);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.text("シミュレーションを実装してください", this.p5.width / 2, this.p5.height / 2);
    }

    /**
     * パラメータの値を設定する
     * @param {String} id - パラメータID
     * @param {Number} value - 設定する値
     */
    setParameter(id, value) {
        if (this.parameters.hasOwnProperty(id)) {
            this.parameters[id] = value;
            this.onParameterChanged(id, value);
        }
    }

    /**
     * パラメータ変更時の処理
     * オーバーライドして使用する
     * @param {String} id - 変更されたパラメータのID
     * @param {Number} value - 新しい値
     */
    onParameterChanged(id, value) {
        // デフォルトでは何もしない
    }

    /**
     * データ表示を更新する
     * オーバーライドして使用する
     */
    updateDataDisplay() {
        // 基本的なデータを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            }
        };
    }

    /**
     * 表示するデータを取得する
     * @returns {Object} 表示用データ
     */
    getDataToDisplay() {
        return this.dataToDisplay;
    }
    
    /**
     * 波の高さの色を計算する
     * @param {Number} value - 波の高さ (-1.0 から 1.0 の間)
     * @returns {String} 色のRGB値
     */
    getWaveColor(value) {
        // -1.0 から 1.0 の値を 0 から 8 の整数インデックスに変換
        const idx = Math.floor((value + 1) * 4);
        // 範囲外の値を修正
        const safeIdx = Math.max(0, Math.min(8, idx));
        return this.colorScale[safeIdx];
    }
    
    /**
     * 2D波動場を描画する
     * @param {Array} waveField - 2次元配列の波動場
     * @param {Number} cellSize - セルの大きさ
     * @param {Number} amplitudeScale - 振幅のスケール
     */
    drawWaveField(waveField, cellSize, amplitudeScale = 1) {
        const width = waveField.length;
        const height = waveField[0].length;
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const value = waveField[x][y] * amplitudeScale;
                const color = this.getWaveColor(value);
                
                this.p5.noStroke();
                this.p5.fill(color);
                this.p5.rect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    /**
     * 1D波形を描画する
     * @param {Array} waveData - 波形データの配列
     * @param {Number} x - 描画開始X座標
     * @param {Number} y - 描画開始Y座標
     * @param {Number} width - 描画幅
     * @param {Number} height - 描画高さ
     * @param {String} color - 線の色
     */
    drawWaveform(waveData, x, y, width, height, color = '#3498db') {
        const len = waveData.length;
        
        this.p5.push();
        this.p5.translate(x, y + height / 2);
        
        // 軸を描画
        this.p5.stroke(200);
        this.p5.strokeWeight(1);
        this.p5.line(0, 0, width, 0);
        
        // 波形を描画
        this.p5.stroke(color);
        this.p5.strokeWeight(2);
        this.p5.noFill();
        this.p5.beginShape();
        
        for (let i = 0; i < len; i++) {
            const xPos = (i / (len - 1)) * width;
            const yPos = -waveData[i] * (height / 2);
            this.p5.vertex(xPos, yPos);
        }
        
        this.p5.endShape();
        this.p5.pop();
    }

    /**
     * 波源を描画する
     */
    drawWaveSources() {
        for (let i = 0; i < this.waveSources.length; i++) {
            const source = this.waveSources[i];
            
            // 波源の円を描画
            this.p5.fill(source.color || '#e74c3c');
            this.p5.stroke(0, 50);
            this.p5.ellipse(source.x, source.y, 15, 15);
            
            // 波源のラベルを描画
            this.p5.fill(0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
            this.p5.textSize(10);
            this.p5.text(`S${i + 1}`, source.x, source.y);
            
            // 波源の範囲を示す円を描画（アクティブな場合）
            if (source.active) {
                this.p5.noFill();
                this.p5.stroke(source.color || '#e74c3c');
                this.p5.strokeWeight(1);
                
                // 時間とともに拡大する波面を表現
                const radius = this.time * source.speed * 20;
                this.p5.ellipse(source.x, source.y, radius * 2, radius * 2);
            }
        }
    }

    /**
     * マウスドラッグでの波源移動の処理
     * @param {Number} mouseX - マウスX座標
     * @param {Number} mouseY - マウスY座標
     */
    handleMouseDragged(mouseX, mouseY) {
        // 選択中の波源がある場合はその位置を更新
        if (this.selectedSource !== undefined) {
            const source = this.waveSources[this.selectedSource];
            if (source) {
                source.x = this.p5.constrain(mouseX, 0, this.p5.width);
                source.y = this.p5.constrain(mouseY, 0, this.p5.height);
            }
        }
    }

    /**
     * マウスプレスでの波源選択の処理
     * @param {Number} mouseX - マウスX座標
     * @param {Number} mouseY - マウスY座標
     */
    handleMousePressed(mouseX, mouseY) {
        // マウス位置に最も近い波源を選択
        let minDist = 20; // 選択の閾値
        this.selectedSource = undefined;
        
        for (let i = 0; i < this.waveSources.length; i++) {
            const source = this.waveSources[i];
            const d = this.p5.dist(mouseX, mouseY, source.x, source.y);
            
            if (d < minDist) {
                minDist = d;
                this.selectedSource = i;
            }
        }
    }

    /**
     * マウスリリースでの波源選択解除の処理
     */
    handleMouseReleased() {
        this.selectedSource = undefined;
    }

    /**
     * 波の位相を計算 (0～2πの範囲)
     * @param {Number} time - 時間
     * @param {Number} frequency - 周波数
     * @param {Number} phaseShift - 位相シフト
     * @returns {Number} 位相
     */
    calculatePhase(time, frequency, phaseShift = 0) {
        const phase = (time * frequency * Math.PI * 2 + phaseShift) % (Math.PI * 2);
        return phase;
    }

    /**
     * 正弦波の値を計算
     * @param {Number} phase - 位相
     * @param {Number} amplitude - 振幅
     * @returns {Number} 正弦波の値
     */
    calculateSineWave(phase, amplitude = 1) {
        return amplitude * Math.sin(phase);
    }

    /**
     * 距離に基づく波の減衰を計算
     * @param {Number} distance - 波源からの距離
     * @param {Number} attenuationFactor - 減衰係数
     * @returns {Number} 減衰係数
     */
    calculateAttenuation(distance, attenuationFactor = 0.01) {
        return 1 / (1 + attenuationFactor * distance);
    }

    /**
     * 2点間の距離を計算
     * @param {Number} x1 - 点1のX座標
     * @param {Number} y1 - 点1のY座標
     * @param {Number} x2 - 点2のX座標
     * @param {Number} y2 - 点2のY座標
     * @returns {Number} 距離
     */
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    /**
     * レジェンド（凡例）を描画
     * @param {Number} x - X座標
     * @param {Number} y - Y座標
     * @param {Number} width - 幅
     * @param {Number} height - 高さ
     */
    drawLegend(x, y, width, height) {
        this.p5.push();
        this.p5.translate(x, y);
        
        // 背景
        this.p5.fill(255, 255, 255, 200);
        this.p5.stroke(200);
        this.p5.rect(0, 0, width, height, 5);
        
        // タイトル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.textSize(14);
        this.p5.text("振幅", 10, 10);
        
        // カラースケール
        const barHeight = 20;
        const barY = 40;
        const barWidth = width - 20;
        
        for (let i = 0; i < barWidth; i++) {
            const value = (i / barWidth) * 2 - 1; // -1 to 1
            const color = this.getWaveColor(value);
            this.p5.stroke(color);
            this.p5.line(10 + i, barY, 10 + i, barY + barHeight);
        }
        
        // ラベル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.textSize(12);
        this.p5.text("-1", 10, barY + barHeight + 15);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.text("0", 10 + barWidth / 2, barY + barHeight + 15);
        this.p5.textAlign(this.p5.RIGHT, this.p5.CENTER);
        this.p5.text("+1", 10 + barWidth, barY + barHeight + 15);
        
        this.p5.pop();
    }
}