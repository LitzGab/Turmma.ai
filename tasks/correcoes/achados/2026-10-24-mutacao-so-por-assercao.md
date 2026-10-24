# Achados das revisões — `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 11:41:10 · `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só no portão de mutações do processo (`tools/processo/mutacoes.ts`), no teste dele e em dois documentos do processo. Não cria migration, entidade, DTO nem rota.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo novo de pessoa.

Autorização por objeto: não se aplica. Não há endpoint nem repository novo.

Logs: limpos. Os únicos textos novos são o motivo da recusa ("o teste ficou vermelho por erro de carga...") e o aviso `✗`, ambos sem nenhum dado. A corrida continua com `stdio: 'ignore'`.

Auditoria: não se aplica. Nenhuma das ações que a regra 20, item 10, obriga a auditar foi tocada.

Envio externo: nenhum. O relatório JSON do Vitest ou do Playwright é gravado em pasta local criada com `mkdtempSync` e apagada no `finally` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.ts:642-654`). O teste "a pasta do relatório não sobra" prova essa limpeza. No Playwright, a variável `EDUCA_RELATORIO_DO_E2E` só acrescenta o repórter `json` local (`tools/ci/duracao-do-e2e.ts:64-70`), sem destino de rede. Os nomes de caso e as mensagens de falha que vão para o relatório saem dos testes do repositório, que usam dado sintético. Mesmo assim, o arquivo é apagado ao fim de cada corrida.

Seed/fixture: sintético. As fixtures novas em `tools/processo/mutacoes.test.ts:350-351` e `:461-490` são contagens numéricas e arquivos de teste triviais (`expect(1).toBe(2)`), sem nome, matrícula ou qualquer dado de pessoa.

Pergunta de fechamento: a resposta à secretaria sobre o que guardamos de um aluno e para onde foi enviado não muda com esta correção, porque ela não coleta, não guarda e não envia dado de titular.

Bloqueantes: nenhum.

Recomendações:
- O relatório JSON do Vitest guarda o nome de cada caso e a mensagem de cada asserção que falhou. Hoje os testes só usam dado sintético (regra 20, item 17), e é isso que mantém o arquivo inofensivo. Valeria uma linha no comentário de `prepararRelatorio` dizendo que a pasta temporária existe também para que esse conteúdo não fique no disco depois da corrida.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 11:42:19 · `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de processo e não tem Tech Spec. A referência é a M2 de `tasks/prd-harness/retro.md`, que pede a recusa do vermelho por erro de carga, e o item de `TODO.md`. A mutação em que um caso roda e lança ficou fora, e o documento diz isso e explica o motivo na seção "Fora desta correção". O mesmo ficou escrito no cabeçalho de `tools/processo/mutacoes.ts`, então não é divergência silenciosa.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

Os três pontos de uso de `Rodar` foram conferidos:
- **Corrida limpa:** `'carga'` vira "não passou", porque só `true` passa.
- **Corrida mutada:** `'carga'` é recusada antes do ramo verde.
- **`reconstruirDepoisDasMutacoes`:** `'carga'` deixa o portão vermelho.

O `tools/ci/e2e.ts` passa `process.env` adiante até o `playwright test` (`tools/ci/executar.ts:19`), então a variável `EDUCA_RELATORIO_DO_E2E` chega ao `playwright.config.ts`.

Recomendações:
- `tools/processo/mutacoes.ts`, em `casoFalhouNoRelatorio`: um `beforeAll` que lança no Vitest pode deixar `numFailedTests` em 0, com os casos pulados. Nesse caso, a mutação de produção que quebra o preparo de um teste de integração seria recusada como `'carga'`, mesmo sendo um vermelho de comportamento. Vale um caso real com `beforeAll` lançando no bloco "com o Vitest e o Playwright de verdade", para fixar o que acontece, ou uma linha no cabeçalho dizendo que esse caso conta como carga.
- `tools/processo/mutacoes.ts`, em `veredictoDaCorrida`: quando o `node tools/ci/e2e.ts` cai antes do Playwright (o compose não subiu, por exemplo), não há relatório e o resultado é `'carga'`. A mensagem de recusa fala em sintaxe ou módulo que não carrega e confunde quem lê. Basta um "ou o ambiente do teste não subiu" no motivo.
- O documento lista `privacy-guardian` como subagente obrigatório numa correção que não toca dado de pessoa. O comentário diz que veio do pedido do Orquestrador. Isso não muda o veredito, mas fica registrado para a retro.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/.claude/rules/40-testes.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/.claude/skills/executar-task/SKILL.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 11:43:01 · `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** uma mutação que derruba um caso por asserção conta como provada, no Vitest e no Playwright.
- **Borda: erro de carga.** Erro de sintaxe, módulo que não existe e arquivo que não existe deixam o teste vermelho sem caso nenhum falhar, e são recusados com o motivo.
- **Borda: relatório ruim.** Relatório ausente, vazio, truncado, de outro formato ou com contagem que não é número não prova caso nenhum.
- **Borda: prazo estourado.** Continua sendo `'estourou'` e é lido antes do relatório.
- **Borda: comando de outro programa** (`sh`, `tsc`). Não tem relatório, e o código de saída decide.
- **Borda: erro de carga na corrida limpa.** Vale como "o teste não passa", e não como teste verde.
- **Todo comando que `comandoDoTeste` monta recebe relatório:** unidade, integração, e2e direto, `tools/ci/e2e.ts` e o projeto `celular`.
- **O relatório chega ao processo do teste:** o arquivo na linha de comando do Vitest e a variável de ambiente do Playwright.
- **O que fica no fim:** a pasta temporária é apagada e o arquivo mutado volta ao que era.
- **Portão:** a mutação de carga deixa o portão vermelho e sem carimbo.
- **Variável do Playwright:** o texto repetido é o mesmo de `tools/ci/duracao-do-e2e.ts`.
- **Concorrência:** cada corrida usa sua própria pasta (`mkdtempSync`), e duas linhas rodando o portão juntas não dividem o arquivo. Não precisa de teste em paralelo, porque não há recurso compartilhado.
- **Permissão e isolamento de escola:** não se aplicam, porque é ferramenta do processo e não toca dado de escola.

**Cobertos:**
- Todos os cenários acima têm teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.test.ts`, com asserção sobre o resultado: veredito, motivo, aviso, conteúdo do arquivo e pasta inexistente.
- Rodei `npx vitest run tools/processo/mutacoes.test.ts`: 161 de 161 verdes.
- Conferi os 17 blocos de mutação contra o `git diff`. Cada um alcança a sua cláusula e derruba um caso que rodou.
  - Dois blocos derrubam o caso por exceção, e não por asserção: o `readFileSync` sem `existsSync` lança ENOENT, e o `atual === null` retirado causa um TypeError. O caso rodou e caiu, o que está dentro do escopo declarado no "Fora".
- `--faltando` lista só `mutacoes.ts:490` (`if (texto === null) return false`). Conferi a justificativa de mutante equivalente e ela vale: `JSON.parse(null)` lê o texto `"null"`, devolve `null`, e `contagemNoJson` devolve 0 do mesmo jeito.
- Não há `.skip` nem teste comentado. Não há mock escondendo a regra: o `preparar` injetado só substitui o Vitest e o Playwright nos testes com `sh`, e há corrida de verdade com Vitest 5 e com Playwright 1.63.
- Não há IA envolvida.
- O caminho por `tools/ci/e2e.ts` herda o ambiente: `tools/ci/executar.ts:19` monta `{ ...process.env, ...etapa.ambiente }`, então a variável chega ao Playwright.

**Bloqueantes:**
1. **Cláusula nova sem bloco.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.ts`, no `spawnSync` de `rodarCalado` (a linha `{ cwd: raiz, stdio: 'ignore', env: { ...process.env, ...relatorio?.env, EDUCA_BANCO_NOVO: undefined } }`), o `...relatorio?.env` é novo e não tem bloco em "Mutações".
   - **Por que importa:** é o único caminho por onde o Playwright fica sabendo onde gravar o relatório. Sem ele, toda mutação de e2e que cai por asserção seria recusada como erro de carga, sem ninguém ver.
   - **Por que o `--faltando` não pegou:** a linha não tem condição (`if`), só o `?.`.
   - **Correção exigida:** acrescentar o bloco abaixo. Ele fica vermelho porque, sem a variável, o `sh` não grava o relatório e o primeiro `toBe(false)` recebe `'carga'`.
     ```mutacao
     arquivo: tools/processo/mutacoes.ts
     teste: tools/processo/mutacoes.test.ts › saiu 1 com um caso que falhou
     -        { cwd: raiz, stdio: 'ignore', env: { ...process.env, ...relatorio?.env, EDUCA_BANCO_NOVO: undefined } },
     +        { cwd: raiz, stdio: 'ignore', env: { ...process.env, EDUCA_BANCO_NOVO: undefined } },
     ```

**Recomendações:**
- **Nome citado que não existe.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md:39`, "Teste que reproduz" cita `rodarCalado › o teste que cai sem caso nenhum…`, e nenhum teste tem esse nome. Os nomes certos são `rodarCalado lê o relatório de um teste que caiu › saiu 1 com um caso que falhou no relatório: caiu (false); sem caso nenhum, ou sem relatório: carga`. Vale corrigir para a validação encontrar o teste.
- **Vermelho que não é sintaxe, mas é recusado igual.** Três casos caem como `'carga'` com o texto "sintaxe, módulo que não carrega":
  - um `beforeAll` que lança;
  - um erro solto (unhandled) com todos os casos verdes;
  - no caminho por `tools/ci/e2e.ts`, uma falha do compose antes de o Playwright rodar.

  O portão fica vermelho, o que está certo, mas o motivo engana. Vale registrar isso como limite conhecido no "Fora", ou dizer no motivo que "nenhum caso falhou" inclui setup e ambiente.
- **Pastas que sobram no `/tmp`.** Os testes novos não apagam o que criam com `mkdtempSync(join(tmpdir(), 'relatorio-'))` e com `pasta(...)` (essa última inclui o symlink de `node_modules`). Vale apagar no fim do caso, para não acumular em quem roda o teste muitas vezes.
- **`tools/ci/e2e.ts` só no `prepararRelatorio`.** A corrida de verdade cobre só `npx playwright` direto. A herança do ambiente pelo `executar.ts` está correta hoje, mas nenhum teste deste arquivo a prova.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 11:49:57 · `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, sobre o diff r1→r2 e a correção exigida):
- A correção da 1ª rodada: a cláusula `...relatorio?.env` do `spawnSync` de `rodarCalado` precisa ter bloco em "Mutações".
- Cada recomendação que a Mesa mandou aplicar precisa estar feita: o nome citado em "Teste que reproduz", o motivo da recusa que enganava e as pastas de `/tmp` que sobravam.
- O motivo novo da recusa precisa ter asserção.

Cobertos:
- **Correção 1, feita.** O bloco novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`, seção "Mutações". O `-` bate letra a letra, recuo incluído, com a linha 537 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.ts`. O cenário chega à cláusula:
  - O teste citado (`mutacoes.test.ts:1505`, `saiu 1 com um caso que falhou…`) entrega o arquivo à corrida só pela variável `RELATORIO`, que vem do `env` do `preparar`.
  - Sem o espalhamento, `"$RELATORIO"` chega vazio e o `printf` não grava nada. Sem relatório, a corrida volta `'carga'`, e a asserção da linha 1506 (`toBe(false)`) fica vermelha num caso que rodou, e não por erro de carga.
- **Motivo da recusa.** O texto novo, em `mutacoes.ts:362`, cita preparo que lançou e ambiente que não subiu. Isso tem asserção nova em `mutacoes.test.ts:319-321` (`toMatch(/preparo/)` e `toMatch(/ambiente/)`). O limite também está escrito no cabeçalho de `mutacoes.ts` (linhas 28-31) e no documento.
- **Pastas de `/tmp`.** Agora há `temporaria()` com `afterEach` e `rmSync`, em `mutacoes.test.ts:1417-1426`. Os quatro `mkdtempSync` soltos daquele bloco passaram a usar essa função.
- **Herança do ambiente pelo `tools/ci/e2e.ts`.** Está escrita como fora de escopo, com destino `TODO.md`, como foi combinado.
- Rodei `npx vitest run tools/processo/mutacoes.test.ts -t "relatório da corrida|erro de carga"`: 16 passaram e 145 ficaram fora do filtro, nenhum vermelho.
- Não há `.skip` nem mock que esconda a regra. Não há IA nem concorrência neste diff.

Bloqueantes: nenhum.

Recomendações:
- Na seção "Teste que reproduz" do documento, o caso de carga está citado como `conferirMutacoes › vermelho por erro de carga…`. O caso existe (`mutacoes.test.ts:303`), mas o `describe` dele se chama `conferir as mutações: o teste tem de cair sem a cláusula, e o arquivo volta`, e não `conferirMutacoes`. Vale corrigir a citação para o nome do `describe`, para quem procura pelo caminho completo.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 11:50:03 · `tasks/correcoes/2026-10-24-mutacao-so-por-assercao.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de processo, sem seção de Tech Spec. O diff da rodada 2 não muda o que o pedido cobre: só acrescenta o limite escrito, o bloco do `...relatorio?.env` e a limpeza das pastas temporárias.
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum.

O que a rodada 2 tinha de trazer e onde está:
- **Limite do `beforeAll` e do ambiente que não subiu, escrito no cabeçalho e no motivo da recusa** (pedido da Mesa): está no cabeçalho de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacao-so-por-assercao/tools/processo/mutacoes.ts:28-31` e no motivo do `recusar` em `mutacoes.ts:362`. O caso `vermelho por erro de carga…` (`mutacoes.test.ts:303`) passou a exigir `/preparo/` e `/ambiente/` no motivo. O documento repete o limite em "Fora desta correção".
- **Bloco de mutação do `...relatorio?.env`** (pedido do `test-engineer`): está no documento. Conferi por leitura que ele derruba o caso citado. Sem a variável `RELATORIO`, o `printf … > "$RELATORIO"` não grava nada, a corrida termina como `'carga'`, e o primeiro `expect(...).toBe(false)` de `mutacoes.test.ts:1506` cai numa asserção. O vermelho vem de um caso que falhou, não de erro de carga.
- **Pastas temporárias dos testes**: o `afterEach` com `temporaria()` (`mutacoes.test.ts:1417-1426`) apaga as pastas no fim de cada caso. O `rmSync` não segue o symlink de `node_modules` (`:1562`), então a pasta real fica intacta.
- **"Vai para o `TODO.md`"**: o `TODO.md` não foi alterado nesta árvore. Não bloqueia, porque o projeto registra o que a correção deixou num commit à parte depois do pouso, como fez o `2d092014` na correção anterior.

Recomendações:
- O "Fora desta correção" do documento cita três casos que caem como `'carga'`: o `beforeAll` que lança, o erro solto com todos os casos verdes e o ambiente que não subiu. O cabeçalho de `mutacoes.ts:28-31` cita só dois, falta o erro solto. Vale igualar os dois textos.
- A herança do ambiente pelo `tools/ci/executar.ts` até o Playwright do `e2e.ts` foi conferida só por leitura. Precisa entrar mesmo no `TODO.md` no commit de registro depois do pouso, para não sumir.
- As duas pendências que vieram da rodada 1 vão para a retro: o caso real com `beforeAll` que lança e o `privacy-guardian` na linha de obrigatórios.
