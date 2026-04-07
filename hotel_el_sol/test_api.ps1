# Script de prueba de API - Validación de cambios de seguridad

Write-Host "=== TEST 1: Validar que login sin credenciales es rechazado ===" -ForegroundColor Cyan
$resp = curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email": "", "password": ""}'
Write-Host $resp -ForegroundColor Green

Write-Host "`n=== TEST 2: Login exitoso con admin ===" -ForegroundColor Cyan
$adminResp = curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email": "admin@hotel.com", "password": "admin123"}' | ConvertFrom-Json
$adminToken = $adminResp.token
Write-Host "Admin token obtenido: $($adminResp.user.rol)" -ForegroundColor Green

Write-Host "`n=== TEST 3: Login exitoso con cliente ===" -ForegroundColor Cyan
$clienteResp = curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email": "cliente1@email.com", "password": "cliente123"}' | ConvertFrom-Json
$clienteToken = $clienteResp.token
$clienteId = $clienteResp.user.id
Write-Host "Cliente $clienteId token obtenido: $($clienteResp.user.rol)" -ForegroundColor Green

Write-Host "`n=== TEST 4: Cliente intenta crear reserva para otro usuario (debe fallar 403) ===" -ForegroundColor Cyan
$reservaBody = '{"id_usuario": 999, "id_habitacion": 1, "fecha_checkin": "2026-04-15", "fecha_checkout": "2026-04-20", "total_huespedes": 2, "servicios": []}'
$respFail = curl -s -X POST http://localhost:3000/api/reservas -H "Content-Type: application/json" -H "Authorization: Bearer $clienteToken" -d $reservaBody
Write-Host $respFail -ForegroundColor Yellow

Write-Host "`n=== TEST 5: Cliente crea reserva sin especificar id_usuario (debe usar su propio id) ===" -ForegroundColor Cyan
$reservaOkBody = '{"id_habitacion": 1, "fecha_checkin": "2026-04-20", "fecha_checkout": "2026-04-25", "total_huespedes": 1, "servicios": []}'
$respOk = curl -s -X POST http://localhost:3000/api/reservas -H "Content-Type: application/json" -H "Authorization: Bearer $clienteToken" -d $reservaOkBody | ConvertFrom-Json
if ($respOk.data.id_reserva) {
  Write-Host "Reserva creada exitosamente con ID: $($respOk.data.id_reserva)" -ForegroundColor Green
  $reservaId = $respOk.data.id_reserva
} else {
  Write-Host "Error: $($respOk.message)" -ForegroundColor Red
}

Write-Host "`n=== TEST 6: Cliente intenta ver factura de otro usuario (debe fallar 403) ===" -ForegroundColor Cyan
$respFacturaFail = curl -s -X GET http://localhost:3000/api/facturacion/usuario/999 -H "Authorization: Bearer $clienteToken"
Write-Host $respFacturaFail -ForegroundColor Yellow

Write-Host "`n=== TEST 7: Admin puede listar todas las facturas (debe funcionar) ===" -ForegroundColor Cyan
$respFacturaAdmin = curl -s -X GET http://localhost:3000/api/facturacion/todas -H "Authorization: Bearer $adminToken" | ConvertFrom-Json
Write-Host "Total facturas (para admin): $($respFacturaAdmin.total)" -ForegroundColor Green

Write-Host "`n✅ VALIDACIÓN COMPLETADA" -ForegroundColor Green
