# Regra 40 — Testes

## Por que esta regra existe

Em um sistema escolar, o custo de um bug não é uma tela feia: é a nota errada de um aluno,
é um aviso de falta enviado à família errada, é dado de uma escola aparecendo em outra.
Nenhum desses erros aparece em teste de fumaça que só verifica se a rota respondeu.

Além disso, três dos nossos portões de qualidade são auditorias de segurança e
conformidade. Elas dependem de existir teste que prove o comportamento, não teste que prove
que o código roda.

## O que conta como teste aqui

A pergunta que decide: **se eu apagar a regra de negócio, este teste falha?** Se não falha,
não é teste, é decoração.

```ts
// não é teste: prova que o servidor está de pé
it('cria avaliação', async () => {
  const r = await api(token).post('/avaliacoes').send(payload)
  expect(r.status).toBe(201)
})

// é teste: prova a regra que importa
it('nota não é criada sem autor humano, mesmo vindo do agente', async () => {
  const correcao = await agenteCorretor.corrigir(avaliacao.id)
  expect(correcao.status).toBe('pendente')
  const notas = await repo.notasDa(avaliacao.id)
  expect(notas).toHaveLength(0)
})
```

## As camadas

| Camada | Para quê | Com o quê |
|---|---|---|
| Unidade | regra pura, cálculo, validação | sem banco |
| Integração | service + repository, o grosso do valor | Postgres real em container |
| E2E | o fluxo como o usuário faz | Playwright |
| Isolamento | escola A não alcança escola B | integração, obrigatório por módulo |

Mock de coisa nossa, quando dá para usar a coisa nossa, esconde justamente o erro que
importa. Mock é para o que está fora: provedor de IA, e-mail, storage externo.

## Os fluxos que exigem E2E

Onboarding completo (coordenador cria turma, sobe lista, professor convida, aluno
reivindica, professor aprova), importação de planilha suja, aplicação e correção de
avaliação em cada modo, aprovação de entrega de agente, login por matrícula, tutor
recusando entregar resposta.

## Casos de borda que este domínio sempre tem

Não invente casos genéricos. Use os que a escola produz de verdade:

aluno transferido no meio do bimestre · dois alunos com o mesmo nome na turma · aluno que
chega em maio · professor que dá duas disciplinas na mesma turma · turma sem professor
alocado · feriado no dia da prova · aluno que faltou à avaliação · planilha com a turma
escrita de três jeitos · matrícula repetida em escolas diferentes · virada de ano letivo ·
nota alterada depois de lançada · prova fotografada torta ou com sombra · aluno tentando
arrancar a resposta do tutor de três formas diferentes.

E os de carga, que só aparecem com a escola inteira usando ao mesmo tempo (regra 80):

dois alunos reivindicando o mesmo nome no mesmo segundo · professor clicando duas vezes em
aprovar o lote · job de correção executado duas vezes · rede da escola caindo no meio da
prova · 35 logins do mesmo IP em um minuto · provedor de IA recusando por limite no meio da
aula · uma escola ingerindo 300 apostilas enquanto outra usa o tutor.

## Testar coisa que é probabilística

Correção por IA, OCR e classificação por habilidade da BNCC não são determinísticos. Eles
são testados com um **conjunto fixo de amostras** e uma taxa de acerto mínima declarada. Se
a taxa cai abaixo do limite, a tarefa falha como qualquer outro teste vermelho.

Nenhum teste automatizado chama provedor pago. O adaptador falso devolve resposta fixa; o
Ollama local cobre o que precisa de modelo de verdade.

## O que é proibido

`.skip`, teste comentado, `any` para calar o compilador, asserção que sempre passa, e
desabilitar teste para "destravar a tarefa". Teste vermelho é informação, não obstáculo.

## O portão

`npm run typecheck`, `npm run test` e `npm run lint` limpos. Tocou tela, também
`npm run test:e2e`.

Na tarefa e na correção, o portão roda por `node tools/processo/portao-local.ts` (com `--e2e`
e `--infra` quando se aplicam), que grava o carimbo que o hook exige antes do commit (D53).

Mexeu em infra, também `npm run test:infra` (D52): a tarefa com `infra-guardian`
obrigatório, e a que toca `infra/`, Dockerfile, `tools/testes/`, `tools/ci/compose.ts`,
métricas, saúde, prontidão ou borda. São os testes que esperam o relógio real (alerta,
sonda, exportação de métricas), uns 16 min. Fora do portão da tarefa eles não somem: a
esteira os roda em todo push no `main`, e vermelho lá segura a próxima tarefa.

Cada commit de tarefa vai para o GitHub logo depois de feito, e a tarefa seguinte só commita
com a esteira do commit anterior verde. Push em grupo e tarefa commitada em cima de esteira
vermelha foram o que deixou três tarefas do F0 sem portão (validação do F0).
