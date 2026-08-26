import { describe, expect, test } from "bun:test";

import { parseServerEnv } from "@/lib/env.schema";

describe("parseServerEnv", () => {
  test("devolve a env tipada quando a configuração é válida", () => {
    expect(parseServerEnv({ INTERNAL_API_URL: "https://api.example.com" })).toEqual({
      INTERNAL_API_URL: "https://api.example.com",
    });
  });

  test("falha fechado quando a variável obrigatória está ausente", () => {
    // Erro de configuração estoura no boot, não com um fetch pra `undefined/rota`.
    expect(() => parseServerEnv({})).toThrow("Configuração de ambiente inválida");
  });

  test("falha fechado quando a variável não é uma URL absoluta", () => {
    expect(() => parseServerEnv({ INTERNAL_API_URL: "/api" })).toThrow(
      "INTERNAL_API_URL precisa ser uma URL absoluta.",
    );
  });

  test("nomeia a variável inválida na mensagem", () => {
    // Sem o nome, o erro manda o dev caçar qual das envs quebrou.
    expect(() => parseServerEnv({})).toThrow("INTERNAL_API_URL");
  });
});
