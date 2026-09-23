# Correção — o corte de 100 ms do cliente Redis do login recusa o desafio no runner carregado, e o e2e vê 401

**Origem:** esteira run 35705342652, **primeira tentativa** (job `e2e`, commit `64cba89`); registrada no
`TODO.md` pelo commit `8e78563`
**Subagentes obrigatórios:** `infra-guardian`
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`e2e/escola-e-vinculos.spec.ts:185` no projeto `celular` falhou com a tela "Escolher a escola" e o
alerta *"Sua sessão não é válida ou expirou"*, depois de ativar o segundo fator e entrar de novo:

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Olá, Professora sintética 14c5928c' })
Timeout: 20000ms
  at esperarEscola (e2e/escola-e-vinculos.spec.ts:57:69)
  at e2e/escola-e-vinculos.spec.ts:204:11
```

O traço publicado (artefato `traco-do-e2e`, correção `2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou`)
deu a sequência exata, e o despejo de log da falha deu a causa no mesmo `requisicaoId`:

```
POST /v1/sessao/email       200   08:41:28.789
POST /v1/sessao/escola      401   08:41:29.640  (recusado pela API em 08:41:29.754)

api-1-1 | {"level":"warn","time":"…:29.754Z","requisicaoId":"f11af102-…","origem":"login","msg":"login.desafio_sem_redis"}
api-1-1 | {"level":"warn","time":"…:29.755Z","requisicaoId":"f11af102-…","evento":"http.erro","status":401,"codigo":"NAO_AUTENTICADO"}
```

## Causa

Não é o MFA, e não é o desafio: é o **prazo do cliente Redis do login**.

`ConsumoDeDesafio.conferirLivre` e `.consumir` recusam o desafio quando o comando no Redis de fila não
volta, e o cliente da API (`criarClienteRedisDaApi`) desiste em `TIMEOUT_COMANDO_REDIS_API_MS` = 100 ms.
Na esteira o comando passou dos 100 ms, a recusa virou `NAO_AUTENTICADO`, e a professora voltou à tela da
escolha. A conexão estava **aberta e sadia** o tempo todo: `login.redis_indisponivel` (o ouvinte de erro do
ioredis) não aparece nenhuma vez no despejo, e o `redis-fila` não reiniciou nem reclamou. Foi o `catch` do
comando lento, não o caminho do Redis fora.

A recusa em si é o desenho (Tech Spec da identidade, seção 5; tarefa 15.5): sem a marca no Redis não dá para
saber se o desafio ainda vale, e um Redis travado não pode segurar a requisição do aluno (regra 80).
**Em produção os 100 ms estão certos** — Redis gerenciado na mesma região responde um `EXISTS`/`SET NX` em
poucos milissegundos no p99, com dezenas de vezes de folga. O que não representa produção é o runner: ele roda
Postgres, dois Redis, observabilidade, doze contêineres nossos e dois projetos do Playwright com CPU
estrangulada na mesma máquina de 2 núcleos.

Já foi o mesmo estouro, no mesmo lugar, na suíte de integração
(`2026-09-18-contador-testado-com-o-prazo-de-producao`). Aquela correção trocou o cliente nos testes que não
provam o corte, e deixou escrito em "O que fica em aberto" o que faltava, que é exatamente este caso:

> **Os testes que sobem a API inteira têm a mesma exposição**, e neles não dá para trocar o cliente: o
> `SessaoModule` cria o cliente de login com `criarClienteRedisDaApi`. […] Se isso aparecer na esteira, a
> correção é dar ao compose de teste um prazo maior para o cliente Redis da API, por configuração, mantendo
> os 100 ms em produção e nos testes que provam o corte.

A API do compose é a última que ficou com os 100 ms sem ter como afrouxá-los: a montagem de teste
(`MONTAGEM_DE_TESTE`) só alcança quem monta o `AppModule` dentro do runner, e não o contêiner que o e2e sobe.

## Teste que reproduz

`apps/api/test/troca-de-escola.int.test.ts` › *"esteira: com o Redis de fila respondendo acima dos 100 ms, a
escolha da escola continua entrando"*.

Monta a API **como o contêiner do compose a monta** (sem `MONTAGEM_DE_TESTE`), põe o Redis de fila para
responder em 1 s (`CLIENT PAUSE`, o Redis conectado e sem responder — o que o runner carregado faz sozinho) e
conclui a etapa `escolher`.

Vermelho antes, com a mesma recusa da esteira:

```
AssertionError: expected 'nao_autenticado' to be 'pronta' // Object.is equality
    expect(escolhido.corpo['etapa']).toBe('pronta')
```

Verde depois. O corte dos 100 ms continua provado, sem mudança, por quem monta o **cliente** de produção de
propósito: `desafio.int.test.ts` ("Redis de fila fora" e "Redis de fila travado"),
`contador-de-tentativas.int.test.ts`, `contador-em-janela.int.test.ts` e `limite.int.test.ts`. Nenhum deles
passa pela configuração.

Pela **aplicação montada**, quem provava o corte era `ataque-de-senha.int.test.ts` › *"falha (15.5)"*, e ele
provava pela ausência da opção de montagem. Com esta correção, ausência da opção deixou de significar
"produção": significa "o que o `AMBIENTE` disser", e o ambiente de teste é `local`. O caso foi refeito
(achado 1 do `test-engineer`): monta com `{ login: { prazoDoRedisMs: TIMEOUT_COMANDO_REDIS_API_MS } }`, pelo
`SobreposicaoDeTeste.login` novo, e afirma que a recusa sai em menos de `TIMEOUT_COMANDO_REDIS_FILA_MS / 2`.
Sem a asserção de duração, jogar a configuração fora e afrouxar produção deixaria a suíte inteira verde;
com ela, `opcoes.prazoDoRedisMs ?? 2_000` fica vermelho em `expected 2011 to be less than 1000` (mutação
verificada).

O prazo entra pela configuração e não por `AMBIENTE: 'staging'`: com `staging`, a configuração externa exige
https no emissor e no retorno do login pela conta da escola, e o `oidc-falso` é http — a API nem sobe
(`ConfiguracaoInvalida: LOGIN_EXTERNO_GOOGLE_EMISSOR, LOGIN_EXTERNO_MICROSOFT_EMISSOR`). Está escrito no
docblock do campo para ninguém tentar de novo.

A fiação fica provada em duas metades que se encontram em `ConfiguracaoLogin.prazoDoRedisMs`: `config.test.ts`
vai da variável e do ambiente até o campo (incluindo a recusa em produção e no staging, e o valor que cada
projeto compose dá de fato); `ataque-de-senha.int.test.ts` e `troca-de-escola.int.test.ts` vão do campo até o
cliente.

## Correção

O prazo do cliente Redis do login passou a ser configuração, `LOGIN_REDIS_PRAZO_MS`, obrigatória como as
outras. **Ela só aperta**: até o corte de 100 ms passa em qualquer ambiente, e acima dele a API recusa subir
com `AMBIENTE=producao` ou `staging` (`prazoDoRedisDoLoginVale`, no mesmo molde do `LOGIN_PROTECAO_DESLIGADA`).
`AMBIENTE` ausente ou inválido vale como `producao`, a leitura mais restrita — defesa em profundidade, porque
`esquemaAmbienteIdentidade` já derruba o boot antes.

| ambiente | valor | por quê |
|---|---|---|
| produção, staging | 100 ms; acima disso a API não sobe | o desenho da regra 80; o staging ensaia a produção |
| `.env.example` (desenvolvimento e compose de teste) | 2 s | ali tudo divide a mesma CPU, e 100 ms é o tempo normal da máquina |
| `infra/carga.env` (cenário "login às 7h30") | 100 ms | é onde o corte é medido com a rajada; com 2 s o cenário deixaria de prová-lo |

A primeira versão desta correção decidia o prazo só pelo `AMBIENTE`, sem variável. Não servia: o projeto de
carga também sobe com `AMBIENTE=local` (`ARQUIVOS_AMBIENTE_CARGA`), então o cenário "login às 7h30" — o único
lugar onde o corte é medido com 2.100 contas em rajada — teria passado a medir 2 s, em silêncio
(`infra-guardian`, rodada 1). Trocar o `AMBIENTE` do projeto de carga para `staging` não resolve: aí a
configuração externa exige https no emissor, e o `oidc-falso` é http.

Nada muda no `ConsumoDeDesafio`, nem no que a API faz quando o Redis não responde: o desafio continua sendo
recusado com `login.desafio_sem_redis` e o sinal do seguro. O que muda é o prazo a partir do qual "não
respondeu" começa a valer, e só fora de produção.

`docs/infra.md` (5.2) e `docs/runbook.md` (item 4 do Redis) passaram a dizer os dois prazos, para ninguém
procurar um Redis travado por causa de uma máquina ocupada — e para o operador de staging reconhecer o
sintoma, que lá continua sendo o de produção.

Seis docblocks afirmavam que o prazo do cliente do login era sempre 100 ms fora da montagem de teste, ou que
montar sem ela dava "os 100 ms de produção": `packages/nucleo/src/redis/clientes.ts` (o do próprio parâmetro),
`apps/api/src/sessao/sessao.module.ts`, `apps/api/src/sessao/desafio.ts`, `apps/api/src/app.module.ts`,
`apps/api/test/api-com-sessao.ts` e `apps/api/test/configuracao-de-teste.ts`. Era o comentário que escondeu o
achado 1, e foram corrigidos junto.

## O que fica em aberto

No mesmo runner, os clientes `api-limite` (`limite.module.ts`) e `api-uso` (`uso.module.ts`) continuam
cortando em 100 ms. Nenhum dos dois recusa login — `ContadorDeUso` é fire-and-forget e `LimitadorDeRequisicoes`
cai no seguro em memória —, então não é o mesmo defeito, e esta correção não os toca. Mas eles vão gerar
`limite.seguro_ativo` e avisos durante o e2e, e o seguro do limitador usa `limite ÷ instâncias`: no runner, com
o Redis de cache lento, o teto cai pela metade e o sintoma do próximo intermitente pode ser **429**, não só
aviso. Se um vermelho novo apontar para ali, a causa já está escrita aqui (`test-engineer` e `infra-guardian`,
rodada 1).

O piso de `LOGIN_REDIS_PRAZO_MS` não é 1: é um décimo do corte (`PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS`). Um prazo
de poucos milissegundos estoura no tick seguinte, como o zero, e viraria desafio recusado e contador no seguro
em todo login — apertar até sumir não é apertar (`test-engineer`, rodadas 3 e 4).

O piso é `Math.round` do décimo, e não a divisão crua: ele alimenta um `z.coerce.number().int()`, e um corte que
não fosse múltiplo de 10 daria piso fracionário — o valor logo abaixo dele passaria a ser recusado pelo `.int()`
e não pelo piso, com o teste verde pelo motivo errado. Os dois revisores apontaram isso, cada um por si.

A lista do `TODO.md` "valores que o staging e a produção não herdam do `.env.example`" virou caso executável
em `config.test.ts`. Ela já nasceu maior do que a prosa dizia: além do prazo do Redis, os dois emissores do
login pela conta da escola apontam para o `oidc-falso` em http, e em produção soma `ROTAS_SINTETICAS`. Quando
outra variável entrar na mesma classe, o caso falha e a lista é atualizada junto.

A opção de montagem `MONTAGEM_DE_TESTE` (`prazoDoRedisDeLoginMs`) ficou **quase redundante**: ela fixa 2 s, e
o compose de teste já dá 2 s pela variável. Só continua valendo para um teste que monte com outra
configuração. Com isso, inverter a precedência do `??` em `sessao.module.ts` não deixa nenhum teste vermelho
(`test-engineer`, rodada 3), porque os dois lados valem o mesmo. Tirar a opção é limpeza de sete arquivos de
teste, fora do escopo de uma correção: fica para o `/retro`, e com ela sai também a precedência sem teste.

A lista executável é do que o boot **recusa**, e essa é a metade fácil. A perigosa é o que ele aceita: as chaves
sintéticas do `.env.example` têm 32+ caracteres e sobem em produção sem uma palavra. O item do `TODO.md` separa
as duas metades, e isso é anterior a esta correção (`test-engineer`).

Quatro sobras pequenas das últimas rodadas, todas registradas como recomendação e nenhuma bloqueante:

- **`Math.ceil` serviria melhor que `Math.round` no piso** (`infra-guardian`): um corte que não fosse múltiplo
  de 10 pode arredondar para baixo (104 → 10, não 11), e um corte abaixo de 5 daria piso 0, justamente o valor
  que o piso existe para barrar. Hoje não muda nada — o corte é 100 e está fixado por
  `contador-de-tentativas.int.test.ts` —, e a asserção de piso inteiro pega a armadilha que importava.
- **O "nunca abaixo de 10" do `.env.example` é prosa** (`test-engineer` e `infra-guardian`): não está amarrado à
  constante, e é conselho onde deveria dizer que o boot recusa. Vale junto com os outros "100 ms" repetidos em
  `docs/infra.md` e no runbook, que envelhecem calados pelo mesmo motivo.
- **`lerConfiguracaoLogin` lança no primeiro `if` em vez de somar** os problemas como `lerConfiguracao` faz, então
  uma segunda recusa dependente de `AMBIENTE` dentro dela não entraria na lista do caso do `.env.example`. O
  comentário do teste diz isso; fazer a soma muda a saída de erro de boot de um leitor inteiro, e é `/retro`.
- **A reexportação em `infra/scripts/carga.ts`** existe só para `carga-login.ts` não mudar de caminho de import.
  Cosmética.

Dois botões que continuam abrindo o mesmo buraco por fora, os dois anteriores a esta correção
(`infra-guardian`): na interpolação do compose, a variável do shell vence o `--env-file`, então
`LOGIN_REDIS_PRAZO_MS=2000 npm run carga:login` mede o prazo de desenvolvimento sem avisar — vale para o
argon2 do mesmo arquivo. O caminho é `conferir-carga-login.ts` ler o valor efetivo do contêiner e reprovar o
cenário quando ele diferir de `infra/carga.env`. E `lerAmbienteDeCarga` não enxerga
`infra/compose.carga.yml`: um `environment:` de lá passaria despercebido.

Duas coisas para a criação do staging (`docs/infra.md` 6 e 9), do `infra-guardian`: o Redis de staging precisa
ser gerenciado na mesma região (D26), porque o staging é o único ensaio do corte que sobrou fora de produção; e
o risco de falso vermelho numa demonstração externa existe, mitigado pela linha do runbook que diz como o
sintoma se parece lá.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-22 16:18:30 | 2026-09-22 16:24:40 | `test-engineer` | 1 | REPROVADO | acd161481413d0060 |
| 2026-09-22 16:59:42 | 2026-09-22 17:04:30 | `test-engineer` | 2 | REPROVADO | aec7d9adfbdc3e3a5 |
| 2026-09-22 16:59:53 | 2026-09-22 17:05:19 | `infra-guardian` | 1 | REPROVADO | aae388e040e51f643 |
| 2026-09-22 17:41:31 | 2026-09-22 17:45:11 | `infra-guardian` | 2 | APROVADO | a57550e3ac4ae3e04 |
| 2026-09-22 17:41:17 | 2026-09-22 17:45:48 | `test-engineer` | 3 | REPROVADO | a65455be0350faddc |
| 2026-09-22 18:18:57 | 2026-09-22 18:25:11 | `test-engineer` | 4 | APROVADO | ab00ce91d6c5d43c3 |
| 2026-09-22 18:59:12 | 2026-09-22 19:02:38 | `infra-guardian` | 3 | APROVADO | a6c3adf413871e83d |
| 2026-09-22 18:58:59 | 2026-09-22 19:03:20 | `test-engineer` | 5 | APROVADO | a1471dd017281f5df |
| 2026-09-22 19:43:25 | 2026-09-22 19:45:57 | `infra-guardian` | 4 | APROVADO | a25a60f32e571b7ca |
| 2026-09-22 19:43:14 | 2026-09-22 19:46:27 | `test-engineer` | 6 | APROVADO | ab20d8719495131a1 |
