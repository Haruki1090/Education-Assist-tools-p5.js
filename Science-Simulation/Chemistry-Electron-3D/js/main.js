/**
 * 元素の電子配置 3D可視化ツール
 * メインアプリケーションスクリプト
 */

// グローバル変数
let periodicTable;
let orbitalViewer;
let orbitalModal;
let currentElement;
let currentTheme = 'light';

// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
    // 周期表の初期化
    initPeriodicTable();
    
    // モーダルの設定
    setupModal();
    
    // 元素グループの凡例を生成
    createElementLegend();
    
    // テーマ切替ボタンの設定
    setupThemeToggle();
    
    // システム設定のダークモードを確認
    checkSystemPreference();
    
    // 最初の元素を選択
    setTimeout(() => {
        periodicTable.selectElement(1); // 水素を選択
    }, 500);
});

/**
 * システムの色設定を確認してテーマを設定
 */
function checkSystemPreference() {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
        setTheme('dark');
    }
    
    // システム設定の変更を監視
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('user-theme-preference')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // ユーザーが以前に設定したテーマがあれば優先
    const savedTheme = localStorage.getItem('user-theme-preference');
    if (savedTheme) {
        setTheme(savedTheme);
    }
}

/**
 * テーマ切替ボタンの設定
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        // ユーザーの設定を保存
        localStorage.setItem('user-theme-preference', newTheme);
    });
    
    // 初期表示を更新
    updateThemeToggleUI();
}

/**
 * テーマを設定
 * @param {string} theme - 'light' または 'dark'
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    updateThemeToggleUI();
    
    // 3Dビューアがすでに初期化されている場合は背景色を更新
    if (orbitalViewer && orbitalViewer.isInitialized) {
        const isLightMode = theme === 'light';
        if (orbitalViewer.updateTheme) {
            orbitalViewer.updateTheme(isLightMode);
        } else if (orbitalViewer.setBrightness) {
            orbitalViewer.setBrightness(orbitalViewer.options.brightnessLevel);
        }
    }
}

/**
 * テーマ切替ボタンのUI更新
 */
function updateThemeToggleUI() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const themeIcon = themeToggle.querySelector('i');
    const themeText = themeToggle.querySelector('span');
    
    if (currentTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'ダークモード';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'ライトモード';
    }
}

/**
 * 周期表を初期化
 */
function initPeriodicTable() {
    // elementsDataがグローバル変数またはモジュールから利用可能かを確認
    if (typeof elementsData !== 'undefined') {
        periodicTable = new PeriodicTable('periodic-table', elementsData, onElementSelect);
    } else {
        console.error('elementsData が見つかりません。element-data.js が正しく読み込まれているか確認してください。');
        
        // エラーメッセージを表示
        const container = document.getElementById('periodic-table');
        if (container) {
            container.innerHTML = `
                <div class="tech-placeholder">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                    <p>元素データの読み込みに失敗しました。ページを再読み込みしてください。</p>
                </div>
            `;
        }
    }
}

/**
 * 元素選択時のコールバック
 * @param {Object} element - 選択された元素データ
 */
function onElementSelect(element) {
    currentElement = element;
    
    // 元素情報を表示
    displayElementInfo(element);
    
    // 拡張元素データを表示
    displayExtendedElementData(element);
    
    // 量子特性データを表示
    displayQuantumProperties(element);
    
    // 選択された元素の情報をコンソールに出力（デバッグ用）
    console.log('選択された元素:', element);
}

/**
 * 元素情報を表示
 * @param {Object} element - 元素データ
 */
function displayElementInfo(element) {
    const elementInfo = document.getElementById('element-info');
    if (!elementInfo) return;
    
    // HTML生成
    let html = `
        <div class="tech-element-header">
            <div class="element-symbol-container">
                <span class="element-symbol">${element.symbol}</span>
                <span class="element-number">${element.number}</span>
            </div>
            <h2 class="element-name">${element.name}</h2>
        </div>
        <div class="tech-element-properties">
            <div class="tech-property">
                <span class="tech-property-label">原子番号</span>
                <span class="tech-property-value">${element.number}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">原子量</span>
                <span class="tech-property-value">${element.atomic_mass.toFixed(4)}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">分類</span>
                <span class="tech-property-value">${getElementCategoryName(element.category)}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">周期</span>
                <span class="tech-property-value">${element.period}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">族</span>
                <span class="tech-property-value">${element.group || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">電子配置</span>
                <span class="tech-property-value">${element.electron_configuration || 'N/A'}</span>
            </div>
        </div>
        <div class="tech-element-description">
            ${element.summary || `${element.name}は周期表の${element.period}周期に位置する元素です。`}
        </div>
        <div class="tech-view-orbits-btn">
            <button id="view-orbits-btn" onclick="openOrbitalModal(currentElement)">
                <i class="fas fa-atom"></i>
                量子構造可視化
            </button>
        </div>
    `;
    
    elementInfo.innerHTML = html;
}

/**
 * 拡張元素データを表示
 * @param {Object} element - 元素データ
 */
function displayExtendedElementData(element) {
    const extendedDataContainer = document.getElementById('element-extended-data');
    if (!extendedDataContainer) return;
    
    // 拡張データ
    const extendedData = getExtendedElementData(element);
    
    // HTML生成
    let html = `
        <div class="tech-data-grid">
            ${extendedData.map(item => `
                <div class="tech-data-item">
                    <div class="tech-data-label">${item.label}</div>
                    <div class="tech-data-value">${item.value} ${item.unit || ''}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    extendedDataContainer.innerHTML = html;
}

/**
 * 元素の拡張データを取得
 * @param {Object} element - 元素データ
 * @returns {Array} 拡張データの配列
 */
function getExtendedElementData(element) {
    const data = [
        { label: '電気陰性度', value: element.electronegativity || 'N/A' },
        { label: '第一イオン化エネルギー', value: element.ionization_energy || 'N/A', unit: 'kJ/mol' },
        { label: '原子半径', value: element.atomic_radius || 'N/A', unit: 'pm' },
        { label: '共有結合半径', value: element.covalent_radius || 'N/A', unit: 'pm' },
        { label: '電子親和力', value: element.electron_affinity || 'N/A', unit: 'kJ/mol' },
        { label: '融点', value: element.melting_point || 'N/A', unit: 'K' },
        { label: '沸点', value: element.boiling_point || 'N/A', unit: 'K' },
        { label: '密度', value: element.density || 'N/A', unit: 'g/cm³' },
        { label: '酸化状態', value: element.oxidation_states ? element.oxidation_states.join(', ') : 'N/A' },
        { label: '状態（常温）', value: getStateOfMatter(element) },
        { label: '結晶構造', value: element.crystal_structure || 'N/A' },
        { label: '磁性', value: element.magnetic_ordering || 'N/A' }
    ];
    
    return data;
}

/**
 * 元素カテゴリの日本語名を取得
 * @param {string} category - 元素カテゴリ英語名
 * @returns {string} カテゴリの日本語名
 */
function getElementCategoryName(category) {
    const categories = {
        'alkali metal': 'アルカリ金属',
        'alkaline earth metal': 'アルカリ土類金属',
        'transition metal': '遷移金属',
        'post-transition metal': '後遷移金属',
        'metalloid': '半金属',
        'nonmetal': '非金属',
        'halogen': 'ハロゲン',
        'noble gas': '希ガス',
        'lanthanide': 'ランタノイド',
        'actinide': 'アクチノイド'
    };
    
    return categories[category] || category;
}

/**
 * 元素の常温での状態を取得
 * @param {Object} element - 元素データ
 * @returns {string} 状態（気体/液体/固体）
 */
function getStateOfMatter(element) {
    const roomTemp = 293.15; // 室温 (20°C)
    
    if (!element.melting_point) return '不明';
    
    if (element.melting_point > roomTemp) {
        return '固体';
    } else if (element.boiling_point && element.boiling_point < roomTemp) {
        return '気体';
    } else {
        return '液体';
    }
}

/**
 * 元素の物理特性と電子特性をモーダル内に表示
 * @param {Object} element - 元素データ
 */
function updateElementProperties(element) {
    // 物理特性
    const physicalProperties = [
        { label: '原子量', value: element.atomic_mass.toFixed(4), unit: 'u' },
        { label: '密度', value: element.density || 'N/A', unit: 'g/cm³' },
        { label: '融点', value: element.melting_point || 'N/A', unit: 'K' },
        { label: '沸点', value: element.boiling_point || 'N/A', unit: 'K' },
        { label: '原子半径', value: element.atomic_radius || 'N/A', unit: 'pm' },
        { label: '共有結合半径', value: element.covalent_radius || 'N/A', unit: 'pm' },
        { label: '状態', value: getStateOfMatter(element) },
        { label: '結晶構造', value: element.crystal_structure || 'N/A' }
    ];
    
    // 電子特性
    const electronProperties = [
        { label: '電子数', value: element.number },
        { label: '電子配置', value: element.electron_configuration_semantic || element.electron_configuration || 'N/A' },
        { label: '価電子', value: getValenceElectrons(element) },
        { label: '電気陰性度', value: element.electronegativity || 'N/A' },
        { label: 'イオン化エネルギー', value: element.ionization_energy || 'N/A', unit: 'kJ/mol' },
        { label: '電子親和力', value: element.electron_affinity || 'N/A', unit: 'kJ/mol' },
        { label: '酸化状態', value: element.oxidation_states ? element.oxidation_states.join(', ') : 'N/A' },
        { label: '磁性', value: element.magnetic_ordering || 'N/A' }
    ];
    
    // 物理特性セクションを更新
    updatePropertySection('physical-properties', physicalProperties);
    
    // 電子特性セクションを更新
    updatePropertySection('electron-properties', electronProperties);
}

/**
 * 特性セクションを更新
 * @param {string} containerId - コンテナID
 * @param {Array} properties - 特性データの配列
 */
function updatePropertySection(containerId, properties) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    properties.forEach(prop => {
        html += `
            <div class="tech-data-item">
                <span class="label">${prop.label}</span>
                <span class="value">${prop.value}${prop.unit ? ' ' + prop.unit : ''}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * 価電子数を取得（簡易計算）
 * @param {Object} element - 元素データ
 * @returns {number} 価電子数
 */
function getValenceElectrons(element) {
    // 周期表のグループから価電子を推定（簡易的な方法）
    if (element.group) {
        if (element.group <= 2 || element.group >= 13) {
            // 第1,2,13-18族は簡単に計算可能
            return element.group <= 2 ? element.group : element.group - 10;
        } else if (element.category === 'transition metal') {
            // 遷移金属は通常 d 軌道の電子を含む
            return element.electrons_per_shell ? 
                element.electrons_per_shell[element.electrons_per_shell.length - 1] : 
                '遷移元素';
        }
    }
    
    // 詳細なデータがない場合
    return element.valence_electrons || 'N/A';
}

/**
 * 元素グループの凡例を生成
 */
function createElementLegend() {
    const legendContainer = document.getElementById('element-legend');
    if (!legendContainer) return;
    
    // 元素グループとその日本語名
    const groups = [
        { class: 'alkali-metal', name: 'アルカリ金属' },
        { class: 'alkaline-earth', name: 'アルカリ土類金属' },
        { class: 'transition-metal', name: '遷移金属' },
        { class: 'post-transition-metal', name: '後遷移金属' },
        { class: 'metalloid', name: '半金属' },
        { class: 'nonmetal', name: '非金属' },
        { class: 'halogen', name: 'ハロゲン' },
        { class: 'noble-gas', name: '希ガス' },
        { class: 'lanthanide', name: 'ランタノイド' },
        { class: 'actinide', name: 'アクチノイド' }
    ];
    
    // 凡例アイテムを生成
    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const colorBox = document.createElement('span');
        colorBox.className = `legend-color ${group.class}`;
        
        const name = document.createElement('span');
        name.textContent = group.name;
        
        item.appendChild(colorBox);
        item.appendChild(name);
        legendContainer.appendChild(item);
    });
}

/**
 * モーダルの設定
 */
function setupModal() {
    orbitalModal = document.getElementById('orbital-modal');
    if (!orbitalModal) return;
    
    // モーダルを閉じるボタンの設定
    const closeButton = orbitalModal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeOrbitalModal);
    }
    
    // モーダル外をクリックして閉じる
    window.addEventListener('click', (event) => {
        if (event.target === orbitalModal) {
            closeOrbitalModal();
        }
    });
    
    // ESCキーでモーダルを閉じる
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && orbitalModal.style.display === 'block') {
            closeOrbitalModal();
        }
    });
    
    // グローバル関数としてモーダルを開く関数を公開
    window.openOrbitalModal = openOrbitalModal;
}

/**
 * 3D電子配置モーダルを開く
 * @param {Object} element - 元素データ
 */
function openOrbitalModal(element) {
    if (!element) return;
    
    // モーダルを取得
    const modal = document.getElementById('orbital-modal');
    if (!modal) return;
    
    // モーダルのタイトルを設定
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `${element.name}の電子配置`;
    }
    
    // 3Dビューワコンテナを取得
    const viewerContainer = document.getElementById('orbital-viewer');
    
    try {
        // 既存のビューアがあれば破棄
        if (orbitalViewer) {
            orbitalViewer.dispose();
        }
        
        // 新しいビューアを作成
        orbitalViewer = new OrbitalViewer({
            element: element,
            container: viewerContainer,
            width: viewerContainer.clientWidth,
            height: viewerContainer.clientHeight,
            trailLength: 100,  // 軌跡の長さ
            trailFadeTime: 200  // 軌跡のフェード時間（ミリ秒）
        });
        
        // ビューアを初期化
        orbitalViewer.initialize();
        
        // 電子配置タブの内容を更新
        updateElectronConfigTab(element);
        
        // 物理特性と電子特性データを表示
        updateElementProperties(element);
        
        // 量子特性タブを更新
        updateQuantumPropertiesTab(element);
        
        // モーダルを表示
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
    } catch (err) {
        console.error('軌道ビューワの初期化エラー:', err);
        
        if (viewerContainer) {
            viewerContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 20px; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin-bottom: 10px; font-size: 1.2rem;">エラーが発生しました</p>
                    <p style="color: #ff6b6b;">${err.message}</p>
                </div>
            `;
        }
    }
}

/**
 * 電子配置タブの内容を更新
 * @param {Object} element - 元素データ
 */
function updateElectronConfigTab(element) {
    const electronConfigDisplay = document.getElementById('electron-configuration');
    if (!electronConfigDisplay) return;
    
    // 電子配置情報を生成
    const electronConfig = {
        element: element.name,
        symbol: element.symbol,
        atomicNumber: element.number,
        electronConfiguration: element.electron_configuration || '',
        shells: element.shells || []
    };
    
    // 電子配置HTML生成・表示
    electronConfigDisplay.innerHTML = ElectronConfiguration.generateHTML(electronConfig);
}

/**
 * 軌道モーダルを閉じる
 */
function closeOrbitalModal() {
    if (!orbitalModal) return;
    
    orbitalModal.style.display = 'none';
    
    // メモリ節約のため、3Dビューアが使用するリソースを解放
    // if (orbitalViewer) {
    //     orbitalViewer.dispose();
    //     orbitalViewer = null;
    // }
}

/**
 * ウィンドウリサイズ時のハンドラ
 */
function handleResize() {
    // 周期表の再レイアウト（必要に応じて）
    
    // 3Dビューアのリサイズ
    if (orbitalViewer && orbitalViewer.isInitialized) {
        orbitalViewer.onWindowResize();
    }
}

// ウィンドウリサイズイベントの設定
window.addEventListener('resize', handleResize);

/**
 * 量子特性データを表示
 * @param {Object} element - 元素データ
 */
function displayQuantumProperties(element) {
    const quantumContainer = document.getElementById('element-quantum-data');
    const quantumDetailsContainer = document.getElementById('element-quantum-details');
    
    if (!quantumContainer || !quantumDetailsContainer) return;
    
    // 量子特性データを取得
    const quantumData = getQuantumData(element);
    
    // 量子データHTML生成
    let quantumHtml = `
        <div class="tech-data-grid">
            ${quantumData.basic.map(item => `
                <div class="tech-data-item">
                    <div class="tech-data-label">${item.label}</div>
                    <div class="tech-data-value">${item.value}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // 詳細データHTML生成
    let detailsHtml = `
        <div class="tech-quantum-data">
            <div class="tech-quantum-section">
                <h4 class="tech-quantum-title">基本量子特性</h4>
                <div class="tech-data-grid">
                    ${quantumData.basic.map(item => `
                        <div class="tech-data-item">
                            <div class="tech-data-label">${item.label}</div>
                            <div class="tech-data-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="tech-quantum-section">
                <h4 class="tech-quantum-title">量子力学的特性</h4>
                <div class="tech-data-grid">
                    ${quantumData.advanced.map(item => `
                        <div class="tech-data-item">
                            <div class="tech-data-label">${item.label}</div>
                            <div class="tech-data-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="tech-quantum-section">
                <h4 class="tech-quantum-title">量子専門特性</h4>
                <div class="tech-data-grid">
                    ${quantumData.expert.map(item => `
                        <div class="tech-data-item">
                            <div class="tech-data-label">${item.label}</div>
                            <div class="tech-data-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // HTMLを設定
    quantumContainer.innerHTML = quantumHtml;
    quantumDetailsContainer.innerHTML = detailsHtml;
}

/**
 * 元素の量子特性データを取得
 * @param {Object} element - 元素データ
 * @returns {Object} 量子特性データ
 */
function getQuantumData(element) {
    // 基本量子特性
    const basicProperties = [
        { 
            label: '主量子数', 
            value: getPrincipalQuantumNumber(element)
        },
        { 
            label: '軌道角運動量', 
            value: getOrbitalAngularMomentum(element)
        },
        { 
            label: '電子スピン', 
            value: '±1/2'
        },
        { 
            label: '量子状態', 
            value: getQuantumState(element)
        }
    ];
    
    // 高度な量子特性
    const advancedProperties = [
        { 
            label: 'スピン軌道結合', 
            value: calculateSpinOrbitCoupling(element)
        },
        { 
            label: '全角運動量', 
            value: calculateTotalAngularMomentum(element)
        },
        { 
            label: 'シュレディンガー確率', 
            value: calculateSchrodingerProbability(element)
        },
        { 
            label: '量子トンネル確率', 
            value: calculateQuantumTunneling(element)
        }
    ];
    
    // 専門的な量子特性
    const expertProperties = [
        { 
            label: '波動関数複雑性', 
            value: calculateWavefunctionComplexity(element)
        },
        { 
            label: '量子不確定性', 
            value: calculateQuantumUncertainty(element)
        },
        { 
            label: '確率密度分布', 
            value: calculateProbabilityDensity(element)
        },
        { 
            label: '量子交差性', 
            value: calculateQuantumIntersectionality(element)
        }
    ];
    
    return {
        basic: basicProperties,
        advanced: advancedProperties,
        expert: expertProperties
    };
}

/**
 * 主量子数を取得
 * @param {Object} element - 元素データ
 * @returns {string} 主量子数
 */
function getPrincipalQuantumNumber(element) {
    // 周期から主量子数を推定
    if (element.period) {
        return `n = ${element.period}`;
    }
    
    // 周期データがない場合は原子番号から推定
    const atomicNumber = element.number;
    
    if (atomicNumber <= 2) return 'n = 1';
    if (atomicNumber <= 10) return 'n = 2';
    if (atomicNumber <= 18) return 'n = 3';
    if (atomicNumber <= 36) return 'n = 4';
    if (atomicNumber <= 54) return 'n = 5';
    if (atomicNumber <= 86) return 'n = 6';
    return 'n = 7';
}

/**
 * 軌道角運動量を取得
 * @param {Object} element - 元素データ
 * @returns {string} 軌道角運動量
 */
function getOrbitalAngularMomentum(element) {
    // 最外殻の軌道タイプを推定
    let block = element.block;
    
    if (!block) {
        // ブロックデータがない場合は周期と族から推定
        if (element.group === 1 || element.group === 2) {
            block = 's';
        } else if (element.group >= 13 && element.group <= 18) {
            block = 'p';
        } else if (element.period >= 4) {
            if ((element.group >= 3 && element.group <= 12) || 
                (element.number >= 57 && element.number <= 71) || 
                (element.number >= 89 && element.number <= 103)) {
                block = element.group === undefined ? 'f' : 'd';
            }
        }
    }
    
    // 角運動量量子数
    const angularMomentumMap = {
        's': 'l = 0',
        'p': 'l = 1',
        'd': 'l = 2',
        'f': 'l = 3'
    };
    
    return angularMomentumMap[block] || '未確定';
}

/**
 * 量子状態を取得
 * @param {Object} element - 元素データ
 * @returns {string} 量子状態
 */
function getQuantumState(element) {
    // 電子配置から最後の軌道を取得
    const config = element.electron_configuration || element.electronConfiguration;
    
    if (config) {
        // 最後の軌道を抽出
        const match = config.match(/([1-7][spdf])([1-9][0-9]*)$/);
        if (match) {
            return match[1];
        }
    }
    
    // 電子配置データがない場合は周期とブロックから推定
    const period = element.period || Math.ceil(Math.sqrt(element.number));
    let block = element.block;
    
    if (!block) {
        if (element.group === 1 || element.group === 2) {
            block = 's';
        } else if (element.group >= 13 && element.group <= 18) {
            block = 'p';
        } else if (element.group >= 3 && element.group <= 12) {
            block = 'd';
        } else if ((element.number >= 57 && element.number <= 71) || 
                  (element.number >= 89 && element.number <= 103)) {
            block = 'f';
        }
    }
    
    return block ? `${period}${block}` : '未確定';
}

/**
 * スピン軌道結合を計算
 * @param {Object} element - 元素データ
 * @returns {string} スピン軌道結合
 */
function calculateSpinOrbitCoupling(element) {
    // スピン軌道結合強度の簡易計算
    // 原子番号が大きいほど強いスピン軌道結合を持つ
    const Z = element.number;
    let couplingStrength;
    
    if (Z < 20) {
        couplingStrength = '弱い';
    } else if (Z < 50) {
        couplingStrength = '中程度';
    } else if (Z < 80) {
        couplingStrength = '強い';
    } else {
        couplingStrength = '非常に強い';
    }
    
    return couplingStrength;
}

/**
 * 全角運動量を計算
 * @param {Object} element - 元素データ
 * @returns {string} 全角運動量
 */
function calculateTotalAngularMomentum(element) {
    // 簡易的な全角運動量の計算（J = L + S）
    const config = element.electron_configuration || element.electronConfiguration;
    let momentumType = '';
    
    if (config) {
        if (config.includes('s1')) {
            momentumType = 'J = 1/2';
        } else if (config.includes('p1')) {
            momentumType = 'J = 1/2, 3/2';
        } else if (config.includes('d1')) {
            momentumType = 'J = 3/2, 5/2';
        } else if (config.includes('f1')) {
            momentumType = 'J = 5/2, 7/2';
        } else {
            momentumType = '複合状態';
        }
    } else {
        // 電子配置データがない場合は周期から推定
        if (element.period <= 2) {
            momentumType = 'J = 1/2';
        } else if (element.period <= 4) {
            momentumType = 'J = 3/2, 5/2';
        } else {
            momentumType = '複合状態';
        }
    }
    
    return momentumType;
}

/**
 * シュレディンガー確率を計算
 * @param {Object} element - 元素データ
 * @returns {string} シュレディンガー確率
 */
function calculateSchrodingerProbability(element) {
    // 主量子数と原子番号から確率分布の複雑さを推定
    const n = element.period || Math.ceil(Math.sqrt(element.number));
    const Z = element.number;
    
    // 簡易計算式（実際の量子力学の計算とは異なる）
    const complexity = n * Math.log(Z) / Math.log(10);
    
    if (complexity < 2) {
        return '単純球対称';
    } else if (complexity < 4) {
        return '中程度の複雑性';
    } else if (complexity < 6) {
        return '高度に複雑';
    } else {
        return '超複雑分布';
    }
}

/**
 * 量子トンネル確率を計算
 * @param {Object} element - 元素データ
 * @returns {string} 量子トンネル確率
 */
function calculateQuantumTunneling(element) {
    // 第一イオン化エネルギーが低いほどトンネル確率が高い
    const ionizationEnergy = element.ionization_energy || element.ionization_energies?.[0];
    
    if (ionizationEnergy) {
        if (ionizationEnergy < 500) {
            return '高い (>10⁻⁸)';
        } else if (ionizationEnergy < 800) {
            return '中程度 (10⁻¹⁰-10⁻⁸)';
        } else if (ionizationEnergy < 1200) {
            return '低い (10⁻¹²-10⁻¹⁰)';
        } else {
            return '非常に低い (<10⁻¹²)';
        }
    }
    
    // イオン化エネルギーがない場合は原子番号から推定
    const atomicNumber = element.number;
    if (atomicNumber < 11) {
        return '中程度〜高い';
    } else if (atomicNumber < 30) {
        return '中程度';
    } else if (atomicNumber < 60) {
        return '低い〜中程度';
    } else {
        return '非常に低い';
    }
}

/**
 * 波動関数複雑性を計算
 * @param {Object} element - 元素データ
 * @returns {string} 波動関数複雑性
 */
function calculateWavefunctionComplexity(element) {
    // 原子番号と周期から波動関数の複雑さを推定
    const Z = element.number;
    const period = element.period || Math.ceil(Math.sqrt(Z));
    
    // 複雑性のスコア計算（仮想的な計算）
    const complexity = Math.log(Z) * period;
    
    if (complexity < 5) {
        return '単純 (1-2オービタル)';
    } else if (complexity < 10) {
        return '中程度 (3-5オービタル)';
    } else if (complexity < 15) {
        return '複雑 (6-8オービタル)';
    } else {
        return '超複雑 (8+オービタル)';
    }
}

/**
 * 量子不確定性を計算
 * @param {Object} element - 元素データ
 * @returns {string} 量子不確定性
 */
function calculateQuantumUncertainty(element) {
    // 原子半径から不確定性を推定（半径が大きいほど位置不確定性が小さい）
    const atomicRadius = element.atomic_radius || element.covalent_radius;
    
    if (atomicRadius) {
        if (atomicRadius < 100) {
            return '高い不確定性';
        } else if (atomicRadius < 150) {
            return '中程度の不確定性';
        } else if (atomicRadius < 200) {
            return '低い不確定性';
        } else {
            return '非常に低い不確定性';
        }
    }
    
    // 原子半径データがない場合は周期から推定
    const period = element.period || Math.ceil(Math.sqrt(element.number));
    
    if (period <= 2) {
        return '高い不確定性';
    } else if (period <= 4) {
        return '中程度の不確定性';
    } else {
        return '低い不確定性';
    }
}

/**
 * 確率密度分布を計算
 * @param {Object} element - 元素データ
 * @returns {string} 確率密度分布
 */
function calculateProbabilityDensity(element) {
    // 最外殻の電子配置から確率密度分布の形状を推定
    const block = element.block;
    const period = element.period || Math.ceil(Math.sqrt(element.number));
    
    if (block === 's') {
        return '球対称分布';
    } else if (block === 'p') {
        return 'ダンベル/球分布';
    } else if (block === 'd') {
        return '複雑ローブ分布';
    } else if (block === 'f') {
        return '超複雑多面分布';
    }
    
    // blockデータがない場合は原子番号から推定
    const atomicNumber = element.number;
    
    if (atomicNumber <= 2 || atomicNumber === 3 || atomicNumber === 4 || 
        atomicNumber === 11 || atomicNumber === 12 || atomicNumber === 19 || 
        atomicNumber === 20 || atomicNumber === 37 || atomicNumber === 38 || 
        atomicNumber === 55 || atomicNumber === 56 || atomicNumber === 87 || 
        atomicNumber === 88) {
        return '球対称分布';
    } else if ((atomicNumber >= 5 && atomicNumber <= 10) || 
              (atomicNumber >= 13 && atomicNumber <= 18) || 
              (atomicNumber >= 31 && atomicNumber <= 36) || 
              (atomicNumber >= 49 && atomicNumber <= 54) || 
              (atomicNumber >= 81 && atomicNumber <= 86)) {
        return 'ダンベル/球分布';
    } else if ((atomicNumber >= 21 && atomicNumber <= 30) || 
              (atomicNumber >= 39 && atomicNumber <= 48) || 
              (atomicNumber >= 71 && atomicNumber <= 80)) {
        return '複雑ローブ分布';
    } else {
        return '複合多面分布';
    }
}

/**
 * 量子交差性を計算
 * @param {Object} element - 元素データ
 * @returns {string} 量子交差性
 */
function calculateQuantumIntersectionality(element) {
    // 簡易的な量子状態の交差度合い（理論的な概念）
    const atomicNumber = element.number;
    const period = element.period || Math.ceil(Math.sqrt(atomicNumber));
    
    // 特定の原子番号での特殊な量子状態
    if ([24, 29, 42, 44, 45, 46, 78, 79, 90, 91, 92, 93, 96].includes(atomicNumber)) {
        return '高度な状態交差';
    }
    
    // 周期表での位置に基づく交差性
    if (period <= 2) {
        return '最小交差性';
    } else if (period === 3) {
        return '低い交差性';
    } else if (period === 4) {
        return '中程度交差性';
    } else if (period === 5) {
        return '高い交差性';
    } else {
        return '超高交差性';
    }
}

/**
 * 量子特性タブを更新
 * @param {Object} element - 元素データ
 */
function updateQuantumPropertiesTab(element) {
    const quantumPropertiesContainer = document.getElementById('quantum-properties');
    if (!quantumPropertiesContainer) return;
    
    // 量子特性データを取得
    const quantumData = getQuantumData(element);
    
    // 全ての量子データを結合
    const allQuantumData = [
        ...quantumData.basic,
        ...quantumData.advanced,
        ...quantumData.expert
    ];
    
    // HTML生成
    let html = '';
    allQuantumData.forEach(item => {
        html += `
            <div class="tech-data-item">
                <span class="label">${item.label}</span>
                <span class="value">${item.value}</span>
            </div>
        `;
    });
    
    quantumPropertiesContainer.innerHTML = html;
}