import { describe, expect, it } from "vitest";
import { fulfilmentLabel, stepIndex } from "../../src/lib/orderStatus";

describe("order status", () => {
  it("orders the steps confirmed, shipped, delivered", () => {
    expect(stepIndex("confirmed")).toBe(0);
    expect(stepIndex("shipped")).toBe(1);
    expect(stepIndex("delivered")).toBe(2);
  });

  it("gives readable labels", () => {
    expect(fulfilmentLabel("shipped")).toBe("Shipped");
  });
});
