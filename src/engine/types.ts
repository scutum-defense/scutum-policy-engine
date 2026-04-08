export type PolicyVerdict = "allow" | "deny" | "warn" | "require_approval";

export type PolicyCategory = "operational" | "safety" | "sovereignty" | "security";

export interface PolicyRule {
  field: string;
  operator: "eq" | "neq" | "in" | "not_in" | "exists" | "gt" | "lt";
  value: unknown;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  category: PolicyCategory;
  enabled: boolean;
  rules: PolicyRule[];
  verdict: PolicyVerdict;
  message: string;
  metadata: {
    author: string;
    created: string;
    references?: string[];
    tags: string[];
  };
}

export interface EvaluationContext {
  action: string;
  actor: string;
  target: string;
  environment: string;
  attributes: Record<string, unknown>;
  timestamp: string;
}

export interface PolicyEvaluation {
  policyId: string;
  policyName: string;
  category: PolicyCategory;
  verdict: PolicyVerdict;
  message: string;
  matched: boolean;
  timestamp: string;
}
