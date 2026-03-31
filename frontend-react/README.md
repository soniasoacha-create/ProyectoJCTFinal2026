# Desarrollo del proyecto de formación SENA_John Castillo Torres

## Descripción general
Este proyecto corresponde al frontend web de un sistema de gestión hotelera desarrollado en React.
La aplicación permite administrar procesos clave del hotel, integrando autenticación, reservas,
habitaciones, servicios, facturación y gestión de usuarios bajo un esquema de roles.

El objetivo funcional es centralizar la operación del hotel en una sola interfaz:

- Consulta y registro de reservas
- Administración de habitaciones y tipos de habitación
- Administración de servicios adicionales
- Gestión de facturación asociada a reservas
- Gestión de usuarios del sistema
- Vista de perfil para cliente final

## Objetivo del sistema
Construir una interfaz moderna para operar la lógica del negocio hotelero,
consumiendo una API REST y ofreciendo acceso controlado según permisos del usuario.

## Alcance funcional
La solución implementa:

- Página pública de aterrizaje con información comercial del hotel
- Inicio de sesión y registro de usuarios
- Navegación dinámica según estado de autenticación
- Rutas protegidas para módulos internos
- Paneles de administración para la operación diaria
- Perfil de cliente para consulta de información personal y servicios asociados

## Roles de usuario
El sistema contempla validación por rol, principalmente:

- Administrador o moderador: acceso a módulos operativos y administrativos
- Cliente: acceso a su perfil y funcionalidades orientadas a su experiencia

La autenticación se basa en token almacenado en navegador y datos de usuario en almacenamiento local,
con redirección automática en rutas privadas cuando no hay sesión válida.

## Arquitectura funcional del frontend
El frontend está organizado por capas:

- Capa de presentación: vistas, componentes y navegación
- Capa de rutas: definición de rutas públicas y privadas
- Capa de servicios: consumo HTTP de endpoints del backend
- Capa de configuración API: instancia central de Axios para peticiones
- Capa de recursos: estilos globales e imágenes utilizadas por la interfaz

## Módulos implementados
Los módulos funcionales activos incluyen:

- Landing comercial del hotel
- Autenticación (inicio de sesión y registro)
- Habitaciones
- Tipos de habitación
- Reservas
- Reserva de servicios adicionales
- Servicios del hotel
- Facturación
- Reportes y recepción operativa
- Gestión de usuarios
- Perfil de cliente

## Flujo principal de uso
1. El usuario ingresa desde la landing.
2. Se autentica mediante inicio de sesión o registro.
3. El sistema habilita la navegación según rol.
4. El usuario accede a los módulos permitidos.
5. Las acciones se procesan contra la API y se reflejan en la interfaz.

## Tecnologías utilizadas
- React 19
- React Router DOM
- Axios
- Bootstrap 5
- SweetAlert2

## Integración con backend
La aplicación consume una API HTTP configurada por proxy local.
En entorno de desarrollo, las solicitudes se enrutan al backend configurado en package.json.

Recomendaciones de backend para operación correcta:

- Endpoint de autenticación disponible
- Endpoints CRUD de habitaciones, reservas, servicios, facturación y usuarios
- Respuestas JSON consistentes
- Manejo de errores con códigos HTTP claros

## Requisitos previos
- Node.js 18 o superior
- npm 9 o superior
- Backend del sistema en ejecución

## Ejecución en entorno local
Instalar dependencias:

```bash
npm install
```

Iniciar servidor de desarrollo:

```bash
npm start
```

Compilar para producción:

```bash
npm run build
```

## Scripts disponibles
- npm start: levanta la aplicación en modo desarrollo
- npm run build: genera compilación optimizada para producción
- npm test: ejecuta pruebas configuradas en el proyecto

## Consideraciones de despliegue
- Publicar el contenido generado por npm run build
- Configurar correctamente variables y URL de backend
- Asegurar soporte para rutas cliente (fallback SPA hacia index.html)

## Estado actual
El frontend se encuentra funcional para los módulos operativos principales del sistema hotelero,
con base preparada para crecimiento mediante nuevas funcionalidades y mejoras evolutivas.
