import POLICY_TEMPLATES from "../src/data/policyTemplates";
import CLAUSES from "../src/data/policyClauseTemplates";
import { writeFileSync } from "node:fs";

const byCat = new Map<string, typeof POLICY_TEMPLATES>();
for (const p of POLICY_TEMPLATES) {
  if (!byCat.has(p.category)) byCat.set(p.category, []);
  byCat.get(p.category)!.push(p);
}

let out = `# UniqSuite – Richtlinien-Katalog\n\n`;
out += `_Stand: ${new Date().toLocaleDateString("de-DE")}_\n\n`;
out += `**${POLICY_TEMPLATES.length} Richtlinien** · Bilingual (DE / EN)\n\n---\n\n`;

let policyN = 0, clauseN = 0;
for (const [cat, list] of byCat) {
  out += `\n## ${cat}\n\n`;
  for (const p of list) {
    policyN++;
    const clauses = (CLAUSES as Record<string, any[]>)[p.id] ?? [];
    out += `\n### ${p.id.toUpperCase()} — ${p.name}\n`;
    out += `_${p.nameEn}_\n\n`;
    out += `**Beschreibung / Description**\n\n${p.description}\n\n_${p.descriptionEn}_\n\n`;
    out += `**Zweck / Purpose**\n\n${p.purpose}\n\n_${p.purposeEn}_\n\n`;
    out += `**Grundregeln / Default Rules**\n\n`;
    for (const r of p.defaultRules) out += `- ${r}\n`;
    out += `\n`;
    for (const r of p.defaultRulesEn) out += `- _${r}_\n`;
    out += `\n`;
    if (clauses.length) {
      out += `\n#### Klauseln / Clauses (${clauses.length})\n\n`;
      for (const c of clauses) {
        clauseN++;
        out += `\n**${c.id} — ${c.title}**  \n_${c.titleEn}_\n\n`;
        out += `- **Anforderung / Requirement:** ${c.description}\n`;
        out += `  - _${c.descriptionEn}_\n`;
        out += `- **Begründung / Rationale:** ${c.reason}\n`;
        out += `  - _${c.reasonEn}_\n`;
        out += `- **Wann erforderlich / When required:** ${c.whenRequired}\n`;
        out += `  - _${c.whenRequiredEn}_\n`;
        if (c.sources?.length) out += `- **Quellen / Sources:** ${c.sources.join(" · ")}\n`;
        out += `\n`;
      }
    }
    out += `\n---\n`;
  }
}

out += `\n\n## Zusammenfassung / Summary\n\n`;
out += `- Kategorien: **${byCat.size}**\n- Richtlinien: **${policyN}**\n- Klauseln: **${clauseN}**\n`;

writeFileSync("/mnt/documents/UniqSuite-Richtlinien-Katalog.md", out);
console.log("OK", policyN, clauseN, out.length);
