import { PolicyEngine, PolicyLoader } from "../src";

const engine = new PolicyEngine();
const policies = PolicyLoader.fromDirectory("./policies");
engine.loadPolicies(policies);
console.log(`Loaded ${policies.length} policies`);

// Evaluate an unapproved OT write
const results = engine.evaluate({
  action: "write",
  actor: "automated-system",
  target: "plc-controller-07",
  environment: "pilot-port",
  timestamp: new Date().toISOString(),
  attributes: {
    action_type: "ot_write",
    approval_status: "pending",
    target_region: "sovereign-primary",
  },
});

console.log("\nPolicy evaluations:");
for (const r of results) {
  console.log(`  [${r.verdict.toUpperCase()}] ${r.policyName}: ${r.message}`);
}

const verdict = engine.getFinalVerdict(results);
console.log(`\nFinal verdict: ${verdict}`);
