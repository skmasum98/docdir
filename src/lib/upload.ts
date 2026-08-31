export async function uploadImageToHosting(
  file: File | Blob | Buffer,
  customFilename?: string
): Promise<{
  success: boolean;
  url: string;
  thumbnailUrl?: string;
  filename: string;
}> {
  const apiUrl = process.env.IMAGE_HOSTING_API_URL;
  const apiKey = process.env.IMAGE_HOSTING_API_KEY;

  if (!apiUrl) {
    throw new Error("Missing required environment variable: IMAGE_HOSTING_API_URL");
  }

  if (!apiKey) {
    throw new Error("Missing required environment variable: IMAGE_HOSTING_API_KEY");
  }

  const formData = new FormData();

  if (Buffer.isBuffer(file)) {
    const uint8 = new Uint8Array(file);
    const blob = new Blob([uint8]);

    formData.append(
      "image",
      blob,
      customFilename || "image.jpg"
    );
  } else if (file instanceof Blob && !(file instanceof File)) {
    formData.append(
      "image",
      file,
      customFilename || "image.jpg"
    );
  } else {
    formData.append("image", file);
  }

  if (customFilename) {
    const cleanName = customFilename
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    formData.append("filename", cleanName || `user-avatar-${Date.now()}`);
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

    throw new Error(
      `Upload API returned ${res.status}: ${errText}`
    );
  }

  const data = await res.json();

  if (!data.success || !data.url) {
    throw new Error(
      data.message || "Failed to upload image to hosting server."
    );
  }

  return {
    success: true,
    url: data.url,
    thumbnailUrl: data.thumbnail_url || data.url,
    filename: data.filename,
  };
}