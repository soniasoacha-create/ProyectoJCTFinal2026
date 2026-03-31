import React from 'react';
import { Link } from 'react-router-dom';
import imgFondoHero from '../assets/img/hotel.jpg';
import imgMapaUbicacion from '../assets/img/mapa.png';
import imgRestaurante from '../assets/img/restaurante.jpg';
import imgHabSencilla from '../assets/img/sencilla.jpg';
import imgHabDoble from '../assets/img/vistahabitadoscamas.jpg';
import imgPiscina from '../assets/img/vistapicina.jpg';
import imgSillasEntrada from '../assets/img/sillascolorentrada.jpg';
import imgSpa from '../assets/img/spaybienestar.jpg';
import imgTours from '../assets/img/toursyactividades.jpg';

const habitaciones = [
  { img: imgHabSencilla, titulo: 'Habitación Sencilla',   desc: 'Confort y privacidad para el viajero individual.',           alt: 'Sencilla'   },
  { img: imgHabDoble,    titulo: 'Habitación Doble',       desc: 'Espaciosa y cómoda, ideal para parejas o amigos.',           alt: 'Doble'      },
  { img: imgPiscina,     titulo: 'Suite Vista Piscina',    desc: 'Lujo y relajación con acceso visual a nuestra piscina.',     alt: 'Piscina'    },
];

const servicios = [
  { img: imgRestaurante, titulo: 'Restaurante Gourmet',   desc: 'Desayunos completos y menú local de autor.',                 alt: 'Restaurante' },
  { img: imgSpa,         titulo: 'Spa y Bienestar',        desc: 'Masajes relajantes, sauna y tratamientos exclusivos.',       alt: 'Spa'         },
  { img: imgTours,       titulo: 'Tours Regionales',       desc: 'Explora Puente Piedra y sus alrededores con guía.',          alt: 'Tours'       },
];

const LandingPage = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${imgFondoHero})`,
          minHeight: '88vh',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div className="px-3">
          <p className="text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.25rem', color: '#f0c040', fontSize: '0.9rem' }}>
            Tabio, Cundinamarca
          </p>
          <h1 className="display-3 fw-bold mb-3" style={{ textShadow: '2px 3px 8px rgba(0,0,0,0.7)' }}>
            Hotel El Sol
          </h1>
          <p className="lead mb-4" style={{ maxWidth: '560px', margin: '0 auto 1.5rem', opacity: 0.92, fontSize: '1.25rem' }}>
            Tu oasis de descanso y hospitalidad en el corazón de la sabana.
          </p>
          <p className="fw-semibold mb-4" style={{ color: '#f0c040', letterSpacing: '0.06rem' }}>
            Hospedaje | Reservas | Facturación | Atención personalizada
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            {isAuthenticated ? (
              <Link to="/reservas" className="btn btn-warning btn-lg fw-bold px-4 rounded-pill shadow">
                Ver mis Reservas
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-warning btn-lg fw-bold px-4 rounded-pill shadow">
                  Reservar ahora
                </Link>
                <Link to="/registro" className="btn btn-outline-light btn-lg px-4 rounded-pill">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── SOBRE NOSOTROS ───────────────────────────────────────────── */}
      <section className="py-5 bg-white">
        <div className="container py-3">
          <div className="row align-items-center g-5">
            <div className="col-md-6">
              <img
                src={imgSillasEntrada}
                alt="Entrada del hotel"
                className="img-fluid rounded-4 shadow"
                style={{ objectFit: 'cover', maxHeight: '420px', width: '100%' }}
              />
            </div>
            <div className="col-md-6">
              <p className="text-uppercase fw-semibold mb-2" style={{ color: '#e6a817', letterSpacing: '0.2rem', fontSize: '0.85rem' }}>
                Quiénes somos
              </p>
              <h2 className="fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '2.2rem' }}>
                Tu oasis de tranquilidad
              </h2>
              <p className="text-secondary" style={{ lineHeight: '1.9', fontSize: '1.05rem' }}>
                En <strong>Hotel El Sol</strong> combinamos confort moderno con la calidez de la atención personalizada.
                Ideal para familias, parejas y viajeros de negocios que buscan una experiencia auténtica en Puente Piedra.
              </p>
              <div className="row g-3 mt-3">
                {[['🏊', 'Piscina'], ['🍽️', 'Restaurante'], ['💆', 'Spa'], ['🌿', 'Jardines']].map(([icon, label]) => (
                  <div className="col-6" key={label}>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                      <span className="fw-semibold text-secondary">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HABITACIONES ─────────────────────────────────────────────── */}
      <section id="habitaciones" className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container py-3">
          <div className="text-center mb-5">
            <p className="text-uppercase fw-semibold mb-1" style={{ color: '#e6a817', letterSpacing: '0.2rem', fontSize: '0.85rem' }}>
              Alojamiento
            </p>
            <h2 className="fw-bold" style={{ color: '#2c3e50', fontSize: '2.4rem' }}>Nuestras Habitaciones</h2>
          </div>
          <div className="row g-4 justify-content-center">
            {habitaciones.map(({ img, titulo, desc, alt }) => (
              <div className="col-sm-10 col-md-6 col-lg-4" key={titulo}>
                <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                  <img src={img} alt={alt} className="card-img-top" style={{ height: '220px', objectFit: 'cover' }} />
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>{titulo}</h5>
                    <p className="text-secondary mb-3" style={{ fontSize: '0.95rem' }}>{desc}</p>
                    <Link to={isAuthenticated ? '/reservas' : '/login'} className="btn btn-sm btn-outline-warning fw-semibold rounded-pill px-3">
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ────────────────────────────────────────────────── */}
      <section id="servicios" className="py-5 bg-white">
        <div className="container py-3">
          <div className="text-center mb-5">
            <p className="text-uppercase fw-semibold mb-1" style={{ color: '#e6a817', letterSpacing: '0.2rem', fontSize: '0.85rem' }}>
              Experiencias
            </p>
            <h2 className="fw-bold" style={{ color: '#2c3e50', fontSize: '2.4rem' }}>Servicios del Hotel</h2>
          </div>
          <div className="row g-4 justify-content-center">
            {servicios.map(({ img, titulo, desc, alt }) => (
              <div className="col-sm-10 col-md-4" key={titulo}>
                <div className="text-center">
                  <div className="mx-auto mb-3 rounded-circle overflow-hidden shadow" style={{ width: 160, height: 160, border: '4px solid #f0c040' }}>
                    <img src={img} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h5 className="fw-bold" style={{ color: '#2c3e50' }}>{titulo}</h5>
                  <p className="text-secondary" style={{ fontSize: '0.9rem', maxWidth: 260, margin: '0 auto' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UBICACIÓN ────────────────────────────────────────────────── */}
      <section id="ubicacion" className="py-5" style={{ background: '#f4f4f4' }}>
        <div className="container py-3 text-center">
          <p className="text-uppercase fw-semibold mb-1" style={{ color: '#e6a817', letterSpacing: '0.2rem', fontSize: '0.85rem' }}>
            Encuéntranos
          </p>
          <h2 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '2.4rem' }}>¿Dónde Estamos?</h2>
          <p className="text-secondary mb-4" style={{ fontSize: '1.1rem' }}>
            📍 Puente Piedra, Madrid, Cundinamarca — Colombia
          </p>
          <img
            src={imgMapaUbicacion}
            alt="Mapa de Ubicación"
            className="img-fluid rounded-4 shadow"
            style={{ maxWidth: '900px', width: '100%' }}
          />
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────────────── */}
      <section className="py-5 text-white text-center" style={{ background: 'linear-gradient(135deg, #2c3e50, #3d5a80)' }}>
        <div className="container">
          <h3 className="fw-bold mb-2" style={{ fontSize: '2rem' }}>¿Listo para tu próxima estadía?</h3>
          <p className="mb-4 opacity-75">Reserva en línea y disfruta de tarifas exclusivas.</p>
          <Link to={isAuthenticated ? '/reservas' : '/registro'} className="btn btn-warning btn-lg rounded-pill fw-bold px-5 shadow">
            {isAuthenticated ? 'Ir a mis Reservas' : 'Regístrate gratis'}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: '#1a252f', color: 'white', padding: '40px 20px 20px' }}>
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <h5 className="fw-bold mb-2">Hotel El Sol</h5>
              <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                Hospitalidad genuina desde 2010.<br />Tu hogar lejos de casa en Tabio.
              </p>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-2 text-warning">Contacto</h6>
              <p className="text-secondary mb-1" style={{ fontSize: '0.9rem' }}>📞 +57 313 313 8686</p>
              <p className="text-secondary mb-1" style={{ fontSize: '0.9rem' }}>✉️ hotelelsol@gmail.com</p>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>📍 Tabio, Cundinamarca</p>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-2 text-warning">Acceso rápido</h6>
              <div className="d-flex flex-column gap-1">
                <a href="#habitaciones" className="text-secondary text-decoration-none" style={{ fontSize: '0.9rem' }}>Habitaciones</a>
                <a href="#servicios"    className="text-secondary text-decoration-none" style={{ fontSize: '0.9rem' }}>Servicios</a>
                <a href="#ubicacion"    className="text-secondary text-decoration-none" style={{ fontSize: '0.9rem' }}>Ubicación</a>
                <Link to="/login"       className="text-secondary text-decoration-none" style={{ fontSize: '0.9rem' }}>Panel de control</Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #2c3e50', paddingTop: '20px', paddingBottom: '20px' }}>
            <div className="text-center">
              <h6 className="fw-bold mb-3 text-warning" style={{ fontSize: '0.95rem' }}>Síguenos en Redes Sociales</h6>
              <div className="d-flex justify-content-center gap-3">
                <a href="https://facebook.com/hotelelsol" target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{ fontSize: '1.4rem', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  📘
                </a>
                <a href="https://instagram.com/hotelelsol" target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{ fontSize: '1.4rem', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  📷
                </a>
                <a href="https://wa.me/573108569611" target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{ fontSize: '1.4rem', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  💬
                </a>
                <a href="https://tiktok.com/@hotelelsol" target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{ fontSize: '1.4rem', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  🎵
                </a>
                <a href="mailto:hotelelsol@gmail.com" className="text-decoration-none" style={{ fontSize: '1.4rem', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  ✉️
                </a>
              </div>
            </div>
          </div>
          <div className="border-top pt-3 text-center text-secondary" style={{ fontSize: '0.85rem', borderColor: '#2c3e50 !important' }}>
            &copy; 2026 Hotel El Sol. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;