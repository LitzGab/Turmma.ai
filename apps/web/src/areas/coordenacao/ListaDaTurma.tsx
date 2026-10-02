import { CodigoDeErro, nomeDaSerie, TAMANHO_MAXIMO_MATRICULA, TAMANHO_MAXIMO_NOME_DIGITADO, type EstadoDoNomeDaLista, type NomeDaLista, type RespostaPreviaDaLista } from '@educa/shared'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { Link } from 'wouter'
import { ErroDaApi } from '../../api/cliente'
import { consultaTurmaAberta } from '../../api/estrutura'
import { acrescentarNome, consultaListaDaTurma, gravarLista, previaDaLista, retirarNome } from '../../api/lista'
import { ROTAS_DA_COORDENACAO } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_BOTAO_PERIGO, CLASSES_DO_BOTAO_SECUNDARIO } from '../../componentes/botao-secundario'
import { Campo } from '../../componentes/Campo'
import { useDialogoDaTela } from '../../componentes/dialogo-aberto'
import { AlertaDaFalha, AlertaSemFoco, Anuncio, ConfirmacaoDePerigo, DialogoDeFormulario, useEnvioUnico } from '../../componentes/dialogos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { listaMudou, textoDaFalha } from '../../componentes/texto-da-falha'
import { formatarQuantidade } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { comQuebrasDoCampo, lerArquivoDaLista, tetoPassado, type MotivoDoArquivoRecusado } from './ler-arquivo-da-lista'
import {
  avisosDaPrevia,
  linhasNaOrdemDaTela,
  pareceDocumento,
  podeGravar,
  TEXTO_DA_LINHA_QUE_PARECE_DOCUMENTO,
  TEXTO_DO_AVISO,
  TEXTO_DO_ERRO_DA_LINHA,
  TEXTO_DO_RESULTADO,
} from './previa-da-lista'

/** O estado do nome em texto, para a coordenação (regra 50, item 11). */
const ESTADO_DO_NOME: Readonly<Record<EstadoDoNomeDaLista, string>> = {
  livre: 'Livre: esperando o aluno pedir o nome',
  reivindicado: 'O aluno pediu o nome: esperando a decisão',
  aprovado: 'Aluno aprovado',
}

const EXEMPLO_DA_LISTA = 'nome; matrícula\nAna Souza; 2026001\nBruno Lima; 2026002'

const TEXTO_DO_TETO = {
  bytes: 'A lista é grande demais para um envio só. Divida em partes e envie uma de cada vez.',
  linhas: 'A lista passa de 200 nomes. Divida em partes e envie uma de cada vez.',
} as const

/** O que a tela diz do arquivo que não virou texto, com o que fazer (regra 50, item 12). */
const TEXTO_DO_ARQUIVO_RECUSADO: Readonly<Record<MotivoDoArquivoRecusado, string>> = {
  grande: TEXTO_DO_TETO.bytes,
  planilha: 'Este arquivo é uma planilha (.xlsx, .xls ou .ods), e não texto. Na planilha, use "Salvar como" e escolha CSV, ou copie as duas colunas e cole no campo acima.',
  ilegivel: 'Não foi possível ler este arquivo. Escolha o arquivo de novo, ou cole a lista no campo acima.',
}

/** O que a matrícula que parece documento diz no nome avulso: a mesma trava da lista colada (regra 20, item 2). */
const TEXTO_DA_MATRICULA_QUE_PARECE_DOCUMENTO = 'Isto parece CPF ou data de nascimento, e não matrícula. A lista leva só o nome e a matrícula do aluno.'

/** Para onde o foco vai quando uma resposta chega. */
type AlvoDoFoco = 'previa' | 'falha_da_previa' | 'falha_da_gravacao'

/** A prévia de um texto: só vale enquanto o texto na tela é o mesmo que foi para a API. */
interface PreviaDoTexto {
  readonly texto: string
  readonly resposta: RespostaPreviaDaLista
}

/**
 * A turma aberta na Estrutura, com a lista de nomes dela (A1, 13.0; RF4 e RF5; W4, "Lista"; W10): colar ou escolher o
 * arquivo, ver a prévia linha a linha, com os erros primeiro e em texto, e gravar só sem erro; acrescentar um nome
 * avulso; retirar um nome livre. A matrícula aparece aqui, para a coordenação, e em nenhuma tela do aluno.
 *
 * - **Nome e matrícula só na memória da página e no corpo das requisições**: nunca no endereço, em `localStorage` nem em
 *   `sessionStorage` (regra 20; regra 50, item 7).
 * - **A prévia é do texto que foi enviado**: editar o texto a descarta, e a resposta de um texto anterior que chega
 *   depois da edição não aparece. A gravação manda o mesmo texto da prévia.
 * - **Um envio por vez**: o clique duplo em "Gravar lista" manda um pedido só (`useEnvioUnico`).
 * - **Cada leitura da lista é auditada** (`turma.lista_lida`, finalidade de conferência de cadastro): a lista é lida ao
 *   abrir a turma e depois de cada escrita, e não ao voltar para a aba.
 */
export function ListaDaTurma({ turmaId }: { turmaId: string }) {
  const turma = useQuery(consultaTurmaAberta(turmaId))
  useTituloDaTela(turma.data === undefined ? 'Turma' : `Turma ${turma.data.nome}`)

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/coordenacao` resolve o `to` a partir da base dela.
    <Link to={ROTAS_DA_COORDENACAO.estrutura} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para Estrutura
    </Link>
  )

  if (turma.isPending)
    return (
      <section className="flex min-w-0 flex-col gap-4">
        {voltar}
        <EstadoCarregando rotulo="Carregando a turma…" />
      </section>
    )
  if (turma.isError)
    return (
      <section className="flex min-w-0 flex-col gap-4">
        {voltar}
        {turma.error instanceof ErroDaApi && turma.error.codigo === CodigoDeErro.NAO_ENCONTRADO ? (
          <p role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
            Esta turma não está no ano letivo em curso: ela pode ter sido excluída. Volte para Estrutura e abra a turma de novo.
          </p>
        ) : (
          <EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} />
        )}
      </section>
    )

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby="titulo-da-turma">
      {voltar}
      <div>
        <h1 id="titulo-da-turma" className="text-xl font-semibold break-words sm:text-2xl">
          Turma {turma.data.nome}
        </h1>
        <p className="text-apoio">{nomeDaSerie(turma.data.serie)}</p>
      </div>
      <ConteudoDaLista turmaId={turmaId} />
    </section>
  )
}

function ConteudoDaLista({ turmaId }: { turmaId: string }) {
  const cliente = useQueryClient()
  const nomes = useInfiniteQuery(consultaListaDaTurma(turmaId))
  const [anuncio, definirAnuncio] = useState('')
  const dialogo = useDialogoDaTela<'acrescentar' | 'retirar', NomeDaLista>()
  const aberta = dialogo.aberta
  // O nome da linha, fotografado na abertura: o diálogo de retirar só existe com ele.
  const alvo = aberta?.alvo
  const tituloDosNomes = useRef<HTMLHeadingElement>(null)
  const idDoTitulo = useId()

  const recarregarNomes = () => cliente.invalidateQueries({ queryKey: consultaListaDaTurma(turmaId).queryKey })
  const itens = nomes.data?.pages.flatMap((pagina) => pagina.itens) ?? []

  function abrir(tipo: 'acrescentar' | 'retirar', item?: NomeDaLista): void {
    definirAnuncio('')
    dialogo.abrir(tipo, item)
  }

  return (
    <>
      <SubirLista
        turmaId={turmaId}
        aoGravar={(texto) => {
          definirAnuncio(texto)
          // O "Gravar lista" saiu com a prévia: o foco vai para os nomes, que já chegaram com os gravados.
          tituloDosNomes.current?.focus()
        }}
        recarregarNomes={recarregarNomes}
      />

      <section aria-labelledby={idDoTitulo} className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 ref={tituloDosNomes} id={idDoTitulo} tabIndex={-1} className="text-lg font-semibold text-tinta">
            Nomes da turma
          </h2>
          <button type="button" onClick={() => abrir('acrescentar')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            Acrescentar um nome
          </button>
        </div>
        {/* O anúncio fica aqui, com os nomes: é para onde o foco vai depois de gravar, acrescentar e retirar. */}
        <Anuncio texto={anuncio} />
        {nomes.isPending ? (
          <EstadoCarregando rotulo="Carregando a lista de nomes…" />
        ) : nomes.isError ? (
          <EstadoErro erro={nomes.error} tentando={nomes.isFetching} aoTentarDeNovo={() => void nomes.refetch({ cancelRefetch: false })} />
        ) : itens.length === 0 ? (
          <EstadoVazio titulo="Nenhum nome nesta turma ainda" descricao="Cole a lista ou envie o arquivo: nome; matrícula, um aluno por linha, no campo acima." />
        ) : (
          <>
            <p className="text-sm text-sutil">
              {nomes.hasNextPage ? `Mostrando os primeiros ${formatarQuantidade(itens.length, 'nome', 'nomes')}` : `${formatarQuantidade(itens.length, 'nome', 'nomes')} na lista`}
            </p>
            <ul className="flex flex-col gap-3">
              {itens.map((nome) => (
                <li key={nome.id} className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium break-words text-tinta">{nome.nome ?? 'Aluno aprovado'}</p>
                    {nome.matricula !== null && <p className="text-sm break-words text-apoio">Matrícula {nome.matricula}</p>}
                    <p className={`text-sm ${nome.estado === 'livre' ? 'text-apoio' : nome.estado === 'aprovado' ? 'text-ok' : 'text-pendente'}`}>{ESTADO_DO_NOME[nome.estado]}</p>
                  </div>
                  {nome.estado === 'livre' && (
                    <button type="button" onClick={() => abrir('retirar', nome)} className={CLASSES_DO_BOTAO_PERIGO}>
                      {/* Com a matrícula: dois alunos com o mesmo nome na turma têm botões de nome diferente. */}
                      Retirar
                      <span className="sr-only">
                        {' '}
                        {nome.nome ?? ''}
                        {nome.matricula === null ? '' : `, matrícula ${nome.matricula}`} da lista
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {nomes.hasNextPage && (
              <button type="button" onClick={() => void nomes.fetchNextPage()} disabled={nomes.isFetchingNextPage} className={`${CLASSES_DO_BOTAO_SECUNDARIO} self-start`}>
                {nomes.isFetchingNextPage ? 'Carregando…' : 'Ver mais nomes'}
              </button>
            )}
          </>
        )}
      </section>

      {aberta?.tipo === 'acrescentar' && (
        <NomeAvulso
          key={aberta.numero}
          turmaId={turmaId}
          aoFechar={dialogo.fechar}
          aoAcrescentar={() => {
            definirAnuncio('Nome acrescentado à lista da turma.')
            dialogo.fecharSeAinda(aberta)
          }}
          recarregar={recarregarNomes}
        />
      )}
      {aberta?.tipo === 'retirar' && alvo !== undefined && (
        <ConfirmacaoDePerigo
          key={aberta.numero}
          titulo="Retirar o nome da lista"
          texto={
            <>
              <span className="font-medium text-tinta">{alvo.nome}</span>
              {alvo.matricula === null ? '' : `, matrícula ${alvo.matricula},`} sai da lista desta turma. Só sai o nome livre: o de quem já
              pediu o nome ou já foi aprovado fica.
            </>
          }
          rotuloDaAcao="Retirar da lista"
          rotuloEmAndamento="Retirando…"
          acao={() => retirarNome(alvo.id)}
          aoFechar={dialogo.fechar}
          aoConcluir={() => {
            definirAnuncio('Nome retirado da lista.')
            dialogo.fecharSeAinda(aberta)
          }}
          aoTerminar={recarregarNomes}
          textosDaFalha={{
            [CodigoDeErro.CONFLITO]: 'Este nome não está mais livre: o aluno já pediu o nome ou foi aprovado, e ele não sai por aqui. A lista foi atualizada.',
            [CodigoDeErro.NAO_ENCONTRADO]: 'Este nome já saiu da lista. A lista foi atualizada.',
          }}
          focoDeReserva={() => tituloDosNomes.current?.focus()}
        />
      )}
    </>
  )
}

/** Colar ou escolher o arquivo, ver a prévia e gravar (RF4, W10). A prévia só é mostrada para o texto que está no campo. */
function SubirLista({ turmaId, aoGravar, recarregarNomes }: { turmaId: string; aoGravar: (texto: string) => void; recarregarNomes: () => unknown }) {
  const [texto, definirTexto] = useState('')
  const [previa, definirPrevia] = useState<PreviaDoTexto | undefined>(undefined)
  const [aviso, definirAviso] = useState<string | undefined>(undefined)
  // O nome do arquivo lido, só para a tela dizer de onde veio o texto: a escolha é limpa depois da leitura, e o controle
  // do navegador volta a dizer que não há arquivo escolhido.
  const [arquivoLido, definirArquivoLido] = useState<string | undefined>(undefined)
  // O foco vai ao título da prévia, ou ao alerta, só quando a resposta chega. A prévia e os alertas também voltam à tela
  // quando o texto volta a um valor anterior (uma tecla errada e apagada), e aí o foco fica onde está: tirá-lo do campo
  // perderia o que a pessoa digita em seguida.
  const focoPendente = useRef<AlvoDoFoco | undefined>(undefined)
  const tituloDaPrevia = useRef<HTMLHeadingElement>(null)
  const alertaDaPrevia = useRef<HTMLParagraphElement>(null)
  const alertaDaGravacao = useRef<HTMLParagraphElement>(null)
  // Sem lista de dependências, de propósito: o pedido de foco fica numa `ref`, e o alvo só entra na tela no render que a
  // resposta provoca (a prévia, pelo estado dela; o alerta, quando a mutação vira erro, depois do `onError`). O efeito
  // roda a cada render e atende o pedido quando o alvo está lá. O texto que muda tira o pedido (`mudarTexto`): a resposta
  // atrasada, de um texto que já não é o do campo, não acha o alvo, e o pedido dela sai na tecla seguinte.
  useEffect(() => {
    const pedido = focoPendente.current
    if (pedido === undefined) return
    const alvo = pedido === 'previa' ? tituloDaPrevia.current : pedido === 'falha_da_previa' ? alertaDaPrevia.current : alertaDaGravacao.current
    if (alvo === null) return
    focoPendente.current = undefined
    // O foco só é levado do `body`, para onde ele cai quando o botão do pedido fica desligado, ou de um botão qualquer:
    // quem está num botão não está digitando, e o destino é um título ou um alerta, que um Enter não aciona. Quem já
    // voltou ao campo, ou está num link, enquanto a resposta vinha (a rede lenta) continua onde está.
    const ativo = document.activeElement
    if (ativo === null || ativo === document.body || ativo instanceof HTMLButtonElement) alvo.focus()
  })
  /** A resposta chegou: o foco vai para ela, assim que ela estiver na tela. */
  function chegou(alvo: AlvoDoFoco): void {
    focoPendente.current = alvo
  }
  const campoDoTexto = useId()
  const campoDoArquivo = useId()
  const exemplo = useId()
  const idDoTitulo = useId()

  const pedirPrevia = useEnvioUnico({
    mutationFn: (enviado: string) => previaDaLista(turmaId, enviado),
    // A prévia guarda o texto que foi enviado, e só aparece enquanto ele é o do campo (`previaAtual`): a resposta de um
    // texto que já foi editado não aparece, porque diria que um texto velho está bom (ou ruim).
    onSuccess: (resposta, enviado) => {
      definirPrevia({ texto: enviado, resposta })
      chegou('previa')
    },
    onError: () => chegou('falha_da_previa'),
  })
  const gravar = useEnvioUnico({
    mutationFn: (enviado: string) => gravarLista(turmaId, enviado),
    onSuccess: async (gravacao) => {
      await recarregarNomes()
      mudarTexto('')
      definirPrevia(undefined)
      aoGravar(
        `${formatarQuantidade(gravacao.gravados, 'nome gravado', 'nomes gravados')} na lista.${gravacao.jaExistentes > 0 ? ` ${formatarQuantidade(gravacao.jaExistentes, 'já estava', 'já estavam')} na lista e não mudou.` : ''}`,
      )
    },
    // A gravação recusada pela API diz que a prévia envelheceu (uma matrícula passou a ser usada, a lista tem erro, a
    // turma saiu do ano): ela sai, e o "Gravar lista" com ela, até a pessoa ver a prévia de novo. A queda de rede ou do
    // servidor não diz nada da prévia: ela fica, e "Gravar lista" tenta de novo.
    onError: (erro) => {
      if (listaMudou(erro, [CodigoDeErro.CONFLITO, CodigoDeErro.ENTRADA_INVALIDA, CodigoDeErro.NAO_ENCONTRADO])) definirPrevia(undefined)
      chegou('falha_da_gravacao')
      void recarregarNomes()
    },
  })

  /**
   * O texto novo descarta a prévia e as falhas do texto anterior pelo que é mostrado (as falhas valem só para o texto que
   * as causou), sem `reset()` nas mutações: o `reset` de um pedido no ar perderia o fim dele, e a trava do envio único
   * ficaria presa.
   */
  function mudarTexto(novo: string): void {
    focoPendente.current = undefined
    definirTexto(novo)
    definirAviso(undefined)
    definirArquivoLido(undefined)
  }

  async function escolherArquivo(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0]
    // Limpa a escolha: a mesma planilha escolhida de novo, depois de corrigida, precisa disparar outra leitura.
    evento.target.value = ''
    if (arquivo === undefined) return
    const lido = await lerArquivoDaLista(arquivo)
    if (!lido.ok) {
      definirAviso(TEXTO_DO_ARQUIVO_RECUSADO[lido.motivo])
      return
    }
    mudarTexto(comQuebrasDoCampo(lido.texto))
    definirArquivoLido(arquivo.name)
  }

  function verPrevia(): void {
    if (texto.trim() === '') {
      definirAviso('Cole a lista ou escolha o arquivo antes de ver a prévia.')
      return
    }
    const teto = tetoPassado(texto)
    if (teto !== undefined) {
      definirAviso(TEXTO_DO_TETO[teto])
      return
    }
    definirAviso(undefined)
    pedirPrevia.enviar(texto)
  }

  const previaAtual = previa !== undefined && previa.texto === texto ? previa.resposta : undefined
  const falhaDaPrevia =
    pedirPrevia.mutacao.isError && pedirPrevia.mutacao.variables === texto
    ? textoDaFalha(pedirPrevia.mutacao.error, {
        [CodigoDeErro.ENTRADA_INVALIDA]:
          'Não deu para ler a lista. Confira se cada linha tem o nome e a matrícula, se há ao menos um aluno e se ela não passa de 200 nomes.',
        [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma não está mais no ano letivo em curso. Volte para Estrutura.',
      })
    : undefined
  const falhaDaGravacao =
    gravar.mutacao.isError && gravar.mutacao.variables === texto
    ? textoDaFalha(gravar.mutacao.error, {
        [CodigoDeErro.CONFLITO]: 'Uma das matrículas passou a ser usada em outra turma ou por um aluno depois da prévia. Nada foi gravado: veja a prévia de novo.',
        [CodigoDeErro.ENTRADA_INVALIDA]: 'A lista tem linha com erro. Nada foi gravado: veja a prévia de novo.',
        [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma não está mais no ano letivo em curso. Nada foi gravado.',
      })
    : undefined

  return (
    <section aria-labelledby={idDoTitulo} className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4">
      <h2 id={idDoTitulo} className="text-lg font-semibold text-tinta">
        Subir a lista de nomes
      </h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={campoDoTexto} className="font-medium">
            Lista colada
          </label>
          <textarea
            id={campoDoTexto}
            aria-describedby={exemplo}
            rows={8}
            autoComplete="off"
            spellCheck={false}
            value={texto}
            onChange={(evento) => mudarTexto(evento.target.value)}
            className="min-w-0 rounded-controle border border-borda-campo bg-superficie px-3 py-2 font-mono text-base text-tinta"
          />
        </div>
        <div id={exemplo} className="min-w-0 text-sm text-apoio">
          <p>
            Um aluno por linha: o nome e a matrícula, separados por ponto e vírgula, vírgula ou tabulação. A primeira linha pode ser o cabeçalho
            &ldquo;nome; matrícula&rdquo;. Até 200 nomes por vez.
          </p>
          <p className="mt-2 font-medium text-tinta">Exemplo</p>
          <pre className="mt-1 overflow-x-auto rounded-controle border border-linha bg-lateral p-2 font-mono text-sm whitespace-pre-wrap text-tinta">{EXEMPLO_DA_LISTA}</pre>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={campoDoArquivo} className="font-medium">
          Ou escolha o arquivo (CSV ou TXT, como o Excel salva)
        </label>
        <input
          id={campoDoArquivo}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={(evento) => void escolherArquivo(evento)}
          className="min-h-11 max-w-full min-w-0 text-base text-tinta file:mr-3 file:min-h-11 file:rounded-full file:border file:border-borda-campo file:bg-superficie file:px-4 file:font-medium file:text-tinta"
        />
        <p role="status" className="text-sm break-words text-apoio empty:hidden">
          {arquivoLido !== undefined && `Arquivo lido: ${arquivoLido}. O texto dele está no campo acima.`}
        </p>
      </div>

      {aviso !== undefined && <AlertaDaFalha texto={aviso} />}
      {falhaDaPrevia !== undefined && <AlertaSemFoco texto={falhaDaPrevia} alvo={alertaDaPrevia} />}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={verPrevia} disabled={pedirPrevia.mutacao.isPending} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          {pedirPrevia.mutacao.isPending ? 'Lendo a lista…' : 'Ver a prévia'}
        </button>
      </div>

      {falhaDaGravacao !== undefined && <AlertaSemFoco texto={falhaDaGravacao} alvo={alertaDaGravacao} />}
      {previaAtual !== undefined && <PreviaDaLista previa={previaAtual} tituloRef={tituloDaPrevia} gravando={gravar.mutacao.isPending} aoGravar={() => gravar.enviar(texto)} />}
    </section>
  )
}

interface PropsDaPrevia {
  readonly previa: RespostaPreviaDaLista
  /**
   * O título, que recebe o foco quando a prévia chega (quem decide é o `SubirLista`): o leitor de tela lê o resumo e as
   * linhas em seguida, e o Tab seguinte cai no "Gravar lista". Uma região `status` que nasce já com o texto nem sempre é
   * anunciada.
   */
  readonly tituloRef: RefObject<HTMLHeadingElement | null>
  readonly gravando: boolean
  readonly aoGravar: () => void
}

function PreviaDaLista({ previa, tituloRef, gravando, aoGravar }: PropsDaPrevia) {
  const idDoTitulo = useId()
  const avisos = avisosDaPrevia(previa.linhas)
  const gravacao = podeGravar(previa)
  return (
    <section aria-labelledby={idDoTitulo} className="flex min-w-0 flex-col gap-3 border-t border-linha pt-4">
      <h3 ref={tituloRef} id={idDoTitulo} tabIndex={-1} className="font-semibold text-tinta">
        Prévia
      </h3>
      <p role="status" className="text-apoio">
        {formatarQuantidade(previa.entram, 'nome entra', 'nomes entram')} · {formatarQuantidade(previa.jaExistem, 'já está', 'já estão')} na lista ·{' '}
        {formatarQuantidade(previa.comErro, 'linha com erro', 'linhas com erro')}
      </p>
      {avisos.map((aviso) => (
        <p key={aviso} className="rounded-controle border border-pendente bg-pendente-cx p-3 break-words text-pendente">
          {TEXTO_DO_AVISO[aviso]}
        </p>
      ))}
      <ol className="flex flex-col gap-2">
        {linhasNaOrdemDaTela(previa.linhas).map((linha) => {
          // A linha que a API aceitaria e a tela segura: ela diz o porquê, em vez de "Entra na lista".
          const suspeita = linha.resultado !== 'erro' && pareceDocumento(linha.matricula)
          const tom = linha.resultado === 'erro' ? 'border-erro bg-erro-cx text-erro' : suspeita ? 'border-pendente bg-pendente-cx text-pendente' : 'border-linha bg-superficie text-tinta'
          return (
            <li key={linha.linha} className={`min-w-0 rounded-controle border p-3 break-words ${tom}`}>
              <span className="font-medium">Linha {linha.linha}</span>
              {': '}
              {linha.nome === '' ? '(sem nome)' : linha.nome}
              {linha.matricula === '' ? '' : ` · ${linha.matricula}`}
              <span className="block text-sm">
                {linha.resultado === 'erro'
                  ? `Erro: ${linha.erro === undefined ? '' : TEXTO_DO_ERRO_DA_LINHA[linha.erro]}`
                  : suspeita
                    ? TEXTO_DA_LINHA_QUE_PARECE_DOCUMENTO
                    : TEXTO_DO_RESULTADO[linha.resultado]}
              </span>
            </li>
          )
        })}
      </ol>
      {gravacao.pode ? (
        <div>
          <Botao onClick={aoGravar} disabled={gravando}>
            {gravando ? 'Gravando…' : 'Gravar lista'}
          </Botao>
        </div>
      ) : (
        <p className="text-apoio">{gravacao.motivo}</p>
      )}
    </section>
  )
}

function NomeAvulso({ turmaId, aoFechar, aoAcrescentar, recarregar }: { turmaId: string; aoFechar: () => void; aoAcrescentar: () => void; recarregar: () => unknown }) {
  const [nome, definirNome] = useState('')
  const [matricula, definirMatricula] = useState('')
  const [erros, definirErros] = useState<{ nome?: string; matricula?: string }>({})
  const campoDoNome = useRef<HTMLInputElement>(null)
  const campoDaMatricula = useRef<HTMLInputElement>(null)
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: (pedido: { nome: string; matricula: string }) => acrescentarNome(turmaId, pedido),
    onSuccess: async () => {
      await recarregar()
      aoAcrescentar()
    },
    onError: recarregar,
  })

  function aoEnviar(): void {
    const pedido = { nome: nome.trim(), matricula: matricula.trim() }
    const novos = {
      ...(pedido.nome === '' ? { nome: 'Digite o nome do aluno.' } : {}),
      ...(pedido.matricula === '' ? { matricula: 'Digite a matrícula do aluno.' } : pareceDocumento(pedido.matricula) ? { matricula: TEXTO_DA_MATRICULA_QUE_PARECE_DOCUMENTO } : {}),
    }
    definirErros(novos)
    // O foco vai para o primeiro campo com erro: o leitor de tela lê o erro ao chegar nele.
    if (novos.nome !== undefined) campoDoNome.current?.focus()
    else if (novos.matricula !== undefined) campoDaMatricula.current?.focus()
    else enviar(pedido)
  }

  return (
    <DialogoDeFormulario
      titulo="Acrescentar um nome"
      aoFechar={aoFechar}
      aoEnviar={aoEnviar}
      enviando={mutacao.isPending}
      rotuloDoEnvio="Acrescentar"
      rotuloEnviando="Acrescentando…"
      falha={
        mutacao.isError
          ? textoDaFalha(mutacao.error, {
              [CodigoDeErro.CONFLITO]: 'Esta matrícula já está na lista de uma turma da escola ou é de um aluno da escola. Nada foi gravado.',
              [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma não está mais no ano letivo em curso. Nada foi gravado.',
            })
          : undefined
      }
    >
      <p className="text-sm text-apoio">Para o aluno que chega depois: ele aparece na lista da turma e pede o nome pelo acesso que já está valendo.</p>
      <Campo
        ref={campoDoNome}
        rotulo="Nome do aluno"
        name="nome"
        autoComplete="off"
        spellCheck={false}
        maxLength={TAMANHO_MAXIMO_NOME_DIGITADO}
        value={nome}
        onChange={(evento) => definirNome(evento.target.value)}
        erro={erros.nome}
      />
      <Campo
        ref={campoDaMatricula}
        rotulo="Matrícula"
        name="matricula"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={TAMANHO_MAXIMO_MATRICULA}
        value={matricula}
        onChange={(evento) => definirMatricula(evento.target.value)}
        erro={erros.matricula}
      />
    </DialogoDeFormulario>
  )
}
