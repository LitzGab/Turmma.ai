import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChevronRight, HeartHandshake } from 'lucide-react'
import { useId, useState } from 'react'
import { useLocation } from 'wouter'
import { consultaAtividadesAplicadas } from '../../api/atividades'
import { mensagemDoErro } from '../../api/cliente'
import { agenteDoTime, consultaTime } from '../../api/time'
import { consultaTitulosDosMateriais } from '../../api/titulos-dos-materiais'
import { consultaSinais, consultaUsoDoTutor } from '../../api/tutor-da-turma'
import { consultaMeusVinculos } from '../../api/vinculos'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
import { Conversa, MensagemIA } from '../../componentes/ia/Mensagem'
import { Selecao } from '../../componentes/Selecao'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tabela } from '../../componentes/Tabela'
import { CabecalhoDeSecao, Tela } from '../../componentes/Tela'
import { formatarDiaEHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { emQueEstava, falaDoGrupo, QUANDO_O_TUTOR_AVISA, separarSinais, TEXTO_DA_ATENCAO_HUMANA, textoDoSinal, TITULO_DA_ATENCAO_HUMANA, trocasDeHoje } from './sinais'

/** De quanto em quanto os sinais são relidos, com a aba à vista: não há WebSocket nesta fatia. */
const INTERVALO_DOS_SINAIS_MS = 15_000

/**
 * Seu time › Tutor (`docs/interface.md` 11.4; D8, D34, D36, D47; regra 50, item 10; regra 70, itens 4 e 7): o que o Tutor
 * viu no uso da turma. **Sinal, não conversa de aluno**: onde a turma travou, quem pediu a resposta pronta, a dúvida que
 * se repetiu, e o uso do Tutor por aluno. **Nada nesta tela abre a conversa de um aluno**, e não há aqui tempo parado,
 * ordem por recência, comparação entre alunos nem lista de quem não usou.
 *
 * O sinal de **atenção humana** (D36) vem à parte, no alto, sem o conteúdo e sem referência: só que um aluno precisa de
 * um adulto, e o que fazer.
 *
 * O nome do aluno aparece porque quem lê é a professora da turma (D34): a API só o entrega a ela.
 */
export default function Tutor() {
  useTituloDaTela('Tutor')
  const [, navegar] = useLocation()
  const time = useQuery(consultaTime)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const materiais = useQuery(consultaTitulosDosMateriais)
  const [escolhida, definirEscolhida] = useState<string | undefined>(undefined)
  const idDosSinais = useId()
  const idDoUso = useId()

  // Uma linha por turma: o Tutor é da turma, e não da disciplina.
  const turmas = new Map<string, string>()
  for (const vinculo of vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? []) if (vinculo.estado === 'confirmado') turmas.set(vinculo.turma.id, vinculo.turma.nome)
  const opcoes = [...turmas].map(([valor, rotulo]) => ({ valor, rotulo })).sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }))
  const turmaId = opcoes.some((opcao) => opcao.valor === escolhida) ? escolhida : opcoes[0]?.valor

  const sinais = useQuery({ ...consultaSinais(turmaId ?? ''), enabled: turmaId !== undefined, refetchInterval: INTERVALO_DOS_SINAIS_MS })
  const uso = useQuery({ ...consultaUsoDoTutor(turmaId ?? ''), enabled: turmaId !== undefined })
  const atividades = useQuery({ ...consultaAtividadesAplicadas(turmaId ?? ''), enabled: turmaId !== undefined })
  const referencias = { atividades: Object.fromEntries((atividades.data?.itens ?? []).map((atividade) => [atividade.id, atividade.titulo])), materiais: materiais.data ?? {} }
  const tutor = agenteDoTime(time.data, 'tutor')
  const { atencao, trabalho } = separarSinais(sinais.data?.itens ?? [])
  const grupos = sinais.data?.grupos ?? []

  return (
    <Tela titulo="Seu time: Tutor" largura="conversa">
      <header className="flex min-w-0 flex-col gap-2">
        <AssinaturaIA agente="tutor" tamanho={32} />
        <details className="group min-w-0 rounded-cartao border border-linha bg-superficie">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 px-4 text-sm font-medium text-tinta hover:bg-realce-suave">
            <ChevronRight aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 group-open:rotate-90" />
            O que o Tutor faz sozinho, e o que você vê aqui
          </summary>
          <div className="flex min-w-0 flex-col gap-3 border-t border-linha p-4">
            {time.isPending && <p className="text-apoio">Carregando as funções…</p>}
            {time.isError && (
              <div className="flex min-w-0 flex-wrap items-center gap-3 text-erro">
                <p role="alert" className="min-w-0 break-words">
                  {mensagemDoErro(time.error)}
                </p>
                <Botao variante="secundario" onClick={() => void time.refetch({ cancelRefetch: false })}>
                  Tentar de novo
                </Botao>
              </div>
            )}
            {tutor?.funcoes.map((funcao) => (
              <div key={funcao.chave} data-funcao={funcao.chave} className="flex min-w-0 flex-col gap-1">
                <p className="flex min-w-0 flex-wrap items-center gap-2 font-medium text-tinta">
                  {funcao.nome}
                  {funcao.suspensa && <Estado familia="info">Suspensa pela coordenação</Estado>}
                </p>
                <p className="min-w-0 text-sm break-words text-apoio">
                  <span className="font-medium">Faz sozinha: </span>
                  {funcao.fazSozinha}
                </p>
                <p className="min-w-0 text-sm break-words text-apoio">
                  <span className="font-medium">Com você: </span>
                  {funcao.esperaAprovacao}
                </p>
              </div>
            ))}
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-medium text-tinta">Quando o Tutor avisa você</p>
              <ul className="flex min-w-0 list-disc flex-col gap-1 pl-5 text-sm text-apoio">
                {QUANDO_O_TUTOR_AVISA.map((quando) => (
                  <li key={quando} className="break-words">
                    {quando}
                  </li>
                ))}
              </ul>
            </div>
            <p className="min-w-0 text-sm break-words text-sutil">Você vê aqui os sinais e o uso da turma na sua disciplina. A conversa de um aluno com o Tutor não abre nesta tela.</p>
          </div>
        </details>
      </header>

      {vinculos.isPending && <EstadoCarregando rotulo="Carregando as suas turmas…" />}
      {vinculos.isError && <EstadoErro erro={vinculos.error} tentando={vinculos.isFetching} aoTentarDeNovo={() => void vinculos.refetch({ cancelRefetch: false })} />}
      {vinculos.data !== undefined && turmaId === undefined && (
        <EstadoVazio
          titulo="Falta uma turma confirmada"
          descricao="O Tutor mostra a você os sinais das suas turmas. Confirme as suas turmas em Turmas; se nenhuma aparece lá, quem aloca é a coordenação."
          acao={{ rotulo: 'Ir para Turmas', aoAcionar: () => navegar(ROTAS_DO_PROFESSOR.turmas) }}
        />
      )}

      {turmaId !== undefined && (
        <>
          {opcoes.length > 1 && <Selecao rotulo="Turma" opcoes={opcoes} valor={turmaId} aoMudar={definirEscolhida} />}

          {atencao.length > 0 && (
            <section data-atencao-humana="" aria-label={TITULO_DA_ATENCAO_HUMANA} className="flex min-w-0 flex-col gap-2 rounded-cartao border border-pendente bg-pendente-cx p-4">
              <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-pendente">
                <HeartHandshake aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
                {TITULO_DA_ATENCAO_HUMANA}
              </h2>
              <ul className="flex min-w-0 flex-col gap-1 text-tinta">
                {atencao.map((sinal) => (
                  <li key={sinal.id} className="break-words">
                    <span className="font-medium">{sinal.aluno.nome}</span> · {formatarDiaEHora(sinal.criadoEm)}
                  </li>
                ))}
              </ul>
              <p className="min-w-0 text-sm break-words text-tinta">{TEXTO_DA_ATENCAO_HUMANA}</p>
            </section>
          )}

          <section aria-labelledby={idDosSinais} className="flex min-w-0 flex-col gap-3">
            <CabecalhoDeSecao id={idDosSinais} titulo="Sinais da turma" apoio="O que o Tutor viu no trabalho dos alunos: onde travaram, quem pediu a resposta pronta, a dúvida que se repetiu." />
            {sinais.isPending && <EstadoCarregando rotulo="Carregando os sinais…" />}
            {sinais.isError && sinais.data === undefined && <EstadoErro erro={sinais.error} tentando={sinais.isFetching} aoTentarDeNovo={() => void sinais.refetch({ cancelRefetch: false })} />}
            {/* Sem sinal nenhum a tela não fica vazia: diz o que o Tutor avisa e quando (regra 50, item 6). */}
            {sinais.data !== undefined && grupos.length === 0 && trabalho.length === 0 && (
              <EstadoVazio
                titulo="Nenhum sinal desta turma ainda"
                descricao="Quando um aluno travar numa questão, pedir a resposta pronta ou repetir a mesma dúvida, o Tutor avisa aqui, com a questão ou a página. Ele conduz por perguntas e não entrega a resposta."
              />
            )}
            {grupos.length > 0 && (
              <Conversa rotulo="O que o Tutor viu na turma">
                {grupos.map((grupo, indice) => (
                  // O grupo é a soma da turma, sem nome de ninguém: é o que a professora leva para a aula seguinte.
                  <MensagemIA key={`${grupo.tipo}-${grupo.atividadeAplicadaId ?? ''}-${String(grupo.questao ?? '')}-${String(indice)}`} variante="balao" funcao="sinais_para_o_professor">
                    {falaDoGrupo(grupo, referencias)}
                  </MensagemIA>
                ))}
              </Conversa>
            )}
            {trabalho.length > 0 && (
              <Tabela
                rotulo="Sinais por aluno"
                colunas={[
                  { chave: 'aluno', titulo: 'Aluno', celula: (sinal) => sinal.aluno.nome },
                  { chave: 'sinal', titulo: 'O que aconteceu', celula: (sinal) => textoDoSinal(sinal, referencias) },
                  { chave: 'quando', titulo: 'Quando', celula: (sinal) => formatarDiaEHora(sinal.criadoEm) },
                ]}
                linhas={trabalho}
                chaveDaLinha={(sinal) => sinal.id}
              />
            )}
            {sinais.data?.proxima !== undefined && <p className="text-sm text-sutil">Estes são os sinais mais recentes da turma.</p>}
          </section>

          <section aria-labelledby={idDoUso} className="flex min-w-0 flex-col gap-3">
            <CabecalhoDeSecao id={idDoUso} titulo="Uso do Tutor pela turma" apoio="Quem já conversou com o Tutor neste ano, em ordem de nome. Não há uso do Tutor que você não veja." />
            {uso.isPending && <EstadoCarregando rotulo="Carregando o uso do Tutor…" />}
            {uso.isError && uso.data === undefined && <EstadoErro erro={uso.error} tentando={uso.isFetching} aoTentarDeNovo={() => void uso.refetch({ cancelRefetch: false })} />}
            {uso.data !== undefined && (
              <>
                {uso.data.pacoteDaTurmaNoMes > 0 && (
                  <div className="rounded-cartao border border-linha bg-superficie p-4">
                    <BarraRotulada
                      rotulo="Trocas da turma neste mês"
                      valor={uso.data.trocasDaTurmaNoMes}
                      maximo={uso.data.pacoteDaTurmaNoMes}
                      texto={`${String(uso.data.trocasDaTurmaNoMes)} de ${String(uso.data.pacoteDaTurmaNoMes)}`}
                      detalhe={`Cada aluno pode fazer até ${String(uso.data.limiteDoDia)} trocas por dia.`}
                    />
                  </div>
                )}
                {uso.data.alunos.length === 0 ? (
                  <EstadoVazio titulo="Nenhum aluno desta turma usou o Tutor ainda" descricao="Quando um aluno conversar com o Tutor, ele aparece aqui com as trocas de hoje e em que estava. O conteúdo da conversa não aparece." />
                ) : (
                  <Tabela
                    rotulo="Uso do Tutor por aluno"
                    colunas={[
                      { chave: 'aluno', titulo: 'Aluno', celula: (aluno) => aluno.aluno.nome },
                      { chave: 'hoje', titulo: 'Trocas hoje', celula: (aluno) => trocasDeHoje(aluno, uso.data.limiteDoDia) },
                      // A hora, como hora ("05/10, 10h42"): nunca "há X minutos", que viraria relógio de tempo parado.
                      { chave: 'ultima', titulo: 'Última troca', celula: (aluno) => formatarDiaEHora(aluno.ultimaTrocaEm) },
                      { chave: 'onde', titulo: 'Em que estava', celula: (aluno) => emQueEstava(aluno, referencias) },
                    ]}
                    linhas={uso.data.alunos}
                    chaveDaLinha={(aluno) => aluno.aluno.id}
                  />
                )}
              </>
            )}
          </section>
        </>
      )}
    </Tela>
  )
}
