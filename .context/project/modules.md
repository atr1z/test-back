# Especificaciones Técnicas del Sistema de Administración de Fraccionamientos

## 1.1. Módulo de Manejo de Mensualidades y Finanzas

### 1.1.1. Sistema de Ingresos y Egresos del Fraccionamiento
**Funcionalidades:**
- Registro manual de movimientos financieros por parte del administrador
- Categorización de gastos (operativos, mantenimiento, servicios, etc.)
- Registro de ingresos por cuotas, rentas y otros conceptos
- Sistema de comprobación de pagos en efectivo (caja chica)
- Conciliación bancaria semiautomática

**Especificaciones Técnicas:**
- **Base de datos:**
  - Tabla `financial_transactions`: `id`, `type` (ingreso/egreso), `category`, `amount`, `description`, `date`, `admin_id`, `evidence_url`, `status`, `payment_method`
  - Tabla `expense_categories`: `id`, `name`, `description`, `budget_limit`, `is_active`
  - Tabla `cash_receipts`: `id`, `resident_id`, `amount`, `receipt_number`, `received_by`, `received_at`, `status`
- **API endpoints:**
  - `POST /api/transactions` - Crear nuevo movimiento
  - `GET /api/transactions?type=ingreso&month=2024-01` - Filtrar transacciones
  - `POST /api/cash-receipts` - Registrar pago en efectivo
  - `PUT /api/transactions/{id}/reconcile` - Conciliar transacción
- **Validaciones:**
  - Verificación de duplicados por referencia bancaria
  - Límites presupuestales por categoría
  - Aprobación para gastos mayores a umbral configurable

### 1.1.2. Sistema de Inventario de Recursos
**Funcionalidades:**
- Catálogo de activos del fraccionamiento
- Control de depreciación y vida útil
- Historial de mantenimiento y reparaciones
- Sistema de asignación de responsabilidad
- Alertas por mantenimiento próximo

**Especificaciones Técnicas:**
- **Base de datos:**
  - Tabla `assets`: `id`, `name`, `category`, `serial_number`, `purchase_date`, `purchase_value`, `current_value`, `location`, `responsible_person`, `status`
  - Tabla `asset_maintenance`: `id`, `asset_id`, `maintenance_type`, `date`, `cost`, `provider`, `next_maintenance_date`, `notes`
  - Tabla `asset_depreciation`: `id`, `asset_id`, `month`, `depreciation_amount`, `remaining_value`
- **API endpoints:**
  - `GET /api/assets` - Listar activos con filtros
  - `POST /api/assets/maintenance` - Registrar mantenimiento
  - `GET /api/assets/depreciation-report` - Reporte de depreciación
- **Cron Jobs:**
  - Cálculo mensual de depreciación automática
  - Alertas por mantenimiento pendiente (7 días antes)

### 1.1.3. Generación Automática de Cuotas Mensuales
**Funcionalidades:**
- Sistema de reglas configurables para cálculo de cuotas
- Cálculo proporcional por tipo de propiedad (casa, departamento)
- Inclusión automática de multas y cargos adicionales
- Estados diferenciados: generado, pendiente, pagado, vencido
- Reporte de cartera vencida y por cobrar

**Flujo Detallado:**

1. **Generación (Día 1 de cada mes):**
   - Sistema calcula cuota base según configuración
   - Agrega multas pendientes del mes anterior
   - Incluye cargos por reservas de áreas comunes con costo
   - Aplica descuentos o recargos configurados
   - Estado inicial: "Generado"

2. **Notificación (Día 2):**
   - Envío automático de estado de cuenta detallado
   - Desglose por conceptos con enlaces a evidencias
   - Opciones de pago disponibles según configuración

3. **Proceso de Pago - Dos Flujos:**

**Flujo A: Con Pasarela de Pago**
```
Vecino → Selecciona método de pago → Procesa en pasarela → 
Confirmación automática → Estado cambia a "Pagado" → 
Generación automática de recibo digital
```

**Flujo B: Sin Pasarela de Pago**
```
Vecino → Realiza transferencia bancaria → Sube comprobante → 
Sistema marca como "Pendiente de Validación" → 
Administrador valida comprobante → 
Si válido: Estado "Pagado" + Notificación a vecino
Si inválido: Estado "Comprobante Rechazado" + Notificación con motivo
```

4. **Seguimiento (Durante el mes):**
   - Recordatorios automáticos a los 5, 10 y 15 días de vencimiento
   - Aplicación automática de recargos por mora (configurable)
   - Restricción de privilegios según reglas de morosidad

**Especificaciones Técnicas:**
- **Base de datos:**
  - Tabla `monthly_dues`: `id`, `resident_id`, `month`, `year`, `base_amount`, `total_amount`, `due_date`, `status`, `payment_method`, `paid_at`
  - Tabla `due_items`: `id`, `due_id`, `concept`, `amount`, `type` (cuota/multa/reserva), `reference_id`
  - Tabla `payment_proofs`: `id`, `due_id`, `proof_url`, `uploaded_at`, `validated_by`, `validated_at`, `validation_status`, `rejection_reason`
  - Tabla `payment_config`: `id`, `payment_method`, `is_active`, `config_data` (JSON), `commission_percentage`
- **API endpoints:**
  - `POST /api/dues/generate-monthly` - Generación masiva de cuotas (cron job)
  - `GET /api/residents/{id}/current-due` - Obtener cuota actual del vecino
  - `POST /api/dues/{id}/upload-proof` - Subir comprobante de pago
  - `PUT /api/dues/{id}/validate-payment` - Validar pago manual (admin)
  - `GET /api/dues/overdue-report` - Reporte de morosidad
- **Cron Jobs:**
  - Generación automática de cuotas: 00:00 día 1 de cada mes
  - Recordatorios: días 5, 10, 15 después del vencimiento
  - Aplicación de recargos: día 5 después del vencimiento
- **Integraciones:**
  - Stripe/MercadoPago: Webhooks para confirmación de pago
  - Notificaciones: Email + Push para cada cambio de estado
  - Sistema de restricciones: Webhook al marcar como vencido

### 1.1.4. Sistema de Notificaciones Financieras
**Funcionalidades:**
- Notificación programada 5 días antes del fin de mes
- Recordatorios escalonados de vencimiento
- Confirmación de pagos recibidos
- Alertas de comprobantes rechazados
- Recordatorios de morosidad

**Especificaciones Técnicas:**
- **Configuración:** Plantillas personalizables por tipo de notificación
- **Canal:** Email, Push Notification, SMS (opcional)
- **Horarios:** Configurables por administración
- **Personalización:** Variables dinámicas (`{nombre}`, `{monto}`, `{fecha}`)

### 1.1.5. Historial de Pagos y Adeudos
**Funcionalidades:**
- Vista detallada por vecino con línea de tiempo
- Filtros por período, estado y concepto
- Exportación a Excel/PDF
- Gráficos de tendencia de pagos
- Comparativa con meses anteriores

**Control de Acceso:**
- **Vecinos:** Solo su propio historial
- **Administradores:** Historial completo con permisos de exportación
- **Comité de Vigilancia:** Solo datos agregados (sin información personal)

### 1.1.6. Integración con Pasarelas de Pago
**Funcionalidades:**
- Configuración múltiple de proveedores
- Switch on/off por administración
- Cálculo automático de comisiones
- Reconcilación automática de pagos
- Fallback a método manual si pasarela falla

**Especificaciones Técnicas:**
- **Arquitectura:** Patrón Strategy para múltiples proveedores
- **Configuración:** Panel administrativo para credenciales y comisiones
- **Webhooks:** Endpoints dedicados para confirmación de cada proveedor
- **Logs:** Auditoría completa de transacciones y webhooks recibidos

### 1.1.7. Generación de Estados de Cuenta y Reportes
**Funcionalidades:**
- Estados de cuenta individuales por vecino
- Reporte consolidado de ingresos/egresos
- Reporte de cartera por edades
- Estado de resultados mensual
- Balance general acumulado

**Formatos de Salida:**
- PDF con branding del fraccionamiento
- Excel con datos crudos para análisis
- Gráficos interactivos en dashboard
- Vista previa en navegador antes de descarga

**Especificaciones Técnicas:**
- **Generación PDF:** Puppeteer/Chromium para HTML a PDF
- **Plantillas:** Sistema de plantillas con variables dinámicas
- **Caché:** Reportes frecuentes cacheados por 24 horas
- **Programación:** Reportes recurrentes enviados automáticamente

---

## Resumen de Configuraciones Clave

### Configuración Financiera
```yaml
payment:
  due_day: 5                    # Día de vencimiento mensual
  late_fee_percentage: 5        % # Recargo por mora
  late_fee_after_days: 5        # Días después del vencimiento para aplicar recargo
  payment_methods:
    - stripe
    - mercadopago
    - bank_transfer
  default_method: bank_transfer # Si no hay pasarela configurada
  
notifications:
  advance_notice_days: 5        # Notificación previa al vencimiento
  reminders: [5, 10, 15]        # Días después del vencimiento para recordatorios
  channels: [email, push]       # Canales de notificación
  
reporting:
  financial_report_day: 28       # Día para generar reporte mensual
  retention_years: 5             # Años de retención de datos financieros
```
### 1.2. Módulo de Biblioteca Digital de Documentos
**Funcionalidades:**
- Upload de documentos PDF (estados financieros, presupuestos, reglamentos)
- Categorización y etiquetado de documentos
- Control de acceso por tipo de usuario

### 1.3. Módulo de Control de Privilegios por Morosidad
**Funcionalidades:**
- Sistema de reglas configurables para morosidad
- Ejecución automática de restricciones según días de atraso
- Dashboard de administración para gestión de excepciones
- Sistema de notificaciones escalonadas

## 2. Seguridad y Control de Acceso

### 2.1. Sistema de Visitas con QR
**Funcionalidades:**
- Generación de QR con validez temporal (configurable)
- Escaneo por guardias con validación en tiempo real
- Límites de visitas por día/hora configurables
- Historial de visitas con fotos (opcional)

### 2.2. Botón de Pánico
**Funcionalidades:**
- Activación con confirmación (para evitar falsas alarmas)
- Notificación inmediata a caseta y administración
- Opcional: Notificación a vecinos designados como "contactos de emergencia"
- Geolocalización automática al activarse

### 2.3. Control de Portón Eléctrico
**Funcionalidades:**
- Integración con sistemas de portón existentes (API o hardware)
- Apertura remota desde app con autenticación de dos factores
- Historial de aperturas con usuario y timestamp
- Integración con sistema de visitas (apertura automática para visitas validadas)

### 2.4. Sistema de Rondines de Seguridad
**Funcionalidades:**
- Puntos de control con QR estáticos en ubicaciones estratégicas
- App móvil para guardias con escaneo y geolocalización
- Alertas por rondines incompletos o fuera de horario
- Reportes automáticos de cumplimiento

### 2.5. Guardias en Turno
**Funcionalidades:**
- Sistema de check-in/check-out para guardias
- Vista en tiempo real para administración
- Historial de turnos con horas exactas
- Integración con sistema de rondines

## 3. Interacción y Vida Comunitaria

### 3.1. Sistema de Reservas de Áreas Comunes
**Funcionalidades:**
- Calendario interactivo con disponibilidad en tiempo real
- Sistema de aprobación automática o manual (configurable)
- Integración con sistema de pagos para áreas con costo
- Límites de reserva por vecino (días/mes)

### 3.2. Sistema de Reportes de Incidencias
**Funcionalidades:**
- Formularios categorizados por tipo de incidencia
- Sistema de tickets con seguimiento de estado
- Asignación automática/manual a personal de mantenimiento
- Integración con sistema de multas y cargos automáticos

### 3.3. Módulo de Encuestas y Convocatorias
**Funcionalidades:**
- Creación de encuestas con múltiples tipos de preguntas
- Sistema de votación electrónica con verificación de identidad
- Quórum automático y resultados en tiempo real
- Historial de decisiones de la comunidad

### 3.4. Calendario de Eventos Comunitarios
**Funcionalidades:**
- Calendario público de eventos
- Sistema de RSVP con confirmación de asistencia
- Límites de capacidad por evento
- Recordatorios automáticos

## 4. Servicios y Directorios

### 4.1. Directorio de Vecinos y Contactos
**Funcionalidades:**
- Directorio con información básica de vecinos (con control de privacidad)
- Contactos de emergencia y servicios internos
- Búsqueda por nombre, departamento, o servicios ofrecidos
- Sistema de mensajería interna entre vecinos

### 4.2. Directorio de Servicios Externos
**Funcionalidades:**
- Base de datos de proveedores autorizados
- Sistema de calificaciones y reseñas
- Contacto directo desde la app (llamadas, WhatsApp)
- Categorización por tipo de servicio

### 4.3. Marketplace Comunitario
**Funcionalidades:**
- Catálogo de productos y servicios ofrecidos por vecinos
- Sistema de transacciones internas (opcional con pasarela de pagos)
- Sistema de calificaciones y reputación
- Categorización y búsqueda avanzada

## 5. Módulo de Gestión de Paquetería Inteligente

### 5.1. Sistema de Registro Fotográfico
**Funcionalidades:**
- Captura de fotos con metadatos (timestamp, guardia, repartidor)
- OCR opcional para números de guía
- Almacenamiento seguro con retención configurable
- Interfaz optimizada para uso rápido en caseta

### 5.2. Sistema de Notificaciones Automáticas
**Funcionalidades:**
- Notificación inmediata al vecino al registrar paquete
- Recordatorios automáticos después de X días sin recoger
- Sistema de alertas para paquetes frágiles o refrigerados
- Historial completo de notificaciones

### 5.3. Sistema de Entrega con Firma Digital
**Funcionalidades:**
- Firma digital en dispositivo del guardia
- Verificación de identidad del vecino (comparación de foto opcional)
- Comprobante digital de entrega (PDF)
- Integración con sistema de acceso (solo vecinos activos pueden recibir)

## 6. Consideraciones de Infraestructura

### 6.1. Arquitectura General
- **Backend:** API REST con Express
- **Frontend Web:** React.js con TypeScript para panel de administración con ShadCN
- **App Móvil:** Kotlin para Android y SwfitUI para iOS (Aplicaciones nativas)
- **Base de Datos:** PostgreSQL con Redis para cache y sesiones
- **Almacenamiento:** S3/Cloud Storage para archivos multimedia (Minio)

### 6.2. Seguridad
- Autenticación JWT con refresh tokens
- HTTPS obligatorio en todos los endpoints
- Rate limiting por IP/usuario
- Auditoría de logs de todas las operaciones críticas
- Backup automático diario de base de datos

### 6.3. Escalabilidad
- Contenedores Docker para fácil despliegue
- Balanceo de carga para API y WebSocket servers
- CDN para archivos estáticos y multimedia
- Sistema de colas para procesos asíncronos (RabbitMQ/Redis)

### 6.4. Monitoreo y Mantenimiento
- Logs centralizados (ELK Stack o similar)
- Monitoreo de rendimiento (New Relic, Datadog)
- Alertas automáticas para caídas de servicio
- Dashboard de métricas de uso por módulo