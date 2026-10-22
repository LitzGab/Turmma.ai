# Achados das revisões — `tasks/prd-reengenharia/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 18:07:52 · `tasks/prd-reengenharia/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum
Recomendações:
- A ordem dos imports não é a mesma em todos os arquivos. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/operacao/entrada.service.ts:7-8`, `origem-da-requisicao.js` vem antes de `identificadores-do-login.js`. Em `segundo-fator.service.ts:15-16`, `sessao.service.ts:6-7` e `renovacao.service.ts:16-17` é o contrário. O lint não reclama. Vale deixar todos na mesma ordem quando a 34.0 mexer nessa pasta.
- O teste "nenhuma linha export" em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/login.service.test.ts:12-18` só pega linhas que começam com `export` na coluna 0. Um `export` indentado ou quebrado em várias linhas escaparia. A 12.0 traz a trava definitiva com o depcruise. Até lá, o `describe` provisório do `arquitetura.test.ts` cobre o caso da reexportação vinda de outro arquivo, mas não um `export type { ... }` do próprio `login.service.ts` quebrado em várias linhas.

O que conferi:
- **Os dois ciclos sumiram.** Fora de teste, só `login-email.controller.ts` e `sessao.module.ts` importam `login.service`. O `conclusao-de-login.ts` e o `convite.service.ts` não importam mais esse arquivo, e o `login.service.ts` não reexporta nenhum dos sete nomes.
- **O código saiu sem mudar de comportamento.** `etapaDoLogin`, `ipParaRegistro`, `normalizarEmail`, `hashDoRefresh`, `IP_NAO_LIDO` e `BYTES_DO_REFRESH` estão iguais ao original. O `etapaDoLogin` foi para `conclusao-de-login.ts`, como pede a `onda-1a.md` §2, T7.
- **As duas divergências estão registradas fora do `11_task.md`.** A falta do commit próprio da 11.1 está em `tasks.md`, "Tarefa mecânica", que manda fechar em um commit só. O `describe` provisório está na `onda-1a.md` T7, "A trava (12.0)".
- **A tarefa não invade a 12.0 nem a 34.0.** Não há depcruise novo nem subpasta nova.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 18:10:13 · `tasks/prd-reengenharia/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta é uma tarefa mecânica. Sete nomes saem de `login.service.ts` e vão para `origem-da-requisicao.ts`, `identificadores-do-login.ts` e `conclusao-de-login.ts`, sem nenhuma consulta nova. Por isso caminho feliz, casos de borda do domínio, permissão, isolamento e concorrência se reduzem a uma coisa: o login se comporta igual antes e depois. Os cenários que importam são:
1. O valor de `normalizarEmail` não muda, inclusive com espaço nas pontas e com locale turco.
2. O hash do refresh continua SHA-256 em hex, com 32 bytes, para que a sessão já gravada continue sendo achada.
3. `ipParaRegistro` troca o IP desconhecido por `0.0.0.0` e deixa o IP lido passar igual, IPv4 e IPv6.
4. `etapaDoLogin` dá o mesmo resultado nos quatro casos: professor, coordenador sem o segundo fator cumprido, coordenador com ele cumprido, e mais de um vínculo.
5. `login.service.ts` não reexporta nenhum dos sete nomes, nem valor, nem tipo, nem `export *`.
6. Só o controller e o módulo importam o `login.service`, e os dois ciclos somem.
7. A integração de login por e-mail, matrícula, externa, MFA, renovação e troca de escola segue verde.

**Cobertos:** todas as linhas da tabela de testes têm o seu teste, citado pelo nome.
- Linha 1, `identificadores-do-login.test.ts › o e-mail sai sem espaço nas pontas e em minúsculas, como a conta citext o compara`. O caso `INES@` faz a mutação para o turco falhar de fato.
- Linha 2, `identificadores-do-login.test.ts › o refresh vira SHA-256 em hex…`.
- Linha 3, `origem-da-requisicao.test.ts › o endereço que não foi lido vira o não roteável, e o lido passa igual`. O valor `'0.0.0.0'` está escrito no teste, então a mutação da constante também quebra.
- Linha 4, os quatro `it` de `conclusao-de-login.test.ts`, e as quatro mutações chegam à cláusula certa.
- Linha 5, `login.service.test.ts › o módulo só exporta o LoginService` (pelo `Object.keys`) e `› nenhuma linha export do arquivo cita um dos sete nomes…`, que pega os tipos e o `export *`.
- Linha 6, `arquitetura.test.ts › fora de teste, só o login-email.controller.ts e o sessao.module.ts o importam`, com `toEqual`. O par `› a varredura reprova quem mais o importa…` prova a varredura: as mutações em `deTeste`, `semComentarios`, na regex e no `.sort()` ficam todas vermelhas pelo motivo certo.
- Linha 7, os seis arquivos de integração da tabela. Rodei e estão verdes: 104 testes. Rodei também os arquivos alterados que a tabela não cita (`saida`, `convite`, `entrada-operador`, `sessao-operador`, `segundo-fator-operador`), e estão verdes: 75 testes. Os 5 arquivos de unidade da tarefa deram 74 testes verdes.
- Não há `.skip`, nem mock, nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Imports sem bloco de mutação.** Sete arquivos trocaram o caminho do import e não têm bloco: `renovacao`, `matricula`, `saida`, `mfa`, `troca-de-escola`, `operacao/entrada` e `operacao/segundo-fator`. O documento só traz blocos para quatro importadores. Não é bloqueante: troca de import não é cláusula, e a varredura com `toEqual` pega qualquer um deles da mesma forma. Até o `import type` de `troca-de-escola` bate na regex. Para o documento ficar completo, falta um bloco para cada um.
- **Brecha no teste dos tipos.** `login.service.test.ts:12-17` lê o arquivo linha por linha, e por isso não pega uma reexportação de tipo escrita em várias linhas (`export type {\n  OrigemDaRequisicao,\n} from …`). Vale juntar as linhas antes de testar, ou testar a regex contra o texto inteiro.
- **Regex de `arquitetura.test.ts:1432` (`/\blogin\.service\.js['"]/`).**
  - Ela casaria um arquivo futuro com outro prefixo, como `outro-login.service.js`.
  - Ela deixaria passar um import sem extensão. Esse segundo caso só vale se a resolução de módulos do `tsconfig` não exigir o `.js`.
  - Como é provisória até a 12.0, basta registrar a brecha para o depcruise.
- **Texto da tabela.** A linha 1 cita `' Ana@Escola.COM '`, mas o teste usa `'  Camila@Escola.Invalid '` e `'INES@ESCOLA.INVALID'`. O teste é melhor; vale alinhar a tabela a ele.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/11_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/login.service.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/identificadores-do-login.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/origem-da-requisicao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/conclusao-de-login.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/arquitetura.test.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 18:16:17 · `tasks/prd-reengenharia/11_task.md`

VEREDITO: APROVADO

Cenários exigidos (para esta rodada, só o diff desde a 1ª):
- O teste dos tipos de `login.service.test.ts` precisa pegar uma reexportação de tipo escrita em várias linhas, que a versão linha a linha deixava passar.
- Os dois blocos de mutação desse teste precisam citar o nome novo do caso.
- O terceiro bloco de mutação precisa provar a reexportação em várias linhas.
- A troca da ordem dos imports em `operacao/entrada.service.ts` não pode mudar comportamento.

Cobertos:
- **Várias linhas.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/login.service.test.ts:14-18`, o teste agora tira os comentários do arquivo e procura as exportações no texto inteiro, não linha a linha. Isso pega:
  - `export type { OrigemDaRequisicao, }` escrito em várias linhas, que a versão antiga não via porque a linha `export type {` sozinha não tem nome nenhum;
  - `export *`;
  - declarações exportadas.

  O caso `expect(exportacoes.length).toBeGreaterThan(0)` continua lá e impede que o teste passe por não achar nada (a declaração `export class LoginService`, na linha 62, conta). Tirar os comentários antes evita falso vermelho nas JSDoc do arquivo (linhas 18, 29, 32, 127, 144, 155). Nenhuma string do arquivo tem `//` ou `/*` que essa limpeza pudesse cortar por engano.
- **Tipo não aparece em `Object.keys`.** Por isso o primeiro caso não pega `export type`, e o segundo é o único que prova essa cláusula. A mutação nova, em `tasks/prd-reengenharia/11_task.md` (seção Mutações, bloco de `export type {` em várias linhas), cai nele e fica vermelha pelo motivo certo.
- **Nomes dos casos.** Os dois blocos de mutação de `login.service.ts` que citam o segundo caso usam o nome novo, igual ao do `it` na linha 13. O bloco do primeiro caso continua citando "o módulo só exporta o LoginService", que não mudou.
- **Imports de `entrada.service.ts`.** É só a ordem das duas linhas, sem efeito no comportamento.
- **Rodei o teste:** `npx vitest run apps/api/src/sessao/login.service.test.ts`, 2 passed. Rodado de dentro de `apps/api` com `--root`, ele quebra porque não acha o `@educa/nucleo`; é questão da configuração do vitest, não do teste.
- Nenhum `.skip`, nenhum teste comentado, nenhum mock.

Bloqueantes: nenhum.

Recomendações:
- `login.service.test.ts:16`: a expressão regular não pega `export default <nome>` nem `export = <nome>`. Nenhum dos dois aparece hoje, e o primeiro caso (`Object.keys`) pegaria o `export default` de valor. Fica como cobertura extra, se a varredura for reaproveitada até a 12.0.
- `login.service.test.ts:18`: o filtro `/^export\s+\*/` repete o que a expressão regular já separa. Poderia ser um caso à parte, com nome próprio, para o vermelho dizer qual foi a forma de reexportação.
