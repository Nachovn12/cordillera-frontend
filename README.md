# Frontend - Cordillera Platform

Frontend ejecutivo desarrollado para **Cordillera Platform**, correspondiente al Parcial 2 de la asignatura **Desarrollo Full Stack III (DSY1106)**.

## Descripción

Este componente implementa la interfaz ejecutiva de Grupo Cordillera mediante **React 19 + Vite**, permitiendo visualizar pantallas de monitoreo para dashboard, KPIs, reportes, alertas, servicios y configuración.

El frontend está preparado para consumir datos reales desde el **BFF Gateway**, sin conectarse directamente a los microservicios internos.

## Arquitectura de consumo

```txt
Usuario → Frontend React + Vite → BFF Gateway → Data Service / KPI Service / Report Service
```

El frontend consume únicamente el BFF Gateway mediante:

```env
VITE_API_BASE_URL=http://localhost:8080
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

URL local:

```txt
http://localhost:5173
```

## Build de producción

```bash
npm run build
```

## Preview de producción

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Variables de entorno

Crear archivo `.env.local` dentro de la carpeta `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8080
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

Mientras el BFF Gateway no exponga los endpoints reales, el frontend muestra estados de integración pendiente sin utilizar datos simulados como información final.

## Pruebas manuales

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar frontend localmente

```bash
npm run dev
```

Abrir:

```txt
http://localhost:5173
```

### 3. Validar build

```bash
npm run build
```

El comando debe finalizar sin errores y generar la carpeta `dist/`.

### 4. Validar preview

```bash
npm run preview
```

### 5. Validar integración pendiente

Con el BFF Gateway apagado o sin endpoints implementados, las pantallas deben mostrar mensajes de integración pendiente.

Este comportamiento es esperado hasta que el BFF exponga los endpoints reales.

## Consideraciones

- El frontend no consume directamente `data-service`, `kpi-service` ni `report-service`.
- La integración real queda pendiente hasta que `bff-gateway` exponga los endpoints definidos.
- La carpeta `docs/ui-reference/` se usa solo como referencia local de diseño y no debe subirse al repositorio.
- `.env.local`, `dist/` y `node_modules/` no deben versionarse.

## Estado actual

Frontend preparado para integración con BFF Gateway y validado mediante build de Vite.
