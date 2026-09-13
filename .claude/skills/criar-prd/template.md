> Formato obrigatório do PRD. Para calibrar o nível de detalhe esperado, veja
> `.claude/skills/criar-prd/exemplo-preenchido.md`.

# PRD — [nome da funcionalidade]

**Status:** rascunho | aprovado
**Funcionalidade do roadmap:** [F?]
**Depende de:** [F?, F?]

## 1. Problema

Qual dor real, de qual papel, em qual momento da rotina escolar. Duas ou três frases.
Se não dá para nomear a pessoa que sofre com isso, o problema não está claro.

## 2. Objetivo

O que muda quando isso existir. Uma frase.

## 3. Fora de escopo

Lista explícita do que esta funcionalidade **não** faz. Esta seção evita mais retrabalho
que qualquer outra.

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Rede | | |
| Coordenador | | |
| Professor | | |
| Aluno | | |
| Responsável | | |

Papel que não participa fica de fora da tabela.

## 5. Requisitos funcionais

Numerados, verificáveis, sem descrever implementação.

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | | |
| RF2 | | |

## 6. Regras de negócio

Regras do domínio escolar que a funcionalidade precisa respeitar. Nota com autor humano,
escopo de ano letivo, matrícula única por escola, e o que mais se aplicar.

## 7. Casos de borda

Os do domínio, não os genéricos. Aluno transferido, turma sem professor, feriado no dia da
prova, planilha suja, virada de ano letivo, aluno que perdeu a avaliação.

| Caso | Comportamento esperado |
|---|---|

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|

Campo novo exige atualizar `docs/lgpd.md`. Se não dá para justificar a finalidade em uma
linha, não colete.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Classificação CNE: moderado | alto | proibido. Onde está a aprovação humana. Como o
professor supervisiona. Ver `docs/regulacao.md`.

## 9. Métricas

Como saberemos que funcionou. Prefira medida de uso real a opinião.

## 10. Perguntas em aberto

O que ficou sem resposta e que a Tech Spec vai herdar.
