import { ActionForm } from "@/components/ui/ActionForm";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { joinGroupAction, joinOrCreateGroupAction, leaveGroupAction } from "@/lib/groupActions";
import type { Group } from "@/lib/groups";

interface GroupActionsProps {
  group: Group;
  isMember: boolean;
}

export function GroupActions({ group, isMember }: GroupActionsProps) {
  const canLeave = ["open", "full", "bidding"].includes(group.status);

  if (isMember) {
    return (
      <div>
        <p className="text-sm font-semibold text-success-600">You are in this group.</p>
        {canLeave ? (
          <ActionForm action={leaveGroupAction} className="mt-3">
            <input type="hidden" name="groupId" value={group.id} />
            <button type="submit" className={buttonClasses("secondary")}>
              Leave group
            </button>
          </ActionForm>
        ) : null}
      </div>
    );
  }

  if (group.status === "open") {
    return (
      <ActionForm action={joinGroupAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="groupId" value={group.id} />
        <div>
          <label htmlFor="commitment" className="mb-1 block text-xs font-semibold text-ink-500">
            Your commitment
          </label>
          <select
            id="commitment"
            name="commitment"
            className="rounded-lg border border-line bg-card px-3 py-2.5 text-sm"
          >
            <option value="interested">Interested (free, leave any time)</option>
            <option value="committed">Committed (serious buyer)</option>
          </select>
        </div>
        <button type="submit" className={buttonClasses("primary")}>
          Join group
        </button>
      </ActionForm>
    );
  }

  if (group.status === "full") {
    return (
      <ActionForm action={joinOrCreateGroupAction}>
        <input type="hidden" name="variantId" value={group.variant.id} />
        <input type="hidden" name="commitment" value="interested" />
        <p className="mb-3 text-sm text-ink-500">
          This group is full. We can put you in a new one.
        </p>
        <button type="submit" className={buttonClasses("primary")}>
          Join the new group
        </button>
      </ActionForm>
    );
  }

  const messages: Record<string, string> = {
    bidding: "Joining is closed. Sellers are preparing their offers.",
    locked: "The group is locked. Offers to choose from arrive in a later phase.",
    completed: "This group has finished.",
    cancelled: "This group was cancelled because it did not reach its minimum.",
    expired_no_offers: "This group closed without any seller offers.",
  };
  return <p className="text-sm text-ink-500">{messages[group.status]}</p>;
}
