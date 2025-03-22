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
        
        this.animationFrameId = null;
        this.currentElement = null;
        this.isInitialized = false;
        
        // 設定オプション
        this.options = {
            electronSpeed: 0.5,       // 電子の移動速度 (0.1-2.0)
            brightnessLevel: 0.5,     // 明るさレベル (0.1-1.0)
            showShells: true,         // 電子殻の表示
            showOrbitals: true,       // 軌道の表示
            initialCameraPosition: null, // カメラの初期位置
            lightMode: document.documentElement.getAttribute('data-theme') !== 'dark', // ライトモードかどうか
            trailLength: 30,          // 軌跡の長さ
            trailFadeTime: 1.5        // 軌跡の消える時間（秒）
        };
        
        // THREE.jsが読み込まれているか確認
        if (typeof THREE === 'undefined') {
            console.error('THREE.jsが読み込まれていません');
            return;
        }
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 情報表示用のDOMエレメント
        this.orbitalInfo = document.getElementById('orbital-info');
        this.orbitalDetails = document.getElementById('orbital-details');
        
        // 初期化を試みる
        try {
            this.initialize();
            this.setupControls();
        } catch (error) {
            console.error('OrbitalViewerの初期化に失敗しました:', error);
        }
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
        if (this.isInitialized) return;
        
        try {
            // シーンの設定
            this.scene = new THREE.Scene();
            
            // カメラの設定
            this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 0, 10);
            this.options.initialCameraPosition = this.camera.position.clone();
            
            // レンダラーの設定
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.container.innerHTML = ''; // コンテナをクリア
            this.container.appendChild(this.renderer.domElement);
            
            // コントロールの設定
            // THREE.OrbitControlsが利用可能か確認
            if (typeof THREE.OrbitControls === 'undefined') {
                console.error('THREE.OrbitControlsが読み込まれていません');
                throw new Error('THREE.OrbitControlsが利用できません');
            }
            
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.25;
            
            // 光源の設定
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);
            
            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
            directionalLight2.position.set(-1, -1, -1);
            this.scene.add(directionalLight2);
            
            // 明るさ初期設定を適用
            this.setBrightness(this.options.brightnessLevel);
            
            // テーマ設定を適用
            this.updateTheme(this.options.lightMode);
            
            // ウィンドウリサイズイベントの追加
            window.addEventListener('resize', this.onWindowResize.bind(this));
            
            // マウスイベントリスナーを追加
            this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
            this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
            
            // テーマ変更の監視
            const themeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'data-theme') {
                        const isLightMode = document.documentElement.getAttribute('data-theme') !== 'dark';
                        this.updateTheme(isLightMode);
                    }
                });
            });
            
            themeObserver.observe(document.documentElement, { attributes: true });
            
            this.isInitialized = true;
            
            // アニメーションの開始
            this.animate();
            console.log('3Dビューアの初期化が完了しました');
        } catch (error) {
            console.error('3Dビューア初期化エラー:', error);
            this.container.innerHTML = `
                <div style="color: var(--3d-text-color); text-align: center; padding: 20px; height: 100%; display: flex; flex-direction: column; justify-content: center; background-color: var(--3d-bg-color);">
                    <p style="color: #ff6b6b; margin-bottom: 10px;">3Dビューアの初期化に失敗しました</p>
                    <p>${error.message}</p>
                </div>
            `;
            throw error;
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
        // 軌道情報をツールチップとして表示する処理を実装
        // 実際の実装では、HTML要素を配置または更新
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
        // 電子をそれぞれの軌道に沿って動かす
        const time = Date.now() * 0.001;
        
        this.electrons.forEach((electron, index) => {
            if (electron.userData && electron.userData.orbit) {
                const orbit = electron.userData.orbit;
                const speed = (electron.userData.speed || 1) * this.options.electronSpeed;
                const radius = orbit.radius || 1;
                
                // 以前の位置を保存
                const prevPosition = electron.position.clone();
                
                // 基本的な円軌道（実際にはもっと複雑な動きにする）
                const t = time * speed;
                electron.position.x = radius * Math.cos(t);
                electron.position.y = radius * Math.sin(t);
                
                // 軌道タイプに応じた動き
                if (orbit.type === 'p') {
                    // p軌道の場合は特定の軸に沿った動き
                    const axis = orbit.axis || [0, 0, 1];
                    electron.position.x = radius * Math.cos(t) * axis[0];
                    electron.position.y = radius * Math.sin(t) * axis[1];
                    electron.position.z = Math.sin(t * 1.5) * axis[2];
                } else if (orbit.type === 'd' || orbit.type === 'f') {
                    // dやf軌道の場合はより複雑な動き
                    // ここではシンプルな例として
                    electron.position.z = Math.sin(t * 1.2) * (radius * 0.5);
                }
                
                // 電子の軌跡を更新
                this.updateElectronTrail(index, prevPosition, electron.position);
            }
        });
        
        // 軌跡の不透明度を時間経過で減少させる
        this.updateTrailOpacity();
    }
    
    /**
     * 電子の軌跡を更新
     * @param {number} electronIndex - 電子のインデックス
     * @param {THREE.Vector3} prevPosition - 前の位置
     * @param {THREE.Vector3} newPosition - 新しい位置
     */
    updateElectronTrail(electronIndex, prevPosition, newPosition) {
        // トレイルポイントが存在しない場合は初期化
        if (!this.trailPoints[electronIndex]) {
            this.trailPoints[electronIndex] = [];
        }
        
        const trailPoints = this.trailPoints[electronIndex];
        
        // 新しい軌跡ポイントを追加
        trailPoints.push({
            position: newPosition.clone(),
            time: Date.now(),
            prevPosition: prevPosition.clone()
        });
        
        // 古いポイントを削除
        while (trailPoints.length > this.options.trailLength) {
            trailPoints.shift();
        }
        
        // 軌跡の更新または作成
        if (trailPoints.length >= 2) {
            // 既存の軌跡が存在する場合は削除
            if (this.electronTrails[electronIndex]) {
                this.scene.remove(this.electronTrails[electronIndex]);
                if (this.electronTrails[electronIndex].geometry) {
                    this.electronTrails[electronIndex].geometry.dispose();
                }
                if (this.electronTrails[electronIndex].material) {
                    this.electronTrails[electronIndex].material.dispose();
                }
            }
            
            // 軌跡の頂点を作成
            const positions = [];
            const colors = [];
            const baseColor = this.options.lightMode ? new THREE.Color(0x0066cc) : new THREE.Color(0x00ffff);
            
            for (let i = 0; i < trailPoints.length - 1; i++) {
                const point = trailPoints[i];
                const timeDiff = (Date.now() - point.time) / 1000; // 秒に変換
                const opacity = Math.max(0, 1 - (timeDiff / this.options.trailFadeTime));
                
                positions.push(point.position.x, point.position.y, point.position.z);
                
                // 時間に応じて色を変更（透明度が下がるほど暗くなる）
                const color = baseColor.clone();
                colors.push(color.r * opacity, color.g * opacity, color.b * opacity);
            }
            
            // 最後のポイントを追加
            const lastPoint = trailPoints[trailPoints.length - 1];
            positions.push(lastPoint.position.x, lastPoint.position.y, lastPoint.position.z);
            colors.push(baseColor.r, baseColor.g, baseColor.b);
            
            // ジオメトリを作成
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            // マテリアルを作成
            const material = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                linewidth: 1
            });
            
            // 軌跡を作成
            const trail = new THREE.Line(geometry, material);
            this.electronTrails[electronIndex] = trail;
            this.scene.add(trail);
        }
    }
    
    /**
     * 軌跡の不透明度を時間経過で更新
     */
    updateTrailOpacity() {
        const currentTime = Date.now();
        
        this.trailPoints.forEach((trailPoints, electronIndex) => {
            // 古いポイントを削除
            while (
                trailPoints.length > 0 && 
                (currentTime - trailPoints[0].time) / 1000 > this.options.trailFadeTime
            ) {
                trailPoints.shift();
            }
        });
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
        if (!this.isInitialized) {
            this.initialize();
        }
        
        // 現在のビューをクリア
        this.clear();
        this.currentElement = element;
        
        // 原子核を作成
        this.createNucleus(element);
        
        // 電子殻を作成
        this.createShells(config);
        
        // 軌道を作成
        this.createOrbitals(config);
        
        // 電子を配置
        this.placeElectrons(config);
        
        // 設定を反映
        this.toggleShells();
        this.toggleOrbitals();
        
        // カメラの位置をリセット
        const distance = Math.max(10, element.number / 5);
        this.camera.position.set(0, 0, distance);
        this.options.initialCameraPosition = this.camera.position.clone();
        this.controls.update();
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
        // 各軌道を作成
        config.orbitals.forEach(orbitalConfig => {
            const n = orbitalConfig.n;
            const l = orbitalConfig.l;
            
            // 軌道データを取得
            const orbitalData = orbitalsData[l];
            if (!orbitalData) return;
            
            // 軌道の基本半径（主量子数に比例）
            const baseRadius = n * 1.5;
            
            // 軌道タイプに応じた作成メソッドを呼び出す
            if (l === 's') {
                this.createSOrbital(orbitalConfig, baseRadius, orbitalData);
            } else if (l === 'p') {
                this.createPOrbitals(orbitalConfig, baseRadius, orbitalData);
            } else if (l === 'd') {
                this.createDOrbitals(orbitalConfig, baseRadius, orbitalData);
            } else if (l === 'f') {
                this.createFOrbitals(orbitalConfig, baseRadius, orbitalData);
            }
        });
    }
    
    /**
     * s軌道を作成
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createSOrbital(orbitalConfig, baseRadius, orbitalData) {
        // s軌道は球面
        const geometry = new THREE.SphereGeometry(baseRadius * 0.6, 32, 32);
        
        // テーマに応じて色と透明度を設定
        const orbitalColor = this.options.lightMode ? 0x6699cc : 0x66ccff;
        const orbitalOpacity = this.options.lightMode ? 0.15 : 0.3;
        
        const material = new THREE.MeshBasicMaterial({
            color: orbitalColor,
            transparent: true,
            opacity: orbitalOpacity,
            depthWrite: false
        });
        
        const orbital = new THREE.Mesh(geometry, material);
        orbital.userData = {
            type: 's',
            n: orbitalConfig.n,
            l: orbitalConfig.l,
            electrons: orbitalConfig.electrons,
            maxElectrons: 2
        };
        
        this.orbitals.push(orbital);
        this.scene.add(orbital);
    }
    
    /**
     * p軌道を作成
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createPOrbitals(orbitalConfig, baseRadius, orbitalData) {
        // p軌道はダンベル形状を3方向に
        const pOrbitals = orbitalData.orbitals;
        
        // テーマに応じて色と透明度を設定
        const orbitalColor = this.options.lightMode ? 0x66cc66 : 0x00ff00;
        const orbitalOpacity = this.options.lightMode ? 0.15 : 0.3;
        
        // 各p軌道（px, py, pz）を作成
        for (let i = 0; i < Math.min(pOrbitals.length, 3); i++) {
            const pOrbital = pOrbitals[i];
            // 軌道の方向
            const direction = pOrbital.direction;
            
            // 簡略化したp軌道の表現
            // 実際の複雑な形状の代わりに楕円体を使用
            const geometry = new THREE.SphereGeometry(baseRadius * 0.7, 32, 16);
            geometry.scale(
                Math.abs(direction[0]) * 1.5 + 0.5,
                Math.abs(direction[1]) * 1.5 + 0.5,
                Math.abs(direction[2]) * 1.5 + 0.5
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: orbitalColor,
                transparent: true,
                opacity: orbitalOpacity,
                depthWrite: false
            });
            
            const orbital = new THREE.Mesh(geometry, material);
            orbital.userData = {
                type: 'p',
                subtype: pOrbital.name,
                n: orbitalConfig.n,
                l: orbitalConfig.l,
                direction: direction,
                electrons: Math.min(orbitalConfig.electrons - i * 2, 2),
                maxElectrons: 2
            };
            
            this.orbitals.push(orbital);
            this.scene.add(orbital);
        }
    }
    
    /**
     * d軌道を作成（簡略化版）
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createDOrbitals(orbitalConfig, baseRadius, orbitalData) {
        // d軌道は5種類あり、複雑な形状
        // 簡略化のため、特徴的な形状を球の組み合わせで表現
        let remainingElectrons = orbitalConfig.electrons;
        
        orbitalData.orbitals.forEach((dOrbital, i) => {
            if (remainingElectrons <= 0) return;
            
            // このd軌道サブタイプに割り当てる電子（最大2）
            const electronCount = Math.min(remainingElectrons, 2);
            remainingElectrons -= electronCount;
            
            // d軌道の表現（ここでは簡略化）
            // 実際にはもっと複雑な形状モデルが必要
            const geometry = new THREE.SphereGeometry(baseRadius * 0.25, 32, 16);
            const material = new THREE.MeshBasicMaterial({
                color: dOrbital.color,
                transparent: true,
                opacity: 0.3 + (electronCount * 0.1)
            });
            
            const orbital = new THREE.Group();
            
            // サブタイプに応じた形状を作成
            if (dOrbital.subtype === 'dxy') {
                // xy平面に4つの球を配置
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI / 2);
                    const x = Math.cos(angle) * baseRadius * 0.6;
                    const y = Math.sin(angle) * baseRadius * 0.6;
                    const lobe = new THREE.Mesh(geometry, material);
                    lobe.position.set(x, y, 0);
                    orbital.add(lobe);
                }
            } else if (dOrbital.subtype === 'dyz') {
                // yz平面に4つの球を配置
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI / 2);
                    const y = Math.cos(angle) * baseRadius * 0.6;
                    const z = Math.sin(angle) * baseRadius * 0.6;
                    const lobe = new THREE.Mesh(geometry, material);
                    lobe.position.set(0, y, z);
                    orbital.add(lobe);
                }
            } else if (dOrbital.subtype === 'dxz') {
                // xz平面に4つの球を配置
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI / 2);
                    const x = Math.cos(angle) * baseRadius * 0.6;
                    const z = Math.sin(angle) * baseRadius * 0.6;
                    const lobe = new THREE.Mesh(geometry, material);
                    lobe.position.set(x, 0, z);
                    orbital.add(lobe);
                }
            } else if (dOrbital.subtype === 'dx2-y2') {
                // x²-y²軌道の表現
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI / 2) + (Math.PI / 4);
                    const x = Math.cos(angle) * baseRadius * 0.6;
                    const y = Math.sin(angle) * baseRadius * 0.6;
                    const lobe = new THREE.Mesh(geometry, material);
                    lobe.position.set(x, y, 0);
                    orbital.add(lobe);
                }
            } else if (dOrbital.subtype === 'dz2') {
                // z²軌道の表現
                // z軸方向に2つの球とxy平面にリング状の構造
                const lobeTop = new THREE.Mesh(geometry, material);
                lobeTop.position.set(0, 0, baseRadius * 0.6);
                orbital.add(lobeTop);
                
                const lobeBottom = new THREE.Mesh(geometry, material);
                lobeBottom.position.set(0, 0, -baseRadius * 0.6);
                orbital.add(lobeBottom);
                
                // 中央のリング部分を表現
                const ringGeometry = new THREE.TorusGeometry(baseRadius * 0.4, baseRadius * 0.1, 16, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: dOrbital.color,
                    transparent: true,
                    opacity: 0.2
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                orbital.add(ring);
            }
            
            orbital.userData = {
                type: 'orbital',
                orbital: dOrbital,
                orbitalConfig: orbitalConfig,
                subtype: dOrbital.subtype,
                electrons: electronCount
            };
            
            this.orbitals.push(orbital);
            this.scene.add(orbital);
        });
    }
    
    /**
     * f軌道を作成（非常に簡略化）
     * @param {Object} orbitalConfig - 軌道設定
     * @param {number} baseRadius - 基本半径
     * @param {Object} orbitalData - 軌道データ
     */
    createFOrbitals(orbitalConfig, baseRadius, orbitalData) {
        // f軌道は7種類あり、非常に複雑な形状
        // 教育目的の簡略化として、特徴的なポイントを球の集合で表現
        let remainingElectrons = orbitalConfig.electrons;
        
        orbitalData.orbitals.forEach((fOrbital, i) => {
            if (remainingElectrons <= 0) return;
            
            // このf軌道サブタイプに割り当てる電子（最大2）
            const electronCount = Math.min(remainingElectrons, 2);
            remainingElectrons -= electronCount;
            
            // f軌道の表現（非常に簡略化）
            const geometry = new THREE.SphereGeometry(baseRadius * 0.2, 32, 16);
            const material = new THREE.MeshBasicMaterial({
                color: fOrbital.color,
                transparent: true,
                opacity: 0.3 + (electronCount * 0.1)
            });
            
            const orbital = new THREE.Group();
            
            // 各サブタイプに対して、特徴的なポイントを複数の球で表現
            // ここでは簡略化のため、基本的なパターンのみ
            for (let j = 0; j < 8; j++) {
                const phi = (j % 4) * (Math.PI / 2);
                const theta = (j < 4) ? 0 : Math.PI / 2;
                
                const x = baseRadius * 0.7 * Math.sin(theta) * Math.cos(phi);
                const y = baseRadius * 0.7 * Math.sin(theta) * Math.sin(phi);
                const z = baseRadius * 0.7 * Math.cos(theta);
                
                const lobe = new THREE.Mesh(geometry, material);
                lobe.position.set(x, y, z);
                orbital.add(lobe);
            }
            
            orbital.userData = {
                type: 'orbital',
                orbital: fOrbital,
                orbitalConfig: orbitalConfig,
                subtype: fOrbital.subtype,
                electrons: electronCount
            };
            
            // サブタイプごとに回転を調整して変化をつける
            orbital.rotation.x = (i % 3) * (Math.PI / 4);
            orbital.rotation.y = (i % 2) * (Math.PI / 2);
            orbital.rotation.z = (i % 4) * (Math.PI / 3);
            
            this.orbitals.push(orbital);
            this.scene.add(orbital);
        });
    }
    
    /**
     * 電子を配置
     * @param {Object} config - 電子配置データ
     */
    placeElectrons(config) {
        // 電子を各軌道に配置
        let electronIndex = 0;
        
        config.orbitals.forEach(orbitalConfig => {
            const n = orbitalConfig.n;
            const l = orbitalConfig.l;
            const electronCount = orbitalConfig.electrons;
            
            // 軌道データを取得
            const orbitalData = orbitalsData[l];
            if (!orbitalData) return;
            
            // 軌道の基本半径（主量子数に比例）
            const baseRadius = n * 1.5;
            
            // この軌道タイプの電子を配置
            for (let i = 0; i < electronCount; i++) {
                // 電子の表現
                const geometry = new THREE.SphereGeometry(0.15, 16, 16);
                
                // テーマに応じて電子の色を調整
                const electronColor = this.options.lightMode ? 0x0066cc : 0x00ffff;
                const material = new THREE.MeshBasicMaterial({ color: electronColor });
                
                const electron = new THREE.Mesh(geometry, material);
                
                // 軌道パスの計算（簡略化）
                let orbit;
                if (l === 's') {
                    // s軌道は球面上をランダムに動く
                    orbit = {
                        type: 's',
                        radius: baseRadius,
                        centerX: 0,
                        centerY: 0,
                        centerZ: 0
                    };
                    
                    // 初期位置は球面上のランダムな点
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    electron.position.x = baseRadius * Math.sin(theta) * Math.cos(phi);
                    electron.position.y = baseRadius * Math.sin(theta) * Math.sin(phi);
                    electron.position.z = baseRadius * Math.cos(theta);
                    
                } else if (l === 'p') {
                    // p軌道は3方向、各電子は特定の方向に
                    const pIndex = Math.min(Math.floor(i / 2), 2);
                    const pOrbital = orbitalData.orbitals[pIndex];
                    const direction = pOrbital.direction;
                    
                    orbit = {
                        type: 'p',
                        radius: baseRadius * 0.7,
                        axis: direction,
                        orbital: pOrbital
                    };
                    
                    // 初期位置は軌道方向に沿った点
                    const scale = 0.8;
                    electron.position.x = direction[0] * baseRadius * scale;
                    electron.position.y = direction[1] * baseRadius * scale;
                    electron.position.z = direction[2] * baseRadius * scale;
                    
                } else if (l === 'd' || l === 'f') {
                    // d, f軌道はより複雑、簡略化した表現
                    const subIndex = Math.min(Math.floor(i / 2), orbitalData.orbitals.length - 1);
                    const subOrbital = orbitalData.orbitals[subIndex];
                    
                    orbit = {
                        type: l,
                        radius: baseRadius * 0.6,
                        orbital: subOrbital
                    };
                    
                    // 初期位置はサブ軌道に基づく
                    const angle = Math.random() * Math.PI * 2;
                    electron.position.x = baseRadius * 0.6 * Math.cos(angle);
                    electron.position.y = baseRadius * 0.6 * Math.sin(angle);
                    electron.position.z = (Math.random() - 0.5) * baseRadius * 0.3;
                }
                
                // 各電子に異なる速度を与える
                const speed = 0.5 + Math.random() * 0.5;
                
                // 電子メタデータの設定
                electron.userData = {
                    type: 'electron',
                    index: electronIndex++,
                    orbital: orbitalConfig,
                    orbit: orbit,
                    speed: speed,
                    shellName: `${n}${l}`,
                    orbitalName: `${n}${l}`
                };
                
                this.electrons.push(electron);
                this.scene.add(electron);
            }
        });
    }
    
    /**
     * ビューアの破棄
     */
    dispose() {
        // アニメーションの停止
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // シーンのクリア
        this.clear();
        
        // イベントリスナーの削除
        window.removeEventListener('resize', this.onWindowResize);
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
            
            // レンダラーの削除
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        // コントロールの破棄
        if (this.controls) {
            this.controls.dispose();
        }
        
        this.isInitialized = false;
    }
}