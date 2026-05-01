// ============================================================
// STORE — localStorage
// ============================================================

const KEYS = { devices: 'stocktake_devices', location: 'stocktake_location' };

function getDevices() {
  try { return JSON.parse(localStorage.getItem(KEYS.devices) || '[]'); }
  catch { return []; }
}
function getLocation() {
  try { return JSON.parse(localStorage.getItem(KEYS.location) || 'null'); }
  catch { return null; }
}
function saveDevices(devices) {
  localStorage.setItem(KEYS.devices, JSON.stringify(devices));
}
function saveLocation(loc) {
  localStorage.setItem(KEYS.location, JSON.stringify(loc));
}
function addDevice(assetNumber) {
  const loc = getLocation() || {};
  const device = {
    id: crypto.randomUUID(),
    assetNumber: assetNumber.trim(),
    sightedDate: new Date().toISOString(),
    buildingName: loc.buildingName || '',
    roomNumber: loc.roomNumber || '',
    personResponsible: loc.personResponsible || '',
    additionalNotes: loc.additionalNotes || '',
  };
  saveDevices([device, ...getDevices()]);
  return device;
}
function updateDevice(id, updates) {
  saveDevices(getDevices().map(d => d.id === id ? { ...d, ...updates } : d));
}
function removeDevice(id) {
  saveDevices(getDevices().filter(d => d.id !== id));
}
function clearAll() {
  saveDevices([]);
}

// ============================================================
// ROUTER — hash-based (#/, #/location, #/scan, #/list, #/edit?id=…)
// ============================================================

function navigate(path) {
  const el = document.getElementById('main-content');
  el.style.transition = 'opacity 0.08s ease, transform 0.08s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateY(4px)';
  setTimeout(() => { window.location.hash = path; }, 80);
}

function getRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const qi = hash.indexOf('?');
  const path = qi === -1 ? hash : hash.slice(0, qi);
  const params = {};
  if (qi !== -1) {
    hash.slice(qi + 1).split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { path: path || '/', params };
}

function render() {
  const el = document.getElementById('main-content');
  el.style.transition = '';
  el.style.opacity = '';
  el.style.transform = '';
  void el.offsetWidth; // restart CSS animation
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';

  const { path, params } = getRoute();
  switch (path) {
    case '/':         renderHome(el);             break;
    case '/location': renderLocation(el);         break;
    case '/scan':     renderScan(el);             break;
    case '/list':     renderList(el);             break;
    case '/edit':     renderEdit(el, params.id);  break;
    default:          renderHome(el);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logo').onclick = () => navigate('/');
  render();
});

// ============================================================
// SCANNER — USB HID barcode scanner keystroke handler
// ============================================================

function attachScanner(input, onScan) {
  let buf = '';
  let lastTime = 0;

  function onKey(e) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const code = buf.trim();
      buf = '';
      if (code) onScan(code);
      return;
    }
    const now = Date.now();
    if (now - lastTime > 300) buf = '';
    lastTime = now;
    if (e.key.length === 1) buf += e.key;
  }

  input.addEventListener('keydown', onKey);
  return () => input.removeEventListener('keydown', onKey);
}

// ============================================================
// EXCEL EXPORT — SheetJS
// ============================================================

function exportToExcel() {
  const devices = getDevices();
  if (!devices.length) { showSnack('No devices to export', 'danger'); return; }

  const sorted = [...devices].sort((a, b) =>
    a.buildingName.localeCompare(b.buildingName) ||
    a.roomNumber.localeCompare(b.roomNumber) ||
    new Date(a.sightedDate) - new Date(b.sightedDate)
  );

  const rows = sorted.map(d => ({
    'Asset Number':      d.assetNumber,
    'Sighted Date':      new Date(d.sightedDate).toLocaleDateString('en-AU'),
    'Building Name':     d.buildingName,
    'Room Number/Name':  d.roomNumber,
    'Person Responsible': d.personResponsible,
    'Additional Notes':  d.additionalNotes,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scanning Sheet');

  const n = new Date();
  const ts = `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}_${pad(n.getHours())}-${pad(n.getMinutes())}`;
  XLSX.writeFile(wb, `Stocktake_${ts}.xlsx`);
  showSnack('Excel file downloaded', 'success');
}

function pad(n) { return String(n).padStart(2, '0'); }

// ============================================================
// SNACKBAR
// ============================================================

let _queue = [];
let _sid = 0;

function showSnack(msg, tone = 'default', undoFn = null) {
  const id = ++_sid;
  const entry = { id, msg, tone, undoFn, timer: null };
  entry.timer = setTimeout(() => dismissSnack(id), 4500);
  _queue.push(entry);
  _renderSnacks();
  return id;
}

function dismissSnack(id) {
  const entry = _queue.find(s => s.id === id);
  if (entry) clearTimeout(entry.timer);
  _queue = _queue.filter(s => s.id !== id);
  _renderSnacks();
}

function _renderSnacks() {
  const container = document.getElementById('snackbar-container');
  if (!container) return;
  container.innerHTML = _queue.map(s => {
    const cls = s.tone === 'danger' ? 'snack-danger' : s.tone === 'success' ? 'snack-success' : '';
    return `
      <div class="snack ${cls}">
        <span>${esc(s.msg)}</span>
        ${s.undoFn ? `<button class="snack-action" data-undo="${s.id}">Undo</button>` : ''}
        <button class="snack-action" data-dismiss="${s.id}">✕</button>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-dismiss]').forEach(btn =>
    btn.addEventListener('click', () => dismissSnack(+btn.dataset.dismiss))
  );
  container.querySelectorAll('[data-undo]').forEach(btn =>
    btn.addEventListener('click', () => {
      const entry = _queue.find(s => s.id === +btn.dataset.undo);
      if (entry?.undoFn) entry.undoFn();
      dismissSnack(+btn.dataset.undo);
    })
  );
}

// ============================================================
// UTILS
// ============================================================

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relativeTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ============================================================
// HOME
// ============================================================

function renderHome(el) {
  const devices = getDevices();
  const loc = getLocation();
  const last = devices[0]?.sightedDate;
  const buildingVal = loc
    ? `<span class="stat-value ${loc.buildingName.length > 8 ? 'small-val' : ''}">${esc(loc.buildingName)}</span>`
    : '<span class="stat-value">—</span>';

  el.innerHTML = `
    <div class="stack-lg">
      <div>
        <h1>Stocktake</h1>
        <p class="muted mt-1">Asset inventory for schools</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${devices.length}</div>
          <div class="stat-label">Devices scanned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${last ? relativeTime(last) : '—'}</div>
          <div class="stat-label">Last scan</div>
        </div>
        <div class="stat-card">
          ${buildingVal}
          <div class="stat-label">Current building</div>
        </div>
      </div>

      <div class="tile-grid">
        <button class="tile" id="btn-add">
          <span class="tile-icon">📷</span>
          <span class="tile-title">Add devices</span>
          <span class="tile-desc">Set location and start scanning</span>
        </button>
        <button class="tile${!devices.length ? ' tile-disabled' : ''}" id="btn-export">
          <span class="tile-icon">📊</span>
          <span class="tile-title">Download Excel</span>
          <span class="tile-desc">${devices.length} device${devices.length !== 1 ? 's' : ''} ready</span>
        </button>
      </div>

      <div class="row gap-sm">
        <button class="btn btn-secondary" id="btn-list">View all devices</button>
        ${loc ? `<button class="btn btn-ghost" id="btn-change-loc">Change location</button>` : ''}
      </div>
    </div>`;

  el.querySelector('#btn-add').onclick = () => navigate('/location');
  el.querySelector('#btn-list').onclick = () => navigate('/list');
  el.querySelector('#btn-export').onclick = () => exportToExcel();
  el.querySelector('#btn-change-loc')?.addEventListener('click', () => navigate('/location'));
}

// ============================================================
// LOCATION
// ============================================================

function renderLocation(el) {
  const loc = getLocation() || {};

  el.innerHTML = `
    <div class="stack-lg">
      <div>
        <button class="btn btn-ghost btn-sm back-btn">← Back</button>
        <h1 class="mt-2">Set location</h1>
        <p class="muted mt-1">Applied to all devices you scan in this session.</p>
      </div>

      <form id="location-form" class="stack-md">
        <div class="field">
          <label for="f-building">Building name <span class="req">*</span></label>
          <input id="f-building" type="text" value="${esc(loc.buildingName || '')}" placeholder="e.g. Block A" autocomplete="off" />
          <span class="field-error" id="err-building"></span>
        </div>
        <div class="field">
          <label for="f-room">Room number / name <span class="req">*</span></label>
          <input id="f-room" type="text" value="${esc(loc.roomNumber || '')}" placeholder="e.g. A101" autocomplete="off" />
          <span class="field-error" id="err-room"></span>
        </div>
        <div class="field">
          <label for="f-person">Person responsible</label>
          <input id="f-person" type="text" value="${esc(loc.personResponsible || '')}" placeholder="e.g. Jane Smith" autocomplete="off" />
        </div>
        <div class="field">
          <label for="f-notes">Additional notes</label>
          <textarea id="f-notes" rows="2" placeholder="Optional">${esc(loc.additionalNotes || '')}</textarea>
        </div>
        <div class="row gap-sm mt-2">
          <button type="submit" class="btn btn-primary btn-lg">Start scanning →</button>
          <button type="button" class="btn btn-ghost cancel-btn">Cancel</button>
        </div>
      </form>
    </div>`;

  el.querySelector('.back-btn').onclick = () => navigate('/');
  el.querySelector('.cancel-btn').onclick = () => navigate('/');
  el.querySelector('#location-form').onsubmit = e => {
    e.preventDefault();
    const building = document.getElementById('f-building').value.trim();
    const room     = document.getElementById('f-room').value.trim();
    let ok = true;

    document.getElementById('err-building').textContent = '';
    document.getElementById('err-room').textContent = '';

    if (!building) { document.getElementById('err-building').textContent = 'Required'; ok = false; }
    if (!room)     { document.getElementById('err-room').textContent = 'Required';     ok = false; }
    if (!ok) return;

    saveLocation({
      buildingName:      building,
      roomNumber:        room,
      personResponsible: document.getElementById('f-person').value.trim(),
      additionalNotes:   document.getElementById('f-notes').value.trim(),
    });
    navigate('/scan');
  };
}

// ============================================================
// SCAN
// ============================================================

function renderScan(el) {
  const loc = getLocation();
  if (!loc) { navigate('/location'); return; }

  let sessionScans = [];
  let detach;

  el.innerHTML = `
    <div class="stack-lg">
      <div class="row justify-between items-start">
        <div>
          <button class="btn btn-ghost btn-sm back-btn">← Back</button>
          <h1 class="mt-2">Scan devices</h1>
          <div class="badge mt-1">📍 ${esc(loc.buildingName)} · ${esc(loc.roomNumber)}</div>
        </div>
        <button class="btn btn-primary done-btn">Done</button>
      </div>

      <div class="card">
        <p class="muted small mb-2">Focus here, then scan a barcode or type manually.</p>
        <div class="row gap-sm">
          <input id="scanner-input" class="flex-1" type="text"
            placeholder="Scan or type asset number…"
            autocomplete="off" autocorrect="off" autocapitalize="off" />
          <button class="btn btn-secondary add-btn">Add</button>
        </div>
      </div>

      <div>
        <div class="row justify-between items-center mb-2">
          <h2>This session <span class="muted small" id="scan-count">(0)</span></h2>
        </div>
        <div id="scan-feed">
          <p class="muted small" style="padding: 0.875rem 0">No scans yet — waiting for scanner…</p>
        </div>
      </div>
    </div>`;

  const input = el.querySelector('#scanner-input');
  input.focus();

  function processBarcode(code) {
    if (!code) return;
    const today = new Date().toDateString();
    const dup = getDevices().find(d =>
      d.assetNumber === code && new Date(d.sightedDate).toDateString() === today
    );
    if (dup) { showSnack(`Already scanned today: ${code}`, 'danger'); input.value = ''; return; }

    const device = addDevice(code);
    sessionScans.unshift(device);
    input.value = '';
    updateFeed();
  }

  function updateFeed() {
    const feed   = el.querySelector('#scan-feed');
    const countEl = el.querySelector('#scan-count');
    if (!feed || !countEl) return;

    countEl.textContent = `(${sessionScans.length})`;
    if (!sessionScans.length) {
      feed.innerHTML = `<p class="muted small" style="padding: 0.875rem 0">No scans yet — waiting for scanner…</p>`;
      return;
    }

    feed.innerHTML = sessionScans.slice(0, 60).map(d => `
      <div class="scan-item" data-id="${esc(d.id)}">
        <div>
          <span class="mono">${esc(d.assetNumber)}</span>
          <span class="muted small ml-1">${relativeTime(d.sightedDate)}</span>
        </div>
        <button class="btn btn-ghost btn-sm danger-text undo-btn">Undo</button>
      </div>`).join('');

    feed.querySelectorAll('.undo-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.closest('.scan-item').dataset.id;
        removeDevice(id);
        sessionScans = sessionScans.filter(d => d.id !== id);
        updateFeed();
        showSnack('Scan removed');
      };
    });
  }

  detach = attachScanner(input, processBarcode);
  el.querySelector('.add-btn').onclick = () => {
    const val = input.value.trim();
    if (val) processBarcode(val);
  };
  el.querySelector('.done-btn').onclick = () => { detach?.(); navigate('/list'); };
  el.querySelector('.back-btn').onclick = () => { detach?.(); navigate('/'); };
}

// ============================================================
// LIST
// ============================================================

function renderList(el) {
  const devices = getDevices();
  let bodyHtml;

  if (!devices.length) {
    bodyHtml = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>No devices yet</h2>
        <p>Start scanning to add devices.</p>
        <button class="btn btn-primary mt-2 start-btn">Add devices</button>
      </div>`;
  } else {
    const grouped = {};
    for (const d of devices) {
      const b = d.buildingName || '(No building)';
      const r = d.roomNumber   || '(No room)';
      if (!grouped[b]) grouped[b] = {};
      if (!grouped[b][r]) grouped[b][r] = [];
      grouped[b][r].push(d);
    }

    const bCount = Object.keys(grouped).length;
    bodyHtml = `
      <div class="row justify-between items-start mb-4">
        <div>
          <h1>All devices</h1>
          <p class="muted small mt-1">
            ${devices.length} device${devices.length !== 1 ? 's' : ''} ·
            ${bCount} building${bCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div class="row gap-sm">
          <button class="btn btn-primary export-btn">Export Excel</button>
          <button class="btn btn-danger btn-sm clear-btn">Clear all</button>
        </div>
      </div>
      ${Object.entries(grouped).map(([building, rooms]) => `
        <div class="mb-4">
          <h2 class="mb-3">${esc(building)}</h2>
          ${Object.entries(rooms).map(([room, devs]) => `
            <div class="mb-3">
              <div class="group-label">${esc(room)} · ${devs.length} device${devs.length !== 1 ? 's' : ''}</div>
              <div class="card p-0">
                ${devs.map(d => `
                  <div class="device-row" data-id="${esc(d.id)}" data-asset="${esc(d.assetNumber)}">
                    <div class="device-info">
                      <span class="mono">${esc(d.assetNumber)}</span>
                      <span class="muted small">
                        ${relativeTime(d.sightedDate)}${d.personResponsible ? ` · ${esc(d.personResponsible)}` : ''}
                      </span>
                      ${d.additionalNotes ? `<span class="muted small">${esc(d.additionalNotes)}</span>` : ''}
                    </div>
                    <div class="row gap-sm">
                      <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
                      <button class="btn btn-danger btn-sm del-btn">Delete</button>
                    </div>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>`).join('')}`;
  }

  el.innerHTML = `
    <div>
      <button class="btn btn-ghost btn-sm mb-3 back-btn">← Back</button>
      ${bodyHtml}
    </div>`;

  el.querySelector('.back-btn').onclick = () => navigate('/');
  el.querySelector('.start-btn')?.addEventListener('click', () => navigate('/location'));
  el.querySelector('.export-btn')?.addEventListener('click', () => exportToExcel());

  el.querySelector('.clear-btn')?.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Clear all devices?</h2>
        <p class="muted small mt-1">
          Permanently deletes all ${devices.length} device${devices.length !== 1 ? 's' : ''}. Cannot be undone.
        </p>
        <div class="row gap-sm mt-3" style="justify-content: flex-end">
          <button class="btn btn-secondary cancel-modal">Cancel</button>
          <button class="btn btn-danger confirm-clear">Clear all</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.cancel-modal').onclick = () => modal.remove();
    modal.querySelector('.confirm-clear').onclick = () => { clearAll(); modal.remove(); navigate('/'); };
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  });

  el.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => navigate(`/edit?id=${btn.closest('.device-row').dataset.id}`);
  });

  el.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest('.device-row');
      const id  = row.dataset.id;
      const asset = row.dataset.asset;
      const snapshot = getDevices().find(d => d.id === id);
      removeDevice(id);
      renderList(el);
      showSnack(`Removed ${asset}`, 'default', () => {
        const cur = getDevices();
        cur.push(snapshot);
        cur.sort((a, b) => new Date(b.sightedDate) - new Date(a.sightedDate));
        saveDevices(cur);
        renderList(el);
      });
    };
  });
}

// ============================================================
// EDIT
// ============================================================

function renderEdit(el, id) {
  if (!id) { navigate('/list'); return; }

  const device = getDevices().find(d => d.id === id);
  if (!device) {
    el.innerHTML = `
      <div class="empty-state">
        <h2>Device not found</h2>
        <p>It may have been deleted.</p>
        <button class="btn btn-primary mt-2 back-list">Back to list</button>
      </div>`;
    el.querySelector('.back-list').onclick = () => navigate('/list');
    return;
  }

  el.innerHTML = `
    <div class="stack-lg">
      <div>
        <button class="btn btn-ghost btn-sm back-btn">← Back</button>
        <h1 class="mt-2">Edit device</h1>
      </div>

      <form id="edit-form" class="stack-md">
        <div class="field">
          <label for="e-asset">Asset number <span class="req">*</span></label>
          <input id="e-asset" class="mono" type="text" value="${esc(device.assetNumber)}" autocomplete="off" />
          <span class="field-error" id="err-asset"></span>
        </div>
        <div class="field">
          <label for="e-building">Building name <span class="req">*</span></label>
          <input id="e-building" type="text" value="${esc(device.buildingName)}" autocomplete="off" />
          <span class="field-error" id="err-building"></span>
        </div>
        <div class="field">
          <label for="e-room">Room number / name <span class="req">*</span></label>
          <input id="e-room" type="text" value="${esc(device.roomNumber)}" autocomplete="off" />
          <span class="field-error" id="err-room"></span>
        </div>
        <div class="field">
          <label for="e-person">Person responsible</label>
          <input id="e-person" type="text" value="${esc(device.personResponsible)}" autocomplete="off" />
        </div>
        <div class="field">
          <label for="e-notes">Additional notes</label>
          <textarea id="e-notes" rows="2">${esc(device.additionalNotes)}</textarea>
        </div>
        <div class="row justify-between mt-2">
          <button type="button" class="btn btn-danger del-btn">Delete device</button>
          <div class="row gap-sm">
            <button type="button" class="btn btn-ghost cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </div>
        </div>
      </form>
    </div>`;

  el.querySelector('.back-btn').onclick   = () => navigate('/list');
  el.querySelector('.cancel-btn').onclick = () => navigate('/list');
  el.querySelector('.del-btn').onclick = () => {
    if (confirm(`Delete ${device.assetNumber}?`)) {
      removeDevice(id);
      showSnack(`Removed ${device.assetNumber}`);
      navigate('/list');
    }
  };

  el.querySelector('#edit-form').onsubmit = e => {
    e.preventDefault();
    const asset    = document.getElementById('e-asset').value.trim();
    const building = document.getElementById('e-building').value.trim();
    const room     = document.getElementById('e-room').value.trim();
    let ok = true;

    ['err-asset', 'err-building', 'err-room'].forEach(eid => {
      document.getElementById(eid).textContent = '';
    });
    if (!asset)    { document.getElementById('err-asset').textContent    = 'Required'; ok = false; }
    if (!building) { document.getElementById('err-building').textContent = 'Required'; ok = false; }
    if (!room)     { document.getElementById('err-room').textContent     = 'Required'; ok = false; }
    if (!ok) return;

    updateDevice(id, {
      assetNumber:       asset,
      buildingName:      building,
      roomNumber:        room,
      personResponsible: document.getElementById('e-person').value.trim(),
      additionalNotes:   document.getElementById('e-notes').value.trim(),
    });
    showSnack('Changes saved', 'success');
    navigate('/list');
  };
}
