import { describe, it, expect } from "vitest";
import { PolicyEngine } from "../src/engine/engine";
import type { Policy, EvaluationContext } from "../src/engine/types";

const otWritePolicy: Policy = {
  id: "SAFETY-001", name: "No autonomous OT write", description: "test",
  version: "1.0.0", category: "safety", enabled: true,
  rules: [
    { field: "action_type", operator: "eq", value: "ot_write" },
    { field: "approval_status", operator: "neq", value: "approved" }
  ],
  verdict: "deny", message: "OT write requires approval",
  metadata: { author: "test", created: "2026-01-01", tags: ["safety"] }
};

const approvalPolicy: Policy = {
  id: "OPS-001", name: "Require human approval", description: "test",
  version: "1.0.0", category: "operational", enabled: true,
  rules: [
    { field: "action_type", operator: "in", value: ["execute", "deploy"] },
    { field: "approval_status", operator: "neq", value: "approved" }
  ],
  verdict: "require_approval", message: "Human approval required",
  metadata: { author: "test", created: "2026-01-01", tags: ["approval"] }
};

describe("PolicyEngine", () => {
  it("should deny unapproved OT writes", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([otWritePolicy]);
    const results = engine.evaluate({
      action: "write", actor: "system", target: "plc-01",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "ot_write", approval_status: "pending" }
    });
    expect(results.length).toBe(1);
    expect(results[0].verdict).toBe("deny");
  });

  it("should allow approved OT writes", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([otWritePolicy]);
    const results = engine.evaluate({
      action: "write", actor: "operator-1", target: "plc-01",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "ot_write", approval_status: "approved" }
    });
    expect(results.length).toBe(0);
  });

  it("should require approval for execution actions", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([approvalPolicy]);
    const results = engine.evaluate({
      action: "execute", actor: "system", target: "action-01",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "execute", approval_status: "pending" }
    });
    expect(results.length).toBe(1);
    expect(results[0].verdict).toBe("require_approval");
  });

  it("should apply verdict precedence: deny > require_approval > warn > allow", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([otWritePolicy, approvalPolicy]);
    const results = engine.evaluate({
      action: "execute", actor: "system", target: "plc-01",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "ot_write", approval_status: "pending" }
    });
    const verdict = engine.getFinalVerdict(results);
    expect(verdict).toBe("deny");
  });

  it("should return allow when no policies match", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([otWritePolicy]);
    const results = engine.evaluate({
      action: "read", actor: "operator-1", target: "dashboard",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "read" }
    });
    const verdict = engine.getFinalVerdict(results);
    expect(verdict).toBe("allow");
  });

  it("should skip disabled policies", () => {
    const engine = new PolicyEngine();
    engine.loadPolicies([{ ...otWritePolicy, enabled: false }]);
    const results = engine.evaluate({
      action: "write", actor: "system", target: "plc-01",
      environment: "production", timestamp: new Date().toISOString(),
      attributes: { action_type: "ot_write", approval_status: "pending" }
    });
    expect(results.length).toBe(0);
  });
});
