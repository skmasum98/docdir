import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ division: string }>;
};

export default async function DivisionPage({ params }: Props) {
  const { division } = await params;

  const divisionRecord = await prisma.division.findUnique({
    where: { slug: division },
    select: { slug: true },
  });

  if (!divisionRecord) {
    notFound();
  }

  redirect(`/search?division=${divisionRecord.slug}`);
}
