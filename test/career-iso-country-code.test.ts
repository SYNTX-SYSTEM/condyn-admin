import { describe, expect, it } from "vitest";
import { IsoCountryCodeSchema } from "../lib/career/schema";

describe("IsoCountryCodeSchema canonical country-code contract", () => {
  it.each(["DE", "US", "CH"])("accepts canonical ISO-3166-1 alpha-2 code %s", (countryIso) => {
    expect(IsoCountryCodeSchema.safeParse(countryIso).success).toBe(true);
  });

  it.each(["Germany", "DEU", "de"])("rejects non-canonical country_iso value %s", (countryIso) => {
    expect(IsoCountryCodeSchema.safeParse(countryIso).success).toBe(false);
  });
});
