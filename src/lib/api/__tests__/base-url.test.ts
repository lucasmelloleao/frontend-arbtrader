import { afterEach, describe, expect, test } from "bun:test";

import { getClientApiBaseUrl } from "@/lib/api/base-url";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  Reflect.deleteProperty(globalThis, "window");
});

/** Marca o teste como "rodando no browser" para o `typeof window` da borda. */
function pretendBrowser(): void {
  Object.defineProperty(globalThis, "window", {
    value: { location: { hostname: "localhost" } },
    configurable: true,
    writable: true,
  });
}

describe("getClientApiBaseUrl", () => {
  test("no servidor devolve '/' sem exigir env", () => {
    // O kyClient existe no servidor mas nunca dispara: build e prerender ficam
    // livres de configuração.
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_API_URL");

    expect(getClientApiBaseUrl()).toBe("/");
  });

  test("no browser devolve a base configurada", () => {
    pretendBrowser();
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

    expect(getClientApiBaseUrl()).toBe("https://api.example.com");
  });

  test("no browser falha fechado quando a env não foi configurada", () => {
    pretendBrowser();
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_API_URL");

    expect(() => getClientApiBaseUrl()).toThrow("NEXT_PUBLIC_API_URL não configurada");
  });
});
