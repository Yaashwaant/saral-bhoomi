import crypto from 'crypto';

// Versioned hashing utilities for blockchain/data integrity

export const HASH_VERSION = 'v2';

// Keys that should not participate in business-data hashing
const NON_DETERMINISTIC_KEYS = new Set([
	'createdAt',
	'updatedAt',
	'__v',
	'timestamp',
	'id',
]);

/**
 * Produce a canonical, stable representation of arbitrary JSON-like data:
 * - Removes non-deterministic fields
 * - Normalizes ObjectId/Buffer/Date
 * - Recursively canonicalizes arrays and objects
 */
function canonicalizeInternal(data, seen) {
  if (data == null) return data;
  if (seen.has(data)) return undefined; // break cycles
  const isObj = typeof data === 'object';
  if (!isObj) return data;

  // Handle mongoose ObjectId
  if (data && data.constructor && data.constructor.name === 'ObjectId') {
    try { return data.toString(); } catch (_) { return String(data); }
  }

  // Handle Buffer
  if (Buffer.isBuffer(data)) return data.toString('hex');

  // Handle Date
  if (data instanceof Date) return data.toISOString();

  // 👉 Handle arrays (including Mongoose DocumentArray) EARLY to avoid triggering their overridden
  //    map/toJSON implementations which can recurse and blow the stack. We iterate by index only.
  if (Array.isArray(data)) {
    seen.add(data);
    const result = [];
    const len = Number.isInteger(data.length) ? data.length : 0;
    for (let i = 0; i < len; i++) {
      result.push(canonicalizeInternal(data[i], seen));
    }
    return result;
  }

  // If it looks like a mongoose document/array, convert to plain object/array first
  if (typeof data.toObject === 'function') {
    try { data = data.toObject({ depopulate: true, flattenMaps: true, getters: false, virtuals: false }); } catch (_) {}
  }
  if (typeof data.toJSON === 'function') {
    try { data = data.toJSON({ depopulate: true, flattenMaps: true, getters: false, virtuals: false }); } catch (_) {}
  }

  // Final safety: attempt deep plain clone to eliminate any prototype/DocumentArray hooks
  try {
    if (Array.isArray(data)) {
      // handled below
    } else if (data && data.constructor && data.constructor.name !== 'Object') {
      data = JSON.parse(JSON.stringify(data));
    }
  } catch (_) {}

  // Arrays (convert to plain first to avoid Mongoose DocumentArray methods)
  if (Array.isArray(data)) {
    // Handle arrays (including Mongoose DocumentArray) without calling array methods that Mongoose overrides
    seen.add(data);
    const result = [];
    const len = Number.isInteger(data.length) ? data.length : 0;
    for (let i = 0; i < len; i++) {
      result.push(canonicalizeInternal(data[i], seen));
    }
    return result;
  }

  // Objects
  const out = {};
  seen.add(data);
  for (const [key, value] of Object.entries(data)) {
    if (NON_DETERMINISTIC_KEYS.has(key)) continue;
    out[key] = canonicalizeInternal(value, seen);
  }
  return out;
}

export function canonicalize(data) {
  return canonicalizeInternal(data, new WeakSet());
}

/**
 * Deterministic JSON stringify with sorted keys at each nesting level
 */
export function stableStringify(obj) {
	if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);

	if (Array.isArray(obj)) {
		return '[' + obj.map((v) => stableStringify(v)).join(',') + ']';
	}

	const keys = Object.keys(obj).sort();
	const body = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',');
	return `{${body}}`;
}

/**
 * Create a SHA-256 hash of a value after canonicalization and stable stringify
 */
export function hashJsonStable(value, algo = 'sha256') {
	const canonical = canonicalize(value);
	const dataString = stableStringify(canonical);
	return crypto.createHash(algo).update(dataString).digest('hex');
}

/**
 * Legacy hashing for backward compatibility: plain JSON.stringify (unordered)
 */
export function legacyHash(value, algo = 'sha256') {
	const canonical = canonicalize(value);
	return crypto.createHash(algo).update(JSON.stringify(canonical)).digest('hex');
}

export default {
	HASH_VERSION,
	canonicalize,
	stableStringify,
	hashJsonStable,
	legacyHash,
};


