# Achados das revisões — `tasks/prd-lgpd-e-titular/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-05 14:43:51 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Perfis usados: nenhum. A Tech Spec não chama modelo (seção 1, "Nada usa IA"; seção 8, "Não se aplica").

Custo estimado por professor/mês: R$ 0 em modelo, porque são zero chamadas. O que pesa na conta é Postgres: o expurgo noturno e a troca de nome fazem `UPDATE` em `consumo_ia` e `execucao_agente`, em lote e fora do horário letivo.

Prompt versionado: não se aplica.

Validação de schema: não se aplica.

Aprovação humana no caminho: não se aplica, porque nenhuma saída de IA é produzida.

Itens da lista:

| Item | Situação |
|---|---|
| 1. SDK fora dos adaptadores | Não se aplica |
| 2. Perfil | Não se aplica |
| 3. Prompt versionado | Não se aplica |
| 4. Schema | Não se aplica |
| 5. Timeout, recuo e custo por escola | Não se aplica |
| 6. Registro completo da execução | Afetado: ver os bloqueantes 1 e 2 |
| 7. Testes sem provedor pago | Implícito para a coluna nova: ver o bloqueante 2 |
| 8. Fila e idempotência | Não se aplica |
| 9. Entrega pendente e aprovação | Não se aplica |
| 10. Limite de passos e de custo | Não se aplica |

Sobre a medição de consumo e custo por escola: a governança soma só `tokens_de_entrada`, `tokens_de_saida`, `custo_micros`, `envio_externo` e `count(*)` por `escola_id`, `funcao` e `em` (`apps/api/src/governanca/governanca.repository.ts:166-181`). Anular `entrada`, `saida` e `aluno_id` em `consumo_ia` não toca nenhuma dessas colunas. O freio e o pacote do Tutor leem `mensagem_tutor`, não `consumo_ia` (`apps/api/src/ia/orcamento.repository.ts`), e o prazo mínimo de 3 meses cobre o mês corrente. Por esse lado, a medição continua de pé.

**Bloqueantes:**

1. **A anonimização de `execucao_agente` viola checks que já existem no banco.**
   - **Onde:** seção 3 (linha `execucao_agente` do catálogo, "anula `entrada`, `resultado`, `erro` e `solicitada_por`"), seção 5 (Eliminação, etapa 2, "anula a entrada e o texto do modelo das execuções do titular") e Migration 0024, que não mexe nesses checks.
   - **O que está errado:** em `packages/nucleo/drizzle/0022_mvp_apresentacao.sql:158-172`:
     - `entrada` é `NOT NULL` e `execucao_agente_entrada_da_tarefa` exige um objeto com `tarefa`;
     - `execucao_agente_resultado_so_na_concluida` exige `resultado` preenchido quando a execução está `concluida`;
     - `execucao_agente_erro_so_na_que_falhou` exige `erro` preenchido quando ela está `falhou`.
   - **Consequência:** o lote do expurgo falha inteiro e a fila tenta de novo para sempre. O alerta de duas noites dispara, e a eliminação nunca conclui.
   - **O `erro` não precisa sair:** ele já é só um código (`^[A-Z][A-Z0-9_]{2,63}$`) e não guarda dado de pessoa.
   - **Correção exigida:** a Tech Spec define a forma anonimizada compatível com os checks. Por exemplo:
     - `entrada` vira `{"tarefa": <tarefa>}`;
     - `resultado` vira `{"tipo": <tipo>}`;
     - `erro` é mantido;
     - `solicitada_por` vira nulo.

     A alternativa é a 0024 trocar esses checks por versões com `anonimizada_em`, no padrão expandir e depois contrair.

     Na seção 10 entra um teste de integração que anonimiza uma linha `pendente`, uma `concluida` e uma `falhou`. Depois dele, a soma da governança e a FK `consumo_ia → execucao_agente` têm de continuar intactas.

2. **`consumo_ia.provedor` sai de uma variável que não existe e não tem contrato.**
   - **Onde:** seção 2 (linha `packages/nucleo/src/ia`) e seção 3 (`consumo_ia + provedor?`).
   - **A variável não existe:** `IA_PROVEDOR_ID` não está em `esquemaAmbienteDeIa` (`packages/nucleo/src/config/config-ia.ts`). A família que existe é `IA_ADAPTADOR` e `LLM_*`.
   - **O que a Tech Spec não diz:**
     - onde a variável é validada;
     - se ela é obrigatória quando há envio externo;
     - que valor a coluna recebe com o adaptador `falso`, com `LLM_PROCESSAMENTO_LOCAL=true` e com `regra_fixa`;
     - como o valor chega ao `ConsumoRepository` (`apps/api/src/ia/consumo.repository.ts`), que monta o insert campo a campo.
   - **Risco para a medição:** se a implementação ler a variável na hora da gravação e lançar erro, o consumo deixa de ser registrado. Isso quebra a regra 30, item 4.
   - **Problema de desenho:** uma variável por processo grava o provedor errado quando a reserva da regra 80, item 4 existir.
   - **Correção exigida:**
     - a variável entra no `esquemaAmbienteDeIa` e é validada na subida;
     - ela é obrigatória com `openai_compat` e processamento não local, e tem formato fechado;
     - o id vai no próprio adaptador, ao lado de `envioExterno`, e passa por `MedicaoDaGeracao`, `ConsumoDeIa` e `ConsumoRepository`;
     - a coluna fica preenchida só quando `envio_externo` é verdadeiro e nula nos outros casos, com check `provedor is null or envio_externo`, e `not envio_externo or provedor is not null` como `NOT VALID` por causa das linhas antigas;
     - a gravação do consumo nunca falha por causa dela.

     Na seção 10 entram:
     - um teste de unidade do provedor que cobre o falso, o local e o externo com a resposta de um servidor falso, sem provedor pago;
     - um teste de configuração que recusa a subida sem a variável.

3. **O compartilhamento do titular some exatamente quando a eliminação precisa dele.**
   - **Onde:** seção 3 (`pedido_titular` não guarda o compartilhamento), seção 4 (`GET pedidos/:id` "traz compartilhamento") e seção 5 (Eliminação, etapa 2).
   - **A eliminação apaga a fonte:** `CicloDeVidaService.eliminar` apaga o usuário. Isso anula `consumo_ia.aluno_id` e `execucao_agente.solicitada_por` pelo `ON DELETE SET NULL` (`0022_mvp_apresentacao.sql:369,380`). Depois disso, o detalhe do pedido concluído só mostra a hospedagem, e o RF13 pede a lista justamente na eliminação, para a escola avisar cada suboperador (LGPD, art. 18, § 6º).
   - **Caminho do professor indefinido:** a Tech Spec não diz como o compartilhamento do professor é calculado. `consumo_ia` não tem coluna de usuário (D64), então o único caminho é `consumo_ia.execucao_id → execucao_agente.solicitada_por`.
   - **Correção exigida:**
     - guardar uma foto do compartilhamento no pedido, sem dado de pessoa: `suboperador_id`, `chave`, primeiro e último uso. Pode ser uma coluna jsonb ou uma tabela de ligação;
     - a foto é gravada no registro do pedido e refeita na etapa 2, antes de `eliminar`;
     - a origem é declarada: aluno por `consumo_ia.aluno_id`, professor pela junção com `execucao_agente.solicitada_por`, as duas com `envio_externo` e `provedor`;
     - um `provedor` sem `suboperador.chave` correspondente aparece como "provedor não cadastrado", sem ser descartado;
     - o teste de integração prova que o pedido de eliminação concluído ainda devolve o provedor.
[… 17 linhas cortadas]

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-05 14:44:12 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `retencao_escola`, `pedido_titular`, `arquivo_titular`, `suboperador`, `suboperador_escola`, `incidente`, `incidente_escola`, `expurgo_execucao`, `usuario` (+`eliminacao_agendada_em`), `consumo_ia` (+`provedor`), `auditoria` (check do autor `rotina`). Conferi também que já têm `escola_id` todas as tabelas que o expurgo e a troca de nome alcançam: `mensagem_tutor`, `sinal_tutor`, `mensagem_agente`, `thread_agente`, `execucao_agente`, `consumo_ia`, `artefato`, `entrega`, `tentativa_atividade`, `resposta_atividade`, `correcao`, `reivindicacao` e `material`.

Queries verificadas: o `EscolasDaRotinaRepository`; o `ExpurgoDaEscolaRepository` e o `RetencaoDaEscolaRepository` no job por escola, com a escola tirada do `job_registro`; a troca de nome (homônimo e campos livres); a eliminação pelo `CicloDeVidaService` movido; a leitura de suboperador, por junção ou por `alcance = todas`; a leitura e a confirmação de incidente; busca e prévia de titular; pedidos, arquivo e "Meus dados"; os comandos `ops:*`; a extensão do `sistema.expurgar-acesso` ao incidente.

Teste de isolamento: presente, mas incompleto. Os testes da seção 6 que existem são efetivos: o expurgo de A com prazo menor, a troca de nome com o mesmo nome em B, o professor que também está em B, o arquivo do colega. Faltam três leituras com escopo, descritas no bloqueante 4.

Bloqueantes:

1. **Seções 2, 6, 11 e 13 (mover o `CicloDeVidaService` para `packages/nucleo`).**
   - **O problema:** hoje o serviço chama `ResolucaoDeTenantRepository.travarConta` e `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts:59,84,115`). Os dois métodos são `@SemEscopo` sobre a `conta` global. O desvio da regra 10, item 9 só é aceito porque fica dentro de `apps/api/src/sessao`, e quem garante isso é o teste `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts:58-77`. A exceção da `Conta` em `docs/modelo-de-dados.md` (regras transversais, item 1) também diz "só alcançada pelo módulo `sessao`". O `nucleo` não pode importar de `apps/api`, então mover o serviço obriga a mover ou duplicar esses `@SemEscopo`. A Tech Spec não trata disso e afirma ter "um `@SemEscopo` novo" só.
   - **Correção exigida:** a Tech Spec deve dizer onde ficam os métodos da conta global depois da mudança (por exemplo, um repositório próprio no `nucleo/ciclo-de-vida`, com a justificativa escrita), quem pode importá-los e como o teste de arquitetura e a exceção da `Conta` no `modelo-de-dados.md` passam a garantir esse novo limite.

2. **Seções 1, 2, 5, 6 e 11 (lista de consultas sem escopo incompleta e contraditória).**
   - **O problema:** as seções 2 e 11 dizem "único `@SemEscopo` novo", e a seção 6 aceita "os `ops:*`, com a justificativa do painel" sem listar nenhum método. Ficam sem justificativa nem dono:
     - a leitura entre escolas do `ops:privacidade`;
     - as escritas de `suboperador_escola` e `incidente_escola` para várias escolas;
     - a extensão de `ExpurgoDeAcessoRepository.apagarLoteVencido` ao `incidente`, que apaga em cascata `incidente_escola` de todas as escolas. A justificativa atual desse método só cobre acesso, sessão e convite.
   - Além disso, `suboperador` e `incidente` entram como exceção da regra transversal 1 sem a cláusula "só alcançadas por X", que as outras tabelas da operação têm e que o teste de arquitetura confere (`TABELAS_DA_OPERACAO`, linha 133).
   - **Correção exigida:** pôr na seção 6 uma tabela "repository.método, o que faz, justificativa", como a do painel em `docs/modelo-de-dados.md`. Declarar que `ops:retencao`, `ops:incidente` e `ops:suboperador` abrem o contexto de cada escola antes de escrever a ligação. Atualizar a justificativa do expurgo de acesso. Nomear os repositórios que tocam `suboperador` e `incidente`, com a lista de exceções e o teste de arquitetura atualizados.

3. **Seções 3 e 4 (`incidente` lido pela escola).**
   - **O problema:** `titulares_estimados` e `categorias` estão só no `incidente`, que é compartilhado. A coordenação de A, num incidente de A e B, recebe o total das duas escolas. Isso revela que outra escola cliente foi afetada e quanto dado ela tem, e A não consegue informar o número dela própria (Res. CD/ANPD 15/2024, art. 10). A rota `GET incidentes` também não tem DTO definido. `circunstancias`, `contencao` e `correcao` são texto livre do operador, também compartilhado, e podem citar outra escola.
   - **Correção exigida:** levar `titulares_estimados` (e `categorias`, se variar por escola) para `incidente_escola`. Listar campo a campo o DTO de `GET incidentes`, sem nada agregado de outras escolas. Dizer como o texto livre fica sem menção a outra escola (texto por escola ou regra do comando). Incluir um teste com sentinela: a coordenação de A não recebe a contagem de B.

4. **Seções 6 e 10 (testes de isolamento faltando).**
   - **O problema:** faltam três testes, cada um ligado a uma prova que o PRD exige:
     - o suboperador que atende só A não aparece para B (RF7). A consulta `junção OR alcance = todas` é exatamente onde a precedência do `OR` derruba o escopo;
     - o ajuste de retenção em A não muda o prazo lido nem aplicado em B (RF2);
     - `POST pedidos` com `titularId` de B responde igual ao id inexistente, com o mesmo código e o mesmo status, sem erro do gatilho vazando (RF10).
   - **Correção exigida:** pôr os três testes na seção 6. Cada um precisa falhar quando a cláusula de escola, ou a junção com a ligação, é retirada.

Recomendações:
- `pedido_titular`: deixar `escola_id` e `titular_id` imutáveis também no UPDATE (gatilho ou check), não só conferidos na inserção.
- Teste de que A confirmar o incidente não confirma a linha de B, e de que `POST incidentes/:id/confirmar` com incidente só de B dá `NAO_ENCONTRADO`, não 204.
- Teste de que o professor com usuário em A e em B não vê, em "Meus dados" de B, o arquivo do pedido de A. Teste de que o compartilhamento lê `consumo_ia` pelo usuário da escola do contexto, nunca pela `conta` global.
- Dizer de forma explícita que todo id novo é UUID (`pedido_titular`, `arquivo_titular`, `suboperador`, `incidente`, `expurgo_execucao`), já que `pedidos/:id` e `meus-dados/:id` vão para a URL.
- Registrar o `EscolasDaRotinaRepository` e sua justificativa em `docs/modelo-de-dados.md`. O módulo `retencao` já tem três `@SemEscopo`, e criar o módulo `rotina` para não somar mais um merece uma linha dizendo por quê, para não parecer contorno do item 9 da regra 10.
- Passar ao `conformidade-reviewer`: o `nomes_trocados` devolvido à coordenação inclui as ocorrências em `mensagem_agente.conteudo`, o que diz algo sobre a conversa do professor (regra 70, item 8). Pode ser melhor devolver só se houve troca, ou excluir essa contagem.
- Item 7 (camada de rede): não se aplica. Nenhuma leitura de rede é nova, e o `ops:privacidade` já tem sentinelas previstas.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-05 14:44:18 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos** (do PRD, seções 5 e 7, e das regras 10, 20, 40 e 80)
- **Fatia 1, RF1 a RF5.** Escola nova nasce com o prazo padrão; toda tabela tem categoria. O ajuste por comando respeita piso e teto, recusa as categorias fixas, vale só para a escola ajustada e fica auditado. Expurgo com relógio injetado, um dia antes e um dia depois. Reexecutar não apaga mais. Prazo reduzido vale no expurgo seguinte. Expurgo conta do ano letivo encerrado. Registro da execução sem conteúdo. Carga entre escolas. Ensaio dos dois alertas.
- **Fatia 2, RF6 a RF9.** Cadastro e encerramento de suboperador, com histórico e auditoria. B não vê suboperador que atende só A. Incidente sem dado de titular, guardado 5 anos. Aviso até a confirmação, registrando quem confirmou e quando. Medida das 24 h. B não vê o aviso de A.
- **Fatia 3, RF10 a RF17.**
  - Pedido com titular de B responde igual a id inexistente.
  - Sentinela por tabela no arquivo.
  - Arquivo completo só para o titular.
  - Versão da coordenação só sem conta ativa e sem a conversa do professor.
  - Arquivo some no 8º dia.
  - Compartilhamento com e sem provedor.
  - Acesso cai na requisição seguinte e volta ao cancelar.
  - Cancelado no 6º dia, eliminado no 8º.
  - Troca do nome completo, com homônimo.
  - Máquina de estados e prazo de 15 dias contado da chegada.
  - Auditoria de cada passo.
  - Varredura de log e de resposta.
- **Transversais, RF18 a RF20.** Isolamento em cada rota e em cada rotina. Concorrência em paralelo: clique duplo, rotina rodando duas vezes, expurgo junto da eliminação. E2E em `chromebook` e `celular` com acessibilidade.
- **Casos de borda do PRD.** Aluno transferido ou mesma matrícula em outra escola; homônimo ativo; coordenadora pedindo a própria eliminação; prazo reduzido; pedido feito pelo responsável legal.
- **Permissão.** Aluno e professor fora de `/v1/privacidade`; coordenação não baixa a versão `completa`; colega não baixa o arquivo do outro.

**Cobertos** (seções 6, 7c e 10 da Tech Spec)
- Classificação das tabelas (RF1, parte).
- Piso e teto em unidade (RF2, parte).
- Expurgo por categoria com relógio, e reexecução (RF4).
- Carga "justiça entre escolas" (RF5, parte).
- Sentinela por tabela (RF11).
- Compartilhamento com e sem `provedor` (RF13).
- Cancelado no 6º dia e executado no 8º (RF14, parte).
- Nome some em três campos, primeiro nome fica, homônimo (RF15, parte).
- Sentinelas em `ops:privacidade` (RF17, parte).
- Isolamento:
  - GET de pedido, arquivo, prévia e busca de B;
  - expurgo de A não toca B;
  - troca de nome de A não toca B;
  - professor em A e B;
  - incidente de A e B;
  - aluno contra arquivo de colega.
- Quatro corridas da seção 7c: pedido duplo, duas eliminações, cancelar com executar, expurgo com eliminação.
- Rate limit da busca com 429.
- Quatro fluxos E2E nos dois projetos.

**Bloqueantes**

1. **RF2 sem teste de integração (seções 10 e 6).** "Piso e teto" em unidade não prova o comando: um `ops:retencao` que pula a validação passa no teste. Correção exigida, com testes de integração do comando:
   - abaixo do piso e acima do teto dão `RETENCAO_FORA_DO_LIMITE`;
   - categoria fixa (registro de acesso, auditoria) é recusada;
   - `retencao.ajustada` fica na auditoria com operador e referência;
   - ajuste em A não muda o `GET retencao` de B.

2. **Prazo vindo do ajuste e caso "a operação reduz um prazo" (RF4 e PRD seção 7, seção 10).** Se os testes "por categoria" usam o prazo padrão, a mutação "ignorar `retencao_escola`" passa. O teste de isolamento da seção 6 só afirma que B fica.
   - Exigir um teste em que o ajuste em A encurta o prazo: a linha de A sai, a linha de B com a mesma idade fica.
   - Exigir também que aumentar o prazo depois não traz nada de volta.

3. **Virada de ano letivo (seção 3, `trabalho_do_aluno` e `autoria_de_artefato`; seção 10).** O `ano_letivo` tem `situacao` (`planejado`, `em_curso`, `encerrado`) e `fim` é data planejada. O PRD, na seção 6, conta "do encerramento do ano". Nenhum teste distingue as duas coisas. Exigir: ano com `fim` vencido há mais que o prazo, mas ainda `em_curso`, não perde nada; o mesmo ano `encerrado` perde.

4. **RF5 e RF9: alertas e medida das 24 h sem teste (seções 7c e 10).** As métricas `educa_retencao_ultima_conclusao_segundos` e `educa_incidente_sem_confirmacao` não aparecem na seção 10. O PRD pede "ensaio do alerta", e a regra 80, item 10, junto com a D52, põem isso no `test:infra`.
   - Exigir uma linha de `test:infra` para os dois alertas, cada uma ligada ao parágrafo do runbook.
   - Exigir um teste de integração de que `expurgo_execucao` grava as contagens certas por escola e categoria, e nada além de ids e números.

5. **RF6 e RF7 sem nenhum teste (seções 6 e 10).** Falta cobrir:
   - cadastrar e encerrar por `ops:suboperador`, com auditoria;
   - o encerrado continua no histórico com o período;
   - isolamento: B não vê o suboperador com `alcance = lista` que atende só A, mas vê o de `alcance = todas`;
   - `suboperador_escola` com `fim` aparece como passado.
   
   A regra 10, item 5, exige o teste de isolamento.

6. **Prazos fixos sem teste (seção 3, "Prazos fixos"; RF8 e RF12).** "No 8º dia o arquivo não existe" (RF12) não está na seção 10. O incidente de 5 anos e o `expurgo_execucao` de 90 dias também não. Exigir, com relógio:
   - arquivo com 7 dias fica, com 8 some: objeto e linha;
   - incidente com 5 anos mais um dia sai pelo `sistema.expurgar-acesso`;
   - `expurgo_execucao` com 91 dias sai.

7. **Versão da coordenação testada só em unidade (seção 10, unidade).** O processador pode gravar a `completa` nas duas versões, e o teste de unidade do montador continua verde. Exigir em integração:
   - o objeto `coordenacao` gravado no armazém falso não contém a sentinela de `mensagem_agente`, e contém a do Tutor;
   - com o titular ainda com conta ativa, a versão `coordenacao` não existe e `POST pedidos/:id/arquivo` dá `NAO_ENCONTRADO`;
   - cada download grava `titular.arquivo_baixado` com finalidade (regra 20, item 10).

8. **RF14, metade sem teste: "o acesso cai na requisição seguinte" (seções 5 e 10).** Exigir:
[… 74 linhas cortadas]

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-05 14:44:36 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Avaliei o desenho em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md` e no PRD da mesma pasta. Para ver o que já existe, consultei `docs/interface.md` e o `apps/web` (navegação, `Tabela`, `Abas`, `DialogoDeConfirmacao`, `MenuDaPessoa`, `SeletorDeEscola` e o catálogo de erros, que é exaustivo pelo tipo).

**Estados:** faltando. A seção 9 promete "os quatro estados" de forma genérica. O vazio de "Meus dados" não está definido, e essa tela fica vazia quase sempre, porque o arquivo só existe por 7 dias depois de um pedido. A passagem de "em preparação" para "pronto" na tela da coordenação também não está desenhada (bloqueantes 2 e 3).

**Acessibilidade:** fica implícita. As peças da A1 cobrem teclado, foco e a lista no celular. Três pontos não estão garantidos:
- o aviso de incidente é um modal que prende a pessoa (bloqueante 5);
- a busca não diz como dispara nem como anuncia o resultado (bloqueante 4);
- o "vencido destacado" do RF16 não diz que não depende só de cor.

A seção 10 também não cita verificação de acessibilidade no e2e, que o RF20 pede.

**Chromebook fraco:** em geral ok. As telas entram por `lazy` com o teto de 30 kB, a lista de pedidos é paginada em 50, as listas do resto são curtas, não há upload, e os projetos `chromebook` e `celular` já limitam CPU e rede. Um furo: a busca de titular, no jeito em que está, esgota o limite de 30 buscas por minuto enquanto a coordenadora digita (bloqueante 4).

**Celular:** ok na estrutura. A tabela vira lista abaixo de 768 px, as abas quebram linha a 360 px e o e2e roda nos dois projetos. Falta dizer onde "Meus dados" do professor fica no trilho e na gaveta: o `MenuDaPessoa` hoje só tem o nome e o Sair. Nenhum fluxo exige o celular.

**Feed de agentes:** não se aplica. A spec não mexe na Home nem em "Seu time".

**Seletor de escola:** garantido pelo que já existe. Trocar de escola cria sessão nova e esvazia o cache, então Privacidade, "Meus dados" e o aviso de incidente seguem a escola ativa. A tela só precisa dizer isso no vazio (bloqueante 3).

**Ação oficial protegida:** não. A confirmação da eliminação existe, mas não identifica sem ambiguidade quem será eliminado (bloqueante 1). A confirmação de incidente e o download pela coordenação não têm o conteúdo definido (bloqueantes 2 e 5).

**Português e erro:** o catálogo exaustivo garante uma mensagem para cada código novo. Faltam alguns textos (ver recomendações).

## Bloqueantes

1. **Não dá para saber de quem é o pedido (seções 4, 7 e 9).**
   - **O problema:**
     - A busca devolve só `id, nome, papel, ativo`. Dois alunos com o mesmo nome na escola, caso de borda da regra 40, ficam iguais na tela.
     - A seção 7 diz "o nome só na busca da coordenação". Com isso, a lista e o detalhe do pedido não dizem a quem ele se refere, e a coordenadora acompanha 15 dias de pedidos sem nome.
     - A eliminação, que não tem volta depois de 7 dias, é confirmada sem nada que distinga o aluno certo.
     - O aviso de homônimo só chega depois de executar (`homonimo` vem no detalhe).
   - **Correção exigida:**
     - A busca e a prévia trazem a turma do ano letivo (aluno) ou o vínculo (professor).
     - O diálogo de confirmação do registro mostra nome, papel, turma, tipo, quem pediu, data de chegada, contagem por categoria, compartilhamento e o aviso de homônimo antes de confirmar. A eliminação usa a família `perigo`.
     - A lista e o detalhe mostram nome e turma enquanto o titular existe, e "Titular eliminado" depois.
     - O e2e escolhe o aluno certo entre dois homônimos.

2. **A seção 9 deixa de fora fluxos que a seção 4 e o PRD exigem, e a seção 10 não os testa.**
   - **O problema:**
     - Não há botão **Concluir** (acesso, compartilhamento, correção). Sem ele o pedido fica "pronto" e vence os 15 dias do RF16.
     - Não há o **download da versão da coordenação** (`POST pedidos/:id/arquivo`, RF12, "com auditoria e finalidade"). Não está dito onde se informa a finalidade nem o diálogo que avisa que o acesso fica na auditoria e que o arquivo traz a conversa do Tutor, que é a exceção à regra 20, item 14.
     - O **pedido de correção** não aponta para onde a correção se faz. É pergunta do PRD, seção 10, que ficou sem resposta.
     - Não se diz como a tela percebe que o arquivo ficou pronto.
   - **Correção exigida:** desenhar esses quatro fluxos na seção 9. A abertura do arquivo segue o padrão do dado nominal: botão `oficial` à parte, com diálogo que diz o que contém e que fica registrado. Acrescentar ao e2e da seção 10: o download pela coordenação, o Concluir, a aba Suboperadores e o "Meus dados" do professor.

3. **"Meus dados": o contrato contradiz a tela, e o vazio não está definido (seções 4 e 9).**
   - **O problema:** a seção 9 promete "o resumo por categoria", mas `GET /v1/meus-dados` devolve só os arquivos vigentes, e o JSON nunca é renderizado. Ou a rota devolve as contagens, ou o resumo não existe sem arquivo. O vazio, que é o estado normal da tela, não tem texto.
   - **Correção exigida:**
     - Definir o DTO da rota, com ou sem contagens.
     - Escrever o vazio como convite, por exemplo: "Para receber uma cópia dos seus dados, peça à coordenação da escola." Para o professor com mais de uma escola, a tela diz que mostra só os arquivos da escola ativa.
     - Escrever o estado "em preparação" e o estado "expirou".

4. **A busca de titular não diz como dispara (seções 4 e 7c).**
   - **O problema:** são 30 buscas por minuto por usuário, mínimo de 3 letras, e cada busca grava `titular.buscado` na auditoria. Se a busca disparar a cada tecla, digitar "Maria Eduarda" uma ou duas vezes chega ao 429 e enche a auditoria de linhas sem sentido.
   - **Correção exigida:**
     - A busca dispara por envio explícito (Enter ou botão "Buscar"), com o mínimo de 3 letras validado no campo.
     - O 429 vira texto que diz o que fazer, por exemplo: "Muitas buscas seguidas. Espere um minuto e tente de novo."
     - O número de resultados é anunciado por `aria-live`.

5. **O aviso de incidente "só sai com Recebi" (seções 5 e 9).**
   - **O problema:**
     - O conteúdo do diálogo não está definido. A confirmação é registro com valor legal: prova quando a escola soube, e dela corre o prazo de 3 dias úteis da escola. Um modal que só fecha confirmando transforma o registro num clique reflexo, que é exatamente o que a regra 50, item 8, proíbe.
     - Prender a casca deixa o **Sair** fora de alcance, o que vai contra a D59 e a seção 11.1 da interface (Sair a um toque).
   - **Correção exigida:**
     - O diálogo mostra, antes do botão "Confirmo que recebi": quando foi conhecido, o que aconteceu, as categorias de dado, o número estimado de titulares, o risco, a contenção, e o que a escola precisa fazer, com o prazo legal dela.
     - Há um "Ver depois" que mantém uma faixa fixa no topo até a confirmação, e a confirmação também pode ser feita pela aba Incidentes.
     - O Sair continua alcançável.
     - O e2e passa por teclado e a 360 px, com a rolagem dentro do diálogo.

6. **O arquivo baixado fica no computador compartilhado da escola (seções 5 e 9, contra o RF17).**
   - **O problema:** o caminho `fetch` → arquivo salvo deixa o JSON, com as conversas do Tutor de um menor, na pasta de downloads do Chromebook ou do laboratório, à vista do próximo aluno. Isso vale para o aluno e para a coordenação.
   - **Correção exigida:**
     - O nome do arquivo não leva o nome da pessoa (por exemplo, `meus-dados-AAAA-MM-DD.json`).
     - Antes de baixar, a tela avisa o que o arquivo contém e pede para apagá-lo se o computador é da escola.
     - O e2e confere o nome do arquivo.

## Recomendações

[… 13 linhas cortadas]

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-05 14:45:08 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A tabela `nota` não existe (`packages/nucleo/src/db/schema/correcao.ts`, cabeçalho), e a Tech Spec não cria escrita nova nela. A spec só apaga `correcao`, em cascata da `tentativa_atividade` (seção 3, `trabalho_do_aluno`, e eliminação na seção 5). Todos com autor humano? sim, porque não há escrita.

Decisão autônoma sobre aluno: ausente. A eliminação só acontece por pedido registrado pela coordenação. O expurgo de `pessoa_desativada` aplica o prazo de retenção e não toca aprovação, reprovação nem encaminhamento.

Aprovação registrada: falta em dois fluxos.
- No arquivo do titular (seção 5, "Arquivo"), a correção de um lote ainda não aprovado chega ao aluno.
- Na troca de nome (seção 5, "Eliminação", etapa 1), a saída de IA já aprovada muda sem deixar registro.

Supervisão do tutor: ok. Retenção e expurgo não criam uso invisível. O piso de 3 meses fica como recomendação.

Autonomia declarada e visível: sim. A spec não cria agente nem função nova, e a seção 8 diz "Não se aplica".

Bloqueantes:

1. **Seção 5 "Arquivo", seção 7b e seção 10 (Unidade).** A versão `coordenacao` exclui só a "conversa do professor", e o catálogo da seção 3 define isso como `mensagem_agente`/`thread_agente`. Ficam de fora da exclusão dois lugares que guardam o texto que o professor escreveu na conversa:
   - `execucao_agente.entrada.parametros.tema` (`packages/shared`, `esquemaEntradaDaExecucao`);
   - `consumo_ia.entrada`/`saida` das tarefas do Assistente. O próprio schema diz que a retenção delas "é a da conversa dele" (`consumo-ia.ts`, cabeçalho).

   Do jeito que está escrita, a versão da coordenação pode levar o tema e o texto do modelo do professor (regra 70, item 8).

   **Correção:** a seção 5 lista por campo o que a versão `coordenacao` de um professor nunca traz: `mensagem_agente`, `thread_agente`, `execucao_agente.entrada` e `consumo_ia.entrada`/`saida` das execuções pedidas por ele. O teste de unidade e o de integração semeiam um tema-sentinela e provam que ele não está no JSON da coordenação e está no da versão `completa`.

2. **Seção 4 (`GET titulares/:id/previa`) e seção 7 (auditoria).** A prévia devolve contagem por categoria e compartilhamento para qualquer titular, antes de existir pedido, e não está na lista de eventos auditados (só `titular.buscado` está). Para um professor, isso mostra à coordenação quantas mensagens ele trocou com o Assistente, quantas execuções pediu, quantos artefatos tem e em que período usou cada provedor. É medição nominal de adoção sem pedido e sem auditoria (regra 70, itens 8 e 9; D64). Além disso, montar o compartilhamento juntando `consumo_ia` com `execucao_agente.solicitada_por` cria o "consumo por professor" que o schema proíbe.

   **Correção:** para professor, a prévia não mostra contagem nem período das categorias `conversa_professor`, `execucao_agente`, `texto_do_modelo` e `autoria_de_artefato`; mostra no máximo que a categoria existe. O compartilhamento por provedor só aparece depois do pedido registrado. A leitura da prévia entra na auditoria com finalidade (`titular.previa_lida`). Um teste de integração prova que a coordenação não obtém contagem de uso de um professor fora de um pedido.

3. **Seção 3, categoria `execucao_agente` ("anula `entrada`, `resultado`, `erro`").** Isso fere as restrições que já existem em `execucao_agente.ts`:
   - `entrada` é `notNull` e tem o check `execucao_agente_entrada_da_tarefa`;
   - o check `execucao_agente_resultado_so_na_concluida` exige `resultado` na execução concluída;
   - o check `execucao_agente_erro_so_na_que_falhou` exige `erro` na que falhou.

   A migration 0024 (seção 3) não relaxa nenhum deles, então o expurgo falha. Além disso, `resultado` e `erro` só guardam ids e códigos, sem pessoa. `resultado` é o elo da execução com o que ela produziu (mensagem, artefato, entrega, resumo), e anulá-lo enfraquece a trilha "o que a IA gerou" (regra 70, item 6) sem ganho de privacidade. O mesmo vale para a etapa 2 da seção 5, "anula a entrada".

   **Correção:** manter `resultado` e `erro`. Trocar `entrada` pela forma mínima `{ tarefa }`, ou retirar `parametros.tema`, para continuar válida no check. Se algum check precisar mudar, isso fica declarado na migration. O teste de integração do expurgo e da eliminação roda contra as restrições reais das migrations 0022 e 0023.

4. **Seção 5 "Arquivo" e RF11/RF12 do PRD.** "Tudo do titular, em todas as categorias", com sentinela em toda tabela, coloca no arquivo baixado pelo aluno a `correcao` (acertos, `por_habilidade`, `destaques`) de lote `pendente` ou `rejeitado`. Hoje o aluno só alcança correção de lote `aprovada` (`correcao.ts`, cabeçalho). O arquivo vira um caminho que entrega ao aluno um resultado que ninguém validou, ou que foi rejeitado (regra 70, item 3; D7, D33, D56). A spec não decide isso.

   **Correção:** a seção 5 decide de forma explícita. Ou a correção de lote não aprovado sai sem acertos nem diagnóstico, só como "em validação pelo professor" ou "rejeitada pelo professor"; ou o pedido declara a exceção, com a base do art. 19 escrita. Um teste de integração prova que o resultado de um lote pendente não aparece como resultado no arquivo.

5. **Seção 5 "Eliminação", etapa 1.** A troca de nome reescreve `artefato.conteudo`, inclusive o de uma versão adaptada já aprovada e aplicada à turma (o artefato "não muda depois de gravado", `artefato.ts`), e reescreve `entrega.justificativa`, que é a decisão humana. Nada registra qual item mudou. A coordenação recebe só a contagem `nomes_trocados`. Depois disso a auditoria mostra como "o que a IA gerou e o professor aprovou" um texto que não foi o aprovado, sem sinal da alteração (regra 70, itens 3 e 6; regra 20, item 10).

   **Correção:** cada linha alterada de `artefato`, `entrega`, `execucao_agente` e `consumo_ia` ganha uma linha de auditoria só com ids: `acao = 'titular.nome_trocado'`, tabela, id da linha, id do pedido e autor. A outra opção é uma marca na própria linha (`anonimizado_em`, `pedido_id`) que a tela da governança mostre. Um teste prova que, depois da troca, a consulta "o que a IA gerou, quem aprovou e quando" indica que o conteúdo foi alterado por eliminação.

Recomendações:
- **Relatório da correção (texto da IA).** Hoje ele só existe em `consumo_ia.saida`, com teto de 12 meses, enquanto a `entrega` fica 5 anos. Quando o relatório for ligado ao lote (F6), o texto do que a IA gerou precisa ficar pelo prazo da entrega. Vale anotar isso no catálogo agora.
- **Autor `rotina`.** Restringir por check do banco as ações em que ele pode aparecer (retenção e eliminação). Hoje só o revisor confere (seção 13). Um teste deve provar que `rotina` nunca aparece em aprovação ou rejeição de entrega nem em validação de lote.
- **Piso de 3 meses de `conversa_tutor` e `sinal_tutor`.** Ele pode ficar menor que o bimestre em que o professor revisa o modo casa ("registro e resumo"). Avaliar um piso igual ao período avaliativo, ou um aviso na tela de Retenção.
- **Seção 7b.** Hoje diz só "sem IA no caminho". Vale citar ali também os itens 3 e 6 da regra 70 (o que fica da entrega, da validação e da execução depois da eliminação), não só o item 8, para o `/validar` ter onde conferir.
- **Seção 6.** Somar aos testes de isolamento que a prévia e o compartilhamento de um professor não alcançam a execução de outra pessoa da escola. A junção por `solicitada_por` é o ponto frágil.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/execucao-agente.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/consumo-ia.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/correcao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/artefato.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/entrega.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/time/execucao.ts

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-05 14:45:48 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a guarda da sessão e os logins recusam `eliminacao_agendada_em`), fila, migration
Rate limit: ok. O balde por usuário e por escola do F0 continua valendo, e a busca de titular ganha `rl:busca-titular` com 30 por minuto por usuário (seção 7c). Nenhum limite é só por IP.
Fila e prioridade: ok. Expurgo e eliminação vão para o lote, não urgentes e segurados pela janela letiva; o arquivo vai para a fila normal; a vaga por escola é a do F0 (seção 5, seção 7c). Nada demorado roda dentro do request. A guarda lê uma coluna a mais da linha que já lia (conferido em `packages/nucleo/src/identidade/sessao.repository.ts:57`). Gateway de IA e prova online não se aplicam: o expurgo de trabalho do aluno só alcança ano letivo encerrado.
Concorrência: corrida na seção 7c ("Pedido duplo" contra "Duas eliminações") e na seção 5 ("Eliminação", etapa 1)
Índice e paginação: faltando
Degradação de IA: não se aplica
Migration: compatível. As colunas novas são nulas e as tabelas são novas. Índice sem `concurrently` é aceitável hoje porque não há produção nem staging, e a seção 13 já declara a troca para depois.
Métrica e alerta: ok, com uma recomendação abaixo
Bloqueantes:
1. **Seção 7c, "Corridas de concorrência".** A spec manda verificar o pedido `agendado` antes da `chave_envio`. Na eliminação, o clique duplo ou o reenvio depois de a rede cair (mesma chave) recebe `PEDIDO_EM_ESTADO_INVALIDO`, e o cliente acha que falhou um pedido que ficou agendado. Isso contradiz a linha "Pedido duplo: o segundo recebe o mesmo pedido".
   - **Correção exigida:** a chave decide primeiro, em qualquer tipo de pedido: a mesma `(escola_id, chave_envio)` devolve o mesmo pedido. Só uma chave diferente para o mesmo titular cai no índice parcial de `agendado` e recebe `PEDIDO_EM_ESTADO_INVALIDO`.
   - **Teste:** dois cenários em paralelo, um com a mesma chave e outro com chaves diferentes.
2. **Seção 5, "Eliminação", etapa 1.** A troca de nome roda antes da transação que trava o pedido e não confere o estado dele. Ela altera de forma irreversível texto de terceiros (artefato e conversa do professor) mesmo que o pedido tenha sido cancelado ou já concluído. A API e o worker comparam `eliminar_em` com relógios diferentes. Além disso, todo expurgo noturno enfileira de novo `titular.eliminar` para cada pedido `agendado` vencido, sem deduplicação (o `Enfileirador` não tem chave). Jobs repetidos se acumulam e cada um refaz a varredura inteira. A trava "Cancelar com executar" da seção 7c não cobre essa etapa.
   - **Correção exigida:** a etapa 1 começa lendo o pedido e só segue se ele está `agendado` e com `eliminar_em <= now()` do banco. O cancelamento compara com o mesmo `now()`.
   - **Correção exigida:** um único `titular.eliminar` por pedido, marcado no pedido na mesma transação do enfileiramento.
   - **Teste:** cenário de concorrência "cancelamento na fronteira do prazo com a etapa 1" e "dois `titular.eliminar` do mesmo pedido".
3. **Seção 7c, "Índices novos", e seção 5.** Faltam índices que comecem pelo escopo para os caminhos por titular. Cada `mensagem_tutor` gera uma `execucao_agente`, então essa tabela cresce com o tutor (cerca de 7 milhões de linhas por ano, `docs/infra.md` 3.6). O `statement_timeout` do worker e da API é de 2 s (`.env.example:42`).
   - Faltam `execucao_agente (escola_id, solicitada_por)`, `artefato (escola_id, criado_por)` e `tentativa_atividade (escola_id, aluno_id)`. Sem eles, o `ON DELETE SET NULL` e o cascade disparados pelo `CicloDeVidaService.eliminar` varrem a tabela. O mesmo vale para a prévia, que roda dentro do request (`GET titulares/:id/previa`), para o arquivo e para "anula a entrada das execuções do titular". A frase da spec "consultas indexadas por titular" é falsa hoje.
   - Nas categorias que anonimizam e mantêm a linha (`execucao_agente`, `consumo_ia` com dois predicados, `artefato.criado_por`), um índice só por data faz cada noite percorrer de novo tudo o que já foi anonimizado. A varredura cresce sem fim até estourar os 2 s.
   - **Correção exigida:** criar os três índices por titular, parciais `where <coluna> is not null`.
   - **Correção exigida:** um índice parcial por categoria de anonimização, com o predicado "ainda não anonimizado", e listar os dois de `consumo_ia` separadamente.
   - **Correção exigida:** a tarefa da migration entrega o `EXPLAIN` da eliminação, da prévia e de cada lote do expurgo.
4. **Seção 5, etapa 1, e seção 13.** A troca de nome é um regex sobre `jsonb::text`, que nenhum índice atende, e "lotes confirmados um a um" não diz como o lote é delimitado. Um `LIMIT` sobre as linhas que casam percorre a escola inteira num só statement quando o nome não aparece. Com 2 s de `statement_timeout`, o job falha sempre, a eliminação legal nunca termina e a reexecução repete a varredura.
   - **Correção exigida:** lote por faixa de chave em índice que começa por `escola_id` (por exemplo, `(escola_id, id)`), com teto de linhas examinadas por statement, e só sobre linhas com texto não nulo.
   - **Teste:** o teste de integração ou o cenário de carga roda com volume e mostra cada statement abaixo do timeout.

Recomendações:
- Alerta, com parágrafo no runbook, para pedido `agendado` mais de 24 h depois de `eliminar_em` e para pedido `em_preparacao` há horas. Os dois têm prazo legal, e hoje nenhum alerta pega falha repetida de job de lote.
- O `retencao.expurgar-escola` confere a janela letiva entre os lotes e se reenfileira se ela abriu. Um disparo atrasado não deve continuar rodando junto da rajada das 7h30.
- Fixar a ordem das travas (pedido, depois usuário) também no `pessoa_desativada`, para não haver impasse com a eliminação.
- Incluir na lista de corridas a confirmação simultânea do incidente (`update ... where confirmado_em is null`, sem esbarrar no gatilho com erro cru).
- Medir o tamanho do lote por categoria. Em `trabalho_do_aluno`, 5.000 tentativas com o cascade de respostas e correções pode passar de 2 s.
- Para o check da `auditoria`, usar `NOT VALID` e depois `VALIDATE`. Escrever o critério de quando o `concurrently` passa a ser obrigatório (staging ou piloto).
- Índice `incidente_escola (escola_id) where confirmado_em is null`. Busca por prefixo do nome indexada por escola.
- Rollback: o código anterior ignora `eliminacao_agendada_em` e deixa entrar quem tem eliminação agendada. Registrar isso no runbook.
- O realtime autentica só no handshake (`/home/joaquimdp/Documentos/git/Educa.ia/apps/realtime/src/autenticacao-do-handshake.ts:73`). Quando o modo sala existir, encerrar a sessão precisa derrubar o socket.
- Política de ciclo de vida no bucket como segunda camada para `titular/` (7 dias).

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-05 14:45:56 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Esta é a revisão do desenho em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md` contra o PRD aprovado e `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`. Também conferi as tabelas reais das migrations 0019, 0021, 0022 e 0023 e o `CicloDeVidaService` atual.

**Campos pessoais tocados:** todos os do mapa, para ler, apagar, anonimizar ou trocar o nome. Os novos são `pedido_titular`, `arquivo_titular`, `incidente_escola.confirmado_por`, `usuario.eliminacao_agendada_em` e `consumo_ia.provedor`.

**Fora da tabela de dados do docs/lgpd.md:** os cinco campos acima, com a entrada no mapa prometida na tarefa da migration (seção 7). Isso atende a regra 20, item 1. Ficam de fora da lista da seção 7 o apelido do operador em `retencao_escola.alterada_por`, `suboperador.registrado_por` e `incidente.registrado_por` (recomendação).

**Autorização por objeto:** ok no desenho. Pedido, arquivo e incidente ficam na escola do token, "Meus dados" filtra também pelo `titular_id` do contexto, outra escola responde `NAO_ENCONTRADO`, e o aluno não baixa o arquivo do colega (seções 4 e 6).

**Logs:** limpos por desenho (seção 7: ids, categoria, contagens e estado).

**Auditoria:** ausente em dois pontos, a prévia do titular e o detalhe do pedido (bloqueante 1).

**Envio externo:** nenhum. A funcionalidade não usa IA.

**Seed/fixture:** sintético. Os testes usam sentinelas e relógio injetado, sem dado real.

**Bloqueantes:**

1. **Seção 4 (`GET titulares/:id/previa` e `GET pedidos/:id`) e seção 7 (o que entra em auditoria).**
   - **O que está errado:** a coordenação lê dado nominal de aluno sem auditoria. A prévia traz a contagem por categoria e por onde o dado passou. O detalhe do pedido traz o compartilhamento. Pela regra 20, item 10, leitura de dado de aluno pela coordenação é auditada. Do jeito que está, a coordenação pode abrir a prévia de qualquer aluno sem registrar pedido nenhum e sem deixar rastro.
   - **Correção exigida:** auditar `titular.previa_lida` e a leitura do detalhe do pedido, com finalidade e ids. Incluir um teste que falha sem esse registro.

2. **Seção 3 (catálogo e prazos fixos): a classificação das tabelas de pessoa ficou para a implementação decidir.**
   - **O que está errado:** o teste de arquitetura vai obrigar a classificar toda tabela, mas a spec não diz onde ficam `vinculo`, `lista_nome`, `credencial_matricula`, `conta_externa`, `codigo_recuperacao`, `conta` (global), `thread_agente`, `correcao`, `resposta_atividade`, `usuario` ativo, `material` vigente e `resumo_do_analista`.
     - O mapa dá a `vinculo` a retenção de vigência + 5 anos, e nenhuma categoria a aplica.
     - O mapa dá a `material` a retenção de existência + 5 anos para `enviado_por`.
     - A `conta` traz o e-mail de login do professor, que entra no acesso dele.
   - **Correção exigida:** pôr na seção 3 uma tabela com a classe de cada tabela existente das migrations 0000 a 0023: categoria, prazo fixo com quem o aplica (o encerramento do ano letivo da A1, o `sistema.expurgar-acesso`, a cascata), ou "sem pessoa" com o motivo. Dizer também quais delas entram no arquivo do titular.

3. **Seção 3: os prazos atrelados podem ser configurados de forma solta.**
   - **O que está errado:** o mapa diz que o tema em `execucao_agente.entrada` e em `consumo_ia.entrada`/`saida` "é tratado como conversa do professor", com 12 meses "como a conversa do professor". Diz também que `consumo_ia.aluno_id` fica 12 meses "como a conversa". O catálogo deixa cada categoria com prazo independente. Se a escola puser `conversa_professor` em 3 meses, o tema continua por até 12 meses em `execucao_agente` e `texto_do_modelo`.
   - **Correção exigida:** os prazos de `texto_do_modelo` e `execucao_agente` não passam do de `conversa_professor`, e o de `consumo_por_aluno` não passa do de `conversa_tutor`. Vale tanto validar no ajuste (`RETENCAO_FORA_DO_LIMITE`) quanto fazer o expurgo usar o menor dos dois. Incluir um teste com a âncora reduzida.

4. **Seções 5 (Arquivo) e 7b: o que fica fora da versão da coordenação não está definido.**
   - **O que está errado:** a spec diz só "sem a conversa do professor". Quem implementar pode entender que isso é `thread_agente` e `mensagem_agente`, e aí o tema, que o mapa trata como conversa do professor, chega à coordenação. Isso fere a regra 70, item 8, que tem veto.
   - **Correção exigida:** listar na seção 5 tudo que sai dessa versão: `thread_agente`, `mensagem_agente`, `execucao_agente.entrada`/`resultado`/`erro` das funções do Assistente, e `consumo_ia.entrada`/`saida`. Incluir um teste com sentinela em cada um desses campos.

5. **Seções 3 e 5, e RF13: o compartilhamento esquece o que aconteceu antes do prazo.**
   - **O que está errado:** o compartilhamento é calculado a partir de `consumo_ia.aluno_id`, de `execucao_agente.solicitada_por` e de `consumo_ia.provedor`. Os dois primeiros são anulados aos 12 meses ou menos. Depois disso, um aluno que usou o Tutor com provedor externo aparece "só com a hospedagem", o que é uma resposta falsa à pergunta de fechamento ("para onde isso já foi enviado") e ao art. 18, VII da LGPD. Com o professor é igual: `consumo_ia` não tem coluna de usuário, e o único elo é a execução, que também é anonimizada.
   - **Correção exigida:** uma das duas saídas abaixo, com um teste que roda o expurgo e depois o pedido:
     - um registro mínimo `(escola_id, titular_id, suboperador, primeiro_em, ultimo_em)`, com a retenção do pedido, gravado antes de anonimizar;
     - ou cruzar, depois do prazo, os períodos de `suboperador_escola` com o período em que o titular esteve na escola, com o rótulo "a escola usava X enquanto você estava nela".

6. **Seções 3 e 4 (`pedido_titular`, `GET titulares?busca=`): o aluno que nunca reivindicou o nome fica sem pedido.**
   - **O que está errado:** a busca só olha usuários, e o gatilho do pedido exige usuário da escola. Um aluno cujo nome e matrícula estão em `lista_nome` (livre ou reivindicado), e que nunca reivindicou, não consegue ter pedido de acesso nem de eliminação. Ele é titular e é aluno da escola (RF10). Para ele, o código não responde a pergunta de fechamento.
   - **Correção exigida:** escolher e escrever na spec um destes caminhos, com teste:
     - o pedido também aceita a linha da lista como titular;
     - ou a spec declara que a tela da lista da A1 atende acesso e eliminação desse titular, com auditoria da remoção, e a tela de Privacidade avisa isso.

**Recomendações:**
- **Busca em query string.** `GET titulares?busca=` leva o prefixo do nome na URL. A borda local não loga requisição (`infra/Caddyfile`), mas o balanceador gerenciado do staging pode logar. Recomendo trocar por `POST` com corpo, ou registrar a restrição nas notas do staging. Também vale declarar que `titular.buscado` guarda só a contagem e os ids, nunca o termo (o mapa já restringe a auditoria a ids).
- **Download do arquivo.** Assinar a URL com `ResponseCacheControl=no-store` e `Content-Disposition: attachment`. Na tela "Meus dados", avisar o aluno que o computador da escola é compartilhado e que ele deve apagar o arquivo depois.
- **Dado na fila.** Declarar que o job da fila (`titular.eliminar`, `montar-arquivo`) leva só ids, e que o nome é lido dentro da transação. O BullMQ guarda o job que falhou no Redis.
- **Provedor gravado.** Gravar em `consumo_ia.provedor` o provedor que atendeu a chamada, e não `IA_PROVEDOR_ID`, quando o provedor de reserva da regra 80, item 4, existir.
- **Homônimos e troca de nome.** O teste de homônimo deve considerar também `lista_nome` livre. A troca de nome não alcança a conversa de colegas com o Tutor: fica registrado como limite conhecido.
- **Auditoria da operação.** Pôr `ops:suboperador` (cadastrar e encerrar) e `ops:incidente registrar` na lista de auditoria da operação (RF6).
- **Prova do expurgo.** `expurgo_execucao` dura 90 dias, pouco para provar à escola que a retenção foi cumprida. Recomendo prazo maior, já que a tabela só tem contagens.
- **Eliminação agendada.** Confirmar que o realtime (Tutor em sala) derruba a conexão aberta do titular com eliminação agendada, e não só a sessão HTTP.
- **Exceção da conversa do Tutor (regra 20, item 14).** Está declarada e auditada, como o Joaquim decidiu. Vale limitar quantas vezes a coordenação baixa a mesma versão e levar esse evento ao relatório do dossiê, porque o caminho "desativar o aluno e depois pedir acesso" fica aberto a abuso.

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-05 14:59:55 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Dos seis bloqueantes da rodada 1, quatro foram resolvidos por completo (busca, Concluir, aviso de incidente e o vazio de "Meus dados"). Dois foram resolvidos só em parte, e as correções abriram um problema novo.

**Conferência dos bloqueantes da rodada 1**

| # | Bloqueante | Situação | Onde |
|---|---|---|---|
| 1 | Identificação do titular | **Parcial.** A busca traz matrícula e turma; a lista e o detalhe trazem nome, turma e "Titular eliminado"; a eliminação usa `perigo`; o e2e escolhe entre dois homônimos. Mas o diálogo promete o "aviso de homônimo" e nenhuma rota o fornece antes do pedido (bloqueante A) | 4, 9, cenarios.md |
| 2 | Concluir, download da coordenação e correção | **Feito.** Concluir, o botão `oficial` com finalidade, Corrigir nome (RF13b), a consulta a cada 10 s que para com a aba escondida, e o e2e de download, Concluir e correção. O aviso de apagar o arquivo ficou só para o aluno (bloqueante B) | 4, 9, cenarios.md |
| 3 | Vazio de "Meus dados" | **Feito.** A rota devolve estado, contagem e validade; o vazio convida; a tela diz que mostra só a escola ativa. Mas a entrada do aluno aponta para um item que não existe (bloqueante C) | 4, 9 |
| 4 | Busca por envio | **Feito.** Dispara por Enter ou botão, anuncia o resultado por `aria-live`, a busca vai por `POST`, e a auditoria guarda os ids e nunca o termo | 4, 9, cenarios.md |
| 5 | Aviso de incidente que prende | **Feito.** O diálogo mostra todos os campos do DTO, tem "Ver depois" com faixa fixa, o Sair continua alcançável, e o e2e passa por teclado e a 360 px | 4, 5, 9, cenarios.md |
| 6 | Nome do arquivo baixado | **Parcial.** O arquivo se chama `meus-dados-AAAA-MM-DD.json`, sai com `attachment` e `no-store`, e o e2e confere o nome. O aviso de apagar do computador da escola falta no download da coordenação (bloqueante B) | 5, 9 |

**Estados:** ok. Pedidos, Retenção, Suboperadores, Incidentes e "Meus dados" passam pelos quatro estados no e2e. O vazio de "Meus dados" convida. "Em preparação" e "Expirou" foram nomeados, mas sem texto (ver recomendações).

**Acessibilidade:** a busca anuncia o resultado. O vencido não depende só de cor (tem texto e ícone). O aviso de incidente passa por teclado com rolagem dentro do diálogo, e o e2e de toda tela nova verifica acessibilidade.

**Chromebook fraco:** ok. A busca não dispara a cada tecla, a lista é paginada em 50, a consulta de 10 s para com a aba escondida, não há upload e o JSON nunca é renderizado.

**Celular:** ok na estrutura. A tabela vira lista abaixo de 768 px e o e2e roda nos dois projetos. A faixa de incidente e o Sair foram testados a 360 px. "Meus dados" do professor fica no `MenuDaPessoa`, que aparece inteiro na gaveta; no trilho, a pessoa abre a lateral. Nenhum fluxo exige o celular.

**Ação oficial protegida:** sim para eliminação, download e confirmação de incidente. A ressalva é o aviso de homônimo, que não tem de onde vir (bloqueante A).

**Bloqueantes**

**A. Seção 9, linha 269, e seção 4, linhas 117 e 119: o aviso de homônimo não tem fonte antes do pedido.**
- **O que está errado:** o diálogo de confirmação promete "a prévia e o aviso de homônimo". Mas `homonimo` só existe como coluna de `pedido_titular` (seção 3, linha 80). Ele é marcado na etapa 2 da eliminação e só volta no `GET pedidos/:id`. A prévia (linha 117) não o traz, e a busca não acha o "nome livre igual na lista", que é aluno só na lista de nomes. Resultado: a coordenadora confirma uma eliminação sem saber que a troca de nome não vai acontecer, que é exatamente o caso de borda do PRD, seção 7.
- **Correção exigida:**
  - O `GET titulares/:id/previa` devolve `homonimo: boolean`, calculado pela mesma regra da etapa 2 (aluno ativo ou nome livre igual na lista), sem identificar o outro aluno.
  - O diálogo de eliminação mostra o texto do aviso, por exemplo: "Há outro aluno com o mesmo nome completo nesta escola. O nome não será trocado nos textos livres."
  - Um cenário [I] em cenarios.md (RF15 ou RF17) prova que a prévia marca o homônimo tanto do aluno ativo quanto do nome livre na lista.

**B. Seção 9, linhas 272 a 274: o download da coordenação não avisa para apagar o arquivo.**
- **O que está errado:** a correção 6 da rodada 1 valia "para o aluno e para a coordenação". Só "Meus dados" (linha 288) ganhou o aviso de apagar. A versão da coordenação traz a conversa do Tutor de um menor (exceção da seção 5, linha 158). É o arquivo mais sensível do sistema, e vai para a pasta de downloads do computador da secretaria.
- **Correção exigida:**
  - O diálogo de "Baixar a versão da escola" diz, antes de confirmar, que o arquivo deve ser entregue ao titular e apagado do computador em seguida.
  - O e2e "A coordenação baixa a versão da escola com a finalidade" confere o nome do arquivo, como já faz o do aluno.

**C. Seção 9, linha 284: a entrada do aluno em "Meus dados" não existe.**
- **O que está errado:** a spec diz "O aluno o acha em Privacidade, no rodapé". Hoje esse item não existe: `apps/web/src/areas/navegacao.ts:53` e `apps/web/src/areas/aluno/rotas.tsx:23` dizem que "Privacidade" só nasce com a tela dele, e o aviso de privacidade por faixa etária é do F9 (PRD, seção 3). Do jeito que está escrito, o aluno não tem caminho até o arquivo, e o RF12 quebra para ele.
- **Correção exigida:**
  - A seção 9 declara que esta fatia cria o item "Privacidade" no rodapé fixo da lateral do aluno (`docs/interface.md`, linha 1044), por enquanto só com "Meus dados", acessível também na gaveta a 360 px.
  - O e2e do aluno chega a "Meus dados" pela navegação, não pelo endereço.

**Recomendações**
- **Textos de "Meus dados"** (seção 9, linha 286). "Em preparação" e "Expirou" precisam de texto. Sugestões:
  - "Estamos preparando o seu arquivo. Volte em alguns minutos."
  - "O arquivo ficou disponível por 7 dias e foi apagado. Para receber de novo, peça à coordenação."
  - E dizer se a tela consulta a cada 10 s como a da coordenação.
- **Texto do 429 da busca** (seção 9, linha 267). Escrever o texto, por exemplo "Muitas buscas seguidas. Espere um minuto e tente de novo.", e validar o mínimo de 3 letras no próprio campo.
- **Corrigir nome** (seção 9, linha 272). O diálogo mostra o nome atual e o novo antes de confirmar. A tela aponta para a lista e a turma da A1 quando a correção pedida é de turma ou vínculo, já que o PRD manteve isso fora.
- **Confirmação pela aba Incidentes** (seção 9, linha 279). Dizer que dá para confirmar o incidente também pela aba, além do diálogo.
- **Professor na busca** (seção 4, linha 116). "Número de vínculos" não distingue dois professores homônimos. Mostrar disciplina ou turmas do vínculo.
- **Resumo legível do RF11.** O formato do resumo, pergunta da seção 10 do PRD, segue sem resposta para o titular sem conta. A coordenação entrega só um JSON. Vale definir um resumo legível dentro do arquivo ou na tela do pedido.

Arquivos citados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/navegacao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/aluno/rotas.tsx

```
VEREDITO: AJUSTES NECESSÁRIOS
Estados: ok (vazio de "Meus dados" convida; "Em preparação" e "Expirou" nomeados, sem texto — recomendação)
Acessibilidade: ok — busca com aria-live e disparo explícito; vencido com texto e ícone; aviso de incidente por teclado, com rolagem no diálogo; e2e de toda tela nova verifica acessibilidade
Chromebook fraco: ok — busca sem disparo por tecla, lista de 50, consulta de 10 s que para com a aba escondida, sem upload, JSON não renderizado
Celular: ok — lista abaixo de 768 px, faixa de incidente e Sair a 360 px, e2e nos dois projetos; nenhum fluxo exige celular
Ação oficial protegida: sim, com a ressalva do aviso de homônimo sem fonte na API (bloqueante A)
Bloqueantes:
 A. techspec.md seção 9:269 e seção 4:117/119 — o diálogo de eliminação promete o aviso de homônimo, mas `homonimo` só existe depois do pedido. Correção: a prévia devolve `homonimo: boolean` pela regra da etapa 2, o diálogo mostra o aviso e um cenário [I] prova os dois casos (aluno ativo e nome livre na lista).
 B. techspec.md seção 9:272-274 — o download da versão da escola (com a conversa do Tutor) não avisa para apagar o arquivo do computador. Correção: o aviso entra no diálogo, e o e2e da coordenação confere o nome do arquivo.
 C. techspec.md seção 9:284 — "Privacidade, no rodapé" do aluno não existe (navegacao.ts:53, aluno/rotas.tsx:23; o aviso de privacidade é do F9). Correção: a fatia cria o item com só "Meus dados", alcançável na gaveta a 360 px, e o e2e do aluno chega por navegação.
Recomendações: textos de "Em preparação" e "Expirou", e consulta em "Meus dados"; texto do 429 e mínimo de 3 letras no campo; Corrigir nome com antes e depois e indicação da A1 para turma e vínculo; confirmar incidente também pela aba; disciplina ou turmas do professor na busca; resumo legível do RF11 para o titular sem conta.
```

## test-engineer · 2ª rodada · REPROVADO · 2026-10-05 14:59:58 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos**

Os 16 bloqueantes da rodada 1, que estão por extenso na transcrição da minha rodada 1 (`achados/revisao-spec.md` está cortado do 8 em diante). Também os cenários das regras que a correção pôs na Tech Spec: travas entre categorias, `consumo_ia.provedor`, autor `rotina`, `pedido_titular` imutável e RF13b.

**Cobertos** (os 16 da rodada 1, conferidos contra `cenarios.md`)

1. RF2 por integração no `ops:retencao`: atendido.
2. Encurtar em A tira a linha de A e mantém a de B; aumentar não devolve nada: atendido.
3. Ano `em_curso` com `fim` vencido contra ano `encerrado`: atendido.
4. `test:infra` dos alertas e contagens de `expurgo_execucao`: atendido.
5. RF6 e RF7, inclusive B não ver o suboperador `lista` de A: atendido.
6. Prazos fixos de 7/8 dias, 5 anos + 1 dia e `expurgo_execucao`: atendido.
7. Versão `coordenacao` em integração, com sentinelas campo a campo, conta ativa e `titular.arquivo_baixado`: atendido.
8. RF14, perda de acesso: atendido. Sobre o realtime, a seção 5 responde de forma condicional. Hoje só existe o namespace `/sistema` (`apps/realtime/src/sistema.gateway.ts`), sem canal com dado de pessoa, então serve.
9. RF15 com sentinela por coluna, apóstrofo e metacaractere, caixa e os dois lados: atendido.
10. Storage achado por `apagado_em`: atendido.
11. RF16 por `chegou_em` e as transições: atendido.
12. Varredura de log e de resposta e `chave_objeto`: atendido em parte, ver o bloqueante 8.
13. Isolamento: `POST pedidos` de B com o mesmo corpo do inexistente, cancelar/concluir/arquivo de B, professor em A e B, "Meus dados" de B, transferido e mesma matrícula: atendido.
14. Permissão, MFA, a própria eliminação pela conta e responsável legal: atendido.
15. As nove corridas em paralelo, e a regra da chave de envio fixada na seção 5: atendido.
16. RF20 com acessibilidade, Suboperadores, "Meus dados" do professor e incidente só por teclado: atendido.

**Bloqueantes**

1. **O rate limit da busca perdeu o teste (seção 7c e `cenarios.md`, Transversais).**
   - A versão anterior da Tech Spec marcava "`rl:busca-titular` 30/min por usuário, recusa com 429 (teste)". Na mudança para o `cenarios.md`, o cenário sumiu.
   - Exigido:
     - um [I] com a 31ª busca no minuto dando 429, com o código tipado;
     - um [I] com duas coordenadoras da mesma escola e do mesmo IP, cada uma com as suas 30. Ele prova que o limite é por usuário, e não por IP (regra 80, item 1).

2. **`consumo_ia.provedor` sem nenhum cenário (seção 3, "`consumo_ia.provedor`").** As correções que o `llm-integrator` exigiu entraram no texto, mas os testes dele não foram para o `cenarios.md`. Exigido:
   - [U] de configuração: a subida é recusada sem `IA_PROVEDOR_ID` com `openai_compat` e processamento não local, e o formato fora do padrão também é recusado;
   - [U] do adaptador, sem provedor pago: o falso, o local e `regra_fixa` gravam nulo; o externo, com servidor falso, grava o id;
   - [I] com os dois checks da 0024: `provedor` com `envio_externo = false` é recusado;
   - [I] de que a gravação do consumo nunca falha por causa da coluna.

3. **A trava `consumo_por_aluno ≤ conversa_tutor` não tem cenário (seção 3, "Travas entre categorias").**
   - Só a trava do professor é testada (o ajuste recusado e o prazo efetivo de 3 meses). Se o código esquecer a trava do aluno, o teste continua verde.
   - Exigido: com `conversa_tutor` ajustado para 6 meses, o `aluno_id` de `consumo_ia` com 7 meses é anulado. E o ajuste de `consumo_por_aluno` acima de `conversa_tutor` dá `RETENCAO_FORA_DO_LIMITE`.

4. **O check do autor `rotina` em `auditoria` não tem cenário (seções 3 e 13).**
   - A Tech Spec passou a confiar nele ("O check restringe as ações"), mas nada prova que ele existe.
   - Exigido: [I] em que uma linha de auditoria com autor `rotina` e ação de aprovação de entrega, ou de validação de lote, é recusada pelo banco, e em que `usuario.eliminado` com `rotina` é aceita.

5. **A imutabilidade de `pedido_titular.escola_id` e `titular_id` não tem cenário (seção 3, Migration 0024).**
   - O gatilho é a segunda camada do isolamento do pedido. Se ele sair, nenhum teste quebra.
   - Exigido: [I] em que um `UPDATE` que troca `escola_id` ou `titular_id` é recusado.

6. **O RF13b abriu uma lacuna na eliminação (seção 5, "Eliminação", etapa 2; RF13b).**
   - A troca de nome usa o nome lido dentro do job, que é o nome atual. Um aluno que teve o nome corrigido e depois pede a eliminação deixa o nome **anterior** nos campos livres (tema, artefato, conversa do professor, `entrega.justificativa`). A auditoria não guarda nome, então nada consegue achá-lo depois.
   - A Tech Spec precisa decidir uma de duas saídas:
     - a correção roda a troca de nome do anterior para o novo nos mesmos campos;
     - ou fica declarado como limite conhecido na seção 13, com o aviso na tela.
   - Seja qual for a escolha, entra um [I] que corrige o nome, elimina e procura o nome anterior.
   - Falta também dizer em que estados do pedido de correção o `corrigir-nome` vale (depois de `concluido` ou `cancelado`?). E falta um [I] com nome vazio ou acima de 200 caracteres dando erro tipado, e não o 23514 cru do check `usuario_nome_preenchido`.

7. **Um caso de borda do PRD sem cenário (PRD, seção 7, "Aluno que nunca reivindicou o nome"; Tech Spec, seções 4 e 9).**
   - Exigido:
     - [I] em que a busca não acha o nome que só está na `lista_nome` livre ou reivindicada;
     - [E] em que a tela de Pedidos mostra o aviso apontando para a lista da turma;
     - a referência ao teste da A1 que prova que tirar o nome da lista fica na auditoria. Se esse teste não existe, ele entra aqui.

8. **`no-store` não é verificado (seção 5, "Arquivo"; RF17; bloqueante 12 da rodada 1).**
   - A Tech Spec assina a URL com `no-store` e `attachment`, mas nenhum cenário confere isso.
   - Além disso, o cenário "procura a URL assinada nas respostas" contradiz `POST pedidos/:id/arquivo`, cuja resposta é justamente a URL.
   - Exigido: [I] de que as respostas de `arquivo` e de `baixar` levam `Cache-Control: no-store`, e de que a URL assinada leva `response-cache-control=no-store` e `content-disposition=attachment` com o nome `meus-dados-AAAA-MM-DD.json`. A varredura procura a URL em log e nas **outras** respostas.

**Recomendações**

- RF5: "Os dois alertas da fatia" cobre na verdade três (duas noites sem expurgo, `agendado` mais de 24 h depois de `eliminar_em`, `em_preparacao` por mais de 2 h), mais o de 24 h do RF9. Vale nomear os quatro, cada um com o parágrafo do runbook.
- [I] de que o pedido com `eliminacao_enfileirada_em` há mais de 24 h é reenfileirado, e há menos de 24 h não é.
- A carga do `cenarios.md` não traz "trocando nome", que a seção 7c traz. Vale incluir, com cada statement medido abaixo de 2 s, como o `infra-guardian` pediu.
- O teste de arquitetura do `ContaGlobalRepository` também deve falhar com um terceiro caminho, e não só aceitar os dois.
- RF15: um caso de fronteira de palavra, com o nome contido em outro (por exemplo "Ana Souza" dentro de "Mariana Souza"), que não pode ser trocado.
- RF13: [I] com o pedido de correção listando o compartilhamento (o RF13 pede "na correção"), e um caso "sem uso, só hospedagem" explícito.
- RF13b: a varredura do RF17 procura o nome antigo e o novo.
- `conversa_professor`: um teste de que a `thread_agente` com mensagem ainda no prazo não sai.
[… 7 linhas cortadas]

## llm-integrator · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-05 15:00:00 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Perfis usados: nenhum. A Tech Spec continua sem chamada de modelo (seção 8, "Não se aplica").

Custo estimado por professor/mês: R$ 0 em modelo, porque são zero chamadas. O custo é de Postgres: o expurgo noturno e a troca de nome fazem `UPDATE` em lote fora do horário letivo.

Prompt versionado: não se aplica.

Validação de schema: não se aplica.

Aprovação humana no caminho: não se aplica.

**Como ficaram os três bloqueantes da rodada 1**

1. **Checks de `execucao_agente` (seção 3, `techspec.md:48`): resolvido.**
   - `entrada = {tarefa}` passa no `execucao_agente_entrada_da_tarefa`.
   - Manter `resultado` e `erro` passa nos outros dois checks.
   - Manter `resultado` não guarda texto do modelo. Ele grava só referência (`{tipo, artefatoId|mensagemId|resumoId}`), conferido em `apps/api/src/ia/execucao.repository.ts:42` e nos serviços que o produzem.
   - O teste exigido está em `cenarios.md:28-30`.

2. **Contrato de `consumo_ia.provedor` (seção 3, `techspec.md:94-104`): desenho resolvido, mas a correção criou um bug, e os testes exigidos não entraram.**
   - O que ficou certo: a variável está no `esquemaAmbienteDeIa`, a regra de quando ela é obrigatória bate com `envioExterno = !processamentoLocal` em `adaptador-openai-compat.ts:94`, e o id vai pelo adaptador até o `ConsumoRepository`.
   - O bug e a falta de testes viraram os bloqueantes A e B abaixo.

3. **Foto do compartilhamento (seção 5, `techspec.md:164-172`): a foto existe, o provedor sem cadastro aparece e a reserva por período existe.** Mas a ordem da etapa de eliminação contradiz a própria correção (bloqueante C).

**Bloqueantes:**

A. **O check `NOT VALID` em `consumo_ia` quebra o expurgo e a troca de nome nas linhas antigas.**
   - **Onde:** `techspec.md:94-95`, `techspec.md:168-169` e `cenarios.md:91`.
   - **O problema:** no Postgres, `NOT VALID` só pula a verificação das linhas que já existem. Todo `UPDATE` posterior nessas linhas é conferido. Numa linha antiga com `envio_externo = true` e `provedor` nulo, falham:
     - o `texto_do_modelo`, que anula `entrada` e `saida`;
     - o `consumo_por_aluno`, que anula `aluno_id`;
     - a troca de nome;
     - a anonimização da eliminação.
   - **Consequência:** é a mesma falha da rodada 1. O lote de 5.000 linhas falha inteiro, o alerta de duas noites dispara e a eliminação não conclui.
   - **A spec prevê essas linhas e não consegue criá-las:** ela trata "linhas antigas sem `provedor`", e o cenário "sem `provedor`" de `cenarios.md:91` não pode ser montado, porque o próprio check recusa inserir essa linha. A falha é minha: fui eu que propus o `NOT VALID` na rodada 1.
   - **Correção exigida:** a seção 3 escolhe um caminho que não falha em `UPDATE` de linha antiga. Duas opções:
     - (a) um check com corte fixo: `not envio_externo or provedor is not null or em < '<instante da 0024>'`, válido já na criação;
     - (b) tirar esse segundo check e garantir a regra pelo tipo (ver recomendação 1).
   - **Teste exigido:** um teste de integração que expurga e troca o nome numa linha `envio_externo = true` sem `provedor`.

B. **Os testes do contrato do provedor não estão em `cenarios.md`.**
   - **Onde:** `techspec.md:99-104`; a Fatia 1 e as Transversais de `cenarios.md` não têm nenhum desses testes.
   - **O que falta:** os testes exigidos na rodada 1.
     - [U] O provedor resolvido com o adaptador falso, com o local e com o externo (servidor falso, sem provedor pago) é nulo, nulo e o id, nessa ordem. Com `regra_fixa` ou com zero tentativas, é nulo.
     - [U] A configuração recusa a subida com `openai_compat` sem processamento local e sem `IA_PROVEDOR_ID`, e recusa um id fora do formato.
     - [I] O `ConsumoRepository` grava o `provedor`, e a soma da governança não muda.
   - **Correção exigida:** os três cenários entram em `cenarios.md`.

C. **A foto do compartilhamento é refeita depois de os dados que a alimentam terem sido apagados.**
   - **Onde:** `techspec.md:165` contra `techspec.md:190-191`.
   - **A contradição:** a linha 165 diz "refeito na etapa 2, antes de eliminar". Mas a etapa 2 é a troca de nome, e a etapa 3 lista nesta ordem: anonimiza as execuções, roda `eliminar` e só depois refaz o compartilhamento.
   - **Consequência:** a essa altura, a anonimização já zerou `solicitada_por`, que é a origem do professor. O `eliminar` já zerou `consumo_ia.aluno_id` pelo `ON DELETE SET NULL`. A foto cai na reserva por período e perde o provedor real.
   - **O teste não pega:** o cenário `cenarios.md:93` ainda passa pela reserva, desde que o suboperador esteja cadastrado.
   - **Correção exigida:**
     - a etapa 3 começa por "refaz o compartilhamento" e só depois anonimiza e elimina;
     - a linha 165 é corrigida para "etapa 3, antes de anonimizar";
     - o cenário 93 usa um provedor **sem cadastro**, que a reserva por período não consegue produzir, e afirma `origem` diferente de `periodo`.

**Recomendações:**
1. Ligar `envioExterno` e `provedorId` no tipo, como união discriminada na porta: `{ envioExterno: true; provedorId: string } | { envioExterno: false; provedorId: null }`. A fixture `packages/nucleo/src/ia/__fixtures__/adaptador-roteirizado.ts:15`, que hoje declara `envioExterno = true`, também precisa passar a declarar um id.
2. Dar a `suboperador.chave` o mesmo formato de `IA_PROVEDOR_ID`. Como a chave pode ser recadastrada (único só onde `fim is null`), a junção da foto deve ser por chave e pela vigência sobreposta a `primeiroEm` e `ultimoEm`.
3. Calcular o compartilhamento pelos dois caminhos (`aluno_id` e `solicitada_por`) para os dois papéis. A execução do Tutor também é pedida pelo aluno.
4. Dizer o que acontece com uma execução `pendente` anonimizada que o worker ainda pegue. O esperado é terminar `falhou` com código, sem erro cru.

**Arquivos relevantes:**
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0022_mvp_apresentacao.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/config/config-ia.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ia/provedor.ts`

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-10-05 15:00:02 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: `retencao_escola`, `pedido_titular` (com `escola_id` e `titular_id` imutáveis), `arquivo_titular`, `suboperador`, `suboperador_escola`, `incidente`, `incidente_escola` (agora com números e textos por escola), `expurgo_execucao`, `usuario` (+`eliminacao_agendada_em`), `consumo_ia` (+`provedor`), `execucao_agente` (+`anonimizada_em`). Todo id novo é UUID. Toda tabela com dado da escola tem `escola_id`. `suboperador` e `incidente` são tabelas da operação e não têm escola.

Queries verificadas: as quatro consultas `@SemEscopo` da seção 6, que são `EscolasDaRotinaRepository.listarIds`, `ContaGlobalRepository` (movida), `OperacaoPrivacidadeRepository` e `ExpurgoDeAcessoRepository.apagarLoteVencido('incidente')`. Também o job por escola tirado do `job_registro`, a busca por POST, a prévia, os pedidos com cancelar, concluir, corrigir-nome e arquivo, "Meus dados", a leitura e a confirmação do incidente, `GET suboperadores`, a foto do compartilhamento e a troca de nome.

Teste de isolamento: presente e efetivo nos três que faltavam na rodada 1 (`cenarios.md:52`, `:17`, `:70`). Falta cobertura nos dois pontos dos bloqueantes abaixo.

Situação dos bloqueantes da rodada 1:
1. **Conta global:** resolvido em `techspec.md:211`.
2. **Lista sem escopo:** resolvida só no lado da operação. A leitura pela escola continua sem dono, e isso virou o bloqueante novo 1.
3. **Incidente:** resolvido em `techspec.md:88-90`, `:115` e `:199`, com teste em `cenarios.md:57-61`.
4. **Três testes:** resolvido.

Bloqueantes:

1. **`techspec.md:216-217` (seção 6), `:114`, `:115` e `:164-171`: a escola lê `suboperador` e `incidente` sem repository declarado, e o compartilhamento pode citar suboperador de outra escola.**
   - **O que está errado.** A seção 6 diz que as duas tabelas são "alcançadas só pelos repositórios acima", e os de cima são todos da operação. Só que `GET suboperadores`, `GET incidentes` (o `conhecidoEm` vem de `incidente`) e o cálculo do compartilhamento, na API e no worker, também leem essas tabelas.
   - **Conflito com o teste de arquitetura.** O teste da `TABELAS_DA_OPERACAO` (`apps/api/test/arquitetura.test.ts:127-129`, `:201-205`) só aceita os arquivos de `QUEM_PODE_TOCAR_A_OPERACAO`. Do jeito que está, a implementação ou quebra esse teste, ou abre um leitor sem nome e sem prova de forma.
   - **Leitura sem escopo.** A parte `alcance = todas` não passa pela junção, ao contrário do que diz a linha 217.
   - **Vazamento entre escolas na seção 5.** A linha 169 ("As linhas antigas sem `provedor` listam os suboperadores de IA vigentes no período") não diz "da escola". O casamento de `consumo_ia.provedor` com `suboperador.chave` também não diz. Lido ao pé da letra, um suboperador `lista` que atende só B entra na foto do pedido de A, com o `suboperadorId`, e revela um contrato de B.
   - **Correção exigida:**
     - Nomear o repository da escola que lê as duas tabelas. Ele fica no `nucleo`, porque o worker também o usa. Põe-se na lista do teste de arquitetura com a garantia de que só lê.
     - Escrever a forma da consulta: `alcance = 'todas' or exists (ligação com escola_id = contexto)`, entre parênteses, e o incidente só por junção com `incidente_escola.escola_id = contexto`.
     - Declarar que todo uso no compartilhamento passa por ele: casamento por `provedor`, linhas sem `provedor` e `origem = periodo`.
     - Teste com sentinela: um consumo de A cuja `provedor` é a chave de um suboperador só de B aparece como "provedor não cadastrado". As linhas sem `provedor` e a reserva por período não listam o suboperador só de B.

2. **`techspec.md:33` (seção 2), `:290` (seção 9) e `cenarios.md:100`: o `ACESSO_SUSPENSO` no login revela que a matrícula existe.**
   - **O que está errado.** Hoje o login por matrícula responde `NAO_AUTENTICADO` para slug inexistente, matrícula inexistente, aluno desativado e senha errada, com hash e contagem iguais (`apps/api/src/sessao/matricula.service.ts:57-58`). A spec cria um código distinto para quem tem eliminação agendada e não diz em que ponto ele sai. Se sair antes da senha conferida, qualquer um, a partir do endereço de qualquer escola, descobre que a matrícula existe e que há eliminação agendada.
   - **Correção exigida:**
     - O `ACESSO_SUSPENSO` só sai depois de a credencial ser conferida.
     - Com senha errada, a conta suspensa responde exatamente como matrícula inexistente: mesmo `NAO_AUTENTICADO`, mesmo hash e mesma contagem no contador.
     - Cenário em `cenarios.md`, RF14: a senha errada na conta suspensa dá o mesmo corpo e o mesmo status da matrícula inexistente.

Recomendações:
- **`ContaGlobalRepository`:** dizer de forma explícita que ela não sai pelo barrel do `@educa/nucleo` e que o teste lista quem a importa (o `CicloDeVidaService` e o `sessao`), não só que a tabela `conta` aceita dois caminhos.
- **Justificativa do `EscolasDaRotinaRepository` (`techspec.md:210`):** "porque o `retencao` já tem três" soa como contorno da regra 10, item 9. Justificar pelo papel da rotina e registrar no `docs/modelo-de-dados.md`.
- **Busca por POST (`techspec.md:116`):** dizer que o "número de vínculos" é contado nesta escola, nunca pela `conta`.
- **Testes a mais, para a mesma conta com usuário em A e em B:**
  - corrigir o nome em A não muda o `usuario` de B;
  - o consumo feito em B não entra na foto do compartilhamento do pedido de A.
- **Troca de escola e seletor:** tratar a escola com eliminação agendada como ausente, com o mesmo erro de vínculo inexistente, e pôr um cenário para isso.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`

## infra-guardian · 2ª rodada · REPROVADO · 2026-10-05 15:00:51 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a guarda, os logins e a renovação passam a ler `eliminacao_agendada_em`), fila, migration
Rate limit: ok. O balde por usuário e por escola do F0 continua, e a busca de titular ganhou `rl:busca-titular` com 30 por minuto por usuário (seção 7c). Nenhum limite é só por IP.
Fila e prioridade: problema. Expurgo e eliminação vão para o lote, não urgentes, e o arquivo vai para a fila normal. Essa parte está certa. O problema é a chave "escola + noite": a spec a usa para evitar job em dobro, mas ela não existe (bloqueante 1).
Concorrência: corrida em `tasks/prd-lgpd-e-titular/techspec.md:135-139` (bloqueante 1). As correções da rodada 1 estão feitas:
- A chave de envio agora decide primeiro (linhas 175-177).
- A etapa 1 confere o pedido com o `now()` do banco, e o cancelamento usa o mesmo relógio (linhas 180-183).
- `eliminacao_enfileirada_em` é marcado na mesma transação do enfileiramento (linhas 142-144).
- A troca de nome anda em faixas de 1.000 linhas de `(escola_id, id)` (linha 186).
Índice e paginação: faltando um índice (bloqueante 2). Os da rodada 1 entraram: os três por titular, os quatro de anonimização com os dois de `consumo_ia` separados, e o `EXPLAIN` na tarefa da migration (linha 252).
Degradação de IA: não se aplica
Migration: compatível. As colunas novas aceitam nulo. Os checks entram `NOT VALID`, e o da `auditoria` depois passa por `VALIDATE`. O índice sem `concurrently` vale até o staging, com critério escrito, e o rollback está no runbook.
Métrica e alerta: ok. Entraram os alertas de pedido `agendado` atrasado e de `em_preparacao` por mais de 2 h, cada um com runbook e linha no `test:infra`.

Bloqueantes:
1. **`techspec.md:135-136`, `:139` e `:251`, com a migration em `:73-97`.** A chave de idempotência "escola + noite" não existe em lugar nenhum:
   - O `Enfileirador` não recebe chave (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/enfileirador.ts:27`).
   - O `job_registro` não tem coluna nem índice único para ela (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/job-registro.ts`).
   - A migration 0024 não acrescenta nada disso.
   - O próprio disparo agendado admite que, quando a fila entrega o disparo de novo, ele grava um segundo job (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/agendamentos.ts:73-75`).

   Ou seja, rodar duas vezes na mesma noite cria dois jobs por escola, e o cenário "[P] duas vezes na mesma noite: um job por escola" (`cenarios.md:144`) não tem como passar. Há ainda uma contradição: se a chave existir como única, o "reenfileira-se" da linha 139 bate na chave do próprio job da mesma noite e é descartado. O expurgo daquela escola fica parado até a noite seguinte.
   - **Correção exigida:** declarar o mecanismo na seção 3 e na seção 5. Por exemplo: `job_registro.chave_idempotencia` nula, com único parcial `(escola_id, tipo, chave_idempotencia) where chave_idempotencia is not null and estado not in ('concluido','falhou')`, um `enfileirar` com chave e `on conflict do nothing`, e a coluna na migration 0024.
   - **Correção exigida:** dizer como o reenfileiramento convive com a chave. O caminho mais simples é o job voltar a própria linha a `aguardando` em vez de inserir outra.
   - A alternativa é tirar a chave da spec e declarar que o job em dobro é tolerado pelo `skip locked`. Nesse caso, o cenário da linha 144 muda para "a soma das contagens fica certa".
2. **`techspec.md:252`, com efeito nas linhas `:155`, `:167` e `:190-192`.** Falta `consumo_ia (escola_id, execucao_id)`. Hoje só existem `(escola_id, funcao, em)` e `(escola_id, aluno_id, em) where aluno_id is not null` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0022_mvp_apresentacao.sql:424-425`). Três caminhos vão de `execucao_agente` (pelo novo índice de `solicitada_por`) até `consumo_ia` pela execução:
   - o compartilhamento do professor, refeito dentro da transação da etapa 3;
   - a anonimização do texto do consumo das execuções dele;
   - o arquivo, que precisa tirar `entrada` e `saida` dessas execuções.

   Sem o índice, a junção percorre todo o `consumo_ia` da escola, que cresce uma linha por troca do Tutor (centenas de milhares a milhões por ano, `docs/infra.md` 3.6). Com o `statement_timeout` de 2 s, a transação da etapa 3 falha sempre para professor, e a eliminação legal não termina.
   - **Correção exigida:** incluir `consumo_ia (escola_id, execucao_id) where execucao_id is not null` na lista de índices da seção 7c.
   - **Correção exigida:** o `EXPLAIN` da tarefa da migration cobre o compartilhamento e a anonimização do professor com volume de Tutor na mesma escola.

Recomendações:
- **`techspec.md:142-144` e `:190`:** o reenfileiramento após 24 h pode criar um segundo `titular.eliminar` enquanto o primeiro ainda espera na fila (segurado pela janela letiva ou pela vaga). A etapa 3 deveria começar com `select … for update` do pedido e conferir de novo `estado = 'agendado'`, terminando sem efeito se não estiver. Sem isso, o segundo job chama `eliminar` sobre usuário já apagado, sai `falhou` e gera ruído. Outra opção é reenfileirar só quando o job anterior estiver `falhou`, guardando o id dele no pedido.
- **`techspec.md:190`:** o `CicloDeVidaService.eliminar` hoje abre a própria transação (`apps/api/src/sessao/ciclo-de-vida.service.ts:69-70`, `#naTransacao`). Para a ordem de travas pedido → usuário valer na mesma transação, ele precisa aceitar a transação de quem chama. Vale dizer isso na tarefa que move o ciclo de vida.
- **`techspec.md:180-181` (Cancelar):** a spec não diz que o cancelamento zera `usuario.eliminacao_agendada_em` na mesma transação, com a trava pedido → usuário. Sem isso, o login fica com `ACESSO_SUSPENSO` para sempre. O cenário de `cenarios.md:101` pega o erro, mas o fluxo deveria estar escrito.
- **`techspec.md:82-83`:** sem único `(escola_id, pedido_id, versao)` em `arquivo_titular`, os dois `titular.montar-arquivo` de `cenarios.md:145` gravam duas linhas. O caminho é único com `on conflict do update`, e a passagem `em_preparacao → pronto` condicional.
- **`techspec.md:138-139`:** a janela letiva é conferida entre categorias, e não entre lotes. Uma categoria com 1 milhão de linhas tem 200 lotes e pode atravessar as 7h30. Conferir a cada lote. Também convém enfileirar as eliminações vencidas antes das categorias, para que um reenfileiramento não as adie uma noite.
- **`titular.eliminar`, etapa 2:** ela não confere a janela letiva entre faixas. Um disparo atrasado pode passar a manhã varrendo `consumo_ia`.
- **Troca de nome em `consumo_ia`:** a maioria das linhas tem `entrada` nula (o Tutor, pelo check da 0023). A faixa deveria contar as linhas examinadas no índice, e não 1.000 linhas com texto. Outra saída é um índice parcial `(escola_id, id) where entrada is not null or saida is not null`.
- **`titular.nome_trocado` por linha:** gravar na mesma transação da faixa, a partir do `returning` do `update`. Assim, faixa e auditoria entram ou saem juntas.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/enfileirador.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/job-registro.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/agendamentos.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/consumo-ia.ts`.

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-05 15:01:02 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

**VEREDITO: REPROVADO**

Rodada 2 da revisão da spec. Dos 6 bloqueantes da rodada 1, 4 foram resolvidos (1, 3, 4 e 5). O 2 e o 6 ficaram pela metade, e duas das correções criaram problemas novos: a lista de pedidos agora mostra o nome sem auditoria, e o login suspenso pode revelar o pedido a quem tenta entrar.

**Bloqueantes da rodada 1, um a um**

| # | Situação | Onde |
|---|---|---|
| 1. Auditoria da prévia e do detalhe | resolvido | techspec seção 4, linhas 117 e 119; seção 7, linha 228; cenários, linha 125 |
| 2. Classificação de toda tabela | **parcial**: as 46 tabelas das migrations 0000 a 0023 estão classificadas, mas a spec ainda não diz quais entram no arquivo do titular (bloqueante A) | seção 3, linhas 62 a 71 |
| 3. Prazos atrelados | resolvido: as travas valem no ajuste e no prazo efetivo, com teste. Conferi no mapa que `consumo_ia.entrada`/`saida` são nulas por check nas funções do Tutor, então basta atrelar à conversa do professor | seção 3, linhas 58 a 60; cenários, linhas 15 e 24 |
| 4. O que fica fora da versão da coordenação | resolvido. O `resultado` da execução guarda só ids, conforme o mapa (linha 83) | seção 5, linhas 152 a 158; cenários, linhas 80 a 83 |
| 5. Compartilhamento depois do expurgo | resolvido: foto no pedido, reserva por período e provedor sem cadastro aparecem | seção 5, linhas 164 a 172; cenários, linhas 91 a 93 |
| 6. Aluno só na lista de nomes | **parcial** (bloqueante D) | seção 4, linhas 128 e 129; seção 9, linha 276 |

```
VEREDITO: REPROVADO
Campos pessoais tocados: todos os do mapa, para ler, apagar, anonimizar, trocar e corrigir o nome. São novos: pedido_titular (com a foto do compartilhamento, nome_trocado e homonimo), arquivo_titular, incidente_escola.confirmado_por, usuario.eliminacao_agendada_em, consumo_ia.provedor e o apelido do operador em retencao_escola, suboperador e incidente. O usuario.nome passa a ser alterado pelo corrigir-nome; ele é por escola e não fica na conta global, então a correção em A não toca B.
Fora da tabela de dados do docs/lgpd.md: os novos acima, prometidos para a tarefa da migration (seção 7, linha 226). Isso atende a regra 20, item 1.
Autorização por objeto: ok no desenho (seção 4, linhas 124 a 127). O pedido sobre si mesmo é conferido pela conta, a conta ativa é por escola, e corrigir-nome está no teste de isolamento (cenários, linha 131).
Logs: limpos no desenho (seção 7, linha 227). Os jobs levam só ids.
Auditoria: ausente na listagem de pedidos (GET pedidos), que agora devolve nome e turma.
Envio externo: nenhum. A funcionalidade não usa IA. O compartilhamento responde para onde o dado já foi, inclusive depois do expurgo.
Seed/fixture: sintético. Os testes usam sentinelas e relógio injetado.
Bloqueantes:
 A. techspec.md seção 3, linhas 62-71, e seção 10, linhas 298-299; cenarios.md linha 74. O que está errado: continua sem dizer quais tabelas e colunas entram no arquivo do titular, e eu exigi isso na rodada 1. A classificação não tem o atributo "do titular", e a sentinela "em cada tabela classificada como do titular aparece no arquivo" pode empurrar segredo para dentro do JSON: credencial_matricula.senha_hash, conta.senha_hash e mfa_segredo_cifrado, codigo_recuperacao, os hashes de sessao, convite e acesso_turma, e reivindicacao.senha_hash. Esse JSON também chega à versão da coordenação. Correção exigida: (1) a CLASSIFICACAO_DAS_TABELAS marca, por tabela, se entra no arquivo; (2) uma lista fechada de colunas que nunca entram (hashes, segredos de MFA, códigos de recuperação, chave_envio, chave_objeto); (3) uma decisão escrita sobre o e-mail da conta global do professor (entra, como dado dele, na versão dele); (4) um cenário com sentinela em cada coluna proibida, que falha se ela aparecer em qualquer das duas versões.
 B. techspec.md seção 4, linha 119; seção 7, linha 228; cenarios.md linha 119. O que está errado: a correção da rodada passou a mostrar nome e turma na lista de pedidos, e a listagem não é auditada. É leitura nominal de aluno pela coordenação (regra 20, item 10), e uma leitura que diz quais alunos pediram eliminação. Pelo padrão da própria A1, até a lista de nomes da turma grava turma.lista_lida com finalidade a cada leitura (apps/api/src/estrutura/lista.service.ts:167). Correção exigida: GET pedidos grava pedidos.listados com os ids da página e uma finalidade fixa, na mesma transação; entra na seção 7; e um cenário que falha sem esse registro.
 C. techspec.md seção 2, linha 33; seção 9, linha 290; cenarios.md linha 100. O que está errado: o login responde ACESSO_SUSPENSO sem dizer em que ponto. Hoje o login por matrícula responde igual a aluno desativado, matrícula inexistente e senha errada, com NAO_AUTENTICADO e o mesmo hash (apps/api/src/sessao/matricula.service.ts:57). Se o código novo for conferido antes da senha, qualquer colega que saiba escola e matrícula fica sabendo que a matrícula existe e que há pedido de eliminação, e a mensagem "suspenso a pedido" aparece num Chromebook compartilhado. Isso fere a regra 20, item 6, e expõe um fato sobre o titular. Correção exigida: ACESSO_SUSPENSO só depois da credencial confirmada (a senha certa; na conta Google ou Microsoft, o token válido), pelo mesmo caminho de tempo e de contador; antes disso, a resposta comum. No login por e-mail, a escola com eliminação agendada simplesmente não entra entre as escolhas. Cenário: senha errada numa conta suspensa responde com o mesmo status e o mesmo corpo da matrícula inexistente.
 D. techspec.md seção 4, linhas 128-129; seção 9, linha 276; cenarios.md (ausente). O que está errado: (1) a spec diz que a coordenação "edita e retira" o nome na lista, mas a A1 não tem edição; ela só tem retirar, e só para o nome livre: o reivindicado responde CONFLITO (lista.service.ts:143-151). O aluno com reivindicação pendente fica sem caminho escrito de eliminação nem de correção. (2) A correção da rodada 1 exigia teste, e nenhum cenário prova esse caminho. Correção exigida: escrever o caminho real. O acesso é a leitura auditada da lista (turma.lista_lida). A correção é retirar e acrescentar. Com reivindicação pendente, a coordenação decide primeiro (decidida_como coordenacao) e depois retira, e a reivindicacao segue a retenção do mapa. Cenários: [E] a tela de Privacidade mostra o aviso e a busca não encontra esse aluno; [I] o reivindicado passa por decidir e retirar com as duas auditorias.
Recomendações:
 - seção 5, linhas 164-165 contra 190: "refeito na etapa 2" e "refaz o compartilhamento" na etapa 3; alinhar o texto.
 - seção 3, linha 68: "as seis da operação" são cinco fora a auditoria_operacao (operador, convite_operador, sessao_operador, acesso_operacao, codigo_recuperacao_operador). Nomear.
 - PRD seção 8, linha 96: a linha do mapa de pedido_titular precisa citar a foto do compartilhamento, nome_trocado e homonimo, e que eles ficam depois da eliminação só com ids.
 - O mapa diz que correcao.destaque_aberto_por fica vigência + 5 anos (lgpd.md linha 79), e a spec apaga correcao em cascata com trabalho_do_aluno. O registro de prova fica na validacao_do_lote, mas o mapa precisa ser ajustado (levar ao conformidade-reviewer).
 - corrigir-nome: dizer em que estados do pedido vale (fora de concluído e cancelado), qual o DTO de resposta, e que o arquivo já gerado não é refeito.
 - Prévia e detalhe: declarar a finalidade fixa gravada na auditoria (regra 20, item 10: autor, data e finalidade).
 - Versão da coordenação de professor sem conta ativa: decidir se o artefato dele (titulo e conteudo, que vêm do tema) entra. Levar ao conformidade-reviewer pela regra 70, item 8.
 - Segue aberta a da rodada 1: limitar quantas vezes a coordenação baixa a mesma versão e levar o evento ao relatório do dossiê.
```

Os arquivos revisados ficam em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/`: `techspec.md`, `cenarios.md`, `prd.md` e `revisao-spec.md`.

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-05 15:01:58 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A tabela `nota` não existe, e a spec não grava em lugar nenhum que faça as vezes dela; ela só apaga ou anonimiza `correcao`, por cascata da `tentativa_atividade`. Todos com autor humano? Sim, porque não há escrita.

Decisão autônoma sobre aluno: ausente. A eliminação só acontece por pedido que a coordenação registra, e o expurgo aplica prazo, sem tocar em aprovação, reprovação ou encaminhamento.

Aprovação registrada: ok.
- Correção de lote não aprovado: nas duas versões do arquivo ela sai só como "em validação" ou "rejeitada" (techspec seção 5, l. 159-160; cenarios.md l. 77-78).
- Troca de nome: cada linha alterada de artefato, entrega, execução e consumo grava `titular.nome_trocado` (seção 5, l. 189; cenarios.md l. 111).
- `validacao_do_lote` e `entrega.decidida_por` continuam com os ids, porque a validação guarda uma cópia do que foi mostrado e não depende da correção apagada.

Supervisão do tutor: ok. O piso de `conversa_tutor` e `sinal_tutor` subiu para 6 meses, e a spec não cria uso invisível do tutor.

Autonomia declarada e visível: sim. A spec não cria agente nem função nova (seção 8).

**Os 5 bloqueantes da rodada 1**
1. **Tema e texto do modelo na versão da coordenação:** resolvido. A seção 5 (l. 152-156) lista campo a campo o que essa versão nunca traz, e cenarios.md (l. 80-83) testa com sentinela nas duas versões.
2. **Prévia como medição nominal do professor:** resolvido só em parte. A contagem e a auditoria entraram, mas a forma que eu mesmo aceitei na rodada 1 ("no máximo que a categoria existe") ainda mede adoção. O compartilhamento do pedido reabriu o mesmo problema. Está no bloqueante 1 abaixo.
3. **Checks de `execucao_agente`:** resolvido. `{tarefa}` passa no `execucao_agente_entrada_da_tarefa` (`packages/nucleo/src/db/schema/execucao-agente.ts:84`), e `resultado` e `erro` ficam. Os checks 87 e 91 continuam satisfeitos, e o cenário está em cenarios.md l. 29-30.
4. **Correção de lote não aprovado no arquivo:** resolvido.
5. **Troca de nome sem registro:** resolvido. A coordenação recebe só `nomeTrocado` (cenarios.md l. 112).

**Bloqueantes**

1. **O que a coordenação vê de um professor ainda separa quem usou a IA de quem não usou** (D64; regra 70, itens 8 e 9).
   - **Prévia** (techspec.md:117): mostrar "se cada categoria existe" já é a medição. Para um professor, existir `conversa_professor`, `execucao_agente`, `texto_do_modelo` ou `autoria_de_artefato` quer dizer exatamente "usou o Assistente". A coordenação lê isso de qualquer professor, a qualquer hora, sem pedido nenhum. A seção 7b (l. 237-238) afirma que a prévia "não mede uso", e isso é falso.
   - **Compartilhamento do professor** (techspec.md:77-81, 119, 164-167; problema novo desta rodada): a junção com `execucao_agente.solicitada_por` grava na foto do pedido `primeiroEm` e `ultimoEm` por provedor. Isso é o período nominal de uso da IA pelo professor.
     - O `GET pedidos/:id` mostra esse período à coordenação.
     - A foto fica pela retenção do pedido (vigência + 5 anos), muito além do prazo de `solicitada_por` (até 12 meses, travado ao de `conversa_professor`).
     - É o "consumo por professor" que o schema proíbe de forma explícita (`packages/nucleo/src/db/schema/consumo-ia.ts:24`: "Não existe consumo por professor (D64)").
     - A própria coordenação registra o pedido, e o solicitante é só declarado. Na prática, basta registrar um pedido de compartilhamento para ler quando o professor usou a IA.
   - **Correção exigida:**
     - Prévia e detalhe do pedido de um professor dão a mesma resposta para quem usou e para quem não usou a IA. Na prévia, as quatro categorias de uso não aparecem, ou aparecem com o mesmo texto fixo para todo professor.
     - O compartilhamento de professor, tanto o mostrado à coordenação quanto o gravado na foto, sai só por período: os suboperadores de IA da escola vigentes durante o vínculo dele, com `origem = periodo`. Nunca pela junção com `solicitada_por`. Essa lista mais larga atende o art. 18, VII e o § 6º.
     - As datas reais de uso vão só para a versão `completa`, que o próprio professor baixa.
     - Ajustar a seção 7b.
     - Teste de integração: dois professores da mesma escola, um que usou o Assistente com provedor externo e outro que nunca usou. A prévia, a foto e o `GET pedidos/:id` precisam sair iguais. Esse teste substitui o de cenarios.md l. 94/126 ou se soma a ele.

2. **O autor `rotina` está na auditoria sem lista fechada de ações e sem teste** (regra 70, itens 3 e 6; regra 40).
   - **Onde:** techspec.md:96 e 323. "As ações da retenção e da eliminação" não diz quais são. Hoje o `auditoria_operador_formato` (`packages/nucleo/src/db/schema/auditoria.ts`) já aceita `rotina` como `autor_operador` em qualquer ação. O check novo é a única garantia de que um autor que não é pessoa nunca aparece em aprovação. E cenarios.md não tem cenário para ele.
   - **Correção exigida:**
     - Enumerar na seção 3 a lista fechada de ações aceitas com `rotina`: pelo menos `titular.nome_trocado`, `usuario.eliminado` e a conclusão do pedido, mais as do expurgo, se houver.
     - Somar um cenário [I] que tenta gravar `rotina` em `entrega.aprovada`, em `entrega.rejeitada` e na validação de lote, e é recusado pelo banco. O mesmo cenário mostra que as ações da eliminação passam com esse autor.

**Os dois pontos que você pediu para conferir**
- **Compartilhamento do professor pela junção com `solicitada_por`:** é o bloqueante 1.
- **Correção de nome do professor pela coordenação:** não cria problema de conformidade. A auditoria guarda ids, e "quem aprovou" continua sendo resolvido pelo id; só o nome exibido muda. O que sobra está nas recomendações.

**Recomendações**
- **PRD, RF15** (prd.md:65): ainda diz "devolve à coordenação só a contagem". Alinhar com a Tech Spec ("só se houve troca"), para ninguém implementar a contagem, que inclui as ocorrências em `mensagem_agente`.
- **Versão `coordenacao` de um professor sem conta ativa:** ela leva execuções (tarefa, datas), consumo e artefatos, ou seja, o registro de uso dele. Vale declarar isso no PRD, seção 6, como exceção à D64 pelo direito de acesso, auditada, como já foi feito com a conversa do Tutor.
- **Consulta da auditoria (F12):** quando existir, ela não deve mostrar à coordenação as linhas de `titular.nome_trocado` sobre `execucao_agente` e `consumo_ia` de forma que se chegue a qual professor escreveu o nome do aluno no tema.
- **Corrigir nome de aluno:** dizer se a correção chega à `lista_nome`. Se não chegar, uma troca de nome posterior não alcança o nome antigo nos campos livres.
- **Operador chamado `rotina`:** reservar o apelido na criação de operador, para não colidir com o check.
- **Texto:** "Em as duas versões" (techspec.md:159) vira "Nas duas versões".
- **Arquivo do aluno:** dizer de forma explícita que ele não traz o conteúdo do artefato aplicado, que tem gabarito; o aluno nunca lê o artefato (`artefato.ts`, cabeçalho).

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/consumo-ia.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/auditoria.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/execucao-agente.ts

```
VEREDITO: REPROVADO
Caminhos de escrita em Nota: nenhum (só apaga ou anonimiza `correcao`) — todos com autor humano? sim
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok
Supervisão do tutor: ok
Autonomia declarada e visível: sim
Bloqueantes: (1) techspec.md:117, 164-167, 77-81, 119, 237-238 — prévia e foto do compartilhamento separam o professor que usou a IA do que não usou (D64); exigido: resposta idêntica, compartilhamento de professor só por período, teste com dois professores. (2) techspec.md:96, 323 — check do autor `rotina` sem lista fechada de ações nem teste; exigido: lista enumerada e cenário [I] que recusa `rotina` em aprovação, rejeição e validação.
Recomendações: alinhar RF15 do PRD; declarar a exceção da versão `coordenacao` de professor; nome_trocado sem apontar o professor na consulta do F12; correção de nome chegar à `lista_nome`; reservar o apelido `rotina`; corrigir "Em as duas versões"; arquivo do aluno sem conteúdo do artefato.
```

## tenancy-guardian · 3ª rodada · APROVADO · 2026-10-05 15:14:07 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `retencao_escola`, `pedido_titular` (`escola_id` e `titular_id` imutáveis), `arquivo_titular` (com o único `(escola_id, pedido_id, versao)`), `suboperador`, `suboperador_escola`, `incidente`, `incidente_escola`, `expurgo_execucao`, `job_registro` (+`chave_idempotencia`, com único parcial que começa por `escola_id`), `usuario` (+`eliminacao_agendada_em`), `consumo_ia` (+`provedor`), `execucao_agente` (+`anonimizada_em`). Todo id novo é UUID. `suboperador` e `incidente` são da operação, sem escola, e ficam em `TABELAS_DA_OPERACAO`.

**Queries verificadas:**
- **Bloqueante 1 da rodada 2, resolvido.**
  - Seção 6 (`techspec.md:243-252`): `SuboperadorDaEscolaRepository` e `IncidenteDaEscolaRepository` ficam no `nucleo`, só de leitura e listados em `QUEM_PODE_TOCAR_A_OPERACAO`. A spec escreve a forma das duas consultas: `(alcance = 'todas' or exists (ligação com escola_id = contexto))`, com os parênteses, e o incidente só por junção com `incidente_escola.escola_id = contexto`.
  - Seção 4 (`:129`): `GET suboperadores` lê por esse repository.
  - Seção 5 (`:187-197`): todo o compartilhamento sai do repository da escola. Isso cobre o casamento por `provedor`, as linhas sem `provedor`, a `origem = periodo` e o caso do professor.
  - Teste com sentinela em `cenarios.md:69` e `:122`.
- **Bloqueante 2 da rodada 2, resolvido.**
  - Seção 4 (`techspec.md:147-149`): `ACESSO_SUSPENSO` só sai depois de a credencial ser conferida. Com senha errada, a resposta é igual à da matrícula inexistente, com o mesmo tempo e o mesmo contador. No login por e-mail e no seletor, a escola suspensa não aparece.
  - Cenários em `cenarios.md:133-134`.
- **Recomendações da rodada 2, atendidas:**
  - `ContaGlobalRepository` fora do barrel, com a lista de quem a importa (`:251`).
  - Justificativa do `EscolasDaRotinaRepository` pelo papel da rotina (`:238`, `:252`).
  - Disciplinas e turmas "desta escola" na busca (`:131`).
  - Os dois testes da mesma conta em A e em B (`cenarios.md:122`, `:128`).
- **Pontos novos sem problema de isolamento:**
  - O `Enfileirador` com chave tira a escola do contexto.
  - `sessao`, `conta_externa` e `registro_acesso` entram no arquivo. As três têm `escola_id`, e a sentinela "o professor que também está em B não leva nada de B" cobre a leitura.
  - O e-mail da `conta` global vai no arquivo da própria escola, e ela já o conhece pelo convite.
  - Nenhuma rota nova aceita `escolaId` do cliente.

**Teste de isolamento:** presente e efetivo.
- Sem o `exists` da ligação, o suboperador só de B aparece na escola A, e `cenarios.md:69` quebra.
- Sem o filtro de escola no rastro, o consumo feito em B entra na foto do pedido de A, e `:122` quebra.
- Se a conta suspensa responder antes de conferir a senha, a resposta à senha errada passa a diferir da matrícula inexistente, e `:133` quebra.

**Bloqueantes:** nenhum.

**Recomendações:**
- `cenarios.md:200`: hoje quatro caminhos tocam `suboperador` e `incidente`: os dois da operação e os dois da escola. "Terceiro caminho" está errado; o certo é "um caminho fora da lista".
- Seção 6 (`techspec.md:245-246`): o "só-leitura" dos dois repositórios da escola está escrito, mas não há teste que o prove. Vale um caso em `cenarios.md`, Arquitetura, no molde de `apps/api/test/arquitetura.test.ts:207-211`: o teste falha se `SuboperadorDaEscolaRepository` ou `IncidenteDaEscolaRepository` citam `insert`, `update` ou `delete` nessas tabelas. A confirmação do incidente escreve só em `incidente_escola`.
- Seção 6 (`techspec.md:247-248`): o `exists` deve citar a correlação `suboperador_escola.suboperador_id = suboperador.id`. O critério de vigência (`inicio` e `fim`) não deve abrir a ligação de outra escola.

Arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`

```
VEREDITO: APROVADO
Tabelas verificadas: retencao_escola, pedido_titular, arquivo_titular, suboperador, suboperador_escola, incidente, incidente_escola, expurgo_execucao, job_registro (+chave_idempotencia), usuario (+eliminacao_agendada_em), consumo_ia (+provedor), execucao_agente (+anonimizada_em)
Queries verificadas: SuboperadorDaEscolaRepository e IncidenteDaEscolaRepository (seção 6), GET suboperadores (seção 4), compartilhamento (seção 5), ACESSO_SUSPENSO, login por e-mail e seletor (seção 4), os quatro @SemEscopo (seção 6), Enfileirador com chave, conteúdo do arquivo
Teste de isolamento: presente e efetivo
Bloqueantes: nenhum
Recomendações: cenarios.md:200 "terceiro caminho" virar "fora da lista"; teste do só-leitura dos dois repositórios da escola; correlação suboperador_id no exists (techspec.md:247-248)
```

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-05 15:14:08 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: APROVADO

Os três bloqueantes da rodada 2 foram corrigidos, e o diff não abriu problema novo de tela que bloqueie.

**Os três bloqueantes da rodada 2**

| # | Bloqueante | Situação | Onde |
|---|---|---|---|
| A | Aviso de homônimo sem fonte antes do pedido | **Feito.** A prévia do aluno devolve `homonimo` pela mesma regra da troca de nome. O diálogo de confirmação mostra o texto do aviso. Um cenário [I] prova os dois casos: aluno ativo e nome livre igual na lista | techspec seção 4 (linha 132), seção 9 (linhas 306-308); cenarios.md, linhas 144-145 |
| B | Download da coordenação sem o aviso de apagar | **Feito.** O diálogo do botão `oficial` diz que o arquivo deve ser entregue ao titular e apagado do computador logo depois. O e2e confere o aviso e o nome do arquivo | techspec seção 9 (linhas 310-313); cenarios.md, linha 212 |
| C | Privacidade do aluno não existia | **Feito.** A fatia cria o item **Privacidade** no rodapé fixo do aluno, por enquanto só com "Meus dados", e ele também aparece na gaveta a 360 px. O e2e chega lá pela navegação, não pelo endereço | techspec seção 9 (linha 325); cenarios.md, linha 213 |

Três recomendações da rodada 2 também entraram: os textos de "Em preparação" e "Expirou" com a consulta a cada 10 s, o nome atual e o novo no Corrigir nome, e disciplina e turmas do professor na busca.

**Formato da resposta**

```
VEREDITO: APROVADO
Estados: ok — vazio de "Meus dados" convida; "em preparação" e "expirou" têm texto; a coordenação e o aluno consultam a cada 10 s e param com a aba escondida; Pedidos, Retenção, Suboperadores, Incidentes e "Meus dados" passam pelos quatro estados no e2e
Acessibilidade: ok — busca por Enter ou botão com aria-live; vencido com texto e ícone; aviso de incidente por teclado com rolagem no diálogo; e2e de toda tela nova verifica acessibilidade
Chromebook fraco: ok — busca sem disparo a cada tecla, lista de 50, sem upload, JSON nunca renderizado, telas por lazy com teto de 30 kB
Celular: ok — tabela vira lista abaixo de 768 px; Privacidade do aluno na gaveta a 360 px, provada no e2e; faixa de incidente e Sair a 360 px; nenhum fluxo exige o celular
Ação oficial protegida: sim — eliminação (família perigo, prévia, aviso de homônimo, 7 dias), download da versão da escola (finalidade, conteúdo, registro, aviso de apagar), Corrigir nome (antes e depois), Cancelar (diz que o acesso volta), confirmação de incidente
Bloqueantes: nenhum
Recomendações:
 1. techspec seção 13 (linha 369) diz que "a tela de Corrigir nome avisa" que o nome anterior a uma correção só sai pelo expurgo, mas a seção 9 (linha 314) não traz esse aviso nem o texto dele. Escrever o texto no item Corrigir nome da seção 9.
 2. techspec seção 9 (linha 325): a lateral do aluno hoje é uma lista simples (`apps/web/src/areas/navegacao.ts`), sem lugar para rodapé fixo, e o rodapé da casca guarda só o `MenuDaPessoa`. A tarefa deve declarar esse lugar na casca e atualizar `apps/web/src/areas/navegacao.test.ts:45`, que hoje afirma que "Privacidade" não existe, mais a lista do aluno no e2e de áreas (W2).
 3. O caminho do professor até "Meus dados" pelo menu da pessoa não tem e2e pela navegação. Hoje o `MenuDaPessoa` só tem nome, papel e Sair, então o link é peça nova. Vale um cenário [E] igual ao do aluno: no menu da pessoa, também na gaveta a 360 px.
 4. Texto do 429 da busca e validação do mínimo de 3 letras no próprio campo continuam sem texto escrito (vem da rodada 2).
```

Arquivos citados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/navegacao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/navegacao.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/MenuDaPessoa.tsx

## test-engineer · 3ª rodada · REPROVADO · 2026-10-05 15:14:14 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: os 8 bloqueantes da rodada 2, mais os cenários das regras que as correções da rodada 2 trouxeram para a spec. Essas regras são: chave de idempotência do `job_registro`, único de `arquivo_titular`, apelido `rotina` reservado, check de `consumo_ia.provedor` com corte, prévia com `homonimo` e D64, `pedidos.listados`, estados do `corrigir-nome`, `ACESSO_SUSPENSO` só depois da credencial, cancelar zera `eliminacao_agendada_em`, compartilhamento refeito antes de anonimizar, `SuboperadorDaEscolaRepository` e `IncidenteDaEscolaRepository`, e janela letiva a cada lote e entre faixas.

Cobertos:
1. Rate limit da busca: atendido (`cenarios.md:191-193`). Tem a 31ª busca com 429 tipado, e duas coordenadoras no mesmo IP com 30 cada, o que prova que o limite é por usuário.
2. `consumo_ia.provedor`: atendido em parte (`cenarios.md:27-28`, `54-61`). Faltou o segundo check (bloqueante 1).
3. Trava `consumo_por_aluno ≤ conversa_tutor`: atendido (`cenarios.md:25-26`).
4. Check do autor `rotina`: atendido (`cenarios.md:187-190`). Tem caso recusado e caso aceito, mais o apelido reservado.
5. `escola_id` e `titular_id` do pedido não mudam: atendido (`cenarios.md:90`).
6. RF13b: atendido (`cenarios.md:123-129`; `techspec.md` seção 13). A saída escolhida foi declarar o limite. Os estados do `corrigir-nome`, o erro tipado de tamanho e o isolamento da conta estão cobertos, e a varredura do RF17 procura o nome anterior (`cenarios.md:157-158`).
7. Aluno só na lista de nomes: atendido (`cenarios.md:194-197`). A busca não o acha, "decidir" e "retirar" ficam auditados, e o aviso tem e2e.
8. `no-store`: atendido (`cenarios.md:157-160`). Confere o cabeçalho das duas respostas, os parâmetros da URL assinada e o nome do arquivo, e a varredura agora procura só nas outras respostas.

Das correções novas estão cobertas:
- clique duplo e rotina dupla (`cenarios.md:180-186`);
- `rotina` reservado (`:190`);
- `homonimo` na prévia (`:144-145`);
- D64 na prévia, na foto e no detalhe (`:118-119`);
- foto refeita antes de anonimizar (`:120-121`);
- `pedidos.listados` (`:164`);
- `ACESSO_SUSPENSO` depois da credencial e o cancelar que devolve o acesso (`:132-135`);
- B não vê o suboperador `lista` de A, e o incidente fica por escola (`:67-70`, `:76-78`);
- teste de arquitetura dos dois repositórios (`:200`);
- aviso de apagar no download e Privacidade do aluno (`:212-213`).

Bloqueantes:

1. **O segundo check de `consumo_ia.provedor` não tem cenário.** Fica em `techspec.md:103-104`, seção 3, Migration 0024, e o cenário que falta seria em `cenarios.md:54-61`.
   - O que está errado: a rodada 2 exigiu um [I] "com os dois checks da 0024". Entrou só o primeiro (`provedor` com `envio_externo = false`, `cenarios.md:59`). O segundo, `not envio_externo or provedor is not null or em < <instante da 0024>`, só tem o lado da linha antiga (`:27-28`), e esse lado passa mesmo sem o check. Se o check sair da migration, nenhum teste quebra. É ele que garante, no banco, o rastro do RF13 para toda linha nova.
   - Correção exigida: um [I] em que uma linha com `em` depois do corte, `envio_externo = true` e `provedor` nulo é recusada pelo banco.

2. **A janela letiva entre as faixas da troca de nome não diz o que acontece, e não tem cenário.** Fica em `techspec.md:212-213`, seção 5, Eliminação, etapa 2, e afeta os cenários do RF15 (`cenarios.md:140-149`).
   - O que está errado: a correção da rodada 2 pôs "conferindo a janela letiva entre as faixas", mas não diz o que o job faz quando a janela abre. Se ele parar a troca e seguir para a etapa 3, a eliminação conclui com o nome completo nas faixas que ninguém examinou. Como a auditoria não guarda o nome, nada consegue achá-lo depois. Isso viola o RF15 sem nenhum teste vermelho. O cenário da janela que existe (`cenarios.md:41`) cobre só o expurgo por categoria.
   - Correção exigida:
     - a seção 5 declara que, com a janela aberta no meio da troca, o job termina sem rodar a etapa 3, o pedido continua `agendado` e o reenfileiramento de 24 h o retoma;
     - um [I] com a janela abrindo entre duas faixas prova que o pedido não conclui, que o nome continua só nas faixas não examinadas e que a execução seguinte termina a troca e elimina.

Recomendações:
- **RF13 sem uso.** O critério do PRD diz "sem uso, só com a hospedagem", e falta um [I] explícito para isso. Falta também um [I] de que o pedido de correção lista o compartilhamento. Os dois já vinham da rodada 2.
- **Aviso do limite do nome anterior.** A seção 13 diz que "a tela de Corrigir nome avisa isso", mas a seção 9 não traz o texto, e o [E] de `cenarios.md:215` não confere o aviso.
- **Aviso de homônimo no diálogo.** Falta um [E] com o texto da seção 9. Hoje `cenarios.md:210` cobre só a escolha pela turma.
- **Chave de idempotência do `job_registro`.** O único parcial exclui `concluido` e `falhou` (`techspec.md:105-106`), então uma segunda rodada na mesma noite, depois de a primeira terminar, cria outro job. Isso contradiz "rodar duas vezes na mesma noite não cria dois jobs" (`techspec.md:156-157`). Ajustar o texto ou o índice, e acrescentar o caso em sequência ao cenário em paralelo de `cenarios.md:183`.
- **Execução `pendente` anonimizada.** Falta um [I] de que, se o worker ainda pega essa execução, ela termina `falhou` com código e sem chamar o adaptador (`techspec.md:221-222`).
- **Etapa 3 atômica.** Falta um [I] em que uma falha no `CicloDeVidaService.eliminar` desfaz a anonimização e deixa o pedido `agendado`.
- **`ACESSO_SUSPENSO` pelas contas da escola.** Falta o caso com token válido da conta Google ou Microsoft (`techspec.md:147-148`). Hoje só a senha é testada.
- **Parênteses do `SuboperadorDaEscolaRepository`.** Falta um caso que só quebre sem os parênteses, por exemplo um suboperador `lista` de B, encerrado, que não pode aparecer em A.

Arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md`

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-05 15:14:19 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: APROVADO

Os dois bloqueantes da rodada 2 foram resolvidos, e o diff não traz problema novo de conformidade.

**Bloqueante 1 da rodada 2 (D64, prévia e compartilhamento do professor): resolvido.**
- **Seção 4** (`techspec.md:132`): a prévia de um professor mostra só as categorias de cadastro e vínculo. As de uso da IA não aparecem, e a resposta é a mesma para quem usou e para quem não usou. A leitura continua auditada (`titular.previa_lida`).
- **Seção 5** (`techspec.md:195-196`): o compartilhamento de professor sai só por período, na foto e no detalhe. A junção com `solicitada_por` saiu. As datas reais de uso vão só para a versão `completa`, que o próprio professor baixa.
- **Seção 7b** (`techspec.md:272-275`): foi reescrita e cita os itens 8 e 9 e a D64.
- **Teste** (`cenarios.md:118-119`): o cenário com dois professores, um que usou o Assistente e outro que nunca usou, exige prévia, foto e `GET pedidos/:id` iguais.
- **PRD, seção 6** (`prd.md:79-81`): a exceção da versão do professor sem conta ativa está declarada e auditada.

**Bloqueante 2 da rodada 2 (autor `rotina`): resolvido.**
- **Seção 3** (`techspec.md:108-110`): a lista fechada é `usuario.eliminado`, `acesso_turma.revogado`, `titular.nome_trocado` e `pedido.concluido`.
- **Conferido no código:** `CicloDeVidaService.eliminar` (`apps/api/src/sessao/ciclo-de-vida.service.ts:79,85`) grava só `acesso_turma.revogado` e `usuario.eliminado`. Os dois estão na lista, então a eliminação e o expurgo de `pessoa_desativada` não esbarram no check. Nenhum código de hoje grava `rotina`.
- **Teste** (`cenarios.md:187-190`): o banco recusa `rotina` em `entrega.aprovada`, em `entrega.rejeitada` e na validação de lote, e aceita nas quatro ações da lista. O apelido `rotina` fica reservado na criação de operador, com teste.

**Recomendações da rodada 2 que entraram:** RF15 agora diz "só se houve troca" (`prd.md:65`). O texto "Em as duas versões" foi corrigido. O arquivo do aluno não traz o conteúdo do artefato aplicado, com teste (`techspec.md:270`, `cenarios.md:69`). O limite do nome anterior a uma correção está declarado (`techspec.md:368-369`).

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum (a spec só apaga ou anonimiza `correcao`, em cascata) — todos com autor humano? sim
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok
Supervisão do tutor: ok
Autonomia declarada e visível: sim (nenhum agente nem função nova, seção 8)
Bloqueantes: nenhum
Recomendações:
- cenarios.md:117 — "A prévia e o compartilhamento de um professor não alcançam a execução de outra pessoa" descreve a junção que saiu. Remover, ou reescrever para o compartilhamento por período.
- techspec.md:195 diz que o compartilhamento por período aparece "na prévia", mas techspec.md:132 diz "Sem compartilhamento". Alinhar (prefiro o da linha 132).
- techspec.md:273 e prd.md:81 — "Antes de um pedido" dá a entender que, depois do pedido, a coordenação vê a diferença. Trocar por "em tudo, fora da versão `coordenacao` de professor sem conta ativa".
- prd.md:63 (RF13) ainda diz "a partir das chamadas a provedor externo" para todo titular. Acrescentar que o compartilhamento de professor é só por período (D64).
- techspec.md:221 — "Autor: quem registrou, ou `rotina`": dizer quando entra cada um (por exemplo, `rotina` quando quem registrou não é mais usuário ativo da escola, por causa do gatilho `auditoria_autor_da_escola_fk`).
- Segue da rodada 2: quando a consulta de auditoria do F12 existir, as linhas de `titular.nome_trocado` sobre `execucao_agente` e `consumo_ia` não podem levar a coordenação a saber qual professor escreveu o nome do aluno no tema.
```

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/auditoria.ts

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-05 15:14:34 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: APROVADO

Os quatro bloqueantes da rodada 2 foram corrigidos e não achei bloqueante novo no diff `853a3a7..46bd2d8`.

**Os quatro bloqueantes da rodada 2**

| # | Situação | Onde |
|---|---|---|
| A. O que entra no arquivo e as colunas proibidas | Corrigido. Seção 3 da techspec (linhas 73 a 80): a lista do que entra, por tabela, com a coluna em `conta`, `credencial_matricula`, `conta_externa`, `sessao`, `registro_acesso` e `artefato`. `COLUNAS_FORA_DO_ARQUIVO` está fechada: hashes de senha, token e cookie, segredo do segundo fator, códigos de recuperação, `chave_envio`, `chave_objeto` e `sub`. O e-mail da conta do professor está decidido: entra nas duas versões. Os cenários (seção "RF11, colunas proibidas") têm sentinela por coluna nas duas versões. Conferi no schema: `reivindicacao.senha_hash` e `chave_envio` ficam de fora, e o `lista_nome` aprovado já não guarda nome (check `lista_nome_aprovado_sem_nome`), então a correção de nome não deixa cópia antiga ali | techspec seção 3; cenarios RF11 |
| B. Auditoria da listagem | Corrigido. `GET pedidos` grava `pedidos.listados` com os ids da página e finalidade fixa (seção 4). A ação aparece na seção 7, e o cenário do RF17 falha sem as três auditorias, cada uma com a finalidade | techspec seções 4 e 7; cenarios RF17 |
| C. `ACESSO_SUSPENSO` | Corrigido. Só sai depois de a credencial ser conferida (senha certa ou token válido da conta Google ou Microsoft), pelo mesmo caminho de tempo e de contador. Senha errada responde igual à matrícula inexistente. No login por e-mail e no seletor, a escola com eliminação agendada não aparece. Os três casos têm cenário | techspec seção 4, "Login suspenso"; cenarios RF14 |
| D. Aluno que só está na lista de nomes | Corrigido. O caminho real da A1 está escrito: o acesso é a leitura auditada (`turma.lista_lida`); a correção é retirar e acrescentar; com reivindicação pendente, a coordenação decide (`decidida_como = coordenacao`) e depois retira. Há cenários de integração e E2E para isso | techspec seção 4; cenarios "Aluno só na lista de nomes" |

Pelo PRD: a foto do compartilhamento, `nome_trocado` e `homonimo` entraram no mapa (seção 8). A exceção da D64 está declarada na seção 6, junto da regra de que, antes de um pedido, nada separa o professor que usou a IA do que não usou.

**Pergunta de fechamento:** o código responde. O arquivo `completa` traz o que o sistema guarda sobre o aluno. A foto do compartilhamento diz para onde o dado foi, pelo `consumo_ia.provedor`, e quando o rastro já expirou, pelo período. Ela continua disponível depois da eliminação e é refeita antes de anonimizar.

```
VEREDITO: APROVADO
Campos pessoais tocados: todos os do mapa, para ler, apagar, anonimizar, trocar e corrigir o nome. Novos: pedido_titular (com a foto do compartilhamento, nome_trocado e homonimo), arquivo_titular, incidente_escola.confirmado_por, usuario.eliminacao_agendada_em, consumo_ia.provedor e o apelido do operador em retencao_escola, suboperador e incidente.
Fora da tabela de dados do docs/lgpd.md: os novos acima, que entram no mapa na tarefa da migration (techspec seção 7; PRD seção 8 já atualizado). Atende a regra 20, item 1.
Autorização por objeto: ok. Outra escola, outra pessoa e o pedido sobre si mesmo (pela conta) respondem NAO_ENCONTRADO, igual ao id inexistente; a conta ativa é conferida por escola; o login suspenso não confirma que a matrícula existe.
Logs: limpos no desenho (seção 7). Os jobs levam só ids; o RF17 procura no log e nas respostas o nome atual, o nome anterior, o termo da busca e a URL.
Auditoria: presente em busca, prévia, listagem, detalhe, registro, agendamento, cancelamento, conclusão, nome corrigido, nome trocado, arquivo baixado e eliminação, todas com finalidade fixa; e na operação.
Envio externo: nenhum. A funcionalidade não usa IA. O compartilhamento responde para onde o dado já foi, inclusive depois do expurgo.
Seed/fixture: sintético (sentinelas, relógio injetado, servidor falso sem provedor pago).
Bloqueantes: nenhum.
Recomendações:
 - techspec seção 4, GET pedidos: dizer que pedidos.listados e pedido.lido gravam na mesma transação da leitura, como turma.lista_lida em apps/api/src/estrutura/lista.service.ts:167.
 - techspec seção 4, "Aluno só na lista de nomes": dizer que a reivindicação decidida pela coordenação segue reivindicacao_decidida (60 meses) e não sai na hora da retirada, para a tela não prometer eliminação que não acontece.
 - techspec seção 3: o arquivo traz só a auditoria em que o titular é autor. Avaliar se a do aluno deve trazer também quando a escola leu os dados dele (prévia, pedido, lista lida), só com data e ação, sem o autor; é dado sobre ele.
 - techspec seção 3: conta entra "só o e-mail", e isso já deixa de fora mfa_ultimo_passo e mfa_chave_versao. Vale incluir os dois em COLUNAS_FORA_DO_ARQUIVO, para a sentinela pegá-los se a lista de conta crescer.
 - Continua aberta da rodada 1: limitar quantas vezes a coordenação baixa a mesma versão e levar o evento ao relatório do dossiê.
 - Continua aberta da rodada 2: alinhar no docs/lgpd.md a retenção de correcao.destaque_aberto_por com a cascata de trabalho_do_aluno (levar ao conformidade-reviewer).
```

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md

Schemas conferidos (todos em /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/):
- lista-nome.ts
- registro-acesso.ts
- auditoria.ts
- conta.ts
- reivindicacao.ts

## llm-integrator · 3ª rodada · APROVADO · 2026-10-05 15:14:45 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: APROVADO

Perfis usados: nenhum. A spec continua sem chamada de modelo (techspec seções 1 e 8).

Custo estimado por professor/mês: R$ 0 em modelo, porque são zero chamadas. O custo é de Postgres: o expurgo noturno, a troca de nome e a anonimização rodam em lote, fora do horário letivo.

Prompt versionado: não se aplica

Validação de schema: não se aplica

Aprovação humana no caminho: não se aplica

**Os três bloqueantes da rodada 2**

- **A. Check `NOT VALID` que quebrava o UPDATE de linha antiga.** Resolvido em `techspec.md:103-104` (seção 3, Migration 0024). O check agora tem corte fixo, `not envio_externo or provedor is not null or em < <instante da 0024>`, e vale desde a criação. A linha antiga sem `provedor` já não barra o expurgo, a troca de nome nem a anonimização, e o teste consegue criá-la. O cenário exigido entrou em `cenarios.md:27-28`. Também confirmei que nenhum teste de integração atual insere `consumo_ia` com `envio_externo = true`, então o check novo não quebra nenhum teste existente.
- **B. Testes do provedor fora do `cenarios.md`.** Resolvido em `cenarios.md:54-61` (Fatia 2, "`consumo_ia.provedor`"). Entraram os cinco: a configuração recusa a subida sem `IA_PROVEDOR_ID` e com id fora do formato; o falso, o local, `regra_fixa` e zero tentativas gravam nulo, e o externo grava o id usando servidor falso; o banco recusa `provedor` sem envio externo; o `ConsumoRepository` grava a coluna sem mudar a soma da governança; e a gravação do consumo nunca falha por causa da coluna. O tipo da porta (`techspec.md:116`) une `envioExterno` e `provedorId`, o que fecha a regra pelo compilador.
- **C. Foto do compartilhamento refeita depois de anonimizar.** Resolvido em `techspec.md:186-187` (seção 5, Compartilhamento) e `techspec.md:216-219` (Eliminação, etapa 3). A etapa 3 agora segue esta ordem: trava o pedido, refaz a foto, anonimiza e só então elimina. A foto sai pelo `SuboperadorDaEscolaRepository`. O cenário em `cenarios.md:120-121` usa um provedor sem cadastro e afirma `origem` diferente de `periodo`, o que a reserva por período não consegue produzir.

Bloqueantes: nenhum.

**Recomendações**

1. **Seção 3 e seção 7c ("Migration ... compatível"): o corte do check e a versão anterior do código.**
   - O `<instante da 0024>` precisa ser um literal `timestamptz` fixo no SQL, e não `now()`.
   - O `em` vem do relógio da aplicação (`provedor.ts:248`). Se o código antigo gravar consumo com envio externo depois de a migration rodar e antes do deploy do código novo, o insert falha. Pela regra do `ProvedorDeIa` ("se o registro falhar, a chamada falha", `provedor.ts:82`), a geração também falha.
   - Hoje não existe ambiente com provedor externo (D31; o Ollama é local), então o risco não é real agora. Vale escrever na seção 7c que a 0024 sobe junto com o código que grava `provedor`, e conferir isso de novo antes do staging.
2. **Seção 5, etapa 3: "Uma execução `pendente` anonimizada que o worker ainda pegue termina `falhou` com código".**
   - A spec não diz como isso acontece. O `AgendadorDeExecucoes` guarda a entrada da tarefa na closure, em memória (`agendador-de-execucoes.ts:104`). Ele não relê `execucao_agente.entrada`, então anonimizar a linha não impede essa execução de rodar.
   - Na prática o caso não acontece: as sessões caem no agendamento, a eliminação vem 7 dias depois, e a varredura (`executor.ts:46`) encerra a execução parada.
   - Vale nomear o mecanismo (por exemplo, `anonimizada_em is null` no `update` de `pendente` para `rodando`) com um [I], ou tirar a frase e citar a varredura como a garantia.
3. **`cenarios.md:120`.** Dizer que o titular do cenário do provedor sem cadastro é **aluno**. Para professor, a foto é sempre por período (`techspec.md:193-194`), e o cenário como está escrito se contradiz.
4. **`AdaptadorRoteirizado` (`packages/nucleo/src/ia/__fixtures__/adaptador-roteirizado.ts:15`).** Ele usa `envioExterno = true` como padrão e vai precisar de um `provedorId` para respeitar o tipo novo. Vale citar o fixture na tarefa da porta, para o [U] do externo usar um id conhecido.

## infra-guardian · 3ª rodada · REPROVADO · 2026-10-05 15:15:13 · `tasks/prd-lgpd-e-titular/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: fila | migration | IA (o registro de consumo, via `consumo_ia.provedor`)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida. Os dois bloqueantes da rodada 2 foram corrigidos:
- A chave existe agora. `job_registro.chave_idempotencia` ganhou único parcial (techspec seção 3, l.105-106), o `Enfileirador` faz `on conflict do nothing` (seção 5, l.155-157) e o cenário em paralelo está em `cenarios.md`:183.
- O índice `consumo_ia (escola_id, execucao_id) where execucao_id is not null` entrou, junto com o `EXPLAIN` com volume de Tutor (7c, l.289).

Índice e paginação: ok
Degradação de IA: não se aplica à funcionalidade, mas a migration quebra o registro de consumo (bloqueante 1)
Migration: bloqueante
Métrica e alerta: ok

Bloqueantes:

1. **Seção 3, l.103-104, e seção 7c, l.290 ("Migration: compatível")**
   - **O que está errado:** a 0024 cria, já válido, o check `not envio_externo or provedor is not null or em < <instante da 0024>`. O código anterior grava `envio_externo = true` sem `provedor`. Durante o deploy em rolagem, ou depois de um rollback do código, cada consumo de provedor externo com `em` posterior à migration viola o check. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ia/provedor.ts:144-149`, a falha do `registrar` no caminho de sucesso vira `IA_INDISPONIVEL`. Resultado: toda resposta do Tutor e do Assistente falha enquanto houver uma instância antiga, e o rollback descrito na própria seção 7c não funciona. A tabela ainda é pequena, mas isso não muda o problema: ele é de compatibilidade, não de tamanho. A frase da seção 3 "a gravação do consumo nunca falha por causa dessa coluna" fica falsa.
   - **Correção exigida:** a 0024 leva só `check (provedor is null or envio_externo)`, que o código antigo cumpre. A exigência de `provedor` com envio externo vai para uma migration de contração posterior (`NOT VALID` e depois `VALIDATE`, com o corte de data), aplicada depois que o código que grava `provedor` estiver em todas as instâncias. Até lá, quem garante é o tipo da porta. O runbook de rollback precisa citar isso. Acrescentar em `cenarios.md` um [I]: um insert no formato do código anterior (externo, sem `provedor`, `em` = agora) é aceito depois da 0024.

2. **Seção 5, l.164 contra seção 7c, l.284, e `cenarios.md`:41**
   - **O que está errado:** a seção 5 agora diz que, se a janela letiva abrir, o job "para; o resto sai na noite seguinte". A 7c ("lote não urgente, que se reenfileira se a janela abrir") e o cenário ("ele se reenfileira e para") continuam com o comportamento antigo. Com o único parcial novo, um reenfileiramento feito de dentro do job, com a mesma chave "escola + data local" enquanto o job atual está `ativo`, é engolido pelo `on conflict do nothing`. O teste escrito a partir de `cenarios.md`:41 cobra um comportamento que a idempotência impede, e a regra "para e continua na noite seguinte" fica sem teste que a prove.
   - **Correção exigida:** alinhar a 7c e `cenarios.md`:41 com a seção 5. O cenário deve afirmar três coisas: o job para no lote em que a janela abriu, o `expurgo_execucao` grava a contagem parcial, e o job da noite seguinte termina o restante. Dizer também o que o `titular.eliminar` faz quando a janela abre na etapa 2 (l.212-213): para sem rodar a etapa 3, e o pedido continua `agendado`.

Recomendações:
- **Seção 5, l.159-160, e `cenarios.md`:43.** A guarda `eliminacao_enfileirada_em < now() - interval '24 hours'` depende do horário em que o job da escola roda em cada noite. Se na noite anterior ele rodou às 1h30 e nesta às 1h10, o reenfileiramento pula uma noite. Usar um intervalo menor (por exemplo, 20 h) ou comparar com o início da noite corrente.
- **Seção 3, l.105.** `escola_id` é anulável em `job_registro`, e no único `(escola_id, tipo, chave_idempotencia)` um nulo nunca colide com outro, então job `sistema.*` com chave não seria deduplicado. Acrescentar o check `chave_idempotencia is null or escola_id is not null`, ou usar `nulls not distinct`.
- **Seção 5, l.156-157.** "Rodar duas vezes na mesma noite não cria dois jobs" só vale enquanto o primeiro não terminou, porque o único libera em `concluido` e `falhou`. Declarar que um segundo job depois de concluído é inofensivo, por ser idempotente.
- **Seção 7c, l.288.** "chave 'escola + noite'" aparece duas vezes e com outro nome; unificar como "escola + data local".
- **Seção 5.** Dizer o que `Enfileirador.enfileirar` devolve quando a chave colide (hoje a assinatura é `Promise<string>`) e como quem chama trata isso.
- **Seção 7c, l.290.** O check de `auditoria` já segue o padrão `NOT VALID` seguido de `VALIDATE`. O de `consumo_ia`, depois de corrigido pelo bloqueante 1, deve seguir o mesmo padrão, para não fazer a varredura com trava exclusiva quando a tabela já tiver volume.

Arquivos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0000_job_registro.sql`
