/**
 * FreeFall - 自由落下のシミュレーション
 * 重力の影響を受けて落下する物体の運動を示す
 */
class FreeFall extends SimulationBase {
    constructor() {
        super();
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.initialHeight = 0;
        this.radius = 15;
        this.trailPoints = [];
        this.maxTrailPoints = 50;
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
                id: "initialHeight",
                name: "初期高さ",
                min: 50,
                max: 400,
                step: 10,
                default: 300,
                unit: "m"
            },
            {
                id: "mass",
                name: "質量",
                min: 1,
                max: 10,
                step: 0.1,
                default: 1,
                unit: "kg"
            },
            {
                id: "airResistance",
                name: "空気抵抗係数",
                min: 0,
                max: 0.5,
                step: 0.01,
                default: 0,
                unit: ""
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "自由落下のシミュレーションです。物体が重力により加速しながら落下する様子を観察できます。空気抵抗の影響も設定できます。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 位置の初期化
        this.position = {
            x: this.p5.width / 2,
            y: this.p5.height - this.parameters.initialHeight
        };
        
        // 初期高さの記録
        this.initialHeight = this.parameters.initialHeight;
        
        // 速度と加速度の初期化
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        
        // 軌跡のリセット
        this.trailPoints = [];
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        if (id === "initialHeight") {
            this.reset();
        }
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 前のフレームの位置を保存
            const prevPos = { ...this.position };
            
            // 時間を進める
            this.time += this.timeStep;
            
            // 重力加速度を設定
            this.acceleration.y = this.parameters.gravity;
            
            // 空気抵抗を計算（速度の二乗に比例）
            if (this.parameters.airResistance > 0) {
                const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                if (speed > 0) {
                    const dragForceX = -this.parameters.airResistance * this.velocity.x * speed;
                    const dragForceY = -this.parameters.airResistance * this.velocity.y * speed;
                    this.acceleration.x += dragForceX / this.parameters.mass;
                    this.acceleration.y += dragForceY / this.parameters.mass;
                }
            }
            
            // 速度を更新（a * dt）
            this.velocity.x += this.acceleration.x * this.timeStep;
            this.velocity.y += this.acceleration.y * this.timeStep;
            
            // 位置を更新（v * dt）
            this.position.x += this.velocity.x * this.timeStep;
            this.position.y += this.velocity.y * this.timeStep;
            
            // 地面との衝突判定
            const groundY = this.p5.height - 30;
            if (this.position.y >= groundY - this.radius) {
                this.position.y = groundY - this.radius;
                this.velocity.y = 0;
                this.velocity.x = 0; // 地面との摩擦で止まる
                this.stop();
            }
            
            // 軌跡を追加
            if (prevPos.x !== this.position.x || prevPos.y !== this.position.y) {
                this.trailPoints.push({ ...this.position });
                if (this.trailPoints.length > this.maxTrailPoints) {
                    this.trailPoints.shift();
                }
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
        
        // 地面
        this.p5.fill(100, 100, 100);
        this.p5.noStroke();
        this.p5.rect(0, this.p5.height - 30, this.p5.width, 30);
        
        // 高さの目盛りを描画
        this.drawHeightScale();
        
        // 軌跡の描画
        this.p5.noFill();
        this.p5.stroke(150, 150, 255, 150);
        this.p5.strokeWeight(2);
        this.p5.beginShape();
        for (const point of this.trailPoints) {
            this.p5.vertex(point.x, point.y);
        }
        this.p5.endShape();
        
        // ボールの描画
        this.p5.fill(30, 144, 255);
        this.p5.stroke(23, 108, 192);
        this.p5.strokeWeight(1);
        this.p5.ellipse(this.position.x, this.position.y, this.radius * 2);
        
        // 速度ベクトルの描画
        this.drawVector(
            this.position.x,
            this.position.y,
            this.velocity.x * 0.1,
            this.velocity.y * 0.1,
            "#FF5722",
            "速度"
        );
        
        // 加速度ベクトルの描画
        this.drawVector(
            this.position.x,
            this.position.y,
            this.acceleration.x * 0.3,
            this.acceleration.y * 0.3,
            "#9C27B0",
            "加速度"
        );
        
        // エネルギーバーの描画
        this.drawEnergyDisplay();
    }
    
    /**
     * 高さの目盛りを描画
     */
    drawHeightScale() {
        this.p5.push();
        this.p5.stroke(180);
        this.p5.strokeWeight(1);
        
        // 縦線
        this.p5.line(50, 0, 50, this.p5.height - 30);
        
        // 目盛り
        const scaleCount = 5;
        const step = this.initialHeight / scaleCount;
        
        for (let i = 0; i <= scaleCount; i++) {
            const y = this.p5.height - 30 - (step * i);
            this.p5.line(45, y, 55, y);
            
            this.p5.fill(0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.RIGHT, this.p5.CENTER);
            this.p5.text(`${step * i}m`, 40, y);
        }
        
        // 現在の高さを示す
        const currentHeight = this.p5.height - 30 - this.position.y - this.radius;
        if (currentHeight >= 0) {
            this.p5.stroke(255, 0, 0);
            this.p5.line(45, this.position.y + this.radius, 55, this.position.y + this.radius);
            
            this.p5.fill(255, 0, 0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.RIGHT, this.p5.CENTER);
            this.p5.text(`${currentHeight.toFixed(1)}m`, 40, this.position.y + this.radius);
        }
        
        this.p5.pop();
    }
    
    /**
     * エネルギー表示を描画
     */
    drawEnergyDisplay() {
        // 高さから位置エネルギーを計算（E_p = mgh）
        const height = Math.max(0, this.p5.height - 30 - this.position.y - this.radius);
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 速度から運動エネルギーを計算（E_k = 0.5 * m * v^2）
        const speedSquared = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
        const kineticEnergy = 0.5 * this.parameters.mass * speedSquared;
        
        // 初期高さから初期位置エネルギー（全エネルギー）を計算
        const totalEnergy = this.parameters.mass * this.parameters.gravity * this.initialHeight;
        
        // エネルギーバーを描画
        this.drawEnergyBar(
            this.p5.width - 180,
            this.p5.height - 80,
            150,
            20,
            kineticEnergy,
            potentialEnergy,
            totalEnergy
        );
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 現在の高さを計算
        const height = Math.max(0, this.p5.height - 30 - this.position.y - this.radius);
        
        // 速度の大きさ
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        // 高さから位置エネルギーを計算
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 速度から運動エネルギーを計算
        const kineticEnergy = 0.5 * this.parameters.mass * speed * speed;
        
        // 全エネルギー
        const totalEnergy = potentialEnergy + kineticEnergy;
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "height": { 
                name: "高さ", 
                value: height.toFixed(2), 
                unit: "m" 
            },
            "velocity": { 
                name: "速度", 
                value: speed.toFixed(2), 
                unit: "m/s" 
            },
            "acceleration": { 
                name: "加速度", 
                value: this.acceleration.y.toFixed(2), 
                unit: "m/s²" 
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