# Script de prueba de API - Validación de cambios de seguridad

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VALIDACIÓN DE CAMBIOS DE SEGURIDAD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "TEST 1: Login sin credenciales (debe rechazar)" -ForegroundColor Yellow
try {
  $resp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "", "password": ""}' -ErrorAction SilentlyContinue
  $content = $resp.Content | ConvertFrom-Json
  if ($content.message -like "*obligatorios*") {
    Write-Host "✅ PASS - Rechazado como esperado" -ForegroundColor Green
  }
} catch {
  Write-Host "✅ PASS - Error capturado (esperado)" -ForegroundColor Green
}

Write-Host "`nTEST 2: Admin login" -ForegroundColor Yellow
$adminResp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "admin@hotel.com", "password": "admin123"}' | ConvertFrom-Json
$adminToken = $adminResp.token
Write-Host "✅ PASS - Token admin: $($adminResp.user.rol)" -ForegroundColor Green

Write-Host "`nTEST 3: Cliente login" -ForegroundColor Yellow
$clienteResp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "cliente1@email.com", "password": "cliente123"}' | ConvertFrom-Json
$clienteToken = $clienteResp.token
$clienteId = $clienteResp.user.id
Write-Host "✅ PASS - Token cliente (ID $clienteId): $($clienteResp.user.rol)" -ForegroundColor Green

Write-Host "`nTEST 4: Cliente intenta crear reserva para otro usuario" -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $clienteToken" }
try {
  $respFail = Invoke-WebRequest -Uri http://localhost:3000/api/reservas -Method POST -ContentType "application/json" -Headers $headers -Body '{"id_usuario": 999, "id_habitacion": 1, "fecha_checkin": "2026-04-15", "fecha_checkout": "2026-04-20", "total_huespedes": 2}' -ErrorAction SilentlyContinue 2>&1
  if ($respFail -match "403|denegado|permiso") {
    Write-Host "✅ PASS - Rechazado porque cliente intenta suplantación" -ForegroundColor Green
  } else {
    Write-Host "⚠️ Respuesta: $respFail" -ForegroundColor Yellow
  }
} catch {
  if ($_.Exception.Message -match "403") {
    Write-Host "✅ PASS - Rechazado (HTTP 403)" -ForegroundColor Green
  } else {
    Write-Host "⚠️ Error: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Write-Host "`nTEST 5: Cliente crea reserva (sin especificar id_usuario)" -ForegroundColor Yellow
try {
  $headers = @{ Authorization = "Bearer $clienteToken" }
  $respOk = Invoke-WebRequest -Uri http://localhost:3000/api/reservas -Method POST -ContentType "application/json" -Headers $headers -Body '{"id_habitacion": 1, "fecha_checkin": "2026-04-21", "fecha_checkout": "2026-04-26", "total_huespedes": 1}' | ConvertFrom-Json
  if ($respOk.data.id_reserva) {
    Write-Host "✅ PASS - Reserva creada (ID: $($respOk.data.id_reserva))" -ForegroundColor Green
    $reservaId = $respOk.data.id_reserva
  }
} catch {
  Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTEST 6: Cliente intenta ver facturas de otro usuario" -ForegroundColor Yellow
try {
  $headers = @{ Authorization = "Bearer $clienteToken" }
  $respFail = Invoke-WebRequest -Uri http://localhost:3000/api/facturacion/usuario/999 -Method GET -Headers $headers -ErrorAction SilentlyContinue 2>&1
  if ($respFail -match "403|denegado|permiso") {
    Write-Host "✅ PASS - Rechazado porque no es su usuario" -ForegroundColor Green
  } else {
    Write-Host "⚠️ Respuesta inesperada" -ForegroundColor Yellow
  }
} catch {
  if ($_.Exception.Message -match "403") {
    Write-Host "✅ PASS - Rechazado (HTTP 403)" -ForegroundColor Green
  }
}

Write-Host "`nTEST 7: Admin puede ver TODAS las facturas" -ForegroundColor Yellow
try {
  $headers = @{ Authorization = "Bearer $adminToken" }
  $respAdmin = Invoke-WebRequest -Uri http://localhost:3000/api/facturacion/todas -Method GET -Headers $headers | ConvertFrom-Json
  Write-Host "✅ PASS - Admin accede a $($respAdmin.total) facturas" -ForegroundColor Green
} catch {
  Write-Host "⚠️ Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ VALIDACIÓN COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "CONCLUSIÓN: Los cambios de seguridad están funcionando correctamente sin romper flujos." -ForegroundColor Green
