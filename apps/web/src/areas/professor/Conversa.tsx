import { NOME_DA_FERRAMENTA, type MensagemDoAgente } from '@educa/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { LayoutGrid, MessageCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { consultaConversaDoAssistente, mensagensEmOrdem } from '../../api/assistente'
import { emCurso } from '../../api/ciclo-de-execucao'
import { useCicloDeExecucao } from '../../api/execucoes'
import { useLugarNaAba } from '../../api/memoria-da-aba'
import { consultaTime, funcaoSuspensa } from '../../api/time'
import { consultaTitulosDosMateriais } from '../../api/titulos-dos-materiais'
import { consultaMeusVinculos } from '../../api/vinculos'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { BarraPresa } from '../../componentes/BarraPresa'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { AvisoFila } from '../../componentes/ia/AvisoFila'
import { Escolha, type OpcaoDeEscolha } from '../../componentes/ia/Escolha'
import { Conversa as ListaDeMensagens, MensagemIA, MensagemPessoa, Pensando } from '../../componentes/ia/Mensagem'
import { TextoDaIA } from '../../componentes/ia/TextoDaIA'
import { useTituloDaTela } from '../../titulo'
import { AvisoDeSuspensao, FalhaDoPedido } from './avisos'
import { CaixaDoAssistente } from './CaixaDoAssistente'
import { CartaoDeFerramenta } from './CartaoDeFerramenta'
import { mensagensNaTela, pendenteNaConversa, propostaQuePergunta } from './conversa'
import { ferramentaDoCatalogo } from './ferramentas'
import { abrirCartaoNaConversa, CARTAO_DA_CONVERSA, CICLO_DA_CONVERSA, CICLO_DA_FERRAMENTA, CONTEXTO_ESCOLHIDO, enviarPedidoDaConversa, ESCOLHAS_DAS_PROPOSTAS, type EscolhaDaProposta } from './memoria-do-professor'
import { Pagina } from './Pagina'
import { turmaEscolhida, turmasDaProfessora, valorDoContexto } from './turmas-da-professora'

/** As duas respostas à pergunta da D18, **do mesmo peso**: nenhuma é a "certa" (D59), e a peça `Escolha` as desenha iguais. */
function opcoesDaProposta(mensagem: Extract<MensagemDoAgente, { tipo: 'proposta_de_ferramenta' }>): readonly [OpcaoDeEscolha, OpcaoDeEscolha] {
  return [
    { id: 'ferramenta' satisfies EscolhaDaProposta, titulo: `Usar a ferramenta ${NOME_DA_FERRAMENTA[mensagem.proposta.ferramenta]}`, descricao: 'Salva em Ferramentas, liga à turma e cita a página.', icone: LayoutGrid },
    { id: 'conversa' satisfies EscolhaDaProposta, titulo: 'Só conversar', descricao: 'Sigo respondendo aqui, sem salvar nada.', icone: MessageCircle },
  ]
}

/**
 * A conversa da professora com o Assistente de ensino (`docs/interface.md` 11.3): uma thread só, dela (regra 70, item
 * 8). Quem escreve fica à direita, em bolha; a IA não tem bolha e **sempre assina**, com o selo "IA".
 *
 * As etapas de um pedido, na ordem: o pedido aparece na hora; o "pensando", em texto; a resposta, com os chips de página
 * e as fontes; ou a **pergunta da D18**, com as duas opções do mesmo peso, e, com o sim, o **cartão da ferramenta** — o
 * formulário da própria ferramenta, já com o que o Assistente entendeu — que gera e mostra o resultado com as ações
 * sempre visíveis. Geração lenta ou que falha vira aviso dentro da conversa, nunca erro cru; a função suspensa pela
 * escola vira aviso que explica.
 *
 * A conversa é da API e mora no cache de consultas, que toda troca de sessão esvazia: nada dela vai a `localStorage`. O
 * que ainda não chegou à API (o pedido no ar, o cartão aberto) mora na memória da aba (`memoria-do-professor.ts`).
 */
export default function Conversa() {
  useTituloDaTela('Conversa com o Assistente')
  const [, navegar] = useLocation()
  const conversa = useInfiniteQuery(consultaConversaDoAssistente)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const time = useQuery(consultaTime)
  const materiais = useQuery(consultaTitulosDosMateriais)
  const contexto = useLugarNaAba(CONTEXTO_ESCOLHIDO)
  const cartao = useLugarNaAba(CARTAO_DA_CONVERSA)
  const escolhas = useLugarNaAba(ESCOLHAS_DAS_PROPOSTAS) ?? {}
  const { ciclo, demorando, iniciar, repetir } = useCicloDeExecucao(CICLO_DA_CONVERSA, enviarPedidoDaConversa)
  const fim = useRef<HTMLDivElement>(null)
  // A geração do cartão aberto, só para saber se ele ainda ocupa a tela: quem a conduz é o próprio cartão.
  const geracaoDoCartao = useLugarNaAba(CICLO_DA_FERRAMENTA[cartao?.ferramenta ?? 'atividade_objetiva'])
  // Com o cartão no formulário ou gerando, a ação da tela é a dele ("Gerar"): a caixa espera, e "Cancelar" a devolve.
  // Com o resultado pronto, a conversa segue: o pedido seguinte fecha o cartão.
  const cartaoOcupaATela = cartao !== undefined && geracaoDoCartao?.etapa !== 'concluida'

  const lidas = conversa.data === undefined ? [] : mensagensEmOrdem(conversa.data.pages)
  const pendente = pendenteNaConversa(lidas, ciclo)
  const mensagens = mensagensNaTela(lidas, pendente)
  const perguntando = propostaQuePergunta(mensagens, escolhas, ciclo)
  const turmas = turmasDaProfessora(vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? [])
  const turma = turmaEscolhida(turmas, contexto)
  const suspensa = funcaoSuspensa(time.data, 'conversa_e_ferramentas')
  const titulos = materiais.data ?? {}

  // O que acabou de entrar fica à vista: o pedido, a resposta, o cartão. Sem animação: a tela só vai até o fim.
  const quantas = mensagens.length
  const etapa = ciclo?.etapa
  const ferramentaDoCartao = cartao?.ferramenta
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [quantas, etapa, ferramentaDoCartao])

  function aoEscolher(mensagem: Extract<MensagemDoAgente, { tipo: 'proposta_de_ferramenta' }>, escolha: string): void {
    if (escolha !== 'ferramenta' && escolha !== 'conversa') return
    ESCOLHAS_DAS_PROPOSTAS.guardar({ ...escolhas, [mensagem.id]: escolha })
    if (escolha !== 'ferramenta') return
    const { ferramenta, parametros } = mensagem.proposta
    // O cartão abre com o que o Assistente entendeu do pedido; a professora ajusta antes de gerar.
    abrirCartaoNaConversa({
      ferramenta,
      iniciais: { turma: valorDoContexto(parametros.turmaId, parametros.disciplinaId), tema: parametros.tema, ...(parametros.quantidade === undefined ? {} : { quantidade: parametros.quantidade }) },
    })
  }

  const semNada = conversa.data !== undefined && mensagens.length === 0 && pendente === undefined && cartao === undefined

  return (
    <Pagina titulo="Conversa com o Assistente de ensino" largura="conversa">
      {conversa.isPending && <EstadoCarregando rotulo="Carregando a conversa…" />}
      {conversa.isError && conversa.data === undefined && <EstadoErro erro={conversa.error} tentando={conversa.isFetching} aoTentarDeNovo={() => void conversa.refetch({ cancelRefetch: false })} />}
      {semNada && <EstadoVazio titulo="Nenhuma conversa ainda" descricao="Escreva um pedido na caixa abaixo: uma atividade, um plano de aula, uma dúvida sobre o material da turma. O Assistente responde com a página de onde tirou." />}

      {conversa.hasNextPage && (
        <Botao variante="secundario" onClick={() => void conversa.fetchNextPage()} disabled={conversa.isFetchingNextPage} className="self-center">
          {conversa.isFetchingNextPage ? 'Carregando…' : 'Ver mensagens anteriores'}
        </Botao>
      )}

      {!semNada && conversa.data !== undefined && (
        <ListaDeMensagens rotulo="Conversa com o Assistente de ensino">
          {mensagens.map((mensagem) => {
            if (mensagem.autor === 'usuario') return <MensagemPessoa key={mensagem.id}>{mensagem.texto}</MensagemPessoa>
            if (mensagem.tipo === 'texto')
              return (
                <MensagemIA key={mensagem.id} agente="assistente_de_ensino">
                  <TextoDaIA texto={mensagem.texto} citacoes={mensagem.citacoes} materiais={titulos} />
                </MensagemIA>
              )
            const escolhida = escolhas[mensagem.id]
            const aberta = perguntando === mensagem.id
            return (
              <MensagemIA key={mensagem.id} agente="assistente_de_ensino">
                {aberta ? (
                  <Escolha pergunta={mensagem.texto} opcoes={opcoesDaProposta(mensagem)} aoEscolher={(escolha) => aoEscolher(mensagem, escolha)} desligada={suspensa} />
                ) : (
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    <TextoDaIA texto={mensagem.texto} citacoes={[]} materiais={titulos} />
                    {escolhida !== undefined && <Escolha pergunta={mensagem.texto} opcoes={opcoesDaProposta(mensagem)} escolhida={escolhida} aoEscolher={() => undefined} />}
                    {escolhida === 'conversa' && <p className="min-w-0 text-sm break-words text-sutil">Escreva na caixa abaixo o que você quer saber.</p>}
                  </div>
                )}
              </MensagemIA>
            )
          })}

          {pendente?.pedido !== undefined && <MensagemPessoa>{pendente.pedido}</MensagemPessoa>}
          {pendente?.pensando === true && <Pensando agente="assistente_de_ensino" />}
          {pendente?.pensando === true && demorando && <AvisoFila situacao="demora" />}
          {pendente?.erro !== undefined && <FalhaDoPedido erro={pendente.erro} funcao="conversa_e_ferramentas" aoTentarDeNovo={repetir} />}

          {cartao !== undefined && (
            <section aria-label={`Ferramenta ${ferramentaDoCatalogo(cartao.ferramenta).nome}`} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
              {/* A `key` pela ferramenta e pelo que ela já sabe: outro cartão é outro formulário, e não o anterior com os valores dele. */}
              <CartaoDeFerramenta key={`${cartao.ferramenta}-${JSON.stringify(cartao.iniciais)}`} ferramenta={cartao.ferramenta} iniciais={cartao.iniciais} nivel={2} aoCancelar={() => CARTAO_DA_CONVERSA.guardar(undefined)} />
            </section>
          )}
        </ListaDeMensagens>
      )}

      <div ref={fim} aria-hidden="true" />

      {vinculos.isError && <EstadoErro erro={vinculos.error} tentando={vinculos.isFetching} aoTentarDeNovo={() => void vinculos.refetch({ cancelRefetch: false })} />}
      {vinculos.data !== undefined && turma === undefined && (
        <EstadoVazio
          titulo="Falta uma turma confirmada"
          descricao="O Assistente trabalha a partir do material de uma turma e de uma disciplina suas. Confirme as suas turmas em Turmas; se nenhuma aparece lá, quem aloca é a coordenação."
          acao={{ rotulo: 'Ir para Turmas', aoAcionar: () => navegar(ROTAS_DO_PROFESSOR.turmas) }}
        />
      )}
      {suspensa && <AvisoDeSuspensao funcao="conversa_e_ferramentas" />}
      {turma !== undefined && (
        <BarraPresa rotulo="Novo pedido" semLinha>
          <div className="w-full min-w-0">
            <CaixaDoAssistente turmas={turmas} turma={turma} iniciar={iniciar} respondendo={emCurso(ciclo)} desligada={suspensa || cartaoOcupaATela} />
          </div>
        </BarraPresa>
      )}
    </Pagina>
  )
}
