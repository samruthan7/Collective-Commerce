import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupProgress } from "@/components/domain/GroupProgress";

describe("GroupProgress", () => {
  it("shows how many more buyers are needed", () => {
    render(<GroupProgress memberCount={3} minMembers={10} maxMembers={50} />);
    expect(screen.getByText("3 joined")).toBeInTheDocument();
    expect(screen.getByText(/7 more buyers needed/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });
  it("says the minimum is reached", () => {
    render(<GroupProgress memberCount={12} minMembers={10} maxMembers={50} />);
    expect(screen.getByText(/Minimum reached/)).toBeInTheDocument();
  });
});
