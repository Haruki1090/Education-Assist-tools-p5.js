/**
 * 電子配置の計算と表示を担当するモジュール
 */

class ElectronConfiguration {
    /**
     * 元素の電子配置を計算する
     * @param {Object} element - 元素データオブジェクト
     * @returns {Object} 詳細な電子配置情報
     */
    static calculateConfiguration(element) {
        // すでに計算済みの配置がある場合はそれを使用
        if (element.electronConfiguration) {
            return this.parseConfiguration(element);
        }
        
        // 配置がない場合は原子番号から計算（簡易版）
        return this.calculateFromAtomicNumber(element.number);
    }
    
    /**
     * 原子番号から電子配置を計算する
     * @param {number} atomicNumber - 原子番号
     * @returns {Object} 詳細な電子配置情報
     */
    static calculateFromAtomicNumber(atomicNumber) {
        // 電子配置を格納する配列
        const shells = [];
        
        // 各シェルの最大電子数
        const shellMaxElectrons = [2, 8, 18, 32, 50, 72, 98];
        
        // 電子を詰めていく順序（実際の充填順序は複雑で、これは簡略化）
        const fillingOrder = [
            { n: 1, l: 's' }, // 1s
            { n: 2, l: 's' }, // 2s
            { n: 2, l: 'p' }, // 2p
            { n: 3, l: 's' }, // 3s
            { n: 3, l: 'p' }, // 3p
            { n: 4, l: 's' }, // 4s
            { n: 3, l: 'd' }, // 3d
            { n: 4, l: 'p' }, // 4p
            { n: 5, l: 's' }, // 5s
            { n: 4, l: 'd' }, // 4d
            { n: 5, l: 'p' }, // 5p
            { n: 6, l: 's' }, // 6s
            { n: 4, l: 'f' }, // 4f
            { n: 5, l: 'd' }, // 5d
            { n: 6, l: 'p' }, // 6p
            { n: 7, l: 's' }, // 7s
            { n: 5, l: 'f' }, // 5f
            { n: 6, l: 'd' }, // 6d
            { n: 7, l: 'p' }  // 7p
        ];
        
        // 各軌道の最大電子数
        const orbitalMaxElectrons = {
            's': 2,
            'p': 6,
            'd': 10,
            'f': 14
        };
        
        // 残りの電子数
        let remainingElectrons = atomicNumber;
        
        // 電子を軌道に詰めていく
        const orbitals = [];
        
        for (const orbital of fillingOrder) {
            if (remainingElectrons <= 0) break;
            
            const n = orbital.n;
            const l = orbital.l;
            const maxElectrons = orbitalMaxElectrons[l];
            
            // この軌道に入る電子数
            const electrons = Math.min(remainingElectrons, maxElectrons);
            remainingElectrons -= electrons;
            
            // シェル情報の取得または作成
            let shell = shells.find(s => s.n === n);
            if (!shell) {
                shell = {
                    n: n,
                    name: this.getShellName(n),
                    electrons: 0,
                    orbitals: []
                };
                shells.push(shell);
            }
            
            // 軌道情報を追加
            const orbitalInfo = {
                n: n,
                l: l,
                name: `${n}${l}`,
                electrons: electrons,
                maxElectrons: maxElectrons
            };
            
            shell.electrons += electrons;
            shell.orbitals.push(orbitalInfo);
            orbitals.push(orbitalInfo);
        }
        
        // シェルを主量子数でソート
        shells.sort((a, b) => a.n - b.n);
        
        // 電子配置文字列の生成
        const configStr = orbitals
            .map(orb => `${orb.n}${orb.l}${this.getSuperscript(orb.electrons)}`)
            .join(' ');
        
        return {
            atomicNumber: atomicNumber,
            totalElectrons: atomicNumber,
            shells: shells,
            orbitals: orbitals,
            configurationString: configStr,
            electronsPerShell: shells.map(s => s.electrons)
        };
    }
    
    /**
     * 既存の電子配置文字列を解析する
     * @param {Object} element - 元素データオブジェクト
     * @returns {Object} 詳細な電子配置情報
     */
    static parseConfiguration(element) {
        const configStr = element.electronConfiguration;
        const electronsPerShell = element.electronsPerShell || [];
        
        // 電子配置文字列からオービタル情報を抽出
        const orbitalRegex = /(\d+)([spdf])(?:(\d+)|([¹²³⁴⁵⁶⁷⁸⁹⁰]+))?/g;
        const orbitals = [];
        const shells = [];
        
        let match;
        while ((match = orbitalRegex.exec(configStr)) !== null) {
            const n = parseInt(match[1]);
            const l = match[2];
            
            // 電子数を取得（通常の上付き数字または Unicode 上付き数字）
            let electrons;
            if (match[3]) {
                electrons = parseInt(match[3]);
            } else if (match[4]) {
                electrons = this.parseUnicodeSuperscript(match[4]);
            } else {
                electrons = 1; // デフォルトは1
            }
            
            // 軌道情報を追加
            const orbitalInfo = {
                n: n,
                l: l,
                name: `${n}${l}`,
                electrons: electrons,
                maxElectrons: this.getOrbitalMaxElectrons(l)
            };
            
            orbitals.push(orbitalInfo);
            
            // シェル情報の取得または作成
            let shell = shells.find(s => s.n === n);
            if (!shell) {
                shell = {
                    n: n,
                    name: this.getShellName(n),
                    electrons: 0,
                    orbitals: []
                };
                shells.push(shell);
            }
            
            shell.electrons += electrons;
            shell.orbitals.push(orbitalInfo);
        }
        
        // シェルを主量子数でソート
        shells.sort((a, b) => a.n - b.n);
        
        return {
            atomicNumber: element.number,
            totalElectrons: element.number,
            shells: shells,
            orbitals: orbitals,
            configurationString: configStr,
            electronsPerShell: electronsPerShell.length > 0 ? electronsPerShell : shells.map(s => s.electrons)
        };
    }
    
    /**
     * Unicode 上付き数字を解析する
     * @param {string} superscript - Unicode 上付き数字
     * @returns {number} 数値
     */
    static parseUnicodeSuperscript(superscript) {
        const unicodeSuperscripts = {
            '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4,
            '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9
        };
        
        let result = '';
        for (let i = 0; i < superscript.length; i++) {
            const char = superscript[i];
            if (unicodeSuperscripts[char] !== undefined) {
                result += unicodeSuperscripts[char];
            }
        }
        
        return parseInt(result) || 1;
    }
    
    /**
     * 数値を上付き文字に変換する
     * @param {number} num - 数値
     * @returns {string} 上付き文字
     */
    static getSuperscript(num) {
        const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
        const numStr = num.toString();
        let result = '';
        
        for (let i = 0; i < numStr.length; i++) {
            const digit = parseInt(numStr[i]);
            result += superscripts[digit];
        }
        
        return result;
    }
    
    /**
     * 軌道の最大電子数を取得する
     * @param {string} orbital - 軌道タイプ（s, p, d, f）
     * @returns {number} 最大電子数
     */
    static getOrbitalMaxElectrons(orbital) {
        const maxElectrons = {
            's': 2,
            'p': 6,
            'd': 10,
            'f': 14
        };
        
        return maxElectrons[orbital] || 0;
    }
    
    /**
     * シェル名を取得する
     * @param {number} n - 主量子数
     * @returns {string} シェル名
     */
    static getShellName(n) {
        const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
        return `${shellNames[n-1]}殻`;
    }
    
    /**
     * 電子配置の HTML 表現を生成する
     * @param {Object} config - 電子配置情報
     * @returns {string} HTML 文字列
     */
    static generateHTML(config) {
        let html = '<div class="electron-config">';
        
        // 概要
        html += `<div class="config-summary">
            <p>原子番号: ${config.atomicNumber}</p>
            <p>電子総数: ${config.totalElectrons}</p>
            <p>電子配置: ${config.configurationString}</p>
            <p>各殻の電子数: ${config.electronsPerShell.join(', ')}</p>
        </div>`;
        
        // 詳細なシェル情報
        html += '<div class="shells-detail">';
        for (const shell of config.shells) {
            html += `<div class="shell">
                <h4>${shell.name} (n=${shell.n})</h4>
                <p>電子数: ${shell.electrons}</p>
                <div class="shell-orbitals">`;
            
            for (const orbital of shell.orbitals) {
                const fillPercent = (orbital.electrons / orbital.maxElectrons) * 100;
                html += `<div class="orbital">
                    <span class="orbital-name">${orbital.name}</span>
                    <div class="orbital-fill-bar">
                        <div class="fill" style="width: ${fillPercent}%"></div>
                    </div>
                    <span class="orbital-electrons">${orbital.electrons}/${orbital.maxElectrons}</span>
                </div>`;
            }
            
            html += '</div></div>';
        }
        html += '</div>';
        
        html += '</div>';
        return html;
    }
}