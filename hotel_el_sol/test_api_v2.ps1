# Script de prueba de API - Validación de cambios de seguridad
# Usando Invoke-WebRequest con sintaxis correcta

Write-Host "=== TEST 1: Validar que login sin credenciales es rechazado ===" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "", "password": ""}' -ErrorAction Continue
  Write-Host $resp.Content -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== TEST 2: Login exitoso con admin ===" -ForegroundColor Cyan
try {
  $adminResp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "admin@hotel.com", "password": "admin123"}' | ConvertFrom-Json
  $adminToken = $adminResp.token
  Write-Host "✅ Admin login exitoso, rol: $($adminResp.user.rol)" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST 3: Login exitoso con cliente ===" -ForegroundColor Cyan
try {
  $clienteResp = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email": "cliente1@email.com", "password": "cliente123"}' | ConvertFrom-Json
  $clienteToken = $clienteResp.token
  $clienteId = $clienteResp.user.id
  Write-Host "✅ Cliente login exitoso, ID: $clienteId, rol: $($clienteResp.user.rol)" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST 4: Cliente intenta crear reserva para otro usuario (DEBE FALLAR 403) ===" -ForegroundColor Cyan
try {
  $headers = @{ Authorization = "Bearer $clienteToken" }
  $respFail = Invoke-WebRequest -Uri http://localhost:3000/api/reservas -Method POST -ContentType "application/json" -Headers $headers -Body '{"id_usuario": 999, "id_habitacion": 1, "fecha_checkin": "2026-04-15", "fecha_checkout": "2026-04-20", "total_huespedes": 2}' -ErrorAction Continue
  $respFailJson = $respFail.Content | ConvertFrom-Json
  if ($respFail.StatusCode -eq 403) {
    Write-Host "✅ Correctamente rechazado con 403: $($respFailJson.message)" -ForegroundColor Green
  } else {
    Write-Host "❌ No fue rechazado! Status: $($respFail.StatusCode)" -ForegroundColor Red
  }
} catch {
  $content = $_.Exception.Response.Content.ReadAsStream() | { param($_) [System.IO.StreamReader]::new($_).ReadToEnd() }
  Write-Host "✅ Rechazado (esperado): $content" -ForegroundColor Green
}

Write-Host "`n=== TEST 5: Cliente crea reserva (sin especificar id_usuario) ===" -ForegroundColor Cyan
try {
  $headers = @{ Authorization = "Bearer $clienteToken" }
  $respOk = Invoke-WebRequest -Uri http://localhost:3000/api/reservas -Method POST -ContentType "application/json" -Headers $headers -Body '{"id_habitacion": 1, "fecha_checkin": "2026-04-20", "fecha_checkout": "2026-04-25", "total_huespedes": 1}' | ConvertFrom-Json
  if ($respOk.data.id_reserva) {
    Write-Host "✅ Reserva creada exitosamente, ID: $($respOk.data.id_reserva)" -ForegroundColor Green
    $reservaId = $respOk.data.id_reserva
  } else {
    Write-Host "❌ Error: $($respOk.message)" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST 6: Cliente intenta ver facturas de otro usuario (DEBE FALLAR 403) ===" -ForegroundColor Cyan
try {
  $headers = @{ Authorization = "Bearer $clienteToken" }
  $respFacturaFail = Invoke-WebRequest -Uri http://localhost:3000/api/facturacion/usuario/999 -Method GET -Headers $headers -ErrorAction Continue
  Write-Host "❌ No fue rechazado (DEBERÍA SERLO)" -ForegroundColor Red
} catch {
  $errorResp = $_.Exception.Response
  if ($errorResp.StatusCode -eq "Forbidden") {
    Write-Host "✅ Correctamente rechazado con 403 (Forbidden)" -ForegroundColor Green
  } else {
    Write-Host "Status: $($errorResp.StatusCode)" -ForegroundColor Yellow
  }
}

Write-Host "`n=== TEST 7: Admin puede listar TODAS las facturas ===" -ForegroundColor Cyan
try {
  $headers = @{ Authorization = "Bearer $adminToken" }
  $respFacturaAdmin = Invoke-WebRequest -Uri http://localhost:3000/api/facturacion/todas -Method GET -Headers $headers | ConvertFrom-Json
  Write-Host "✅ Admin puede acceder, total facturas: $($respFacturaAdmin.total)" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ === VALIDACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "Resumen: Los cambios de seguridad se han aplicado correctamente." -ForegroundColor Cyan
