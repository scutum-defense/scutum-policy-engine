import type { Policy, EvaluationContext, PolicyEvaluation, PolicyVerdict } from "./types";

export class PolicyEngine {
  private policies: Policy[] = [];

  loadPolicies(policies: Policy[]): void {
    this.policies = policies.filter((p) => p.enabled);
  }

  evaluate(context: EvaluationContext): PolicyEvaluation[] {
    const results: PolicyEvaluation[] = [];

    for (const policy of this.policies) {
      const matched = policy.rules.every((rule) => {
        const value = context.attributes[rule.field];
        switch (rule.operator) {
          case "eq": return value === rule.value;
          case "neq": return value !== rule.value;
          case "in": return Array.isArray(rule.value) && rule.value.includes(value);
          case "not_in": return Array.isArray(rule.value) && !rule.value.includes(value);
          case "exists": return value !== undefined && value !== null;
          case "gt": return typeof value === "number" && value > (rule.value as number);
          case "lt": return typeof value === "number" && value < (rule.value as number);
          default: return false;
        }
      });

      if (matched) {
        results.push({
          policyId: policy.id,
          policyName: policy.name,
          category: policy.category,
          verdict: policy.verdict,
          message: policy.message,
          matched: true,
          timestamp: context.timestamp,
        });
      }
    }

    return results;
  }

  getFinalVerdict(evaluations: PolicyEvaluation[]): PolicyVerdict {
    if (evaluations.some((e) => e.verdict === "deny")) return "deny";
    if (evaluations.some((e) => e.verdict === "require_approval")) return "require_approval";
    if (evaluations.some((e) => e.verdict === "warn")) return "warn";
    return "allow";
  }
}
