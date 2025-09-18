import React, { useState } from 'react';
import { Container, Table, Button, Form, Modal } from 'react-bootstrap';
import { exportarPacientesAExcel } from '../utils/excelUtils';
import * as XLSX from 'xlsx';
import Odontograma from '../components/Odontograma';

function PatientList() {
  const [pacientes, setPacientes] = useState([]);
  const [workbookOriginal, setWorkbookOriginal] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [detallePaciente, setDetallePaciente] = useState(null);
  const [odoDetalle, setOdoDetalle] = useState({});
  const [errorArchivo, setErrorArchivo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showOdo, setShowOdo] = useState(false);
  const [pacienteActual, setPacienteActual] = useState(null);
  const [editData, setEditData] = useState({});
  const [odoData, setOdoData] = useState({});

  // Historia clínica
  const [showHistoria, setShowHistoria] = useState(false);
  const [historiaPaciente, setHistoriaPaciente] = useState(null);
  const [nuevaIntervencion, setNuevaIntervencion] = useState('');
  // Filtros para "Ver más"
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFin, setFiltroFin] = useState('');

  // Agregar paciente nuevo (ID secuencial)
  const handleAddPaciente = () => {
    const maxID = pacientes.length > 0 ? Math.max(...pacientes.map(p => Number(p.ID) || 0)) : 0;
    const nuevo = {
      ID: maxID + 1,
      Nombre: '',
      Apellido: '',
      DNI: '',
      odontograma: {},
      odontogramaExcel: [],
      historialClinico: []
    };
    setPacientes([...pacientes, nuevo]);
    setPacienteActual(nuevo);
    setEditData(nuevo);
    setShowEdit(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorArchivo('');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      setWorkbookOriginal(workbook);
      const sheetPacientes = workbook.Sheets['Pacientes'] || workbook.Sheets[workbook.SheetNames[0]];
      const sheetOdo = workbook.Sheets['Odontogramas'];
      const sheetHistoria = workbook.Sheets['HistoriaClinica'];
      if (!sheetPacientes) {
        setErrorArchivo('No se encontró la hoja "Pacientes" en el archivo.');
        setPacientes([]);
        return;
      }
      let pacientes = XLSX.utils.sheet_to_json(sheetPacientes, { defval: '' });
      // IDs secuenciales al importar
      pacientes = pacientes.map((p, idx) => ({
        ...p,
        ID: idx + 1,
        odontograma: {},
        odontogramaExcel: [],
        historialClinico: []
      }));
      // Validar columnas requeridas
      const columnasRequeridas = ['ID', 'Nombre', 'Apellido', 'DNI'];
      const columnasArchivo = Object.keys(pacientes[0] || {});
      const faltantes = columnasRequeridas.filter(col => !columnasArchivo.includes(col));
      if (faltantes.length > 0) {
        setErrorArchivo('Faltan columnas requeridas en el Excel: ' + faltantes.join(', '));
        setPacientes([]);
        return;
      }
      let odontos = [];
      if (sheetOdo) {
        odontos = XLSX.utils.sheet_to_json(sheetOdo, { defval: '' });
      }
      // Asociar odontogramas por ID_Paciente
      const pacientesConOdo = pacientes.map(p => {
        const odo = odontos.filter(o => o.ID_Paciente == p.ID);
        return { ...p, odontogramaExcel: odo };
      });

      // Leer historia clínica y asociar a cada paciente
      let historia = [];
      if (sheetHistoria) {
        historia = XLSX.utils.sheet_to_json(sheetHistoria, { defval: '' });
      }
      const pacientesConHistoria = pacientesConOdo.map(p => ({
        ...p,
        historialClinico: historia
          .filter(h => String(h.ID_Paciente) === String(p.ID))
          .map(h => ({ fecha: h.Fecha, texto: h.Texto }))
      }));
      setPacientes(pacientesConHistoria);
    } catch (err) {
      setErrorArchivo('Error al leer el archivo: ' + err.message);
      setPacientes([]);
      console.error('Error al procesar Excel:', err);
    }
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const nombre = typeof p.Nombre === 'string' ? p.Nombre : (p.Nombre ? String(p.Nombre) : '');
    const apellido = typeof p.Apellido === 'string' ? p.Apellido : (p.Apellido ? String(p.Apellido) : '');
    const dni = p.DNI !== undefined && p.DNI !== null ? String(p.DNI) : '';
    return (
      nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      dni.includes(busqueda)
    );
  });

  const handleEdit = (paciente) => {
    setEditData({ ...paciente });
    setPacienteActual(paciente);
    setShowEdit(true);
  };

  const handleOdo = (paciente) => {
    setPacienteActual(paciente);
    setOdoData(paciente.odontograma || {});
    setShowOdo(true);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    setPacientes(pacientes.map(p =>
      p === pacienteActual ? { ...editData, odontograma: pacienteActual.odontograma || {}, historialClinico: pacienteActual.historialClinico || [] } : p
    ));
    setShowEdit(false);
  };

  const handleOdoSave = () => {
    setPacientes(pacientes.map(p =>
      p === pacienteActual ? { ...p, odontograma: odoData } : p
    ));
    setShowOdo(false);
  };

  const handleVerMas = (paciente) => {
    setDetallePaciente(paciente);
    setOdoDetalle(
      paciente.odontogramaExcel && paciente.odontogramaExcel.length > 0
        ? paciente.odontogramaExcel.reduce((acc, o) => {
            const d = o.Diente || o.diente;
            const c = o.Cara || o.cara;
            if (!d || !c) return acc;
            if (!acc[d]) acc[d] = {};
            acc[d][c] = {
              color: o.Color || o.color || '',
              simbolo: o.Simbolo || o.simbolo || '',
              observacion: o.Observacion || o.observacion || ''
            };
            return acc;
          }, {})
        : {}
    );
    setFiltroInicio('');
    setFiltroFin('');
    setShowDetalle(true);
  };

  const handleOdoDetalleSave = () => {
    setPacientes(pacientes.map(p =>
      p === detallePaciente ? { ...p, odontogramaExcel: odoDetalle } : p
    ));
    setShowDetalle(false);
  };

  // Historia clínica
  const handleHistoriaClinica = (paciente) => {
    setHistoriaPaciente(paciente);
    setShowHistoria(true);
    setNuevaIntervencion('');
  };

  const handleAgregarIntervencion = () => {
    if (!nuevaIntervencion.trim()) return;
    const fecha = new Date().toISOString().slice(0, 10);
    const nueva = { fecha, texto: nuevaIntervencion };
    const nuevosPacientes = pacientes.map(p =>
      p === historiaPaciente
        ? { ...p, historialClinico: [{ ...nueva }, ...(p.historialClinico || [])] }
        : p
    );
    setPacientes(nuevosPacientes);
    // Actualizar historiaPaciente con el paciente actualizado
    const actualizado = nuevosPacientes.find(p => p === historiaPaciente || (p.ID && historiaPaciente && p.ID === historiaPaciente.ID));
    if (actualizado) setHistoriaPaciente(actualizado);
    setNuevaIntervencion('');
  };

  return (
    <Container>
      {errorArchivo && <div style={{color:'red', marginBottom:10}}>{errorArchivo}</div>}
      <h2>Listado de Pacientes</h2>
      <Button variant="primary" className="mb-3" onClick={handleAddPaciente}>
        Agregar Paciente
      </Button>
      <Button variant="success" className="mb-3" onClick={() => exportarPacientesAExcel(pacientes, workbookOriginal)} disabled={pacientes.length === 0}>
        Exportar a Excel
      </Button>
      <Form.Group className="mb-3">
        <Form.Label>Cargar pacientes desde Excel</Form.Label>
        <Form.Control type="file" accept=".xlsx,.xls,.xlsm" onChange={handleFileChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Buscar por nombre, apellido o DNI</Form.Label>
        <Form.Control
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </Form.Group>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th>Odontograma (Excel)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pacientesFiltrados.map((p, idx) => (
            <tr key={idx}>
              <td>{p.Nombre}</td>
              <td>{p.Apellido}</td>
              <td>{p.DNI}</td>
              <td>
                {Array.isArray(p.odontogramaExcel) && p.odontogramaExcel.length > 0
                  ? `${p.odontogramaExcel.length} registros`
                  : 'Sin datos'}
              </td>
              <td>
                <Button size="sm" variant="secondary" onClick={() => handleVerMas(p)} className="me-2">Ver más</Button>
                <Button size="sm" variant="primary" onClick={() => handleEdit(p)} className="me-2">Editar</Button>
                <Button size="sm" variant="info" onClick={() => handleOdo(p)} className="me-2">Odontograma</Button>
                <Button size="sm" variant="warning" onClick={() => handleHistoriaClinica(p)}>Historia clínica</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de detalles del paciente */}
      <Modal show={showDetalle} onHide={() => setShowDetalle(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Paciente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detallePaciente && (
            <div>
              <p><b>Nombre:</b> {detallePaciente.Nombre}</p>
              <p><b>Apellido:</b> {detallePaciente.Apellido}</p>
              <p><b>DNI:</b> {detallePaciente.DNI}</p>
              <hr />
              <h5>Odontograma</h5>
              <Odontograma odontograma={detallePaciente.odontograma || {}} readOnly />
              <hr />
              <h5>Historia clínica</h5>
              <Form.Group className="mb-3" style={{display:'flex', gap:8}}>
                <Form.Label>Filtrar por fecha:</Form.Label>
                <Form.Control type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} />
                <span>a</span>
                <Form.Control type="date" value={filtroFin} onChange={e => setFiltroFin(e.target.value)} />
              </Form.Group>
              <ul style={{maxHeight:200, overflowY:'auto', paddingLeft:18}}>
                {(detallePaciente?.historialClinico || [])
                  .filter(i => {
                    if (filtroInicio && i.fecha < filtroInicio) return false;
                    if (filtroFin && i.fecha > filtroFin) return false;
                    return true;
                  })
                  .map((i, idx) => (
                    <li key={idx}><b>{i.fecha}:</b> {i.texto}</li>
                  ))}
                {(!detallePaciente?.historialClinico || detallePaciente.historialClinico.length === 0) && (
                  <li style={{color:'#888'}}>Sin intervenciones registradas.</li>
                )}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalle(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar paciente */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Paciente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control name="Nombre" value={editData.Nombre || ''} onChange={handleEditChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellido</Form.Label>
              <Form.Control name="Apellido" value={editData.Apellido || ''} onChange={handleEditChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>DNI</Form.Label>
              <Form.Control name="DNI" value={editData.DNI || ''} onChange={handleEditChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleEditSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para odontograma interactivo */}
      <Modal show={showOdo} onHide={() => setShowOdo(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Odontograma de {pacienteActual?.Nombre} {pacienteActual?.Apellido}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Odontograma odontograma={odoData} onChange={setOdoData} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOdo(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleOdoSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para historia clínica */}
      <Modal show={showHistoria} onHide={() => setShowHistoria(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Historia clínica de {historiaPaciente?.Nombre} {historiaPaciente?.Apellido}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Agregar intervención</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={nuevaIntervencion}
              onChange={e => setNuevaIntervencion(e.target.value)}
              placeholder="Describa la intervención o medicación..."
            />
            <Button className="mt-2" variant="success" onClick={handleAgregarIntervencion}>Agregar</Button>
          </Form.Group>
          <hr />
          <div>
            <b>Intervenciones recientes:</b>
            <ul style={{maxHeight:300, overflowY:'auto', paddingLeft:18}}>
              {(historiaPaciente?.historialClinico || []).map((i, idx) => (
                <li key={idx}>
                  <b>{i.fecha}:</b> {i.texto}
                </li>
              ))}
              {(!historiaPaciente?.historialClinico || historiaPaciente.historialClinico.length === 0) && (
                <li style={{color:'#888'}}>Sin intervenciones registradas.</li>
              )}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoria(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default PatientList;