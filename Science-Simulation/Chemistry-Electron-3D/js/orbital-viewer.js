/**
 * 3D電子軌道ビューアクラス
 * Three.jsを使用して電子配置の3D表示を管理
 */
class OrbitalViewer {
    /**
     * OrbitalViewerコンストラクタ
     * @param {string} containerId - 3Dビューアを配置するHTML要素のID
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`指定されたコンテナID ${containerId} が見つかりません`);
            return;
        }
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.nucleus = null;
        this.shells = [];
        this.orbitals = [];
        this.electrons = [];
        this.electronTrails = [];
        this.trailPoints = [];
        
        // マウスとレイキャストの初期化を追加
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        
        this.animationFrameId = null;
        this.currentElement = null;
        this.isInitialized = false;
        this.loadingStartTime = 0;
        
        // 設定オプション
        this.options = {
            electronSpeed: 0.5,       // 電子の移動速度 (0.1-2.0)
            brightnessLevel: 0.5,     // 明るさレベル (0.1-1.0)
            showShells: true,         // 電子殻の表示
            showOrbitals: true,       // 軌道の表示
            initialCameraPosition: null, // カメラの初期位置
            lightMode: document.documentElement.getAttribute('data-theme') !== 'dark', // ライトモードかどうか
            trailLength: 20,          // 軌跡の長さ（最適化のために減らす）
            trailFadeTime: 1.0,       // 軌跡の消える時間（秒）
            lowDetailMode: false,     // 低詳細モード（パフォーマンス向上用）
            showTrails: true          // 軌跡の表示
        };
        
        // THREE.jsが読み込まれているか確認
        if (typeof THREE === 'undefined') {
            console.error('THREE.jsが読み込まれていません');
            return;
        }
        
        // 情報表示用のDOMエレメント
        this.orbitalInfo = document.getElementById('orbital-info');
        this.orbitalDetails = document.getElementById('orbital-details');
        
        // 初期化処理を遅延実行（パフォーマンスのため）
        this.showLoadingState();
        setTimeout(() => {
            try {
                this.initialize();
                this.setupControls();
            } catch (error) {
                console.error('OrbitalViewerの初期化に失敗しました:', error);
                this.showErrorState(error.message);
            }
        }, 100);
    }
    
    /**
     * ローディング状態を表示
     */
    showLoadingState() {
        if (!this.container) return;
        
        // すでにレンダラーがある場合は、キャンバスを保持したままローディングを表示
        if (this.renderer && this.renderer.domElement) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.style.position = 'absolute';
            loadingOverlay.style.top = '0';
            loadingOverlay.style.left = '0';
            loadingOverlay.style.width = '100%';
            loadingOverlay.style.height = '100%';
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.alignItems = 'center';
            loadingOverlay.style.justifyContent = 'center';
            loadingOverlay.style.background = 'rgba(0, 0, 0, 0.7)';
            loadingOverlay.style.zIndex = '10';
            
            loadingOverlay.innerHTML = `
                <div style="text-align: center; color: white;">
                    <i class="fas fa-atom fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>3D軌道を読み込み中...</p>
                    <div class="progress-container" style="width: 80%; height: 4px; background: rgba(255,255,255,0.2); margin: 10px auto;">
                        <div class="progress-bar" style="width: 30%; height: 100%; background: var(--accent-color); animation: loading-progress 2s infinite ease-in-out;"></div>
                    </div>
                </div>
            `;
            
            // 既存のオーバーレイがあれば削除
            const existingOverlay = this.container.querySelector('.loading-overlay');
            if (existingOverlay) {
                this.container.removeChild(existingOverlay);
            }
            
            this.container.appendChild(loadingOverlay);
        } else {
            // レンダラーがまだない場合はHTMLを直接書き換え
            this.container.innerHTML = `
                <div class="tech-loading">
                    <i class="fas fa-atom fa-spin"></i>
                    <p>3D電子軌道を初期化中...</p>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * エラー状態を表示
     * @param {string} message - エラーメッセージ
     */
    showErrorState(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="tech-placeholder">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                <p>${message || '3Dビューアの読み込みに失敗しました'}</p>
                <button onclick="retryLoadViewer()" class="tech-button">
                    <i class="fas fa-sync-alt"></i>
                    再試行
                </button>
            </div>
        `;
    }
    
    /**
     * コントロールパネルの設定
     */
    setupControls() {
        // 視点リセットボタン
        const resetCameraBtn = document.getElementById('reset-camera');
        if (resetCameraBtn) {
            resetCameraBtn.addEventListener('click', () => this.resetCamera());
        }
        
        // 電子殻表示切替ボタン
        const toggleShellsBtn = document.getElementById('toggle-shells');
        if (toggleShellsBtn) {
            toggleShellsBtn.addEventListener('click', () => this.toggleShells());
        }
        
        // 軌道表示切替ボタン
        const toggleOrbitalsBtn = document.getElementById('toggle-orbitals');
        if (toggleOrbitalsBtn) {
            toggleOrbitalsBtn.addEventListener('click', () => this.toggleOrbitals());
        }
        
        // 明るさ調整スライダー
        const brightnessSlider = document.getElementById('brightness-slider');
        if (brightnessSlider) {
            brightnessSlider.value = this.options.brightnessLevel * 100;
            brightnessSlider.addEventListener('input', (e) => {
                this.setBrightness(e.target.value / 100);
            });
        }
        
        // 電子速度調整スライダー
        const electronSpeedSlider = document.getElementById('electron-speed');
        if (electronSpeedSlider) {
            electronSpeedSlider.value = this.options.electronSpeed * 50;
            electronSpeedSlider.addEventListener('input', (e) => {
                this.setElectronSpeed(e.target.value / 50);
            });
        }
    }
    
    /**
     * 明るさレベルを設定
     * @param {number} level - 明るさレベル (0.0-1.0)
     */
    setBrightness(level) {
        this.options.brightnessLevel = Math.max(0.1, Math.min(1.0, level));
        
        // 光源の明るさを調整
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object instanceof THREE.Light) {
                    if (object instanceof THREE.AmbientLight) {
                        object.intensity = 0.2 + (this.options.brightnessLevel * 0.8);
                    } else {
                        object.intensity = this.options.brightnessLevel * (this.options.lightMode ? 1.0 : 0.7);
                    }
                }
            });
            
            // 現在のテーマに応じて背景色を調整
            const isLightMode = this.options.lightMode;
            let bgBase = isLightMode ? 240 : 15; // ライトモードの場合は明るい色をベースに
            let bgRange = isLightMode ? -100 : 35; // 調整可能な範囲（ライトモードは暗くなる方向）
            
            // 明るさレベルに基づいて背景色を計算
            const bgBrightness = Math.floor(bgBase + this.options.brightnessLevel * bgRange);
            this.scene.background = new THREE.Color(`rgb(${bgBrightness}, ${bgBrightness}, ${bgBrightness})`);
        }
    }
    
    /**
     * 電子の移動速度を設定
     * @param {number} speed - 電子の移動速度 (0.0-2.0)
     */
    setElectronSpeed(speed) {
        this.options.electronSpeed = Math.max(0.1, Math.min(2.0, speed));
        
        // 各電子の速度を更新
        this.electrons.forEach(electron => {
            if (electron.userData) {
                electron.userData.speed = this.options.electronSpeed * (0.5 + Math.random() * 0.5);
            }
        });
    }
    
    /**
     * 電子殻の表示/非表示を切り替え
     */
    toggleShells() {
        this.options.showShells = !this.options.showShells;
        
        this.shells.forEach(shell => {
            shell.visible = this.options.showShells;
        });
    }
    
    /**
     * 軌道の表示/非表示を切り替え
     */
    toggleOrbitals() {
        this.options.showOrbitals = !this.options.showOrbitals;
        
        this.orbitals.forEach(orbital => {
            orbital.visible = this.options.showOrbitals;
        });
    }
    
    /**
     * カメラをリセット位置に戻す
     */
    resetCamera() {
        if (!this.camera || !this.controls) return;
        
        // 初期位置が保存されていれば、その位置に戻す
        if (this.options.initialCameraPosition) {
            this.camera.position.copy(this.options.initialCameraPosition);
        } else {
            // デフォルトの位置
            this.camera.position.set(0, 0, 10);
        }
        
        // カメラをターゲット（原子核）に向ける
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
    
    /**
     * テーマの変更に応じて3Dモデルの見た目を更新
     * @param {boolean} isLightMode - ライトモードかどうか
     */
    updateTheme(isLightMode) {
        this.options.lightMode = isLightMode;
        
        // 背景色を更新
        this.setBrightness(this.options.brightnessLevel);
        
        // 材質の色を更新
        if (this.nucleus) {
            const nucleusMaterial = this.nucleus.material;
            if (isLightMode) {
                nucleusMaterial.color.set(0x333333);
                nucleusMaterial.emissive.set(0x111111);
            } else {
                nucleusMaterial.color.set(0xffffff);
                nucleusMaterial.emissive.set(0x444444);
            }
        }
        
        // 電子の色を更新
        const electronColor = isLightMode ? 0x0066cc : 0x00ffff;
        this.electrons.forEach(electron => {
            if (electron.material) {
                electron.material.color.set(electronColor);
            }
        });
        
        // 軌道の色を更新
        this.orbitals.forEach(orbital => {
            if (orbital.material) {
                orbital.material.opacity = isLightMode ? 0.15 : 0.3;
                // 軌道タイプに応じた色
                if (orbital.userData && orbital.userData.type) {
                    if (orbital.userData.type === 's') {
                        orbital.material.color.set(isLightMode ? 0x6699cc : 0x66ccff);
                    } else if (orbital.userData.type === 'p') {
                        orbital.material.color.set(isLightMode ? 0x66cc66 : 0x00ff00);
                    } else if (orbital.userData.type === 'd') {
                        orbital.material.color.set(isLightMode ? 0xcc6699 : 0xff66cc);
                    } else if (orbital.userData.type === 'f') {
                        orbital.material.color.set(isLightMode ? 0xcccc66 : 0xffff00);
                    }
                }
            }
        });
        
        // 電子殻の色を更新
        this.shells.forEach(shell => {
            if (shell.material) {
                shell.material.color.set(isLightMode ? 0xdddddd : 0x555555);
                shell.material.opacity = isLightMode ? 0.1 : 0.2;
            }
        });
        
        // 軌跡の色を更新
        this.electronTrails.forEach(trail => {
            if (trail.material) {
                const baseColor = isLightMode ? 0x0066cc : 0x00ffff;
                trail.material.color.set(baseColor);
            }
        });
    }
    
    /**
     * 3Dビューアを初期化する
     */
    initialize() {
        if (this.isInitialized) {
            console.log('すでに初期化されています');
            return true;
        }
        
        console.time('初期化');
        
        try {
            // シーンを作成
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x222222);
            
            // カメラを作成（パースペクティブカメラ）
            this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 0, 10);
            
            // レンダラーを作成（WebGL）
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: window.devicePixelRatio < 2,
                alpha: false 
            });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            
            // コンテナにレンダラーを追加
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
            
            // 光源を追加
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            this.scene.add(directionalLight);
            
            // コントロールを設定（OrbitControls）
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.1;
            }
            
            // マウスとレイキャスターを初期化
            this.mouse = new THREE.Vector2();
            this.raycaster = new THREE.Raycaster();
            
            // イベントリスナーを追加
            window.addEventListener('resize', this.onWindowResize.bind(this));
            this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
            
            // アニメーションを開始
            this.animate();
            
            this.isInitialized = true;
            console.timeEnd('初期化');
            return true;
        } catch (error) {
            console.error('初期化エラー:', error);
            this.container.innerHTML = `
                <div class="tech-placeholder">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                    <p>3Dビューアの初期化に失敗しました: ${error.message}</p>
                </div>
            `;
            return false;
        }
    }
    
    /**
     * ウィンドウリサイズ時の処理
     */
    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
    
    /**
     * マウス移動時の処理
     * @param {Event} event - マウスイベント
     */
    onMouseMove(event) {
        // マウス座標を正規化 (-1 から 1 の範囲)
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;
        
        // レイキャストによるオブジェクト検出
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        // カーソルスタイルを変更
        this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        
        // 選択中のオブジェクトがあれば情報を表示
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.type) {
                if (object.userData.type === 'orbital' || object.userData.type === 'electron') {
                    this.showOrbitalInfo(object.userData);
                }
            }
        }
    }
    
    /**
     * マウスクリック時の処理
     * @param {Event} event - マウスイベント
     */
    onMouseClick(event) {
        // レイキャストによるオブジェクト検出
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.type) {
                // クリックされたオブジェクトに応じた処理
                if (object.userData.type === 'orbital') {
                    // 軌道がクリックされた場合、詳細情報を表示
                    this.showOrbitalDetailsPanel(object.userData);
                } else if (object.userData.type === 'electron') {
                    // 電子がクリックされた場合、その電子に関する情報を表示
                    this.showElectronInfo(object.userData);
                }
            }
        }
    }
    
    /**
     * 軌道情報をホバー表示
     * @param {Object} data - 軌道データ
     */
    showOrbitalInfo(data) {
        if (!this.orbitalInfo) {
            // 情報表示用の要素がない場合は作成
            this.orbitalInfo = document.createElement('div');
            this.orbitalInfo.className = 'orbital-tooltip';
            this.orbitalInfo.style.position = 'absolute';
            this.orbitalInfo.style.background = 'rgba(0, 0, 0, 0.8)';
            this.orbitalInfo.style.color = 'white';
            this.orbitalInfo.style.padding = '8px';
            this.orbitalInfo.style.borderRadius = '4px';
            this.orbitalInfo.style.fontSize = '12px';
            this.orbitalInfo.style.pointerEvents = 'none';
            this.orbitalInfo.style.zIndex = '1000';
            this.orbitalInfo.style.display = 'none';
            document.body.appendChild(this.orbitalInfo);
        }
        
        // ツールチップの内容を設定
        if (data.type === 'orbital') {
            this.orbitalInfo.innerHTML = `
                <strong>${data.orbital.name || '軌道'}</strong><br>
                タイプ: ${data.orbital.type || 'N/A'}<br>
                電子数: ${data.electrons || 0}/${data.orbital.maxElectrons || 0}
            `;
        } else if (data.type === 'electron') {
            this.orbitalInfo.innerHTML = `
                <strong>電子 #${data.index + 1}</strong><br>
                軌道: ${data.orbitalName || 'N/A'}<br>
                シェル: ${data.shellName || 'N/A'}
            `;
        }
        
        // マウス位置に表示
        const updatePosition = (event) => {
            const x = event.clientX + 10;
            const y = event.clientY + 10;
            this.orbitalInfo.style.left = `${x}px`;
            this.orbitalInfo.style.top = `${y}px`;
            this.orbitalInfo.style.display = 'block';
        };
        
        // イベントリスナーを設定
        this.renderer.domElement.addEventListener('mousemove', updatePosition);
        this.renderer.domElement.addEventListener('mouseout', () => {
            this.orbitalInfo.style.display = 'none';
            this.renderer.domElement.removeEventListener('mousemove', updatePosition);
        }, { once: true });
    }
    
    /**
     * 軌道の詳細情報をパネルに表示
     * @param {Object} data - 軌道データ
     */
    showOrbitalDetailsPanel(data) {
        if (!this.orbitalDetails) return;
        
        let html = '';
        
        if (data.type === 'orbital') {
            const orbital = data.orbital;
            html = `
                <div class="orbital-detail-panel">
                    <h4>${orbital.name || '軌道'}</h4>
                    <p>${orbital.description || ''}</p>
                    <ul>
                        <li>タイプ: ${orbital.type || 'N/A'}</li>
                        <li>電子数: ${data.electrons || 0}/${orbital.maxElectrons || 0}</li>
                    </ul>
                </div>
            `;
        }
        
        this.orbitalDetails.innerHTML = html;
    }
    
    /**
     * 電子情報を表示
     * @param {Object} data - 電子データ
     */
    showElectronInfo(data) {
        if (!this.orbitalDetails) return;
        
        let html = '';
        
        if (data.type === 'electron') {
            html = `
                <div class="electron-detail-panel">
                    <h4>電子 #${data.index + 1}</h4>
                    <p>軌道: ${data.orbitalName || 'N/A'}</p>
                    <p>シェル: ${data.shellName || 'N/A'}</p>
                </div>
            `;
        }
        
        this.orbitalDetails.innerHTML = html;
    }
    
    /**
     * アニメーションループ
     */
    animate() {
        try {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
            
            // 電子のアニメーション
            this.animateElectrons();
            
            // コントロールの更新
            if (this.controls) {
                this.controls.update();
            }
            
            // シーンとカメラが存在することを確認
            if (this.scene && this.camera && this.renderer) {
                // シーンのレンダリング
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error('アニメーションエラー:', error);
            // アニメーションループを停止
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // エラーメッセージを表示
            if (this.container) {
                this.container.innerHTML = `
                    <div style="color: white; text-align: center; padding: 20px; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                        <p style="color: #ff6b6b; margin-bottom: 10px;">アニメーションエラー</p>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    /**
     * 電子のアニメーション処理
     */
    animateElectrons() {
        if (!this.electrons || this.electrons.length === 0) return;
        
        // 時間係数 - パフォーマンスのために倍率を下げる
        const time = Date.now() * 0.0005;
        
        // 各電子を更新（パフォーマンス最適化）
        for (let i = 0; i < this.electrons.length; i++) {
            const electron = this.electrons[i];
            if (!electron || !electron.userData) continue;
            
            const data = electron.userData;
            const speed = data.orbitSpeed * (this.options.electronSpeed || 1.0);
            
            // 角度の更新（単純化）
            data.orbitAngle += speed;
            if (data.orbitAngle > Math.PI * 2) {
                data.orbitAngle -= Math.PI * 2;
            }
            
            // 軌道計算の簡略化
            const radius = data.orbitRadius;
            const angle = data.orbitAngle;
            const phase = data.orbitPhase + time;
            
            // 軌道平面ごとに異なる動きを簡略化
            let x, y, z;
            const plane = data.orbitPlane % 3;
            
            // 計算を単純化（パフォーマンス向上）
            if (plane === 0) {
                x = Math.cos(angle) * radius;
                y = Math.sin(angle) * radius;
                z = Math.sin(phase) * (radius * 0.2);
            } else if (plane === 1) {
                x = Math.sin(phase) * (radius * 0.2);
                y = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
            } else {
                x = Math.cos(angle) * radius;
                y = Math.sin(phase) * (radius * 0.2);
                z = Math.sin(angle) * radius;
            }
            
            // 位置を更新
            electron.position.set(x, y, z);
            
            // 軌跡更新の簡略化 - 細かすぎる更新はスキップ
            if (i % 2 === 0 && this.options.showTrails !== false) {
                const prevPosition = electron.userData.prevPosition || electron.position.clone();
                this.updateElectronTrail(i, prevPosition, electron.position.clone());
                electron.userData.prevPosition = electron.position.clone();
            }
        }
        
        // トレイルの透明度更新は2フレームに1回に制限
        if (this.frameCount % 2 === 0) {
            this.updateTrailOpacity();
        }
        this.frameCount = (this.frameCount || 0) + 1;
    }
    
    /**
     * 電子の軌跡を更新
     * @param {number} electronIndex - 電子のインデックス
     * @param {THREE.Vector3} prevPosition - 前の位置
     * @param {THREE.Vector3} newPosition - 新しい位置
     */
    updateElectronTrail(electronIndex, prevPosition, newPosition) {
        const trailPoints = this.trailPoints[electronIndex];
        const trail = this.electronTrails[electronIndex];
        
        if (!trailPoints || !trail) return;
        
        // 前回の位置と現在の位置の距離が一定以上なら新しい点を追加
        const minDistance = 0.1;
        const lastPoint = trailPoints.length > 0 ? trailPoints[trailPoints.length - 1] : null;
        if (!lastPoint || lastPoint.distanceTo(newPosition) > minDistance) {
            // 新しい点を追加
            trailPoints.push(newPosition);
            
            // 最大点数を制限
            const maxPoints = 20;
            if (trailPoints.length > maxPoints) {
                trailPoints.shift();
            }
            
            // 軌跡の形状を更新
            const positions = new Float32Array(trailPoints.length * 3);
            for (let i = 0; i < trailPoints.length; i++) {
                positions[i * 3] = trailPoints[i].x;
                positions[i * 3 + 1] = trailPoints[i].y;
                positions[i * 3 + 2] = trailPoints[i].z;
            }
            
            trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            trail.geometry.attributes.position.needsUpdate = true;
            trail.geometry.computeBoundingSphere();
        }
    }
    
    /**
     * 軌跡の透明度を更新
     */
    updateTrailOpacity() {
        for (let i = 0; i < this.electronTrails.length; i++) {
            const trail = this.electronTrails[i];
            if (!trail) continue;
            
            // 時間経過で軌跡を少しずつ薄くする
            trail.material.opacity *= 0.95;
            // 最小透明度を設定
            if (trail.material.opacity < 0.1) {
                trail.material.opacity = 0.1;
            }
        }
    }
    
    /**
     * 3Dビューアをクリア
     */
    clear() {
        // 既存のオブジェクトを削除
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        }
        
        this.nucleus = null;
        this.shells = [];
        this.orbitals = [];
        this.electrons = [];
        this.electronTrails = [];
        this.trailPoints = [];
    }
    
    /**
     * 元素の電子配置を表示
     * @param {Object} element - 元素データ
     * @param {Object} config - 電子配置データ
     */
    displayElement(element, config) {
        if (!element || !config) {
            console.error('displayElement: 要素またはコンフィグがnullです');
            return;
        }
        
        // 初期化されているか確認
        if (!this.isInitialized) {
            console.log('ビューアが初期化されていません、初期化します');
            this.initialize();
        }
        
        if (!this.scene) {
            console.error('シーンが初期化されていません');
            return;
        }
        
        console.time('元素表示');
        
        try {
            // 以前のデータをクリア
            this.clear();
            
            // 現在の元素を保存
            this.currentElement = element;
            
            // 原子核の作成
            this.createNucleus(element);
            
            // 電子殻の作成（オプション）
            if (this.options.showShells) {
                this.createShells(config);
            }
            
            // 軌道の作成
            this.createOrbitals(config);
            
            // 電子の配置
            this.placeElectrons(config);
            
            // カメラの位置をリセット
            this.resetCamera();
            
            // 低詳細モードへの自動切替（重い元素の場合）
            if (element.number > 36 && !this.options.lowDetailMode) {
                console.log('重元素のため低詳細モードに切り替えます');
                this.options.lowDetailMode = true;
                this.options.trailLength = 10;
            }
            
            // リサイズ処理を実行して表示を最適化
            setTimeout(() => this.onWindowResize(), 100);
            
            console.timeEnd('元素表示');
        } catch (error) {
            console.error('元素表示エラー:', error);
            
            // エラーメッセージを表示
            if (this.container) {
                this.container.innerHTML = `
                    <div class="tech-placeholder">
                        <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                        <p>軌道表示エラー: ${error.message}</p>
                        <button onclick="retryLoadViewer()" class="tech-button">
                            <i class="fas fa-sync-alt"></i>
                            再試行
                        </button>
                    </div>
                `;
            }
        }
    }
    
    /**
     * 原子核を作成
     * @param {Object} element - 元素データ
     */
    createNucleus(element) {
        // 原子核のサイズは原子番号に比例（視覚的な目的のため）
        const nucleusRadius = 0.5 + (element.number * 0.01);
        const geometry = new THREE.SphereGeometry(nucleusRadius, 32, 32);
        
        // テーマに応じて原子核の色を調整
        const color = this.options.lightMode ? 0x333333 : 0xffffff;
        const emissive = this.options.lightMode ? 0x111111 : 0x444444;
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissive,
            specular: 0x777777,
            shininess: 30
        });
        
        this.nucleus = new THREE.Mesh(geometry, material);
        this.nucleus.userData = {
            type: 'nucleus',
            element: element
        };
        
        this.scene.add(this.nucleus);
    }
    
    /**
     * 電子殻を作成
     * @param {Object} config - 電子配置データ
     */
    createShells(config) {
        // 電子殻の最大主量子数を取得
        const maxN = Math.max(...config.orbitals.map(orbital => orbital.n));
        
        // 各電子殻を作成
        for (let n = 1; n <= maxN; n++) {
            const shellRadius = n * 1.5;
            const geometry = new THREE.SphereGeometry(shellRadius, 32, 32);
            
            // テーマに応じて殻の色と透明度を設定
            const shellColor = this.options.lightMode ? 0xdddddd : 0x555555;
            const shellOpacity = this.options.lightMode ? 0.1 : 0.2;
            
            const material = new THREE.MeshBasicMaterial({
                color: shellColor,
                transparent: true,
                opacity: shellOpacity,
                wireframe: true,
                side: THREE.DoubleSide
            });
            
            const shell = new THREE.Mesh(geometry, material);
            shell.userData = {
                type: 'shell',
                n: n
            };
            
            this.shells.push(shell);
            this.scene.add(shell);
        }
    }
    
    /**
     * 軌道を作成
     * @param {Object} config - 電子配置データ
     */
    createOrbitals(config) {
        if (!this.scene || !config) return;
        
        try {
            // トレース開始
            console.time('軌道生成');
            
            // 軌道を作成
            for (let i = 0; i < config.orbitals.length; i++) {
                const orbitalConfig = config.orbitals[i];
                
                // 軌道データの検証
                if (!orbitalConfig || !orbitalConfig.n || !orbitalConfig.l) {
                    console.warn('無効な軌道設定をスキップします:', orbitalConfig);
                    continue;
                }
                
                // 主量子数から基本半径を計算
                const n = orbitalConfig.n;
                const baseRadius = n * 0.8; // 半径を少し小さくして表示を改善
                
                // カラーマップから軌道の色を取得
                const orbitalColor = this.getOrbitalColor(orbitalConfig.l);
                
                // 軌道データ
                const orbitalData = {
                    n: n,
                    l: orbitalConfig.l,
                    color: orbitalColor
                };
                
                // 軌道タイプに応じた作成処理
                switch (orbitalConfig.l) {
                    case 's':
                        this.createSOrbital(orbitalConfig, baseRadius, orbitalData);
                        break;
                    case 'p':
                        // p軌道は簡略化（重いので）
                        if (!this.options.lowDetailMode) {
                            this.createPOrbitals(orbitalConfig, baseRadius, orbitalData);
                        } else {
                            // 低詳細モードではs軌道として近似
                            this.createSOrbital(orbitalConfig, baseRadius, orbitalData);
                        }
                        break;
                    case 'd':
                        // 簡略化
                        if (!this.options.lowDetailMode && config.atomicNumber < 30) {
                            this.createDOrbitals(orbitalConfig, baseRadius, orbitalData);
                        } else {
                            this.createSOrbital(orbitalConfig, baseRadius, orbitalData);
                        }
                        break;
                    case 'f':
                        // f軌道は重いので常に簡略表示
                        this.createSOrbital(orbitalConfig, baseRadius, orbitalData);
                        break;
                    default:
                        console.warn(`未実装の軌道タイプ: ${orbitalConfig.l}`);
                }
            }
            
            console.timeEnd('軌道生成');
        } catch (error) {
            console.error('軌道生成エラー:', error);
        }
    }
    
    /**
     * 軌道の色を取得
     * @param {string} type - 軌道タイプ
     * @returns {number} 色コード
     */
    getOrbitalColor(type) {
        const colors = {
            's': 0xff5252, // 赤
            'p': 0x4caf50, // 緑
            'd': 0x2196f3, // 青
            'f': 0xff9800  // オレンジ
        };
        
        return colors[type] || 0xffffff;
    }
    
    /**
     * s軌道を作成
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createSOrbital(orbitalConfig, baseRadius, orbitalData) {
        // 低詳細モードの場合はジオメトリの複雑さを減らす
        const segments = this.options.lowDetailMode ? 16 : 32;
        
        const geometry = new THREE.SphereGeometry(baseRadius * 0.8, segments, segments);
        
        // 軌道のカラーを設定（デフォルトカラーを追加）
        const orbitalColor = orbitalData.color || 0xff5252;
        
        const material = new THREE.MeshPhongMaterial({
            color: orbitalColor,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            side: THREE.DoubleSide,
            wireframe: false,
            emissive: orbitalColor,
            emissiveIntensity: 0.1
        });
        
        const orbital = new THREE.Mesh(geometry, material);
        
        // データを保存
        orbital.userData = {
            type: 'orbital',
            orbital: orbitalData,
            n: orbitalConfig.n,
            l: 's',
            electrons: orbitalConfig.electrons,
            radius: baseRadius,
            maxElectrons: 2
        };
        
        this.scene.add(orbital);
        this.orbitals.push(orbital);
        
        return orbital;
    }
    
    /**
     * p軌道を作成
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createPOrbitals(orbitalConfig, baseRadius, orbitalData) {
        const n = orbitalConfig.n;
        const electrons = orbitalConfig.electrons || 0;
        
        // p軌道は3つの方向に存在
        const axes = ['x', 'y', 'z'];
        const colors = [0xff5555, 0x55ff55, 0x5555ff];
        
        // 各p軌道を作成
        for (let i = 0; i < 3; i++) {
            const axis = axes[i];
            
            // ダンベル形状
            const length = baseRadius * 1.5;
            const radius = baseRadius * 0.5;
            
            // 単純な楕円体で表現
            const geometry = new THREE.SphereGeometry(radius, 32, 16);
            geometry.scale(axis === 'x' ? length / radius : 1, 
                          axis === 'y' ? length / radius : 1, 
                          axis === 'z' ? length / radius : 1);
            
            const material = new THREE.MeshBasicMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.2,
                wireframe: false
            });
            
            const orbital = new THREE.Mesh(geometry, material);
            orbital.userData = {
                type: 'orbital',
                orbital: {
                    ...orbitalData,
                    name: `${n}p${axis}軌道`
                },
                n: n,
                l: 'p',
                m: i - 1,
                electrons: Math.min(electrons - i * 2, 2)
            };
            
            this.orbitals.push(orbital);
            this.scene.add(orbital);
        }
    }
    
    /**
     * d軌道を作成（単純化）
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createDOrbitals(orbitalConfig, baseRadius, orbitalData) {
        const n = orbitalConfig.n;
        const electrons = orbitalConfig.electrons || 0;
        
        // d軌道を単純化した形状で5つ作成
        const colors = [0xff9966, 0xffcc66, 0xffff66, 0x66ffcc, 0x66ccff];
        
        for (let i = 0; i < 5; i++) {
            // 簡易形状としてトーラスを使用
            const radius = baseRadius * 0.7;
            const tubeRadius = baseRadius * 0.2;
            const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 40);
            
            // 各d軌道を異なる向きに
            if (i === 0) {
                geometry.rotateX(Math.PI / 2);
            } else if (i === 1) {
                geometry.rotateY(Math.PI / 2);
            } else if (i === 2) {
                geometry.rotateZ(Math.PI / 2);
                geometry.rotateY(Math.PI / 4);
            } else if (i === 3) {
                geometry.rotateZ(Math.PI / 4);
                geometry.rotateX(Math.PI / 4);
            } else {
                geometry.rotateY(Math.PI / 4);
                geometry.rotateX(Math.PI / 4);
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.2,
                wireframe: false
            });
            
            const orbital = new THREE.Mesh(geometry, material);
            orbital.userData = {
                type: 'orbital',
                orbital: {
                    ...orbitalData,
                    name: `${n}d${i}軌道`
                },
                n: n,
                l: 'd',
                m: i - 2,
                electrons: Math.min(electrons - i * 2, 2)
            };
            
            this.orbitals.push(orbital);
            this.scene.add(orbital);
        }
    }
    
    /**
     * 電子を作成
     * @param {Object} orbital - 電子の属する軌道
     * @param {number} index - 軌道内の電子インデックス
     * @returns {Object} 電子オブジェクト
     */
    createElectron(orbital, index) {
        // 重要なエラーチェック
        if (!this.scene || !orbital || !orbital.userData) {
            console.error('電子を作成できません: 必要なデータがありません');
            return null;
        }
        
        const userData = orbital.userData;
        
        try {
            // 電子のサイズとセグメントを縮小して最適化
            const electronSize = 0.08;
            const electronSegments = 8;
            
            // 電子のジオメトリとマテリアル
            const geometry = new THREE.SphereGeometry(electronSize, electronSegments, electronSegments);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5
            });
            
            // 電子の軌道データを取得
            const n = userData.n || 1;
            const radius = userData.radius || (n * 1.2); // 半径を少し小さく
            const type = userData.l || 's';
            
            // 軌道に合わせた電子の初期配置
            const angle = (Math.random() * Math.PI * 2) + (index * Math.PI / 2);
            let x = Math.cos(angle) * radius;
            let y = Math.sin(angle) * radius;
            let z = 0;
            
            // p, d, f軌道の場合は3D空間に分散
            if (type === 'p' || type === 'd' || type === 'f') {
                z = (Math.random() - 0.5) * radius;
            }
            
            // 電子を作成して位置を設定
            const electron = new THREE.Mesh(geometry, material);
            electron.position.set(x, y, z);
            
            // 電子のデータを設定
            electron.userData = {
                type: 'electron',
                n: n,
                l: type,
                orbitalIndex: index,
                orbitalName: `${n}${type}`,
                shellName: `殻 ${n}`,
                orbitRadius: radius,
                orbitSpeed: 0.6 / n, // 単純化
                orbitAngle: angle,
                orbitPhase: index * (Math.PI / 4),
                orbitPlane: index % 3
            };
            
            // シーンに追加
            this.scene.add(electron);
            return electron;
        } catch (error) {
            console.error('電子作成エラー:', error);
            return null;
        }
    }
    
    /**
     * 電子を配置
     * @param {Object} config - 電子配置データ
     */
    placeElectrons(config) {
        if (!this.scene) return;
        
        let electronCount = 0;
        
        // 最適化のため、最大表示電子数を制限
        const maxElectrons = this.options.lowDetailMode ? 20 : 50;
        
        // 各軌道に電子を配置
        for (let i = 0; i < this.orbitals.length; i++) {
            const orbital = this.orbitals[i];
            const userData = orbital.userData;
            
            if (!userData) continue;
            
            // この軌道の電子数
            const orbitalElectrons = userData.electrons;
            
            // 最大電子数を超える場合はスキップ
            if (electronCount >= maxElectrons) {
                break;
            }
            
            // この軌道の電子を配置
            for (let j = 0; j < Math.min(orbitalElectrons, userData.maxElectrons); j++) {
                // 最大電子数を超える場合はスキップ
                if (electronCount >= maxElectrons) {
                    break;
                }
                
                // 電子を作成
                const electron = this.createElectron(orbital, j);
                if (electron) {
                    this.electrons.push(electron);
                    
                    // 軌跡の初期化
                    this.initializeElectronTrail(this.electrons.length - 1);
                    
                    electronCount++;
                }
            }
        }
        
        console.log(`配置された電子数: ${electronCount}`);
    }
    
    /**
     * 電子の軌跡を初期化
     * @param {number} electronIndex - 電子のインデックス
     */
    initializeElectronTrail(electronIndex) {
        // 軌跡の点を記録する配列
        this.trailPoints[electronIndex] = [];
        
        // 軌跡の線を作成
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffff88,
            transparent: true,
            opacity: 0.5,
            linewidth: 1
        });
        
        const trailGeometry = new THREE.BufferGeometry();
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        
        this.electronTrails[electronIndex] = trail;
        this.scene.add(trail);
    }
    
    /**
     * リソースを解放
     */
    dispose() {
        // アニメーションループを停止
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // すべてのオブジェクトを削除
        this.clear();
        
        // レンダラーの解放
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.domElement = null;
        }
        
        // コントロールの解放
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        // シーンのメモリ解放
        if (this.scene) {
            this.scene.traverse((object) => {
                // ジオメトリの解放
                if (object.geometry) {
                    object.geometry.dispose();
                }
                
                // マテリアルの解放
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => {
                            disposeMaterial(material);
                        });
                    } else {
                        disposeMaterial(object.material);
                    }
                }
            });
            
            this.scene = null;
        }
        
        // カメラの参照を解除
        this.camera = null;
        
        // その他のメンバ変数をクリア
        this.nucleus = null;
        this.shells = [];
        this.orbitals = [];
        this.electrons = [];
        this.electronTrails = [];
        this.trailPoints = [];
        this.currentElement = null;
        
        // コンテナをクリア
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // マテリアル解放ヘルパー関数
        function disposeMaterial(material) {
            if (!material) return;
            
            // テクスチャの解放
            for (const key in material) {
                if (material[key] && material[key].isTexture) {
                    material[key].dispose();
                }
            }
            
            // マテリアル自体の解放
            material.dispose();
        }
        
        console.log('OrbitalViewer: リソースを解放しました');
    }
}