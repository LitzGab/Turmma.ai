# Achados das revisões — `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 08:24:39 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**1. É texto de teste, não segredo.** Sim.
- A linha 330 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts` está no commit `ce0e698` exatamente como a exceção descreve. Os dois textos, `'senha-escolhida-em-a-1'` e `'senha-escolhida-em-b-2'`, são senhas escolhidas pelo próprio teste.
- As contas nascem no teste. As escolas vêm de `bancada.escola()`, o e-mail é `convidada-${randomUUID()}@escola.invalid` (um domínio reservado que não existe) e o convite sai de `convidarEm` no banco do compose de teste. O banco grava só o hash, que o teste confere com `hash.verificar`.
- Os textos não servem como credencial fora do teste: não existe conta real, ambiente ou serviço externo que os aceite.

**2. A exceção é estreita.** Sim.
- `condition = "AND"` exige ao mesmo tempo o caminho exato (`^apps/api/test/convite\.int\.test\.ts$`) e a linha inteira escrita literalmente, com as duas senhas. Nenhuma pasta, extensão ou regra ficou de fora.
- Uma senha diferente naquela mesma linha já não bate com a exceção e volta a reprovar.
- O teste `reprova o segredo nos arquivos que têm linha na allowlist` agora inclui esse arquivo. Ele prova que um segredo em qualquer outra linha do arquivo continua reprovando, e o teste de `generic-api-key` prova que a regra segue ligada.
- Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: passaram os 6 testes, incluindo o do histórico do repositório.

Campos pessoais tocados: nenhum. A mudança é só de configuração da guarda e do teste dela.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica, não há rota nem consulta nova.
Logs: limpos. A saída do gitleaks mostra `REDACTED` no lugar do valor, e o teste da fixture confere que o segredo não aparece no log.
Auditoria: não se aplica.
Envio externo: nenhum.
Seed/fixture: sintético (e-mail em `.invalid`, nomes marcados como sintéticos, senhas inventadas).
Bloqueantes: nenhum.

Recomendações:
- **Ancorar o início da regex.** Em `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`, a regex da nova exceção fecha com `\s*$`, mas não abre com `^\s*`. Em tese, um segredo colado antes do `const` na mesma linha seria perdoado. O risco é baixo, porque o resto da linha teria que ser idêntico. As duas exceções mais antigas têm a mesma folga. Trocar o começo das três por `^\s*` fecha isso sem custo.
- **Seguir o "Para não repetir" da correção.** A partir de agora, senha de teste vai numa constante nomeada, como já é feito com `SENHA_NOVA` e `SENHA_DE_B` no mesmo arquivo, e não direto depois de um `.token, `. Assim a lista de exceções não cresce a cada tarefa. Isso fica para o `/retro`.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 08:24:40 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. A linha 330 de `apps/api/test/convite.int.test.ts` deixa de reprovar na varredura do histórico.
2. Um segredo de verdade em outra linha do mesmo arquivo continua reprovando.
3. A exceção não desliga o `generic-api-key` para o resto do repositório.
4. A exceção é de arquivo exato e linha exata, na mesma forma das duas que já existiam.

**Cobertos:**
1. O teste `o histórico do próprio repositório passa` cobre o primeiro cenário (`tools/guardas/gitleaks.int.test.ts:113`). Estava vermelho no portão com o achado do commit `ce0e698`, segundo o documento, e agora passa.
2. `reprova o segredo nos arquivos que têm linha na allowlist` (`tools/guardas/gitleaks.int.test.ts:87-93`) cobre o segundo e passou a incluir `apps/api/test/convite.int.test.ts`. Ele falharia se a exceção fosse só pelo caminho, sem a condição da linha, porque o arquivo inteiro passaria e a asserção `File: apps/api/test/convite.int.test.ts` não bateria. Ou seja, prova que a exceção vale só para a linha.
3. `reprova chave genérica de alta entropia` (linha 103) cobre o terceiro, sem mudança.
4. Sobre a forma, `.gitleaks.toml:26-31` usa `condition = "AND"`, `regexTarget = "line"`, caminho com `^...$` e ponto escapado, e o regex com a linha inteira, `\.` em `deA\.token` e `deB\.token`, colchetes e parênteses escapados e `\s*$` no fim. Casa só com a linha 330. As linhas 335 e 336, que repetem as senhas, não casam e também não são achados, porque ali a senha não vem depois de `token`.

Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts` e os seis testes passaram.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Início da linha sem âncora.** O regex em `.gitleaks.toml:31` não começa com `^`, como os outros dois. Se alguém colar um segredo no começo dessa mesma linha física, antes de `const [emA, emB] = ...`, a exceção cobriria o segredo. É improvável e segue o padrão que já existe. Vale pôr `^\s*` nas três entradas numa correção futura.
2. **Condição do caminho sem teste próprio.** Nenhum teste prova que a mesma linha colada em outro arquivo continua reprovando. Um teste assim protegeria contra alguém trocar o `AND` ou alargar o `paths`. Hoje isso vale para as três exceções, não só para esta.
3. **Aviso para as próximas tarefas.** O "Para não repetir" do documento (senha sintética numa constante com nome) serve para o `/retro` e para o `/criar-tasks`, e pode virar uma nota na regra 40 ou no guia de testes. Sem isso, cada teste de aceite com senha tende a pedir uma exceção nova.

**Arquivos:**
- /home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml
- /home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts (linha 330)

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:25:28 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só mexe na configuração do gitleaks e no teste dessa guarda. A senha perdoada é sintética e pertence a uma conta que o teste cria num banco de teste e descarta ao terminar.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica (nenhuma rota nem repository foi tocado).

Logs: limpos.

Auditoria: não se aplica.

Envio externo: nenhum.

Seed/fixture: sintético.

Bloqueantes: nenhum.

O que conferi nesta rodada:
- **As regexes estão ancoradas.** As três exceções de `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml` agora começam com `^\s*` e terminam com `\s*$`. Cada uma continua com `condition = "AND"`, `regexTarget = "line"` e um `paths` que aponta para um único arquivo. Era o que eu tinha recomendado na rodada 1.
- **A exceção bate com a linha real.** Ela casa com o texto exato de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:330`. As linhas 335 e 336 repetem as senhas sem o padrão `token, '...'` e ficam fora da exceção. Isso está certo.
- **O teste novo prova a regra.** "reprova a linha perdoada quando ela aparece em outro arquivo" (`/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts:95`) falha se alguém trocar `AND` por `OR` ou alargar o `paths`. O teste "a exceção é da linha, não do arquivo" passou a incluir o arquivo do convite.
- **A suíte da guarda passa.** Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: 7 de 7, inclusive o teste do histórico.

Recomendações:
- Nenhum teste prova a âncora `^\s*` em si. Um caso novo resolveria: no arquivo do convite, colar um token falso na mesma linha física, antes do texto perdoado, e esperar reprovação. Sem esse teste, alguém pode tirar a âncora sem que nada falhe.
- Siga o que a própria correção propõe em "Para não repetir": nos testes novos, guardar a senha sintética numa constante com nome, para ela não ficar logo depois de `.token`. Assim a allowlist não cresce a cada tarefa.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-18 08:25:54 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: o histórico real do repositório passa com a exceção.
- A exceção vale só para a linha: um segredo em outra linha de `convite.int.test.ts` continua reprovando.
- A exceção vale só para o arquivo: a mesma linha colada em outro arquivo reprova.
- A allowlist não desliga a `generic-api-key` inteira.
- Um segredo apagado no commit seguinte continua reprovando, porque a varredura é do histórico.
- Um repositório limpo passa, para mostrar que a falha vem do segredo e não da execução.

**Cobertos:** todos os seis, e os 7 testes passam quando rodo `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`. As duas correções da rodada 1 estão feitas:
- As três exceções de `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml` agora começam com `^\s*`.
- O caso novo da linha 95 falharia se alguém trocasse o `AND` ou alargasse o `paths`.

**Bloqueantes:**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts:96`: o caso novo traz escrita no código a mesma linha que a `generic-api-key` reprova. Depois do commit, o próprio teste reprova o histórico.**
   - A linha repete a original: `...aceitar(deB.token, <senha sintética>)...`. A exceção vale só para `apps/api/test/convite.int.test.ts`, então no caminho `tools/guardas/gitleaks.int.test.ts` ela é um achado. O caso novo existe justamente para provar isso.
   - Os 7 passam agora só porque a mudança ainda não foi commitada, e a varredura lê commits.
   - Reproduzi assim: repositório temporário com o `.gitleaks.toml` e esse arquivo no caminho real, um commit, e a varredura com `argumentosGitleaks`. O resultado foi status 1, com `RuleID: generic-api-key`, `File: tools/guardas/gitleaks.int.test.ts`, `Line: 96`.
   - Consequência: depois do commit, `o histórico do próprio repositório passa` fica vermelho no portão e na esteira. É o mesmo sintoma que esta correção veio resolver, agora num commit que também não se desfaz.
   - Correção exigida:
     - Não deixar o texto da linha escrito no arquivo de teste. Ler a linha em tempo de execução do arquivo real, por exemplo: `readFileSync(join(raizRepositorio, 'apps/api/test/convite.int.test.ts'), 'utf8').split('\n').find((l) => l.includes('aceitar(deB.token'))`.
     - Afirmar que a linha foi encontrada (`expect(linha).toBeDefined()`) antes de gravá-la em `apps/api/test/outro.int.test.ts`. Assim o teste também avisa se o teste do convite mudar e a exceção ficar velha.
     - Depois do ajuste, simular o commit (repositório temporário com o arquivo no caminho real) e confirmar que a varredura passa, ou deixar o portão rodar sobre o commit antes do push. Rodar o arquivo de testes com a mudança ainda não commitada não pega esse erro.

**Recomendações:**
- Um caso que prove a âncora `^\s*`: um segredo colado antes da linha perdoada, na mesma linha física, em `convite.int.test.ts`, reprova. Hoje nenhum teste falharia se alguém tirasse o `^`.
- Levar a nota da seção "Para não repetir" (senha sintética em constante com nome) também para o teste da guarda: literal que imita segredo, em teste da própria guarda, precisa ser montado em tempo de execução. O `tokenFalso()` já segue esse cuidado; a linha 96 não seguiu. Fica para o `/retro`.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-18 08:27:21 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só em configuração da guarda de segredos e no teste dela. A linha perdoada carrega uma senha sintética de uma conta de teste (`senha-escolhida-em-b-2`), não um dado de pessoa.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok (a correção não tem rota nem endpoint).
Logs: limpos.
Auditoria: ok (a correção não traz ação que a exija).
Envio externo: nenhum.
Seed/fixture: sintético. A linha perdoada é senha de teste, com banco que nasce e morre no teste.

O que conferi nesta rodada:
- **`.gitleaks.toml`**: igual à rodada 2. A exceção vale só para o arquivo exato e a linha exata juntos (`condition = "AND"`), e a regex é presa ao começo (`^\s*`) e ao fim (`\s*$`) da linha. Nenhuma pasta, extensão ou regra inteira ficou de fora.
- **Correção exigida pelo `test-engineer` na rodada 2, feita**: o arquivo de teste da guarda não tem mais a linha perdoada escrita como texto. O grep por `senha-escolhida` e `deB.token, '` em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts` não encontra nada. `linhaPerdoadaDoConvite()` lê a linha do arquivo real em tempo de execução e falha com mensagem própria se ela sair de lá, o que avisa quando a exceção fica velha.
- **Minha recomendação da rodada 2, feita**: o caso novo cola um token falso antes da linha perdoada, na mesma linha, e ele reprova. Isso prova a âncora `^\s*`. O token é gerado aleatoriamente a cada execução e não fica gravado no repositório.
- **A linha perdoada existe uma vez só** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:330`, então o `.find` não pega a linha errada.
- **Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`**: 8 de 8 passam, inclusive o do histórico. Não repeti o commit simulado. O `no leaks found` depois do commit fica pelo relato do documento, e o teste do histórico na esteira confirma depois do push.

Bloqueantes: nenhum.

Recomendações:
- No teste do convite, passar a senha sintética por uma constante com nome (`const SENHA_EM_B = '...'`), como o documento já registra em "Para não repetir". Assim o padrão não volta em teste novo e a allowlist não cresce.
- Para o `/retro`: a lição registrada no documento vale como regra de processo. Mudança na allowlist se prova com a varredura depois do commit, e literal que imita segredo, dentro do teste da guarda, é montado em tempo de execução.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 08:27:46 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A linha perdoada do convite passa, no commit de verdade e no histórico.
- Um segredo em qualquer outra linha de `apps/api/test/convite.int.test.ts` reprova. A exceção vale para a linha, não para o arquivo.
- A mesma linha colada em outro arquivo reprova. A exceção vale para o arquivo e a linha juntos.
- Um segredo colado antes da linha perdoada, na mesma linha, reprova (âncora `^\s*`).
- O teste da guarda não pode ser, ele mesmo, um achado depois do commit. Esse era o bloqueante da rodada 2.
- Segredo que foi commitado e depois apagado continua reprovando (o caso que já existia).

**Cobertos:**
- **Bloqueante da rodada 2 resolvido.** `linhaPerdoadaDoConvite()` lê a linha do arquivo real (`tools/guardas/gitleaks.int.test.ts:35-41`), então o texto dela não fica mais escrito no teste da guarda. Repeti a simulação: um repositório temporário com `.gitleaks.toml`, o teste da guarda e o teste do convite nos caminhos reais, um commit, e a varredura com `argumentosGitleaks`. Resultado: código 0, `no leaks found`.
- **Âncora provada.** Rodei o caso "colada" duas vezes. Com o `.gitleaks.toml` atual, o código foi 1. Com o `^\s*` tirado das três exceções, o código foi 0. Então o teste da linha 116 falha se a âncora sair.
- **Caso "outro arquivo" (linha 110).** Ele falha se o `AND` virar `OR` ou se o `paths` for alargado.
- **Caso do arquivo com linha na allowlist.** Ele inclui o convite (linha 103).
- **Portão da guarda.** `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts` passou nos 8 testes, sem `.skip` e sem mock. Chama o gitleaks de verdade.
- Os casos de permissão, isolamento e concorrência não se aplicam: a mudança é só configuração de guarda.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tools/guardas/gitleaks.int.test.ts:38`: a checagem de "exceção velha" só procura o trecho `aceitar(deB.token`. Ela não confere se a linha encontrada ainda bate com a regex do `.gitleaks.toml`.
   - O risco: se alguém seguir o "Para não repetir" e passar a senha por constante, a linha muda mas ainda contém o trecho. Os casos das linhas 110 e 116 continuam verdes sem provar mais nada. O 116 reprovaria só pelo token, com ou sem âncora.
   - Duas saídas: conferir que a linha bate com a regex lida do `.gitleaks.toml`, ou tirar a linha do commit `ce0e698` (`git show ce0e698:apps/api/test/convite.int.test.ts`). O commit é o que a exceção existe para perdoar, e o histórico não muda.
   - O documento da correção diz que o teste "avisa se a exceção ficou velha". Hoje isso vale só em parte.
2. Para o `/retro`, reforço o que o documento já registra: uma mudança na allowlist se prova com uma varredura depois de um commit simulado, não com os testes rodando com a mudança ainda fora do commit.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

## privacy-guardian · 4ª rodada · APROVADO · 2026-09-18 09:15:31 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A rodada mexe só na configuração da guarda de segredos e em documentos do processo. O texto perdoado é uma senha sintética de uma conta de teste. Não é dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque não há rota, repository nem query na mudança.

Logs: limpos.

Auditoria: não se aplica.

Envio externo: nenhum.

Seed/fixture: sintético.

**A exceção continua estreita.** Olhei o que muda em `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml:27-31`:
- Continua com `condition = "AND"`. A linha só é perdoada quando o arquivo e o conteúdo batem juntos.
- O novo caminho está preso ao nome exato do arquivo, com `^` no início, `$` no fim e o ponto escapado: `^tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite\.md$`. Não pega nenhum outro arquivo de `tasks/correcoes/`.
- A regex da linha não mudou. Ela exige a linha inteira, do `^\s*` ao `\s*$`, com as duas senhas literais. Outra senha no mesmo documento continua sendo reprovada.
- A linha 25 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md` é exatamente a linha que a regex descreve. A seção nova do documento não repete a linha.

**Onde mais o literal aparece.** Procurei na árvore toda:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md:762`: a correção foi feita, o literal agora é `<senha sintética>`.
- As linhas 659 e 779 do mesmo arquivo trazem só o literal solto, sem o `deB.token, ` antes, que é o que a `generic-api-key` lê como chave. Pela simulação que vocês relataram, elas não disparam.
- As linhas 335 e 336 de `convite.int.test.ts` também não disparam.
- O acréscimo em `achados-revisoes.md` ainda não foi commitado. `git log -S` mostra o literal só em `ce0e698` e `c1bceaa`, nos dois caminhos que agora têm exceção. A varredura do histórico fica coberta.

Bloqueantes: nenhum.

Recomendações:
1. Falta um caso em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts` que prove que a mesma linha continua reprovada em outro documento de `tasks/correcoes/`. Seria o análogo, para documentos, do caso de `apps/api/test/outro.int.test.ts`. Ele travaria quem alargar o `paths` para `tasks/correcoes/.*` no futuro.
2. Proponho levar para a `/retro`: documento de processo e relato de revisor não citam literal que dispara a guarda. Trocar por `<senha sintética>` na hora de escrever evita pedir mais exceções no `.gitleaks.toml`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-18 09:16:17 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

A correção funciona: com a exceção nova, a varredura da esteira passa; sem ela, o documento reprova. Não rodei a suíte.

**Cenários exigidos:**
- (a) A varredura do histórico inteiro, que já contém `c1bceaa`, passa com a config nova.
- (b) A exceção nova é o que faz passar: sem ela, a mesma varredura reprova no documento.
- (c) Nenhum arquivo pendente do próximo commit traz achado novo.
- (d) A exceção continua presa ao arquivo e à linha exatos (`condition = "AND"` e a regex ancorada), sem virar exceção de pasta ou de regra.
- (e) O literal trocado em `achados-revisoes.md` não fica no histórico.

**Cobertos:**
- (a) e (b): rodei a imagem fixada da esteira, `gitleaks:v8.30.1@sha256:c00b6b…`, sobre o repositório de trabalho.
  - Com o `.gitleaks.toml` novo, o histórico dá `no leaks found`.
  - Com o `.gitleaks.toml` de `HEAD`, o mesmo histórico dá `leaks found: 1`, que é a linha 25 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`, gravada em `c1bceaa`.
  - Como a linha já está num commit publicado, reescrever o documento não resolveria. Estender a exceção é a saída certa.
- (c): não consegui repetir a simulação por commit. O hook de processo bloqueou o `git commit` no repositório temporário, porque a árvore leva os dois `.int.test.ts` da outra correção, e eu não quis contornar o hook. No lugar dela, varri no modo `dir` os seis arquivos pendentes: `.gitleaks.toml`, o documento, `achados-revisoes.md`, o documento novo do contador e os dois testes de sessão. Todos deram `no leaks found`. Somado ao histórico limpo, o resultado equivale à sua simulação.
- (d): `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml:26-31` segue o mesmo formato das outras exceções. O segundo caminho é exato e ancorado (`^…\.md$`). A regex de linha não mudou, então o que o teste da guarda já provava continua valendo: a linha perdoada em outro arquivo reprova, e um segredo colado nela também.
- (e): `achados-revisoes.md` não estava em `c1bceaa` (`git show --stat`), então o literal da linha 762 nunca entrou no histórico. A troca por `<senha sintética>` basta. As outras menções ao literal, nas linhas 659 e 779 de `achados-revisoes.md` e na linha 29 do documento, estão em prosa e não reprovam, como mostrou a varredura.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Para o `/retro`: esta é a segunda vez nesta correção que citar a linha perdoada gera achado novo, primeiro no teste da guarda e agora no documento. Vale uma regra de processo: documento de correção e relato de revisor citam uma linha perdoada pelo gitleaks com o literal trocado por um marcador, como foi feito em `achados-revisoes.md`. Assim a lista de caminhos da exceção não cresce a cada documento. Também vale registrar que a simulação precisa levar todos os arquivos do commit, e a seção "Depois do commit" já diz isso.
2. Na simulação de commit, o hook bloqueia quando a árvore traz código de outra correção, como os dois `.int.test.ts` do contador. Varrer o histórico com a config nova e passar os arquivos pendentes no modo `dir`, como fiz, dá o mesmo resultado sem depender do commit. Pode entrar no documento como o jeito de repetir a prova.
