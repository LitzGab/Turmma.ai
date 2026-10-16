import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Atom, Check, ChevronLeft, CircleCheck, FlaskConical, ListFilter, UserPlus, X, type LucideIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BarraDesempenho, itemT, menuT } from '@/components/turmma/painel'
import { NotaMockup } from '@/components/turmma/tela'
import { botaoT, BotaoT, PeleTeachy, tipo } from '@/components/turmma/teachy'
import { ESCOLAS, escolaDe, PROFESSORA, TURMAS } from '@/dados/escola'
import { ALOCACOES, AVISO_DO_COMPLEMENTO, EFEITO_DA_CONTESTACAO, NOME_DA_CONTESTACAO, turmaDaEscola, type Alocacao, type Contestacao } from '@/dados/estrutura'
import { numerosDa } from '@/dados/turmas-resumo'
import { cn } from '@/lib/utils'
import { ConvidarAlunos } from './abas-turma/ConvidarAlunos'
import { MeuUso } from './abas-turma/MeuUso'

/* TURMAS — A LISTA. CÓPIA da área "Turmas" da Teachy (oitava rodada, 20/09/2026). Na sétima rodada a lista eram quatro
   cartões altos e cheios de dado, "adaptados" da Teachy; o Gabriel olhou e disse: "eu quero um ctrl c e ctrl v da Teachy.
   Não está interessante o seu." Então agora é o desenho de lá, com as medidas tiradas no Chrome dele e as nossas cores:
   · a linha de 42 px: "Turmas" em Quicksand 18/700 e, à direita, "Meu uso", "Filtrar" (o funil; filtra por escola, porque
     a professora dá aula em duas) e o primário de 42 px;
   · a grade `auto-fill` de 260 px com vão de 16;
   · o cartão de 213 px: a linha 10/12 com o ícone da disciplina, "Química" e "2º ano EM"; o nome em Quicksand 20/700;
     o espaço vazio; e, embaixo, "Desempenho" com a barra de 16 px e a pílula do percentual dentro (o acerto médio da
     turma; o 1ºC, sem nota, mostra "-%"). NADA MAIS — e o resto da página fica vazio, como lá.
   O que SAIU do cartão: a faixa de números (média, presença, entregas), a próxima aula e a semana, "esperando você",
   "precisam de atenção", o ranking e o ícone de convite do canto. Da barra saíram a busca e o filtro em pílulas.
   O que é nosso: a Teachy diz "Criar turma"; aqui a turma vem da estrutura que a coordenação importa (D3), então o
   primário é "Convidar alunos": abre um menu com as turmas e depois o diálogo do convite daquela turma.
   "Meu uso" é o espelho do professor (D45, D64), não de uma turma: troca a grade pelo conteúdo de MeuUso.tsx, com
   "‹ Turmas" para voltar. O endereço guarda: /professor/turmas?aba=uso.
   A página não rola: a linha do alto fica e quem rola é a área de baixo. */

const ICONE_DISCIPLINA: Record<string, LucideIcon> = { Química: FlaskConical, Ciências: Atom }

function CartaoTurma({ t }: { t: (typeof TURMAS)[number] }) {
  const Icone = ICONE_DISCIPLINA[t.disciplina] ?? FlaskConical
  return (
    <Link to={`/professor/turmas/${t.id}`} data-cartao-turma aria-label={`Abrir o ${t.nome}: ${t.disciplina}, ${t.serie}, ${escolaDe(t.escolaId).nome}`}
      className="flex h-[213px] min-w-0 flex-col justify-between rounded-[12px] border border-linha bg-superficie p-4 shadow-[0_2px_4px_rgba(0,0,0,.06)] outline-none transition-shadow duration-150 hover:shadow-[0_4px_14px_rgba(0,0,0,.10)] focus-visible:border-tinta">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[10px] leading-3 text-sutil">
          <span className="inline-flex items-center gap-1"><Icone aria-hidden className="size-3 shrink-0 text-caramelo" strokeWidth={2} />{t.disciplina}</span>
          <span>{t.serie}</span>
        </p>
        {/* 11 e não 12: com o fio de 1 px do cartão, o nome fica a 40 px do topo, como lá */}
        <h2 className="mt-[11px] truncate font-teachy text-[20px] font-bold leading-7 text-tinta">{t.nome}</h2>
      </div>
      <div>
        <p className="text-[11px] leading-4 text-sutil">Desempenho</p>
        <BarraDesempenho valor={numerosDa(t.id).desempenho} className="mt-1" />
      </div>
    </Link>
  )
}

/* CONFIRME SUAS TURMAS (04/10/2026, o comportamento do produto real, A1): a coordenação aloca a professora numa turma
   e numa disciplina; o vínculo nasce PENDENTE e a turma só abre depois que ela confirma (D3). Se estiver errado, ela
   contesta, com um motivo de uma lista e, se quiser, uma explicação curta (sem nome de aluno). As alocações vêm de
   dados/estrutura.ts: hoje é só o 3ºA de Química, criado em 01/10, ainda sem lista de nomes. */

type DesfechoDoVinculo = 'pendente' | 'confirmado' | 'contestado'
const PENDENTES_DA_PROFESSORA = ALOCACOES.filter((a) => a.professor === PROFESSORA.nome && a.estado === 'pendente')
const MOTIVOS = Object.entries(NOME_DA_CONTESTACAO) as [Contestacao, string][]

/** A turma recém-confirmada (o 3ºA não está em dados/escola.ts): mesmo desenho do cartão de turma, sem nota ainda.
    Não abre a turma (ela ainda não tem aluno nem atividade): abre o diálogo do acesso, que é o próximo passo. */
function CartaoTurmaNova({ a, aoAbrir }: { a: Alocacao; aoAbrir: () => void }) {
  const serie = turmaDaEscola(a.turmaId)?.serie ?? ''
  return (
    <button type="button" onClick={aoAbrir} data-cartao-turma aria-label={`${a.turma}: ${a.disciplina}, ${serie}. Gerar o acesso da turma`}
      className="flex h-[213px] min-w-0 flex-col justify-between rounded-[12px] border border-linha bg-superficie p-4 text-left shadow-[0_2px_4px_rgba(0,0,0,.06)] outline-none transition-shadow duration-150 hover:shadow-[0_4px_14px_rgba(0,0,0,.10)] focus-visible:border-tinta">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[10px] leading-3 text-sutil">
          <span className="inline-flex items-center gap-1"><FlaskConical aria-hidden className="size-3 shrink-0 text-caramelo" strokeWidth={2} />{a.disciplina}</span>
          <span>{serie}</span>
        </p>
        <h2 className="mt-[11px] truncate font-teachy text-[20px] font-bold leading-7 text-tinta">{a.turma}</h2>
        <p className="mt-1 text-[12px] leading-4 text-inativo">Sem acesso para os alunos ainda</p>
      </div>
      <div>
        <p className="text-[11px] leading-4 text-sutil">Desempenho</p>
        <BarraDesempenho valor={null} className="mt-1" />
      </div>
    </button>
  )
}

/** Um vínculo esperando a professora: a turma, a disciplina, a série, a escola e quando foi alocada; Confirmar e
    Contestar. Contestar abre o formulário no próprio cartão. */
function CartaoAlocacao({ a, desfecho, aoConfirmar, aoContestar }: { a: Alocacao; desfecho: DesfechoDoVinculo; aoConfirmar: () => void; aoContestar: (motivo: Contestacao, complemento: string) => void }) {
  const [contestando, setContestando] = useState(false)
  const [motivo, setMotivo] = useState<Contestacao | null>(null)
  const [complemento, setComplemento] = useState('')
  const serie = turmaDaEscola(a.turmaId)?.serie ?? ''
  const contestada = desfecho === 'contestado'

  return (
    <article className="col-span-full rounded-[12px] border border-linha bg-superficie p-4 shadow-[0_2px_4px_rgba(0,0,0,.06)] lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] leading-3 text-sutil">
            <span className="inline-flex items-center gap-1"><FlaskConical aria-hidden className="size-3 shrink-0 text-caramelo" strokeWidth={2} />{a.disciplina}</span>
            <span>{serie}</span>
          </p>
          <h3 className="mt-1 font-teachy text-[20px] font-bold leading-7 text-tinta">{a.turma}</h3>
          <p className="truncate text-[12px] leading-4 text-sutil">{escolaDe('aurora').nome} · {a.quando}</p>
        </div>
        {contestada ? (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-[6px] bg-pendente-cx px-2.5 text-[12px] font-medium text-pendente">
            <AlertTriangle className="size-3.5" strokeWidth={2} aria-hidden /> Contestada · a coordenação vai corrigir
          </span>
        ) : !contestando && (
          <div className="flex gap-2">
            <BotaoT variante="contorno" tamanho="m" onClick={() => setContestando(true)}>Contestar</BotaoT>
            <BotaoT tamanho="m" onClick={aoConfirmar}><Check strokeWidth={2.2} aria-hidden /> Confirmar</BotaoT>
          </div>
        )}
      </div>

      {contestando && !contestada && (
        <form className="mt-4 grid gap-3 border-t border-linha pt-4" onSubmit={(e) => { e.preventDefault(); if (motivo) aoContestar(motivo, complemento.trim()) }}>
          <fieldset>
            <legend className={tipo.rotulo}>O que está errado neste vínculo?</legend>
            <div className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {MOTIVOS.map(([id, nome]) => (
                <label key={id} className="flex h-8 items-center gap-2 text-[14px] text-tinta">
                  <input type="radio" name={`motivo-${a.id}`} checked={motivo === id} onChange={() => setMotivo(id)} className="size-4 accent-[#0D0D0D]" />
                  {nome}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              <span className={tipo.rotulo}>Quer explicar? <span className="font-teachy-corpo text-[12px] font-normal text-inativo">(opcional)</span></span>
              <span className="text-[11px] tabular-nums text-inativo">{complemento.length}/500</span>
            </span>
            <textarea value={complemento} onChange={(e) => setComplemento(e.target.value)} maxLength={500} rows={2}
              placeholder="Ex.: dou Química no 3ºB, não no 3ºA."
              className="min-h-[60px] resize-none rounded-[8px] border border-borda-campo bg-superficie px-3 py-2 text-[14px] leading-5 text-tinta outline-none placeholder:text-inativo focus:border-tinta" />
            <span className="text-[12px] leading-4 text-sutil">{AVISO_DO_COMPLEMENTO}</span>
          </label>
          <p className="flex items-start gap-2 rounded-[8px] bg-pendente-cx px-3 py-2 text-[13px] leading-5 text-pendente">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />{EFEITO_DA_CONTESTACAO}
          </p>
          <div className="flex flex-wrap gap-2">
            <BotaoT type="submit" tamanho="m" disabled={!motivo}>Enviar a contestação</BotaoT>
            <BotaoT variante="texto" tamanho="m" onClick={() => { setContestando(false); setMotivo(null); setComplemento('') }}>Cancelar</BotaoT>
          </div>
        </form>
      )}
    </article>
  )
}

export function Turmas() {
  const [params, setParams] = useSearchParams()
  const noUso = params.get('aba') === 'uso'
  const [escola, setEscola] = useState('todas')
  // um diálogo só para a lista; a turma fica guardada para ele fechar sem piscar
  const [convite, setConvite] = useState({ turmaId: TURMAS[0].id, aberto: false })

  // os vínculos esperando a professora: confirmar tira do bloco e põe na grade; contestar deixa no bloco, sem botões
  const [desfechos, setDesfechos] = useState<Record<string, DesfechoDoVinculo>>({})
  const [anuncio, setAnuncio] = useState<Alocacao | null>(null)
  const noBloco = PENDENTES_DA_PROFESSORA.filter((a) => (desfechos[a.id] ?? 'pendente') !== 'confirmado')
  const confirmadas = PENDENTES_DA_PROFESSORA.filter((a) => desfechos[a.id] === 'confirmado')
  const novasNaGrade = confirmadas.filter(() => escola === 'todas' || escola === 'aurora')

  const turmas = TURMAS.filter((t) => escola === 'todas' || t.escolaId === escola)
  const escolas = [{ id: 'todas', nome: 'Todas' }, ...ESCOLAS.map((e) => ({ id: e.id, nome: e.nome }))]
  const gatilho = 'outline-none data-[state=open]:bg-realce-suave'

  return (
    <PeleTeachy className="flex h-[calc(100svh-56px)] min-h-0 flex-col md:h-svh">
      <header className="flex min-h-[42px] shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4">
        {noUso ? (
          <div className="flex h-[42px] items-center gap-3">
            <button type="button" onClick={() => setParams({}, { replace: true })} className={botaoT('texto', 'g', '-ml-2 px-2')}><ChevronLeft aria-hidden strokeWidth={2} /> Turmas</button>
            <span aria-hidden className="h-5 w-px bg-linha" />
            <h1 className={tipo.secao}>Meu uso</h1>
          </div>
        ) : (
          <>
            <h1 className={tipo.secao}>Turmas</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <button type="button" onClick={() => setParams({ aba: 'uso' }, { replace: true })} className={botaoT('texto', 'g', 'px-2')}>Meu uso</button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={botaoT('texto', 'g', cn('px-2', gatilho))}>
                    <ListFilter aria-hidden strokeWidth={2} /> Filtrar{escola !== 'todas' && <span className="font-teachy-corpo font-normal text-sutil">· {escolaDe(escola).curto}</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn(menuT, 'w-60')}>
                  {escolas.map((e) => (
                    <DropdownMenuItem key={e.id} className={itemT} onSelect={() => setEscola(e.id)}>
                      <span className="min-w-0 flex-1 truncate">{e.nome}</span>
                      {escola === e.id && <Check aria-hidden className="!text-tinta" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={botaoT('primario', 'g', 'outline-none')}><UserPlus aria-hidden strokeWidth={2} /> Convidar<span className="max-sm:hidden"> alunos</span></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn(menuT, 'w-64')}>
                  <p className="px-2.5 pb-1 pt-1.5 text-[12px] leading-4 text-inativo">Para qual turma?</p>
                  {TURMAS.map((t) => (
                    // o convite abre depois que o menu fecha: os dois disputam o foco
                    <DropdownMenuItem key={t.id} className={cn(itemT, 'h-11')} onSelect={() => window.setTimeout(() => setConvite({ turmaId: t.id, aberto: true }), 0)}>
                      <span className="w-8 shrink-0 font-teachy font-bold">{t.nome}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] leading-4">{t.disciplina} · {t.serie}</span>
                        <span className="block truncate text-[12px] leading-4 text-inativo">{escolaDe(t.escolaId).nome}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {confirmadas.map((a) => (
                    <DropdownMenuItem key={a.id} className={cn(itemT, 'h-11')} onSelect={() => window.setTimeout(() => setConvite({ turmaId: a.turmaId, aberto: true }), 0)}>
                      <span className="w-8 shrink-0 font-teachy font-bold">{a.turma}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] leading-4">{a.disciplina} · {turmaDaEscola(a.turmaId)?.serie}</span>
                        <span className="block truncate text-[12px] leading-4 text-inativo">{escolaDe('aurora').nome}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4">
        {noUso ? <MeuUso /> : (
          <>
            {noBloco.length > 0 && (
              <section aria-labelledby="confirme-titulo" className="mb-6">
                <h2 id="confirme-titulo" className={tipo.secao}>Confirme suas turmas</h2>
                <p className="text-[13px] leading-5 text-sutil">A coordenação alocou você nestas turmas. Até você confirmar, a turma não abre para você; se algo estiver errado, conteste.</p>
                <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {noBloco.map((a) => (
                    <CartaoAlocacao key={a.id} a={a} desfecho={desfechos[a.id] ?? 'pendente'}
                      aoConfirmar={() => { setDesfechos((d) => ({ ...d, [a.id]: 'confirmado' })); setAnuncio(a) }}
                      aoContestar={() => setDesfechos((d) => ({ ...d, [a.id]: 'contestado' }))} />
                  ))}
                </div>
              </section>
            )}

            {anuncio && (
              <div role="status" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] bg-ok-cx px-3 py-2 text-[14px] leading-5 text-ok">
                <CircleCheck className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
                <span className="min-w-0 flex-1"><b className="font-semibold">Turma {anuncio.turma} confirmada.</b> Agora gere o acesso da turma para os alunos entrarem.</span>
                <BotaoT tamanho="p" onClick={() => setConvite({ turmaId: anuncio.turmaId, aberto: true })}>Gerar acesso</BotaoT>
                <button type="button" onClick={() => setAnuncio(null)} aria-label="Fechar o aviso" className="grid size-7 place-items-center rounded-[6px] text-ok hover:bg-white/60"><X className="size-4" strokeWidth={2} /></button>
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {turmas.map((t) => <CartaoTurma key={t.id} t={t} />)}
              {novasNaGrade.map((a) => <CartaoTurmaNova key={a.id} a={a} aoAbrir={() => setConvite({ turmaId: a.turmaId, aberto: true })} />)}
            </div>
          </>
        )}
      </div>

      <ConvidarAlunos key={convite.turmaId} turmaId={convite.turmaId} aberto={convite.aberto} aoMudar={(v) => setConvite((c) => ({ ...c, aberto: v }))} />
      <NotaMockup>
        "Turmas" é cópia da Teachy (oitava rodada, 20/09/2026): lista de turmas em cartões e a turma aberta com abas. Saiu "Criar turma": a turma deriva da estrutura que a
        coordenação importa (regra 60, item 8); no lugar entrou "Convidar alunos" (D3: o aluno reivindica o próprio nome e o professor aprova).
      </NotaMockup>
    </PeleTeachy>
  )
}
