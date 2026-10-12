import { describe, expect, it } from "vitest";
import { isSchoolEmail, isValidStudentId, validateListing } from "./validation";

describe("isValidStudentId", () => {
  it("accepts 7-digit IDs", () => {
    expect(isValidStudentId("6603282")).toBe(true);
    expect(isValidStudentId("6403731")).toBe(true);
    expect(isValidStudentId(" 6603282 ")).toBe(true);
  });
  it("rejects other shapes", () => {
    for (const bad of ["", "660328", "66032822", "66O3282", "abcdefg", "6603-282", "5603282", "0603282"]) {
      expect(isValidStudentId(bad)).toBe(false);
    }
  });
});

describe("isSchoolEmail", () => {
  it("matches the school domain only", () => {
    expect(isSchoolEmail("a.b@rsu.ac.th")).toBe(true);
    expect(isSchoolEmail("A.B@RSU.AC.TH")).toBe(true);
    expect(isSchoolEmail("a@gmail.com")).toBe(false);
    expect(isSchoolEmail("a@evil-rsu.ac.th")).toBe(false);
    expect(isSchoolEmail("a@rsu.ac.th.evil.com")).toBe(false);
  });
});

describe("validateListing", () => {
  it("enforces price and image limits", () => {
    expect(validateListing({ price: 500, imageCount: 3 })).toBeNull();
    expect(validateListing({ price: 0, imageCount: 3 })).toMatch(/Price/);
    expect(validateListing({ price: 100_001, imageCount: 3 })).toMatch(/Price/);
    expect(validateListing({ price: NaN, imageCount: 3 })).toMatch(/Price/);
    expect(validateListing({ price: 500, imageCount: 0 })).toMatch(/images/);
    expect(validateListing({ price: 500, imageCount: 9 })).toMatch(/images/);
  });
});
