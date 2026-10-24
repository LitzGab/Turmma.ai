## Checklist de coleta

- [ ] Todo campo pessoal novo está na tabela de dados de `docs/lgpd.md`, com finalidade e retenção
- [ ] Nenhum campo proibido para aluno: e-mail, telefone, CPF, foto, endereço, nascimento, diagnóstico
- [ ] Necessidade específica guardada como adaptação, não como diagnóstico

## Checklist de exposição — os furos que mais vazam

- [ ] DTO de saída explícito; nenhuma entidade serializada inteira
- [ ] Autorização **por objeto**, não só por rota. Troque o id na URL mentalmente: quem não
      pode, consegue?
- [ ] "Não encontrado" e "sem permissão" respondem igual
- [ ] Arquivo em bucket privado, com URL assinada de validade curta
- [ ] Convite com expiração, uso único e revogação
- [ ] Exportação registrada em auditoria, com escopo e finalidade
- [ ] Erro sem stack trace e sem dado no corpo

## Checklist de log e rastro

- [ ] Nenhum log com nome, matrícula, resposta, nota, conversa ou prompt
- [ ] Auditoria presente onde a regra exige: leitura de dado de aluno por coordenador ou
      rede, exportação, alteração de nota, alteração de permissão, aprovação de saída de IA

## Checklist de IA

- [ ] Envio externo com o mínimo, identificador em vez de nome
- [ ] Envio registrado em `ExecucaoAgente`
- [ ] Sem contrato vedando treinamento, o provedor usado é o local
- [ ] Conversa de tutor não alcançável pela camada de rede

## Checklist de ciclo de vida

- [ ] Exclusão lógica e auditada; eliminação do titular apaga de fato
- [ ] Retenção respeitada e configurável por escola
- [ ] Nenhum dado real em seed, fixture ou ambiente de desenvolvimento

## Pergunta de fechamento

Se a secretaria de educação pedisse hoje tudo o que o sistema guarda sobre um aluno
específico e para onde isso já foi enviado, o código responde? Se não responde, REPROVADO.
