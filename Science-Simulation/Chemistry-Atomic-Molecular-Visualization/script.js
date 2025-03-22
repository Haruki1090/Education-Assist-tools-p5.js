// DOM要素の参照
const sceneContainer = document.getElementById('scene-container');
const atomTooltip = document.getElementById('atom-tooltip');
const infoCard = document.getElementById('info-card');
const infoCardHeader = document.getElementById('info-card-header');
const infoCardToggle = document.getElementById('info-card-toggle');
const infoCardContent = document.getElementById('info-card-content');
const instructionOverlay = document.getElementById('instruction-overlay');
const closeInstructions = document.getElementById('close-instructions');
const skipInstructions = document.getElementById('skip-instructions');
const startTour = document.getElementById('start-tour');
const tourPopup = document.getElementById('tour-popup');
const tourNext = document.getElementById('tour-next');
const tourPrev = document.getElementById('tour-prev');
const loader = document.getElementById('loader');

// ツールボタン
const toolButtons = document.querySelectorAll('.tool-btn');
const toolBuild = document.getElementById('tool-build');
const toolReact = document.getElementById('tool-react');
const toolExplore = document.getElementById('tool-explore');
const toolView = document.getElementById('tool-view');
const toolHelp = document.getElementById('tool-help');

// サイドパネル
const buildPanel = document.getElementById('build-panel');
const reactionPanel = document.getElementById('reaction-panel');
const explorePanel = document.getElementById('explore-panel');
const viewPanel = document.getElementById('view-panel');
const closeBuildPanel = document.getElementById('close-build-panel');
const closeReactionPanel = document.getElementById('close-reaction-panel');
const closeExplorePanel = document.getElementById('close-explore-panel');
const closeViewPanel = document.getElementById('close-view-panel');

// ドックアイテム
const dockItems = document.querySelectorAll('.dock-item');
const dockAdd = document.getElementById('dock-add');
const dockBond = document.getElementById('dock-bond');
const dockDelete = document.getElementById('dock-delete');
const dockClear = document.getElementById('dock-clear');

// 元素カード
const elementCards = document.querySelectorAll('.element-card');

// 分子テンプレート
const moleculeCards = document.querySelectorAll('.molecule-card');

// 反応カード
const reactionCards = document.querySelectorAll('.reaction-card');
const startReactionBtn = document.getElementById('start-reaction');
const pauseReactionBtn = document.getElementById('pause-reaction');
const resetReactionBtn = document.getElementById('reset-reaction');
const reactionProgressThumb = document.getElementById('reaction-progress');
const reactionStepLabel = document.getElementById('reaction-step-label');

// ビューボタン
const toggle3D2DBtn = document.getElementById('toggle-3d-2d');
const resetCameraBtn = document.getElementById('reset-camera');
const toggleLabelsBtn = document.getElementById('toggle-labels');
const styleBallStickBtn = document.getElementById('style-ball-stick');
const styleSpaceFillBtn = document.getElementById('style-space-fill');
const styleWireframeBtn = document.getElementById('style-wireframe');
const bgDarkBtn = document.getElementById('bg-dark');
const bgLightBtn = document.getElementById('bg-light');
const bgGradientBtn = document.getElementById('bg-gradient');

// 探索パネルボタン
const toggleOrbitalsBtn = document.getElementById('toggle-orbitals');
const toggleChargesBtn = document.getElementById('toggle-charges');
const toggleBondsBtn = document.getElementById('toggle-bonds');

// 分子特性表示要素
const formulaEl = document.getElementById('formula');
const molecularWeightEl = document.getElementById('molecular-weight');
const polarityEl = document.getElementById('polarity');
const bondCountEl = document.getElementById('bond-count');

// Three.js関連の変数
let scene, camera, renderer, controls;
let atoms = [];
let bonds = [];
let orbitals = [];
let electrons = [];
let labels = [];
let selectedAtom = null;
let bondStartAtom = null;
let isDragging = false;
let draggedAtom = null;
let currentElement = 'H';
let currentMode = 'add';
let raycaster, mouse;
let is3DView = true;
let showOrbitals = false;
let showLabels = false;
let modelStyle = 'ball-stick';
let isSimulating = false;
let currentReaction = null;
let reactionProgress = 0;
let reactionInterval = null;
let clock;

// 元素データ
const elementData = {
    H: { name: '水素', color: 0x88CCEE, radius: 0.4, mass: 1.008, valence: 1 },
    C: { name: '炭素', color: 0x444444, radius: 0.7, mass: 12.011, valence: 4 },
    N: { name: '窒素', color: 0x2255CC, radius: 0.65, mass: 14.007, valence: 3 },
    O: { name: '酸素', color: 0xCC0000, radius: 0.6, mass: 15.999, valence: 2 },
    F: { name: 'フッ素', color: 0x77DD88, radius: 0.5, mass: 18.998, valence: 1 },
    Na: { name: 'ナトリウム', color: 0x9955BB, radius: 1.8, mass: 22.990, valence: 1 },
    Cl: { name: '塩素', color: 0x00CC44, radius: 1.0, mass: 35.453, valence: 1 }
};

// オブジェクトプール（メモリ効率化）
const objectPool = {
    electrons: [],
    atoms: [],
    orbitals: [],
    bonds: [],
    
    // プールからオブジェクトを取得
    getElectron: function() {
        let electron;
        if (this.electrons.length > 0) {
            electron = this.electrons.pop();
            electron.visible = true;
        } else {
            const geometry = new THREE.SphereGeometry(0.08, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            electron = new THREE.Mesh(geometry, material);
            scene.add(electron);
        }
        return electron;
    },
    
    // オブジェクトをプールに戻す
    returnElectron: function(electron) {
        electron.visible = false;
        electron.userData = {};
        this.electrons.push(electron);
    },
    
    // 原子メッシュをプールから取得
    getAtomMesh: function(radius) {
        let atom;
        // サイズが近い原子を再利用
        for (let i = 0; i < this.atoms.length; i++) {
            const pooledAtom = this.atoms[i];
            const geometry = pooledAtom.geometry;
            if (Math.abs(geometry.parameters.radius - radius) < 0.1) {
                atom = this.atoms.splice(i, 1)[0];
                atom.visible = true;
                return atom;
            }
        }
        
        // 新しく作成
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 90,
            specular: 0x666666
        });
        atom = new THREE.Mesh(geometry, material);
        atom.castShadow = false;
        atom.receiveShadow = false;
        scene.add(atom);
        return atom;
    },
    
    // 原子メッシュをプールに戻す
    returnAtomMesh: function(atom) {
        atom.visible = false;
        this.atoms.push(atom);
    }
};

// 軽量分子テンプレート
const moleculeTemplates = {
    // 水
    H2O: function() {
        const center = new THREE.Vector3(0, 0, 0);
        const oAtom = addAtom('O', center);
        const h1Atom = addAtom('H', center.clone().add(new THREE.Vector3(0.8, 0.5, 0)));
        const h2Atom = addAtom('H', center.clone().add(new THREE.Vector3(-0.8, 0.5, 0)));
        createBond(oAtom, h1Atom);
        createBond(oAtom, h2Atom);
        return [oAtom, h1Atom, h2Atom];
    },
    
    // メタン
    CH4: function() {
        const center = new THREE.Vector3(0, 0, 0);
        const cAtom = addAtom('C', center);
        
        // 正四面体の頂点位置を計算
        const vertices = [
            new THREE.Vector3(0.8, 0.8, 0.8),
            new THREE.Vector3(-0.8, -0.8, 0.8),
            new THREE.Vector3(0.8, -0.8, -0.8),
            new THREE.Vector3(-0.8, 0.8, -0.8)
        ];
        
        const hAtoms = [];
        vertices.forEach(vertex => {
            const hAtom = addAtom('H', center.clone().add(vertex));
            createBond(cAtom, hAtom);
            hAtoms.push(hAtom);
        });
        
        return [cAtom, ...hAtoms];
    }
};

// 分子テンプレートをロード
function loadMoleculeTemplate(templateName) {
    // 既存の原子をすべて削除
    clearAllAtoms();
    
    // テンプレートが存在するか確認
    if (!moleculeTemplates[templateName]) {
        console.warn(`Template ${templateName} not found`);
        return;
    }
    
    // テンプレート関数を呼び出して分子を構築
    const atoms = moleculeTemplates[templateName]();
    
    // カメラを分子の中心に向ける
    centerCameraOnMolecule();
    
    // 分子特性を更新
    updateMolecularProperties();
    
    // アニメーションを一時的に強制
    animationFrameCount = 0;
    
    return atoms;
}

// 反応データ
const reactionData = {
    'acid-base': {
        name: '酸塩基反応',
        equation: 'HCl + NaOH → NaCl + H₂O',
        steps: [
            { label: '反応物が接近', progress: 0 },
            { label: 'H⁺とOH⁻が引き寄せられる', progress: 0.33 },
            { label: '水分子が形成される', progress: 0.66 },
            { label: 'Na⁺とCl⁻が塩を形成', progress: 1 }
        ],
        reactants: [
            { element: 'H', position: { x: -2, y: 0, z: 0 } },
            { element: 'Cl', position: { x: -1, y: 0, z: 0 } },
            { element: 'Na', position: { x: 1, y: 0, z: 0 } },
            { element: 'O', position: { x: 2, y: 0, z: 0 } },
            { element: 'H', position: { x: 2.5, y: 0.5, z: 0 } }
        ],
        products: [
            { element: 'Na', position: { x: -1, y: 0, z: 0 } },
            { element: 'Cl', position: { x: 0, y: 0, z: 0 } },
            { element: 'H', position: { x: 1.5, y: 0, z: 0 } },
            { element: 'O', position: { x: 2, y: 0, z: 0 } },
            { element: 'H', position: { x: 2.5, y: 0.5, z: 0 } }
        ],
        energyProfile: [
            { x: 0, y: 0, label: '反応前' },
            { x: 0.25, y: -10, label: '中間体1' },
            { x: 0.5, y: -30, label: '遷移状態' },
            { x: 0.75, y: -40, label: '中間体2' },
            { x: 1, y: -50, label: '生成物' }
        ]
    },
    'redox': {
        name: '酸化還元反応',
        equation: '2H₂ + O₂ → 2H₂O',
        steps: [
            { label: '反応物が接近', progress: 0 },
            { label: '活性化障壁に到達', progress: 0.33 },
            { label: '電子が移動', progress: 0.66 },
            { label: '水分子が形成される', progress: 1 }
        ],
        reactants: [
            { element: 'H', position: { x: -2.5, y: 0, z: 0 } },
            { element: 'H', position: { x: -2, y: 0, z: 0 } },
            { element: 'H', position: { x: -1, y: 0, z: 0 } },
            { element: 'H', position: { x: -0.5, y: 0, z: 0 } },
            { element: 'O', position: { x: 1, y: 0, z: 0 } },
            { element: 'O', position: { x: 2, y: 0, z: 0 } }
        ],
        products: [
            { element: 'O', position: { x: -1, y: 0, z: 0 } },
            { element: 'H', position: { x: -1.5, y: 0.5, z: 0 } },
            { element: 'H', position: { x: -0.5, y: 0.5, z: 0 } },
            { element: 'O', position: { x: 1, y: 0, z: 0 } },
            { element: 'H', position: { x: 0.5, y: 0.5, z: 0 } },
            { element: 'H', position: { x: 1.5, y: 0.5, z: 0 } }
        ],
        energyProfile: [
            { x: 0, y: 0, label: '反応前' },
            { x: 0.3, y: 40, label: '活性化状態' },
            { x: 0.6, y: 20, label: '中間体' },
            { x: 1, y: -60, label: '生成物' }
        ]
    },
    'combustion': {
        name: '燃焼反応',
        equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
        steps: [
            { label: '反応物が接近', progress: 0 },
            { label: '活性化障壁に到達', progress: 0.25 },
            { label: 'C-H結合が切断', progress: 0.5 },
            { label: 'ラジカル中間体が形成', progress: 0.75 },
            { label: '最終生成物が形成', progress: 1 }
        ],
        reactants: [
            // メタン
            { element: 'C', position: { x: -2, y: 0, z: 0 } },
            { element: 'H', position: { x: -2.5, y: 0.5, z: 0 } },
            { element: 'H', position: { x: -1.5, y: 0.5, z: 0 } },
            { element: 'H', position: { x: -2, y: -0.5, z: 0.5 } },
            { element: 'H', position: { x: -2, y: -0.5, z: -0.5 } },
            // 酸素
            { element: 'O', position: { x: 0, y: 0.5, z: 0 } },
            { element: 'O', position: { x: 1, y: 0.5, z: 0 } },
            { element: 'O', position: { x: 0, y: -0.5, z: 0 } },
            { element: 'O', position: { x: 1, y: -0.5, z: 0 } }
        ],
        products: [
            // 二酸化炭素
            { element: 'C', position: { x: -1, y: 0, z: 0 } },
            { element: 'O', position: { x: -2, y: 0, z: 0 } },
            { element: 'O', position: { x: 0, y: 0, z: 0 } },
            // 水
            { element: 'O', position: { x: 1.5, y: 0.5, z: 0 } },
            { element: 'H', position: { x: 1, y: 0.8, z: 0 } },
            { element: 'H', position: { x: 2, y: 0.8, z: 0 } },
            { element: 'O', position: { x: 1.5, y: -0.5, z: 0 } },
            { element: 'H', position: { x: 1, y: -0.8, z: 0 } },
            { element: 'H', position: { x: 2, y: -0.8, z: 0 } }
        ],
        energyProfile: [
            { x: 0, y: 0, label: '反応前' },
            { x: 0.2, y: 50, label: '活性化状態' },
            { x: 0.4, y: 30, label: '中間体1' },
            { x: 0.6, y: 20, label: '中間体2' },
            { x: 0.8, y: -40, label: '中間体3' },
            { x: 1, y: -80, label: '生成物' }
        ]
    }
};

// ツアーステップ
const tourSteps = [
    {
        target: '.toolbar',
        title: 'ツールバー',
        content: 'ここから主要な機能にアクセスします。分子構築、反応シミュレーション、探索モードなどを切り替えられます。'
    },
    {
        target: '.element-grid',
        title: '元素選択',
        content: 'ここから使用したい元素を選択します。各元素カードをクリックすると選択できます。'
    },
    {
        target: '.molecule-templates',
        title: '分子テンプレート',
        content: '一般的な分子構造をワンクリックで配置できます。水、メタン、アンモニアなどが用意されています。'
    },
    {
        target: '.dock',
        title: 'ツールドック',
        content: '原子の追加、結合の作成、削除などの基本操作をここから行います。'
    },
    {
        target: '#scene-container',
        title: '3D空間',
        content: 'ここで分子を構築します。クリックで原子を配置し、ドラッグで回転、スクロールで拡大縮小できます。'
    }
];

// 現在のツアーステップ
let currentTourStep = 0;

// グローバルパフォーマンス設定
const PERFORMANCE = {
    ENABLE_SHADOWS: false,
    MAX_ELECTRON_COUNT: 20,
    THROTTLE_MOUSE_EVENTS: 50, // ms
    USE_LOW_POLY: true,
    ENABLE_OBJECT_POOLING: true,
    THROTTLE_RENDER: true
};

// 初期化
init();
animate();

// 初期化関数
function init() {
    // パフォーマンスプロファイルを検出（デバイス性能に合わせて設定を変更）
    detectPerformanceProfile();
    
    // ローディング表示
    loader.style.display = 'block';
    
    // Three.jsのセットアップ
    setupThreeJS();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 初期表示設定
    showWelcomeInstructions();
    
    // 構築パネルを初期表示
    showPanel(buildPanel);
    
    // ローディング非表示
    loader.style.display = 'none';
}

// デバイス性能に応じた設定を自動検出
function detectPerformanceProfile() {
    // モバイルデバイス検出
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // メモリ制限が厳しいデバイス向け設定
    if (isMobile) {
        PERFORMANCE.MAX_ELECTRON_COUNT = 5;
        PERFORMANCE.USE_LOW_POLY = true;
        PERFORMANCE.THROTTLE_MOUSE_EVENTS = 100;
        PERFORMANCE.ENABLE_SHADOWS = false;
    }
    
    // 高性能GPUの検出を試みる
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                
                // 高性能GPUの場合は設定を引き上げ
                if (/(nvidia|geforce|radeon|intel iris)/i.test(renderer)) {
                    PERFORMANCE.ENABLE_SHADOWS = !isMobile;
                    PERFORMANCE.MAX_ELECTRON_COUNT = isMobile ? 10 : 30;
                }
            }
        }
    } catch (e) {
        console.log('WebGL検出エラー:', e);
    }
}

// 最終的なレンダリング関数（最適化）
function render() {
    renderer.render(scene, camera);
}

// アニメーション関数
function animate() {
    requestAnimationFrame(animate);
    
    // アニメーションが必要な場合のみ更新
    if (animationNeeded()) {
        // コントロールを更新
        controls.update();
        
        // 電子のアニメーション（30フレームごとに更新）
        if (animationFrameCount % 3 === 0 && showOrbitals) {
            animateElectrons();
        }
        
        // ラベル位置の更新（10フレームごとに更新）
        if (showLabels && animationFrameCount % 10 === 0) {
            labels.forEach(item => {
                updateLabelPosition(item.atom);
            });
        }
        
        // レンダリング
        render();
    }
    
    animationFrameCount++;
    if (animationFrameCount > 1000) animationFrameCount = 0;
}

// Three.jsのセットアップ
function setupThreeJS() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // カメラの作成
    camera = new THREE.PerspectiveCamera(
        75,
        sceneContainer.clientWidth / sceneContainer.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance" 
    });
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ピクセル比を制限
    renderer.shadowMap.enabled = false; // シャドウマップを無効化（重い）
    sceneContainer.appendChild(renderer.domElement);
    
    // コントロールの追加
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.autoRotate = false; // 自動回転を無効化
    
    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = false; // シャドウキャスティングを無効化（重い）
    scene.add(directionalLight);
    
    // グリッド
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = -2;
    scene.add(gridHelper);
    
    // レイキャスタとマウス
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // クロック
    clock = new THREE.Clock();
    
    // イベントリスナーの設定
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    
    // 初期カメラ位置を保存
    lastCameraPosition.copy(camera.position);
    lastCameraRotation.copy(camera.rotation);
}

// イベントリスナーの設定
function setupEventListeners() {
    // ツールボタンのイベント
    toolBuild.addEventListener('click', () => {
        activateToolButton(toolBuild);
        showPanel(buildPanel);
        updateInfoCardContent('分子構築モード: 元素を選択して分子を作成します。ドラッグで回転、スクロールで拡大縮小できます。');
    });
    
    toolReact.addEventListener('click', () => {
        activateToolButton(toolReact);
        showPanel(reactionPanel);
        updateInfoCardContent('化学反応モード: 様々な化学反応をシミュレーションできます。反応のステップやエネルギー変化を観察しましょう。');
        
        // 最初の反応を選択
        selectReaction('acid-base', document.querySelector('.reaction-card[data-reaction="acid-base"]'));
    });
    
    toolExplore.addEventListener('click', () => {
        activateToolButton(toolExplore);
        showPanel(explorePanel);
        updateInfoCardContent('探索モード: 分子の電子構造や特性を調べることができます。電子軌道や電荷分布を可視化してみましょう。');
        updateMolecularProperties();
    });
    
    toolView.addEventListener('click', () => {
        activateToolButton(toolView);
        showPanel(viewPanel);
        updateInfoCardContent('ビュー設定: 表示方法をカスタマイズできます。3D/2D切り替えやモデルスタイルを変更してみましょう。');
    });
    
    toolHelp.addEventListener('click', () => {
        showInstructions();
    });
    
    // パネルを閉じるボタン
    closeBuildPanel.addEventListener('click', () => hidePanel(buildPanel));
    closeReactionPanel.addEventListener('click', () => hidePanel(reactionPanel));
    closeExplorePanel.addEventListener('click', () => hidePanel(explorePanel));
    closeViewPanel.addEventListener('click', () => hidePanel(viewPanel));
    
    // ドックアイテム
    dockAdd.addEventListener('click', () => {
        activateDockItem(dockAdd);
        currentMode = 'add';
        updateInfoCardContent('原子追加モード: 選択した元素の原子をシーン内にクリックで配置できます。');
    });
    
    dockBond.addEventListener('click', () => {
        activateDockItem(dockBond);
        currentMode = 'bond';
        bondStartAtom = null;
        updateInfoCardContent('結合作成モード: 最初の原子をクリックした後、2つ目の原子をクリックすると結合が作成されます。');
    });
    
    dockDelete.addEventListener('click', () => {
        activateDockItem(dockDelete);
        currentMode = 'delete';
        updateInfoCardContent('削除モード: クリックした原子または結合を削除します。');
    });
    
    dockClear.addEventListener('click', () => {
        clearAllAtoms();
        updateInfoCardContent('すべての原子と結合をクリアしました。新しく分子を構築できます。');
    });
    
    // 元素カード
    elementCards.forEach(card => {
        card.addEventListener('click', () => {
            const element = card.getAttribute('data-element');
            selectElement(element, card);
        });
    });
    
    // 分子テンプレート
    moleculeCards.forEach(card => {
        card.addEventListener('click', () => {
            const moleculeName = card.getAttribute('data-molecule');
            loadMoleculeTemplate(moleculeName);
        });
    });
    
    // 反応カード
    reactionCards.forEach(card => {
        card.addEventListener('click', () => {
            const reactionName = card.getAttribute('data-reaction');
            selectReaction(reactionName, card);
        });
    });
    
    // 反応操作ボタン
    startReactionBtn.addEventListener('click', startReactionSimulation);
    pauseReactionBtn.addEventListener('click', pauseReactionSimulation);
    resetReactionBtn.addEventListener('click', resetReactionSimulation);
    
    // ビューボタン
    toggle3D2DBtn.addEventListener('click', toggle3D2DView);
    resetCameraBtn.addEventListener('click', resetCameraPosition);
    toggleLabelsBtn.addEventListener('click', toggleLabels);
    
    // スタイル選択ボタン
    styleBallStickBtn.addEventListener('click', () => setModelStyle('ball-stick'));
    styleSpaceFillBtn.addEventListener('click', () => setModelStyle('space-fill'));
    styleWireframeBtn.addEventListener('click', () => setModelStyle('wireframe'));
    
    // 背景選択ボタン
    bgDarkBtn.addEventListener('click', () => setBackground('dark'));
    bgLightBtn.addEventListener('click', () => setBackground('light'));
    bgGradientBtn.addEventListener('click', () => setBackground('gradient'));
    
    // 探索モードボタン
    toggleOrbitalsBtn.addEventListener('click', toggleOrbitalDisplay);
    toggleChargesBtn.addEventListener('click', showElectrostaticPotential);
    toggleBondsBtn.addEventListener('click', showBondTypes);
    
    // 情報カードのトグル
    infoCardHeader.addEventListener('click', toggleInfoCard);
    
    // インストラクション関連
    closeInstructions.addEventListener('click', hideInstructions);
    skipInstructions.addEventListener('click', hideInstructions);
    startTour.addEventListener('click', startGuidedTour);
    
    // ツアーナビゲーション
    tourNext.addEventListener('click', nextTourStep);
    tourPrev.addEventListener('click', prevTourStep);
}

// マウスダウン処理
function onMouseDown(event) {
    // 右クリックやコンテキストメニューは無視
    if (event.button !== 0) return;
    
    // マウス座標を更新
    updateMouseCoordinates(event);
    
    // 最適化されたレイキャスト
    const intersects = performRaycasting(event, atoms.concat(bonds).concat([gridHelper]));
    
    if (intersects.length === 0) return;
    
    const obj = intersects[0].object;
    
    // クリックしたのが原子の場合
    if (obj.userData.isAtom) {
        handleAtomClick(obj, event);
    }
    // クリックしたのが結合の場合
    else if (obj.userData.isBond) {
        handleBondClick(obj);
    }
    // それ以外（グリッドなど）の場合
    else {
        handleEmptySpaceClick(intersects[0].point);
    }
}

// マウス移動処理
function onMouseMove(event) {
    // イベントの発生頻度を制限（スロットリング）
    if (mouseMoveThrottled) return;
    mouseMoveThrottled = true;
    setTimeout(() => { mouseMoveThrottled = false; }, 50); // 50ms間隔で実行
    
    // マウス座標を更新
    updateMouseCoordinates(event);
    
    // ドラッグ中の場合の処理
    if (isDragging && selectedAtom) {
        const intersects = performRaycasting(event, [gridHelper]);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // 選択した原子を移動
            selectedAtom.position.copy(point);
            
            // 関連する結合を更新
            updateBondsForAtom(selectedAtom);
            
            // 関連する軌道を更新
            if (showOrbitals) {
                updateOrbitalPosition(selectedAtom);
            }
            
            // 関連するラベルを更新
            if (showLabels) {
                updateLabelPosition(selectedAtom);
            }
            
            // 分子特性を更新
            updateMolecularProperties();
        }
        return;
    }
    
    // ツールチップ関連
    if (currentMode === 'add') {
        // 原子追加モードの場合、ホバー効果は表示しない
        hideAtomTooltip();
        return;
    }
    
    // 高コストなレイキャストを最適化
    const intersects = performRaycasting(event, atoms.concat(bonds));
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        
        if (obj.userData.isAtom) {
            // 原子にホバーした場合
            highlightAtom(obj);
            showAtomTooltip(event, obj.userData.element);
        } else if (obj.userData.isBond) {
            // 結合にホバーした場合
            showBondTooltip(event, obj.userData.bondType);
        } else {
            // それ以外の場合はツールチップを非表示
            hideAtomTooltip();
        }
    } else {
        // 何もない場所にホバーした場合
        hideAtomTooltip();
        
        // ハイライト解除
        if (highlightedAtom) {
            unhighlightAtom(highlightedAtom);
            highlightedAtom = null;
        }
    }
}

// マウスアップ処理
function onMouseUp(event) {
    // ドラッグ終了
    if (isDragging) {
        isDragging = false;
        draggedAtom = null;
        controls.enabled = true;
        
        // 分子特性を更新
        updateMolecularProperties();
    }
}

// ホイール処理
function onWheel(event) {
    // ズーム処理はOrbitControlsが担当
}

// マウス座標を更新
function updateMouseCoordinates(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// 原子クリック処理（最適化）
function handleAtomClick(atom, event) {
    if (!atom) return;
    
    switch (currentMode) {
        case 'add':
            // 削除モードのとき、選択中の原子を削除
            if (currentTool === 'delete') {
                removeAtom(atom);
                updateInfoCardContent(`${elementData[atom.userData.element].name} (${atom.userData.element}) を削除しました。`);
            }
            break;
            
        case 'bond':
            // 結合作成モードの処理
            if (!bondStartAtom) {
                // 最初の原子を選択
                bondStartAtom = atom;
                highlightAtom(atom);
                updateInfoCardContent(`結合の開始原子: ${elementData[atom.userData.element].name} (${atom.userData.element}) - 次に結合先の原子をクリックしてください。`);
            } else if (bondStartAtom !== atom) {
                // 2つ目の原子を選択→結合を作成
                createBond(bondStartAtom, atom);
                updateInfoCardContent(`${elementData[bondStartAtom.userData.element].name} と ${elementData[atom.userData.element].name} の間に結合を作成しました。`);
                
                // ハイライトを解除し、状態をリセット
                unhighlightAtom(bondStartAtom);
                bondStartAtom = null;
                
                // 分子特性を更新
                updateMolecularProperties();
            }
            break;
            
        case 'select':
            // 原子選択モード
            if (selectedAtom === atom) {
                // 同じ原子をクリックした場合は選択解除
                selectedAtom = null;
                unhighlightAtom(atom);
                updateInfoCardContent('選択を解除しました。');
            } else {
                // 異なる原子を選択
                if (selectedAtom) {
                    unhighlightAtom(selectedAtom);
                }
                selectedAtom = atom;
                highlightAtom(atom);
                updateInfoCardContent(`${elementData[atom.userData.element].name} (${atom.userData.element}) を選択しました。`);
            }
            break;
            
        case 'move':
            // 原子移動モード
            selectedAtom = atom;
            isDragging = true;
            highlightAtom(atom);
            updateInfoCardContent(`${elementData[atom.userData.element].name} (${atom.userData.element}) を移動します。ドラッグして位置を調整してください。`);
            break;
    }
}

// 結合クリック処理
function handleBondClick(bond) {
    if (currentMode === 'delete') {
        // 削除モードの場合
        removeBond(bond);
        updateInfoCardContent('結合を削除しました。');
    }
}

// 空間クリック処理
function handleEmptySpaceClick(position) {
    if (currentMode === 'add') {
        // 追加モードの場合は原子を追加
        const atom = addAtom(currentElement, position);
        updateInfoCardContent(`${elementData[currentElement].name} (${currentElement}) を追加しました。`);
        
        // 分子特性を更新
        updateMolecularProperties();
    }
}

// 原子を追加（最適化版）
function addAtom(element, position) {
    const data = elementData[element];
    
    // オブジェクトプールから原子メッシュを取得
    const atom = objectPool.getAtomMesh(data.radius);
    
    // 色を設定
    atom.material.color.set(data.color);
    atom.position.copy(position);
    
    // ユーザーデータを設定
    atom.userData = {
        isAtom: true,
        element: element
    };
    
    // 配列に追加
    atoms.push(atom);
    
    // ラベルが表示されている場合は追加
    if (showLabels) {
        addLabel(atom);
    }
    
    // 電子軌道が表示されている場合は追加
    if (showOrbitals) {
        addOrbital(atom);
    }
    
    // アニメーション効果
    atom.scale.set(0, 0, 0);
    gsap.to(atom.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
    });
    
    return atom;
}

// 原子を削除
function removeAtom(atom) {
    // 関連する結合を削除
    const bondsToRemove = [];
    
    for (let i = bonds.length - 1; i >= 0; i--) {
        const bond = bonds[i];
        if (bond.userData.startAtom === atom || bond.userData.endAtom === atom) {
            bondsToRemove.push(bond);
        }
    }
    
    bondsToRemove.forEach(bond => {
        removeBond(bond);
    });
    
    // 関連するラベルを削除
    removeLabel(atom);
    
    // 関連する軌道を削除
    removeOrbital(atom);
    
    // 原子をフェードアウトさせてから削除
    gsap.to(atom.material, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            // 配列から削除
            const index = atoms.indexOf(atom);
            if (index > -1) {
                atoms.splice(index, 1);
            }
            
            // オブジェクトプールに戻す
            objectPool.returnAtomMesh(atom);
            
            // 選択状態をリセット
            if (selectedAtom === atom) {
                selectedAtom = null;
            }
            
            if (bondStartAtom === atom) {
                bondStartAtom = null;
            }
            
            // 分子特性を更新
            updateMolecularProperties();
        }
    });
}

// 結合を作成
function createBond(startAtom, endAtom) {
    // 結合タイプを決定（単結合、二重結合など）
    const bondType = determineBondType(startAtom.userData.element, endAtom.userData.element);
    
    // 開始位置と終了位置
    const startPos = startAtom.position.clone();
    const endPos = endAtom.position.clone();
    
    // 方向と距離
    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const distance = direction.length();
    
    // 中心位置
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    
    // 結合のジオメトリと色を設定
    let geometry, material, bond;
    
    switch (bondType) {
        case 'single':
            geometry = new THREE.CylinderGeometry(0.1, 0.1, distance, 12);
            material = new THREE.MeshPhongMaterial({
                color: 0xCCCCCC,
                shininess: 30
            });
            break;
            
        case 'double':
            geometry = new THREE.CylinderGeometry(0.15, 0.15, distance, 12);
            material = new THREE.MeshPhongMaterial({
                color: 0x99CCFF,
                shininess: 30
            });
            break;
            
        case 'triple':
            geometry = new THREE.CylinderGeometry(0.2, 0.2, distance, 12);
            material = new THREE.MeshPhongMaterial({
                color: 0xFF99CC,
                shininess: 30
            });
            break;
            
        case 'ionic':
            geometry = new THREE.CylinderGeometry(0.08, 0.08, distance, 12);
            material = new THREE.MeshPhongMaterial({
                color: 0xFFFF00,
                shininess: 80,
                transparent: true,
                opacity: 0.7
            });
            break;
    }
    
    // 結合のメッシュを作成
    bond = new THREE.Mesh(geometry, material);
    bond.position.copy(midpoint);
    bond.castShadow = true;
    
    // 結合の向きを設定（Y軸に沿った円柱を正しい方向に回転）
    bond.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
    );
    
    // ユーザーデータを設定
    bond.userData.isBond = true;
    bond.userData.bondType = bondType;
    bond.userData.startAtom = startAtom;
    bond.userData.endAtom = endAtom;
    
    // シーンに追加
    scene.add(bond);
    bonds.push(bond);
    
    // アニメーション効果
    bond.scale.y = 0;
    gsap.to(bond.scale, {
        y: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
    });
    
    // 分子特性を更新
    updateMolecularProperties();
    
    return bond;
}

// 結合タイプを決定
function determineBondType(element1, element2) {
    // 基本的なルールに基づいて結合タイプを決定
    if ((element1 === 'O' && element2 === 'O') || 
        (element1 === 'N' && element2 === 'N')) {
        return 'double';
    } else if ((element1 === 'C' && element2 === 'O') || 
               (element1 === 'O' && element2 === 'C')) {
        return 'double';
    } else if ((element1 === 'Na' && element2 === 'Cl') || 
               (element1 === 'Cl' && element2 === 'Na')) {
        return 'ionic';
    } else {
        return 'single';
    }
}

// 結合を削除
function removeBond(bond) {
    // 結合をフェードアウトさせてから削除
    gsap.to(bond.material, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            scene.remove(bond);
            
            // 配列から削除
            const index = bonds.indexOf(bond);
            if (index > -1) {
                bonds.splice(index, 1);
            }
            
            // 分子特性を更新
            updateMolecularProperties();
        }
    });
}

// 原子に関連する結合を更新
function updateBondsForAtom(atom) {
    bonds.forEach(bond => {
        if (bond.userData.startAtom === atom || bond.userData.endAtom === atom) {
            // 結合の開始点と終了点
            const startPos = bond.userData.startAtom.position.clone();
            const endPos = bond.userData.endAtom.position.clone();
            
            // 方向と距離
            const direction = new THREE.Vector3().subVectors(endPos, startPos);
            const distance = direction.length();
            
            // 中心位置
            const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            
            // 結合の位置と向きを更新
            bond.position.copy(midpoint);
            bond.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction.normalize()
            );
            
            // 結合の長さを更新
            bond.scale.y = distance / bond.geometry.parameters.height;
        }
    });
}

// すべての原子を削除
function clearAllAtoms() {
    // 結合、ラベル、軌道も含めて削除
    for (let i = atoms.length - 1; i >= 0; i--) {
        removeAtom(atoms[i]);
    }
    
    // 電子を削除
    electrons.forEach(electron => {
        scene.remove(electron);
        objectPool.returnElectron(electron);
    });
    electrons = [];
    
    // リセット
    selectedAtom = null;
    bondStartAtom = null;
    
    updateInfoCardContent('すべての原子を削除しました。');
    
    // 分子特性を更新
    updateMolecularProperties();
}

// 軌道を追加
function addOrbital(atom) {
    const element = atom.userData.element;
    const data = elementData[element];
    const electronCount = data.electronCount || 1;
    
    // 電子数を制限（パフォーマンス対策）
    const displayedElectrons = Math.min(electronCount, 8);
    
    // 軌道円のジオメトリ
    const orbitalGeometry = new THREE.TorusGeometry(data.radius * 2, 0.02, 8, 32);
    const orbitalMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x3366ff, 
        transparent: true, 
        opacity: 0.3,
        depthWrite: false
    });
    
    // 3つの軌道円を作成
    const orbitals = [];
    
    // X軸軌道
    const orbitalX = new THREE.Mesh(orbitalGeometry, orbitalMaterial);
    orbitalX.rotation.y = Math.PI / 2;
    atom.add(orbitalX);
    orbitals.push(orbitalX);
    
    // Y軸軌道
    const orbitalY = new THREE.Mesh(orbitalGeometry, orbitalMaterial);
    orbitalY.rotation.x = Math.PI / 2;
    atom.add(orbitalY);
    orbitals.push(orbitalY);
    
    // Z軸軌道
    const orbitalZ = new THREE.Mesh(orbitalGeometry, orbitalMaterial);
    atom.add(orbitalZ);
    orbitals.push(orbitalZ);
    
    // 電子のジオメトリ
    const electronGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    // 電子を追加
    for (let i = 0; i < displayedElectrons; i++) {
        const electron = new THREE.Mesh(electronGeometry, electronMaterial);
        
        // ランダムな初期位置と速度を設定
        const radius = data.radius * 2;
        const initialTheta = Math.random() * Math.PI;
        const initialPhi = Math.random() * Math.PI * 2;
        electron.position.set(
            radius * Math.sin(initialTheta) * Math.cos(initialPhi),
            radius * Math.sin(initialTheta) * Math.sin(initialPhi),
            radius * Math.cos(initialTheta)
        );
        
        scene.add(electron);
        electrons.push(electron);
        
        // 電子データ
        electron.userData.parentAtom = atom;
        electron.userData.radius = radius;
        electron.userData.speed = 0.5 + Math.random() * 0.5;
        electron.userData.initialTheta = initialTheta;
        electron.userData.initialPhi = initialPhi;
        electron.userData.offset = Math.random() * Math.PI * 2;
    }
    
    // 原子のユーザーデータに軌道を追加
    atom.userData.orbitals = orbitals;
}

// 電子軌道を削除
function removeOrbital(atom) {
    // 関連する電子軌道と電子を削除
    for (let i = orbitals.length - 1; i >= 0; i--) {
        const orbital = orbitals[i];
        if (orbital.userData.parentAtom === atom) {
            scene.remove(orbital);
            orbitals.splice(i, 1);
        }
    }
    
    for (let i = electrons.length - 1; i >= 0; i--) {
        const electron = electrons[i];
        if (electron.userData.parentAtom === atom) {
            scene.remove(electron);
            electrons.splice(i, 1);
        }
    }
}

// 電子軌道の位置を更新
function updateOrbitalPosition(atom) {
    orbitals.forEach(orbital => {
        if (orbital.userData.parentAtom === atom) {
            orbital.position.copy(atom.position);
        }
    });
}

// 電子軌道表示の切り替え
function toggleOrbitalDisplay() {
    showOrbitals = !showOrbitals;
    
    if (showOrbitals) {
        // すべての原子に電子軌道を追加
        atoms.forEach(atom => {
            addOrbital(atom);
        });
        updateInfoCardContent('電子軌道を表示しています。原子の周りを電子が周回する様子が観察できます。');
    } else {
        // すべての電子軌道を削除
        while (orbitals.length > 0) {
            scene.remove(orbitals[0]);
            orbitals.shift();
        }
        
        while (electrons.length > 0) {
            scene.remove(electrons[0]);
            electrons.shift();
        }
        updateInfoCardContent('電子軌道を非表示にしました。');
    }
}

// 静電ポテンシャルを表示
function showElectrostaticPotential() {
    // 原子の電気陰性度に基づいて静電ポテンシャルを視覚化
    atoms.forEach(atom => {
        const element = atom.userData.element;
        const electronegativity = getElectronegativity(element);
        
        // 電気陰性度に基づいて色を決定
        let color;
        if (electronegativity > 2.5) {
            // 電気陰性度が高い（電子を引き寄せる傾向がある）
            color = 0x0000FF; // 青
        } else if (electronegativity < 1.5) {
            // 電気陰性度が低い（電子を放出する傾向がある）
            color = 0xFF0000; // 赤
        } else {
            // 中間
            color = 0x00FF00; // 緑
        }
        
        // 静電ポテンシャルを表す半透明の球
        const geometry = new THREE.SphereGeometry(
            elementData[element].radius * 2,
            32, 32
        );
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        
        const potential = new THREE.Mesh(geometry, material);
        potential.position.copy(atom.position);
        potential.userData.isElectrostatic = true;
        
        // シーンに追加
        scene.add(potential);
        
        // 5秒後に自動的に削除
        setTimeout(() => {
            scene.remove(potential);
        }, 5000);
    });
    
    updateInfoCardContent('静電ポテンシャルを表示しています。青色は電気陰性度が高い原子、赤色は電気陰性度が低い原子を示します。');
}

// 電気陰性度を取得
function getElectronegativity(element) {
    const values = {
        H: 2.2,
        C: 2.55,
        N: 3.04,
        O: 3.44,
        F: 3.98,
        Na: 0.93,
        Cl: 3.16
    };
    
    return values[element] || 2.0;
}

// 結合タイプを表示
function showBondTypes() {
    if (bonds.length === 0) {
        updateInfoCardContent('結合が存在しません。まず分子を構築してください。');
        return;
    }
    
    bonds.forEach(bond => {
        // 結合タイプに基づいて色を変更
        const originalColor = bond.material.color.clone();
        const originalOpacity = bond.material.opacity;
        
        let color;
        switch (bond.userData.bondType) {
            case 'single':
                color = 0x22FF22; // 緑
                break;
            case 'double':
                color = 0xFF22FF; // マゼンタ
                break;
            case 'triple':
                color = 0xFFFF22; // 黄色
                break;
            case 'ionic':
                color = 0x22FFFF; // シアン
                break;
        }
        
        // 一時的に色を変更
        bond.material.color.set(color);
        bond.material.opacity = 1.0;
        
        // 結合タイプラベルを作成
        const startAtom = bond.userData.startAtom;
        const endAtom = bond.userData.endAtom;
        const midpoint = new THREE.Vector3().addVectors(
            startAtom.position,
            endAtom.position
        ).multiplyScalar(0.5);
        
        // HTMLベースのラベル
        const labelDiv = document.createElement('div');
        labelDiv.className = 'bond-label';
        labelDiv.textContent = bond.userData.bondType;
        labelDiv.style.position = 'absolute';
        labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        labelDiv.style.color = 'white';
        labelDiv.style.padding = '4px 8px';
        labelDiv.style.borderRadius = '4px';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.transform = 'translate(-50%, -50%)';
        labelDiv.style.zIndex = '100';
        document.body.appendChild(labelDiv);
        
        // ラベル位置を更新
        function updateLabelPosition() {
            const screenPosition = midpoint.clone().project(camera);
            labelDiv.style.left = (screenPosition.x * 0.5 + 0.5) * window.innerWidth + 'px';
            labelDiv.style.top = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight + 'px';
        }
        
        updateLabelPosition();
        
        // アニメーションフレームごとに位置を更新
        const labelUpdateId = setInterval(updateLabelPosition, 50);
        
        // 5秒後に元の色に戻し、ラベルを削除
        setTimeout(() => {
            bond.material.color.copy(originalColor);
            bond.material.opacity = originalOpacity;
            clearInterval(labelUpdateId);
            document.body.removeChild(labelDiv);
        }, 5000);
    });
    
    updateInfoCardContent('結合タイプを表示しています。緑=単結合、マゼンタ=二重結合、黄色=三重結合、シアン=イオン結合');
}

// 原子ラベルの追加
function addLabel(atom) {
    const element = atom.userData.element;
    
    // HTMLベースのラベル
    const labelDiv = document.createElement('div');
    labelDiv.className = 'atom-label';
    labelDiv.textContent = element;
    labelDiv.style.position = 'absolute';
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    labelDiv.style.color = 'white';
    labelDiv.style.padding = '2px 5px';
    labelDiv.style.borderRadius = '3px';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.transform = 'translate(-50%, -50%)';
    labelDiv.style.zIndex = '100';
    labelDiv.style.pointerEvents = 'none';
    document.body.appendChild(labelDiv);
    
    // ユーザーデータを更新
    atom.userData.label = labelDiv;
    labels.push({ atom: atom, label: labelDiv });
    
    // 初期位置の設定
    updateLabelPosition(atom);
}

// ラベル位置の更新
function updateLabelPosition(atom) {
    if (!atom.userData.label) return;
    
    const labelDiv = atom.userData.label;
    const screenPosition = atom.position.clone().project(camera);
    
    labelDiv.style.left = (screenPosition.x * 0.5 + 0.5) * window.innerWidth + 'px';
    labelDiv.style.top = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight + 'px';
}

// ラベルの削除
function removeLabel(atom) {
    if (!atom.userData.label) return;
    
    const labelDiv = atom.userData.label;
    document.body.removeChild(labelDiv);
    
    // ラベル配列から削除
    const index = labels.findIndex(item => item.atom === atom);
    if (index > -1) {
        labels.splice(index, 1);
    }
    
    atom.userData.label = null;
}

// ラベル表示の切り替え
function toggleLabels() {
    showLabels = !showLabels;
    
    if (showLabels) {
        // すべての原子にラベルを追加
        atoms.forEach(atom => {
            if (!atom.userData.label) {
                addLabel(atom);
            }
        });
        updateInfoCardContent('原子ラベルを表示しています。各原子の元素記号が表示されます。');
    } else {
        // すべてのラベルを削除
        atoms.forEach(atom => {
            if (atom.userData.label) {
                removeLabel(atom);
            }
        });
        updateInfoCardContent('原子ラベルを非表示にしました。');
    }
}

// 原子をハイライト
function highlightAtom(atom) {
    const originalScale = atom.scale.clone();
    const originalColor = atom.material.color.clone();
    
    // 一時的に拡大して色を変更
    gsap.to(atom.scale, {
        x: originalScale.x * 1.2,
        y: originalScale.y * 1.2,
        z: originalScale.z * 1.2,
        duration: 0.3
    });
    
    atom.userData.originalColor = originalColor;
    atom.material.color.set(0xFFA500); // オレンジ色
    
    // 元の状態を保存
    atom.userData.highlighted = true;
}

// 原子のハイライトを解除
function unhighlightAtom(atom) {
    if (!atom.userData.highlighted) return;
    
    // 元のスケールと色に戻す
    gsap.to(atom.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3
    });
    
    if (atom.userData.originalColor) {
        atom.material.color.copy(atom.userData.originalColor);
        atom.userData.originalColor = null;
    }
    
    atom.userData.highlighted = false;
}

// 原子ツールチップを表示
function showAtomTooltip(event, element) {
    const data = elementData[element];
    
    atomTooltip.innerHTML = `
        <strong>${data.name} (${element})</strong><br>
        質量: ${data.mass}<br>
        価電子: ${data.valence}
    `;
    
    atomTooltip.style.display = 'block';
    atomTooltip.style.left = event.clientX + 10 + 'px';
    atomTooltip.style.top = event.clientY - 50 + 'px';
}

// 結合ツールチップを表示
function showBondTooltip(event, bondType) {
    let description = '';
    
    switch (bondType) {
        case 'single':
            description = '単結合: 2つの原子間で1対の電子を共有';
            break;
        case 'double':
            description = '二重結合: 2つの原子間で2対の電子を共有';
            break;
        case 'triple':
            description = '三重結合: 2つの原子間で3対の電子を共有';
            break;
        case 'ionic':
            description = 'イオン結合: 電子を完全に授受する結合';
            break;
    }
    
    atomTooltip.innerHTML = `<strong>${description}</strong>`;
    
    atomTooltip.style.display = 'block';
    atomTooltip.style.left = event.clientX + 10 + 'px';
    atomTooltip.style.top = event.clientY - 30 + 'px';
}

// ツールチップを非表示
function hideAtomTooltip() {
    atomTooltip.style.display = 'none';
}

// ツールボタンをアクティブに
function activateToolButton(button) {
    toolButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

// ドックアイテムをアクティブに
function activateDockItem(item) {
    dockItems.forEach(dockItem => {
        dockItem.classList.remove('active');
    });
    item.classList.add('active');
}

// 元素を選択
function selectElement(element, card) {
    currentElement = element;
    
    // UI更新
    elementCards.forEach(c => {
        c.classList.remove('selected');
    });
    card.classList.add('selected');
    
    updateInfoCardContent(`${elementData[element].name} (${element}) を選択しました。キャンバス上をクリックして原子を配置できます。`);
}

// パネルを表示
function showPanel(panel) {
    // すべてのパネルを非表示
    buildPanel.classList.remove('active');
    reactionPanel.classList.remove('active');
    explorePanel.classList.remove('active');
    viewPanel.classList.remove('active');
    
    // 指定されたパネルを表示
    panel.classList.add('active');
}

// パネルを非表示
function hidePanel(panel) {
    panel.classList.remove('active');
}

// 情報カードの内容を更新
function updateInfoCardContent(content) {
    infoCardContent.innerHTML = content;
    
    // 最小化されていたら展開
    if (infoCard.classList.contains('minimized')) {
        toggleInfoCard();
    }
    
    // 更新されたことを視覚的に表現
    infoCard.classList.add('pulse');
    setTimeout(() => {
        infoCard.classList.remove('pulse');
    }, 300);
}

// 情報カードの表示/非表示を切り替え
function toggleInfoCard() {
    infoCard.classList.toggle('minimized');
    infoCardToggle.textContent = infoCard.classList.contains('minimized') ? '▲' : '▼';
}

// ウェルカムインストラクションを表示
function showWelcomeInstructions() {
    instructionOverlay.classList.add('active');
}

// インストラクションを表示
function showInstructions() {
    instructionOverlay.classList.add('active');
}

// インストラクションを非表示
function hideInstructions() {
    instructionOverlay.classList.remove('active');
}

// ガイドツアーを開始
function startGuidedTour() {
    hideInstructions();
    currentTourStep = 0;
    showTourStep(currentTourStep);
}

// ツアーステップを表示
function showTourStep(index) {
    if (index < 0 || index >= tourSteps.length) {
        // ツアー終了
        tourPopup.classList.remove('active');
        updateInfoCardContent('ツアーが完了しました。自由に探索してみましょう！');
        return;
    }
    
    const step = tourSteps[index];
    const target = document.querySelector(step.target);
    
    if (!target) {
        nextTourStep();
        return;
    }
    
    // ターゲット要素の位置を取得
    const rect = target.getBoundingClientRect();
    
    // ポップアップ位置を計算
    let popupX, popupY;
    
    // 位置調整（画面端に寄せる）
    if (rect.left < window.innerWidth / 2) {
        // 左側にある場合は右に表示
        popupX = rect.right + 10;
        tourPopup.style.left = popupX + 'px';
        tourPopup.style.right = 'auto';
    } else {
        // 右側にある場合は左に表示
        popupX = rect.left - 260 - 10;
        tourPopup.style.left = popupX + 'px';
        tourPopup.style.right = 'auto';
    }
    
    if (rect.top < window.innerHeight / 2) {
        // 上部にある場合は下に表示
        popupY = rect.bottom + 10;
        tourPopup.style.top = popupY + 'px';
        tourPopup.style.bottom = 'auto';
    } else {
        // 下部にある場合は上に表示
        popupY = rect.top - tourPopup.clientHeight - 10;
        tourPopup.style.top = popupY + 'px';
        tourPopup.style.bottom = 'auto';
    }
    
    // コンテンツを更新
    tourPopup.querySelector('.tour-title').textContent = step.title;
    tourPopup.querySelector('.tour-content').textContent = step.content;
    
    // ナビゲーションボタンの表示/非表示
    tourPrev.style.visibility = index > 0 ? 'visible' : 'hidden';
    tourNext.textContent = index < tourSteps.length - 1 ? '次へ' : '完了';
    
    // ポップアップを表示
    tourPopup.classList.add('active');
    
    // ターゲット要素をハイライト
    highlightElement(target);
}

// 要素をハイライト
function highlightElement(element) {
    // 前のハイライトをクリア
    const prevHighlight = document.querySelector('.tour-highlight');
    if (prevHighlight) {
        prevHighlight.classList.remove('tour-highlight');
    }
    
    // 新しい要素をハイライト
    element.classList.add('tour-highlight');
    
    // スクロールして要素を表示
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// 次のツアーステップ
function nextTourStep() {
    currentTourStep++;
    showTourStep(currentTourStep);
}

// 前のツアーステップ
function prevTourStep() {
    currentTourStep--;
    showTourStep(currentTourStep);
}

// ビューポートのリサイズ処理
function onWindowResize() {
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    
    // ラベル位置の更新
    labels.forEach(item => {
        updateLabelPosition(item.atom);
    });
}

// アニメーションが必要かどうかを判断
let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();
let animationFrameCount = 0;

function animationNeeded() {
    // カメラが動いていない、またはコントロールが使用中でない場合は更新しない
    const cameraPositionChanged = !lastCameraPosition.equals(camera.position);
    const cameraRotationChanged = 
        lastCameraRotation.x !== camera.rotation.x || 
        lastCameraRotation.y !== camera.rotation.y || 
        lastCameraRotation.z !== camera.rotation.z;
    
    // 明示的なアニメーションが進行中の場合
    const hasActiveAnimation = electrons.length > 0 && showOrbitals || 
                              isReactionSimulationRunning || 
                              controls.enabled && controls.autoRotate;
    
    // カメラの現在位置を記録
    lastCameraPosition.copy(camera.position);
    lastCameraRotation.copy(camera.rotation);
    
    return cameraPositionChanged || cameraRotationChanged || hasActiveAnimation || animationFrameCount < 30;
}

// 電子のアニメーション
function animateElectrons() {
    if (electrons.length === 0) return;
    
    const time = clock.getElapsedTime();
    
    // 電子数が多い場合は処理を分散
    const maxElectronsPerFrame = 20;
    const startIdx = Math.floor(Math.random() * electrons.length);
    const endIdx = Math.min(startIdx + maxElectronsPerFrame, electrons.length);
    
    for (let i = startIdx; i < endIdx; i++) {
        const electron = electrons[i];
        if (!electron.userData.parentAtom) continue;
        
        const atom = electron.userData.parentAtom;
        const radius = electron.userData.radius;
        const speed = electron.userData.speed;
        const offset = electron.userData.offset;
        
        // 初期角度
        const baseTheta = electron.userData.initialTheta;
        const basePhi = electron.userData.initialPhi;
        
        // 時間に基づいて角度を変化
        const theta = baseTheta + Math.sin(time * 0.5) * 0.2;
        const phi = basePhi + time * speed + offset;
        
        // 新しい位置を計算
        electron.position.x = atom.position.x + radius * Math.sin(theta) * Math.cos(phi);
        electron.position.y = atom.position.y + radius * Math.sin(theta) * Math.sin(phi);
        electron.position.z = atom.position.z + radius * Math.cos(theta);
    }
}

// シンプルなアニメーション用ライブラリ (GSAP代替)
const gsap = {
    to: function(target, config) {
        const duration = config.duration || 1;
        const ease = config.ease || 'linear';
        const delay = config.delay || 0;
        const onComplete = config.onComplete;
        const onUpdate = config.onUpdate;
        
        // 初期値を保存
        const initialValues = {};
        const finalValues = {};
        const startTime = Date.now() + delay * 1000;
        
        // アニメーションするプロパティを特定
        for (const prop in config) {
            if (prop !== 'duration' && prop !== 'ease' && prop !== 'delay' 
                && prop !== 'onComplete' && prop !== 'onUpdate') {
                initialValues[prop] = typeof target[prop] === 'object' ? 
                    JSON.parse(JSON.stringify(target[prop])) : target[prop];
                finalValues[prop] = config[prop];
            }
        }
        
        // アニメーションフレーム処理
        function update() {
            const now = Date.now();
            
            // ディレイ待ち
            if (now < startTime) {
                requestAnimationFrame(update);
                return;
            }
            
            // 経過時間
            const elapsed = (now - startTime) / 1000;
            
            // 進行度
            let progress = Math.min(elapsed / duration, 1);
            
            // イージング関数を適用
            if (ease === 'power2.inOut') {
                progress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            } else if (ease === 'back.out') {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                progress = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
            }
            
            // 値を補間
            for (const prop in initialValues) {
                if (typeof target[prop] === 'object' && target[prop] !== null) {
                    // 色オブジェクトなどの特殊な処理
                    if (prop === 'color' && target[prop].r !== undefined) {
                        target[prop].r = initialValues[prop].r + (finalValues[prop].r - initialValues[prop].r) * progress;
                        target[prop].g = initialValues[prop].g + (finalValues[prop].g - initialValues[prop].g) * progress;
                        target[prop].b = initialValues[prop].b + (finalValues[prop].b - initialValues[prop].b) * progress;
                    } else {
                        // Three.js Vector3などの処理
                        for (const subProp in initialValues[prop]) {
                            if (typeof initialValues[prop][subProp] === 'number') {
                                target[prop][subProp] = initialValues[prop][subProp] + 
                                    (finalValues[prop][subProp] - initialValues[prop][subProp]) * progress;
                            }
                        }
                    }
                } else if (typeof initialValues[prop] === 'number') {
                    target[prop] = initialValues[prop] + (finalValues[prop] - initialValues[prop]) * progress;
                } else if (typeof target[prop] === 'string' && target[prop].startsWith('#')) {
                    // 色の16進数表現は扱わない
                } else {
                    target[prop] = progress < 1 ? initialValues[prop] : finalValues[prop];
                }
            }
            
            // 更新コールバック
            if (onUpdate) {
                onUpdate();
            }
            
            // アニメーションが完了していなければ続行
            if (progress < 1) {
                requestAnimationFrame(update);
            } else if (onComplete) {
                // 完了したらコールバックを呼び出し
                onComplete();
            }
        }
        
        // アニメーション開始
        requestAnimationFrame(update);
        
        // チェーン用に空のオブジェクトを返す
        return {
            then: function() { return this; },
            to: function() { return this; }
        };
    },
    
    from: function(target, config) {
        // 初期値と最終値を入れ替えて to メソッドを呼び出す
        const initialValues = {};
        
        for (const prop in config) {
            if (prop !== 'duration' && prop !== 'ease' && prop !== 'delay' 
                && prop !== 'onComplete' && prop !== 'onUpdate') {
                initialValues[prop] = target[prop];
            }
        }
        
        // 最初に最終値（config値）を設定
        for (const prop in config) {
            if (prop !== 'duration' && prop !== 'ease' && prop !== 'delay' 
                && prop !== 'onComplete' && prop !== 'onUpdate') {
                if (typeof target[prop] === 'object' && target[prop] !== null) {
                    for (const subProp in config[prop]) {
                        target[prop][subProp] = config[prop][subProp];
                    }
                } else {
                    target[prop] = config[prop];
                }
            }
        }
        
        // 元の値に戻すアニメーションを開始
        return this.to(target, {
            ...config,
            ...initialValues
        });
    },
    
    // タイムライン（使用しない場合は空のダミー）
    timeline: function() {
        return {
            to: function() { return this; },
            from: function() { return this; },
            fromTo: function() { return this; },
            play: function() { return this; }
        };
    }
};

// レイキャスティングを最適化
function performRaycasting(event, objects) {
    // 何もない場合は即座に空の配列を返す
    if (!objects || objects.length === 0) return [];
    
    // マウス座標を更新
    updateMouseCoordinates(event);
    
    // レイキャスト実行
    raycaster.setFromCamera(mouse, camera);
    
    // 距離でソートして最前面のもののみ処理
    return raycaster.intersectObjects(objects, false).sort((a, b) => a.distance - b.distance);
}

// スロットリング用変数
let mouseMoveThrottled = false;