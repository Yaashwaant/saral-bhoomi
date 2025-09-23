import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

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

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadFileBuffer(fileBuffer, options = {}) {
  try {
    const c = getCloudinary();
    
    // Convert buffer to stream
    const stream = Readable.from(fileBuffer);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = c.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: options.folder || 'saral-bhoomi',
          public_id: options.public_id,
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
}

/**
 * Upload file from multer file object to Cloudinary
 * @param {Object} file - Multer file object
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result with additional metadata
 */
export async function uploadMulterFile(file, options = {}) {
  try {
    const c = getCloudinary();
    
    // Generate unique public ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const publicId = options.public_id || `saral-bhoomi/${options.folder || 'workflow'}/${timestamp}-${randomSuffix}`;
    
    // Upload file buffer
    const result = await uploadFileBuffer(file.buffer, {
      folder: options.folder || 'saral-bhoomi/workflow',
      public_id: publicId,
      ...options
    });
    
    // Return enhanced result with file metadata
    return {
      ...result,
      original_filename: file.originalname,
      file_size: file.size,
      mimetype: file.mimetype,
      upload_timestamp: new Date().toISOString(),
      cloudinary_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary multer file upload error:', error);
    throw new Error(`Failed to upload multer file to Cloudinary: ${error.message}`);
  }
}

/**
 * Generate hash from Cloudinary URL for blockchain
 * @param {string} cloudinaryUrl - Cloudinary URL
 * @param {string} additionalData - Additional data to include in hash
 * @returns {string} SHA-256 hash
 */
export async function generateHashFromCloudinaryUrl(cloudinaryUrl, additionalData = '') {
  try {
    const crypto = await import('crypto');
    const dataToHash = `${cloudinaryUrl}${additionalData}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  } catch (error) {
    console.error('Hash generation error:', error);
    throw new Error(`Failed to generate hash: ${error.message}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId) {
  try {
    const c = getCloudinary();
    const result = await c.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
}

export function buildUrl(publicId, options = {}) {
  const c = getCloudinary();
  return c.url(publicId, options);
}

export default {
  getCloudinary,
  uploadFromUrl,
  uploadFromDataUri,
  uploadFileBuffer,
  uploadMulterFile,
  generateHashFromCloudinaryUrl,
  deleteFromCloudinary,
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


