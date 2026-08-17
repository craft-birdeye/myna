import { describe, expect, it } from "vitest";
import { reorderColumnIds } from "./columnSettingsReorder";

describe("reorderColumnIds", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves earlier item down (before later slot)", () => {
    expect(reorderColumnIds(ids, 0, 2)).toEqual(["b", "a", "c", "d"]);
  });

  it("moves later item up (before earlier slot)", () => {
    expect(reorderColumnIds(ids, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("no-op when slot equals from", () => {
    expect(reorderColumnIds(ids, 1, 1)).toEqual(ids);
  });

  it("no-op when slot is immediately after from (same visual position)", () => {
    expect(reorderColumnIds(ids, 1, 2)).toEqual(ids);
  });

  it("moves to start (slot 0)", () => {
    expect(reorderColumnIds(ids, 2, 0)).toEqual(["c", "a", "b", "d"]);
  });

  it("moves to end (slot length)", () => {
    expect(reorderColumnIds(ids, 1, 4)).toEqual(["a", "c", "d", "b"]);
  });
});
