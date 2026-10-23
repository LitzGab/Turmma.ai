# Tabela de caminho para guardião (X7, RF15 e RF16)

Detalhe da Tech Spec §5(b) e §5(e). A fonte que vale é `tools/processo/guardioes-por-caminho.ts`. T é
`tenancy-guardian`, P é `privacy-guardian`, C é `conformidade-reviewer` e I é `infra-guardian`.

## O padrão: os quatro

Decisão do Joaquim, 23/10/2026, na rodada 2 da revisão da spec: a tabela fina por pasta não convergia, porque cada
rodada achava pasta nova que devia pedir um guardião. **Todo arquivo em `apps/**`, `packages/**`, `e2e/**`,
`tools/guardas/**` e `tools/testes/**` pede T P C I**, testes e fixtures inclusive. Pasta nova nasce protegida. O que
pede menos é exceção escrita abaixo, com o motivo, e mexer na exceção pede os quatro (os aplicadores da tabela estão na
lista do fim).

## Regras de casamento

Valem para todo arquivo que o hook classifica como código na sessão (as duas tabelas abaixo, `tools/` inteiro e as
configurações do §5e):
- prefixo de caminho, sem glob; vale a entrada mais longa
- nunca cai em exceção: arquivo `*.repository.ts`, `*.controller.ts`, `*.gateway.ts` ou `*.service.ts`, e arquivo que
  contém `@SemEscopo(`; esses pedem os quatro onde estiverem
- **a citação soma o guardião**: o arquivo cujo texto, no HEAD **ou** no índice, cita "regra 10" soma T; "regra 20" ou
  "LGPD" soma P; "regra 70" soma C; "regra 80" soma I. Sem diferença de maiúscula. Ler o HEAD impede que tirar a
  garantia junto com o comentário tire o guardião
- a união com os marcados vale sempre: a exceção nunca tira quem o Arquiteto marcou

## Exceções do código

| Prefixo | Guardiões | Motivo |
|---|---|---|
| `apps/web/src/componentes/ui/` | C I | peça visual sem dado nem chamada; C pela D58, D59 e D8 (faixa do Tutor, onça, contador, confirmação), I pelo clique duplo e pelo aviso de fila (regra 80.4 e 80.7) |
| `apps/web/src/componentes/ui/ia/` | P C I | o formulário da Adaptação é ponto de coleta (D35, D67) |
| `apps/web/src/estilos.css` | C | CSS global pode esconder o selo de IA ou a faixa do Tutor |
| `apps/web/src/tema.ts`, `estilos.test.ts`, `tema.test.ts`, `contraste.test.ts` | nenhum | cor e tema; o `localStorage` guarda só a aparência |
| `apps/web/src/galeria/` | P C | vitrine com dado sintético, que é o dado dos e2e das peças de IA e da onça |
| `apps/web/vite.config.ts`, `apps/web/nome-dos-chunks.ts`, `apps/web/rebaixar-cor.ts` e os testes deles | I | bundle no Chromebook (regra 50) |
| `apps/despachante/` | T P I | leva job do banco ao Redis; sem nota, IA nem aluno |
| `infra/` | I P | a borda (`Caddyfile`, log de requisição) e os alertas dos prazos do titular (`grafana/alertas/`) |

## Fora do código de produto (RF16, só em sessão de papel)

Além de `revisor-geral` e `test-engineer`:

| Prefixo | Guardiões |
|---|---|
| `tools/processo/guardioes-por-caminho.ts`, `portao.ts`, `caducidade.ts`, `documento-de-revisao.ts`, `revisoes.ts`, `hook-revisoes.ts`, `comando-git.ts`, `hook-git.ts`, `git-hooks/`, `harness/guardioes.test.ts`; `tools/ci/conferir-entregas.ts`; `.claude/settings*.json` | T P C I: aplicam ou provam a tabela e a lista de veto |
| `eslint.config.mjs`, `eslint-suppressions.json` | T P C I: ligam e suprimem as guardas |
| `tools/vitrine/` | P C: monta a escola cheia das fotos de tela |
| `tools/ia/` | P C: o corpus e a trava do modelo local (regra 20.13) |
| `docs/aia/ouro/`, `docs/aia/ouro-retido/` | C |
| `tools/ci/` | I: esteira, imagem e compose |
| `tools/ci/borda.test.ts` | I P: prova a barreira de log da borda |
| `.github/` | I P: decide o que vai para o artefato num repositório público |
| `playwright.config.ts` | P: trace, captura e anexo |
| `compose.yaml`, `.env.example` | I |
| o resto de `tools/`, `.claude/hooks/`, `package.json` e as outras configurações do portão (Tech Spec §5e) | nenhum, salvo pela citação |

## O teste da tabela

`tools/processo/harness/guardioes.test.ts`, com os literais escritos no teste, não lidos da constante:
- todo arquivo versionado em `apps/**`, `packages/**`, `e2e/**`, `tools/guardas/**` e `tools/testes/**` sai com os
  quatro, salvo os que casam uma exceção; cada exceção casa ao menos um arquivo (exceção morta é vermelha)
- um caso por exceção e por linha da tabela do RF16, com um arquivo dela: sem o guardião da linha, recusado; com ele,
  aceito; `tools/processo/linhas.ts` passa sem guardião com veto
- `it.each` dos quatro sufixos dentro de `componentes/ui/` e de `galeria/`: os quatro
- um arquivo de `componentes/ui/` com `@SemEscopo(` no índice: os quatro; o mesmo sem o decorador: C I
- citação, um caso por termo: `galeria/x.tsx` com "regra 70" segue P C, com "regra 10" soma T, com "LGPD" segue P C;
  `vite.config.ts` com "regra 20" soma P, com "regra 80" segue I; `tema.ts` com "regra 70" soma C e com "Regra 80" soma
  I; sem citação, não soma; citava "regra 20" no HEAD e não cita no índice: soma P
- `componentes/ui/ia/AvisoFila.tsx` sai com P C I; `componentes/ui/sobrepostos/DialogoDeConfirmacao.tsx` sai com C I
- `packages/nucleo/src/titular/leitura-do-titular.ts`, `apps/api/test/estrutura-isolamento.int.test.ts`,
  `e2e/aluno-tutor.spec.ts` e uma pasta nova inventada saem com os quatro
