'use strict';

const { randomUUID } = require('node:crypto');

/**
 * The Extralt API this version talks to. A private version can point at
 * another API with `zapier env:set <version> EXTRALT_API_URL=…`.
 */
const apiUrl = () => (process.env.EXTRALT_API_URL || 'https://api.extralt.com').replace(/\/+$/, '');

/** Every request carries the connection's API key. */
const addApiKey = (request, z, bundle) => {
	if (bundle.authData && bundle.authData.api_key) {
		request.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
	}
	return request;
};

/**
 * Turn an API error into a Zapier error that shows the API's message and
 * request id. A 401 asks the user to reconnect the account.
 */
const handleErrors = (response, z) => {
	if (response.status < 400 || response.skipThrowForStatus) return response;

	let error;
	try {
		error = JSON.parse(response.content).error;
	} catch {
		error = undefined;
	}
	const message =
		error && error.message ? error.message : `Extralt API returned HTTP ${response.status}`;
	const detail =
		error && error.request_id ? `${message} (request ID: ${error.request_id})` : message;

	if (response.status === 401) throw new z.errors.ExpiredAuthError(detail);
	if (response.status === 429) {
		const retryAfter = Number(response.getHeader('retry-after'));
		throw new z.errors.ThrottledError(detail, Number.isFinite(retryAfter) ? retryAfter : undefined);
	}
	throw new z.errors.Error(detail, error && error.code, response.status);
};

/** A header for a POST the API deduplicates. Each Zap step run is a new request. */
const idempotencyKey = () => ({ 'Idempotency-Key': randomUUID() });

/** Whether the user filled in an optional field; Zapier may send an empty one as `''`. */
const filled = (value) => value !== undefined && value !== null && value !== '';

module.exports = { apiUrl, addApiKey, handleErrors, idempotencyKey, filled };
