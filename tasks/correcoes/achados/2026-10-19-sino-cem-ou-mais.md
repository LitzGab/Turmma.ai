# Achados das revisões — `tasks/correcoes/2026-10-19-sino-cem-ou-mais.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 16:45:00 · `tasks/correcoes/2026-10-19-sino-cem-ou-mais.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: sino e painel, computador e celular, escola cheia e vazia). A vitrine tem só uma entrega esperando, então o estado "100 ou mais" não aparece nas fotos. Esse estado eu revisei pelo código e pelos testes.
Estados: ok. Os quatro continuam no `Sino`.
- Carregando, erro, parcial e em dia mantêm o nome do botão de antes.
- O painel vazio ("Tudo em dia", "Nada espera a sua decisão agora.") convida e não pede desculpa.
- Sem item, o nome do botão não vira "0 ou mais". Em `Sino.tsx` ele continua dizendo "parte não carregou" ou "não carregou".
- O aviso de leitura parcial do painel foi mantido com 100 entregas e `proxima`. O teste em `SinoDoProfessor.test.tsx` confere isso.
Acessibilidade: ok.
- O nome do botão vem do `aria-label` ("Esperando você, 100 ou mais"), e a leitura bate com o que se vê.
- O "+" da pílula fica em `aria-hidden`. O texto escondido (`sr-only`) diz "ou mais", então o leitor de tela não ouve "100 mais".
- O contraste e a cor da pílula não mudaram (`text-sobre-cor` na família laranja).
- A pílula continua sem animação ao mudar o número (D59).
Chromebook fraco: sem impacto. A mudança é uma prop booleana e um `span`, sem leitura nova, sem nova renderização pesada e sem tentativa nova de rede.
Celular: ok.
- Nas fotos de 360 px não há rolagem horizontal nem corte no cabeçalho. O sino, o "SAIR" e o título (que trunca com reticências) cabem.
- O botão do sino e os alvos de toque não mudaram.
- A pílula "100+" tem um caractere a mais que o "1" das fotos. Ela tem `min-w-6` e `px-2`, e o título trunca, então o cabeçalho não deve quebrar. Isso não está nas fotos.
Ação oficial protegida: sim. A correção só muda o rótulo de leitura do sino. Nenhuma aprovação ou publicação é feita por ele.
Bloqueantes: nenhum.

Recomendações:
- Quando a vitrine puder semear mais de 100 entregas, fotografar o sino em 360 px com a pílula "100+". Hoje só o teste jsdom cobre isso, e ele não mede largura.
- O texto escondido da pílula começa por "ou mais" e o `aria-label` do botão diz o mesmo. Isso é coerente. Mantenha os dois em sincronia se o texto do botão mudar um dia.
- O Sino da coordenação tem o mesmo limite de página cheia? A correção deixou `ouMais` falso por padrão e a Tech Spec cita só o sino do professor. Vale uma linha no `/validar` para conferir se a coordenação tem a mesma borda.

Arquivos principais, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2`:
- `apps/web/src/componentes/sino/Sino.tsx`
- `apps/web/src/componentes/Contador.tsx`
- `apps/web/src/areas/professor/fila-do-professor.ts`
- `apps/web/src/areas/professor/SinoDoProfessor.tsx`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 16:45:00 · `tasks/correcoes/2026-10-19-sino-cem-ou-mais.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A §5 da `techspec.md` agora diz o que o PRD §7 pede ("Esperando você, 100 ou mais", pílula "100+"). Ela também fixa o caso sem item lido e os nomes `haMais` e `ouMais`. A spec não tem `cenarios.md`. A correção alinha o código ao PRD e não cria divergência.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
1. Agora há dois jeitos de dizer "ou mais" na mesma pílula. O item de pedidos de nome passa o "ou mais" pelo `oQueConta` (`apps/web/src/areas/professor/fila-do-professor.ts:119`, `'ou mais pedidos de nome'`). Esse texto chega ao `Contador` em `apps/web/src/componentes/sino/Sino.tsx:114`, que não passa `ouMais`. O resultado é que a pílula do item de pedidos mostra "100" sem o "+", enquanto a do botão mostra "100+". Convém usar o `ouMais` novo do `Contador` também nos pedidos, levando `item.haMais`, e tirar o "ou mais" do texto. Assim a regra fica num lugar só.
2. Há outras situações em que o número do botão também é só o que se leu, e o "ou mais" não aparece. São elas:
   - página de vínculos com outra depois (`!vinculos.completa`);
   - turma além do teto de 12 sem contagem lida;
   - contagem de pedidos que falhou.

   Nesses casos o botão diz "Esperando você, N" com o aviso de leitura parcial. Isso cumpre o que a Tech Spec já escrevia ("a contagem de uma lista parcial é a do que se leu"), e o PRD só promete o "ou mais" para mais de 100 entregas. Por isso não bloqueia. Vale decidir na próxima revisão do sino se toda fila `parcial` com item deve dizer "ou mais", porque hoje o critério é só o das entregas.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/correcoes/2026-10-19-sino-cem-ou-mais.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/fila-do-professor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/componentes/sino/Sino.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/componentes/Contador.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/SinoDoProfessor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 16:45:19 · `tasks/correcoes/2026-10-19-sino-cem-ou-mais.md`

VEREDITO: APROVADO

**Cenários exigidos**
- Caminho feliz: a primeira página traz 100 entregas pendentes e a API manda `proxima`. O botão do sino tem que dizer "Esperando você, 100 ou mais", a pílula tem que mostrar "100+" e o aviso de leitura parcial tem que continuar no painel.
- Borda: as mesmas 100 entregas sem `proxima` são exatamente 100. Não pode aparecer "ou mais" nem "+".
- Borda: página cheia sem nenhum item na fila. O nome do botão continua o da situação ("parte não carregou"), nunca "0 ou mais".
- Borda: entregas que falharam ou ainda estão carregando não têm número a dizer, então `haMais` fica falso.
- Borda: o leitor de tela tem que ouvir "100 ou mais", e não "100 mais". O "+" fica `aria-hidden`.
- Permissão e isolamento: não se aplicam. A mudança é só de apresentação na web, sem rota, consulta ou dado novo.
- Concorrência: não se aplica. Não há escrita.

**Cobertos**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/fila-do-professor.test.ts`, caso "a página de entregas cheia...". Cobre `haMais` verdadeiro com página incompleta, falso com a mesma página completa, e falso com erro e com carregando.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/SinoDoProfessor.test.tsx`, linhas 263 a 282.
  - Primeiro caso: rede falsa com 100 entregas e `proxima` dá o nome "Esperando você, 100 ou mais", "100+" e o aviso parcial, sem "Tudo em dia".
  - Segundo caso, o controle: sem `proxima`, o nome é "Esperando você, 100" e não aparece "+".
  - O `findByRole` compara o nome por inteiro, então o controle não casa com o nome que tem "ou mais".
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/componentes/sino/Sino.test.tsx`. Cobre o "ou mais" no nome do botão e na pílula, o controle sem a marca e o caso sem item com "parte não carregou".
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/componentes/Contador.test.tsx`. Confere o texto completo da pílula, que o "+" é `aria-hidden` e que o texto escondido diz "ou mais esperando você". Também tem o controle exato.
- Mutações conferidas contra o `git diff`. Cada cláusula nova tem o seu bloco, e cada bloco aponta para um teste que chega a ela:
  - `haMais` em `fila-do-professor.ts:182`;
  - " ou mais" em `nomeDoBotao`;
  - `ouMais` passado ao `Contador` no `Sino`;
  - o span "+";
  - o "ou mais " do texto escondido;
  - `ouMais={fila.haMais}` em `SinoDoProfessor.tsx:53`.
- Não há `.skip`, teste comentado, mock de código nosso nem chamada de IA. A rede falsa só substitui a API.
- Rodei os quatro arquivos: 88 testes, todos verdes.

**Bloqueantes:** nenhum.

**Recomendações**
- O "ou mais" depende de a API só mandar `proxima` quando existe mesmo outra página. Se o cursor vier sempre que a página encher, com exatamente 100 entregas o sino diria "100 ou mais". Vale conferir o contrato da paginação de `entregas` e registrar na Tech Spec, §5.
- O caso do `SinoDoProfessor` usa só a turma A. Um cenário com pedidos de nome e uma turma para confirmar junto das 100 entregas mostraria o piso somado, por exemplo "102 ou mais". Isso é cobertura extra, não regra sem teste.
