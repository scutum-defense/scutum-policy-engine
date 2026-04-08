```
  ____            _                     ____       _ _               _____             _
 / ___|  ___ _   _| |_ _   _ _ __ ___  |  _ \ ___ | (_) ___ _   _  | ____|_ __   __ _(_)_ __   ___
 \___ \ / __| | | | __| | | | '_ ` _ \ | |_) / _ \| | |/ __| | | | |  _| | '_ \ / _` | | '_ \ / _ \
  ___) | (__| |_| | |_| |_| | | | | | ||  __/ (_) | | | (__| |_| | | |___| | | | (_| | | | | |  __/
 |____/ \___|\__,_|\__|\__,_|_| |_| |_||_|   \___/|_|_|\___|\__, | |_____|_| |_|\__, |_|_| |_|\___|
                                                             |___/               |___/
                                        @scutum/policy-engine
```

![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Policies](https://img.shields.io/badge/Policies-3-green.svg)
![Categories](https://img.shields.io/badge/Categories-3-orange.svg)

**Policy-as-code evaluation engine for sovereign defense operations.**

Evaluates whether actions, approvals, and deployments comply with operational, safety, and sovereignty policies. Every action flows through the policy engine before execution -- no exceptions.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Policy Anatomy](#policy-anatomy)
- [Built-in Policy Catalog](#built-in-policy-catalog)
- [Verdict Precedence](#verdict-precedence)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Policy Authoring Guide](#policy-authoring-guide)
- [Testing Policies](#testing-policies)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Scutum Policy Engine is the compliance backbone of the Scutum platform. It enforces operational constraints, safety requirements, and sovereignty rules across all platform operations. Every proposed action -- whether it is an automated response, a human-approved deployment, or a cross-region data transfer -- is evaluated against the active policy set before execution is permitted.

The engine operates on a simple but powerful principle: **policy-as-code**. Policies are defined as structured JSON documents, loaded at runtime, and evaluated against an action context. The engine returns a deterministic verdict for every evaluation.

### Key Principles

- **Deterministic evaluation**: Given the same policies and context, the engine always produces the same verdict.
- **Fail-closed**: If the engine cannot evaluate a context (missing data, malformed policy), the default behavior is to deny.
- **Auditable**: Every evaluation produces a structured result that can be logged, queried, and reviewed.
- **Composable**: Policies are independent units that can be combined, versioned, and deployed independently.
- **Human-readable**: Policy definitions are JSON documents that can be reviewed by non-engineers.

---

## Architecture

The policy engine follows a straightforward evaluation pipeline:

```
  +-------------------+
  |  Evaluation        |
  |  Context           |
  |  (action, actor,   |
  |   target, attrs)   |
  +--------+-----------+
           |
           v
  +--------+-----------+
  |  Policy Engine      |
  |                     |
  |  +---------------+  |
  |  | Policy Set    |  |
  |  | (loaded from  |  |
  |  |  JSON files)  |  |
  |  +-------+-------+  |
  |          |           |
  |  +-------v-------+  |
  |  | Rule Matcher   |  |
  |  | (field-based   |  |
  |  |  operators)    |  |
  |  +-------+-------+  |
  |          |           |
  |  +-------v-------+  |
  |  | Verdict        |  |
  |  | Aggregator     |  |
  |  +-------+-------+  |
  +--------+-----------+
           |
           v
  +--------+-----------+
  |  PolicyEvaluation[] |
  |  + Final Verdict    |
  +---------------------+
```

### Components

| Component | Description |
|-----------|-------------|
| **PolicyEngine** | Core evaluation engine. Loads policies, evaluates contexts, aggregates verdicts. |
| **PolicyLoader** | Reads policy JSON files from the filesystem. Supports recursive directory scanning. |
| **PolicyRule** | Individual rule within a policy. Matches a context attribute using an operator. |
| **EvaluationContext** | The action context being evaluated: who is doing what, where, and with what attributes. |
| **PolicyEvaluation** | The result of evaluating a single policy against a context. |

---

## Installation

```bash
npm install @scutum/policy-engine
```

Or with your preferred package manager:

```bash
pnpm add @scutum/policy-engine
yarn add @scutum/policy-engine
```

---

## Quick Start

```typescript
import { PolicyEngine, PolicyLoader } from "@scutum/policy-engine";

// 1. Load policies from the policies directory
const policies = PolicyLoader.fromDirectory("./policies");

// 2. Create and configure the engine
const engine = new PolicyEngine();
engine.loadPolicies(policies);

// 3. Define the evaluation context
const context = {
  action: "deploy",
  actor: "operator-alpha",
  target: "fuel-zone-01",
  environment: "production",
  attributes: {
    action_type: "execute",
    approval_status: "pending",
    target_region: "sovereign-primary",
  },
  timestamp: new Date().toISOString(),
};

// 4. Evaluate
const evaluations = engine.evaluate(context);
const verdict = engine.getFinalVerdict(evaluations);

console.log(`Final verdict: ${verdict}`);
// Output: Final verdict: require_approval

// 5. Inspect individual evaluations
for (const evaluation of evaluations) {
  console.log(`[${evaluation.category}] ${evaluation.policyName}: ${evaluation.verdict}`);
  console.log(`  Message: ${evaluation.message}`);
}
```

---

## Policy Anatomy

Every policy is a JSON document with the following structure:

```json
{
  "id": "SCUTUM-CATEGORY-NNN",
  "name": "Human-readable policy name",
  "description": "Detailed description of what this policy enforces and why.",
  "version": "1.0.0",
  "category": "operational | safety | sovereignty | security",
  "enabled": true,
  "rules": [
    {
      "field": "attribute_name",
      "operator": "eq | neq | in | not_in | exists | gt | lt",
      "value": "expected_value"
    }
  ],
  "verdict": "allow | deny | warn | require_approval",
  "message": "Human-readable message explaining the verdict.",
  "metadata": {
    "author": "team-or-individual",
    "created": "YYYY-MM-DD",
    "references": ["standard-reference"],
    "tags": ["tag1", "tag2"]
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique policy identifier. Convention: `SCUTUM-{CATEGORY}-{NNN}` |
| `name` | string | Human-readable name for the policy |
| `description` | string | Detailed explanation of the policy's purpose |
| `version` | string | Semantic version of the policy |
| `category` | enum | One of: `operational`, `safety`, `sovereignty`, `security` |
| `enabled` | boolean | Whether the policy is active. Disabled policies are skipped. |
| `rules` | array | Array of rules that must ALL match for the policy to trigger |
| `verdict` | enum | The verdict to return if all rules match |
| `message` | string | Human-readable explanation of the verdict |
| `metadata` | object | Author, creation date, references, and tags |

### Rule Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{ "field": "action_type", "operator": "eq", "value": "deploy" }` |
| `neq` | Not equals | `{ "field": "approval_status", "operator": "neq", "value": "approved" }` |
| `in` | Value is in array | `{ "field": "action_type", "operator": "in", "value": ["execute", "deploy"] }` |
| `not_in` | Value is not in array | `{ "field": "region", "operator": "not_in", "value": ["sovereign-primary"] }` |
| `exists` | Field exists and is not null | `{ "field": "approval_token", "operator": "exists", "value": true }` |
| `gt` | Greater than (numeric) | `{ "field": "risk_score", "operator": "gt", "value": 0.8 }` |
| `lt` | Less than (numeric) | `{ "field": "confidence", "operator": "lt", "value": 0.5 }` |

---

## Built-in Policy Catalog

The engine ships with three foundational policies:

| ID | Name | Category | Verdict | Description |
|----|------|----------|---------|-------------|
| `SCUTUM-SAFETY-001` | No autonomous OT write path | Safety | `deny` | Blocks any automated OT/SCADA write operation that lacks explicit human approval. Non-negotiable. |
| `SCUTUM-SOV-001` | Sovereign data residency enforcement | Sovereignty | `deny` | Prevents data from leaving the designated sovereign region boundaries. |
| `SCUTUM-OPS-001` | Human approval required for action execution | Operational | `require_approval` | Requires human operator approval before any action transitions to execution. |

### Policy File Locations

```
policies/
  operational/
    require-human-approval.json    # SCUTUM-OPS-001
  safety/
    no-autonomous-ot-write.json    # SCUTUM-SAFETY-001
  sovereignty/
    data-residency.json            # SCUTUM-SOV-001
```

---

## Verdict Precedence

When multiple policies match a given context, the engine aggregates their verdicts using a strict precedence order:

```
deny > require_approval > warn > allow
```

| Priority | Verdict | Meaning |
|----------|---------|---------|
| 1 (highest) | `deny` | Action is blocked. No override possible without policy change. |
| 2 | `require_approval` | Action is paused. Requires explicit human approval to proceed. |
| 3 | `warn` | Action is permitted but flagged. Warning is logged for review. |
| 4 (lowest) | `allow` | Action is permitted. Default when no policies match. |

This means:
- If **any** policy returns `deny`, the final verdict is `deny` regardless of other evaluations.
- If no policies deny but some require approval, the final verdict is `require_approval`.
- If no policies deny or require approval but some warn, the final verdict is `warn`.
- If no policies match or all matched policies allow, the final verdict is `allow`.

---

## Usage Examples

<details>
<summary><strong>Example 1: Evaluating an OT write operation</strong></summary>

```typescript
import { PolicyEngine, PolicyLoader } from "@scutum/policy-engine";

const engine = new PolicyEngine();
engine.loadPolicies(PolicyLoader.fromDirectory("./policies"));

const context = {
  action: "ot-write",
  actor: "automated-response-system",
  target: "scada-controller-01",
  environment: "production",
  attributes: {
    action_type: "ot_write",
    approval_status: "pending",
    target_region: "sovereign-primary",
  },
  timestamp: new Date().toISOString(),
};

const evaluations = engine.evaluate(context);
const verdict = engine.getFinalVerdict(evaluations);

console.log(verdict);
// Output: "deny"
// Reason: SCUTUM-SAFETY-001 blocks autonomous OT writes without approval
```

</details>

<details>
<summary><strong>Example 2: Evaluating a cross-region data transfer</strong></summary>

```typescript
const context = {
  action: "data-transfer",
  actor: "sync-service",
  target: "analytics-cluster",
  environment: "production",
  attributes: {
    action_type: "transfer",
    target_region: "us-east-1", // Not a sovereign region
  },
  timestamp: new Date().toISOString(),
};

const evaluations = engine.evaluate(context);
const verdict = engine.getFinalVerdict(evaluations);

console.log(verdict);
// Output: "deny"
// Reason: SCUTUM-SOV-001 blocks data transfer outside sovereign boundaries
```

</details>

<details>
<summary><strong>Example 3: Evaluating an approved deployment</strong></summary>

```typescript
const context = {
  action: "deploy",
  actor: "operator-bravo",
  target: "web-service-v2",
  environment: "production",
  attributes: {
    action_type: "deploy",
    approval_status: "approved",
    target_region: "sovereign-primary",
  },
  timestamp: new Date().toISOString(),
};

const evaluations = engine.evaluate(context);
const verdict = engine.getFinalVerdict(evaluations);

console.log(verdict);
// Output: "allow"
// Reason: Deployment is approved and within sovereign boundaries
```

</details>

<details>
<summary><strong>Example 4: Loading policies from a custom directory</strong></summary>

```typescript
import { PolicyLoader } from "@scutum/policy-engine";

// Load from a custom path
const policies = PolicyLoader.fromDirectory("/etc/scutum/policies");

// The loader recursively scans all subdirectories for .json files
console.log(`Loaded ${policies.length} policies`);
```

</details>

<details>
<summary><strong>Example 5: Programmatic policy definition</strong></summary>

```typescript
import { PolicyEngine } from "@scutum/policy-engine";
import type { Policy } from "@scutum/policy-engine";

const customPolicy: Policy = {
  id: "CUSTOM-001",
  name: "Block after-hours deployments",
  description: "Prevents deployments outside of business hours (09:00-17:00).",
  version: "1.0.0",
  category: "operational",
  enabled: true,
  rules: [
    { field: "action_type", operator: "eq", value: "deploy" },
    { field: "hour_of_day", operator: "gt", value: 17 },
  ],
  verdict: "deny",
  message: "Deployments are not permitted outside business hours.",
  metadata: {
    author: "platform-ops",
    created: "2026-04-01",
    tags: ["deployment", "business-hours"],
  },
};

const engine = new PolicyEngine();
engine.loadPolicies([customPolicy]);
```

</details>

---

## API Reference

<details>
<summary><strong>PolicyEngine</strong></summary>

### `loadPolicies(policies: Policy[]): void`

Loads an array of policies into the engine. Only enabled policies are retained. Calling this method replaces any previously loaded policies.

**Parameters:**
- `policies` - Array of `Policy` objects to load

### `evaluate(context: EvaluationContext): PolicyEvaluation[]`

Evaluates the given context against all loaded policies. Returns an array of evaluations for each policy that matched.

**Parameters:**
- `context` - The evaluation context containing action details and attributes

**Returns:** Array of `PolicyEvaluation` objects for matched policies

### `getFinalVerdict(evaluations: PolicyEvaluation[]): PolicyVerdict`

Computes the final aggregated verdict from an array of evaluations using the verdict precedence rules.

**Parameters:**
- `evaluations` - Array of `PolicyEvaluation` objects

**Returns:** The final verdict: `"deny"`, `"require_approval"`, `"warn"`, or `"allow"`

</details>

<details>
<summary><strong>PolicyLoader</strong></summary>

### `static fromDirectory(dirPath: string): Policy[]`

Recursively scans a directory for `.json` files and parses each as a `Policy` object.

**Parameters:**
- `dirPath` - Path to the directory containing policy JSON files

**Returns:** Array of parsed `Policy` objects

</details>

---

## Policy Authoring Guide

<details>
<summary><strong>Writing a new policy</strong></summary>

### Step 1: Choose the category

- **operational** - Day-to-day operational constraints (approval workflows, scheduling, access)
- **safety** - Safety-critical constraints (OT writes, physical system interactions, emergency protocols)
- **sovereignty** - Data residency, regulatory compliance, cross-border restrictions
- **security** - Authentication, authorization, encryption, audit requirements

### Step 2: Define the rules

Each rule matches a single attribute in the evaluation context. All rules in a policy must match for the policy to trigger (AND logic).

```json
{
  "rules": [
    { "field": "action_type", "operator": "eq", "value": "deploy" },
    { "field": "environment", "operator": "eq", "value": "production" },
    { "field": "approval_status", "operator": "neq", "value": "approved" }
  ]
}
```

This policy triggers when: the action type is "deploy" AND the environment is "production" AND the approval status is NOT "approved".

### Step 3: Choose the verdict

- `deny` - Use for non-negotiable constraints (safety, sovereignty violations)
- `require_approval` - Use when human review is needed before proceeding
- `warn` - Use for advisory policies that should be logged but not block
- `allow` - Rarely used explicitly; the default when no policies match

### Step 4: Write a clear message

The message should explain WHY the verdict was issued and WHAT the operator should do.

### Step 5: Place the file

Save the policy as a `.json` file in the appropriate category directory under `policies/`.

</details>

---

## Testing Policies

<details>
<summary><strong>Unit testing policies with vitest</strong></summary>

```typescript
import { describe, it, expect } from "vitest";
import { PolicyEngine, PolicyLoader } from "@scutum/policy-engine";

describe("Safety policies", () => {
  const engine = new PolicyEngine();
  engine.loadPolicies(PolicyLoader.fromDirectory("./policies/safety"));

  it("should deny autonomous OT writes", () => {
    const evaluations = engine.evaluate({
      action: "ot-write",
      actor: "automated-system",
      target: "scada-01",
      environment: "production",
      attributes: {
        action_type: "ot_write",
        approval_status: "pending",
      },
      timestamp: new Date().toISOString(),
    });

    const verdict = engine.getFinalVerdict(evaluations);
    expect(verdict).toBe("deny");
  });

  it("should allow approved OT writes", () => {
    const evaluations = engine.evaluate({
      action: "ot-write",
      actor: "operator",
      target: "scada-01",
      environment: "production",
      attributes: {
        action_type: "ot_write",
        approval_status: "approved",
      },
      timestamp: new Date().toISOString(),
    });

    const verdict = engine.getFinalVerdict(evaluations);
    expect(verdict).toBe("allow");
  });
});
```

</details>

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-policy`
3. Add your policy to the appropriate category directory
4. Write tests for your policy
5. Submit a pull request

### Policy Review Requirements

- All safety policies require review from `@ScutumDefense/ot-safety`
- All sovereignty policies require review from `@ScutumDefense/crypto-assurance`
- All engine changes require review from `@ScutumDefense/architecture-council`

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text.

---

<div align="center">
  <sub>Built by Scutum Defense -- Sovereign defense infrastructure for critical operations.</sub>
</div>
