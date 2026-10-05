# Correção — o e2e "segunda pessoa" cria a alocação depois de a Nova conversa já ter lido os vínculos

**Origem:** esteira run 37324214757 (e2e 3/4, celular, e a reexecução do mesmo job) e esteira run 37330163372 (e2e 1/4,
chromebook), na `develop`, sobre `e98a21b` e `cd4dc8d`, que só mudaram `.md`
**Subagentes obrigatórios:** nenhum guardião pela natureza (só o e2e e o `TODO.md`; não muda código de produção, a
esteira nem o ambiente)

## Sintoma

`e2e/areas.spec.ts:381` › "recomeço da tela" › "segunda pessoa: a coordenação entra na aba do professor sem o item nem o
dado dele" falhou três vezes seguidas, nos dois projetos, na linha 385:

```
Error: expect(locator).toContainText(expected) failed
  - unexpected value "TurmasA coordenação ainda não alocou você…"
> 385 |     await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
```

Já tinha falhado uma vez no chromebook na esteira 37302975647, e passado na reexecução (`TODO.md`, "E2e intermitente
'segunda pessoa'"). A última esteira verde da `develop` foi a 37314413907, no `13eab64`.

## Causa

Corrida entre a tela e a fixture, nascida no MVP. O teste entra como professora (`entrarComoProfessora`, que espera a
Nova conversa) e **só depois** grava a alocação direto no banco (`criarAlocacaoDoProfessor`). Desde a A2 a Nova conversa
lê `GET /v1/meus-vinculos` ao abrir (`apps/web/src/areas/professor/Home.tsx`, `consultaMeusVinculos`). Quando essa
leitura chega ao banco antes da inserção, a lista vazia fica no cache do TanStack Query, fresca por 30 s (`staleTime` de
`apps/web/src/api/cliente-de-consultas.ts`), e "Turmas", aberta logo depois, monta com o cache sem reler: mostra "A
coordenação ainda não alocou você". Quando a inserção chega antes, o teste passa. Na A1 o teste era determinístico porque
"Turmas" era a primeira tela a ler os vínculos.

Não é defeito do produto que o teste guarda: o que ele prova é que a coordenação, entrando na mesma aba, não vê o item
nem o dado da professora. Que a alocação feita pela coordenação com a professora já na Nova conversa leve até 30 s para
aparecer em "Turmas" vem do `staleTime` padrão do cliente de consultas, um padrão técnico e não uma decisão de produto;
hoje não é requisito que ela apareça antes. Fica no `TODO.md`, com o e2e que provaria a mudança, porque o vazio da Nova
conversa leva justamente a "Turmas" ("Ir para Turmas"), e o vazio de "Turmas" não tem como reler.

É o mesmo mecanismo dos dois e2e da troca de escola corrigidos no `ad7c3f0` ("a lista de vínculos saía do cache da Nova
conversa"). Nenhum outro spec entra como professora e cria a alocação depois sem forçar uma releitura: o W4 de "Turmas"
cria a alocação depois, mas relê pelo "Tentar de novo".

## Teste que reproduz

`e2e/areas.spec.ts` › "recomeço da tela" › "segunda pessoa: …", com uma espera a mais logo depois da entrada: a Nova
conversa mostrar "Falta uma turma confirmada", o vazio dela, que só aparece com a leitura dos vínculos já de volta. Assim
a leitura sempre vence a inserção, que é o caso que a esteira pegou, e o teste fica vermelho na linha 385 em toda
execução.

Rodado em 05/10/2026 contra o ambiente completo (`educa-teste`, build com a galeria, como o `ci:e2e`): **vermelho nos
dois projetos**, `chromebook` e `celular`, na asserção do nome da turma, com "A coordenação ainda não alocou você" na
tela. A espera foi só a reprodução e saiu na correção.

## Correção

`e2e/areas.spec.ts`: o teste cria a professora e a alocação **antes** de entrar (`criarEquipeComSenha`,
`criarAlocacaoDoProfessor`, depois `entrarPorEmail` e `esperarNovaConversa`), em vez de entrar e alocar depois. Toda
leitura de vínculos da sessão já encontra a alocação, e não há corrida. O resto do teste, que é o que ele prova (a
coordenação na mesma aba sem o item nem o dado da professora, e sem reler os vínculos dela), não muda. O produto não
muda: ver "Causa".

Evidência no lugar do vermelho intermitente: o teste corrigido passou **20 de 20** (`--repeat-each=10`, nos dois
projetos). Os outros intermitentes do `TODO.md` foram rodados junto, sem mudança: o W4 de "Turmas" passou 10 de 10, e o
`e2e/troca-de-escola.spec.ts` inteiro, 80 de 80 (`--repeat-each=5`); os dois da troca de escola já tinham sido
corrigidos no `ad7c3f0` pela mesma causa. O W4 não reproduziu e não tem causa conhecida: continua com uma linha aberta no
`TODO.md`.

Recomendações do `test-engineer` (rodada 1), aplicadas: a demora da alocação nova em "Turmas" e o W4 sem causa
conhecida viraram itens do `TODO.md`, e a "Causa" deixou de chamar o `staleTime` de comportamento declarado.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-05 12:48:22 | 2026-10-05 12:50:45 | `test-engineer` | 1 | APROVADO | ac793401dda29ae1c |
