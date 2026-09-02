import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ division: string; district: string }>;
};

export default async function DivisionDistrictPage({ params }: Props) {
  const { division, district } = await params;

  const districtRecord = await prisma.district.findFirst({
    where: {
      slug: district,
      division: { slug: division },
    },
    select: { slug: true },
  });

  if (!districtRecord) {
    notFound();
  }

  redirect(`/search?division=${division}&district=${districtRecord.slug}`);
}
