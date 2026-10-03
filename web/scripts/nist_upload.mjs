import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = createClient(url, key, { auth: { persistSession: false } });
const p = JSON.parse(fs.readFileSync("/tmp/nist/nist_payload.json","utf8"));

async function chunked(rows, size, fn) {
  for (let i=0; i<rows.length; i+=size) {
    const c = rows.slice(i, i+size);
    await fn(c);
  }
}

// Controls
console.log("controls:", p.controls.length);
await chunked(p.controls, 200, async c => {
  const { error } = await supa.from("controls").upsert(c, { onConflict: "framework,id" });
  if (error) { console.error(error); process.exit(1); }
});
// Risks
console.log("risks:", p.risks.length);
await chunked(p.risks, 200, async c => {
  const { error } = await supa.from("risks").upsert(c, { onConflict: "risk_id" });
  if (error) { console.error(error); process.exit(1); }
});
// Clear existing junctions for NIST
for (const t of ["control_iso","control_risk","risk_control"]) {
  const { error } = await supa.from(t).delete().eq("framework","NIST_CSF");
  if (error) { console.error(t, error); process.exit(1); }
}
console.log("control_iso:", p.control_iso.length);
await chunked(p.control_iso, 500, async c => {
  const { error } = await supa.from("control_iso").insert(c);
  if (error) { console.error(error); process.exit(1); }
});
console.log("control_risk:", p.control_risk.length);
await chunked(p.control_risk, 500, async c => {
  const { error } = await supa.from("control_risk").insert(c);
  if (error) { console.error(error); process.exit(1); }
});
console.log("risk_control:", p.risk_control.length);
const rc = p.risk_control.map(x => ({ ...x, tier: x.tier || "thematisch" }));
await chunked(rc, 500, async c => {
  const { error } = await supa.from("risk_control").insert(c);
  if (error) { console.error(error); process.exit(1); }
});
console.log("done");
