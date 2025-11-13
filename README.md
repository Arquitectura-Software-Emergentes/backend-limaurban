# Backend LimaUrban - NestJS

Backend API para el sistema de reportes urbanos LimaUrban. Maneja la integración con YOLO para detección de imágenes, procesamiento geoespacial y operaciones complejas que requieren lógica de negocio.

## Stack Tecnológico

- **Framework:** NestJS 11
- **Runtime:** Node.js 22+
- **Package Manager:** pnpm
- **Database:** Supabase (PostgreSQL + PostGIS)
- **External APIs:** YOLO Detection Service (Azure)

## Arquitectura

```
src/
├── common/              # Utilidades compartidas
│   ├── decorators/      # Decoradores custom
│   ├── guards/          # Guards (AuthGuard, RolesGuard)
│   ├── interceptors/    # Interceptors
│   └── pipes/           # Pipes de validación
├── config/              # Configuración (env, validation)
├── modules/
│   ├── incidents/       # Gestión de incidentes (CRUD + YOLO)
│   ├── yolo/           # Integración con YOLO API
│   ├── geospatial/     # Análisis geoespacial (heatmaps, clustering)
│   ├── auth/           # Validación JWT de Supabase
│   └── supabase/       # Cliente Supabase
└── main.ts             # Entry point
```

## Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

## Variables de Entorno

```env
# App
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YOLO API
YOLO_API_URL=http://detection-issue-service.eastus2.cloudapp.azure.com
YOLO_API_CLIENT=backend-reportes-infrastructure-2025
YOLO_API_KEY=your-yolo-api-key
```

## Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev        # Modo watch (hot reload)

# Producción
pnpm build           # Compilar TypeScript
pnpm start:prod      # Ejecutar versión compilada

# Testing
pnpm test            # Unit tests
pnpm test:watch      # Tests en modo watch
pnpm test:cov        # Coverage
pnpm test:e2e        # End-to-end tests

# Code Quality
pnpm lint            # ESLint
pnpm format          # Prettier
```

## Endpoints Principales

### Incidentes (Requieren Backend)

- `POST /api/incidents` - Crear incidente con foto + YOLO detection
- `POST /api/geospatial/heatmap` - Generar mapa de calor
- `POST /api/geospatial/clusters` - Generar clusters geográficos

### Health Check

- `GET /health` - Verificar estado del API

## Desarrollo

```bash
# Iniciar en modo desarrollo
pnpm start:dev

# El servidor estará en http://localhost:3001
```

## Notas Importantes

- Este backend maneja SOLO el 20% de operaciones (complejas)
- El 80% de operaciones CRUD se hace directamente desde los clientes a Supabase
- Todas las requests requieren JWT válido de Supabase (excepto health check)
- Las fotos se suben a Supabase Storage, no se almacenan localmente

## License

MIT
