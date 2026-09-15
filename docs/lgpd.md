# LGPD — documento de referência do Educa.ia

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
| **Suboperador** | Provedor de IA, hospedagem, e-mail | Só entram com contrato que replique nossas obrigações. |

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
| Identificador opaco da conta Google ou Microsoft da escola (nunca e-mail nem foto) | aluno, professor | login e importação de turma (D48) | execução de contrato | enquanto houver vínculo |
| Resposta de avaliação | aluno | correção e devolutiva | execução de contrato educacional | ano letivo + 1 ano |
| Diagnóstico por habilidade | aluno | acompanhamento pedagógico formativo (D46) | idem | ano letivo + 1 ano (proposta, a confirmar com a escola) |
| Nota | aluno | registro escolar | obrigação legal da escola | conforme norma da escola |
| Conversa com o tutor | aluno | aprendizagem e supervisão docente | legítimo interesse da escola em supervisão pedagógica | 12 meses |
| Sinais de uso de IA | aluno | supervisão docente | idem | 12 meses |
| Adaptação pedagógica necessária (ex.: fonte ampliada, tempo extra) — **nunca diagnóstico** | aluno | adaptar prova e atividade (agente Adaptador) | dado sensível (art. 11), via obrigação da escola com inclusão; **a confirmar com advogado** | enquanto houver vínculo; revista a cada ano letivo |
| Sinal "precisa de atenção humana" (sem conteúdo) | aluno | encaminhar a um humano o aluno que pediu ajuda pessoal | proteção do titular, melhor interesse (art. 14) | 12 meses |
| Nome, e-mail | professor, coordenador | acesso e responsabilidade | execução de contrato | vigência + 5 anos |
| Indicadores de uso e das turmas do professor | professor | apoio pedagógico ao próprio professor e visão agregada da coordenação; **nunca decisão sobre o professor** (D45) | execução de contrato; **a confirmar com advogado** (CLT, convenção coletiva, estatuto do servidor) | ano letivo + 1 ano (proposta) |
| Conversa do professor com o chat | professor | produzir o que ele pediu | execução de contrato | 12 meses (proposta); nunca visível à coordenação |
| Nome, e-mail, telefone | responsável | comunicação escolar | execução de contrato | vigência do vínculo |
| Hash de senha (argon2id) | aluno, professor, coordenador | autenticar (F1) | execução de contrato; segurança (art. 46) | até desativar a credencial |
| E-mail de login na conta global | professor, coordenador | autenticar em uma ou mais escolas (F1) | execução de contrato | enquanto houver `usuario` ativo em alguma escola; a eliminação pedida por uma escola apaga só o `usuario` dela |
| Segredo TOTP cifrado e HMAC dos códigos de recuperação | coordenador | segundo fator (F1) | execução de contrato; segurança (art. 46) | até desativar a conta ou redefinir o MFA |
| Sessão (horários de início, uso e fim, método, motivo de encerramento) | todos | manter e encerrar o acesso, inatividade (F1) | execução de contrato | 30 dias após encerrar |
| Contador de tentativas de login (HMAC do identificador) | todos | proteção contra força bruta (F1) | legítimo interesse, segurança | 15 minutos |
| Cookie de dispositivo (até 50 HMACs com chave de escola+matrícula ou de e-mail que já entraram naquele navegador, sem nome; o servidor não guarda nem lê identidade a partir dele) | aluno, professor, coordenador | manter a prioridade de login de quem já entrou quando há ataque na rede da escola (F1); nenhum outro uso | legítimo interesse, segurança (art. 46), no melhor interesse do titular (art. 14) | 30 dias por entrada, no navegador |
| Vínculo, estado e datas | professor, aluno | acesso por objeto (F1) | execução de contrato | vigência + 5 anos |
| Motivo de contestação de vínculo (código e complemento de até 140 caracteres, sem nome de aluno) | professor | corrigir a alocação (F1) | execução de contrato | fim do ano letivo; nunca em log nem em auditoria |
| Convite de coordenador (hash do token, datas) | coordenador | primeiro acesso (F1) | execução de contrato | 30 dias após usar, revogar ou expirar |
| Identificador do operador Educa.ia na auditoria | nossa equipe | prestação de contas à escola | legítimo interesse | vigência + 5 anos |
| Registro de acesso à aplicação (IP, data e hora) | todos | segurança | obrigação legal (Marco Civil, art. 15) | 6 meses |
| Auditoria (quem fez o quê, com finalidade) | todos | prestação de contas à escola e ao titular | execução de contrato e obrigação da escola | vigência + 5 anos |

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
  adaptação precisar dele, guarde a *adaptação necessária*, não o diagnóstico
- Resposta de prova não precisa virar perfil comportamental

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
2. **Envie o mínimo.** O tutor precisa do conteúdo da dúvida e do material da turma, não do
   histórico de notas do aluno.
3. **Prefira identificador a nome.** O modelo não precisa saber que é a Maria.
4. **Registre todo envio externo** em `ExecucaoAgente`: o que foi enviado, para qual
   modelo, quanto custou, quem aprovou o resultado.
5. **Nada de treinar modelo próprio com dado de escola** sem nova base legal e instrução
   expressa. Isso inclui ajuste fino e memória de longo prazo entre escolas.
6. **Conversa do tutor é dado sensível na prática**, mesmo que a lei não a classifique
   assim: aluno escreve coisas que não escreveria em prova. Retenção curta, acesso
   restrito ao professor da turma, nunca exposta à rede.

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
      alto, decisão apoiada por IA. Inclui a avaliação de impacto do ECA Digital e a
      avaliação de impacto algorítmico dos sinais do tutor e dos alertas sobre aluno
- [ ] Parecer sobre o ECA Digital (Lei 15.211/2025) aplicado a plataforma contratada pela
      escola
- [ ] Guarda de registro de acesso por 6 meses (Marco Civil), separada da auditoria
- [ ] Base legal e desenho dos indicadores de professor revisados por advogado (D45)
- [ ] Rotina de expurgo implementada e testada
- [ ] Restauração de backup executada de verdade, não documentada
- [ ] Teste de isolamento entre escolas rodando na esteira
