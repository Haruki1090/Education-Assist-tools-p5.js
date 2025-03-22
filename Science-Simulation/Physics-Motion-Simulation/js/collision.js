/**
 * Collision - 弾性衝突のシミュレーション
 * 複数の物体間の弾性衝突を示す
 */
class Collision extends SimulationBase {
    constructor() {
        super();
        this.balls = [];
        this.ballRadius = 15;
        this.selectedBall = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
    }

    /**
     * パラメータ定義
     */
    defineParameters() {
        return [
            {
                id: "restitution",
                name: "反発係数",
                min: 0,
                max: 1,
                step: 0.01,
                default: 0.9,
                unit: ""
            },
            {
                id: "gravity",
                name: "重力加速度",
                min: 0,
                max: 10,
                step: 0.1,
                default: 0.5,
                unit: "m/s²"
            },
            {
                id: "friction",
                name: "摩擦係数",
                min: 0,
                max: 0.1,
                step: 0.001,
                default: 0.005,
                unit: ""
            },
            {
                id: "ballCount",
                name: "ボールの数",
                min: 2,
                max: 10,
                step: 1,
                default: 5,
                unit: "個"
            }
        ];
    }

    /**
     * シミュレーションの説明
     */
    getDescription() {
        return "弾性衝突のシミュレーションです。複数のボールの衝突をシミュレートし、運動量とエネルギーの保存を観察できます。ボールをドラッグして動かすことができます。";
    }

    /**
     * 初期化
     */
    init(p5Instance) {
        super.init(p5Instance);
        
        // マウスイベントのセットアップ
        this.p5.mousePressed = () => this.onMousePressed();
        this.p5.mouseDragged = () => this.onMouseDragged();
        this.p5.mouseReleased = () => this.onMouseReleased();
    }

    /**
     * 初期化
     */
    reset() {
        super.reset();
        
        // ボールを作成
        this.createBalls();
        
        // ドラッグ状態のリセット
        this.selectedBall = null;
        this.isDragging = false;
    }
    
    /**
     * ボールを作成
     */
    createBalls() {
        this.balls = [];
        
        const colors = [
            "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
            "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50"
        ];
        
        const count = this.parameters.ballCount;
        
        for (let i = 0; i < count; i++) {
            // 配置場所の決定
            let x, y, overlapping;
            let attempts = 0;
            const maxAttempts = 100;
            
            do {
                overlapping = false;
                x = this.p5.random(this.ballRadius * 2, this.p5.width - this.ballRadius * 2);
                y = this.p5.random(this.ballRadius * 2, this.p5.height - this.ballRadius * 2);
                
                // 他のボールとの重なりをチェック
                for (const ball of this.balls) {
                    const dx = x - ball.position.x;
                    const dy = y - ball.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.ballRadius * 2) {
                        overlapping = true;
                        break;
                    }
                }
                
                attempts++;
            } while (overlapping && attempts < maxAttempts);
            
            // 一定回数試行してもうまくいかない場合はランダムに配置
            if (attempts >= maxAttempts) {
                x = this.p5.random(this.ballRadius * 2, this.p5.width - this.ballRadius * 2);
                y = this.p5.random(this.ballRadius * 2, this.p5.height - this.ballRadius * 2);
            }
            
            // 質量は半径に比例
            const radius = this.p5.random(this.ballRadius * 0.7, this.ballRadius * 1.3);
            const mass = Math.pow(radius / this.ballRadius, 2); // 面積比で質量を決定
            
            // 初速度をランダムに設定
            const vx = this.p5.random(-2, 2);
            const vy = this.p5.random(-2, 2);
            
            this.balls.push({
                position: { x, y },
                velocity: { x: vx, y: vy },
                radius: radius,
                mass: mass,
                color: colors[i % colors.length],
                trail: []
            });
        }
    }

    /**
     * パラメータ変更時の処理
     */
    onParameterChanged(id, value) {
        if (id === "ballCount") {
            this.reset();
        }
    }

    /**
     * マウスが押された時の処理
     */
    onMousePressed() {
        const canvas = document.querySelector("#simulation-canvas canvas");
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = this.p5.mouseX;
        const mouseY = this.p5.mouseY;
        
        // キャンバス内のクリックかつシミュレーション実行中でない場合のみ処理
        if (mouseX >= 0 && mouseX <= this.p5.width && 
            mouseY >= 0 && mouseY <= this.p5.height) {
            
            // ボールの選択
            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                const dx = mouseX - ball.position.x;
                const dy = mouseY - ball.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= ball.radius) {
                    this.selectedBall = ball;
                    this.dragOffset = { x: dx, y: dy };
                    this.isDragging = true;
                    
                    // ドラッグ中のボールが最前面に表示されるよう配列の最後に移動
                    this.balls.splice(i, 1);
                    this.balls.push(this.selectedBall);
                    break;
                }
            }
        }
    }
    
    /**
     * マウスがドラッグされた時の処理
     */
    onMouseDragged() {
        if (this.isDragging && this.selectedBall && !this.isRunning) {
            const mouseX = this.p5.mouseX;
            const mouseY = this.p5.mouseY;
            
            // ボールの位置を更新（境界チェック付き）
            const newX = mouseX - this.dragOffset.x;
            const newY = mouseY - this.dragOffset.y;
            
            this.selectedBall.position.x = this.p5.constrain(
                newX,
                this.selectedBall.radius,
                this.p5.width - this.selectedBall.radius
            );
            
            this.selectedBall.position.y = this.p5.constrain(
                newY,
                this.selectedBall.radius,
                this.p5.height - this.selectedBall.radius
            );
            
            // ドラッグ中は他のボールとの衝突を回避（重なり防止）
            for (const ball of this.balls) {
                if (ball === this.selectedBall) continue;
                
                const dx = this.selectedBall.position.x - ball.position.x;
                const dy = this.selectedBall.position.y - ball.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.selectedBall.radius + ball.radius;
                
                if (distance < minDistance) {
                    // 重なりがある場合、押し戻す
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distance;
                    
                    this.selectedBall.position.x += Math.cos(angle) * overlap;
                    this.selectedBall.position.y += Math.sin(angle) * overlap;
                }
            }
        }
    }
    
    /**
     * マウスが離された時の処理
     */
    onMouseReleased() {
        if (this.isDragging && this.selectedBall && !this.isRunning) {
            // マウスの移動速度からボールの初速度を設定
            if (this.p5.pmouseX !== 0 && this.p5.pmouseY !== 0) {
                const dx = this.p5.mouseX - this.p5.pmouseX;
                const dy = this.p5.mouseY - this.p5.pmouseY;
                
                this.selectedBall.velocity.x = dx * 0.2;
                this.selectedBall.velocity.y = dy * 0.2;
            }
        }
        
        this.selectedBall = null;
        this.isDragging = false;
    }

    /**
     * 更新処理
     */
    update() {
        if (this.isRunning) {
            // 時間を進める
            this.time += this.timeStep;
            
            // 各ボールの位置を更新
            for (const ball of this.balls) {
                // 重力の影響を反映
                ball.velocity.y += this.parameters.gravity * this.timeStep;
                
                // 摩擦の影響を反映
                const friction = this.parameters.friction;
                if (friction > 0 && (ball.velocity.x !== 0 || ball.velocity.y !== 0)) {
                    const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
                    if (speed > 0) {
                        const frictionX = -friction * ball.velocity.x;
                        const frictionY = -friction * ball.velocity.y;
                        ball.velocity.x += frictionX;
                        ball.velocity.y += frictionY;
                    }
                }
                
                // 位置の更新
                ball.position.x += ball.velocity.x;
                ball.position.y += ball.velocity.y;
                
                // 軌跡を更新
                ball.trail.push({ x: ball.position.x, y: ball.position.y });
                if (ball.trail.length > 50) {
                    ball.trail.shift();
                }
                
                // 壁との衝突判定
                if (ball.position.x - ball.radius < 0) {
                    ball.position.x = ball.radius;
                    ball.velocity.x = -ball.velocity.x * this.parameters.restitution;
                } else if (ball.position.x + ball.radius > this.p5.width) {
                    ball.position.x = this.p5.width - ball.radius;
                    ball.velocity.x = -ball.velocity.x * this.parameters.restitution;
                }
                
                if (ball.position.y - ball.radius < 0) {
                    ball.position.y = ball.radius;
                    ball.velocity.y = -ball.velocity.y * this.parameters.restitution;
                } else if (ball.position.y + ball.radius > this.p5.height) {
                    ball.position.y = this.p5.height - ball.radius;
                    ball.velocity.y = -ball.velocity.y * this.parameters.restitution;
                }
            }
            
            // ボール同士の衝突判定
            for (let i = 0; i < this.balls.length; i++) {
                for (let j = i + 1; j < this.balls.length; j++) {
                    this.checkCollision(this.balls[i], this.balls[j]);
                }
            }
            
            // データ表示の更新
            this.updateDataDisplay();
        }
    }
    
    /**
     * 衝突判定と衝突応答
     * @param {Object} ball1 - 1つ目のボール
     * @param {Object} ball2 - 2つ目のボール
     */
    checkCollision(ball1, ball2) {
        const dx = ball2.position.x - ball1.position.x;
        const dy = ball2.position.y - ball1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = ball1.radius + ball2.radius;
        
        // 衝突が発生している場合
        if (distance < minDistance) {
            // 衝突の方向ベクトル
            const nx = dx / distance;
            const ny = dy / distance;
            
            // めり込みの修正
            const overlap = minDistance - distance;
            const totalMass = ball1.mass + ball2.mass;
            
            // 質量に応じた押し戻し
            ball1.position.x -= nx * overlap * (ball2.mass / totalMass);
            ball1.position.y -= ny * overlap * (ball2.mass / totalMass);
            ball2.position.x += nx * overlap * (ball1.mass / totalMass);
            ball2.position.y += ny * overlap * (ball1.mass / totalMass);
            
            // 相対速度
            const vx = ball2.velocity.x - ball1.velocity.x;
            const vy = ball2.velocity.y - ball1.velocity.y;
            
            // 衝突方向への速度成分
            const vn = vx * nx + vy * ny;
            
            // 反発なしの場合は衝突処理をスキップ
            if (vn > 0) return;
            
            // 反発係数による運動量交換
            const restitution = this.parameters.restitution;
            const impulse = -(1 + restitution) * vn / totalMass;
            
            // 衝突後の速度を計算
            ball1.velocity.x -= impulse * ball2.mass * nx;
            ball1.velocity.y -= impulse * ball2.mass * ny;
            ball2.velocity.x += impulse * ball1.mass * nx;
            ball2.velocity.y += impulse * ball1.mass * ny;
        }
    }

    /**
     * 描画処理
     */
    draw() {
        // 背景
        this.p5.background(240);
        
        // 各ボールの軌跡を描画
        for (const ball of this.balls) {
            if (ball.trail.length > 1) {
                this.p5.noFill();
                this.p5.stroke(this.p5.color(ball.color).levels[0],
                               this.p5.color(ball.color).levels[1],
                               this.p5.color(ball.color).levels[2], 
                               100);
                this.p5.strokeWeight(1);
                this.p5.beginShape();
                for (const point of ball.trail) {
                    this.p5.vertex(point.x, point.y);
                }
                this.p5.endShape();
            }
        }
        
        // 各ボールを描画
        for (const ball of this.balls) {
            // ボールの影
            this.p5.noStroke();
            this.p5.fill(0, 0, 0, 30);
            this.p5.ellipse(ball.position.x + 3, ball.position.y + 3, ball.radius * 2);
            
            // ボール本体
            this.p5.fill(ball.color);
            this.p5.stroke(0, 0, 0, 50);
            this.p5.strokeWeight(1);
            this.p5.ellipse(ball.position.x, ball.position.y, ball.radius * 2);
            
            // 質量表示
            this.p5.fill(255);
            this.p5.noStroke();
            this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
            this.p5.textSize(ball.radius * 0.8);
            this.p5.text(ball.mass.toFixed(1), ball.position.x, ball.position.y);
            
            // 速度ベクトルの描画
            if (this.isRunning) {
                this.drawVector(
                    ball.position.x,
                    ball.position.y,
                    ball.velocity.x * 5,
                    ball.velocity.y * 5,
                    "#FF5722",
                    ""
                );
            }
        }
        
        // エネルギー表示
        this.drawEnergyDisplay();
        
        // 運動量表示
        this.drawMomentumDisplay();
        
        // ドラッグ中のガイドを描画
        if (this.isDragging && this.selectedBall && !this.isRunning) {
            this.p5.stroke(255, 0, 0, 150);
            this.p5.strokeWeight(2);
            this.p5.line(
                this.p5.pmouseX,
                this.p5.pmouseY,
                this.p5.mouseX,
                this.p5.mouseY
            );
        }
    }
    
    /**
     * エネルギー表示を描画
     */
    drawEnergyDisplay() {
        // 運動エネルギーと位置エネルギーの合計を計算
        let totalKineticEnergy = 0;
        let totalPotentialEnergy = 0;
        
        for (const ball of this.balls) {
            // 運動エネルギー E_k = 0.5 * m * v^2
            const v2 = ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y;
            const kineticEnergy = 0.5 * ball.mass * v2;
            
            // 位置エネルギー E_p = m * g * h (基準は床)
            const height = this.p5.height - ball.position.y;
            const potentialEnergy = ball.mass * this.parameters.gravity * height;
            
            totalKineticEnergy += kineticEnergy;
            totalPotentialEnergy += potentialEnergy;
        }
        
        // 初期エネルギー（近似値として現在のエネルギー+20%）
        const totalEnergy = totalKineticEnergy + totalPotentialEnergy;
        const initialEnergy = this.isRunning ? Math.max(totalEnergy * 1.2, 1) : 1;
        
        // エネルギーバーを描画
        this.drawEnergyBar(
            this.p5.width - 180,
            this.p5.height - 80,
            150,
            20,
            totalKineticEnergy,
            totalPotentialEnergy,
            initialEnergy
        );
    }
    
    /**
     * 運動量表示を描画
     */
    drawMomentumDisplay() {
        // 系全体の運動量を計算
        let totalMomentumX = 0;
        let totalMomentumY = 0;
        
        for (const ball of this.balls) {
            totalMomentumX += ball.mass * ball.velocity.x;
            totalMomentumY += ball.mass * ball.velocity.y;
        }
        
        const totalMomentum = Math.sqrt(totalMomentumX * totalMomentumX + totalMomentumY * totalMomentumY);
        
        // 運動量ベクトルの描画
        this.p5.push();
        this.p5.translate(this.p5.width - 90, 50);
        
        // ラベル
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text("系の運動量", 0, -30);
        
        // 背景円
        this.p5.noFill();
        this.p5.stroke(200);
        this.p5.ellipse(0, 0, 60, 60);
        
        // 運動量ベクトル
        const scale = 20 / Math.max(totalMomentum, 1); // スケーリング
        const momentumX = totalMomentumX * scale;
        const momentumY = totalMomentumY * scale;
        
        this.p5.stroke(255, 0, 0);
        this.p5.strokeWeight(2);
        this.p5.line(0, 0, momentumX, momentumY);
        
        // 矢印の先端
        this.p5.push();
        this.p5.translate(momentumX, momentumY);
        this.p5.rotate(Math.atan2(momentumY, momentumX));
        this.p5.fill(255, 0, 0);
        this.p5.triangle(0, 0, -10, -5, -10, 5);
        this.p5.pop();
        
        // 運動量の大きさを表示
        this.p5.fill(0);
        this.p5.noStroke();
        this.p5.textAlign(this.p5.CENTER);
        this.p5.text(totalMomentum.toFixed(2), 0, 40);
        
        this.p5.pop();
    }

    /**
     * データ表示の更新
     */
    updateDataDisplay() {
        // 運動エネルギーと位置エネルギーの合計
        let totalKineticEnergy = 0;
        let totalPotentialEnergy = 0;
        
        for (const ball of this.balls) {
            // 運動エネルギー
            const v2 = ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y;
            const kineticEnergy = 0.5 * ball.mass * v2;
            
            // 位置エネルギー
            const height = this.p5.height - ball.position.y;
            const potentialEnergy = ball.mass * this.parameters.gravity * height;
            
            totalKineticEnergy += kineticEnergy;
            totalPotentialEnergy += potentialEnergy;
        }
        
        // 系全体の運動量
        let totalMomentumX = 0;
        let totalMomentumY = 0;
        
        for (const ball of this.balls) {
            totalMomentumX += ball.mass * ball.velocity.x;
            totalMomentumY += ball.mass * ball.velocity.y;
        }
        
        const totalMomentum = Math.sqrt(totalMomentumX * totalMomentumX + totalMomentumY * totalMomentumY);
        
        // データを設定
        this.dataToDisplay = {
            "time": { 
                name: "経過時間", 
                value: this.time.toFixed(2), 
                unit: "秒" 
            },
            "momentum": { 
                name: "系の運動量", 
                value: totalMomentum.toFixed(2), 
                unit: "kg·m/s" 
            },
            "kineticEnergy": { 
                name: "運動エネルギー", 
                value: totalKineticEnergy.toFixed(2), 
                unit: "J" 
            },
            "potentialEnergy": { 
                name: "位置エネルギー", 
                value: totalPotentialEnergy.toFixed(2), 
                unit: "J" 
            },
            "totalEnergy": { 
                name: "全エネルギー", 
                value: (totalKineticEnergy + totalPotentialEnergy).toFixed(2), 
                unit: "J" 
            }
        };
    }
}