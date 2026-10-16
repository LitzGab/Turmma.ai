# Validação — pele-e-casca (X1)

## Rodada 1 — 16/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `4c23893`
**Veredito: APROVADA COM RESSALVAS**

Contexto lido: `docs/visao-produto.md` (início), `prd.md`, `techspec.md`, `tasks.md`, o bloco X1 do `ROADMAP.md`, as
regras 00, 10, 20, 40, 50, 60, 70 e 80, `cenarios.md` (por amostra), os quinze `N_task.md` (seções "Revisões" e
"Recomendações sem aplicar"), `achados/indice.md` e os quatro documentos de correção da spec. As fotos estão em
`.processo/vitrine/` (escola cheia e vazia, claro e escuro, computador e celular) e, para a operação e a entrada
pública, que a vitrine não fotografa por papel, em fotos tiradas por um roteiro fora da árvore (operadora sintética
criada pelas peças do e2e): `operacao-{entrar,escolas,uso}-{light,dark}-{computador,celular}.png` e
`publica-entrar-{light,dark}-{computador,celular}.png`.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/estilos.css` (bloco `@theme` e `:root[data-tema='escuro']`) | `apps/web/src/estilos.test.ts:351` ("o bloco … declara exatamente as cores da 9.10", compara nos dois sentidos), `e2e/tokens.spec.ts:143` (E5, o CSS servido com cada hex do documento), `e2e/casca.spec.ts:288` (sem `oklch(`, `color-mix(`, `:has(`, `scrollbar-width`) | `tokens.spec` rodado: 18 de 18 |
| RF2 | ATENDIDO | `docs/interface.md` 9.1, tabela "Pares de contraste" (linha "selo de IA" `ia`/`ia-cx`; "aprovado, texto no chão") | `apps/web/src/contraste.test.ts:99` (88 linhas, mínimos, piso, borda de campo e foco), `:110` (todo par nos dois temas), `:114` (a conta reprova) | As linhas do selo e da aprovação só são presas pela contagem (menor) |
| RF3 | ATENDIDO | `apps/web/index.html:18-31` (script em linha), `apps/web/src/tema.ts:83` (`escolherAparencia`), `componentes/Aparencia.tsx` | `e2e/aparencia.spec.ts:47` (primeiro quadro com o pacote da entrada segurado por rota), `:75` (sistema emulado com a página aberta), `:184`, `:205`, `:217`, `:230` (as quatro áreas); `apps/web/src/tema.test.ts:242` | Mutação 2. Fotos: o segmentado "Aparência" na lateral (`professora--professor-nova-conversa--computador.png`) e na barra da operação (`operacao-escolas-light-computador.png`) |
| RF4 | ATENDIDO | `tema.ts:41-48` (`escolhaGuardada` cai em Sistema), `:83-92` | `tema.test.ts:194` (lê, grava e apaga lançando: Sistema, nada quebra), `:125` (o script do `index.html` com leitura que lança e sistema escuro), `Aparencia.test.tsx:101`, `lateral-recolhida.test.ts:43-61` | Trocar o `catch` por um valor fixo derruba `lerAparencia() === 'sistema'` |
| RF5 | ATENDIDO | `componentes/botao-secundario.ts:15-114`, `Botao.tsx` | `botao-secundario.test.ts:118` (lista fechada), `:170`, `:231` (44 e 36 px), `:265` (desligado); `e2e/pecas-botoes.spec.ts:40`, `:95`, `:178`; `perigo-cheio.test.ts:30` (perigo cheio só nos seis arquivos da confirmação) | Foto: `escuro--coordenacao--galeria--computador-1.png` (as seis variantes, compacto, ícone, desligado e perigo cheio). O apertado no toque é forçado por CDP no celular (menor) |
| RF6 | ATENDIDO | `botao-secundario.ts:22` (`COR_DO_OFICIAL`) | `botao-secundario.test.ts:123` ("só o oficial é grafite … nos dois temas (RF6)") | Mutação 3. Na foto do escuro o oficial é a face clara, diferente de todas |
| RF7 | ATENDIDO | `estilos.css:323-340` (anel global de `:focus-visible`) | `estilos.test.ts:774`, `:781`; `e2e/pecas-botoes.spec.ts:207` (Tab pelos 21 botões, nos dois temas, 3 px, cor `foco`, afastamento 2); `e2e/tokens.spec.ts:215`, `:271`, `:299` | O Tab percorre só os botões da galeria; as outras peças têm amostra por grupo (menor) |
| RF8 | ATENDIDO | `estilos.css:475` (transição só de `transform`), `:522-533` (movimento reduzido) | `e2e/tokens.spec.ts:326` (rodado: verde), `estilos.test.ts:790`, `:803`; `e2e/pecas-botoes.spec.ts:192` (`reducedMotion: 'reduce'`) | A guarda olha `transition` e `infinite`; um `@keyframes` finito passaria (menor; hoje não há nenhum) |
| RF9 | ATENDIDO | `apps/web/src/galeria/secoes/*.tsx` | axe da página inteira da galeria nos dois temas: `e2e/pecas-estado.spec.ts:266`, `pecas-campos.spec.ts:224`, `pecas-superficies.spec.ts:282`, `pecas-ia.spec.ts:448`, `pecas-marca-icones.spec.ts:136`, `pecas-marca-onca.spec.ts:131`, `pecas-sobrepor.spec.ts:556`, todos nos projetos `chromebook` e `celular` | O `violacoesGraves` audita a página inteira (`verificacoes.ts:56`), então botões, painel e seleção também passam pelo axe no escuro. Fotos: `coordenacao--galeria--*` e `escuro--coordenacao--galeria--*` |
| RF10 | ATENDIDO | `componentes/onca/CabecaOnca.tsx`, `ia/AvatarAgente.tsx`, `ia/AssinaturaIA.tsx:46-59`, `ia/Mensagem.tsx`; "Seu time" em `componentes/itens-da-lateral.tsx:160` | `ia/avatar-com-funcao-e-selo.test.tsx:133`, `:148`, `:176`, `:222`; `onca/CabecaOnca.test.tsx:38`, `:68`, `:79`, `:157`; `ia/avatar-so-nas-duas-pecas.test.ts:204-217` (cadeia fechada, com amostra negativa); `itens-da-lateral.test.tsx:164` (sem onça em "Seu time") | Mutação 1. Fotos: `coordenacao--coordenacao-agentes--computador-1.png`, `coordenacao--coordenacao-analista--celular.png`, `escuro--professora--professor-time-tutor--computador.png`, `escuro--coordenacao--galeria--computador-5.png` (balão do Tutor) |
| RF11 | ATENDIDO | `itens-da-lateral.tsx:88`, `BarraDeBaixo.tsx:77`, `SeloDeEstado`, `Aviso.tsx` | `itens-da-lateral.test.tsx:100`, `BarraDeBaixo.test.tsx:69`, `:91`, `SeloEFaixa.test.tsx:23`, `Aviso.test.tsx:25`, `e2e/areas.spec.ts:134` | O `aria-current` de "Seu time" (`itens-da-lateral.tsx:178`) não tem teste (menor) |
| RF12 | ATENDIDO | `componentes/Tela.tsx:63-78`, `titulo.ts:27` | `e2e/titulo-da-tela.spec.ts:124`, `:129`, `:138` (os itens de "Seções" dos três papéis: caixa do `h1`, cabeçalho de 64 px, título da aba), `:98` (a conversa); `areas/titulo-das-telas.test.tsx:83-132`, `:252` | Rodado: verde (ver Portão). O percurso não passa pelos itens do rodapé, de "Sua conta" e de "Seu time" (menor); a foto `professora--professor-meus-dados--computador.png` mostra o `h1` "Meus dados" |
| RF13 | ATENDIDO | `componentes/CascaDaEscola.tsx:324` (`w-64`), `:128` (trilho), `lateral-recolhida.ts:14-26` | `e2e/casca.spec.ts:559` (256 e 88 px), `:464` (lembrada depois de recarregar), `:504`, `:673` (900 px nos três papéis) | As medidas são feitas só com o professor (a casca é a mesma para todos); a 1366 × 768 a lateral da coordenação corta "Privacidade" na borda do que rola (menor, com destino na X2). Fotos: `*--computador*.png` dos três papéis |
| RF14 | ATENDIDO | `CascaDaEscola.tsx:303` (barra de topo `h-14`), `BarraDeBaixo.tsx:19`, `:69` | `e2e/casca-no-celular.spec.ts:72` (professor: 56 e 68 px, itens na barra, excedente 0), `:164` (aluno), `:201` (coordenação na gaveta); `BarraDeBaixo.test.tsx:49`; `CascaDaEscola.test.tsx:155` | Rodado: verde. Fotos: `aluno--aluno-atividades--celular.png`, `professora--professor-nova-conversa--celular.png`, `coordenacao--coordenacao-governanca--celular-1.png` |
| RF15 | ATENDIDO | `MenuDaPessoa.tsx:43`, barra de topo em `CascaDaEscola.tsx:317`, `operacao/componentes/CascaDaOperacao.tsx` | `e2e/casca.spec.ts:653` (`conferirOSair`) e `:673` (três papéis, 1366, 1366 × 600 e 900 px, aberta, trilho e por cima: à vista, inteiro, mesma altura e largura do vizinho), `casca-no-celular.spec.ts:72`, `:114`; `operacao.spec.ts:173` | A 360 px o teste é só do professor, com a mesma barra de topo, que não depende do papel (`CascaDaEscola.tsx:302`); as fotos de celular dos três papéis e da operação mostram o "Sair" à vista. Na operação o tamanho é só "≥ 44 px", sem comparar ao vizinho (menor) |
| RF16 | ATENDIDO | `areas/navegacao.ts:48-73` | `areas/navegacao.test.ts:5` (lista exata, com caminho), `e2e/areas.spec.ts:134`, `:251`, `casca-no-celular.spec.ts:72`, `:164`, `:201`, `titulo-da-tela.spec.ts:124` ("Início" no `h1` e em "Início · Turmma") | `docs/roteiro-da-demonstracao.md:166` ainda manda clicar em "Nova conversa" (maior) |
| RF17 | ATENDIDO | `navegacao.ts` (`icone`), `itens-da-lateral.tsx:55`, `componentes/icones/lugares.tsx`, `Ladrilho.tsx` | `itens-da-lateral.test.tsx:24`, `:51` (ícone e família de cada item, por papel), `BarraDeBaixo.test.tsx:97`, `e2e/casca.spec.ts:576` | Fotos: os quatro ilustrados (Início, Ferramentas, Turmas, Atividades) e o ladrilho nos outros, nos três papéis |
| RF18 | ATENDIDO | roteadores de `apps/web/src` sem mudança de caminho | nenhum `toHaveURL` removido ou trocado entre `e278845` e `4c23893`; `areas.spec.ts:166`, `:283` | — |
| RF19 | ATENDIDO | `SeletorDeEscola.tsx:115` (`trocarDeEscola`), `api/sessao.ts` sem mudança, `main.tsx` só ganhou `iniciarTema()` | `e2e/troca-de-escola.spec.ts` sem mudança; `escola-e-vinculos.spec.ts:100`; `areas.spec.ts:467` (a gaveta fecha na troca) | — |
| RF20 | ATENDIDO | `componentes/CascaPublica.tsx`, `paginas/`, `operacao/componentes/CascaDaOperacao.tsx` | `e2e/casca-publica.spec.ts`, `e2e/operacao.spec.ts:155-190`, `paginas/Entrar` (textos, ordem e atributos dos campos mantidos) | Fotos: `publica-entrar-*` e `operacao-*` (claro e escuro, 1366 e 360). As da operação depois da troca para `t-cartao` (15.0) foram tiradas aqui |
| RF21 | ATENDIDO | — | e2e: 330 casos antes da X1 (`cenarios.md`, parte C), 436 depois, nenhum spec perdeu caso; nenhum `.skip`, `.fixme` ou `.only` novo; os 12 casos de `pecas.spec.ts` refeitos nos `pecas-*`. Unidade da web: 706 para 1075 | Duas trocas de asserção conferidas: o `h1` da turma perdida (`acesso-da-turma.spec.ts:1106`, correção `2026-10-15-h1-da-turma-indisponivel`, mais forte que antes) e o `violacoesGraves` com as barras presas fora da sobreposição (correção `2026-10-16-alvo-de-toque…`, abaixo) |
| RF22 | ATENDIDO | `.size-limit.json` (150, 60, 16/8/5, 40 kB) | `tools/ci/tamanho-web.test.ts:105`, `componentes/casca-sem-import.test.ts:52`, `:58`, `apps/web/nome-dos-chunks.test.ts:323`, `:464`, `:492`, `icones/lugares.test.tsx:122` | Rodados: verdes. Entrada medida na 14.0: 92.069 B de JS e 8.265 B de CSS em brotli |
| RF23 | ATENDIDO | `<main>` com a reserva da barra de baixo (`CascaDaEscola.tsx`) | `e2e/casca-no-celular.spec.ts:130`, `:240`, `:251`; `larguraExcedente` = 0 em todo percurso | Rodado: verde. Fotos de 1366 e 360 px dos três papéis |
| RF24 | ATENDIDO | `tema.ts:83-86`, `lateral-recolhida.ts` | `e2e/aparencia.spec.ts:147` (pessoa A escolhe Escuro, recolhe e sai; pessoa B entra; o `localStorage` é exatamente as duas chaves, o `sessionStorage` vazio), `:100-111` (Sistema apaga a chave) | Mutação 2. O caso usa duas professoras, não dois alunos: o mecanismo é o mesmo |

Provas de mutação (cada uma aplicada, rodado só o teste citado, restaurada com `git checkout --`; a árvore terminou
como começou, com o `estado.md` do Orquestrador como única alteração):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF10 | `<SeloIA />` tirado da `AssinaturaIA` (`componentes/ia/AssinaturaIA.tsx:55`) | `ia/avatar-com-funcao-e-selo.test.tsx`: 4 de 10 vermelhos ("AssinaturaIA: os três agentes e uma função, em cada tamanho", "MensagemIA, nas duas variantes…", "Pensando…", "sem `titulo`, é um parágrafo…") |
| RF24, RF3 | Sistema grava `educa.aparencia = 'sistema'` no lugar de `removeItem` (`tema.ts:85`) | `tema.test.ts` ("Claro e Escuro gravam só o valor…; Sistema apaga a chave…") e `Aparencia.test.tsx` ("escolher Escuro grava só o valor…; voltar a Sistema apaga a chave") |
| RF6 | A face e o degrau do oficial trocados pelos do primário (`botao-secundario.ts:22`) | `botao-secundario.test.ts`: "só o oficial é grafite … nos dois temas (RF6)", "todo estado de todo desenho passa de 4,5:1…", "só a primária pinta de laranja…" |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: regra vence desenho (D80, item 7) | cumprida | Desvios do mockup listados na Tech Spec 9 e no `docs/interface.md`, Parte B; borda de campo e foco a 3:1 em `contraste.test.ts` |
| Regra: item sem tela não aparece (D73) | cumprida | `navegacao.test.ts:5` (lista exata por papel) |
| Regra: a ação oficial tem botão próprio | cumprida | RF6, mutação 3 |
| Regra: nada sensível no navegador | cumprida | RF24, mutação 2 |
| Regra: o agente nunca se passa por pessoa | cumprida | RF10, mutação 1; `avatar-com-funcao-e-selo.test.tsx:222` (nenhum nome acessível `/onça/i`) |
| Regra: Chromebook fraco, sem fonte web nem biblioteca de animação | cumprida | `tokens.spec.ts:338` (sem requisição de fonte), RF8 |
| Borda: Chrome 109 | coberta | `casca.spec.ts:288` |
| Borda: armazenamento bloqueado | coberta | `tema.test.ts:194`, `Aparencia.test.tsx:101`, `lateral-recolhida.test.ts:43-61` (unidade; sem e2e) |
| Borda: dois alunos no mesmo computador | coberta | `aparencia.spec.ts:147` com duas pessoas (professoras); `minha-turma.spec.ts:105` e `meus-dados.spec.ts:684` com dois alunos para o dado |
| Borda: professor com duas escolas | coberta | `escola-e-vinculos.spec.ts:100`, `troca-de-escola.spec.ts:193`, `SeletorDeEscola.test.tsx:49` |
| Borda: professor sem turma, aluno sem turma | coberta | `professor-assistente.spec.ts:143`, `minha-turma.spec.ts:90` (sem mudança); `titulo-da-tela.spec.ts` (Turmas vazia) |
| Borda: sessão vencida com diálogo aberto | coberta | `acesso-da-turma.spec.ts:1118`, `professores.spec.ts:925` |
| Borda: link antigo nos favoritos | justificada | Nenhum endereço mudou (RF18); os e2e entram por esses endereços |
| Borda: nome comprido a 360 px | coberta para a escola | `casca-no-celular.spec.ts:114`; o nome da pessoa não aparece na barra de topo, só na gaveta, e lá só em jsdom (menor) |
| Pronto: toda tela na pele nova, claro e escuro, sem cor fora dos tokens, sem `oklch(`/`color-mix(` | cumprido | RF1, RF2, guarda de cor em `estilos.test.ts`; fotos dos três papéis, da galeria, da entrada e da operação nos dois temas |
| Pronto: a aparência vale na próxima visita, sem piscar | cumprido | RF3 (`aparencia.spec.ts:47`) |
| Pronto: lateral nova e barra de baixo no celular | cumprido | RF13, RF14 |
| Pronto: nenhum endereço muda | cumprido | RF18 |
| Pronto: "Sair" a um clique em toda tela | cumprido | RF15 |
| Pronto: primeiro carregamento dentro do teto | cumprido | RF22 |
| Pronto: o e2e inteiro que existia continua verde nos dois projetos | cumprido segundo o portão completo local de 16/10 às 03h10 (956 e2e), que vale no lugar da esteira por decisão do Joaquim; não rodado aqui (não roda suíte inteira) | RF21 (330 → 436 casos) |
| Pronto: `docs/interface.md`, Parte B, descreve o construído | cumprido | 9.10, 10.x, 11.1 e 11.4 lidos contra o código; os testes de token e contraste leem o documento |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | não rodado (suíte inteira: portão completo local, 16/10 03h10) |
| `npm run lint` | não rodado (idem) |
| `npm run test` | não rodado inteiro. Rodados como evidência, isolados: 15 arquivos de unidade da web e de `tools/ci` (223 de 223), `avatar-com-funcao-e-selo`, `tema`, `Botao`, `botao-secundario`, `Aparencia` (verdes antes e depois de cada mutação) e `tools/ci/esteira.test.ts` (11 de 11) |
| `npm run test:e2e` | não rodado inteiro. Rodados: `e2e/tokens.spec.ts` (18 de 18), e `e2e/aparencia.spec.ts`, `e2e/casca-no-celular.spec.ts` e `e2e/titulo-da-tela.spec.ts`, juntos: 44 de 44, nos projetos `chromebook` e `celular`, sem nenhum instável |
| `npm run test:infra` | não se aplica (nenhuma rota, fila nem tabela) |
| Esteira do GitHub | não entra no veredito: sem GitHub por decisão do Joaquim, o portão completo local sobre `4c23893` vale no lugar dela e é conferido no fechamento |
| Revisões com veto registradas e aprovadas | ✅ As quinze tarefas têm rodada de todo revisor obrigatório do `tasks.md` (mais `test-engineer` e `revisor-geral`), e a última rodada de cada um é APROVADO; as quatro correções também (`quinta-fatia-do-e2e`, `anel-do-motor-sem-has`, `h1-da-turma-indisponivel`, `alvo-de-toque-sob-a-barra-de-baixo`). A spec tem `revisao-spec.md` APROVADA na rodada 4. Nenhum commit da spec leva código sem `(tarefa N.0)` nem `(correção …)` |

### 4. Achados

**Críticos**
- nenhum

**Maiores**
- `docs/roteiro-da-demonstracao.md:166`: "Perfil **Professora** → **Nova conversa**" manda clicar num item que não existe
  mais (RF16: virou "Início"). O spec do mesmo roteiro foi atualizado (`e2e/roteiro-da-demonstracao.spec.ts:356`) e o
  documento, que é o que a pessoa lê na demonstração, não. Correção: trocar por **Início**, numa `/corrigir` de texto
  ou no fechamento.

**Menores**
- `componentes/CascaDaEscola.tsx:324` e o pé da lateral aberta: a 1366 × 768 a lateral da coordenação corta
  "PRIVACIDADE" na borda do que rola, sem outra pista de rolagem (`coordenacao--coordenacao-estrutura--computador-1.png`,
  `coordenacao--coordenacao-agentes--computador-1.png`). O item é alcançável; destino já no `TODO.md:1081`, com a X2,
  que reduz os lugares a quatro.
- `areas/coordenacao/Analista.tsx` (botão "Abrir dado nominal de uma turma"): a 360 px quebra em duas linhas com o texto
  colado às bordas de cima e de baixo (`coordenacao--coordenacao-analista--celular.png`). Legível e com alvo grande;
  destino: a X2, tarefa 4.4, que muda o lugar do botão. Item que a 8.0 deixou ao `/validar`.
- A caixa de pedido desligada não se distingue da ligada no escuro (`escuro--coordenacao--galeria--computador-5.png`,
  "Caixa de pedido desligada"). Já no `TODO.md:1060`.
- `e2e/titulo-da-tela.spec.ts:111` (`percorrer`): o percurso cobre só `Seções`; os itens do rodapé, de "Sua conta" e de
  "Seu time" ficam de fora, e o `h1` visível de "Meus dados" do professor não é afirmado em e2e. Correção: acrescentar
  esses itens à lista do percurso.
- `componentes/itens-da-lateral.tsx:178`: o `aria-current` de "Seu time" não tem teste. Correção: um caso em
  `itens-da-lateral.test.tsx` com o caminho do time.
- `e2e/casca.spec.ts:559` e `e2e/casca-no-celular.spec.ts:72`: as medidas de 256/88, 56 e 68 px são feitas só com o
  professor, e a 900 px a largura de 88 não é medida. A casca é a mesma; vale um laço pelos três papéis quando a X2
  mexer na coordenação.
- `e2e/operacao.spec.ts:173`: o "Sair" da operação é provado só como "≥ 44 px", sem comparar ao vizinho, como pede o
  RF15. Correção: comparar com a caixa da `Aparencia` ou do item da navegação.
- `botao-secundario.test.ts:123`: o RF6 compara só o oficial ligado; o hover dele (`noite-alto`) não é comparado com os
  outros, e o e2e `pecas-botoes.spec.ts:68` roda só no claro.
- `contraste.test.ts:99`: as linhas "selo de IA" e "aprovado" são presas só pela contagem fixa; trocar uma linha por
  outra passa. Correção: `toContainEqual` com as duas.
- `estilos.test.ts:803` e `tokens.spec.ts:326`: a guarda de movimento olha `transition` e `infinite`; um `@keyframes`
  finito animando outra propriedade passaria. Hoje o CSS não tem nenhum.
- `e2e/pecas-botoes.spec.ts:207`: o Tab percorre só os 21 botões da galeria; as outras peças têm o anel conferido por
  amostra (`.focus()` em alvos escolhidos), e não pelo percurso que o RF7 descreve.
- `e2e/__fixtures__/verificacoes.ts` (correção `2026-10-16-alvo-de-toque-sob-a-barra-de-baixo`): conferido no código do
  axe 4.13 (`getTargetRects` e `targetSizeEvaluate`) que o alvo dentro de uma região presa continua auditado pelo
  próprio tamanho, e que só a cobertura por elemento `sticky` deixa de contar. Não esconde alvo de toque pequeno. O
  custo declarado fica: um controle de verdade coberto pela `BarraPresa` ou pelas faixas presas não é mais pego pelo
  axe; o teste de medida é da tarefa que mexer nelas.
- `componentes/dialogo-modal.ts:100` (`fechadoPeloNavegador` sob `StrictMode`, deixado pela 7.0): o caminho só existe
  em desenvolvimento (o `StrictMode` não repete efeito no build que o e2e serve), e o e2e prova o Esc em produção. Sem
  teste no caminho de desenvolvimento; fica como está.
- `tasks.md:55-58`: as subtarefas 8.1 a 8.4 estão desmarcadas com a 8.0 marcada; no `8_task.md` estão feitas.
- Recomendações com destino "spec da área" no `11_task.md` que não estão escritas em lugar nenhum fora dele: a prop
  `objeto` sem efeito (`Tela.tsx:25`, seis telas), o campo de arquivo nativo da `ListaDaTurma`, o `h1` seguido de `h2`
  quase igual em `Turmas` e `Professores`, e o voltar sublinhado de `Turma` e `ListaDaTurma`. Levar ao `TODO.md` no
  fechamento, ou às tarefas da X2 e da X3.

**Positivos**
- Os testes que leem o `docs/interface.md` (tokens e pares de contraste) prendem o documento ao código: a Parte B não
  tem como ficar para trás sem um teste vermelho.
- A cadeia fechada de importação da onça, com amostra negativa no próprio teste, faz a condição do Decreto 12.880 ser
  estrutura e não convenção.
- O RF24 provado com duas pessoas no mesmo navegador e o conteúdo exato do armazenamento, e não "não tem dado pessoal".

### 5. Conclusão

Os 24 requisitos têm código e teste efetivo, e as três mutações nos de maior risco (a onça com a função e o selo, o
que fica no navegador, o oficial que não se parece com nada) deixaram o teste vermelho. Cada tela com RF foi vista nas
fotos, nos dois temas, a 1366 e a 360 px, nos três papéis, na galeria, na entrada pública e na operação, sem defeito
da lista do `frontend-reviewer` além do corte de "Privacidade" na borda da lista que rola, que é rolagem e já tem
destino na X2. Todo revisor com veto aprovou, nas quinze tarefas e nas quatro correções. O único achado maior é um
documento de demonstração com o rótulo antigo, que não bloqueia a X2: por isso APROVADA COM RESSALVAS.

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| `docs/roteiro-da-demonstracao.md:166` com "Nova conversa" | `/corrigir` de texto, ou o fechamento da X1 |
| Itens da 7.0 e da 8.0 com destino `TODO.md` que ainda não estão lá (item 2b do "Agora" do `estado.md`) e a 2ª linha de "Sem aplicar" da ordem `anel-do-motor-sem-has-r2` (item 0) | fechamento da X1, pelo Orquestrador |
| As quatro recomendações do `11_task.md` sem destino escrito (acima) | `TODO.md` no fechamento, ou tarefas da X2 e da X3 |
| Correção `2026-10-13-quinta-fatia-do-e2e`: "não pousar sem a 6.0" | conferido: a 6.0 (`542e583`) está na spec antes do commit validado, e `tools/ci/esteira.test.ts` passa (11 de 11). Pode pousar junto |
| As lacunas de teste listadas em Menores (percurso do título, `aria-current` de "Seu time", medidas por papel, "Sair" da operação, hover do oficial, linhas do contraste, `@keyframes`, Tab da galeria) | a tarefa da X2 ou da X3 que mexer em cada peça; a retrospectiva da X1 |
| Lateral da coordenação cortando "Privacidade" a 1366 × 768 | X2 (`TODO.md:1081`) |
| A foto do RF10 com uma conversa do Tutor do aluno com mensagem: a vitrine não digita, e a escola sintética não tem troca do Tutor. A assinatura no balão foi vista na galeria e é provada por `aluno-tutor.spec.ts` (`conferirAssinaturas`) | a vitrine, quando ganhar troca do Tutor (retrospectiva) |
