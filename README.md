# Frontend - Cordillera Platform

Frontend ejecutivo desarrollado para **Cordillera Platform**, correspondiente al Parcial 3 de la asignatura **Desarrollo Full Stack III (DSY1106)**.

## Descripción

Este componente implementa la interfaz ejecutiva de Grupo Cordillera mediante **React 19 + Vite**, permitiendo visualizar pantallas de monitoreo para dashboard, KPIs, reportes, alertas, servicios y configuración.

El frontend está preparado para consumir datos reales desde el **BFF Gateway**, sin conectarse directamente a los microservicios internos.

## Arquitectura de consumo

```txt
Usuario → Frontend React + Vite → BFF Gateway → Data Service / KPI Service / Report Service
```

El frontend consume únicamente el BFF Gateway mediante:

```env
VITE_API_BASE_URL=http://localhost:8081
```

## Stack utilizado

- React 19
- Vite
- NPM
- JavaScript
- CSS
- lucide-react
- Fetch API
- localStorage para preferencias locales

## Requisitos

- Node.js
- NPM

Para revisar versiones instaladas:

```bash
node -v
npm -v
```

## Instalación

Desde la carpeta `frontend`:

```bash
npm install
```

## Ejecución en desarrollo

```bash
npm run dev
```

URL local de desarrollo:

```txt
http://localhost:5173
```

> Para la presentacion con Docker, usar `http://localhost:3000`.

## Build de producción

```bash
npm run build
```

## Preview de producción

```bash
npm run preview
```

## Ejecución con Docker y Nginx

El frontend de Cordillera Platform se ejecuta como una aplicacion React 19 + Vite compilada en modo produccion y servida mediante Nginx.

### Puerto expuesto

| Componente | Puerto |
|---|---:|
| Frontend React + Nginx | 3000 |
| BFF Gateway | 8081 |

### Flujo de comunicación

```text
Usuario -> Frontend React/Nginx :3000 -> BFF Gateway :8081 -> Microservicios
```

### Levantar arquitectura completa

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

### Acceso al frontend

Abrir en el navegador:

```text
http://localhost:3000
```

### Validación funcional

El frontend fue validado consumiendo datos reales desde el BFF Gateway:

- Dashboard ejecutivo operativo.
- KPIs estratégicos visibles.
- Estado de microservicios 4/4 operativo.
- Reportes recientes visibles.
- Descarga de reporte PDF funcionando.
- Configuración remota obtenida desde BFF Gateway.

### Endpoints consumidos desde el BFF

```text
POST /api/auth/login
GET /api/dashboard/stats
GET /api/dashboard/kpis
GET /api/reportes
GET /api/configuracion
```

### Evidencia de integración

Se validó que el frontend muestra el reporte Reporte Ejecutivo Mayo 2026 generado por report-service y obtenido a través del bff-gateway.

También se validó la descarga del archivo reporte-1.pdf, generado desde el endpoint de exportación del Report Service.

## Lint

```bash
npm run lint
```

## Variables de entorno

Crear archivo `.env.local` dentro de la carpeta `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

El proyecto incluye `.env.example` como referencia.

## Estructura principal

```txt
src/
├── assets/
├── components/
│   ├── dashboard/
│   ├── layout/
│   ├── screens/
│   └── ui/
├── data/
├── hooks/
├── services/
├── styles/
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## Pantallas implementadas

- Dashboard Ejecutivo
- KPIs Estratégicos
- Centro de Reportes
- Centro de Alertas
- Estado de Servicios
- Configuración

## Componentes reutilizables

### Layout

- `AppShell`
- `Sidebar`
- `Topbar`

### UI base

- `AppIcon`
- `StatusBadge`
- `MetricCard`
- `MiniSparkline`
- `SectionHeader`
- `FilterCard`
- `FormatBadge`

### Módulos ejecutivos

- `KpiCard`
- `AlertItem`
- `ReportItem`
- `ServiceStatusCard`
- `TrendPanel`

## Hooks implementados

- `useDashboardStats`
- `useKpis`
- `useReports`
- `useAlerts`
- `useServicesStatus`
- `useLocalSettings`
- `useRemoteSettings`

## Servicios API

Los servicios API están centralizados en `src/services/` y consumen únicamente el BFF Gateway.

Endpoints preparados:

```txt
POST /api/auth/login
GET /api/dashboard/stats
GET /api/dashboard/kpis
GET /api/reportes
POST /api/reportes/generar
GET /api/reportes/{id}/exportar?formato=...
GET /api/dashboard/alertas
GET /api/dashboard/services
GET /api/configuracion
PUT /api/configuracion
```

## Estados de interfaz

Cada pantalla maneja:

- `loading`: carga de información.
- `success`: datos reales recibidos desde el BFF.
- `error`: BFF no disponible o endpoint pendiente.
- `empty`: BFF responde, pero no entrega datos para esa sección.

Si el BFF Gateway no esta disponible, el frontend muestra estados de error o vacios sin utilizar datos simulados como informacion final.

## Pruebas manuales

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar frontend localmente en desarrollo

```bash
npm run dev
```

Abrir:

```txt
http://localhost:5173
```

> Esta URL corresponde solo al servidor de desarrollo de Vite. En Docker/Nginx el frontend se publica en `http://localhost:3000`.

### 3. Validar build

```bash
npm run build
```

El comando debe finalizar sin errores y generar la carpeta `dist/`.

### 4. Validar preview

```bash
npm run preview
```

### 5. Validar integracion Docker

Desde la raiz del repositorio:

```bash
docker compose up -d --build
```

Abrir:

```txt
http://localhost:3000
```

El frontend debe mostrar datos reales obtenidos desde el BFF Gateway.

## Historias de usuario y subtareas asociadas

| Código Jira | Tipo | Nombre | Responsable | Estado | Relación con Frontend |
|---|---|---|---|---|---|
| CORD-18 | Historia de usuario | HU-FE-02 Consumo de API desde BFF | Ignacio Valeria | Finalizada | Implementa el consumo de datos desde BFF Gateway para evitar dependencia directa con microservicios internos. |
| CORD-20 | Historia de usuario | HU-FE-04 Integración final con Docker y Nginx | Ignacio Valeria | Finalizada | Permite ejecutar el Frontend de forma consistente mediante Docker y Nginx para la entrega y demostración. |

### Detalle funcional de las HU principales

**CORD-18 - HU-FE-02 Consumo de API desde BFF**

Historia de usuario:

> Como usuario quiero que el frontend obtenga datos desde el BFF para no depender directamente de los microservicios internos.

Relación técnica:

- El Frontend consume `VITE_API_BASE_URL=http://localhost:8081`.
- La pantalla principal obtiene datos desde `/api/dashboard/stats`.
- La lógica de consumo se centraliza en el servicio frontend correspondiente.
- El Frontend no llama directamente a Data Service, KPI Service ni Report Service.

**CORD-20 - HU-FE-04 Integración final con Docker y Nginx**

Historia de usuario:

> Como líder quiero que el frontend pueda ejecutarse de forma consistente para facilitar la entrega y demostración.

Relación técnica:

- El Frontend se ejecuta en el puerto `3000`.
- La app React se construye con Vite.
- Nginx sirve la aplicación en ambiente Docker.
- Docker Compose integra Frontend con BFF Gateway.

Estas historias permiten vincular la implementación técnica del Frontend con la planificación y seguimiento del proyecto en Jira.

## Consideraciones

- El frontend no consume directamente `data-service`, `kpi-service` ni `report-service`.
- La integracion real se realiza mediante `bff-gateway` en el puerto `8081`.
- La carpeta `docs/ui-reference/` se usa solo como referencia local de diseño y no debe subirse al repositorio.
- `.env.local`, `dist/` y `node_modules/` no deben versionarse.

## Estado actual

Frontend React 19 + Vite integrado con BFF Gateway, servido con Nginx en Docker y validado mediante build de Vite.
