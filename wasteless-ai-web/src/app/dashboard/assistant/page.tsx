import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import AiAssistantChat from "@/features/assistant/components/AiAssistantChat";
import { getAssistantPageData } from "@/features/assistant/services/assistant.service";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const user = await requireUser();
  let summary;

  try {
    summary = await getAssistantPageData(user);
  } catch {
    return <ErrorState title="AI assistant data is unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI assistant"
        description="Chat with WasteLessAI about today's meals, expiring ingredients, shopping needs, and waste-aware household choices."
      />
      <AiAssistantChat initialContextSummary={summary} />
    </div>
  );
}
