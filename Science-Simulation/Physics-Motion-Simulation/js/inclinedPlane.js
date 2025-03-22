/**
 * InclinedPlane - 斜面上の運動のシミュレーション
 * 斜面上の物体が重力と摩擦の影響を受けて運動する様子を示す
 */
class InclinedPlane extends SimulationBase {
    constructor() {
        super();
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.angle = 0;
        this.planeLength = 0;
        this.radius = 15;
        this.planeStart = { x: 0, y: 0 };
        this.planeEnd = { x: 0, y: 0 };
        this.trail = [];
        this.maxTrailPoints = 50;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "angle",
                name: "斜面の角度",
                min: 5,
                max: 60,
                step: 1,
                default: 30,
                unit: "°"
            },
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
                id: "mass",
                name: "質量",
                min: 0.1,
                max: 10,
                step: 0.1,
                default: 1,
                unit: "kg"
            },
            {
                id: "frictionCoef",
                name: "摩擦係数",
                min: 0,
                max: 1,
                step: 0.01,
                default: 0.2,
                unit: ""
            },
            {
                id: "initialVelocity",
                name: "初速度",
                min: 0,
                max: 20,
                step: 0.5,
                default: 0,
                unit: "m/s"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "斜面上の運動のシミュレーションです。物体が斜面を滑り落ちる際の重力、摩擦力、垂直抗力の関係を観察できます。";
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // 斜面の角度（度からラジアンに変換）
        this.angle = this.parameters.angle * Math.PI / 180;
        
        // 斜面の長さ
        this.planeLength = Math.min(this.p5.width, this.p5.height) * 0.8;
        
        // 斜面の開始点と終了点
        this.planeStart = {
            x: this.p5.width / 2 - Math.cos(this.angle) * this.planeLength / 2,
            y: this.p5.height / 2 + Math.sin(this.angle) * this.planeLength / 2
        };
        
        this.planeEnd = {
            x: this.p5.width / 2 + Math.cos(this.angle) * this.planeLength / 2,
            y: this.p5.height / 2 - Math.sin(this.angle) * this.planeLength / 2
        };
        
        // 物体の初期位置（斜面の上部）
        this.position = {
            x: this.planeEnd.x,
            y: this.planeEnd.y
        };
        
        // 斜面の法線方向に物体をオフセット
        const normalX = Math.sin(this.angle);
        const normalY = Math.cos(this.angle);
        this.position.x += normalX * this.radius;
        this.position.y -= normalY * this.radius;
        
        // 初速度（斜面に沿った方向）
        const initialVelocity = this.parameters.initialVelocity;
        this.velocity = {
            x: -Math.cos(this.angle) * initialVelocity,
            y: Math.sin(this.angle) * initialVelocity
        };
        
        // 加速度の初期化
        this.acceleration = { x: 0, y: 0 };
        
        // 軌跡のリセット
        this.trail = [];
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        this.reset();
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // 前のフレームの位置を保存
            const prevPos = { ...this.position };
            
            // 斜面に沿った重力加速度の計算
            const g = this.parameters.gravity;
            const gParallel = g * Math.sin(this.angle);
            
            // 垂直抗力の計算
            const normalForce = this.parameters.mass * g * Math.cos(this.angle);
            
            // 摩擦力の計算
            const frictionMagnitude = this.parameters.frictionCoef * normalForce;
            
            // 速度の方向を取得（静止している場合は斜面方向）
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            let dirX = -Math.cos(this.angle);
            let dirY = Math.sin(this.angle);
            
            if (speed > 0) {
                dirX = this.velocity.x / speed;
                dirY = this.velocity.y / speed;
            }
            
            // 摩擦力の方向（速度と逆）
            const frictionX = speed > 0 ? -frictionMagnitude * dirX / this.parameters.mass : 0;
            const frictionY = speed > 0 ? -frictionMagnitude * dirY / this.parameters.mass : 0;
            
            // 加速度の計算（重力の斜面方向成分 + 摩擦）
            this.acceleration.x = gParallel * -Math.cos(this.angle) + frictionX;
            this.acceleration.y = gParallel * Math.sin(this.angle) + frictionY;
            
            // 速度の更新
            this.velocity.x += this.acceleration.x * this.timeStep;
            this.velocity.y += this.acceleration.y * this.timeStep;
            
            // 静止判定（摩擦で速度が非常に小さくなった場合）
            if (Math.abs(gParallel) <= this.parameters.frictionCoef * g * Math.cos(this.angle)) {
                // 静止摩擦で停止
                if (speed < 0.1) {
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }
            }
            
            // 位置の更新
            this.position.x += this.velocity.x * this.timeStep;
            this.position.y += this.velocity.y * this.timeStep;
            
            // 斜面からのはみ出しチェック
            this.constrainToPlane();
            
            // 軌跡を追加
            if (prevPos.x !== this.position.x || prevPos.y !== this.position.y) {
                this.trail.push({ ...this.position });
                if (this.trail.length > this.maxTrailPoints) {
                    this.trail.shift();
                }
            }
            
            // 斜面の下端に到達したかチェック
            const distanceToEnd = Math.sqrt(
                Math.pow(this.position.x - this.planeStart.x, 2) +
                Math.pow(this.position.y - this.planeStart.y, 2)
            );
            
            if (distanceToEnd < this.radius) {
                this.stop();
            }
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }
    
    /**
     * 物体を斜面上に拘束
     */
    constrainToPlane() {
        // 斜面の法線ベクトル
        const normalX = Math.sin(this.angle);
        const normalY = Math.cos(this.angle);
        
        // 斜面の方程式 ax + by + c = 0 の係数
        const a = normalY;
        const b = -normalX;
        const c = -(a * this.planeStart.x + b * this.planeStart.y);
        
        // 点から直線への距離
        const distance = Math.abs(a * this.position.x + b * this.position.y + c) / Math.sqrt(a * a + b * b);
        
        // 斜面の近くにいるかチェック
        if (distance > this.radius) {
            // 斜面の上に戻す
            this.position.x += normalX * (this.radius - distance);
            this.position.y -= normalY * (this.radius - distance);
            
            // 速度の法線方向成分を除去（跳ね返り）
            const dotProduct = this.velocity.x * normalX - this.velocity.y * normalY;
            this.velocity.x -= dotProduct * normalX;
            this.velocity.y += dotProduct * normalY;
        }
        
        // 斜面の範囲内に収める
        const t = ((this.position.x - this.planeStart.x) * (this.planeEnd.x - this.planeStart.x) +
                   (this.position.y - this.planeStart.y) * (this.planeEnd.y - this.planeStart.y)) /
                  (Math.pow(this.planeEnd.x - this.planeStart.x, 2) + 
                   Math.pow(this.planeEnd.y - this.planeStart.y, 2));
        
        if (t < 0) {
            this.position.x = this.planeStart.x + normalX * this.radius;
            this.position.y = this.planeStart.y - normalY * this.radius;
            this.velocity.x = 0;
            this.velocity.y = 0;
        } else if (t > 1) {
            this.position.x = this.planeEnd.x + normalX * this.radius;
            this.position.y = this.planeEnd.y - normalY * this.radius;
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // 軌跡の描画
        this.p5.noFill();
        this.p5.stroke(150, 150, 255, 150);
        this.p5.strokeWeight(2);
        this.p5.beginShape();
        for (const point of this.trail) {
            this.p5.vertex(point.x, point.y);
        }
        this.p5.endShape();
        
        // 斜面の描画
        this.drawPlane();
        
        // 物体の描画
        this.p5.fill(30, 144, 255);
        this.p5.stroke(23, 108, 192);
        this.p5.strokeWeight(1);
        this.p5.ellipse(this.position.x, this.position.y, this.radius * 2);
        
        // 力のベクトル表示
        this.drawForceVectors();
        
        // エネルギー表示
        this.drawEnergyDisplay();
    }
    
    /**
     * 斜面を描画
     */
    drawPlane() {
        // 斜面の本体
        this.p5.strokeWeight(2);
        this.p5.stroke(100);
        this.p5.line(this.planeStart.x, this.planeStart.y, this.planeEnd.x, this.planeEnd.y);
        
        // 斜面の塗りつぶし
        this.p5.fill(200, 200, 200, 100);
        this.p5.noStroke();
        this.p5.beginShape();
        this.p5.vertex(this.planeStart.x, this.planeStart.y);
        this.p5.vertex(this.planeEnd.x, this.planeEnd.y);
        this.p5.vertex(this.planeEnd.x, this.p5.height);
        this.p5.vertex(this.planeStart.x, this.p5.height);
        this.p5.endShape(this.p5.CLOSE);
        
        // 角度表示
        this.p5.push();
        this.p5.translate(this.planeStart.x, this.planeStart.y);
        this.p5.stroke(255, 0, 0);
        this.p5.strokeWeight(1);
        this.p5.noFill();
        this.p5.arc(0, 0, 40, 40, -this.angle, 0);
        
        this.p5.fill(255, 0, 0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.text(`${this.parameters.angle}°`, 30 * Math.cos(-this.angle/2), 30 * Math.sin(-this.angle/2));
        this.p5.pop();
        
        // 座標系の表示
        this.p5.push();
        this.p5.translate(50, 50);
        this.p5.stroke(0);
        this.p5.strokeWeight(1);
        
        // x軸
        this.p5.line(0, 0, 30, 0);
        this.p5.fill(0);
        this.p5.triangle(30, 0, 25, -3, 25, 3);
        this.p5.noStroke();
        this.p5.text("x", 35, 0);
        
        // y軸
        this.p5.stroke(0);
        this.p5.line(0, 0, 0, 30);
        this.p5.fill(0);
        this.p5.triangle(0, 30, -3, 25, 3, 25);
        this.p5.noStroke();
        this.p5.text("y", 0, 35);
        
        // x'軸（斜面に平行）
        this.p5.stroke(0, 150, 0);
        this.p5.line(0, 0, 30 * Math.cos(-this.angle), 30 * Math.sin(-this.angle));
        this.p5.fill(0, 150, 0);
        this.p5.triangle(
            30 * Math.cos(-this.angle), 
            30 * Math.sin(-this.angle), 
            30 * Math.cos(-this.angle) - 5 * Math.cos(-this.angle - Math.PI/6), 
            30 * Math.sin(-this.angle) - 5 * Math.sin(-this.angle - Math.PI/6), 
            30 * Math.cos(-this.angle) - 5 * Math.cos(-this.angle + Math.PI/6), 
            30 * Math.sin(-this.angle) - 5 * Math.sin(-this.angle + Math.PI/6)
        );
        this.p5.noStroke();
        this.p5.text("x'", 35 * Math.cos(-this.angle), 35 * Math.sin(-this.angle));
        
        // y'軸（斜面に垂直）
        this.p5.stroke(0, 150, 0);
        this.p5.line(0, 0, 30 * Math.cos(-this.angle + Math.PI/2), 30 * Math.sin(-this.angle + Math.PI/2));
        this.p5.fill(0, 150, 0);
        this.p5.triangle(
            30 * Math.cos(-this.angle + Math.PI/2), 
            30 * Math.sin(-this.angle + Math.PI/2), 
            30 * Math.cos(-this.angle + Math.PI/2) - 5 * Math.cos(-this.angle + Math.PI/2 - Math.PI/6), 
            30 * Math.sin(-this.angle + Math.PI/2) - 5 * Math.sin(-this.angle + Math.PI/2 - Math.PI/6), 
            30 * Math.cos(-this.angle + Math.PI/2) - 5 * Math.cos(-this.angle + Math.PI/2 + Math.PI/6), 
            30 * Math.sin(-this.angle + Math.PI/2) - 5 * Math.sin(-this.angle + Math.PI/2 + Math.PI/6)
        );
        this.p5.noStroke();
        this.p5.text("y'", 35 * Math.cos(-this.angle + Math.PI/2), 35 * Math.sin(-this.angle + Math.PI/2));
        
        this.p5.pop();
    }
    
    /**
     * 力のベクトルを描画
     */
    drawForceVectors() {
        // 力の大きさを計算
        const m = this.parameters.mass;
        const g = this.parameters.gravity;
        
        // 重力
        const gravityForce = m * g;
        
        // 垂直抗力
        const normalForce = m * g * Math.cos(this.angle);
        
        // 摩擦力
        const frictionForce = this.parameters.frictionCoef * normalForce;
        
        // 斜面に沿った重力成分
        const parallelForce = m * g * Math.sin(this.angle);
        
        // 重力ベクトル
        this.drawVector(
            this.position.x,
            this.position.y,
            0,
            gravityForce * 0.2,
            "#4CAF50",
            "重力"
        );
        
        // 垂直抗力ベクトル
        this.drawVector(
            this.position.x,
            this.position.y,
            normalForce * Math.sin(this.angle) * 0.2,
            -normalForce * Math.cos(this.angle) * 0.2,
            "#2196F3",
            "垂直抗力"
        );
        
        // 摩擦力ベクトル
        if (Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.y) > 0.001) {
            // 速度の方向を取得
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            const dirX = this.velocity.x / speed;
            const dirY = this.velocity.y / speed;
            
            this.drawVector(
                this.position.x,
                this.position.y,
                -frictionForce * dirX * 0.2,
                -frictionForce * dirY * 0.2,
                "#F44336",
                "摩擦力"
            );
        }
        
        // 斜面方向の力の合計
        const netForceX = -parallelForce * Math.cos(this.angle);
        const netForceY = parallelForce * Math.sin(this.angle);
        
        // 速度ベクトル
        this.drawVector(
            this.position.x,
            this.position.y,
            this.velocity.x * 5,
            this.velocity.y * 5,
            "#FF9800",
            "速度"
        );
    }
    
    /**
     * エネルギー表示を描画
     */
    drawEnergyDisplay() {
        // 現在の高さを計算（斜面の下端を基準点とする）
        const dx = this.position.x - this.planeStart.x;
        const dy = this.position.y - this.planeStart.y;
        
        // 斜面に沿った距離
        const distanceAlongPlane = Math.sqrt(dx * dx + dy * dy) * Math.sign(dx * Math.cos(this.angle) + dy * Math.sin(this.angle));
        
        // 高さ
        const height = distanceAlongPlane * Math.sin(this.angle);
        
        // 位置エネルギー
        const potentialEnergy = this.parameters.mass * this.parameters.gravity * height;
        
        // 運動エネルギー
        const kineticEnergy = 0.5 * this.parameters.mass * (this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        // 理論上の初期エネルギー（初期位置での位置エネルギー）
        const planeHeight = this.planeLength * Math.sin(this.angle);
        const initialEnergy = this.parameters.mass * this.parameters.gravity * planeHeight;
        
        // エネルギーバーを描画
        this.drawEnergyBar(
            this.p5.width - 180,
            this.p5.height - 80,
            150,
            20,
            kineticEnergy,
            potentialEnergy,
            initialEnergy
        );
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 斜面に沿った速度の大きさ
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        // 現在の高さを計算（斜面の下端を基準点とする）
        const dx = this.position.x - this.planeStart.x;
        const dy = this.position.y - this.planeStart.y;
        
        // 斜面に沿った距離
        const distanceAlongPlane = Math.sqrt(dx * dx + dy * dy) * Math.sign(dx * Math.cos(this.angle) + dy * Math.sin(this.angle));
        
        // 高さ
        const height = distanceAlongPlane * Math.sin(this.angle);
        
        // 力の計算
        const m = this.parameters.mass;
        const g = this.parameters.gravity;
        const gravityForce = m * g;
        const normalForce = m * g * Math.cos(this.angle);
        const parallelForce = m * g * Math.sin(this.angle);
        const frictionForce = this.parameters.frictionCoef * normalForce;
        
        // 運動エネルギーと位置エネルギー
        const potentialEnergy = m * g * height;
        const kineticEnergy = 0.5 * m * speed * speed;
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "distance": { 
                name: "斜面距離", 
                value: distanceAlongPlane.toFixed(2), 
                unit: "m" 
            },
            "speed": { 
                name: "速度", 
                value: speed.toFixed(2), 
                unit: "m/s" 
            },
            "normalForce": { 
                name: "垂直抗力", 
                value: normalForce.toFixed(2), 
                unit: "N" 
            },
            "parallelForce": { 
                name: "平行成分", 
                value: parallelForce.toFixed(2), 
                unit: "N" 
            },
            "frictionForce": { 
                name: "摩擦力", 
                value: frictionForce.toFixed(2), 
                unit: "N" 
            },
            "netForce": { 
                name: "正味の力", 
                value: Math.max(0, parallelForce - frictionForce).toFixed(2), 
                unit: "N" 
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
                value: (potentialEnergy + kineticEnergy).toFixed(2), 
                unit: "J" 
            }
        };
    }
}