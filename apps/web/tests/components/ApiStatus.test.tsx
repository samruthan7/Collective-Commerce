import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiStatus } from "@/components/domain/ApiStatus";

function okResponse() {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        status: "ok",
        service: "cc-api",
        environment: "development",
        uptimeSeconds: 12,
        timestamp: new Date().toISOString(),
      }),
  };
}

function renderStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApiStatus />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiStatus", () => {
  it("shows a loading state, then that the API is online", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    renderStatus();

    expect(screen.getByText(/checking api connection/i)).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(screen.getByText(/Environment: development/)).toBeInTheDocument();
  });

  it("shows an error with a working retry button when the API is unreachable", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);
    renderStatus();

    expect(await screen.findByText("Cannot reach the API")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});