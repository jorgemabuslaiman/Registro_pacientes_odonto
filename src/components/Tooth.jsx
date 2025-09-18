import React, { useState } from 'react';
import '../styles/Dientes.css';


const Tooth = ({ number, areas, onChange, readOnly }) => {
  const [selectedArea, setSelectedArea] = useState(null);

  const handleAreaClick = (area, event) => {
    if (readOnly) return;
    event.stopPropagation();
    setSelectedArea({ area, x: event.clientX, y: event.clientY });
  };

  const applyColor = (color) => {
    if (selectedArea && !readOnly) {
      onChange({ ...areas, [selectedArea.area]: color });
      setSelectedArea(null);
    }
  };

  return (
    <div className="tooth-container">
      <div className="tooth" onClick={() => setSelectedArea(null)}>
        <div className="area top" onClick={(e) => handleAreaClick('top', e)} style={{ backgroundColor: areas.top }}></div>
        <div className="area bottom" onClick={(e) => handleAreaClick('bottom', e)} style={{ backgroundColor: areas.bottom }}></div>
        <div className="area left" onClick={(e) => handleAreaClick('left', e)} style={{ backgroundColor: areas.left }}></div>
        <div className="area right" onClick={(e) => handleAreaClick('right', e)} style={{ backgroundColor: areas.right }}></div>
        <div className="area center" onClick={(e) => handleAreaClick('center', e)} style={{ backgroundColor: areas.center }}></div>
      </div>
      <div className="tooth-number">{number}</div>
      {selectedArea && !readOnly && (
        <div className="color-popup" style={{ top: selectedArea.y, left: selectedArea.x }}>
          <button onClick={() => applyColor('red')}>🔴 Rojo</button>
          <button onClick={() => applyColor('blue')}>🔵 Azul</button>
          <button onClick={() => applyColor('')}>🧼 Borrar</button>
        </div>
      )}
    </div>
  );
};

export default Tooth;