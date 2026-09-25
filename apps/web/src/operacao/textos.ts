import { CodigoDeErro, formatarEspera, MENSAGENS_DE_ERRO, mensagemDaEntrada, mensagemDoSegundoFator, type TipoDeRede } from '@educa/shared'
import { ErroDaApi } from '../api/cliente'

/**
 * Os textos da área do operador (Tech Spec da A0, seção 9). Ficam aqui, no chunk da operação, e não no catálogo de
 * `packages/shared`: nenhuma tela da escola os mostra, e o catálogo inteiro vai na entrada que o Chromebook baixa.
 */

/** A sessão que terminou (30 min parada, 8 h, saída, operador desativado): a pessoa volta à entrada com isto. */
export const TEXTO_DA_SESSAO_ENCERRADA = MENSAGENS_DE_ERRO[CodigoDeErro.SESSAO_ENCERRADA]

/** O 503 da operação (banco ou Redis fora): diz o que fazer e a tela fica onde está. */
export const TEXTO_DA_OPERACAO_INDISPONIVEL = 'O Turmma está indisponível agora. Tente de novo em instantes.'

/**
 * O código do segundo fator que não passou: a API queima o desafio em toda tentativa (tarefa 7.0), certa ou errada, e
 * o caminho é refazer o e-mail e a senha. A tela não diz se o código estava errado, já usado ou se o desafio venceu.
 */
export const TEXTO_DO_CODIGO_RECUSADO = 'O código não foi aceito. Entre de novo com o e-mail e a senha, e use o código que o aplicativo mostrar então.'

/** O "Sair" que a API não confirmou: o cookie da sessão pode continuar valendo neste navegador. */
export const TEXTO_DA_SAIDA_NAO_CONFIRMADA =
  'Não foi possível confirmar a saída com o servidor. Se este computador é compartilhado, feche o navegador antes de deixá-lo.'

/** O código da falha, ou erro interno para o que não veio da API. */
function codigoDe(erro: unknown): CodigoDeErro {
  return erro instanceof ErroDaApi ? erro.codigo : CodigoDeErro.ERRO_INTERNO
}

/**
 * O 503 `TEMPO_ESGOTADO` (a espera da trava ou da consulta passou do `statement_timeout`): nada foi gravado, e tentar de
 * novo resolve (cenário W10 da A0b).
 */
export const TEXTO_DO_TEMPO_ESGOTADO = 'A operação demorou demais. Tente de novo em instantes.'

/**
 * O 429 do limite do operador (`rl:op`), com a espera que a API mandou no `Retry-After` (cenário W10 da A0b). O número
 * vem da nossa resposta, nunca do que foi digitado; sem ele, "em instantes".
 */
export function textoDoLimite(esperaSegundos: number | undefined): string {
  if (esperaSegundos === undefined || !Number.isFinite(esperaSegundos)) return 'Muitas ações seguidas. Tente de novo em instantes.'
  return `Muitas ações seguidas. Tente de novo em ${formatarEspera(esperaSegundos)}.`
}

/**
 * O texto de uma falha numa tela com sessão: o 503 da operação, o 503 `TEMPO_ESGOTADO` e o 429 têm o texto deles; o
 * resto, o do catálogo. O 401 `SESSAO_ENCERRADA` não chega a aparecer aqui: `chamarComSessaoDeOperador` já levou a aba à
 * entrada, com a mensagem de sessão encerrada.
 */
export function textoDaFalha(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  if (codigo === CodigoDeErro.TEMPO_ESGOTADO) return TEXTO_DO_TEMPO_ESGOTADO
  if (codigo === CodigoDeErro.LIMITE_EXCEDIDO) return textoDoLimite(erro instanceof ErroDaApi ? erro.esperaSegundos : undefined)
  return MENSAGENS_DE_ERRO[codigo]
}

/**
 * O endereço (`slug`) que já é de outra escola: o `CONFLITO` do `POST /v1/operacao/escolas` (Tech Spec da A0b, seção 7c).
 * Aparece no próprio campo, que é onde está o que corrigir (cenário W10).
 */
export const TEXTO_DO_ENDERECO_REPETIDO = 'Esse endereço já é de outra escola. Escolha outro.'

/** A falha do criar escola é o endereço repetido? É a única que volta ao campo; as outras ficam no alerta do diálogo. */
export function ehEnderecoRepetido(erro: unknown): boolean {
  return codigoDe(erro) === CodigoDeErro.CONFLITO
}

/**
 * A falha em que não se sabe se o servidor criou: a conexão caiu (a resposta pode ter se perdido depois da gravação) ou a
 * resposta veio fora do contrato. O 503 da trava (`TEMPO_ESGOTADO`), o 429 e os 4xx são recusas: nada foi gravado.
 */
export function ehResultadoIncerto(erro: unknown): boolean {
  const codigo = codigoDe(erro)
  return codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO || codigo === CodigoDeErro.ERRO_INTERNO
}

/**
 * O `CONFLITO` depois de uma tentativa de resultado incerto, com os dados mudados: o servidor pode ter criado a escola na
 * tentativa anterior, com o mesmo id e os dados de antes, e é isso que ele recusa agora, e não um endereço de outra
 * escola. A tela não chama isso de endereço repetido; manda conferir a lista, em vez de o operador criar a segunda.
 */
export const TEXTO_DA_TENTATIVA_INCERTA =
  'A tentativa anterior pode ter criado a escola antes de a conexão cair. Feche este diálogo e confira a lista antes de tentar de novo.'

/** O `CONFLITO` do refazer e do revogar: outra pessoa (ou outra aba) mexeu no convite antes (cenário W10). */
export const TEXTO_DO_CONVITE_QUE_MUDOU = 'O convite mudou. A lista foi atualizada.'

/** O `CONFLITO` do gerar: a escola já tem convite em aberto, ou a coordenação já entrou (cenário W10). */
export const TEXTO_DA_ESCOLA_COM_CONVITE = 'Esta escola já tem convite. Use Refazer para um link novo.'

/** O `NAO_ENCONTRADO` do refazer e do revogar: o convite já foi revogado (cenário W10). */
export const TEXTO_DO_CONVITE_QUE_NAO_VALE = 'Esse convite já não vale. A lista foi atualizada.'

/**
 * O `NAO_ENCONTRADO` do gerar: a escola do caminho não existe. No MVP nenhuma escola sai do sistema (F16), e por isso o
 * cenário W10 não o lista; o texto segue o dos outros dois, dizendo que a lista foi atualizada.
 */
export const TEXTO_DA_ESCOLA_QUE_NAO_EXISTE = 'Essa escola não foi encontrada. A lista foi atualizada.'

/** A falha de uma ação do convite: o texto, e se a lista deixou de valer e precisa ser recarregada. */
export interface FalhaDoConvite {
  readonly texto: string
  /** `CONFLITO` e `NAO_ENCONTRADO`: o estado que a tela mostrava não é mais o do servidor, e tentar de novo não resolve. */
  readonly listaMudou: boolean
}

/**
 * O texto de uma falha de gerar, refazer ou revogar (cenário W10): `CONFLITO` e `NAO_ENCONTRADO` têm o texto de cada
 * ação e mandam recarregar a lista; o resto (429, 503, 503 `TEMPO_ESGOTADO`) é o de `textoDaFalha`, e o mesmo botão tenta
 * de novo. Nenhum texto diz o código.
 */
export function falhaDoConvite(acao: 'gerar' | 'refazer' | 'revogar', erro: unknown): FalhaDoConvite {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.CONFLITO) return { texto: acao === 'gerar' ? TEXTO_DA_ESCOLA_COM_CONVITE : TEXTO_DO_CONVITE_QUE_MUDOU, listaMudou: true }
  if (codigo === CodigoDeErro.NAO_ENCONTRADO) return { texto: acao === 'gerar' ? TEXTO_DA_ESCOLA_QUE_NAO_EXISTE : TEXTO_DO_CONVITE_QUE_NAO_VALE, listaMudou: true }
  return { texto: textoDaFalha(erro), listaMudou: false }
}

/** O e-mail que não passa no contrato do convite (`esquemaEmailConvidado`). */
export const TEXTO_DO_EMAIL_INVALIDO = 'Escreva o e-mail inteiro, com @ e o domínio, com até 254 caracteres.'

/** Os tipos de rede, como o operador os lê no diálogo Nova rede. */
export const ROTULO_DO_TIPO_DE_REDE: Readonly<Record<TipoDeRede, string>> = {
  prefeitura: 'Prefeitura ou estado',
  grupo: 'Grupo educacional',
  independente: 'Escola independente',
}

/** A regra do endereço da escola, visível junto do campo: é a mesma do contrato (`esquemaSlugDaEscola`). */
export const REGRA_DO_ENDERECO = 'Só letras minúsculas sem acento, números e hífen entre eles, até 63. Exemplo: colegio-horizonte.'

/** O nome que não passa no contrato: vazio depois de tirar os espaços, ou longo demais. */
export const TEXTO_DO_NOME_INVALIDO = 'Escreva o nome, com até 200 caracteres.'

/** A lista vazia de verdade (nenhuma escola no sistema): o vazio convida a começar pela rede (cenário W7). */
export const TEXTO_DA_LISTA_VAZIA = { titulo: 'Nenhuma escola ainda.', descricao: 'Comece criando a rede.' } as const

/** O diálogo Nova escola sem rede nenhuma: a escola pertence a uma rede, que vem antes (cenário W7). */
export const TEXTO_SEM_REDE = 'Crie a rede primeiro. A escola pertence a uma rede, mesmo quando é a única dela.'

/** O texto de uma falha da entrada por e-mail e senha, com a espera da conta segurada quando a API a informou. */
export function textoDaFalhaDaEntrada(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  return mensagemDaEntrada(codigo, erro instanceof ErroDaApi ? erro.esperaSegundos : undefined)
}

/** O texto de uma falha do segundo fator que deixa a pessoa na tela (formato do código, 503). */
export function textoDaFalhaDoSegundoFator(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  return mensagemDoSegundoFator(codigo, erro instanceof ErroDaApi ? erro.esperaSegundos : undefined)
}

/**
 * O convite que não vale: usado, vencido, revogado, de operador desativado ou inexistente. A API responde igual aos
 * cinco (C9), e a tela também: nada aqui diz qual deles foi.
 */
export const TEXTO_DO_CONVITE_INVALIDO = 'Este convite não vale mais. Peça um novo à equipe.'

/**
 * "Configure de novo": o 409 `CONFLITO` do código, quando outra aba (ou janela) configurou o segundo fator depois desta
 * (tarefa 7.0, C18). A API gastou o desafio sem conferir o código, e o QR desta tela não vale mais; o caminho de volta ao
 * começo do configurar é o e-mail e a senha, que devolvem a etapa de configurar enquanto o segundo fator não estiver ativo.
 */
export const TEXTO_DO_CONFIGURE_DE_NOVO =
  'O segundo fator foi configurado de novo em outra aba, e o código QR desta não vale mais. Entre com o e-mail e a senha para configurar outra vez.'

/**
 * O código recusado durante a configuração: a API gastou o desafio (tarefa 7.0), e o segundo fator não ficou ativo. A
 * próxima configuração troca o segredo e os códigos de recuperação, e por isso a mensagem diz que os desta tela caem.
 */
export const TEXTO_DA_CONFIGURACAO_RECUSADA =
  'O código não foi aceito, e o segundo fator não foi ativado. Entre de novo com o e-mail e a senha para configurar outra vez: o código QR e os códigos de recuperação desta tela deixam de valer.'

/** Sem o desafio de configurar (F5, endereço digitado, desafio vencido): o caminho é entrar de novo. */
export const TEXTO_DO_CONFIGURAR_SEM_DESAFIO = 'Para configurar o segundo fator, entre de novo com o seu e-mail e a sua senha.'
