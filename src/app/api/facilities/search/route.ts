import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FacilityType } from "@/lib/enums";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const typeParam = searchParams.get("type");
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);

    const validTypes = Object.values(FacilityType);
    const typeFilter =
      typeParam && validTypes.includes(typeParam as FacilityType)
        ? (typeParam as FacilityType)
        : undefined;

    const whereClause: any = {};

    if (typeFilter) {
      whereClause.type = typeFilter;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { phone: { contains: q } },
        { upazila: { name: { contains: q } } },
        { upazila: { district: { name: { contains: q } } } },
      ];
    }

    const facilities = await prisma.facility.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        upazila: {
          include: {
            district: {
              include: {
                division: true,
              },
            },
          },
        },
      },
    });

    const formatted = facilities.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      type: f.type,
      address: f.address,
      phone: f.phone,
      location: [
        f.upazila?.name,
        f.upazila?.district?.name,
        f.upazila?.district?.division?.name,
      ]
        .filter(Boolean)
        .join(", "),
      upazilaName: f.upazila?.name,
      districtName: f.upazila?.district?.name,
      divisionName: f.upazila?.district?.division?.name,
    }));

    return NextResponse.json({ success: true, facilities: formatted });
  } catch (error) {
    console.error("Facility search error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search facilities", facilities: [] },
      { status: 500 }
    );
  }
}
