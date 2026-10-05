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
