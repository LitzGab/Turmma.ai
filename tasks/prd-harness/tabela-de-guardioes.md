# Tabela de caminho para guardião (X7, RF15 e RF16)

Detalhe da Tech Spec §5(b) e §5(e). A fonte que vale é `tools/processo/guardioes-por-caminho.ts`. T é
`tenancy-guardian`, P é `privacy-guardian`, C é `conformidade-reviewer` e I é `infra-guardian`.

## O padrão: os quatro

Decisão do Joaquim, 23/10/2026, na rodada 2 da revisão da spec: a tabela fina por pasta não convergia, porque cada
rodada achava pasta nova que devia pedir um guardião. **Todo arquivo em `apps/**`, `packages/**`, `e2e/**` e
`tools/guardas/**` pede T P C I**, testes e fixtures inclusive. Pasta nova nasce protegida. O que pede menos é exceção
escrita abaixo, com o motivo, e mexer na exceção pede os quatro (o próprio `guardioes-por-caminho.ts` está na lista).

Regras de casamento:
- prefixo de caminho, sem glob; vale a entrada mais longa
- nunca cai em exceção: arquivo `*.repository.ts`, `*.controller.ts`, `*.gateway.ts` ou `*.service.ts`; e arquivo que
  contém `@SemEscopo(` — esses pedem os quatro onde estiverem
- arquivo de exceção que cita "regra 10", "regra 20" ou "regra 70" soma o guardião da regra citada
- a união com os marcados vale sempre: a exceção nunca tira quem o Arquiteto marcou

## Exceções do código

| Prefixo | Guardiões | Motivo |
|---|---|---|
| `apps/web/src/componentes/ui/` | C | peça visual sem dado nem chamada; C pela D58, D59 e D8 (faixa do Tutor, onça, contador, confirmação) |
| `apps/web/src/estilos.css`, `tema.ts`, `estilos.test.ts`, `tema.test.ts`, `contraste.test.ts` | nenhum | cor e tema |
| `apps/web/src/galeria/` | P | vitrine de peças com dado sintético |
| `apps/web/vite.config.ts`, `apps/web/nome-dos-chunks.ts`, `apps/web/rebaixar-cor.ts` e os testes deles | I | bundle no Chromebook (regra 50) |
| `apps/despachante/` | T P I | leva job do banco ao Redis; sem nota, IA nem aluno |

## Fora do código de produto (RF16, só em sessão de papel)

Além de `revisor-geral` e `test-engineer`:

| Prefixo | Guardiões |
|---|---|
| `tools/guardas/` | T P C I (o padrão) |
| `tools/processo/guardioes-por-caminho.ts`, `tools/processo/portao.ts`, `tools/processo/caducidade.ts`, `tools/processo/documento-de-revisao.ts` | T P C I: aplicam a tabela e a lista de veto |
| `eslint.config.mjs`, `eslint-suppressions.json` | T P C I: ligam e suprimem as guardas |
| `tools/vitrine/` | P C: monta a escola cheia das fotos de tela |
| `tools/ia/`, `docs/aia/ouro/`, `docs/aia/ouro-retido/` | C |
| `infra/`, `compose.yaml`, `.env.example`, `.github/` | I |
| o resto de `tools/`, `.claude/settings*.json`, `.claude/hooks/`, `package.json` e as outras configurações do portão (Tech Spec §5e) | nenhum |

## O teste da tabela

`tools/processo/harness/guardioes.test.ts`:
- todo arquivo versionado em `apps/**`, `packages/**`, `e2e/**` e `tools/guardas/**` sai com os quatro, salvo os que
  casam uma exceção; a contagem dos que casam cada exceção é maior que zero (exceção morta é vermelha)
- um caso por exceção, com um arquivo dela, e o mesmo caminho com nome `*.repository.ts` pedindo os quatro
- arquivo de exceção com "regra 20" no texto soma P
- `packages/nucleo/src/titular/leitura-do-titular.ts`, `apps/api/test/estrutura-isolamento.int.test.ts`,
  `e2e/aluno-tutor.spec.ts` e uma pasta nova inventada saem com os quatro
