import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ division: string; district: string; upazila: string }>;
};

export default async function DivisionDistrictUpazilaPage({ params }: Props) {
  const { division, district, upazila } = await params;

  const upazilaRecord = await prisma.upazila.findFirst({
    where: {
      slug: upazila,
      district: {
        slug: district,
        division: { slug: division },
      },
    },
    select: { slug: true },
  });

  if (!upazilaRecord) {
    notFound();
  }

  redirect(
    `/search?division=${division}&district=${district}&upazila=${upazilaRecord.slug}`
  );
}
