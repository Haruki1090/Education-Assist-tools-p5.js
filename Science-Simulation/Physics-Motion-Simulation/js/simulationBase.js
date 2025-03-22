/**
 * SimulationBase - すべてのシミュレーションの基底クラス
 * このクラスを継承して各シミュレーションを実装する
 */
class SimulationBase {
    constructor() {
        this.isRunning = false;
        this.time = 0;
        this.timeStep = 0.016; // 60FPSに相当
        this.parameters = {};
        this.dataToDisplay = {};
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
        return "基本シミュレーション";
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
        
        this.updateDataDisplay();
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
     * ベクトルを描画する
     * @param {Number} x - 始点のX座標
     * @param {Number} y - 始点のY座標
     * @param {Number} vx - ベクトルのX成分
     * @param {Number} vy - ベクトルのY成分
     * @param {String} color - 色
     * @param {String} label - ラベル
     */
    drawVector(x, y, vx, vy, color, label) {
        const scale = 20; // スケール調整
        const arrowSize = 7; // 矢印の大きさ
        
        // ベクトルの長さを計算
        const length = Math.sqrt(vx * vx + vy * vy);
        
        // ゼロベクトルでなければ描画
        if (length > 0) {
            this.p5.push();
            this.p5.stroke(color);
            this.p5.strokeWeight(2);
            this.p5.fill(color);
            
            // ベクトル本体を描画
            this.p5.line(x, y, x + vx * scale, y + vy * scale);
            
            // 矢印を描画
            const angle = Math.atan2(vy, vx);
            const endX = x + vx * scale;
            const endY = y + vy * scale;
            
            this.p5.push();
            this.p5.translate(endX, endY);
            this.p5.rotate(angle);
            this.p5.triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
            this.p5.pop();
            
            // ラベルがあれば描画
            if (label) {
                this.p5.noStroke();
                this.p5.textSize(12);
                this.p5.textAlign(this.p5.CENTER);
                this.p5.text(label, endX + 10 * Math.cos(angle), endY + 10 * Math.sin(angle));
            }
            
            this.p5.pop();
        }
    }
    
    /**
     * エネルギーバーを描画する
     * @param {Number} x - X座標 
     * @param {Number} y - Y座標
     * @param {Number} width - 幅
     * @param {Number} height - 高さ
     * @param {Number} kineticEnergy - 運動エネルギー
     * @param {Number} potentialEnergy - 位置エネルギー
     * @param {Number} totalEnergy - 全エネルギー
     */
    drawEnergyBar(x, y, width, height, kineticEnergy, potentialEnergy, totalEnergy) {
        this.p5.push();
        
        // 背景
        this.p5.fill(230);
        this.p5.stroke(180);
        this.p5.rect(x, y, width, height);
        
        // 全体のスケールを調整
        const scale = width / totalEnergy;
        
        // 位置エネルギー（緑）
        this.p5.fill(76, 175, 80);
        this.p5.noStroke();
        this.p5.rect(x, y, potentialEnergy * scale, height);
        
        // 運動エネルギー（青）
        this.p5.fill(33, 150, 243);
        this.p5.rect(x + potentialEnergy * scale, y, kineticEnergy * scale, height);
        
        // ラベル
        this.p5.fill(0);
        this.p5.textSize(10);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.text("エネルギー: ", x, y - 10);
        
        // 凡例
        const legendY = y - 10;
        this.p5.fill(33, 150, 243);
        this.p5.rect(x + 70, legendY - 5, 10, 10);
        this.p5.fill(0);
        this.p5.text("運動", x + 85, legendY);
        
        this.p5.fill(76, 175, 80);
        this.p5.rect(x + 120, legendY - 5, 10, 10);
        this.p5.fill(0);
        this.p5.text("位置", x + 135, legendY);
        
        this.p5.pop();
    }
}