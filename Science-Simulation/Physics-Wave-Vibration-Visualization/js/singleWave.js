/**
 * SingleWave - 単一波の観察
 * 正弦波の基本的な性質（振幅、周波数、波長、位相）を観察するシミュレーション
 */
class SingleWave extends WaveBase {
    constructor() {
        super();
        this.waveData = [];
        this.waveData2D = [];
        this.cellSize = 5;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "amplitude",
                name: "振幅",
                min: 0.1,
                max: 1.0,
                step: 0.1,
                default: 1.0,
                unit: ""
            },
            {
                id: "frequency",
                name: "周波数",
                min: 0.1,
                max: 5.0,
                step: 0.1,
                default: 1.0,
                unit: "Hz"
            },
            {
                id: "wavelength",
                name: "波長",
                min: 20,
                max: 200,
                step: 10,
                default: 100,
                unit: "px"
            },
            {
                id: "phase",
                name: "初期位相",
                min: 0,
                max: 360,
                step: 15,
                default: 0,
                unit: "°"
            },
            {
                id: "waveType",
                name: "波の種類",
                min: 0,
                max: 3,
                step: 1,
                default: 0,
                unit: "(0:正弦波, 1:三角波, 2:矩形波, 3:鋸歯波)"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "単一波の観察シミュレーションです。波の基本的な性質（振幅、周波数、波長、位相）を調整して、波の振る舞いを観察できます。一次元波形と二次元波動場の両方を表示しています。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 1D波形データの初期化
        this.initWaveData();
        
        // 2D波動場の初期化
        this.initWaveField();
    }

    /**
     * 1D波形データの初期化
     */
    initWaveData() {
        this.waveData = new Array(500).fill(0);
    }

    /**
     * 2D波動場の初期化
     */
    initWaveField() {
        // キャンバスサイズに基づいて2D波動場のサイズを計算
        const width = Math.floor(this.p5.width / this.cellSize);
        const height = Math.floor(this.p5.height / this.cellSize / 2); // 上半分のみ使用
        
        // 2D配列の初期化
        this.waveData2D = new Array(width);
        for (let i = 0; i < width; i++) {
            this.waveData2D[i] = new Array(height).fill(0);
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        // 特に処理なし
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // 1D波形データの更新
            this.updateWaveData();
            
            // 2D波動場の更新
            this.updateWaveField();
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }

    /**
     * 1D波形データの更新
     */
    updateWaveData() {
        const amplitude = this.parameters.amplitude;
        const frequency = this.parameters.frequency;
        const wavelength = this.parameters.wavelength;
        const phaseShift = this.parameters.phase * Math.PI / 180; // 度からラジアンに変換
        const waveType = Math.floor(this.parameters.waveType);
        
        for (let i = 0; i < this.waveData.length; i++) {
            // 位置に基づく位相
            const positionPhase = (i / wavelength) * Math.PI * 2;
            
            // 時間に基づく位相
            const timePhase = this.time * frequency * Math.PI * 2;
            
            // 全体の位相（位置 + 時間 + シフト）
            const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
            
            // 波の種類に基づいて波形を計算
            let value = 0;
            
            switch (waveType) {
                case 0: // 正弦波
                    value = Math.sin(phase);
                    break;
                    
                case 1: // 三角波
                    value = (2 / Math.PI) * Math.asin(Math.sin(phase));
                    break;
                    
                case 2: // 矩形波
                    value = Math.sign(Math.sin(phase));
                    break;
                    
                case 3: // 鋸歯波
                    value = (2 / Math.PI) * Math.atan(Math.tan(phase / 2));
                    break;
            }
            
            // 振幅をかけて波形を設定
            this.waveData[i] = value * amplitude;
        }
    }

    /**
     * 2D波動場の更新
     */
    updateWaveField() {
        const amplitude = this.parameters.amplitude;
        const frequency = this.parameters.frequency;
        const wavelength = this.parameters.wavelength;
        const phaseShift = this.parameters.phase * Math.PI / 180; // 度からラジアンに変換
        const waveType = Math.floor(this.parameters.waveType);
        
        // 波源位置（中央）
        const sourceX = Math.floor(this.waveData2D.length / 2);
        const sourceY = Math.floor(this.waveData2D[0].length / 2);
        
        for (let x = 0; x < this.waveData2D.length; x++) {
            for (let y = 0; y < this.waveData2D[0].length; y++) {
                // 波源からの距離
                const dx = x - sourceX;
                const dy = y - sourceY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 距離に基づく位相
                const positionPhase = (distance / wavelength) * Math.PI * 2;
                
                // 時間に基づく位相
                const timePhase = this.time * frequency * Math.PI * 2;
                
                // 全体の位相（位置 + 時間 + シフト）
                const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                
                // 波の種類に基づいて波形を計算
                let value = 0;
                
                switch (waveType) {
                    case 0: // 正弦波
                        value = Math.sin(phase);
                        break;
                        
                    case 1: // 三角波
                        value = (2 / Math.PI) * Math.asin(Math.sin(phase));
                        break;
                        
                    case 2: // 矩形波
                        value = Math.sign(Math.sin(phase));
                        break;
                        
                    case 3: // 鋸歯波
                        value = (2 / Math.PI) * Math.atan(Math.tan(phase / 2));
                        break;
                }
                
                // 距離による減衰
                const attenuation = 1 / (1 + 0.01 * distance);
                
                // 振幅をかけて波形を設定
                this.waveData2D[x][y] = value * amplitude * attenuation;
            }
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // 上半分に2D波動場を描画
        this.drawWaveField(this.waveData2D, this.cellSize);
        
        // 中央に水平線を描画
        this.p5.stroke(100);
        this.p5.strokeWeight(1);
        const middleY = this.p5.height / 2;
        this.p5.line(0, middleY, this.p5.width, middleY);
        
        // 下半分に1D波形を描画
        this.drawWaveform(
            this.waveData,
            0,
            middleY,
            this.p5.width,
            this.p5.height / 2 - 20,
            '#3498db'
        );
        
        // レジェンドを描画
        this.drawLegend(this.p5.width - 150, 10, 140, 80);
        
        // 波長と振幅の説明を描画
        this.drawWaveParameters();
        
        // 波の種類の説明を描画
        this.drawWaveTypeInfo();
    }
    
    /**
     * 波のパラメータを説明する図を描画
     */
    drawWaveParameters() {
        this.p5.push();
        
        const middleY = this.p5.height / 2;
        const waveLength = this.parameters.wavelength;
        const amplitude = this.parameters.amplitude;
        
        // 波長を示す矢印
        this.p5.stroke(255, 0, 0);
        this.p5.strokeWeight(2);
        this.p5.line(50, middleY + 30, 50 + waveLength, middleY + 30);
        this.p5.line(50, middleY + 25, 50, middleY + 35);
        this.p5.line(50 + waveLength, middleY + 25, 50 + waveLength, middleY + 35);
        
        // 波長のラベル
        this.p5.fill(255, 0, 0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER, this.p5.TOP);
        this.p5.text(`波長 λ = ${waveLength}px`, 50 + waveLength / 2, middleY + 40);
        
        // 振幅を示す矢印
        const amplitudePixels = amplitude * (this.p5.height / 2 - 20) / 2;
        this.p5.stroke(0, 150, 0);
        this.p5.strokeWeight(2);
        this.p5.line(150, middleY, 150, middleY - amplitudePixels);
        this.p5.line(145, middleY, 155, middleY);
        this.p5.line(145, middleY - amplitudePixels, 155, middleY - amplitudePixels);
        
        // 振幅のラベル
        this.p5.fill(0, 150, 0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.text(`振幅 A = ${amplitude.toFixed(1)}`, 160, middleY - amplitudePixels / 2);
        
        this.p5.pop();
    }
    
    /**
     * 波の種類の説明を描画
     */
    drawWaveTypeInfo() {
        this.p5.push();
        
        const waveType = Math.floor(this.parameters.waveType);
        let waveTypeName = "";
        
        switch (waveType) {
            case 0:
                waveTypeName = "正弦波";
                break;
            case 1:
                waveTypeName = "三角波";
                break;
            case 2:
                waveTypeName = "矩形波";
                break;
            case 3:
                waveTypeName = "鋸歯波";
                break;
        }
        
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text(`波の種類: ${waveTypeName}`, 10, 10);
        this.p5.text(`周波数: ${this.parameters.frequency.toFixed(1)} Hz`, 10, 30);
        this.p5.text(`初期位相: ${this.parameters.phase}°`, 10, 50);
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        const amplitude = this.parameters.amplitude;
        const frequency = this.parameters.frequency;
        const wavelength = this.parameters.wavelength;
        const phase = this.parameters.phase;
        
        // 周期を計算 (T = 1/f)
        const period = 1 / frequency;
        
        // 波数を計算 (k = 2π/λ)
        const wavenumber = (2 * Math.PI) / wavelength;
        
        // 角周波数を計算 (ω = 2πf)
        const angularFrequency = 2 * Math.PI * frequency;
        
        // 波の速さを計算 (v = λf)
        const waveSpeed = wavelength * frequency;
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "amplitude": { 
                name: "振幅", 
                value: amplitude.toFixed(2), 
                unit: "" 
            },
            "frequency": { 
                name: "周波数", 
                value: frequency.toFixed(2), 
                unit: "Hz" 
            },
            "period": { 
                name: "周期", 
                value: period.toFixed(2), 
                unit: "秒" 
            },
            "wavelength": { 
                name: "波長", 
                value: wavelength.toFixed(0), 
                unit: "px" 
            },
            "wavenumber": { 
                name: "波数", 
                value: wavenumber.toFixed(4), 
                unit: "rad/px" 
            },
            "angularFrequency": { 
                name: "角周波数", 
                value: angularFrequency.toFixed(2), 
                unit: "rad/s" 
            },
            "waveSpeed": { 
                name: "波の速さ", 
                value: waveSpeed.toFixed(2), 
                unit: "px/s" 
            },
            "phase": { 
                name: "初期位相", 
                value: phase, 
                unit: "°" 
            }
        };
    }
}