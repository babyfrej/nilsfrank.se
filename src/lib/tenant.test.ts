import { describe, expect, test } from "bun:test";
import { isActionPath, isInternalTenantPath, resolveTenant } from "./tenant";

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

describe("isInternalTenantPath", () => {
	test("detects paths into the internal tenant tree", () => {
		expect(isInternalTenantPath("/tenants")).toBe(true);
		expect(isInternalTenantPath("/tenants/helge/slot/1")).toBe(true);
		expect(isInternalTenantPath("/Tenants/frej")).toBe(true);
	});

	test("allows tenant names as ordinary public paths", () => {
		expect(isInternalTenantPath("/")).toBe(false);
		expect(isInternalTenantPath("/helge")).toBe(false);
		expect(isInternalTenantPath("/tenants-list")).toBe(false);
		expect(isInternalTenantPath("/slot/tenants")).toBe(false);
	});
});

describe("isActionPath", () => {
	test("detects Astro's action endpoint so form POSTs bypass the tenant rewrite", () => {
		expect(isActionPath("/_actions/rsvp.submit")).toBe(true);
		expect(isActionPath("/_actions/rsvp.submit/")).toBe(true);
	});

	test("leaves ordinary paths alone", () => {
		expect(isActionPath("/")).toBe(false);
		expect(isActionPath("/kalas")).toBe(false);
		expect(isActionPath("/_actions")).toBe(false);
		expect(isActionPath("/kalas/_actions/x")).toBe(false);
	});
});
