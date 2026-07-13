const params = new URLSearchParams(window.location.search);
const userId = params.get('user') || 'general';
const statusEl = document.getElementById('apiStatus');
const titleEl = document.getElementById('pageTitle');
const summaryEl = document.getElementById('summaryText');
const cardsEl = document.getElementById('cards');
const regionsEl = document.getElementById('regionRows');

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 });
}

async function cargarDatos() {
  try {
    const [datosRes, configRes] = await Promise.all([
      fetch('/api/datos'),
      fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    ]);
    const datos = await datosRes.json();
    const config = await configRes.json();

    const perfil = config.usuarios?.[userId] || null;
    titleEl.textContent = perfil?.nombre_usuario || `Pantalla ${userId}`;
    summaryEl.textContent = perfil
      ? `Regiones permitidas: ${perfil.regiones_permitidas?.join(', ') || 'Todas'}`
      : 'Vista general del panel fiscal';

    const recaudacion = datos.recaudacion || {};
    cardsEl.innerHTML = `
      <article class="card">
        <h3>Recaudación</h3>
        <div class="value">Bs. ${formatNumber(recaudacion.total || 0)}</div>
        <div class="muted">Tendencia ${recaudacion.tendencia || 0}%</div>
      </article>
      <article class="card">
        <h3>Declaraciones</h3>
        <div class="value">${formatNumber(datos.declaraciones?.total || 0)}</div>
        <div class="muted">Pagadas: ${formatNumber(datos.declaraciones?.pagadas || 0)}</div>
      </article>
      <article class="card">
        <h3>Máquinas</h3>
        <div class="value">${formatNumber(datos.maquinas?.total || 0)}</div>
        <div class="muted">Activas: ${formatNumber(datos.maquinas?.activas || 0)}</div>
      </article>
    `;

    const regiones = (datos.regiones || []).slice(0, 8);
    regionsEl.innerHTML = regiones.map((item) => `
      <tr>
        <td>${item.region || 'Sin región'}</td>
        <td>Bs. ${formatNumber(item.total || 0)}</td>
        <td><span class="tag">${item.tendencia || 0}%</span></td>
      </tr>
    `).join('');

    if (statusEl) statusEl.innerHTML = '<span class="status"></span> Conectado';
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = 'Sin conexión';
    cardsEl.innerHTML = '<div class="card"><h3>Error</h3><div class="muted">No se pudieron cargar los datos.</div></div>';
  }
}

window.addEventListener('load', cargarDatos);
