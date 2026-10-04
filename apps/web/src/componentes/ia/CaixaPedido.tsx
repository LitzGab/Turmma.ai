import { ArrowUp, Square } from 'lucide-react'
import { useId, useLayoutEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Botao } from '../Botao'
import { podeEnviar, teclaEnvia, textoDoPedido, type EstadoDaCaixa } from './caixa-pedido'

type PropsDaCaixa = {
  /** O nome do campo para o leitor de tela: "Pedido ao Assistente de ensino", "Pergunta para o Tutor". */
  readonly rotulo: string
  /** O texto de exemplo do campo vazio: "Peça uma atividade, um plano de aula…". Fixo: não troca sozinho (D59). */
  readonly exemplo?: string
  readonly valor: string
  readonly aoMudar: (valor: string) => void
  /** Recebe o texto já aparado. Limpar o campo depois de enviar é de quem usa, que é o dono do `valor`. */
  readonly aoEnviar: (texto: string) => void
  /** Com a resposta chegando (`gerando`), o enviar vira "Parar" e chama isto. */
  readonly aoParar?: () => void
  readonly estado?: EstadoDaCaixa
} & (
  | {
      /** A caixa do professor: a barra de baixo tem lugar para o que muda o pedido e para o contexto. */
      readonly variante?: 'completa'
      /** À esquerda, o que se acrescenta ao pedido: o `Menu` de ferramenta (D18). */
      readonly esquerda?: ReactNode
      /** À direita, o contexto: o seletor de turma, no lugar onde o ChatGPT põe o modelo (8.3). */
      readonly direita?: ReactNode
    }
  /** A caixa do aluno: **só texto e enviar**. Sem seletor, sem anexo (11.6): o tipo não deixa passar os encaixes. */
  | { readonly variante: 'so-texto'; readonly esquerda?: never; readonly direita?: never }
)

/** Até onde o campo cresce antes de rolar por dentro: 192 px, perto de oito linhas. */
const ALTURA_MAXIMA_DO_CAMPO = 192

/**
 * A caixa de pedido (`docs/interface.md` 11.2, 11.3 e 11.6): o campo de texto que cresce com o que se escreve, e a barra
 * com o enviar. Canto de 28 px e a sombra suave da 9.3; a borda é a `borda-campo`, e não a linha clara do desenho: campo
 * de formulário de escola precisa de 3:1 de contraste na borda (9.1).
 *
 * - **Enter envia, Shift+Enter quebra a linha**, e o Enter que confirma um acento não envia (`caixa-pedido.ts`).
 * - **O botão de enviar existe sempre**, com 44 px: quem está no toque não depende do Enter (regra 50, item 2a). É o
 *   `primario` da tela, o laranja (8.4, princípio 2).
 * - **Enquanto a resposta chega, enviar vira "Parar"** (9.5, regra 5), e um segundo pedido não sai.
 * - **Sem texto, não envia**: só espaço não é pedido.
 *
 * A caixa não se prende ao pé da tela sozinha: quem monta a conversa decide onde ela fica.
 */
export function CaixaPedido({ rotulo, exemplo, valor, aoMudar, aoEnviar, aoParar, estado = 'pronta', variante = 'completa', esquerda, direita }: PropsDaCaixa) {
  const campo = useRef<HTMLTextAreaElement>(null)
  const idDoCampo = useId()
  const idDaDica = useId()
  const soTexto = variante === 'so-texto'

  // O campo cresce com o texto, até o teto, e encolhe de volta quando o texto é enviado ou apagado.
  useLayoutEffect(() => {
    const atual = campo.current
    if (atual === null) return
    atual.style.height = 'auto'
    atual.style.height = `${String(Math.min(atual.scrollHeight, ALTURA_MAXIMA_DO_CAMPO))}px`
  }, [valor])

  function enviar(): void {
    const texto = textoDoPedido(valor)
    if (estado === 'pronta' && texto !== undefined) aoEnviar(texto)
  }

  function aoSubmeter(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    enviar()
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>): void {
    if (!teclaEnvia({ key: evento.key, shiftKey: evento.shiftKey, isComposing: evento.nativeEvent.isComposing })) return
    evento.preventDefault()
    enviar()
  }

  // As chaves fazem do "Parar" e do enviar dois botões, e não um que troca de tipo: sem elas o React reaproveitaria o
  // mesmo `button`, que viraria `submit` no meio do clique em "Parar", e o clique enviaria o pedido seguinte.
  const botao =
    estado === 'gerando' && aoParar !== undefined ? (
      <Botao key="parar" variante="secundario" onClick={aoParar} className="shrink-0">
        <Square aria-hidden="true" size={14} strokeWidth={2.4} className="shrink-0" />
        Parar
      </Botao>
    ) : (
      <Botao key="enviar" type="submit" tamanho="icone" aria-label="Enviar" disabled={!podeEnviar(valor, estado)}>
        <ArrowUp aria-hidden="true" size={20} strokeWidth={2} />
      </Botao>
    )

  const entrada = (
    <textarea
      ref={campo}
      id={idDoCampo}
      rows={1}
      value={valor}
      disabled={estado === 'desligada'}
      {...(exemplo === undefined ? {} : { placeholder: exemplo })}
      aria-describedby={idDaDica}
      enterKeyHint="send"
      onChange={(evento) => aoMudar(evento.target.value)}
      onKeyDown={aoTeclar}
      className="block max-h-48 min-h-11 w-full min-w-0 resize-none rounded-controle bg-superficie px-3 py-2.5 text-base text-tinta disabled:text-inativo"
    />
  )

  return (
    <form onSubmit={aoSubmeter} data-caixa-pedido={variante} className="flex min-w-0 flex-col gap-1 rounded-caixa border border-borda-campo bg-superficie p-2 shadow-caixa">
      <label htmlFor={idDoCampo} className="sr-only">
        {rotulo}
      </label>
      <span id={idDaDica} className="sr-only">
        Enter envia. Shift e Enter quebram a linha.
      </span>
      {soTexto ? (
        <div className="flex min-w-0 items-end gap-2">
          {entrada}
          {botao}
        </div>
      ) : (
        <>
          {entrada}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {esquerda !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-2">{esquerda}</div>}
            <div className="ml-auto flex min-w-0 items-center gap-2">
              {direita}
              {botao}
            </div>
          </div>
        </>
      )}
    </form>
  )
}
