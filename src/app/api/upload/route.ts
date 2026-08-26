import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToHosting } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const filename = (formData.get("filename") as string | null) || undefined;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image file is too large (max 10MB)" }, { status: 400 });
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const customName =
      filename || `avatar-user-${session.user.id}-${Date.now()}`;

    const result = await uploadImageToHosting(file, customName);

    return NextResponse.json({
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      filename: result.filename,
    });
  } catch (error: any) {
    console.error("Image upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
