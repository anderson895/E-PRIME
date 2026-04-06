// Cloudinary configuration for client-side uploads
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "eprime_rhu_uploads",
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "your-api-key",
  folder: "eprime-rhu",
};

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

/**
 * Upload a file to Cloudinary using unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File,
  subfolder?: string
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  formData.append(
    "folder",
    subfolder
      ? `${CLOUDINARY_CONFIG.folder}/${subfolder}`
      : CLOUDINARY_CONFIG.folder
  );

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Generate a Cloudinary thumbnail URL
 */
export function getCloudinaryThumbnail(
  url: string,
  width = 150,
  height = 150
): string {
  if (!url || !url.includes("cloudinary")) return url;
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,g_face/`);
}
