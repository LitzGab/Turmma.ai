import type { ChaveDeFuncao } from '@educa/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardCheck, MessagesSquare, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { emCurso } from '../../api/ciclo-de-execucao'
import { mensagemDoErro } from '../../api/cliente'
import { consultaEntregasPendentes } from '../../api/entregas'
import { consultaEu } from '../../api/eu'
import { useCicloDeExecucao } from '../../api/execucoes'
import { useLugarNaAba } from '../../api/memoria-da-aba'
import { consultaTime, funcaoSuspensa } from '../../api/time'
import { consultaMeusVinculos } from '../../api/vinculos'
import { caminhoDaCorrecaoDoProfessor, ROTAS_DO_PROFESSOR } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Tela } from '../../componentes/Tela'
import { useTituloDaTela } from '../../titulo'
import { AvisoDeSuspensao } from './avisos'
import { CaixaDoAssistente } from './CaixaDoAssistente'
import { esperandoVoce } from './entregas'
import { CICLO_DA_CONVERSA, CONTEXTO_ESCOLHIDO, enviarPedidoDaConversa } from './memoria-do-professor'
import { saudacao } from './saudacao'
import { nomesDasTurmas, turmaEscolhida, turmasDaProfessora } from './turmas-da-professora'

/** O ícone de cada função do Assistente que deixa entrega esperando a professora. */
const ICONE_DA_FUNCAO: Readonly<Partial<Record<ChaveDeFuncao, LucideIcon>>> = { adaptacao: SlidersHorizontal, correcao_de_objetiva: ClipboardCheck }

/**
 * A Home do professor, "Nova conversa" (D73; `docs/interface.md` 11.2): a saudação pela hora, a caixa de pedido do
 * Assistente de ensino e, **só quando há entrega pendente**, o que espera a professora. Sem pendência não há cartão nem
 * enfeite no lugar; não há atalho em pílula (P15), e a linha do dia nasce com a grade (F8).
 *
 * Na caixa, à esquerda o que muda o pedido (a **Ferramenta**) e à direita o contexto (a **turma e a disciplina**, das
 * turmas com vínculo confirmado dela). Enviar leva à conversa:
 * - sem ferramenta, o pedido vai ao Assistente, que responde ou pergunta se ela quer a ferramenta (D18);
 * - com a atividade ou o plano escolhidos, o cartão da ferramenta abre já na conversa, com a turma e o tema do pedido, e
 *   nenhum pedido é gasto perguntando o que ela já disse;
 * - a **Adaptação** abre o cartão dela direto ao ser escolhida, e **nunca recebe o que foi escrito na caixa** (D35, D67).
 *
 * Os quatro estados são os das turmas dela: carregando, erro, vazio (o que falta, e onde resolver) e com dado.
 */
export default function Home() {
  useTituloDaTela('Nova conversa')
  const [, navegar] = useLocation()
  const eu = useQuery(consultaEu)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const time = useQuery(consultaTime)
  const pendentes = useQuery(consultaEntregasPendentes)
  const contexto = useLugarNaAba(CONTEXTO_ESCOLHIDO)
  const { ciclo, iniciar } = useCicloDeExecucao(CICLO_DA_CONVERSA, enviarPedidoDaConversa)
  // A hora de quando a tela abriu: a saudação não muda com a professora olhando para ela.
  const [agora] = useState(() => new Date())

  const itensDosVinculos = vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []
  const turmas = turmasDaProfessora(itensDosVinculos)
  const turma = turmaEscolhida(turmas, contexto)
  const suspensa = funcaoSuspensa(time.data, 'conversa_e_ferramentas')
  const respondendo = emCurso(ciclo)
  const esperando = esperandoVoce(pendentes.data?.itens ?? [], nomesDasTurmas(itensDosVinculos))

  return (
    <Tela titulo="Nova conversa" largura="conversa">
      <div className="flex min-w-0 flex-col gap-6 pt-4 md:pt-10">
        <div className="min-w-0 text-center">
          <p className="text-[28px] leading-tight break-words text-tinta">{saudacao(eu.data?.nome, agora)}</p>
          <p className="mt-1 text-lg text-sutil">O que vamos preparar hoje?</p>
        </div>

        {vinculos.isPending && <EstadoCarregando rotulo="Carregando as suas turmas…" />}
        {vinculos.isError && <EstadoErro erro={vinculos.error} tentando={vinculos.isFetching} aoTentarDeNovo={() => void vinculos.refetch({ cancelRefetch: false })} />}
        {vinculos.data !== undefined && turma === undefined && (
          <EstadoVazio
            titulo="Falta uma turma confirmada"
            descricao="O Assistente trabalha a partir do material de uma turma e de uma disciplina suas. Confirme as suas turmas em Turmas; se nenhuma aparece lá, quem aloca é a coordenação."
            acao={{ rotulo: 'Ir para Turmas', aoAcionar: () => navegar(ROTAS_DO_PROFESSOR.turmas) }}
          />
        )}

        {turma !== undefined && (
          <div className="flex min-w-0 flex-col gap-3">
            {suspensa && <AvisoDeSuspensao funcao="conversa_e_ferramentas" />}
            <CaixaDoAssistente turmas={turmas} turma={turma} iniciar={iniciar} respondendo={respondendo} desligada={suspensa} depois={() => navegar(ROTAS_DO_PROFESSOR.conversa)} />
            <p className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 text-sm text-sutil">
              <span className="min-w-0 break-words" role="status">
                {respondendo ? 'O Assistente ainda está respondendo ao seu último pedido.' : ''}
              </span>
              {/* Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela. */}
              <Link to={ROTAS_DO_PROFESSOR.conversa} className="inline-flex min-h-11 items-center gap-1 text-caramelo-texto underline md:min-h-9">
                Abrir a conversa com o Assistente
              </Link>
            </p>
          </div>
        )}

        {pendentes.isError && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-controle bg-erro-cx p-3 text-erro">
            <span role="alert" className="min-w-0 flex-1 basis-56 break-words">
              Não foi possível ver o que espera você. {mensagemDoErro(pendentes.error)}
            </span>
            <Botao variante="secundario" onClick={() => void pendentes.refetch({ cancelRefetch: false })}>
              Tentar de novo
            </Botao>
          </div>
        )}

        {/* "Esperando você" só existe com entrega pendente. Sem pendência, nada ocupa o lugar. */}
        {esperando.length > 0 && (
          <section aria-labelledby="titulo-esperando" className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h2 id="titulo-esperando" className="text-base font-semibold text-tinta">
                Esperando você
              </h2>
              <Link to={ROTAS_DO_PROFESSOR.timeDoAssistente} className="inline-flex min-h-11 items-center gap-1 text-sm text-caramelo-texto underline md:min-h-9">
                Tudo que o Assistente fez
                <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
              </Link>
            </div>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {esperando.map((item) => {
                const Icone = ICONE_DA_FUNCAO[item.funcao] ?? MessagesSquare
                return (
                  <li key={item.id} className="min-w-0">
                    <Link to={item.atividadeAplicadaId === null ? ROTAS_DO_PROFESSOR.timeDoAssistente : caminhoDaCorrecaoDoProfessor(item.atividadeAplicadaId)} data-esperando-voce="" className="flex h-full min-h-11 min-w-0 items-start gap-3 rounded-cartao border border-linha bg-superficie p-4 hover:bg-realce-suave">
                      <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-linha bg-noite text-white">
                        <Icone size={18} strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[13px] text-sutil">{item.nomeDaFuncao}</span>
                        <span className="font-medium break-words text-tinta">{item.titulo}</span>
                        <span className="text-sm break-words text-apoio">{item.detalhe}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-tinta">
                          {item.atividadeAplicadaId === null ? 'Ver e decidir' : 'Revisar'}
                          <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {pendentes.data?.proxima !== undefined && <p className="text-sm text-sutil">Há mais entregas esperando você em Seu time.</p>}
          </section>
        )}
      </div>
    </Tela>
  )
}
