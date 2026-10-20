# Roteiro comum — análise de unidade (reengenharia X5, Etapa 2)

Repositório: /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia (branch spec/reengenharia).
Produto: Turmma (código `educa`), SaaS escolar multi-tenant com agentes de IA. Contexto: `CLAUDE.md` na raiz
(leia só o necessário) e as regras em `.claude/rules/` (00 arquitetura, 10 tenant, 20 LGPD, 30 IA, 40 testes,
50 frontend, 60 domínio, 70 CNE, 80 infra). O sistema foi feito rápido com IA; a missão é uma reengenharia
(legível, pouco código, contratos explícitos, resiliente, escala). Você faz SÓ a compreensão de uma unidade,
com evidência. Não é o diagnóstico completo ainda, mas anote sinais que vir.

## Proibido
- Editar, criar ou apagar qualquer arquivo do repositório. Outros agentes trabalham na mesma árvore.
- Rodar teste, suíte, build, docker/compose, `npm install`, `npx` de ferramenta nova, ou qualquer coisa
  que escreva no repositório. Pode: ler, grep, find, `git log`/`git show`/`git blame`, `wc`.
- Deduzir comportamento pelo nome. Siga referência e código.
- Inventar regra de negócio.

## Marcas obrigatórias em cada afirmação
- **[código]** com `arquivo:linha` (conferido lendo o código)
- **[doc]** com o documento (dito em doc, não conferido)
- **[hipótese]** (suspeita, a conferir) — diga o que confirmaria

## Saída
Grave UM arquivo markdown no caminho que o pedido indicar (fora do repositório). Até ~2500 palavras,
tabelas quando couber, sem colar blocos grandes de código. Seções, nesta ordem:

1. **Finalidade e limites** — o que a unidade faz, o que não é dela.
2. **Pontos de entrada** — rotas (método + caminho + guard/papel), comandos, workers, jobs, consumidores
   de fila, eventos, webhooks, telas (rota da web). Tabela.
3. **Fluxos e regras de negócio** — os principais, seguindo o código; invariantes (tenant, nota com autor
   humano, D55, auditoria) e ONDE são garantidas (estrutura, teste, convenção).
4. **Dependências** — internas (quem chama, quem é chamado, entre pacotes/módulos) e externas (vendor,
   banco, Redis, fila, storage, IA). Ciclos, se vir.
5. **Dados** — tabelas que lê/escreve, migrations, quem mais lê/escreve as mesmas tabelas.
6. **Contratos** — expostos e consumidos: explícitos (tipo em `packages/shared`, schema zod/valibot, DTO,
   interface/porta, schema de job/evento) ou implícitos (formato combinado no código, string mágica, payload
   de fila sem tipo). Diga se é validado na borda e se há teste de contrato.
7. **Testes** — quais existem (arquivo), camada (unidade/integração/e2e/infra), o que de fato protegem;
   áreas sem teste; sinais de teste frágil ou decorativo.
8. **Resiliência e escala (sinais)** — timeouts, retry, idempotência, estado em memória, paginação,
   índices por escopo, limites por escola, observabilidade. Só o que viu.
9. **Suspeitos de código morto** — export/arquivo/função sem referência aparente; para cada um, como você
   procurou e o que poderia ser referência dinâmica (DI do Nest, rota, string, script de package.json, CI).
   NUNCA afirme que é morto: é suspeita.
10. **Duplicação e inconsistência** — padrões diferentes para o mesmo problema, cópia entre módulos, pastas
    depósito, arquivos grandes demais (cite linhas).
11. **Doc × código** — onde docs/ ou regras dizem algo que o código contradiz ou não tem.
12. **Tamanho, risco e dependências da unidade** — linhas, nº de arquivos, risco de mexer (baixo/médio/alto
    e por quê), de que unidades depende e quais dependem dela.
13. **Os 5 achados mais importantes** — uma linha cada.

Ao terminar, responda só: o caminho do arquivo e os 5 achados mais importantes (uma linha cada).
