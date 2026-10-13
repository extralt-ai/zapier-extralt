'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { verifySignature } = require('../lib/signature');
// The reference vector from the Standard Webhooks specification, which Extralt signs with.
const vector = require('./standard-webhooks-vector.json');

const request = (overrides = {}) => ({
	id: vector.id,
	timestamp: String(vector.timestamp),
	signature: vector.signature,
	body: vector.body,
	...overrides,
});

describe('verifySignature', () => {
	it('accepts the Standard Webhooks reference signature', () => {
		assert.equal(verifySignature(vector.secret, request(), vector.timestamp), true);
	});

	it('accepts a header listing the valid signature among others', () => {
		const signature = `v1,bm90IHRoZSBzaWduYXR1cmU= v2,ignored ${vector.signature}`;
		assert.equal(verifySignature(vector.secret, request({ signature }), vector.timestamp), true);
	});

	it('rejects a changed body, id or secret', () => {
		assert.equal(
			verifySignature(vector.secret, request({ body: '{"test": 1}' }), vector.timestamp),
			false,
		);
		assert.equal(
			verifySignature(vector.secret, request({ id: 'msg_other' }), vector.timestamp),
			false,
		);
		assert.equal(
			verifySignature('whsec_dGhpcyBpcyBhbm90aGVyIHNlY3JldA==', request(), vector.timestamp),
			false,
		);
	});

	it('rejects timestamps more than five minutes away', () => {
		assert.equal(verifySignature(vector.secret, request(), vector.timestamp + 5 * 60), true);
		assert.equal(verifySignature(vector.secret, request(), vector.timestamp + 5 * 60 + 1), false);
		assert.equal(verifySignature(vector.secret, request(), vector.timestamp - 5 * 60 - 1), false);
	});

	it('rejects missing or malformed headers', () => {
		for (const overrides of [
			{ id: undefined },
			{ timestamp: undefined },
			{ timestamp: '1614265330.5' },
			{ signature: undefined },
			{ signature: 'g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=' },
			{ signature: 'v1,' },
		]) {
			assert.equal(verifySignature(vector.secret, request(overrides), vector.timestamp), false);
		}
	});
});
