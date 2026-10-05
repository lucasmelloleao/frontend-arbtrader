// Import real torna o arquivo um módulo ES (permite top-level await no tsc).
import process from "node:process";

/**
 * Guard do `verify`: proíbe diretivas de supressão de lint do ESLint e do oxlint
 * no código-fonte. Toda ocorrência deve ser corrigida na origem; não há escape
 * hatch porque uma supressão permitiria burlar os guardrails com o gate verde.
 *
 * Não é uma regra do plugin oxlint de propósito: uma regra de lint pode ser
 * desligada pela própria diretiva que ela proíbe. Um grep fora do linter, não.
 *
 * Roda em Bun (sem node). Usa `git grep` quando há repositório (rápido e já
 * respeita o .gitignore) e cai pra varredura com o glob do Bun quando ainda não
 * há — o comprador extrai o zip e roda `bun run verify` antes do `git init`, e
 * `grep` (binário Unix) não existe no Windows.
 * Sai 1 se achar ocorrência ou se a busca falhar de verdade.
 */

// Montados em runtime pra este próprio arquivo não dar auto-match na busca.
const NEEDLES = [["eslint", "disable"].join("-"), ["oxlint", "disable"].join("-")];

const EXTENSIONS = ["ts", "tsx", "js", "jsx", "mjs", "cjs", "mts", "cts"];

async function main(): Promise<void> {
  const isGitRepository =
    Bun.spawnSync(["git", "rev-parse", "--is-inside-work-tree"], {
      stdout: "pipe",
      stderr: "pipe",
    }).exitCode === 0;

  let hits: string;

  if (isGitRepository) {
    const result = Bun.spawnSync(
      [
        "git",
        "grep",
        "-nI",
        ...NEEDLES.flatMap((needle) => ["-e", needle]),
        "--",
        ...EXTENSIONS.map((extension) => `*.${extension}`),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );

    // Exit 1 do git grep significa só "nenhuma ocorrência".
    if (result.exitCode > 1) {
      const details = result.stderr.toString().trim();
      process.stderr.write(
        `Proibido continuar: a busca por supressões falhou (exit ${result.exitCode}).\n${details}\n`,
      );
      process.exit(1);
    }

    hits = result.stdout.toString().trim();
  } else {
    // Sem repo git: varre com o glob do Bun em vez de depender de `grep`.
    const pattern = `**/*.{${EXTENSIONS.join(",")}}`;
    const files = [...new Bun.Glob(pattern).scanSync(".")].filter((path) => {
      const normalized = path.replaceAll("\\", "/");
      return (
        !normalized.startsWith("node_modules/") &&
        !normalized.startsWith(".next/") &&
        !normalized.startsWith(".git/")
      );
    });

    // Leitura em lotes: `Promise.all` sobre o conjunto inteiro estoura o limite
    // de file descriptors (EMFILE) no Windows com node_modules presente. Cada
    // batch processa em paralelo (64 de cada vez) e os resultados acumulam.
    const BATCH_SIZE = 64;
    const batches: string[][] = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push(files.slice(i, i + BATCH_SIZE));
    }

    const lines = await batches.reduce(
      (accumulator, batch) =>
        accumulator.then(async (acc) => {
          const contents = await Promise.all(batch.map((path) => Bun.file(path).text()));
          contents.forEach((text, fileIndex) => {
            const matches = text.split("\n").map((line) => line.trim());
            matches.forEach((line, lineIndex) => {
              if (NEEDLES.some((needle) => line.includes(needle))) {
                acc.push(`${batch[fileIndex]}:${lineIndex + 1}:${line}`);
              }
            });
          });
          return acc;
        }),
      Promise.resolve([] as string[]),
    );

    hits = lines.join("\n");
  }

  if (hits) {
    process.stderr.write(
      `Proibido: diretiva de supressão de lint encontrada no código-fonte:\n${hits}\n` +
        "Corrija a causa do lint; supressões não são permitidas.\n",
    );
    process.exit(1);
  }
}

await main();
