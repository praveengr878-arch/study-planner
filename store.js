// Tiny JSON-file "database" for tasks.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'tasks.json');

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
}

function list() {
  return readAll();
}

function create({ title, subject, due }) {
  const tasks = readAll();
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    subject: (subject || 'General').trim(),
    due: due || null,
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  writeAll(tasks);
  return task;
}

function update(id, changes) {
  const tasks = readAll();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;
  if (typeof changes.done === 'boolean') task.done = changes.done;
  if (typeof changes.title === 'string' && changes.title.trim()) task.title = changes.title.trim();
  writeAll(tasks);
  return task;
}

function remove(id) {
  const tasks = readAll();
  const next = tasks.filter(t => t.id !== id);
  if (next.length === tasks.length) return false;
  writeAll(next);
  return true;
}

module.exports = { list, create, update, remove };
