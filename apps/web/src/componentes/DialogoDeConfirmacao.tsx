import { useId, useRef, type ReactNode } from 'react'
import { Botao } from './Botao'
import { Dialogo } from './Dialogo'

export interface LinhaDoResumo {
  readonly rotulo: string
  readonly valor: string
}

interface PropsDoDialogoDeConfirmacao {
  /** O que está sendo decidido, com o objeto: "Aprovar 32 correções", "Suspender a correção de objetiva". */
  readonly titulo: string
  /**
   * `oficial` é a decisão oficial (aprovar, publicar, confirmar envio): o botão que confirma é o preto. `perigo` é a
   * ação que desfaz ou tira algo (rejeitar, excluir, revogar, suspender): o botão é o `erro` cheio.
   */
  readonly familia: 'oficial' | 'perigo'
  /**
   * **O que vai acontecer**, em pares: a avaliação, a turma, quantas correções. É obrigatório pelo tipo: ação oficial
   * mostra o que vai acontecer antes de confirmar (regra 50, item 8).
   */
  readonly resumo: readonly [LinhaDoResumo, ...LinhaDoResumo[]]
  /** A consequência, numa frase: "O diagnóstico chega aos alunos da turma." */
  readonly efeito: string
  /** O que fica registrado: "Esta abertura fica na auditoria da escola." Em família `pendente`, para não passar batido. */
  readonly aviso?: string
  /** O que a confirmação ainda pede: o campo da justificativa de quem rejeita. */
  readonly children?: ReactNode
  /** O botão diz o que acontece, com o objeto: "Aprovar 32 correções", e não "Confirmar" (9.8). */
  readonly rotuloDeConfirmar: string
  /** O que o botão diz com o pedido no ar: "Aprovando…". */
  readonly rotuloConfirmando?: string
  readonly rotuloDeCancelar?: string
  readonly aoConfirmar: () => void
  readonly aoFechar: () => void
  /** O pedido saiu e ainda não voltou: o botão desliga, e o clique duplo não manda duas decisões (regra 80, item 7). */
  readonly confirmando?: boolean
  /** Falta alguma coisa para confirmar (a justificativa vazia): o botão fica desligado. */
  readonly impedido?: boolean
  /** O que deu errado, já em português e dizendo o que fazer. Nunca o erro cru. */
  readonly falha?: string
  readonly focoDeReserva?: () => void
}

/**
 * O diálogo de confirmação, para a decisão oficial e para a ação de perigo, sobre o `Dialogo` do produto (o `dialog`
 * nativo em modo modal, com o foco preso e devolvido): o `@radix-ui/react-alert-dialog` traria um segundo jeito de
 * abrir diálogo, com 13 kB em brotli, para o que o primeiro já faz. Aqui ele só ganha o papel de `alertdialog` e a
 * descrição.
 *
 * - **Mostra o que vai acontecer antes** (regra 50, item 8): o resumo e o efeito são obrigatórios.
 * - **O foco começa no texto, e não no botão que confirma**: um Enter a mais não decide nada sem a pessoa ter lido.
 * - **Cancelar tem o mesmo tamanho de confirmar**, e vem ao lado: recusar nunca é mais difícil que aceitar (D59).
 * - **O botão que confirma não se parece com nenhum outro**: preto na decisão oficial, `erro` cheio no perigo. É o único
 *   lugar do produto onde o `perigo` cheio aparece (11.1).
 */
export function DialogoDeConfirmacao({
  titulo,
  familia,
  resumo,
  efeito,
  aviso,
  children,
  rotuloDeConfirmar,
  rotuloConfirmando,
  rotuloDeCancelar = 'Cancelar',
  aoConfirmar,
  aoFechar,
  confirmando = false,
  impedido = false,
  falha,
  focoDeReserva,
}: PropsDoDialogoDeConfirmacao) {
  const inicio = useRef<HTMLDivElement>(null)
  const idDaDescricao = useId()
  const rotulo = confirmando ? (rotuloConfirmando ?? rotuloDeConfirmar) : rotuloDeConfirmar
  return (
    <Dialogo titulo={titulo} aoFechar={aoFechar} focoInicial={inicio} papel="alertdialog" descritoPor={idDaDescricao} {...(focoDeReserva === undefined ? {} : { focoDeReserva })}>
      <div className="mt-4 flex min-w-0 flex-col gap-4">
        <div ref={inicio} id={idDaDescricao} tabIndex={-1} className="flex min-w-0 flex-col gap-3">
          <dl className="flex min-w-0 flex-col gap-1.5 rounded-controle border border-linha p-3">
            {resumo.map((linha) => (
              <div key={linha.rotulo} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-sm text-sutil">{linha.rotulo}</dt>
                <dd className="min-w-0 font-medium break-words text-tinta">{linha.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="break-words text-apoio">{efeito}</p>
        </div>
        {aviso !== undefined && <p className="rounded-controle border border-pendente bg-pendente-cx p-3 break-words text-pendente">{aviso}</p>}
        {children}
        <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro empty:hidden">
          {falha}
        </p>
        <div className="flex flex-wrap gap-3">
          {familia === 'oficial' ? (
            <Botao variante="oficial" onClick={aoConfirmar} disabled={confirmando || impedido}>
              {rotulo}
            </Botao>
          ) : (
            <Botao variante="perigo" cheio onClick={aoConfirmar} disabled={confirmando || impedido}>
              {rotulo}
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            {rotuloDeCancelar}
          </Botao>
        </div>
        <span role="status" className="sr-only">
          {confirmando ? rotulo : ''}
        </span>
      </div>
    </Dialogo>
  )
}
