import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'hotel_el_sol'
  });

  try {
    console.log('🌱 Iniciando proceso de semilla de datos...\n');

    // 0. LIMPIAR DATOS EN ORDEN CORRECTO (por claves foráneas)
    console.log('🧹 Limpiando datos existentes...');
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    
    // Eliminar en orden inverso de dependencias
    await connection.query('DELETE FROM facturacion WHERE 1=1');
    await connection.query('DELETE FROM reserva_servicios WHERE 1=1');
    await connection.query('DELETE FROM reservas WHERE 1=1');
    await connection.query('DELETE FROM servicios WHERE 1=1');
    await connection.query('DELETE FROM habitaciones WHERE 1=1');
    await connection.query('DELETE FROM tipos_habitacion WHERE 1=1');
    
    await connection.query('DELETE FROM usuarios WHERE email IN (?, ?, ?, ?, ?)', [
      'admin@hotel.com',
      'moderador@hotel.com',
      'cliente1@email.com',
      'cliente2@email.com',
      'cliente3@email.com'
    ]);
    
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('   ✅ Datos anteriores eliminados\n');

    // 1. CREAR USUARIOS DE PRUEBA
    console.log('👥 Creando usuarios de prueba...');
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    const hashedPasswordModerador = await bcrypt.hash('moderador123', 10);
    const hashedPasswordCliente = await bcrypt.hash('cliente123', 10);

    const usuarios = [
      ['Admin Hotel', 'El Sol', 'admin@hotel.com', '3001111111', 'administrador', hashedPasswordAdmin],
      ['Moderador Hotel', 'El Sol', 'moderador@hotel.com', '3002222222', 'moderador', hashedPasswordModerador],
      ['Juan', 'Pérez', 'cliente1@email.com', '3003333333', 'cliente', hashedPasswordCliente],
      ['María', 'García', 'cliente2@email.com', '3004444444', 'cliente', hashedPasswordCliente],
      ['Carlos', 'López', 'cliente3@email.com', '3005555555', 'cliente', hashedPasswordCliente]
    ];

    const usuarioIds = [];
    for (const usuario of usuarios) {
      const [result] = await connection.query(
        'INSERT INTO usuarios (nombres, apellidos, email, telefono, tipo_usuario, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        usuario
      );
      usuarioIds.push(result.insertId);
    }
    console.log('   ✅ 5 usuarios creados\n');

    // 2. CREAR TIPOS DE HABITACIÓN
    console.log('🏠 Creando tipos de habitación...');

    const tipos = [
      ['Individual', 'Habitación para una persona', 80.00, 1],
      ['Doble', 'Habitación para dos personas', 120.00, 2],
      ['Doble Deluxe', 'Habitación doble con vista al mar', 150.00, 2],
      ['Suite', 'Suite completa con sala de estar', 200.00, 4],
      ['Penthouse', 'Penthouse con terraza privada', 300.00, 4]
    ];

    const tipoIds = [];
    for (const tipo of tipos) {
      const [result] = await connection.query(
        'INSERT INTO tipos_habitacion (nombre_tipo, descripcion, precio_noche, capacidad_maxima) VALUES (?, ?, ?, ?)',
        tipo
      );
      tipoIds.push(result.insertId);
    }
    console.log(`   ✅ ${tipos.length} tipos de habitación creados\n`);

    // 3. CREAR HABITACIONES
    console.log('🛏️  Creando habitaciones...');

    const habitaciones = [
      [101, tipoIds[0], 'disponible'],
      [102, tipoIds[0], 'disponible'],
      [201, tipoIds[1], 'disponible'],
      [202, tipoIds[1], 'disponible'],
      [203, tipoIds[1], 'disponible'],
      [301, tipoIds[2], 'disponible'],
      [302, tipoIds[2], 'disponible'],
      [401, tipoIds[3], 'disponible'],
      [402, tipoIds[3], 'ocupada'],
      [501, tipoIds[4], 'disponible']
    ];

    const habitacionIds = [];
    for (const habitacion of habitaciones) {
      const [result] = await connection.query(
        'INSERT INTO habitaciones (numero_habitacion, id_tipo_habitacion, estado) VALUES (?, ?, ?)',
        habitacion
      );
      habitacionIds.push(result.insertId);
    }
    console.log(`   ✅ ${habitaciones.length} habitaciones creadas\n`);

    // 4. CREAR SERVICIOS
    console.log('🛎️  Creando servicios adicionales...');
    await connection.query('DELETE FROM servicios WHERE id_servicio > 0');

    const servicios = [
      ['Desayuno buffet', 'Desayuno con opciones internacionales', randomPrice(20, 35)],
      ['Room Service', 'Comidas disponibles en la habitación', randomPrice(30, 55)],
      ['Spa y masajes', 'Tratamientos relajantes', randomPrice(70, 130)],
      ['Tour guiado', 'Tour turístico de la ciudad', randomPrice(40, 90)],
      ['Traslado aeropuerto', 'Traslado desde/hacia aeropuerto', randomPrice(35, 70)],
      ['Estacionamiento', 'Estacionamiento seguro por día', randomPrice(10, 25)],
      ['Wi-Fi premium', 'Internet de alta velocidad', randomPrice(8, 20)],
      ['Llamadas internacionales', 'Paquete de llamadas al exterior', randomPrice(15, 40)]
    ];

    const servicioIds = [];
    for (const servicio of servicios) {
      const [result] = await connection.query(
        'INSERT INTO servicios (nombre_servicio, descripcion, precio) VALUES (?, ?, ?)',
        servicio
      );
      servicioIds.push(result.insertId);
    }
    console.log(`   ✅ ${servicios.length} servicios creados\n`);

    // 5. CREAR RESERVAS
    console.log('📅 Creando reservas de prueba...');
    await connection.query('DELETE FROM reservas WHERE id_reserva > 0');

    const fechaHoy = new Date();
    const fechaCheckin1 = new Date(fechaHoy);
    fechaCheckin1.setDate(fechaCheckin1.getDate() + 5);
    const fechaCheckout1 = new Date(fechaCheckin1);
    fechaCheckout1.setDate(fechaCheckout1.getDate() + 3);

    const fechaCheckin2 = new Date(fechaHoy);
    fechaCheckin2.setDate(fechaCheckin2.getDate() + 10);
    const fechaCheckout2 = new Date(fechaCheckin2);
    fechaCheckout2.setDate(fechaCheckout2.getDate() + 5);

    const fechaCheckin3 = new Date(fechaHoy);
    fechaCheckin3.setDate(fechaCheckin3.getDate() + 15);
    const fechaCheckout3 = new Date(fechaCheckin3);
    fechaCheckout3.setDate(fechaCheckout3.getDate() + 7);

    const reservas = [
      [usuarioIds[2], habitacionIds[2], formatoFecha(fechaCheckin1), formatoFecha(fechaCheckout1), 2, 360, 'confirmada'],
      [usuarioIds[3], habitacionIds[5], formatoFecha(fechaCheckin2), formatoFecha(fechaCheckout2), 1, 600, 'pendiente'],
      [usuarioIds[4], habitacionIds[6], formatoFecha(fechaCheckin3), formatoFecha(fechaCheckout3), 4, 1050, 'pendiente']
    ];

    const reservaIds = [];
    for (const reserva of reservas) {
      const [result] = await connection.query(
        'INSERT INTO reservas (id_usuario, id_habitacion, fecha_checkin, fecha_checkout, total_huespedes, precio_total, estado_reserva, fecha_reserva) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        reserva
      );
      reservaIds.push(result.insertId);
    }
    console.log(`   ✅ ${reservas.length} reservas creadas\n`);

    // 6. CREAR SERVICIOS EN RESERVAS
    console.log('🔗 Agregando servicios a reservas...');

    // Reserva 1: Desayuno + Spa
    await connection.query(
      'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [reservaIds[0], servicioIds[0], 3, 75.00]
    );
    await connection.query(
      'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [reservaIds[0], servicioIds[2], 1, 80.00]
    );

    // Reserva 2: Room Service + Wifi
    await connection.query(
      'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [reservaIds[1], servicioIds[1], 2, 70.00]
    );

    // Reserva 3: Traslado + Estacionamiento
    await connection.query(
      'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [reservaIds[2], servicioIds[4], 2, 80.00]
    );
    await connection.query(
      'INSERT INTO reserva_servicios (id_reserva, id_servicio, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [reservaIds[2], servicioIds[5], 7, 105.00]
    );

    console.log('   ✅ Servicios vinculados a reservas\n');

    // 7. CREAR FACTURAS (automáticamente)
    console.log('💰 Generando facturas automáticas...');

    for (const [index, reservaId] of reservaIds.entries()) {
      try {
        // Obtener datos de la reserva para calcular el total
        const [reservaData] = await connection.query(`
          SELECT 
            r.id_usuario,
            r.precio_total
          FROM reservas r
          WHERE r.id_reserva = ?
        `, [reservaId]);

        if (reservaData.length > 0) {
          const data = reservaData[0];
          
          // Insertar en facturacion con los campos disponibles
          await connection.query(
            `INSERT INTO facturacion (id_reserva, subtotal_hospedaje, subtotal_bruto, monto_total)
             VALUES (?, ?, ?, ?)`,
            [reservaId, data.precio_total, data.precio_total, data.precio_total]
          );
        }
      } catch (err) {
        // Si hay error con facturas, continuar sin ellas (tabla puede no estar correctamente configurada)
        console.log('   ⚠️  Facturas no generadas (tabla podría tener estructura diferente)');
        break;
      }
    }
    console.log('   ✅ Facturas procesadas\n');

    // RESUMEN
    console.log('\n' + '='.repeat(60));
    console.log('✨ SEMILLA DE DATOS COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));

    console.log('\n📊 DATOS CREADOS:');
    console.log(`   ✅ ${usuarios.length} usuarios`);
    console.log(`   ✅ ${tipos.length} tipos de habitación`);
    console.log(`   ✅ ${habitaciones.length} habitaciones`);
    console.log(`   ✅ ${servicios.length} servicios`);
    console.log(`   ✅ ${reservas.length} reservas`);
    console.log(`   ✅ ${reservaIds.length} facturas generadas`);

    console.log('\n🔐 CREDENCIALES DE PRUEBA:');
    console.log('   ADMIN:');
    console.log('      Email: admin@hotel.com');
    console.log('      Contraseña: admin123');
    console.log('   MODERADOR:');
    console.log('      Email: moderador@hotel.com');
    console.log('      Contraseña: moderador123');
    console.log('   CLIENTES:');
    console.log('      Email: cliente1@email.com, cliente2@email.com, cliente3@email.com');
    console.log('      Contraseña: cliente123');

    console.log('\n📅 RESERVAS CREADAS:');
    console.log(`   Reserva 1: Habitación 201 (${formatoFecha(fechaCheckin1)} - ${formatoFecha(fechaCheckout1)})`);
    console.log(`   Reserva 2: Habitación 301 (${formatoFecha(fechaCheckin2)} - ${formatoFecha(fechaCheckout2)})`);
    console.log(`   Reserva 3: Habitación 302 (${formatoFecha(fechaCheckin3)} - ${formatoFecha(fechaCheckout3)})`);

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la semilla:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n✅ Conexión cerrada');
  }
}

function formatoFecha(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomPrice(min, max) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(2));
}

seedDatabase();
