const API = '/api/tasks';
const listEl = document.getElementById('task-list');
const emptyEl = document.getElementById('empty');
const errorEl = document.getElementById('error');
const summaryEl = document.getElementById('summary');
const form = document.getElementById('task-form');

let tasks = [];
let filter = 'all';

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

async function api(path = '', options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function load() {
  try {
    tasks = await api();
    showError('');
  } catch (err) {
    showError('Could not load tasks. Is the server running? (' + err.message + ')');
  }
  render();
}

function render() {
  const today = new Date().toISOString().slice(0, 10);
  const visible = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  );

  const doneCount = tasks.filter(t => t.done).length;
  summaryEl.textContent = tasks.length
    ? `${doneCount} of ${tasks.length} tasks done`
    : 'Nothing planned yet';

  listEl.innerHTML = '';
  visible.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task' + (t.done ? ' done' : '') + (!t.done && t.due && t.due < today ? ' overdue' : '');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = t.done;
    check.setAttribute('aria-label', 'Mark "' + t.title + '" as done');
    check.addEventListener('change', () => toggle(t.id, check.checked));

    const body = document.createElement('div');
    body.className = 'body';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = t.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = t.subject;
    if (t.due) {
      const due = document.createElement('span');
      due.className = 'due';
      due.textContent = ' · due ' + t.due;
      meta.appendChild(due);
    }
    body.append(name, meta);

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'Delete';
    del.addEventListener('click', () => remove(t.id));

    li.append(check, body, del);
    listEl.appendChild(li);
  });

  emptyEl.hidden = visible.length > 0;
}

async function toggle(id, done) {
  try {
    const updated = await api('/' + id, { method: 'PATCH', body: JSON.stringify({ done }) });
    tasks = tasks.map(t => (t.id === id ? updated : t));
    showError('');
  } catch (err) { showError(err.message); }
  render();
}

async function remove(id) {
  try {
    await api('/' + id, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    showError('');
  } catch (err) { showError(err.message); }
  render();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    title: form.title.value,
    subject: form.subject.value,
    due: form.due.value
  };
  try {
    const created = await api('', { method: 'POST', body: JSON.stringify(payload) });
    tasks.push(created);
    form.reset();
    showError('');
  } catch (err) { showError(err.message); }
  render();
});

document.querySelectorAll('.filters button').forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filters button').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

load();
