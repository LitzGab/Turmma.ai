# Correção — Docs ainda citam "Seu time", que não existe mais

**Origem:** validacao.md de telas-do-professor (§4, achado A4)
**Subagentes obrigatórios:** `conformidade-reviewer`, `revisor-geral`
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Desde a tarefa 2.0 o professor não tem mais o grupo "Seu time" na lateral: o que espera a decisão dele está no **sino** ("Esperando você"), e o pé do sino ("Acompanhar a IA") abre **"O que o Assistente fez"** e **"O que o Tutor viu"**; os sinais do Tutor aparecem na aba **Hoje** da turma ("Sinais da turma"). Mas o roteiro operacional da demonstração manda "Ver e decidir em Seu time" (`docs/roteiro-da-demonstracao.md:180`) e "Professora → Seu time → Tutor" (`:227`), caminhos que não existem, e outros seis documentos (`docs/glossario.md`, `docs/agentes.md`, `docs/fluxos.md`, `docs/aia/sinais-e-alertas.md`, `docs/aia/correcao-de-objetiva.md`, `docs/aia/adaptacao.md`) ainda citam "Seu time" como lugar atual.

## Fora desta correção

Nada: nenhum arquivo de tarefa em curso. Ficam como estão, por serem registro histórico e não descrição do produto: `docs/decisoes.md`, `docs/interface.md`, `docs/mvp-rapido.md`, `docs/pendencias-dos-mockups.md`, `docs/regulacao.md`, `ROADMAP.md`, `TODO.md`, os `tasks/` anteriores e os comentários de código.

## Causa

A tarefa 2.0 tirou "Seu time" da lateral e do código, e os documentos que descrevem a tela para uma pessoa (o roteiro que o Joaquim lê ao vivo, o glossário, os agentes, o fluxo e as AIAs) não foram revistos junto: o critério de pronto da 2.0 olhava `docs/interface.md`.

## Teste que reproduz

Não há comportamento do produto a reproduzir: o defeito é texto. A evidência que substitui o vermelho é a busca, antes e depois:
`grep -n "Seu time" <os sete documentos>` — antes, 14 linhas; depois, nenhuma.

## Correção

Cada citação foi trocada pelo que está no código (`SinoDoProfessor.tsx`: pé "Acompanhar a IA" com "O que o Assistente fez" e "O que o Tutor viu"; `TurmaHoje.tsx`: "Sinais da turma" e "Ver o uso do Tutor por aluno", que abre o painel "O que o Tutor viu"), sem mudar o que o texto afirma sobre a regra:

- `docs/roteiro-da-demonstracao.md:180` e `:227`: o caminho passa a ser o sino, o pé e o nome da tela; no 227 a soma de "Sinais da turma" vem sem nome, e o nome da Ana e as trocas de hoje saem de "Ver o uso do Tutor por aluno" ("Ver quem" só existe no aviso de atenção humana, que esta cena não gera); o roteiro diz que "abre a aba Hoje" vale porque a professora tem uma turma só;
- `docs/glossario.md` ("Feed de agentes"): só "O que o Assistente fez" é thread; o Tutor fala na aba Hoje e no painel por aluno; o "não-lidos" saiu porque a tela não o tem;
- `docs/agentes.md` (3 linhas), `docs/fluxos.md`, `docs/aia/sinais-e-alertas.md` (5 linhas), `docs/aia/correcao-de-objetiva.md`, `docs/aia/adaptacao.md`: "O que o Tutor viu", "O que o Assistente fez" ou a aba Hoje, conforme a tela que cada frase descreve ("O que o Tutor viu" é o painel por aluno dentro da aba Hoje, e a voz do Tutor é a soma da aba); na AIA de sinais, o tempo real distingue os sinais (relidos a cada 15 s) do uso por aluno (lido ao abrir); "como se confere" continua apontando para a leitura das telas onde o sinal aparece.

Nenhuma cláusula nova, por isso não há seção "Mutações".

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (2ª), conformidade-reviewer (2ª) | `docs/roteiro-da-demonstracao.md:229`: o roteiro escreve o título entre aspas curvas (“Atividade — Reagente limitante”), mas a tela usa aspas retas (`sinais.ts:28`); "vale usar as aspas da tela ou não usar aspas" | Recusada nesta correção, com o motivo: é pontuação, e a correção foi aprovada pelos três. Um ciclo de três revisores não compensa. Fica para quem revir o roteiro: o resto do documento usa aspas retas (64 ocorrências contra 2 curvas) |
| revisor-geral (2ª), conformidade-reviewer (2ª) | `docs/aia/sinais-e-alertas.md:387`: "lido uma vez, ao abrir" não é exato, porque a consulta também relê quando a janela volta ao foco (`staleTime` de 30 s e `refetchOnWindowFocus` padrão, `cliente-de-consultas.ts:22-26`); "basta escrever 'lido ao abrir o painel, sem releitura periódica'" | Recusada nesta correção, com o motivo: o texto distingue os sinais (a cada 15 s) do uso por aluno, que é o que a recomendação da rodada 1 pedia, e a imprecisão restante não muda o que o documento afirma sobre a regra. Destino sugerido ao Orquestrador: `TODO.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 19:05:42 | 2026-10-19 19:07:04 | `revisor-geral` | 1 | REPROVADO | ade95b9100ca5ed0e |
| 2026-10-19 19:05:44 | 2026-10-19 19:07:15 | `test-engineer` | 1 | REPROVADO | a112bf2c16f68db76 |
| 2026-10-19 19:05:41 | 2026-10-19 19:07:20 | `conformidade-reviewer` | 1 | REPROVADO | a4fb9c08e9414d3a4 |
| 2026-10-19 19:11:39 | 2026-10-19 19:12:34 | `test-engineer` | 2 | APROVADO | a97de10c63589d57e |
| 2026-10-19 19:11:35 | 2026-10-19 19:12:40 | `revisor-geral` | 2 | APROVADO | a7efcaa52eec7a636 |
| 2026-10-19 19:11:30 | 2026-10-19 19:12:55 | `conformidade-reviewer` | 2 | APROVADO | a40edfb1cb6cddb9b |
