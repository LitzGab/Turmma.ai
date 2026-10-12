# Achados das revisões — `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-12 12:51:30 · `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

VEREDITO: REPROVADO

Escopo: incompleto

Aderência à Tech Spec: ok. É uma correção de teste e não tem seção de Tech Spec. O que fica de fora (os sintomas 3 e 4) está declarado em "Devolvido sem corrigir".

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes:

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/entrar-na-escola.spec.ts:172`
  - **O que está errado:** a linha `for (const proibido of ['429', 'CONTA_SEGURADA', 'Retry-After']) await expect(page.locator('body')).not.toContainText(proibido)` ainda procura o código como substring no `body`.
  - **Por que é o mesmo defeito:** a página `/e/<slug>` mostra o nome da escola no título (a linha 69 do mesmo spec espera `getByRole('heading', { name: aluno.escolaNome })`). Esse nome vem de `Colégio sintético ${marca.slice(0, 8)}` (`e2e/__fixtures__/sessao.ts:149`). É o mesmo defeito que a correção diz resolver, com a mesma chance de um nome trazer "429" por acaso.
  - **Por que é subtarefa não feita:** o documento afirma que "os onze specs com a guarda de código numérico de erro passam a usá-la", e este spec ficou de fora.
  - **Correção exigida:** trocar `'429'` por `codigoCru('429')` (com o import de `./__fixtures__/verificacoes.ts`) e incluir `entrar-na-escola` na lista da seção "Correção" do documento.

Recomendações:

- **Dois specs ainda usam a substring.** São `e2e/casca.spec.ts:164` (`'500'`, `'429'` em `/sistema`) e `e2e/entrar.spec.ts:404` (`'429'` em `/entrar`). Hoje essas telas parecem não mostrar nome sintético, mas convertê-los deixaria um jeito só de fazer a guarda. Se ficarem como estão, a frase do documento sobre "os specs com a guarda" precisa dizer por quê.
- **A nova expressão tem um furo que nenhum teste cobre.** `(?<![0-9a-f])` deixa de acusar o código cru logo depois de um elemento cujo texto termina em `a` a `f` minúsculo. Em português isso é comum (por exemplo `<p>Tente mais tarde</p><p>503</p>`, que o `textContent` vira `tarde503`).
  - As páginas de prova cobrem só "Erro 503", que tem espaço antes.
  - Saídas possíveis: restringir a exceção ao formato do nome sintético (o código dentro de uma sequência de 8 hexadecimais) em vez de a qualquer vizinho hexadecimal, ou acrescentar ao `guardas.spec.ts` uma página com o código colado depois de texto que termina em vogal `a` ou `e`.
  - Fica na área do `test-engineer`; aqui é só recomendação.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-12 12:51:50 · `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. A correção só toca `e2e/` e `tasks/`, nenhuma tela mudou, e o prompt dispensa a foto. Revisei o diff completo (14 arquivos) e rodei o caso novo, que passa nos projetos `chromebook` e `celular` (`npx playwright test e2e/guardas.spec.ts --grep "código cru"`).

Estados: não se aplica, nenhuma tela mudou.

Acessibilidade: não se aplica. A correção preserva a guarda da regra 50, item 12 (erro diz o que fazer, não o código), e a deixa mais exata.

Chromebook fraco: não se aplica. O caso novo usa `page.setContent` e leva cerca de 0,1 s.

Celular: o caso novo roda nos dois projetos, e os 11 specs alterados continuam sendo executados em `chromebook` e `celular`.

Ação oficial protegida: não se aplica, nenhuma ação oficial foi tocada.

**O que está certo**
- **A regex.** `(?<![0-9a-f])CODIGO(?![0-9a-f])` resolve o defeito: em oito caracteres hexadecimais, um código de três dígitos sempre tem vizinho hexadecimal. O erro real vem entre espaço, pontuação ou o texto do botão colado ("Erro 503Tentar de novo").
- **Os quatro nomes da fixture.** Cada um prova um vizinho sozinho: `fa5030ac` e `a2503562` (hexadecimal dos dois lados), `503a1c9d` (só o vizinho de trás é não hexadecimal) e `9fe1c503` (só o da frente).
- **As duas páginas com erro de verdade** continuam acusadas, e a asserção positiva (`toContainText('503')`) prova que a substring ainda acusa os nomes.
- **As cinco mutações.** Conferi uma a uma contra as páginas e todas caem no caso. O filtro `--grep` do portão casa por substring do nome do caso.
- **Os 14 usos novos.** Substituem só a string numérica, e as guardas em maiúsculas (`INDISPONIVEL`, `TUTOR_PAUSADO` etc.) ficam como estavam, o que é correto.
- **Escopo.** Nenhum arquivo de produção, `tools/`, `.github/` ou `.claude/` mudou.

**Bloqueantes**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/entrar-na-escola.spec.ts:172`: o defeito corrigido continua vivo neste ponto.
   - **O que está errado.** O arquivo ficou fora da correção. O laço `for (const proibido of ['429', 'CONTA_SEGURADA', 'Retry-After']) … not.toContainText(proibido)` ainda é substring.
   - **Por que a tela mostra um nome hexadecimal.** Aqui a tela é `/e/${enzo.slug}`, onde `EntrarNaEscola` usa o nome da escola como título (`apps/web/src/paginas/EntrarNaEscola.tsx:45`). Esse nome vem de `Colégio sintético ${marca.slice(0, 8)}` (`e2e/__fixtures__/sessao.ts:149`). O próprio spec confirma, na linha 69, que o `heading` é `aluno.escolaNome`.
   - **Efeito.** Um nome com `429` reprova o teste sem erro nenhum na tela, com a mesma probabilidade de cerca de 0,15% por execução e por projeto.
   - **Correção exigida.** Importar `codigoCru` de `./__fixtures__/verificacoes.ts` e trocar `'429'` por `codigoCru('429')`, no mesmo modelo dos outros specs. A guarda prova o resto, e o texto da correção diz que todos os pontos com código numérico passam a usá-la.

**Recomendações**
- Os três pontos abaixo não têm nome sintético na tela hoje, então não reprovam. Vale trocar para `codigoCru` pelo mesmo motivo, para a guarda ser uma só e não depender de "esta tela não tem nome":
  - `e2e/casca.spec.ts:164` (`'500'`, `'429'`, em `/sistema`);
  - `e2e/entrar.spec.ts:404` (`'429'`, em `/entrar`);
  - `e2e/entrar-convite-revogado.spec.ts:52` (`/NAO_ENCONTRADO|404/`, em `/entrar`).
- Deixar uma trava contra a volta do problema, para a próxima asserção com código numérico literal não repetir o erro. Pode ser uma checagem de unidade ou de lint que reprove `not.toContainText('<três dígitos>')` em `e2e/`, com a exceção de `guardas.spec.ts`. A busca por substring é o que fez o defeito se espalhar por 16 pontos.
- A guarda deixa de ver um código cru colado a uma letra minúscula de a a f ("503de novo"). Os botões de hoje começam em maiúscula, então o risco é baixo, mas o limite merece a nota na docstring de `codigoCru` (`e2e/__fixtures__/verificacoes.ts:57`).
- O texto da correção ("onze specs") fica impreciso depois do ajuste do bloqueante. Atualizar a contagem junto.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-12 12:51:57 · `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: o nome sintético com "503" (de `marca.slice(0, 8)`) não aciona a guarda.
- Borda 1: o código no meio do nome, com vizinho hexadecimal dos dois lados (`fa5030ac`, `a2503562`, os dois da esteira).
- Borda 2: o código no começo do nome, com espaço antes (`503a1c9d`).
- Borda 3: o código no fim do nome, colado ao botão seguinte (`9fe1c503Sair`).
- O erro de verdade continua acusado, em linha própria (`Erro 503`) e colado ao botão (`Erro 503Tentar de novo`).
- Todas as guardas de código numérico em tela com nome sintético passam a usar `codigoCru`.
- Permissão, isolamento e concorrência não se aplicam: a mudança é só no harness de e2e.

**Cobertos:**
- `e2e/guardas.spec.ts:46-59` cobre o caminho feliz, as três bordas e os dois casos de erro de verdade, nos dois projetos.
- A precondição `toContainText('503')` prova que a página reproduz o defeito.
- As cinco mutações do documento atacam cada cláusula nova de `codigoCru` (`e2e/__fixtures__/verificacoes.ts:67`):
  - Tirar o lookbehind faz `9fe1c503Sair` casar.
  - Tirar o lookahead faz `503a1c9d` casar.
  - Lookahead só com dígito faz `503a1c9d` casar.
  - Lookbehind só com dígito faz `9fe1c503` casar.
  - Lookahead com `[0-9A-Za-z]` deixa de ver `503Tentar`.
- Todas caem pelo motivo certo. Não há `.skip`, mock nem provedor de IA.

**Bloqueantes:**
- `e2e/entrar-na-escola.spec.ts:172`: `for (const proibido of ['429', 'CONTA_SEGURADA', 'Retry-After']) await expect(page.locator('body')).not.toContainText(proibido)` ficou com a substring.
  - É o mesmo defeito da correção. A página `/e/<slug>` mostra o nome da escola no título (a linha 69 do mesmo spec afirma `heading { name: aluno.escolaNome }`). Esse nome é `Colégio sintético ${marca.slice(0, 8)}` (`e2e/__fixtures__/sessao.ts:149`), então "429" no hexadecimal reprova o teste sem erro na tela, com a mesma chance de cerca de 0,15% por nome.
  - O documento diz, na seção Correção, que todos os specs com a guarda de código numérico passam a usá-la, e este ficou de fora: a intermitência continua na esteira.
  - Correção exigida: trocar `'429'` por `codigoCru('429')` nessa linha e incluir `entrar-na-escola` na lista de specs do documento.

**Recomendações:**
- Trocar também por consistência, sem reprovar por isso, as outras duas guardas que ainda usam substring. Nenhuma mostra nome hexadecimal hoje:
  - `e2e/casca.spec.ts:164` (`'500'`, `'429'`): em `/sistema`, deslogado, com o estado em erro. Se um dia a versão aparecer junto ao erro, um hash de commit tem o mesmo problema.
  - `e2e/entrar.spec.ts:404` (`'429'`): em `/entrar`, deslogado.
- `codigoCru` tem uma perda declarada, que vale registrar no comentário da função: o erro de verdade colado a uma letra minúscula de a a f deixa de ser acusado. Exemplos: "rede503" depois de um rótulo terminado em "e", ou "503 de" sem espaço. Uma alternativa mais precisa é excluir só o "503" dentro de uma sequência de exatamente oito caracteres hexadecimais precedida de espaço, o formato do nome sintético, em vez de qualquer vizinho hexadecimal.
- O item 3 de "Devolvido sem corrigir" (`aluno-fluxo.spec.ts:199`) traz uma pergunta de produto (D36 e D38) e mostra uma lacuna de teste: nenhum teste de integração fixa se o encaminhamento do assunto delicado gasta uma das 60 trocas do dia. Isso deve virar pendência explícita para o Arquiteto, além de ficar no documento da correção.
- O item 4 (`estrutura.spec.ts:732`) é um teste que só passa com folga de máquina, de 12 a 14 s em 90. Segundo a regra deste revisor, isso é bloqueante quando estiver em escopo. Aqui foi devolvido por pedido do Orquestrador, mas precisa de correção própria logo, porque a esteira continua vermelha por ele.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/entrar-na-escola.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/__fixtures__/verificacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/guardas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/casca.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/entrar.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-12 13:07:47 · `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O nome sintético com "503" (`fa5030ac`, `a2503562`, `503a1c9d`, `9fe1c503`) não aciona a guarda.
- O código cru de verdade continua sendo acusado, tanto em linha própria ("Erro 503") quanto colado ao botão ("Erro 503Tentar de novo").
- Todas as guardas de código numérico do e2e usam a expressão nova, sem nenhuma substring sobrando.

**Cobertos:**
- **A correção da 1ª rodada foi feita.** Em `e2e/entrar-na-escola.spec.ts:172`, `'429'` virou `codigoCru('429')`, e o documento inclui `entrar-na-escola` na lista.
- **A busca saiu completa.** Ela achou e corrigiu as mesmas guardas com substring em mais três arquivos:
  - `e2e/entrar.spec.ts:404`, com o `429`;
  - `e2e/casca.spec.ts:164`, com o `500` e o `429`;
  - `e2e/entrar-convite-revogado.spec.ts:52`, onde a regex `/NAO_ENCONTRADO|404/` virou um laço com `codigoCru('404')`.
- **Nenhuma guarda ficou com substring.** Procurei no `e2e/` inteiro por `'4xx'`/`'5xx'` entre aspas e por regex com código; a única ocorrência crua é a de propósito, em `e2e/guardas.spec.ts:51`. A conta do documento bate: 21 usos de `codigoCru` em 20 linhas de 15 specs.
- **As guardas de texto em maiúsculas não precisam da expressão.** `CONTA_SEGURADA`, `NAO_ENCONTRADO` e `Retry-After` têm maiúsculas e hífen, que um nome hexadecimal minúsculo não traz.
- **O caso de `guardas.spec.ts:46-58` faz asserção sobre o resultado nos dois sentidos.** A substring acusa o nome sintético e `codigoCru` não acusa; as duas páginas com erro de verdade continuam acusadas. As cinco mutações cortam ou afrouxam cada vizinho da expressão, e o portão da tarefa já as provou. `codigoCru` e o caso não mudaram desde a 1ª rodada.
- **Não há `.skip`, teste comentado, mock nem chamada a IA.** O helper é usado como `RegExp` dentro do `not.toContainText` do Playwright.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/__fixtures__/verificacoes.ts`: o `codigo` entra na `RegExp` sem escape. Com os códigos numéricos de hoje não faz diferença, mas restringir o parâmetro a `` `${number}` `` (ou validar `/^\d{3}$/`) impede que alguém passe `'IA_INDISPONIVEL'` ou um texto com metacaractere achando que a vizinhança protege.
- A docstring nova assume o ponto cego: código colado a minúscula de `a` a `f` ou a dígito. Fica para o `/retro`: se um botão ou aviso em minúscula vier logo depois de um erro, a guarda precisa de outra forma, e não de afrouxamento.

Os casos 3 e 4 (`aluno-fluxo.spec.ts` e `estrutura.spec.ts`) foram devolvidos sem corrigir, por pedido do Orquestrador, e não entraram nesta auditoria. O 3 tem uma pergunta de produto aberta (D36, D38): o encaminhamento de assunto delicado gasta ou não uma troca do dia.

Não alterei nenhum arquivo e não rodei o e2e.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-12 13:08:02 · `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só em teste: nenhum código de produção, nada em `tools/`, `.github/` ou `.claude/`.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As correções que exigi na rodada anterior foram feitas:
- **O spec que tinha ficado de fora:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/entrar-na-escola.spec.ts:172` usa agora `codigoCru('429')`, com o import na linha 6. Ele também entrou na lista da seção "Correção" do documento.
- **Os outros pontos da ordem também foram aplicados:**
  - `casca.spec.ts:164` usa `codigoCru` para o `500` e para o `429`.
  - `entrar.spec.ts:404` usa `codigoCru('429')`.
  - `entrar-convite-revogado.spec.ts:52` trocou a regex por um laço, com o `NAO_ENCONTRADO` como texto e o 404 por `codigoCru('404')`.
  - A docstring de `codigoCru` agora diz o que a guarda deixa de ver.
- **Contagem do documento:** bate com a árvore. São 21 usos de `codigoCru` em 20 linhas de 15 specs.
- **Guardas por substring que sobraram:** procurei no `e2e/` e não há nenhuma guarda que ainda busque código numérico como substring. A única ocorrência é `estrutura.spec.ts:718` (`'Matrícula 880004'`), que não é guarda de código de erro.
- **Mutações:** as cinco de "Mutações" continuam batendo com as páginas de `paginas.ts`. Cada uma derruba uma das afirmações do caso em `guardas.spec.ts`.

Sobre a seção "Recomendações sem aplicar", que ainda não existe no documento: isso não é bloqueante agora. Pelo `.claude/skills/executar-task/SKILL.md:268`, o Implementador copia a tabela para essa seção só depois do RELATÓRIO "APROVADO por todos". Os destinos que a tabela aponta são `TODO.md`, e ele também ainda não foi alterado. Os dois ficam para esse passo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/__fixtures__/verificacoes.ts:59`: a docstring diz "(`503`, `409`, `429`)", mas o helper agora também é usado com `404` e `500`. Vale citar todos os cinco ou dizer "código HTTP de três dígitos".
- Ao fechar a correção, copiar a tabela de "Sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/.processo/ordens/2026-10-12-codigo-cru-no-nome-sintetico-r1.md` para o documento. Junto com isso, registrar no `TODO.md` a trava contra `not.toContainText('<três dígitos>')` e a regex presa ao formato do nome sintético, como a Mesa decidiu.
