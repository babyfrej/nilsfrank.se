import { describe, expect, test } from "bun:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAccessJwt } from "./access";

const issuer = "https://team.cloudflareaccess.com";
const audience = "app-aud";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwks = createLocalJWKSet({
	keys: [{ ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" }],
});
const expected = { jwks, issuer, audience };

/** A token as Cloudflare Access would mint it, with any claim overridable. */
const sign = (claims: { iss?: string; aud?: string; exp?: string } = {}) =>
	new SignJWT({ email: "organizer@example.com" })
		.setProtectedHeader({ alg: "RS256", kid: "k1" })
		.setIssuer(claims.iss ?? issuer)
		.setAudience(claims.aud ?? audience)
		.setIssuedAt()
		.setExpirationTime(claims.exp ?? "1h")
		.sign(privateKey);

describe("verifyAccessJwt", () => {
	test("returns the claims of a token signed by the team's key", async () => {
		const claims = await verifyAccessJwt(await sign(), expected);
		expect(claims).toMatchObject({ email: "organizer@example.com" });
	});

	test("rejects a missing token", async () => {
		expect(await verifyAccessJwt(undefined, expected)).toBeUndefined();
		expect(await verifyAccessJwt("", expected)).toBeUndefined();
	});

	test("rejects a token for another audience", async () => {
		const token = await sign({ aud: "other-app" });
		expect(await verifyAccessJwt(token, expected)).toBeUndefined();
	});

	test("rejects a token from another issuer", async () => {
		const token = await sign({ iss: "https://other.cloudflareaccess.com" });
		expect(await verifyAccessJwt(token, expected)).toBeUndefined();
	});

	test("rejects an expired token", async () => {
		const token = await sign({ exp: "-1h" });
		expect(await verifyAccessJwt(token, expected)).toBeUndefined();
	});

	test("rejects a token signed by an unknown key", async () => {
		const { privateKey: strangersKey } = await generateKeyPair("RS256");
		const token = await new SignJWT({})
			.setProtectedHeader({ alg: "RS256", kid: "k1" })
			.setIssuer(issuer)
			.setAudience(audience)
			.setExpirationTime("1h")
			.sign(strangersKey);
		expect(await verifyAccessJwt(token, expected)).toBeUndefined();
	});

	test("rejects garbage", async () => {
		expect(await verifyAccessJwt("not.a.jwt", expected)).toBeUndefined();
	});
});
