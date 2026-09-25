# Achados das revisões — `tasks/correcoes/2026-09-25-l4-depende-do-tamanho-do-banco.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 07:51:34 · `tasks/correcoes/2026-09-25-l4-depende-do-tamanho-do-banco.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **L4:** cada um dos sete estados da E6 aparece uma única vez em `GET /v1/operacao/escolas`, com o mesmo estado que o lado da escrita calcula e com o `conviteId` do último convite. Depois de um refazer, a escola mostra o convite refeito, e não a origem revogada.
- **Determinismo:** o teste não pode depender de quantas escolas e redes o banco de teste guarda.
- **Redes:** a rede criada aparece nas 200 primeiras, só com id, nome e tipo, e a lista para em 200.
- **Não mudou:** o limite de 120 pedidos por minuto do operador, que é regra de produção.
- **Conferidos e não corrigidos:** I4, I5, L1 a L3 e `apps/worker/test/uso.int.test.ts`.

**Cobertos**
- **As asserções do L4 continuam as mesmas** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:803-833`).
  - `naLista` exige `toHaveLength(1)`. Escola que não esteja na página 1 deixa o teste vermelho, então ele não passa por vazio.
  - O estado é comparado com a E6 e com `estadoDe` (o `ConviteRepository`), e o `conviteId` com o da escrita.
  - A escola refeita tem de mostrar `refeito.conviteId`.
- **Força contra mutação, conferida no código.** A página 1 com `ordem=nome` passa pelo mesmo `select` de estado e convite que a ordem por uso (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:138-161`).
  - Com o último convite por `expira_em asc`, a escola refeita mostra a origem e o teste fica vermelho.
  - Sem o `desativado_em is null`, o estado diverge da E6 e o teste fica vermelho.
  - A unicidade entre páginas e o `total` saíram do L4. Continuam no L3, que ainda percorre a lista inteira. Não houve perda.
- **Ordem por nome determinística.** Conferi no banco local de teste:
  - O collation é `en_US.utf8`. Há 3.297 escolas, e nenhum nome de escola ou de rede começa por caractere que não seja letra, fora do esquema de 13 dígitos.
  - Todos os nomes do esquema têm 13 dígitos de largura fixa. Por isso a comparação de texto é numérica, e o nome de agora vem antes dos antigos.
  - O e2e usa a mesma fórmula (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts:156`). O nome dele é mais antigo e cai depois.
  - Os oito do L4 têm o mesmo nome e desempatam por `e.id`. Cabem nas 25 da página.
- **Nenhum criador concorrente.** Nenhum outro processo cria nomes com dígito no começo enquanto o L4 roda:
  - A integração usa `fileParallelism: false`.
  - O `infra` é outro projeto e não usa o esquema.
  - O portão local roda test e e2e em sequência.
  - Na esteira, cada job tem o próprio compose.
- **O relógio 73 h atrás do `vencido` é injetado no caso de uso**, sem fake timers. O `Date.now()` do nome é o real.
- **Rodei os dois testes no banco acumulado (3.297 escolas):** `2 passed`, em 4,5 s, sem recriar volume.
- **O teste de redes** usa o mesmo esquema e mantém a asserção `toStrictEqual({ id, nome, tipo })` e o corte em 200.
- **O limite do operador não foi tocado.** Nenhum arquivo de produção mudou.
- **O julgamento de não corrigir os outros está certo.**
  - I4, I5 e L1 a L3 sobem a API com o limite folgado, e o L3 precisa da varredura pelo próprio cenário.
  - O `uso.int.test.ts` não é defeito de teste: aponta um defeito de produção no processador (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:67-70`). Uma pasta órfã no storage para a consolidação de todas as escolas. O conserto precisa de correção própria, com o `infra-guardian`, e não cabe nesta, que é só de teste.
- **Nada proibido:** sem `.skip`, sem teste comentado, sem mock de coisa nossa, sem provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Registrar o defeito do worker fora deste documento, antes do commit.** Pode ser um arquivo próprio em `tasks/correcoes/` ou uma linha no `TODO.md`. Hoje ele só existe no corpo desta correção, e por `grep` não aparece em nenhum outro lugar. O defeito fere a regra 80, item 3 (uma escola não degrada outra), e é fácil de perder.
2. **Anotar no comentário de `nomeQueVemPrimeiro` as duas premissas do determinismo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-de-teste.ts:96-104`):
   - Nenhuma outra escrita no mesmo esquema pode acontecer em paralelo durante o teste. Hoje isso vale porque a integração roda um arquivo por vez.
   - Nenhum teste pode criar nome que comece por pontuação seguida de dígito. No `en_US.utf8` a pontuação é ignorada no primeiro nível, e esse nome viria antes.
3. **A mesma função está duplicada** em `apps/api/test/painel-de-teste.ts` e em `e2e/__fixtures__/painel.ts`. Um helper único em `tools/testes/` evita que as duas regras se separem sem ninguém ver.
4. **Para o `/retro`:** o custo do L3 e do I4/I5 cresce com o banco, e mais que linear na ordem por uso. Isso já está registrado no documento. Vale também a lição para a tarefa 8.0 (Uso), escrita no fim da correção.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 07:58:56 · `tasks/correcoes/2026-09-25-l4-depende-do-tamanho-do-banco.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só testes; `git diff --stat HEAD -- apps packages` mostra apenas quatro arquivos em `apps/api/test/`)
Rate limit: ok. O limite de produção não mudou. `LIMITE_REQ_OPERADOR_MIN` continua validado em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/limitador.ts:43`, e o teste também não contorna o limite: a suíte do L4 sobe a API sem mudar o ambiente (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:214`, `subirApiDoPainel(linhasDeLog)`), com os 120/min. O L4 agora faz uma leitura só (`?pagina=1&ordem=nome`), mais os poucos pedidos de gerar e refazer das oito escolas. O número de pedidos não depende mais do tamanho do banco. As oito escolas cabem na página de 25 (`ESCOLAS_POR_PAGINA`), e `ordem=nome` existe no contrato (`packages/shared/src/operacao/painel.ts:180`).
Fila e prioridade: não se aplica a esta correção
Concorrência: protegida (nada mudou)
Índice e paginação: ok (nada mudou)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica a esta correção
Bloqueantes: nenhum

Recomendações:
1. **Registrar o defeito do worker como correção própria, antes deste commit**, com `infra-guardian` obrigatório. O diagnóstico do documento procede, e o defeito fere a regra 80, item 3: uma escola não degrada outra. Hoje ele só existe no corpo desta correção.
   - Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:67-70`, o laço sobre `storage.listarEscolas()` não isola a falha por escola. O primeiro `gravarDia` com uma escola inexistente leva o 23503 da FK e derruba a rotina inteira. A fila tenta de novo e falha do mesmo jeito, e o storage de todas as escolas deixa de ser medido.
   - O documento só descreve o laço do storage. O laço dos contadores do Redis (`consolidar-uso.ts:54-64`) tem a mesma forma: um contador órfão de escola eliminada para a consolidação dos contadores das escolas que vêm depois dele.
   - A correção exigida lá: tratar a falha escola por escola nos dois laços. A escola inexistente é pulada e registrada por id, com uma métrica tipo `uso.consolidacao.escola_ignorada{motivo}` e um alerta com o parágrafo do runbook. E um teste de integração em que uma pasta órfã e um contador órfão não impedem a consolidação das outras escolas.
2. Anotar no comentário de `nomeQueVemPrimeiro` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-de-teste.ts:96-104`) as duas premissas de que o determinismo depende:
   - a integração roda um arquivo por vez (`fileParallelism: false`);
   - nenhum nome começa por pontuação seguida de dígito, porque no `en_US.utf8` a pontuação é ignorada no primeiro nível da ordenação e esse nome passaria na frente.
3. Unificar `nomeQueVemPrimeiro` com `nomeDeRedeQueVemPrimeiro` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts:156`) num helper só, para as duas cópias não se separarem sem ninguém ver.
4. Para o `/retro`: o custo do L3, do I4 e do I5 cresce com o banco acumulado, e na ordem por uso cresce mais que linear. Na tarefa 8.0 (Uso), o teste acha as escolas dele numa página determinística, sem varrer a lista.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 07:59:08 · `tasks/correcoes/2026-09-25-l4-depende-do-tamanho-do-banco.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma nova. A correção não traz migration e não muda nada em `apps/api/src` nem em `packages` (conferido com `git diff --stat HEAD -- apps/api/src packages`, sem saída).

Queries verificadas:
- `PainelRepository.escolas` e `escolasDaPagina` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.repository.ts:85-161`) não mudaram. A ordem por nome desempata pelo `e.id`. O último convite sai de `c.escola_id = e.id and c.tipo = 'coordenador'`, com o convidado preso a `convidado.escola_id = c.escola_id`. O `@SemEscopo` continua com a justificativa escrita.
- `PainelRepository.redes` (linha 121) não mudou.

Teste de isolamento: presente e efetivo.
- **A prova de que cada linha traz o estado e o convite da própria escola (L4) não enfraqueceu.** As oito escolas do teste têm agora o mesmo nome, e as asserções procuram cada uma pelo `id`. Ficam de pé três conferências por linha:
  - o estado bate com o da E6;
  - o estado bate com o `estadoDe(escolaId)`, que lê pelo `ConviteRepository`;
  - o `conviteId` é o da própria escola.
- A escola refeita mostra o convite refeito. Como o nome é igual nas oito, a correlação só pode vir do `escola_id`.
- **Tirando mentalmente a cláusula, o teste quebra.** Sem `c.escola_id = e.id` no lateral, as linhas passam a mostrar um convite que não é da escola e a asserção do `conviteId` falha. Sem `coordenador.escola_id = e.id` ou sem `desativado_em is null`, o estado `pendente` aparece como `ativa`. Ler só a página 1 não tira força da prova, porque o lateral é calculado linha a linha e as oito escolas estão todas nessa página: são 8 contra 25 por página, e o prefixo decrescente do nome põe as escolas deste teste antes de todas as das execuções anteriores.
- **I4 e I5 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-leitura.int.test.ts`) ficaram fora do diff.** Continuam percorrendo a lista inteira com `todasAsPaginas`, com `LIMITE_REQ_OPERADOR_MIN=100000` na linha 34, e o I5 também percorre pelo service nas linhas 392-393. A prova de isolamento deles segue como estava.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:817`: o L4 supõe que nenhuma outra suíte cria, ao mesmo tempo, escola com nome que venha antes. Hoje só o L4 usa `nomeQueVemPrimeiro` para escola, então essa suposição vale. Vale deixar isso num comentário para a tarefa 8.0, que vai reusar o esquema, para que duas suítes não disputem a mesma página 1.
- O I5 e o L3 varrem a lista inteira, e o custo cresce com o tamanho do banco, sobretudo na ordem por uso. A própria correção já registrou isso para o `/retro`. Mantenho só como registro.
