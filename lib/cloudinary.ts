import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResponse {
  success: boolean;
  url?: string;
  secure_url?: string;
  public_id?: string;
  error?: any;
}

export const uploadImage = async (fileBase64: string, folder: string): Promise<UploadResponse> => {
  try {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: folder,
      transformation: [{ quality: "auto", fetch_format: "auto" }]
    });

    return {
      success: true,
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error };
  }
};

export const deleteImage = async (publicId: string): Promise<UploadResponse> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, public_id: result.public_id };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error };
  }
};
