import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { BulkImportService, type BulkDoctorRow, type BulkImportOptions } from "@/lib/bulk-import-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const rows: BulkDoctorRow[] = body.rows || [];
    const options: BulkImportOptions = body.options || {
      duplicateAction: "skip",
      defaultStatus: "PUBLISHED",
      defaultVerified: false,
      createMissingSpecialties: true,
      createMissingFacilities: true,
      createMissingLocations: true,
    };
    const startRowIndex = Number(body.startRowIndex) || 1;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided in payload" },
        { status: 400 }
      );
    }

    // Process chunk
    const result = await BulkImportService.importBatch(rows, options, startRowIndex);

    // Refresh cached pages touched by this chunk so new/updated doctors
    // appear immediately (instead of waiting for hourly ISR).
    if (result.inserted + result.updated > 0) {
      revalidatePath("/");
      revalidatePath("/search");
      for (const slug of result.affectedSpecialtySlugs.slice(0, 50)) {
        revalidatePath(`/specialty/${slug}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Bulk import API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process bulk import chunk",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
