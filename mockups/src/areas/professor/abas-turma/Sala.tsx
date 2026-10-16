import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Pencil } from 'lucide-react'
import { Avatar, BarraProgresso, Botao, EstadoVazio, MenuMais, Ponto, Selo, type EstadoPonto } from '@/components/duo'
import { ChipFonte } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { alunosDa, dificuldades, type Aluno } from '@/dados/alunos'
import { useAdaptacoes } from '@/dados/escola-estado'
import { useAlunosDaTurma, type AlunoDaTurma } from '@/dados/acesso'
import { comVirgula } from '@/dados/turma-atividades'
import { turmaDaProfessora } from '@/dados/turmas-professora'
import { cn } from '@/lib/utils'
import { ConversaAberta, DialogoAuditoria } from '../_pecas'
import { useBoletim } from './Notas'

/* AS CARTEIRAS DA AULA E A FICHA DO ALUNO (12ª rodada, 04/10/2026; plano de polimento 5.2).

   · As carteiras moram SÓ em Começar aula (saíram de Alunos). A sala deixou o palco preto: são cartões claros de borda
     2 e canto 12, 8 por fileira (4 no celular), com o `Avatar` e um FATO do sistema, sempre com glifo e cor: com o
     Tutor (azul) · travou (amarelo) · pediu a resposta pronta (amarelo) · entregou (verde) · na atividade (neutro) ·
     não entrou (tracejado). Nada de humor, atenção ou "parado há X min" (D69). Saiu a lente Chamada (decisão do dono).
   · A FICHA abre ao lado (?aluno=), pela lista, pela aula e pela fila: uma frase de fato, onde menos acerta (barra e
     página), GERAR REVISÃO (que renomeia "Pedir reforço": abre a conversa nova com Atividade, a turma e o assunto, sem
     o nome do aluno) e, no ⋯, Abrir a conversa (motivo e registro, regra 50 item 10). Na aula, a ficha vem sem conversa.
   Tudo é TRABALHO do aluno; com nome, só para o professor da turma (D34, D57). */

/* ── A situação de um nome da lista (Lista e ficha) ───────────────────────────────────────────────────────── */

export type SituacaoAluno = { rotulo: string; ponto: EstadoPonto; tracejado?: boolean }

/** Uma palavra, sempre fato do trabalho (D57). Falta não entra: chamada e faltas saíram do produto. */
export function situacaoDoNome(n: AlunoDaTurma, media: number | null): SituacaoAluno {
  if (n.situacao === 'livre') return { rotulo: 'Ainda não entrou', ponto: 'vazio', tracejado: true }
  if (n.situacao === 'pediu') return { rotulo: 'Pediu para entrar', ponto: 'esperando' }
  const a = n.aluno
  if (!a) return { rotulo: 'Em dia', ponto: 'feito' }
  const faltando = a.entregas.total - a.entregas.feitas
  if (faltando >= 2) return { rotulo: 'Atenção: entregas', ponto: 'esperando' }
  const fracas = media === null ? 0 : dificuldades(a).length
  if ((fracas >= 3 && media !== null && media < 6) || (media !== null && media < 5)) return { rotulo: 'Atenção: assunto', ponto: 'esperando' }
  return { rotulo: 'Em dia', ponto: 'feito' }
}

export function PontoSituacao({ s }: { s: SituacaoAluno }) {
  return <Ponto estado={s.ponto} className={cn(s.tracejado && 'border-dashed border-apagado')} />
}

/* ── A ficha ──────────────────────────────────────────────────────────────────────────────────────────── */

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function fraseDa(n: AlunoDaTurma, media: number | null) {
  const primeiro = n.nome.split(' ')[0]
  if (n.situacao === 'livre') return `${primeiro} ainda não entrou na turma.`
  if (n.situacao === 'pediu') return `${primeiro} pediu para entrar. Falta você conferir.`
  const a = n.aluno
  if (!a) return `${primeiro} entrou na turma. Ainda não há trabalho entregue.`
  const faltando = a.entregas.total - a.entregas.feitas
  const entregas = faltando > 0 ? plural(faltando, 'entrega faltando', 'entregas faltando') : 'todas as entregas feitas'
  return `${primeiro}: ${entregas}. ${media === null ? 'Ainda sem nota aprovada.' : `Média ${comVirgula(media)}.`}`
}

export function FichaDoAluno({ turmaId, alunoId, aoFechar, semConversa = false }: {
  turmaId: string
  alunoId: string | null
  aoFechar: () => void
  /** na aula ao vivo: sem o ⋯ de abrir a conversa */
  semConversa?: boolean
}) {
  const lista = useAlunosDaTurma(turmaId)
  const { mediaDe } = useBoletim(turmaId)
  const adaptacoes = useAdaptacoes(turmaId)
  const n = lista.find((x) => x.id === alunoId) ?? null
  const [pedindo, setPedindo] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)
  const [doAluno, setDoAluno] = useState(alunoId)
  if (doAluno !== alunoId) { setDoAluno(alunoId); setAberta(null) }

  const t = turmaDaProfessora(turmaId)
  const a = n?.aluno
  const media = n ? mediaDe(n.nome) : null
  const piores = a && n?.situacao === 'na-turma' ? dificuldades(a, 60).slice(0, 2) : []
  const assunto = piores[0]
  const pedido = assunto ? `Revisão para 1 aluno: ${assunto.curto} (p. ${assunto.pagina})` : `Revisão para 1 aluno de ${t?.disciplina ?? 'Química'}`
  const s = n ? situacaoDoNome(n, media) : null
  const adaptacao = n ? adaptacoes.find((x) => x.aluno === n.nome) : undefined
  const naTurma = n?.situacao === 'na-turma'

  return (
    <>
      <PainelLado aberto={n !== null} aoFechar={aoFechar} titulo={n?.nome ?? ''} descricao="A ficha do aluno: o trabalho dele."
        rodape={n && (
          n.situacao === 'pediu' ? (
            <Botao variante="oficial" asChild><Link to={`/professor/turmas/${turmaId}?aba=alunos&item=pedidos-${turmaId}`}>Ver o pedido</Link></Botao>
          ) : naTurma && a ? (
            <>
              {!semConversa && <span className="mr-auto"><MenuMais rotulo="Mais da ficha" alinhar="start" lado="top" itens={[{ rotulo: 'Abrir a conversa', aoEscolher: () => window.setTimeout(() => setPedindo(true), 0) }]} /></span>}
              <Botao asChild><Link to={`/professor/conversa/nova?ferramenta=atividade&turma=${turmaId}&pedido=${encodeURIComponent(pedido)}`}>Gerar revisão</Link></Botao>
            </>
          ) : null
        )}>
        {n && s && (
          <div className="grid gap-6">
            <div className="flex items-center gap-3">
              <Avatar nome={n.nome} tamanho={56} />
              <div className="grid min-w-0 gap-1.5">
                <span className="flex items-center gap-2 text-[15px] font-bold text-tinta"><PontoSituacao s={s} />{s.rotulo}</span>
                <span className="flex flex-wrap gap-1.5">
                  <Selo tamanho="p" className="normal-case">{t?.nome} · {t?.disciplina}</Selo>
                  {adaptacao && <Selo familia="roxo" tamanho="p" title={`Registrada pela coordenação: ${adaptacao.tipos.join(', ')}`}>Adaptação</Selo>}
                </span>
              </div>
            </div>

            <p className="t-corpo text-tinta">{fraseDa(n, media)}</p>

            {piores.length > 0 && (
              <section className="grid gap-3">
                <h3 className="t-selo text-sutil">Onde menos acerta</h3>
                {piores.map((h) => (
                  <div key={h.codigo} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[15px] font-bold text-tinta">{h.curto} <ChipFonte pagina={h.pagina} /></span>
                      <span className="shrink-0 text-[15px] font-bold tabular-nums text-tinta">{h.acerto}%</span>
                    </div>
                    <BarraProgresso valor={h.acerto} max={100} altura={12} familia={h.acerto < 50 ? 'amarelo' : 'azul'} rotulo={`Acerto em ${h.curto}`} />
                  </div>
                ))}
              </section>
            )}

            {aberta && a && <ConversaAberta aluno={n.nome} motivo={aberta} />}
          </div>
        )}
      </PainelLado>
      {!semConversa && <DialogoAuditoria aluno={n?.nome ?? null} aberto={pedindo} aoMudar={setPedindo} aoConfirmar={(m) => { setAberta(m); setPedindo(false) }} />}
    </>
  )
}

/* ── A aula ao vivo: o fato de cada carteira ────────────────────────────────────────────────────────────────── */

export type Fato = 'atividade' | 'tutor' | 'entregou' | 'travou' | 'pronta' | 'naoentrou'
/** só sobrou uma lente: Agora (a Chamada saiu) */
export type LenteAula = 'agora'

export const FATO: Record<Fato, { nome: string; curto: string; precisa: boolean }> = {
  travou: { nome: 'Travou', curto: 'travou', precisa: true },
  pronta: { nome: 'Pediu a resposta pronta', curto: 'pediu resposta', precisa: true },
  tutor: { nome: 'Com o Tutor', curto: 'com o Tutor', precisa: false },
  atividade: { nome: 'Na atividade', curto: 'na atividade', precisa: false },
  entregou: { nome: 'Entregou', curto: 'entregou', precisa: false },
  naoentrou: { nome: 'Não entrou', curto: 'não entrou', precisa: false },
}

const AO_VIVO_2B: Record<string, Fato> = {
  // os mesmos oito do sinal do Tutor (dados/fila, sinal-2b): o número não muda de uma tela para a outra
  'Ana Beatriz': 'travou', 'Bruno Tavares': 'travou', 'Davi Lucca': 'travou', 'Heitor Alves': 'travou', 'Isabela Pinto': 'travou',
  'Marina Costa': 'travou', 'Nicolas Dias': 'travou', 'Rafael Moura': 'travou',
  'Caio Mendes': 'pronta', 'Pedro Henrique': 'pronta',
  'Lucas Pereira': 'tutor', 'Yasmin Farias': 'tutor',
  'Daniela Rocha': 'entregou', 'Larissa Melo': 'entregou', 'Sofia Martins': 'entregou', 'Valentina Cruz': 'entregou',
  'Enzo Gabriel': 'naoentrou', 'Fernanda Paz': 'naoentrou', 'Giovana Teles': 'naoentrou', 'Henrique Sá': 'naoentrou', 'Júlia Andrade': 'naoentrou', 'Kauã Ribeiro': 'naoentrou',
}
const ORDEM_FATOS: Fato[] = ['atividade', 'atividade', 'tutor', 'atividade', 'entregou', 'atividade', 'tutor', 'naoentrou', 'travou']

/** O fato ao vivo de cada aluno da turma, em ordem de chamada. */
export function aoVivoDa(turmaId: string): { aluno: Aluno; fato: Fato }[] {
  const alunos = alunosDa(turmaId)
  if (turmaId === '2b') return alunos.map((a) => ({ aluno: a, fato: AO_VIVO_2B[a.nome] ?? 'atividade' }))
  return alunos.map((a, i) => ({ aluno: a, fato: ORDEM_FATOS[(i * 7 + a.nome.length) % ORDEM_FATOS.length] }))
}

/** O passo em que a turma travou agora, com a página: é a frase grande da aula. */
export const TRAVOU_EM: Record<string, { passo: string; pagina: number }> = {
  '2b': { passo: 'converter massa em mol', pagina: 145 }, '2a': { passo: 'somar a massa molar', pagina: 145 },
  '1c': { passo: 'distribuir os elétrons nas camadas', pagina: 52 }, '9a': { passo: 'balancear a equação', pagina: 54 },
}

/** O sinal do fato: um círculo de 20 px com glifo, nunca só cor. */
function PontoFato({ fato }: { fato: Fato }) {
  if (fato === 'entregou') return <Ponto estado="feito" />
  if (fato === 'travou' || fato === 'pronta') return <Ponto estado="esperando" />
  if (fato === 'naoentrou') return <Ponto estado="vazio" className="border-dashed border-apagado" />
  const tutor = fato === 'tutor'
  return (
    <span role="img" aria-label={FATO[fato].nome} title={FATO[fato].nome}
      className={cn('inline-grid size-5 shrink-0 place-items-center rounded-full [&_svg]:size-3', tutor ? 'bg-azul text-sobre-cor' : 'bg-fundo-suave text-apoio ring-2 ring-inset ring-borda')}>
      {tutor ? <MessageCircle strokeWidth={3} /> : <Pencil strokeWidth={3} />}
    </span>
  )
}

const PLURAL_FATO: Record<Fato, string> = {
  travou: 'travaram', pronta: 'pediram resposta', tutor: 'com o Tutor', atividade: 'na atividade', entregou: 'entregaram', naoentrou: 'não entraram',
}

/** A legenda das cores, com quantos alunos em cada fato agora: vai no rodapé de Começar aula. */
export function LegendaFatos({ turmaId, className }: { turmaId: string; className?: string }) {
  const vivo = aoVivoDa(turmaId)
  const ordem: Fato[] = ['travou', 'pronta', 'tutor', 'atividade', 'entregou', 'naoentrou']
  return (
    <ul aria-label="Legenda: quantos alunos em cada situação agora" className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
      {ordem.map((f) => {
        const n = vivo.filter((v) => v.fato === f).length
        if (!n) return null
        return (
          <li key={f} className={cn('flex items-center gap-1.5 text-[14px] font-bold leading-5', TEXTO_FATO[f])}>
            <PontoFato fato={f} /><span className="tabular-nums">{n}</span><span className="font-medium">{n === 1 ? FATO[f].curto : PLURAL_FATO[f]}</span>
          </li>
        )
      })}
    </ul>
  )
}

const TEXTO_FATO: Record<Fato, string> = {
  tutor: 'text-azul-texto', travou: 'text-amarelo-texto', pronta: 'text-amarelo-texto', entregou: 'text-verde-texto', atividade: 'text-sutil', naoentrou: 'text-sutil',
}

const MINI: Record<Fato, string> = { tutor: 'Tutor', travou: 'travou', pronta: 'pediu', entregou: 'entregou', atividade: 'fazendo', naoentrou: 'fora' }

function Carteira({ a, fato, semNomes, ativa, estreita, aoClicar }: { a: Aluno; fato: Fato; semNomes: boolean; ativa: boolean; estreita: boolean; aoClicar: () => void }) {
  const fora = fato === 'naoentrou'
  return (
    <button type="button" onClick={aoClicar} aria-pressed={ativa}
      aria-label={`${semNomes ? `Número ${a.numero}` : a.nome}: ${FATO[fato].nome}`}
      className={cn('flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 bg-white px-1 py-2.5 text-center transition-colors duration-150 hover:bg-fundo-suave',
        fora ? 'border-dashed border-borda-forte' : 'border-borda',
        ativa && 'border-azul-borda bg-azul-claro hover:bg-azul-claro')}>
      <span className="relative">
        {semNomes
          ? <span className="inline-grid size-10 place-items-center rounded-full bg-fundo-suave text-[15px] font-bold tabular-nums text-apoio">{a.numero}</span>
          : <Avatar nome={a.nome} tamanho={40} className={cn(fora && 'opacity-50')} />}
        {estreita && <span className="absolute -bottom-1 -right-3 rounded-full bg-white p-px"><PontoFato fato={fato} /></span>}
      </span>
      <span className="block w-full truncate text-[15px] font-bold leading-5 text-tinta">{semNomes ? `nº ${a.numero}` : a.primeiro}</span>
      <span className={cn('flex max-w-full items-center gap-1 text-[14px] font-bold leading-4', TEXTO_FATO[fato])}>
        {!estreita && <PontoFato fato={fato} />}<span className="truncate">{estreita ? MINI[fato] : FATO[fato].curto}</span>
      </span>
    </button>
  )
}

/** As carteiras da aula. Ocupam a altura que o pai der e rolam por dentro quando as fileiras não cabem. */
export function SalaTurma({ turmaId, semNomes = false, aoAbrirAluno = () => {}, alunoAberto = null }: {
  turmaId: string
  /** compatibilidade: só existe o modo aula */
  modo?: 'aula' | 'retrato'
  lente?: LenteAula
  semNomes?: boolean
  aoAbrirAluno?: (id: string) => void
  alunoAberto?: string | null
}) {
  const vivo = useMemo(() => aoVivoDa(turmaId), [turmaId])
  const palco = useRef<HTMLDivElement | null>(null)
  const [colunas, setColunas] = useState(8)

  useEffect(() => {
    const el = palco.current
    if (!el) return
    const medir = () => setColunas(el.clientWidth >= 720 ? 8 : el.clientWidth >= 480 ? 6 : 4)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (vivo.length === 0) return <EstadoVazio titulo="Ninguém entrou ainda" className="py-10" />

  // um corredor a cada duas carteiras (como na sala), só com 8 por fileira
  const corredor = colunas === 8
  const trilhos = Array.from({ length: colunas }, (_, c) => (corredor && c > 0 && c % 2 === 0 ? '10px minmax(0,1fr)' : 'minmax(0,1fr)')).join(' ')
  const linhas = Math.ceil(vivo.length / colunas)

  return (
    <section aria-label="Carteiras da turma, agora" className="flex h-full min-h-0 flex-col gap-3">
      <p aria-hidden className="mx-auto grid h-8 w-36 shrink-0 place-items-center rounded-[10px] border-2 border-borda bg-fundo-suave t-selo text-sutil">Sua mesa</p>
      <div ref={palco} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1">
        <div className="grid h-full min-h-full gap-x-2 gap-y-2.5" style={{ gridTemplateColumns: trilhos, gridTemplateRows: `repeat(${linhas}, minmax(${colunas === 4 ? 120 : 108}px, 1fr))` }}>
          {vivo.map(({ aluno: a, fato }, i) => {
            const c = i % colunas
            const style: React.CSSProperties = { gridColumn: corredor ? c + Math.floor(c / 2) + 1 : c + 1 }
            return (
              <div key={a.id} style={style} className="grid min-h-0">
                <Carteira a={a} fato={fato} semNomes={semNomes} estreita={colunas === 4} ativa={alunoAberto === a.id} aoClicar={() => aoAbrirAluno(a.id)} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
