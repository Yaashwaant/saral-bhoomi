import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import { getCloudinary, uploadFromUrl, buildUrl } from './services/cloudinaryService.js';

async function main() {
  try {
    const c = getCloudinary();
    // Quick sanity log
    const cfg = c.config();
    console.log('Cloudinary config cloud_name:', cfg.cloud_name ? 'set' : 'missing');

    const uploadRes = await uploadFromUrl('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
      public_id: 'saral_bhoomi/tests/shoes',
      overwrite: true,
    });
    console.log('Upload result public_id:', uploadRes.public_id);
    console.log('Secure URL:', uploadRes.secure_url);

    const optimized = buildUrl(uploadRes.public_id, { fetch_format: 'auto', quality: 'auto' });
    const square = buildUrl(uploadRes.public_id, { crop: 'auto', gravity: 'auto', width: 500, height: 500 });

    console.log('Optimized URL:', optimized);
    console.log('Auto-crop URL:', square);
  } catch (e) {
    console.error('Cloudinary test failed:', e && (e.stack || e.message || e));
    process.exit(1);
  }
}

main();


