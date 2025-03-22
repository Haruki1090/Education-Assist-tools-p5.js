/**
 * WaveInterference - 波の干渉
 * 複数の波源による干渉パターンを観察するシミュレーション
 */
class WaveInterference extends WaveBase {
    constructor() {
        super();
        this.waveField = [];
        this.cellSize = 4;
        this.selectedSource = undefined;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "sourceCount",
                name: "波源の数",
                min: 1,
                max: 5,
                step: 1,
                default: 2,
                unit: "個"
            },
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
                default: 80,
                unit: "px"
            },
            {
                id: "speed",
                name: "波の速さ",
                min: 10,
                max: 100,
                step: 5,
                default: 50,
                unit: "px/s"
            },
            {
                id: "damping",
                name: "減衰係数",
                min: 0.0,
                max: 0.02,
                step: 0.001,
                default: 0.005,
                unit: ""
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "波の干渉シミュレーションです。複数の波源から発生する波の干渉パターンを観察できます。波源をドラッグして移動させることができます。構成的干渉（同位相で強め合う）と破壊的干渉（逆位相で弱め合う）の様子を観察してください。";
    }

    /**
     * 初期化
     */
    init(p5Instance) {
        super.init(p5Instance);
        
        // マウスイベントのセットアップ
        this.p5.mousePressed = () => this.handleMousePressed(this.p5.mouseX, this.p5.mouseY);
        this.p5.mouseDragged = () => this.handleMouseDragged(this.p5.mouseX, this.p5.mouseY);
        this.p5.mouseReleased = () => this.handleMouseReleased();
    }

    /**
     * リセット
     */
    reset() {
        super.reset();
        
        // 波動場の初期化
        this.initWaveField();
    }

    /**
     * 波源の初期化
     */
    initWaveSources() {
        this.waveSources = [];
        const sourceCount = this.parameters.sourceCount;
        
        // 波源の色
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
        
        // 波源を等間隔に配置
        for (let i = 0; i < sourceCount; i++) {
            const centerX = this.p5 ? this.p5.width / 2 : 400;
            const centerY = this.p5 ? this.p5.height / 2 : 300;
            const radius = 150;
            
            // 円周上に均等に配置
            const angle = (i / sourceCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.waveSources.push({
                x: x,
                y: y,
                amplitude: this.parameters.amplitude,
                frequency: this.parameters.frequency,
                wavelength: this.parameters.wavelength,
                phase: 0,
                speed: this.parameters.speed,
                active: true,
                color: colors[i % colors.length]
            });
        }
    }

    /**
     * 波動場の初期化
     */
    initWaveField() {
        // キャンバスサイズに基づいて波動場のサイズを計算
        const width = Math.floor(this.p5.width / this.cellSize);
        const height = Math.floor(this.p5.height / this.cellSize);
        
        // 2D配列の初期化
        this.waveField = new Array(width);
        for (let i = 0; i < width; i++) {
            this.waveField[i] = new Array(height).fill(0);
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        if (id === "sourceCount") {
            this.initWaveSources();
        } else {
            // その他のパラメータが変更された場合、すべての波源に適用
            for (const source of this.waveSources) {
                switch (id) {
                    case "amplitude":
                        source.amplitude = value;
                        break;
                    case "frequency":
                        source.frequency = value;
                        break;
                    case "wavelength":
                        source.wavelength = value;
                        break;
                    case "speed":
                        source.speed = value;
                        break;
                }
            }
        }
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // 波動場の更新
            this.updateWaveField();
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }

    /**
     * 波動場の更新
     */
    updateWaveField() {
        // 減衰係数
        const damping = this.parameters.damping;
        
        // 各セルの波の高さをリセット
        for (let x = 0; x < this.waveField.length; x++) {
            for (let y = 0; y < this.waveField[0].length; y++) {
                this.waveField[x][y] = 0;
            }
        }
        
        // 各波源からの寄与を計算
        for (const source of this.waveSources) {
            if (!source.active) continue;
            
            const amplitude = source.amplitude;
            const frequency = source.frequency;
            const wavelength = source.wavelength;
            const phaseShift = source.phase;
            
            // 各セルでの波の高さを計算
            for (let x = 0; x < this.waveField.length; x++) {
                for (let y = 0; y < this.waveField[0].length; y++) {
                    // 波源からの距離
                    const dx = x * this.cellSize - source.x;
                    const dy = y * this.cellSize - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 距離に基づく位相
                    const positionPhase = (distance / wavelength) * Math.PI * 2;
                    
                    // 時間に基づく位相
                    const timePhase = this.time * frequency * Math.PI * 2;
                    
                    // 全体の位相（位置 + 時間 + シフト）
                    const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                    
                    // 正弦波の計算
                    const waveHeight = Math.sin(phase);
                    
                    // 距離による減衰
                    const attenuation = this.calculateAttenuation(distance, damping);
                    
                    // 既存の波に加算（波の重ね合わせ）
                    this.waveField[x][y] += waveHeight * amplitude * attenuation;
                }
            }
        }
        
        // 値を-1.0〜1.0の範囲にクリップ
        for (let x = 0; x < this.waveField.length; x++) {
            for (let y = 0; y < this.waveField[0].length; y++) {
                this.waveField[x][y] = Math.max(-1.0, Math.min(1.0, this.waveField[x][y]));
            }
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // 波動場を描画
        this.drawWaveField(this.waveField, this.cellSize);
        
        // 波源を描画
        this.drawWaveSources();
        
        // 干渉パターンの説明を描画
        this.drawInterferenceInfo();
        
        // レジェンドを描画
        this.drawLegend(this.p5.width - 150, 10, 140, 80);
    }
    
    /**
     * 干渉パターンの説明を描画
     */
    drawInterferenceInfo() {
        // 2つの波源がある場合は干渉縞のマーク
        if (this.waveSources.length >= 2) {
            this.p5.push();
            
            const source1 = this.waveSources[0];
            const source2 = this.waveSources[1];
            
            // 2つの波源の中点
            const midX = (source1.x + source2.x) / 2;
            const midY = (source1.y + source2.y) / 2;
            
            // 2つの波源を結ぶ線に垂直な方向
            const dx = source2.x - source1.x;
            const dy = source2.y - source1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                // 垂直方向の単位ベクトル
                const perpX = -dy / length;
                const perpY = dx / length;
                
                // 波長
                const wavelength = this.parameters.wavelength;
                
                // 構成的干渉の位置を計算（等距離の差が波長の整数倍）
                this.p5.stroke(0, 150, 0, 150);
                this.p5.strokeWeight(1);
                
                for (let i = 0; i < 5; i++) {
                    // 波長の整数倍ごとに干渉縞を描画
                    const offset = i * wavelength;
                    const lineLength = 300; // 線の長さ
                    
                    // 中点から伸びる線
                    this.p5.line(
                        midX + perpX * offset,
                        midY + perpY * offset,
                        midX + perpX * offset + perpX * lineLength,
                        midY + perpY * offset + perpY * lineLength
                    );
                    
                    this.p5.line(
                        midX - perpX * offset,
                        midY - perpY * offset,
                        midX - perpX * offset - perpX * lineLength,
                        midY - perpY * offset - perpY * lineLength
                    );
                    
                    // 構成的干渉のマーク
                    if (i > 0) {
                        this.p5.fill(0, 150, 0);
                        this.p5.noStroke();
                        this.p5.textSize(10);
                        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
                        
                        this.p5.text(
                            `構成的干渉 (${i}λ)`,
                            midX + perpX * offset + perpX * 40,
                            midY + perpY * offset + perpY * 40
                        );
                        
                        this.p5.text(
                            `構成的干渉 (${i}λ)`,
                            midX - perpX * offset - perpX * 40,
                            midY - perpY * offset - perpY * 40
                        );
                    }
                }
                
                // 破壊的干渉の位置を計算（等距離の差が波長の半整数倍）
                this.p5.stroke(255, 0, 0, 150);
                this.p5.strokeWeight(1);
                
                for (let i = 0; i < 5; i++) {
                    // 波長の半整数倍ごとに干渉縞を描画
                    const offset = (i + 0.5) * wavelength;
                    const lineLength = 300; // 線の長さ
                    
                    // 中点から伸びる線
                    this.p5.line(
                        midX + perpX * offset,
                        midY + perpY * offset,
                        midX + perpX * offset + perpX * lineLength,
                        midY + perpY * offset + perpY * lineLength
                    );
                    
                    this.p5.line(
                        midX - perpX * offset,
                        midY - perpY * offset,
                        midX - perpX * offset - perpX * lineLength,
                        midY - perpY * offset - perpY * lineLength
                    );
                    
                    // 破壊的干渉のマーク
                    this.p5.fill(255, 0, 0);
                    this.p5.noStroke();
                    this.p5.textSize(10);
                    this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
                    
                    this.p5.text(
                        `破壊的干渉 (${i + 0.5}λ)`,
                        midX + perpX * offset + perpX * 40,
                        midY + perpY * offset + perpY * 40
                    );
                    
                    this.p5.text(
                        `破壊的干渉 (${i + 0.5}λ)`,
                        midX - perpX * offset - perpX * 40,
                        midY - perpY * offset - perpY * 40
                    );
                }
            }
            
            this.p5.pop();
        }
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 波源間の距離を計算
        let sourceDistances = [];
        for (let i = 0; i < this.waveSources.length; i++) {
            for (let j = i + 1; j < this.waveSources.length; j++) {
                const source1 = this.waveSources[i];
                const source2 = this.waveSources[j];
                const distance = this.calculateDistance(source1.x, source1.y, source2.x, source2.y);
                sourceDistances.push({
                    source1: i + 1,
                    source2: j + 1,
                    distance: distance
                });
            }
        }
        
        // 波長と周波数
        const wavelength = this.parameters.wavelength;
        const frequency = this.parameters.frequency;
        
        // 波の速さを計算
        const waveSpeed = wavelength * frequency;
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "sourceCount": { 
                name: "波源の数", 
                value: this.waveSources.length, 
                unit: "個" 
            },
            "wavelength": { 
                name: "波長", 
                value: wavelength.toFixed(0), 
                unit: "px" 
            },
            "frequency": { 
                name: "周波数", 
                value: frequency.toFixed(1), 
                unit: "Hz" 
            },
            "waveSpeed": { 
                name: "波の速さ", 
                value: waveSpeed.toFixed(1), 
                unit: "px/s" 
            }
        };
        
        // 波源間の距離を追加
        sourceDistances.forEach((data, index) => {
            this.dataToDisplay[`distance${index}`] = {
                name: `S${data.source1}-S${data.source2}間距離`,
                value: data.distance.toFixed(0),
                unit: "px"
            };
        });
        
        // 波源間の距離と波長の比を追加
        if (sourceDistances.length > 0) {
            const ratio = sourceDistances[0].distance / wavelength;
            this.dataToDisplay["distanceRatio"] = {
                name: "距離/波長",
                value: ratio.toFixed(2),
                unit: "λ"
            };
        }
    }
}