/**
 * SoundAnalysis - 音声波形解析
 * マイク入力や様々な音源の波形・周波数スペクトルを分析するシミュレーション
 */
class SoundAnalysis extends WaveBase {
    constructor() {
        super();
        this.waveform = [];
        this.spectrum = [];
        this.micInput = null;
        this.fft = null;
        this.isRecording = false;
        this.oscillator = null;
        this.audioSource = 'oscillator'; // 'mic', 'oscillator'
        this.waveTypeLabels = ['正弦波', '三角波', '矩形波', '鋸歯波'];
        this.harmonics = [];
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "audioSource",
                name: "音源",
                min: 0,
                max: 1,
                step: 1,
                default: 0,
                unit: "(0:オシレーター, 1:マイク)"
            },
            {
                id: "frequency",
                name: "周波数",
                min: 20,
                max: 1000,
                step: 10,
                default: 440,
                unit: "Hz"
            },
            {
                id: "waveType",
                name: "波形",
                min: 0,
                max: 3,
                step: 1,
                default: 0,
                unit: "(0:正弦波, 1:三角波, 2:矩形波, 3:鋸歯波)"
            },
            {
                id: "volume",
                name: "音量",
                min: 0,
                max: 1.0,
                step: 0.1,
                default: 0.5,
                unit: ""
            },
            {
                id: "showFFT",
                name: "FFT表示",
                min: 0,
                max: 1,
                step: 1,
                default: 1,
                unit: "(0:波形のみ, 1:FFTも表示)"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "音声波形解析シミュレーションです。異なる波形（正弦波、三角波、矩形波、鋸歯波）の時間波形と周波数スペクトルを観察できます。マイク入力を使って実際の音声も解析できます。";
    }

    /**
     * 初期化
     */
    init(p5Instance) {
        super.init(p5Instance);
        
        // p5.soundの初期化
        this.initAudio();
    }

    /**
     * オーディオ関連の初期化
     */
    initAudio() {
        try {
            // FFTの初期化
            this.fft = new this.p5.FFT(0.8, 1024);
            
            // オシレータの初期化
            this.oscillator = new this.p5.Oscillator();
            this.oscillator.amp(this.parameters.volume);
            this.setOscillatorType(Math.floor(this.parameters.waveType));
            this.oscillator.freq(this.parameters.frequency);
            
            // マイク入力の初期化
            if (this.p5.AudioContext) {
                this.micInput = new this.p5.AudioIn();
                this.micInput.start();
            }
            
            // 高調波の初期化
            this.initHarmonics();
        } catch (e) {
            console.error("Audio initialization failed:", e);
        }
    }
    
    /**
     * 高調波情報の初期化
     */
    initHarmonics() {
        // 各波形の高調波成分の理論値を設定
        this.harmonics = [
            // 正弦波（基本波のみ）
            [
                { harmonic: 1, amplitude: 1.0 }
            ],
            // 三角波（奇数倍音のみ、振幅は1/n²）
            [
                { harmonic: 1, amplitude: 1.0 },
                { harmonic: 3, amplitude: 1/9 },
                { harmonic: 5, amplitude: 1/25 },
                { harmonic: 7, amplitude: 1/49 },
                { harmonic: 9, amplitude: 1/81 }
            ],
            // 矩形波（奇数倍音のみ、振幅は1/n）
            [
                { harmonic: 1, amplitude: 1.0 },
                { harmonic: 3, amplitude: 1/3 },
                { harmonic: 5, amplitude: 1/5 },
                { harmonic: 7, amplitude: 1/7 },
                { harmonic: 9, amplitude: 1/9 }
            ],
            // 鋸歯波（全ての倍音、振幅は1/n）
            [
                { harmonic: 1, amplitude: 1.0 },
                { harmonic: 2, amplitude: 1/2 },
                { harmonic: 3, amplitude: 1/3 },
                { harmonic: 4, amplitude: 1/4 },
                { harmonic: 5, amplitude: 1/5 }
            ]
        ];
    }

    /**
     * リセット
     */
    reset() {
        super.reset();
        
        if (this.isRecording) {
            this.stopAudio();
        }
        
        // 波形データの初期化
        this.waveform = new Array(1024).fill(0);
        this.spectrum = new Array(1024).fill(0);
    }

    /**
     * オシレータの種類を設定
     * @param {Number} type - 波形の種類（0:正弦波, 1:三角波, 2:矩形波, 3:鋸歯波）
     */
    setOscillatorType(type) {
        if (!this.oscillator) return;
        
        switch (type) {
            case 0:
                this.oscillator.setType('sine');
                break;
            case 1:
                this.oscillator.setType('triangle');
                break;
            case 2:
                this.oscillator.setType('square');
                break;
            case 3:
                this.oscillator.setType('sawtooth');
                break;
            default:
                this.oscillator.setType('sine');
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        if (!this.oscillator) return;
        
        switch (id) {
            case "audioSource":
                // 音源切り替え時に一度停止
                this.stopAudio();
                this.audioSource = Math.floor(value) === 0 ? 'oscillator' : 'mic';
                if (this.isRunning) {
                    this.startAudio();
                }
                break;
                
            case "frequency":
                this.oscillator.freq(value);
                break;
                
            case "waveType":
                this.setOscillatorType(Math.floor(value));
                break;
                
            case "volume":
                this.oscillator.amp(value);
                break;
        }
    }

    /**
     * オーディオ再生開始
     */
    startAudio() {
        if (!this.isRecording) {
            if (this.audioSource === 'oscillator' && this.oscillator) {
                this.oscillator.start();
                this.fft.setInput(this.oscillator);
            } else if (this.audioSource === 'mic' && this.micInput) {
                this.micInput.start();
                this.fft.setInput(this.micInput);
            }
            this.isRecording = true;
        }
    }

    /**
     * オーディオ再生停止
     */
    stopAudio() {
        if (this.isRecording) {
            if (this.audioSource === 'oscillator' && this.oscillator) {
                this.oscillator.stop();
            }
            if (this.audioSource === 'mic' && this.micInput) {
                this.micInput.stop();
            }
            this.isRecording = false;
        }
    }

    /**
     * シミュレーション開始
     */
    start() {
        super.start();
        this.startAudio();
    }

    /**
     * シミュレーション停止
     */
    stop() {
        super.stop();
        this.stopAudio();
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // FFTを実行して波形とスペクトルを取得
            this.updateAudioData();
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }

    /**
     * 音声データの更新
     */
    updateAudioData() {
        if (this.fft) {
            // 波形データを取得
            this.waveform = this.fft.waveform();
            
            // 周波数スペクトルを取得
            this.spectrum = this.fft.analyze();
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // キャンバスのサイズを取得
        const width = this.p5.width;
        const height = this.p5.height;
        
        // 波形とスペクトルの表示エリアを計算
        let waveformHeight, spectrumHeight, waveformY, spectrumY;
        
        if (this.parameters.showFFT > 0.5) {
            // 両方表示する場合は画面を分割
            waveformHeight = height * 0.45;
            spectrumHeight = height * 0.45;
            waveformY = 20;
            spectrumY = waveformY + waveformHeight + 20;
        } else {
            // 波形のみの場合
            waveformHeight = height * 0.8;
            waveformY = height * 0.1;
            spectrumHeight = 0;
            spectrumY = height;
        }
        
        // 波形データの描画
        this.drawWaveformDisplay(0, waveformY, width, waveformHeight);
        
        // 周波数スペクトルの描画（必要な場合）
        if (this.parameters.showFFT > 0.5) {
            this.drawSpectrumDisplay(0, spectrumY, width, spectrumHeight);
        }
        
        // 情報表示
        this.drawInfoDisplay();
        
        // 倍音構成の表示
        this.drawHarmonicsInfo();
    }
    
    /**
     * 波形データの表示
     * @param {Number} x - X座標
     * @param {Number} y - Y座標
     * @param {Number} width - 幅
     * @param {Number} height - 高さ
     */
    drawWaveformDisplay(x, y, width, height) {
        this.p5.push();
        
        // 背景と枠
        this.p5.fill(255);
        this.p5.stroke(200);
        this.p5.rect(x, y, width, height);
        
        // タイトル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text("時間波形", x + 10, y + 10);
        
        // 中心線
        this.p5.stroke(200);
        this.p5.line(x, y + height/2, x + width, y + height/2);
        
        // 波形の描画
        this.p5.stroke(0, 120, 255);
        this.p5.strokeWeight(2);
        this.p5.noFill();
        this.p5.beginShape();
        
        for (let i = 0; i < this.waveform.length; i++) {
            const xPos = x + i * (width / this.waveform.length);
            const yPos = y + height/2 + this.waveform[i] * height/2;
            this.p5.vertex(xPos, yPos);
        }
        
        this.p5.endShape();
        
        // 時間スケールの表示
        const frequency = this.parameters.frequency;
        const period = 1 / frequency;
        const sampleRate = 44100; // 標準的なサンプルレート
        const samplesPerPeriod = sampleRate * period;
        
        this.p5.stroke(255, 0, 0, 150);
        this.p5.strokeWeight(1);
        
        // 周期のマーク
        if (samplesPerPeriod < this.waveform.length) {
            const periodWidth = (samplesPerPeriod / this.waveform.length) * width;
            this.p5.line(x + 10, y + height - 20, x + 10 + periodWidth, y + height - 20);
            
            this.p5.fill(255, 0, 0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text(`1周期 (${period.toFixed(3)}秒)`, x + 10 + periodWidth/2, y + height - 5);
        }
        
        this.p5.pop();
    }
    
    /**
     * 周波数スペクトルの表示
     * @param {Number} x - X座標
     * @param {Number} y - Y座標
     * @param {Number} width - 幅
     * @param {Number} height - 高さ
     */
    drawSpectrumDisplay(x, y, width, height) {
        this.p5.push();
        
        // 背景と枠
        this.p5.fill(255);
        this.p5.stroke(200);
        this.p5.rect(x, y, width, height);
        
        // タイトル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text("周波数スペクトル", x + 10, y + 10);
        
        // 底辺
        this.p5.stroke(200);
        this.p5.line(x, y + height - 30, x + width, y + height - 30);
        
        // 周波数目盛り
        const maxFreq = 2000; // 表示する最大周波数
        const freqStep = 200; // 目盛りの間隔
        
        this.p5.textAlign(this.p5.CENTER);
        for (let freq = 0; freq <= maxFreq; freq += freqStep) {
            const xPos = x + (freq / maxFreq) * width;
            this.p5.stroke(200);
            this.p5.line(xPos, y + height - 35, xPos, y + height - 25);
            this.p5.fill(0);
            this.p5.noStroke();
            this.p5.text(`${freq}Hz`, xPos, y + height - 15);
        }
        
        // 基本周波数と倍音のマーカー
        const baseFreq = this.parameters.frequency;
        const baseFreqX = x + (baseFreq / maxFreq) * width;
        
        this.p5.stroke(255, 0, 0);
        this.p5.line(baseFreqX, y + 30, baseFreqX, y + height - 30);
        this.p5.fill(255, 0, 0);
        this.p5.noStroke();
        this.p5.text(`${baseFreq}Hz`, baseFreqX, y + 20);
        
        // 倍音のマーカー
        const waveType = Math.floor(this.parameters.waveType);
        const harmonics = this.harmonics[waveType];
        
        for (let i = 1; i < harmonics.length; i++) {
            const harmonic = harmonics[i];
            const harmonicFreq = baseFreq * harmonic.harmonic;
            
            if (harmonicFreq <= maxFreq) {
                const harmonicX = x + (harmonicFreq / maxFreq) * width;
                
                this.p5.stroke(0, 150, 0);
                this.p5.line(harmonicX, y + 40, harmonicX, y + height - 30);
                this.p5.fill(0, 150, 0);
                this.p5.noStroke();
                this.p5.text(`${harmonic.harmonic}f`, harmonicX, y + 30);
            }
        }
        
        // スペクトルの描画
        this.p5.noStroke();
        
        const barWidth = width / this.spectrum.length;
        const displayLimit = Math.min(this.spectrum.length, Math.floor(maxFreq / (22050 / this.spectrum.length)));
        
        for (let i = 0; i < displayLimit; i++) {
            const value = this.spectrum[i];
            const amplitude = this.p5.map(value, 0, 255, 0, height - 60);
            
            // 基本周波数と倍音の位置で色を変える
            let barColor;
            const freq = (i / this.spectrum.length) * 22050;
            
            if (Math.abs(freq - baseFreq) < 20) {
                barColor = this.p5.color(255, 0, 0);
            } else {
                let isHarmonic = false;
                for (let j = 1; j < harmonics.length; j++) {
                    const harmonicFreq = baseFreq * harmonics[j].harmonic;
                    if (Math.abs(freq - harmonicFreq) < 20) {
                        isHarmonic = true;
                        break;
                    }
                }
                
                barColor = isHarmonic ? this.p5.color(0, 150, 0) : this.p5.color(0, 120, 255);
            }
            
            this.p5.fill(barColor);
            this.p5.rect(x + i * barWidth, y + height - 30 - amplitude, barWidth, amplitude);
        }
        
        this.p5.pop();
    }
    
    /**
     * 情報表示
     */
    drawInfoDisplay() {
        this.p5.push();
        
        // 音源情報
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        
        const audioSourceLabel = this.audioSource === 'oscillator' ? 'オシレーター' : 'マイク入力';
        const waveTypeLabel = this.waveTypeLabels[Math.floor(this.parameters.waveType)];
        
        this.p5.text(`音源: ${audioSourceLabel}`, 10, 10);
        
        if (this.audioSource === 'oscillator') {
            this.p5.text(`波形: ${waveTypeLabel}`, 150, 10);
            this.p5.text(`周波数: ${this.parameters.frequency}Hz`, 270, 10);
        }
        
        // 音量レベルメーター
        if (this.fft) {
            const level = this.fft.getLevel();
            const levelWidth = this.p5.map(level, 0, 1, 0, 100);
            
            this.p5.text("音量:", this.p5.width - 150, 10);
            this.p5.fill(255);
            this.p5.stroke(0);
            this.p5.rect(this.p5.width - 110, 10, 100, 15);
            
            this.p5.noStroke();
            if (levelWidth < 50) {
                this.p5.fill(0, 255, 0);
            } else if (levelWidth < 80) {
                this.p5.fill(255, 255, 0);
            } else {
                this.p5.fill(255, 0, 0);
            }
            
            this.p5.rect(this.p5.width - 110, 10, levelWidth, 15);
        }
        
        this.p5.pop();
    }
    
    /**
     * 倍音構成の情報表示
     */
    drawHarmonicsInfo() {
        if (this.audioSource !== 'oscillator') return;
        
        this.p5.push();
        
        const waveType = Math.floor(this.parameters.waveType);
        const harmonics = this.harmonics[waveType];
        
        // 情報ボックス
        const boxX = 10;
        const boxY = this.p5.height - 140;
        const boxWidth = 200;
        const boxHeight = 130;
        
        this.p5.fill(255, 255, 255, 220);
        this.p5.stroke(200);
        this.p5.rect(boxX, boxY, boxWidth, boxHeight, 5);
        
        // タイトル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        this.p5.text(`${this.waveTypeLabels[waveType]}の倍音構成`, boxX + 10, boxY + 10);
        
        // 倍音情報
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        
        for (let i = 0; i < harmonics.length; i++) {
            const y = boxY + 30 + i * 20;
            const harmonic = harmonics[i];
            
            // 倍音番号
            this.p5.text(`${harmonic.harmonic}倍音:`, boxX + 10, y);
            
            // 相対振幅
            this.p5.text(`振幅 ${harmonic.amplitude.toFixed(3)}`, boxX + 80, y);
            
            // 周波数
            const freq = this.parameters.frequency * harmonic.harmonic;
            this.p5.text(`${freq.toFixed(1)}Hz`, boxX + 140, y);
        }
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 基本情報
        const audioSourceLabel = this.audioSource === 'oscillator' ? 'オシレーター' : 'マイク入力';
        const waveTypeLabel = this.waveTypeLabels[Math.floor(this.parameters.waveType)];
        
        // データの基本セット
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "audioSource": { 
                name: "音源", 
                value: audioSourceLabel, 
                unit: "" 
            }
        };
        
        if (this.audioSource === 'oscillator') {
            // オシレータ固有のデータ
            this.dataToDisplay["waveType"] = {
                name: "波形",
                value: waveTypeLabel,
                unit: ""
            };
            
            this.dataToDisplay["frequency"] = {
                name: "周波数",
                value: this.parameters.frequency,
                unit: "Hz"
            };
            
            this.dataToDisplay["period"] = {
                name: "周期",
                value: (1 / this.parameters.frequency).toFixed(4),
                unit: "秒"
            };
            
            // 波形タイプに応じた倍音情報
            const waveType = Math.floor(this.parameters.waveType);
            
            switch (waveType) {
                case 0: // 正弦波
                    this.dataToDisplay["harmonicInfo"] = {
                        name: "倍音",
                        value: "基本波のみ",
                        unit: ""
                    };
                    break;
                    
                case 1: // 三角波
                    this.dataToDisplay["harmonicInfo"] = {
                        name: "倍音",
                        value: "奇数倍音のみ (振幅 ∝ 1/n²)",
                        unit: ""
                    };
                    break;
                    
                case 2: // 矩形波
                    this.dataToDisplay["harmonicInfo"] = {
                        name: "倍音",
                        value: "奇数倍音のみ (振幅 ∝ 1/n)",
                        unit: ""
                    };
                    break;
                    
                case 3: // 鋸歯波
                    this.dataToDisplay["harmonicInfo"] = {
                        name: "倍音",
                        value: "全ての倍音 (振幅 ∝ 1/n)",
                        unit: ""
                    };
                    break;
            }
        }
        
        // 音量レベル
        if (this.fft) {
            const level = this.fft.getLevel();
            this.dataToDisplay["level"] = {
                name: "音量レベル",
                value: level.toFixed(2),
                unit: ""
            };
        }
    }
}