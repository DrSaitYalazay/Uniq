---
name: Pricing tiers
description: Free + Core (€2.900, 1 user) + Enterprise (€5.900, 5 users) + XL (€9.900, 10 users) — 3 paid tiers anchored against GRC market
type: feature
---
## Three-tier paid model + Free

### Free (role: user)
- Blog articles, ~10% content preview per section
- Rendered as compact banner above paid grid (not a full card)

### CORE — €2.900/yr (role: pro) — "STARTER"
- Full 18-step NIS2 pipeline, 206 controls, gap analysis
- Risk matrix, maturity, 50+ policy templates (DE/EN)
- Audit-ready PDF/Word reports, KPI dashboard, management reports
- **Extended implementation guidance (up to 3h per year)**
- Email support, 1 user
- Positioning: structured entry for one organisation

### ENTERPRISE — €5.900/yr (role: premium) — "MOST POPULAR"
- Everything in Core, plus: **up to 5 users**
- **Extended implementation guidance (up to 6h per year)**
- Audit prep, quarterly reviews, priority support (24h), dedicated AM
- Positioning: organisational rollout & audit readiness

### XL — €9.900/yr (role: xl) — "FOR LARGER TEAMS"
- Everything in Enterprise, plus: **up to 10 users**
- **Extended implementation guidance (up to 10h per year)**
- Senior dedicated AM with quarterly strategy reviews
- Contact form CTA: /contact?type=xl
- Positioning: larger compliance teams & complex organisations
- **REMOVED features (do NOT re-add):**
  - Multi-tenant / multi-entity management
  - Consultant & partner mode
  - Strategic audit prep across multiple locations / multi-site
  - Specific "40h" implementation hours figure (now generic "extended guidance")
  - SLA-based premium support (4h response)
  - Custom logo / white-label
- Multi-tenant + consultant features deferred to Q2 2026 roadmap (workspace switcher refactor required)

### Positioning anchors
- Comparable GRC tools (Vanta, Drata, ProcessUnity): €15K–€80K+/yr
- Traditional consulting: €50K–€120K (6–12 months)
- Internal implementation: €80K–€150K personnel cost
- Hard sales line: "Price is not the decision — can you afford getting NIS2 wrong?"
- 30-day money-back, excl. VAT, per organisation
- Feature config: src/lib/tierConfig.ts (SSOT)
- Email template tier copy: supabase/functions/_shared/transactional-email-templates/membership-granted.tsx
