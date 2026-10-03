import { VALIDADES_DO_ACESSO_DIAS, type RespostaAcessoGerado, type ValidadeDoAcessoDias } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { consultaAcessoDaTurma, mutacaoDoGerarAcesso, revogarAcesso } from '../../api/acesso'
import { caminhoDaSala } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_BOTAO_PERIGO, CLASSES_DO_BOTAO_SECUNDARIO } from '../../componentes/botao-secundario'
import { AvisoDaCopia, CampoDoLink, Falha, Pergunta, useCopia, useFechamento, useFocoDaEtapa } from '../../componentes/copia-unica'
import { Dialogo } from '../../componentes/Dialogo'
import { useDialogoDaTela } from '../../componentes/dialogo-aberto'
import { Anuncio, ConfirmacaoDePerigo, useEnvioUnico } from '../../componentes/dialogos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { linkDoConvite } from '../../componentes/link-do-convite'
import { TurmaIndisponivel } from '../../componentes/TurmaIndisponivel'
import { formatarDataHora } from '../../formatar'
import {
  DITOS_DO_CONVITE_SEM_WHATSAPP,
  falhaDoGerarAcesso,
  codigoEmDoisGrupos,
  codigoSoletrado,
  rotuloDaValidade,
  TEXTO_DA_TURMA_INDISPONIVEL,
  TEXTO_DO_ACESSO_NOVO,
  TEXTO_DO_ACESSO_QUE_CAI,
  TEXTO_DO_ACESSO_UMA_VEZ,
  TEXTO_DE_QUEM_VE_A_LISTA,
  TEXTO_DO_REVOGAR,
  TEXTO_DO_WHATSAPP_ABERTO,
  textoDaPerguntaDeFechar,
  TEXTOS_DA_FALHA_DO_REVOGAR,
  turmaIndisponivel,
  VALIDADE_PADRAO_DO_ACESSO_DIAS,
} from './acesso-da-turma'
import { abrirWhatsApp, textoDoWhatsApp } from './texto-do-whatsapp'

/** A escola da sessão, como o `/v1/eu` a traz: o nome vai no texto do WhatsApp, e o endereço, no link da sala. */
interface EscolaDaSessao {
  readonly nome: string
  readonly slug: string
}

/** Os diálogos da seção, um por vez. O gerar leva se havia acesso ativo na abertura: é o que decide o que ele confirma. */
type TipoDeDialogo = 'gerar' | 'revogar'
interface AlvoDoGerar {
  readonly substitui: boolean
}

/**
 * O acesso dos alunos à turma, dentro da turma aberta pelo professor (A1, 15.0; RF9; W4, "Acesso"; W7): gerar o link da
 * sala e o código da turma com validade de 1, 7 ou 30 dias, trocar por um novo sabendo o que cai, e revogar.
 *
 * Os quatro estados (W4): carregando; erro com "Tentar de novo"; vazio, "Sem acesso ativo", com o Gerar; e com dado, só
 * até quando vale. O link e o código não voltam na leitura: aparecem uma vez, no diálogo que os gerou.
 *
 * - **A seção nunca mostra o estado de antes quando a releitura falha**: "Sem acesso ativo" logo depois de gerar negaria
 *   o acesso que acabou de nascer, e "Acesso ativo" depois de revogar, o contrário. Fica o erro, com "Tentar de novo".
 * - **A turma que saiu do alcance** (`NAO_ENCONTRADO`) diz a quem recorrer, sem "Tentar de novo".
 * - **A validade vem sempre da leitura**, e não da resposta do gerar: o gerar que responde atrasado não escreve por cima
 *   do que o servidor tem agora.
 * - **O link e o código saem com a sessão**: a turma aberta (`Turma.tsx`) só desenha esta seção com a turma e a escola
 *   lidas, e toda sessão que acaba ou muda esvazia as duas leituras; o diálogo aberto sai junto, e não fica atrás do
 *   login por cima (regra 20, item 8).
 */
export function AcessoDaTurma({ turmaId, escola, titulo }: { turmaId: string; escola: EscolaDaSessao; titulo: RefObject<HTMLHeadingElement | null> }) {
  const cliente = useQueryClient()
  const acesso = useQuery(consultaAcessoDaTurma(turmaId))
  const dialogo = useDialogoDaTela<TipoDeDialogo, AlvoDoGerar>()
  const aberta = dialogo.aberta
  const [anuncio, definirAnuncio] = useState('')
  const idDoTitulo = useId()

  const recarregar = useCallback(() => cliente.invalidateQueries({ queryKey: consultaAcessoDaTurma(turmaId).queryKey }), [cliente, turmaId])
  // O foco quando o botão que abriu o diálogo saiu da seção: o "Gerar acesso" do vazio, ou o "Revogar" do acesso que caiu.
  // O título é de quem desenha a página: o vazio dos pedidos também leva o foco a ele (16.0).
  const focarNoTitulo = useCallback(() => titulo.current?.focus(), [titulo])

  /** Abrir um diálogo apaga o anúncio da ação anterior: o que ele dizia já não é o que a pessoa está fazendo. */
  function abrir(tipo: TipoDeDialogo, alvo?: AlvoDoGerar): void {
    definirAnuncio('')
    dialogo.abrir(tipo, alvo)
  }

  function conteudo(): ReactNode {
    if (acesso.isPending) return <EstadoCarregando rotulo="Carregando o acesso da turma…" />
    if (acesso.isError) {
      if (turmaIndisponivel(acesso.error)) return <TurmaIndisponivel texto={TEXTO_DA_TURMA_INDISPONIVEL} />
      return <EstadoErro erro={acesso.error} tentando={acesso.isFetching} aoTentarDeNovo={() => void acesso.refetch({ cancelRefetch: false })} />
    }
    const { expiraEm } = acesso.data
    if (expiraEm === null)
      return (
        <EstadoVazio
          titulo="Sem acesso ativo"
          descricao="Gere o link da sala e o código da turma para os alunos entrarem e pedirem o nome. Você escolhe por quanto tempo os dois valem."
          acao={{ rotulo: 'Gerar acesso', aoAcionar: () => abrir('gerar', { substitui: false }) }}
        />
      )
    return (
      <div className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
        <div className="min-w-0">
          <p className="font-medium text-tinta">Acesso ativo</p>
          <p className="break-words text-apoio">Vale até {formatarDataHora(expiraEm)}.</p>
          <p className="mt-1 text-sm break-words text-apoio">
            O link e o código apareceram uma vez, quando foram gerados. Se eles não estão mais com você, gere um novo acesso.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => abrir('gerar', { substitui: true })} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            Gerar novo
          </button>
          <button type="button" onClick={() => abrir('revogar')} className={CLASSES_DO_BOTAO_PERIGO}>
            Revogar<span className="sr-only"> o acesso</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby={idDoTitulo}>
      <h2 ref={titulo} id={idDoTitulo} tabIndex={-1} className="text-lg font-semibold text-tinta">
        Acesso dos alunos
      </h2>
      <Anuncio texto={anuncio} />
      {conteudo()}

      {/* O gerar não fecha sozinho: a resposta dele só preenche o diálogo que a pediu. */}
      {aberta?.tipo === 'gerar' && (
        <GerarAcesso
          key={aberta.numero}
          turmaId={turmaId}
          escola={escola}
          substitui={aberta.alvo?.substitui === true}
          aoTerminar={recarregar}
          aoFechar={dialogo.fechar}
          focoDeReserva={focarNoTitulo}
        />
      )}
      {aberta?.tipo === 'revogar' && (
        <ConfirmacaoDePerigo
          key={aberta.numero}
          titulo="Revogar o acesso"
          texto={TEXTO_DO_REVOGAR}
          rotuloDaAcao="Revogar acesso"
          rotuloEmAndamento="Revogando…"
          acao={() => revogarAcesso(turmaId)}
          aoFechar={dialogo.fechar}
          aoConcluir={() => {
            definirAnuncio('Acesso revogado. O link e o código não valem mais.')
            dialogo.fecharSeAinda(aberta)
          }}
          aoTerminar={recarregar}
          textosDaFalha={TEXTOS_DA_FALHA_DO_REVOGAR}
          focoDeReserva={focarNoTitulo}
        />
      )}
    </section>
  )
}

interface PropsDoGerar {
  readonly turmaId: string
  readonly escola: EscolaDaSessao
  /** Havia acesso ativo quando o diálogo abriu: ele diz o que cai, antes de confirmar. */
  readonly substitui: boolean
  /** Relê até quando vale o acesso, dê certo ou não: o `CONFLITO` e o `NAO_ENCONTRADO` dizem que a seção mudou. */
  readonly aoTerminar: () => Promise<void>
  readonly aoFechar: () => void
  readonly focoDeReserva: () => void
}

/**
 * Gerar o acesso: a validade (7 dias já escolhidos), o que acontece, e então o link e o código, uma vez. "Gerar novo" é o
 * mesmo diálogo, dizendo antes que o acesso de agora cai. O token e o código vivem só na mutação deste diálogo: cada
 * abertura é outra instância, e a resposta que chega depois de ele fechar não cai em nenhum outro; fechado, saem do cache
 * na mesma hora (`gcTime: 0` em `api/acesso.ts`, e o `reset()` do fechar). O envio é único (`useEnvioUnico`): dois pedidos
 * ao mesmo tempo dariam um acesso e um `CONFLITO`, e a tela poderia ficar com a recusa, sem o código que passou a valer.
 */
function GerarAcesso({ turmaId, escola, substitui, aoTerminar, aoFechar, focoDeReserva }: PropsDoGerar) {
  const [validadeDias, definirValidadeDias] = useState<ValidadeDoAcessoDias>(VALIDADE_PADRAO_DO_ACESSO_DIAS)
  const { enviar, mutacao: gerar } = useEnvioUnico(mutacaoDoGerarAcesso(turmaId, aoTerminar))
  const copia = useCopia()
  const fechamento = useFechamento(gerar.isPending || (gerar.isSuccess && !copia.copiado), gerar.reset, aoFechar)
  const oQueAcontece = useRef<HTMLParagraphElement>(null)
  const tituloDoAcesso = useRef<HTMLHeadingElement>(null)
  const tituloDaPergunta = useRef<HTMLHeadingElement>(null)
  const idDaValidade = useId()
  const etapa = fechamento.perguntando ? 'pergunta' : gerar.isSuccess ? 'acesso' : 'escolher'
  useFocoDaEtapa(etapa, etapa === 'pergunta' ? tituloDaPergunta : etapa === 'acesso' ? tituloDoAcesso : oQueAcontece, gerar.isError)

  const rotuloDaAcao = substitui ? 'Gerar novo acesso' : 'Gerar acesso'
  const dialogo = (conteudo: ReactNode) => (
    <Dialogo
      titulo={rotuloDaAcao}
      aoFechar={fechamento.pedirParaFechar}
      aoFecharPeloNavegador={fechamento.fecharDeVez}
      fecharAoClicarFora
      focoInicial={oQueAcontece}
      focoDeReserva={focoDeReserva}
    >
      {conteudo}
    </Dialogo>
  )

  if (etapa === 'pergunta')
    return dialogo(
      <Pergunta
        titulo={tituloDaPergunta}
        texto={textoDaPerguntaDeFechar(gerar.isPending)}
        rotuloDeVoltar="Voltar ao acesso"
        aoVoltar={fechamento.voltar}
        aoFecharDeVez={fechamento.fecharDeVez}
      />,
    )

  if (etapa === 'acesso' && gerar.data !== undefined)
    return dialogo(<AcessoGerado acesso={gerar.data} escola={escola} titulo={tituloDoAcesso} copia={copia} aoFechar={fechamento.pedirParaFechar} />)

  const falha = gerar.isError ? falhaDoGerarAcesso(gerar.error) : undefined
  const semNovaTentativa = falha?.secaoMudou === true
  return dialogo(
    <div className="mt-4 flex min-w-0 flex-col gap-4">
      <p ref={oQueAcontece} tabIndex={-1} className="break-words text-apoio">
        {substitui ? TEXTO_DO_ACESSO_QUE_CAI : TEXTO_DO_ACESSO_NOVO}
      </p>
      {/* As três opções em linha: no celular baixo, uma embaixo da outra empurrava o "Cancelar" para fora da tela. */}
      <fieldset className="flex flex-wrap gap-x-6" disabled={gerar.isPending || semNovaTentativa}>
        <legend className="font-medium">Por quanto tempo o link e o código valem?</legend>
        {VALIDADES_DO_ACESSO_DIAS.map((dias) => (
          <label key={dias} className="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              name={idDaValidade}
              value={dias}
              checked={validadeDias === dias}
              onChange={() => definirValidadeDias(dias)}
              className="h-6 w-6 accent-noite"
            />
            <span>{rotuloDaValidade(dias)}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-apoio">{TEXTO_DO_ACESSO_UMA_VEZ}</p>
      {falha !== undefined && <Falha texto={falha.texto} erro={gerar.error} />}
      <div className="flex flex-wrap gap-3">
        {!semNovaTentativa && (
          <Botao onClick={() => enviar({ validadeDias })} disabled={gerar.isPending}>
            {gerar.isPending ? 'Gerando…' : rotuloDaAcao}
          </Botao>
        )}
        <button type="button" onClick={fechamento.pedirParaFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          {semNovaTentativa ? 'Fechar' : 'Cancelar'}
        </button>
      </div>
      <span role="status" className="sr-only">
        {gerar.isPending ? 'Gerando o acesso…' : ''}
      </span>
    </div>,
  )
}

/**
 * O acesso gerado, uma vez: o código da turma, grande e nos dois grupos de quatro, para projetar; o link da sala, para
 * copiar; e o WhatsApp, com o texto de `textoDoWhatsApp`, que leva só o nome da escola e o link. Sem o WhatsApp (o
 * navegador não abriu a aba nova), o mesmo botão copia o texto; sem área de transferência, seleciona o link no campo.
 * A tela diz o que o link abre e o que vai pelo WhatsApp, antes de a professora mandar (regra 20, item 8).
 */
function AcessoGerado({
  acesso,
  escola,
  titulo,
  copia,
  aoFechar,
}: {
  acesso: RespostaAcessoGerado
  escola: EscolaDaSessao
  titulo: RefObject<HTMLHeadingElement | null>
  copia: ReturnType<typeof useCopia>
  aoFechar: () => void
}) {
  const campo = useRef<HTMLInputElement>(null)
  const idDoCodigo = useId()
  const caminho = caminhoDaSala(escola.slug)
  const link = linkDoConvite(window.location.origin, caminho, acesso.token)

  async function compartilhar(): Promise<void> {
    const texto = textoDoWhatsApp({ escolaNome: escola.nome, link })
    if (abrirWhatsApp(texto, window)) {
      copia.saiu(TEXTO_DO_WHATSAPP_ABERTO)
      return
    }
    await copia.copiar(texto, campo.current, DITOS_DO_CONVITE_SEM_WHATSAPP)
  }

  return (
    <div className="mt-4 flex min-w-0 flex-col gap-4">
      <h3 ref={titulo} tabIndex={-1} className="font-semibold">
        Acesso gerado
      </h3>
      <p className="break-words text-apoio">Vale até {formatarDataHora(acesso.expiraEm)}. Depois de fechar, o link e o código não aparecem de novo.</p>
      <div role="group" aria-labelledby={idDoCodigo} className="flex min-w-0 flex-col gap-1">
        <p id={idDoCodigo} className="font-medium">
          Código da turma
        </p>
        {/* Grande, para projetar. O leitor de tela leria os dois grupos como palavras: para ele vai o código soletrado. */}
        <p aria-hidden="true" className="font-mono text-4xl font-semibold tracking-widest text-tinta sm:text-6xl">
          {codigoEmDoisGrupos(acesso.codigo)}
        </p>
        <p className="sr-only">{codigoSoletrado(acesso.codigo)}</p>
        <p className="text-sm text-apoio">
          Para entrar com o código, os alunos abrem <span className="font-medium text-tinta wrap-anywhere">{`${window.location.host}${caminho}`}</span>.
        </p>
      </div>
      <CampoDoLink ref={campo} rotulo="Link da sala" link={link} aoCopiarAMao={copia.copiadoAMao} />
      <p className="text-sm text-apoio">{TEXTO_DE_QUEM_VE_A_LISTA}</p>
      <AvisoDaCopia texto={copia.texto} vez={copia.vez} copiado={copia.copiado} />
      <div className="flex flex-wrap gap-3">
        <Botao onClick={() => void copia.copiar(link, campo.current)}>Copiar link</Botao>
        <button type="button" onClick={() => void compartilhar()} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Compartilhar pelo WhatsApp
        </button>
        <button type="button" onClick={aoFechar} className={CLASSES_DO_BOTAO_SECUNDARIO}>
          Fechar
        </button>
      </div>
    </div>
  )
}
