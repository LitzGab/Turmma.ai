# LGPD — documento de referência do Turmma

> **Leia isto antes de escrever qualquer código que toque dado de pessoa.**
> Não é anexo jurídico. É especificação técnica.

Quase todo titular aqui é **menor de idade**. O art. 14 da LGPD trata dado de criança e
adolescente com proteção reforçada e exige que o tratamento seja feito **no melhor
interesse do titular**. Vazamento nesse contexto não é incidente comum: é manchete,
notificação à ANPD, e fim do contrato com toda rede que nos conhecia.

SaaS de educação não costuma morrer por falta de funcionalidade. Morre por vazamento.

---

## 1. Papéis

| Papel | Quem | O que significa |
|---|---|---|
| **Controladora** | A escola (ou a rede) | Decide por que e como os dados são tratados. Responde pelo consentimento dos responsáveis. |
| **Operador** | Nós | Tratamos **apenas** conforme instrução da escola, registrada em contrato. |
| **Suboperador** | Provedor de IA, hospedagem, e-mail, provedor de busca (D68) | Só entram com contrato que replique nossas obrigações. Conversa de aluno só em provedor com processamento no Brasil (D62). |

**Ser operador não nos tira do ECA Digital.** A LGPD distribui responsabilidade entre
controlador e operador; a Lei 15.211/2025 fala de "fornecedor de produto ou serviço de
tecnologia da informação direcionado a crianças e adolescentes", e isso somos nós,
independente de quem contrata. As obrigações da seção 2 de `docs/regulacao.md` — privacidade
máxima por padrão, gerenciamento de risco, relatório de impacto, canal de denúncia,
transparência do caráter sintético da IA — recaem sobre nós **diretamente**, e nenhuma
cláusula de contrato com a escola as transfere.

Consequência prática: **não inventamos finalidade nova.** Usar dado de aluno para algo que
não está no contrato com a escola — inclusive melhorar nosso produto ou treinar modelo —
exige nova base legal e nova instrução. Na dúvida, não use.

---

## 2. Mapa de dados

Todo campo pessoal do sistema precisa estar nesta tabela. Campo que não está aqui não
deveria existir.

| Dado | Titular | Finalidade | Base legal (via escola) | Retenção |
|---|---|---|---|---|
| Nome | aluno | identificar na turma | execução de contrato educacional | ano letivo + 5 anos (registro escolar) |
| Matrícula | aluno | login e vínculo | idem | idem |
| Turma, série, disciplina | aluno | contexto pedagógico | idem | idem |
| Identificador opaco da conta Google ou Microsoft da escola (`conta_externa`: provedor, `sub` no Google, `oid` e `tid` na Microsoft; nunca e-mail, nome nem foto, que o login descarta antes de gravar e nunca loga) | aluno, professor | login e importação de turma (D48) | execução de contrato | enquanto houver vínculo: sai quando a escola desativa ou elimina o usuário, ou desliga a conta (17.0) |
| Resposta de avaliação | aluno | correção e devolutiva | execução de contrato educacional | ano letivo + 1 ano |
| Diagnóstico por habilidade | aluno | acompanhamento pedagógico formativo (D46) | idem | ano letivo + 1 ano (proposta, a confirmar com a escola) |
| Nota | aluno | registro escolar | obrigação legal da escola | conforme norma da escola |
| Conversa com o tutor | aluno | aprendizagem e supervisão docente | legítimo interesse da escola em supervisão pedagógica | 12 meses |
| Sinais de uso de IA | aluno | supervisão docente | idem | 12 meses |
| Adaptação pedagógica necessária (ex.: linguagem direta, fonte ampliada, tempo extra), sempre como **tipo de adaptação** — **nunca diagnóstico nem texto livre sobre o aluno** (D35, D67) | aluno | adaptar prova, atividade e material (função de adaptação do Assistente de ensino) e ajustar a forma da conversa do Tutor, nunca o que é cobrado (D66) | dado sensível (art. 11), via obrigação da escola com inclusão; **a confirmar com advogado** | enquanto houver vínculo; revista a cada ano letivo |
| Memória do Tutor: alcança **toda a trajetória do aluno no sistema** (respostas, diagnóstico, devolutiva do professor, sinais e o resumo de cada sessão em formato fixo: assunto, habilidade, exercício, onde travou, como terminou). É leitura de dados que já estão neste mapa, mais o resumo de sessão; **não existe texto sobre o jeito, o humor ou o comportamento do aluno**, escrito por modelo ou por pessoa (D66) | aluno | orientar o estudo de forma individual; o aluno vê e contesta | legítimo interesse da escola em supervisão pedagógica; perfil acadêmico individual é alto risco no CNE: AIA antes de existir | cada dado segue a própria retenção; o resumo de sessão segue a conversa (12 meses) |
| Contexto do Tutor informado pelo professor: por turma (conteúdo atual, lista ativa, foco da semana) e por aluno (**habilidades a reforçar, escolhidas da lista; sem texto livre**) (D66) | aluno | direcionar o Tutor | execução de contrato educacional | ano letivo |
| Busca do Tutor: a consulta **escrita pelo modelo** e as fontes que o aluno abriu (D68) | aluno | supervisão docente e letramento em pesquisa | legítimo interesse da escola em supervisão pedagógica | 12 meses, como a conversa |
| Saída da aba durante avaliação: contagem **por avaliação**, nunca somada por aluno (D70) | aluno | integridade da avaliação, mostrada só ao professor da turma, com o aluno avisado antes | execução de contrato educacional; **a confirmar com advogado** | segue a resposta da avaliação (ano letivo + 1 ano); no registro da validação entra só que o destaque foi apresentado e aberto |
| Sinal "precisa de atenção humana" (sem conteúdo) | aluno | encaminhar a um humano o aluno que pediu ajuda pessoal | proteção do titular, melhor interesse (art. 14) | 12 meses |
| Nome, e-mail | professor, coordenador | acesso e responsabilidade | execução de contrato | vigência + 5 anos |
| Indicadores de uso e das turmas do professor | professor | apoio pedagógico ao próprio professor e visão agregada da coordenação; **nunca decisão sobre o professor** (D45) | execução de contrato; **a confirmar com advogado** (CLT, convenção coletiva, estatuto do servidor) | ano letivo + 1 ano (proposta) |
| Conversa do professor com o chat | professor | produzir o que ele pediu | execução de contrato | 12 meses (proposta); nunca visível à coordenação |
| Nome, e-mail, telefone | responsável | comunicação escolar | execução de contrato | vigência do vínculo |
| Hash de senha (argon2id) | aluno, professor, coordenador | autenticar (F1) | execução de contrato; segurança (art. 46) | até desativar a credencial: o do aluno sai na desativação dele na escola (a matrícula fica); o da conta da equipe, na limpeza da conta (17.0) |
| E-mail de login na conta global | professor, coordenador | autenticar em uma ou mais escolas (F1) | execução de contrato | enquanto houver `usuario` ativo em alguma escola (ou convite ainda válido para um): quando não há mais, a limpeza da conta (17.0) apaga e-mail, senha e segundo fator na mesma transação da desativação ou da eliminação, ou, se um convite a segurava, na madrugada seguinte ao vencimento ou à revogação dele (`sistema.expurgar-acesso`), e a linha fica só com o id; a eliminação pedida por uma escola apaga só o `usuario` dela |
| Segredo TOTP cifrado e HMAC dos códigos de recuperação | coordenador | segundo fator (F1) | execução de contrato; segurança (art. 46) | até desativar a conta ou redefinir o MFA |
| Sessão (horários de início, uso e fim, método, motivo de encerramento, hash do cookie de renovação atual e anterior, família da sessão e conta; sem IP nem nome) | todos | manter e encerrar o acesso, inatividade (F1) | execução de contrato | 30 dias após encerrar ou, sem encerramento, após expirar; apagada pelo `sistema.expurgar-acesso` (17.0), de madrugada |
| Contador de tentativas de login (HMAC do identificador) | todos | proteção contra força bruta (F1) | legítimo interesse, segurança | 15 minutos |
| Contadores por IP do login (HMAC do IP, e da escola na matrícula; só o número de tentativas ou falhas no minuto) | todos | rebaixar, sem recusar, a prioridade de login de um IP com falhas demais numa escola ou acima do limite da rota de e-mail (F1, tarefa 15.0) | legítimo interesse, segurança (art. 46) | 1 minuto |
| Cookie de dispositivo (até 50 HMACs com chave de escola+matrícula ou de e-mail que já entraram naquele navegador, sem nome; o servidor não guarda nem lê identidade a partir dele) | aluno, professor, coordenador | manter a prioridade de login de quem já entrou quando há ataque na rede da escola (F1); nenhum outro uso | legítimo interesse, segurança (art. 46), no melhor interesse do titular (art. 14) | 30 dias por entrada, no navegador |
| Vínculo, estado e datas | professor, aluno | acesso por objeto (F1) | execução de contrato | vigência + 5 anos |
| Motivo de contestação de vínculo (código e complemento de até 140 caracteres, sem nome de aluno) | professor | corrigir a alocação (F1) | execução de contrato | complemento: apagado na virada do ano letivo, na mesma transação do encerramento (10.0); código: fica com o vínculo, como já fica na auditoria `vinculo.contestado`, porque é o que impede o vínculo nunca aceito de abrir o ano encerrado; o complemento nunca em log nem em auditoria |
| Convite de coordenador (hash do token, datas) | coordenador | primeiro acesso (F1) | execução de contrato | 30 dias após usar, revogar ou expirar, o que vier primeiro; apagado pelo `sistema.expurgar-acesso` (17.0), e junto com o usuário na eliminação |
| Registro da validação humana de correção (o que foi apresentado ao professor, quais destaques ele abriu, quem confirmou e quando) | professor | provar validação efetiva, prévia, qualificada e documentada, exigida pelo CNE (D56) | execução de contrato e obrigação da escola | igual à auditoria: vigência + 5 anos |
| Notificação de violação de direito de criança ou adolescente (quem notificou, o que apontou, o que foi feito) | quem notifica e quem é citado | canal exigido pelo ECA Digital, art. 28, e Decreto 12.880, art. 41 (D61) | obrigação legal | 5 anos; nunca anônima (ECA art. 29, § 2º) |
| Identificador do operador Turmma na auditoria | nossa equipe | prestação de contas à escola | legítimo interesse | vigência + 5 anos |
| Registro de acesso à aplicação (IP, data e hora) | todos | segurança | obrigação legal (Marco Civil, art. 15) | 6 meses, inclusive a falha de login sem escola; apagado pelo `sistema.expurgar-acesso` (17.0); fica depois da eliminação do usuário, com o id |
| Auditoria (quem fez o quê, com finalidade) | todos | prestação de contas à escola e ao titular | execução de contrato e obrigação da escola | vigência + 5 anos |

**IP só em memória, no login** (F1, tarefas 14.0 e 15.0). Além do registro de acesso, o IP de quem pede é usado sem ser
gravado, com a finalidade de segurança, e esquecido por instância:
- na vez do login por e-mail no semáforo do hash, que roda por IP no balde da equipe: fica na memória da instância até
  dois minutos depois da última vez daquele IP (a roda esquece, a cada minuto, quem não esperou nem foi atendido no
  minuto anterior, e todos que não esperam, se passar de 10.000 entradas), ou até o login seguinte, se a instância
  ficar sem login;
- no número de escolas da rede do IP de saída (`rede.ips_saida`), lido só quando um IP passa do limite da rota de
  e-mail: vale por um minuto e sai da memória na varredura do minuto seguinte, ou no login seguinte, se a instância
  ficar sem login;
- nos contadores por IP, o Redis de fila e o seguro em memória recebem só o HMAC do IP, com prazo de um minuto (o
  limite por IP das rotas de login, do rate limit do F0, no Redis de cache, também vive só a janela de um minuto).

Nenhum desses vira rótulo de métrica, linha de log, auditoria ou tabela: o alerta traz a escola, e o IP de um ataque,
quando preciso, é consultado no registro de acesso, só para a investigação.

**Aluno não tem e-mail nem telefone no sistema.** Contato é sempre do responsável. Quem
propuser adicionar precisa justificar por escrito e atualizar esta tabela.

---

## 3. Minimização, na prática

A pergunta certa não é "esse campo é útil?", é "**o que acontece se ele vazar?**".

- Não colete data de nascimento se série já resolve
- Não colete CPF de aluno. Nunca. Não precisamos
- Não colete foto de aluno. Se um dia precisar, vira projeto próprio com avaliação de impacto
- Não colete endereço, renda, raça, religião, saúde
- **Dado de PEI e necessidade específica é dado sensível** (art. 11). Se a ferramenta de
  adaptação precisar dele, guarde a *adaptação necessária*, não o diagnóstico. A ferramenta
  Adaptação recebe o **tipo de adaptação**; campo de texto livre sobre o aluno é onde o
  diagnóstico acaba escrito, e por isso não existe (D67)
- Não meça tempo ocioso nem acompanhe a navegação do aluno. A única exceção é a contagem de
  saídas da aba **durante uma avaliação** (D70)
- Resposta de prova não precisa virar perfil comportamental. Mais do que "não precisa":
  **perfil comportamental de menor é vedado** (ECA Digital, art. 26; Decreto 12.880, art. 10;
  e uso de risco excessivo pelo CNE). Vale para qualquer agregação que classifique o aluno por
  comportamento, humor, atenção ou personalidade, inclusive rótulo interno (D57)

---

## 4. Onde SaaS vaza — e como cada furo é fechado aqui

Esta lista é o que mais aparece em incidente real. Cada linha vira teste.

| Furo | Como acontece | Nossa defesa |
|---|---|---|
| **Falta de escopo de tenant** | Query sem `escolaId`; alguém troca o id na URL e lê outra escola | Escopo no repository, a partir do token. Teste de isolamento por módulo. `rules/10` |
| **IDOR** | `GET /alunos/:id` devolve qualquer aluno | Autorização por objeto, não só por rota. Id UUID. Erro de "não existe" e "sem permissão" idênticos |
| **Bucket público** | Foto de prova em storage aberto, indexada pelo Google | Bucket privado, URL assinada com validade curta, nunca URL permanente |
| **Log com dado pessoal** | Nome e resposta no log, log vai para serviço terceiro | Log só com id. Revisão automática proíbe campo pessoal em logger |
| **Backup exposto** | Dump sem criptografia, em disco compartilhado | Backup criptografado, acesso restrito, restauração testada |
| **Dado real em desenvolvimento** | Dump de produção na máquina do dev | **Proibido.** Ambiente de dev usa seed sintético. `docs/` e seed de demonstração são fictícios |
| **Provedor de IA treinando com nosso dado** | Termo padrão permite | Contrato que veda treinamento. Enquanto não houver contrato, use provedor local |
| **Prompt vazando dado demais** | Conversa do tutor envia turma inteira no contexto | Envie o mínimo: id, não nome. Recuperação limitada ao necessário |
| **Resposta de API larga demais** | Endpoint devolve objeto inteiro, front esconde no CSS | DTO de saída explícito. Nunca serialize a entidade |
| **Convite eterno** | Link de convite sem validade circula em grupo de WhatsApp | Token único, expiração curta, uso único, revogável |
| **Exportação sem controle** | Coordenador baixa planilha com tudo | Exportação registrada em auditoria, com escopo e finalidade |
| **Mensagem de erro** | Stack trace com dado no corpo da resposta | Erro tipado, sem detalhe interno para o cliente |
| **Conta compartilhada** | Coordenação inteira usa um login | Usuário nomeado por pessoa. Ação sempre com autor |
| **Ex-funcionário com acesso** | Professor sai, conta fica | Desativação obrigatória no fim do vínculo, com rotina que sinaliza contas inativas |

---

## 5. Medidas técnicas obrigatórias

**Acesso**
- Senha com hash forte (argon2id ou bcrypt com custo alto)
- Sessão curta com renovação; token de aluno mais curto ainda
- Segundo fator para coordenador e para nosso admin
- Menor privilégio: o papel define exatamente o que alcança

**Dados**
- Criptografia em trânsito sempre; em repouso no banco e no storage
- Escopo de tenant em toda query; id UUID
- Exclusão lógica com autor e data; exclusão real só a pedido do titular
- Pseudonimização no que for analítico: agregado não carrega nome

**Observabilidade sem exposição**
- Log estruturado com `escolaId` e `usuarioId`. Nunca nome, resposta, nota ou conversa
- Auditoria obrigatória: leitura de dado de aluno por coordenador ou rede, leitura nominal
  de indicador de professor pela coordenação, exportação, alteração de nota, alteração de
  permissão, aprovação de conteúdo de IA

**Ciclo de vida**
- Rotina de expurgo automática, conforme a tabela da seção 2
- Fim de contrato: exportação completa entregue à escola e eliminação em prazo definido
- Seed de desenvolvimento e demonstração **sempre sintético**

---

## 6. IA e dado pessoal

Este é o ponto em que somos diferentes de um SaaS comum, e onde o risco é maior.

1. **Contrato com provedor vedando treinamento** com nosso dado. Sem isso, só provedor local.
   O contrato também precisa **permitir serviço usado por menor** e dizer **onde o dado é
   processado**. Em 13/09/2026: os termos da Gemini API (AI Studio) vedam serviço "provável
   de ser acessado" por menor de 18, e não valem para o Vertex AI (termos do Vertex a
   verificar); o DPA da Maritaca proíbe treinamento e descarta o conteúdo após a geração,
   mas lista processamento no Brasil, nos EUA e na UE, e a variante no Brasil precisa estar
   escrita no contrato. Transferência internacional exige as cláusulas-padrão da ANPD.
2. **Envie o mínimo.** A memória do Tutor alcança tudo que o aluno fez no sistema (D66), mas
   cada chamada leva só o que importa para aquela dúvida — o trecho do histórico recuperado por
   relevância, as habilidades em jogo e o tipo de adaptação registrada —, nunca o histórico
   inteiro, nunca o nome, nunca o motivo da adaptação.
3. **Prefira identificador a nome.** O modelo não precisa saber que é a Maria.
4. **Registre todo envio externo** em `ExecucaoAgente`: o que foi enviado, para qual
   modelo, quanto custou, quem aprovou o resultado.
5. **Nada de treinar modelo próprio com dado de escola** sem nova base legal e instrução
   expressa. Isso inclui ajuste fino e memória de longo prazo entre escolas.
6. **Conversa do tutor é dado sensível na prática**, mesmo que a lei não a classifique
   assim: aluno escreve coisas que não escreveria em prova. Retenção curta, acesso
   restrito ao professor da turma, nunca exposta à rede.
7. **Conversa de aluno só em provedor com processamento no Brasil** (D62). Vale para o Tutor,
   para a classificação de sinais e para qualquer prompt que carregue texto escrito por menor
   de idade. Tarefa sem dado pessoal pode usar provedor fora, com as cláusulas-padrão da ANPD
   (Resolução CD/ANPD 19/2024) e informação à escola. O Referencial do MEC trata dado
   educacional de menor sob jurisdição estrangeira como risco de soberania, citando o Cloud
   Act, e a rede pública pergunta isso na primeira reunião.
8. **O aluno nunca é enganado sobre estar falando com IA** (Decreto 12.880, art. 11, I; D58):
   os agentes mantêm identidade de função, toda saída de IA é rotulada como tal, e nenhum
   agente afirma ser pessoa. E o risco algorítmico de cada funcionalidade de alto risco tem
   avaliação escrita antes de ela existir (D60). Não é cosmético: é o único artigo em vigor no Brasil que trata de agente
   conversacional com menor de idade, e a ANPD vai regulamentá-lo.
9. **O buscador é um terceiro fora do País** (D68). A consulta da busca do Tutor é escrita pelo
   modelo, sem o texto que o aluno digitou e sem identificador; sai do nosso servidor, nunca do
   navegador do aluno; e o provedor de busca entra no registro de suboperadores. Conteúdo de
   página da web é dado, nunca instrução para o agente.

---

## 7. Direitos do titular

O sistema precisa responder a estes pedidos **por código**, desde o começo — não como
funcionalidade futura:

| Direito | O que o sistema faz |
|---|---|
| Confirmação e acesso | Exporta tudo sobre um titular, em formato legível |
| Correção | Coordenador corrige nome, turma, vínculo, com auditoria |
| Eliminação | Apaga de verdade, inclusive em backup na próxima rotação, com registro |
| Portabilidade | Exportação estruturada |
| Informação sobre compartilhamento | Lista para quais suboperadores o dado foi |
| Revisão de decisão automatizada | Toda nota tem autor humano; a revisão já é o fluxo. Sinal ou alerta sobre aluno e indicador de professor têm explicação e caminho de contestação (art. 20; regra 70) |
| Notificar violação de direito de criança ou adolescente | Canal no produto, gratuito e divulgado, para aluno, professor, coordenação e família; retirada de conteúdo com motivo, informando se a análise foi humana ou automatizada, e direito de recurso (ECA arts. 28 a 30; Decreto art. 41; D61) |
| Levar o próprio dado embora | A coordenação exporta dado, artefato e histórico de uso em formato aberto a qualquer momento, sem depender de nós (D63) |

**Teste de fechamento:** se a secretaria de educação pedisse hoje tudo o que guardamos
sobre um aluno específico e para onde isso já foi enviado, o sistema responde em minutos?
Se não responde, a implementação está incompleta.

---

## 8. Incidente

1. Contenção imediata e preservação de evidência
2. Registro do que vazou, de quantos titulares, e por qual caminho
3. **Comunicação à escola controladora** — ela é quem notifica a ANPD e os titulares.
   Nosso prazo interno: 24 horas da detecção
4. Correção, teste que prova a correção, e post-mortem escrito
5. Todo incidente vira um teste de regressão permanente

Ter esse processo escrito antes do primeiro cliente é o que separa um problema
administrável de uma crise.

---

## 9. Antes do primeiro cliente real

- [ ] Contrato de tratamento de dados com a escola, feito por advogado
- [ ] Contrato com provedor de IA vedando treinamento
- [ ] Política de privacidade e termos, com seção de menor de idade
- [ ] Encarregado (DPO) indicado e canal de contato publicado
- [ ] Relatório de impacto (RIPD) — obrigatório na prática aqui: dado de menor, volume
      alto, decisão apoiada por IA. Exigido pelo ECA Digital, art. 16, parágrafo único
- [ ] **Avaliação de Impacto Algorítmico** de cada funcionalidade de alto risco — Tutor,
      correção de objetiva, diagnóstico por habilidade, sinais e alertas, adaptação —, no
      roteiro de seis etapas de `docs/conformidade-mec.md` seção 7 (D60)
- [ ] **Dossiê de conformidade** entregue à escola: declaração de propósito com faixas
      etárias, documentação do funcionamento em linguagem simples, relatório de conformidade
      LGPD + ECA artigo por artigo, RIPD, AIA e relatório de uso legível (D61)
- [ ] **Aviso de privacidade em linguagem de faixa etária**, para aluno de 11 anos, exigido
      pelo ECA Digital (art. 16) e pelas cláusulas sugeridas pelo MEC. Não existe hoje
- [ ] **Canal de notificação de violação** no produto, com retirada e recurso (D61)
- [ ] **Exportação em formato aberto** de dado, artefato e histórico de uso pela própria
      coordenação (D63)
- [ ] Parecer sobre o ECA Digital (Lei 15.211/2025) aplicado a plataforma contratada pela
      escola
- [ ] Guarda de registro de acesso por 6 meses (Marco Civil), separada da auditoria
- [ ] Base legal e desenho dos indicadores de professor revisados por advogado (D45)
- [ ] Rotina de expurgo implementada e testada
- [ ] Restauração de backup executada de verdade, não documentada
- [ ] Teste de isolamento entre escolas rodando na esteira
