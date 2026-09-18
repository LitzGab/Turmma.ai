# Correção — o gitleaks lê como chave a senha sintética do teste do convite, e o histórico reprova

**Origem:** portão local da correção `2026-09-18-contador-testado-com-o-prazo-de-producao`; a esteira do
commit `ce0e698` (tarefa 7.0) vai reprovar pelo mesmo motivo
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`

## Sintoma

`tools/guardas/gitleaks.int.test.ts › o histórico do próprio repositório passa` falhou:

```
Finding:     deB.token, 'REDACTED'
RuleID:      generic-api-key
Entropy:     3.606937
File:        apps/api/test/convite.int.test.ts
Line:        330
Commit:      ce0e69869753ce14ee4d983869ff536d5058a831
```

## Causa

A linha 330 do teste de concorrência do convite, que entrou na tarefa 7.0, é:

```ts
const [emA, emB] = await Promise.all([aceitar(deA.token, 'senha-escolhida-em-a-1'), aceitar(deB.token, 'senha-escolhida-em-b-2')])
```

A regra `generic-api-key` do gitleaks lê `token, '<texto>'` como uma chave atribuída, e a senha
sintética `senha-escolhida-em-b-2` passa do limiar de entropia. Não é segredo: é a senha que o
teste escolhe para uma conta sintética de um banco de teste, que nasce e morre no teste.

O commit já está no `main`, e a varredura é do histórico inteiro: mudar a linha agora não
adiantaria, porque o commit antigo continuaria reprovando.

## Teste que reproduz

O próprio teste da guarda, `o histórico do próprio repositório passa`, vermelho no portão com a
saída acima.

## Correção

Uma exceção no `.gitleaks.toml`, na forma que o projeto usa para toda exceção: o **arquivo exato E
a linha exata**, com o motivo. Nenhuma pasta, extensão ou regra inteira fica de fora.

O teste `reprova o segredo nos arquivos que têm linha na allowlist: a exceção é da linha, não do
arquivo` passou a incluir `apps/api/test/convite.int.test.ts`: um segredo de verdade em qualquer
outra linha desse arquivo continua reprovando.

Com a exceção, os seis testes da guarda passam, inclusive o do histórico.

## Para não repetir

Em teste, senha sintética passada logo depois de um `.token` ou `token =` tende a cair na
`generic-api-key`. Nomear a senha numa constante (`const SENHA_EM_A = '...'`) e passá-la por nome
evita o padrão.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 08:24:13 | 2026-09-18 08:24:39 | `privacy-guardian` | 1 | APROVADO | a3ecaf50610dcb007 |
| 2026-09-18 08:24:09 | 2026-09-18 08:24:40 | `test-engineer` | 1 | APROVADO | ad70333008792dbac |

## Ajustes das revisões

- **Âncora no começo da linha:** as três exceções do `.gitleaks.toml` passaram a começar com `^\s*`.
  Antes, um segredo colado antes do começo da linha perdoada, na mesma linha física, seria perdoado
  junto (`privacy-guardian` e `test-engineer`).
- **Teste do arquivo:** um caso novo prova que a linha perdoada, colada em outro arquivo, reprova. Ele
  quebra se alguém trocar o `AND` ou alargar o `paths` (`test-engineer`).

Os sete testes da guarda passam, inclusive o do histórico.
| 2026-09-18 08:25:10 | 2026-09-18 08:25:28 | `privacy-guardian` | 2 | APROVADO | acaf6175952c22cd9 |
| 2026-09-18 08:25:08 | 2026-09-18 08:25:54 | `test-engineer` | 2 | REPROVADO | ae58f9c4ce37ca1ad |

### Rodada 2 do `test-engineer`: o teste novo era ele mesmo um achado

O caso "a linha perdoada em outro arquivo reprova" tinha a linha do convite escrita como texto no
próprio arquivo de teste da guarda, que não tem exceção. Os testes passavam só porque a mudança
ainda não estava commitada; depois do commit, o teste do histórico reprovaria este arquivo, o
mesmo sintoma que a correção veio resolver. O revisor reproduziu com um repositório temporário.

Agora a linha é lida em tempo de execução do arquivo real do convite, e o teste falha com mensagem
própria se ela sair de lá (a exceção teria ficado velha). Entrou também o caso que prova a âncora
`^\s*`: um token falso colado antes da linha perdoada, na mesma linha, reprova.

**Commit simulado:** repositório temporário com o `.gitleaks.toml`, o teste da guarda e o teste do
convite nos caminhos reais, um commit, e a varredura com os mesmos argumentos da esteira:
`no leaks found`. Os oito testes da guarda passam.

**Para o `/retro`:** literal que imita segredo, dentro de teste da própria guarda, precisa ser
montado em tempo de execução (como o `tokenFalso()`); e a prova de uma mudança na allowlist é a
varredura depois do commit, não os testes com a mudança ainda fora dele.
| 2026-09-18 08:26:58 | 2026-09-18 08:27:21 | `privacy-guardian` | 3 | APROVADO | ab961ec6dfb0be50f |
| 2026-09-18 08:26:55 | 2026-09-18 08:27:46 | `test-engineer` | 3 | APROVADO | ace7981292c62b794 |
