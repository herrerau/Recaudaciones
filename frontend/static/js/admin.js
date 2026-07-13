const form = document.getElementById('panelForm');
const API_BASE = window.location.origin;

async function cargarConfiguraciones() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = '';

    if (!data.usuarios || Object.keys(data.usuarios).length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay pantallas configuradas</td></tr>';
      return;
    }

    for (const [id, info] of Object.entries(data.usuarios)) {
      const tr = document.createElement('tr');
      const link = `${window.location.origin}/usuario.html?user=${id}`;
      const comps = [];
      if (info.mostrar_recaudacion) comps.push('💰 Recaudación');
      if (info.mostrar_maquinas) comps.push('🖥️ Máquinas');
      if (info.mostrar_declaraciones) comps.push('📄 Declaraciones');

      tr.innerHTML = `
        <td><strong>${info.nombre_usuario || id}</strong></td>
        <td><span class="badge-info">${id}</span></td>
        <td>${(info.regiones_permitidas || []).map((r) => `<span class="badge-info">${r.replace('REGION ', '')}</span>`).join(' ') || 'Todas'}</td>
        <td>${comps.join(' · ')}</td>
        <td><a href="${link}" target="_blank" class="url-chip">${link}</a></td>
      `;
      tbody.appendChild(tr);
    }
  } catch (error) {
    console.error(error);
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">⚠️ Error al cargar configuraciones: ${error.message}</td></tr>`;
  }
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const regiones = Array.from(document.querySelectorAll('.reg-check:checked')).map((cb) => cb.value);
  const payload = {
    user_id: document.getElementById('userId').value.trim(),
    nombre_usuario: document.getElementById('nombreUsuario').value.trim(),
    mostrar_recaudacion: document.getElementById('moraRecaudacion').checked,
    mostrar_maquinas: document.getElementById('moraMaquinas').checked,
    mostrar_declaraciones: document.getElementById('moraDeclaraciones').checked,
    regiones_permitidas: regiones
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert('✅ Pantalla guardada exitosamente');
      form.reset();
      cargarConfiguraciones();
    } else {
      alert('❌ Error al guardar: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    alert('❌ Error al guardar: ' + error.message);
  }
});

window.addEventListener('load', cargarConfiguraciones);
