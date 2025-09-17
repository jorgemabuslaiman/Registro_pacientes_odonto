import React from 'react';

export default function Odontograma({ paciente }) {
  // Aquí irá el diseño visual del odontograma y la lógica para registrar trabajos en los dientes
  return (
    <div>
      <h3>Odontograma de {paciente?.nombre || 'Paciente'}</h3>
      <p>Próximamente: diseño visual de dientes y registro de trabajos.</p>
    </div>
  );
}
