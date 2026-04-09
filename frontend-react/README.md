# Hotel El Sol — Sistema de Gestión Hotelera (Frontend)

**Autora:** Sonia SoachaS  
**Correo:** soniasoacha@gmail.com  
**Repositorio:** [github.com/soniasoacha-create/ProyectoJCTFinal2026](https://github.com/soniasoacha-create/ProyectoJCTFinal2026)  
**Formación:** Tecnología en Análisis y Desarrollo de Software — SENA  
**Actividad:** GA8-220501096-AA1-EV01 — Integración de componentes frontend con lógica de negocio

---

## Descripción general

Este repositorio contiene el frontend web del sistema **Hotel El Sol**, una solución integral de gestión hotelera construida con React 19. La aplicación consume una API REST desarrollada en Node.js/Express y cubre el ciclo completo de operación del hotel: autenticación, habitaciones, reservas, servicios adicionales, facturación y gestión de usuarios.

El diseño responde al enfoque GA8 del SENA, que establece que el frontend no es solo pantallas visuales, sino la **capa de interacción completa con la lógica del negocio**: registrar, consultar, editar, eliminar y ejecutar las acciones clave del sistema.

---

## Arquitectura del proyecto

```
frontend-react/
├── src/
│   ├── api/
│   │   └── axiosConfig.js         # Instancia Axios con interceptor JWT
│   ├── components/
│   │   ├── Reservas.js            # Módulo central: CRUD + ciclo de vida reserva
│   │   ├── Habitaciones.js        # CRUD habitaciones
│   │   ├── Servicios.js           # CRUD servicios adicionales
│   │   ├── TiposHabitacion.js     # CRUD tipos de habitación
│   │   ├── Facturacion.js         # Generación y consulta de facturas
│   │   ├── ReservaServicios.js    # Asignación de servicios a reservas activas
│   │   ├── AdminReportes.js       # Panel de recepción con exportación CSV
│   │   ├── Navbar.jsx             # Navegación condicional por rol
│   │   ├── UserForm.js            # Formulario de creación/edición de usuario
│   │   └── UserList.js            # Listado de usuarios con acciones CRUD
│   ├── pages/
│   │   ├── LandingPage.jsx        # Página pública de presentación del hotel
│   │   ├── Login.jsx              # Autenticación JWT
│   │   ├── Register.jsx           # Registro de nuevos usuarios
│   │   ├── ClientePerfil.jsx      # Perfil del cliente con historial de reservas
│   │   ├── UsuariosPage.jsx       # Contenedor de UserForm + UserList
│   │   ├── AccessDenied.jsx       # Pantalla 403 — acceso denegado por rol
│   │   └── NotFound.jsx           # Pantalla 404 — ruta no encontrada
│   ├── services/
│   │   ├── authService.js         # Login y registro contra el backend
│   │   ├── reservasService.js     # Peticiones CRUD y cambio de estado
│   │   ├── habitacionesService.js # Listado, disponibilidad y CRUD
│   │   ├── tiposHabitacionService.js
│   │   ├── serviciosService.js
│   │   ├── facturacionService.js
│   │   ├── reservaServiciosService.js
│   │   └── usuariosService.js
│   ├── constants/
│   │   └── reservas.js            # Estado inicial de reserva por defecto
│   └── App.js                     # Router principal con guardas de ruta
```

---

## Tecnologías y versiones

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Framework de interfaz |
| React Router DOM | 7.x | Enrutamiento SPA con lazy loading |
| Axios | 1.x | Cliente HTTP con interceptores JWT |
| Bootstrap | 5.x | Sistema de estilos y componentes UI |
| SweetAlert2 | 11.x | Diálogos de confirmación y notificaciones |

---

## Roles de usuario y control de acceso

El sistema implementa control de acceso en dos capas simultáneas: **frontend** (guard de rutas en `App.js`) y **backend** (middleware `requireAdminOrModerator` / `requireAdmin` en Express).

```
Roles: administrador | moderador | cliente
```

| Ruta | Cliente | Admin / Moderador |
|---|---|---|
| `/` | ✅ | ✅ |
| `/login`, `/registro` | ✅ | ✅ |
| `/reservas` | ✅ (propias) | ✅ (todas) |
| `/facturacion` | ✅ (propias) | ✅ (todas) |
| `/perfil` | ✅ | — |
| `/habitaciones` | ❌ → 403 | ✅ |
| `/servicios` | ❌ → 403 | ✅ |
| `/tipos-habitacion` | ❌ → 403 | ✅ |
| `/usuarios` | ❌ → 403 | ✅ |
| `/recepcion` | ❌ → 403 | ✅ |
| `/reserva-servicios` | ❌ → 403 | ✅ |
| Ruta desconocida | ✅ → 404 | ✅ → 404 |

### Implementación del guard de ruta en `App.js`

```jsx
const Private = ({ element, allowedRoles }) => {
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = getUserRole();
    if (!allowedRoles.includes(role)) return <Navigate to="/acceso-denegado" />;
  }
  return element;
};
```

El componente `Private` recibe un array `allowedRoles`. Si el arreglo está vacío o no se define, el acceso se permite a cualquier usuario autenticado. Si se especifican roles y el usuario no pertenece a ninguno, se redirige a `/acceso-denegado`.

---

## Interceptor JWT centralizado (`axiosConfig.js`)

Todas las peticiones HTTP pasan por una instancia única de Axios configurada con un interceptor que adjunta el token automáticamente:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

Este patrón garantiza que ningún componente necesite gestionar el token manualmente. Un 401 del backend limpia la sesión y redirige al login de forma automática.

---

## Ciclo de vida de una reserva

El módulo `Reservas.js` implementa el flujo completo de estados de una reserva hotelera:

```
pendiente → confirmada → check-in → check-out
    ↓             ↓
cancelada     cancelada
```

### Estado visible en tabla

Cada reserva muestra un badge de color según su estado actual:

```jsx
const getEstadoBadge = (estado) => {
  const s = normalizarEstadoReserva(estado);
  if (s === 'confirmada') return 'bg-success';
  if (s === 'check-in')   return 'bg-info';
  if (s === 'check-out')  return 'bg-primary';
  if (s === 'cancelada')  return 'bg-danger';
  return 'bg-warning text-dark'; // pendiente
};
```

### Transiciones controladas

La función `getAccionesEstadoReserva` determina qué botones de acción se muestran según el estado actual, impidiendo transiciones inválidas (como pasar de `pendiente` directamente a `check-out`):

```js
const getAccionesEstadoReserva = (estado) => {
  const s = normalizarEstadoReserva(estado);
  if (s === 'pendiente')  return ['confirmada', 'cancelada'];
  if (s === 'confirmada') return ['check-in', 'cancelada'];
  if (s === 'check-in')   return ['check-out'];
  return [];
};
```

### Consulta de disponibilidad por fechas

Cuando el usuario (cliente) selecciona fechas de entrada y salida en el formulario, el sistema consulta automáticamente el endpoint de disponibilidad del backend:

```js
useEffect(() => {
  if (!soloFormularioEfectivo) return;
  if (!formData.fecha_checkin || !formData.fecha_checkout) return;
  const cargarDisponibilidad = async () => {
    const disponibles = await habitacionesService.getDisponibles(
      formData.fecha_checkin,
      formData.fecha_checkout
    );
    setHabitaciones(toArray(disponibles));
  };
  cargarDisponibilidad();
}, [soloFormularioEfectivo, formData.fecha_checkin, formData.fecha_checkout]);
```

### Cálculo automático del precio

```js
const calcularPrecio = () => {
  const precioNoche = getPrecioNoche(tipo, hab);
  const dias = getNochesEstadia(formData.fecha_checkin, formData.fecha_checkout);
  const precioHab = precioNoche * dias;
  const precioServ = selectedServicios.reduce((sum, id) => {
    const srv = servicios.find(s => Number(s.id_servicio) === Number(id));
    return sum + getPrecioServicio(srv);
  }, 0);
  return precioHab + precioServ;
};
```

---

## Facturación

`Facturacion.js` diferencia la vista según el rol:

- **Staff (admin/moderador):** lista todas las facturas, puede generar y cambiar estado (pendiente → pagada).
- **Cliente:** visualiza únicamente sus facturas con desglose de servicios consumidos e IVA (19%).

El cálculo del IVA se aplica localmente:

```js
const IVA_RATE = 0.19;
const subtotal = toNumber(factura?.subtotal ?? factura?.total_sin_iva);
const iva = subtotal * IVA_RATE;
const total = subtotal + iva;
```

---

## Panel de recepción (`AdminReportes.js`)

Consolida reservas con habitación y servicios consumidos. Permite exportar el reporte completo a CSV:

```js
const escapeCsv = (value) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};
```

---

## Módulo de usuarios (`UsuariosPage.jsx`)

La página de usuarios coordina `UserForm` y `UserList` sin acoplarlos: el listado dispara `onUserEdit(user)`, la página guarda el usuario en estado y lo pasa al formulario. Al guardar, el formulario ejecuta `onSaveComplete()` y la lista se refresca mediante un contador de toggle:

```jsx
const handleSaveComplete = () => {
  setUserToEdit(null);
  setRefreshListToggle((v) => v + 1);
};
```

---

## Navegación condicional (`Navbar.jsx`)

El menú se construye leyendo el rol desde `localStorage`. Los ítems de administración solo se renderizan cuando `isStaff === true`:

```jsx
const isStaff = role === 'administrador' || role === 'moderador';
{isStaff ? (
  <> {/* Recepción, Hospedaje, Servicios, Tipos, Usuarios */} </>
) : (
  <li><Link to="/perfil">Mi Perfil</Link></li>
)}
```

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Backend del sistema activo en `http://localhost:3000`

---

## Ejecución en entorno local

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo (puerto 3001)
npm start

# Compilar para producción
npm run build
```

El proxy en `package.json` redirige las peticiones al backend:

```json
"proxy": "http://localhost:3000"
```

---

## Endpoints del backend consumidos

| Método | Endpoint | Módulo frontend |
|---|---|---|
| POST | `/auth/login` | `Login.jsx` |
| POST | `/auth/register` | `Register.jsx` |
| GET/POST/PUT/DELETE | `/usuarios` | `UsuariosPage.jsx` |
| GET/POST/PUT/DELETE | `/habitaciones` | `Habitaciones.js` |
| GET | `/habitaciones/disponibilidad` | `Reservas.js` |
| GET/POST/PUT/DELETE | `/tipos-habitacion` | `TiposHabitacion.js` |
| GET/POST/PUT/DELETE | `/servicios` | `Servicios.js` |
| GET/POST/PUT/DELETE | `/reservas` | `Reservas.js` |
| PUT | `/reservas/:id/estado` | `Reservas.js` |
| GET | `/reservas/activas` | `ReservaServicios.js` |
| POST | `/reserva-servicios` | `ReservaServicios.js` |
| GET/POST | `/facturacion/:idReserva` | `Facturacion.js` |
| GET | `/facturacion/todas` | `Facturacion.js` |
| PUT | `/facturacion/:id/estado` | `Facturacion.js` |

---

## Cambios implementados en la versión actual

### Seguridad y rutas
- Se agregaron las páginas `AccessDenied.jsx` (403) y `NotFound.jsx` (404).
- `App.js` incorpora el parámetro `allowedRoles` en el componente `Private`, aplicando doble guardia junto al backend.

### Reservas
- La tabla de reservas ahora muestra el estado actual de cada reserva con badge de color.
- Los botones de transición de estado (Confirmar, Check-in, Check-out, Cancelar) solo aparecen cuando la transición es válida para el estado en curso.
- El formulario de reserva (modo cliente) consulta disponibilidad de habitaciones en tiempo real al ingresar las fechas.
- El modal de confirmación muestra el número de reserva real (`#ID`) en lugar de `#N/A`.
- El precio total se calcula automáticamente: noches × tarifa de la habitación + servicios adicionales seleccionados.

### Consistencia y limpieza
- Se eliminaron las dependencias `bcryptjs` y `jsonwebtoken` del frontend (eran paquetes de backend instalados por error).
- El mensaje de creación de reserva en el backend se corrigió para reflejar el estado real de inicio: `pendiente`.

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@hotel.com | admin123 |
| Cliente | cliente.ga8.0408215118@mail.com | Cliente123! |
- Asegurar soporte para rutas cliente (fallback SPA hacia index.html)

## Estado actual
El frontend se encuentra funcional para los módulos operativos principales del sistema hotelero,
con base preparada para crecimiento mediante nuevas funcionalidades y mejoras evolutivas.

---

## Cumplimiento de Guía GA8 (Integración Frontend-Backend)

### Estado: 95%+ ✅

Este proyecto cumple con la Guía GA8-220501096-AA1-EV01 "Evidencias de desempeño: desarrollar software 
a partir de la integración de sus módulos componentes" en:

#### ✅ CUMPLIDO AL 100%
- **Seguridad (Mínimo Indispensable):** Login, gestión de usuarios, roles básicos, rutas protegidas
- **CRUD por Entidad:** Usuarios, Habitaciones, Servicios, Tipos de Habitación, Reservas
- **Acciones del Negocio:** Crear reserva, cambiar estado (confirmar, check-in, check-out), facturación
- **Formularios:** Validación, manejo de errores, mensajes claros
- **Consumo API:** Correcto método HTTP, datos, manejo de errores
- **Organización:** Estructura clara (pages, components, services), separación de responsabilidades

#### ✅ IMPLEMENTADO EN FASES DEL PLAN
- **Cambio de Estados en Reservas:** Estado visible con badge y acciones directas por flujo (confirmar, check-in, check-out, cancelar)
- **Disponibilidad por Fechas:** Visualización de habitaciones disponibles con contador por rango de fechas
- **Seguridad por Rol en Frontend:** Rutas de staff protegidas por `allowedRoles`
- **Contingencia de Navegación:** Página `404` y `acceso denegado` implementadas

#### ❌ PENDIENTE (Requiere Backend)
- **Gestión de Roles:** Endpoints /roles no existen en backend
- **Asignación de Roles:** Endpoint POST /usuarios/:id/roles no existe

### Documentación GA8
Para revisar análisis de cumplimiento, ver documentos en raíz del proyecto:

- **RESUMEN_EJECUTIVO_GA8.md** - Resumen de estado y recomendaciones
- **ANALISIS_GA8_CUMPLIMIENTO.md** - Análisis detallado por requisito
- **PLAN_CAMBIOS_NECESARIOS.md** - Plan de mejoras específicas
- **DOCUMENTACION_PANTALLAS_GA8.md** - Documentación por pantalla y evidencia de pruebas

### Estado del Plan de Mejora

**Completado:**
1. UI de cambio de estados en Reservas
2. Disponibilidad visible de habitaciones por fechas
3. Documentación de pantallas en formato GA8
4. Páginas de error (404 y acceso denegado)

**Futuro (Requiere Backend):**
5. Implementar Gestión de Roles y Asignación de Roles

Ver **PLAN_CAMBIOS_NECESARIOS.md** para detalles específicos de implementación.

---

## Cómo Probar Según GA8

### Por cada Pantalla CRUD
- [x] Carga la lista
- [x] Permite crear
- [x] Permite editar
- [x] Permite eliminar o inactivar
- [x] Actualiza la interfaz después

### Por cada Acción del Negocio
- [x] Ejecuta la acción correcta
- [x] Cambia el estado esperado
- [x] Muestra retroalimentación visual
- [x] Refleja el cambio en la interfaz

### Ejemplo: Prueba Flujo Completo de Reserva
1. Login como admin (admin@hotel.com / admin123)
2. Ir a `/reservas` → Crear nueva reserva
3. Seleccionar usuario, habitación disponible, fechas
4. Crear → Estado inicial "pendiente"
5. Click "Confirmar" → Estado cambia a "confirmada"
6. Click "Check-in" → Estado cambia a "check-in"
7. Click "Check-out" → Estado cambia a "check-out"
8. Verificar que factura se generó

Si todo funciona: ✅ Flujo completo cumple GA8 Sección C1-C4

---
