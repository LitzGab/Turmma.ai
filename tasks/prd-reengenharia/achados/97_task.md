# Achados das revisões — `tasks/prd-reengenharia/97_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-22 15:10:59 · `tasks/prd-reengenharia/97_task.md`

VEREDITO: AJUSTES NECESSÁRIOS
Tela vista: sim (49 fotos lidas, cheia e vazia, computador e celular, nas 11 telas da lista).
Estados: ok. A tarefa só move arquivo: o diff de `apps/web/src` tem só linhas de `import`, `vi.mock` e comentário (750 linhas entram, 750 saem), sem lógica nova. Carregando e erro não mudaram. O vazio convida nas fotos (por exemplo "Nenhum material ainda ... Envie o primeiro PDF", "A IA ainda não gerou nada nesta escola").
Acessibilidade: sem mudança. O DOM não foi tocado e as fotos batem com o que a árvore tinha antes.
Chromebook fraco: ok. O diff de `.processo/chunks-antes.txt` contra `.processo/chunks-depois-97.txt` dá 155 linhas nos dois lados.
- **Chunks que viram `tela-<área>-*`:** só os `parte-*` de `api/`. Somem `parte-artefatos`, `atividades`, `entregas`, `material`, `privacidade`, `professores`, `time`, `titulos-dos-materiais` e `vinculos`. Entram `tela-professor-artefatos`, `atividades`, `entregas`, `time`, `titulos-dos-materiais` e `vinculos`, e `tela-coordenacao-material`, `privacidade` e `professores`.
- **Tamanho:** a maior tela fica em 7,1 kB brotli (`ListaDaTurma`), bem abaixo do teto de 30 kB.
- **Pacote de entrada:** `index-*.js` sobe 74 bytes (90880 para 90954); a fachada `professor-*.js` desce 19 bytes. As demais diferenças são de poucos bytes por reordenação.
- **Testes e tipos:** `tools/guardas/tamanho-das-pastas.test.ts` e `apps/web/nome-dos-chunks.test.ts` passam (31 testes). `tsc -p apps/web --noEmit` passa limpo. Não rodei o build nem a unidade inteira da web.
Celular: ok. Sem rolagem horizontal nem corte nas 360 px. Os alvos de toque e a ação principal estão com tamanho adequado nas fotos. A barra inferior sobrepõe o miolo nas fotos de página inteira, o que é efeito da captura com barra fixa e não do código.
Ação oficial protegida: sim, sem mudança. Nenhuma ação oficial foi tocada.

Bloqueantes:
- `docs/aia/adaptacao.md:239`: a linha foi editada nesta tarefa e ficou com o caminho velho. O `entregas.ts` foi corrigido para `areas/professor/artefatos/entregas.ts`, mas a mesma frase ainda cita `apps/web/src/areas/professor/Time.tsx`, que não existe mais. O arquivo está em `apps/web/src/areas/professor/assistente/Time.tsx` (confirmado com `find`, e `docs/pendencias-dos-mockups.md:8` já usa esse caminho). Isso reprova o `grep` do caminho velho que a 97.3 pede e deixa a AIA de adaptação, documento de conformidade, apontando para arquivo inexistente. Correção exigida: trocar por `apps/web/src/areas/professor/assistente/Time.tsx` e repetir o `grep -rnE "areas/(professor|coordenacao)/[A-Za-z0-9_.-]+\.tsx?"` em `docs`, `apps`, `e2e` e `tools`. Fora a linha acima e as ocorrências legítimas de `rotas.tsx`, `Escola.tsx` e `Registros.tsx`, só restam fixtures de teste com caminho inventado (`nome-dos-chunks.test.ts`, `e2e-que-cita-literal.test.ts`, `guardas.test.ts`, `avatar-so-nas-duas-pecas.test.ts`) e as referências históricas da recomendação abaixo.

Recomendações:
- `docs/mvp-rapido.md` (linhas 317 a 322 e 518 a 532) e `docs/pendencias-dos-mockups.md:15` citam `professor/Home.tsx`, `coordenacao/Agentes.tsx` e `professor/Turma.tsx` sem o prefixo `areas/`. Eram caminhos históricos já defasados (`Catalogo.tsx`, `FerramentaForm.tsx`, `abas-turma/`), então não bloqueiam. Vale atualizar junto da correção acima ou deixar como registro datado.
- No celular a aba "Ferramentas" aparece como "FERRAMEN…" na barra inferior da professora, um truncamento que já existia. Vale abreviar o rótulo ou deixar a fonte menor nessa barra, numa tarefa de pele.
- O seed "vazia" da vitrine já traz uma turma e uma professora, então as telas "vazia" de Escola e Professores não exercitam o estado vazio da lista. Esses estados dependem do teste de componente.

Arquivos relevantes (caminhos absolutos):
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/aia/adaptacao.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/.processo/chunks-antes.txt`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/.processo/chunks-depois-97.txt`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/tamanho-das-pastas.test.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 15:12:35 · `tasks/prd-reengenharia/97_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: divergência em `tasks.md` "Tarefa mecânica" (o commit único não está escrito na spec)
Portão local: carimbo válido

**Bloqueantes:**

1. **A divergência do commit único só está nos documentos de tarefa.** Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/97_task.md:105`, coluna "Onde está na spec".
   - **O que a spec manda:** "uma pasta por commit" vem de `tasks.md:41` (seção "Tarefa mecânica", que vale para 10.0, 11.0, 24.0, 33.0 a 36.0, 90.0, 96.0 e 97.0) e de `tasks.md:103` (97.2).
   - **O que a coluna cita não sustenta a divergência:**
     - `onda-2.md` "Como se move" (linhas 50 a 53) não diz quantos commits uma tarefa faz. "Uma tarefa move uma coisa só" não autoriza nem proíbe juntar quinze pastas num commit.
     - `36_task.md` é outro documento de tarefa. É o mesmo caso que a regra proíbe.
   - **Precedente:** na 36.0 o revisor aceitou com o argumento de que "o commit por pasta só existia no próprio `36_task.md`". Isso não confere: a regra está em `tasks.md:41`, e continua lá, valendo para a 96.0 (`tasks.md:192`, `96_task.md:10`) e para a 33.0 e a 34.0.
   - **Correção exigida:**
     - Escrever a regra no `tasks.md`, seção "Tarefa mecânica" (linhas 37 a 42), e na 97.2 (linha 103): um commit por tarefa, com cada arquivo guardado como renomeação, porque o hook exige carimbo e revisão aprovada em todo commit `(tarefa N.0)`.
     - Apontar a coluna para esse trecho.

2. **A subtarefa 97.3 está marcada como feita, mas sobrou um caminho velho num arquivo previsto.** Arquivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/aia/adaptacao.md:239`.
   - A mesma linha foi editada: `entregas.ts` foi corrigido, mas ela ainda cita `apps/web/src/areas/professor/Time.tsx`, que agora é `areas/professor/assistente/Time.tsx`.
   - O `grep` que a própria 97.3 manda rodar acha esse caminho.
   - É a AIA da Adaptação (D60). Ela vai para o dossiê de conformidade e aponta para código que não existe mais.
   - **Correção exigida:** trocar o caminho pelo novo e rodar de novo o `grep -rn "areas/professor\|areas/coordenacao\|web/src/api"` em `docs/`, `apps/`, `e2e/` e `tools/`.

**Recomendações:**

- **`TODO.md`:** itens abertos ainda apontam para caminhos velhos. Quem pegar esses itens vai procurar arquivo que não existe. Atualizar no mesmo commit:
  - linha 905: `areas/coordenacao/convite-de-professor.ts`
  - linha 909: `areas/professor/acesso-da-turma.ts`
  - linha 911: `apps/web/src/api/acesso.ts`
  - linha 1132: `areas/professor/ferramentas.ts`
  - linha 1455: `areas/professor/Home.tsx`
  - linha 1515: `areas/professor/Turmas.tsx`
- **Comentários de e2e:** `e2e/acesso-da-turma.spec.ts:415` (`api/acesso.ts`) e `e2e/professores.spec.ts:309` (`api/professores.ts`) citam a pasta `api/` velha. O padrão do grep da 97.3 não pega essas citações curtas.
- **Diferença dos chunks:**
  - O relatório diz que "só os `parte-*` de `api/` viram `tela-<área>-*`". Não confere com os arquivos.
  - A troca de nome está certa: 9 `parte-*` viraram 9 `tela-*`.
  - Mas o tamanho brotli mudou em quase todos os chunks: `index` +74 bytes, `professor` −19, `tela-professor-Time` −15, `parte-copia-unica` −28.
  - O critério da linha 78 do documento pede tamanho igual, com a diferença explicada.
  - A explicação provável é o nome mais longo dos chunks citados dentro do `index` e a troca de hash, mas ela não está escrita em lugar nenhum.
  - Registrar no `97_task.md`. A conferência fina do build é do `frontend-reviewer`.
- **Contagem de `api/`:** o documento diz 36 arquivos com 21 restantes; o HEAD tem 37 e sobram 22. Ajustar o número na linha 48.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 15:12:58 · `tasks/prd-reengenharia/97_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. A trava conta só a produção. Uma pasta com 26 arquivos de produção reprova e é nomeada, uma com 25 passa. Não contam `.test.ts`/`.test.tsx`, `.d.ts`, nada dentro de `__fixtures__` e nada que não seja `.ts`/`.tsx`.
2. A conta é feita pasta a pasta: subpasta conta sozinha, e não soma na pasta mãe.
3. A lista de exceções é fechada. A pasta listada passa e a outra, do mesmo tamanho, reprova. As raízes são `['apps/web/src']` e as exceções são `[]`.
4. O `apps/web/src` de verdade passa, e a varredura não pode ter ficado vazia: ela precisa alcançar as subpastas novas.
5. Build e chunks: a fachada `professor-*.js` sai do `areas/professor/rotas.tsx`, e as telas saem como `tela-<área>-*`, sem módulo de área fora do lugar.
6. Caracterização: a unidade da web fica igual antes e depois, e a diferença de chunks se resume a `parte-*` virando `tela-<área>-*`.
7. Os testes movidos continuam provando o que provavam: imports, `vi.mock`, `import()` dinâmico e literais de caminho.
8. Isolamento, permissão e concorrência não se aplicam: é só reorganização de pastas na web, sem dado nem endpoint.

**Cobertos:**
- **1 a 3.** Os seis `it` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/tamanho-das-pastas.test.ts` cobrem esses cenários. As 11 mutações sobre esse arquivo estão citadas pelo nome do teste, e o portão as deu como vermelhas (`.processo/portao-97.log:1077-1087`). Cada cláusula de `ehArquivoDeProducao` tem a sua mutação: o filtro de `.ts`/`.tsx`, o `.d.ts`, o `.test.` e o `__fixtures__`. Em `pastasAcimaDoLimite`, também: o `>` contra `>=`, o `dirname` e o filtro de exceções. A recursão de `arquivosDasRaizes` também tem bloco.
- **4.** Coberto pelo `it` "no repositório…". Ele confere que a lista contém `professor/rotas.tsx`, `professor/turmas/Turmas.tsx` e `coordenacao/estrutura/Estrutura.tsx`, e que há mais de 300 arquivos de produção. Rodei o arquivo: 6 de 6 verdes.
- **5.** Coberto por `apps/web/nome-dos-chunks.test.ts › as áreas da escola: uma fachada por papel`, com a mutação 12 (`rotas.tsx` apontando para `inicio/Home`), vermelha no portão. Rodei o arquivo sozinho: 25 de 25 verdes.
- **6.** Antes, `.processo/unidade-web-antes.log` registrava 173 arquivos e 2171 testes. Depois, rodando `--project unidade apps/web`, deu 173 arquivos e 2171 testes: nenhum teste se perdeu. Os nove `parte-*` que viraram `tela-*` são esperados: `artefatos`, `atividades`, `entregas`, `material`, `privacidade`, `professores`, `time`, `titulos-dos-materiais` e `vinculos`. O e2e alvo deu 70 de 70 (`.processo/e2e-97.log`).
- **7.** Confirmado:
  - O único `vi.mock` das áreas, `material/Material.test.tsx:25`, foi corrigido para `../../../api/sessao`.
  - Os `await import()` de `Painel.test.tsx:805` e dos três testes de cliente movidos para `*/api/` resolvem.
  - Os literais de `avatar-so-nas-duas-pecas.test.ts:48,59` apontam para `governanca/`, e a asserção `toContain` falharia com o caminho errado.
  - `icones-de-ferramenta.test.tsx` lê a fonte por `import.meta.dirname` e foi junto com o arquivo.
  - Nenhum teste que varre a árvore ficou passando sem verificar nada por causa de profundidade fixa (procurei por `readdirSync`, `startsWith('areas/')` e regex de um nível).
  - Os caminhos `areas/professor/X.ts` que ainda restam em `nome-dos-chunks.test.ts` e `e2e-que-cita-literal.test.ts` são projetos de mentira, não a árvore real.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Ordenação sem teste.** Em `tools/guardas/tamanho-das-pastas.test.ts:45`, se o `.sort(...)` sair, nenhum teste fica vermelho: nenhum caso tem duas pastas acima do teto. É ordem de mensagem, não regra do documento. Vale um caso com duas pastas grandes em ordem invertida, ou tirar o `sort`.
2. **Testes do build sem prazo próprio.** Em `apps/web/nome-dos-chunks.test.ts:301` e `:323`, os dois testes do build de verdade usam o prazo padrão de 5000 ms. Na minha rodada de `--project unidade apps/web` os dois estouraram o prazo (um levou 16,7 s), com os outros revisores rodando ao mesmo tempo; sozinho, o arquivo passa em 3,75 s. O problema já existia antes desta tarefa. Mas a linha 3 da tabela e a mutação 12 dependem desse teste, e um vermelho por estouro de prazo não se distingue do vermelho pela regra. Destino sugerido: uma linha no `TODO.md`, ou a próxima tarefa que mexer no arquivo, com prazo explícito no `it` ou no `describe`.
3. **Caracterização sem a explicação escrita.** A linha 4 da tabela pede chunks "iguais… e explicada". A comparação entre `.processo/chunks-antes-97.txt` e `.processo/chunks-depois-97.txt` mostra a troca esperada de `parte-*` por `tela-*`, mas também pequenas variações de brotli: `index` subiu 74 B e `professor` desceu 19 B, entre outras. A explicação não está escrita no `97_task.md`. Vale uma linha dizendo de onde vêm, provavelmente da mudança nos caminhos e nos nomes dos chunks dentro dos bundles.
4. **Mutação 4 prova só a lista literal.** Ela é pega pelo `toEqual([])` do teste literal, no molde de `guardas.test.ts`, e isso basta para a lista fechada. O efeito da exceção já está provado à parte pela mutação 10.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 15:20:43 · `tasks/prd-reengenharia/97_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos oito da 1ª rodada. A trava conta só arquivo de produção, com o teto de 25. A conta é pasta a pasta. A lista de exceções é fechada. O `apps/web/src` real passa, e a varredura alcança as subpastas novas. A fachada e as telas saem com os nomes certos no build. Os chunks são caracterizados antes e depois. Os testes que foram movidos continuam provando o que provavam. Isolamento, permissão e concorrência não se aplicam: a tarefa só move pasta. A recomendação 1 desta rodada pedia mais um caso: duas pastas acima do teto chegando fora de ordem.

**Cobertos:**
- **Recomendação 1, feita.** O caso novo está em `tools/guardas/tamanho-das-pastas.test.ts:96-102`: "várias pastas acima do teto saem em ordem de pasta, qualquer que seja a ordem em que os arquivos chegam".
  - Os arquivos chegam com `y` antes de `x`, então o `Map` de `pastasAcimaDoLimite` guarda primeiro a `y`. Sem o `.sort` da linha 45, a saída seria `[y, x]`, e o `toEqual([x, y])` falha. O teste cai pela cláusula certa.
  - A mutação nova (`- .sort((a, b) => a.pasta.localeCompare(b.pasta))`) cita o caso por um pedaço do nome. O `tools/processo/mutacoes.ts:180` passa esse pedaço ao `-t` do vitest, que busca por substring. Antes de mutar, o portão roda o caso limpo, e isso garante que o nome acha o teste (linhas 193-230).
  - Tirar a linha não quebra a sintaxe: a cadeia termina no `.map(...)`.
  - Rodei o arquivo: 7 de 7 verdes.
- **Recomendação 2:** foi para o `TODO.md` (linhas 1666-1669 do diff), com o arquivo, os dois casos e a correção que falta: prazo explícito no `it`.
- **Recomendação 3:** a explicação da diferença de chunks está escrita no `97_task.md`. São os nove `parte-*` que viraram `tela-<área>-*` e a variação de brotli, que vem dos nomes de chunk embutidos no código e da ordem dos módulos. Os números conferem com os que os revisores mediram: `index` +74 B, `professor` −19 B.
- **Recomendação 4:** recusada, com motivo, na tabela de recomendações. Basta.
- **O resto do diff** não muda o que os testes provam. São só caminhos em `TODO.md` e em `docs/aia/adaptacao.md:239` (bloqueante do `frontend-reviewer` e do `revisor-geral`, já corrigido), a regra do commit único escrita em `tasks.md` "Tarefa mecânica" e na 97.2, e a contagem de `api/` (37 e 22).

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A do prazo nos testes do build de `apps/web/nome-dos-chunks.test.ts` continua valendo e já está no `TODO.md`.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/tamanho-das-pastas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/97_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/.processo/ordens/diff-97_task-r2.txt`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 15:20:48 · `tasks/prd-reengenharia/97_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum. As duas correções da 1ª rodada foram feitas:
1. A regra do commit único agora está na spec. Ela entrou na seção "Tarefa mecânica" do `tasks.md` ("a tarefa fecha em um commit só, com cada arquivo guardado como renomeação") e na subtarefa 97.2 (`tasks.md:105`). A coluna "Onde está na spec" do `97_task.md` aponta para esse trecho.
2. `docs/aia/adaptacao.md:239` cita agora `apps/web/src/areas/professor/assistente/Time.tsx`. Rodei de novo `grep -rn "areas/professor\|areas/coordenacao\|web/src/api"` em `docs/`, `apps/`, `e2e/` e `tools/`. Sobram só três tipos de linha: caminhos atuais (`rotas.tsx`, `Escola.tsx`, `Registros.tsx`, `navegacao.ts` e os comentários já trocados para as subpastas), fixtures com caminho inventado (`nome-dos-chunks.test.ts`, `e2e-que-cita-literal.test.ts`, `guardas.test.ts`, `avatar-so-nas-duas-pecas.test.ts`, `__fixtures__/kit-importa-api.ts`) e o registro antigo de `docs/mvp-rapido.md:317-322`, que a tarefa recusou com motivo.

As recomendações que a ordem mandou aplicar também foram feitas:
- O `TODO.md` aponta os seis caminhos novos.
- A diferença de brotli está explicada no `97_task.md`.
- A contagem de `api/` foi corrigida para 37 e 22.
- O `sort` ganhou um caso no teste, com mutação declarada.
- Os dois comentários de e2e e o prazo do teste do build foram para o `TODO.md` com motivo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/tasks.md:194` diz, na 96.2, "uma pasta por commit". `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/96_task.md:10` diz o mesmo ("script, uma pasta por commit"). Os dois contradizem a regra geral que esta correção escreveu em "Tarefa mecânica". A 96.0 ainda não começou, então isso não bloqueia a 97.0. Vale alinhar o texto da 96.2 e do `96_task.md` antes de ela partir, para que a próxima revisão não reprove pela mesma divergência.
