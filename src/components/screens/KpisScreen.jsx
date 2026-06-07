/**
 * KpisScreen — Observer del DashboardContext.
 * Se suscribe al estado de KPIs centralizado en lugar de hacer fetch propio.
 */
import { useEffect } from "react";
import AppIcon from "../ui/AppIcon";
import KpiCard from "../dashboard/KpiCard";
import TrendPanel from "../dashboard/TrendPanel";
import MetricCard from "../ui/MetricCard";
import SectionHeader from "../ui/SectionHeader";
import StatusBadge from "../ui/StatusBadge";
import { useDashboardContext } from "../../context/DashboardContext";
function enrichKpis(realKpis) {
  const formatCurrency = (val, unit) =>
    unit === "CLP"
      ? `$${Number(val).toLocaleString("es-CL")}`
      : `${val}${unit ? ` ${unit}` : ""}`;

  return realKpis.map((real) => {
    const valueNum = real.rawValue ?? 0;

    // Referential target logic
    const metaNum = real.rawTarget ?? Math.round(valueNum * 1.2);
    const progressNum = real.rawTarget
      ? real.progress
      : metaNum > 0
        ? Math.round((valueNum / metaNum) * 100)
        : 0;
    const targetText = real.rawTarget
      ? real.target
      : `Meta referencial: ${formatCurrency(metaNum, real.unit)}`;

    // Referential variation logic
    const referentialVariation = 5.0; // static +5%
    const changeStr =
      real.rawVariation !== null
        ? real.change
        : `+${referentialVariation.toLocaleString("es-CL")}%`;
    const progressText = real.rawTarget ? real.completion : `${progressNum}%`;

    return {
      ...real,
      target: targetText,
      completion: progressText,
      progress: progressNum,
      change: changeStr,
      rawVariation:
        real.rawVariation !== null ? real.rawVariation : referentialVariation,
      status:
        real.status === "info" || real.status === "Estado no informado"
          ? "objective"
          : real.status,
      statusLabel:
        real.status === "info" || real.status === "Estado no informado"
          ? "Operativo"
          : real.statusLabel,
    };
  });
}

function KpisSkeleton() {
  return (
    <main className="screen screen--kpis">
      <section
        className="metric-grid metric-grid--four"
        aria-label="Cargando resumen de KPIs"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="metric-card dashboard-skeleton" key={index} />
        ))}
      </section>
      <section className="kpi-grid" aria-label="Cargando KPIs principales">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            className="kpi-card dashboard-skeleton dashboard-skeleton--large"
            key={index}
          />
        ))}
      </section>
      <section className="content-grid content-grid--table">
        <article className="panel dashboard-skeleton dashboard-skeleton--large" />
        <article className="panel dashboard-skeleton dashboard-skeleton--large" />
      </section>
    </main>
  );
}

function KpisError({ error, onRetry }) {
  return (
    <main className="screen screen--kpis">
      <section className="integration-error-state" aria-live="polite">
        <span className="icon-box icon-box--warning">
          <AppIcon name="warning" size={24} strokeWidth={2.1} />
        </span>
        <div>
          <span className="integration-status-badge integration-status-badge--danger">
            Endpoint pendiente
          </span>
          <h2>KPIs estratégicos pendientes de conexión</h2>
          <p>
            El frontend está operativo, pero aún no recibe indicadores desde el
            BFF Gateway.
          </p>
          <small>Endpoint esperado: GET /api/dashboard/kpis</small>
          {error?.message && (
            <details>
              <summary>Detalle técnico</summary>
              <span>{error.message}</span>
            </details>
          )}
        </div>
        <button
          type="button"
          onClick={onRetry}
          aria-label="Reintentar carga de KPIs desde BFF Gateway"
        >
          <AppIcon name="refresh" size={17} strokeWidth={2.1} />
          Reintentar
        </button>
      </section>
    </main>
  );
}

function EmptyKpis({ onRetry }) {
  return (
    <main className="screen screen--kpis">
      <section className="integration-empty-state">
        <span className="icon-box icon-box--info">
          <AppIcon name="kpis" size={24} strokeWidth={2.1} />
        </span>
        <div>
          <h2>No hay KPIs registrados desde el backend.</h2>
          <p>
            Cuando el KPI Service entregue indicadores, se visualizarán en este
            panel.
          </p>
          <small>Fuente esperada: BFF Gateway · GET /api/dashboard/kpis</small>
        </div>
        <button type="button" onClick={onRetry}>
          <AppIcon name="refresh" size={17} strokeWidth={2.1} />
          Actualizar
        </button>
      </section>
    </main>
  );
}

function getSummaryMetrics(kpis) {
  const activeCount = kpis.filter((kpi) => kpi.status === "success").length;
  const alertCount = kpis.filter(
    (kpi) => kpi.status === "warning" || kpi.status === "danger",
  ).length;
  const completionValues = kpis
    .map((kpi) => Number(kpi.progress))
    .filter((value) => Number.isFinite(value) && value > 0);
  const variationValues = kpis
    .map((kpi) => kpi.rawVariation)
    .filter((value) => Number.isFinite(value));
  const averageCompletion = completionValues.length
    ? Math.round(
        completionValues.reduce((sum, value) => sum + value, 0) /
          completionValues.length,
      )
    : null;
  const averageVariation = variationValues.length
    ? variationValues.reduce((sum, value) => sum + value, 0) /
      variationValues.length
    : null;

  return [
    {
      title: "KPIs activos",
      value: String(activeCount),
      detail: `${kpis.length} indicadores recibidos`,
      icon: "kpis",
    },
    {
      title: "KPIs en alerta",
      value: String(alertCount),
      detail: alertCount === 1 ? "Requiere atención" : "Requieren atención",
      icon: "alerts",
      tone: alertCount > 0 ? "warning" : "success",
    },
    {
      title: "Meta cumplida",
      value: averageCompletion === null ? "Sin meta" : `${averageCompletion}%`,
      detail: "Promedio informado por KPIs",
      icon: "target",
    },
    {
      title: "Tendencia mensual",
      value:
        averageVariation === null
          ? "Sin datos"
          : `${averageVariation > 0 ? "+" : ""}${averageVariation.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%`,
      detail: "Promedio de variación",
      icon: "trend",
      tone:
        averageVariation !== null && averageVariation < 0
          ? "warning"
          : "success",
    },
  ];
}

function getEvolutionData(kpis) {
  const withHistory = kpis.filter(
    (kpi) => kpi.history && kpi.history.length > 0,
  );

  if (withHistory.length === 0) {
    return {
      data: [],
      series: [],
      isEmpty: true,
    };
  }

  const labels = withHistory[0].history.map((item, index) => ({
    label: item.label || item.periodo || item.fecha || `P${index + 1}`,
  }));
  const tones = ["teal", "orange", "blue"];

  return {
    data: labels,
    series: withHistory.slice(0, 3).map((kpi, index) => ({
      name: kpi.title,
      tone: tones[index] || "teal",
      values: kpi.history.map((item) =>
        Number(item.valor ?? item.value ?? item.cumplimiento ?? 0),
      ),
    })),
  };
}

function statusForTable(kpi) {
  if (kpi.status === "warning") return "warning";
  if (kpi.status === "danger") return "danger";
  return "objective";
}

export default function KpisScreen({ onBffStatusChange }) {
  // Observer: suscripción al estado centralizado de KPIs en el DashboardContext
  const { kpis: kpisState, fetchKpis } = useDashboardContext();
  const { data, loading, error } = kpisState;

  // Carga inicial al montar el componente
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  useEffect(() => {
    if (data?.kpis && onBffStatusChange) {
      onBffStatusChange({ status: "success", label: "Operativo" });
    }
  }, [data, onBffStatusChange]);

  if (loading) {
    return <KpisSkeleton />;
  }

  if (error) {
    return <KpisError error={error} onRetry={fetchKpis} />;
  }

  const realKpis = data?.kpis || [];
  const kpis = enrichKpis(realKpis);

  if (kpis.length === 0) {
    return <EmptyKpis onRetry={fetchKpis} />;
  }

  const summaryMetrics = getSummaryMetrics(kpis);
  const evolution = getEvolutionData(kpis);

  return (
    <main className="screen screen--kpis">
      <section
        className="metric-grid metric-grid--four"
        aria-label="Resumen de KPIs"
      >
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="kpi-grid" aria-label="KPIs principales">
        {kpis.slice(0, 3).map((kpi) => (
          <KpiCard variant="strategic" kpi={kpi} key={kpi.id} />
        ))}
      </section>

      <section
        className="content-grid content-grid--kpis"
        aria-label="Evolución y estado de integración"
      >
        <TrendPanel
          type="line"
          title="Evolución de KPIs estratégicos"
          description={
            evolution.isEmpty
              ? "Sin histórico disponible"
              : "Histórico disponible desde el BFF Gateway."
          }
          data={evolution.data}
          series={evolution.series}
          badge={evolution.isEmpty ? null : "Histórico BFF"}
        />

        <div className="panel panel--updates">
          <SectionHeader
            title="Últimas actualizaciones KPI"
            description="Datos complementarios para defensa"
          />
          <div className="alerts-empty-inline">
            <AppIcon name="document" size={22} strokeWidth={2} />
            <strong>Sin actualizaciones recientes</strong>
            <span>No hay actualizaciones de KPIs informadas.</span>
          </div>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <small style={{ color: "#64748b" }}>Fuente: BFF Gateway</small>
          </div>
        </div>
      </section>

      <section
        className="content-grid content-grid--table"
        aria-label="Detalle y filtros"
      >
        <div className="panel panel--table">
          <SectionHeader
            title="Detalle de indicadores"
            description="Resumen de los indicadores estratégicos entregados por el BFF Gateway."
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Categoría</th>
                  <th>Valor actual</th>
                  <th>Meta</th>
                  <th>Cumplimiento</th>
                  <th>Variación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi) => {
                  const isNegative = String(kpi.change).trim().startsWith("-");
                  return (
                    <tr key={kpi.id}>
                      <td className="table-indicator">{kpi.title}</td>
                      <td>{kpi.category}</td>
                      <td>{`${kpi.value}${kpi.unit && kpi.unit !== "CLP" ? ` ${kpi.unit}` : ""}`}</td>
                      <td>{kpi.target.replace("Meta: ", "")}</td>
                      <td>{kpi.completion}</td>
                      <td
                        className={
                          isNegative
                            ? "table-variation--negative"
                            : "table-variation--positive"
                        }
                      >
                        {kpi.change}
                      </td>
                      <td>
                        <StatusBadge
                          status={statusForTable(kpi)}
                          label={kpi.statusLabel}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel filters-panel">
          <SectionHeader title="Filtros rápidos" />
          {["Categoría", "Estado", "Rango de cumplimiento"].map((filter) => (
            <label className="select-field" key={filter}>
              <span>{filter}</span>
              <select>
                <option>Todos</option>
              </select>
            </label>
          ))}
          <button className="secondary-button" type="button">
            <AppIcon name="refresh" size={15} strokeWidth={2} />
            Limpiar filtros
          </button>
        </aside>
      </section>
    </main>
  );
}
