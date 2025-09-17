import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

// Caras posibles
const CARAS = ['V', 'D', 'M', 'L', 'O'];

// Dientes ejemplo (puedes expandir a todos los dientes que necesites)
const DIENTES = [18, 17, 16, 15, 14, 13, 12, 11];

export default function OdontogramaEditor({ odontograma, onChange }) {
  // odontograma: { [diente]: { [cara]: { color, simbolo } } }
  const [data, setData] = useState(odontograma || {});

  const handleEdit = (diente, cara, field, value) => {
    setData(prev => {
      const nuevo = { ...prev };
      if (!nuevo[diente]) nuevo[diente] = {};
      if (!nuevo[diente][cara]) nuevo[diente][cara] = {};
      nuevo[diente][cara][field] = value;
      // Si no hay color ni símbolo, elimina la cara
      if (!nuevo[diente][cara].color && !nuevo[diente][cara].simbolo) {
        delete nuevo[diente][cara];
        if (Object.keys(nuevo[diente]).length === 0) delete nuevo[diente];
      }
      return { ...nuevo };
    });
  };

  React.useEffect(() => {
    onChange && onChange(data);
  }, [data, onChange]);

  return (
    <div>
      <Table bordered size="sm">
        <thead>
          <tr>
            <th>Diente</th>
            {CARAS.map(cara => <th key={cara}>{cara}</th>)}
          </tr>
        </thead>
        <tbody>
          {DIENTES.map(diente => (
            <tr key={diente}>
              <td>{diente}</td>
              {CARAS.map(cara => (
                <td key={cara}>
                  <Form.Control
                    type="color"
                    title="Color"
                    value={data[diente]?.[cara]?.color || '#ffffff'}
                    onChange={e => handleEdit(diente, cara, 'color', e.target.value)}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Símbolo"
                    value={data[diente]?.[cara]?.simbolo || ''}
                    onChange={e => handleEdit(diente, cara, 'simbolo', e.target.value)}
                    style={{ marginTop: 2, fontSize: '0.8em' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{fontSize:'0.9em', color:'#888'}}>Solo se guardan las caras con color o símbolo.</div>
    </div>
  );
}
