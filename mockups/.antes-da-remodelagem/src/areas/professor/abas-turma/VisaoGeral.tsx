import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, Atom, ChartNoAxesColumn, Check, Eye, FlaskConical, GraduationCap, Plus, Radio, Settings, TrendingUp, UserCheck, UserPlus, Users, type LucideIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AvatarAgente, ChipFonte } from '@/components/turmma/ia'
import { itemT, menuT, MetricaT, MiniEvolucao, MiniHistograma, Trilho, ValorT } from '@/components/turmma/painel'
import { AlternaT, AvatarT, BotaoT, botaoT, ChipT, Periodo, PerguntaT, tipo, VazioT } from '@/components/turmma/teachy'
import { alunosDa } from '@/dados/alunos'
import { escolaDe, turmaDe, TURMAS } from '@/dados/escola'
import { atencaoDa, capitulosDa, habilidadesDa, numerosDa, resumoDa, virgula } from '@/dados/turmas-resumo'
import { cn } from '@/lib/utils'
import { ConvidarAlunos } from './ConvidarAlunos'

/* ABA "VISÃO GERAL" DA TURMA ABERTA — CÓPIA da Teachy (oitava rodada, 20/09/2026). Na sétima rodada esta aba era uma
   "adaptação" (métricas numa faixa e as quatro perguntas em grade 2 × 2, para caber na janela); o Gabriel olhou e
   disse: "eu quero um ctrl c e ctrl v da Teachy. Não está interessante o seu." Então agora é o desenho de lá, medido:
   · a linha do título: "Turma 2ºB" em 24/700, os chips (disciplina · série · "Alunos (32)") e o botão "Gerenciar", cujo
     menu guarda o que saiu da barra da turma: Convidar alunos · Modo sala · Trocar de turma;
   · "Métricas principais" com o seletor de período da Teachy (2026 · 30D · 2M · 3M · 6M · 12M) e os TRÊS cartões de
     112 px: Média da turma · Distribuição de notas · Participação;
   · as QUATRO PERGUNTAS NUMERADAS, EMPILHADAS, na largura toda, 44 px entre uma e outra, cada uma com o seu cartão de
     canto 12 — e a página ROLA como documento (a aba é um bloco de altura natural; quem rola é a turma).
   Na conta dele na Teachy os cartões estão vazios; os nossos vêm CHEIOS, com o dado de `alunosDa()` e de
   `dados/turmas-resumo`. A turma sem nota (1ºC) mostra "-" nos cartões e o estado vazio tracejado nas perguntas 1 a 3.
   O que saiu da rodada anterior: a grade 2 × 2, a alternância em pílula, o período de três opções, o link "pontua no
   ranking" e as cores de atenção (o trilho e o número em laranja): aqui o laranja fica no ícone do rótulo, no selo do
   número e em link. "Temas | Habilidades" voltou a ser o nome da Teachy: tema é o capítulo do material da escola.
   Tudo aqui é TRABALHO do aluno: nota, entrega, acerto por habilidade, presença. O motivo de "precisa de atenção" é
   sempre um fato; nunca atenção, humor ou jeito do aluno (D57, D66). Do Tutor só entra o agregado: quantos usaram,
   quantas conversas e as dúvidas de conteúdo — nada de tempo de uso nem horário (D69). */

const ASSUNTOS = [{ id: 'temas' as const, nome: 'Temas' }, { id: 'habilidades' as const, nome: 'Habilidades' }]
const ICONE_DISCIPLINA: Record<string, LucideIcon> = { Química: FlaskConical, Ciências: Atom }

/** O recorte do período. A escola começou a usar o produto neste bimestre: as quatro atividades corrigidas e as 16
    aulas dadas cabem em qualquer janela de 2 meses para cima (2M · 3M · 6M · 12M · 2026). Só "30D" corta: ficam as 11
    aulas desde 22/08 (todas as faltas registradas caem nelas, então a presença cai um pouco); as atividades são as mesmas. */
function recorte(turmaId: string, periodo: string) {
  const n = numerosDa(turmaId)
  const alunos = alunosDa(turmaId)
  const aulas = periodo === '30D' ? 11 : 16
  const faltas = alunos.reduce((s, a) => s + a.faltas, 0)
  return { aulas, presenca: aulas === 16 ? n.presenca : Math.round((1 - faltas / (aulas * alunos.length)) * 100) }
}

/** O cartão de cada pergunta: canto 12, fio de 1 px; as linhas ficam separadas por fio, com 16 px de respiro lateral. */
const cartaoLista = 'mt-5 overflow-hidden rounded-[12px] border border-linha bg-superficie'
const linha = 'border-t border-linha px-4 first:border-t-0'
const link = 'inline-flex items-center gap-1 font-teachy text-[14px] font-bold leading-6 text-caramelo-texto underline-offset-4 hover:underline'

function Vazio({ texto }: { texto: string }) {
  return (
    <VazioT tracejado className="mt-5" titulo="Os insights estão a caminho" texto={texto}
      acao={<Link to="/professor/ferramentas/atividade" className={botaoT('primario', 'g')}><Plus aria-hidden strokeWidth={2.25} /> Criar atividade</Link>} />
  )
}

export function VisaoGeralTurma({ turmaId }: { turmaId: string }) {
  const [, setParams] = useSearchParams()
  const navegar = useNavigate()
  const [periodo, setPeriodo] = useState('2026')
  const [assunto, setAssunto] = useState<'temas' | 'habilidades'>('temas')
  const [convite, setConvite] = useState(false)

  const t = turmaDe(turmaId)
  const n = numerosDa(turmaId)
  const r = resumoDa(turmaId)
  const p = recorte(turmaId, periodo)
  const semNota = n.media === null
  const assuntos = assunto === 'habilidades' ? habilidadesDa(turmaId) : capitulosDa(turmaId)
  const atencao = atencaoDa(turmaId)
  const IconeDisciplina = ICONE_DISCIPLINA[t.disciplina] ?? FlaskConical
  const irPara = (aba: string, extra: Record<string, string> = {}) => setParams({ aba, ...extra }, { replace: true })

  return (
    <div>
      {/* A LINHA DO TÍTULO */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-2 pt-6">
        <h2 className={tipo.titulo}>Turma {t.nome}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <ChipT><IconeDisciplina aria-hidden className="text-sutil" strokeWidth={2} />{t.disciplina}</ChipT>
          <ChipT><GraduationCap aria-hidden className="text-sutil" strokeWidth={2} />{t.serie}</ChipT>
          <ChipT><Users aria-hidden className="text-sutil" strokeWidth={2} />Alunos ({t.alunos})</ChipT>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={botaoT('contorno', 'p', 'outline-none data-[state=open]:bg-realce-suave sm:ml-2')}><Settings aria-hidden strokeWidth={2} /> Gerenciar</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(menuT, 'w-56')}>
              {/* o convite abre depois que o menu fecha: os dois disputam o foco */}
              <DropdownMenuItem className={itemT} onSelect={() => window.setTimeout(() => setConvite(true), 0)}><UserPlus aria-hidden strokeWidth={1.75} /> Convidar alunos</DropdownMenuItem>
              <DropdownMenuItem className={itemT} asChild><Link to="/professor/sala"><Radio aria-hidden strokeWidth={1.75} /> Modo sala</Link></DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={cn(itemT, 'data-[state=open]:bg-realce-suave')}><ArrowLeftRight aria-hidden strokeWidth={1.75} /> Trocar de turma</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent sideOffset={8} className={cn(menuT, 'w-60')}>
                    {TURMAS.map((x) => (
                      <DropdownMenuItem key={x.id} className={cn(itemT, 'h-11')} onSelect={() => { if (x.id !== t.id) navegar(`/professor/turmas/${x.id}`) }}>
                        <span className="w-8 shrink-0 font-teachy font-bold">{x.nome}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] leading-4">{x.disciplina} · {x.serie}</span>
                          <span className="block truncate text-[12px] leading-4 text-inativo">{escolaDe(x.escolaId).nome}</span>
                        </span>
                        {x.id === t.id && <Check aria-hidden className="!text-tinta" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <section aria-label="Métricas principais" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 className={tipo.secao}>Métricas principais</h2>
          <Periodo valor={periodo} aoMudar={setPeriodo} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <MetricaT icone={TrendingUp} rotulo="Média da turma">
            {semNota ? <ValorT valor="-" linhas={['sem nota ainda']} apagado /> : <ValorT valor={virgula(n.media!)} linhas={['de 10', `${n.evolucao.length} atividades corrigidas`]} />}
            <MiniEvolucao pontos={n.evolucao.map((e) => ({ rotulo: e.data, valor: e.media }))} />
          </MetricaT>
          <MetricaT icone={ChartNoAxesColumn} rotulo="Distribuição de notas">
            {semNota ? <ValorT valor="-" linhas={['sem nota ainda']} apagado /> : <ValorT valor={String(n.faixas[1] + n.faixas[2])} linhas={[`de ${n.alunos}`, 'com 6 ou mais']} />}
            <MiniHistograma vazio={semNota} faixas={[{ nome: 'abaixo de 6', curto: '< 6', valor: n.faixas[0] }, { nome: 'de 6 a 8', curto: '6 a 8', valor: n.faixas[1] }, { nome: '8 ou mais', curto: '8 +', valor: n.faixas[2] }]} />
          </MetricaT>
          <MetricaT icone={UserCheck} rotulo="Participação">
            <ValorT valor={`${p.presenca}%`} linhas={['presença', `${p.aulas} aulas`]} />
            <ValorT valor={`${n.entregas}%`} linhas={['entregas', '5 atividades']} />
          </MetricaT>
        </div>
      </section>

      {/* 1 · ASSUNTOS */}
      <section className="mt-11">
        <PerguntaT n={1} lado={!semNota && <AlternaT opcoes={ASSUNTOS} valor={assunto} aoMudar={setAssunto} />}>Quais assuntos merecem atenção?</PerguntaT>
        {semNota ? <Vazio texto="Assim que a turma tiver atividade corrigida, os assuntos que merecem atenção aparecem aqui." /> : (
          <ul className={cartaoLista}>
            {assuntos.map((a) => (
              <li key={a.id} className={cn(linha, 'grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2.5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_2.75rem_4.5rem_7rem]')}>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium leading-5 text-tinta">{a.nome}</p>
                  <p className="truncate text-[12px] leading-4 text-inativo" title={`${a.abaixo} ${a.abaixo === 1 ? 'aluno' : 'alunos'} abaixo de 50%`}>
                    {!a.partes ? a.codigo : a.partes.length === 1 ? a.partes[0].codigo : a.partes.map((x) => `${x.nome} ${x.acerto}%`).join(' · ')}
                  </p>
                </div>
                <p className="text-right text-[14px] font-semibold leading-5 text-tinta md:order-3">{a.acerto}%</p>
                <Trilho valor={a.acerto} marca={50} className="col-span-2 bg-realce-suave md:order-2 md:col-span-1" />
                <div className="md:order-4"><ChipFonte pagina={a.pagina} material={r.material.titulo} capitulo={r.material.capitulo} /></div>
                <div className="text-right md:order-5">{a.acerto < 60 && <Link to="/professor/ferramentas/atividade" className={botaoT('contorno', 'p')}>Pedir reforço</Link>}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2 · ALUNOS */}
      <section className="mt-11">
        <PerguntaT n={2} lado={!semNota && atencao.length > 0 && <p className={tipo.apoio}>{atencao.length} de {n.alunos} alunos</p>}>Quais alunos precisam de atenção?</PerguntaT>
        {semNota ? <Vazio texto="Assim que a turma tiver atividade corrigida, os alunos que precisam de atenção aparecem aqui." />
          : atencao.length === 0 ? <VazioT tracejado className="mt-5" titulo="Ninguém pede atenção agora" texto="Entra aqui quem acumula habilidade abaixo de 50%, entrega faltando ou falta." /> : (
            <ul className={cartaoLista}>
              {atencao.slice(0, 6).map(({ aluno: a, motivos }) => (
                <li key={a.id} className={cn(linha, 'flex min-h-14 items-center gap-3 py-2')}>
                  <AvatarT nome={a.nome} />
                  <div className="min-w-0 flex-1 md:flex md:items-center md:gap-4">
                    <p className="truncate text-[14px] font-medium leading-5 text-tinta md:w-44 md:shrink-0">{a.nome}</p>
                    <p className="truncate text-[12px] leading-4 text-sutil md:text-[14px] md:leading-5">{motivos.join(' · ')}</p>
                  </div>
                  {a.media !== null && <p className="shrink-0 whitespace-nowrap text-[12px] leading-4 text-inativo max-sm:hidden">média <b className="text-[14px] font-semibold text-tinta">{virgula(a.media)}</b></p>}
                  <BotaoT variante="contorno" tamanho="p" className="ml-2" onClick={() => irPara('sala', { aluno: a.id })} aria-label={`Detalhes de ${a.nome}`}><Eye aria-hidden strokeWidth={2} /> Detalhes</BotaoT>
                </li>
              ))}
              {atencao.length > 6 && (
                <li className={cn(linha, 'flex h-12 items-center justify-between gap-4 bg-[#FAFAFA]')}>
                  <p className={tipo.apoio}>e mais {atencao.length - 6}, do caso mais pesado para o mais leve</p>
                  <button type="button" onClick={() => irPara('alunos')} className={link}>Ver todos em Alunos <ArrowRight aria-hidden className="size-3.5" /></button>
                </li>
              )}
            </ul>
          )}
      </section>

      {/* 3 · ERROS */}
      <section className="mt-11">
        <PerguntaT n={3} lado={r.erros.length > 0 && <p className={tipo.apoio}>{r.origemDosErros}</p>}>Quais são os erros recorrentes da turma?</PerguntaT>
        {r.erros.length === 0 ? <Vazio texto="Assim que a turma tiver atividade corrigida, os erros que mais se repetem aparecem aqui, com a página do material." /> : (
          <ul className={cartaoLista}>
            {r.erros.map((e) => (
              <li key={e.texto} className={cn(linha, 'flex min-h-14 items-center gap-3 py-2')}>
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-realce-suave font-teachy text-[14px] font-bold leading-none text-tinta">{e.alunos}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-5 text-tinta md:truncate">{e.texto}</p>
                  <p className="truncate text-[12px] leading-4 text-inativo">{e.alunos} de {n.alunos} alunos · {e.onde}</p>
                </div>
                <ChipFonte pagina={e.pagina} material={r.material.titulo} capitulo={r.material.capitulo} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4 · ESTUDO AUTÔNOMO */}
      <section className="mt-11">
        <PerguntaT n={4} lado={<button type="button" onClick={() => irPara('uso')} className={link}>Ver em Uso de IA <ArrowRight aria-hidden className="size-3.5" /></button>}>Como a turma tem estudado de forma autônoma?</PerguntaT>
        <div className={cartaoLista}>
          <dl className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1.6fr]">
            {([[String(r.tutor.usaram), `de ${n.alunos}`, 'alunos usaram o Tutor nesta semana'], [String(r.tutor.conversas), '', 'conversas com o Tutor'], [r.tutor.assunto, '', 'assunto mais perguntado']] as const).map(([valor, sufixo, rotulo], i) => (
              <div key={rotulo} className={cn('flex min-w-0 flex-col-reverse justify-end border-linha px-4 py-3', i > 0 && 'border-l', i === 2 && 'max-md:col-span-2 max-md:border-l-0 max-md:border-t')}>
                <dt className="text-[12px] leading-4 text-sutil">{rotulo}</dt>
                <dd className={cn('flex h-8 items-end gap-1.5 font-semibold text-tinta', i === 2 ? 'pb-[3px] text-[16px] leading-6' : 'text-[24px] leading-8 tracking-[-0.02em]')}>
                  <span className="truncate">{valor}</span>{sufixo && <span className="pb-[5px] text-[12px] font-normal leading-4 tracking-normal text-sutil">{sufixo}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className={cn(tipo.rotulo, 'flex items-center gap-2 border-t border-linha bg-[#FAFAFA] px-4 py-2')}><AvatarAgente id="tutor" tamanho={20} /> Dúvidas que mais se repetiram</p>
          <ul>
            {r.tutor.duvidas.map((d) => (
              <li key={d.texto} className="flex min-h-12 items-center gap-3 border-t border-linha px-4 py-2">
                <p className="min-w-0 flex-1 text-[14px] leading-5 text-tinta md:truncate">“{d.texto}”</p>
                <span className="shrink-0 whitespace-nowrap text-[12px] leading-4 text-sutil">{d.vezes} vezes</span>
                <ChipFonte pagina={d.pagina} material={r.material.titulo} capitulo={r.material.capitulo} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ConvidarAlunos turmaId={turmaId} aberto={convite} aoMudar={setConvite} />
    </div>
  )
}
