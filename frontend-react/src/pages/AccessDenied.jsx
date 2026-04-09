import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ paddingTop: '70px' }}>
    <div className="card border-0 shadow-sm" style={{ maxWidth: '560px', width: '100%' }}>
      <div className="card-body text-center p-5">
        <div style={{ fontSize: '3rem' }} className="mb-3">⛔</div>
        <h1 className="h3 fw-bold mb-2">Acceso denegado</h1>
        <p className="text-muted mb-4">
          Tu cuenta no tiene permisos para esta sección. Si necesitas acceso,
          solicita autorización a un administrador.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Link to="/" className="btn btn-outline-secondary">
            Ir al inicio
          </Link>
          <Link to="/reservas" className="btn btn-primary">
            Ir a reservas
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default AccessDenied;
