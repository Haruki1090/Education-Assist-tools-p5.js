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

/**
 * ステータスメッセージを更新
 * @param {string} message - 表示するメッセージ
 */
function updateStatusMessage(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.innerHTML = message + '<span class="tech-terminal-cursor"></span>';
    }
}

// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
    // 初期メッセージを表示
    updateStatusMessage('システムを初期化しています...');
    
    // 周期表の初期化
    setTimeout(() => {
        updateStatusMessage('周期表データを読み込んでいます...');
        initPeriodicTable();
        
        // モーダルの設定
        updateStatusMessage('システムコンポーネントを準備しています...');
        setupModal();
        
        // 元素グループの凡例を生成
        createElementLegend();
        
        // テーマ切替ボタンの設定
        setupThemeToggle();
        
        // システム設定のダークモードを確認
        checkSystemPreference();
        
        // 初期化完了メッセージ
        updateStatusMessage('元素を選択して量子電子配置を解析します。3D表示機能で電子軌道の立体構造と量子特性を確認できます。');
        
        // 最初の元素を選択
        setTimeout(() => {
            periodicTable.selectElement(1); // 水素を選択
        }, 500);
    }, 300);
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
        
        // 初期化成功メッセージ
        console.log('周期表の初期化が完了しました');
        
        // 利用方法のメッセージを表示
        const terminal = document.querySelector('.tech-terminal-text');
        if (terminal) {
            terminal.innerHTML = '周期表の元素をクリックすると、電子軌道の3D表示が開きます。<span class="tech-terminal-cursor"></span>';
        }
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
    
    // 選択された元素の情報をコンソールに出力（デバッグ用）
    console.log('選択された元素:', element);
    
    // 3Dモーダルを自動的に開く
    openOrbitalModal(element);
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
                <span class="tech-property-label">記号</span>
                <span class="tech-property-value">${element.symbol}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">英名</span>
                <span class="tech-property-value">${element.englishName || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">原子量</span>
                <span class="tech-property-value">${element.atomicMass || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">電子配置</span>
                <span class="tech-property-value">${element.electronConfiguration || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">分類</span>
                <span class="tech-property-value">${getElementCategoryName(element.category) || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">周期</span>
                <span class="tech-property-value">${element.period || 'N/A'}</span>
            </div>
            <div class="tech-property">
                <span class="tech-property-label">族</span>
                <span class="tech-property-value">${element.group || 'N/A'}</span>
            </div>
        </div>
        <div class="tech-action-buttons">
            <button class="tech-button" onclick="openOrbitalModal(currentElement)">
                <i class="fas fa-cube"></i>
                軌道ビューアーを開く
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
    
    // 閉じるボタンの設定
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrbitalModal);
    }
    
    // タブ切り替えの設定
    const tabs = document.querySelectorAll('.tech-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // アクティブなタブを変更
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // タブコンテンツの表示切り替え
            const tabId = tab.getAttribute('data-tab');
            const tabContents = document.querySelectorAll('.tech-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && orbitalModal.style.display === 'flex') {
            closeOrbitalModal();
        }
    });
    
    // モーダル外クリックで閉じる
    orbitalModal.addEventListener('click', (e) => {
        if (e.target === orbitalModal) {
            closeOrbitalModal();
        }
    });
    
    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', handleResize);
}

/**
 * 軌道モーダルを開く
 * @param {Object} element - 元素データ
 */
function openOrbitalModal(element) {
    if (!orbitalModal) return;
    
    // モーダル表示前にデータをクリア
    clearModalData();
    
    // モーダルタイトルの更新
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = `${element.name} (${element.symbol}) の電子配置`;
    }
    
    // 3Dビューアを初期化（存在しない場合）
    if (!orbitalViewer) {
        try {
            orbitalViewer = new OrbitalViewer('orbital-viewer');
        } catch (error) {
            console.error('3Dビューア初期化エラー:', error);
            showErrorInViewer('3Dビューアの初期化に失敗しました');
            return;
        }
    }
    
    // モーダル外側をスクロール不可に
    document.body.style.overflow = 'hidden';
    
    // モーダルを表示
    orbitalModal.style.display = 'flex';
    
    // アニメーション効果
    setTimeout(() => {
        orbitalModal.classList.add('open');
        
        // 電子配置データを取得して表示
        updateModalContent(element);
    }, 10);
}

/**
 * モーダルコンテンツを更新
 * @param {Object} element - 元素データ
 */
function updateModalContent(element) {
    try {
        // 電子配置タブを更新（これは素早く表示）
        updateElectronConfigTab(element);
        
        // 特性タブを更新（これもブロッキングしない程度に素早い）
        updatePropertySection('physical-properties', [
            { label: '原子番号', value: element.number },
            { label: '原子量', value: element.atomicMass ? element.atomicMass + ' u' : 'N/A' },
            { label: '分類', value: getElementCategoryName(element.category) },
            { label: '状態', value: getStateOfMatter(element) }
        ]);
        
        // 電子特性タブを更新
        updatePropertySection('electron-properties', [
            { label: '電子数', value: element.number },
            { label: '電子配置', value: element.electronConfiguration },
            { label: '価電子数', value: getValenceElectrons(element) },
            { label: '電子殻数', value: element.electronsPerShell ? element.electronsPerShell.length : 'N/A' }
        ]);
        
        // 量子特性タブを更新
        updateQuantumPropertiesTab(element);
        
        // 3D表示（時間のかかる処理なので、他のタブ表示後に行う）
        renderOrbitalView(element);
    } catch (error) {
        console.error('モーダルコンテンツ更新エラー:', error);
        showErrorInViewer('データ読み込みエラー: ' + error.message);
    }
}

/**
 * 3D軌道ビューを描画
 * @param {Object} element - 元素データ
 */
function renderOrbitalView(element) {
    try {
        // ビューアーコンテナを取得
        const viewerContainer = document.getElementById('orbital-viewer');
        if (!viewerContainer) {
            console.error('orbital-viewerコンテナが見つかりません');
            return;
        }
        
        // ローディング表示
        viewerContainer.innerHTML = '<div class="tech-loading"><i class="fas fa-atom fa-spin"></i> 3D軌道を生成中...</div>';
        
        // 電子配置を解析
        const config = analyzeElectronConfiguration(element);
        
        // 3Dビューアーがなければ作成
        if (!orbitalViewer) {
            orbitalViewer = new OrbitalViewer('orbital-viewer');
        }
        
        // タイミングの問題を解決するため、少し遅延させて表示
        setTimeout(() => {
            try {
                // 要素を表示（内部で初期化も行われる）
                orbitalViewer.displayElement(element, config);
            } catch (error) {
                console.error('軌道表示エラー:', error);
                showErrorInViewer('軌道の生成に失敗しました: ' + error.message);
            }
        }, 100);
    } catch (error) {
        console.error('3D表示エラー:', error);
        showErrorInViewer('3D表示の初期化に失敗しました: ' + error.message);
    }
}

/**
 * 3Dビューアにエラーメッセージを表示
 * @param {string} message - エラーメッセージ
 */
function showErrorInViewer(message) {
    const viewerContainer = document.getElementById('orbital-viewer');
    if (viewerContainer) {
        viewerContainer.innerHTML = `
            <div class="tech-placeholder">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                <p>${message}</p>
                <button onclick="retryLoadViewer()" class="tech-button">
                    <i class="fas fa-sync-alt"></i>
                    再試行
                </button>
            </div>
        `;
    }
}

/**
 * 3Dビューアの読み込みを再試行
 */
function retryLoadViewer() {
    if (!currentElement) return;
    
    const viewerContainer = document.getElementById('orbital-viewer');
    if (viewerContainer) {
        viewerContainer.innerHTML = '<div class="tech-loading"><i class="fas fa-atom fa-spin"></i> 3Dビューアを読み込んでいます...</div>';
    }
    
    // 少し遅延させてから再試行
    setTimeout(() => {
        try {
            if (!orbitalViewer) {
                orbitalViewer = new OrbitalViewer('orbital-viewer');
            }
            
            // 現在選択されている元素の情報を再度表示
            const config = analyzeElectronConfiguration(currentElement);
            orbitalViewer.displayElement(currentElement, config);
        } catch (error) {
            console.error('3Dビューア再読み込みエラー:', error);
            showErrorInViewer('再読み込みに失敗しました: ' + error.message);
        }
    }, 500);
}

/**
 * モーダルデータをクリア
 */
function clearModalData() {
    // タブコンテンツをクリア
    const tabContents = ['electron-configuration', 'physical-properties', 'electron-properties', 'quantum-properties'];
    tabContents.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '<div class="tech-loading"><i class="fas fa-spinner fa-spin"></i> データを読み込み中...</div>';
        }
    });
    
    // 3Dビューアをクリア
    if (orbitalViewer && orbitalViewer.clear) {
        orbitalViewer.clear();
    } else {
        const viewerContainer = document.getElementById('orbital-viewer');
        if (viewerContainer) {
            viewerContainer.innerHTML = '<div class="tech-loading"><i class="fas fa-atom fa-spin"></i> 3Dビューアを初期化中...</div>';
        }
    }
}

/**
 * 軌道モーダルを閉じる
 */
function closeOrbitalModal() {
    if (!orbitalModal) return;
    
    // モーダルのアニメーション
    orbitalModal.classList.remove('open');
    
    // スクロール再開
    document.body.style.overflow = '';
    
    // アニメーション完了後に非表示
    setTimeout(() => {
        orbitalModal.style.display = 'none';
        
        // メモリ解放のためにレンダリングをクリア
        if (orbitalViewer && orbitalViewer.dispose) {
            orbitalViewer.dispose();
        }
    }, 300);
}

/**
 * リサイズ処理
 */
function handleResize() {
    // 3Dビューアのリサイズ
    if (orbitalViewer && orbitalViewer.isInitialized) {
        orbitalViewer.onWindowResize();
    }
}

/**
 * 量子特性データを表示
 * @param {Object} element - 元素データ
 */
function displayQuantumProperties(element) {
    const container = document.getElementById('element-quantum-data');
    if (!container) return;
    
    // シンプルな量子データを取得
    const quantumData = {
        atomicNumber: element.number,
        electronConfiguration: element.electronConfiguration,
        valenceElectrons: getValenceElectrons(element),
        block: element.block,
        group: element.group,
        period: element.period
    };
    
    // データを表示
    updatePropertySection('element-quantum-data', [
        { label: '原子番号', value: quantumData.atomicNumber },
        { label: '電子配置', value: quantumData.electronConfiguration },
        { label: '価電子数', value: quantumData.valenceElectrons },
        { label: 'ブロック', value: quantumData.block },
        { label: '族', value: quantumData.group },
        { label: '周期', value: quantumData.period }
    ]);
    
    // 量子特性の詳細表示も簡略化
    const detailsContainer = document.getElementById('element-quantum-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="tech-quantum-detail-item">
                <h4>電子配置説明</h4>
                <p>${element.name}（${element.symbol}）の電子配置は${element.electronConfiguration}です。</p>
                <p>最外殻には${quantumData.valenceElectrons}個の電子があります。</p>
            </div>
        `;
    }
}

/**
 * 量子データを取得
 * @param {Object} element - 元素データ
 * @returns {Object} 量子データオブジェクト
 */
function getQuantumData(element) {
    // 簡略化した基本データのみ返す
    return {
        atomicNumber: element.number,
        electronConfiguration: element.electronConfiguration,
        valenceElectrons: getValenceElectrons(element),
        block: element.block,
        group: element.group,
        period: element.period
    };
}

/**
 * 量子特性タブを更新
 * @param {Object} element - 元素データ
 */
function updateQuantumPropertiesTab(element) {
    const container = document.getElementById('quantum-properties');
    if (!container) return;
    
    // シンプルなデータのみ表示
    const data = [
        { label: '原子番号', value: element.number },
        { label: '電子配置', value: element.electronConfiguration },
        { label: '価電子数', value: getValenceElectrons(element) },
        { label: 'ブロック', value: element.block },
        { label: '族', value: element.group },
        { label: '周期', value: element.period }
    ];
    
    let html = '';
    data.forEach(item => {
        html += `
            <div class="tech-data-item">
                <span class="tech-data-label">${item.label}:</span>
                <span class="tech-data-value">${item.value !== undefined ? item.value : 'N/A'}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * 元素の電子配置を解析
 * @param {Object} element - 元素データ
 * @returns {Object} 解析された電子配置データ
 */
function analyzeElectronConfiguration(element) {
    console.time('電子配置解析');
    
    try {
        // 基本的な電子配置データ
        const config = {
            element: element.name,
            symbol: element.symbol,
            atomicNumber: element.number,
            shells: element.electronsPerShell || [],
            orbitals: []
        };
        
        // 電子配置から軌道データを抽出
        let electronConfig = element.electronConfiguration;
        
        // 電子配置がない場合は周期と族から推定
        if (!electronConfig && element.period && element.group) {
            electronConfig = estimateElectronConfiguration(element);
        }
        
        if (electronConfig) {
            // 電子配置から軌道データを抽出
            const orbitalPattern = /([1-7])([spdf])([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g;
            let match;
            
            while ((match = orbitalPattern.exec(electronConfig)) !== null) {
                const n = parseInt(match[1]); // 主量子数
                const l = match[2]; // 角運動量量子数（軌道タイプ）
                const count = parseUnicodeSuperscript(match[3]); // 電子数
                
                config.orbitals.push({
                    n: n,
                    l: l,
                    electrons: count
                });
            }
        } else {
            // 電子配置データがない場合は原子番号から簡易生成
            config.orbitals = generateOrbitalsFromNumber(element.number);
        }
        
        // キャッシング用のログ
        console.log(`${element.name}の電子配置解析完了:`, config.orbitals.length, '軌道');
        console.timeEnd('電子配置解析');
        
        return config;
    } catch (error) {
        console.error('電子配置解析エラー:', error);
        console.timeEnd('電子配置解析');
        
        // エラー時は簡易データを返す
        return {
            element: element.name,
            symbol: element.symbol,
            atomicNumber: element.number,
            shells: element.electronsPerShell || [],
            orbitals: generateOrbitalsFromNumber(element.number)
        };
    }
}

/**
 * 上付き文字の数値をパース
 * @param {string} superscript - 上付き文字
 * @returns {number} 数値
 */
function parseUnicodeSuperscript(superscript) {
    const map = {
        '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5,
        '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9, '⁰': 0
    };
    
    let result = '';
    for (let i = 0; i < superscript.length; i++) {
        result += map[superscript[i]] !== undefined ? map[superscript[i]] : superscript[i];
    }
    
    return parseInt(result);
}

/**
 * 原子番号から軌道データを生成
 * @param {number} atomicNumber - 原子番号
 * @returns {Array} 軌道データの配列
 */
function generateOrbitalsFromNumber(atomicNumber) {
    // 簡易版の電子配置生成（最適化）
    const fillOrder = [
        {n: 1, l: 's', max: 2},
        {n: 2, l: 's', max: 2},
        {n: 2, l: 'p', max: 6},
        {n: 3, l: 's', max: 2},
        {n: 3, l: 'p', max: 6},
        {n: 4, l: 's', max: 2},
        {n: 3, l: 'd', max: 10},
        {n: 4, l: 'p', max: 6},
        {n: 5, l: 's', max: 2},
        {n: 4, l: 'd', max: 10},
        {n: 5, l: 'p', max: 6},
        {n: 6, l: 's', max: 2},
        {n: 4, l: 'f', max: 14},
        {n: 5, l: 'd', max: 10},
        {n: 6, l: 'p', max: 6},
        {n: 7, l: 's', max: 2}
    ];
    
    // 表示を高速化するため、超重元素の場合は簡略化
    const maxFillIndex = atomicNumber > 86 ? 15 : fillOrder.length;
    
    // 電子を配置
    let electronCount = atomicNumber;
    const orbitals = [];
    
    for (let i = 0; i < maxFillIndex && electronCount > 0; i++) {
        const orbital = fillOrder[i];
        const electrons = Math.min(electronCount, orbital.max);
        electronCount -= electrons;
        
        if (electrons > 0) {
            orbitals.push({
                n: orbital.n,
                l: orbital.l,
                electrons: electrons
            });
        }
    }
    
    return orbitals;
}

/**
 * 電子配置タブを更新
 * @param {Object} element - 元素データ
 */
function updateElectronConfigTab(element) {
    const container = document.getElementById('electron-configuration');
    if (!container) return;
    
    try {
        // 電子配置データを生成
        const config = {
            element: element.name,
            symbol: element.symbol,
            atomicNumber: element.number,
            electronConfiguration: element.electronConfiguration,
            shells: element.electronsPerShell
        };
        
        // HTML生成
        container.innerHTML = ElectronConfiguration.generateHTML(config);
    } catch (error) {
        console.error('電子配置タブ更新エラー:', error);
        container.innerHTML = `
            <div class="tech-placeholder">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                <p>電子配置の表示に失敗しました: ${error.message}</p>
            </div>
        `;
    }
}