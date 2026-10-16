import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react'
import {
  Botao, Busca, CLASSE_CAMPO, CabecalhoPagina, CampoTexto, Cartao, Dialogo, DialogoConfirmar, EstadoVazio, GrupoToques, MenuMais, Pagina,
  Secao, Selo, SeloEstadoDocumento,
} from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { estadoDoDocumento } from '@/components/turmma/documento'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { HOJE, documentos, metadadosDe, tipoDocumento, useCriados, type ItemBiblioteca } from '@/dados/biblioteca'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { useEstadoEnvios } from '@/dados/envios'
import { tipoDeAgora } from '@/dados/ferramentas'
import { useProfessorAtual } from '@/dados/sessao'
import { turmaDaProfessora, useTurmasDoProfessor } from '@/dados/turmas-professora'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useParametro } from '@/components/turmma/tela'
import { limpa } from './_busca'

/* CRIADOS (/professor/criados), 14ª rodada (05/10/2026; plano ux-composicao, 3.7 e 5.2). Página de painel (a lista vai até a borda, como Ferramentas).
   · O cabeçalho de página: "Criados", e à direita os filtros Tipo · Turma · Estado (menus de 44 px) e a busca; no
     celular, a busca e um botão FILTRAR.
   · Os grupos por turma, em Secao ("2ºB · Química", com o número); cada linha tem 64 px: o ícone da ferramenta, o
     título, o tipo e o resumo no apoio ("Prova · 10 questões · Hoje"), e o selo SEMPRE à direita, centrado:
     PARA APROVAR · APROVADO (com "por Camila · 19/09" ao lado quando cabe) · RECUSADO · SÓ VOCÊ VÊ (plano, sequência
     e rubrica, que não vão à turma); a adaptada que espera ganha ADAPTADA ESPERA; o que veio de arquivo, DO ARQUIVO.
   · A linha abre a página do documento (com "‹ Criados"); o ⋯ tem Renomear · Apagar.
   · Só os documentos do professor da sessão, só as turmas da escola ativa. Professor novo: "Nada criado ainda". */

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const quando = ([d, m]: [number, number]) => (d === HOJE[0] && m === HOJE[1] ? 'Hoje' : `${d} de ${MESES[m - 1]}`)
/** O dia da aprovação ("21/09, 10h44" → [21, 9]) */
const diaDe = (rotulo?: string): [number, number] | undefined => {
  const m = rotulo?.match(/^(\d{1,2})\/(\d{1,2})/)
  return m ? [Number(m[1]), Number(m[2])] : undefined
}

type Estado = 'espera' | 'aprovado' | 'recusado' | 'so-voce'

const TIPOS: { id: string; nome: string; casa: (d: ItemBiblioteca) => boolean }[] = [
  { id: 'todos', nome: 'Todos os tipos', casa: () => true },
  { id: 'prova', nome: 'Prova e simulado', casa: (d) => ['prova', 'simulado'].includes(tipoDocumento(d)) },
  { id: 'atividade', nome: 'Atividade e lista', casa: (d) => tipoDeAgora(d.de) === 'atividade' },
  { id: 'plano', nome: 'Plano de aula', casa: (d) => tipoDeAgora(d.de) === 'plano' },
  { id: 'material', nome: 'Material', casa: (d) => tipoDocumento(d) === 'material' },
  { id: 'apresentacao', nome: 'Apresentação', casa: (d) => tipoDocumento(d) === 'apresentacao' },
  { id: 'redacao', nome: 'Redação e rubrica', casa: (d) => ['rubrica', 'redacao'].includes(tipoDocumento(d)) },
]
const ESTADOS: { id: 'todos' | Estado; nome: string; curto?: string }[] = [
  { id: 'todos', nome: 'Todos os estados' }, { id: 'espera', nome: 'Para aprovar' }, { id: 'aprovado', nome: 'Aprovado' },
  { id: 'so-voce', nome: 'Só você vê' }, { id: 'recusado', nome: 'Recusado' },
]

/** Um filtro: um menu de 44 px com o escolhido no gatilho. */
function Filtro({ rotulo, opcoes, valor, aoMudar, largura }: { rotulo: string; opcoes: { id: string; nome: string; curto?: string }[]; valor: string; aoMudar: (id: string) => void; largura: string }) {
  const atual = opcoes.find((o) => o.id === valor) ?? opcoes[0]
  return (
    <MenuMais alinhar="end" itens={opcoes.map((o) => ({
      rotulo: o.nome, aoEscolher: () => aoMudar(o.id), icone: <Check className={cn(valor === o.id ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />,
    }))} gatilho={(
      <button type="button" aria-label={`${rotulo}: ${atual.nome}`}
        className={cn(CLASSE_CAMPO, 'flex h-11 cursor-pointer items-center justify-between gap-2 text-left text-[15px] font-bold', largura, valor !== opcoes[0].id && 'border-azul-borda text-azul-texto')}>
        <span className="truncate">{valor === opcoes[0].id ? rotulo : atual.curto ?? atual.nome}</span>
        <ChevronDown className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />
      </button>
    )} />
  )
}

function LinhaCriado({ doc, estado, por, aprovadoEm, adaptadaEspera, voltar, aoRenomear, aoApagar }: {
  doc: ItemBiblioteca; estado: Estado; por?: string; aprovadoEm?: [number, number]; adaptadaEspera?: boolean; voltar: string; aoRenomear: () => void; aoApagar: () => void
}) {
  /* a data da aprovação, no mesmo formato da linha; some quando repete a data do apoio */
  const dia = aprovadoEm ?? doc.em
  const repete = dia[0] === doc.em[0] && dia[1] === doc.em[1]
  const meta = metadadosDe(doc)
  const de = tipoDeAgora(doc.de)
  return (
    <div className="group/linha flex min-h-16 items-center gap-2 border-t-2 border-borda pr-2 first:border-t-0 hover:bg-fundo-suave">
      <Link to={`/professor/criados/${doc.id}`} state={{ voltar }} className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-4">
        <IconeFerramenta id={de} className="size-10 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="t-cartao truncate text-tinta" title={doc.titulo}>{doc.titulo}</span>
          <span className="t-apoio truncate">{meta.tipo} · {meta.quantidade} · {quando(doc.em)}</span>
          {/* no celular, o selo desce para debaixo do título: o nome não some */}
          <span className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
            {doc.origem === 'arquivo' && <Selo>Do arquivo</Selo>}
            {adaptadaEspera && estado === 'aprovado' && <Selo familia="amarelo">Adaptada espera</Selo>}
            <SeloEstadoDocumento estado={estado} />
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 max-sm:hidden">
          {doc.origem === 'arquivo' && <Selo>Do arquivo</Selo>}
          {adaptadaEspera && estado === 'aprovado' && <Selo familia="amarelo">Adaptada espera</Selo>}
          {estado === 'aprovado' && por && <span className="mr-1 text-[14px] font-medium text-sutil max-lg:hidden">por {por.split(' ')[0]}{repete ? '' : ` · ${quando(dia).toLowerCase()}`}</span>}
          <SeloEstadoDocumento estado={estado} />
        </span>
      </Link>
      <MenuMais rotulo={`Mais opções de ${doc.titulo}`} itens={[
        { rotulo: 'Renomear', aoEscolher: aoRenomear },
        { rotulo: 'Apagar', perigo: true, aoEscolher: aoApagar },
      ]} />
    </div>
  )
}

export function Criados() {
  const navegar = useNavigate()
  const escola = useEscolaAtiva()
  const prof = useProfessorAtual()
  const celular = useIsMobile()
  const turmas = useTurmasDoProfessor(escola.id)
  const todos = useCriados()
  const vivos = useEstadoEnvios()
  /* os filtros e a busca moram no endereço: abrir um documento e voltar por "‹ Criados" mantém o que estava filtrado */
  const local = useLocation()
  const [buscaUrl, setBuscaUrl] = useParametro('q')
  const [tipoUrl, setTipo] = useParametro('tipo', 'todos')
  const [turmaUrl, setTurma] = useParametro('turma', 'todas')
  const [estadoUrl, setEstadoUrl] = useParametro('estado', 'todos')
  /* o campo tem estado próprio: amarrado direto ao ?q, a navegação do roteador atrasa e as teclas rápidas se perdiam.
     O ?q só é lido na montagem (para o "‹ Criados" restaurar a busca) e é atualizado um pouco depois de parar de digitar. */
  const [busca, setBusca] = useState(() => buscaUrl ?? '')
  const setBuscaUrlRef = useRef(setBuscaUrl)
  setBuscaUrlRef.current = setBuscaUrl
  useEffect(() => {
    const t = window.setTimeout(() => setBuscaUrlRef.current(busca || null), 250)
    return () => window.clearTimeout(t)
  }, [busca])
  const tipo = tipoUrl ?? 'todos'
  const turma = turmaUrl ?? 'todas'
  const estado = (ESTADOS.some((e) => e.id === estadoUrl) ? estadoUrl : 'todos') as 'todos' | Estado
  const setEstado = (v: 'todos' | Estado) => setEstadoUrl(v)
  const voltar = `${local.pathname}${local.search}`
  const [filtrando, setFiltrando] = useState(false)
  const [renomeando, setRenomeando] = useState<ItemBiblioteca | null>(null)
  const [nome, setNome] = useState('')
  const [apagando, setApagando] = useState<ItemBiblioteca | null>(null)

  const daEscola = useMemo(() => todos.filter((d) => (turmaDaProfessora(d.turmaId)?.escolaId ?? 'aurora') === escola.id), [todos, escola.id])
  /** O estado da linha é o da ORIGINAL: o vivo (envios) ou o de partida. A adaptada que espera ganha um selo à parte. */
  const estadoDa = (d: ItemBiblioteca): Estado => estadoDoDocumento(d, vivos.docs[d.id])
  const adaptadaEspera = (d: ItemBiblioteca) => vivos.docs[d.id]?.adaptada?.estado === 'espera'
  const q = limpa(busca.trim())
  const casaTipo = TIPOS.find((t) => t.id === tipo) ?? TIPOS[0]
  const itens = daEscola.filter((d) => (turma === 'todas' || d.turmaId === turma) && casaTipo.casa(d) && (estado === 'todos' || estadoDa(d) === estado || (estado === 'espera' && adaptadaEspera(d)))
    && (!q || limpa(`${d.titulo} ${metadadosDe(d).tipo}`).includes(q)))
  const grupos = [...new Set(itens.map((d) => d.turmaId))].map((t) => ({ t, itens: itens.filter((d) => d.turmaId === t) }))
  const vazio = daEscola.length === 0
  const filtros = (tipo !== 'todos' ? 1 : 0) + (turma !== 'todas' ? 1 : 0) + (estado !== 'todos' ? 1 : 0)

  const opcoesTurma = [{ id: 'todas', nome: 'Todas as turmas' }, ...turmas.map((t) => ({ id: t.id, nome: `${t.nome} · ${t.disciplina}` }))]
  const acoes = !vazio && (celular ? (
    <Botao variante="secundario" tamanho="m" icone={<SlidersHorizontal strokeWidth={2.5} />} onClick={() => setFiltrando(true)}>
      Filtrar{filtros ? ` (${filtros})` : ''}
    </Botao>
  ) : (
    <>
      <Filtro rotulo="Tipo" opcoes={TIPOS} valor={tipo} aoMudar={setTipo} largura="w-[148px]" />
      <Filtro rotulo="Turma" opcoes={opcoesTurma} valor={turma} aoMudar={setTurma} largura="w-[136px]" />
      <Filtro rotulo="Estado" opcoes={ESTADOS} valor={estado} aoMudar={(x) => setEstado(x as typeof estado)} largura="w-[164px]" />
      <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar" className="sm:w-[196px]" />
    </>
  ))

  return (
    /* Criados é uma lista larga, como Ferramentas e Turmas: a borda direita da lista é a das outras telas de painel */
    <Pagina tipo="painel" cabecalho={(
      <>
        <CabecalhoPagina titulo="Criados" acoes={acoes || undefined} />
        {!vazio && celular && <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar" className="mb-1" />}
      </>
    )}>
      {vazio && (
        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_2fr]">
          <span />
          <EstadoVazio ilustracao={<Onca pose="apontando" tamanho={120} />} titulo="Nada criado ainda"
            acao={<Botao variante="primario" onClick={() => navegar(`/professor/conversa/nova?ferramenta=prova${turmas[0] ? `&turma=${turmas[0].id}` : ''}`)}>Criar uma prova</Botao>} />
          <span />
        </div>
      )}
      {!vazio && grupos.length === 0 && (
        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_2fr]">
          <span />
          <EstadoVazio titulo={q ? 'Nada com esse nome' : 'Nada com esses filtros'}
            acao={(q || filtros > 0) ? (
              <span className="flex flex-wrap justify-center gap-2">
                {q && <Botao variante="secundario" tamanho="m" onClick={() => setBusca('')}>Limpar busca</Botao>}
                {filtros > 0 && <Botao variante="secundario" tamanho="m" onClick={() => { setTipo('todos'); setTurma('todas'); setEstado('todos') }}>Limpar filtros</Botao>}
              </span>
            ) : undefined} />
          <span />
        </div>
      )}
      <div className="grid gap-6">
        {grupos.map(({ t, itens: doGrupo }) => {
          const tp = turmas.find((x) => x.id === t) ?? turmaDaProfessora(t)
          return (
            <Secao key={t} titulo={[tp?.nome ?? t, tp?.disciplina].filter(Boolean).join(' · ')} n={doGrupo.length}>
              <Cartao semRespiro className="overflow-hidden">
                {doGrupo.map((d) => (
                  <LinhaCriado key={d.id} doc={d} estado={estadoDa(d)} por={vivos.docs[d.id]?.original?.por ?? prof.nome} aprovadoEm={diaDe(vivos.docs[d.id]?.original?.quando)}
                    adaptadaEspera={adaptadaEspera(d)} voltar={voltar}
                    aoRenomear={() => { setNome(d.titulo); setRenomeando(d) }} aoApagar={() => setApagando(d)} />
                ))}
              </Cartao>
            </Secao>
          )
        })}
      </div>

      <Dialogo aberto={filtrando} aoMudar={setFiltrando} titulo="Filtrar" largura={440}
        rodape={<Botao variante="oficial" tamanho="m" onClick={() => setFiltrando(false)}>Ver {itens.length} {itens.length === 1 ? 'documento' : 'documentos'}</Botao>}>
        <div className="grid gap-5">
          <GrupoToques rotulo="Tipo" opcoes={TIPOS.map((o) => ({ id: o.id, rotulo: o.nome }))} valor={tipo} aoMudar={(v) => setTipo(v as string)} />
          <GrupoToques rotulo="Turma" opcoes={opcoesTurma.map((o) => ({ id: o.id, rotulo: o.nome }))} valor={turma} aoMudar={(v) => setTurma(v as string)} />
          <GrupoToques rotulo="Estado" opcoes={ESTADOS.map((o) => ({ id: o.id, rotulo: o.nome }))} valor={estado} aoMudar={(v) => setEstado(v as typeof estado)} />
        </div>
      </Dialogo>
      <Dialogo aberto={!!renomeando} aoMudar={(v) => { if (!v) setRenomeando(null) }} titulo="Renomear" largura={440}
        rodape={(
          <>
            <Botao variante="secundario" tamanho="m" onClick={() => setRenomeando(null)}>Voltar</Botao>
            <Botao variante="oficial" tamanho="m" disabled={!nome.trim()} onClick={() => { if (renomeando) documentos.renomear(renomeando.id, nome); setRenomeando(null) }}>Salvar</Botao>
          </>
        )}>
        <CampoTexto rotulo="Nome" valor={nome} aoMudar={setNome} rotuloOculto
          onKeyDown={(e) => { if (e.key === 'Enter' && renomeando && nome.trim()) { documentos.renomear(renomeando.id, nome); setRenomeando(null) } }} />
      </Dialogo>
      <DialogoConfirmar aberto={!!apagando} aoMudar={(v) => { if (!v) setApagando(null) }} titulo="Apagar este documento?"
        frase="Ele sai de Criados. O que já foi enviado à turma continua com ela."
        confirmar={{ rotulo: 'Apagar', variante: 'perigoCheio', aoConfirmar: () => { if (apagando) documentos.apagar(apagando.id) } }} />
    </Pagina>
  )
}
