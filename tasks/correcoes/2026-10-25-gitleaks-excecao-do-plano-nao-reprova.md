# Correção — o caso do gitleaks que prova que a exceção do plano não perdoa chave oscila, porque o gerador da chave falsa às vezes forma uma palavra que o gitleaks descarta

**Origem:** esteira run 40214908506 (commit `4f9a4ab`, job `integração`), `tools/guardas/gitleaks.int.test.ts › a exceção do plano é do documento de tarefa e do nome de coluna: fora dele, ou com uma chave no lugar, reprova`. Passou em `5a8f579` (run 40185086983) com o mesmo `.gitleaks.toml`. Teste intermitente.
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`, `revisor-geral`
<!-- O `privacy-guardian` veio no PEDIDO do Orquestrador. Os outros quatro vieram na DEVOLUÇÃO da Mesa 3: o arquivo está em `tools/guardas/`, que a tabela de guardiões por caminho (`tools/processo/guardioes-por-caminho.ts`) liga aos quatro, e o portão exige `revisor-geral` em correção de código de processo. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

```
AssertionError: 5:21PM INF 1 commits scanned.
5:21PM INF scanned ~2739 bytes (2.74 KB) in 25.3ms
5:21PM INF no leaks found
: expected +0 to be 1 // Object.is equality
 ❯ tools/guardas/gitleaks.int.test.ts:160:45     expect(comChave.codigo, comChave.saida).toBe(1)
```

O caso põe, no documento de tarefa, uma linha `Sort Key: <40 caracteres aleatórios>` e espera que o gitleaks a reprove (a exceção do plano só perdoa nome de coluna). Dessa vez ele não achou nada.

## Fora desta correção

Nada.

## Causa

**Não é a configuração: é o gerador da chave falsa do teste.** O `.gitleaks.toml` não mudou entre `5a8f579` e `4f9a4ab`. O que muda de uma execução para outra é a chave, sorteada a cada vez.

O achado vem da regra `generic-api-key`, e o gitleaks descarta o achado genérico cujo segredo contém uma palavra da lista de palavras comuns dele (os `stopwords`), sem diferenciar maiúscula. O comentário do arquivo dizia que "sem vogal, nenhuma sequência aleatória forma uma das palavras", e isso é falso: a lista tem siglas e sequências de consoantes (`vpn`, por exemplo). Com 40 caracteres tirados de 50 símbolos sem vogal, o gitleaks descartou 7 de 1500 chaves em uma varredura minha (cerca de 0,5%, a mesma ordem de grandeza da oscilação vista na esteira); cinco delas continham `vpn` e as outras duas, outra palavra da lista.

Medido com o gitleaks da esteira (`ghcr.io/gitleaks/gitleaks:v8.30.1`), em modo `git`, com o `.gitleaks.toml` do projeto: 1500 arquivos `tasks/prd-x/N_task.md` no mesmo commit, cada um com `Sort Key: <chave sorteada>`; 1493 reprovaram, 7 passaram.

O mesmo gerador alimenta mais dois casos do arquivo (`comprida`, em minúsculas, e `reprova chave genérica de alta entropia`), que oscilavam do mesmo jeito. O `tokenFalso` (`ghp_` + 36) cai na regra `github-pat`, que não tem lista de palavras, e usa o mesmo gerador sem risco.

**Da tarefa que a trouxe:** nenhuma. O caso nasceu na tarefa 5.0 do F3 (`23dd9eaf`) e é intermitente desde então; a esteira de `4f9a4ab` foi a primeira a sorteá-lo.

## Teste que reproduz

Dois casos novos em `tools/guardas/gitleaks.int.test.ts`:

- `a chave falsa dos testes › alterna letra e dígito: sem duas letras juntas, nenhuma palavra da lista de descarte do gitleaks cabe nela`: a propriedade que o conserto garante, sem Docker.
- `gitleaks com o .gitleaks.toml do projeto › reprova a chave genérica em todas as amostras de uma vez: nenhuma é descartada como palavra comum (esteira 40214908506)`: o gitleaks de verdade sobre 1500 chaves no mesmo commit (metade em minúsculas, como no caso `comprida`), exigindo 1500 reprovados. Com o gerador antigo a chance de passar é de cerca de 0,1%, e a reprodução deixa de ser questão de sorte.

- **Vermelho antes:** `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`, 2 vermelhos e 11 verdes: `duas letras seguidas: expected true to be false` e `expected 1497 to be 1500` (3 chaves descartadas), em 25/10/2026.
- **Verde depois:** a mesma linha, 13 de 13, três vezes seguidas.
- **Estabilidade do caso original:** `-t "a exceção do plano é do documento de tarefa"` rodado sozinho dez vezes seguidas: 10 de 10 verdes.

## Correção

`tools/guardas/gitleaks.int.test.ts`: `aleatorio` passa a alternar letra (sem vogal, como antes) e dígito, começando por letra. Duas letras nunca ficam juntas, então nenhuma palavra da lista do gitleaks cabe na chave, e a entropia continua acima do limite da regra (as 1500 amostras reprovam, e a chave do caso `comprida` continua começando por letra e passando de 20 caracteres, que é o que a exceção do plano não aceita). O comentário falso sobre as vogais foi trocado pela causa. `varrer` ganhou `maxBuffer` de 64 MB, porque o caso das 1500 amostras imprime um achado por arquivo e o limite padrão de 1 MB cortaria a saída.

Só arquivo de teste mudou: nenhum código de produção nem de `tools/` fora de teste, por isso o documento não tem bloco de mutação (RF17 exige só para `apps/*/src` e `packages/*/src`). O que prova a cláusula nova é o par de casos acima, vermelho antes e verde depois.

## Achado fora do escopo

Ao reproduzir, vi que a varredura **de pasta** (`gitleaks dir`, a que o portão local faz nos arquivos ainda sem commit) escaneia 0 bytes de qualquer `tasks/prd-*/N_task.md`: com a exceção do plano no `.gitleaks.toml`, o gitleaks trata o arquivo como perdoado por inteiro, e um segredo de verdade num documento de tarefa só aparece na varredura do histórico, depois do commit. É outro defeito, em outro arquivo (`tools/ci/etapas-de-guarda.ts` / `.gitleaks.toml`), e não é corrigido aqui; vai no relatório ao Orquestrador.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian, privacy-guardian, conformidade-reviewer, infra-guardian, revisor-geral, test-engineer (1ª) | O "Achado fora do escopo" (a varredura de pasta, `gitleaks dir`, lê 0 bytes de `tasks/prd-*/N_task.md`) precisa de dono e de correção própria, em `tools/ci/etapas-de-guarda.ts` e `.gitleaks.toml`, com um caso que ponha um `ghp_` no documento de tarefa e exija reprovação na varredura de pasta. O test-engineer nota que ele esvazia parte do caso `reprova o segredo em arquivo ainda sem commit…` (`not.toContain(TAREFA_COM_PLANO)` e `soPlano.codigo === 0`) | Outro defeito, em outros arquivos: vai ao Orquestrador no relatório, como o documento promete, para virar correção própria. Não se corrige aqui |
| privacy-guardian (1ª), infra-guardian (1ª) | Reduzir as 1500 amostras (a infra sugere cerca de 1000) ou dar tempo-limite próprio ao caso, se pesar na esteira | Recusada por ora: o número é o que torna a reprodução quase certa, e a suíte inteira roda em 19–20 s, 13 de 13 verdes. Revisitar se a esteira ficar lenta |
| test-engineer (1ª) | O caso de propriedade (sem Docker) mora num `.int.test.ts`; caberia na unidade se o gerador for extraído | Recusada: nada a fazer enquanto o gerador viver no arquivo; o ganho só aparece se ele for extraído |
| revisor-geral (2ª) | A seção "Correção" do documento ainda diz que `varrer` ganhou `maxBuffer` de 64 MB; desde a r1 o limite está em `rodarGitleaks`, usado por `varrer` e `varrerPasta` | Recusada: o texto continua certo no efeito (a varredura em lote deixa de ser cortada); onde o limite mora está no código. Não vale uma rodada |
| revisor-geral (2ª) | `gitleaks.int.test.ts:116`: o comentário começa por "Esteira 40214908506.", que o título do `it` já traz | Recusada: estilo, sem efeito; mexer no arquivo caducaria de novo `test-engineer` e `revisor-geral` |
| revisor-geral (2ª) | `gitleaks.int.test.ts:124`: a linha de `arquivos` tem perto de 140 caracteres; quebrar o `Array.from` em duas | Recusada pelo mesmo motivo: estilo, sem efeito, e custaria outra rodada |
| test-engineer (2ª) | Nenhuma nova. Reafirma o achado da varredura de pasta (`gitleaks dir` lê 0 bytes de `tasks/prd-*/N_task.md`), que esvazia parte do caso `reprova o segredo em arquivo ainda sem commit…` | Já na tabela da r1: correção própria, que a Mesa leva ao Orquestrador |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 15:16:23 | 2026-10-25 15:16:37 | `tenancy-guardian` | 1 | APROVADO | ad94c3277e03fd07c |
| 2026-10-25 15:16:24 | 2026-10-25 15:16:42 | `conformidade-reviewer` | 1 | APROVADO | a431a26408e611545 |
| 2026-10-25 15:16:22 | 2026-10-25 15:16:43 | `privacy-guardian` | 1 | APROVADO | a3262b84e5b24bd82 |
| 2026-10-25 15:16:25 | 2026-10-25 15:17:17 | `infra-guardian` | 1 | APROVADO | a9dc6dab33f4983b2 |
| 2026-10-25 15:16:26 | 2026-10-25 15:17:36 | `revisor-geral` | 1 | APROVADO | ad13fe8e96c0fd218 |
| 2026-10-25 15:16:27 | 2026-10-25 15:18:02 | `test-engineer` | 1 | APROVADO | a0b50f63541056220 |
| 2026-10-25 15:26:19 | 2026-10-25 15:26:41 | `revisor-geral` | 2 | APROVADO | a36b1844215f00d25 |
| 2026-10-25 15:26:10 | 2026-10-25 15:26:59 | `test-engineer` | 2 | APROVADO | aec399f0ba3da7b3c |
