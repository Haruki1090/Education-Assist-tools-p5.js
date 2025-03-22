/**
 * WaveDiffraction - 波の回折
 * スリットや障害物による回折現象を観察するシミュレーション
 */
class WaveDiffraction extends WaveBase {
    constructor() {
        super();
        this.waveField = [];
        this.cellSize = 3;
        this.obstacles = [];
        this.sourcePosition = { x: 0, y: 0 };
        this.slitWidth = 50;
        this.slitPosition = 0;
        this.slitY1 = 0;
        this.slitY2 = 0;
        this.obstacleType = 0; // 0: スリット, 1: 障害物, 2: 二重スリット
        this.selectedSource = undefined;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "obstacleType",
                name: "障害物の種類",
                min: 0,
                max: 2,
                step: 1,
                default: 0,
                unit: "(0:スリット, 1:障害物, 2:二重スリット)"
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
                max: 2.0,
                step: 0.1,
                default: 0.5,
                unit: "Hz"
            },
            {
                id: "wavelength",
                name: "波長",
                min: 10,
                max: 100,
                step: 5,
                default: 30,
                unit: "px"
            },
            {
                id: "slitWidth",
                name: "スリット幅",
                min: 10,
                max: 200,
                step: 10,
                default: 50,
                unit: "px"
            },
            {
                id: "slitDistance",
                name: "二重スリット間隔",
                min: 20,
                max: 200,
                step: 10,
                default: 100,
                unit: "px"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "波の回折シミュレーションです。スリット、障害物、二重スリットなどで波が回折する様子を観察できます。波長とスリット幅の関係によって回折の程度が変わることを確認してください。波源をドラッグして移動させることもできます。";
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
        
        // 障害物の設定
        this.setupObstacles();
    }

    /**
     * 波源の初期化
     */
    initWaveSources() {
        this.waveSources = [];
        
        // 波源を左側に配置
        this.waveSources.push({
            x: 100,
            y: this.p5 ? this.p5.height / 2 : 300,
            amplitude: this.parameters.amplitude,
            frequency: this.parameters.frequency,
            wavelength: this.parameters.wavelength,
            phase: 0,
            speed: 50,
            active: true,
            color: '#e74c3c'
        });
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
     * 障害物のセットアップ
     */
    setupObstacles() {
        this.obstacles = [];
        
        const obstacleType = Math.floor(this.parameters.obstacleType);
        this.obstacleType = obstacleType;
        
        // スリット幅
        this.slitWidth = this.parameters.slitWidth;
        
        // スリット位置
        this.slitPosition = Math.floor(this.p5.width / 2);
        
        // スリットのY範囲
        const centerY = Math.floor(this.p5.height / 2);
        
        switch (obstacleType) {
            case 0: // 単一スリット
                this.slitY1 = centerY - this.slitWidth / 2;
                this.slitY2 = centerY + this.slitWidth / 2;
                
                // 上部の壁
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: 0,
                    x2: this.slitPosition,
                    y2: this.slitY1,
                    type: "wall"
                });
                
                // 下部の壁
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: this.slitY2,
                    x2: this.slitPosition,
                    y2: this.p5.height,
                    type: "wall"
                });
                break;
                
            case 1: // 障害物
                const obstacleWidth = this.slitWidth;
                const obstacleY1 = centerY - obstacleWidth / 2;
                const obstacleY2 = centerY + obstacleWidth / 2;
                
                // 中央の障害物
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: obstacleY1,
                    x2: this.slitPosition,
                    y2: obstacleY2,
                    type: "obstacle"
                });
                break;
                
            case 2: // 二重スリット
                const slitDistance = this.parameters.slitDistance;
                const slit1Y1 = centerY - slitDistance / 2 - this.slitWidth / 2;
                const slit1Y2 = centerY - slitDistance / 2 + this.slitWidth / 2;
                const slit2Y1 = centerY + slitDistance / 2 - this.slitWidth / 2;
                const slit2Y2 = centerY + slitDistance / 2 + this.slitWidth / 2;
                
                // 上部の壁
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: 0,
                    x2: this.slitPosition,
                    y2: slit1Y1,
                    type: "wall"
                });
                
                // 中央の壁
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: slit1Y2,
                    x2: this.slitPosition,
                    y2: slit2Y1,
                    type: "wall"
                });
                
                // 下部の壁
                this.obstacles.push({
                    x1: this.slitPosition,
                    y1: slit2Y2,
                    x2: this.slitPosition,
                    y2: this.p5.height,
                    type: "wall"
                });
                
                // スリットの位置を保存
                this.slitY1 = slit1Y1;
                this.slitY2 = slit2Y2;
                break;
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        if (id === "obstacleType" || id === "slitWidth" || id === "slitDistance") {
            this.setupObstacles();
        } else {
            // 波源のパラメータを更新
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
        // 各セルの波の高さをリセット
        for (let x = 0; x < this.waveField.length; x++) {
            for (let y = 0; y < this.waveField[0].length; y++) {
                this.waveField[x][y] = 0;
            }
        }
        
        // スリット位置をセル座標に変換
        const slitPosX = Math.floor(this.slitPosition / this.cellSize);
        
        // 各波源からの寄与を計算
        for (const source of this.waveSources) {
            if (!source.active) continue;
            
            const amplitude = source.amplitude;
            const frequency = source.frequency;
            const wavelength = source.wavelength;
            const phaseShift = source.phase;
            
            // 波源の位置をセル座標に変換
            const sourceX = Math.floor(source.x / this.cellSize);
            const sourceY = Math.floor(source.y / this.cellSize);
            
            // 障害物の手前（波源側）の波を計算
            for (let x = 0; x <= slitPosX; x++) {
                for (let y = 0; y < this.waveField[0].length; y++) {
                    // 波源からの距離
                    const dx = x - sourceX;
                    const dy = y - sourceY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 距離に基づく位相
                    const positionPhase = (distance / (wavelength / this.cellSize)) * Math.PI * 2;
                    
                    // 時間に基づく位相
                    const timePhase = this.time * frequency * Math.PI * 2;
                    
                    // 全体の位相（位置 + 時間 + シフト）
                    const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                    
                    // 正弦波の計算
                    const waveHeight = Math.sin(phase);
                    
                    // 距離による減衰
                    const attenuation = this.calculateAttenuation(distance, 0.001);
                    
                    // 波の高さを設定
                    this.waveField[x][y] += waveHeight * amplitude * attenuation;
                }
            }
            
            // ホイヘンスの原理に基づく回折波の計算
            // スリットの各点を新たな波源として扱う
            
            // スリットのY範囲をセル座標に変換
            const slitY1 = Math.floor(this.slitY1 / this.cellSize);
            const slitY2 = Math.floor(this.slitY2 / this.cellSize);
            
            // 障害物の後ろ（波源と反対側）の波を計算
            for (let x = slitPosX + 1; x < this.waveField.length; x++) {
                for (let y = 0; y < this.waveField[0].length; y++) {
                    let totalWave = 0;
                    
                    // 障害物の種類によって処理を変える
                    switch (this.obstacleType) {
                        case 0: // 単一スリット
                            // スリットの各点からの寄与を計算
                            for (let sy = slitY1; sy <= slitY2; sy++) {
                                const dx = x - slitPosX;
                                const dy = y - sy;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // スリット内の波の高さを取得
                                const slitWaveHeight = this.waveField[slitPosX][sy];
                                
                                // 距離に基づく位相
                                const positionPhase = (distance / (wavelength / this.cellSize)) * Math.PI * 2;
                                
                                // 時間に基づく位相
                                const timePhase = this.time * frequency * Math.PI * 2;
                                
                                // 全体の位相（位置 + 時間 + シフト）
                                const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                                
                                // 正弦波の計算
                                const waveHeight = Math.sin(phase);
                                
                                // 距離による減衰
                                const attenuation = this.calculateAttenuation(distance, 0.001);
                                
                                // スリット内の波の高さに基づいて寄与を計算
                                totalWave += waveHeight * amplitude * attenuation * (slitWaveHeight > 0 ? 1 : 0);
                            }
                            break;
                            
                        case 1: // 障害物
                            // 障害物のY範囲をセル座標に変換
                            const obstacleY1 = Math.floor((this.p5.height / 2 - this.slitWidth / 2) / this.cellSize);
                            const obstacleY2 = Math.floor((this.p5.height / 2 + this.slitWidth / 2) / this.cellSize);
                            
                            // 障害物の上下の開口部からの寄与を計算
                            for (let sy = 0; sy < this.waveField[0].length; sy++) {
                                // 障害物の範囲内はスキップ
                                if (sy >= obstacleY1 && sy <= obstacleY2) continue;
                                
                                const dx = x - slitPosX;
                                const dy = y - sy;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // 開口部の波の高さを取得
                                const openingWaveHeight = this.waveField[slitPosX][sy];
                                
                                // 距離に基づく位相
                                const positionPhase = (distance / (wavelength / this.cellSize)) * Math.PI * 2;
                                
                                // 時間に基づく位相
                                const timePhase = this.time * frequency * Math.PI * 2;
                                
                                // 全体の位相（位置 + 時間 + シフト）
                                const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                                
                                // 正弦波の計算
                                const waveHeight = Math.sin(phase);
                                
                                // 距離による減衰
                                const attenuation = this.calculateAttenuation(distance, 0.001);
                                
                                // 開口部の波の高さに基づいて寄与を計算
                                totalWave += waveHeight * amplitude * attenuation * (openingWaveHeight > 0 ? 1 : 0);
                            }
                            break;
                            
                        case 2: // 二重スリット
                            // 二重スリットのY範囲をセル座標に変換
                            const slit1Y1 = Math.floor((this.p5.height / 2 - this.parameters.slitDistance / 2 - this.slitWidth / 2) / this.cellSize);
                            const slit1Y2 = Math.floor((this.p5.height / 2 - this.parameters.slitDistance / 2 + this.slitWidth / 2) / this.cellSize);
                            const slit2Y1 = Math.floor((this.p5.height / 2 + this.parameters.slitDistance / 2 - this.slitWidth / 2) / this.cellSize);
                            const slit2Y2 = Math.floor((this.p5.height / 2 + this.parameters.slitDistance / 2 + this.slitWidth / 2) / this.cellSize);
                            
                            // 両方のスリットからの寄与を計算
                            for (let sy = 0; sy < this.waveField[0].length; sy++) {
                                // スリット内かどうかをチェック
                                const isSlit1 = sy >= slit1Y1 && sy <= slit1Y2;
                                const isSlit2 = sy >= slit2Y1 && sy <= slit2Y2;
                                
                                if (!isSlit1 && !isSlit2) continue;
                                
                                const dx = x - slitPosX;
                                const dy = y - sy;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // スリット内の波の高さを取得
                                const slitWaveHeight = this.waveField[slitPosX][sy];
                                
                                // 距離に基づく位相
                                const positionPhase = (distance / (wavelength / this.cellSize)) * Math.PI * 2;
                                
                                // 時間に基づく位相
                                const timePhase = this.time * frequency * Math.PI * 2;
                                
                                // 全体の位相（位置 + 時間 + シフト）
                                const phase = (positionPhase - timePhase + phaseShift) % (Math.PI * 2);
                                
                                // 正弦波の計算
                                const waveHeight = Math.sin(phase);
                                
                                // 距離による減衰
                                const attenuation = this.calculateAttenuation(distance, 0.001);
                                
                                // スリット内の波の高さに基づいて寄与を計算
                                totalWave += waveHeight * amplitude * attenuation * (slitWaveHeight > 0 ? 1 : 0);
                            }
                            break;
                    }
                    
                    // 寄与の数で正規化（スリットの範囲に応じて）
                    let normalizeFactor = 1;
                    if (this.obstacleType === 0) {
                        normalizeFactor = slitY2 - slitY1 + 1;
                    } else if (this.obstacleType === 2) {
                        const slit1Height = Math.floor((this.slitWidth) / this.cellSize);
                        const slit2Height = Math.floor((this.slitWidth) / this.cellSize);
                        normalizeFactor = slit1Height + slit2Height;
                    }
                    
                    if (normalizeFactor > 0) {
                        this.waveField[x][y] = totalWave / Math.sqrt(normalizeFactor);
                    }
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
        
        // 障害物を描画
        this.drawObstacles();
        
        // 波源を描画
        this.drawWaveSources();
        
        // 回折パターンの説明を描画
        this.drawDiffractionExplanation();
        
        // レジェンドを描画
        this.drawLegend(this.p5.width - 150, 10, 140, 80);
    }
    
    /**
     * 障害物を描画
     */
    drawObstacles() {
        this.p5.push();
        
        for (const obstacle of this.obstacles) {
            if (obstacle.type === "wall" || obstacle.type === "obstacle") {
                this.p5.stroke(0);
                this.p5.strokeWeight(4);
                this.p5.line(obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2);
            }
        }
        
        // 障害物の種類に応じた表示
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.textSize(14);
        
        let label = "";
        switch (this.obstacleType) {
            case 0:
                label = "単一スリット";
                break;
            case 1:
                label = "障害物";
                break;
            case 2:
                label = "二重スリット";
                break;
        }
        
        this.p5.text(label, this.slitPosition, 20);
        
        this.p5.pop();
    }
    
    /**
     * 回折パターンの説明を描画
     */
    drawDiffractionExplanation() {
        this.p5.push();
        
        const obstacleType = this.obstacleType;
        const wavelength = this.parameters.wavelength;
        
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT);
        
        if (obstacleType === 0) { // 単一スリット
            const slitWidth = this.parameters.slitWidth;
            this.p5.text(`スリット幅: ${slitWidth}px`, 10, 30);
            this.p5.text(`波長: ${wavelength}px`, 10, 50);
            this.p5.text(`λ/スリット幅 = ${(wavelength / slitWidth).toFixed(2)}`, 10, 70);
            
            // 回折角の計算と表示
            const ratio = wavelength / slitWidth;
            const angle = Math.atan(ratio) * 180 / Math.PI;
            this.p5.text(`主回折角: ${angle.toFixed(1)}°`, 10, 90);
        } else if (obstacleType === 2) { // 二重スリット
            const slitWidth = this.parameters.slitWidth;
            const slitDistance = this.parameters.slitDistance;
            this.p5.text(`スリット幅: ${slitWidth}px`, 10, 30);
            this.p5.text(`スリット間隔: ${slitDistance}px`, 10, 50);
            this.p5.text(`波長: ${wavelength}px`, 10, 70);
            this.p5.text(`λ/スリット間隔 = ${(wavelength / slitDistance).toFixed(2)}`, 10, 90);
            
            // 干渉縞の角度の計算と表示
            const ratio = wavelength / slitDistance;
            const angle = Math.atan(ratio) * 180 / Math.PI;
            this.p5.text(`干渉縞の角度: ${angle.toFixed(1)}°`, 10, 110);
        }
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        const obstacleType = this.obstacleType;
        const wavelength = this.parameters.wavelength;
        const frequency = this.parameters.frequency;
        
        // データの基本セット
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "obstacleType": { 
                name: "障害物の種類", 
                value: obstacleType === 0 ? "単一スリット" : (obstacleType === 1 ? "障害物" : "二重スリット"), 
                unit: "" 
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
            }
        };
        
        // 障害物の種類に応じたデータを追加
        if (obstacleType === 0) { // 単一スリット
            const slitWidth = this.parameters.slitWidth;
            this.dataToDisplay["slitWidth"] = {
                name: "スリット幅",
                value: slitWidth.toFixed(0),
                unit: "px"
            };
            
            this.dataToDisplay["ratio"] = {
                name: "λ/スリット幅",
                value: (wavelength / slitWidth).toFixed(2),
                unit: ""
            };
            
            // 回折角の計算
            const ratio = wavelength / slitWidth;
            const angle = Math.atan(ratio) * 180 / Math.PI;
            this.dataToDisplay["diffractionAngle"] = {
                name: "主回折角",
                value: angle.toFixed(1),
                unit: "°"
            };
            
            // 解析解との比較
            this.dataToDisplay["resolution"] = {
                name: "分解能（レイリー基準）",
                value: (1.22 * wavelength / slitWidth).toFixed(2),
                unit: "rad"
            };
        } else if (obstacleType === 2) { // 二重スリット
            const slitWidth = this.parameters.slitWidth;
            const slitDistance = this.parameters.slitDistance;
            
            this.dataToDisplay["slitWidth"] = {
                name: "スリット幅",
                value: slitWidth.toFixed(0),
                unit: "px"
            };
            
            this.dataToDisplay["slitDistance"] = {
                name: "スリット間隔",
                value: slitDistance.toFixed(0),
                unit: "px"
            };
            
            this.dataToDisplay["ratio"] = {
                name: "λ/スリット間隔",
                value: (wavelength / slitDistance).toFixed(2),
                unit: ""
            };
            
            // 干渉縞の角度の計算
            const ratio = wavelength / slitDistance;
            const angle = Math.atan(ratio) * 180 / Math.PI;
            this.dataToDisplay["interferenceAngle"] = {
                name: "干渉縞の角度",
                value: angle.toFixed(1),
                unit: "°"
            };
        }
    }
}