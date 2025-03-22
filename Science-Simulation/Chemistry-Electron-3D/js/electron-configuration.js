/**
 * 電子配置表示クラス
 */
class ElectronConfiguration {
    /**
     * 電子配置表示用のHTML生成
     * @param {Object} config - 電子配置データ
     * @returns {string} HTML文字列
     */
    static generateHTML(config) {
        if (!config) return '<div class="tech-placeholder">データがありません</div>';
        
        const { element, symbol, atomicNumber, electronConfiguration, shells } = config;
        
        // 簡略化した電子配置を取得
        const formattedConfig = this.formatElectronConfiguration(electronConfiguration);
        
        // 殻ごとの電子数表示
        const shellsHTML = shells && shells.length > 0 ? 
            this.generateShellsHTML(shells) : '';
        
        // 軌道の説明テキスト
        const explanation = this.getOrbitalExplanation(atomicNumber);
        
        return `
            <div class="tech-electron-header">
                <h3 class="tech-electron-title">${element} (${symbol}) の電子配置</h3>
            </div>
            
            <div class="tech-electron-details">
                <div class="tech-electron-detail">
                    <i class="fas fa-atom"></i>
                    <span>原子番号: ${atomicNumber}</span>
                </div>
                <div class="tech-electron-detail">
                    <i class="fas fa-layer-group"></i>
                    <span>電子殻数: ${shells ? shells.length : 'N/A'}</span>
                </div>
                <div class="tech-electron-detail">
                    <i class="fas fa-electron"></i>
                    <span>総電子数: ${atomicNumber}</span>
                </div>
            </div>
            
            <div class="tech-config-notation">
                ${formattedConfig}
            </div>
            
            ${shellsHTML}
            
            ${explanation ? `
                <div class="tech-orbital-explanation">
                    <p>${explanation}</p>
                </div>
            ` : ''}
        `;
    }
    
    /**
     * 電子配置文字列のフォーマット
     * @param {string} config - 電子配置文字列
     * @returns {string} 装飾されたHTML
     */
    static formatElectronConfiguration(config) {
        if (!config) return 'N/A';
        
        // 核種表記を分離
        const hasNobleCoreNotation = config.includes('[');
        let formattedConfig = config;
        
        if (hasNobleCoreNotation) {
            // [Xe]6s2 のような表記を分解
            const parts = config.match(/\[(.*?)\](.*)/);
            if (parts && parts.length >= 3) {
                const coreNotation = parts[1];
                const remainingConfig = parts[2];
                
                formattedConfig = `<span class="tech-noble-core">[${coreNotation}]</span>${this.colorizeOrbitals(remainingConfig)}`;
            }
        } else {
            formattedConfig = this.colorizeOrbitals(config);
        }
        
        return formattedConfig;
    }
    
    /**
     * 軌道タイプによって色分け
     * @param {string} config - 電子配置文字列
     * @returns {string} 色分けされたHTML
     */
    static colorizeOrbitals(config) {
        if (!config) return '';
        
        // 正規表現でs, p, d, f軌道をマッチ
        return config.replace(/(\d+)([spdf])(\d+)/g, (match, n, orbital, electrons) => {
            const orbitalClass = `tech-orbital tech-orbital-${orbital}`;
            return `<span class="${orbitalClass}">${n}${orbital}<sup>${electrons}</sup></span>`;
        });
    }
    
    /**
     * 電子殻表示用HTML生成
     * @param {Array} shells - 各殻の電子数配列
     * @returns {string} HTML文字列
     */
    static generateShellsHTML(shells) {
        if (!shells || shells.length === 0) return '';
        
        const shellsItems = shells.map((electrons, index) => {
            const shellNumber = index + 1;
            return `
                <div class="tech-shell">
                    <div class="tech-shell-number">${shellNumber}</div>
                    <div class="tech-shell-electrons">${electrons}e<sup>-</sup></div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="tech-shells-container">
                <div class="tech-shells-title">
                    <i class="fas fa-circle-dot"></i>
                    電子殻の電子分布
                </div>
                <div class="tech-shells-grid">
                    ${shellsItems}
                </div>
            </div>
        `;
    }
    
    /**
     * 原子番号に基づいて軌道の説明を生成
     * @param {number} atomicNumber - 原子番号
     * @returns {string} 説明テキスト
     */
    static getOrbitalExplanation(atomicNumber) {
        if (!atomicNumber) return '';
        
        // 周期に基づいた説明
        let period = 0;
        if (atomicNumber <= 2) period = 1;
        else if (atomicNumber <= 10) period = 2;
        else if (atomicNumber <= 18) period = 3;
        else if (atomicNumber <= 36) period = 4;
        else if (atomicNumber <= 54) period = 5;
        else if (atomicNumber <= 86) period = 6;
        else period = 7;
        
        // 最外殻の軌道タイプ
        let outerOrbital = 's';
        if (period >= 2) {
            if ((atomicNumber > 4 && atomicNumber <= 10) || 
                (atomicNumber > 12 && atomicNumber <= 18) || 
                (atomicNumber > 30 && atomicNumber <= 36) || 
                (atomicNumber > 48 && atomicNumber <= 54) || 
                (atomicNumber > 80 && atomicNumber <= 86)) {
                outerOrbital = 'p';
            } else if ((atomicNumber > 20 && atomicNumber <= 30) || 
                       (atomicNumber > 38 && atomicNumber <= 48) || 
                       (atomicNumber > 72 && atomicNumber <= 80) || 
                       (atomicNumber > 104)) {
                outerOrbital = 'd';
            } else if ((atomicNumber > 56 && atomicNumber <= 72) || 
                       (atomicNumber > 88 && atomicNumber <= 104)) {
                outerOrbital = 'f';
            }
        }
        
        // 電子数から安定性を判断
        let stability = '';
        if (atomicNumber === 2 || atomicNumber === 10 || atomicNumber === 18 || 
            atomicNumber === 36 || atomicNumber === 54 || atomicNumber === 86) {
            stability = '完全に満たされた電子殻を持ち、非常に安定した電子配置です。';
        } else if ((atomicNumber - 1) % 8 === 0) {
            stability = '外殻の電子が1つだけで、反応性が高い電子配置です。';
        } else if ((atomicNumber - 2) % 8 === 0) {
            stability = '外殻に2つの電子を持ち、比較的安定した電子配置です。';
        } else if ((atomicNumber - 7) % 8 === 0) {
            stability = '外殻に7つの電子を持ち、1つの電子を受け入れる傾向があります。';
        }
        
        return `この元素は周期表の第${period}周期に位置し、最外殻では主に${outerOrbital}軌道に電子が配置されています。${stability}`;
    }
}

// グローバルに公開
window.ElectronConfiguration = ElectronConfiguration; 