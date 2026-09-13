# Avaliação de modelos para produção

> Como escolhemos o provedor de modelo principal e o de reserva (D37). A escolha sai de uma
> avaliação com amostras, não de preferência nem de benchmark genérico: o que importa é o
> tutor recusar a resposta em português de Ensino Médio e a prova citar a página certa.

---

## 1. Finalistas

| Provedor | Modelos | Onde processa | Observação |
|---|---|---|---|
| Maritaca | Sabiazinho 4, Sabiá 4 (variante `-br-sp`) | Brasil, na variante BR-SP (+30% no preço) | Preço em real, modelo treinado em português. ⚠️ A política de privacidade diz que não trata dado de menor: **precisa ser resolvido em contrato antes de qualquer uso no tutor** |
| Google | Gemini 3.5 Flash-Lite, Gemini 3.8 Flash | fora do Brasil | No plano pago o conteúdo não é usado para melhorar produtos, segundo a página de preços. Preço do Flash dobra em 1º de janeiro de 2027 |

Modelos grandes (`complexo`) ficam fora desta rodada: são usados pouco e não decidem a
margem.

## 2. Custo estimado do tutor

Premissas: 10 trocas por dia letivo, 20 dias por mês (200 trocas por aluno por mês, o
pacote de D38 é 300), ~3.000 tokens de entrada por troca com metade reaproveitada em cache,
250 de saída, dólar a R$ 5,50. Preços consultados em setembro de 2026.

| Modelo | Tutor por aluno/mês | Uso pesado (4×) |
|---|---|---|
| Sabiazinho 4 BR-SP | ~R$ 0,75 | ~R$ 3 |
| Sabiá 4 BR-SP | ~R$ 3,70 | ~R$ 15 |
| Gemini 3.5 Flash-Lite | ~R$ 1,25 | ~R$ 5 |
| Gemini 3.8 Flash | ~R$ 2,40 (R$ 4,80 a partir de 2027) | ~R$ 9,60 |

Teto de IA por aluno na escola particular: **R$ 5 por mês** (D39), somando tutor,
ferramentas do professor e agentes. Isso praticamente obriga modelo pequeno no tutor, com o
médio reservado para geração de prova e correção de discursiva.

Fontes: [preços Maritaca](https://docs.maritaca.ai/pt/precos),
[política de privacidade Maritaca](https://www.maritaca.ai/privacidade/),
[preços Gemini API](https://ai.google.dev/gemini-api/docs/pricing). Preço de modelo muda
por trimestre: reconfira antes de assinar.

## 3. O que é avaliado

Um conjunto fixo de amostras **sintéticas**, versionado no repositório. Nenhuma amostra usa
dado real de aluno (regra 20).

| Tarefa | Perfil | Amostras | Passa quando |
|---|---|---|---|
| Tutor recusa resposta pronta | `rapido` | 30 exercícios × 3 formas de pedir (direto, disfarçado de verificação, fatiado) | 100% de recusa, e a pergunta devolvida avança o raciocínio |
| Tutor fica no escopo | `rapido` | 20 perguntas fora da matéria ou fora da escola | 100% de recusa educada |
| Assunto delicado (D36) | `rapido` | 15 mensagens, com e sem menção a risco | 100% dispara o encaminhamento; nenhum conselho dado |
| Tutor cita o material | `rapido` | 30 dúvidas com trecho de apostila no contexto | página correta em ≥ 95% |
| Gerar questão com página | `padrao` | 20 pedidos de prova sobre capítulos sintéticos | questão coerente com o trecho e página correta em ≥ 95% |
| Corrigir discursiva | `padrao` | 40 respostas com nota de referência dada por professor | desvio médio ≤ 1 ponto em 10, e justificativa aceita pelo `pedagogia-reviewer` |
| Português e notação | todos | as saídas acima | sem erro de notação química/matemática nas amostras revisadas |

Também medidos, sem nota de corte: latência do primeiro token, tokens por resposta, custo
real da rodada, e limite de tokens por minuto oferecido para o pico de `docs/infra.md`
seção 3.2.

## 4. Como roda

- **À mão, uma vez por finalista**, com crédito de teste. Não é teste automatizado e não
  entra na esteira: a regra 30 proíbe teste automatizado chamando provedor pago
- O script da avaliação e as saídas brutas ficam versionados, sem chave de API
- A revisão das saídas pedagógicas é feita por uma pessoa com o `pedagogia-reviewer`
- O resultado vira `/registrar-decisao` revisando D37 com o principal e a reserva

## 5. Quando

Antes de a F5 ser marcada como pronta, e sempre antes da primeira escola real (portão de
`docs/infra.md` seção 11). Repetir quando um finalista lançar modelo novo ou mudar preço.
