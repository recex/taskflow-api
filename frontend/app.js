const $ = id => document.getElementById(id);
const API = '';

const toast = (msg, err = false) => {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'toast', 2500);
};

const loadStats = async () => {
  const r = await fetch(`${API}/api/stats`);
  const d = await r.json();
  $('stats').innerHTML = `
    <div class="stat"><div class="num">${d.total}</div><div class="label">Total</div></div>
    <div class="stat"><div class="num">${d.todo}</div><div class="label">A fazer</div></div>
    <div class="stat"><div class="num">${d.progress}</div><div class="label">Progresso</div></div>
    <div class="stat"><div class="num">${d.done}</div><div class="label">Concluído</div></div>
  `;
};

let allTasks = [];

const render = () => {
  const board = $('board');
  if (!allTasks.length) {
    board.innerHTML = '<p style="color:#94a3b8;grid-column:1/-1;text-align:center;padding:40px">Nenhuma tarefa encontrada.</p>';
    return;
  }
  board.innerHTML = allTasks.map(t => `
    <div class="card">
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.description || '')}</p>
      <div class="tags">
        <span class="badge ${t.status}">${label(t.status)}</span>
        <span class="badge ${t.priority}">${t.priority}</span>
      </div>
      <div class="card-actions">
        <button class="btn-sm btn-primary" onclick="edit('${t.id}')">Editar</button>
        <button class="btn-sm btn-danger" onclick="remove('${t.id}')">Excluir</button>
      </div>
    </div>
  `).join('');
};

const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = s => ({todo:'A fazer', progress:'Progresso', done:'Concluído'}[s] || s);

const refresh = async () => {
  const q = new URLSearchParams();
  const s = $('search').value;
  if (s) q.set('search', s);
  if ($('filterStatus').value) q.set('status', $('filterStatus').value);
  if ($('filterPriority').value) q.set('priority', $('filterPriority').value);
  if ($('sort').value) q.set('sort', $('sort').value);
  const r = await fetch(`${API}/api/tasks?${q}`);
  allTasks = await r.json();
  render();
};

const openModal = (t = null) => {
  $('modal').classList.remove('hidden');
  $('modalTitle').textContent = t ? 'Editar Tarefa' : 'Nova Tarefa';
  $('taskId').value = t ? t.id : '';
  $('fTitle').value = t ? t.title : '';
  $('fDesc').value = t ? t.description : '';
  $('fStatus').value = t ? t.status : 'todo';
  $('fPriority').value = t ? t.priority : 'medium';
};
const closeModal = () => $('modal').classList.add('hidden');

window.edit = id => {
  const t = allTasks.find(x => x.id === id);
  if (t) openModal(t);
};

window.remove = async id => {
  if (!confirm('Remover esta tarefa?')) return;
  await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' });
  toast('Tarefa removida.');
  refresh();
  loadStats();
};

$('btnNew').onclick = () => openModal();
$('btnCancel').onclick = closeModal;
$('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };

$('taskForm').onsubmit = async e => {
  e.preventDefault();
  const id = $('taskId').value;
  const body = {
    title: $('fTitle').value,
    description: $('fDesc').value,
    status: $('fStatus').value,
    priority: $('fPriority').value,
  };
  let res;
  if (id) {
    res = await fetch(`${API}/api/tasks/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  } else {
    res = await fetch(`${API}/api/tasks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  }
  if (!res.ok) {
    const err = await res.json();
    toast(err.error || 'Erro', true);
    return;
  }
  closeModal();
  toast('Salvo com sucesso!');
  refresh();
  loadStats();
};

$('search').oninput = () => refresh();
$('filterStatus').onchange = () => refresh();
$('filterPriority').onchange = () => refresh();
$('sort').onchange = () => refresh();

// Init
refresh();
loadStats();
