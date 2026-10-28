/**
 * dsh-sidebar-entries — host half (v0.6.3).
 * Diagnostics + client-bundle reload + a sink for the client shim's reports.
 *   GET  /sidebar-entries/ping
 *   GET  /sidebar-entries/graph
 *   GET  /sidebar-entries/log
 *   POST /sidebar-entries/log     -> { ok, count }
 *   POST /sidebar-entries/reload  -> clientModules.rebuilt(id)
 */

export const inject = ['webServer'];

const VERSION = '0.7.14';
const STATE = { last: null, entries: [] };

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    try {
      req.on('data', (chunk) => {
        data += chunk;
        if (data.length > 1e6) req.destroy();
      });
      req.on('end', () => resolve(data));
      req.on('error', () => resolve(data));
    } catch (e) {
      resolve(data);
    }
  });
}

function graphRows(svc) {
  const graph = svc && typeof svc.graph === 'function' ? svc.graph() : null;
  if (Array.isArray(graph)) return graph;
  if (graph && Array.isArray(graph.entries)) return graph.entries;
  if (graph && typeof graph === 'object') return Object.values(graph).filter((v) => v && typeof v === 'object');
  return [];
}

export function apply(ctx) {
  // A module whose apply() throws cannot be mounted, and the profile then
  // refuses to come up until the user disables every plugin. These routes are
  // diagnostics; losing one is survivable, losing the mount is not. So each
  // registration is attempted and allowed to fail quietly.
  const route = (path, handler) => {
    try {
      ctx.effect(
        () => ctx.webServer.register({ kind: 'exact', path, handler }),
        'dsh-sidebar-entries: ' + path,
      );
    } catch (e) {}
  };
  route('/sidebar-entries/ping', async (req, res) => {
    json(res, 200, { ok: true, plugin: 'dsh-sidebar-entries', version: VERSION });
  });

  route('/sidebar-entries/graph', async (req, res) => {
    try {
      const svc = ctx.get('clientModules');
      const rows = graphRows(svc);
      const ids = rows.map((r) => (r && r.id) || (r && r.packageName) || null).filter(Boolean);
      const path = svc && typeof svc.clientPath === 'function' ? svc.clientPath('dsh-sidebar-entries') : null;
      const mine = rows.filter((r) => r && ((r.id && String(r.id).indexOf('sidebar-entries') >= 0) || (r.packageName && String(r.packageName).indexOf('sidebar-entries') >= 0)));
      json(res, 200, { ok: true, total: ids.length, hasMine: mine.length > 0, mine: mine, clientPath: path || null });
    } catch (error) {
      json(res, 500, { ok: false, error: String((error && error.message) || error) });
    }
  });

  route('/sidebar-entries/log', async (req, res) => {
    const raw = await readBody(req);
    if (!raw) {
      json(res, 200, { ok: true, count: STATE.entries.length, last: STATE.last, entries: STATE.entries.slice(-20) });
      return;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = { raw: String(raw).slice(0, 2000) };
    }
    STATE.last = parsed;
    STATE.entries.push(parsed);
    if (STATE.entries.length > 50) STATE.entries.shift();
    json(res, 200, { ok: true, count: STATE.entries.length });
  });

  route('/sidebar-entries/reload', async (req, res) => {
    await readBody(req);
    try {
      const svc = ctx.get('clientModules');
      if (!svc || typeof svc.rebuilt !== 'function') {
        json(res, 503, { ok: false, error: 'clientModules.rebuilt unavailable' });
        return;
      }
      const rev = svc.rebuilt('dsh-sidebar-entries');
      json(res, 200, { ok: true, rev: rev === undefined ? null : rev });
    } catch (error) {
      json(res, 500, { ok: false, error: String((error && error.message) || error) });
    }
  });
}
