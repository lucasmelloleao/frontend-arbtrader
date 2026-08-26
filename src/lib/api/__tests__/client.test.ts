import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test } from "bun:test";
import ky, { type KyInstance } from "ky";

import { apiClient } from "@/lib/api/client";
import { fetchFailing, fetchReturning } from "@test/fetch-mock";

type Perfil = { id: string; nome: string };

/**
 * Standard Schema mínimo, escrito à mão.
 *
 * Não importa um `*.schema.ts` de feature de propósito: `lib` não pode importar
 * `features` (`boilerplate/enforce-boundaries`), e o que este teste exercita é o
 * contrato Standard Schema que o `apiClient` consome — não o valibot. Isso deixa
 * o teste independente da biblioteca de validação, igual ao próprio gateway.
 */
const perfilSchema: StandardSchemaV1<unknown, Perfil> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (value) => {
      if (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        typeof value.id === "string" &&
        "nome" in value &&
        typeof value.nome === "string"
      ) {
        return { value: { id: value.id, nome: value.nome } };
      }
      return { issues: [{ message: "Perfil inválido." }] };
    },
  },
};

const PERFIL: Perfil = { id: "u-1", nome: "Ana" };

function kyWith(fetchImpl: typeof fetch): KyInstance {
  return ky.create({ baseUrl: "https://api.example.com", fetch: fetchImpl, retry: 0 });
}

describe("apiClient", () => {
  test("devolve o `data` validado e tipado do envelope", async () => {
    const instance = kyWith(fetchReturning({ success: true, message: "ok", data: PERFIL }, 200));

    await expect(apiClient(instance, "perfil", perfilSchema)).resolves.toEqual(PERFIL);
  });

  test("devolve undefined quando o endpoint não tem `data` no contrato", async () => {
    const instance = kyWith(fetchReturning({ success: true, message: "ok" }, 200));

    await expect(
      apiClient(instance, "perfil", undefined, { method: "put" }),
    ).resolves.toBeUndefined();
  });

  test("propaga a `message` do backend em erro HTTP com envelope", async () => {
    const instance = kyWith(
      fetchReturning({ success: false, message: "E-mail já cadastrado." }, 422),
    );

    await expect(apiClient(instance, "perfil", perfilSchema)).rejects.toThrow(
      "E-mail já cadastrado.",
    );
  });

  test("usa o texto seguro de conexão quando a falha não traz envelope", async () => {
    const instance = kyWith(fetchFailing("Failed to fetch"));

    // O `TypeError: Failed to fetch` cru é técnico e em inglês: nunca vai pra tela.
    await expect(apiClient(instance, "perfil", perfilSchema)).rejects.toThrow(
      "Não foi possível concluir a solicitação. Tente novamente em instantes.",
    );
  });

  test("usa o texto seguro de conexão quando o 5xx não é do backend (não-JSON)", async () => {
    const instance = ky.create({
      baseUrl: "https://api.example.com",
      retry: 0,
      fetch: () =>
        Promise.resolve(
          new Response("<html>502 Bad Gateway</html>", {
            status: 502,
            headers: { "content-type": "text/html" },
          }),
        ),
    });

    await expect(apiClient(instance, "perfil", perfilSchema)).rejects.toThrow(
      "Não foi possível concluir a solicitação. Tente novamente em instantes.",
    );
  });

  test("rejeita quando o `data` não bate com o schema", async () => {
    const instance = kyWith(
      fetchReturning({ success: true, message: "ok", data: { id: "u-1" } }, 200),
    );

    await expect(apiClient(instance, "perfil", perfilSchema)).rejects.toThrow("Perfil inválido.");
  });
});
