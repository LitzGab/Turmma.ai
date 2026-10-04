import { CodigoDeErro, type RespostaMeuDiagnostico, type RespostaProva } from '@educa/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, CircleAlert, MessageCircleQuestion } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'wouter'
import { consultaMeuDiagnostico, consultaProva, enviarAtividade } from '../../api/atividades-do-aluno'
import { CHAVE_DAS_MINHAS_ATIVIDADES } from '../../api/chaves-do-aluno'
import { ErroDaApi, mensagemDoErro } from '../../api/cliente'
import { caminhoDoTutorNaAtividade, ROTAS_DO_ALUNO } from '../../caminhos'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../componentes/botao-secundario'
import { Cartao } from '../../componentes/Cartao'
import { DialogoDeConfirmacao } from '../../componentes/DialogoDeConfirmacao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Faixa } from '../../componentes/Faixa'
import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
import { ChipFonte } from '../../componentes/ia/ChipFonte'
import { LinhaAprovacao } from '../../componentes/ia/LinhaAprovacao'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tela } from '../../componentes/Tela'
import { formatarDiaEHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import {
  alternativaMarcada,
  avisoDeEscolhasPerdidas,
  contarRespostas,
  faseDaAtividade,
  impedimentoDoEnvio,
  letraDaAlternativa,
  marcaDaQuestao,
  questaoValida,
  respostasSalvas,
  resultadoNaTela,
  rotuloNoMapa,
  textoDasEmBranco,
  textoDasRespondidas,
  textoDoAcerto,
  TEXTO_DA_MARCA,
  type MarcaDaQuestao,
} from './atividade'
import { AVISO_DA_AVALIACAO, TEXTO_DA_ESPERA_PELA_CORRECAO } from './atividades'
import { filaDaAtividade, type FilaDeRespostas } from './fila-de-respostas'
import type { EstadoDaFila } from './respostas'

/** O aluno não alcança o título do material (`GET /v1/materiais` é do professor e da coordenação): o chip diz a página. */
const SEM_TITULOS = {}

const VOLTAR = (
  // Relativo à área: o `Route` aninhado em `/aluno` resolve o `to` a partir da base dela.
  <Link to={ROTAS_DO_ALUNO.atividades} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
    <ArrowLeft aria-hidden="true" size={18} />
    Voltar para Atividades
  </Link>
)

/** Como cada questão aparece no mapa. O estado vai também no nome do botão e no ícone: cor sozinha não diz nada. */
const CLASSES_DO_MAPA: Readonly<Record<MarcaDaQuestao, string>> = {
  sem_resposta: 'border-borda-campo bg-superficie text-sutil',
  salvando: 'border-borda-campo bg-realce text-tinta',
  salva: 'border-borda-campo bg-realce text-tinta',
  nao_salva: 'border-dashed border-erro bg-erro-cx text-erro',
}

interface PropsDeQuemResponde {
  readonly prova: RespostaProva
  readonly fila: FilaDeRespostas
  readonly estadoDaFila: EstadoDaFila
  /** Para onde o foco vai quando o botão de enviar some, com a atividade enviada. */
  readonly focoDepoisDeEnviar: () => void
}

/**
 * A atividade sendo respondida: **uma questão por vez**, com as alternativas em botões de rádio grandes (o rádio nativo,
 * que o teclado e o leitor de tela já conhecem), "Anterior" e "Próxima", e o mapa das questões dizendo quais já têm
 * resposta.
 *
 * **Cada escolha vai ao servidor na hora** (regra 80, item 6), pela fila de `fila-de-respostas.ts`. A tela diz "Resposta
 * salva" só quando o servidor confirmou; quando não consegue salvar, diz, mantém a escolha marcada e tenta de novo
 * sozinha. Nada aqui observa a janela, o foco ou a aba: sair e voltar não é medido (regra 70, item 7).
 */
function Respondendo({ prova, fila, estadoDaFila, focoDepoisDeEnviar }: PropsDeQuemResponde) {
  const cliente = useQueryClient()
  const [atual, definirAtual] = useState(1)
  const [confirmando, definirConfirmando] = useState(false)
  const numero = questaoValida(atual, prova.questoes.length)
  const questao = prova.questoes[numero - 1]
  const salvas = respostasSalvas(prova)
  const contagem = contarRespostas(prova, estadoDaFila)
  const marca = marcaDaQuestao(numero, salvas, estadoDaFila)
  const marcada = alternativaMarcada(numero, salvas, estadoDaFila)
  const impedimento = impedimentoDoEnvio(contagem)
  const ampliada = prova.adaptacao?.tipos.includes('fonte_ampliada') === true
  const provaId = prova.atividadeAplicadaId

  const envio = useMutation({
    mutationFn: () => enviarAtividade(provaId),
    onSuccess: (enviada) => {
      cliente.setQueryData(consultaProva(provaId).queryKey, (lida) => (lida === undefined ? lida : { ...lida, enviadaEm: enviada.enviadaEm }))
      void cliente.invalidateQueries({ queryKey: CHAVE_DAS_MINHAS_ATIVIDADES })
      definirConfirmando(false)
    },
    onError: (erro) => {
      // A professora encerrou enquanto o diálogo estava aberto: a tela relê a atividade e mostra o que ficou.
      if (!(erro instanceof ErroDaApi) || erro.codigo !== CodigoDeErro.ATIVIDADE_ENCERRADA) return
      definirConfirmando(false)
      void cliente.invalidateQueries({ queryKey: consultaProva(provaId).queryKey })
    },
  })

  if (questao === undefined) return null

  return (
    <>
      {prova.avaliativa && <Faixa>{AVISO_DA_AVALIACAO}</Faixa>}

      {/* Onde estou: o número em texto e uma marca por questão. Sem barra que enche para comemorar (D59). */}
      <nav aria-label="Questões" className="flex min-w-0 flex-col gap-3">
        <p className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-base font-semibold text-tinta">
            Questão {numero} de {prova.questoes.length}
          </span>
          <span className="text-sm text-sutil">{textoDasRespondidas(contagem)} com resposta</span>
        </p>
        <ol className="flex min-w-0 flex-wrap gap-1.5">
          {prova.questoes.map((item) => {
            const marcaDoItem = marcaDaQuestao(item.numero, salvas, estadoDaFila)
            const aberta = item.numero === numero
            return (
              <li key={item.numero}>
                <button
                  type="button"
                  onClick={() => definirAtual(item.numero)}
                  aria-label={rotuloNoMapa(item.numero, marcaDoItem)}
                  {...(aberta ? { 'aria-current': 'step' as const } : {})}
                  data-marca={marcaDoItem}
                  className={`relative grid size-11 place-items-center rounded-controle border text-base font-medium ${aberta ? 'border-noite bg-noite text-white' : CLASSES_DO_MAPA[marcaDoItem]}`}
                >
                  {item.numero}
                  {marcaDoItem === 'salva' && <Check aria-hidden="true" size={12} strokeWidth={3} className="absolute top-0.5 right-0.5" />}
                  {marcaDoItem === 'nao_salva' && <CircleAlert aria-hidden="true" size={12} strokeWidth={2.4} className="absolute top-0.5 right-0.5" />}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <Cartao className="flex flex-col gap-4">
        <h2 className={`min-w-0 leading-relaxed font-normal break-words whitespace-pre-wrap text-tinta ${ampliada ? 'text-2xl' : 'text-[17px]'}`}>
          <span className="sr-only">Questão {numero}: </span>
          {questao.enunciado}
        </h2>
        {/* A `key` pela questão: outra questão é outro grupo de rádio, e o foco não fica na alternativa da anterior. */}
        <fieldset key={numero} className="flex min-w-0 flex-col gap-2">
          <legend className="sr-only">Alternativas da questão {numero}</legend>
          {questao.alternativas.map((texto, indice) => {
            const escolhida = marcada === indice
            return (
              // O índice é a identidade da alternativa no contrato: a ordem delas não muda.
              <label
                key={indice}
                data-alternativa={indice}
                className={`flex min-h-14 min-w-0 cursor-pointer items-start gap-3 rounded-controle border p-3 ${escolhida ? 'border-noite bg-realce-suave' : 'border-borda-campo bg-superficie hover:bg-realce-suave'}`}
              >
                <input type="radio" name={`questao-${String(numero)}`} value={indice} checked={escolhida} onChange={() => fila.escolher(numero, indice)} className="mt-1 size-5 shrink-0 accent-noite" />
                <span className={`min-w-0 break-words text-tinta ${ampliada ? 'text-xl' : 'text-base'}`}>
                  <span className="font-semibold">{letraDaAlternativa(indice)}.</span> {texto}
                </span>
              </label>
            )
          })}
        </fieldset>

        {/* Sempre na tela, mesmo vazia: é uma região de status, e o leitor de tela anuncia o que entra nela. */}
        <div role="status" data-resposta={marca} className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-base">
          {marca === 'salva' && (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-ok">
              <Check aria-hidden="true" size={18} strokeWidth={2.4} className="shrink-0" />
              {TEXTO_DA_MARCA.salva}
            </span>
          )}
          {marca === 'salvando' && <span className="text-sutil">{TEXTO_DA_MARCA.salvando}</span>}
          {marca === 'nao_salva' && estadoDaFila.falha === 'passageira' && <span className="min-w-0 break-words text-erro">{TEXTO_DA_MARCA.nao_salva}</span>}
          {marca === 'nao_salva' && estadoDaFila.falha === 'recusada' && <span className="min-w-0 break-words text-erro">Não foi possível salvar esta resposta. Chame a professora.</span>}
        </div>
        {marca === 'nao_salva' && estadoDaFila.falha === 'passageira' && (
          <Botao variante="secundario" onClick={fila.tentarAgora} className="self-start">
            Tentar salvar agora
          </Botao>
        )}
      </Cartao>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <Botao variante="secundario" disabled={numero === 1} onClick={() => definirAtual(numero - 1)}>
          <ArrowLeft aria-hidden="true" size={18} className="shrink-0" />
          Anterior
        </Botao>
        <Botao variante="secundario" disabled={numero === prova.questoes.length} onClick={() => definirAtual(numero + 1)}>
          Próxima
          <ArrowRight aria-hidden="true" size={18} className="shrink-0" />
        </Botao>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-linha pt-4">
        {/* Em avaliação o Tutor está pausado para a turma: a tela não oferece um caminho que só levaria ao aviso. */}
        {prova.avaliativa ? (
          <span />
        ) : (
          <Link to={caminhoDoTutorNaAtividade(provaId, numero)} className={`${CLASSES_DO_LINK_SECUNDARIO} gap-2`}>
            <MessageCircleQuestion aria-hidden="true" size={18} className="shrink-0" />
            Pedir ajuda ao Tutor nesta questão
          </Link>
        )}
        <Botao variante="oficial" onClick={() => definirConfirmando(true)}>
          Enviar a atividade
        </Botao>
      </div>
      {/* O ponto de parada, dito: sair não custa nada, e voltar é do mesmo tamanho (D59). */}
      <p className="text-sm text-sutil">Pode parar quando quiser. O que você respondeu fica guardado, e dá para continuar depois.</p>

      {confirmando && (
        <DialogoDeConfirmacao
          titulo="Enviar a atividade?"
          familia="oficial"
          resumo={[
            { rotulo: 'Atividade', valor: prova.titulo },
            { rotulo: 'Com resposta', valor: textoDasRespondidas(contagem) },
            { rotulo: 'Em branco', valor: textoDasEmBranco(contagem.emBranco) },
          ]}
          efeito="Depois de enviar, não dá para mudar as respostas. A sua professora revisa a correção antes de você ver o resultado."
          {...(impedimento !== undefined
            ? { aviso: impedimento }
            : contagem.emBranco > 0
              ? { aviso: `${textoDasEmBranco(contagem.emBranco)}. Dá para voltar e responder antes de enviar.` }
              : {})}
          rotuloDeConfirmar="Enviar a atividade"
          rotuloConfirmando="Enviando…"
          rotuloDeCancelar="Continuar respondendo"
          aoConfirmar={() => envio.mutate()}
          aoFechar={() => {
            definirConfirmando(false)
            envio.reset()
          }}
          confirmando={envio.isPending}
          impedido={impedimento !== undefined}
          {...(envio.isError ? { falha: mensagemDoErro(envio.error) } : {})}
          focoDeReserva={focoDepoisDeEnviar}
        />
      )}
    </>
  )
}

/**
 * O diagnóstico do próprio aluno, **que só existe depois de a professora aprovar a correção** (regra 70, item 3): os
 * acertos por habilidade e questão por questão, em contagem. **Sem nota, sem conceito, sem percentual e sem comparação
 * com ninguém** (D46; regra 50, item 9). Leva a assinatura da função que corrigiu, com o selo "IA", e quem aprovou.
 */
function Diagnostico({ diagnostico, prova }: { diagnostico: RespostaMeuDiagnostico; prova: RespostaProva }) {
  return (
    <Cartao titulo="Seu resultado" className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col items-start gap-2">
        <AssinaturaIA funcao="correcao_de_objetiva" />
        <LinhaAprovacao aprovacao={{ estado: 'aprovada', por: diagnostico.aprovadoPor?.nome ?? 'quem dava aula para a turma', quando: diagnostico.aprovadoEm }} verbo="Correção aprovada por" />
      </div>
      <p className="text-base text-tinta">Você acertou {textoDoAcerto(diagnostico.acertos, diagnostico.total)}.</p>

      {diagnostico.porHabilidade.length > 0 && (
        <section aria-labelledby="titulo-por-habilidade" className="flex min-w-0 flex-col gap-3">
          <h3 id="titulo-por-habilidade" className="text-base font-semibold text-tinta">
            Acertos por habilidade
          </h3>
          {diagnostico.porHabilidade.map((item) => (
            <BarraRotulada key={item.habilidade.codigo} rotulo={item.habilidade.descricao} valor={item.acertos} maximo={item.total} texto={textoDoAcerto(item.acertos, item.total)} />
          ))}
        </section>
      )}

      <section aria-labelledby="titulo-por-questao" className="flex min-w-0 flex-col gap-3">
        <h3 id="titulo-por-questao" className="text-base font-semibold text-tinta">
          Questão por questão
        </h3>
        <ol className="flex min-w-0 flex-col gap-3">
          {diagnostico.questoes.map((questao) => {
            const alternativas = prova.questoes.find((item) => item.numero === questao.numero)?.alternativas ?? []
            const comTexto = (indice: number): string => {
              const texto = alternativas[indice]
              return texto === undefined ? letraDaAlternativa(indice) : `${letraDaAlternativa(indice)}. ${texto}`
            }
            return (
              <li key={questao.numero} data-questao-corrigida={questao.correta ? 'certa' : 'outra'} className="flex min-w-0 flex-col items-start gap-1.5 rounded-controle border border-linha p-3">
                <p className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-semibold text-tinta">Questão {questao.numero}</span>
                  {questao.correta ? <Estado familia="ok">Você acertou</Estado> : <Estado familia="info">{questao.alternativa === null ? 'Ficou em branco' : 'Para rever'}</Estado>}
                </p>
                {questao.alternativa !== null && <p className="min-w-0 break-words text-apoio">Você marcou: {comTexto(questao.alternativa)}</p>}
                {!questao.correta && <p className="min-w-0 break-words text-apoio">A resposta é: {comTexto(questao.gabarito)}</p>}
                <p className="min-w-0 break-words text-tinta">
                  {questao.explicacao} <ChipFonte citacao={questao.citacao} materiais={SEM_TITULOS} />
                </p>
              </li>
            )
          })}
        </ol>
      </section>
    </Cartao>
  )
}

interface PropsDoFim {
  readonly prova: RespostaProva
  readonly estadoDaFila: EstadoDaFila
}

/**
 * A atividade que não recebe mais resposta: enviada pelo aluno, ou encerrada pela professora. A tela **não deixa mudar
 * nada**, e do resultado diz só o que já pode ser dito: enquanto a correção não foi aprovada, que ela vai ser revista.
 */
function SemMaisRespostas({ prova, estadoDaFila }: PropsDoFim) {
  const fase = faseDaAtividade(prova)
  const diagnostico = useQuery(consultaMeuDiagnostico(prova.atividadeAplicadaId))
  const resultado = resultadoNaTela(fase, diagnostico)
  const contagem = contarRespostas(prova, { ...estadoDaFila, pendentes: [] })
  const perdidas = avisoDeEscolhasPerdidas(estadoDaFila)

  return (
    <>
      <Cartao titulo={prova.enviadaEm === null ? 'A professora encerrou esta atividade' : 'Atividade enviada'} className="flex flex-col gap-2">
        <p className="break-words text-apoio">
          {prova.enviadaEm === null ? '' : `Enviada em ${formatarDiaEHora(prova.enviadaEm)}. `}
          Você respondeu {textoDasRespondidas(contagem)}. Não dá mais para mudar as respostas.
        </p>
        {perdidas !== undefined && (
          <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro">
            {perdidas}
          </p>
        )}
      </Cartao>

      {resultado.tipo === 'carregando' && <EstadoCarregando rotulo="Procurando o resultado…" />}
      {resultado.tipo === 'aguardando' && (
        <div data-resultado="aguardando">
          <Faixa>{`${TEXTO_DA_ESPERA_PELA_CORRECAO} O resultado aparece aqui depois que ela aprovar.`}</Faixa>
        </div>
      )}
      {resultado.tipo === 'erro' && <EstadoErro erro={resultado.erro} tentando={diagnostico.isFetching} aoTentarDeNovo={() => void diagnostico.refetch({ cancelRefetch: false })} />}
      {resultado.tipo === 'pronto' && <Diagnostico diagnostico={resultado.diagnostico} prova={prova} />}
    </>
  )
}

/**
 * Uma atividade aberta pelo aluno (MVP, A3): respondendo, uma questão por vez; depois de enviada ou encerrada, o que
 * ficou e, **só depois de a professora aprovar a correção**, o diagnóstico por habilidade. Os quatro estados: carregando,
 * a atividade que não existe para este aluno (igual à de outra turma: regra 10, item 6), o erro com "Tentar de novo" e a
 * atividade.
 *
 * É tela de objeto: o título é o nome da atividade, e aparece.
 */
export default function Atividade({ atividadeAplicadaId }: { atividadeAplicadaId: string }) {
  const cliente = useQueryClient()
  const prova = useQuery(consultaProva(atividadeAplicadaId))
  const fila = filaDaAtividade(cliente, atividadeAplicadaId)
  const estadoDaFila = useSyncExternalStore(fila.assinar, fila.ler)
  const topo = useRef<HTMLDivElement>(null)
  useTituloDaTela(prova.data?.titulo ?? 'Atividade')

  // O servidor recusou uma resposta porque a atividade foi encerrada: a tela relê a atividade, que agora diz isso.
  const encerradaNoServidor = estadoDaFila.falha === 'encerrada'
  useEffect(() => {
    if (encerradaNoServidor) void cliente.invalidateQueries({ queryKey: consultaProva(atividadeAplicadaId).queryKey })
  }, [encerradaNoServidor, cliente, atividadeAplicadaId])

  if (prova.data === undefined) {
    const naoEncontrada = prova.error instanceof ErroDaApi && prova.error.codigo === CodigoDeErro.NAO_ENCONTRADO
    return (
      <Tela titulo="Atividade" antes={VOLTAR} largura="conversa">
        {prova.isPending ? (
          <EstadoCarregando rotulo="Carregando a atividade…" />
        ) : naoEncontrada ? (
          <EstadoVazio titulo="Esta atividade não está disponível" descricao="Ela pode ser de outra turma, ou o endereço está errado. O que a sua professora passou para você está em Atividades." />
        ) : (
          <EstadoErro erro={prova.error} tentando={prova.isFetching} aoTentarDeNovo={() => void prova.refetch({ cancelRefetch: false })} />
        )}
      </Tela>
    )
  }

  const dados = prova.data
  return (
    <Tela titulo={dados.titulo} objeto antes={VOLTAR} largura="conversa">
      {/* Quem recebe o foco quando o botão de enviar some: sem isto ele cairia no `body` (regra 50, item 11). */}
      <div ref={topo} tabIndex={-1} className="flex min-w-0 flex-col gap-4">
        {faseDaAtividade(dados) === 'respondendo' ? (
          <Respondendo prova={dados} fila={fila} estadoDaFila={estadoDaFila} focoDepoisDeEnviar={() => topo.current?.focus()} />
        ) : (
          <SemMaisRespostas prova={dados} estadoDaFila={estadoDaFila} />
        )}
      </div>
    </Tela>
  )
}
