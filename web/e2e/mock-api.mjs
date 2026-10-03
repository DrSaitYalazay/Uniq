// Minimaler Mock der cy-api (/auth, /db/query, /db/rpc, /functions) für Playwright.
export function makeDb({ role = "admin", frameworks = ["NIS2", "ISO27001", "AIACT", "ISO42001"], orgOwnerRole = null } = {}) {
  const U = "00000000-0000-4000-8000-000000000001";
  const now = new Date().toISOString();
  return {
    U,
    role,
    orgOwnerRole,
    OWNER: "00000000-0000-4000-8000-0000000000aa",
    tables: {
      user_roles: [{ user_id: U, role }],
      company_profiles: [{ id: "cp1", user_id: U, company_name: "Musterstadt GmbH", enabled_frameworks: frameworks, created_at: now, updated_at: now }],
      org_tool_data: [],
      user_tool_data: [],
      profiles: [{ id: U, user_id: U, email: "dozent@example.org", full_name: "Test Dozent" }],
      organizations: orgOwnerRole ? [{ id: "org1", owner_id: "00000000-0000-4000-8000-0000000000aa", name: "Hochschule" }] : [],
    },
    writes: [],
    unknown: new Set(),
  };
}

function matches(row, filters) {
  for (const f of filters || []) {
    const v = row[f.col];
    if (f.op === "eq" && String(v) !== String(f.val)) return false;
    if (f.op === "neq" && String(v) === String(f.val)) return false;
    if (f.op === "in" && !(f.val || []).map(String).includes(String(v))) return false;
    if (f.op === "is" && !(v === f.val || (f.val === null && v == null))) return false;
  }
  return true;
}

export async function installMock(page, db) {
  const user = { id: db.U, email: "dozent@example.org", user_metadata: { full_name: "Test Dozent" }, app_metadata: {} };
  await page.addInitScript(([u, lang]) => {
    localStorage.setItem("cy.auth.session.v1", JSON.stringify({ access_token: "t", refresh_token: "r", expires_at: Math.floor(Date.now() / 1000) + 36000, user: u }));
    localStorage.setItem("nis2-lang", lang);
    localStorage.setItem("cookie-consent", JSON.stringify({ necessary: true, analytics: false }));
  }, [user, "de"]);

  await page.route(/\/(auth|db|functions|storage)\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    let body = {};
    try { body = req.postDataJSON() ?? {}; } catch { /* leer */ }
    const json = (o, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(o) });

    if (p === "/auth/user") return json({ user });
    if (p === "/auth/aal") return json({ data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null });
    if (p === "/auth/factors") return json({ data: { all: [], totp: [] }, error: null });
    if (p.startsWith("/auth/token")) return json({ access_token: "t", refresh_token: "r", expires_at: Math.floor(Date.now() / 1000) + 36000, user });
    if (p.startsWith("/db/rpc/")) {
      const fn = p.split("/").pop();
      if (fn === "get_org_owner_id") return json({ data: db.U, error: null });
      if (fn === "has_role") return json({ data: body._user_id === db.OWNER ? body._role === db.orgOwnerRole : body._role === db.role, error: null });
      if (fn === "get_user_org_id") return json({ data: db.orgOwnerRole ? "org1" : null, error: null });
      return json({ data: null, error: null });
    }
    if (p === "/db/query") {
      const t = body.table;
      if (!db.tables[t]) { db.unknown.add(t); db.tables[t] = []; }
      const rows = db.tables[t];
      if (body.action === "select") {
        let out = rows.filter(r => matches(r, body.filters));
        for (const o of [...(body.order || [])].reverse()) out = [...out].sort((a, b) => (a[o.col] > b[o.col] ? 1 : -1) * (o.asc ? 1 : -1));
        if (body.limit) out = out.slice(0, body.limit);
        if (body.head) return json({ data: null, error: null, count: out.length });
        if (body.single || body.maybeSingle) return json({ data: out[0] ?? null, error: null, count: out.length });
        return json({ data: out, error: null, count: out.length });
      }
      const vals = Array.isArray(body.values) ? body.values : [body.values];
      db.writes.push({ table: t, action: body.action, values: vals });
      if (body.action === "insert") { rows.push(...vals); return json({ data: body.returning ? vals : null, error: null }); }
      if (body.action === "upsert") {
        const keys = (body.onConflict || "id").split(",");
        for (const v of vals) {
          const i = rows.findIndex(r => keys.every(k => String(r[k]) === String(v[k])));
          if (i >= 0) rows[i] = { ...rows[i], ...v }; else rows.push(v);
        }
        return json({ data: body.returning ? vals : null, error: null });
      }
      if (body.action === "update") {
        for (const r of rows) if (matches(r, body.filters)) Object.assign(r, body.values);
        return json({ data: null, error: null });
      }
      if (body.action === "delete") {
        db.tables[t] = rows.filter(r => !matches(r, body.filters));
        return json({ data: null, error: null });
      }
    }
    if (p.startsWith("/functions/")) return json({});
    return json({ data: null, error: null });
  });
}
