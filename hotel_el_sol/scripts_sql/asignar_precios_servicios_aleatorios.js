import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const randomPrice = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));

async function asignarPrecios() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'hotel_el_sol'
  });

  try {
    const [servicios] = await connection.query('SELECT id_servicio, nombre_servicio, precio FROM servicios ORDER BY id_servicio');

    if (servicios.length === 0) {
      console.log('No hay servicios para actualizar.');
      return;
    }

    for (const servicio of servicios) {
      if (Number(servicio.precio) > 0) {
        continue;
      }

      const nuevoPrecio = randomPrice(10, 150);
      await connection.query('UPDATE servicios SET precio = ? WHERE id_servicio = ?', [nuevoPrecio, servicio.id_servicio]);
      console.log(`Servicio ${servicio.id_servicio} (${servicio.nombre_servicio}) actualizado a ${nuevoPrecio}`);
    }

    console.log('Actualizacion de precios completada.');
  } catch (error) {
    console.error('Error al actualizar precios de servicios:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

asignarPrecios();
