/**
 * app.js - メインアプリケーションファイル
 * すべてのシミュレーションを管理し、UIを制御する
 */

// 利用可能なシミュレーションのマップ
const simulationTypes = {
    "freefall": { 
        title: "自由落下",
        class: FreeFall 
    },
    "projectile": { 
        title: "弾道運動",
        class: Projectile 
    },
    "pendulum": { 
        title: "振り子運動",
        class: Pendulum 
    },
    "collision": { 
        title: "弾性衝突",
        class: Collision 
    },
    "inclinedPlane": { 
        title: "斜面上の運動",
        class: InclinedPlane 
    }
};

// 現在のシミュレーション
let currentSimulation = null;
let p5Instance = null;

// DOMが読み込まれた後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // シミュレーションの選択UIをセットアップ
    setupSimulationSelector();
    
    // ボタンイベントのセットアップ
    setupButtons();
    
    // 最初のシミュレーションを初期化
    const initialSimulationType = document.getElementById('scenario-select').value;
    initializeSimulation(initialSimulationType);
});

/**
 * シミュレーション選択UIをセットアップ
 */
function setupSimulationSelector() {
    const selector = document.getElementById('scenario-select');
    
    // 選択変更時のイベント
    selector.addEventListener('change', (event) => {
        const simulationType = event.target.value;
        initializeSimulation(simulationType);
    });
}

/**
 * ボタンイベントをセットアップ
 */
function setupButtons() {
    const startButton = document.getElementById('start-btn');
    const resetButton = document.getElementById('reset-btn');
    
    // 開始ボタン
    startButton.addEventListener('click', () => {
        if (currentSimulation) {
            if (currentSimulation.isRunning) {
                currentSimulation.stop();
                startButton.textContent = '開始';
            } else {
                currentSimulation.start();
                startButton.textContent = '一時停止';
            }
        }
    });
    
    // リセットボタン
    resetButton.addEventListener('click', () => {
        if (currentSimulation) {
            currentSimulation.reset();
            startButton.textContent = '開始';
            
            // パラメータUIを更新
            updateParameterUI();
        }
    });
}

/**
 * シミュレーションを初期化
 * @param {String} simulationType - シミュレーションの種類
 */
function initializeSimulation(simulationType) {
    // p5インスタンスがあれば削除
    if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
    }
    
    // キャンバスコンテナ
    const canvasContainer = document.getElementById('simulation-canvas');
    
    // シミュレーションインスタンスを作成
    const SimClass = simulationTypes[simulationType].class;
    currentSimulation = new SimClass();
    
    // シミュレーションのタイトルと説明を更新
    document.getElementById('scenario-title').textContent = simulationTypes[simulationType].title;
    document.getElementById('scenario-description').textContent = currentSimulation.getDescription();
    
    // パラメータUIを作成
    createParameterUI(currentSimulation.defineParameters());
    
    // p5.jsのインスタンスを作成
    p5Instance = new p5((p) => {
        p.setup = () => {
            const canvas = p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
            canvas.parent(canvasContainer);
            currentSimulation.init(p);
        };
        
        p.draw = () => {
            currentSimulation.update();
            currentSimulation.draw();
            updateDataDisplay();
        };
        
        p.windowResized = () => {
            p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
        };
    });
    
    // 開始ボタンをリセット
    document.getElementById('start-btn').textContent = '開始';
}

/**
 * パラメータUIを作成
 * @param {Array} parameters - パラメータ定義の配列
 */
function createParameterUI(parameters) {
    const container = document.getElementById('parameter-controls');
    container.innerHTML = '';
    
    parameters.forEach(param => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'parameter-control';
        
        // ラベルと値の表示
        const labelDiv = document.createElement('div');
        labelDiv.className = 'parameter-label';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${param.name}:`;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'parameter-value';
        valueSpan.id = `${param.id}-value`;
        valueSpan.textContent = `${param.default} ${param.unit}`;
        
        labelDiv.appendChild(nameSpan);
        labelDiv.appendChild(valueSpan);
        
        // スライダー
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = param.id;
        slider.min = param.min;
        slider.max = param.max;
        slider.step = param.step;
        slider.value = param.default;
        
        // スライダーの変更イベント
        slider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            valueSpan.textContent = `${value} ${param.unit}`;
            currentSimulation.setParameter(param.id, value);
        });
        
        controlDiv.appendChild(labelDiv);
        controlDiv.appendChild(slider);
        container.appendChild(controlDiv);
    });
}

/**
 * パラメータUIを更新
 */
function updateParameterUI() {
    const parameters = currentSimulation.defineParameters();
    
    parameters.forEach(param => {
        const slider = document.getElementById(param.id);
        const valueSpan = document.getElementById(`${param.id}-value`);
        
        if (slider && valueSpan) {
            const value = currentSimulation.parameters[param.id];
            slider.value = value;
            valueSpan.textContent = `${value} ${param.unit}`;
        }
    });
}

/**
 * データ表示を更新
 */
function updateDataDisplay() {
    const container = document.getElementById('data-values');
    container.innerHTML = '';
    
    const data = currentSimulation.getDataToDisplay();
    
    for (const key in data) {
        const item = data[key];
        
        const div = document.createElement('div');
        div.className = 'data-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'data-name';
        nameSpan.textContent = item.name + ':';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'data-value';
        valueSpan.textContent = `${item.value} ${item.unit}`;
        
        div.appendChild(nameSpan);
        div.appendChild(valueSpan);
        container.appendChild(div);
    }
}