import { describe, expect, it } from "vitest";
import { evaluateKpiAlerts, type KPISnapshot } from "@/lib/kpiEngine";

describe("KPI alerts no-data handling", () => {
  it("does not create KVP alerts for KPI metrics whose denominator has no data", () => {
    const emptySnapshot: KPISnapshot = {
      timestamp: "2026-06-05",
      metrics: {
        meldefristen: 0,
        control_implementation: 0,
        maturity_domains_at_target: 0,
        high_risk_coverage: 0,
        compliance_velocity: 0,
      },
      hasData: {
        meldefristen: false,
        control_implementation: false,
        maturity_domains_at_target: false,
        high_risk_coverage: false,
        compliance_velocity: false,
      },
    };

    expect(evaluateKpiAlerts(emptySnapshot)).toEqual([]);
  });

  it("still creates an alert when a KPI has data and misses its target", () => {
    const snapshot: KPISnapshot = {
      timestamp: "2026-06-05",
      metrics: { control_implementation: 50 },
      hasData: { control_implementation: true },
    };

    expect(evaluateKpiAlerts(snapshot)).toMatchObject([
      { kpi_id: "control_implementation", severity: "critical" },
    ]);
  });
});