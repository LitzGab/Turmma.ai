# Achados das revisões — `tasks/prd-telas-da-coordenacao/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-16 08:47:48 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no frontend e não grava nada: não cria rota nem tabela, nem mexe em `Nota`, job, seed, importação ou webhook. Todos com autor humano? Não se aplica, porque não há nenhum caminho de escrita.

Decisão autônoma sobre aluno: ausente. A fila tem só cinco tipos (`incidente`, `contestacao`, `convite-vencido`, `material-falhou`, `turmas-sem-professor`, em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:19`). Nenhum deles é sobre a trajetória de um aluno, e o vínculo de aluno contestado nem vira item (`fila-da-coordenacao.ts:90`, testado em `fila-da-coordenacao.test.ts:148`).

Aprovação registrada: ok. O sino não mostra nem gera saída de IA. Não há agente, correção, devolutiva nem material gerado. A exceção do tutor (D47) não aparece aqui.

Supervisão do tutor: ok. A tarefa não toca o tutor.

Autonomia declarada e visível: sim. A tarefa não toca agente nem a tela de governança, e nada do que já existe mudou.

Bloqueantes: nenhum.

O que conferi pelas regras 70 e 59:
- **Medir o professor (item 8 e D64):** os itens com nome de professor são só dois: "fulano contestou a turma" e "Refazer o convite de fulano". São pendências da escola que a coordenação resolve, um item por vínculo ou convite, sem número. Nada vem de uso, entrega ou atividade do professor, e não há ranking. O teste está em `fila-da-coordenacao.test.ts:99-131`: só os cinco tipos, e `contador` só em turmas sem professor. A conversa do professor com o chat não é lida.
- **Supervisão não é vigilância (item 7):** nenhum dado de comportamento ou de emoção. A fila também não lê `/lista`, `/reivindicacoes` nem `/v1/privacidade/pedidos`. O "Atualizar" e o "Tentar de novo" releem pela chave exata e não pelo prefixo (`fila-da-coordenacao.ts:250`), com mutação declarada para cada um.
- **D59 (nada que induza uso):** o número fica parado, sem animação, som ou piscar (`Sino.test.tsx:65`, `e2e/sino-da-coordenacao.spec.ts:31-38`). Também não há releitura por tempo, foco ou volta da rede (`fila-da-coordenacao.ts:182`). O "Atualizado às" só muda quando a pessoa clica, e o painel fecha pelo X.
- **Fotos** (`coordenacao--coordenacao--Esperando-você--computador.png` e `vazia--coordenacao--coordenacao--Esperando-você--computador.png`): "Tudo em dia" com ícone, sem mascote. Nenhuma nota, nenhum conceito, nenhuma saída de IA sem rótulo. A lista parcial nunca diz "Tudo em dia" (`Sino.tsx:151`, `fila-da-coordenacao.ts:167-168`).

Recomendações:
1. A foto da escola cheia também mostra "Tudo em dia", então nenhuma foto mostra um item com nome de professor. Vale semear na vitrine cheia um convite vencido ou uma contestação, para conferir na foto como a pendência chega à coordenação. Hoje só o e2e cobre isso (`e2e/sino-da-coordenacao.spec.ts:42`).
2. O texto do convite vencido ("O convite venceu antes de ser aceito.", em `fila-da-coordenacao.ts:108`) está bom porque diz o que fazer e não julga. Vale fixar numa nota da Tech Spec que esse item é tarefa de cadastro e não indicador de adesão do professor (D64), para que uma versão futura não o some por professor nem o use como "professor que não entrou".
3. As duas fotos mostram "Página não encontrada" em `/coordenacao`. Isso não é da regra 70, provavelmente é o Painel da 2.0, mas fica registrado para o `frontend-reviewer`.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-16 08:47:53 · `tasks/prd-telas-da-coordenacao/1_task.md`

```
VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts: o comentário de useFilaDaCoordenacao diz que a releitura é "pelo `refetch` do próprio observador", mas o código usa `cliente.refetchQueries({ queryKey, exact: true })`. O efeito é o mesmo, pela chave exata. Vale alinhar o texto ao código para o /validar.
- Techspec §7c: registrar o pior caso de carga ao entrar na área. Seis leituras, até 10 páginas em cada uma das cinco listas paginadas, dá no máximo uns 50 pedidos. Isso está abaixo de `LIMITE_REQ_USUARIO_MIN=120` (/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/.env.example:66), mas fica perto da metade dele somado ao que a própria tela lê. Ter o número escrito ajuda quando o limite for ajustado.
```

Por que nenhum item vira bloqueante às 10h de segunda:
- **Sem rota, tabela ou job novo.** Só mudaram `apps/web` e `e2e/`. As leituras do sino passam pelo limitador por usuário e por escola que já existe.
- **Releitura.** A fila não relê sozinha: 5 min de validade e nada de releitura por tempo, foco ou rede. O `refetchInterval` de 1,5 s da tela Material está desligado no sino. Os incidentes são lidos uma vez por sessão. Tudo isso tem teste: tempo avançado, foco e rede saindo e voltando, e um caso de controle com a opção ligada. Cada opção tem a sua mutação declarada.
- **Rajadas.** As listas são paginadas com teto de 10 páginas (`MAXIMO_DE_PAGINAS_DA_ESTRUTURA`). Sem ano letivo em curso, turmas e vínculos nem são chamados. "Atualizar" e "Tentar de novo" ficam desabilitados enquanto releem, o que segura o clique duplo, e releem pela chave exata, sem alcançar leituras auditadas.
- **Estado em memória.** Só o cache do TanStack, no navegador. Nada no servidor.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-16 08:48:51 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência no "Tentar de novo" da fila (`techspec.md` §5, "A fila")
Portão local: carimbo válido

Bloqueantes:

- `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:263-265` (e o comentário em `:210`): "Tentar de novo" relê o que falhou **e também o que veio truncado**:
  ```ts
  leiturasDaFila.filter(({ resultado }) => resultado.isError || veioTruncada(resultado.data))
  ```
  - A Tech Spec §5 trata falha e `completa: false` como coisas diferentes. Para o retry, ela diz só: "relê só as consultas que falharam, por chave exata". A subtarefa 1.3 diz o mesmo.
  - A escolha foi de propósito: tem mutação própria (`1_task.md:171-176`) e teste próprio (`SinoDaCoordenacao.test.tsx:381`, "Tentar de novo com turmas que vieram truncadas"). Mas ela não está na tabela "Divergências resolvidas" nem na `techspec.md`.
  - Pesa no que a spec quer conter (§7c). A lista truncada é a que bateu em `MAXIMO_DE_PAGINAS_DA_ESTRUTURA`. Relê-la custa até 10 requisições por clique e, com o dado real, volta truncada do mesmo jeito.
  - **Correção exigida, uma das duas:**
    - fazer o retry reler só o que falhou, como a spec manda, e decidir o que o "Tentar de novo" faz quando a fila está parcial só por truncamento;
    - ou registrar a decisão na `techspec.md` §5 (e na §7c, por causa da carga) e na tabela de divergências da `1_task.md`, com o motivo e com o custo por clique dito por escrito.

Recomendações:
- `apps/web/src/componentes/CascaDaEscola.tsx:308` e `:375`: o `<ContextoDaAncoraDoSino>` envolve o `<ContextoDaGaveta>` sem reindentar o miolo. Fica difícil ver onde cada provedor fecha.
- `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:166`: o comentário sobre o ano lido em parte não explica a linha de baixo. A linha de baixo trata qualquer leitura truncada, não só a dos anos.
- `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:244`: o `atualizadoEm` é estado do `SinoDaCoordenacao` e só é marcado uma vez. Se a troca de escola ou de pessoa não desmontar o sino, a hora da sessão anterior continua no "Atualizado às". Vale um caso no teste de recomeço (`SinoDaCoordenacao.test.tsx:311`) que verifique essa hora.
- Os destinos `?situacao=sem-professor`, `?painel=falta`, `?professor=` e `?material=` ainda não são lidos por nenhuma tela. O sequenciamento prevê isso para as tarefas da Escola. Hoje o item leva à tela certa, mas sem abrir o que o endereço indica.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-16 08:48:52 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O sino só mostra dados que a coordenação já vê na tela Professores, e só na área dela:
- nome do professor, no item de contestação e no de convite vencido;
- `usuarioId` do professor na consulta do endereço (`/professores?professor=<uuid>`), como a seção 5 da Tech Spec pede;
- título do material, data do aviso de incidente, nome da turma e da disciplina.

O `complemento` da contestação, que é texto livre, não aparece. Nenhum dado de aluno chega à tela: os vínculos de aluno são descartados pelo filtro `papel === 'professor'` (`apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:58` e `:90`).

Fora da tabela de dados do docs/lgpd.md: nada. Não há migration nem campo novo, e a tarefa é só de web, sobre leituras que já existiam.

Autorização por objeto: ok. Não há rota nova. As seis leituras são endpoints que já existiam, com `@Permite` e escopo pelo token. O id no endereço do item é UUID e só serve para abrir a linha numa lista que já está no escopo da escola. Três testes provam o que o sino não toca:
- `apps/web/src/sino-por-area.test.tsx:69`: nas áreas do professor e do aluno, o sino não aparece e nenhuma leitura da fila sai.
- `SinoDaCoordenacao.test.tsx:144`: a fila não lê a lista de nomes, nem os pedidos de nome, nem os pedidos de titular, e abrir a lista não faz chamada.
- `SinoDaCoordenacao.test.tsx:311` e `e2e/sino-da-coordenacao.spec.ts:121`: a fila de uma sessão não aparece na seguinte, nem durante o carregamento.

Logs: limpos. Não há `console`, `logger` nem armazenamento no navegador nos arquivos novos. O erro vai para o `EstadoErro`, que usa o catálogo e não mostra stack trace.

Auditoria: presente, e nada a acrescentar. A tarefa não faz leitura auditada nova. O risco real era "Tentar de novo" ou "Atualizar" relerem por prefixo e alcançarem `/lista`, `/reivindicacoes` ou `/v1/privacidade/pedidos`, que são leituras auditadas. A releitura usa a chave exata (`fila-da-coordenacao.ts:250`), os testes em `SinoDaCoordenacao.test.tsx:332` e `:355` provam isso, e o bloco de mutação troca a chave exata por prefixo para exigir vermelho.

Envio externo: nenhum. Não há chamada de IA nem terceiro.

Seed/fixture: sintético. Os nomes nos testes e na galeria são "Paulo Sintético", "Camila Sintética" e "Rita Sintética", o e2e cria a equipe com dado inventado, e a vitrine usa "Colégio sintético da vitrine". Nas fotos, o sino não mostra nenhum dado de pessoa: o vazio aparece como "Tudo em dia" na escola cheia e na vazia, e o botão do sino no celular é só o ícone.

Bloqueantes: nenhum.

Recomendações:
1. **Minimização.** `GET /v1/vinculos` devolve também os vínculos de aluno (`usuarioId` e turma, sem nome), e agora o sino os lê ao entrar em qualquer tela da coordenação, mesmo na Governança, onde antes não eram lidos. Eles ficam no cache do navegador sem uso. Proponho um filtro `?papel=professor` na consulta (`packages/shared/src/estrutura/vinculo.ts:88`) e uma consulta própria para o sino, numa tarefa futura ou no `TODO.md`. Não é bloqueante: o dado é opaco e já ia para esta mesma tela da coordenação.
2. **Fotos da Governança.** Nas fotos `coordenacao--coordenacao-governanca--Esperando-você--computador.png` e na da escola vazia, a lista aparece fechada depois do clique. Isso não muda nada para a privacidade, mas vale o `frontend-reviewer` confirmar se o defeito é da captura ou da regra que fecha a lista quando o endereço muda (`apps/web/src/componentes/sino/Sino.tsx:99`).

Para a pergunta de fechamento: a tarefa não grava nada novo sobre aluno nem envia nada a lugar nenhum, então não muda a resposta que o sistema já dá à secretaria.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/ancora-do-sino.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/__fixtures__/tela.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/e2e/sino-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/sino-por-area.test.tsx`

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 08:49:05 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Tela vista: sim (11 fotos lidas, mais 3 que fiz: Estrutura no computador e dois quadros em 360 px da Governança; escola cheia e vazia). O estado "com itens" não aparece em nenhuma foto, porque as duas escolas da vitrine estão "Tudo em dia".

Estados:
- ok. Pelo código de `Sino.tsx` e `fila-da-coordenacao.ts`, estão presentes: carregando, erro com "Tentar de novo", parcial com "Parte da lista não carregou", vazio e com itens.
- O vazio convida: ícone ilustrado, "Tudo em dia", "Nada espera a coordenação agora." e o botão "Ver o que falta para a escola".
- Parcial e erro nunca dizem "Tudo em dia", e o nome do botão acompanha cada situação.
- Não conferi carregando e erro pelo e2e.

Acessibilidade:
- O botão leva `aria-label` com a contagem ("Esperando você, N" ou "Esperando você, nada"), `aria-haspopup` e `aria-expanded`.
- O painel é um `<dialog>` modal, com foco no miolo e devolução do foco a quem abriu. O "Fechar" tem 44 px.
- O contador fica parado e não há animação.

Chromebook fraco:
- A fila usa `staleTime` de 5 min, sem `refetchInterval` e sem releitura por foco ou rede. Abrir a lista não faz leitura.
- O sino vem num chunk `lazy()` próprio e não entra na fachada da casca.
- Não há lista longa: a fila agrupa por tipo. Não rodei throttling.

Celular:
- Em 360 px o botão tem 56×44 px e fica na barra do topo, ao lado de "Sair". `scrollWidth` é 360, sem rolagem horizontal.
- A lista abre como folha de baixo, com "Atualizar" visível e a ação "Ver o que falta" quebrando em duas linhas sem cortar.
- Nada depende de hover.

Ação oficial protegida: sim. O sino só navega; não há ação oficial nele. Não lê pedidos nem listas auditadas.

Bloqueantes: nenhum.

As duas capturas da Governança com a lista fechada vêm da captura, não da tela. Reproduzi com Playwright em 1366 px: depois do clique a lista continua aberta (`dialog[open]` igual a 1 por 3 s, e também depois de redimensionar e fotografar). O que fecha a lista é a captura trocar de largura, o que remonta a âncora. A foto mobile da Governança, feita por mim em 360 px, mostra a lista aberta e correta, com "Tudo em dia", "Atualizado às 08:48" e "Atualizar".

Recomendações:
1. `apps/web/src/componentes/CascaDaEscola.tsx` (âncora, duas instâncias por faixa): trocar de faixa de largura (por exemplo, girar um tablet) remonta o sino e fecha a lista aberta. É borda menor. Registrar para a X-spec da casca ou para o `/retro`.
2. `apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx:28` e `fila-da-coordenacao.ts:136`: os links `/estrutura?painel=falta` e `/estrutura?situacao=sem-professor` caem hoje numa Estrutura que ignora os parâmetros. Isso está previsto para a tarefa 3.0 (Lugares). Garantir que a 3.0 trate os dois.
3. Nenhuma foto mostra a lista com itens, nem o parcial ou o erro. Para o `/validar`, semear um convite vencido e fotografar a lista cheia e a parcial, no computador e em 360 px.
4. A rota `/coordenacao` mostra "Página não encontrada" porque o Painel é a tarefa 2.0. Isso é esperado agora e precisa sumir ali.

Caminhos relevantes:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/CascaDaEscola.tsx`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-16 08:50:18 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** um convite vencido faz o sino contar 1; o item leva a Professores e some quando o convite é refeito.
- **Os cinco tipos de item**, cada um com o endereço certo; vínculo pendente e material processando não viram item.
- **Casos de borda:**
  - professor com duas disciplinas na mesma turma;
  - turma só com vínculo contestado;
  - vínculo encerrado;
  - sem ano letivo em curso (nenhum, só `planejado` ou só `encerrado`);
  - lista truncada em qualquer leitura;
  - um item por vínculo, homônimos e "a mesma contestação duas vezes";
  - revogar o convite tira o item.
- **Releitura (regra 80):** o sino não relê por intervalo, por foco nem por rede; não relê ao voltar à área dentro dos 5 minutos; os incidentes são lidos uma vez por sessão.
- **"Tentar de novo" e "Atualizar"** releem pela chave exata e não tocam leitura auditada, com a fila `parcial` e também com ela em `erro`.
- **Permissão:** o sino só existe na área da coordenação.
- **Isolamento:** a fila da escola anterior não aparece, nem para a segunda pessoa na mesma aba, nem na troca de escola.
- **Concorrência:** clique duplo em "Atualizar" ou em "Tentar de novo".

Cobertos:
- Os cinco tipos, as bordas de turma sem professor, vínculo encerrado, truncada, homônimos e revogação, em `fila-da-coordenacao.test.ts`.
- O sino não relê sozinho, em dois tempos, com o caso de controle e o `afterEach` que restaura os dois gerenciadores.
- A volta à área em menos de 5 minutos e os incidentes lidos uma vez.
- "Atualizar" lê as cinco leituras, uma vez cada, e "Atualizado às" só muda depois do clique, com relógio falso.
- "Tentar de novo" com a fila `parcial` (por falha e por truncada) relê só o que falhou, com as leituras auditadas abertas.
- Sem ano, no componente.
- Os estados da peça `Sino`.
- O sino só na coordenação, pelas rotas da app, com o controle.
- Do sino à tela no e2e: foco, nada animado, 360 px e violações graves.
- A segunda pessoa no e2e.
- A âncora em cada largura.

Os seis arquivos de vitest passam (91 testes). Não há `.skip` nem `.only`, e nenhum provedor de IA é chamado.

Bloqueantes:

1. **Falta o e2e sem ano letivo.** A tabela da tarefa pede "sem ano letivo | componente, e2e", e a seção 130 do `techspec.md` diz "`sino-da-coordenacao` (também `--vazia`)".
   - `e2e/sino-da-coordenacao.spec.ts:100` cria a escola com `criarEquipeComSenha('coordenador')`, que insere um ano `em_curso` (`e2e/__fixtures__/sessao.ts:93-94`). Nenhum e2e roda contra a API real sem ano.
   - Correção: um caso com `criarEquipeComSenha('coordenador', { semAnoLetivo: true })` que confirme três coisas: o nome "Esperando você, nada", o texto "Tudo em dia", e nenhuma requisição a `/v1/turmas` nem a `/v1/vinculos` (com `page.on('request')`).

2. **Falta o e2e da troca de escola.** A linha "recomeço: segunda pessoa; troca de escola | e2e" está na tabela, mas só a segunda pessoa tem e2e (`e2e/sino-da-coordenacao.spec.ts:120-142`).
   - O caso de componente (`SinoDaCoordenacao.test.tsx:311`) chama `cliente.resetQueries()` à mão. Ele não prova que a troca de verdade, pelo seletor, esvazia a fila.
   - Correção: o coordenador em A, com um convite vencido, e em B, com `criarUsuarioEmOutraEscola(contaId, 'coordenador')`. Depois de trocar pelo seletor, o sino de B não mostra o item de A nem enquanto carrega, e a página não contém o nome do professor de A.

3. **"Tentar de novo" com a fila em `erro` não é provado contra as leituras auditadas.**
   - `SinoDaCoordenacao.test.tsx:412-432` monta o sino sem `auditadas: true`.
   - É justamente em `erro` que os incidentes são relidos, e esse é o único caminho do sino pela chave `['privacidade']`, onde moram os pedidos do titular. Os casos com leituras auditadas abertas só releem chaves de `['estrutura']`.
   - A tarefa exige "fila `parcial` e depois `erro`, clique em cada um: zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`".
   - Correção: montar com `auditadas: true` e as respostas das três rotas, clicar em "Tentar de novo" e confirmar que nenhuma dessas rotas foi chamada. Acrescentar o bloco da mutação de `reler` por prefixo citando esse caso.

4. **"A mesma contestação duas vezes" está escrito no teste e não está nos dados.**
   - `fila-da-coordenacao.test.ts:116-130` usa Camila em T1, Camila em T2 e Paulo em T1.
   - Um `id` montado como `contestacao-${usuarioId}-${turma.id}`, que daria um item por professor e turma em vez de um por vínculo, passaria no teste.
   - Esse é o caso de borda do professor com duas disciplinas na mesma turma, aplicado à contestação.
   - Correção: acrescentar Camila em T1 com Física, também contestado, e exigir dois itens de Camila em T1, com `id` diferentes.

5. **Cláusulas novas sem bloco de mutação.** Cada uma precisa de um bloco que cite um teste que fique vermelho. Se nenhum ficar, falta o cenário.
   - `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:128`: `if (semProfessor.length === 0) return []`. Candidato: `› o incidente confirmado não é item`.
   - `fila-da-coordenacao.ts:174`: `ano.situacao === 'em_curso'` em `anoEmCurso`. Candidato: `› sem ano em curso`, com só `planejado`.
   - `fila-da-coordenacao.ts:185`: `if (!aplica) return { estado: 'nao-se-aplica' }`.
   - `fila-da-coordenacao.ts:186` e `:226`: `consulta.isError` e `incidentes.isError`. Sem eles, a fila fica em `carregando` para sempre.
   - `fila-da-coordenacao.ts:244` e `:275`: as duas chamadas a `definirAtualizadoEm`.
   - `apps/web/src/componentes/sino/Sino.tsx:60`: `if (itens.length === 0) return null` no `GrupoDeItens`. Candidato: `› só aparece o grupo que tem item`.
   - `Sino.tsx:104`: o filtro `!item.urgente`.
   - `Sino.tsx:131`: `situacao === 'carregando' && <EstadoCarregando…>`.
   - `Sino.tsx:132`: `situacao === 'erro' && <EstadoErro…>`.

Recomendações:
- Clique duplo em "Atualizar" e em "Tentar de novo" (`Sino.tsx:124` e `:137`): um teste com `dblClick` que confirme uma chamada por leitura. Hoje o `disabled` não tem teste.
- `sino-por-area.test.tsx:74`: a espera fixa de 100 ms dá falso verde com a máquina carregada. É melhor esperar o título da tela da área antes de conferir que o sino não existe.
- `fila-da-coordenacao.ts:244`: o `atualizadoEm` sobrevive ao `resetQueries`. Numa troca de escola sem remontar a área, B mostraria a hora da leitura de A. Zerar quando a fila volta a `carregando`.
- `Sino.tsx:52` com `:145`: em `carregando` com itens já lidos, o botão diz "Esperando você, N", mas a lista só mostra "Carregando…".
- `fila-da-coordenacao.ts:133` e `:137`: o singular "Uma turma sem professor" e "turma sem professor" não tem asserção.
- `Sino.test.tsx:69`: a regex sobre `className` é fraca. O e2e cobre, pelo estilo calculado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx
[… 5 linhas cortadas]

## infra-guardian · 2ª rodada · APROVADO · 2026-10-16 09:04:58 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

As duas recomendações da 1ª rodada foram feitas:
- O comentário de `useFilaDaCoordenacao` agora diz "`refetchQueries` com a chave exata", como o código faz (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:210`).
- A §7c da `techspec.md` agora registra o pior caso de carga: cerca de 50 pedidos contra os 120 de `LIMITE_REQ_USUARIO_MIN`, e até 10 requisições por lista truncada a cada clique em "Tentar de novo".

O que conferi no diff às 10h de segunda:
- **"Tentar de novo" relê também a lista truncada** (`fila-da-coordenacao.ts:263`). Cada leitura vai pela chave exata, e o botão fica desligado enquanto ela corre. O teste com `dblClick` prova uma chamada por consulta, tanto em "Tentar de novo" quanto em "Atualizar". O custo só pesa no limite por usuário da própria coordenadora, que são de uma a três pessoas por escola, e não chega a outra escola nem aos alunos.
- **Zerar o `atualizadoEm` no render quando a fila volta a `carregando`** (`fila-da-coordenacao.ts:220`) não entra em laço. As duas condições se excluem, e a releitura por "Atualizar" mantém o `data`, então não passa por `carregando`. Só a sessão nova (`resetQueries`) zera a hora, e o teste do recomeço prova que a hora mostrada depois é a da leitura de B.
- **Nenhum estado novo fora do navegador.** Não há rota, tabela, job nem migration. As leituras novas do e2e (escola sem ano, troca pelo seletor) não chamam provedor pago.

Recomendações:
- `fila-da-coordenacao.ts:263`: quando a fila está parcial só por truncamento, cada clique em "Tentar de novo" custa até 10 requisições e, com o dado real, volta truncado do mesmo jeito. A §7c já diz isso. Para o `/validar`, vale decidir se o aviso, nesse caso, deve dizer que a lista é grande demais para o sino, em vez de convidar a tentar de novo, para a coordenadora não gastar o limite por minuto em cliques que não mudam nada.
- `CascaDaEscola.tsx`: a troca de faixa de largura que remonta o sino já está no `TODO.md`, e não pesa em carga.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/e2e/sino-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/techspec.md`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-16 09:05:04 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. A 1ª foi APROVADO sem correção exigida, então conferi o diff entre `a0550a7` e `7f11160` e o que ele afeta.

**Campos pessoais tocados:** nenhum campo novo. O sino mostra o que já mostrava: o nome do professor nos itens de contestação e de convite vencido, o `usuarioId` no endereço do item, o título do material, a data do incidente e o nome da turma e da disciplina. O diff não acrescenta dado de pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada. A tarefa não tem migration nem rota.

**Autorização por objeto:** ok. Não há rota nova. Duas mudanças do diff deixam o isolamento mais forte:
- `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:245` apaga o "Atualizado às" quando a fila volta a carregar. Antes, a hora da leitura da escola A ficava na tela da escola B. O teste está em `SinoDaCoordenacao.test.tsx:355`, que confere que a hora mostrada é 09:03, a da leitura de B.
- `e2e/sino-da-coordenacao.spec.ts:459-516` prova a troca de escola de verdade, pelo seletor e com segundo fator. Do primeiro "carregando" em diante, o sino de B nunca tem o nome "Esperando você, 1", e a página não contém o nome do professor de A.

**Logs:** limpos. Não há `console`, `logger` nem armazenamento no navegador no diff. O `page.on('request')` do e2e só guarda o caminho, e só no teste.

**Auditoria:** presente. A tarefa não cria leitura auditada. O risco de "Tentar de novo" com a fila em `erro` reler os incidentes pelo prefixo `['privacidade']` e alcançar `/v1/privacidade/pedidos` agora tem teste. `SinoDaCoordenacao.test.tsx:488-505` abre as leituras auditadas (`auditadas: true`), clica em "Tentar de novo" e exige zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`. A releitura continua sendo `refetchQueries` com `exact: true` (`fila-da-coordenacao.ts:251`).

**Envio externo:** nenhum. A tarefa não chama IA nem terceiro.

**Seed/fixture:** sintético.
- O e2e cria o professor com o estado do teste no nome e o e-mail em `@educa.invalid`. A troca de escola usa `criarUsuarioEmOutraEscola`, com escola e rede inventadas.
- As fotos mostram "Colégio sintético da vitrine cheia/vazia" e "Coordenadora sintética". Nelas o sino aparece fechado, sem nenhum dado de pessoa. A Governança só traz agregados por série e função, sem nome de professor nem de aluno, e a lista diz isso por escrito.

**Fotos conferidas** (todas em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/.processo/vitrine/`):
- `coordenacao--coordenacao-governanca--Esperando-você--computador.png`
- `coordenacao--coordenacao-governanca--Esperando-você--celular-1.png`
- `vazia--coordenacao--coordenacao-governanca--Esperando-você--computador.png`

A lista aparece fechada depois do clique. Isso vem da captura trocar de largura, como o `frontend-reviewer` reproduziu na 1ª rodada, e não muda nada para a privacidade.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A minimização que pedi na 1ª rodada foi registrada no `TODO.md`, item (2) do "Sino da coordenação": `GET /v1/vinculos` traz os vínculos de aluno junto. Ela precisa virar `?papel=professor` com uma consulta própria antes da primeira escola real, não só ficar no `TODO`.
2. As fotos continuam sem a lista com itens. Para o `/validar`, semear um convite vencido na vitrine cheia e fotografar a lista aberta, no computador e em 360 px. Assim dá para conferir na tela que só aparece o nome do professor, e nada de aluno.

**Pergunta de fechamento:** a tarefa não grava nada novo sobre aluno nem envia nada para fora. A resposta que o sistema já dá à secretaria não muda.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 09:05:05 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Tela vista: sim, mas só em parte. Li 11 fotos, na escola cheia e na vazia, no computador e no celular, em `/coordenacao` e `/coordenacao/governanca`.
- O painel aberto do sino não aparece em nenhuma foto. Tirei uma foto minha com o clique no botão e deu o mesmo: a página sai com o sino fechado.
- O painel foi conferido pelo código (`Sino.tsx`) e pelo e2e `e2e/sino-da-coordenacao.spec.ts`.
- O que as fotos mostram é o botão do sino na barra de topo, nos dois tamanhos de tela, sem defeito. No celular só o ícone cabe, e no computador o botão diz "ESPERANDO VOCÊ".
- A foto de `/coordenacao` no celular mostra "Página não encontrada". Isso é a rota sem página própria, como o prompt avisou, e fica fora desta avaliação.

Estados: ok.
- `Sino.tsx:131-160` cobre carregando, erro, parcial ("Parte da lista não carregou" com "Tentar de novo"), pronta com itens e vazio.
- O vazio diz "Tudo em dia", tem ícone e leva a "Ver o que falta para a escola".
- Nunca diz "Tudo em dia" sem ter lido tudo.
- A rodada 2 acrescentou testes para a fila parcial por falha de incidentes e para o singular e o plural de "turma sem professor".

Acessibilidade: ok.
- O botão tem `aria-label` com o número e `aria-expanded`.
- O painel é modal, o Esc fecha, e o foco volta ao sino (e2e).
- O e2e checa violações graves e que nada se anima (D59).
- O "Atualizado às" fica em `role=status`.

Chromebook fraco: ok. O sino não tem temporizador nem animação. "Atualizar" e "Tentar de novo" ficam desligados durante a leitura, e há teste de clique duplo. A releitura usa a chave exata, então não alcança as leituras auditadas, e há teste que prova isso.

Celular: ok.
- O e2e roda nos projetos `chromebook` e `celular`, exige alvo de pelo menos 44 px no sino e confere que não há rolagem horizontal, nem na página nem no diálogo.
- Nas fotos, a barra de 360 px tem menu, logotipo, escola, sino e "Sair" sem sobreposição.

Ação oficial protegida: sim. O sino só navega para a tela que resolve o item e não decide nada oficial.

Bloqueantes: nenhum. Conferi as correções da rodada 2 no diff:
- O `id` do item de contestação agora é o do vínculo, e há teste com a mesma turma em duas disciplinas.
- A hora do "Atualizado às" é a de quando a fila terminou de ler, e sai quando a escola ou a sessão trocam. Isso tem teste com relógio falso (`fila-da-coordenacao.ts:239-245`).
- A mudança em `CascaDaEscola.tsx` é só reindentação e reordenação da âncora do sino.

Recomendações:
- O vitrine não captura o painel modal aberto. Vale ajustar `tools/vitrine` para fotografar o `<dialog>` aberto, para o `/validar` ver a lista de verdade.
- Os três pontos que o `TODO.md` já registra seguem abertos: itens lidos durante o recarregamento, `GET /v1/vinculos` sem filtro de papel, e o sino que remonta ao trocar de faixa de largura.
- No celular o nome da escola aparece como "Colégio s…", cortado pela barra de topo. Não bloqueia, mas é pouco informativo.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-16 09:05:12 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A 1.0 continua só no web e no e2e. O diff desde a 1ª rodada não cria rota, tabela, job, seed, importação nem webhook. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente. Os cinco tipos de item da fila são os mesmos. A única mudança em `montarFila` é um comentário. O caso novo de quatro contestações (`fila-da-coordenacao.test.ts:148-160`) é sobre vínculo de professor e não toca a trajetória de nenhum aluno.
Aprovação registrada: ok. O sino não mostra nem gera saída de IA, e a exceção da D47 não aparece.
Supervisão do tutor: ok. A tarefa não toca o tutor.
Autonomia declarada e visível: sim. Nada mudou em agente nem em governança.
Bloqueantes: nenhum.

**O que mudou desde a 1ª rodada, pela minha regra:**
- **Medir o professor (item 8 e D64).** Pedi na rodada anterior uma nota que diga que o convite vencido não mede o professor. Ela entrou em `techspec.md:61`: "O item de convite vencido é tarefa de cadastro (refazer um link), não indicador de adesão do professor (D64)." Nenhum contador novo foi somado por professor. O singular e o plural novos (`fila-da-coordenacao.test.ts:170-177`) valem só para "turmas sem professor", que conta turma e não pessoa.
- **"Tentar de novo" relê também a lista truncada** (`techspec.md:61` e §7c, e a divergência em `1_task.md:85`). Continua por chave exata e não alcança leitura auditada. A prova com a fila em `erro`, com as leituras auditadas abertas, está em `SinoDaCoordenacao.test.tsx:488-505`: nenhuma chamada a `/lista`, `/reivindicacoes` nem `/v1/privacidade/pedidos`. Isso preserva a separação entre supervisão e vigilância e a regra de que o nominal só abre com auditoria.
- **"Atualizado às" sai na troca de escola** (`fila-da-coordenacao.ts:217-220`, com teste em `SinoDaCoordenacao.test.tsx:355-363`). O e2e novo da troca pelo seletor (`e2e/sino-da-coordenacao.spec.ts:459-515`) prova que o nome do professor da escola A não aparece na B. É isolamento, e não muda nada na regra 70.
- **D59.** O "Atualizar" e o "Tentar de novo" ficam desligados enquanto a leitura corre, provado com `dblClick` em `SinoDaCoordenacao.test.tsx:431-460`. Nenhuma releitura sozinha entrou.

**Fotos** (`.processo/vitrine/coordenacao--coordenacao-governanca--Esperando-você--computador.png` e `vazia--coordenacao--coordenacao-governanca--Esperando-você--computador.png`):
- O sino aparece como "Esperando você", sem número animado e sem nome de pessoa.
- A Governança, que esta tarefa não mexeu, continua marcando o que é da IA: "Gerado por IA", "Agente e função", e a decisão com quem aprovou e quando ("Aprovado por um professor · 16/10, 08h25", "Esperando o professor").
- Nenhuma nota nem conceito aparece. O consumo é somado por função, sem recorte por professor.
- A lista fechada depois do clique é coisa da captura, como o `frontend-reviewer` já mostrou na 1ª rodada.

Recomendações:
1. Continua aberta a minha recomendação 1 da rodada anterior. Nenhuma foto mostra a fila com um item que tenha nome de professor, como "Refazer o convite de…" ou "contestou a turma". Vale semear um convite vencido na vitrine cheia para o `/validar` ver como essa pendência chega à coordenação.
2. O item (2) que entrou no `TODO.md`, `GET /v1/vinculos` sem filtro por papel, é de minimização (regra 20). Quando virar tarefa, a consulta própria do sino deve devolver só vínculo de professor. Assim o sino não carrega nada de aluno nem por engano.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/e2e/sino-da-coordenacao.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/techspec.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 09:05:30 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A correção seguiu a segunda saída: registrou a decisão em vez de mudar o código. A regra de que "Tentar de novo" relê também a lista truncada está agora nos três lugares exigidos:
- `techspec.md` §5, que separa o retry dos blocos do Painel (só o que falhou) do retry da fila (o que falhou e o que veio truncado).
- `techspec.md` §7c, com o custo por clique escrito: até 10 requisições por lista truncada, botão desligado enquanto relê, pior caso de cerca de 50 pedidos contra o `LIMITE_REQ_USUARIO_MIN` de 120.
- A tabela de divergências da `1_task.md`, linha 85, apontando para a §5 e a §7c.

Esta spec não tem `cenarios.md`. A subtarefa 1.3 não contradiz o registro.

Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum.

As recomendações da rodada 1 que cabiam a mim foram aplicadas:
- O comentário perto da linha 166 de `fila-da-coordenacao.ts` agora explica a linha de baixo.
- O docstring de `useFilaDaCoordenacao` agora diz `refetchQueries` com a chave exata, que é o que o código faz.
- O miolo de `<ContextoDaAncoraDoSino>` em `CascaDaEscola.tsx` foi reindentado.
- `atualizadoEm` volta a vazio quando a fila volta a `carregando`. As duas condições no render se excluem, então não há laço de renderização.
- A nota da D64 sobre o convite vencido entrou na §5.

As linhas não aplicadas foram para "Recomendações sem aplicar" e para o `TODO.md`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/techspec.md:87`: a célula de carga agora descreve o sino duas vezes. Primeiro diz "pior caso do sino: seis leituras ao entrar…" e logo depois repete o texto antigo, "Ao entrar na área, 5 consultas a mais…", com outra contagem. Fundir as duas numa frase só, porque quem lê a seção de carga não deve ter de conciliar seis com cinco.
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/e2e/sino-da-coordenacao.spec.ts:509-511`: a prova de que o sino não mostra o item de A durante a troca depende de o nome "Esperando você, carregando" aparecer. Se uma mudança futura mantiver o dado anterior durante o recomeço, o teste quebra no `toBeGreaterThanOrEqual(0)`, e a mensagem não diz que o problema é o isolamento. Uma mensagem de asserção explícita ajudaria quem for depurar.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-16 09:07:47 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: REPROVADO

Cenários exigidos: os mesmos da 1ª rodada.
- Os cinco tipos de item, mais o caminho feliz do convite vencido.
- Casos de borda: duas disciplinas na mesma turma, turma só com vínculo contestado, vínculo encerrado, sem ano em curso, lista truncada, um item por vínculo (homônimos, e a mesma contestação duas vezes), e revogar o convite.
- Releitura (regra 80): o sino não relê por intervalo, por foco nem por rede; não relê ao voltar dentro dos 5 minutos; incidentes lidos uma vez por sessão.
- "Tentar de novo" e "Atualizar" releem pela chave exata e não tocam leitura auditada, com a fila em `parcial` e em `erro`.
- Permissão: o sino só existe na coordenação.
- Isolamento: a fila não passa para a pessoa seguinte nem para a outra escola.
- Concorrência: clique duplo em "Atualizar" e em "Tentar de novo".

Cobertos (cada correção da 1ª rodada, conferida contra o diff e contra o código):
1. **E2E sem ano letivo:** feito, em `e2e/sino-da-coordenacao.spec.ts:120`. Usa `semAnoLetivo: true`, confere o nome "nada" e o "Tudo em dia", e confere que turmas e vínculos nunca são chamados. Os `toContain('/v1/anos-letivos')` e `('/v1/professores')` são o controle de que o filtro por caminho enxerga as chamadas.
2. **E2E da troca de escola pelo seletor:** feito, em `e2e/sino-da-coordenacao.spec.ts:163`.
   - A conta é a mesma nas duas escolas e só A tem o convite vencido.
   - O MutationObserver grava cada nome que o sino teve. O teste exige um "carregando" e nenhum "1" depois dele, e confere que a página não contém o nome do professor de A.
   - Se o cache de A sobrevivesse à troca, nunca haveria "carregando", e o `toBeGreaterThanOrEqual(0)` ficaria vermelho.
3. **"Tentar de novo" em `erro` com as leituras auditadas abertas:** feito, em `SinoDaCoordenacao.test.tsx:478-506`. O bloco novo troca a releitura por prefixo e fica vermelho pelo motivo certo: em `erro` os incidentes são relidos, e o prefixo `['privacidade']` alcança `consultaPedidosDoTitular` (`api/privacidade.ts:80`).
4. **A mesma contestação duas vezes:** feito, em `fila-da-coordenacao.test.ts:120-129`, com Camila em T1 nas duas disciplinas (Química e Física). O bloco que monta o `id` por professor e turma fica vermelho.
5. **Cláusulas novas da minha lista:** cada uma ganhou bloco, e conferi um a um contra o código.
   - `fila-da-coordenacao.ts`, linhas 128, 174, 185, 186, 225-226, 244, 245 e 276.
   - `Sino.tsx`, linhas 60, 104, 131 e 132.
   - Todos chegam à cláusula e falham pela asserção, com uma exceção, que está nas recomendações.
6. **Recomendações aplicadas:**
   - teste de clique duplo;
   - título da área no lugar da espera de 100 ms;
   - `atualizadoEm` zerado na volta a `carregando`, com caso de teste e bloco;
   - singular e plural de "turma sem professor", com bloco;
   - nova linha no `TODO.md`.

Os quatro arquivos de vitest passam: 56 testes. Não há `.skip`, `.only`, `waitForTimeout` nem espera fixa, e nenhum provedor de IA é chamado.

Bloqueantes:

1. **`apps/web/src/componentes/sino/Sino.tsx:137`: `disabled={tentandoDeNovo}` não tem bloco de mutação, e nada prova que o teste de clique duplo fica vermelho sem ele.** Eu deixei passar essa cláusula na 1ª rodada; ela pesa agora por causa do que esta rodada mudou.
   - O `techspec.md` §7c passou a dizer que o botão fica desligado enquanto relê (`tentandoDeNovo`) e que isso impede o clique duplo. Essa é a proteção de carga que a regra 80 pede.
   - O teste de `SinoDaCoordenacao.test.tsx:434` só tem bloco para a metade do "Atualizar" (`disabled={atualizando}`). Essa metade confere o atributo `disabled` no "Atualizando…".
   - A metade do "Tentar de novo" (`:450-452`) confere só a contagem `['/v1/professores']`. Sem o `disabled`, o segundo clique entra em `refetchQueries`, que por padrão tem `cancelRefetch: true` e cancela a leitura em curso. Se o cancelamento chega antes de a chamada sair, a contagem continua uma e o teste fica verde.
   - **Correção:**
     - segurar a resposta de `/v1/professores` durante o `dblClick`, como o teste já faz com os anos no "Atualizar";
     - conferir que o botão "Tentando de novo…" está com `disabled`;
     - acrescentar o bloco em `1_task.md`, com `-<Botao variante="secundario" disabled={tentandoDeNovo} onClick={aoTentarDeNovo}>` / `+<Botao variante="secundario" disabled={false} onClick={aoTentarDeNovo}>` e o teste `SinoDaCoordenacao.test.tsx › clique duplo`.

Recomendações:
- **O bloco de `fila-da-coordenacao.ts:244` (`1_task.md:414-419`) agora fica vermelho por laço de renderização, e não pela asserção.** Com a linha 245 nova, tirar `fila.situacao !== 'carregando'` faz as duas linhas se alternarem durante o carregamento, e o React lança "Too many re-renders". O cenário chega à cláusula, então não bloqueia. Mas o vermelho não é mais o "09:00 em vez de 09:01" que o teste descreve. Vale dizer isso no bloco, ou mudar a mutação para deixar o vermelho vir da asserção.
- **`sino-por-area.test.tsx:75`:** esperar o título é melhor que os 100 ms, mas o sino é `lazy()`, e o título da área não garante que um sino montado por engano já teria pedido a fila. Um `waitFor` curto sobre `LEITURAS_DA_FILA`, invertido e com prazo, fecharia isso sem depender da máquina.
- **`fila-da-coordenacao.test.ts:127`:** o nome `deCamilaEmT1` também pega o vínculo de Paulo em T1 (`startsWith('7º A')`). O teste passa e o bloco fica vermelho, mas filtrar por `para` antes do `detalhe` deixaria o que ele conta igual ao nome.
- **`e2e/sino-da-coordenacao.spec.ts:163`:** um "1" de A desenhado antes do primeiro "carregando" não é visto, e o próprio comentário diz isso. A garantia de que o item de A não aparece enquanto B carrega fica com o teste de componente, que tem bloco. Vale deixar isso escrito na linha da tabela de testes da tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.test.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/sino-por-area.test.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/e2e/sino-da-coordenacao.spec.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/techspec.md

## revisor-geral · 3ª rodada · APROVADO · 2026-10-16 09:17:59 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `apps/web/src/sino-por-area.test.tsx`: a espera invertida de 300 ms prova que o sino não pede a fila em 300 ms, não que ele nunca a peça. Na rodada nova, o controle da coordenação ganhou 5 s de prazo para achar o sino `lazy()`. Hoje o título da área chega antes e cobre a diferença. Se o chunk ficar mais lento, convém amarrar a ausência a algo que indique que a área montou o que monta por inteiro.
- Os restos da rodada 2 estão no `TODO.md` com destino. O ajuste de texto da `techspec.md` §7c, que descreve o sino duas vezes na célula de carga, é de uma linha e pode sair já na próxima correção, sem esperar outra spec.

Esta rodada só mexeu em teste, no `1_task.md` e no `TODO.md`. A árvore de trabalho é a mesma do `d0c18a9` nos arquivos do sino. O código de produção não mudou desde a rodada aprovada. Os testes alterados e as mutações batem com o código:
- **Clique duplo em "Tentar de novo":** o teste agora segura a releitura das turmas e confere que o botão fica desligado e que sai uma leitura só, de `/v1/turmas`. A mutação nova (`disabled={tentandoDeNovo}` para `disabled={false}`) aponta para a linha 137 de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.tsx`, que existe como descrita.
- **Mutação de "é a hora em que a fila terminou":** passou a remover também a linha 245 de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`, que zera a hora quando a fila volta a "carregando". Bate com o código atual.
- **Linha da troca de escola no `1_task.md`:** a mudança só diz qual teste cobre o caso (o de componente, não o e2e). Não muda comportamento e não precisa de registro na `techspec.md`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-16 09:18:57 · `tasks/prd-telas-da-coordenacao/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos (para esta rodada):** a correção exigida na 2ª rodada. O "Tentar de novo" precisa ficar desligado enquanto a leitura corre, com um bloco de mutação que o prove. Confiro também o que as mudanças nos três testes afetam.

**Cobertos:**
- **Correção 1, feita.** Ela foi cumprida por outra consulta, e a troca está correta. A ordem pedia segurar `/v1/professores`. O teste segura `/v1/turmas`, com a lista de turmas truncada. O motivo está no comentário do teste (`SinoDaCoordenacao.test.tsx:29-30`) e confere com o código. Se a consulta que falhou é relida, ela volta a "carregando" e o botão some. Com a lista truncada, os dados continuam na tela, a situação fica "parcial" e o botão de `Sino.tsx:137` continua visível. É o único caminho em que o segundo clique chega ao botão.
  - Depois do `dblClick`, o teste confere que "Tentando de novo…" está com `disabled` (linha 54).
  - Confere também que saiu uma leitura só, `['/v1/turmas']` (linha 55).
  - **O bloco de mutação existe** (`1_task.md:481-486`): `disabled={tentandoDeNovo}` vira `disabled={false}`, testado por `SinoDaCoordenacao.test.tsx › clique duplo`. Com a mutação, a linha 54 fica vermelha. A asserção está sobre a própria cláusula, então o vermelho é pelo motivo certo. O bloco do "Atualizar" (`1_task.md:474-479`) continua coberto pelo mesmo teste: os anos ficam segurados, a linha 70 confere o `disabled` e a 74 confere as cinco leituras.
- **`fila-da-coordenacao.test.ts:87-89`.** O filtro ficou mais estrito: professor e turma agora são filtrados juntos, antes de contar os dois itens e de conferir que os `id` não se repetem. Continua provando o caso do professor com duas disciplinas na mesma turma.
- **`sino-por-area.test.tsx:114`.** A prova de ausência ficou mais forte. Agora o teste espera 300 ms e exige que nenhuma leitura da fila tenha saído. Antes ele só olhava logo depois do título da área aparecer, e o sino, que é `lazy()`, poderia ainda não ter montado.
- **Rodei os três arquivos.** `SinoDaCoordenacao.test.tsx` e `sino-por-area.test.tsx` passaram (23 testes) com `npx vitest run` dentro de `apps/web`. `fila-da-coordenacao.test.ts` falhou de dentro de `apps/web`, sem chegar a rodar teste nenhum: o Vitest não achou a entrada do pacote `@educa/shared`. É problema de configuração ao rodar dali, e não do teste. Rodado a partir da raiz do repositório, passou (20 testes).
- **Sem `.skip`.** Nenhum mock esconde a regra: a rede falsa só segura e libera as respostas.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/sino-por-area.test.tsx:114`: a espera de 300 ms só vale porque o teste de controle, que roda antes no mesmo arquivo, já carregou o código do sino. O próprio teste de controle admite que esse carregamento pode levar até 5 s (linha 102). Se a ordem mudar, ou se o teste rodar sozinho com `-t`, um sino montado por engano pode só pedir a fila depois dos 300 ms, e o teste passaria sem pegar o erro. Correção sugerida: carregar o código do sino num `beforeAll` (`await import(...)`), para que os 300 ms não dependam da ordem dos testes.
2. Como a ordem pedia uma coisa e o código fez outra, vale anotar no `1_task.md`, junto do bloco de mutação, por que o clique duplo é provado com a lista truncada e não com a consulta que falhou: o comentário do teste já explica, mas o `/validar` lê o documento.
3. Os restos da rodada 2 estão registrados em `TODO.md:1275` e continuam valendo.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/sino-por-area.test.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/apps/web/src/componentes/sino/Sino.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-telas-da-coordenacao/tasks/prd-telas-da-coordenacao/1_task.md`
