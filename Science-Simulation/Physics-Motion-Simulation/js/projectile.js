/**
 * Projectile - 弾道運動のシミュレーション
 * 初速度と角度を持って放たれた物体の運動を示す
 */
class Projectile extends SimulationBase {
    constructor() {
        super();
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.initialPosition = { x: 0, y: 0 };
        this.radius = 12;
        this.trailPoints = [];
        this.maxTrailPoints = 100;
        this.hasLanded = false;
        this.landingPosition = 0;
        this.maxHeight = 0;
        this.maxDistance = 0;
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
                id: "initialVelocity",
                name: "初速度",
                min: 10,
                max: 100,
                step: 1,
                default: 40,
                unit: "m/s"
            },
            {
                id: "angle",
                name: "発射角度",
                min: 0,
                max: 90,
                step: 1,
                default: 45,
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
                id: "airResistance",
                name: "空気抵抗係数",
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
        return "弾道運動のシミュレーションです。初速度と角度を持って発射された物体が、重力の影響を受けて描く放物線を観察できます。空気抵抗の影響も設定できます。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 位置の初期化
        this.initialPosition = {
            x: 50,
            y: this.p5.height - 50
        };
        this.position = { ...this.initialPosition };
        
        // 角度から初速度の成分を計算（角度は度数法から弧度法に変換）
        const angleRad = this.parameters.angle * Math.PI / 180;
        this.velocity = {
            x: this.parameters.initialVelocity * Math.cos(angleRad),
            y: -this.parameters.initialVelocity * Math.sin(angleRad) // 上向きが負
        };
        
        // 加速度の初期化
        this.acceleration = { x: 0, y: this.parameters.gravity };
        
        // 軌跡のリセット
        this.trailPoints = [];
        
        // 状態のリセット
        this.hasLanded = false;
        this.landingPosition = 0;
        this.maxHeight = 0;
        this.maxDistance = 0;
        
        // 理論上の最高点と飛距離を計算
        this.calculateTheoreticalValues();
    }
    
    /**
     * 理論上の最高点と飛距離を計算
     */
    calculateTheoreticalValues() {
        // 角度（弧度法）
        const angleRad = this.parameters.angle * Math.PI / 180;
        
        // 初速度
        const v0 = this.parameters.initialVelocity;
        
        // 重力加速度
        const g = this.parameters.gravity;
        
        // 空気抵抗がない場合の理論値
        if (this.parameters.airResistance === 0) {
            // 最高点の高さ h = v0^2 * sin^2(θ) / (2g)
            this.maxHeight = (v0 * v0 * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * g);
            
            // 飛距離 R = v0^2 * sin(2θ) / g
            this.maxDistance = (v0 * v0 * Math.sin(2 * angleRad)) / g;
        } else {
            // 空気抵抗がある場合は実測する（理論計算が複雑になるため）
            this.maxHeight = 0;
            this.maxDistance = 0;
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        // パラメータが変更されたら再計算
        this.reset();
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning && !this.hasLanded) {
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
            
            // 軌跡を追加
            this.trailPoints.push({ ...this.position });
            if (this.trailPoints.length > this.maxTrailPoints) {
                this.trailPoints.shift();
            }
            
            // 最高点を記録
            const currentHeight = this.p5.height - this.position.y;
            if (currentHeight > this.maxHeight) {
                this.maxHeight = currentHeight;
            }
            
            // 地面との衝突判定
            const groundY = this.p5.height - 30;
            if (this.position.y >= groundY - this.radius) {
                this.position.y = groundY - this.radius;
                this.hasLanded = true;
                this.landingPosition = this.position.x;
                this.maxDistance = this.landingPosition - this.initialPosition.x;
                this.stop();
            }
            
            // 画面外に出た場合も停止
            if (this.position.x > this.p5.width) {
                this.hasLanded = true;
                this.stop();
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
        
        // グリッド
        this.drawGrid();
        
        // 軌跡の描画
        this.p5.noFill();
        this.p5.stroke(150, 150, 255, 150);
        this.p5.strokeWeight(2);
        this.p5.beginShape();
        for (const point of this.trailPoints) {
            this.p5.vertex(point.x, point.y);
        }
        this.p5.endShape();
        
        // 最高点のマーク
        if (this.trailPoints.length > 0) {
            const highestPoint = this.trailPoints.reduce((highest, current) => {
                return current.y < highest.y ? current : highest;
            }, this.trailPoints[0]);
            
            this.p5.stroke(255, 0, 0);
            this.p5.strokeWeight(1);
            this.p5.line(highestPoint.x, highestPoint.y, highestPoint.x, this.p5.height - 30);
            this.p5.fill(255, 0, 0);
            this.p5.noStroke();
            this.p5.ellipse(highestPoint.x, highestPoint.y, 6, 6);
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text("最高点", highestPoint.x, highestPoint.y - 10);
        }
        
        // 理論上の放物線（空気抵抗がない場合）
        if (this.parameters.airResistance === 0) {
            this.drawTheoreticalTrajectory();
        }
        
        // 着地点のマーク
        if (this.hasLanded) {
            this.p5.stroke(0, 128, 0);
            this.p5.strokeWeight(1);
            this.p5.line(this.landingPosition, this.position.y, this.landingPosition, this.p5.height - 30);
            this.p5.fill(0, 128, 0);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER);
            this.p5.text("着地点", this.landingPosition, this.position.y - 10);
        }
        
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
        
        // 角度表示（発射時のみ）
        if (this.time < 0.1) {
            this.drawAngle();
        }
        
        // エネルギーバーの描画
        this.drawEnergyDisplay();
    }
    
    /**
     * グリッドを描画
     */
    drawGrid() {
        this.p5.push();
        this.p5.stroke(220);
        this.p5.strokeWeight(1);
        
        // 水平線
        for (let y = this.p5.height - 30; y > 0; y -= 50) {
            this.p5.line(0, y, this.p5.width, y);
        }
        
        // 垂直線
        for (let x = 0; x <= this.p5.width; x += 50) {
            this.p5.line(x, 0, x, this.p5.height - 30);
        }
        
        this.p5.pop();
    }
    
    /**
     * 角度表示を描画
     */
    drawAngle() {
        this.p5.push();
        const radius = 40;
        this.p5.stroke(255, 100, 100);
        this.p5.strokeWeight(1);
        this.p5.noFill();
        
        // 角度の弧を描画
        const startAngle = 0;
        const endAngle = -this.parameters.angle * Math.PI / 180;
        this.p5.arc(
            this.initialPosition.x,
            this.initialPosition.y,
            radius * 2,
            radius * 2,
            startAngle,
            endAngle,
            this.p5.PIE
        );
        
        // 角度のテキスト
        this.p5.fill(255, 100, 100);
        this.p5.noStroke();
        const labelX = this.initialPosition.x + radius * Math.cos(endAngle / 2);
        const labelY = this.initialPosition.y + radius * Math.sin(endAngle / 2);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.text(`${this.parameters.angle}°`, labelX, labelY);
        
        this.p5.pop();
    }
    
    /**
     * 理論上の放物線を描画
     */
    drawTheoreticalTrajectory() {
        this.p5.push();
        this.p5.stroke(150, 150, 150, 100);
        this.p5.strokeWeight(1);
        this.p5.noFill();
        
        // 角度（弧度法）
        const angleRad = this.parameters.angle * Math.PI / 180;
        
        // 初速度
        const v0 = this.parameters.initialVelocity;
        
        // 重力加速度
        const g = this.parameters.gravity;
        
        this.p5.beginShape();
        for (let x = 0; x <= this.maxDistance + this.initialPosition.x; x += 10) {
            // 放物線の方程式 y = x*tan(θ) - (g*x^2)/(2*v0^2*cos^2(θ))
            const dx = x - this.initialPosition.x;
            const t = dx / (v0 * Math.cos(angleRad));
            const y = this.initialPosition.y - (v0 * Math.sin(angleRad) * t - 0.5 * g * t * t);
            
            if (y <= this.p5.height - 30) {
                this.p5.vertex(x, y);
            }
        }
        this.p5.endShape();
        
        this.p5.pop();
    }
    
    /**
     * エネルギー表示を描画
     */
    drawEnergyDisplay() {
        // 高さから位置エネルギーを計算（E_p = mgh）
        const height = Math.max(0, this.p5.height - 30 - this.position.y);
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 速度から運動エネルギーを計算（E_k = 0.5 * m * v^2）
        const speedSquared = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
        const kineticEnergy = 0.5 * this.parameters.mass * speedSquared;
        
        // 全エネルギー
        const totalEnergy = potentialEnergy + kineticEnergy;
        
        // 初期運動エネルギー
        const initialKineticEnergy = 0.5 * this.parameters.mass * this.parameters.initialVelocity * this.parameters.initialVelocity;
        
        // エネルギーバーを描画
        this.drawEnergyBar(
            this.p5.width - 180,
            this.p5.height - 80,
            150,
            20,
            kineticEnergy,
            potentialEnergy,
            initialKineticEnergy
        );
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 現在の高さを計算
        const height = Math.max(0, this.p5.height - 30 - this.position.y);
        
        // 現在の水平距離を計算
        const distance = this.position.x - this.initialPosition.x;
        
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
            "distance": { 
                name: "水平距離", 
                value: distance.toFixed(2), 
                unit: "m" 
            },
            "velocity": { 
                name: "速度", 
                value: speed.toFixed(2), 
                unit: "m/s" 
            },
            "maxHeight": { 
                name: "最高点", 
                value: this.maxHeight.toFixed(2), 
                unit: "m" 
            },
            "theoreticalMaxHeight": { 
                name: "理論最高点", 
                value: this.maxHeight.toFixed(2), 
                unit: "m" 
            },
            "theoreticalMaxDistance": { 
                name: "理論最大飛距離", 
                value: this.maxDistance.toFixed(2), 
                unit: "m" 
            },
            "totalEnergy": { 
                name: "全エネルギー", 
                value: totalEnergy.toFixed(2), 
                unit: "J" 
            }
        };
    }
}