import React from 'react';
import Tooth from './Tooth';
import '../styles/Dientes.css';


const renderToothRow = (numbers, odontograma, onToothChange, readOnly) => (
  <div className="tooth-row">
    {numbers.map((num) => (
      <Tooth
        key={num}
        number={num}
        areas={odontograma[num] || { top: '', bottom: '', left: '', right: '', center: '' }}
        onChange={onToothChange ? (areas) => onToothChange(num, areas) : undefined}
        readOnly={readOnly}
      />
    ))}
  </div>
);


const Odontograma = ({ odontograma, onChange, readOnly }) => {
  const handleToothChange = onChange
    ? (number, areas) => {
        onChange({
          ...odontograma,
          [number]: areas
        });
      }
    : undefined;

  return (
    <div className="odontograma-container">
      {/* Parte superior permanente */}
      {renderToothRow([18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], odontograma, handleToothChange, readOnly)}
      {/* Parte inferior permanente */}
      {renderToothRow([48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], odontograma, handleToothChange, readOnly)}
      <div style={{ height: "20px" }}></div>
      {/* Parte superior temporal */}
      {renderToothRow([55, 54, 53, 52, 51, 61, 62, 63, 64, 65], odontograma, handleToothChange, readOnly)}
      {/* Parte inferior temporal */}
      {renderToothRow([85, 84, 83, 82, 81, 71, 72, 73, 74, 75], odontograma, handleToothChange, readOnly)}
    </div>
  );
};

export default Odontograma;