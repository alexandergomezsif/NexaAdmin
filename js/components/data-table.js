/**
 * Nexa ERP - Componente Avanzado de Tablas de Datos (DataTable)
 * Soporta búsqueda en tiempo real, ordenamiento, paginación y renderers personalizados
 */

export class DataTable {
  constructor({
    containerId,
    columns = [],
    data = [],
    pageSize = 10,
    searchable = true,
    searchPlaceholder = 'Buscar en la tabla...',
    emptyMessage = 'No se encontraron registros.',
    actions = null
  }) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.columns = columns;
    this.rawData = [...data];
    this.filteredData = [...data];
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.searchQuery = '';
    this.sortKey = null;
    this.sortAsc = true;
    this.searchable = searchable;
    this.searchPlaceholder = searchPlaceholder;
    this.emptyMessage = emptyMessage;
    this.actions = actions;

    this.render();
  }

  updateData(newData) {
    this.rawData = [...newData];
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.rawData];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(row => {
        return this.columns.some(col => {
          const val = row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    if (this.sortKey) {
      result.sort((a, b) => {
        const valA = a[this.sortKey];
        const valB = b[this.sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        const comp = valA > valB ? 1 : -1;
        return this.sortAsc ? comp : -comp;
      });
    }

    this.filteredData = result;
    this.currentPage = 1;
    this.renderBody();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="card" style="margin-bottom: 0;">
        ${this.searchable ? `
          <div class="table-toolbar">
            <div class="table-search">
              <span class="table-search-icon">🔍</span>
              <input type="text" class="table-search-input" placeholder="${this.searchPlaceholder}" value="${this.searchQuery}">
            </div>
            <div class="table-info-counter text-xs text-muted"></div>
          </div>
        ` : ''}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map(col => `
                  <th style="cursor: pointer; ${col.width ? `width: ${col.width};` : ''}" data-col-key="${col.key}">
                    ${col.title} <span class="sort-indicator" data-sort-for="${col.key}">↕</span>
                  </th>
                `).join('')}
                ${this.actions ? '<th style="text-align: right; width: 120px;">Acciones</th>' : ''}
              </tr>
            </thead>
            <tbody class="table-body"></tbody>
          </table>
        </div>
        <div class="table-pagination">
          <div class="pagination-info"></div>
          <div class="pagination-controls d-flex gap-2">
            <button class="btn btn-secondary btn-sm btn-prev">Anterior</button>
            <button class="btn btn-secondary btn-sm btn-next">Siguiente</button>
          </div>
        </div>
      </div>
    `;

    // Eventos de búsqueda
    const searchInput = this.container.querySelector('.table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.applyFilters();
      });
    }

    // Eventos de ordenamiento en cabeceras
    this.container.querySelectorAll('thead th[data-col-key]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-col-key');
        if (this.sortKey === key) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortKey = key;
          this.sortAsc = true;
        }
        this.applyFilters();
      });
    });

    // Eventos de paginación
    this.container.querySelector('.btn-prev').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderBody();
      }
    });

    this.container.querySelector('.btn-next').addEventListener('click', () => {
      const maxPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
      if (this.currentPage < maxPages) {
        this.currentPage++;
        this.renderBody();
      }
    });

    this.renderBody();
  }

  renderBody() {
    const tbody = this.container.querySelector('.table-body');
    const paginationInfo = this.container.querySelector('.pagination-info');
    const counter = this.container.querySelector('.table-info-counter');
    const btnPrev = this.container.querySelector('.btn-prev');
    const btnNext = this.container.querySelector('.btn-next');

    const total = this.filteredData.length;
    const maxPages = Math.ceil(total / this.pageSize) || 1;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredData.slice(startIdx, startIdx + this.pageSize);

    if (counter) {
      counter.textContent = `Mostrando ${pageItems.length} de ${total} registros`;
    }

    if (paginationInfo) {
      paginationInfo.textContent = `Página ${this.currentPage} de ${maxPages} (${total} total)`;
    }

    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= maxPages;

    // Actualizar indicadores de orden
    this.container.querySelectorAll('[data-sort-for]').forEach(el => {
      const key = el.getAttribute('data-sort-for');
      if (key === this.sortKey) {
        el.textContent = this.sortAsc ? '↑' : '↓';
        el.style.color = 'var(--brand-primary)';
      } else {
        el.textContent = '↕';
        el.style.color = 'var(--text-light)';
      }
    });

    if (pageItems.length === 0) {
      const cols = this.columns.length + (this.actions ? 1 : 0);
      tbody.innerHTML = `
        <tr>
          <td colspan="${cols}" class="text-center" style="padding: 30px; color: var(--text-muted);">
            ${this.emptyMessage}
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageItems.map(row => {
      const cellsHtml = this.columns.map(col => {
        let content = row[col.key];
        if (col.render) {
          content = col.render(row[col.key], row);
        } else if (content === null || content === undefined) {
          content = '-';
        }
        return `<td>${content}</td>`;
      }).join('');

      let actionsHtml = '';
      if (this.actions) {
        actionsHtml = `<td style="text-align: right; white-space: nowrap;">${this.actions(row)}</td>`;
      }

      return `<tr>${cellsHtml}${actionsHtml}</tr>`;
    }).join('');
  }
}
