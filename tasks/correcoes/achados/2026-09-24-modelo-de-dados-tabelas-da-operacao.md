# Achados das revisões — `tasks/correcoes/2026-09-24-modelo-de-dados-tabelas-da-operacao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 10:13:28 · `tasks/correcoes/2026-09-24-modelo-de-dados-tabelas-da-operacao.md`

VEREDITO: APROVADO

O teste novo prova a regra: ele confere o documento contra as migrations e falharia com a regressão que quer pegar. Não achei bloqueante.

**Cenários exigidos:**
1. Caminho feliz: toda tabela sem `escola_id` nas migrations é citada, com o nome entre crases, no item 1 das "Regras transversais".
2. Uma tabela nova sem `escola_id` que o documento não cita reprova o teste.
3. O nome da tabela aparecer no documento, mas fora do item 1, não vale.
4. Uma tabela que ganha `escola_id` depois, por `ALTER TABLE ... ADD COLUMN`, sai da lista de exceções.
5. Uma tabela apagada (`DROP TABLE`) sai da lista.
6. Se a leitura das migrations quebrar em silêncio, o teste não pode passar vazio.
7. Tabelas com escola não entram como exceção (sem falso positivo).
8. Remover um nome do item 1 do documento reprova o teste.

**Cobertos:**
- **Cenários 1 e 8:** cobertos pelo teste `o item 1 das Regras transversais do docs/modelo-de-dados.md nomeia cada uma`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`. Tirar `Rede`, `Escola` ou qualquer uma das seis tabelas da operação do item 1 deixa ele vermelho.
- **Cenários 2, 3 e 4:** cobertos pelo teste com migrations e documento inventados. `nova` é reprovada mesmo citada no item 2, e `tardia` é aceita depois do `ALTER`.
- **Cenários 6 e 7:** cobertos pelo primeiro teste. Ele exige achar `conta`, `codigo_recuperacao` e as seis da operação, e exige não achar `usuario`, `turma`, `auditoria` e `job_registro`. Também exige que o trecho do item 1 lido do documento não esteja vazio, o que pega o caso de o título da seção ou a numeração mudarem.
- **Conferi à parte:** a leitura das migrations acha as 26 tabelas criadas nas 15 migrations. Nenhum `CREATE TABLE` avança sobre a tabela seguinte, que era o risco da busca curta até `\n);`. Sem `escola_id` saem exatamente dez: `escola`, `rede`, `conta`, `codigo_recuperacao` e as seis da operação. Todas estão no item 1 do documento.
- **Rodei os três testes:** passam, sem `.skip` nem mock. Não há IA nem concorrência envolvidas.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Tabela criada que a leitura não reconhece passa sem aviso.** Hoje funciona porque todas as migrations seguem o formato que o drizzle gera. Mas uma migration escrita à mão com `CREATE TABLE IF NOT EXISTS`, `"public"."x"`, CRLF ou `) ;` faria a tabela sumir da leitura, e o teste ficaria verde. O `TABELAS_FISICAS`, na linha 99, tem a mesma limitação. Sugestão: exigir que o número de tabelas lidas por `tabelasSemEscola` seja igual ao número de `CREATE TABLE` encontrados com uma busca mais solta. Assim uma tabela não reconhecida vira vermelho.
2. **Dois caminhos para perder `escola_id` não são tratados:** `ALTER TABLE ... DROP COLUMN "escola_id"` e `ALTER TABLE ... RENAME TO`. Os dois são improváveis pela regra 80, item 9, mas deixariam passar uma exceção fora do documento. Cabe tratar os dois ou declarar o limite no comentário da função.
3. **O teste inventado não passa por `DROP TABLE`.** Um caso a mais fecha esse caminho. Hoje nenhuma migration usa `DROP TABLE`.
4. **A conferência olha só o nome entre crases dentro do item 1.** Ela não confere a seção "Operação Turmma" nem se o nome está numa linha de exceção. Isso basta para a regra; fica só registrado para o `/validar`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 10:14:17 · `tasks/correcoes/2026-09-24-modelo-de-dados-tabelas-da-operacao.md`

VEREDITO: APROVADO

**Tabelas verificadas:** conferi todas as tabelas criadas nas migrations 0000 a 0014 de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/`. Oito ficam sem `escola_id`:
- `escola` e `rede`, que são o próprio tenant e a rede acima dele;
- `conta` e `codigo_recuperacao`, a identidade de login, global por desenho;
- as seis da operação: `operador`, `codigo_recuperacao_operador`, `convite_operador`, `sessao_operador`, `acesso_operacao` e `auditoria_operacao`.

O item 1 das "Regras transversais" em `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md` agora nomeia as oito, e cada justificativa bate com a regra 10, item 1. As seis da operação são dados da nossa equipe, não de escola. A cerca descrita no documento é a mesma que o teste C45 prova: só `apps/api/src/operacao/operador.repository.ts` e o expurgo tocam essas tabelas, e o expurgo alcança só o acesso, a sessão e o convite da operação. A seção "Operação Turmma" confere coluna por coluna com a `0014_operador.sql`.

**Queries verificadas:** nenhuma. A correção não cria nem altera repository, query ou endpoint. O cercamento do `OperadorRepository` já existia no C45 e não mudou.

**Teste de isolamento:** presente e efetivo. O teste novo no fim de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` quebra nos dois casos que importam:
- uma tabela nova sem `escola_id` que o item 1 não nomeia;
- uma exceção removida do documento.

Ele também tem um teste de sanidade: sem ele, uma varredura cega passaria sempre. Esse teste exige achar `conta` e as seis da operação, e não achar `usuario`, `turma`, `auditoria` nem `job_registro`. Um terceiro teste, com migrations e documento sintéticos, prova o caso negativo. Como a busca exige o nome entre crases, uma tabela citada fora do item 1 não conta como exceção.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `apps/api/test/arquitetura.test.ts`, na função `tabelasSemEscola`, a varredura só reconhece o formato que o drizzle-kit gera hoje (`CREATE TABLE "x" (`). Uma migration escrita à mão escaparia sem aviso nestes casos:
   - `CREATE TABLE IF NOT EXISTS`;
   - nome com schema, como `"public"."x"`;
   - `ALTER TABLE ... RENAME`;
   - `ALTER TABLE ... DROP COLUMN "escola_id"`.

   Vale cobrir esses formatos, ou fazer o teste falhar quando encontrar DDL de tabela que não reconhece.
2. O item 1 cita "habilidades da BNCC" e "banco de questões público" sem nome entre crases. Quando essas tabelas entrarem, o teste vai obrigar a escrever o nome. Vale deixar isso dito no próprio item 1, para ninguém se surpreender com o teste vermelho.
3. O teste confere só o `escola_id`, não o `anoLetivoId` da regra 10, item 2. Uma verificação parecida para as tabelas que variam por período cobriria esse item.
