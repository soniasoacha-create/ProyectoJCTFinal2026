-- ============================================================
-- SCRIPT SQL - TABLA DE FACTURACIÓN
-- HOTEL EL SOL
-- ============================================================
-- Este script crea la tabla de facturación necesaria para
-- el sistema mejorado de gestión de reservas y servicios.
-- ============================================================

-- Crear tabla de facturación
CREATE TABLE IF NOT EXISTS facturacion (
  id_factura INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la factura',
  id_reserva INT NOT NULL COMMENT 'ID de la reserva asociada',
  id_usuario INT NOT NULL COMMENT 'ID del usuario (cliente)',
  numero_factura VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número único de factura (FAC-timestamp)',
  fecha_factura DATETIME NOT NULL COMMENT 'Fecha de generación de la factura',
  subtotal_hospedaje DECIMAL(10, 2) NOT NULL COMMENT 'Costo total del hospedaje',
  total_servicios DECIMAL(10, 2) DEFAULT 0 COMMENT 'Costo total de servicios adicionales',
  total_general DECIMAL(10, 2) NOT NULL COMMENT 'Total a pagar (hospedaje + servicios)',
  estado_factura ENUM('generada', 'pagada', 'cancelada') DEFAULT 'generada' COMMENT 'Estado de la factura',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  
  -- Claves foráneas
  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuarios) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Índices para optimización
  INDEX idx_reserva (id_reserva),
  INDEX idx_usuario (id_usuario),
  INDEX idx_fecha (fecha_factura),
  INDEX idx_estado (estado_factura),
  INDEX idx_numero_factura (numero_factura)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='Tabla de facturación de reservas de hotel';

-- ============================================================
-- VISTA: Resumen de Facturación por Usuario
-- ============================================================
CREATE OR REPLACE VIEW v_facturacion_usuario AS
SELECT 
  f.id_factura,
  f.numero_factura,
  f.fecha_factura,
  f.subtotal_hospedaje,
  f.total_servicios,
  f.total_general,
  f.estado_factura,
  u.id_usuarios,
  CONCAT(u.nombres, ' ', u.apellidos) AS nombre_cliente,
  u.email,
  u.telefono,
  h.numero_habitacion,
  t.nombre_tipo AS tipo_habitacion,
  r.fecha_checkin,
  r.fecha_checkout
FROM facturacion f
INNER JOIN reservas r ON f.id_reserva = r.id_reserva
INNER JOIN usuarios u ON f.id_usuario = u.id_usuarios
INNER JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
INNER JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion;

-- ============================================================
-- VISTA: Resumen de Facturación Diaria
-- ============================================================
CREATE OR REPLACE VIEW v_facturacion_diaria AS
SELECT 
  DATE(f.fecha_factura) AS fecha,
  COUNT(f.id_factura) AS total_facturas,
  SUM(f.subtotal_hospedaje) AS ingresos_hospedaje,
  SUM(f.total_servicios) AS ingresos_servicios,
  SUM(f.total_general) AS ingresos_total,
  SUM(CASE WHEN f.estado_factura = 'pagada' THEN f.total_general ELSE 0 END) AS ingresos_pagados
FROM facturacion f
GROUP BY DATE(f.fecha_factura)
ORDER BY fecha DESC;

-- ============================================================
-- VISTA: Resumen de Facturación por Estado
-- ============================================================
CREATE OR REPLACE VIEW v_facturacion_por_estado AS
SELECT 
  f.estado_factura,
  COUNT(f.id_factura) AS cantidad,
  SUM(f.total_general) AS monto_total,
  AVG(f.total_general) AS monto_promedio,
  MIN(f.total_general) AS monto_minimo,
  MAX(f.total_general) AS monto_maximo
FROM facturacion f
GROUP BY f.estado_factura;

-- ============================================================
-- PROCEDIMIENTO: Generar Factura Automáticamente
-- ============================================================
DELIMITER //

CREATE PROCEDURE sp_generar_factura(
  IN p_id_reserva INT,
  OUT p_id_factura INT,
  OUT p_mensaje VARCHAR(200)
)
BEGIN
  DECLARE v_id_usuario INT;
  DECLARE v_numero_factura VARCHAR(50);
  DECLARE v_subtotal_hospedaje DECIMAL(10, 2);
  DECLARE v_total_servicios DECIMAL(10, 2);
  DECLARE v_total_general DECIMAL(10, 2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_mensaje = 'Error al generar factura';
    SET p_id_factura = 0;
  END;

  -- Verificar si la reserva existe
  SELECT id_usuario INTO v_id_usuario 
  FROM reservas 
  WHERE id_reserva = p_id_reserva;

  IF v_id_usuario IS NULL THEN
    SET p_mensaje = 'Reserva no encontrada';
    SET p_id_factura = 0;
  ELSE
    -- Generar número de factura único
    SET v_numero_factura = CONCAT('FAC-', UNIX_TIMESTAMP());

    -- Calcular subtotal de hospedaje
    SELECT (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche)
    INTO v_subtotal_hospedaje
    FROM reservas r
    JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
    JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
    WHERE r.id_reserva = p_id_reserva;

    -- Calcular total de servicios
    SELECT IFNULL(SUM(subtotal), 0)
    INTO v_total_servicios
    FROM reserva_servicios
    WHERE id_reserva = p_id_reserva;

    -- Calcular total general
    SET v_total_general = v_subtotal_hospedaje + v_total_servicios;

    -- Insertar factura
    INSERT INTO facturacion (
      id_reserva,
      id_usuario,
      numero_factura,
      fecha_factura,
      subtotal_hospedaje,
      total_servicios,
      total_general
    ) VALUES (
      p_id_reserva,
      v_id_usuario,
      v_numero_factura,
      NOW(),
      v_subtotal_hospedaje,
      v_total_servicios,
      v_total_general
    );

    SET p_id_factura = LAST_INSERT_ID();
    SET p_mensaje = 'Factura generada exitosamente';
  END IF;
END //

DELIMITER ;

-- ============================================================
-- PROCEDIMIENTO: Actualizar Estado de Factura
-- ============================================================
DELIMITER //

CREATE PROCEDURE sp_actualizar_estado_factura(
  IN p_id_factura INT,
  IN p_nuevo_estado ENUM('generada', 'pagada', 'cancelada'),
  OUT p_mensaje VARCHAR(200)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_mensaje = 'Error actualizando estado';
  END;

  UPDATE facturacion
  SET estado_factura = p_nuevo_estado
  WHERE id_factura = p_id_factura;

  IF ROW_COUNT() > 0 THEN
    SET p_mensaje = 'Estado actualizado exitosamente';
  ELSE
    SET p_mensaje = 'Factura no encontrada';
  END IF;
END //

DELIMITER ;

-- ============================================================
-- PROCEDIMIENTO: Obtener Resumen de Facturación
-- ============================================================
DELIMITER //

CREATE PROCEDURE sp_resumen_facturacion(
  IN p_fecha_inicio DATE,
  IN p_fecha_fin DATE
)
BEGIN
  SELECT 
    DATE(f.fecha_factura) AS fecha,
    COUNT(*) AS total_facturas,
    COUNT(CASE WHEN f.estado_factura = 'pagada' THEN 1 END) AS facturas_pagadas,
    SUM(f.subtotal_hospedaje) AS hospedaje_total,
    SUM(f.total_servicios) AS servicios_total,
    SUM(f.total_general) AS ingresos_total,
    SUM(CASE WHEN f.estado_factura = 'pagada' THEN f.total_general ELSE 0 END) AS pagado,
    SUM(CASE WHEN f.estado_factura = 'generada' THEN f.total_general ELSE 0 END) AS pendiente
  FROM facturacion f
  WHERE DATE(f.fecha_factura) BETWEEN p_fecha_inicio AND p_fecha_fin
  GROUP BY DATE(f.fecha_factura)
  ORDER BY fecha DESC;
END //

DELIMITER ;

-- ============================================================
-- DATOS DE PRUEBA (Opcional - comentar si no se desea)
-- ============================================================

-- Ejemplo de inserción de factura (solo si existen reservas)
-- Nota: Descomenta si necesitas datos de prueba
/*
INSERT INTO facturacion (id_reserva, id_usuario, numero_factura, fecha_factura, subtotal_hospedaje, total_servicios, total_general)
SELECT 
  r.id_reserva,
  r.id_usuario,
  CONCAT('FAC-', UNIX_TIMESTAMP()),
  NOW(),
  (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche),
  IFNULL((SELECT SUM(subtotal) FROM reserva_servicios WHERE id_reserva = r.id_reserva), 0),
  (DATEDIFF(r.fecha_checkout, r.fecha_checkin) * t.precio_noche) + IFNULL((SELECT SUM(subtotal) FROM reserva_servicios WHERE id_reserva = r.id_reserva), 0)
FROM reservas r
JOIN habitaciones h ON r.id_habitacion = h.id_habitacion
JOIN tipos_habitacion t ON h.id_tipo_habitacion = t.id_tipo_habitacion
LIMIT 5;
*/

-- ============================================================
-- VERIFICACIÓN: Mostrar estructura de la tabla
-- ============================================================
DESCRIBE facturacion;

-- ============================================================
-- VERIFICACIÓN: Ver vistas creadas
-- ============================================================
-- SELECT * FROM v_facturacion_usuario LIMIT 5;
-- SELECT * FROM v_facturacion_diaria LIMIT 10;
-- SELECT * FROM v_facturacion_por_estado;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
