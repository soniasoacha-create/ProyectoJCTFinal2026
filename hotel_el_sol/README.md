# Proyecto Hotel El Sol - Entregable SENA

Autor: John Castillo Torres

## 1. Descripcion general

Este proyecto implementa un sistema de gestion hotelera con arquitectura separada en:

- Backend API REST en Node.js + Express + MySQL (puerto 3000)
- Frontend en React (puerto 3001)

Objetivo funcional:

- Gestion de usuarios con roles
- Gestion de habitaciones y tipos de habitacion
- Gestion de reservas y servicios adicionales
- Facturacion asociada a reservas
- Control de acceso mediante JWT

## 2. Estructura del proyecto

En este entorno se trabajan dos carpetas principales:

- Backend: `D:\20251\ProyectoJCTfinal\hotel_el_sol`
- Frontend: `D:\20251\ProyectoJCTfinal\frontend-react`

### 2.1 Backend (hotel_el_sol)

- `src/server.js`: punto de entrada de la API
- `src/config/database.js`: pool de conexion a MySQL
- `src/routes/`: rutas por modulo
- `src/controllers/`: logica de negocio
- `src/models/`: consultas y operaciones de datos
- `src/middlewares/`: autenticacion y autorizacion
- `seed.js`: carga de datos de prueba
- `scripts_sql/`: scripts SQL y utilidades

### 2.2 Frontend (frontend-react)

- `src/App.js`: enrutamiento principal
- `src/pages/`: vistas principales (login, registro, landing, perfil)
- `src/components/`: modulos funcionales (reservas, servicios, facturacion, etc.)
- `src/services/`: consumo de API REST
- `src/api/axiosConfig.js`: configuracion de Axios e interceptor JWT
- `public/`: plantilla base del frontend
- `build/`: salida compilada para despliegue (conservar)

## 3. Tecnologias usadas

### 3.1 Backend

- Node.js
- Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Hash de contrasenas (`bcryptjs`)
- Variables de entorno (`dotenv`)
- CORS

### 3.2 Frontend

- React
- React Router
- Axios
- Bootstrap
- SweetAlert2

## 4. Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- MySQL 8 o superior
- Dos terminales para levantar backend y frontend al mismo tiempo

## 5. Configuracion de entorno

## 5.1 Variables de entorno backend (`hotel_el_sol/.env`)

Crear archivo `.env` en la carpeta backend con estas variables:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=hotel_el_sol
JWT_SECRET=tu_clave_jwt_segura
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## 5.2 Variables de entorno frontend

No se detecto archivo `.env` obligatorio en frontend para correr en local.
La app usa por defecto:

- Proxy a `http://localhost:3000` en desarrollo
- Base API `/api` en desarrollo desde `src/api/axiosConfig.js`

Si se desea, se puede crear opcionalmente:

```env
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

## 6. Instalacion y ejecucion

## 6.1 Backend (puerto 3000)

```bash
cd D:\20251\ProyectoJCTfinal\hotel_el_sol
npm install
npm run dev
```

Opcional en modo produccion local:

```bash
npm start
```

Health check:

- `GET http://localhost:3000/api/health`

## 6.2 Frontend (puerto 3001)

```bash
cd D:\20251\ProyectoJCTfinal\frontend-react
npm install
npm start
```

Build de entrega (no borrar carpeta `build`):

```bash
npm run build
```

## 7. Datos de prueba (seed)

Para poblar base de datos desde backend:

```bash
cd D:\20251\ProyectoJCTfinal\hotel_el_sol
npm run seed
```

Credenciales generadas por `seed.js`:

- Admin
  - Email: `admin@hotel.com`
  - Password: `admin123`
- Moderador
  - Email: `moderador@hotel.com`
  - Password: `moderador123`
- Clientes
  - Email: `cliente1@email.com`, `cliente2@email.com`, `cliente3@email.com`
  - Password: `cliente123`

## 8. Modulos funcionales entregados

## 8.1 Seguridad

- Login y registro
- JWT en backend
- Interceptor de Axios para enviar token en frontend
- Redireccion a login ante `401`

## 8.2 Usuarios

- Consulta de usuarios
- Perfil por rol (cliente u operador)

## 8.3 Habitaciones y tipos

- Listado de habitaciones
- Tipos de habitacion
- Control por estados

## 8.4 Reservas

- Creacion y consulta de reservas
- Validaciones de negocio
- Asociacion de servicios a la reserva

## 8.5 Facturacion

- Generacion y consulta de facturas
- Integracion con flujo de reserva

## 9. Flujo recomendado para demostracion

1. Levantar MySQL
2. Levantar backend en puerto 3000
3. Ejecutar `npm run seed`
4. Levantar frontend en puerto 3001
5. Ingresar con usuario admin
6. Mostrar flujo: login -> habitaciones -> reserva -> servicios -> facturacion
7. Mostrar control de permisos por rol

## 10. Checklist de entrega SENA

- Backend y frontend levantan sin errores
- Login funcional
- Endpoints protegidos con JWT
- CRUD principal operativo
- Seed funcional para pruebas
- Build de frontend generado y conservado
- Credenciales de prueba validadas
- Autor del entregable: John Castillo Torres

## 11. Solucion de problemas comunes

### 11.1 Error `mgt.clearMarks is not a function`

Este error no pertenece al codigo del proyecto.
Generalmente lo provoca una extension del navegador.

Acciones recomendadas:

- Probar en ventana incognito
- Desactivar extensiones en navegador normal

### 11.2 Frontend en blanco en `localhost:3001`

Verificar que el frontend este ejecutandose con `npm start` en su carpeta.

### 11.3 Error de conexion a base de datos

Revisar valores de `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` en `.env`.

## 12. Scripts utiles

## 12.1 Backend

- `npm run dev`: desarrollo con nodemon
- `npm start`: ejecucion normal
- `npm run seed`: poblar datos de prueba
- `npm run servicios:precios`: asignar precios aleatorios a servicios

## 12.2 Frontend

- `npm start`: desarrollo en puerto 3001
- `npm run build`: build de produccion
- `npm test`: pruebas del frontend

---

Documento entregable de proyecto SENA
Autor: John Castillo Torres
