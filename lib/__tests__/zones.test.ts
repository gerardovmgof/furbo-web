import { describe, it, expect } from "vitest";
import { getZone, suggestPlayoffTeams } from "@/lib/zones";

describe("suggestPlayoffTeams", () => {
  it("sugiere 16 con 16+ equipos", () => {
    expect(suggestPlayoffTeams(16)).toBe(16);
    expect(suggestPlayoffTeams(20)).toBe(16);
  });

  it("sugiere 8 con 8-15 equipos", () => {
    expect(suggestPlayoffTeams(8)).toBe(8);
    expect(suggestPlayoffTeams(15)).toBe(8);
  });

  it("sugiere 4 con 4-7 equipos", () => {
    expect(suggestPlayoffTeams(4)).toBe(4);
    expect(suggestPlayoffTeams(7)).toBe(4);
  });

  it("no sugiere nada con menos de 4 equipos", () => {
    expect(suggestPlayoffTeams(3)).toBeNull();
    expect(suggestPlayoffTeams(0)).toBeNull();
  });
});

describe("getZone", () => {
  it("sin playoffTeams no hay zona", () => {
    expect(getZone(1, null).kind).toBeNull();
  });

  it("posiciones dentro de playoffTeams clasifican", () => {
    expect(getZone(1, 8).kind).toBe("clasifica");
    expect(getZone(8, 8).kind).toBe("clasifica");
  });

  it("las siguientes 2 posiciones son repechaje", () => {
    expect(getZone(9, 8).kind).toBe("repechaje");
    expect(getZone(10, 8).kind).toBe("repechaje");
  });

  it("el resto no tiene zona", () => {
    expect(getZone(11, 8).kind).toBeNull();
  });
});
