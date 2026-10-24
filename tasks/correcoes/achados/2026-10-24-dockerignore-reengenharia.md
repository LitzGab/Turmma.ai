# Achados das revisões — `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 02:41:38 · `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não muda nada no runtime; a correção só tira uma linha do contexto de build)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não há operação nova)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/dockerfile.test.ts:131`: a asserção `.not.toContain('.reengenharia')` só serve para a citação antiga não voltar. Se alguém recriar a pasta localmente, ela entra no contexto de build sem que nenhum teste perceba. Isso não afeta a manhã de segunda. Quando a lista de pastas ignoradas for revista, vale trocar a proibição de um nome que já não existe por uma checagem do que importa: o contexto de build não deve levar pasta de processo nem de documento.

Conferi três coisas:
- `.reengenharia` não existe mais no checkout.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.dockerignore` continua ignorando `mockups`, `.processo`, `docs`, `tasks` e `**/.env*`.
- Rodei `tools/ci/dockerfile.test.ts` e os 9 testes passaram.

Fora de `docs`, `tasks` e dos `.md`, a palavra "reengenharia" ainda aparece em comentários, em fixtures e no caminho `tasks/prd-reengenharia/`. Nenhuma dessas ocorrências é a pasta apagada, nem Dockerfile, compose ou CI.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 02:41:44 · `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção, sem seção própria na techspec. Ela cumpre o que o item "(X5, RF31)" do `TODO.md` pede e o ensaio da linha 176 de `tasks/prd-harness/tasks.md`.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- A linha 10 do `.dockerignore` era mesmo `.reengenharia` e saiu.
- A pasta não existe no disco.
- `git grep` não acha outra citação a `.reengenharia` como pasta em código, Dockerfile ou CI. As que sobram são `tasks/prd-reengenharia/`, que é outra coisa, e uma menção histórica na linha 343 do `ROADMAP.md`, que aponta a tag `reengenharia/temporario` e está certa.
- O teste pede só `mockups` e `.processo`. Antes da correção a asserção negativa falhava, porque a linha estava no arquivo. Esse vermelho de antes é a prova de que o teste pega o defeito, como o documento declara.
- O item do `TODO.md` ficou `[x]` com a nota da correção.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-dockerignore-reengenharia.md` está `AM`. A versão no índice ainda tem `<preenchida no passo 4>` na seção "Correção" e não tem a seção "Ensaio do RF31". É preciso dar `git add` de novo antes do commit, senão entra o documento incompleto.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/dockerfile.test.ts:130`: a asserção negativa protege contra a volta de uma linha que, se voltasse, não faria mal nenhum, porque ignora uma pasta que não existe. Ela custa pouco e cumpre o objetivo declarado ("para a citação não voltar"). Só não vale repetir esse padrão para todo nome removido.
- A seção "Ensaio do RF31" do documento registra a recusa do commit pelo `/usr/bin/git`. O critério da linha 176 de `tasks/prd-harness/tasks.md` pede esse registro no `estado.md` do andar, e ele ainda precisa ir para lá no fechamento.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 02:41:49 · `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: o `.dockerignore` continua ignorando `mockups` e `.processo`, para o build não levar o que a imagem não usa.
- Regressão do defeito: `.reengenharia` não volta ao `.dockerignore`, nem ao teste que obrigava a mantê-la.
- Borda: a mesma pasta escrita de outro jeito no `.dockerignore` (`.reengenharia/`, `/.reengenharia`, com espaço no fim ou com CRLF).
- Não se aplicam: permissão, isolamento entre escolas, concorrência e IA. A correção é de configuração do build, sem dado de escola, sem rota e sem chamada a provedor.

**Cobertos:**
- Caminho feliz: `tools/ci/dockerfile.test.ts:130`, que exige `mockups` e `.processo` na lista.
- Regressão: `tools/ci/dockerfile.test.ts:131`, `expect(ignorados, …).not.toContain('.reengenharia')`.
  - Conferi o vermelho de antes pelo diff: o `.dockerignore` antigo tinha a linha `.reengenharia` (linha 10), então a nova asserção de ausência falharia, como o documento diz.
  - Se a linha voltar, o teste quebra. A asserção é sobre o conteúdo do arquivo, não sobre o teste ter rodado.
- `npx vitest run tools/ci/dockerfile.test.ts`: 9 de 9 passam, sem `.skip`, sem teste comentado e sem mock.
- Não há bloco de mutação, e a falta não bloqueia: a correção não mexe em `apps/*/src` nem em `packages/*/src`. O documento justifica isso (regra 40, RF17) e apoia a prova no vermelho de antes, o que basta aqui.
- A tabela de testes do documento tem uma linha só, e o teste citado existe com o nome exato: "o contexto de build fica fora do que a imagem não usa: mockups e .processo".
- Procurei outros usos: nenhum outro arquivo de código, teste ou ferramenta cita a pasta `.reengenharia`. As outras ocorrências de "reengenharia" falam de `tasks/prd-reengenharia/`, da tag `reengenharia/temporario` ou da branch `spec/reengenharia--l2`, não da pasta apagada.
- O item "(X5, RF31)" do `TODO.md` ficou marcado `[x]`, com a nota da correção.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tools/ci/dockerfile.test.ts:128`: o `split('\n')` não apara as linhas nem tira o `/` do começo e do fim. Assim, `.reengenharia/`, `/.reengenharia`, `.reengenharia ` ou uma linha com `\r` passariam pela asserção de ausência, e as mesmas variações de `mockups` e `.processo` fariam o caso positivo falhar sem defeito real. Normalizar com `.map(l => l.trim().replace(/^\/|\/$/g, ''))` fecha as duas pontas.
- O nome do caso diz só o que fica ignorado. Uma menção curta à ausência de `.reengenharia` ajudaria quem lê o relatório, mas a mensagem da própria asserção já explica o motivo (R64).

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-dockerignore-reengenharia.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.dockerignore
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/dockerfile.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/TODO.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 02:47:35 · `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caso positivo: `mockups` e `.processo` estão no `.dockerignore`.
- Caso negativo: `.reengenharia` não volta para o arquivo depois do fechamento da X5 (R64).
- A comparação aceita sem erro as variações de escrita que a correção pediu: espaço sobrando, `\r` no fim da linha e `/` no começo ou no fim.

**Cobertos:**
- A correção exigida está feita em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/dockerfile.test.ts:129-131`. As linhas passam por `trim()` e `replace(/^\/|\/$/g, '')` antes das asserções.
- No caso negativo, `.reengenharia/`, `/.reengenharia`, `.reengenharia ` e uma linha com `\r` agora ficam iguais a `.reengenharia`, e o `not.toContain` falha como deve.
- No caso positivo, as mesmas variações de `mockups` e `.processo` não dão mais falso vermelho.
- Comentário (`# mockups`) e negação (`!mockups`) seguem sem contar como pasta ignorada, porque a normalização não tira `#` nem `!`. O comportamento está correto.
- O `.dockerignore` atual tem `mockups` na linha 8 e `.processo` na linha 9, sem `.reengenharia`.
- `npx vitest run tools/ci/dockerfile.test.ts` passou: 9 de 9 casos, sem `.skip`, sem mock.
- A seção nova "Recomendações sem aplicar" no documento da tarefa é só texto e não muda o que os testes provam.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tools/ci/dockerfile.test.ts:133`: a asserção de ausência ainda deixa passar `.reengenharia` escrita com curinga, como `**/.reengenharia` ou `.reengenharia/**`. Ela também aceitaria a pasta coberta por um curinga mais largo. Se a intenção da R64 é que nenhuma linha mencione a pasta, troque por uma checagem como `ignorados.some((l) => l.includes('.reengenharia'))` igual a `false`. O texto atual do arquivo não tem esse risco, então isso é só cobertura extra.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 02:47:46 · `tasks/correcoes/2026-10-24-dockerignore-reengenharia.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de uso, e o documento cita a origem (`TODO.md` "(X5, RF31)"); não há seção de Tech Spec a seguir.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

Conferi as duas correções que pedi na 1ª rodada:
- O documento da correção está só no índice (`A`) e a versão no índice é a de agora, com a tabela "Recomendações sem aplicar".
- A sugestão do test-engineer foi aplicada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/dockerfile.test.ts:128-130`. O `.trim()` e o regex `/^\/|\/$/g` tiram espaços e a barra do começo ou do fim de cada linha. Assim, `mockups/` e `/.processo` também contam como presentes, e a checagem de que `.reengenharia` não volta continua valendo para essas grafias. O `.dockerignore` atual passa sem precisar dessa normalização.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-24-dockerignore-reengenharia.md:58`: a tabela diz que a sugestão do infra-guardian vai para o `TODO.md`, mas o `TODO.md` ainda não tem esse item. A mudança nele só marca "(X5, RF31)" como `[x]` (linhas 1785-1789), e a busca por "contexto de build" e "pastas ignoradas" não acha nada. Do jeito que está, o documento indica um destino que não existe. Antes do commit, escreva o item no `TODO.md`, com dono e momento, ou troque o destino na tabela por quem vai registrá-lo (o Orquestrador no fechamento, se for ele).
- A normalização só cobre a barra no começo ou no fim. Uma linha como `mockups/**` não seria reconhecida como `mockups` e faria o teste acusar falta, então ele erra para o lado seguro. Não pede mudança agora; serve de nota para quando a lista de pastas ignoradas for revista, junto com a sugestão do infra-guardian.
