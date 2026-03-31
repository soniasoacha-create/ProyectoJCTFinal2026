import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const host = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
  const user = process.env.DB_USER ? process.env.DB_USER : 'root';
  const password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '';
  const database = process.env.DB_DATABASE ? process.env.DB_DATABASE : 'hotel_el_sol';

  const c = await mysql.createConnection({ host, user, password, database });

  const stmts = [
    'ALTER TABLE facturacion ADD COLUMN id_usuario INT NULL',
    'ALTER TABLE facturacion ADD COLUMN numero_factura VARCHAR(50) NULL',
    'ALTER TABLE facturacion ADD COLUMN fecha_factura DATETIME NULL',
    'ALTER TABLE facturacion ADD COLUMN total_servicios DECIMAL(12,2) NULL',
    'ALTER TABLE facturacion ADD COLUMN total_general DECIMAL(12,2) NULL',
    "ALTER TABLE facturacion ADD COLUMN estado_factura ENUM('generada','pagada','cancelada') NOT NULL DEFAULT 'generada'",
    'UPDATE facturacion f JOIN reservas r ON r.id_reserva = f.id_reserva SET f.id_usuario = r.id_usuario WHERE f.id_usuario IS NULL',
    "UPDATE facturacion SET numero_factura = CONCAT('FAC-', id_factura) WHERE numero_factura IS NULL OR numero_factura = ''",
    'UPDATE facturacion SET fecha_factura = COALESCE(fecha_emision, NOW()) WHERE fecha_factura IS NULL',
    'UPDATE facturacion SET total_servicios = COALESCE(subtotal_servicios, 0) WHERE total_servicios IS NULL',
    'UPDATE facturacion SET total_general = COALESCE(monto_total, subtotal_bruto, subtotal_hospedaje + COALESCE(subtotal_servicios, 0)) WHERE total_general IS NULL',
    'ALTER TABLE facturacion ADD INDEX idx_fact_usuario (id_usuario)',
    'ALTER TABLE facturacion ADD INDEX idx_fact_estado (estado_factura)'
  ];

  for (const s of stmts) {
    try {
      await c.query(s);
      console.log('OK:', s);
    } catch (e) {
      console.log('SKIP:', e.message);
    }
  }

  try {
    await c.query('ALTER TABLE facturacion ADD CONSTRAINT fk_fact_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuarios) ON DELETE CASCADE ON UPDATE CASCADE');
    console.log('OK: FK id_usuario');
  } catch (e) {
    console.log('SKIP FK:', e.message);
  }

  const [cols] = await c.query('DESCRIBE facturacion');
  console.log('\nCOLUMNAS FACTURACION:');
  for (const col of cols) {
    console.log('-', col.Field, col.Type);
  }

  await c.end();
}

run().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
