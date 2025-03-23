import React, { useState, useEffect, useRef } from 'react';

const PeriodicTable = () => {
  // State to track which element is being hovered
  const [hoveredElement, setHoveredElement] = useState(null);
  // State to track popup position
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  // Reference to the popup element
  const popupRef = useRef(null);
  // Reference to the container
  const containerRef = useRef(null);
  
  // Element data with properties
  const elements = [
    // Group 1 (Alkali Metals)
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal', group: 1, period: 1, mass: 1.008, electrons: [1], electronConfig: '1s¹', color: '#FFBC42' },
    { symbol: 'Li', name: 'Lithium', atomicNumber: 3, category: 'alkali-metal', group: 1, period: 2, mass: 6.94, electrons: [2, 1], electronConfig: '[He] 2s¹', color: '#FB3640' },
    { symbol: 'Na', name: 'Sodium', atomicNumber: 11, category: 'alkali-metal', group: 1, period: 3, mass: 22.990, electrons: [2, 8, 1], electronConfig: '[Ne] 3s¹', color: '#FB3640' },
    { symbol: 'K', name: 'Potassium', atomicNumber: 19, category: 'alkali-metal', group: 1, period: 4, mass: 39.098, electrons: [2, 8, 8, 1], electronConfig: '[Ar] 4s¹', color: '#FB3640' },
    { symbol: 'Rb', name: 'Rubidium', atomicNumber: 37, category: 'alkali-metal', group: 1, period: 5, mass: 85.468, electrons: [2, 8, 18, 8, 1], electronConfig: '[Kr] 5s¹', color: '#FB3640' },
    { symbol: 'Cs', name: 'Cesium', atomicNumber: 55, category: 'alkali-metal', group: 1, period: 6, mass: 132.91, electrons: [2, 8, 18, 18, 8, 1], electronConfig: '[Xe] 6s¹', color: '#FB3640' },
    { symbol: 'Fr', name: 'Francium', atomicNumber: 87, category: 'alkali-metal', group: 1, period: 7, mass: 223, electrons: [2, 8, 18, 32, 18, 8, 1], electronConfig: '[Rn] 7s¹', color: '#FB3640' },
    
    // Group 2 (Alkaline Earth Metals)
    { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, category: 'alkaline-earth', group: 2, period: 2, mass: 9.0122, electrons: [2, 2], electronConfig: '[He] 2s²', color: '#E16036' },
    { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, category: 'alkaline-earth', group: 2, period: 3, mass: 24.305, electrons: [2, 8, 2], electronConfig: '[Ne] 3s²', color: '#E16036' },
    { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, category: 'alkaline-earth', group: 2, period: 4, mass: 40.078, electrons: [2, 8, 8, 2], electronConfig: '[Ar] 4s²', color: '#E16036' },
    { symbol: 'Sr', name: 'Strontium', atomicNumber: 38, category: 'alkaline-earth', group: 2, period: 5, mass: 87.62, electrons: [2, 8, 18, 8, 2], electronConfig: '[Kr] 5s²', color: '#E16036' },
    { symbol: 'Ba', name: 'Barium', atomicNumber: 56, category: 'alkaline-earth', group: 2, period: 6, mass: 137.33, electrons: [2, 8, 18, 18, 8, 2], electronConfig: '[Xe] 6s²', color: '#E16036' },
    { symbol: 'Ra', name: 'Radium', atomicNumber: 88, category: 'alkaline-earth', group: 2, period: 7, mass: 226, electrons: [2, 8, 18, 32, 18, 8, 2], electronConfig: '[Rn] 7s²', color: '#E16036' },
    
    // Group 3-12 (Transition Metals) - Adding a selection for brevity
    { symbol: 'Sc', name: 'Scandium', atomicNumber: 21, category: 'transition-metal', group: 3, period: 4, mass: 44.956, electrons: [2, 8, 9, 2], electronConfig: '[Ar] 3d¹ 4s²', color: '#3D5A80' },
    { symbol: 'Ti', name: 'Titanium', atomicNumber: 22, category: 'transition-metal', group: 4, period: 4, mass: 47.867, electrons: [2, 8, 10, 2], electronConfig: '[Ar] 3d² 4s²', color: '#3D5A80' },
    { symbol: 'Fe', name: 'Iron', atomicNumber: 26, category: 'transition-metal', group: 8, period: 4, mass: 55.845, electrons: [2, 8, 14, 2], electronConfig: '[Ar] 3d⁶ 4s²', color: '#3D5A80' },
    { symbol: 'Cu', name: 'Copper', atomicNumber: 29, category: 'transition-metal', group: 11, period: 4, mass: 63.546, electrons: [2, 8, 18, 1], electronConfig: '[Ar] 3d¹⁰ 4s¹', color: '#3D5A80' },
    { symbol: 'Ag', name: 'Silver', atomicNumber: 47, category: 'transition-metal', group: 11, period: 5, mass: 107.87, electrons: [2, 8, 18, 18, 1], electronConfig: '[Kr] 4d¹⁰ 5s¹', color: '#3D5A80' },
    { symbol: 'Au', name: 'Gold', atomicNumber: 79, category: 'transition-metal', group: 11, period: 6, mass: 196.97, electrons: [2, 8, 18, 32, 18, 1], electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', color: '#3D5A80' },
    
    // Group 13-16 (Main Group Elements) - Adding a selection
    { symbol: 'B', name: 'Boron', atomicNumber: 5, category: 'metalloid', group: 13, period: 2, mass: 10.81, electrons: [2, 3], electronConfig: '[He] 2s² 2p¹', color: '#9BC53D' },
    { symbol: 'Al', name: 'Aluminum', atomicNumber: 13, category: 'post-transition', group: 13, period: 3, mass: 26.982, electrons: [2, 8, 3], electronConfig: '[Ne] 3s² 3p¹', color: '#9BC53D' },
    { symbol: 'C', name: 'Carbon', atomicNumber: 6, category: 'nonmetal', group: 14, period: 2, mass: 12.011, electrons: [2, 4], electronConfig: '[He] 2s² 2p²', color: '#FFBC42' },
    { symbol: 'Si', name: 'Silicon', atomicNumber: 14, category: 'metalloid', group: 14, period: 3, mass: 28.085, electrons: [2, 8, 4], electronConfig: '[Ne] 3s² 3p²', color: '#9BC53D' },
    { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, category: 'nonmetal', group: 15, period: 2, mass: 14.007, electrons: [2, 5], electronConfig: '[He] 2s² 2p³', color: '#FFBC42' },
    { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, category: 'nonmetal', group: 15, period: 3, mass: 30.974, electrons: [2, 8, 5], electronConfig: '[Ne] 3s² 3p³', color: '#FFBC42' },
    { symbol: 'O', name: 'Oxygen', atomicNumber: 8, category: 'nonmetal', group: 16, period: 2, mass: 15.999, electrons: [2, 6], electronConfig: '[He] 2s² 2p⁴', color: '#FFBC42' },
    { symbol: 'S', name: 'Sulfur', atomicNumber: 16, category: 'nonmetal', group: 16, period: 3, mass: 32.06, electrons: [2, 8, 6], electronConfig: '[Ne] 3s² 3p⁴', color: '#FFBC42' },
    
    // Group 17 (Halogens)
    { symbol: 'F', name: 'Fluorine', atomicNumber: 9, category: 'halogen', group: 17, period: 2, mass: 18.998, electrons: [2, 7], electronConfig: '[He] 2s² 2p⁵', color: '#7BC950' },
    { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, category: 'halogen', group: 17, period: 3, mass: 35.45, electrons: [2, 8, 7], electronConfig: '[Ne] 3s² 3p⁵', color: '#7BC950' },
    { symbol: 'Br', name: 'Bromine', atomicNumber: 35, category: 'halogen', group: 17, period: 4, mass: 79.904, electrons: [2, 8, 18, 7], electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', color: '#7BC950' },
    { symbol: 'I', name: 'Iodine', atomicNumber: 53, category: 'halogen', group: 17, period: 5, mass: 126.90, electrons: [2, 8, 18, 18, 7], electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', color: '#7BC950' },
    { symbol: 'At', name: 'Astatine', atomicNumber: 85, category: 'halogen', group: 17, period: 6, mass: 210, electrons: [2, 8, 18, 32, 18, 7], electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', color: '#7BC950' },
    
    // Group 18 (Noble Gases)
    { symbol: 'He', name: 'Helium', atomicNumber: 2, category: 'noble-gas', group: 18, period: 1, mass: 4.0026, electrons: [2], electronConfig: '1s²', color: '#5BC0EB' },
    { symbol: 'Ne', name: 'Neon', atomicNumber: 10, category: 'noble-gas', group: 18, period: 2, mass: 20.180, electrons: [2, 8], electronConfig: '[He] 2s² 2p⁶', color: '#5BC0EB' },
    { symbol: 'Ar', name: 'Argon', atomicNumber: 18, category: 'noble-gas', group: 18, period: 3, mass: 39.948, electrons: [2, 8, 8], electronConfig: '[Ne] 3s² 3p⁶', color: '#5BC0EB' },
    { symbol: 'Kr', name: 'Krypton', atomicNumber: 36, category: 'noble-gas', group: 18, period: 4, mass: 83.798, electrons: [2, 8, 18, 8], electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', color: '#5BC0EB' },
    { symbol: 'Xe', name: 'Xenon', atomicNumber: 54, category: 'noble-gas', group: 18, period: 5, mass: 131.29, electrons: [2, 8, 18, 18, 8], electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', color: '#5BC0EB' },
    { symbol: 'Rn', name: 'Radon', atomicNumber: 86, category: 'noble-gas', group: 18, period: 6, mass: 222, electrons: [2, 8, 18, 32, 18, 8], electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', color: '#5BC0EB' },

    // Lanthanides (Selection)
    { symbol: 'La', name: 'Lanthanum', atomicNumber: 57, category: 'lanthanide', group: 3, period: 6, mass: 138.91, electrons: [2, 8, 18, 18, 9, 2], electronConfig: '[Xe] 5d¹ 6s²', color: '#6457A6' },
    { symbol: 'Ce', name: 'Cerium', atomicNumber: 58, category: 'lanthanide', group: 3, period: 6, mass: 140.12, electrons: [2, 8, 18, 19, 9, 2], electronConfig: '[Xe] 4f¹ 5d¹ 6s²', color: '#6457A6' },
    { symbol: 'Eu', name: 'Europium', atomicNumber: 63, category: 'lanthanide', group: 3, period: 6, mass: 151.96, electrons: [2, 8, 18, 25, 8, 2], electronConfig: '[Xe] 4f⁷ 6s²', color: '#6457A6' },

    // Actinides (Selection)
    { symbol: 'Ac', name: 'Actinium', atomicNumber: 89, category: 'actinide', group: 3, period: 7, mass: 227, electrons: [2, 8, 18, 32, 18, 9, 2], electronConfig: '[Rn] 6d¹ 7s²', color: '#764AF1' },
    { symbol: 'Th', name: 'Thorium', atomicNumber: 90, category: 'actinide', group: 3, period: 7, mass: 232.04, electrons: [2, 8, 18, 32, 18, 10, 2], electronConfig: '[Rn] 6d² 7s²', color: '#764AF1' },
    { symbol: 'U', name: 'Uranium', atomicNumber: 92, category: 'actinide', group: 3, period: 7, mass: 238.03, electrons: [2, 8, 18, 32, 21, 9, 2], electronConfig: '[Rn] 5f³ 6d¹ 7s²', color: '#764AF1' },
  ];

  // Update popup position when element is hovered
  useEffect(() => {
    if (hoveredElement && popupRef.current) {
      const updatePosition = (e) => {
        const container = containerRef.current.getBoundingClientRect();
        const popup = popupRef.current.getBoundingClientRect();
        
        // Calculate available space in all directions
        const spaceRight = window.innerWidth - e.clientX;
        const spaceBottom = window.innerHeight - e.clientY;
        
        // Default positions
        let left = e.clientX - container.left + 10;
        let top = e.clientY - container.top + 10;
        
        // Adjust if too close to right edge
        if (spaceRight < popup.width + 20) {
          left = e.clientX - container.left - popup.width - 10;
        }
        
        // Adjust if too close to bottom edge
        if (spaceBottom < popup.height + 20) {
          top = e.clientY - container.top - popup.height - 10;
        }
        
        setPopupPosition({ top, left });
      };
      
      // Initial position
      const element = document.querySelector(`[data-element="${hoveredElement.atomicNumber}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const event = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        updatePosition(event);
      }
      
      // Update on mouse move
      document.addEventListener('mousemove', updatePosition);
      return () => document.removeEventListener('mousemove', updatePosition);
    }
  }, [hoveredElement]);

  // Function to get element position in the grid
  const getElementPosition = (element) => {
    // Lanthanides and Actinides are positioned at the bottom
    if (element.category === 'lanthanide') {
      return { gridColumn: (element.atomicNumber - 54), gridRow: 8 };
    } else if (element.category === 'actinide') {
      return { gridColumn: (element.atomicNumber - 86), gridRow: 9 };
    }
    // Regular positioning based on group and period
    return { gridColumn: element.group, gridRow: element.period };
  };

  // Get background color based on category
  const getCategoryColor = (category) => {
    const colors = {
      'alkali-metal': '#FB3640',
      'alkaline-earth': '#E16036',
      'transition-metal': '#3D5A80',
      'post-transition': '#9BC53D',
      'metalloid': '#9BC53D',
      'nonmetal': '#FFBC42',
      'halogen': '#7BC950',
      'noble-gas': '#5BC0EB',
      'lanthanide': '#6457A6',
      'actinide': '#764AF1'
    };
    return colors[category] || '#CCCCCC';
  };

  // Get category name for display
  const getCategoryName = (category) => {
    const names = {
      'alkali-metal': 'Alkali Metal',
      'alkaline-earth': 'Alkaline Earth Metal',
      'transition-metal': 'Transition Metal',
      'post-transition': 'Post-Transition Metal',
      'metalloid': 'Metalloid',
      'nonmetal': 'Nonmetal',
      'halogen': 'Halogen',
      'noble-gas': 'Noble Gas',
      'lanthanide': 'Lanthanide',
      'actinide': 'Actinide'
    };
    return names[category] || category;
  };

  // Atom orbital animation component
  const AtomAnimation = ({ element }) => {
    // Create orbital paths based on electron configuration
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white">
          {element.atomicNumber}
        </div>
        {element.electrons.map((shellElectrons, shellIndex) => (
          <div 
            key={shellIndex}
            className="absolute rounded-full border border-gray-400 flex items-center justify-center"
            style={{
              width: `${(shellIndex + 1) * 40}px`,
              height: `${(shellIndex + 1) * 40}px`,
              animation: `spin${shellIndex % 2 === 0 ? '' : 'Reverse'} ${3 + shellIndex}s linear infinite`
            }}
          >
            {Array.from({ length: Math.min(shellElectrons, 8) }, (_, i) => {
              // Position electrons around the orbit
              const angle = (i * (360 / Math.min(shellElectrons, 8))) * (Math.PI / 180);
              const radius = ((shellIndex + 1) * 20);
              const left = Math.cos(angle) * radius + radius;
              const top = Math.sin(angle) * radius + radius;
              
              return (
                <div 
                  key={i}
                  className="absolute w-2 h-2 bg-blue-500 rounded-full"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Element details component shown on hover
  const ElementDetails = ({ element }) => {
    if (!element) return null;
    
    const categoryColor = getCategoryColor(element.category);
    
    return (
      <div 
        ref={popupRef}
        className="absolute p-0 bg-white shadow-xl rounded-lg border border-gray-200 z-50 w-72 overflow-hidden"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          transition: 'all 0.2s ease-out'
        }}
      >
        <div className="p-3" style={{ backgroundColor: categoryColor + '33' /* 20% opacity */ }}>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-3xl font-bold">{element.symbol}</span>
              <span className="text-xl ml-2 text-gray-700">#{element.atomicNumber}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">{element.name}</div>
              <div className="text-sm text-gray-600">{getCategoryName(element.category)}</div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <div className="text-sm text-gray-500">原子質量</div>
              <div className="font-medium">{element.mass} u</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">電子配置</div>
              <div className="font-mono text-sm">{element.electronConfig}</div>
            </div>
          </div>
          
          <div className="h-40 w-full relative mt-4 border-t pt-3">
            <AtomAnimation element={element} />
          </div>
        </div>
      </div>
    );
  };

  // Get text color for element based on background darkness
  const getTextColor = (backgroundColor) => {
    // Dark backgrounds need light text
    const darkBackgrounds = ['#3D5A80', '#6457A6', '#764AF1'];
    return darkBackgrounds.includes(backgroundColor) ? 'text-white' : 'text-gray-900';
  };

  return (
    <div className="p-4 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Interactive Periodic Table</h1>
      <p className="text-center mb-8 text-gray-600">Hover over an element to see details and atomic structure</p>
      
      {/* The Periodic Table Grid */}
      <div ref={containerRef} className="relative mx-auto max-w-6xl bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-18 gap-1">
          {elements.map((element) => {
            const position = getElementPosition(element);
            const bgColor = element.color || getCategoryColor(element.category);
            const textColorClass = getTextColor(bgColor);
            
            return (
              <div
                key={element.atomicNumber}
                data-element={element.atomicNumber}
                className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md ${textColorClass}`}
                style={{
                  backgroundColor: bgColor,
                  gridColumn: position.gridColumn,
                  gridRow: position.gridRow,
                }}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <div className="text-xs text-right w-full pr-1 opacity-80">{element.atomicNumber}</div>
                <div className="text-xl font-bold">{element.symbol}</div>
                <div className="text-xs">{element.name}</div>
              </div>
            );
          })}
        </div>
        
        {/* Element details popup on hover */}
        {hoveredElement && (
          <ElementDetails element={hoveredElement} />
        )}
      </div>
      
      {/* Legend for categories */}
      <div className="mt-8 py-4 px-6 bg-white rounded-xl shadow-sm mx-auto max-w-4xl">
        <h2 className="text-center text-lg font-medium mb-4 text-gray-700">元素分類</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#FB3640' }}></div>
            <span className="text-sm">アルカリ金属</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#E16036' }}></div>
            <span className="text-sm">アルカリ土類金属</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#3D5A80' }}></div>
            <span className="text-sm">遷移金属</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#9BC53D' }}></div>
            <span className="text-sm">その他の金属・半金属</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#FFBC42' }}></div>
            <span className="text-sm">非金属</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#7BC950' }}></div>
            <span className="text-sm">ハロゲン</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#5BC0EB' }}></div>
            <span className="text-sm">希ガス</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#6457A6' }}></div>
            <span className="text-sm">ランタノイド</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: '#764AF1' }}></div>
            <span className="text-sm">アクチノイド</span>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .grid-cols-18 {
          grid-template-columns: repeat(18, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
};

export default PeriodicTable;