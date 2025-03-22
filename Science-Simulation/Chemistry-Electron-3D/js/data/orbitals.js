/**
 * 電子軌道データ
 * 各軌道タイプの形状と特性を定義
 */
const orbitalsData = {
    // s軌道: 球形
    's': {
        type: 's',
        name: 's軌道',
        description: '球形の対称的な軌道で、すべての方向に等しい確率で電子が存在します。',
        shape: 'sphere',
        maxElectrons: 2, // s軌道は最大2電子
        color: '#ff5252', // 赤色
        radius: 1.0,
        geometryParams: {
            radius: 1.0,
            widthSegments: 32,
            heightSegments: 32
        }
    },
    
    // p軌道: ダンベル型（3方向）
    'p': {
        type: 'p',
        name: 'p軌道',
        description: 'ダンベル型の軌道で、x, y, z方向の3種類があります。各p軌道は2電子を収容でき、合計で6電子が入ります。',
        shape: 'dumbbell',
        maxElectrons: 6, // p軌道全体で最大6電子（各方向に2電子）
        orbitals: [
            {
                subtype: 'px',
                name: 'px軌道',
                description: 'x軸方向に伸びるp軌道',
                color: '#4caf50', // 緑色
                direction: [1, 0, 0],
                scale: [1.5, 0.5, 0.5]
            },
            {
                subtype: 'py',
                name: 'py軌道',
                description: 'y軸方向に伸びるp軌道',
                color: '#2196f3', // 青色
                direction: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
            },
            {
                subtype: 'pz',
                name: 'pz軌道',
                description: 'z軸方向に伸びるp軌道',
                color: '#9c27b0', // 紫色
                direction: [0, 0, 1],
                scale: [0.5, 0.5, 1.5]
            }
        ]
    },
    
    // d軌道: より複雑な形状（5種類）
    'd': {
        type: 'd',
        name: 'd軌道',
        description: '複雑な形状を持つ5種類の軌道があり、合計で10電子を収容できます。遷移金属元素の特性に関与します。',
        shape: 'complex',
        maxElectrons: 10, // d軌道全体で最大10電子（各種類に2電子）
        orbitals: [
            {
                subtype: 'dxy',
                name: 'dxy軌道',
                description: 'xy平面に4つのローブを持つ軌道',
                color: '#ffc107', // 黄色
                // 実際の3D表現ではより複雑な形状を定義
                geometryParams: {
                    type: 'dxy',
                    scale: 1.2
                }
            },
            {
                subtype: 'dyz',
                name: 'dyz軌道',
                description: 'yz平面に4つのローブを持つ軌道',
                color: '#ff9800', // オレンジ
                geometryParams: {
                    type: 'dyz',
                    scale: 1.2
                }
            },
            {
                subtype: 'dxz',
                name: 'dxz軌道',
                description: 'xz平面に4つのローブを持つ軌道',
                color: '#ff5722', // 深いオレンジ
                geometryParams: {
                    type: 'dxz',
                    scale: 1.2
                }
            },
            {
                subtype: 'dx2-y2',
                name: 'dx²-y²軌道',
                description: 'x軸とy軸に沿って4つのローブを持つ軌道',
                color: '#cddc39', // ライム
                geometryParams: {
                    type: 'dx2-y2',
                    scale: 1.2
                }
            },
            {
                subtype: 'dz2',
                name: 'dz²軌道',
                description: 'z軸に沿ったドーナツ型の軌道',
                color: '#03a9f4', // 水色
                geometryParams: {
                    type: 'dz2',
                    scale: 1.2
                }
            }
        ]
    },
    
    // f軌道: 非常に複雑な形状（7種類）
    'f': {
        type: 'f',
        name: 'f軌道',
        description: '非常に複雑な形状を持つ7種類の軌道があり、合計で14電子を収容できます。ランタノイドやアクチノイド元素の特性に関与します。',
        shape: 'very-complex',
        maxElectrons: 14, // f軌道全体で最大14電子（各種類に2電子）
        orbitals: [
            {
                subtype: 'fz3',
                name: 'fz³軌道',
                color: '#e91e63', // ピンク
                geometryParams: {
                    type: 'fz3',
                    scale: 1.3
                }
            },
            {
                subtype: 'fxz2',
                name: 'fxz²軌道',
                color: '#9e9e9e', // グレー
                geometryParams: {
                    type: 'fxz2',
                    scale: 1.3
                }
            },
            {
                subtype: 'fyz2',
                name: 'fyz²軌道',
                color: '#607d8b', // 青グレー
                geometryParams: {
                    type: 'fyz2',
                    scale: 1.3
                }
            },
            {
                subtype: 'fxyz',
                name: 'fxyz軌道',
                color: '#3f51b5', // インディゴ
                geometryParams: {
                    type: 'fxyz',
                    scale: 1.3
                }
            },
            {
                subtype: 'fx(x2-3y2)',
                name: 'fx(x²-3y²)軌道',
                color: '#009688', // ティール
                geometryParams: {
                    type: 'fx(x2-3y2)',
                    scale: 1.3
                }
            },
            {
                subtype: 'fy(3x2-y2)',
                name: 'fy(3x²-y²)軌道',
                color: '#8bc34a', // ライトグリーン
                geometryParams: {
                    type: 'fy(3x2-y2)',
                    scale: 1.3
                }
            },
            {
                subtype: 'fz(x2-y2)',
                name: 'fz(x²-y²)軌道',
                color: '#ffeb3b', // 明るい黄色
                geometryParams: {
                    type: 'fz(x2-y2)',
                    scale: 1.3
                }
            }
        ]
    }
};

// 各シェル（主量子数）のエネルギーレベル情報
const shellsData = [
    {
        n: 1,
        name: 'K殻',
        description: '最初のエネルギー準位（n=1）で、最も原子核に近い殻です。',
        maxElectrons: 2,
        radius: 1.0,
        availableOrbitals: ['s']
    },
    {
        n: 2,
        name: 'L殻',
        description: '2番目のエネルギー準位（n=2）です。',
        maxElectrons: 8,
        radius: 2.0,
        availableOrbitals: ['s', 'p']
    },
    {
        n: 3,
        name: 'M殻',
        description: '3番目のエネルギー準位（n=3）です。',
        maxElectrons: 18,
        radius: 3.0,
        availableOrbitals: ['s', 'p', 'd']
    },
    {
        n: 4,
        name: 'N殻',
        description: '4番目のエネルギー準位（n=4）です。',
        maxElectrons: 32,
        radius: 4.0,
        availableOrbitals: ['s', 'p', 'd', 'f']
    },
    {
        n: 5,
        name: 'O殻',
        description: '5番目のエネルギー準位（n=5）です。',
        maxElectrons: 32, // 理論上は50ですが、既知の元素では32まで
        radius: 5.0,
        availableOrbitals: ['s', 'p', 'd', 'f']
    },
    {
        n: 6,
        name: 'P殻',
        description: '6番目のエネルギー準位（n=6）です。',
        maxElectrons: 18, // 既知の元素では18まで
        radius: 6.0,
        availableOrbitals: ['s', 'p', 'd']
    },
    {
        n: 7,
        name: 'Q殻',
        description: '7番目のエネルギー準位（n=7）です。',
        maxElectrons: 8, // 既知の元素では8まで
        radius: 7.0,
        availableOrbitals: ['s', 'p']
    }
];