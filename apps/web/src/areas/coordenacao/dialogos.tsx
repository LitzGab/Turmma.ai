import { CodigoDeErro } from '@educa/shared'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, type FormEvent, type ReactNode, type RefObject } from 'react'
import { ErroDaApi, mensagemDoErro } from '../../api/cliente'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_BOTAO_PERIGO_CHEIO, CLASSES_DO_BOTAO_SECUNDARIO } from '../../componentes/botao-secundario'
import { Dialogo } from '../../componentes/Dialogo'

/**
 * As peças dos diálogos da Estrutura (A1, 13.0): o envio único, o alerta de falha dentro do diálogo e os dois diálogos
 * que se repetem — o formulário (criar, renomear, acrescentar) e a confirmação de `perigo` (excluir, retirar).
 *
 * Cada abertura é uma instância nova (`useDialogoDaTela`, `key` pelo número): o aviso e o foco de uma tentativa anterior
 * não sobrevivem ao fechar e abrir de novo (o "recomeço da tela" do 13_task.md).
 */

/** O texto de uma falha, pelo código: o da tela quando ela tem um, senão o do catálogo (regra 50, item 12). */
export function textoDaFalha(erro: unknown, textos: Partial<Record<CodigoDeErro, string>> = {}): string {
  return (erro instanceof ErroDaApi ? textos[erro.codigo] : undefined) ?? mensagemDoErro(erro)
}

/** A falha mudou o que está na tela (o item saiu ou mudou): a lista recarrega, e o diálogo só oferece "Fechar". */
export function listaMudou(erro: unknown, codigos: readonly CodigoDeErro[]): boolean {
  return erro instanceof ErroDaApi && codigos.includes(erro.codigo)
}

/**
 * Um pedido por vez: o segundo clique de um clique duplo chega antes do `isPending` da mutação, e sairia outro pedido. A
 * trava é na hora, numa `ref`, e solta quando o pedido termina.
 */
export function useEnvioUnico<Entrada, Saida>(opcoes: {
  mutationFn: (entrada: Entrada) => Promise<Saida>
  onSuccess?: (saida: Saida, entrada: Entrada) => unknown
  onError?: (erro: Error, entrada: Entrada) => unknown
  onSettled?: () => unknown
}) {
  const noAr = useRef(false)
  const mutacao = useMutation({ ...opcoes, gcTime: 0 })
  function enviar(entrada: Entrada): void {
    if (noAr.current) return
    noAr.current = true
    mutacao.mutate(entrada, { onSettled: () => (noAr.current = false) })
  }
  return { enviar, mutacao }
}

/**
 * O anúncio da ação que terminou, na seção onde ela aconteceu: quem enxerga o vê ao lado do que mudou, e não no topo de
 * uma página já rolada, e o leitor de tela o ouve, porque a região existe antes do texto.
 */
export function Anuncio({ texto }: { texto: string }) {
  return (
    <div role="status" className="empty:hidden">
      {texto !== '' && <p className="rounded-controle border border-ok bg-ok-cx p-3 break-words text-ok">{texto}</p>}
    </div>
  )
}

const CLASSES_DO_ALERTA = 'rounded-controle border border-erro bg-erro-cx p-3 break-words text-erro'

/** O alerta da falha, dentro do diálogo modal, onde o leitor de tela o alcança; o foco vai para ele quando aparece. */
export function AlertaDaFalha({ texto }: { texto: string }) {
  const alerta = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    alerta.current?.focus()
  }, [texto])
  return (
    <p ref={alerta} tabIndex={-1} role="alert" className={CLASSES_DO_ALERTA}>
      {texto}
    </p>
  )
}

/**
 * O mesmo alerta, sem o foco ao aparecer: quem o desenha leva o foco a ele (`alvo`) quando a falha chega. É o alerta que
 * pode voltar à tela sem falha nova — o da lista colada, que reaparece quando o texto volta a ser o que foi recusado —,
 * e aí levar o foco tiraria a pessoa do campo no meio da digitação.
 */
export function AlertaSemFoco({ texto, alvo }: { texto: string; alvo: RefObject<HTMLParagraphElement | null> }) {
  return (
    <p ref={alvo} tabIndex={-1} role="alert" className={CLASSES_DO_ALERTA}>
      {texto}
    </p>
  )
}

interface PropsDoFormulario {
  readonly titulo: string
  readonly aoFechar: () => void
  readonly aoEnviar: () => void
  readonly enviando: boolean
  readonly rotuloDoEnvio: string
  readonly rotuloEnviando: string
  /** A falha do último envio, já em texto. */
  readonly falha: string | undefined
  /** A falha mudou a lista: some o envio e fica só "Fechar". */
  readonly semNovaTentativa?: boolean
  readonly focoDeReserva?: () => void
  readonly children: ReactNode
}

/**
 * O diálogo de formulário: os campos, a falha, o envio e o "Cancelar" do mesmo tamanho (D59). O `noValidate` deixa a
 * tela dizer o erro de cada campo em português, em vez do balão do navegador.
 */
export function DialogoDeFormulario({ titulo, aoFechar, aoEnviar, enviando, rotuloDoEnvio, rotuloEnviando, falha, semNovaTentativa = false, focoDeReserva, children }: PropsDoFormulario) {
  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    if (!semNovaTentativa) aoEnviar()
  }
  return (
    <Dialogo titulo={titulo} aoFechar={aoFechar} {...(focoDeReserva === undefined ? {} : { focoDeReserva })}>
      <form className="mt-4 flex min-w-0 flex-col gap-4" onSubmit={enviar} noValidate>
        {children}
        {falha !== undefined && <AlertaDaFalha texto={falha} />}
        <div className="flex flex-wrap gap-3">
          {!semNovaTentativa && (
            <Botao type="submit" disabled={enviando}>
              {enviando ? rotuloEnviando : rotuloDoEnvio}
            </Botao>
          )}
          <button type="button" onClick={aoFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            {semNovaTentativa ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
        <span role="status" className="sr-only">
          {enviando ? rotuloEnviando : ''}
        </span>
      </form>
    </Dialogo>
  )
}

interface PropsDaConfirmacao {
  readonly titulo: string
  /** O que acontece, antes de confirmar (regra 50, item 8). */
  readonly texto: ReactNode
  readonly rotuloDaAcao: string
  readonly rotuloEmAndamento: string
  readonly acao: () => Promise<void>
  readonly aoFechar: () => void
  /**
   * Roda depois de a lista recarregar, mesmo com o diálogo já fechado: quem recebe fecha só a abertura em que o pedido
   * saiu (`fecharSeAinda`).
   */
  readonly aoConcluir: () => void
  /** Recarrega a lista depois do pedido, deu certo ou não: o `CONFLITO` e o `NAO_ENCONTRADO` dizem que ela mudou. */
  readonly aoTerminar: () => unknown
  readonly textosDaFalha: Partial<Record<CodigoDeErro, string>>
  /** O foco ao fechar quando o botão que abriu já saiu da página (o item excluído, ou a lista recarregada). */
  readonly focoDeReserva: () => void
}

/**
 * A confirmação de `perigo` (excluir a turma, a disciplina, retirar o nome): o texto diz o que acontece e o que impede, o
 * foco começa nele e não no botão que exclui, e "Excluir" e "Cancelar" têm o mesmo tamanho (D59). A falha aparece aqui
 * dentro, com o foco nela; o `CONFLITO` e o `NAO_ENCONTRADO` recarregam a lista, e sobra só "Fechar".
 */
export function ConfirmacaoDePerigo({ titulo, texto, rotuloDaAcao, rotuloEmAndamento, acao, aoFechar, aoConcluir, aoTerminar, textosDaFalha, focoDeReserva }: PropsDaConfirmacao) {
  const inicio = useRef<HTMLParagraphElement>(null)
  // Fecha com a lista já recarregada: o botão que abriu saiu com o item, e o foco vai para o `focoDeReserva`.
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: acao,
    onSuccess: async () => {
      await aoTerminar()
      aoConcluir()
    },
    onError: aoTerminar,
  })
  const falha = mutacao.isError ? textoDaFalha(mutacao.error, textosDaFalha) : undefined
  const mudou = mutacao.isError && listaMudou(mutacao.error, [CodigoDeErro.CONFLITO, CodigoDeErro.NAO_ENCONTRADO])
  return (
    <Dialogo titulo={titulo} aoFechar={aoFechar} focoInicial={inicio} focoDeReserva={focoDeReserva}>
      <div className="mt-4 flex min-w-0 flex-col gap-4">
        <p ref={inicio} tabIndex={-1} className="break-words text-apoio">
          {texto}
        </p>
        {falha !== undefined && <AlertaDaFalha texto={falha} />}
        <div className="flex flex-wrap gap-3">
          {!mudou && (
            <button type="button" onClick={() => enviar(undefined)} disabled={mutacao.isPending} className={CLASSES_DO_BOTAO_PERIGO_CHEIO}>
              {mutacao.isPending ? rotuloEmAndamento : rotuloDaAcao}
            </button>
          )}
          <button type="button" onClick={aoFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            {mudou ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
        <span role="status" className="sr-only">
          {mutacao.isPending ? rotuloEmAndamento : ''}
        </span>
      </div>
    </Dialogo>
  )
}
