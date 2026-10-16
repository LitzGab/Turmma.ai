import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Botao, Busca, Carimbo, Secao, Segmentado, Selo } from '@/components/duo'
import { AssinaturaIA } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { HABILIDADES } from '@/dados/escola'
import { calcular } from '@/dados/consulta'
import { CELULAS_ESCOLA, SERIES_ESCOLA, VOCABULARIO_ESCOLA } from '@/dados/numeros-escola'
import { useAgora } from '@/dados/demo/nucleo'
import { useRegistrosIADaDemo, type RegistroIA } from '@/dados/ia'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ComoCadaIATrabalha, FaixaPausas } from './Agentes'
import { MES } from './Analista'
import { FraseSemRanking, TabelaGrade, type ColunaGrade } from './_estrutura-pecas'

/* A ABA IA DE REGISTROS (/coordenacao/registros, a primeira aba; 14ª rodada, 05/10/2026; plano ux-composicao, 1.4;
   fluxos F2, F3, F10, F12, F15 e F40). Antes era a página IA (/coordenacao/ia, que chega aqui). A tela que fecha a
   venda: o que a IA gerou e quem aprovou (regra 70).
   · Na ponta direita da linha das abas (ResumoDoMes): "Gerou 412 · Aprovadas 389 · Esperando 23" e COMO CADA IA
     TRABALHA (?ver=como, e ?ia=tutor para chegar já no Tutor), o painel com o pausar. Abaixo de 1280 px os números
     descem para o topo da aba; abaixo de 768, o botão também. A linha do mês é a casa única do número.
   · A Tabela "O que a IA gerou e quem aprovou": as linhas da demonstração (`useRegistrosIADaDemo`) entram NO TOPO e
     substituem a linha "para aprovar" do mesmo documento. Um filtro de estado e a busca. "Aprovado por" é o registro
     da aprovação, não indicador de uso: não existe filtro nem ordem por professor (D45, D64).
   · A linha abre ao lado (?item=): o que foi gerado, o que foi mostrado, o que foi aberto, quem aprovou e quando (D56).
   · VER POR SÉRIE abre ao lado (?serie=1, ou ?serie=<série> já acesa), sempre em agregado e com grupo mínimo (D45). */

type Estado = 'espera' | 'aprovado' | 'recusado' | 'rascunho'

type Registro = {
  id: string; quando: string; oQue: string; detalhe: string; turma: string; estado: Estado
  por?: string; motivo?: string; novo?: boolean
  /** a ordem do evento da demonstração (minutos desde o começo): AGORA só nos últimos minutos */
  ordem?: number
  /** a linha estática some quando a demonstração já decidiu o mesmo documento */
  trocadaPor?: (r: RegistroIA) => boolean
}

const REGISTROS: Registro[] = [
  { id: 'g1', quando: '21/09, 10h38', oQue: 'Versão adaptada', detalhe: 'prova de estequiometria', turma: '2ºB', estado: 'espera',
    trocadaPor: (r) => r.oQue === 'Versão adaptada' && r.turma === '2ºB' && r.estado !== 'espera' },
  { id: 'g2', quando: '21/09, 9h50', oQue: 'Correção', detalhe: '26 provas de mol e massa molar', turma: '2ºB', estado: 'espera',
    // o mesmo lote (a prova de mol do 2ºB), seja qual for o número: aprovado, a linha troca em vez de somar uma geração
    trocadaPor: (r) => r.oQue === 'Correção' && r.turma === '2ºB' && r.detalhe.includes('provas de mol e massa molar') },
  { id: 'g4', quando: '18/09, 16h05', oQue: 'Correção', detalhe: 'lista de cinemática', turma: '2ºB', estado: 'aprovado', por: 'Rafael Antunes' },
  { id: 'g5', quando: '18/09, 14h31', oQue: 'Versão adaptada', detalhe: 'texto de interpretação', turma: '8ºC', estado: 'recusado', por: 'Paulo Ribeiro', motivo: 'O enunciado direto mudou o que a questão cobrava.' },
  { id: 'g6', quando: '18/09, 11h18', oQue: 'Plano de aula', detalhe: 'reagente limitante', turma: '2ºA', estado: 'rascunho' },
  { id: 'g7', quando: '18/09, 11h02', oQue: 'Atividade', detalhe: 'lista de mol e massa molar', turma: '2ºA', estado: 'aprovado', por: 'Camila Souza' },
  { id: 'g8', quando: '17/09, 10h02', oQue: 'Correção', detalhe: 'simulado de Ciências', turma: '9ºA', estado: 'espera' },
  { id: 'g9', quando: '16/09, 14h20', oQue: 'Correção', detalhe: 'atividade de vetores', turma: '2ºB', estado: 'aprovado', por: 'Rafael Antunes' },
  { id: 'g10', quando: '15/09, 9h40', oQue: 'Prova', detalhe: 'ligações químicas', turma: '1ºC', estado: 'aprovado', por: 'Camila Souza' },
  { id: 'g11', quando: '14/09, 16h12', oQue: 'Versão adaptada', detalhe: 'lista de equações', turma: '2ºB', estado: 'aprovado', por: 'Camila Souza' },
  { id: 'g12', quando: '11/09, 8h55', oQue: 'Atividade', detalhe: 'leitura do capítulo 4', turma: '8ºC', estado: 'aprovado', por: 'Paulo Ribeiro' },
]

const ESTADO: Record<Estado, { rotulo: string; familia: 'amarelo' | 'verde' | 'vermelho' | 'neutro' }> = {
  espera: { rotulo: 'Para aprovar', familia: 'amarelo' },
  aprovado: { rotulo: 'Aprovado', familia: 'verde' },
  recusado: { rotulo: 'Recusado', familia: 'vermelho' },
  rascunho: { rotulo: 'Rascunho', familia: 'neutro' },
}

const FILTROS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'espera', rotulo: 'Para aprovar' },
  { id: 'aprovado', rotulo: 'Aprovados' },
  { id: 'recusado', rotulo: 'Recusados' },
]

/* Ver por série: sempre em agregado. Recorte com um professor só fica fechado (grupo mínimo, D45). Nenhuma média
   (regra dos painéis de gestão, 06/10/2026): ao lado do que a IA gerou, QUANTOS ALUNOS ficaram abaixo de 50% de
   acerto em alguma disciplina nas provas aprovadas, a mesma conta do Analista (CELULAS_ESCOLA). */
const abaixo50Da = (serie: string) => {
  const id = SERIES_ESCOLA.find((x) => x.nome === serie)?.id
  return id ? calcular(CELULAS_ESCOLA, { metrica: 'abaixo50', filtros: { serie: [id] }, mes: 'setembro' }, VOCABULARIO_ESCOLA, 1).valor : null
}
const POR_SERIE = [
  { serie: '6º ano EF', gerado: 41, professores: 4 },
  { serie: '7º ano EF', gerado: 38, professores: 4 },
  { serie: '8º ano EF', gerado: 52, professores: 5 },
  { serie: '9º ano EF', gerado: 63, professores: 5 },
  { serie: '1º ano EM', gerado: 71, professores: 6 },
  { serie: '2º ano EM', gerado: 112, professores: 5 },
  { serie: '3º ano EM', gerado: 35, professores: 1 },
].map((s) => ({ ...s, abaixo50: s.professores < 2 ? null : abaixo50Da(s.serie) }))

/** As habilidades de Química do 2º ano EM, da que tem mais alunos abaixo de 50% para a que tem menos. */
const HABILIDADES_POR_CONTAGEM = [...HABILIDADES].sort((a, b) => b.abaixo50 - a.abaixo50)

/** Os números do mês: a base de setembro mais o que a demonstração gerou e aprovou (os mesmos eventos da Tabela).
    IA, Dossiê e Exportar leem daqui, para o número ser um só. */
export function useMesIA() {
  const demo = useRegistrosIADaDemo()
  return useMemo(() => {
    let { gerou, aprovadas, esperam } = MES
    const usadas = new Set<string>()
    for (const r of [...demo].reverse()) {
      const troca = REGISTROS.find((s) => s.estado === 'espera' && !usadas.has(s.id) && s.trocadaPor?.(r))
      if (troca) {
        usadas.add(troca.id)
        esperam -= 1
      } else {
        gerou += 1
        if (r.estado === 'espera') esperam += 1
      }
      if (r.estado === 'aprovado') aprovadas += 1
    }
    return { gerou, aprovadas, esperam: Math.max(0, esperam) }
  }, [demo])
}

const daDemo = (r: RegistroIA): Registro => ({ id: r.id, quando: r.quando, oQue: r.oQue, detalhe: r.detalhe, turma: r.turma, estado: r.estado, por: r.por === '—' ? undefined : r.por, novo: true, ordem: r.ordem })

/** "Agora" vale só para o evento mais recente, e só se aconteceu nos últimos 5 minutos do relógio da demonstração; o resto do dia é "Hoje". */
const MINUTOS_DE_AGORA = 5

function PainelRegistro({ r, aoFechar }: { r: Registro | undefined; aoFechar: () => void }) {
  const correcao = r?.oQue === 'Correção'
  return (
    <PainelLado aberto={!!r} aoFechar={aoFechar} titulo={r ? `${r.oQue} · ${r.turma}` : ''}>
      {r && (
        <div className="grid gap-6">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Selo familia={ESTADO[r.estado].familia}>{ESTADO[r.estado].rotulo}</Selo>
              <span className="t-apoio">gerado em {r.quando}</span>
            </div>
            <p className="t-cartao text-tinta">{r.oQue} · {r.detalhe}</p>
          </div>

          <section>
            <h3 className="t-selo mb-2 text-sutil">O que foi gerado</h3>
            <AssinaturaIA id="assistente" />
            <p className="t-apoio mt-1.5">Do material da turma, com a página em cada questão.</p>
          </section>

          <section>
            <h3 className="t-selo mb-2 text-sutil">O que foi mostrado</h3>
            <p className="t-corpo text-tinta">{correcao ? 'As notas, a turma e os destaques no topo.' : 'O documento inteiro, antes de enviar.'}</p>
          </section>

          {r.estado === 'aprovado' && (
            <>
              <section>
                <h3 className="t-selo mb-2 text-sutil">O que foi aberto</h3>
                <p className="t-corpo text-tinta">{correcao ? 'Todos os destaques, um a um.' : 'Todas as páginas.'}</p>
              </section>
              <section>
                <h3 className="t-selo mb-2 text-sutil">Quem aprovou</h3>
                <Carimbo por={r.por ?? '—'} quando={r.quando} />
                <p className="t-apoio mt-1.5">Só depois disso chegou aos alunos.</p>
              </section>
            </>
          )}
          {r.estado === 'recusado' && (
            <section>
              <h3 className="t-selo mb-2 text-sutil">Quem recusou</h3>
              <p className="t-corpo text-tinta">{r.por} · {r.quando}</p>
              {r.motivo && <p className="t-apoio mt-1">“{r.motivo}”</p>}
              <p className="t-apoio mt-1">Não chegou a nenhum aluno.</p>
            </section>
          )}
          {r.estado === 'espera' && <p className="t-corpo text-apoio">Espera o professor da turma. Até lá, nada chega aos alunos.</p>}
          {r.estado === 'rascunho' && <p className="t-corpo text-apoio">Rascunho do professor. Não foi enviado.</p>}

          <p className="t-apoio flex items-start gap-1.5"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> O nome de cada aluno fica com o professor da turma.</p>
        </div>
      )}
    </PainelLado>
  )
}


/** Ver por série, ao lado: sempre em agregado; o recorte com um professor só fica fechado (D45). */
function PainelPorSerie({ serie, aoFechar }: { serie: string | null; aoFechar: () => void }) {
  const acesa = serie && serie !== '1' ? serie : null
  return (
    <PainelLado aberto={!!serie} aoFechar={aoFechar} titulo="Por série" largura={520}>
      <div className="grid gap-6">
        <p className="t-apoio flex items-start gap-1.5"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> Sempre em agregado e em contagem de alunos, sem média: quantos ficaram abaixo de 50% de acerto na prova de alguma disciplina; embaixo, em cada habilidade (um aluno pode ir bem na prova e travar numa habilidade). Com um professor só, o recorte fica fechado.</p>
        <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
          {POR_SERIE.map((s) => (
            <li key={s.serie} className={cn('flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-t-2 border-borda px-4 py-2 first:border-t-0',
              acesa === s.serie && 'bg-azul-claro')}>
              <span className="t-cartao shrink-0 text-tinta">{s.serie}</span>
              {s.professores < 2
                ? <Selo icone={<Lock strokeWidth={2.5} />} title="Com um professor só, o recorte fica fechado.">Fechado</Selo>
                : <span className="text-[15px] font-medium tabular-nums text-apoio"><b className="font-bold text-tinta">{s.gerado}</b> gerados · <b className="font-bold text-tinta">{s.abaixo50}</b> abaixo de 50% na prova</span>}
            </li>
          ))}
        </ul>
        {(!acesa || acesa === '2º ano EM') && (
          <section>
            <h3 className="t-selo mb-2 text-sutil">2º ano EM · Química · abaixo de 50% na habilidade</h3>
            <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
              {HABILIDADES_POR_CONTAGEM.map((h) => (
                <li key={h.codigo} className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t-2 border-borda px-4 text-[15px] font-medium first:border-t-0">
                  <span className="truncate text-tinta">{h.nome}</span>
                  <span className="tabular-nums text-apoio"><b className="font-bold text-tinta">{h.abaixo50}</b> de 126</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PainelLado>
  )
}

/** Os 3 números do mês, em texto: "Gerou 412 · Aprovadas 389 · Esperando 23". */
function NumerosDoMes({ className }: { className?: string }) {
  const mes = useMesIA()
  const n = (rotulo: string, valor: number) => <span className="whitespace-nowrap">{rotulo} <b className="font-bold tabular-nums text-tinta">{valor}</b></span>
  return (
    <p className={cn('t-apoio flex flex-wrap items-center gap-x-2', className)} aria-label={`Setembro: a IA gerou ${mes.gerou}, ${mes.aprovadas} aprovadas, ${mes.esperam} esperando o professor`}>
      {n('Gerou', mes.gerou)}<span aria-hidden>·</span>{n('Aprovadas', mes.aprovadas)}<span aria-hidden>·</span>{n('Esperando', mes.esperam)}
    </p>
  )
}

/** A ponta direita da linha das abas, na aba IA: os números do mês e COMO CADA IA TRABALHA (a partir de 768 px). */
export function ResumoDoMes() {
  const [, setVer] = useParametro('ver')
  return (
    <div className="hidden items-center gap-5 md:flex">
      <NumerosDoMes className="hidden xl:flex" />
      <Botao variante="secundario" tamanho="p" onClick={() => setVer('como')}>Como cada IA trabalha</Botao>
    </div>
  )
}

const ESTADOS_TABELA = FILTROS

export function Governanca() {
  const demo = useRegistrosIADaDemo()
  const mes = useMesIA()
  const relogio = useAgora()
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [item, setItem] = useParametro('item')
  const [ver, setVer] = useParametro('ver')
  const [iaInicial] = useParametro('ia')
  const [serie, setSerie] = useParametro('serie')
  const [, setParams] = useSearchParams()
  const fecharComo = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('ver'); n.delete('ia'); return n }, { replace: true })

  const todos = useMemo(() => [
    ...demo.map(daDemo),
    ...REGISTROS.filter((s) => !s.trocadaPor || !demo.some(s.trocadaPor)),
  ], [demo])
  const termo = busca.trim().toLowerCase()
  const linhas = todos.filter((r) => (filtro === 'todos' || r.estado === filtro)
    && (!termo || `${r.oQue} ${r.detalhe} ${r.turma}`.toLowerCase().includes(termo)))
  const aberto = todos.find((r) => r.id === item)

  const selo = (r: Registro) => <Selo familia={ESTADO[r.estado].familia} tamanho="p">{ESTADO[r.estado].rotulo}</Selo>
  const quem = (r: Registro) => (r.estado === 'recusado' ? `Recusou: ${r.por}` : r.estado === 'aprovado' ? r.por ?? '—' : '—')
  const colunas: ColunaGrade<Registro>[] = [
    { titulo: 'O quê', largura: 'minmax(0,3fr)', celula: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate"><b className="font-bold">{r.oQue}</b> · {r.detalhe}</span>
        {r.novo && (r.id === demo[0]?.id && relogio.ordem - (r.ordem ?? 0) <= MINUTOS_DE_AGORA
          ? <Selo familia="azul" tamanho="p">Agora</Selo>
          : <Selo tamanho="p">Hoje</Selo>)}
      </span>
    ) },
    { titulo: 'Turma', largura: 'minmax(56px,.5fr)', celula: (r) => <span className="text-apoio">{r.turma}</span> },
    { titulo: 'Aprovado por', largura: 'minmax(0,1.3fr)', celula: (r) => <span className={cn('truncate', r.por ? 'text-apoio' : 'text-sutil')}>{quem(r)}</span> },
    { titulo: 'Quando', largura: 'minmax(0,1fr)', celula: (r) => <span className="truncate tabular-nums text-apoio">{r.quando}</span> },
    { titulo: 'Estado', largura: '132px', alinhar: 'fim', celula: selo },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 max-md:overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 xl:hidden">
        <NumerosDoMes className="max-md:basis-full" />
        <Botao variante="secundario" tamanho="p" className="md:hidden" onClick={() => setVer('como')}>Como cada IA trabalha</Botao>
        <Botao variante="secundario" tamanho="p" className="sm:hidden" onClick={() => setSerie('1')}>Por série</Botao>
      </div>

      <FaixaPausas className="shrink-0" />

      <Secao titulo="O que a IA gerou e quem aprovou" className="flex min-h-0 flex-1 flex-col max-md:flex-none"
        acao={<Botao variante="fantasma" tamanho="p" className="-mr-3 max-sm:hidden" onClick={() => setSerie('1')}>Ver por série</Botao>}>
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
          <Segmentado rotulo="Estado" valor={filtro} aoMudar={setFiltro} opcoes={ESTADOS_TABELA} className="max-sm:hidden" />
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger aria-label="Estado" className="w-full sm:hidden"><SelectValue /></SelectTrigger>
            <SelectContent>{ESTADOS_TABELA.map((f) => <SelectItem key={f.id} value={f.id}>{f.rotulo}</SelectItem>)}</SelectContent>
          </Select>
          <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar documento ou turma" className="sm:w-72" />
        </div>

        <TabelaGrade rotulo="O que a IA gerou e quem aprovou" colunas={colunas} grupos={[{ id: 'todos', linhas }]} chave={(r) => r.id}
          aoAbrir={(r) => setItem(r.id)} ativa={item} altura={56} vazio="Nada com esse estado ou essa busca."
          celular={(r) => ({ titulo: `${r.oQue} · ${r.detalhe}`, apoio: `${r.quando} · ${r.turma}${r.por ? ` · ${r.por}` : ''}`, fim: selo(r) })} />
        <p className="t-apoio flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-2.5"><span>Mostrando {linhas.length} dos {mes.gerou} de setembro.</span><FraseSemRanking /></p>
      </Secao>

      <PainelRegistro r={aberto} aoFechar={() => setItem(null)} />
      <PainelPorSerie serie={serie} aoFechar={() => setSerie(null)} />

      <PainelLado aberto={ver === 'como'} aoFechar={fecharComo} titulo="Como cada IA trabalha" largura={520} className="[&>header_button:focus-visible]:-outline-offset-3">
        <ComoCadaIATrabalha key={iaInicial ?? 'assistente'} inicial={iaInicial === 'tutor' || iaInicial === 'analista' ? iaInicial : 'assistente'} />
      </PainelLado>
    </div>
  )
}
