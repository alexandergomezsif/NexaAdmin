/**
 * Nexa ERP - Componente de Tarjetas KPI para Dashboard
 */

export function renderKpiCard({
  label,
  value,
  icon = '📊',
  iconBg = 'var(--brand-primary-light)',
  iconColor = 'var(--brand-primary)',
  trend = null,
  trendPositive = true,
  footerText = ''
}) {
  const trendHtml = trend !== null ? `
    <span class="kpi-trend ${trendPositive ? 'positive' : 'negative'}">
      ${trendPositive ? '↑' : '↓'} ${trend}
    </span>
  ` : '';

  return `
    <div class="kpi-card">
      <div class="kpi-card-header">
        <span class="kpi-label">${label}</span>
        <div class="kpi-icon-wrap" style="background: ${iconBg}; color: ${iconColor};">
          ${icon}
        </div>
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-footer">
        ${trendHtml}
        <span>${footerText}</span>
      </div>
    </div>
  `;
}
