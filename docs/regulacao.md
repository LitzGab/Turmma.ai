# Regulação que vira requisito

Não é contexto de fundo. Cada item abaixo já é uma regra implementável.

## 1. Diretrizes do CNE sobre IA na educação (aprovadas em 01/09/2026)

Prazo de adequação: 12 meses. Ou seja, tudo que construirmos já nasce dentro do prazo — e
isso é argumento de venda, não só obrigação.

| Classificação | O que significa para o produto |
|---|---|
| **Risco moderado — permitido** | Tutor digital e personalização de aprendizagem. Nosso ambiente do aluno cabe aqui, **desde que supervisionado** |
| **Alto risco — exige supervisão humana** | Correção automática e atribuição de nota. Logo: a IA corrige, mas **a nota só existe quando um humano aprova** |
| **Proibido** | Decisão autônoma de aprovação ou reprovação. O sistema não pode nem oferecer esse botão |
| **Vedado** | IA generativa sem supervisão na educação infantil e anos iniciais. Nosso recorte é Ensino Médio; se um dia descermos de faixa, este item volta |

**Requisitos derivados:**

- `Nota` só é gravada com `lancadaPor` humano preenchido
- Toda saída de IA que afeta o aluno passa por fila de aprovação, com autor e data
- Auditoria mostra o que a IA gerou, quem aprovou e quando
- O tutor do aluno é sempre visível ao professor: modo sala em tempo real, modo casa com
  registro e resumo
- Nenhuma funcionalidade decide aprovação, reprovação ou encaminhamento sozinha

## 2. Lei 15.100/2025 — celulares na escola

Aparelho fora da sala de aula.

**Requisitos derivados:** ambiente do aluno é **web, em Chromebook**. Nada de app de
celular na fase inicial. Nada de fluxo que dependa do aluno ter telefone — nem para
autenticar, nem para receber código, nem para fotografar.

## 3. LGPD

Ver `docs/lgpd.md`, que é o documento operacional. Em resumo: escola controladora, nós
operadores, dado de menor com proteção reforçada, sem treinamento de modelo com dado de
escola, direitos do titular atendidos por código.

## 4. Material didático de terceiro

A ingestão aceita o material que a escola **já paga**. Isso é defensável e é o que dá
valor ao produto — mas só dentro destas condições, que valem como regra técnica:

- A escola autoriza por escrito, e a autorização fica registrada no sistema
- As credenciais usadas são **da escola**, fornecidas por ela, nunca obtidas por nós
- O conteúdo ingerido fica **restrito ao tenant daquela escola**. Nunca é reaproveitado
  para outra escola, nem vira banco de questões nosso
- Não contornamos pagamento, bloqueio técnico nem termo de uso de terceiro
- Se uma fonte proibir expressamente, aquela fonte sai e o upload manual cobre o caso

**Se essas condições não puderem ser satisfeitas para uma fonte, a resposta é upload
manual pela escola — não um caminho alternativo mais criativo.** O comprador aqui é um
coordenador que precisa confiar em nós; um processo por violação de contrato de sistema de
ensino mata a venda em toda a rede.

## 5. Dado que a escola é obrigada a guardar

Registro escolar tem prazo de guarda próprio, definido pela norma da rede. Nossa retenção
não pode ser mais curta que a obrigação da escola nem mais longa que o necessário. A
tabela de retenção em `docs/lgpd.md` é o lugar onde isso é resolvido, e cada rede pode
pedir ajuste — o prazo precisa ser configurável por escola.
