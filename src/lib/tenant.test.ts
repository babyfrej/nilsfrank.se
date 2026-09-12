import { describe, expect, test } from "bun:test";
import { isTenantPath, resolveTenant } from "./tenant";

describe("resolveTenant", () => {
	test("maps production subdomains to tenants", () => {
		expect(resolveTenant("frej.nilsfrank.se")).toBe("frej");
		expect(resolveTenant("helge.nilsfrank.se")).toBe("helge");
	});

	test("ignores port and casing", () => {
		expect(resolveTenant("helge.localhost:4321")).toBe("helge");
		expect(resolveTenant("FREJ.nilsfrank.se")).toBe("frej");
	});

	test("returns undefined for unknown or bare hosts", () => {
		expect(resolveTenant("nilsfrank.se")).toBeUndefined();
		expect(resolveTenant("localhost:4321")).toBeUndefined();
		expect(resolveTenant("olle.nilsfrank.se")).toBeUndefined();
		expect(resolveTenant("")).toBeUndefined();
	});
});

describe("isTenantPath", () => {
	test("detects paths that address a tenant directory directly", () => {
		expect(isTenantPath("/frej")).toBe(true);
		expect(isTenantPath("/helge/slot/1")).toBe(true);
		expect(isTenantPath("/Frej/slot/1")).toBe(true);
	});

	test("does not match unrelated paths", () => {
		expect(isTenantPath("/")).toBe(false);
		expect(isTenantPath("/frejs-page")).toBe(false);
		expect(isTenantPath("/slot/frej")).toBe(false);
	});
});
