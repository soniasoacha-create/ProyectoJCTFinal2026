import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = () => {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('user');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }
  const isAuthenticated = !!localStorage.getItem('token');
  const role = user?.rol || user?.tipo_usuario || '';
  const isStaff = role === 'administrador' || role === 'moderador';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const homeRoute = '/';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div className="container-fluid">
        {/* Logo/Marca */}
        <Link className="navbar-brand fw-bold" to={homeRoute}>
          <span style={{ fontSize: '1.5rem' }}>🏨</span> Hotel El Sol
        </Link>

        {/* Botón toggle mobile */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Inicio
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/reservas">
                    Reservas
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/facturacion">
                    Facturación
                  </Link>
                </li>

                {isStaff ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/recepcion">
                        Recepción
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/habitaciones">
                        Hospedaje
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/servicios">
                        Servicios
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/tipos-habitacion">
                        Tipos Habitación
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/usuarios">
                        Usuarios
                      </Link>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <Link className="nav-link" to="/perfil">
                      Mi Perfil
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* Usuario/Login */}
          <div className="d-flex gap-2 ms-3 align-items-center">
            {isAuthenticated ? (
              <>
                <span className="text-light small d-none d-md-inline">
                  👤 {user?.nombre || user?.nombres || 'Usuario'}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={handleLogout}
                >
                  🚪 Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light">
                  🔐 Ingresar
                </Link>
                <Link to="/register" className="btn btn-primary">
                  📝 Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;