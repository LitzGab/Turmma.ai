# Tech Spec — A escola montada pela coordenação

**PRD:** `tasks/prd-apresentacao-escola/prd.md`
**Status:** aprovada (26/09/2026, `/revisar-spec` rodada 5); correções e autores em `revisao-spec.md`.

## 1. Resumo da abordagem

Três tabelas e o convite de professor. A reivindicação é pública, presa ao link ou ao código; a aprovação cria o
aluno numa transação.

## 2. Módulos afetados

- `packages/nucleo`, `packages/shared`: migrations, auditoria, contratos `.strict()`, `MATRIZ`, `MENSAGENS_DA_SALA`
- `apps/api/src/estrutura` (lista, `encerrar`); novos `professores` e `sala`
- `apps/api/src/sessao`: convite com `tipo`; `AcessoDaSala`; eliminação; `ContadorEmJanela`; `/v1/eu`
- Expurgo (`packages/nucleo/src/retencao`, `apps/worker`), com o `@SemEscopo` reescrito; `ops:revogar-acessos-sala`
- `apps/web`, `infra/k6`, `infra/grafana/alertas`

## 3. Modelo de dados

```
lista_nome     id, escola_id*, ano_letivo_id*, turma_id*, nome?, matricula?, estado* (livre|reivindicado|aprovado),
               usuario_id?, criado_por?, criado_em*
reivindicacao  id, escola_id*, ano_letivo_id*, turma_id*, lista_nome_id?, chave_envio?, senha_hash?,
               teve_matricula_errada?, estado* (pendente|aprovada|recusada|encerrada), solicitada_em*,
               decidida_em?, decidida_por?, decidida_como? (professor|coordenacao)
acesso_turma   id, escola_id*, ano_letivo_id*, turma_id*, token_hash*, codigo_hmac*, validade_dias* (1|7|30),
               expira_em*, revogado_em?, criado_por?, criado_em*
```

- Ids `uuidv7()`. FKs compostas com a escola: à `lista_nome`, `on delete set null (lista_nome_id)`; à `turma`, a do
  acesso com `on delete cascade`, e a turma só sai sem acesso vigente; ao `usuario`, `usuario_id` sem ação,
  `criado_por` e `decidida_por` com `set null (coluna)`, e a autoria fica na auditoria. O `delete` da turma e o gerar
  pegam a trava da linha da turma (`for update` e `for share`)
- `lista_nome`: check `aprovado ⇔ usuario_id ⇔ nome e matrícula nulos`; matrícula única por escola e ano, com `trim`;
  índice `(escola_id, ano_letivo_id, turma_id, estado)`
- `reivindicacao`: um pendente por nome; `(escola_id, chave_envio)` único parcial, nas não nulas; chave, hash e
  `teve_matricula_errada` só em pendente; índice `(escola_id, turma_id, estado, solicitada_em)`; sem `dispositivo`
  (PRD, 10.2)
- `acesso_turma`: `token_hash` único; turma e `codigo_hmac` únicos por escola entre os não revogados
- Código: 8 caracteres de `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31⁸ ≈ 8,5 × 10¹¹), em dois grupos de 4; HMAC com
  `SALA_CHAVE_CODIGO`, separada da dos contadores

Migrations de expandir: 0018 `convite.tipo` aceita `professor`; 0019 lista; 0020 acesso; 0021 reivindicação. Revertido o código, o
convite de professor em aberto ativa como o de coordenador, com o papel do `usuario`.

## 4. API

Sob `/v1`, escopo do contexto; uma célula da `MATRIZ` por rota:

- `PATCH`, `DELETE disciplinas/:id`, `turmas/:id` (coordenador): excluir com nome, vínculo (de qualquer estado, também
  o encerrado), pedido ou acesso vigente → `CONFLITO`; a turma de outro ano não se renomeia nem se exclui (`NAO_ENCONTRADO`).
  O 23503 vira `CONFLITO` só em `apps/api/src/estrutura/exclusao.ts`
- `POST turmas/:id/lista/previa` e `…/lista` (coordenador), até 200 linhas e 64 KB: `entra`, `ja_existe` (na lista ou
  aprovada na turma) ou `erro` por linha; grava só sem erro
- `POST turmas/:id/lista/nome`, `DELETE lista-nomes/:id`, `GET turmas/:id/lista` (coordenador; a leitura
  `nominal_auditado`): o avulso sem nome ou matrícula dá `ENTRADA_INVALIDA`; com matrícula na lista da escola ou em
  `credencial_matricula`, `CONFLITO`; nada gravado. Retira só `livre`, senão `CONFLITO`
- `POST`, `GET professores` (coordenador): o link uma vez; a lista não diz se a conta existia
- `POST professores/:usuarioId/convite/{refazer,revogar}`: só o de professor
- `POST turmas/:id/acesso`, `…/revogar`, `GET …/acesso` (professor, `turma_vinculada`): link e código uma vez; o
  GET, só `expiraEm`
- `GET turmas/:id/reivindicacoes`, `POST reivindicacoes/decidir` (professor, `turma_vinculada`; coordenador,
  `unidade`, e a leitura `nominal_auditado`): o pedido traz `teveMatriculaErrada` (sim ou não); até 40 ids, cada um
  `decidida`, `ja_decidida` ou `nao_encontrada`
- `GET minha-turma` (aluno, `proprio`): escola, turma e série, sem colegas
- `POST salas/abrir` e `…/reivindicar` (anônimas, `no-store`, sem cookie): `{ slug, token | codigo }`; reivindicar
  leva `listaNomeId`, `matricula`, `senha` e `chaveEnvio` (UUID), e responde `enviado`

`convites/consultar` e `/aceitar` não mudam (seção 13).

**Uma resposta só.** Acesso inexistente, vencido, revogado, de ano encerrado, de turma excluída ou de outra escola:
`NAO_ENCONTRADO`. Nome inexistente, de outra turma ou escola, de ano encerrado, tomado ou com matrícula errada:
`REIVINDICACAO_RECUSADA`, sem gravar. No lote, id inexistente, de outra escola ou ano ou, para o professor, sem vínculo
confirmado, pendente ou já decidido: `nao_encontrada`.

## 5. Fluxo

1. Cadastro: `contaParaConvite`, `usuarioConvidado(papel: professor)` e o convite sob `travarEscola`.
2. O professor aceita, confirma o vínculo e gera o acesso, que projeta ou compartilha pelo WhatsApp (P27).
3. O aluno abre `/e/<slug>/turma#<token>`, que tira o fragmento do endereço antes da primeira chamada, ou digita o
   código; escolhe o nome e digita matrícula e senha.
4. `salas/reivindicar`: resolve o acesso; chave já gravada na escola e na turma do acesso → `enviado`, sem hash;
   limites; argon2id no `SemaforoDeHash`, balde da escola, **sempre**; a transação: `for share` no ano, o `insert`
   da `reivindicacao` com a chave e o `teve_matricula_errada` lido do contador do nome e, **depois**, o `update
   lista_nome` condicional em id, escola, ano, turma, `livre` e matrícula. FK violada, qualquer 23505 ou `update` sem
   linha: a transação volta atrás, e um comando novo relê a chave na escola e na turma do acesso. Achou, `enviado`,
   sem contar; não achou, `REIVINDICACAO_RECUSADA`. O nome da restrição nunca é lido.
5. **Quem conta.** Toda falha que rodou o hash conta no teto da turma. No contador do nome, só a matrícula errada:
   depois da volta atrás, uma leitura com escola, ano e turma do acesso confere o nome ainda `livre`.
6. Decisão, uma transação por id: `for share` no ano; `update` condicional em id, escola, ano em curso, pendente e,
   para o professor, `exists` do vínculo confirmado na turma do pedido. Aprovada: usuário, credencial com o hash,
   vínculo `aluno` confirmado com `decidido_em`, a `lista_nome` sem nome e matrícula, e o contador de login da
   matrícula zerado. Recusada: o nome volta a `livre`. Hash, chave e `teve_matricula_errada` saem nos dois. Sem
   linha, uma leitura com o mesmo alcance, aplicado **antes** do estado, separa `ja_decidida` de `nao_encontrada`.

## 6. Isolamento

- Repositories com `exigirEscolaDoContexto` e `exigirAnoEmCurso`; `turma_vinculada` pelo `exists` de
  `TurmaRepository.aberta`; `minha-turma` pelo vínculo de aluno confirmado no ano em curso
- A rota pública resolve o acesso pelo `AcessoDaSala`, de `apps/api/src/sessao`, que devolve só escola, ano e turma ao
  `sala`. Ele chama `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo`, novos na `ResolucaoDeTenantRepository`, com
  `@SemEscopo` ("o link e o código da sala não dizem a escola"), que exigem o ano `em_curso` e o slug da escola (I1,
  I2)
- `ops:revogar-acessos-sala` recebe o id da escola do log e monta o contexto como os outros `ops:*`, sem `@SemEscopo`;
  id que não é UUID dá `ArgumentoInvalido` (saída 2)

## 7. Dado pessoal

- **Campos**: as linhas da A1 em `docs/lgpd.md`. Log só com ids; nada vai a terceiro
- **Auditoria**: `professor.cadastrado`, sem `contaNova`; `convite.*` com o tipo; `lista.gravada`, também no avulso,
  só com ids e contagens; `lista_nome.retirado`; `acesso_turma.*`; `reivindicacao.decidida` com `decidida_como`, sem
  `teve_matricula_errada`. A coordenação grava `turma.lista_lida` e `turma.reivindicacoes_lidas` a cada leitura; o
  professor, não
- **Registro de acesso**: as rotas públicas não o gravam, para não ligar o pedido ao IP
- **`chaveEnvio`**: sorteada por envio, só na memória da página
- **Virada de ano**: o `encerrar`, na mesma transação, revoga os acessos, fecha os pendentes como `encerrada`, sem
  hash, chave, `teve_matricula_errada` nem `decidida_por` (recusar é decisão humana, regra 70 item 2), e apaga os
  nomes livres e reivindicados
- **Nome livre sai de fato**: é pré-cadastro, sem conta nem histórico; a minimização vence a exclusão lógica
- **Eliminação**: apaga, antes do usuário e na mesma transação, a `lista_nome` do aluno e os pedidos dela; o pedido do
  titular, no F3, cobre as duas (`TODO.md`)
- **Retenção**: pedido, vigência + 5 anos, sem nome; acesso e convite, 30 dias após vencer, revogar ou usar
- **DTO**: a página pública sem matrícula; link e código só na resposta que os cria

## 7b. Conformidade CNE

Sem IA. Não se aplica.

## 7c. Carga e falha

- **Caminho quente**: login. RF19, ~0,7/s; primeiro dia da escola (2.100), ~7/s
- **`rl:ip`**: `salas/*` contam no anônimo (3.000/min); a escola dá ~1.300/min. Várias escolas da mesma rede atrás de
  um IP de saída passam do teto: limite conhecido da A1, e o `rl:ip:sala` fica para o F2
- **Falhas**: banco fora, 503; Redis fora, o seguro em memória, teto dividido por `LIMITE_INSTANCIAS_API`
- **Métrica**: `sala.reivindicacao{resultado}` e `sala.limite_atingido{tipo}` (`escola`, `nome`, `turma`), sem
  escola (`METRICAS_COM_ESCOLA` é fechada), que vai no log
- **Alerta** "Código da turma errado em massa numa escola": `sala.limite_atingido{tipo="escola"}` acima de 10 por
  minuto, somadas as instâncias, por 5 min (`infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`); a rajada
  legítima não chega ao teto. O runbook, na entrada de mesmo nome, revoga os acessos da escola do log, sem ler IP
- **Carga**: K1 e K2

**Limites.** O `ContadorEmJanela` ganha a janela por parâmetro (10 min). Com 60 códigos ativos, um IP no teto do
`rl:ip` acerta em 7 dias com ~0,2%, e N IPs, N vezes: é o que o alerta pega. O primeiro dia erra ~420 códigos.

| Conta (chave HMAC) | Teto em 10 min | Acima dele |
|---|---|---|
| código errado, por escola | 1.000 | `tipo="escola"`; 1 s de espera antes da busca, sem conexão do pool presa; o certo entra |
| matrícula errada em nome livre, por (`acesso_turma`, `listaNomeId`) | 5 | `tipo="nome"`; `LIMITE_EXCEDIDO` só a esse nome, até "Gerar novo" |
| hash sem pedido criado, por turma | 150 | `tipo="turma"`; hash rebaixado no balde da escola, nunca recusa |

O reenvio com a mesma chave não conta em nenhum; o paralelo de uma matrícula errada conta duas vezes no nome, aceito.
Não há contador por navegador. `LIMITE_EXCEDIDO` sai com `Retry-After`.

**Corridas**: C1 a C11; colisão do código sorteia de novo num savepoint.

## 9. Frontend

- **Casca** (`docs/interface.md` 11.1): coordenação, Estrutura (pedidos dentro da turma) e Professores; professor,
  Turmas; aluno, Minha turma.
  Guarda de papel em `rotas.tsx` (W2, W12)
- **Seletor** (P30): escola, rede e papel, sem número de turmas; a troca faz `resetQueries` com o token novo
- **Fronteira**: a `FronteiraDaOperacao` vira genérica em `componentes/`, com `Suspense` e `EstadoCarregando` em volta
  de cada área nova, que tem teto no `.size-limit.json`
- **Decisão**: "Aprovar N" (`oficial`) revisa turma, nomes e efeito, e avisa a coordenação da auditoria; "Recusar"
  (`perigo`) confirma; depois, texto por pedido (W6). Até 40, explicado. O pedido mostra se houve tentativa com
  matrícula errada no nome. Para o professor, atualiza a cada 15 s com a aba visível (W15); a coordenação usa
  "Atualizar"
- **Acesso**: "Gerar novo" confirma que o atual cai, inclusive o de outro professor da turma, e diz que destrava os
  nomes travados
- **Página pública**: nomes e `chaveEnvio` só em memória; um envio no ar; o 503 reenvia a mesma chave até 3 vezes,
  pelo `Retry-After` com variação aleatória, depois "Tentar de novo"; campos do W11; fica na entrada (150 kB)
- **Textos** (`MENSAGENS_DA_SALA`, exatos no W9): o servidor responde igual, e a página escolhe o de `NAO_ENCONTRADO`
  pelo caminho que usou, código ou link. O do limite, "Muitas tentativas agora. Espere N minutos ou chame o
  professor.", vale pelo nome e pelo `rl:ip`
- **Lista**: arquivo lido como texto (UTF-8 ou windows-1252), com exemplo

Quatro estados em toda tela (W4): carregando é `EstadoCarregando`; erro, `EstadoErro`.

## 10. Testes

Em `cenarios.md`, parte desta spec: lista fechada, um id por teste, com a cláusula que o quebra.

## 11. Conformidade com as regras

- **00**: lista na hora, sem fila, porque tem teto; nota em `docs/infra.md` 3.5
- **10**: dois `@SemEscopo` contidos em `sessao`. Desvio: a conta global de professor serve a várias escolas (RF7),
  quarto afrouxamento da D71, só com dado sintético
- **50**: seletor sem sigla e turno, que não existem, nem número de turmas, de outra escola
- **80**: o RF14 diz "segura o código"; o desenho segura por nome e só atrasa por escola: segurar o código trancaria a
  escola por um ator só
- **20, 40, 60, 70**: seções 7, 10 e 5; sem IA

## 12. Premissas não verificadas

- ⚠️ NÃO VERIFICADO: `wa.me/?text=` abre o WhatsApp no Chromebook e no celular; senão, copia
- ⚠️ NÃO VERIFICADO: o Excel brasileiro grava CSV em windows-1252 com `;`; a leitura aceita os dois

## 13. Riscos técnicos

- **Conta global de professor**: o aceite revela se o e-mail tem conta, e a senha de uma conta global é definida por
  quem tem o link. Tolerado pela D71 revista; fecha com a prova de posse do e-mail, item do "Portão da
  primeira escola real" do `ROADMAP.md`
- **Ator dentro da sala** vê o código novo projetado e pode travar os nomes de novo
- **A fronteira movida** pode mudar a A0b; o e2e dela roda junto
