# Correção — o `npm audit` reprova o `multer` 2.4.0 (GHSA-q7qp-rjg7-q26m) e a `guarda:dependencias` derruba o portão da 11.0

**Origem:** portão da tarefa 11.0 do harness (`guarda:dependencias`), na branch `spec/harness--l1`; a falha está fora dos arquivos da 11.0
**Subagentes obrigatórios:** `infra-guardian`
<!-- O guardião do PEDIDO do Orquestrador é `infra-guardian`. A correção altera 2 arquivos fora de `tasks/` (o `package.json` da raiz e o
     lock), abaixo do limite de 5 do passo 5 do `corrigir`, e não toca `.github/`, `tools/ci/` nem `tools/processo/`: `revisor-geral`
     não é obrigatório. `test-engineer` é obrigatório em toda correção. -->

## Sintoma

`npm run guarda:dependencias` (as mesmas etapas da esteira) falha no passo "dependência de produção com vulnerabilidade grave
(npm audit)", que roda `npm audit --audit-level=high --omit=dev`:

```
multer  2.0.0 - 2.4.0
Severity: high
multer vulnerable to Denial of Service via a pending asynchronous fileFilter after request teardown - GHSA-q7qp-rjg7-q26m
  @nestjs/platform-express  10.4.18 - 10.4.22 || >=11.1.2   (depende do multer vulnerável)
    @nestjs/core  >=12.0.1                                   (depende do platform-express)
3 high severity vulnerabilities
```

## Fora desta correção

Os 20 arquivos que a tarefa 11.0 deixou na árvore, sem commit: `.claude/hooks/contexto-inicial.sh`, `docs/guia-do-desenvolvedor.md`,
`tasks/prd-harness/{11_task,cenarios,techspec}.md`, `tools/ci/{scripts.test,verificar}.ts`,
`tools/processo/{mutacoes,portao-local,portao,sequencia-do-portao}.ts`, `tools/processo/{mutacoes,portao-local,revisoes}.test.ts`,
`vitest.config.ts`, `tools/processo/git-hooks/`, `tools/processo/harness/instalacao.test.ts`, `tools/processo/hook-git.int.test.ts`,
`tools/processo/hook-git.ts` e **o `package.json` da raiz, só nos trechos da 11.0** (o script `prepare`, e `--project processo` e
`test:processo` nos scripts de teste). Ficam na árvore; não entram na revisão nem no commit desta correção. O `package.json` é o único
arquivo comum às duas: o commit leva dele só o bloco `overrides` (prepare-se um patch com esse trecho, `git apply --cached`), e o resto do
arquivo continua modificado na árvore para a 11.0.

## Causa

Nenhuma mudança nossa: a base de avisos do npm ganhou o GHSA-q7qp-rjg7-q26m para o `multer` de 2.0.0 a 2.4.0, e o `multer` 2.5.0 o
corrige. De nenhuma tarefa: o portão da 11.0 só a encontrou primeiro.

**Por que não basta atualizar o lock.** O `multer` é transitivo: vem de `@nestjs/platform-express`, que o declara com versão **exata**
(`"multer": "2.4.0"`). Isso vale para a 12.1.2 que usamos e também para a última publicada, a 12.2.0 (conferido com
`npm view @nestjs/platform-express@<versão> dependencies.multer` em 12.1.1, 12.1.2, 12.1.3 e 12.2.0: todas 2.4.0). Subir o Nest não
resolve, e `npm update multer` sozinho deixa o lock com `invalid` (a árvore pede 2.4.0). O único jeito de entregar a 2.5.0 é o campo
`overrides` do `package.json` da raiz. O aviso aponta `@nestjs/core >=12.0.1` só porque ele depende do `platform-express`; não há nada a
fazer nele.

**O aviso alcança o nosso uso?** Sim. `apps/api/src/material/recebimento.ts` monta o `FileInterceptor` do upload de material com um
`fileFilter` (hoje síncrono: chama `decidir(...)` na hora, com a licença lida do corpo), e o aviso trata de `fileFilter` assíncrono que
fica pendente depois que a requisição é derrubada. O nosso é síncrono, o que reduz o alcance, mas a correção é trocar a versão, não
argumentar que não alcança. Os limites da regra 80, item 3 (`fileSize`, `files`, `fields`, `fieldSize`, `parts`) estão na mesma
configuração e continuam valendo: a 2.5.0 é uma versão de correção dentro do major 2. **A única borda que andou** é a do `fieldSize`:
na 2.5.0 ele passou a significar "máximo permitido", então um campo de exatamente `MAXIMO_DE_BYTES_POR_CAMPO` (2048 bytes) agora passa, e na
2.4.0 era cortado. O teto continua o mesmo; a borda andou 1 byte, e quem recusa o campo acima dele (2048 + 1 bytes) segue recusando.

## Teste que reproduz

A conferência da esteira, `npm run guarda:dependencias` (etapa `npm audit --audit-level=high --omit=dev`):

- **Antes (vermelho), sobre `ae839fc`:** a saída do sintoma, `3 high severity vulnerabilities` (`multer`, `@nestjs/platform-express`,
  `@nestjs/core`), código 1.
- **Depois (verde):** `found 0 vulnerabilities`, e o knip (dependência declarada onde é usada) verde: `esteira: etapa verde`, código 0.
  `npm ls multer` mostra `multer@2.5.0 overridden`, sem `invalid`.
- **Compatibilidade:** `apps/api/test/material.int.test.ts` (o recebimento do multipart: tamanho limitado enquanto chega, um arquivo,
  campo `arquivo`, recusa por licença no `fileFilter`) roda verde sobre a 2.5.0: 42 testes. O portão da tarefa roda os tipos, o lint, as
  guardas e a unidade inteira sobre a 2.5.0.

Não entra teste novo: a mudança é de versão de dependência, sem código nosso alterado, e a guarda é o teste que a esteira já roda.
Esta guarda depende da base de avisos do npm, que muda sozinha: o mesmo vermelho pode voltar sem mudança nossa, com outro pacote ou outro
aviso (hoje já foram `zod`, `vite` e `body-parser`, e agora `multer`), e o padrão é o que a `/retro` deve reconhecer.

## Correção

- `package.json` da raiz: bloco novo `"overrides": { "multer": "2.5.0" }`, versão exata como o resto do repositório. É o único lugar em
  que o npm aceita forçar uma transitiva.
- `package-lock.json`: `node_modules/multer` 2.4.0 → 2.5.0 (`resolved` e `integrity`). Só o `multer` mudou no lock (3 linhas); as
  dependências dele (`append-field`, `busboy`, `type-is`) ficaram como estavam. Gerado com `npm install --package-lock-only` e
  `npm update multer --package-lock-only`, e instalado em `node_modules` com `npm install --ignore-scripts`, para que os testes
  exercitem a 2.5.0.
- **Quando sair:** o `overrides` deixa de ser preciso no dia em que o `@nestjs/platform-express` declarar o `multer` >= 2.5.0. Aí o bloco
  sai e o lock fica com a versão que o Nest pedir. Até lá, o bloco é o que mantém a guarda verde: sem ele, é o `npm audit --audit-level=high --omit=dev` (a etapa "dependência de produção com vulnerabilidade grave" da `guarda:dependencias`) que volta a ficar vermelho, com as 3 graves do sintoma.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Atualizar o comentário de `apps/api/test/material.int.test.ts:292-304`, que lista o que cada versão do `multer` mudou nos tetos | Arquivo que esta correção não toca (aplicar caducaria `test-engineer` e `revisor-geral` por um comentário); o caso do campo grande (`2 * 1024 + 1` bytes) segue válido na 2.5.0. Destino: a próxima tarefa que alterar `material.int.test.ts` |
| test-engineer (1ª) | Se o `fileFilter` de `recebimento.ts` ficar assíncrono, acrescentar teste de integração que derrube a requisição no meio do envio | Condicional a mudança que não existe; o `fileFilter` de hoje é síncrono. Destino: a tarefa que tornar o `fileFilter` assíncrono |
| test-engineer (1ª) e infra-guardian (1ª) | Padrão da base de avisos do npm derrubando a `guarda:dependencias` sem mudança nossa (`zod`, `vite`, `body-parser`, `multer`) | Já registrado no documento ("Teste que reproduz"); destino: `/retro` da funcionalidade |
| test-engineer (1ª) | Lembrete para revisar o `overrides` quando o Nest subir, pois versão exata forçada pode ficar presa abaixo do que o `platform-express` pedir | O documento já traz "Quando sair"; destino: `/retro` da funcionalidade |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 20:58:15 | 2026-10-23 20:59:08 | `test-engineer` | 1 | APROVADO | afbe4acc8ab39d0e5 |
| 2026-10-23 20:58:13 | 2026-10-23 20:59:18 | `infra-guardian` | 1 | APROVADO | abead9baa40a0947a |
