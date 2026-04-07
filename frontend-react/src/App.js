import React, { Suspense, lazy } from "react"; 
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Habitaciones = lazy(() => import('./components/Habitaciones'));
const Reservas = lazy(() => import('./components/Reservas'));
const Facturacion = lazy(() => import('./components/Facturacion'));
const Servicios = lazy(() => import('./components/Servicios'));
const TiposHabitacion = lazy(() => import('./components/TiposHabitacion'));
const AdminReportes = lazy(() => import('./components/AdminReportes'));
const ReservaServicios = lazy(() => import('./components/ReservaServicios'));
const UserForm = lazy(() => import('./components/UserForm'));
const ClientePerfil = lazy(() => import('./pages/ClientePerfil'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));

function App() {
  const isAuthenticated = () => !!localStorage.getItem('token');

  const getUserRole = () => {
    try { const u = JSON.parse(localStorage.getItem('user') || 'null') || {}; return u.rol || u.tipo_usuario || ''; }
    catch { return ''; }
  };

  const Private = ({ element }) =>
    isAuthenticated() ? element : <Navigate to="/login" />;

  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas */}
          <Route path="/habitaciones"      element={<Private element={<Habitaciones />} />} />
          <Route path="/reservas"          element={<Private element={<Reservas />} />} />
          <Route path="/facturacion"       element={<Private element={<Facturacion />} />} />
          <Route path="/servicios"         element={<Private element={<Servicios />} />} />
          <Route path="/tipos-habitacion"  element={<Private element={<TiposHabitacion />} />} />
          <Route path="/recepcion"         element={<Private element={<AdminReportes />} />} />
          <Route path="/reserva-servicios" element={<Private element={<ReservaServicios />} />} />
          <Route path="/usuarios"          element={<Private element={<UsuariosPage />} />} />
          <Route path="/perfil"            element={<Private element={getUserRole() === 'cliente' ? <ClientePerfil /> : <UserForm />} />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;