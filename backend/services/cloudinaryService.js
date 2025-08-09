import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

function configureIfNeeded() {
  if (isConfigured) return;
  const raw = process.env;
  const CLOUDINARY_URL = (raw.CLOUDINARY_URL || '').trim();
  const CLOUDINARY_CLOUD_NAME = (raw.CLOUDINARY_CLOUD_NAME || '').trim();
  const CLOUDINARY_API_KEY = (raw.CLOUDINARY_API_KEY || '').trim();
  const CLOUDINARY_API_SECRET = (raw.CLOUDINARY_API_SECRET || '').trim();

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    isConfigured = true;
    try {
      const maskedKey = `${String(CLOUDINARY_API_KEY).slice(0, 4)}***${String(CLOUDINARY_API_KEY).slice(-2)}`;
      console.log(`☁️  Cloudinary configured via discrete vars (cloud_name=${CLOUDINARY_CLOUD_NAME}, api_key=${maskedKey})`);
    } catch {}
    return;
  }

  if (CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: CLOUDINARY_URL });
    isConfigured = true;
    try {
      const cfg = cloudinary.config() || {};
      console.log(`☁️  Cloudinary configured via CLOUDINARY_URL (cloud_name=${cfg.cloud_name || 'unknown'})`);
    } catch {}
  }
}

export function getCloudinary() {
  configureIfNeeded();
  return cloudinary;
}

export async function uploadFromUrl(remoteUrl, options = {}) {
  const c = getCloudinary();
  return await c.uploader.upload(remoteUrl, {
    resource_type: 'auto',
    ...options,
  });
}

export async function uploadFromDataUri(dataUri, options = {}) {
  const c = getCloudinary();
  return await c.uploader.upload(dataUri, {
    resource_type: 'auto',
    ...options,
  });
}

export function buildUrl(publicId, options = {}) {
  const c = getCloudinary();
  return c.url(publicId, options);
}

export default {
  getCloudinary,
  uploadFromUrl,
  uploadFromDataUri,
  buildUrl,
};

export async function checkConnection() {
  try {
    configureIfNeeded();
    const res = await cloudinary.api.ping();
    return !!res && (res.status === 'ok' || res.status === 200 || res.ok === true);
  } catch (e) {
    return false;
  }
}

export async function initializeCloudinary() {
  try {
    configureIfNeeded();
    if (!isConfigured) {
      console.log('ℹ️ Cloudinary not configured (set CLOUDINARY_URL or discrete vars). Skipping.');
      return false;
    }
    const ok = await checkConnection();
    if (ok) {
      const cfg = cloudinary.config() || {};
      console.log(`✅ Cloudinary connection OK (cloud_name=${cfg.cloud_name || 'unknown'})`);
    } else {
      console.warn('⚠️ Cloudinary ping failed. Check credentials/network.');
    }
    return ok;
  } catch (e) {
    console.warn('⚠️ Cloudinary initialization error:', e && (e.message || e));
    return false;
  }
}


