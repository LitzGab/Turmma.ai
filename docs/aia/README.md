# Avaliações de Impacto Algorítmico (AIA)

> Uma AIA por funcionalidade de alto risco, escrita **antes do PRD** dela (D60), no roteiro de
> seis etapas de `docs/conformidade-mec.md` seção 7. Um arquivo por avaliação, nesta pasta.
> O Joaquim escreve o rascunho da **etapa 1** (justificação e escopo, com o escopo negativo) e
> o Gabriel revisa. A AIA é revista a cada troca de modelo ou mudança relevante de prompt.

No MVP de apresentação (D71), enquanto o dado for sintético, basta a **etapa 1** antes do PRD da
fatia; as seis etapas vêm antes do primeiro aluno real. A lista acompanha os seis agentes da D32
revista. Rotina de abrir o dia (Planejador) e apoio ao
preparo de aula (Assistente de ensino) não são alto risco e não têm AIA.

| Arquivo | Cobre | Antes do PRD de | Estado |
|---|---|---|---|
| `tutor.md` | Tutor com o aluno: conversa socrática, **memória de toda a trajetória do aluno no sistema**, feita do registro do trabalho, e leitura do tipo de adaptação (D66), **busca em fontes aprovadas** (D68), encaminhamento de assunto delicado (D36) | F9 | a escrever |
| `sinais-e-alertas.md` | O que o Tutor avisa ao professor, "aluno que precisa de atenção" em "Minhas turmas" (D69) e os alertas do Analista de desempenho escolar. Carrega a pergunta aberta: acompanhar saída da aba **fora** de avaliação (hoje não existe) | F6 (a parte de "Minhas turmas"), F10 e F12 | a escrever |
| `correcao-de-objetiva.md` | Corretor nas objetivas, registro da validação (D56) e **saída da aba durante a prova** (D70), com o risco de falso positivo em quem usa leitor de tela ou teclado virtual | F6 | a escrever |
| `diagnostico-por-habilidade.md` | Diagnóstico formativo por habilidade (D46), que alimenta a memória do Tutor e "Minhas turmas" | F6 | a escrever |
| `adaptacao.md` | Adaptador e a ferramenta Adaptação: recebe o tipo de adaptação, nunca a condição nem texto livre sobre o aluno (D35, D67) | F7 | a escrever |

## O que toda AIA daqui precisa ter

1. **Escopo negativo**: o que aquele agente não faz. Comece pelo nível 4 de `docs/agentes.md`.
2. **O dado que entra e o que sai para terceiro**, com a linha correspondente do mapa de
   `docs/lgpd.md`. Conversa de aluno só em provedor com processamento no Brasil (D62).
3. **Equidade com a limitação declarada**: não guardamos raça, renda nem território, então a
   desagregação possível é por turma, série e escola, com escuta de professor
   (`docs/conformidade-mec.md` seção 8).
4. **Explicação em linguagem comum e caminho de contestação**, para o aluno e para o professor.
5. **Procedimento de suspensão**: como desligar o agente numa escola, quem decide e o que
   acontece com o que ele já produziu.
