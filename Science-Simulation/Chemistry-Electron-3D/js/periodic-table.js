/**
 * 周期表クラス
 */
class PeriodicTable {
    /**
     * コンストラクタ
     * @param {string} containerId - 周期表を表示するコンテナのID
     * @param {Array} elementsData - 元素データの配列
     * @param {function} onElementSelect - 元素選択時のコールバック関数
     */
    constructor(containerId, elementsData, onElementSelect) {
        this.container = document.getElementById(containerId);
        this.elementsData = elementsData;
        this.onElementSelect = onElementSelect;
        
        if (!this.container) {
            console.error(`コンテナ "${containerId}" が見つかりません`);
            return;
        }
        
        this.render();
    }
    
    /**
     * 周期表を描画
     */
    render() {
        this.container.innerHTML = '';
        this.container.classList.add('tech-periodic-table');
        
        // 周期表のグリッドを作成
        for (let row = 1; row <= 10; row++) {
            for (let col = 1; col <= 18; col++) {
                // 特定のセルは空白
                if (this.isEmptyCell(row, col)) {
                    this.createEmptyCell();
                    continue;
                }
                
                // ランタノイドとアクチノイド領域
                if (row === 9 && col >= 3 && col <= 17) {
                    const lanthanideNumber = col + 54;
                    const element = this.elementsData.find(elem => elem.number === lanthanideNumber);
                    if (element) {
                        this.createElementCell(element);
                    } else {
                        this.createEmptyCell();
                    }
                    continue;
                }
                
                if (row === 10 && col >= 3 && col <= 17) {
                    const actinideNumber = col + 86;
                    const element = this.elementsData.find(elem => elem.number === actinideNumber);
                    if (element) {
                        this.createElementCell(element);
                    } else {
                        this.createEmptyCell();
                    }
                    continue;
                }
                
                // 通常の元素を検索
                const element = this.findElementByPosition(row, col);
                if (element) {
                    this.createElementCell(element);
                } else {
                    this.createEmptyCell();
                }
            }
        }
    }
    
    /**
     * 位置から元素を検索
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {Object|null} 元素データまたはnull
     */
    findElementByPosition(row, col) {
        // ランタノイドとアクチノイドは別処理
        if ((row === 6 && col === 3) || (row === 7 && col === 3)) {
            return null;
        }
        
        return this.elementsData.find(element => {
            // ランタノイドとアクチノイドは別表示
            if (element.number >= 57 && element.number <= 71) {
                return false;
            }
            if (element.number >= 89 && element.number <= 103) {
                return false;
            }
            
            if (element.period === row) {
                if (row <= 2) {
                    // 周期1-2は特別なレイアウト
                    if (col === 1 || col === 18) {
                        return element.group === col;
                    }
                    return false;
                } else if (row >= 6) {
                    // 周期6-7はランタノイド/アクチノイドを考慮
                    if (col <= 2) {
                        return element.group === col;
                    } else if (col >= 4 && col <= 18) {
                        return element.group === col;
                    }
                    return false;
                } else {
                    // 通常の行
                    return element.group === col;
                }
            }
            return false;
        });
    }
    
    /**
     * セルが空かどうか判定
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {boolean} 空セルならtrue
     */
    isEmptyCell(row, col) {
        // 周期1-2のセル
        if (row <= 2 && col >= 2 && col <= 17) {
            return true;
        }
        
        // 周期3-5で特殊なセル
        if (row >= 3 && row <= 5) {
            if (col >= 3 && col <= 12 && row === 3) {
                return true;
            }
            if (col >= 3 && col <= 10 && row === 4) {
                return true;
            }
            if (col >= 3 && col <= 10 && row === 5) {
                return true;
            }
        }
        
        // ランタノイド/アクチノイドのプレースホルダー
        if ((row === 6 || row === 7) && col === 3) {
            return false;
        }
        
        // 空の行8
        if (row === 8) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 元素セルを作成
     * @param {Object} element - 元素データ
     */
    createElementCell(element) {
        if (!element) return;
        
        const cell = document.createElement('div');
        cell.className = 'tech-element';
        cell.dataset.element = element.name;
        cell.dataset.number = element.number;
        
        // カテゴリに基づいて色を設定
        cell.classList.add(this.getCategoryClass(element.category));
        
        cell.innerHTML = `
            <span class="tech-element-number">${element.number}</span>
            <span class="tech-element-symbol">${element.symbol}</span>
            <span class="tech-element-name">${element.name}</span>
        `;
        
        // クリックイベント
        cell.addEventListener('click', () => {
            if (typeof this.onElementSelect === 'function') {
                this.onElementSelect(element);
            }
        });
        
        this.container.appendChild(cell);
    }
    
    /**
     * 空セルを作成
     */
    createEmptyCell() {
        const cell = document.createElement('div');
        cell.className = 'tech-element-placeholder';
        this.container.appendChild(cell);
    }
    
    /**
     * 元素カテゴリに基づくCSSクラスを取得
     * @param {string} category - 元素カテゴリ
     * @returns {string} CSSクラス名
     */
    getCategoryClass(category) {
        if (!category) return 'unknown';
        
        const categoryMap = {
            'alkali metal': 'alkali-metal',
            'alkaline earth metal': 'alkaline-earth',
            'transition metal': 'transition',
            'post-transition metal': 'post-transition',
            'metalloid': 'metalloid',
            'nonmetal': 'nonmetal',
            'halogen': 'halogen',
            'noble gas': 'noble-gas',
            'lanthanide': 'lanthanide',
            'actinide': 'actinide'
        };
        
        return categoryMap[category] || 'unknown';
    }
}

// グローバルに公開
window.PeriodicTable = PeriodicTable;