import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('d:/20251/ProyectoJCT/hotel_el_sol/INFORME_ANALISIS_GIT_REPOSITORIO.pdf');

const lines = [
  'INFORME DE ANALISIS DEL REPOSITORIO GIT',
  '',
  'Repositorio analizado:',
  'https://github.com/soniasoacha-create/proyectofinalhotel2026.git',
  '',
  'Fecha del analisis: 2026-03-31',
  '',
  'Resumen ejecutivo',
  'Se verifico que el repositorio remoto existe, esta publico y usa la rama main.',
  'El contenido subido muestra dos carpetas principales del proyecto: frontend-react y hotel_el_sol.',
  'La estructura observada corresponde a un proyecto full stack con frontend en React y backend en Node.js/Express.',
  '',
  'Hallazgos principales',
  '1. El repositorio remoto contiene frontend-react en la raiz.',
  '2. El repositorio remoto contiene hotel_el_sol en la raiz.',
  '3. El frontend incluye src, public, package.json y package-lock.json.',
  '4. El backend incluye src, scripts_sql, package.json, seed.js y documentacion tecnica.',
  '5. No se detectaron carpetas node_modules en el arbol remoto publicado.',
  '6. No se detectaron archivos .env expuestos en el arbol remoto publicado.',
  '7. El commit visible corresponde a una subida reciente del proyecto.',
  '',
  'Validacion de estructura',
  'Frontend detectado:',
  '- public/',
  '- src/',
  '- package.json',
  '- componentes, paginas, servicios y configuracion de API',
  '',
  'Backend detectado:',
  '- src/config',
  '- src/controllers',
  '- src/models',
  '- src/routes',
  '- src/middlewares',
  '- scripts_sql',
  '- package.json',
  '- seed.js',
  '',
  'Aspectos correctos',
  '- El proyecto no quedo incompleto en GitHub.',
  '- Se subieron ambas partes del sistema: frontend y backend.',
  '- La organizacion general del repositorio es coherente con una entrega academica.',
  '- La ausencia de node_modules y .env en el remoto indica una subida mas limpia.',
  '',
  'Observaciones',
  '- En la raiz del repositorio existe un package.json adicional. Esto no es un error,',
  '  pero conviene revisar si realmente cumple una funcion o si puede generar confusion.',
  '- En el frontend se observaron algunos archivos vacios. Esto no afecta la validez de la',
  '  subida a Git, pero puede indicar partes aun no implementadas o reservadas para uso futuro.',
  '',
  'Conclusion',
  'Despues del analisis del repositorio remoto, la subida a GitHub se considera correcta en',
  'terminos generales. El proyecto publicado contiene la estructura principal esperada, no',
  'expone dependencias pesadas ni variables de entorno y permite identificar claramente el',
  'backend y el frontend del sistema Hotel El Sol.',
  '',
  'Recomendaciones finales',
  '1. Mantener un README principal en la raiz con instrucciones de ejecucion.',
  '2. Verificar si el package.json de la raiz es necesario.',
  '3. Probar el proyecto desde una clonacion limpia antes de la entrega final.',
  '4. Confirmar que el frontend consume correctamente el backend en los puertos esperados.',
];

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPages(textLines, pageWidth, pageHeight, margin, fontSize, lineHeight) {
  const usableHeight = pageHeight - margin * 2;
  const linesPerPage = Math.max(1, Math.floor(usableHeight / lineHeight));
  const pages = [];

  for (let index = 0; index < textLines.length; index += linesPerPage) {
    pages.push(textLines.slice(index, index + linesPerPage));
  }

  return pages.map((pageLines) => {
    let content = 'BT\n/F1 ' + fontSize + ' Tf\n';
    let y = pageHeight - margin;

    for (const line of pageLines) {
      content += `${margin} ${y} Td (${escapePdfText(line)}) Tj\n`;
      content += `0 -${lineHeight} Td\n`;
      y -= lineHeight;
    }

    content += 'ET\n';
    return content;
  });
}

function generatePdf(textLines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const fontSize = 12;
  const lineHeight = 16;
  const pageContents = buildPages(textLines, pageWidth, pageHeight, margin, fontSize, lineHeight);

  const objects = [];

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kids = [];
  const pageObjectNumbers = [];
  const contentObjectNumbers = [];

  for (let index = 0; index < pageContents.length; index += 1) {
    const pageObjectNumber = 4 + index * 2;
    const contentObjectNumber = 5 + index * 2;
    pageObjectNumbers.push(pageObjectNumber);
    contentObjectNumbers.push(contentObjectNumber);
    kids.push(`${pageObjectNumber} 0 R`);
  }

  objects.push(`2 0 obj\n<< /Type /Pages /Count ${pageContents.length} /Kids [ ${kids.join(' ')} ] >>\nendobj\n`);
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  for (let index = 0; index < pageContents.length; index += 1) {
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = contentObjectNumbers[index];
    const contentStream = pageContents[index];
    const contentLength = Buffer.byteLength(contentStream, 'utf8');

    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}endstream\nendobj\n`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

const pdfContent = generatePdf(lines);
fs.writeFileSync(outputPath, pdfContent, 'binary');

console.log(`PDF generado en: ${outputPath}`);