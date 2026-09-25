import { VALIDADE_DO_CONVITE_HORAS, type EscolaDoPainel, type PedidoConviteDaCoordenacao, type RespostaConviteDaCoordenacao } from '@educa/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { ROTAS } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { copiarLink, linkDoConvite } from '../acoes-do-convite'
import { CHAVE_DAS_ESCOLAS, mutacaoDoGerarConvite, mutacaoDoRefazerConvite } from '../api/painel'
import { pedidoDeConvite, type CampoDoConvite } from '../pedidos-do-painel'
import { falhaDoConvite } from '../textos'
import { CLASSES_DO_BOTAO_SECUNDARIO } from './botao-secundario'
import { DialogoDaOperacao } from './DialogoDaOperacao'

/** O que é dito do link, antes de gerar e depois: vale 72 h, entra uma vez, e aparece uma vez só. */
const TEXTO_DA_VALIDADE = `O convite vale ${String(VALIDADE_DO_CONVITE_HORAS)} horas e entra uma vez só.`
const TEXTO_DO_LINK_UMA_VEZ = 'O link aparece uma vez, logo depois de gerar. Copie e mande à coordenadora antes de fechar.'

/** O que a área de transferência fez, dito no `role="status"` de dentro do diálogo (W9). */
const TEXTO_DO_LINK_COPIADO = 'Link copiado.'
const TEXTO_DO_LINK_SELECIONADO = 'O link está selecionado no campo. Copie com Ctrl+C, ou toque e segure no campo e escolha Copiar.'

type EscolaDoConvite = Pick<EscolaDoPainel, 'id' | 'nome' | 'estado'>

/**
 * Fechar o diálogo que tem, ou vai ter, um link que ninguém copiou (Tech Spec da A0b, seção 9; cenários W3 e W8). Com o
 * link em risco — o pedido no ar, ou o link na tela sem cópia confirmada —, o primeiro pedido de fechar (o botão, o Esc
 * ou o toque fora) mostra a pergunta; o segundo, feito na pergunta, fecha. Sem link em risco, fecha na hora.
 *
 * Fechar de vez solta a mutação (`reset()`): o token sai do diálogo e, com o `gcTime: 0` das mutações do convite, do
 * cache na mesma hora (regra 20, item 8).
 */
function useFechamento(linkEmRisco: boolean, soltar: () => void, aoFechar: () => void) {
  const [perguntando, definirPerguntando] = useState(false)
  function fecharDeVez(): void {
    soltar()
    aoFechar()
  }
  function pedirParaFechar(): void {
    if (!linkEmRisco || perguntando) fecharDeVez()
    else definirPerguntando(true)
  }
  return { perguntando, pedirParaFechar, fecharDeVez, voltar: () => definirPerguntando(false) }
}

/** A pergunta antes de fechar sem o link copiado. "Voltar" e "Fechar sem copiar" do mesmo tamanho (D59). */
function Pergunta({
  titulo,
  noAr,
  aoVoltar,
  aoFecharDeVez,
}: {
  titulo: RefObject<HTMLHeadingElement | null>
  /** O pedido ainda sem resposta: o link não existe ainda, e a pergunta diz isso. */
  noAr: boolean
  aoVoltar: () => void
  aoFecharDeVez: () => void
}) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <h3 ref={titulo} tabIndex={-1} className="font-semibold">
        Fechar sem copiar o link?
      </h3>
      <p className="text-apoio">
        {noAr
          ? 'O convite ainda está sendo gerado, e o link aparece uma vez só, aqui. Se fechar agora, ele não aparece, e para a coordenadora entrar será preciso refazer o convite.'
          : 'O link aparece uma vez só. Se fechar agora, ele não aparece de novo, e para a coordenadora entrar será preciso refazer o convite.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <Botao onClick={aoVoltar}>Voltar ao convite</Botao>
        <button type="button" onClick={aoFecharDeVez} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Fechar sem copiar
        </button>
      </div>
    </div>
  )
}

/**
 * O link do convite, uma vez (W9): num campo de leitura, com "Copiar link". Com a área de transferência, copia e anuncia
 * "Link copiado." dentro do diálogo; sem ela, seleciona o campo e pede a cópia. A cópia feita à mão no campo (Ctrl+C, ou
 * o menu do toque) também conta, pelo evento `copy`.
 */
function EtapaDoLink({
  escolaNome,
  link,
  titulo,
  copia,
  vezDaCopia,
  copiado,
  aoCopiar,
  aoCopiarAMao,
  aoFechar,
}: {
  escolaNome: string
  link: string
  titulo: RefObject<HTMLHeadingElement | null>
  copia: string
  vezDaCopia: number
  copiado: boolean
  aoCopiar: (campo: HTMLInputElement | null) => void
  aoCopiarAMao: () => void
  aoFechar: () => void
}) {
  const campo = useRef<HTMLInputElement>(null)
  const idDoCampo = useId()
  return (
    <div className="mt-4 flex flex-col gap-4">
      <h3 ref={titulo} tabIndex={-1} className="font-semibold">
        Copie o link do convite
      </h3>
      <p className="text-apoio">
        Mande à coordenadora de <span className="font-medium text-tinta wrap-anywhere">{escolaNome}</span>. {TEXTO_DA_VALIDADE} Depois de fechar,
        este link não aparece de novo.
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={idDoCampo} className="font-medium">
          Link do convite
        </label>
        <input
          ref={campo}
          id={idDoCampo}
          type="text"
          readOnly
          value={link}
          autoComplete="off"
          spellCheck={false}
          onFocus={(evento) => evento.currentTarget.select()}
          onCopy={aoCopiarAMao}
          className="min-h-11 w-full min-w-0 rounded-controle border border-borda-campo bg-fundo px-3 py-2 text-base text-tinta"
        />
      </div>
      {/* Sempre na árvore, mesmo vazio: a região que aparece junto com o texto nem sempre é anunciada. A altura fica
          reservada, e o texto chega sem empurrar os botões. */}
      <p role="status" className={`min-h-6 text-sm ${copiado ? 'text-ok' : 'text-apoio'}`}>
        <span key={vezDaCopia}>{copia}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        <Botao onClick={() => aoCopiar(campo.current)}>Copiar link</Botao>
        <button type="button" onClick={aoFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Fechar
        </button>
      </div>
    </div>
  )
}

/** A cópia do link e o que foi dito dela: vazio, "Link copiado." ou o pedido de copiar à mão. */
function useCopia() {
  const [copiado, definirCopiado] = useState(false)
  const [dito, definirDito] = useState({ texto: '', vez: 0 })
  // Cada vez é um nó novo na região, e o leitor de tela anuncia de novo o "Link copiado." da segunda cópia.
  const definirTexto = (texto: string) => definirDito((anterior) => ({ texto, vez: anterior.vez + 1 }))
  async function copiar(link: string, campo: HTMLInputElement | null): Promise<void> {
    // Sem contexto seguro não há `navigator.clipboard`, embora o tipo diga que sempre há.
    const area: Clipboard | undefined = navigator.clipboard
    const resultado = await copiarLink(link, area)
    if (resultado === 'copiado') {
      definirCopiado(true)
      definirTexto(TEXTO_DO_LINK_COPIADO)
      return
    }
    campo?.focus()
    campo?.select()
    definirTexto(TEXTO_DO_LINK_SELECIONADO)
  }
  function copiadoAMao(): void {
    definirCopiado(true)
    definirTexto(TEXTO_DO_LINK_COPIADO)
  }
  return { copiado, texto: dito.texto, vez: dito.vez, copiar, copiadoAMao }
}

/**
 * A falha de um pedido, com o foco nela: o botão que o fez pode sumir (a lista mudou, e só sobra "Fechar") ou estar
 * desligado, e o foco não fica solto no diálogo. O alerta é lido pelo `role="alert"` de qualquer jeito.
 */
function Falha({ texto, erro }: { texto: string; erro: unknown }) {
  const alerta = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    alerta.current?.focus()
  }, [erro])
  return (
    <p ref={alerta} tabIndex={-1} role="alert" className="rounded-controle border border-erro bg-erro-cx p-3 text-erro">
      {texto}
    </p>
  )
}

/** O foco que acompanha a etapa: a pergunta, o link, ou o começo da etapa a que se voltou. */
function useFocoDaEtapa(etapa: string, alvo: RefObject<HTMLElement | null>): void {
  const primeira = useRef(true)
  useEffect(() => {
    // Na abertura, quem põe o foco é o diálogo (`focoInicial`), depois do `showModal`.
    if (primeira.current) {
      primeira.current = false
      return
    }
    alvo.current?.focus()
  }, [etapa, alvo])
}

interface Props {
  readonly escola: EscolaDoConvite
  /** Quem fecha é quem desmonta: a tela Escolas, pela abertura deste diálogo. */
  readonly aoFechar: () => void
  /** O foco ao fechar quando o botão que abriu já saiu da linha (`DialogoDaOperacao`). */
  readonly focoDeReserva?: () => void
}

/**
 * Gerar o convite da primeira coordenação (Tech Spec da A0b, seção 9; RF2; tarefa 7.0): nome e e-mail, o resumo do que
 * vai acontecer, e o link, uma vez. O token vive só aqui, na mutação deste diálogo: cada abertura é outra instância (a
 * `key` da abertura), e a resposta que chega depois de o diálogo fechar não cai em nenhum outro — nem num aberto para
 * outra escola. Por isso o gerar não chama o `fecharSeAinda` da tela: a resposta dele não fecha nada, e só preenche o
 * diálogo que a pediu.
 */
export function GerarConvite({ escola, aoFechar, focoDeReserva }: Props) {
  const [nome, definirNome] = useState('')
  const [email, definirEmail] = useState('')
  const [erros, definirErros] = useState<Partial<Record<CampoDoConvite, string>>>({})
  const [revisando, definirRevisando] = useState<PedidoConviteDaCoordenacao | undefined>(undefined)
  // O pedido no ar, na hora: o segundo clique de um clique duplo chega antes do `isPending` (W, clique duplo).
  const noAr = useRef(false)
  const clienteDeConsultas = useQueryClient()
  // A lista muda (o estado, ou o que outra pessoa fez): recarrega, dê certo ou não. As opções são as de `api/painel.ts`,
  // sem nada por cima: é lá que o `gcTime: 0` tira o token do cache.
  const gerar = useMutation(mutacaoDoGerarConvite(escola.id, () => clienteDeConsultas.invalidateQueries({ queryKey: CHAVE_DAS_ESCOLAS })))
  const copia = useCopia()
  const fechamento = useFechamento(gerar.isPending || (gerar.isSuccess && !copia.copiado), gerar.reset, aoFechar)
  const campoDoNome = useRef<HTMLInputElement>(null)
  const tituloDaRevisao = useRef<HTMLHeadingElement>(null)
  const tituloDoLink = useRef<HTMLHeadingElement>(null)
  const tituloDaPergunta = useRef<HTMLHeadingElement>(null)
  const etapa = fechamento.perguntando ? 'pergunta' : gerar.isSuccess ? 'link' : revisando !== undefined ? 'revisar' : 'preencher'
  const focos = { pergunta: tituloDaPergunta, link: tituloDoLink, revisar: tituloDaRevisao, preencher: campoDoNome } as const
  useFocoDaEtapa(etapa, focos[etapa])

  function revisar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    const validacao = pedidoDeConvite({ nome, email })
    if (!validacao.ok) {
      definirErros(validacao.erros)
      return
    }
    definirErros({})
    gerar.reset()
    definirRevisando(validacao.pedido)
  }

  function confirmar(): void {
    if (revisando === undefined || noAr.current) return
    noAr.current = true
    gerar.mutate(revisando, { onSettled: () => (noAr.current = false) })
  }

  const dialogo = (conteudo: ReactNode) => (
    <DialogoDaOperacao
      titulo="Convidar a coordenação"
      aoFechar={fechamento.pedirParaFechar}
      aoFecharPeloNavegador={fechamento.fecharDeVez}
      fecharAoClicarFora
      {...(focoDeReserva === undefined ? {} : { focoDeReserva })}
    >
      {conteudo}
    </DialogoDaOperacao>
  )

  if (etapa === 'pergunta') return dialogo(<Pergunta titulo={tituloDaPergunta} noAr={gerar.isPending} aoVoltar={fechamento.voltar} aoFecharDeVez={fechamento.fecharDeVez} />)

  if (etapa === 'link' && gerar.data !== undefined) {
    const link = linkDoConvite(window.location.origin, ROTAS.convite, gerar.data.token)
    return dialogo(
      <EtapaDoLink
        escolaNome={escola.nome}
        link={link}
        titulo={tituloDoLink}
        copia={copia.texto}
        vezDaCopia={copia.vez}
        copiado={copia.copiado}
        aoCopiar={(campo) => void copia.copiar(link, campo)}
        aoCopiarAMao={copia.copiadoAMao}
        aoFechar={fechamento.pedirParaFechar}
      />,
    )
  }

  if (revisando !== undefined) {
    const falha = gerar.isError ? falhaDoConvite('gerar', gerar.error) : undefined
    return dialogo(
      <div className="mt-4 flex flex-col gap-4">
        <h3 ref={tituloDaRevisao} tabIndex={-1} className="font-semibold">
          Confira antes de gerar
        </h3>
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm text-sutil">Escola</dt>
            <dd className="wrap-anywhere">{escola.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-sutil">Nome da coordenadora</dt>
            <dd className="wrap-anywhere">{revisando.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-sutil">E-mail</dt>
            <dd className="wrap-anywhere">{revisando.email}</dd>
          </div>
        </dl>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-apoio">
          <li>{TEXTO_DA_VALIDADE}</li>
          <li>{TEXTO_DO_LINK_UMA_VEZ}</li>
          {escola.estado === 'aceito' && <li>O convite aceito antes deixa de ativar a conta: só este novo ativa.</li>}
        </ul>
        {falha !== undefined && <Falha texto={falha.texto} erro={gerar.error} />}
        <div className="flex flex-wrap gap-3">
          {falha?.listaMudou !== true && (
            <>
              <Botao onClick={confirmar} disabled={gerar.isPending}>
                {gerar.isPending ? 'Gerando…' : 'Gerar convite'}
              </Botao>
              <button type="button" onClick={() => definirRevisando(undefined)} disabled={gerar.isPending} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                Voltar e corrigir
              </button>
            </>
          )}
          <button type="button" onClick={fechamento.pedirParaFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            {falha?.listaMudou === true ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
        <span role="status" className="sr-only">
          {gerar.isPending ? 'Gerando o convite…' : ''}
        </span>
      </div>,
    )
  }

  return dialogo(
    <form className="mt-4 flex flex-col gap-4" onSubmit={revisar} noValidate>
      <p className="text-apoio">
        Para <span className="font-medium text-tinta wrap-anywhere">{escola.nome}</span>. A coordenadora recebe o link de você e cria a senha dela.
      </p>
      <Campo
        ref={campoDoNome}
        rotulo="Nome da coordenadora"
        name="nome"
        type="text"
        autoComplete="off"
        required
        value={nome}
        onChange={(evento) => definirNome(evento.target.value)}
        erro={erros.nome}
      />
      <Campo
        rotulo="E-mail da coordenadora"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        value={email}
        onChange={(evento) => definirEmail(evento.target.value)}
        erro={erros.email}
      />
      <div className="flex flex-wrap gap-3">
        <Botao type="submit">Revisar</Botao>
        <button type="button" onClick={fechamento.pedirParaFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>,
  )
}

interface PropsDoRefazer extends Props {
  /** O último convite de coordenação da escola, como a lista o trouxe. */
  readonly conviteId: string
}

/**
 * Refazer o convite (Tech Spec da A0b, seção 9; tarefa 7.0): confirma antes, dizendo que o link anterior para de valer,
 * e então mostra o link novo, uma vez, como o gerar. O `CONFLITO` (outra pessoa refez ou revogou antes) e o
 * `NAO_ENCONTRADO` têm o texto da W10 aqui dentro, e a lista recarrega.
 */
export function RefazerConvite({ escola, conviteId, aoFechar, focoDeReserva }: PropsDoRefazer) {
  const noAr = useRef(false)
  const clienteDeConsultas = useQueryClient()
  const refazer = useMutation(mutacaoDoRefazerConvite(conviteId, () => clienteDeConsultas.invalidateQueries({ queryKey: CHAVE_DAS_ESCOLAS })))
  const copia = useCopia()
  const fechamento = useFechamento(refazer.isPending || (refazer.isSuccess && !copia.copiado), refazer.reset, aoFechar)
  const textoDaConfirmacao = useRef<HTMLParagraphElement>(null)
  const tituloDoLink = useRef<HTMLHeadingElement>(null)
  const tituloDaPergunta = useRef<HTMLHeadingElement>(null)
  const etapa = fechamento.perguntando ? 'pergunta' : refazer.isSuccess ? 'link' : 'confirmar'
  useFocoDaEtapa(etapa, etapa === 'pergunta' ? tituloDaPergunta : etapa === 'link' ? tituloDoLink : textoDaConfirmacao)

  function confirmar(): void {
    if (noAr.current) return
    noAr.current = true
    refazer.mutate(undefined, { onSettled: () => (noAr.current = false) })
  }

  const dialogo = (conteudo: ReactNode) => (
    <DialogoDaOperacao
      titulo="Refazer o convite"
      aoFechar={fechamento.pedirParaFechar}
      aoFecharPeloNavegador={fechamento.fecharDeVez}
      fecharAoClicarFora
      focoInicial={textoDaConfirmacao}
      {...(focoDeReserva === undefined ? {} : { focoDeReserva })}
    >
      {conteudo}
    </DialogoDaOperacao>
  )

  if (etapa === 'pergunta') return dialogo(<Pergunta titulo={tituloDaPergunta} noAr={refazer.isPending} aoVoltar={fechamento.voltar} aoFecharDeVez={fechamento.fecharDeVez} />)

  const resposta: RespostaConviteDaCoordenacao | undefined = refazer.data
  if (etapa === 'link' && resposta !== undefined) {
    const link = linkDoConvite(window.location.origin, ROTAS.convite, resposta.token)
    return dialogo(
      <EtapaDoLink
        escolaNome={escola.nome}
        link={link}
        titulo={tituloDoLink}
        copia={copia.texto}
        vezDaCopia={copia.vez}
        copiado={copia.copiado}
        aoCopiar={(campo) => void copia.copiar(link, campo)}
        aoCopiarAMao={copia.copiadoAMao}
        aoFechar={fechamento.pedirParaFechar}
      />,
    )
  }

  const falha = refazer.isError ? falhaDoConvite('refazer', refazer.error) : undefined
  return dialogo(
    <div className="mt-4 flex flex-col gap-4">
      <p ref={textoDaConfirmacao} tabIndex={-1} className="text-apoio">
        Um link novo para a coordenação de <span className="font-medium text-tinta wrap-anywhere">{escola.nome}</span>. O link mandado antes para de
        valer na hora.
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-apoio">
        <li>{TEXTO_DA_VALIDADE}</li>
        <li>{TEXTO_DO_LINK_UMA_VEZ}</li>
      </ul>
      {falha !== undefined && <Falha texto={falha.texto} erro={refazer.error} />}
      <div className="flex flex-wrap gap-3">
        {falha?.listaMudou !== true && (
          <Botao onClick={confirmar} disabled={refazer.isPending}>
            {refazer.isPending ? 'Refazendo…' : 'Refazer convite'}
          </Botao>
        )}
        <button type="button" onClick={fechamento.pedirParaFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          {falha?.listaMudou === true ? 'Fechar' : 'Cancelar'}
        </button>
      </div>
      <span role="status" className="sr-only">
        {refazer.isPending ? 'Refazendo o convite…' : ''}
      </span>
    </div>,
  )
}
