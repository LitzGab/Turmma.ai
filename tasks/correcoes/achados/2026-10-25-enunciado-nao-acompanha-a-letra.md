# Achados das revisões — `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 16:34:26 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO
Tela vista: não. A tela alterada é a questão aberta, e a escola sintética da vitrine não tem tarefa "Para fazer", então ela não pôde ser fotografada. Li a foto da lista em 360 px (`.processo/vitrine/aluno--aluno-atividades--celular.png`). A lista não foi alterada e está sem defeito visível. Revisei o enunciado pelo código e pelo e2e. Não rodei o e2e.
Estados: ok. A correção muda só uma unidade de fonte e não toca em carregando, vazio, erro ou com dado.
Acessibilidade: ok. O enunciado agora acompanha o tamanho da letra escolhido em Ajustes, o que ajuda quem precisa de letra maior. O `<h2>` mantém `tabIndex={-1}`, o foco e o `sr-only` do número da questão. O e2e escolhe "Maior" pelo diálogo de verdade (rádio, teclado `Escape`), não por atalho.
Chromebook fraco: sem impacto. A mudança é só de classe CSS, e não há lista nova nem imagem.
Celular: ok. O e2e roda com `hasTouch` e usa `acionar`. O enunciado já tem `min-w-0` e `break-words`, então a letra a 21,25 px não deve gerar rolagem horizontal. O caso "a tarefa aberta" do mesmo arquivo já mede a ausência de rolagem.
Ação oficial protegida: sim (não se aplica). A correção não mexe em nota, aprovação ou exportação.

Bloqueantes: nenhum.

- `apps/web/src/areas/aluno/Atividade.tsx:174`: `text-[17px]` virou `text-[1.0625rem]`. São os mesmos 17 px no Padrão, e agora o `font-size` do `<html>` o escala (112,5 % e 125 %). 17 × 1,25 = 21,25. Uma busca por `text-[Npx]` em `apps/web/src/areas/aluno` fora dos testes não achou nenhuma outra ocorrência de px absoluto, então não sobrou o mesmo defeito em outra tela. O ramo `fonte_ampliada` (`text-2xl`) já era `rem` e não mudou.
- `e2e/tamanho-da-letra.spec.ts:244-273`: o teste mede o `font-size` calculado do enunciado no Padrão (17) e em Maior (21,25), com a escolha feita pelo diálogo. Os helpers usados existem no arquivo. O texto "Qual é a massa molar da água" confere com a fixture `e2e/__fixtures__/aluno.ts:209`. A mutação declarada na correção devolve `17px` e faz o teste falhar em Maior (21,25 contra 17), então ele prova a regra.

Recomendações:
- O teste cobre só Padrão e Maior; Grande (19,125 px) ficou de fora para caber no prazo. Se sobrar tempo, vale reincluir, pois é o valor que expôs o defeito na primeira versão do caso.
- Quando houver uma tarefa "Para fazer" na escola sintética da vitrine, fotografar a questão aberta em Maior, a 360 px, para confirmar sem rolagem e sem corte.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 16:34:35 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff não toca schema, repository, job, seed, importação nem webhook. Todos com autor humano? Sim, porque nenhum caminho é criado ou alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou. O resultado da objetiva continua com a assinatura da função e o selo "IA", em `apps/web/src/areas/aluno/Atividade.tsx:285-292`, e essa parte ficou intocada.
Supervisão do tutor: ok, o tutor não é tocado.
Autonomia declarada e visível: sim, nada mudou na governança.

Bloqueantes: nenhum.

O que foi auditado:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx:174`: a única mudança é `text-[17px]` passar a `text-[1.0625rem]` no enunciado da questão. É uma mudança só de tipografia, para o enunciado acompanhar o tamanho de letra que o aluno escolheu. O ramo da adaptação `fonte_ampliada` (linha 110) continua igual. Ele só lê o tipo de adaptação já registrado e não guarda nem mostra diagnóstico (D35).
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/tamanho-da-letra.spec.ts:244-273`: o teste novo mede o `font-size` calculado do enunciado. Ele não cria tela, campo ou dado que mostre nota, conceito ou sugestão de nota (D55), e não toca em indicador de aluno ou de professor.
- Supervisão e vigilância (itens 7 e 9): a preferência de letra é ajuste de acessibilidade escolhido pelo aluno. Não gera métrica, não é medida e não chega ao professor nem à coordenação.
- D59: nada aqui induz uso, e o diálogo de Ajustes continua fechando com Escape, como o próprio teste prova.
- `docs/regulacao.md`: não foi alterado e não precisava ser.

O prompt não trouxe fotos da tela, então não houve conferência visual.

Recomendações: nenhuma na minha regra. O caso cobre só a letra Maior. A falta de cobertura da letra Grande fica com o `test-engineer`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 16:34:42 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO

Escopo: respeitado. A correção troca uma classe em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx:174` e acrescenta um caso no e2e. Não mexe em mais nada.

Aderência à Tech Spec: ok. A seção 5 da `techspec.md` (linhas 94 e 95) diz que o texto acompanha a letra quando está em `rem`. Por isso o `17px` era o defeito e o `1.0625rem` cumpre a regra, sem divergência para registrar.

Portão local: carimbo válido. O portão aceitou typecheck, lint, segredo, dependências, unidade e alvo, e a mutação declarada, que volta o `17px`, foi provada por ele.

Bloqueantes: nenhum.

Recomendações:
- `Atividade.tsx:174`: o `text-[1.0625rem]` é um valor solto que repete o tamanho da classe `.t-corpo` de `estilos.css`, que a 8.0 já passou para `rem`. Usar `t-corpo`, se a altura de linha dela servir ao enunciado, evita ter dois jeitos de escrever o mesmo tamanho de corpo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/tamanho-da-letra.spec.ts:256-262`: o caso abre a tarefa com `pushState` e `popstate`, e não pela lista de atividades como a pessoa faria. O título diz "pela escolha de verdade" e isso vale para a letra, não para a navegação. Vale dizer isso no título ou abrir a tarefa pela lista, se couber na metade do prazo.
- O caso só mede a letra Maior. A Grande (19,125 px) ficou sem medida depois que o caso foi enxugado. Se a mutação passar a usar outro valor fixo, o `toBe(21.25)` continua pegando, então a Grande é cobertura extra, não buraco.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 16:35:09 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: com a letra Maior, o enunciado da tarefa aberta cresce junto (21,25 px = 1,0625 × 20).
- Sem regressão no Padrão: o enunciado continua em 17 px. A troca de `px` para `rem` não pode mudar a tela de quem não mexeu na letra.
- Caso de borda, Grande (18 px no `<html>`): o enunciado deveria ficar em 19,125 px.
- Caso de borda, o ramo `fonte_ampliada` (`text-2xl`): já era `rem` e esta correção não o toca.
- Caso de borda, a escolha feita de verdade pelo diálogo, e não semeada pelo `addInitScript`: é o caminho em que a letra se aplica depois que a tela já montou.
- Permissão: a letra é só do aluno, e professora e coordenação não a herdam. Já está coberto nos casos existentes do mesmo arquivo (linhas 185 e 192). A correção não muda isso.
- Isolamento: não se aplica. A mudança é só de classe CSS, sem dado de escola, rota, repository ou API.
- Concorrência: não se aplica. Não há operação que possa acontecer duas vezes ao mesmo tempo.

Cobertos:
- Padrão e Maior, pela escolha real: `e2e/tamanho-da-letra.spec.ts:244`, caso "o enunciado da tarefa aberta acompanha a letra: 17 px no Padrão e 21,25 px com Maior, pela escolha de verdade". Ele mede o `font-size` calculado do enunciado (linhas 264 e 272). Isso é asserção sobre o que a pessoa vê, e não só sobre a tela ter aberto.
- O teste falha sem a regra. A mutação do documento devolve `text-[17px]`, e então Maior mede 17 em vez de 21,25: o vermelho vem da cláusula certa. O bloco cobre a única linha de produção do diff (`apps/web/src/areas/aluno/Atividade.tsx:174`), e o portão já o provou. Sem `.skip`, sem teste comentado, sem mock que esconda a regra (o `simularAluno` só finge a API, e o que se mede é o CSS de verdade). O texto do enunciado que o filtro usa existe na amostra (`e2e/__fixtures__/aluno.ts:209`).
- O teste da seção "Teste que reproduz" está citado pelo nome. O documento não tem tabela de testes com outras linhas a conferir.
- Não rodei o e2e: ele precisa da pilha no ar, e a mutação já foi provada pelo portão.

Bloqueantes: nenhum.

Recomendações:
1. **Grande ficou sem medida.** O caso foi enxugado para caber na metade do prazo, e a medida de Grande saiu. Um caso curto separado, com Grande guardado pelo `guardarAntesDeCarregar` e esperando 19,125 px, cobriria esse caminho sem estourar o prazo. Isso prova também o caminho em que a letra já está aplicada quando a tela monta.
2. **Possível instabilidade na medida (`e2e/tamanho-da-letra.spec.ts:264` e `:272`).** A medida é lida uma vez só, enquanto o próprio arquivo usa `expect.poll` para esperar a letra se aplicar depois do clique (linha 98). Hoje dá certo porque a navegação de ida e volta deixa tempo de sobra. Para não depender disso, use `await expect.poll(tamanhoDoEnunciado).toBe(21.25)`, ou confira `letraDaPagina` com poll antes de medir.
3. **O mesmo defeito existe em outros pontos, e o documento diz "Fora desta correção: Nada".** Há tamanhos de letra em `px` em componentes que aparecem nas telas do aluno (a área do aluno usa esses componentes em `Tutor.tsx`, `Inicio.tsx`, `Atividade.tsx` e `rotas.tsx`):
   - `apps/web/src/componentes/ui/Toque.tsx:39` (`text-[15px]`)
   - `apps/web/src/componentes/ui/Aviso.tsx:54` (`text-[15px] leading-[21px]`)
   - `apps/web/src/componentes/ui/ia/AssinaturaIA.tsx:34`
   - `apps/web/src/componentes/ui/onca/Onca.tsx:124`
   - `apps/web/src/componentes/meus-dados/MeusDados.tsx:217` (`text-[22px]`)
   - `apps/web/src/componentes/MenuDaPessoa.tsx:64`

   Eles não crescem com Grande nem com Maior. O conserto não cabe nesta correção, mas vale registrar como achado para uma correção própria. Melhor ainda se vier com uma guarda que recuse `text-[Npx]` nas telas do aluno.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/areas/aluno/Atividade.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/tamanho-da-letra.spec.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 16:49:43 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO

Cenários exigidos: o enunciado mede 17 px no Padrão (caminho feliz); o enunciado acompanha a letra Maior escolhida no diálogo, com 21,25 px; o caso falha quando o enunciado volta a `text-[17px]` (mutação). Permissão e isolamento não se aplicam: a mudança é só de classe CSS numa tela do próprio aluno e não toca dado de escola nem endpoint.

Cobertos:
- Nesta rodada só o teste mudou: `e2e/tamanho-da-letra.spec.ts:244-273`. `Atividade.tsx` está igual à rodada 1.
- As duas trocas para `expect.poll` estão nas linhas 264 e 272 e não enfraquecem a asserção. `tamanhoDoEnunciado` devolve o `font-size` calculado como número, e `toBe(17)` e `toBe(21.25)` seguem exatos. O poll só espera a folha de estilo se aplicar depois da troca de letra, o que tira a corrida sem afrouxar o valor. Quando o valor já está certo, ele responde na hora e não pesa no prazo do caso.
- A mutação ainda fica vermelha pelo motivo certo. Com `text-[17px]`, o Padrão continua dando 17 e passa. O caso cai em Maior, com 17 no lugar de 21,25, quando acaba o tempo do poll. Ou seja, quebra exatamente na cláusula que a correção protege.
- O título novo está citado inteiro no documento (`tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md:26`). O `teste:` da mutação (linha 38) é um prefixo do título e ainda o encontra.
- Não há `.skip`, teste comentado nem mock escondendo a regra, e o teste não usa IA. Concorrência não se aplica.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/achados/2026-10-25-enunciado-nao-acompanha-a-letra.md:79` ainda cita o título antigo do caso ("... com Maior, pela escolha de verdade"). Vale alinhar com o título novo, para quem procurar pelo nome na validação ou na retro.
- As recomendações recusadas na rodada 1 (medir também a Grande e a guarda contra `text-[Npx]` nas telas do aluno) estão registradas com destino no documento. Ficam para a validação.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 16:50:13 · `tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Esta rodada mudou só o título do caso e as duas medidas em `e2e/tamanho-da-letra.spec.ts`. `Atividade.tsx` não mudou.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

Conferência das recomendações da 1ª rodada (não havia correção exigida, só recomendação):
- **Medida com `expect.poll`:** aplicada nas duas medidas, Padrão e Maior (`e2e/tamanho-da-letra.spec.ts:264` e `:272`). O caso já esperava o enunciado aparecer antes de medir. Agora a medida também espera o estilo chegar ao valor, em vez de ler uma vez só.
- **Título do caso:** aplicado (`:244`). O título novo diz o que o caso faz: escolhe a letra no diálogo e abre a tarefa pelo endereço. A seção "Teste que reproduz" do documento usa o mesmo título (`tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md:26`).

Recomendações:
- **Duas linhas da tabela "Recomendações sem aplicar" apontam para o `TODO.md`, e a linha ainda não está lá** (`tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md:49-50`). O `TODO.md` não está entre os arquivos alterados. O template (`.claude/skills/criar-tasks/task-template.md:163-165`) diz que o destino `TODO.md` "é a linha já escrita no `TODO.md`, no commit da tarefa, e não promessa". O commit ainda não aconteceu, então a regra ainda não foi quebrada. Mas o commit precisa levar as duas linhas:
  - **Linha 50:** os outros `text-[Npx]` na área do aluno (`Toque.tsx:39`, `Aviso.tsx:54`, `ui/ia/AssinaturaIA.tsx:34`, `ui/onca/Onca.tsx:124`, `meus-dados/MeusDados.tsx:217`, `MenuDaPessoa.tsx:64`) e a guarda que recuse `text-[Npx]` nas telas do aluno. Nada disso está no `TODO.md` hoje.
  - **Linha 49:** a foto da questão aberta em Maior, a 360 px. Pode entrar junto na linha que já existe sobre a vitrine semear atividade aplicada (`TODO.md:139-142`), em vez de virar linha nova.
- **Uma frase do documento confunde quem lê** (linha 28). Ela diz que o vermelho do caso atual "é o da mutação abaixo, que devolve `17px`". Fica mais claro dizer que a mutação volta o enunciado para `text-[17px]` e que `toBe(21.25)` então recebe 17.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/tamanho-da-letra.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-enunciado-nao-acompanha-a-letra.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md`
