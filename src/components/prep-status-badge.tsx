import { StatusPill } from "@/components/status-pill";
import { isResubmitted, PREP_STATUS_LABELS } from "@/lib/prep";
import type { PrepRecord } from "@/lib/types";

export function ResubmittedTag() {
  return (
    <span
      title="The customer uploaded new files after a correction request"
      className="inline-flex rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-semibold text-[#0369a1]"
    >
      Resubmitted
    </span>
  );
}

export function PrepStatusBadge({ request }: { request: Pick<PrepRecord, "status" | "adminNote"> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <StatusPill
        value={request.status}
        label={PREP_STATUS_LABELS[request.status] ?? request.status}
      />
      {isResubmitted(request) ? <ResubmittedTag /> : null}
    </span>
  );
}
