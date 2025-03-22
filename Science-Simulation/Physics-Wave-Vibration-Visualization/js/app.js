/**
 * app.js - メインアプリケーションファイル
 * すべての波動シミュレーションを管理し、UIを制御する
 */

// 利用可能なシミュレーションのマップ
const simulationTypes = {
    "singleWave": { 
        title: "単一波の観察",
        class: SingleWave 
    },
    "waveInterference": { 
        title: "波の干渉",
        class: WaveInterference 
    },
    "waveReflection": { 
        title: "波の反射と定在波",
        class: WaveReflection 
    },
    "waveDiffraction": { 
        title: "波の回折",
        class: WaveDiffraction 
    },
    "soundAnalysis": { 
        title: "音声波形解析",
        class: SoundAnalysis 
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
    // 現在のシミュレーションが実行中なら停止
    if (currentSimulation && currentSimulation.isRunning) {
        currentSimulation.stop();
    }
    
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
            if (currentSimulation.initWaveField) {
                currentSimulation.initWaveField(); // 波動場の再初期化
            }
        };
        
        // マウスイベントをシミュレーションに転送
        p.mousePressed = () => {
            if (currentSimulation.handleMousePressed) {
                currentSimulation.handleMousePressed(p.mouseX, p.mouseY);
            }
        };
        
        p.mouseDragged = () => {
            if (currentSimulation.handleMouseDragged) {
                currentSimulation.handleMouseDragged(p.mouseX, p.mouseY);
            }
        };
        
        p.mouseReleased = () => {
            if (currentSimulation.handleMouseReleased) {
                currentSimulation.handleMouseReleased();
            }
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

/**
 * ツールチップを表示
 * @param {String} message - ツールチップのメッセージ
 * @param {Number} x - X座標
 * @param {Number} y - Y座標
 */
function showTooltip(message, x, y) {
    let tooltip = document.querySelector('.tooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = message;
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    tooltip.style.display = 'block';
}

/**
 * ツールチップを非表示
 */
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * エラーメッセージを表示
 * @param {String} message - エラーメッセージ
 */
function showError(message) {
    console.error(message);
    
    // エラーメッセージを画面に表示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 5秒後に自動的に消える
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}