'use strict';

const { createHmac, timingSafeEqual } = require('node:crypto');

/** How far a delivery's timestamp may be from now, as Standard Webhooks recommends. */
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verify a Standard Webhooks signature: `v1,` and the base64 HMAC-SHA256 of
 * `id.timestamp.body`, keyed with the secret after its `whsec_` prefix. The
 * header can carry several space-separated signatures; one match is enough.
 *
 * @param {string} secret
 * @param {{ id?: string, timestamp?: string, signature?: string, body: string | Buffer }} request
 * @param {number} [nowSeconds]
 */
function verifySignature(secret, request, nowSeconds = Math.floor(Date.now() / 1000)) {
	const { id, timestamp, signature, body } = request;
	if (!id || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
	if (Math.abs(nowSeconds - Number(timestamp)) > TIMESTAMP_TOLERANCE_SECONDS) return false;

	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
	const expected = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(body).digest();

	return signature.split(' ').some((candidate) => {
		const [version, value] = candidate.split(',', 2);
		if (version !== 'v1' || !value) return false;
		const received = Buffer.from(value, 'base64');
		return received.length === expected.length && timingSafeEqual(received, expected);
	});
}

module.exports = { verifySignature, TIMESTAMP_TOLERANCE_SECONDS };
