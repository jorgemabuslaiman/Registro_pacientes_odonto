// utils/excelUtils.js
// Aquí irá la lógica para importar y exportar pacientes desde/hacia Excel
// Se recomienda usar la librería 'xlsx' para leer archivos Excel en React

import * as XLSX from 'xlsx';

export function importarPacientesDesdeExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const pacientes = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      resolve(pacientes);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}


// pacientes: array de pacientes (cada uno puede tener odontogramaExcel)

// Nueva versión: acepta workbookOriginal además de pacientes
export function exportarPacientesAExcel(pacientes, workbookOriginal) {
  // Hoja de Pacientes (sin odontogramaExcel ni odontograma)
  const pacientesSheet = pacientes.map(({ odontogramaExcel, odontograma, ...rest }) => rest);
  const wsPacientes = XLSX.utils.json_to_sheet(pacientesSheet);

  // Hoja de Odontogramas
  let odos = [];
  pacientes.forEach(p => {
    if (Array.isArray(p.odontogramaExcel)) {
      odos = odos.concat(p.odontogramaExcel.map(o => ({ ...o, ID_Paciente: p.ID })));
    } else if (p.odontograma) {
      Object.entries(p.odontograma).forEach(([diente, caras]) => {
        Object.entries(caras).forEach(([cara, det]) => {
          odos.push({
            ID_Paciente: p.ID,
            Diente: diente,
            Cara: cara,
            Color: det.color || '',
            Simbolo: det.simbolo || '',
            Observacion: det.observacion || ''
          });
        });
      });
    }
  });
  const wsOdo = XLSX.utils.json_to_sheet(odos);

  // Si se provee el workbook original, lo clonamos y reemplazamos solo las hojas necesarias
  let wb;
  if (workbookOriginal) {
    // Clonar el workbook original para no modificar el objeto original
    wb = XLSX.read(XLSX.write(workbookOriginal, { bookType: 'xlsx', type: 'array' }), { type: 'array' });
    // Reemplazar o agregar la hoja Pacientes
    XLSX.utils.book_append_sheet(wb, wsPacientes, 'Pacientes', true);
    // Reemplazar o agregar la hoja Odontogramas
    XLSX.utils.book_append_sheet(wb, wsOdo, 'Odontogramas', true);
  } else {
    // Si no hay workbook original, crear uno nuevo
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsPacientes, 'Pacientes');
    XLSX.utils.book_append_sheet(wb, wsOdo, 'Odontogramas');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pacientes_odontograma.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
