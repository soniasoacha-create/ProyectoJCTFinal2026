import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import authService from '../services/authService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(email, password);
            if (response) {
                const { token, user } = response;

            localStorage.setItem("token", token);
            localStorage.setItem("rol", user.rol);

        // Redirección según rol
        if (user.rol === "administrador") {
            window.location.href = "/recepcion";
        } else if (user.rol === "moderador") {
            window.location.href = "/recepcion";
        } else {
            window.location.href = "/reservas";
        }
    }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center bg-light" style={{ paddingTop: '60px' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <div className="card shadow-lg border-0">
                            <div className="card-header bg-primary text-white text-center py-4">
                                <h3 className="mb-0">🏨 Hotel El Sol</h3>
                                <p className="small mb-0 mt-2">Ingresa a tu cuenta</p>
                            </div>

                            <div className="card-body p-5">
                                <form onSubmit={handleLogin}>
                                    {/* Email */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control form-control-lg"
                                            placeholder="tu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            required
                                        />
                                        <small className="text-muted">Usa el email con el que te registraste</small>
                                    </div>

                                    {/* Contraseña */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Contraseña</label>
                                        <input 
                                            type="password" 
                                            className="form-control form-control-lg"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="alert alert-danger mb-4" role="alert">
                                            <strong>⚠️ Error:</strong> {error}
                                        </div>
                                    )}

                                    {/* Botón */}
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg w-100 fw-bold mb-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Ingresando...
                                            </>
                                        ) : (
                                            '🔐 Ingresar'
                                        )}
                                    </button>

                                    {/* Link a registro */}
                                    <div className="text-center">
                                        <p className="text-muted">¿No tienes cuenta?</p>
                                        <Link to="/register" className="btn btn-outline-primary w-100 fw-bold">
                                            📝 Crear una Nueva Cuenta
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

                        {/* Info */}
                        <div className="mt-4 text-center text-muted small">
                            <p>Si olvidaste tu contraseña, contáctanos a hotelelsol@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;