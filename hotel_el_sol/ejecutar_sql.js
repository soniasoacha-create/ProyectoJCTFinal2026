import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ejecutarScript() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'hotel_el_sol'
  });

  try {
    console.log('📚 Conectado a la base de datos...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, './scripts_sql/crear_facturacion.sql');
    console.log(`📄 Leyendo archivo SQL: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir por sentencias (simple split por ;)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`✅ Se encontraron ${statements.length} sentencias SQL\n`);

    let executedCount = 0;

    for (const [index, statement] of statements.entries()) {
      try {
        // Saltar comentarios
        if (statement.startsWith('--')) continue;

        console.log(`[${index + 1}/${statements.length}] Ejecutando...`);
        
        const cleanStatement = statement
          .split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--');
            return commentIndex === -1 ? line : line.substring(0, commentIndex);
          })
          .join('\n')
          .trim();

        if (cleanStatement.length > 0) {
          await connection.query(cleanStatement);
          executedCount++;
          
          // Determinar que se ejecutó
          if (cleanStatement.toUpperCase().includes('CREATE TABLE')) {
            console.log('   ✓ Tabla creada exitosamente');
          } else if (cleanStatement.toUpperCase().includes('CREATE OR REPLACE VIEW')) {
            console.log('   ✓ Vista creada exitosamente');
          } else if (cleanStatement.toUpperCase().includes('CREATE PROCEDURE')) {
            console.log('   ✓ Procedimiento creado exitosamente');
          } else if (cleanStatement.toUpperCase().includes('DELIMITER')) {
            console.log('   ✓ Delimitador procesado');
          }
        }
      } catch (err) {
        // Ignorar errores de DELIMITER que no existen en javascript
        if (!statement.includes('DELIMITER')) {
          console.error(`   ❌ Error en sentencia ${index + 1}:`, err.message);
        }
      }
    }

    console.log(`\n✨ Proceso completado!`);
    console.log(`📊 Sentencias ejecutadas: ${executedCount}`);
    
    // Verificar que la tabla fue creada
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'facturacion'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabla "facturacion" verificada en la base de datos');
      
      // Mostrar estructura
      const [columns] = await connection.query(`
        DESCRIBE facturacion
      `);
      console.log('\n📋 Estructura de la tabla:');
      console.log('─'.repeat(60));
      columns.forEach(col => {
        console.log(`  ${col.Field.padEnd(20)} | ${col.Type.padEnd(25)} | ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      console.log('─'.repeat(60));
    } else {
      console.log('⚠️  La tabla "facturacion" no se creó');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n✅ Conexión cerrada');
  }
}

ejecutarScript();
