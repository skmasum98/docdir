export async function uploadImageToHosting(
  file: File | Blob | Buffer,
  customFilename?: string
): Promise<{ success: boolean; url: string; thumbnailUrl?: string; filename: string }> {
  const apiUrl =
    process.env.IMAGE_HOSTING_API_URL ||
    "https://pic.thewebpal.com/p/api/upload.php";
  const apiKey =
    process.env.IMAGE_HOSTING_API_KEY ||
    "3LRC_6_aQ9Ci_gAJAWkfardE77SwHhzfYW1k7HWVXjU";

  const formData = new FormData();

  if (Buffer.isBuffer(file)) {
    const uint8 = new Uint8Array(file);
    const blob = new Blob([uint8]);
    formData.append("image", blob, customFilename || "image.jpg");
  } else if (file instanceof Blob && !(file instanceof File)) {
    formData.append("image", file, customFilename || "image.jpg");
  } else {
    formData.append("image", file);
  }

  if (customFilename) {
    // Sanitized alphanumeric filename
    const cleanName = customFilename.replace(/[^a-zA-Z0-9_-]/g, "-");
    formData.append("filename", cleanName);
  } else {
    formData.append("filename", `user-avatar-${Date.now()}`);
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.message || "Failed to upload image to hosting server.");
  }

  return {
    success: true,
    url: data.url,
    thumbnailUrl: data.thumbnail_url || data.url,
    filename: data.filename,
  };
}
