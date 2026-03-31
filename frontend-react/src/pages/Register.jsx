import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import authService from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    tipo_usuario: 'cliente'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) newErrors.nombres = 'El nombre es requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'El apellido es requerido';
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
    if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.register({
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono,
        tipo_usuario: formData.tipo_usuario
      });

      if (response) {
        // Mostrar éxito
        alert('✅ Cuenta creada exitosamente. Ahora puedes ingresar.');
        navigate('/login');
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error al registrar la cuenta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light" style={{ paddingTop: '60px' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-success text-white text-center py-4">
                <h3 className="mb-0">🏨 Hotel El Sol</h3>
                <p className="small mb-0 mt-2">Crear Nueva Cuenta</p>
              </div>

              <div className="card-body p-5">
                <form onSubmit={handleSubmit}>
                  {/* Error General */}
                  {errors.form && (
                    <div className="alert alert-danger mb-4">
                      <strong>⚠️</strong> {errors.form}
                    </div>
                  )}

                  <div className="row">
                    {/* Nombres */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Nombres</label>
                      <input 
                        type="text"
                        name="nombres"
                        className={`form-control form-control-lg ${errors.nombres ? 'is-invalid' : ''}`}
                        placeholder="Juan"
                        value={formData.nombres}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.nombres && <div className="invalid-feedback">{errors.nombres}</div>}
                    </div>

                    {/* Apellidos */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Apellidos</label>
                      <input 
                        type="text"
                        name="apellidos"
                        className={`form-control form-control-lg ${errors.apellidos ? 'is-invalid' : ''}`}
                        placeholder="Pérez"
                        value={formData.apellidos}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.apellidos && <div className="invalid-feedback">{errors.apellidos}</div>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input 
                      type="email"
                      name="email"
                      className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Teléfono */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Teléfono</label>
                    <input 
                      type="tel"
                      name="telefono"
                      className={`form-control form-control-lg ${errors.telefono ? 'is-invalid' : ''}`}
                      placeholder="+57 310 XXX XXXX"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
                  </div>

                  {/* Contraseña */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Contraseña</label>
                    <input 
                      type="password"
                      name="password"
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  {/* Confirmar Contraseña */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Confirmar Contraseña</label>
                    <input 
                      type="password"
                      name="confirmPassword"
                      className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                  </div>

                  {/* Botón */}
                  <button 
                    type="submit"
                    className="btn btn-success btn-lg w-100 fw-bold mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Registrando...
                      </>
                    ) : (
                      '📝 Crear Cuenta'
                    )}
                  </button>

                  {/* Link a login */}
                  <div className="text-center">
                    <p className="text-muted">¿Ya tienes cuenta?</p>
                    <Link to="/login" className="btn btn-outline-success w-100 fw-bold">
                      🔐 Ingresar
                    </Link>
                  </div>
                </form>

                {/* Volver */}
                <div className="mt-4 text-center">
                  <Link to="/" className="text-muted text-decoration-none">
                    ← Volver al Inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
