import { getCurrentPartner } from "@/lib/auth/dal";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerTopbar } from "@/components/partner/PartnerTopbar";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const partner = await getCurrentPartner();

  return (
    <div className="flex min-h-screen bg-background">
      <PartnerSidebar />
      <div className="flex flex-1 flex-col">
        <PartnerTopbar partner={partner} />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
