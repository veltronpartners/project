import { addToContacts, logInDecisionLog } from "@/app/(portal)/intake/actions";
import { Button } from "@/components/ui/button";

export function StageSixActions({ engagementId }: { engagementId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={addToContacts.bind(null, engagementId)}>
        <Button type="submit" variant="outline">
          Add to Contacts Directory
        </Button>
      </form>
      <form action={logInDecisionLog.bind(null, engagementId)}>
        <Button type="submit" variant="outline">
          Log in Decision Log
        </Button>
      </form>
    </div>
  );
}
