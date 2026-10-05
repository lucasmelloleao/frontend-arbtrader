---
name: forms
description: "Formulários no seu projeto com React Hook Form + valibotResolver: schema em *.schema.ts, tipo via InferOutput, RHF instanciado no hook, mensagens PT-BR, validação alinhada ao contrato. Aciona em: form, criar/editar, input, submit, validação."
---

# Forms: React Hook Form + valibot

Skill auto-contida. Em conflito com `AGENTS.md`, **o AGENTS.md vence**.

## Regras

- **RHF instanciado dentro do hook** da feature (`useRoomForm`), não no componente. O componente recebe `form` pronto + `onSubmit` → UI continua burra (`nextjs-react19-architecture`).
- **Schema valibot em `*.schema.ts`**; tipo do form via `InferOutput<typeof schema>` (nunca declarar à mão).
- Validação **alinhada ao contrato** do backend (mesmas regras: obrigatório, formato, length, enum). Validação no client é UX, **nunca** a fronteira de segurança (o backend revalida). Quando o form alimenta uma **mutação**, espelhe request/response do contrato → `api-contract`.
- **Submit de mutação de dado** → Server Action (+ `revalidatePath`/`router.refresh`). **Submit de auth que seta cookie** (login/refresh) → chamada **browser-direct** (o `Set-Cookie` precisa pousar no browser). UI otimista = `useOptimistic`.
- **Mensagens em PT-BR com acentuação.**
- `@hookform/resolvers/valibot` (`valibotResolver`) como resolver. `defaultValues` literais e completos (sem `undefined` controlado→não-controlado).

## Exemplo

```ts
// features/rooms/rooms.schema.ts
import {
  object,
  string,
  pipe,
  trim,
  minLength,
  maxLength,
  type InferOutput,
} from "valibot";

export const roomFormSchema = object({
  name: pipe(
    string(),
    trim(),
    minLength(1, "Informe o nome da sala."),
    maxLength(120, "O nome deve ter no máximo 120 caracteres."),
  ),
});
export type RoomFormData = InferOutput<typeof roomFormSchema>;

// features/rooms/use-room-form.ts
"use client";
export function useRoomForm(onCreated: () => void): {
  form: UseFormReturn<RoomFormData>;
  submit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
} {
  const router = useRouter(); // next/navigation
  const form = useForm<RoomFormData>({
    resolver: valibotResolver(roomFormSchema),
    defaultValues: { name: "" },
  });
  const [status, setStatus] = useState<FetchStatus>("idle");

  const submit = form.handleSubmit(async (values) => {
    if (status === "loading") return;          // re-entry guard
    setStatus("loading");
    const result = await createRoom(values);    // Server Action revalida no server
    if (!result.success) {
      setStatus("error");
      form.setError("name", { message: result.message });
      return;
    }
    setStatus("success");
    form.reset();
    router.refresh();                           // RSC re-renderiza com dado fresco
    onCreated();
  });

  return { form, submit, isSubmitting: status === "loading" };
}
```

```tsx
// features/rooms/room-form.tsx: UI burra (Tailwind v4)
"use client";
export function RoomForm({ form, submit, isSubmitting }: RoomFormProps): React.ReactNode {
  const { register, formState } = form;
  const error = formState.errors.name;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor="room-name" className="text-sm font-medium">
        Nome da sala
      </label>
      <input
        id="room-name"
        {...register("name")}
        aria-invalid={Boolean(error)}
        className="rounded-md border border-neutral-300 px-3 py-2 aria-invalid:border-red-500"
      />
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Salvar
      </button>
    </form>
  );
}
```

## Regras de UI do form

- Erro do servidor (422 do backend, ex.: "já está em uso") mapeado para o campo via `form.setError` quando o `field` é conhecido; senão, erro de form geral + toast.
- Botão de submit desabilitado enquanto `isSubmitting`. Acessibilidade (label, `aria-invalid`, foco) → `design-system`.

## Anti-padrões (FAIL em review)

- Tipo do form declarado à mão; RHF no componente; mensagem em inglês; `defaultValues` faltando (uncontrolled→controlled); validação mais frouxa que o backend; submit sem re-entry guard; `watch()` em `useEffect` (`boilerplate/no-watch-in-effect`); mutação chamada direto do client em vez de Server Action.

## Checklist

- [ ] Schema em `*.schema.ts`, tipo via `InferOutput`?
- [ ] RHF no hook; componente recebe `form` pronto?
- [ ] Mensagens PT-BR; validação == regras do backend (mesmo schema valida client e revalida server)?
- [ ] Mutação via Server Action (+`revalidatePath`/`router.refresh`); login/refresh browser-direct?
- [ ] `defaultValues` completos; submit com re-entry guard?
- [ ] Erro 422 do backend mapeado ao campo + feedback?

## Skills relacionadas

`api-contract`, `nextjs-react19-architecture`, `design-system`, `typescript-strict`.
