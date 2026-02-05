const ImageKitSDK = require('@imagekit/nodejs');
const ImageKit = ImageKitSDK.default || ImageKitSDK;

/**
 * ImageKit Service
 * Handles image upload and deletion using ImageKit SDK
 * The image URLs returned are stored in MongoDB
 */

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload image to ImageKit from buffer
 * @param {Buffer} buffer - Image buffer from multer memory storage
 * @param {string} fileName - Original filename
 * @returns {Promise<string>} - Image URL to store in MongoDB
 */
const uploadImage = async (buffer, fileName = 'image.jpg') => {
  try {
    // Check if ImageKit is configured
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      console.warn('⚠️ ImageKit not configured. Using base64 fallback.');
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    console.log('📤 Uploading to ImageKit:', fileName);
    
    const result = await imagekit.files.upload({
      file: buffer.toString('base64'),
      fileName: fileName,
      folder: '/campusxchange',
      useUniqueFileName: true
    });

    console.log('✅ ImageKit upload successful:', result.url);
    
    // Return the URL that will be stored in MongoDB
    return result.url;
  } catch (error) {
    console.error('❌ ImageKit Upload Error:', error.message);
    console.error('Full error:', error);
    
    // Fallback: return base64 data URL
    console.warn('⚠️ Falling back to base64 data URL');
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }
};

/**
 * Delete image from ImageKit
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<Object>} - { success, error? }
 */
const deleteImage = async (fileId) => {
  try {
    await imagekit.files.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    console.error('ImageKit Delete Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload multiple images from buffers
 * @param {Array<Object>} files - Array of file objects with buffer property
 * @returns {Promise<Array<string>>} - Array of image URLs
 */
const uploadMultipleImages = async (files) => {
  const uploadPromises = files.map(file => uploadImage(file.buffer, file.originalname));
  return Promise.all(uploadPromises);
};

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  imagekit
};
