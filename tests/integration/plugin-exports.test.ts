import { describe, expect, it } from "vitest";
import plugin, { recommended } from "../../src/index.js";

describe("plugin exports", () => {
  it("exposes plugin metadata", () => {
    expect(plugin.meta?.name).toBe("eslint-plugin-compact-guards");
    expect(typeof plugin.meta?.version).toBe("string");
  });

  it("exposes the compact-guard-clause rule", () => {
    expect(plugin.rules).toBeDefined();
    const rule = plugin.rules?.["compact-guard-clause"];
    expect(rule).toBeDefined();
    expect(rule?.meta?.fixable).toBe("code");
    expect(rule?.meta?.messages).toHaveProperty("compactGuard");
    expect(rule?.meta?.messages).toHaveProperty("compactGuardUnsafe");
  });

  it("exposes a recommended flat config", () => {
    expect(plugin.configs?.recommended).toBe(recommended);
    expect(recommended.rules).toMatchObject({
      "compact-guards/compact-guard-clause": "error",
    });
    expect(recommended.plugins).toHaveProperty("compact-guards");
  });
});
