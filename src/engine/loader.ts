import type { Policy } from "./types";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

export class PolicyLoader {
  static fromDirectory(dirPath: string): Policy[] {
    const policies: Policy[] = [];
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      const full = join(dirPath, entry);
      if (statSync(full).isDirectory()) {
        policies.push(...PolicyLoader.fromDirectory(full));
      } else if (extname(entry) === ".json") {
        policies.push(JSON.parse(readFileSync(full, "utf-8")));
      }
    }
    return policies;
  }
}
