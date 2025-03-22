/**
 * Pendulum - 振り子運動のシミュレーション
 * 重力による振り子の周期運動を示す
 */
class Pendulum extends SimulationBase {
    constructor() {
        super();
        this.pivotPosition = { x: 0, y: 0 };
        this.bobPosition = { x: 0, y: 0 };
        this.angle = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.length = 0;
        this.trail = [];
        this.maxTrailPoints = 150;
        this.period = 0;
        this.lastDirectionChange = 0;
        this.directionChangeCount = 0;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "gravity",
                name: "重力加速度",
                min: 1,
                max: 20,
                step: 0.1,
                default: 9.8,
                unit: "m/s²"
            },
            {
                id: "length",
                name: "振り子の長さ",
                min: 50,
                max: 300,
                step: 10,
                default: 150,
                unit: "m"
            },
            {
                id: "initialAngle",
                name: "初期角度",
                min: 5,
                max: 80,
                step: 1,
                default: 30,
                unit: "°"
            },
            {
                id: "mass",
                name: "質量",
                min: 0.1,
                max: 10,
                step: 0.1,
                default: 1,
                unit: "kg"
            },
            {
                id: "damping",
                name: "減衰係数",
                min: 0,
                max: 0.1,
                step: 0.001,
                default: 0,
                unit: ""
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "振り子運動のシミュレーションです。振り子の長さ、初期角度、そして空気抵抗による減衰を調整できます。周期と角度の関係を観察できます。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 支点の位置
        this.pivotPosition = {
            x: this.p5.width / 2,
            y: 100
        };
        
        // 振り子の長さ
        this.length = this.parameters.length;
        
        // 角度の初期化（度から弧度法へ変換）
        this.angle = this.parameters.initialAngle * Math.PI / 180;
        
        // 角速度と角加速度の初期化
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        
        // 振り子の先端位置を計算
        this.updateBobPosition();
        
        // 軌跡のリセット
        this.trail = [];
        
        // 周期計測のリセット
        this.period = 0;
        this.lastDirectionChange = 0;
        this.directionChangeCount = 0;
        
        // 理論上の周期を計算
        this.calculateTheoreticalPeriod();
    }
    
    /**
     * 理論上の周期を計算
     */
    calculateTheoreticalPeriod() {
        // 小さな角度の振り子の公式: T = 2π√(L/g)
        const g = this.parameters.gravity;
        const L = this.parameters.length;
        
        // 小角度近似
        if (Math.abs(this.parameters.initialAngle) < 10) {
            this.theoreticalPeriod = 2 * Math.PI * Math.sqrt(L / g);
        } else {
            // 大きな角度の場合の近似式（最初の項のみ）
            const theta = this.parameters.initialAngle * Math.PI / 180;
            this.theoreticalPeriod = 2 * Math.PI * Math.sqrt(L / g) * (1 + Math.pow(theta / 2, 2) / 4);
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        this.reset();
    }

    /**
     * 振り子の先端位置を更新
     */
    updateBobPosition() {
        this.bobPosition = {
            x: this.pivotPosition.x + this.length * Math.sin(this.angle),
            y: this.pivotPosition.y + this.length * Math.cos(this.angle)
        };
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // 前の角速度を保存（周期計測用）
            const prevAngularVelocity = this.angularVelocity;
            
            // 角加速度を計算（振り子の運動方程式）
            const g = this.parameters.gravity;
            const L = this.length;
            this.angularAcceleration = -g / L * Math.sin(this.angle);
            
            // 減衰の影響を加える
            if (this.parameters.damping > 0) {
                this.angularAcceleration -= this.parameters.damping * this.angularVelocity;
            }
            
            // 角速度を更新
            this.angularVelocity += this.angularAcceleration * this.timeStep;
            
            // 角度を更新
            this.angle += this.angularVelocity * this.timeStep;
            
            // 振り子の先端位置を更新
            this.updateBobPosition();
            
            // 周期を計測（方向転換を検出）
            if (prevAngularVelocity * this.angularVelocity <= 0 && prevAngularVelocity !== 0) {
                this.directionChangeCount++;
                
                // 片道ではなく往復で1周期とカウント
                if (this.directionChangeCount >= 2) {
                    this.period = (this.time - this.lastDirectionChange) * 2;
                    this.lastDirectionChange = this.time;
                    this.directionChangeCount = 0;
                }
            }
            
            // 軌跡を更新
            this.trail.push({ ...this.bobPosition });
            if (this.trail.length > this.maxTrailPoints) {
                this.trail.shift();
            }
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // グリッド線
        this.drawGrid();
        
        // 振り子を描く角度の範囲のマーク
        this.drawAngleRange();
        
        // 軌跡の描画
        this.p5.noFill();
        this.p5.stroke(150, 150, 255, 150);
        this.p5.strokeWeight(2);
        this.p5.beginShape();
        for (const point of this.trail) {
            this.p5.vertex(point.x, point.y);
        }
        this.p5.endShape();
        
        // 振り子の紐
        this.p5.stroke(100);
        this.p5.strokeWeight(2);
        this.p5.line(this.pivotPosition.x, this.pivotPosition.y, this.bobPosition.x, this.bobPosition.y);
        
        // 支点
        this.p5.fill(150);
        this.p5.stroke(100);
        this.p5.strokeWeight(1);
        this.p5.ellipse(this.pivotPosition.x, this.pivotPosition.y, 10, 10);
        
        // 振り子のボブ
        this.p5.fill(30, 144, 255);
        this.p5.stroke(23, 108, 192);
        this.p5.strokeWeight(1);
        const bobSize = 20 + this.parameters.mass * 3; // 質量に応じてサイズを変更
        this.p5.ellipse(this.bobPosition.x, this.bobPosition.y, bobSize, bobSize);
        
        // 角度表示
        this.drawAngleIndicator();
        
        // エネルギー表示
        this.drawEnergyDisplay();
        
        // 周期情報の表示
        this.drawPeriodInfo();
        
        // 角速度ベクトルの描画
        const angularVelocityScale = 50;
        this.drawVector(
            this.bobPosition.x,
            this.bobPosition.y,
            this.angularVelocity * Math.cos(this.angle + Math.PI/2) * angularVelocityScale,
            this.angularVelocity * Math.sin(this.angle + Math.PI/2) * angularVelocityScale,
            "#FF5722",
            "角速度"
        );
        
        // 接線方向加速度ベクトルの描画
        const tangentialAccelScale = 150;
        const tangentialAcc = this.angularAcceleration * this.length;
        this.drawVector(
            this.bobPosition.x,
            this.bobPosition.y,
            Math.cos(this.angle + Math.PI/2) * tangentialAcc * tangentialAccelScale,
            Math.sin(this.angle + Math.PI/2) * tangentialAcc * tangentialAccelScale,
            "#9C27B0",
            "接線加速度"
        );
    }
    
    /**
     * グリッドを描画
     */
    drawGrid() {
        this.p5.push();
        this.p5.stroke(220);
        this.p5.strokeWeight(1);
        
        // 水平線
        for (let y = 0; y < this.p5.height; y += 50) {
            this.p5.line(0, y, this.p5.width, y);
        }
        
        // 垂直線
        for (let x = 0; x < this.p5.width; x += 50) {
            this.p5.line(x, 0, x, this.p5.height);
        }
        
        this.p5.pop();
    }
    
    /**
     * 角度範囲を描画
     */
    drawAngleRange() {
        const initialAngleRad = this.parameters.initialAngle * Math.PI / 180;
        
        this.p5.push();
        this.p5.stroke(200, 200, 200, 100);
        this.p5.strokeWeight(1);
        this.p5.fill(245, 245, 245, 100);
        
        // 右側の領域
        this.p5.arc(
            this.pivotPosition.x,
            this.pivotPosition.y,
            this.length * 2,
            this.length * 2,
            -initialAngleRad,
            initialAngleRad
        );
        
        this.p5.stroke(220, 220, 220);
        this.p5.strokeWeight(1);
        this.p5.line(
            this.pivotPosition.x,
            this.pivotPosition.y,
            this.pivotPosition.x + this.length * Math.sin(initialAngleRad),
            this.pivotPosition.y + this.length * Math.cos(initialAngleRad)
        );
        this.p5.line(
            this.pivotPosition.x,
            this.pivotPosition.y,
            this.pivotPosition.x - this.length * Math.sin(initialAngleRad),
            this.pivotPosition.y + this.length * Math.cos(initialAngleRad)
        );
        
        this.p5.pop();
    }
    
    /**
     * 角度表示を描画
     */
    drawAngleIndicator() {
        const angleInDegrees = (this.angle * 180 / Math.PI).toFixed(1);
        
        this.p5.push();
        this.p5.fill(255, 100, 100, 150);
        this.p5.noStroke();
        this.p5.arc(
            this.pivotPosition.x,
            this.pivotPosition.y,
            50,
            50,
            0,
            this.angle,
            this.p5.PIE
        );
        
        this.p5.fill(255, 100, 100);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        const textX = this.pivotPosition.x + 30 * Math.sin(this.angle / 2);
        const textY = this.pivotPosition.y + 30 * Math.cos(this.angle / 2);
        this.p5.text(`${angleInDegrees}°`, textX, textY);
        
        this.p5.pop();
    }
    
    /**
     * エネルギー表示を描画
     */
    drawEnergyDisplay() {
        // 高さから位置エネルギーを計算（基準点は最低点）
        const height = this.pivotPosition.y + this.length - this.bobPosition.y;
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 角速度から運動エネルギーを計算
        const linearVelocity = this.angularVelocity * this.length;
        const kineticEnergy = 0.5 * this.parameters.mass * linearVelocity * linearVelocity;
        
        // 初期位置エネルギー（理論上の最大エネルギー）
        const initialAngleRad = this.parameters.initialAngle * Math.PI / 180;
        const initialHeight = this.length * (1 - Math.cos(initialAngleRad));
        const initialPotentialEnergy = this.parameters.mass * this.parameters.gravity * initialHeight;
        
        // エネルギーバーを描画
        this.drawEnergyBar(
            this.p5.width - 180,
            this.p5.height - 80,
            150,
            20,
            kineticEnergy,
            potentialEnergy,
            initialPotentialEnergy
        );
    }
    
    /**
     * 周期情報を描画
     */
    drawPeriodInfo() {
        this.p5.push();
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.LEFT, this.p5.TOP);
        
        this.p5.text(`実測周期: ${this.period.toFixed(3)} 秒`, 20, 20);
        this.p5.text(`理論周期: ${this.theoreticalPeriod.toFixed(3)} 秒`, 20, 40);
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 角度（度数法）
        const angleInDegrees = this.angle * 180 / Math.PI;
        
        // 高さ
        const height = this.pivotPosition.y + this.length - this.bobPosition.y;
        
        // 角速度から線速度へ変換
        const linearVelocity = this.angularVelocity * this.length;
        
        // 位置エネルギー
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 運動エネルギー
        const kineticEnergy = 0.5 * this.parameters.mass * linearVelocity * linearVelocity;
        
        // 全エネルギー
        const totalEnergy = potentialEnergy + kineticEnergy;
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "angle": { 
                name: "角度", 
                value: angleInDegrees.toFixed(2), 
                unit: "°" 
            },
            "angularVelocity": { 
                name: "角速度", 
                value: this.angularVelocity.toFixed(3), 
                unit: "rad/s" 
            },
            "linearVelocity": { 
                name: "線速度", 
                value: linearVelocity.toFixed(2), 
                unit: "m/s" 
            },
            "period": { 
                name: "実測周期", 
                value: this.period.toFixed(3), 
                unit: "秒" 
            },
            "theoreticalPeriod": { 
                name: "理論周期", 
                value: this.theoreticalPeriod.toFixed(3), 
                unit: "秒" 
            },
            "potentialEnergy": { 
                name: "位置エネルギー", 
                value: potentialEnergy.toFixed(2), 
                unit: "J" 
            },
            "kineticEnergy": { 
                name: "運動エネルギー", 
                value: kineticEnergy.toFixed(2), 
                unit: "J" 
            },
            "totalEnergy": { 
                name: "全エネルギー", 
                value: totalEnergy.toFixed(2), 
                unit: "J" 
            }
        };
    }
}