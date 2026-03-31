import React, { useEffect, useMemo, useState } from 'react';
import reservasService from '../services/reservasService';
import reservaServiciosService from '../services/reservaServiciosService';
import habitacionesService from '../services/habitacionesService';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const toNumber = (value) => {
  const normalized = String(value ?? '0').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => (
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(toNumber(value))
);

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('es-CO');
};

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const AdminReportes = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.rol || user.tipo_usuario || '';
  const isAdmin = role === 'administrador' || role === 'moderador';

  const fetchReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reservasResponse, habitacionesResponse] = await Promise.all([
        reservasService.getAllReservas(),
        habitacionesService.getAllHabitaciones(),
      ]);

      const arr = toArray(reservasResponse);
      const habitaciones = toArray(habitacionesResponse);
      const numeroPorHabitacionId = new Map(
        habitaciones.map((h) => [Number(h.id_habitacion), h.numero_habitacion])
      );

      const promesas = arr.map(async (r) => {
        try {
          const serviciosResponse = await reservaServiciosService.obtenerConsumosPorReserva(r.id_reserva || r.id);
          const servicios = toArray(serviciosResponse);
          const sumaServicios = servicios.reduce(
            (acc, serv) => acc + toNumber(serv.subtotal ?? serv.total ?? serv.precio ?? serv.costo),
            0
          );

          const idHabitacion = Number(r.id_habitacion);
          const numeroHabitacion = numeroPorHabitacionId.get(idHabitacion) ?? r.numero_habitacion ?? 'N/A';

          return { ...r, numero_habitacion: numeroHabitacion, servicios, sumaServicios };
        } catch {
          const idHabitacion = Number(r.id_habitacion);
          const numeroHabitacion = numeroPorHabitacionId.get(idHabitacion) ?? r.numero_habitacion ?? 'N/A';
          return { ...r, numero_habitacion: numeroHabitacion, servicios: [], sumaServicios: 0 };
        }
      });

      const conServicios = await Promise.all(promesas);
      setReservas(conServicios);
    } catch (err) {
      setError('No se pudieron cargar las reservas de administración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  const resumen = useMemo(() => {
    return reservas.reduce((acc, reserva) => {
      const alojamiento = toNumber(reserva.precio_total);
      const servicios = toNumber(reserva.sumaServicios);
      acc.alojamiento += alojamiento;
      acc.servicios += servicios;
      acc.total += alojamiento + servicios;
      return acc;
    }, { alojamiento: 0, servicios: 0, total: 0 });
  }, [reservas]);

  const exportarCsv = () => {
    if (!reservas.length) return;

    const headers = [
      'ID Reserva',
      'Usuario',
      'Habitacion',
      'Checkin',
      'Checkout',
      'Precio Alojamiento',
      'Monto Servicios',
      'Total Ajustado',
      'Estado',
      'Detalle Servicios',
    ];

    const rows = reservas.map((reserva) => {
      const detalleServicios = (reserva.servicios || []).map((servicio) => {
        const nombre = servicio.nombre_servicio || servicio.nombre || 'Servicio';
        const cantidad = toNumber(servicio.cantidad || 1);
        const subtotal = toNumber(servicio.subtotal ?? servicio.total ?? servicio.precio ?? servicio.costo);
        return `${nombre} x${cantidad} (${subtotal})`;
      }).join(' | ');

      return [
        reserva.id_reserva || reserva.id,
        reserva.nombre_usuario || reserva.email || 'N/A',
        reserva.numero_habitacion || 'N/A',
        formatDate(reserva.fecha_checkin),
        formatDate(reserva.fecha_checkout),
        toNumber(reserva.precio_total),
        toNumber(reserva.sumaServicios),
        toNumber(reserva.precio_total) + toNumber(reserva.sumaServicios),
        reserva.estado_reserva || reserva.estado || 'pendiente',
        detalleServicios,
      ].map(escapeCsv).join(';');
    });

    rows.push([
      'TOTALES',
      '',
      '',
      '',
      '',
      resumen.alojamiento,
      resumen.servicios,
      resumen.total,
      '',
      '',
    ].map(escapeCsv).join(';'));

    const csv = [headers.map(escapeCsv).join(';'), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-reservas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarPdf = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">No tiene permisos para acceder a Reportes.</div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="card shadow-sm p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <h2 className="mb-0">Panel de Reportes (Administrador/Moderador)</h2>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={exportarPdf} disabled={!reservas.length}>
              Exportar PDF
            </button>
            <button className="btn btn-success" onClick={exportarCsv} disabled={!reservas.length}>
              Exportar Excel
            </button>
          </div>
        </div>

        {loading && <div className="alert alert-info">Cargando reservas...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && reservas.length === 0 && (
          <div className="alert alert-warning">No hay reservas registradas.</div>
        )}

        {!loading && reservas.length > 0 && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body">
                    <div className="text-muted small text-uppercase">Alojamiento</div>
                    <div className="fs-5 fw-bold">{formatCurrency(resumen.alojamiento)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body">
                    <div className="text-muted small text-uppercase">Servicios</div>
                    <div className="fs-5 fw-bold">{formatCurrency(resumen.servicios)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body">
                    <div className="text-muted small text-uppercase">Total General</div>
                    <div className="fs-5 fw-bold text-success">{formatCurrency(resumen.total)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Habitación</th>
                    <th>Checkin</th>
                    <th>Checkout</th>
                    <th>Precio Alojamiento</th>
                    <th>Servicios</th>
                    <th>Total (ajustado)</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => (
                    <tr key={reserva.id_reserva || reserva.id}>
                      <td>{reserva.id_reserva || reserva.id}</td>
                      <td>{reserva.nombre_usuario || reserva.email || 'N/A'}</td>
                      <td>{reserva.numero_habitacion || 'N/A'}</td>
                      <td>{formatDate(reserva.fecha_checkin)}</td>
                      <td>{formatDate(reserva.fecha_checkout)}</td>
                      <td>{formatCurrency(reserva.precio_total)}</td>
                      <td>{formatCurrency(reserva.sumaServicios)}</td>
                      <td>{formatCurrency(toNumber(reserva.precio_total) + toNumber(reserva.sumaServicios))}</td>
                      <td>{reserva.estado_reserva || reserva.estado || 'pendiente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReportes;
