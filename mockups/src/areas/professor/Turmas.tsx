import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Atom, Check, ChevronLeft, FlaskConical, ListFilter, UserPlus, type LucideIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BarraDesempenho, itemT, menuT } from '@/components/turmma/painel'
import { NotaMockup } from '@/components/turmma/tela'
import { botaoT, PeleTeachy, tipo } from '@/components/turmma/teachy'
import { ESCOLAS, escolaDe, TURMAS } from '@/dados/escola'
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

export function Turmas() {
  const [params, setParams] = useSearchParams()
  const noUso = params.get('aba') === 'uso'
  const [escola, setEscola] = useState('todas')
  // um diálogo só para a lista; a turma fica guardada para ele fechar sem piscar
  const [convite, setConvite] = useState({ turmaId: TURMAS[0].id, aberto: false })

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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4">
        {noUso ? <MeuUso /> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {turmas.map((t) => <CartaoTurma key={t.id} t={t} />)}
          </div>
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
