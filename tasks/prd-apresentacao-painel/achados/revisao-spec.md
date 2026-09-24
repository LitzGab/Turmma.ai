# Achados das revisões — `tasks/prd-apresentacao-painel/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 12:34:48 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. O painel do operador não é caminho quente, mas a spec muda a trava do convite do F1 e o `ops:convite-coordenador`, e cria uma migration de índice.

Rate limit: ok. As oito rotas contam em `rl:op:{sub}`, por operador e nunca por IP, nenhuma é anônima, e há teste de 429 no `POST /escolas` (seções 1 e 7c).

Fila e prioridade: ok, não se aplica. Nada passa de 2 s dentro do request: a lista é uma consulta por página, com 25 escolas, e o uso lê a tabela que já é consolidada. Nenhum job novo.

Concorrência: protegida (seção 7c).
- **Clique duplo em nova rede ou escola:** o UUID do pedido nasce no cliente e a gravação usa `on conflict (id) do nothing`, com a auditoria na mesma transação.
- **Gerar, refazer e revogar:** usam `pg_advisory_xact_lock(7_000_003, hashtext(escola_id))` e só leem o estado depois de pegar a trava. A chave 7_000_003 não colide com 7_000_001 (migração) nem com 7_000_002 (operadores).
- **Autor:** é conferido com `for share` dentro da mesma transação da escrita.
- **Teste:** os cenários paralelos estão na seção 10, com `Promise.all`.

Índice e paginação: ok.
- As contagens usam índices que já existem e começam pelo escopo: `vinculo_usuario_idx (escola_id, ano_letivo_id, usuario_id, estado)`, `ano_letivo_um_em_curso_por_escola`, a PK `(escola_id, dia)` de `uso_infra_diario` e `convite_escola_usuario_idx`.
- A lista é paginada em 25, com desempate por `id`.
- O `EXPLAIN` com 30 escolas fica exigido na tarefa (seção 7c).

Degradação de IA: não se aplica.

Migration: compatível. É só o índice único parcial `convite_pendente_unico` na tabela `convite`, que é pequena (só `tipo = 'coordenador'`, conferido em `packages/nucleo/drizzle/0008_convite.sql`). O código anterior já revoga antes de criar, e o risco de dado antigo está declarado na seção 13.

Métrica e alerta: ok. Fora do caminho quente valem as métricas HTTP que já existem, e a spec não cria alerta novo, então não precisa de runbook.

Bloqueantes: nenhum.

Recomendações:
1. **Seção 7c, linha "Convite em aberto":** a promessa do teste de mutação ("o mesmo cenário sem a trava continua com um só") não se cumpre em todos os casos. O índice é por `(escola_id, usuario_id)`, então dois "gerar" em paralelo com e-mails diferentes criam dois usuários, e sem a trava ficariam dois convites em aberto. Há duas saídas: limitar o teste de mutação aos cenários do mesmo usuário (refazer e refazer, gerar e refazer), ou declarar que, entre usuários diferentes, só a trava garante a regra. Senão o `test-engineer` vai escrever um teste que não passa ou que não prova nada.
2. **Seção 5, `estadoDaCoordenacao`:** quando o último convite foi usado e não há coordenador ativo (por exemplo, a coordenadora foi desativada depois), o estado é `pendente`. Nesse estado o "gerar" dá `CONFLITO`, e o refazer e o revogar do convite usado caem no `update` condicional, que exige convite em aberto, e falham. A escola fica sem nenhuma ação no painel, embora a seção 9 mostre refazer e revogar para `pendente`. Falta dizer o que o operador pode fazer nesse caso, com um teste que prove.
3. **Seção 7c, `hashtext(escola_id)`:** declarar o cast `escola_id::text`, porque `hashtext` não recebe `uuid`.
4. **Seção 5, ordem por `uso`:** a spec deve dizer que essa ordem calcula o uso de todas as escolas antes de paginar. Com dez escolas é irrelevante, mas deixa explícito para quando a rede crescer.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0008_convite.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-24 12:35:02 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: não há tabela nova (seção 3). Verifiquei a migration de índice `convite_pendente_unico (escola_id, usuario_id)`, que começa pelo escopo. Verifiquei também `convite` (tem `escola_id` e FK composta para o usuário da escola), `rede` e `escola` (são as exceções declaradas da regra 10, item 1) e a ação nova `convite.refeito`, que vai para a auditoria da escola sem nome nem e-mail.

Queries verificadas: `PainelRepository.redes`, `.escolas` e `.uso`, que são novas e levam `@SemEscopo`. `RedeEEscolaRepository.criarRede`, `.criarEscola` e `.pedidoRepetido`. `ResolucaoDeTenantRepository.contaParaConvite` e `.escolaDoConviteParaOperador`, que já existem e ganham o painel como chamador. As escritas de convite rodam no contexto da escola, com a trava `pg_advisory_xact_lock` por escola (seção 7c). O autor vem da sessão, conferido dentro da transação, e `z.strictObject` recusa `autor` no corpo (seções 4 e 5).

Item por item:
1. `escolaId` e `anoLetivoId`: não se aplica, porque não há tabela nova. As contagens usam o ano `em_curso` de cada escola (seção 5, "Leitura").
2. Escopo a partir do token: garantido. A tela aceita `:id` de escola ou de convite porque o painel é a exceção da regra 10, item 9. Esse id vira o contexto, não um filtro de query (seções 5 e 6).
3. `escolaId` no corpo ou na query: garantido. A query só leva `pagina` e `ordem`. `redeId` no corpo de `POST /escolas` serve para criar, não para ler. Sessão de escola recebe o 404 de rota inexistente nas oito rotas.
4. Teste de isolamento: efetivo para as contagens. Ninguém prova que o uso fica por escola (bloqueante 2).
5. Revelar existência de dado de outra escola: garantido para a sessão de escola (404 igual a rota inexistente). Convite inexistente e convite já revogado respondem os dois `NAO_ENCONTRADO`. O teste sentinela cobre as respostas de erro.
6. UUID: garantido. O id de rede e escola vem do cliente, com o desvio registrado na seção 11.
7. Camada rede: não se aplica. O DTO só leva número (seção 7).
8. `@SemEscopo`: todos têm justificativa (tabela da seção 6), e o teste de arquitetura trava os três do `PainelRepository`.

Teste de isolamento: presente e efetivo para as contagens, ausente para o uso.

Bloqueantes:
1. **Refazer e revogar por `conviteId` não se limitam ao convite de coordenação** (seção 5, "Convite da coordenação"; seção 6, linha `escolaDoConviteParaOperador`; seção 4, rotas `/v1/operacao/convites/:id/refazer` e `/revogar`).
   - O que está errado: o desenho acha a escola pelo id do convite e refaz "o último convite", sem condição de `tipo`. Hoje `TIPOS_DE_CONVITE` só tem `'coordenador'` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts:6`), mas a A1 vai pôr ali o convite de professor. A partir disso, o operador que refaz o `conviteId` de um professor ainda sem senha recebe um token que abre uma conta dentro da escola. É escalada de privilégio contra a D10 e a RF3/RF4 do PRD.
   - Correção exigida:
     - a Tech Spec deve dizer que o refazer e o revogar pelo painel (e pelo `ops:*`) só alcançam convite com `tipo = 'coordenador'`;
     - qualquer outro convite responde `NAO_ENCONTRADO`, igual ao inexistente;
     - o backend recusa o refazer quando o estado não é `pendente` nem `vencido`, e não confia na UI da seção 9 para isso;
     - a seção 10 ganha um teste que semeia um convite de outro tipo (ou de coordenador numa escola `ativa`) e prova o 404 sem nada gravado.
2. **Nenhum teste prova que o uso fica por escola** (seção 6, "Testes"; seção 10, linhas "Integração" e "Isolamento").
   - O que está errado: o isolamento previsto é "duas escolas com contagens diferentes, cada uma com a sua", o que cobre turmas, professores e alunos. Se a correlação `escola_id` sair da subconsulta de uso de `PainelRepository.escolas` e de `.uso`, nenhum teste listado quebra. O RF4 do PRD pede exatamente essa prova.
   - Correção exigida: a seção 6 (ou a 10) inclui um teste com uso sintético diferente em duas escolas, em `GET /v1/operacao/uso` e na lista com `ordem=uso`. Cada escola mostra o seu dia e o seu mês: a soma de requisições e jobs, e o pico de bytes.

Recomendações:
- **Contagem de `@SemEscopo`.** A regra 10, item 9, desconfia de três por módulo, e o desenho leva três ao `operacao` (`PainelRepository`) e três ao `ops` (`pedidoRepetido` se soma aos dois de `escola.repository.ts`). A seção 11 justifica juntar a leitura num lugar só, mas não fala da contagem. Vale uma linha a mais no desvio.
- **UUID do pedido.** Na seção 4, exigir UUID v4 ou v7 no `id` do pedido, para o cliente não mandar um id sequencial ou previsível.
- **Onde fica `rede.criada`.** A seção 7 diz que a auditoria é "na escola", e a rede não tem escola. Falta dizer onde `rede.criada` é gravada.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts`

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-09-24 12:35:21 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Estados: faltando parte. A seção 9 afirma os quatro estados e descreve o vazio de Escolas, que convida a criar a primeira rede. Faltam dois vazios. O de Uso não está descrito. O do diálogo Nova escola quando ainda não existe rede também não, e o diálogo depende do `GET /redes`, que também pode falhar. Carregar e errar na lista ficam cobertos pelo padrão da A0 (`textoDaFalha`, 503 com texto próprio). Não bloqueia, e está nas recomendações.

Acessibilidade: a seção 9 garante estado em texto (a cor só reforça), teclado e alvo de 44 px, e o E2E da seção 10 passa o axe. Ficam implícitos, e vão como recomendação:
- foco preso e devolvido nos diálogos;
- Esc e clique fora caindo na mesma pergunta de "fechar sem copiar";
- `aria-sort` na ordenação;
- `aria-live` no "Link copiado" e no "o convite mudou";
- `inputmode="email"` e `autocomplete` nos campos do convite.

Chromebook fraco: adequado. A lista é paginada em 25 (não precisa de virtualização) e o chunk tem teto de 60 kB brotli, com divisão `operacao-*` (seção 9). Não há upload nem caminho quente (seção 7c). Não menciona teste com throttling de rede e de CPU; vai como recomendação.

Celular: incompleto. A seção 9 define cartões abaixo de 640 px só para Escolas. O Uso mostra seis números por escola "lado a lado" e não tem layout para 360 px. O RF5 exige "no celular não há rolagem horizontal" nas duas telas, e o E2E da seção 10 não visita a tela de Uso nem confere a rolagem horizontal. Isso vira bloqueante 1. Nenhum fluxo exige o celular.

Ação oficial protegida: sim, com ressalvas. Não há nota nem ação sobre aluno aqui. O convite mostra antes o que vai acontecer; refazer e revogar pedem confirmação; o link aparece uma vez e fechar sem copiar pergunta antes (seção 9). Duas ressalvas vão nas recomendações:
- o resumo antes de gerar o convite deveria mostrar escola, nome e e-mail;
- criar escola não tem revisão, e o slug não se edita até o F16.

Itens que não se aplicam a esta tela: o feed de agentes (não há área de professor) e o seletor de escola (o operador está fora do tenant, por desenho).

Bloqueantes:
1. **Seção 9 (Uso) e seção 10 (E2E): o Uso não tem desenho para 360 px e a prova do RF5 não está no teste.**
   - O que está errado: só Escolas vira cartões abaixo de 640 px. O Uso ("dia fechado e mês lado a lado", três métricas cada) não tem layout de celular. A linha E2E não passa pela tela de Uso nem confere a rolagem horizontal. É a regra 50, item 2a, sem teste que a prove.
   - Correção exigida:
     - A seção 9 define o Uso abaixo de 640 px: cartão por escola, com dia e mês empilhados, ou tabela que rola dentro do próprio contêiner.
     - A seção 10 inclui, nos projetos `chromebook` e `celular`, a visita a Escolas e a Uso com 30 escolas, a troca de página e de ordem, e a verificação de que `scrollWidth <= clientWidth` do documento a 360 px.
2. **Seção 9 (Uso) e seção 4 (`dia` e `mes` de referência): o formato local não está definido.**
   - O que está errado: a tela mostra requisições, jobs, bytes de storage e as datas de referência, e a spec não diz como. O caminho natural é ISO `2026-09-23` e bytes crus (`1234567890`), o que viola a regra 50, item 12, e `docs/interface.md` 6.
   - Correção exigida: a seção 9 fixa:
     - número com `Intl.NumberFormat('pt-BR')`;
     - bytes em unidade legível e em português ("1,2 GB");
     - dia como "23/09/2026";
     - mês com nome e com o que ele cobre ("setembro de 2026, até 23/09");
     - rótulos em português no lugar de "jobs" e "bytes" ("tarefas em segundo plano", "armazenamento").

     A seção 10 inclui um teste de unidade dos formatadores.

Recomendações:
- **Seção 9, Nova escola: criar escola sem revisão.** O `slug` é o endereço que aluno e escola vão digitar, e não se edita até o F16.
  - Rotule o campo como "Endereço da escola", com prévia do endereço completo e a regra de formato visível.
  - Antes de criar, mostre um passo de revisão (rede, nome, endereço), com o aviso de que o endereço não muda depois.
- **Seção 9, Convite:**
  - O "o que vai acontecer" deveria listar escola, nome e e-mail, além de "vale 72 h, o link aparece uma vez".
  - A confirmação de Refazer deveria dizer que o link anterior para de funcionar.
- **Seção 9, Copiar:** fora de `localhost` e sem HTTPS (a borda pública do MVP local, seção 13), `navigator.clipboard` não existe.
  - Defina um reserva: selecionar o campo e dizer "Selecione e copie o link".
  - Mostre "Link copiado" num `aria-live`.
  - Só libere o fechar sem pergunta depois de uma cópia confirmada.
- **Seção 9, token "só no estado do diálogo":** o resultado do `useMutation` fica no `MutationCache` até o `gcTime`. Declare `reset()` ao fechar e `gcTime: 0`, para o token não sobreviver ao diálogo.
- **Seção 5, gerar com a resposta perdida na rede:** o novo `gerar` dá `CONFLITO`, e o texto geral ("Isso já existe...") não diz o caminho. Use um texto próprio: "O convite já foi gerado. Use Refazer para ter um link novo". Do mesmo modo, o `CONFLITO` de slug deveria aparecer no campo ("Esse endereço já é de outra escola. Escolha outro").
- **Seção 5, estados:** "usado, falta entrar" cai em `pendente`, com o mesmo texto do convite não aberto. Considere um rótulo próprio, "convite aceito, falta a primeira entrada", para o operador não refazer um convite que já foi aceito.
- **Seção 9, quatro estados:**
  - Vazio do Uso: "Nenhuma escola ainda", com link para Escolas.
  - Nova escola sem rede: "Crie a rede primeiro", com o botão.
  - Mantenha os dados da página anterior durante a troca de página ou de ordem (`placeholderData`), para a tela não piscar no Chromebook.
- **Seção 10:** registre uma rodada com throttling de CPU e de rede (regra 50, item 1), mesmo sendo tela interna.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/interface.md` (seções 5a e 6)
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 12:35:25 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

Esta é uma revisão do desenho. Ainda não existe código desta funcionalidade, então as referências abaixo apontam seções da Tech Spec (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`). Conferi o desenho contra o PRD (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`), o `docs/lgpd.md` e o código do F1 que ele reaproveita (`apps/api/src/sessao/convite.service.ts`, `convite.repository.ts`, `resolucao-de-tenant.repository.ts`, `ops/escola.ts`, `packages/nucleo/src/db/schema/convite.ts`).

**Checklist de coleta**
- **Campos novos no `docs/lgpd.md`: garantido (§7).** Não há campo novo. O painel toca só o nome e o e-mail da coordenadora (`docs/lgpd.md`, linhas 59, 64 e 72) e o apelido do operador na auditoria (linha 75). Tudo isso já está na tabela, com finalidade e retenção.
- **Nenhum campo proibido para aluno: não se aplica.** O painel não coleta nada de aluno. Só conta alunos.
- **Adaptação em vez de diagnóstico: não se aplica.**

**Checklist de exposição**
- **DTO de saída explícito: garantido (§4 e §7, "DTO de saída").** A lista traz id, nome, slug, rede, estado, conviteId e contagens. O uso traz só números. Os contratos são estritos (`z.strictObject`).
- **Autorização por objeto: garantida (§4, §5, §6).** Todas as rotas passam pela guarda `@RotaDeOperacao`. Uma sessão de escola recebe o mesmo 404 de rota inexistente nas oito rotas, e isso é testado. O convite é escrito no contexto da escola dona dele, que vem de `escolaDoConviteParaOperador` e nunca do corpo. O único convite que existe é o de coordenador (check `convite_tipo_valido`).
- **"Não encontrado" e "sem permissão" iguais: garantido (§6, teste de isolamento; §7c).** Revogar um convite já revogado também devolve `NAO_ENCONTRADO`.
- **Bucket e URL assinada: não se aplica.** Não há arquivo.
- **Convite com expiração, uso único e revogação: garantido (§5 e §7c).** Vale 72 h, é de uso único pelo `update` condicional do F1, e o banco guarda só o hash. Refazer invalida o anterior. A trava por escola e o índice `convite_pendente_unico` deixam no máximo um convite em aberto. O token vai no fragmento `#` do link, que não chega ao servidor, e a rota é `no-store`. O link aceito nunca troca a senha de uma conta que já existe (`convite.service.ts`), então um convite refeito não vira caminho para o operador tomar uma conta.
- **Exportação auditada: não se aplica.**
- **Erro sem stack e sem dado: garantido (§5, "Falhas"; §6, sentinela).** O filtro global de erro já existe. O teste sentinela cobre também as respostas de erro das oito rotas.

**Checklist de log e rastro**
- **Log sem dado pessoal: garantido (§7, "Log", e §10, integração).** Os eventos levam só ids e nunca nome, e-mail, slug ou token. Existe teste que prova isso.
- **Auditoria onde a regra exige: garantida (§5, "Autor"; §7, "Auditoria").** Rede criada, escola criada e convite criado, refeito e revogado ficam registrados. O autor é conferido dentro da transação, e o `autor` do corpo é recusado com 400. O evento novo `convite.refeito` não leva nome nem e-mail (§3). A leitura das contagens não pede auditoria, porque é agregado e não é dado de aluno (§7, "Leitura"). Concordo.

**Checklist de IA: não se aplica (§7b).** Não há IA nem envio externo.

**Checklist de ciclo de vida**
- **Exclusão e retenção: garantidas pelo que já existe.** O `sistema.expurgar-acesso` apaga o convite em 30 dias e limpa a conta cujo convite foi revogado (`docs/lgpd.md`, linhas 64 e 72). Os convites que o refazer acumula caem no mesmo expurgo.
- **Seed e fixture: garantido (PRD §6; §6 e §10 da Tech Spec).** Os dados são sintéticos e sentinelas.

**Pergunta de fechamento:** o painel não guarda nem envia nada sobre aluno. O que ele cria (convite, auditoria) já é consultável e está no mapa de dados. Responde.

```
VEREDITO: APROVADO
Campos pessoais tocados: nome e e-mail da primeira coordenadora (entrada do gerar); apelido do operador na auditoria da escola
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (guarda de operador; escola do convite lida no servidor; 404 igual para sessão de escola nas oito rotas, com teste)
Logs: limpos (§7: só operadorId, escolaId, conviteId; teste de integração prova a ausência de nome, e-mail, slug e token)
Auditoria: presente (rede.criada, escola.criada, convite.criado, convite.refeito, convite.revogado, com o autor conferido na transação); leitura de contagem sem auditoria, correto por ser agregado
Envio externo: nenhum
Seed/fixture: sintético (sentinelas de nome, e-mail, matrícula e turma)
Bloqueantes: nenhum
Recomendações:
1. §5, "refazer": escrever que o servidor recusa o refazer com CONFLITO quando o estado é `ativa`, e que só vale convite `tipo = 'coordenador'`. Hoje só a tela limita o refazer a pendente e vencido (§9). Não vaza (o link não troca a senha de conta existente), mas deixa convite em aberto para usuário já ativo, e a A1 pode abrir outro tipo de convite na mesma tabela. Um teste de integração deve cobrir.
2. §9, "Convite": dizer como o token não fica no cache de mutation do TanStack Query (gcTime 0 ou limpar ao fechar o diálogo), e usar `autocomplete="off"` nos campos de nome e e-mail. O e2e "recarregar não mostra o link" não pega o que fica em memória.
3. §5, "revogar e gerar" para corrigir e-mail: o `usuario` com o nome da pessoa digitada errado fica inativo na escola, com a retenção de coordenador (vigência + 5 anos), embora o e-mail saia pelo expurgo. Vale registrar no `/retro` para decidir se o usuário nunca ativado sai junto com o convite revogado.
4. PRD RF1 e RF3 dizem "endereço" e a Tech Spec diz `slug`. Alinhar o termo para ninguém ler como endereço postal.
```

## test-engineer · 1ª rodada · REPROVADO · 2026-09-24 12:35:28 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

Arquivos lidos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md` e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`. Também conferi `apps/api/src/sessao/convite.repository.ts`, `resolucao-de-tenant.repository.ts` e `ops/escola.ts` para ver o que já existe.

**O que verificar, item a item**

| Item | Situação na Tech Spec |
|---|---|
| 1. O teste falharia sem a regra? | Garante para as travas, porque a 7c prevê mutação sem trava. Garante para a sentinela e para o teste de arquitetura. Não garante para as contagens decididas nem para o uso (bloqueantes 2 e 3) |
| 2. O teste verifica o resultado? | Garante na 7c: "uma linha, uma auditoria, o mesmo id", "no máximo um convite em aberto" |
| 3. Casos de borda do PRD | Parcial: alguns ficam sem teste (bloqueantes 1, 2, 3 e 6) |
| 4. `.skip` ou mock que esconde a regra | Não se aplica ainda. O plano usa Postgres real (§10, Integração) |
| 5. IA com adaptador falso | Não se aplica (§7b) |
| 6. Concorrência em paralelo de verdade | Garante para o convite e para o autor (§7c, `Promise.all`). Parcial para rede e escola (bloqueante 5) |
| Permissão | Garante: sessão de escola recebe 404 nas oito rotas (§6), e operador desativado recebe 401 (§7c) |
| Isolamento | Garante: sentinela nas oito rotas, inclusive nas de erro, e duas escolas com contagens diferentes (§6) |

**Cenários exigidos**
- **RF1:** cria rede e escola. Mais três casos: endereço repetido dá `CONFLITO`; dois POST iguais em paralelo deixam uma linha e uma auditoria; mesmo id com dados diferentes dá `CONFLITO`.
- **RF2:** o link aparece uma vez; o banco guarda só o hash; dois gerar em paralelo, gerar e refazer em paralelo, dois refazer, refazer e revogar deixam no máximo um convite em aberto.
- **Estado do convite:** matriz de estado contra ação, com a borda das 72 h, o convite vencido e a coordenadora desativada.
- **RF3:** contagens com estas bordas: duas disciplinas, aluno transferido ou desativado, ano anterior, sem ano em curso, reivindicação pendente, vínculo de professor não confirmado.
- **RF4:** o uso de cada escola separado; o mês soma e pega o pico de bytes; o dia de hoje fica de fora.
- **RF5:** 30 escolas paginadas nas duas ordens; nada de rolagem horizontal a 360 px.
- **RF6:** auditoria com o operador da sessão, mesmo que o corpo mande outro autor.
- **RF7:** teste de arquitetura.
- **Permissão, isolamento e sentinela.**
- **E2E:** "o convite mudou" e fechar o diálogo sem copiar.

**Cobertos**
- **RF1:** o clique duplo, pelas linhas da §7c com `Promise.all`.
- **RF2:** os paralelos do convite, com mutação sem a trava. Recarregar não mostra o link (E2E).
- **Estado:** `estadoDaCoordenacao` nos seis casos, com a borda das 72 h (unidade).
- **RF3:** contagens com duas disciplinas, aluno desativado, vínculo encerrado, ano anterior, sem ano em curso e sem uso.
- **RF5:** 30 escolas paginadas nas duas ordens.
- **RF6:** auditoria com o apelido da sessão; campo `autor` recusado no contrato.
- **RF7:** teste de arquitetura com as três `@SemEscopo`.
- **Permissão, isolamento e sentinela:** §6.
- **Carga:** 429 no `POST /escolas`.
- **Log e comportamento novo:** log sem nome, e-mail, slug nem token; `ops:convite-coordenador` com convite em aberto.
- **E2E:** nos projetos `chromebook` e `celular`, com axe.

**Bloqueantes**

1. **§5 "Convite da coordenação" e §9 "Escolas": o estado pode ficar sem ação possível, e isso não tem teste.**
   - `usado → pendente` vale mesmo quando a coordenadora foi desativada depois de ativa. O `convite.repository.ts:25-27` já trata "coordenador desativado que a escola chama de volta".
   - Nesse caso o gerar dá `CONFLITO`, porque só aceita `sem_convite` e `revogado`. O refazer, oferecido para `pendente`, falha no `update` condicional, porque o convite já foi usado. O operador não consegue fazer nada.
   - Também não está dito se o `update` condicional do refazer aceita convite vencido. A tela oferece refazer em `vencido`.
   - **Correção:** definir o comportamento da coordenadora desativada e de `usado` sem coordenadora ativa. Incluir na §10 um teste de integração em matriz: os seis estados contra gerar, refazer e revogar, com o resultado de cada um. A matriz precisa incluir "refazer de convite vencido gera um novo e o vencido deixa de valer".

2. **§10: o RF4 fica sem prova.** A Integração não traz nada de uso além de "sem uso". Faltam:
   - duas escolas com uso sintético, cada uma com o seu;
   - o mês somando requisições e jobs e pegando o pico de bytes, não a soma;
   - a linha de hoje presente e fora da resposta, o caso "escola criada às 22h";
   - no dia 1, o mês de referência ser o anterior, na virada de mês e de ano.

   Sem esses testes, trocar `max` por `sum` nos bytes ou incluir o dia de hoje não quebra nada.

3. **§5 "Leitura" e §10: duas regras decididas ficam sem teste.**
   - "Reivindicação pendente não conta" é a Decisão da pergunta 1 do PRD, e a A1 vai herdá-la.
   - Professor precisa de vínculo `confirmado`.

   Tirar qualquer um dos dois filtros não quebra nenhum teste listado. **Correção:** colocar os dois casos entre as bordas de contagem. Nomear também o aluno transferido (vínculo encerrado no meio do ano), que é o caso do PRD §7.

4. **§7 "Token" e §10: falta prova do "banco guarda só o hash" no caminho novo.** O refazer cria convite por código novo. O teste de log não cobre a linha gravada. **Correção:** depois de gerar e de refazer, conferir que o token devolvido não aparece em nenhuma coluna de `convite` nem na `auditoria` (`depois` de `convite.refeito`), e que o `tokenHash` é o hash dele.

5. **§7c "Rede ou escola repetida": a tabela só prevê "dois POST iguais".** Faltam dois cenários:
   - O mesmo id com dados diferentes deve dar `CONFLITO`. Está escrito na coluna, mas a §10 não o testa.
   - Dois POST em paralelo com ids diferentes e o mesmo slug: com `on conflict (id) do nothing`, o conflito de slug ainda chega como 23505. O perdedor precisa receber `CONFLITO`, não 500, e só uma auditoria pode ser gravada.

   **Correção:** as duas linhas na 7c e na §10.

6. **§10 E2E: faltam dois casos de borda do PRD §7.**
   - "O outro vê 'o convite mudou' e a tela atualiza": o `CONFLITO` no refazer tem que mostrar o texto e recarregar a lista.
   - "Fechar antes de copiar pergunta antes; se fechar, refaz, e o anterior deixa de valer."

   Nenhum dos dois está no E2E listado. **Correção:** incluir os dois no E2E. O segundo precisa conferir que o link anterior deixou de abrir.

**Recomendações**
- **Convite de outro tipo.** O `escolaDoConviteParaOperador` (`resolucao-de-tenant.repository.ts:462`) não filtra por tipo. Hoje o check `convite_tipo_valido` só aceita `coordenador`. Quando a A1 trouxer outro tipo, o refazer do painel devolveria ao operador o token de um convite de professor. Vale declarar agora na §5 que refazer e revogar só alcançam convite de coordenação, e deixar o teste marcado para a A1.
[… 8 linhas cortadas]

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-24 12:39:21 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

As duas correções da rodada 1 foram feitas. Não encontrei bloqueante novo no diff nem no que ele afeta.

**Correção 1 (Uso a 360 px e RF5 sem prova): feita.**
- Na seção 9, Escolas e Uso viram um cartão por escola abaixo de 640 px. No Uso, dia e mês ficam empilhados.
- O W6 prova a exigência como foi pedida: 30 escolas, troca de página e de ordem, projetos `chromebook` e `celular`, e `scrollWidth <= clientWidth` a 360 px nas duas telas.
- O L3 cobre o lado do servidor: nenhuma escola repete nem some entre páginas, o desempate por `id` se mantém na ordem `uso` com várias escolas em zero, e o `total` sai certo.

**Correção 2 (formato local sem definição nem teste): feita.**
- Na seção 9, o item "Formato" aponta para o W5.
- O W5 é um teste de unidade com os textos exatos: `Intl.NumberFormat('pt-BR')`, "1,2 GB", "23/09/2026", "setembro de 2026, até 23/09" e os rótulos "requisições", "tarefas em segundo plano" e "armazenamento". Assim "jobs" não chega ao usuário.

**As recomendações da rodada 1 também entraram:**
- revisão do endereço, com prévia `/e/<slug>`, e resumo do convite antes de enviar (seção 9, W1);
- Copiar sem `navigator.clipboard` e "Link copiado" anunciado em `aria-live` (W9);
- o token só no diálogo, com `gcTime: 0` e `reset()` (seção 9, W4);
- `CONFLITO` com texto próprio por ação (W2);
- vazios com a ação seguinte, e "crie a rede primeiro" no diálogo Nova escola (W7);
- `placeholderData` na troca de página;
- teclado, foco preso no diálogo e devolvido ao botão, e Esc (W8).

Estados: ok. Os quatro estados de Escolas e Uso estão no W7, com axe nos dois projetos, e o vazio convida à ação seguinte.

Acessibilidade: teclado e foco nos diálogos (W8), `aria-live` na cópia (W9), estado escrito em texto com a cor só de reforço (seção 9), e axe em todos os estados (W7).

Chromebook fraco: a tela é leve e de uso raro. A lista é paginada de 25 em 25, sem virtualização, o que basta. O chunk tem teto de 60 kB brotli (B1), e não há upload de imagem.

Celular: cartão abaixo de 640 px nas duas telas e o W6 a 360 px, nos dois projetos. Nenhum fluxo exige o celular.

Ação oficial protegida: sim, no que se aplica. Não há nota nesta tela. As ações de peso passam por revisão antes:
- criar escola revisa o endereço antes, porque ele não muda depois;
- o convite mostra antes escola, nome, e-mail, validade e "o link aparece uma vez";
- refazer e revogar pedem confirmação;
- fechar sem copiar pergunta antes.

Bloqueantes: nenhum.

Recomendações:
1. **Seção 9 promete mais texto do que o grupo W tem.** A seção diz que "o texto exato de cada estado e de cada mensagem" está no grupo W, mas lá só há o 503 ("Tentar de novo"), "crie a rede primeiro", "o convite mudou" e "Link copiado". Faltam:
   - o texto dos dois vazios;
   - o `CONFLITO` do revogar e o `NAO_ENCONTRADO` de revogar o que já foi revogado;
   - o 429 do `rl:op` (dizer quando tentar de novo, a partir do `Retry-After`);
   - o 401 `SESSAO_ENCERRADA` no meio de um diálogo (dizer que é preciso entrar de novo, sem perder o que foi digitado, se der).

   Vale fechar esses textos no W7 ou no W2, para a tarefa não inventar "Erro 409".
2. **O W6 pode passar com nomes curtos.** Semeie ao menos uma escola e uma rede com nome longo e um slug no limite. Confira também a prévia `/e/<slug>` no diálogo a 360 px, que hoje fica fora do W6.
3. **Alvo de 44 px sem teste.** A seção 9 diz "44 px", mas nenhum cenário mede. Uma asserção no W6 sobre o tamanho dos botões de ação do cartão (convidar, refazer, revogar) fecha isso.
4. **Tabela da seção 10 partida.** A linha "Isolamento | seção 6" ficou depois do parágrafo que aponta o `cenarios.md`, então sai do markdown como texto solto. Ela deve voltar para dentro da tabela, antes do parágrafo.
5. **Estados `aceito` e `sem_coordenacao` sem texto de tela.** O W1 cobre só o caminho até `ativa`. Vale dizer no grupo W o texto de cada um, em português comum (por exemplo, "Convite aceito, falta o primeiro acesso"), e que ação a linha oferece. Não pode vazar o identificador do estado.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md (seções 9 e 10)
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md (grupos L e W)
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md (RF5, RF8)

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-24 12:39:34 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. A migration só cria o índice `convite_pendente_unico` sobre `convite`, que já tem `escolaId`. `rede`, `escola` e as tabelas da operação continuam nas exceções já registradas. Os ids de rede e escola são UUID sorteados pelo cliente, e a seção 5 agora diz v4 ou v7, conferido no contrato.

Queries verificadas:
- `PainelRepository.redes`, `escolas` e `uso`: todas as subconsultas correlacionam por `escola_id`, contam só o ano `em_curso` e devolvem só número, id, nome e slug.
- `RedeEEscolaRepository.criarRede`, `criarEscola` e `pedidoRepetido`.
- `ResolucaoDeTenantRepository.contaParaConvite` e `escolaDoConviteParaOperador`, esta com o filtro `tipo = 'coordenador'`.
- Gerar, refazer e revogar: o contexto da escola é aberto antes, a trava é pega por escola e a matriz estado × ação é decidida no servidor (seções 5 e 7c).
- O `:id` da rota só é aceito em rota `@RotaDeOperacao`. Nenhuma rota de escola recebe `escolaId` do cliente.

Teste de isolamento: presente e efetivo.
- **I4 e I5:** sem a correlação por `escola_id`, nas contagens e no uso (em `/uso` e em `ordem=uso`), os dois quebram.
- **I6:** o sentinela cobre as respostas de erro.
- **I1 a I3:** os testes de arquitetura limitam quem importa o repository e quais métodos levam `@SemEscopo`.

Correções exigidas na rodada 1:
1. **Feita.**
   - A seção 5 filtra por tipo, e o outro tipo responde `NAO_ENCONTRADO`, igual ao inexistente.
   - Pela matriz, refazer só age em `pendente` e `vencido`, e escola `ativa` dá `CONFLITO` nas três ações.
   - E6 e I7 provam que nada é gravado.
   - Adiar para a A1 o teste de "outro tipo" basta. O check `convite_tipo_valido` torna esse estado impossível de gravar, então hoje quem garante é o próprio banco, e o filtro só passa a ter efeito quando a A1 afrouxar o check.
2. **Feita.** I5 cobre o uso por escola, e L2 cobre o cálculo.

Bloqueantes: nenhum.

Recomendações:
- **I7:** acrescentar um teste de alarme. Inserir um convite com `tipo = 'professor'` deve falhar com 23514. Quando a A1 afrouxar o check, esse teste quebra e obriga a escrever o teste de "outro tipo responde `NAO_ENCONTRADO`". Registrar o pendente também em `achados/indice.md` ou no `TODO.md`, não só no `cenarios.md` da A0b, que a A1 pode não abrir.
- **Seção 11, linha "10, item 9 (contagem)":**
  - A leitura da regra está invertida. A regra diz que a *terceira* marcação no mesmo módulo já indica um problema de desenho. Não existe "teto de três respeitado".
  - `ops/escola.repository.ts` chega a três só por causa de `pedidoRepetido`. Juntar a leitura do pedido repetido dentro de `criarRede` e `criarEscola` (`on conflict … do nothing`, depois `select` pelo id na mesma chamada) volta o arquivo a duas.
  - A linha também não fala do módulo `sessao`. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts` já tem 27 `@SemEscopo`. A A0b não cria nenhum novo ali, só amplia as justificativas de dois, mas isso deveria estar escrito na seção 11. E vale registrar para o `/retro` que esse repository já passou há muito do sinal da regra.
- **Matriz da seção 5:** revogar em `revogado` responde `NAO_ENCONTRADO`, enquanto `sem_convite` e `sem_coordenacao` respondem `CONFLITO`. Não vaza nada entre escolas, porque é rota de operador, mas uma frase na seção dizendo o motivo evita que alguém "corrija" isso depois.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md`

## test-engineer · 2ª rodada · REPROVADO · 2026-09-24 12:39:59 · `tasks/prd-apresentacao-painel/revisao-spec.md`

**VEREDITO: REPROVADO**

Cinco das seis correções da rodada 1 foram feitas. A primeira (estado sem ação e matriz) também foi feita, mas trouxe uma regra nova sem teste de concorrência. Por isso há um bloqueante.

**Cenários exigidos:**
- **Caminho feliz:** criar rede e escola, gerar e copiar o convite, a coordenadora ativa a conta e a escola aparece `ativa` com as contagens.
- **Bordas:** convite vencido e refeito; fechar sem copiar; professor com duas disciplinas na mesma turma; professor não confirmado; aluno transferido ou desativado; virada de ano; escola sem uso; dia 1 e 1º de janeiro; mesmo e-mail em duas escolas; escola criada às 22h.
- **Permissão:** sessão de escola nas oito rotas; `autor` enviado pelo corpo; operador desativado.
- **Isolamento:** contagens e uso em duas escolas; sentinela.
- **Concorrência:** POSTs iguais; slug repetido; gerar, refazer e revogar em paralelo; o aceite anterior contra o gerar.

**Cobertos (conferência das seis correções da rodada 1):**
1. **Estado sem ação e matriz:** feito. Os estados `aceito` e `sem_coordenacao` e a matriz entraram na seção 5. A E6 percorre os sete estados, inclui o refazer de vencido, e a A4 testa a função pura na borda das 72 h. A regra nova que a matriz criou é o bloqueante abaixo.
2. **RF4:** feito. I5 cobre duas escolas na rota `/uso` e na ordem `uso`. L2 cobre o mês que soma e pega o pico, a linha de hoje fora, o dia 1, o 1º de janeiro e a escola sem uso.
3. **Contagens:** feito. L1 cobre vínculo `pendente` ou `contestado`, aluno transferido e professor em duas escolas. Aceito o recorte da reivindicação pendente: ela não existe no F1, a decisão está na seção 5 e o teste possível hoje é o do usuário ativo com vínculo.
4. **Token:** feito. A2 confere que o token não fica em nenhuma coluna de `convite` nem em `auditoria`, e que `token_hash` é o SHA-256 dele.
5. **Mesmo id e mesmo slug:** feito. E3 cobre o mesmo id com outros dados. E4 cobre ids diferentes com o mesmo slug em paralelo, com `CONFLITO` (nunca 500) e uma só auditoria. A 7c mapeia o erro 23505.
6. **E2E:** feito. W2 cobre "o convite mudou" com a lista recarregada. W3 cobre fechar sem copiar e o link anterior abrindo a tela de convite inválido.

Também conferi E8 e E9: o par "dois gerar com e-mails diferentes" falha sem a trava, porque o índice é por usuário. A E9 isola o índice como rede de segurança. As concorrências usam `Promise.all` e Postgres real.

**Bloqueantes:**

1. **O aceite anterior não tem mecanismo definido nem teste de concorrência** (Tech Spec seção 5, linha `aceito` da matriz; seção 7c, tabela de travas; cenário E6).
   - **O que está errado:** a matriz promete que gerar em `aceito` faz o aceite anterior deixar de ativar. O que ativa esse aceite é a primeira entrada da coordenadora, e esse caminho não aparece na tabela de travas da 7c. Nada diz que ele pega a trava da escola ou relê o estado.
   - **Consequência:** a coordenadora antiga pode entrar no mesmo segundo em que o operador gera o convite novo. Aí a escola pode acabar com a antiga ativa e um convite em aberto para outra pessoa. Seriam duas coordenadoras, uma delas com um convite que ninguém mais esperava.
   - **Correção exigida na Tech Spec:**
     - dizer como o aceite deixa de ativar (por exemplo, a entrada relê o último convite sob a mesma trava);
     - pôr o par "primeira entrada e gerar" na tabela de travas da 7c.
   - **Correção exigida nos cenários:**
     - (a) primeira entrada da coordenadora antiga em paralelo com o gerar em `aceito`: no fim, ou ela está ativa e o gerar recebeu `CONFLITO`, ou o convite novo está em aberto e ela não ativa;
     - (b) revogar em `aceito` e depois tentar a primeira entrada: não ativa. Hoje a E6 só afirma esse efeito para o gerar;
     - (c) gerar em `aceito` com o mesmo e-mail do aceite anterior: definir se é o mesmo usuário e provar que o convite novo ativa e o aceite antigo não. Hoje não está definido, e "deixa de ativar" pode acabar desativando o próprio convite novo.

**Recomendações:**
- **Relógio da L2.** O cenário "escola criada às 22h" do PRD é a borda de fuso: 22h em Brasília já é o dia seguinte em UTC. Rodar a L2 com o relógio injetado entre 22h e 23h59 de Brasília, e dizer na seção 5 em que fuso fecha o "último dia".
- **Clique duplo no gerar com o mesmo e-mail.** Entra na E8: um cria e o outro recebe `CONFLITO`, com uma só conta e um só usuário.
- **E8, par "gerar e refazer".** Não há estado em que os dois sejam válidos, então esse par não prova a trava. Trocar por "gerar e revogar" em `aceito`, ou tirar.
- **L1.** Acrescentar professor com vínculo confirmado mas usuário desativado.
- **Estado `sem_coordenacao`.** Gerar para o mesmo e-mail da coordenadora desativada: definir se reativa o usuário ou cria outro, e testar.
- **Seção 10.** A linha `| Isolamento | seção 6 |` ficou solta depois do parágrafo e não faz mais parte da tabela.
- **I7.** Está bem que o teste de "outro tipo responde `NAO_ENCONTRADO`" fique para a A1. Vale registrá-lo em `achados/` também, para não depender só de alguém ler o cenarios.md.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/prd.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md

## test-engineer · 3ª rodada · REPROVADO · 2026-09-24 12:43:22 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

A correção da rodada 2 foi feita no desenho, mas o cenário que deveria provar a trava nova da ativação não falharia se a trava fosse removida. Há também um cenário que contradiz a própria spec.

**Cenários exigidos:**
- (a) corrida entre a primeira entrada da coordenadora antiga e o gerar, em `aceito`, com a ativação passando pela trava da escola
- (b) revogar em `aceito` e depois a primeira entrada
- (c) gerar em `aceito` com o mesmo e-mail
- o par "ativação × gerar" na 7c
- as recomendações da rodada 2: L2 entre 22h e 23h59, clique duplo no gerar com o mesmo e-mail, L1 com usuário desativado, `sem_coordenacao` com o mesmo e-mail, tabela da seção 10

**Cobertos:**
- **Seção 5, último parágrafo antes de "Leitura":** diz o mecanismo. O gerar revoga o último convite na mesma transação, e a ativação pega a trava da escola antes do `update`.
- **7c, linha "Ativação por convite":** traz o par.
- **(b):** E6 ("revogar em `aceito` e depois a primeira entrada: não ativa"), e em paralelo na E8.
- **(c):** E6, que exige usuário reusado e só o convite novo ativando.
- **`sem_coordenacao` com o mesmo e-mail:** E6.
- **Clique duplo com o mesmo e-mail:** E8.
- **Recomendações da rodada 2:** L1 com professor confirmado de usuário desativado, L2 com o relógio de São Paulo, alarme da I7, tabela da seção 10 consertada, W6, W7 e W10.
- **(a):** a E15 existe e cobre os dois caminhos de ativação (login com o bilhete e aceite com senha). O problema está no bloqueante 1.

**Bloqueantes:**

1. **A E15 passa mesmo sem a trava na ativação** (`tasks/prd-apresentacao-painel/cenarios.md:61-64`).
   - **O que está errado:** "com a trava segurada nas duas ordens" dá para ler como o teste segurando o `pg_advisory_xact_lock` da escola por fora e depois soltando. Nesse arranjo, uma ativação sem trava termina de uma vez enquanto o gerar espera. Quando o gerar entra, lê `ativa` e responde `CONFLITO`, que é um resultado permitido, e o teste fica verde.
   - **Onde a corrida acontece de verdade:** o gerar já leu o estado e revogou o convite, mas ainda não fez o commit. A ativação faz o `update` nesse intervalo e, em read committed, ainda enxerga o convite como não revogado. O resultado são as duas coisas: ela ativa e há um convite novo em aberto.
   - **Correção exigida:** escrever na E15 a asserção que quebra sem a regra, nos dois caminhos de ativação:
     - com a trava da escola segurada pelo teste, a ativação fica esperando (`wait_event_type = 'Lock'`, `wait_event = 'advisory'` em `pg_stat_activity`, ou uma corrida contra um prazo curto) e só termina depois de soltar;
     - na ordem "gerar primeiro", o gerar é parado dentro da transação depois de revogar e antes do commit (a trava segurada é a dele), a ativação é disparada nesse ponto, e o teste confere que no fim ela não ativou.
   - Dizer também como a outra ordem é forçada: a ativação já esperando na fila da trava antes de o gerar ser disparado.

2. **A I2 exige um método que a spec removeu** (`tasks/prd-apresentacao-painel/cenarios.md:12-13`).
   - **O que está errado:** a I2 manda pôr `pedidoRepetido` na lista dos `@SemEscopo` do `RedeEEscolaRepository`. Três lugares dizem o contrário:
     - a 7c (`techspec.md:148`) lê pelo id dentro da mesma chamada;
     - a seção 6 (`techspec.md:114`) lista só `criarRede` e `criarEscola`;
     - a seção 11 (`techspec.md:186`) diz que o `ops` fica com dois `@SemEscopo`.
   - A lista de cenários é fechada, então quem implementar vai criar o método (e o `ops` volta a três) ou vai ter um teste vermelho.
   - **Correção exigida:** tirar `pedidoRepetido` da I2 e afirmar o contrário. O teste de arquitetura confere que os `@SemEscopo` do `RedeEEscolaRepository` são exatamente `criarRede` e `criarEscola`.

**Recomendações:**
- **7c (`techspec.md:149`):** a coluna "Cenário paralelo" da linha "Convite da escola" ainda diz "gerar e refazer". A E8 trocou esse par por "gerar e revogar em `aceito`"; alinhar a 7c.
- **7c (`techspec.md:150`):** "Quem perde recebe: não ativa" não diz o que a coordenadora vê. Dizer o código do login com bilhete e do aceite quando o convite foi revogado no meio (o mesmo de convite inválido, para não confirmar nada), e cobrir isso na E15.
- **E15:** acrescentar a variante com o mesmo e-mail. O gerar reusa o usuário e cria o convite novo em paralelo com a ativação pelo convite antigo. No fim, ou ela está ativa e o gerar recebeu `CONFLITO`, ou só o convite novo ativa.
- **E11:** usa o mesmo "com a trava segurada no teste". Vale deixar escrito que a escrita fica esperando o `for share` do operador enquanto o `desativar` segura a linha, pelo mesmo motivo do bloqueante 1.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md

## infra-guardian · 2ª rodada · APROVADO · 2026-09-24 12:43:38 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

Caminho quente tocado: login. Só o ramo de ativação por convite: o aceite anônimo e o login com o bilhete. O login de todo dia e o login por matrícula não passam pela trava.

Rate limit: ok. As oito rotas contam em `rl:op:{sub}` (7c). A rota de convite e o login continuam com os limites por conta que já existiam no F1.

Fila e prioridade: ok. Não se aplica: nenhuma rota do painel faz trabalho demorado.

Concorrência: protegida.

Índice e paginação: ok.

Degradação de IA: não se aplica.

Migration: compatível. É só o índice único parcial em `convite`, tabela pequena na A0b.

Métrica e alerta: ok. Não há caminho quente novo nem alerta novo.

**A trava no login é segura.** O que conferi em `apps/api/src/sessao/convite.service.ts` e `resolucao-de-tenant.repository.ts`:
- **Volume:** a trava só é pedida quando existe um usuário esperando ativação por aquele convite. Isso acontece uma vez na vida de cada convidado, e nunca com aluno (`pendenteDoConvite` descarta aluno). Sessenta turmas às 7h30 não passam por ela.
- **Espera:** a chave é por escola, então uma escola não trava outra. A transação do outro lado (conta, usuário, revogação, convite, auditoria) é curta e não chama nada externo. A espera do `pg_advisory_xact_lock` entra no `statement_timeout` do pool, então no pior caso vira erro mapeado e não fica pendurada.
- **Com a trava segurada:** a ativação espera e depois relê o convite no `update`, que exige convite não revogado. Se o gerar venceu, `ativarPorConvite` devolve falso e nada é gravado. Não há 500 nem ativação dupla.
- **Chave:** a forma de dois argumentos (int4, int4) fica num espaço separado das chaves 7_000_001 e 7_000_002, que usam um argumento só. Não colidem.

Bloqueantes: nenhum.

Recomendações:
- **Seção 5 e 7c: dizer que a trava é a primeira instrução da transação de ativação.** No aceite, ela precisa vir antes de `usarConvitePorHash`, não só antes de `ativarPorConvite`. Se entrar depois, o aceite segura a linha do convite enquanto espera a trava, e o refazer ou revogar segura a trava enquanto espera a linha. O resultado é um deadlock (40P01), que o Postgres resolve abortando um lado, com risco de o cliente ver 500. A frase "antes do `update`" deixa as duas leituras possíveis.
- **E15: o ramo "na conta nova, o aceite que define a senha" não chega ao estado `aceito`.** Conta sem senha ativa o usuário na mesma transação do aceite. Esse ramo precisa ser o aceite em `pendente` em paralelo com refazer e com revogar, nas duas ordens. É esse o teste que pega a trava fora de ordem do item acima.
- **E15: incluir o caminho com MFA.** A coordenadora com conta existente tem segundo fator, então quem ativa é o `MfaService`, depois do código, e não o `LoginService`. A trava dentro de `AtivacaoPorConvite.ativar` cobre os dois, mas o cenário deve provar os dois.
- **Seção 5 e E15: dizer o código de quem perde a espera da trava pelo `statement_timeout`.** Esperado: 57014 mapeado para 503 `INDISPONIVEL_TENTE_DE_NOVO`, nunca 500.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts

## test-engineer · 4ª rodada · REPROVADO · 2026-09-24 12:45:48 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** isolamento e arquitetura (I1 a I7); escrita idempotente e em paralelo (E1 a E4, E8, E10); a matriz estado × ação (E6, L4); o autor desativado, nas duas ordens (E11, E13); o teste de mutação do índice (E9); a ativação por convite contra a trava da escola, nos três caminhos, nas duas ordens forçadas e com o tempo esgotado (E15 a–e); contagens com os casos de borda da escola (L1); uso no fuso de São Paulo e na virada de mês e de ano (L2); paginação (L3); auditoria, log e token (A1 a A4); web nos dois projetos (W1 a W10).

**Cobertos:** todos os cenários acima estão listados. As duas correções da rodada 3 foram feitas:
1. **E15(a) quebra se a regra sair.** O teste segura a trava e confirma a espera com `wait_event = 'advisory'`, nos três caminhos. Sem a trava na ativação, o teste falha.
2. **E15(b) prova o caso de verdade.** Hoje `ativarPorConvite` (`apps/api/src/sessao/convite.repository.ts:65-86`) lê o convite por `exists`, sem travar a linha. Com e-mails diferentes, a revogação que ainda não foi confirmada fica invisível e a ativação passaria. Então (b) falha sem a trava, como precisa.
3. **E15(c) e (d)** cobrem a outra ordem e o risco de deadlock no aceite.
4. **I2** agora pede exatamente `criarRede` e `criarEscola`, igual à seção 6.
5. **E11** descreve a espera do `for share` em `pg_stat_activity`.
6. **Seção 7c** aponta a E8 e a E15.

**Bloqueantes:**

1. **O código de erro da E15(e) não é o que o sistema devolve** (`cenarios.md` E15(e); seção 5, fim do parágrafo antes de "Leitura").
   - O cenário exige 503 `INDISPONIVEL_TENTE_DE_NOVO` para a espera cortada pelo `statement_timeout` (57014).
   - Só que o mapeamento global (`packages/nucleo/src/erro/mapear-erro-postgres.ts:10`) transforma 57014 em `TEMPO_ESGOTADO`. Os testes `mapear-erro-postgres.test.ts:27` e `apps/api/test/erro.int.test.ts:191` já fixam esse código.
   - Do jeito que está, o teste só passa se alguém mudar o mapeamento global, e a spec não declara essa mudança.
   - **Correção:** a E15(e) passa a esperar 503 `TEMPO_ESGOTADO` com `Retry-After`, e a seção 5 escreve o código. A outra saída é declarar a troca do mapeamento na seção 5 e no risco da seção 13. A W7 e a W10 também precisam dizer o texto que a tela mostra para `TEMPO_ESGOTADO`.

2. **"Quem perde vê convite inválido" não vale para os dois caminhos de login** (`cenarios.md` E15(b) e o ramo de login da E15(a); seção 5; linha "Ativação por convite" da 7c).
   - Pelo login com o bilhete, quando `ativar` não ativa, ele volta em silêncio (`apps/api/src/sessao/convite.service.ts:123`).
   - Aí o login sem MFA cai em `conferencia.recusar` e grava `gravarFalhaDeLoginPorEmail` (`apps/api/src/sessao/login.service.ts:126-128`). Ou seja, a senha certa conta como tentativa falha para a conta segurada.
   - O login com MFA responde `naoAutenticado` (`apps/api/src/sessao/mfa.service.ts:120`).
   - "Convite inválido" só é verdade no aceite (`convite.service.ts:82`).
   - Para o caminho do login, o cenário exige um resultado que o código não produz, e a spec não diz que o login muda.
   - **Correção:** a spec escolhe uma das duas saídas e a E15(b) confere nos três caminhos:
     - declarar que a ativação perdida no login responde convite inválido, sem gravar falha de login nem somar na conta segurada;
     - ou manter a recusa atual e escrever na E15(b) a resposta exata de cada caminho, com a asserção de que essa perda não conta como senha errada.

**Recomendações:**
- **Como o teste para o gerar no meio (E15(b) e a outra ordem da E11).** O cenário pede o gerar "parado depois de revogar e antes do commit", e a escrita segurando o `for share`, sem dizer como. Vale escrever o mecanismo, para ele não virar gancho no código de produção. Um exemplo: o teste insere um convite na mesma chave do `convite_pendente_unico` sem confirmar, o que só funciona com o mesmo e-mail. Para e-mails diferentes, outro mecanismo, como um gatilho só no banco de teste.
- **E15(c):** antes de soltar a trava, confirmar em `pg_stat_activity` que o gerar também já está esperando. Sem isso, a ordem pode acabar sendo só sequencial.
- **E15(d):** a asserção sobre a trava no aceite é a da (a). A (d) prova só o resultado e a ausência de 40P01; vale dizer isso no cenário.
- **Aceite na E15:** hoje o aceite lança `Error('usuário do convite não ativado')` (`convite.service.ts:77`) quando a ativação falha depois do uso, e isso vira 500. Com a trava como primeira instrução esse caminho não deveria acontecer, mas vale incluir "nunca 500" também no ramo do aceite.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/mapear-erro-postgres.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`

## infra-guardian · 3ª rodada · APROVADO · 2026-09-24 12:47:49 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: login | migration (nenhuma nova nesta rodada)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

**Por que a Decisão da rodada 4 não abre caminho para contornar a proteção de força bruta (regra 80, item 1)**

- **A saída nova só é alcançada depois da senha certa.** No login sem MFA, o fluxo atual (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:117-128`) faz nesta ordem:
  1. reserva a tentativa no contador por e-mail, antes do hash;
  2. confere a senha;
  3. só com `confere` verdadeiro, chama `pendentePeloBilhete(bilhete, credencial.id)`.

  A ativação perdida acontece depois desses três passos. A senha errada continua caindo em `conferencia.recusar`, com `login_falho` e contagem. Deixar de contar só a senha certa não dá tentativa grátis a ninguém.
- **No MFA a saída também fica depois do fator.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:101-117`, a derrota da ativação só ocorre depois de `reservar`, do código conferido, de `zerar` e de consumir o desafio. O código errado continua contando e chega a `CONTA_SEGURADA` na quinta falha.
- **Não vira oráculo de senha.** `NAO_ENCONTRADO` é diferente de `NAO_AUTENTICADO`, mas essa resposta exige duas coisas:
  - um bilhete válido e preso à própria credencial, que só o dono da conta tem depois do aceite;
  - uma corrida com o `gerar` do operador, que o atacante não consegue disparar.

  Fora da janela da corrida, o convite já está revogado e `pendentePeloBilhete` devolve vazio. O login cai no caminho de antes, igual à senha errada.
- **Nada passa a depender de IP.** A proteção continua por conta, com o contador por e-mail e o do MFA por conta.

**Cenário E15(b):** cobre os três caminhos (aceite, login sem MFA, login com MFA) com a mesma resposta e confere que não grava `login_falho` nem soma no contador. Para o gerar no meio com um gatilho que existe só no banco de teste, sem gancho em produção. Serve como teste de concorrência do item 6.

**57014 da espera da trava:** continua 503 `TEMPO_ESGOTADO`, com o texto na W10. A espera fica limitada pelo `statement_timeout`, e só existe quando o operador gera ao mesmo tempo, que é raro. A trava não cai no caminho das sessenta turmas às 7h30: só o login que traz bilhete pega a trava da escola.

Recomendações:
- Seção 5: dizer se a ativação perdida chama `contador.zerar(chave)`, como faz o caminho de sucesso, ou só libera a reserva. "Sem somar" é ambíguo, porque a tentativa já foi reservada antes do hash, e a implementação pode deixar a reserva contada sem querer. Vale o E15(b) conferir o estado do contador, e não só a ausência de incremento.
- Seção 5: dizer o que acontece com a conta que perde a ativação mas tem outro usuário ativo, por exemplo o mesmo coordenador em outra escola. Hoje o texto responde `NAO_ENCONTRADO` e não deixa entrar no usuário que já existe. Não bloqueia a carga, mas é comportamento a declarar.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md` (seção 5, linhas 81-86)
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md` (E11, E15, W10)
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md` (Rodada 4)

## privacy-guardian · 2ª rodada · REPROVADO · 2026-09-24 12:48:11 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

Campos pessoais tocados: nome e e-mail da coordenadora, digitados no gerar e já no mapa de dados do F1. O reuso do usuário "com o mesmo e-mail" lê a conta global pelo e-mail, que é o caminho que o F1 já usa em `contaParaConvite`. Nenhum campo de aluno entra.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. Refazer e revogar só alcançam convite `tipo = 'coordenador'` e respondem `NAO_ENCONTRADO` a outro tipo. A escola vem do convite, não do cliente. Gerar, refazer e revogar pegam a trava da escola antes de ler o estado. A ativação por convite pega a mesma trava como primeira instrução.

Logs: limpos. `operacao.*` levam só ids, e a A3 prova que não há nome, e-mail, slug nem token nas linhas de log.

Auditoria: presente na ativação, ausente na revogação que o gerar faz sozinho em `aceito`.
- **Quem entrou e quando continua respondido.** Quem vence a ativação passa por `usuario.ativado_por_convite` ou `convite.aceito`, e depois por `concluir`, que grava `login` no registro de acesso. Quem perde não entra: não abre sessão e não ativa nada, então não há acesso a registrar.
- **Não gravar `login_falho` nesse caso está certo.** Conferi em `apps/api/src/sessao/resolucao-de-tenant.repository.ts:406-408`: `usuarioComConviteAceito` já exige `revogado_em is null`. Depois que o gerar confirma, um bilhete velho cai de volta em `recusar`, que grava `login_falho` e soma no contador. Só a corrida exata fica sem a falha, e ela exige a senha certa, então não abre caminho para tentar senhas sem contar.
- **A revogação implícita do gerar não tem registro próprio** (bloqueante abaixo).

Envio externo: nenhum. Não há IA nesta spec.

Seed/fixture: sintético. A I6 usa valores sentinela únicos.

Bloqueantes:
- **`tasks/prd-apresentacao-painel/techspec.md:81-82` (seção 5) e `:132` (seção 7, linha Auditoria).**
  - **O que está errado:** gerar em `aceito` ou `sem_coordenacao` "revoga o último convite na mesma transação", mas a spec não diz que essa revogação gera auditoria. Com e-mail diferente, o convite revogado é de outro usuário: a pessoa que aceitou o link e ainda não entrou perde o acesso de coordenação a ser ativado. Isso é alteração de permissão (regra 20, item 10).
  - **Por que o que já existe não cobre:** o `convite.criado` atual leva só `usuarioId`, `expiraEm` e `contaNova` do convite novo (`apps/api/src/sessao/convite.service.ts:163`). O F1 revoga por `revogarConvitesDoUsuario` sem auditoria nenhuma. Sobra só o `revogado_em` na linha, sem autor e sem ligação com a ação.
  - **Correção exigida:** a seção 5 passa a dizer que gerar em `aceito` e `sem_coordenacao` grava `convite.revogado` do convite anterior, com `entidadeId` = o id dele e o apelido conferido, na mesma transação. A alternativa aceita é `convite.criado` com `depois.revogouId`.
  - **Teste exigido:** a E6 (`cenarios.md:39-45`, os casos "gerar em `aceito`" e "gerar em `sem_coordenacao`") ganha a asserção desse registro, sem nome, e-mail nem token, como a A1 já faz para `convite.refeito`.

Recomendações:
- **Texto da tela de login para o `NAO_ENCONTRADO` do perdedor.** A W10 cobre só o painel da operação, e a resposta `NAO_ENCONTRADO` no login por e-mail e no MFA é nova para `apps/web/src/paginas/EntrarNaEscola.tsx`. Sugiro o mesmo texto da tela de convite inválido do F1, sem dizer que a senha estava certa, num teste de unidade da tela.
- **Textos da W10.** Não trazem id, código, nome nem e-mail, e o `TEMPO_ESGOTADO` ganhou texto próprio. Nada a exigir.
- **Para o `/retro`:** o reuso de usuário desativado em `sem_coordenacao` reativa quem saiu. É legítimo, porque passa por convite novo aceito e auditado, mas vale uma linha no `docs/lgpd.md` (ciclo de vida) dizendo que a reativação só acontece por convite.
- **Continua valendo da rodada 1:** o usuário de coordenação nunca ativado que fica para trás depois de gerar com outro e-mail, agora também em `aceito`.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts

## test-engineer · 5ª rodada · REPROVADO · 2026-09-24 12:48:21 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** a matriz estado × ação (E6), as travas da 7c em paralelo (E2, E4, E8, E9, E11, E15), o isolamento das contagens e do uso (I4, I5), a sentinela (I6), os casos de borda das contagens (L1: professor com duas disciplinas na mesma turma, aluno transferido, virada de ano, professor em duas escolas), o fuso e a virada de mês e de ano no uso (L2), a paginação (L3), o token fora do banco e do log (A2, A3), e as telas W1 a W10.

**Cobertos:** todos os acima. As duas correções da rodada 4 foram feitas.
- **E15(e) e seção 5.** O desenho agora diz 503 `TEMPO_ESGOTADO`, e o W10 tem o texto de tela. Conferi no código: o 57014 já é mapeado para esse erro (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/mapear-erro-postgres.ts:10`), e o filtro global põe `Retry-After` em todo 503 (`filtro-global.ts:30`).
- **E15(b) e seção 5.** Quem perde a disputa recebe `NAO_ENCONTRADO`, sem `login_falho` e sem somar no contador. O teste quebra com o código de hoje (`login.service.ts:125-127` grava a falha quando `usuarios` fica vazio), então ele de fato prova a regra.

As recomendações da rodada 4 também entraram. O mecanismo que para o gerar no meio é um gatilho só no banco de teste. A E15(c) confirma que o gerar também espera. A E15(d) prova o resultado e a ausência de deadlock (40P01).

**Bloqueantes:**

1. **Seção 5, na "Decisão" sobre quem perde, e `cenarios.md` E6 (linhas 42-44) e E15(b).** A regra "senha certa não conta como falha" foi escrita só para quem perde a corrida. A mesma situação fora da corrida continua sem resposta escrita e continua gravando `login_falho`. São dois casos:
   - **Revogação antes do login.** O operador revoga em `aceito`, ou gera de novo, e só depois a coordenadora entra com a senha certa e o bilhete ainda válido (30 min). Hoje `pendentePeloBilhete` devolve `undefined`, porque `usuarioComConviteAceito` filtra `revogado_em is null` (`resolucao-de-tenant.repository.ts:407`). Aí `usuarios` fica vazio, e o código grava `login_falho` e recusa (`login.service.ts:125-127`). No MFA, `mfa.service.ts:119` responde 401. Assim a mesma pessoa, com a mesma senha e o mesmo bilhete, recebe `NAO_ENCONTRADO` sem falha ou "credencial inválida" com falha, e isso depende só de em que milissegundo a revogação caiu. É o defeito da correção 2 da rodada 4, na ordem que não é corrida. E é a ordem mais comum.
   - **Conta com usuário ativo em outra escola** (a coordenadora de A convidada para B com o mesmo e-mail, como na E10). O código de hoje entra normalmente em A quando a ativação de B falha. Escrito sem condição, "quem perde recebe `NAO_ENCONTRADO`" autoriza a implementação a barrar o login em A.

   **Correção exigida:**
   - Na seção 5, escrever a regra pelo resultado, e não pela corrida: login com senha certa (e código certo, no MFA) e com bilhete válido desta conta, cujo convite não ativa mais, responde `NAO_ENCONTRADO` sem `login_falho` e sem somar no contador, quando a conta não tem outro usuário ativo. Com outro usuário ativo, entra nele, e a escola perdida não aparece.
   - Na E6, os casos "revogar em `aceito` e depois a primeira entrada" e "gerar em `aceito`, login com o bilhete antigo" passam a checar essa resposta e a ausência de `login_falho`, com e sem MFA.
   - Na E15(b) ou na E10, acrescentar a variante com usuário ativo em outra escola: entra nela, sem ativar o convite perdido.

**Recomendações:**
- **E15(b), "nos três caminhos".** Em `aceito` o convite já foi usado, então não há aceite a disputar. Diga que (b) cobre o login sem MFA e o login com MFA, e que o aceite fica na (d).
- **Senha errada continua contando.** Um cenário com bilhete de convite revogado e senha errada, que continua gravando `login_falho` e somando no contador. Ele segura uma mutação que pule o contador sempre que o convite não vale, o que deixaria tentar senhas sem limite numa conta (regra 80, item 1).
- **Seção 7c, linha "Ativação por convite".** Na coluna "Quem perde recebe", trocar "a resposta de convite inválido" por `NAO_ENCONTRADO`, sem `login_falho`, para bater com a seção 5.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md`

Código conferido:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-24 12:49:43 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

Campos pessoais tocados: o nome e o e-mail da coordenadora, digitados ao gerar o convite. Os dois já estão no mapa de dados desde o F1. Também aparece o hash do token do convite. Nenhum campo de aluno é tocado. O painel só conta alunos e não lê nome nem matrícula.

Fora da tabela de dados do docs/lgpd.md: nada. A seção 7 da spec declara que não há campo novo e que o `docs/lgpd.md` não muda.

Autorização por objeto: ok.
- As rotas de refazer e revogar abrem o contexto pela escola do convite. Elas só aceitam convite do tipo coordenador; qualquer outro tipo responde `NAO_ENCONTRADO`, igual ao inexistente.
- Revogar um convite já revogado também responde `NAO_ENCONTRADO`, então "não encontrado" e "sem permissão" respondem igual.
- A nova regra de login com senha certa tem um caso de outra escola: a coordenadora da escola A convidada para a escola B. Esse caso está coberto pela E16, que exige entrar em A sem ativar B e sem nada de B na resposta.

Logs: limpos. Os logs de convite (`operacao.convite.{gerado,refeito,revogado}`) levam só ids, e a A3 captura as linhas de log das cinco escritas para provar isso.

Auditoria: presente. Esta era a correção exigida na rodada 5, e foi feita.
- Na seção 5 da techspec (linhas 81 e 82), gerar em `aceito` e em `sem_coordenacao` passa a revogar o convite anterior na mesma transação e a gravar `convite.revogado` dele.
- A E6 (`cenarios.md`, linhas 46 e 47) confere essa auditoria: com o apelido do operador conferido, sem nome, e-mail nem token.
- As demais auditorias não mudaram: `rede.criada`, `escola.criada`, `convite.{criado,refeito}`. A leitura do painel mostra só contagem e não precisa de auditoria de leitura.

Envio externo: nenhum. A spec não usa IA (seção 7b).

Seed/fixture: sintético. Os testes usam valores sentinela e o MVP é sintético (D71).

Bloqueantes: nenhum.

Recomendações:
- **Revogar convite já usado.** Em `sem_coordenacao`, o último convite já foi usado. A spec agora grava `revogado_em` nele, mas não diz se é isso mesmo que se quer. Ele não ativa mais nada, mas continua sendo o último convite até o novo existir. Vale escrever na seção 5 que revogar convite usado só serve de registro, e a A4 conferir que o estado continua sendo o do convite novo.
- **Registro de acesso da tentativa sem `login_falho`.** A senha certa com convite que já não ativa termina em `NAO_ENCONTRADO`, sem `login_falho`. A spec não diz se essa tentativa entra no registro de acesso do Marco Civil (6 meses) ou se não deixa rastro. Registrar a escolha na seção 5.
- **Continuam abertas as recomendações da rodada 5, para o `/retro`.** Uma linha no ciclo de vida do `docs/lgpd.md` sobre a reativação por convite em `sem_coordenacao`, e o destino do usuário de coordenação que nunca foi ativado e fica para trás.
- **Texto da tela.** O texto do `NAO_ENCONTRADO` na tela de login da escola deve ser o da tela de convite inválido do F1, sem dizer que a senha estava certa. Registrar isso no grupo W.

Pergunta de fechamento: esta spec não guarda nem envia dado de aluno. O que ela grava sobre a coordenadora está no mapa de dados do F1 e na auditoria, e dá para consultar. Nada disso abre uma lacuna na resposta à secretaria.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md

## test-engineer · 6ª rodada · APROVADO · 2026-09-24 12:49:50 · `tasks/prd-apresentacao-painel/revisao-spec.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Seção 5, a regra da senha certa escrita pelo resultado, e não só pela corrida.** O caso é o login com bilhete de um convite que já não ativa, com e sem MFA. O que tem de acontecer:
  - com outro usuário ativo na conta, entra nele;
  - sem outro usuário ativo, responde `NAO_ENCONTRADO`, não grava `login_falho` e desfaz a reserva do contador;
  - senha errada continua contando.
- **E6.** Gerar em `aceito` e em `sem_coordenacao` grava `convite.revogado` do convite anterior (regra 20, item 10).
- **E15(b)** confere o resultado com e sem MFA, e o aceite fica na (d).
- **Variante de outra escola.** A coordenadora de A é convidada para B.

**Cobertos:**
- **Seção 5 (linhas 81 a 88).** A Decisão agora vale pelo resultado ("revogado, ou perdeu a trava"), cobre o outro usuário ativo, o `NAO_ENCONTRADO` sem `login_falho`, a reserva desfeita e a senha errada contando. Isso bate com o código atual: em `apps/api/src/sessao/login.service.ts:117-128`, sem usuário ativo a senha certa cai em `recusar`, e é esse comportamento que a Decisão muda. O teste da E16 falharia se a regra fosse removida.
- **Seção 7c, linha "Ativação por convite".** Aponta a seção 5.
- **E6.** Grava `convite.revogado` com o apelido conferido, sem nome, e-mail nem token.
- **E16, cenário novo.** Roda fora de corrida, com e sem MFA, e tem três asserções de resultado:
  - o contador fica igual ao de antes da tentativa;
  - com senha errada, `login_falho` é gravado e o contador soma;
  - a coordenadora entra em A, B não é ativada e nada de B aparece na resposta, o que também cobre o isolamento.
- **E15(b)** remete à E16 para os dois logins, e o aceite ficou só na (d).
- **Minhas recomendações da rodada 5** entraram todas: o estado do contador, a senha errada com bilhete revogado, a 7c alinhada e o recorte da E15.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **E16, com MFA.** Dizer qual contador é conferido: o da senha, o do código ou os dois. `apps/api/src/sessao/mfa.service.ts:101` faz uma reserva própria na etapa do código. Acrescentar que código errado com bilhete revogado continua contando, como a senha errada.
2. **E16, variante sem corrida entre as etapas.** Senha certa com convite ainda válido, o convite é revogado antes do código, e o código certo dá `NAO_ENCONTRADO`, ou entra no outro usuário ativo. O desafio carrega o convite (`mfa.service.ts:49`), e hoje esse caso só aparece dentro da corrida da E15(b).
3. **E16, conta com dois ou mais outros usuários ativos.** Conferir que o login vai para `escolher` com os acessos ativos, sem o da escola do convite revogado (`login.service.ts:147`).
4. **Texto da seção 5.** Trocar "perdeu a trava" por "revogado por um gerar concorrente". A primeira forma lê como falha de lock, e o `/validar` pode interpretar errado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/cenarios.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/revisao-spec.md
