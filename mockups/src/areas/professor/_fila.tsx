import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, EyeOff, Route, X } from 'lucide-react'
import {
  Avatar, Botao, Cartao, CampoTexto, DialogoConfirmar, FaixaResultado, LadrilhoIcone, MenuMais, Opcao, Selo, SeloTurma, materiaDe,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { AssinaturaIA, ChipPagina } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { pedidos as acoesPedidos, pedidosEsperando, useTodosOsPedidos, type PedidoNome } from '@/dados/acesso'
import { revisoes, useRevisao } from '@/dados/avaliacoes'
import { agora, criarFatia, useEventos } from '@/dados/demo/nucleo'
import { TURMAS } from '@/dados/escola'
import { avisos } from '@/dados/avisos'
import { alocacoes, turmaDaEscolaPorId, useAlocacoes } from '@/dados/escola-estado'
import {
  AVISO_DO_COMPLEMENTO, MAXIMO_DE_PEDIDOS_POR_DECISAO, NOME_DA_CONTESTACAO, TEXTO_DA_MATRICULA_ERRADA, type Contestacao,
} from '@/dados/estrutura'
import { fila, useItemFila, useResolucao, type ItemFila } from '@/dados/fila'
import { ia } from '@/dados/ia'
import { MENSAGENS_TUTOR, REPLICA_CONTESTACAO } from '@/dados/mensagens-time'
import { bancoDaTarefa } from '@/dados/questoes'
import { useProfessorAtual } from '@/dados/sessao'
import { turmaDaProfessora } from '@/dados/turmas-professora'
import { cn } from '@/lib/utils'
import { ConversaAberta, DialogoAuditoria } from './_pecas'

/* O PAINEL DE UM ITEM DA FILA — 12ª rodada (04/10/2026; plano de polimento 5.2, auditoria 2.3).

   A linha de "Esperando você" que não tem página própria abre aqui, ao lado (?item=<id>), sem sair do Início.
   Cinco painéis: atenção, sinal do Tutor, pedidos para entrar (o cartão agrupado ou o de uma turma), turma para
   confirmar e revisão pedida pelo aluno. Notas e versão adaptada têm página própria (o cartão navega).
   Em cada painel: quem assina no topo, no máximo 2 frases, UM botão cheio no rodapé e o raro no ⋯; depois de
   decidir, a FaixaResultado. Toda decisão é uma AÇÃO DE DOMÍNIO (pedidos.decidir, alocacoes.confirmar,
   revisoes.responder, avisos.vistoPeloProfessor, ia.marcarSinal): o item sai da fila em todo lugar, nas duas abas.
   O export `PainelDaFila({ itemId, aoFechar })` não muda: a aba Hoje da turma usa o mesmo. */

export function PainelDaFila({ itemId, aoFechar, contestar = false }: {
  itemId: string | null; aoFechar: () => void
  /** "Não é minha" da faixa de Turmas: o painel da turma já abre no formulário de contestação */
  contestar?: boolean
}) {
  useRevisaoEnviadaFechaOSinal()
  const item = useItemFila(itemId)
  if (!item || item.papel !== 'professor' || item.para) return null
  const props = { item, aoFechar }
  // `key` zera o estado de dentro quando troca o item
  if (item.tipo === 'atencao') return <PainelAtencao key={item.id} {...props} />
  if (item.tipo === 'sinal') return <PainelSinal key={item.id} {...props} />
  if (item.tipo === 'pedidos') return <PainelPedidos key={item.id} {...props} />
  if (item.tipo === 'turma') return <PainelTurma key={item.id} {...props} contestar={contestar} />
  if (item.tipo === 'revisao') return <PainelRevisao key={item.id} {...props} />
  return null
}

type Props = { item: ItemFila; aoFechar: () => void }

/* ── Peças pequenas ─────────────────────────────────────────────────────────────────────────────────────── */

/** O que aconteceu, depois de decidir: a faixa de resultado, no miolo. */
function Feito({ titulo, children, tipo = 'certo' }: { titulo: string; children?: ReactNode; tipo?: 'certo' | 'info' }) {
  return <FaixaResultado tipo={tipo} titulo={titulo} className="mt-5 rounded-[16px] border-2">{children}</FaixaResultado>
}

/** O título do painel: o título curto do item e o selo da turma (na cor da matéria). */
function Titulo({ item }: { item: ItemFila }) {
  const prof = useProfessorAtual()
  const aloc = useAlocacoes().find((a) => a.turmaId === item.turmaId && (a.professorId === prof.profId || a.professorId === prof.id))
  // a cor do selo: a matéria do item; sem ela, a do professor nesta turma (o Marcos dá Física no 3ºA), como no cartão
  const materia = item.materia ?? aloc?.disciplina ?? (item.turmaId ? TURMAS.find((t) => t.id === item.turmaId)?.disciplina : undefined)
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="truncate">{item.curto ?? item.titulo}</span>
      {item.turma && <SeloTurma turma={item.turma} materia={materia} />}
    </span>
  )
}

function Assina({ item }: { item: ItemFila }) {
  if (!item.de) return null
  return <AssinaturaIA id={item.de} tamanho={32} quando={item.quando || undefined} className="mb-4" />
}

/** O ⋯ do rodapé, encostado à esquerda. */
function Mais({ itens }: { itens: { rotulo: string; aoEscolher: () => void }[] }) {
  if (!itens.length) return null
  return <span className="mr-auto"><MenuMais itens={itens} lado="top" alinhar="start" /></span>
}

const corpo = 't-corpo text-apoio'
const rotuloCampo = 'mb-2 block text-[15px] font-bold leading-5 text-tinta'
const primeiroNome = (n?: string) => (n ?? '').split(' ')[0]

/* ── (a) Atenção ────────────────────────────────────────────────────────────────────────────────────────── */

function PainelAtencao({ item, aoFechar }: Props) {
  const resolucao = useResolucao(item.id)
  const marcarVisto = () => (item.ref ? avisos.vistoPeloProfessor(item.ref) : fila.resolver(item.id, 'vista'))
  // D36: o professor recebe o sinal, nunca o texto. Não há "Abrir a conversa" aqui: o trecho é só de quem recebe
  // o risco à vida, na coordenação (linha do tempo: "recebeu um sinal, sem o texto").
  return (
    <PainelLado aberto aoFechar={aoFechar} titulo={<Titulo item={item} />} descricao={item.titulo}
      rodape={resolucao ? undefined : <Botao variante="oficial" tamanho="m" onClick={marcarVisto}>Marcar como visto</Botao>}>
      <Assina item={item} />
      <p className={corpo}><b className="font-bold text-tinta">Assunto pessoal.</b> O Tutor respondeu com a mensagem combinada e o 188.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Selo icone={<EyeOff strokeWidth={2.5} />} title="O sinal vem do que foi escrito, nunca de inferência de humor">Você não vê o texto</Selo>
        <Selo familia="roxo" icone={<Check strokeWidth={3} />}>A orientação já recebeu</Selo>
      </div>
      {resolucao === 'vista' && <Feito titulo="Visto">Fica só o registro de que você viu. A orientação cuida do resto.</Feito>}
    </PainelLado>
  )
}

/* ── (b) Sinal do Tutor ─────────────────────────────────────────────────────────────────────────────────── */

const MSG_SINAL = MENSAGENS_TUTOR.find((m) => m.id === 'travou')!
const QUEM_TRAVOU = MSG_SINAL.anexo?.tipo === 'alunos' ? MSG_SINAL.anexo.nomes : []
const PEDIDO_DA_REVISAO = 'Revisão: converter massa em mol (p. 145)'

/** O que o professor fez com o sinal e o painel precisa lembrar (em todas as abas): a revisão em preparo (desde que
    momento, para qual turma) e o texto da contestação, que o Tutor usa para rever o critério. */
const sinaisDoProfessor = criarFatia<Record<string, { preparo?: number; turmaId?: string; motivo?: string }>>('sinais-professor', {})

/** O sinal só sai da fila quando a revisão chega à turma (aprovada e enviada), não no clique de GERAR REVISÃO. */
function useRevisaoEnviadaFechaOSinal() {
  const s = sinaisDoProfessor.useValor()
  const eventos = useEventos()
  useEffect(() => {
    for (const [id, x] of Object.entries(s)) {
      if (x.preparo === undefined || x.motivo) continue
      const enviada = eventos.some((e) => e.tipo === 'documento-enviado' && e.quando.ordem > x.preparo!
        && e.dados.turmaId === x.turmaId && e.dados.tipo !== 'prova')
      if (enviada) ia.marcarSinal(id, 'visto')
    }
  }, [s, eventos])
}

function PainelSinal({ item, aoFechar }: Props) {
  const navegar = useNavigate()
  const resolucao = useResolucao(item.id)
  const [verQuem, setVerQuem] = useState(false)
  const [contestando, setContestando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [escolhendo, setEscolhendo] = useState(false)
  const [aluno, setAluno] = useState<string | null>(null)
  const [aberta, setAberta] = useState<{ aluno: string; motivo: string } | null>(null)
  const guardado = sinaisDoProfessor.useValor()[item.id]
  const turmaId = item.turmaId ?? '2b'
  const turma = item.turma ?? '2ºB'

  const gerarRevisao = () => {
    sinaisDoProfessor.mudar((x) => ({ ...x, [item.id]: { ...x[item.id], preparo: agora().ordem, turmaId } }))
    navegar(`/professor/conversa/nova?ferramenta=atividade&turma=${turmaId}&pedido=${encodeURIComponent(PEDIDO_DA_REVISAO)}`)
  }

  const rodape = contestando ? (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => setContestando(false)}>Voltar</Botao>
      <Botao variante="oficial" tamanho="m" disabled={motivo.trim().length < 5}
        onClick={() => {
          sinaisDoProfessor.mudar((x) => ({ ...x, [item.id]: { ...x[item.id], motivo: motivo.trim() } }))
          ia.marcarSinal(item.id, 'contestado'); setContestando(false)
        }}>Enviar ao Tutor</Botao>
    </>
  ) : (
    <>
      <Mais itens={[
        ...(resolucao ? [] : [{ rotulo: 'Este sinal está errado', aoEscolher: () => setContestando(true) }]),
        { rotulo: 'Abrir a conversa de um aluno', aoEscolher: () => { setVerQuem(true); setEscolhendo(true) } },
      ]} />
      {!resolucao && <Botao variante="primario" tamanho="m" onClick={gerarRevisao}>Gerar revisão</Botao>}
    </>
  )

  return (
    <>
      <PainelLado aberto aoFechar={aoFechar} titulo={<Titulo item={item} />} descricao={item.titulo} rodape={rodape}>
        <Assina item={item} />
        <p className={corpo}><b className="font-bold text-tinta">{QUEM_TRAVOU.length} alunos travaram em converter massa em mol.</b> <ChipPagina pagina={MSG_SINAL.fonte ?? 145} /></p>
        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Selo familia="azul" icone={<Route strokeWidth={2.5} />}>Como cheguei a isto</Selo>
          <span className="t-apoio">Cada um errou o mesmo passo 2 vezes hoje.</span>
        </div>

        {contestando ? (
          <CampoTexto className="mt-5" rotulo="O que está errado neste sinal?" linhas={3} valor={motivo} aoMudar={setMotivo} autoFocus
            placeholder="Ex.: a atividade de hoje não cobrava esse passo." dica="Sobre o sinal, não sobre um aluno." />
        ) : !verQuem ? (
          <Botao variante="fantasma" tamanho="m" className="-ml-3.5 mt-3" onClick={() => setVerQuem(true)}>Ver quem ({QUEM_TRAVOU.length})</Botao>
        ) : (
          <div className="mt-5 animate-entra">
            <p className={rotuloCampo}>{escolhendo ? 'De qual aluno?' : `Só do ${turma}`}</p>
            <ul className="flex flex-wrap gap-2">
              {QUEM_TRAVOU.map((n) => (
                <li key={n}>
                  {escolhendo ? (
                    <Botao variante="secundario" tamanho="p" className="normal-case tracking-normal" onClick={() => { setAluno(n); setEscolhendo(false) }}>{n}</Botao>
                  ) : (
                    <Selo className="h-8 px-2.5 text-[14px] normal-case tracking-normal">{n}</Selo>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resolucao === 'contestada' && (
          <div className="mt-5 animate-entra">
            <Feito tipo="info" titulo="Sinal contestado">{guardado?.motivo ? <>Você escreveu: “{guardado.motivo}”</> : null}</Feito>
            <Cartao className="mt-3">
              <AssinaturaIA id="tutor" className="mb-2" />
              <p className="t-corpo text-apoio">{REPLICA_CONTESTACAO.tutor.texto}</p>
            </Cartao>
          </div>
        )}
        {!resolucao && guardado?.preparo !== undefined && <Feito tipo="info" titulo="Revisão em preparo">Sai daqui quando você aprovar e enviar ao {turma}.</Feito>}
        {resolucao === 'vista' && <Feito titulo="Revisão enviada">Chegou ao {turma} com a sua aprovação.</Feito>}
        {aberta && <div className="mt-5"><ConversaAberta aluno={aberta.aluno} motivo={aberta.motivo} /></div>}
      </PainelLado>
      <DialogoAuditoria aluno={aluno} aberto={aluno !== null} aoMudar={(v) => { if (!v) setAluno(null) }}
        aoConfirmar={(m) => { if (aluno) setAberta({ aluno, motivo: m }); setAluno(null) }} />
    </>
  )
}

/* ── (c) Pedidos para entrar ────────────────────────────────────────────────────────────────────────────── */

type Grupo = { turmaId: string; turma: string; materia?: string; ids: string[] }

function PainelPedidos({ item, aoFechar }: Props) {
  const todos = useTodosOsPedidos()
  // os pedidos que esperavam ao abrir: depois de decidir, continuam na tela com o selo
  const [grupos] = useState<Grupo[]>(() => (item.subitens ?? [item]).filter((s) => s.turmaId).map((s) => ({
    turmaId: s.turmaId!, turma: s.turma ?? turmaDaProfessora(s.turmaId!)?.nome ?? '', materia: s.materia,
    ids: pedidosEsperando(s.turmaId).map((p) => p.id),
  })))
  const [marcados, setMarcados] = useState<string[]>([])
  const [confirmando, setConfirmando] = useState<'aprovar' | 'recusar' | null>(null)
  const [ultimo, setUltimo] = useState<{ aprovados: number; recusados: number }>({ aprovados: 0, recusados: 0 })

  const porId = new Map(todos.map((p) => [p.id, p]))
  const daTela = grupos.flatMap((g) => g.ids).map((id) => porId.get(id)).filter((p): p is PedidoNome => !!p)
  const abertos = daTela.filter((p) => p.estado === 'esperando')
  const nMarc = marcados.length
  const escolhidos = daTela.filter((p) => marcados.includes(p.id))
  const turmasMarcadas = [...new Set(escolhidos.map((p) => p.turmaId))]
  const umaTurma = turmasMarcadas.length === 1 ? grupos.find((g) => g.turmaId === turmasMarcadas[0])?.turma : undefined
  const plural = (k: number) => (k === 1 ? '1 pedido' : `${k} pedidos`)

  // até 40 por vez, e nunca "aprovar todos": cada nome é marcado à mão
  const marcar = (id: string, v: boolean) =>
    setMarcados((m) => (v ? (m.length >= MAXIMO_DE_PEDIDOS_POR_DECISAO ? m : [...m, id]) : m.filter((x) => x !== id)))

  const decidir = (como: 'aprovar' | 'recusar') => {
    for (const t of turmasMarcadas) acoesPedidos.decidir(t, escolhidos.filter((p) => p.turmaId === t).map((p) => p.id), como)
    setUltimo((u) => (como === 'aprovar' ? { ...u, aprovados: u.aprovados + nMarc } : { ...u, recusados: u.recusados + nMarc }))
    setMarcados([])
  }

  const efeito = confirmando === 'aprovar'
    ? (nMarc === 1 ? `${primeiroNome(escolhidos[0]?.nome)} passa a entrar com a matrícula e a senha que criou.` : 'Eles passam a entrar com a matrícula e a senha que criaram.')
    : (nMarc === 1 ? 'O nome volta a ficar livre na lista da turma.' : 'Os nomes voltam a ficar livres na lista da turma.')
  const resultado = [
    ultimo.aprovados && `${ultimo.aprovados} ${ultimo.aprovados === 1 ? 'aprovado' : 'aprovados'}`,
    ultimo.recusados && `${ultimo.recusados} ${ultimo.recusados === 1 ? 'recusado' : 'recusados'}`,
  ].filter(Boolean).join(', ')

  return (
    <>
      <PainelLado aberto aoFechar={aoFechar} titulo={<Titulo item={item} />} descricao={item.titulo}
        rodape={abertos.length === 0 ? undefined : (
          <>
            <Botao variante="perigo" tamanho="m" disabled={nMarc === 0} onClick={() => setConfirmando('recusar')}><span>Recusar<span className="hidden sm:inline"> marcados</span></span></Botao>
            <Botao variante="oficial" tamanho="m" disabled={nMarc === 0} onClick={() => setConfirmando('aprovar')}><span>Aprovar<span className="hidden sm:inline"> marcados</span>{nMarc ? ` (${nMarc})` : ''}</span></Botao>
          </>
        )}>
        {resultado && <Feito titulo={resultado} />}
        <div className={cn('grid gap-6', resultado && 'mt-5')}>
          {grupos.map((g) => (
            <section key={g.turmaId} aria-label={`Pedidos do ${g.turma}`}>
              {grupos.length > 1 && <SeloTurma turma={g.turma} materia={g.materia} className="mb-2.5" />}
              <ul className="grid gap-2.5">
                {g.ids.map((id) => porId.get(id)).filter((p): p is PedidoNome => !!p).map((p) => (
                  <li key={p.id}>
                    {p.estado !== 'esperando' ? (
                      <div className="flex min-h-14 items-center gap-3 rounded-[12px] border-2 border-borda px-4 py-2">
                        <span className="t-cartao min-w-0 flex-1 truncate text-sutil">{p.nome}</span>
                        {p.estado === 'aprovado'
                          ? <Selo familia="verde" icone={<Check strokeWidth={3} />}>Aprovado</Selo>
                          : <Selo icone={<X strokeWidth={3} />}>Recusado</Selo>}
                      </div>
                    ) : (
                      <Opcao tipo="checkbox" nome="pedidos" valor={p.id} marcado={marcados.includes(p.id)} aoMudar={(v) => marcar(p.id, v)}>
                        <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="truncate">{p.nome}</span>
                          {p.matriculaErrada && <Selo familia="amarelo" title={TEXTO_DA_MATRICULA_ERRADA}>Matrícula diferente</Selo>}
                        </span>
                      </Opcao>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PainelLado>

      <DialogoConfirmar aberto={confirmando !== null} aoMudar={(v) => { if (!v) setConfirmando(null) }}
        titulo={`${confirmando === 'recusar' ? 'Recusar' : 'Aprovar'} ${plural(nMarc)}${umaTurma ? ` do ${umaTurma}` : ''}?`}
        frase={efeito}
        confirmar={{
          rotulo: `${confirmando === 'recusar' ? 'Recusar' : 'Aprovar'} ${plural(nMarc)}`,
          // o vermelho cheio só aqui, na confirmação
          variante: confirmando === 'recusar' ? 'perigoCheio' : 'oficial',
          aoConfirmar: () => { if (confirmando) decidir(confirmando) },
        }}>
        <ul className="flex flex-wrap gap-2">
          {escolhidos.map((p) => <li key={p.id}><Selo className="h-8 px-2.5 text-[14px] normal-case tracking-normal">{p.nome}</Selo></li>)}
        </ul>
      </DialogoConfirmar>
    </>
  )
}

/* ── (d) Turma para confirmar ───────────────────────────────────────────────────────────────────────────── */

function PainelTurma({ item, aoFechar, contestar: jaContestando = false }: Props & { contestar?: boolean }) {
  const navegar = useNavigate()
  const resolucao = useResolucao(item.id)
  const aloc = useAlocacoes().find((a) => a.id === item.ref)
  const turmaId = item.turmaId ?? aloc?.turmaId ?? 'au-3a'
  const nome = aloc?.turma ?? item.turma ?? ''
  const disciplina = aloc?.disciplina ?? item.materia ?? 'Química'
  const serie = turmaDaEscolaPorId(turmaId)?.serie ?? turmaDaProfessora(turmaId)?.serie ?? ''
  const materia = materiaDe(disciplina)
  const [contestando, setContestando] = useState(jaContestando)
  const [motivo, setMotivo] = useState<Contestacao | null>(null)
  const [complemento, setComplemento] = useState('')

  const confirmar = () => (item.ref ? alocacoes.confirmar(item.ref) : fila.resolver(item.id, 'confirmada'))
  // nada vem marcado: a professora escolhe o motivo antes de enviar
  const contestar = () => { if (!motivo) return; if (item.ref) alocacoes.contestar(item.ref, motivo, complemento); else fila.resolver(item.id, 'contestada') }

  const rodape = resolucao === 'confirmada' ? (
    <Botao variante="primario" tamanho="m" onClick={() => navegar(`/professor/turmas/${turmaId}?aba=alunos&convidar=1`)}>Gerar o acesso agora</Botao>
  ) : resolucao ? undefined : contestando ? (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => setContestando(false)}>Voltar</Botao>
      <Botao variante="oficial" tamanho="m" disabled={!motivo} onClick={contestar}>Enviar à coordenação</Botao>
    </>
  ) : (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => setContestando(true)}>Não é minha</Botao>
      <Botao variante="oficial" tamanho="m" onClick={confirmar}>Confirmar</Botao>
    </>
  )

  return (
    <PainelLado aberto aoFechar={aoFechar} titulo={<Titulo item={item} />} descricao={item.titulo} rodape={rodape}>
      <Cartao className="flex items-center gap-3 p-3 md:p-3">
        {materia && <LadrilhoIcone familia={materia.familia} tamanho={44} icone={<Icone id={materia.icone} tamanho={32} familia={materia.familia} />} />}
        <span className="min-w-0 flex-1">
          <span className="t-cartao block truncate text-tinta">{nome} · {disciplina}</span>
          {serie && <span className="t-apoio block truncate">{serie}</span>}
        </span>
      </Cartao>
      {!resolucao && !contestando && <p className={cn(corpo, 'mt-4')}>A coordenação pôs você nesta turma.</p>}

      {contestando && !resolucao && (
        <div className="mt-5 grid animate-entra gap-5">
          <fieldset>
            <legend className={rotuloCampo}>O que está errado?</legend>
            <div className="grid gap-2">
              {(Object.keys(NOME_DA_CONTESTACAO) as Contestacao[]).map((c) => (
                <Opcao key={c} tipo="radio" nome="contestacao" valor={c} marcado={motivo === c} aoMudar={(v) => { if (v) setMotivo(c) }}>
                  {NOME_DA_CONTESTACAO[c]}
                </Opcao>
              ))}
            </div>
          </fieldset>
          <CampoTexto rotulo="Quer explicar? (opcional)" linhas={2} valor={complemento} aoMudar={setComplemento}
            placeholder="Ex.: dou Química no 3ºB." dica={AVISO_DO_COMPLEMENTO.replace(' aqui', '')} />
        </div>
      )}

      {resolucao === 'confirmada' && <Feito titulo={`Turma ${nome} confirmada`}>Agora gere o código para os alunos.</Feito>}
      {resolucao === 'contestada' && (
        <Feito tipo="info" titulo="Contestação enviada">
          {NOME_DA_CONTESTACAO[aloc?.contestacao?.motivo ?? motivo ?? 'turma_errada']}. A coordenação corrige.
          {(aloc?.contestacao?.complemento ?? complemento).trim() && <> Você escreveu: “{(aloc?.contestacao?.complemento ?? complemento).trim()}”</>}
        </Feito>
      )}
    </PainelLado>
  )
}

/* ── (e) Revisão pedida pelo aluno ("Isso está errado?", da nota ou da memória) ──────────────────────────── */

/** O painel da revisão pedida pelo aluno. A coordenação usa o mesmo (memória de matéria sem professor na turma). */
export function PainelRevisao({ item, aoFechar, quem }: Props & { quem?: { nome: string; papel: 'coordenacao' } }) {
  const r = useRevisao(item.ref)
  const [decisao, setDecisao] = useState<'manter' | 'mudar' | null>(null)
  const [texto, setTexto] = useState('')
  if (!r) return null
  const primeiro = primeiroNome(r.alunoNome)
  const memoria = r.tipo === 'memoria'
  const resposta = r.resposta
  const enunciado = !memoria && r.tarefaId && r.questao !== undefined ? bancoDaTarefa(r.tarefaId, 'prova').questoes[r.questao]?.enunciado : undefined
  const enviar = () => { if (decisao && texto.trim()) revisoes.responder(r.id, decisao, texto, quem) }

  const rodape = resposta ? undefined : decisao ? (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => { setDecisao(null); setTexto('') }}>Voltar</Botao>
      <Botao variante="oficial" tamanho="m" disabled={texto.trim().length < 3} onClick={enviar}>Enviar</Botao>
    </>
  ) : memoria ? (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => setDecisao('manter')}>Manter</Botao>
      <Botao variante="oficial" tamanho="m" onClick={() => revisoes.responder(r.id, 'apagar', 'Apaguei da memória do Tutor.', quem)}>Apagar da memória</Botao>
    </>
  ) : (
    <>
      <Botao variante="secundario" tamanho="m" onClick={() => setDecisao('manter')}>Manter a nota</Botao>
      <Botao variante="oficial" tamanho="m" onClick={() => setDecisao('mudar')}>Mudar a nota</Botao>
    </>
  )

  const feito = resposta && ({
    manter: memoria ? 'Memória mantida' : 'Nota mantida',
    mudar: 'Nota mudada',
    apagar: 'Apagado da memória',
  } as const)[resposta.decisao]

  return (
    <PainelLado aberto aoFechar={aoFechar} titulo={<Titulo item={item} />} descricao={item.titulo} rodape={rodape}>
      <div className="mb-4 flex min-w-0 items-center gap-2.5">
        <Avatar nome={r.alunoNome} tamanho={32} />
        <span className="truncate text-[15px] font-bold leading-5 text-tinta">{r.alunoNome}</span>
        {item.quando && <span className="t-apoio shrink-0">{item.quando}</span>}
      </div>

      {memoria ? (
        <Cartao className="py-3 md:py-3">
          <p className="t-apoio">O Tutor guardou</p>
          <p className="t-corpo mt-0.5 text-tinta">“{r.itemTexto}”</p>
        </Cartao>
      ) : (
        <>
          <p className="t-cartao text-tinta">{r.tarefaTitulo ? `${r.tarefaTitulo} · questão` : 'Questão'} {(r.questao ?? 0) + 1}</p>
          {enunciado && <p className="t-apoio mt-1 truncate" title={enunciado}>{enunciado}</p>}
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Selo familia="amarelo">{r.motivo}</Selo>
        {!memoria && <span className="t-apoio">Marcou {r.marcou?.toUpperCase() || '—'} · certa {r.certa?.toUpperCase() ?? '—'}</span>}
      </div>
      {r.texto && <Cartao className="mt-3 py-3 md:py-3"><p className="t-corpo text-apoio">“{r.texto}”</p></Cartao>}

      {decisao && !resposta && (
        <CampoTexto className="mt-5 animate-entra" rotulo={`O que o ${primeiro} vai ler`} linhas={3} valor={texto} aoMudar={setTexto} autoFocus
          placeholder={memoria
            ? 'Ex.: Isso continua valendo para as próximas conversas.'
            : decisao === 'manter'
              ? `Ex.: A resposta certa é ${r.certa?.toUpperCase() ?? 'a outra'}, porque…`
              : 'Ex.: Você tem razão, a questão aceitava as duas.'} />
      )}
      {resposta && feito && <Feito titulo={feito}>{primeiro} lê: “{resposta.motivo}”</Feito>}
    </PainelLado>
  )
}
