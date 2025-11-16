# Backend LimaUrban - NestJS

Backend API para el sistema de reportes urbanos LimaUrban. Implementa el 20% de operaciones complejas del sistema que requieren procesamiento especializado: detección de categorías con YOLO AI, generación de mapas de calor geoespaciales, y análisis de clustering de incidentes.

## Tabla de Contenidos

1. [Propósito del Backend](#propósito-del-backend)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Endpoints Disponibles](#endpoints-disponibles)
7. [Cómo Funciona](#cómo-funciona)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Testing](#testing)
10. [Despliegue](#despliegue)

---

## Propósito del Backend

LimaUrban utiliza una **arquitectura híbrida (80/20)**:

- **80% de operaciones**: Los clientes (web/móvil) se conectan directamente a Supabase para CRUD simple (listar incidentes, agregar comentarios, cambiar estados). Esto reduce latencia y carga en el backend.

- **20% de operaciones**: El backend maneja únicamente procesos complejos que NO pueden ejecutarse eficientemente desde el cliente:
  - **Creación de incidentes con foto**: Requiere llamar a YOLO API para detección de categorías (baches, grietas, etc.)
  - **Generación de heatmaps**: Algoritmo de clustering geoespacial con grid de 500m x 500m
  - **Análisis de duplicados**: Lógica de negocio compleja para detectar incidentes repetidos

### ¿Por qué esta arquitectura?

**Ventajas:**
- Reduce latencia en operaciones simples (50-100ms vs 200-500ms)
- Escala horizontalmente: Supabase maneja millones de queries
- Backend se enfoca solo en lógica compleja
- Menor costo de infraestructura

**Trade-offs:**
- Dos fuentes de verdad (Supabase + Backend)
- RLS de Supabase debe estar configurado correctamente
- Validaciones duplicadas (cliente + backend)

---

## Stack Tecnológico

- **Framework:** NestJS 11 (TypeScript)
- **Runtime:** Node.js 22+
- **Package Manager:** pnpm 9+
- **Database:** Supabase (PostgreSQL 15 + PostGIS 3.3)
- **Authentication:** JWT validation (tokens generados por Supabase Auth)
- **External APIs:** 
  - YOLO Detection Service (Azure) - Detección de categorías en imágenes
- **Documentation:** Swagger/OpenAPI 3.0

---

## Arquitectura del Sistema

### Estructura de Directorios

```
src/
├── config/                      # Configuración de la aplicación
│   └── env.validation.ts        # Validación de variables de entorno
│
├── modules/                     # Módulos funcionales (domain-driven)
│   ├── auth/                    # Autenticación y autorización
│   │   ├── decorators/          # @CurrentUser()
│   │   ├── guards/              # JwtAuthGuard
│   │   └── strategies/          # JWT strategy
│   │
│   ├── supabase/                # Cliente de Supabase
│   │   └── supabase.service.ts  # Singleton del cliente
│   │
│   ├── yolo/                    # Integración con YOLO API
│   │   ├── yolo.service.ts      # Llamadas HTTP a Azure
│   │   └── dto/                 # Request/Response DTOs
│   │
│   ├── incidents/               # Gestión de incidentes
│   │   ├── incidents.controller.ts
│   │   ├── incidents.service.ts # Lógica de creación + YOLO
│   │   └── dto/                 # CreateIncidentDto
│   │
│   ├── geospatial/              # Análisis geoespacial
│   │   ├── geospatial.controller.ts
│   │   ├── geospatial.service.ts # Heatmap algorithm
│   │   ├── dto/                  # CreateHeatmapDto
│   │   └── interfaces/           # HeatmapPoint, GeospatialAnalysis
│   │
│   ├── storage/                 # Gestión de archivos
│   │   └── storage.service.ts   # Upload/Download de fotos
│   │
│   └── health/                  # Health checks
│       └── health.controller.ts # GET /health
│
└── main.ts                      # Entry point (bootstrap)
```

### Principios de Diseño

1. **Layered Architecture**: Separación clara entre Controller → Service → External APIs
2. **Dependency Injection**: Todas las dependencias inyectadas por NestJS
3. **Single Responsibility**: Cada módulo maneja un dominio específico
4. **Thin Controllers, Fat Services**: Controllers solo manejan HTTP, lógica en Services
5. **DTOs para validación**: class-validator para validar requests

---

## Instalación

### Prerrequisitos

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- Cuenta de Supabase con proyecto creado
- Acceso a YOLO Detection API (Azure)

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/Arquitectura-Software-Emergentes/backend-limaurban.git
cd backend-limaurban

# 2. Instalar dependencias
pnpm install

# 3. Copiar archivo de variables de entorno
cp .env.example .env

# 4. Editar .env con tus credenciales (ver sección Configuración)
nano .env

# 5. Compilar TypeScript
pnpm build

# 6. Iniciar en modo desarrollo
pnpm start:dev
```

El servidor estará disponible en `http://localhost:3001`

---

## Configuración

### Variables de Entorno Requeridas

```env
# Configuración de la aplicación
NODE_ENV=development          # development | production
PORT=3001                     # Puerto del servidor

# Supabase (PostgreSQL + Storage)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # Clave pública para validar JWTs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Clave privada (NUNCA exponer al cliente)

# YOLO Detection API (Azure)
YOLO_API_URL=http://detection-issue-service.eastus2.cloudapp.azure.com
YOLO_API_CLIENT=backend-reportes-infrastructure-2025
YOLO_API_KEY=bk_live_xxxxx  # API Key proporcionada por Azure
```

### Configuración de Supabase

**Tablas requeridas:**
- `incidents` - Incidentes reportados
- `yolo_detections` - Resultados de detección AI
- `geospatial_analyses` - Análisis geoespaciales generados
- `heatmap_points` - Puntos del mapa de calor
- `users` - Usuarios del sistema
- `roles` - Roles (CITIZEN, MUNICIPALITY_STAFF)

**Row Level Security (RLS):**
El backend usa `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS. Sin embargo, los clientes (web/móvil) usan `SUPABASE_ANON_KEY` y están protegidos por RLS.

---

## Endpoints Disponibles

### Documentación Interactiva (Swagger)

Una vez iniciado el servidor, accede a la documentación completa en:
- **URL**: `http://localhost:3001/api/docs`
- **Autenticación**: Clic en "Authorize", pegar JWT token de Supabase
- **Try it out**: Probar endpoints directamente desde el navegador

### Health Check

**Endpoint**: `GET /api/health`

Verifica el estado del servidor y la conexión con Supabase.

### Incidentes

**Endpoint**: `POST /api/incidents/create`

Crea un nuevo incidente con foto y detección automática de categoría usando YOLO AI.

**Requiere**:
- JWT token válido (header `Authorization: Bearer <token>`)
- Foto previamente subida a Supabase Storage
- Coordenadas GPS (latitude, longitude)
- Descripción del incidente

**Retorna**:
- ID del incidente creado
- Categoría detectada por YOLO (bache, grieta, etc.)
- Nivel de confianza de la detección (0.0 - 1.0)
- URL de la imagen anotada por YOLO (Cloudinary)

### Análisis Geoespacial

**Endpoint**: `POST /api/geospatial/heatmap`

Genera un mapa de calor agrupando incidentes en una cuadrícula de 500m x 500m.

**Requiere**:
- JWT token válido (solo personal municipal)
- Rango de fechas para analizar
- Opcional: código de distrito para filtrar

**Retorna**:
- ID del análisis generado
- Cantidad de puntos en el mapa
- Intensidad máxima encontrada
- Timestamp de generación

**Uso posterior**: Los clientes consultan `heatmap_points` directamente desde Supabase usando el `analysis_id`.

---

## Cómo Funciona

### 1. Creación de Incidente con YOLO

**Flujo del proceso**:

1. Cliente móvil captura foto y la sube a Supabase Storage
2. Cliente llama a `POST /api/incidents/create` con URL de la foto
3. Backend envía foto a YOLO API para detección automática
4. YOLO procesa imagen y retorna categoría detectada (bache, grieta, etc.)
5. Backend mapea categoría YOLO a código de base de datos
6. Backend inserta incidente en tabla `incidents` con campos AI
7. Backend inserta registro de detección en tabla `yolo_detections`
8. Backend retorna resultado al cliente con categoría y confianza

**Mapeo de Categorías**:

| YOLO API | Database Code | Categoría Español |
|----------|---------------|-------------------|
| bache | POTHOLE | Baches |
| grieta | CRACK | Grietas |
| alcantarilla | MANHOLE | Alcantarillas |
| basura | GARBAGE | Basura |
| iluminacion | LIGHTING | Iluminación |
| otro | OTHER | Otro |

### 2. Generación de Mapa de Calor

**Algoritmo de Grid (500m x 500m)**:

**Paso 1 - Obtener incidentes**:
- Consulta incidentes filtrados por rango de fechas
- Opcionalmente filtra por distrito específico
- Ejemplo: 42 incidentes en San Juan de Lurigancho entre enero y noviembre 2025

**Paso 2 - Agrupar por celdas del grid**:
- Divide el mapa en celdas de 500m x 500m
- Cada incidente se asigna a una celda según sus coordenadas
- Celdas con múltiples incidentes indican zonas de alta densidad

**Paso 3 - Calcular intensidad normalizada**:
- Cuenta incidentes por celda
- Normaliza valores entre 0.0 (mínimo) y 1.0 (máximo)
- Formula: `(count - minCount) / (maxCount - minCount)`
- Resultado: Celda con más incidentes = 1.0 (zona crítica)

**Paso 4 - Almacenar resultados**:
- Crea registro en `geospatial_analyses` con metadata del análisis
- Inserta puntos en `heatmap_points` con coordenadas e intensidad
- Actualiza estado del análisis a "completado"

**Interpretación de Resultados**:

- **total_points (5-10)**: Problema localizado en pocas zonas específicas
- **total_points (100+)**: Problema disperso en toda la ciudad
- **intensity (0.8-1.0)**: Zona crítica que requiere atención urgente
- **intensity (0.4-0.7)**: Zona de densidad media
- **intensity (0.0-0.3)**: Zona de baja densidad

---

## Ejemplos de Uso

### Ejemplo 1: Crear Incidente desde App Móvil

**Flujo**:
1. Usuario toma foto del bache con la cámara del dispositivo
2. App sube foto a Supabase Storage bucket `yolo_model`
3. App obtiene URL pública de la foto
4. App envía POST a `/api/incidents/create` con foto, coordenadas y descripción
5. Backend procesa con YOLO y retorna categoría detectada

**Resultado esperado**: Incidente creado con categoría automática "POTHOLE" y confianza 0.91

### Ejemplo 2: Generar Heatmap desde Dashboard Web

**Flujo**:
1. Personal municipal selecciona distrito y rango de fechas en el dashboard
2. Dashboard envía POST a `/api/geospatial/heatmap`
3. Backend agrupa incidentes en grid de 500m x 500m
4. Backend calcula intensidad por celda y guarda en `heatmap_points`
5. Dashboard consulta puntos directamente desde Supabase
6. Dashboard renderiza mapa de calor en Mapbox con gradiente de colores

**Resultado esperado**: Mapa visualizando 8 zonas con diferentes intensidades, identificando hotspots críticos

---

## Testing

### Unit Tests

Ejecuta tests unitarios de servicios, controladores y módulos individuales.

```bash
# Todos los tests
pnpm test

# Watch mode (re-ejecuta al guardar cambios)
pnpm test:watch

# Cobertura de código
pnpm test:cov
```

### Integration Tests

Ejecuta tests de integración que verifican múltiples módulos trabajando juntos.

```bash
pnpm test:e2e
```

### Manual Testing con Swagger

La forma más rápida de probar endpoints es usando la interfaz interactiva de Swagger.

**Pasos**:
1. Inicia el servidor en desarrollo
2. Abre navegador en `http://localhost:3001/api/docs`
3. Clic en "Authorize" (candado verde)
4. Pega tu JWT token de Supabase
5. Expande el endpoint que deseas probar
6. Clic en "Try it out"
7. Completa los parámetros requeridos
8. Clic en "Execute"
9. Revisa la respuesta en tiempo real

**Obtener JWT para Testing**:
- Inicia sesión en la app frontend
- Abre DevTools del navegador
- Revisa las cookies o localStorage para encontrar el token JWT
- Copia el valor completo (debe iniciar con `eyJ...`)

---

## Deployment

### Variables de Entorno

Configura las siguientes variables antes de desplegar:

```env
# Backend API
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://lima-urban.vercel.app

# Supabase
SUPABASE_URL=https://vnahrflmnhhrixhkrgad.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# YOLO Detection API
YOLO_API_URL=http://detection-issue-service.eastus2.cloudapp.azure.com
YOLO_API_CLIENT=backend-reportes-infrastructure-2025
YOLO_API_KEY=tu_yolo_api_key
```

### Build para Producción

Genera el bundle optimizado de NestJS.

```bash
pnpm build
```

### Deployment en Railway

Railway detecta automáticamente proyectos NestJS y configura el build.

**Pasos**:
1. Crea cuenta en Railway
2. Conecta tu repositorio de GitHub
3. Railway detecta el proyecto NestJS automáticamente
4. Configura las variables de entorno en el dashboard
5. Railway ejecuta `pnpm install` y `pnpm build` automáticamente
6. El servidor inicia con `node dist/main.js`

**Configuración Adicional**:
- **Start Command**: `node dist/main.js`
- **Health Check Path**: `/api/health`
- **Port**: Railway asigna automáticamente (la app lee `process.env.PORT`)

### Deployment en Azure App Service

Azure soporta Node.js y puede ejecutar aplicaciones NestJS.

**Pasos**:
1. Crea App Service en Azure Portal
2. Configura Runtime Stack: Node.js 22 LTS
3. Configura variables de entorno en Configuration → Application Settings
4. Conecta repositorio GitHub para despliegue continuo
5. Azure ejecuta `pnpm install` y `pnpm build` automáticamente
6. Configura startup command: `node dist/main.js`

**Configuración de CORS**:
- Agrega dominio de frontend en variables de entorno `FRONTEND_URL`
- El backend ya tiene configuración dinámica de CORS en `main.ts`

### Verificación Post-Deployment

Una vez desplegado, verifica que todo funciona correctamente:

1. **Health Check**: `GET https://tu-dominio/api/health`
   - Debe retornar `{ status: "ok", supabase: "connected" }`

2. **Swagger Docs**: `https://tu-dominio/api/docs`
   - Debe mostrar interfaz interactiva con todos los endpoints

3. **Crear Incidente**: Prueba `POST /api/incidents/create` desde Swagger
   - Verifica que YOLO API responde correctamente
   - Revisa que los datos se guardan en Supabase

4. **Generar Heatmap**: Prueba `POST /api/geospatial/heatmap` desde Swagger
   - Verifica que se generan puntos en `heatmap_points`
   - Confirma que intensidad está entre 0.0 y 1.0

---

## Troubleshooting

### Error: "Unauthorized - JWT invalid"

**Causa**: Token JWT mal formado o expirado.

**Solución**:
- Verifica que el header incluye `Authorization: Bearer <token>`
- Confirma que el token no ha expirado (revisa campo `exp` del JWT)
- Genera un nuevo token iniciando sesión de nuevo en la app

### Error: "YOLO API timeout"

**Causa**: YOLO API no responde dentro del tiempo límite.

**Solución**:
- Verifica que `YOLO_API_URL` es correcto
- Confirma que `YOLO_API_KEY` es válido
- Revisa logs del servicio YOLO en Azure
- Incrementa timeout en `yolo.service.ts` si es necesario

### Error: "Supabase connection failed"

**Causa**: Credenciales incorrectas o red bloqueada.

**Solución**:
- Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Confirma que Supabase permite conexiones desde tu IP/servidor
- Revisa firewall y reglas de seguridad de red

### Heatmap retorna 0 puntos

**Causa**: No hay incidentes en el rango de fechas o distrito especificado.

**Solución**:
- Verifica que existen incidentes en la base de datos para ese periodo
- Confirma que el `district_code` es válido (43 distritos disponibles)
- Ajusta el rango de fechas para incluir más datos

---

## Contribución

### Flujo de Trabajo

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Implementa cambios siguiendo las convenciones del proyecto
3. Escribe tests para tu código (unitarios + e2e)
4. Ejecuta `pnpm test` para verificar que todo pasa
5. Ejecuta `pnpm lint` para verificar estilo de código
6. Commit con mensaje descriptivo: `git commit -m "feat: añadir endpoint de notificaciones"`
7. Push y crea Pull Request en GitHub

### Convenciones de Código

- **Archivos**: `kebab-case` (ejemplo: `geospatial.service.ts`)
- **Clases**: `PascalCase` (ejemplo: `GeospatialService`)
- **Variables/Funciones**: `camelCase` (ejemplo: `createHeatmap`)
- **Constantes**: `UPPER_SNAKE_CASE` (ejemplo: `GRID_CELL_SIZE`)
- **Database Fields**: `snake_case` (ejemplo: `ai_detected_category`)

---

## Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev        # Modo watch (hot reload)
pnpm start:debug      # Modo debug (inspector en puerto 9229)

# Producción
pnpm build            # Compilar TypeScript a dist/
pnpm start:prod       # Ejecutar versión compilada

# Testing
pnpm test             # Unit tests
pnpm test:watch       # Tests en modo watch
pnpm test:cov         # Coverage report
pnpm test:e2e         # End-to-end tests

# Code Quality
pnpm lint             # ESLint (verificar errores)
pnpm format           # Prettier (formatear código)
```

---

## Seguridad

### Mejores Prácticas Implementadas

1. **JWT Validation**: Todos los endpoints (excepto /health) requieren JWT válido
2. **Environment Variables**: Secrets nunca en código, solo en .env
3. **RLS en Supabase**: Row Level Security protege datos en el cliente
4. **Service Role Key**: Solo usada en backend, nunca expuesta
5. **CORS**: Configurado solo para dominios permitidos
6. **Rate Limiting**: Implementar en producción (nginx/CloudFlare)


## Notas Importantes

### Arquitectura Híbrida 80/20

- **80% operaciones directas a Supabase**: Login, listar incidentes, agregar comentarios, cambiar estados
- **20% operaciones vía Backend**: Crear incidentes (YOLO), generar heatmaps, clustering

### ¿Por qué no todo pasa por el Backend?

**Ventajas de conexión directa a Supabase:**
- Menor latencia (50ms vs 200-500ms)
- Escalabilidad horizontal (Supabase maneja millones de queries)
- Menor costo de infraestructura
- Realtime subscriptions nativas (WebSockets)

**Cuándo usar el Backend:**
- Operaciones que requieren llamadas a APIs externas (YOLO)
- Algoritmos complejos (clustering geoespacial)
- Lógica de negocio que no puede ejecutarse en el cliente

### Limitaciones Conocidas

1. **Heatmap Grid Fijo**: Grid de 500m puede ocultar micro-hotspots
2. **Sin Cache**: Heatmaps se regeneran cada vez (futura mejora: Redis)
3. **YOLO Timeout**: Si YOLO tarda >30s, el request falla (retry manual requerido)

### v1.0.0 (2025-11-15)
- Implementación inicial
- Endpoint de creación de incidentes con YOLO
- Endpoint de generación de heatmaps
- Documentación Swagger completa
