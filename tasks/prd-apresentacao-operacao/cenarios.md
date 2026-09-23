# Cenários de teste — Identidade do operador Turmma (A0)

Parte da Tech Spec (`techspec.md`, seção 10): cada cenário é um teste, e a tarefa que o cobre cita o
identificador. A lista é fechada; mudar exige revisar a spec. Saiu das rodadas 1 a 3 do
`/revisar-spec`, sem o que foi para a A0b.

## Comando (integração)

- **C1** Sem operador ativo, `criar` aceita o `OPERADOR` do ambiente e grava autor `bootstrap`
- **C2** Com operador ativo, `OPERADOR` inexistente ou desativado é recusado em `criar` e em todo
  `ops:*` (escola, convite de coordenador, revogar convite, redefinir MFA, uso)
- **C3** Dois `criar` de bootstrap em paralelo: um cria, o outro é recusado
- **C4** `criar`, `desativar` e `convite` gravam `AuditoriaOperacao` com autor igual ao `OPERADOR` e o
  operador alvo certo
- **C5** `desativar` de apelido inexistente dá erro tipado; desativar a si mesmo e o último ativo é
  recusado; A desativa B e B desativa A em paralelo: um passa, e resta um operador ativo
- **C6** Depois de `desativar`, a linha do operador tem só id, apelido e datas; os códigos somem; o
  convite pendente fica revogado; as sessões, encerradas. Falha injetada no meio não deixa estado
  parcial. A sessão aberta recebe `SESSAO_ENCERRADA` na requisição seguinte
- **C7** `convite` com um pendente revoga o anterior: o link antigo responde igual a revogado, e o
  único parcial impede dois pendentes
- **C8** O arquivo do token nasce com modo 0600

## Convite (integração)

- **C9** `consultar` e `aceitar` com convite usado, vencido, revogado e inexistente: status e corpo
  iguais, nas duas rotas
- **C10** Dois `aceitar` em `Promise.all`: uma senha gravada, o outro recusado com erro tipado
- **C11** Operador desativado com convite pendente não aceita

## Desafio e segundo fator (integração)

- **C12** O mesmo desafio em duas `/sessao/mfa` paralelas, com dois códigos válidos, cria uma sessão
  só; reenviado depois do sucesso, é recusado
- **C13** Com o Redis fora, o desafio é recusado com 503, nunca aceito
- **C14** Desafio `configurar_mfa` em `/sessao/mfa`, e `mfa` em `/mfa/configurar`: recusados
- **C15** `/sessao/email` devolve `configurar_mfa` só dentro das 72 h do convite aceito e sem
  segundo fator ativo, com relógio controlado: às 71h59 devolve, às 72h01 responde igual a senha
  errada
- **C16** Conta com segundo fator ativo: `/mfa/configurar` não muda segredo nem códigos
- **C17** `configurar` consome o desafio (o mesmo desafio reenviado é recusado) e devolve um de etapa
  `mfa` com a versão do segredo; a ativação só acontece no primeiro `/sessao/mfa` com código válido
- **C18** Dois `configurar` em `Promise.all`: o segredo gravado e os códigos válidos são da mesma
  aba, e nenhum código da outra vale; o código da aba vencedora ativa, e o da outra recebe
  "configure de novo"
- **C18b** O `/sessao/mfa` da aba A em paralelo com o `configurar` da aba B nunca ativa um segredo
  diferente do conferido
- **C19** O mesmo TOTP duas vezes, em sequência e em paralelo: a segunda é recusada
- **C20** O mesmo código de recuperação duas vezes, em sequência e em paralelo: a segunda é recusada;
  antes da ativação, código de recuperação não vale
- **C21** Desafio de operador não serve de bearer em nenhuma rota

## Entrada (integração)

- **C22** E-mail inexistente e senha errada: status e corpo iguais
- **C23** Dez erros na conta X seguram X com espera crescente; a conta Y do mesmo IP entra
- **C24** O mesmo e-mail como operador e como coordenador: errar num não segura o outro, nos dois
  sentidos
- **C25** Depois de uma `entrada_falha` com e-mail sentinela, o e-mail não está em `AcessoOperacao`
  nem no log

## Sessão (integração)

- **C26** Trinta minutos parado dão `SESSAO_ENCERRADA`; uso aos 29 min mantém a sessão viva aos 31
- **C27** Oito horas dão `SESSAO_ENCERRADA`, mesmo com uso contínuo
- **C28** `/renovar` é recusado depois de 30 min parado, de 8 h, de sair e de desativar
- **C29** Acesso vencido com a sessão viva dá `ACESSO_VENCIDO`; renova, e a ação seguinte passa
- **C30** Duas renovações em paralelo: uma rotaciona e a outra vale pelo anterior por 30 s; o
  anterior reusado depois disso encerra a sessão
- **C31** Banco fora na conferência da sessão e no `/renovar` dá 503 `INDISPONIVEL_TENTE_DE_NOVO`,
  nunca 401 nem 404

## Limite (integração e arquitetura)

- **C32** `convite/consultar`, `mfa/configurar`, `renovar` e `sair` acima do `rl:ip` respondem 429
  `LIMITE_EXCEDIDO` com `Retry-After`
- **C33** `sessao/email` e `convite/aceitar` acima do limite do IP não respondem 429: rebaixam no
  semáforo do hash, e quem recusa é o contador da conta
- **C34** `sessao/mfa` é recusado pelo contador do `operador.id`, não pelo IP
- **C35** Com dois operadores atrás do mesmo IP, `rl:op:{sub}` recusa um em `/eu` e o outro continua
- **C36** Arquitetura: toda rota `@EntradaDeOperacao` está num dos três grupos de limite da seção 5,
  e toda rota `@RotaDeOperacao` conta pelo `rl:op:{sub}`
- **C36b** Com o Redis fora, `rl:ip` e `rl:op` seguem o seguro em memória do F1, sem erro cru

## Registros e retenção (integração)

- **C37** Entrada, falha de entrada e saída vão para `AcessoOperacao`, com IP; criar, desativar,
  segundo fator configurado e convite gerado e revogado vão para `AuditoriaOperacao`; o autor vem
  do comando no comando e da sessão no segundo fator
- **C38** Expurgo com relógio controlado, pelo `apagarLoteVencido`: convite usado, revogado e vencido
  com 29 e 31 dias; sessão encerrada e só expirada com 29 e 31 dias; acesso com 6 meses menos e mais
  um dia. `AuditoriaOperacao` intacta em qualquer idade, e `Operador` nunca apagado
- **C39** `Cache-Control: no-store` nas respostas de `aceitar`, `configurar`, `mfa` e `renovar`; o
  contrato estrito recusa campo a mais na entrada e não deixa sair campo a mais

## Isolamento e arquitetura

- **C40** Os dois marcadores só aparecem em `apps/api/src/operacao/`, em método e em classe
- **C41** Toda rota `@RotaDeOperacao` tem a `GuardaDeOperador` no handler resolvido
- **C42** Todo caminho `/v1/operacao` tem marcador, e todo marcador está sob `/v1/operacao`
- **C43** As rotas `@EntradaDeOperacao` são exatamente as sete da seção 4
- **C44** Nenhuma rota registrada cria operador
- **C45** O `OperadorRepository` só toca as seis tabelas da operação, por `import` e pelo nome físico
  em `sql\`\``; e elas só são tocadas por ele e pelo expurgo (fora schema, barrel e migrations)
- **C46** Sessão de coordenador, professor e aluno, desafio de escola e cookie `educa_sessao`, em toda
  rota `/v1/operacao/*` (lista gerada das rotas registradas): igual a rota inexistente, em status e
  corpo; as de entrada nunca produzem sessão de operador a partir deles
- **C47** Token, desafio e cookie de operador: nas rotas de escola com sessão, igual a rota
  inexistente; nas de entrada da escola, nunca produzem sessão nem desafio de escola
- **C48** Tirar a guarda de um handler deixa C41 e C46 vermelhos
- **C49** Repository de escola chamado dentro de uma rota de operador falha com erro: o contexto só
  leva `operadorId`

## Web (e2e em `chromebook` e `celular`, com axe)

- **E1** Convite, senha, configurar (QR, chave em texto, `otpauth://`, códigos uma vez com "Copiar"
  anunciado), código e casca da operação
- **E2** Sessão encerrada volta à entrada com a mensagem; o 503 fica na tela com a mensagem
- **E3** Aviso 2 min antes dos 30 min parados
- **E4** Falha ao carregar o chunk mostra a fronteira de erro com "Tente de novo"
- **E5** O e2e do F1 continua verde na pele nova; o CSS servido tem os hex dos tokens e não tem
  `oklch(` nem `color-mix(`

## Unidade e build

- **U1** `FORMATO_OPERADOR` no comando
- **U2** Chave do contador com os dois prefixos
- **U3** `estilos.test.ts`: só os nomes do `@theme` da 9.9, sem modificador de opacidade
- **B1** Orçamento: 150 kB brotli na entrada e 60 kB em `operacao-*.js`
- **B2** Nada importado pela entrada da escola vem de `apps/web/src/operacao/`
