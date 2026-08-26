import { requireAdmin } from "@/lib/auth-helpers";
import { DoctorBulkImporterView } from "./import-view";

export const metadata = {
  title: "Bulk Doctor Ingestion | Admin Directory",
};

export default async function AdminDoctorBulkImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <DoctorBulkImporterView />
    </div>
  );
}
