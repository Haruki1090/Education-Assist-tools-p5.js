/**
 * WaveReflection - 波の反射と定在波
 * 壁での反射と定在波の形成を観察するシミュレーション
 */
class WaveReflection extends WaveBase {
    constructor() {
        super();
        this.waveData = [];
        this.waveDataTotal = [];
        this.incidentWave = [];
        this.reflectedWave = [];
        this.standingWave = [];
        this.boundaryPosition = 0;
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
                max: 3.0,
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
                id: "boundaryType",
                name: "境界条件",
                min: 0,
                max: 1,
                step: 1,
                default: 0,
                unit: "(0:固定端, 1:自由端)"
            },
            {
                id: "showComponents",
                name: "成分表示",
                min: 0,
                max: 1,
                step: 1,
                default: 1,
                unit: "(0:合成波のみ, 1:入射波/反射波も)"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "波の反射と定在波のシミュレーションです。波が境界で反射する様子と、入射波と反射波が重なることで生じる定在波を観察できます。境界条件（固定端/自由端）による反射の違いも確認できます。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 波形データの初期化
        this.initWaveData();
        
        // 境界位置の設定
        this.boundaryPosition = this.p5.width - 50;
    }

    /**
     * 波形データの初期化
     */
    initWaveData() {
        const dataLength = 1000;
        this.waveData = new Array(dataLength).fill(0);
        this.waveDataTotal = new Array(dataLength).fill(0);
        this.incidentWave = new Array(dataLength).fill(0);
        this.reflectedWave = new Array(dataLength).fill(0);
        this.standingWave = new Array(dataLength).fill(0);
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
            
            // 波形データの更新
            this.updateWaveData();
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }

    /**
     * 波形データの更新
     */
    updateWaveData() {
        const amplitude = this.parameters.amplitude;
        const frequency = this.parameters.frequency;
        const wavelength = this.parameters.wavelength;
        const boundaryType = Math.floor(this.parameters.boundaryType);
        
        // 反射係数（固定端: -1, 自由端: 1）
        const reflectionCoef = boundaryType === 0 ? -1 : 1;
        
        // 境界位置をピクセル座標からデータインデックスに変換
        const boundaryIndex = Math.floor((this.boundaryPosition / this.p5.width) * this.waveData.length);
        
        // 入射波と反射波をそれぞれ計算
        for (let i = 0; i < this.waveData.length; i++) {
            // 位置をピクセル座標に変換
            const x = (i / this.waveData.length) * this.p5.width;
            
            // 入射波の計算（右に進む波）
            const incidentPhase = (2 * Math.PI / wavelength) * (x - this.time * frequency * wavelength);
            this.incidentWave[i] = amplitude * Math.sin(incidentPhase);
            
            // 反射波の計算（左に進む波）
            // 反射波の位相は境界位置からの距離に依存
            const distanceFromBoundary = 2 * this.boundaryPosition - x;
            const reflectedPhase = (2 * Math.PI / wavelength) * (distanceFromBoundary - this.time * frequency * wavelength);
            this.reflectedWave[i] = reflectionCoef * amplitude * Math.sin(reflectedPhase);
            
            // 定在波のパターン（理論的な定常状態）
            // sin(kx - ωt) + r*sin(kx + ωt) = sin(kx)cos(ωt) - r*sin(kx)cos(ωt)
            const k = 2 * Math.PI / wavelength;
            const omega = 2 * Math.PI * frequency;
            this.standingWave[i] = 2 * amplitude * Math.sin(k * x) * Math.cos(omega * this.time);
            
            // 入射波と反射波の合成
            this.waveDataTotal[i] = this.incidentWave[i] + this.reflectedWave[i];
            
            // 境界位置より右側では波を表示しない
            if (i > boundaryIndex) {
                this.waveDataTotal[i] = 0;
                this.incidentWave[i] = 0;
                this.reflectedWave[i] = 0;
                this.standingWave[i] = 0;
            }
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // キャンバスの高さを取得
        const height = this.p5.height;
        
        // 境界線を描画
        this.p5.stroke(0);
        this.p5.strokeWeight(4);
        this.p5.line(this.boundaryPosition, 0, this.boundaryPosition, height);
        
        // 境界条件のラベルを描画
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER);
        const boundaryType = Math.floor(this.parameters.boundaryType);
        const boundaryLabel = boundaryType === 0 ? "固定端" : "自由端";
        this.p5.text(boundaryLabel, this.boundaryPosition, 20);
        
        // 波形を描画するY位置と高さ
        const waveHeight = 100;
        const totalY = 120;
        const incidentY = 250;
        const reflectedY = 380;
        const standingY = 510;
        
        // 合成波（入射波＋反射波）を描画
        this.drawWaveform(
            this.waveDataTotal,
            0,
            totalY,
            this.p5.width,
            waveHeight,
            '#3498db'
        );
        
        // 入射波、反射波、定在波の描画（必要な場合）
        if (this.parameters.showComponents > 0.5) {
            // 入射波を描画
            this.drawWaveform(
                this.incidentWave,
                0,
                incidentY,
                this.p5.width,
                waveHeight,
                '#2ecc71'
            );
            
            // 反射波を描画
            this.drawWaveform(
                this.reflectedWave,
                0,
                reflectedY,
                this.p5.width,
                waveHeight,
                '#e74c3c'
            );
            
            // 理論的な定在波パターンを描画
            this.drawWaveform(
                this.standingWave,
                0,
                standingY,
                this.p5.width,
                waveHeight,
                '#9b59b6'
            );
            
            // ラベルを描画
            this.p5.fill(0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.LEFT);
            this.p5.text("合成波 (入射波 + 反射波)", 10, totalY - waveHeight / 2 - 10);
            this.p5.text("入射波", 10, incidentY - waveHeight / 2 - 10);
            this.p5.text("反射波", 10, reflectedY - waveHeight / 2 - 10);
            this.p5.text("定在波のパターン", 10, standingY - waveHeight / 2 - 10);
        } else {
            // 合成波のみ表示する場合
            this.p5.fill(0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.LEFT);
            this.p5.text("合成波 (入射波 + 反射波)", 10, totalY - waveHeight / 2 - 10);
        }
        
        // 波長のマーク
        this.drawWavelengthMarkers();
        
        // 節と腹のマーク
        this.drawNodesAndAntinodes();
    }
    
    /**
     * 波長のマーカーを描画
     */
    drawWavelengthMarkers() {
        const wavelength = this.parameters.wavelength;
        const totalY = 120;
        const waveHeight = 100;
        
        this.p5.push();
        this.p5.stroke(100, 100, 100, 150);
        this.p5.strokeWeight(1);
        
        // Y位置
        const y = totalY + waveHeight / 2 + 30;
        
        // 波長分の間隔でマーカーを描画
        for (let x = 0; x < this.p5.width; x += wavelength) {
            this.p5.line(x, totalY - waveHeight / 2, x, totalY + waveHeight / 2);
            
            // 波長のラベル
            if (x > 0) {
                this.p5.fill(100);
                this.p5.noStroke();
                this.p5.textAlign(this.p5.CENTER);
                this.p5.text(`${x / wavelength}λ`, x, y);
            }
        }
        
        // X軸
        this.p5.stroke(0);
        this.p5.line(0, y - 15, this.p5.width, y - 15);
        
        this.p5.pop();
    }
    
    /**
     * 定在波の節と腹を描画
     */
    drawNodesAndAntinodes() {
        const boundaryType = Math.floor(this.parameters.boundaryType);
        const wavelength = this.parameters.wavelength;
        const standingY = 510;
        const waveHeight = 100;
        
        this.p5.push();
        
        // 境界位置を計算
        const boundaryIndex = Math.floor((this.boundaryPosition / this.p5.width) * this.waveData.length);
        const boundaryX = (boundaryIndex / this.waveData.length) * this.p5.width;
        
        // 固定端の場合: 境界が節になる
        // 自由端の場合: 境界が腹になる
        let nodePositions = [];
        let antinodePositions = [];
        
        if (boundaryType === 0) { // 固定端
            // 境界は節
            nodePositions.push(boundaryX);
            
            // 境界から波長の1/2ごとに節が生じる
            for (let i = 1; i * wavelength / 2 < boundaryX; i++) {
                nodePositions.push(boundaryX - i * wavelength / 2);
            }
            
            // 腹は節と節の中間
            for (let i = 0; i < nodePositions.length - 1; i++) {
                antinodePositions.push((nodePositions[i] + nodePositions[i + 1]) / 2);
            }
        } else { // 自由端
            // 境界は腹
            antinodePositions.push(boundaryX);
            
            // 境界から波長の1/2ごとに腹が生じる
            for (let i = 1; i * wavelength / 2 < boundaryX; i++) {
                antinodePositions.push(boundaryX - i * wavelength / 2);
            }
            
            // 節は腹と腹の中間
            for (let i = 0; i < antinodePositions.length - 1; i++) {
                nodePositions.push((antinodePositions[i] + antinodePositions[i + 1]) / 2);
            }
        }
        
        // 節を描画
        this.p5.stroke(255, 0, 0, 150);
        this.p5.strokeWeight(1);
        for (const x of nodePositions) {
            this.p5.line(x, standingY - waveHeight / 2, x, standingY + waveHeight / 2);
            
            // 節のラベル
            this.p5.fill(255, 0, 0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text("節", x, standingY + waveHeight / 2 + 15);
        }
        
        // 腹を描画
        this.p5.stroke(0, 150, 0, 150);
        this.p5.strokeWeight(1);
        for (const x of antinodePositions) {
            this.p5.line(x, standingY - waveHeight / 2, x, standingY + waveHeight / 2);
            
            // 腹のラベル
            this.p5.fill(0, 150, 0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text("腹", x, standingY + waveHeight / 2 + 15);
        }
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        const amplitude = this.parameters.amplitude;
        const frequency = this.parameters.frequency;
        const wavelength = this.parameters.wavelength;
        const boundaryType = Math.floor(this.parameters.boundaryType);
        
        // 境界条件の名前
        const boundaryName = boundaryType === 0 ? "固定端" : "自由端";
        
        // 反射係数
        const reflectionCoef = boundaryType === 0 ? -1 : 1;
        
        // 波の速さを計算
        const waveSpeed = wavelength * frequency;
        
        // 定在波の距離 (L)
        const L = this.boundaryPosition;
        
        // 固有振動数の計算
        // 固定端: f_n = n * v / (2L)
        // 自由端: f_n = n * v / (2L)
        // ただし固定端と自由端では固有モードが異なる
        const fundamentalFreq = waveSpeed / (2 * L);
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "boundaryType": { 
                name: "境界条件", 
                value: boundaryName, 
                unit: "" 
            },
            "reflectionCoef": { 
                name: "反射係数", 
                value: reflectionCoef, 
                unit: "" 
            },
            "wavelength": { 
                name: "波長", 
                value: wavelength.toFixed(0), 
                unit: "px" 
            },
            "frequency": { 
                name: "周波数", 
                value: frequency.toFixed(2), 
                unit: "Hz" 
            },
            "waveSpeed": { 
                name: "波の速さ", 
                value: waveSpeed.toFixed(1), 
                unit: "px/s" 
            },
            "fundamentalFreq": { 
                name: "基本振動数", 
                value: fundamentalFreq.toFixed(3), 
                unit: "Hz" 
            }
        };
        
        // 高調波（倍音）の情報を追加
        for (let i = 1; i <= 3; i++) {
            this.dataToDisplay[`harmonic${i}`] = {
                name: `第${i}倍音`,
                value: (fundamentalFreq * i).toFixed(3),
                unit: "Hz"
            };
        }
    }
}