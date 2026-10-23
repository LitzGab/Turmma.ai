# Achados das revisões — `tasks/correcoes/2026-10-23-audit-vite-e-transitivas.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 20:17:00 · `tasks/correcoes/2026-10-23-audit-vite-e-transitivas.md`

VEREDITO: APROVADO

**Cenários exigidos:** o `npm audit --audit-level=high --omit=dev` da `guarda:dependencias` dava vermelho por causa do `body-parser` 2.3.0 e precisa ficar verde. Fora do `--omit=dev`, os três avisos graves das ferramentas de desenvolvimento (`vite` 8.3.0, `brace-expansion` 5.0.9, `source-map-js` 1.2.1) também precisam sair. Nenhuma versão pode passar para um major novo, e a versão exata tem de continuar fixa nos `package.json`. A correção não toca dado de escola, permissão, concorrência nem IA, então os casos de borda do domínio não se aplicam.

**Cobertos:**
- **Diff:** o `vite` passa de 8.3.0 para 8.3.5, ainda exato, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/package.json` e em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/apps/web/package.json`.
- **Lock:** o `package-lock.json` traz exatamente as subidas que o documento lista: `body-parser` 2.4.0, `brace-expansion` 5.0.12, `source-map-js` 1.2.2, `rolldown` e os 15 binários dele 1.2.15, `@oxc-project/types` 0.155.0, `postcss` 8.5.31, `nanoid` 3.3.20 e `qs` 6.16.1. Nada muda de major.
- **Guarda:** rodei `npm run guarda:dependencias` nesta árvore. A etapa de produção deu `found 0 vulnerabilities`, o knip passou e a guarda terminou com "esteira: etapa verde".
- **O teste falharia sem a correção?** Sim. O documento registra o vermelho em `995ff72` com `body-parser 2.0.0 - 2.3.0 … 1 high`. A guarda é a mesma que a esteira roda, então voltar o lock reabre o aviso.
- **Mutações:** nenhuma cláusula de código entrou (só versões de dependência), então não falta bloco de mutação. Não há `.skip`, mock nem provedor de IA envolvido.

**Bloqueantes:** nenhum.

**Recomendações:**
- O `vite` passou de 8.3.0 para 8.3.5 e trouxe o `rolldown` de 1.2.8 a 1.2.15 junto. Isso mexe na build e no servidor de desenvolvimento do `apps/web`, que o portão da correção não exercita: só o `test:e2e` da esteira vai provar que a build segue boa. Vale conferir o veredito da esteira no push desta correção antes de a linha andar.
- O documento diz que sobram 6 avisos moderados do `esbuild` antigo do `drizzle-kit`. Vale pôr isso no `TODO.md` ou no índice de achados, para não se perder quando um deles virar `high`.
- O `npm audit fix` quebra no arborist do npm 10.9.8 (`edgesOut`), e o caminho que funcionou está descrito no documento. Vale levar isso para o `/retro` ou para o runbook, porque vai acontecer de novo no próximo aviso.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 20:17:00 · `tasks/correcoes/2026-10-23-audit-vite-e-transitivas.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. O `body-parser` passa em toda requisição da API, mas a troca é só de versão de dependência, sem código nosso alterado.
Rate limit: ok. A correção não mexe nele.
Fila e prioridade: ok. A correção não mexe nela.
Concorrência: protegida. Não há operação nova.
Índice e paginação: ok. Não há query nova.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Não há código novo no caminho quente.
Bloqueantes: nenhum

O que conferi:
- **Lockfile:** só mudam as versões que a correção declara. São elas `vite` 8.3.5, `body-parser` 2.4.0, `brace-expansion` 5.0.12, `source-map-js` 1.2.2, `rolldown` e os binários dele 1.2.15, `@oxc-project/types` 0.155.0, `postcss` 8.5.31, `nanoid` 3.3.20 e `qs` 6.16.1. Nenhuma sai do major.
- **Auditoria de produção:** `npm audit --audit-level=high --omit=dev` dá `found 0 vulnerabilities`.
- **Auditoria completa:** sobram 6 moderados, abaixo do limiar `high`.
- **Versões instaladas:** `npm ls` resolve `vite@8.3.5` sem duplicata e `body-parser@2.4.0`, sem nenhuma versão `invalid`.
- **Limite do corpo da requisição:** o `body-parser` 2.4.0 continua com o padrão de 100 kb (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/node_modules/body-parser/lib/utils.js:46`). O limite de tamanho de upload da regra 80, item 3, não muda. Não há nenhuma configuração própria do parser em `apps/api/src`.

Recomendações:
- O texto de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-23-audit-vite-e-transitivas.md` deveria registrar que o padrão de limite do `body-parser` foi conferido e ficou igual. É o único ponto da troca que alcança o caminho de toda requisição.
- O `npm audit fix` quebra no arborist do npm 10.9.8 (`Cannot read properties of null (reading 'edgesOut')`). Vale registrar esse contorno no `/retro`, para a próxima atualização de dependência não perder tempo com ele.
