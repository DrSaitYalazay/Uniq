# NIS2 Full Pipeline Architecture

## 17-Step Pipeline (Master Design)

### Implemented ✅
1. **Context Intake** → `/context` — Company profile input
2. **Applicability Engine** → `/betroffenheit` — NIS2 scope + entity type
6. **Baseline Assessment Engine** → `/check` — Control evaluation + maturity
7. **Gap Engine** → `/overview` — Expected vs actual gaps
8. **Risk Engine** → `/risk-matrix` — Impact × likelihood
10. **SoA Engine** → `/soa` — Statement of Applicability
12. **Implementation Engine** → `/execution` — Action list with priorities
13. **Roadmap Engine** → `/roadmap` — Now/Next/Later sequencing, milestones, resource allocation
16. **KPI Engine** → `/kpis` — 18 KPIs across 5 categories (Compliance, Risk, Operational, Maturity, Time) + trend tracking + alerts

### Not Yet Implemented ❌
3. **Critical Service Mapping** → `/services` — Identify critical services from applicability result
4. **Asset Inventory Engine** → `/assets` — IT systems, apps, data, physical, cloud, OT/ICS, third-party
5. **Dependency & Data Flow Mapping** → `/dependencies` — Asset dependencies, data flows, trust boundaries
9. **Decision Engine** → `/decisions` — Risk treatment logic, control selection draft
11. **Capability Engine** → `/capabilities` — Group controls into capabilities (IAM, Monitoring, etc.)
13. **Policy Engine** — Dynamic policy generation (~35 policies)
14. **Roadmap Engine** — Now/Next/Later sequencing with dependency mapping
17. **Monitoring Engine** — KPI evaluation + alerts
18. **Feedback Loop** — Update risks/gaps from KPI results + incidents

## Correct Pipeline Order
Context → Applicability → Service Scope → Asset Inventory → Dependency Map → Assessment → Gap → Risk → Decision/Treatment → SoA → Capability → Implementation → Policy → Roadmap → KPI → Monitoring → Feedback

## Traceability Chain
NIS2 Requirement → Critical Service → Asset → Dependency → Gap → Risk → Control Decision → SoA → Capability → Policy → Action → KPI

## Final Outputs
- **Audit Package**: SoA, policies, risk register, reports
- **Management View**: dashboard, KPIs
