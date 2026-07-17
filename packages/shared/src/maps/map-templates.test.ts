import { describe, expect, test } from "bun:test";
import { getChatRoomAtPosition } from "./map-templates";

describe("map chat rooms", () => {
  test("finds the classic-office Summit Room", () => {
    expect(getChatRoomAtPosition("classic-office", { x: 15, y: 14 })?.id).toBe("summit-room");
  });

  test("returns no room in the classic-office spawn hallway", () => {
    expect(getChatRoomAtPosition("classic-office", { x: 19, y: 27 })).toBeNull();
  });

  test("finds the campus Sequoia Suite", () => {
    expect(getChatRoomAtPosition("coworking-campus", { x: 8, y: 12 })?.id).toBe("sequoia-suite");
  });

  test("does not include the tile immediately outside a room", () => {
    expect(getChatRoomAtPosition("classic-office", { x: 20, y: 14 })?.id).not.toBe("summit-room");
  });
});
