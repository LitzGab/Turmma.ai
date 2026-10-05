# PRD — LGPD e titular

**Status:** aprovado (05/10/2026, Joaquim)
**Funcionalidade do roadmap:** F3 — `lgpd-e-titular`
**Depende de:** F1 (concluída). Corre em paralelo com F2, F4 e F5

> **Recorte de 05/10/2026 (Joaquim).** Saíram: exportação da escola (D63) para o F12; canal de notificação de violação
> (D61) para o F9 e o F12; validação humana como entidade geral (D56) para o F6. Ficam três fatias, nesta ordem:
> **1.** retenção e expurgo; **2.** suboperadores e incidente; **3.** pedido do titular. `ROADMAP.md` e
> `docs/conformidade-mec.md` seção 11 ainda não refletem o recorte.

## 1. Problema

O MVP e a A1 guardam dado de menor que nunca sai: conversa do Tutor, sinais, respostas, diagnóstico, conversa do
professor, entrada e saída do modelo, pedidos de reivindicação decididos. Só acesso, sessão e convite têm expurgo. A
eliminação existe no código, mas nada a chama, e deixa para trás o tema e a entrada do modelo. Se o responsável
perguntar à Renata o que guardamos do filho e para onde isso foi, ela não tem como responder, e nós não registramos
os terceiros que recebem dado nem os incidentes. É o teste de fechamento da regra 20, exigido antes da escola real.

## 2. Objetivo

Todo dado pessoal sai no prazo da escola. A coordenação atende pela tela, sem nós e com rastro, o pedido
de acesso, portabilidade, compartilhamento e eliminação de um titular. E a escola vê quais suboperadores recebem dado
dela e quais incidentes a afetaram.

## 3. Fora de escopo

- O recorte acima. Sem o canal de notificação, o portão da primeira escola real continua fechado
- O que depende de parecer (seção 10): nenhuma finalidade nem base legal muda. O responsável continua sem conta
- Fechar os prazos "proposta" do mapa: são o padrão até a escola real
- Eliminação no backup, que ainda não existe (D42, F16)
- Fim de contrato e expurgo da auditoria (F12, com a exportação); aviso de privacidade por faixa etária (F9); RIPD,
  contrato, DPO e processo de incidente ensaiado (`TODO.md`)
- Ferramenta nova de correção de dado; e-mail; pedido aberto pelo próprio titular no produto (ele pede à escola, D10)

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Operação Turmma | Por comando: ajustar retenção, cadastrar suboperador, registrar incidente. Ver contagens e o expurgo | Ver dado de pessoa (D76), abrir arquivo, atender pedido |
| Coordenador | Registrar e conduzir o pedido de aluno ou professor da escola; ver retenção, suboperadores e incidentes; confirmar incidente | Ler a conversa do professor; mudar a retenção; alcançar outra escola; pedir a própria eliminação |
| Professor, aluno | Baixar o próprio arquivo liberado | Ver pedido de outra pessoa |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| | **Fatia 1 — Retenção e expurgo** | |
| RF1 | Cada escola tem um prazo por categoria do mapa de `docs/lgpd.md`; o padrão é o do mapa. Toda tabela de pessoa pertence a uma categoria | Escola nova nasce com o padrão; teste de arquitetura quebra com tabela sem categoria |
| RF2 | A operação ajusta por comando o prazo de uma categoria numa escola, citando o contrato, dentro de piso e teto. Registro de acesso (6 meses) e auditoria não se ajustam | Abaixo do piso: erro tipado; ajuste em A não muda B; fica na auditoria com operador e referência |
| RF3 | A coordenação vê, em linguagem comum, o que se guarda, por quanto tempo e se o prazo é padrão | e2e |
| RF4 | Uma rotina de madrugada apaga, por escola e categoria, o que passou do prazo, e deixa só o que o mapa manda ficar. Cobre todas as tabelas do MVP e da A1 que hoje não têm expurgo | Relógio injetado: um dia antes fica, um dia depois sai; reexecutar não apaga mais |
| RF5 | O expurgo é lote fora do horário letivo, com limite por escola, e não atrasa o interativo. Cada execução registra, sem conteúdo, quantas linhas saíram por escola e categoria; duas noites sem expurgo geram alerta com runbook | Isolamento; carga com expurgo grande em A e Tutor em B; ensaio do alerta |
| | **Fatia 2 — Suboperadores e incidente** | |
| RF6 | A operação cadastra e encerra por comando o suboperador: nome, finalidade, categorias de dado, país de processamento, contrato, se veda treinamento, vigência e escolas atendidas | Auditoria da operação; encerrado fica no histórico |
| RF7 | A coordenação vê os suboperadores da escola, vigentes e passados, com o período | B não vê o que atende só A |
| RF8 | A operação registra por comando o incidente com o conteúdo mínimo do art. 10 da Res. CD/ANPD 15/2024 (quando foi conhecido, circunstâncias, escolas, categorias de dado, número de titulares, risco, contenção, correção) | Registro sem dado de titular, guardado 5 anos |
| RF9 | A coordenação da escola afetada vê o aviso ao entrar até confirmar o recebimento; guarda quem confirmou e quando, e mede as 24 h da detecção (prazo nosso, `docs/lgpd.md` 8; o legal, de 3 dias úteis, é da escola) | Outra escola não vê o aviso |
| | **Fatia 3 — Pedido do titular** | |
| RF10 | A coordenação registra o pedido de aluno ou professor da escola: tipo (acesso, portabilidade, compartilhamento, correção, eliminação), quem pediu (titular ou responsável legal, lista fechada, sem nome) e a data de chegada à escola | Titular de outra escola responde igual a inexistente |
| RF11 | Acesso e portabilidade: fora da requisição, o sistema monta um arquivo aberto e legível por máquina, com tudo do titular na escola, em todas as categorias, e um resumo legível | Sentinela por tabela: todas aparecem, nada de outro titular |
| RF12 | O arquivo completo só é baixado pelo titular logado, na área dele, por 7 dias. Sem conta ativa, a coordenação baixa uma versão que nunca traz a conversa do professor, com auditoria e finalidade | A versão da coordenação não traz a conversa; no 8º dia o arquivo não existe |
| RF13 | Compartilhamento: o pedido lista os suboperadores por onde passou dado do titular, com o período, a partir das chamadas a provedor externo. A lista vem também na eliminação e na correção, para a escola avisar cada um (LGPD, art. 18, § 6º) | Aluno com Tutor externo aparece com o provedor; sem uso, só com a hospedagem |
| RF14 | Eliminação: na confirmação, o acesso cai na requisição seguinte; a eliminação de fato vem 7 dias depois, e até lá a coordenação cancela e o acesso volta | Relógio injetado: cancelado no 6º dia, nada sai; no 8º, tudo sai |
| RF15 | A eliminação apaga tudo do titular na escola que o mapa não manda guardar, inclusive o tema e a entrada do modelo de que ele é autor. Nos campos livres da escola (tema, artefato, conversa do professor), troca o **nome completo** do aluno por marca neutra e devolve à coordenação só a contagem. O que o mapa manda guardar (auditoria, validação, decisão de entrega) fica com o id | Sentinela por tabela; nome completo semeado em três campos some; primeiro nome sozinho fica |
| RF16 | O pedido tem estado (recebido, em preparação, pronto, concluído, cancelado), e a tela mostra quanto falta dos 15 dias da declaração completa, contados da chegada (LGPD, art. 19, II). Prazo em constante: a ANPD pode regulamentá-lo | Vencido fica destacado |
| RF17 | Cada passo fica na auditoria da escola com autor, finalidade e ids. O arquivo fica em storage privado com link curto, e nunca em log, cache, URL ou navegador. A operação vê só contagens | Varredura de log e respostas; sentinelas na operação (I6 da A0b) |
| | **Transversais** | |
| RF18 | Tudo de outra escola responde igual a inexistente (regra 10) | Isolamento por rota e rotina |
| RF19 | Clique duplo, rotina rodando duas vezes e expurgo junto da eliminação não duplicam nem dão erro cru (regra 80) | Teste de concorrência |
| RF20 | A coordenação ganha **Privacidade** no grupo Conformidade (Pedidos, Retenção, Suboperadores, Incidentes); aluno e professor ganham **Meus dados**. Quatro estados, teclado e toque | e2e em `chromebook` e `celular`, com acessibilidade |

## 6. Regras de negócio

- Pedido que chegue a nós vai para a escola, controladora (D10)
- O prazo não é mais curto que a obrigação da escola nem mais longo que o necessário (`docs/regulacao.md` 6): daí o
  piso e o teto. "Ano letivo + N" conta do encerramento do ano
- A eliminação numa escola não toca outra nem a conta global que ainda serve a outra (F1, tarefa 17.0)
- A conversa do professor nunca chega à coordenação, nem em arquivo (regra 70, item 8). A do Tutor só chega na versão
  do titular sem conta ativa, auditada: exceção declarada à regra 20, item 14, pelo direito de acesso

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Aluno transferido para outra escola cliente | O pedido em A não alcança B; a mesma matrícula em outra escola é outro titular |
| Outro aluno ativo com o mesmo nome completo | A troca nos campos livres não acontece, e a coordenação é avisada do homônimo |
| A única coordenadora quer a própria eliminação | Não registra para si: entra outra coordenação por convite da operação |
| A operação reduz um prazo | O expurgo seguinte o aplica ao que existe; aumentar não traz de volta o que saiu |
| Responsável pede pelo aluno | "Responsável legal"; o arquivo sai na conta do aluno |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Pedido do titular (id, tipo, quem pediu por lista fechada, datas, estado, autor; sem nome nem texto) | aluno, professor | provar o atendimento | vigência + 5 anos (proposta), só com ids depois da eliminação | não: entra |
| Arquivo do titular | aluno, professor | acesso e portabilidade | 7 dias, ou até a eliminação de fato | não: entra |
| Registro de incidente e confirmação (quem e quando) | coordenador | provar quando a escola soube | 5 anos (Res. CD/ANPD 15/2024, art. 10) | não: entra |

O resto (retenção, suboperador, registro do expurgo) não guarda pessoa.

## 8b. Risco regulatório

Sem IA no caminho.

## 9. Métricas

- Do pedido de acesso ao arquivo pronto: minutos (teste de fechamento da regra 20); pedidos atendidos em 15 dias
- Noites sem expurgo e linhas além do prazo: zero
- Da detecção do incidente à confirmação da escola: menos de 24 h

## 10. Perguntas em aberto

**Para a Tech Spec:** piso e teto de cada categoria (ela propõe, o Joaquim aprova); formato do arquivo e do resumo;
como o pedido de correção aponta para o caminho que já existe.

**Dependem de advogado** (nada se decide aqui; os dois primeiros ainda não estão no `TODO.md`):
- O que a escola guarda mesmo com eliminação (LGPD, art. 16, I; art. 18, VI). Não há prazo federal para o registro
  escolar; em SC a referência é o Anexo I da Res. CEE/SC 005/2022, não lido. Até o parecer, a tela avisa que a
  eliminação apaga o que a escola pode ter de guardar no sistema de gestão dela
- Se a Res. CD/ANPD 2/2022 (registro simplificado) nos alcança, sendo dado de menor risco relevante (Res. 15/2024, art. 5º)
- ECA Digital, arts. 17, 18 e 24: com conta do responsável, o pedido pode vir dele no produto
- Base legal da conversa do Tutor e dos sinais (pode mudar o prazo) e dos indicadores de professor
