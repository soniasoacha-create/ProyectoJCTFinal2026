import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ paddingTop: '70px' }}>
    <div className="text-center px-3">
      <div style={{ fontSize: '4rem' }}>🧭</div>
      <h1 className="display-5 fw-bold">404</h1>
      <p className="text-muted mb-4">No encontramos la ruta que intentas abrir.</p>
      <div className="d-flex gap-2 justify-content-center">
        <Link to="/" className="btn btn-outline-secondary">
          Volver al inicio
        </Link>
        <Link to="/login" className="btn btn-primary">
          Ir a login
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
