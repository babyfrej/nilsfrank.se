import { type JWTPayload, type JWTVerifyGetKey, jwtVerify } from "jose";

/** What a token must match to count as the Organizer's: the team's keys, issuer and app. */
export type AccessExpectation = {
	/** The team's JWKS, e.g. `createRemoteJWKSet(https://<team>/cdn-cgi/access/certs)`. */
	jwks: JWTVerifyGetKey;
	/** `https://<team>.cloudflareaccess.com`. */
	issuer: string;
	/** The Access application's AUD tag. */
	audience: string;
};

/**
 * Verifies the `Cf-Access-Jwt-Assertion` token Cloudflare Access adds to requests
 * that passed its policy, so the Worker never trusts the edge alone (spec #1).
 * Resolves to the claims when the signature, issuer, audience and expiry all
 * check out, and to `undefined` for anything else, including no token at all.
 */
export async function verifyAccessJwt(
	token: string | undefined,
	{ jwks, issuer, audience }: AccessExpectation,
): Promise<JWTPayload | undefined> {
	if (!token) return undefined;
	try {
		const { payload } = await jwtVerify(token, jwks, { issuer, audience });
		return payload;
	} catch {
		return undefined;
	}
}
