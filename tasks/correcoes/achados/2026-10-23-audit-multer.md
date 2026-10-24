# Achados das revisões — `tasks/correcoes/2026-10-23-audit-multer.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 20:59:08 · `tasks/correcoes/2026-10-23-audit-multer.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a `guarda:dependencias` fica verde com o `multer` 2.5.0 forçado pelo `overrides`. O `npm ls multer` mostra `2.5.0 overridden`, sem `invalid`.
- Regressão da regra: sem o bloco `overrides`, o lock volta ao 2.4.0 que o `@nestjs/platform-express` fixa com versão exata, e o `npm audit --audit-level=high --omit=dev` fica vermelho de novo.
- Compatibilidade do recebimento de multipart, que é o uso real do `multer` aqui (`apps/api/src/material/recebimento.ts:32-33`). Os limites da regra 80, item 3 precisam continuar valendo: `fileSize`, `files: 1`, `fields`, `fieldSize` e `parts`. Também precisam continuar valendo a recusa por licença no `fileFilter` antes de abrir o arquivo, o campo `arquivo` e o arquivo único.
- Permissão e isolamento: não se aplicam. Nenhum código, rota ou dado de escola foi alterado. Mesmo assim, o `material.int.test.ts` já cobre os dois pontos, com o professor e o aluno sem acesso ao envio e os tetos de envio por escola.
- Concorrência: não se aplica a uma troca de versão. O caso de dois envios do mesmo arquivo ao mesmo tempo já está no `material.int.test.ts:354` e passou sobre a 2.5.0.

**Cobertos:**
- **Antes vermelho:** o `git diff package-lock.json` confirma `node_modules/multer` 2.4.0 no HEAD (`ae839fc`). Essa versão está dentro da faixa do GHSA-q7qp-rjg7-q26m (2.0.0 a 2.4.0), o que bate com o vermelho registrado no Sintoma. Não reproduzi o vermelho porque isso exigiria alterar a árvore. A evidência no lock basta.
- **Depois verde:** rodei `npm run guarda:dependencias` e deu `found 0 vulnerabilities`, com o knip verde e `esteira: etapa verde`. O `npm ls multer` dá `@nestjs/platform-express@12.1.2 └── multer@2.5.0 overridden`.
- **Compatibilidade:** rodei `npx vitest run apps/api/test/material.int.test.ts` e deu 42 de 42 verdes sobre a 2.5.0. Os casos que exercitam o `multer` são estes:
  - limite de tamanho com 413 (`:279`) e o caso exatamente no limite (`:329`);
  - a tabela de partes, campos, dois arquivos e campo errado (`:295-314`);
  - a recusa por licença com o arquivo chegando primeiro ou sem arquivo (`:186-216`).

  Esses testes falhariam se a 2.5.0 mudasse a semântica de `limits`, do `fileFilter` ou do `single`.
- **O diff bate com o documento:** `overrides: { multer: "2.5.0" }` com versão exata, e só as 3 linhas do `multer` no lock. A seção "Fora desta correção" separa corretamente os trechos da 11.0 no `package.json`, que são `prepare`, `--project processo` e `test:processo`.
- **Seção "Mutações":** não é exigida. A correção não acrescenta cláusula em código nosso. A guarda que já roda no portão e na esteira é a prova executável, porque tirar o `overrides` a deixa vermelha.
- Não há `.skip`, mock nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A regressão está coberta só pela guarda, que depende da base de avisos do npm. Isso basta para esta correção. Seria mais explícito o documento dizer que o próprio `npm audit` é o que fica vermelho se o bloco `overrides` sair, e não só que é "o que mantém a guarda verde".
2. O aviso trata de `fileFilter` assíncrono pendente depois que a requisição cai, e o nosso é síncrono. Se um dia o `fileFilter` de `recebimento.ts` ficar assíncrono, por exemplo consultando o banco, vale um teste de integração que derrube a requisição no meio do envio.
3. Para a `/retro`: esta é a quarta vez que a base de avisos do npm derruba o portão sem mudança nossa (zod, vite, body-parser, multer). Também convém um lembrete para revisar o `overrides` quando o Nest subir, já que uma versão exata forçada pode ficar presa abaixo do que o `platform-express` vier a pedir.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/correcoes/2026-10-23-audit-multer.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/package.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/package-lock.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/apps/api/src/material/recebimento.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/apps/api/test/material.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 20:59:18 · `tasks/correcoes/2026-10-23-audit-multer.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só a versão de uma dependência transitiva do upload de material; nenhum código nosso muda)
Rate limit: ok (não muda; a `GuardaDoEnvio` continua conferindo os tetos antes de o corpo ser lido)
Fila e prioridade: ok (não se aplica; a extração continua fora do request)
Concorrência: protegida (não muda)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)
Bloqueantes: nenhum

O que conferi:
- **`npm ls multer`:** mostra `multer@2.5.0 overridden`, sem `invalid`.
- **`npm audit --audit-level=high --omit=dev`:** dá `found 0 vulnerabilities`.
- **Lock:** só o `node_modules/multer` muda (versão, `resolved` e `integrity`).
- **Dependências proprietárias (regra 00, item 7):** nenhuma entra.
- **Mudanças da 2.5.0:** comparei `lib/` da 2.4.0 com a 2.5.0 instalada. Mudam três coisas: o `fieldSize` passa a valer como máximo permitido (vai para o busboy com +1), um listener de `error` fica no busboy depois do encerramento, e o arquivo que deu erro deixa de entrar na lista de limpeza. `fileSize`, `files`, `fields` e `parts` continuam com o mesmo comportamento.
- **Limites do `apps/api/src/material/recebimento.ts:32` (regra 80, item 3):** os cinco continuam ativos. O caso de campo grande em `apps/api/test/material.int.test.ts:313` usa `2 * 1024 + 1` bytes, então continua sendo cortado com a semântica nova.
- **Teste de integração:** rodei `apps/api/test/material.int.test.ts` sobre a 2.5.0 e deu 42 de 42 verdes, o mesmo número que o documento informa.

Recomendações:
- **Mudança do `fieldSize`:** no documento (`tasks/correcoes/2026-10-23-audit-multer.md`, seção Causa), registrar que na 2.5.0 o `fieldSize` passou a significar "máximo permitido". Um campo de exatamente 2048 bytes agora passa, e na 2.4.0 era cortado. A frase "continuam valendo" está certa para o teto, mas não diz que a borda andou 1 byte. Vale também atualizar o comentário em `apps/api/test/material.int.test.ts:292-304`, que lista o que cada versão do multer mudou nos tetos.
- **Padrão para a `/retro`:** quarta falha da `guarda:dependencias` vinda da base de avisos do npm sem mudança nossa (`zod`, `vite`, `body-parser`, `multer`). O próprio documento já aponta isso.
