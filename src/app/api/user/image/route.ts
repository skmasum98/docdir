import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await req.json();
    const userId = Number(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl || null },
    });

    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (doctor) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { profilePhoto: imageUrl || null },
      });
      revalidatePath(`/doctor/${doctor.slug}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/");

    return NextResponse.json({ success: true, image: imageUrl });
  } catch (error: any) {
    console.error("User image update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile image" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (doctor) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { profilePhoto: null },
      });
      revalidatePath(`/doctor/${doctor.slug}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User image removal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove profile image" },
      { status: 500 }
    );
  }
}
