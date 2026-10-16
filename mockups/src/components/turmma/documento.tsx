import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Play, Printer, X as Xis } from 'lucide-react'
import {
  BlocoFixo, BlocoQuestao, Botao, CabecalhoDocumento, CabecalhoFolha, CampoTexto, CartoesResumo, Dialogo, DialogoConfirmar,
  EstadoVazio, FaixaResultados, Folha, GradeSlides, GrupoToques, Interruptor, LinhaDoTempo, MapaMental, MenuMais, MesaDocumento,
  Opcao, Pagina, Secao, Selo, SeloEstadoDocumento, SlideAberto, Sumario, TabelaRubrica, TabelaSequencia, familia as estiloFamilia,
  materiaDe, type Familia, type ItemMenuMais,
} from '@/components/duo'
import { DialogoAdaptar, type ResultadoAdaptar } from '@/components/turmma/adaptar'
import { AssinaturaIA } from '@/components/turmma/ia'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { useAlunosDaTurma } from '@/dados/acesso'
import {
  aulasDoPlano, conversaDoDocumento, documentos, estadoDe, estruturaDe, metadadosDe, questoesDoDocumento, rubricaDe, semanasDoPlano,
  slidesDe, tipoDocumento, useDocumentoBiblioteca, versoesDe, type Bloco, type ItemBiblioteca, type QuestaoDoc,
} from '@/dados/biblioteca'
import { acervo } from '@/dados/conversas'
import { escolaDe } from '@/dados/escola'
import { useAdaptacoes } from '@/dados/escola-estado'
import { envios, quandoFoi, useEnvios, useEstadoDocumento, useInfoDocumento, type EstadoDaVersao, type TipoDoc, type Versao } from '@/dados/envios'
import { useAgora } from '@/dados/demo/nucleo'
import { ADAPTACOES_REGISTRADAS, TIPOS_ADAPTACAO, VAI_PARA_TURMA, ferramenta, tipoDeAgora } from '@/dados/ferramentas'
import { proximaAulaDe } from '@/dados/grade'
import { useResultados, type Resultados } from '@/dados/resultados'
import { useProfessorAtual } from '@/dados/sessao'
import { turmaDaProfessora } from '@/dados/turmas-professora'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* O DOCUMENTO (14ª rodada, 05/10/2026; plano ux-composicao, seção 3), no modelo do Geekie One e do Plurall. O
   documento tem PÁGINA PRÓPRIA (/professor/criados/:id): ninguém mais o abre ao lado da conversa. Um esqueleto só
   para os 9 tipos, composto das peças de duo/documento.tsx:

   · CABEÇALHO (CabecalhoDocumento): ‹ Conversa | Início | Criados · o ícone da ferramenta · o título, que se edita no
     lugar · o SELO do estado (PARA APROVAR · APROVADO, com quem e quando · RECUSADO · SÓ VOCÊ VÊ, para o que não vai à
     turma) · à direita IMPRIMIR (contorno), o ⋯ e o ÚNICO botão cheio, APROVAR E ENVIAR AO 2ºB (AOS 3 ALUNOS na
     adaptada), que só existe onde a prévia está à vista e sai depois de aprovado (regra 70) · a linha de dados.
   · ABAS (prova, atividade, lista e simulado): QUESTÕES (n) · ADAPTADA (n alunos, só se existir) · RESULTADOS (só
     depois de enviado). O gabarito é um INTERRUPTOR na ponta da linha das abas (modo de ver, não aba); na adaptada,
     o interruptor é Lado a lado (ligado a partir de 1280 px).
   · MESA e FOLHA: o sumário de 200 à esquerda (bolinhas na prova; seções nos outros), a folha de 760 no centro.
   · Uma vista por tipo (3.4): prova e lista com o cabeçalho de prova e a questão como unidade (a página do livro é
     metadado, nunca o meio do enunciado); plano como linha do tempo das aulas, com Para casa · Recursos · Como
     avaliar; bimestre em tabela por semana; material com intertítulos e texto de leitura; mapa mental como
     diagrama; apresentação em grade de slides, com o slide aberto e as notas; rubrica com o total.
   · ENVIAR em dois passos (Plurall), no diálogo de 520: Para quem → CONTINUAR → Quando e a prévia → APROVAR E ENVIAR.
   · RESULTADOS (dados/resultados.ts): a faixa de 5 números com o "quem" embaixo, por questão (barra na cor da matéria,
     sem vermelho de ruim) e por aluno (a 1ª linha é a média da turma).
   · A 375: o cabeçalho em linhas, as abas roláveis, a folha sem borda e sem mesa, e a ação cheia na barra presa
     embaixo, com o ⋯ ao lado (IMPRIMIR vai para o ⋯). */

const LETRAS = 'ABCDE'
const MOTIVOS = ['Tem erro de conteúdo', 'Não é o que pedi', 'Mudou o que é cobrado', 'Outro motivo']
const ROTULO_NIVEL: Record<string, string> = { fácil: 'fácil', médio: 'médio', difícil: 'difícil' }

/** O tipo do envio, para a tarefa do aluno. */
function tipoDoEnvio(doc: ItemBiblioteca): TipoDoc {
  const de = tipoDeAgora(doc.de)
  if (de === 'prova' || de === 'simulado') return 'prova'
  if (de === 'atividade') return /^lista/i.test(doc.titulo) ? 'lista' : 'atividade'
  if (de === 'apresentacao') return 'apresentacao'
  if (de === 'plano') return 'plano'
  return 'material'
}

/** "Daniela Rocha, Heitor Alves e Nicolas Dias" */
const emLista = (nomes: string[]) => (nomes.length <= 1 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`)

/** A largura da janela passou de `px`? */
function useLargura(px: number) {
  const consulta = `(min-width: ${px}px)`
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches)
  useEffect(() => {
    const m = window.matchMedia(consulta)
    const muda = () => setOk(m.matches)
    m.addEventListener('change', muda)
    return () => m.removeEventListener('change', muda)
  }, [consulta])
  return ok
}

/** O texto com a página do livro no fim ("… (p. 138)"): a página sai do meio da frase e vira metadado. */
function semPagina(x: string): { texto: string; pagina?: string } {
  const m = x.match(/\s*\((p\.\s*\d+(?:\s*e\s*\d+)?)\)\s*\.?\s*$/i)
  return m ? { texto: x.slice(0, m.index).replace(/\s+$/, '') + (x.trim().endsWith('.') && !x.slice(0, m.index).trim().endsWith('.') ? '.' : ''), pagina: m[1] } : { texto: x }
}

/* ── As questões ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** "C = 12" não se parte no fim da linha */
const juntos = (x: string) => x.replace(/ = /g, '\u00A0=\u00A0').replace(/(\d) (g|mol|L|kg|t|mL|u)\b/g, '$1\u00A0$2')

function Enunciado({ x }: { x: string }) {
  return <p className="whitespace-pre-line">{juntos(x)}</p>
}

/** Uma questão na folha. `adaptada`: o enunciado direto e a letra ampliada (com os tipos escolhidos no Adaptar). */
function Questao({ q, gabarito, tipos, prefixo, abertas, misto }: { q: QuestaoDoc; gabarito: boolean; tipos?: string[]; prefixo: string; abertas?: number; misto?: boolean }) {
  const direto = !!tipos?.includes('direto') && !!q.direta
  const ampliada = !!tipos?.includes('fonte')
  /* o tipo (OBJETIVA · ABERTA) só aparece quando a folha mistura os dois: num simulado todo objetivo, era ruído */
  const meta = [misto ? (q.alternativas ? 'Objetiva' : 'Aberta') : undefined, q.habilidade, q.pagina ? `p. ${q.pagina}` : undefined, q.nivel ? ROTULO_NIVEL[q.nivel] : undefined].filter((x): x is string => !!x)
  const resolucao = q.resolucao ?? (q.certa !== undefined && q.alternativas ? `Resposta: ${LETRAS[q.certa].toLowerCase()}.` : undefined)
  return (
    <BlocoQuestao n={q.n} id={`${prefixo}-${q.n}`} ampliada={ampliada}
      enunciado={<Enunciado x={direto ? q.direta!.x : q.enunciado} />}
      pergunta={direto ? q.direta!.pergunta : q.pergunta}
      dados={direto ? (q.direta!.dados ? `Dados: ${q.direta!.dados}` : undefined) : q.dados}
      alternativas={q.alternativas} certa={q.certa} gabarito={gabarito} resolucao={resolucao}
      meta={meta} linhasResposta={q.alternativas ? undefined : abertas ?? 4} />
  )
}

/** A folha mistura questões objetivas e abertas? */
const ehMisto = (qs: QuestaoDoc[]) => qs.some((q) => q.alternativas) && qs.some((q) => !q.alternativas)

/** O valor da prova: a soma dos pontos que as instruções dizem ("1,25 ponto cada"); sem isso, 1 ponto por questão. */
function valorDa(nq: number, instrucoes: string[]) {
  const m = instrucoes.join(' ').match(/(\d+(?:,\d+)?)\s*ponto/i)
  const total = nq * (m ? parseFloat(m[1].replace(',', '.')) : 1)
  return total.toFixed(1).replace('.', ',')
}

/** O cabeçalho da folha de prova, lista e simulado. */
function CabecalhoDaFolha({ doc, adaptada, tipos }: { doc: ItemBiblioteca; adaptada?: boolean; tipos?: string[] }) {
  const meta = metadadosDe(doc)
  const t = tipoDocumento(doc)
  const escola = escolaDe(turmaDaProfessora(doc.turmaId)?.escolaId ?? 'aurora').nome
  const instrucoes = doc.blocos.filter((b): b is Extract<Bloco, { t: 'nota' }> => b.t === 'nota').map((b) => b.x)
  const nq = questoesDoDocumento(doc).length
  return (
    <>
      <h2 className="t-secao mb-1 text-tinta">{doc.folha ?? doc.titulo}</h2>
      <CabecalhoFolha escola={escola} disciplina={meta.materia ?? ''} turma={doc.turma}
        area={t === 'simulado' ? 'Ciências da Natureza · formato ENEM' : undefined}
        valor={t === 'prova' ? valorDa(nq, instrucoes) : undefined}
        tempo={adaptada && tipos?.includes('tempo') ? 'Tempo: o da turma + 50%' : undefined}
        instrucoes={instrucoes} />
    </>
  )
}

/* ── O plano, a sequência e o material ───────────────────────────────────────────────────────────────────────── */

function Habilidades({ doc }: { doc: ItemBiblioteca }) {
  const e = estruturaDe(doc)
  const cartoes = [
    ...(e.objetivos?.length ? [{ titulo: 'Objetivos', itens: e.objetivos }] : []),
    ...(e.habilidades?.length ? [{ titulo: 'Habilidades BNCC', itens: e.habilidades.map((h) => <span key={h.codigo}><b className="font-bold">{h.codigo}</b> · {h.texto}</span>) }] : []),
  ]
  if (!cartoes.length) return null
  return <div id="objetivos" className="scroll-mt-6"><CartoesResumo cartoes={cartoes} /></div>
}

function BlocosFixos({ doc }: { doc: ItemBiblioteca }) {
  const e = estruturaDe(doc)
  return (
    <div className="mt-8">
      {e.depois && <BlocoFixo id="depois" rotulo="Depois">{e.depois}</BlocoFixo>}
      {e.paraCasa && <BlocoFixo id="para-casa" rotulo="Para casa">{e.paraCasa}</BlocoFixo>}
      {e.recursos && <BlocoFixo id="recursos" rotulo="Recursos">{e.recursos}</BlocoFixo>}
      {e.avaliar && <BlocoFixo id="como-avaliar" rotulo="Como avaliar">{e.avaliar}</BlocoFixo>}
    </div>
  )
}

function itensFixos(doc: ItemBiblioteca) {
  const e = estruturaDe(doc)
  return [
    ...(e.depois ? [{ id: 'depois', rotulo: 'Depois' }] : []),
    ...(e.paraCasa ? [{ id: 'para-casa', rotulo: 'Para casa' }] : []),
    ...(e.recursos ? [{ id: 'recursos', rotulo: 'Recursos' }] : []),
    ...(e.avaliar ? [{ id: 'como-avaliar', rotulo: 'Como avaliar' }] : []),
  ]
}

const familiaDa = (doc: ItemBiblioteca): Familia => materiaDe(turmaDaProfessora(doc.turmaId)?.disciplina)?.familia ?? 'turquesa'

/** A linha do tempo das aulas (plano, sequência de aulas, recuperação). */
function CorpoPlano({ doc }: { doc: ItemBiblioteca }) {
  const aulas = aulasDoPlano(doc)
  return (
    <>
      <Habilidades doc={doc} />
      <LinhaDoTempo familia={familiaDa(doc)} aulas={aulas.map((a) => ({
        id: a.id, titulo: a.titulo, duracao: a.duracao ? `${a.duracao} min` : undefined,
        momentos: a.momentos.map((m) => ({ minutos: m.minutos ? `${m.minutos} min` : undefined, nome: m.nome, texto: m.texto, pagina: m.pagina, pratique: m.pratique })),
      }))} />
      <BlocosFixos doc={doc} />
    </>
  )
}

/** O bimestre: a tabela agrupada por semana, a prova e o "sem aula" em selo. */
function CorpoBimestre({ doc }: { doc: ItemBiblioteca }) {
  const semanas = semanasDoPlano(doc)
  return (
    <>
      <Habilidades doc={doc} />
      <section id="aulas" className="scroll-mt-6 md:[&>div]:overflow-visible md:[&_thead]:sticky md:[&_thead]:top-0 md:[&_thead]:z-[1] [&_thead_th]:bg-white md:[&_thead_th]:h-11 md:[&_thead_th]:pb-2 md:[&_thead_th]:shadow-[inset_0_-2px_0_var(--color-borda)]">
        <TabelaSequencia
          colunas={[{ nome: 'Data', largura: '72px' }, { nome: 'Dia', largura: '56px' }, { nome: 'Conteúdo' }, { nome: 'Habilidade', largura: '120px' }, { nome: 'Pág.', largura: '56px' }]}
          grupos={semanas.map((s) => ({
            titulo: s.titulo,
            linhas: s.linhas.map((l) => ({
              celulas: [l.data, l.dia, l.conteudo, l.habilidade ?? '—', l.pagina ?? '—'],
              selo: l.selo === 'prova' ? <Selo familia="amarelo" tamanho="p">Prova</Selo> : l.selo === 'sem-aula' ? <Selo tamanho="p">Sem aula</Selo> : undefined,
            })),
          }))} />
      </section>
      <BlocosFixos doc={doc} />
    </>
  )
}

type Secao = { id: string; titulo: string; blocos: Bloco[] }
/** O material em seções: cada intertítulo abre uma. */
function secoesDo(doc: ItemBiblioteca): Secao[] {
  const s: Secao[] = []
  for (const b of doc.blocos) {
    if (b.t === 'identificacao') continue
    if (b.t === 'sub') { s.push({ id: `secao-${s.length + 1}`, titulo: b.x, blocos: [] }); continue }
    if (b.t === 'caixa') { s.push({ id: `secao-${s.length + 1}`, titulo: b.rotulo, blocos: [b] }); continue }
    if (!s.length) s.push({ id: 'secao-1', titulo: '', blocos: [] })
    s[s.length - 1].blocos.push(b)
  }
  return s
}

const PAGINA_META = 'ml-1.5 whitespace-nowrap text-[13px] font-bold uppercase tracking-[.04em] text-sutil'

/** O texto de leitura: intertítulos em 20/700, o texto em 17/500 com entrelinha 1,6; a página no fim do parágrafo. */
function CorpoMaterial({ doc }: { doc: ItemBiblioteca }) {
  const revisao = /folha de revis/i.test(doc.titulo)
  const qs = questoesDoDocumento(doc)
  return (
    <div className="grid gap-8">
      {revisao && <CabecalhoDaFolha doc={doc} />}
      {secoesDo(doc).map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-6">
          {s.titulo && s.blocos[0]?.t !== 'caixa' && <h2 className="mb-3 text-[20px] font-bold leading-[26px] text-tinta">{s.titulo}</h2>}
          <div className="grid gap-4">
            {s.blocos.map((b, i) => {
              if (b.t === 'p') { const { texto, pagina } = semPagina(b.x); return <p key={i} className="max-w-[68ch]">{texto}{pagina && <span className={PAGINA_META}>{pagina}</span>}</p> }
              if (b.t === 'item') return (
                <p key={i} className="flex max-w-[68ch] gap-3"><span className="w-5 shrink-0 font-bold tabular-nums text-sutil">{b.marca === 'ponto' ? '•' : b.marca === 'caixa' ? '☐' : `${b.marca}.`}</span><span>{b.x}</span></p>
              )
              if (b.t === 'caixa') return (
                <div key={i} className={cn('rounded-[12px] border-2 px-5 py-4', b.rotulo === 'Exemplo resolvido' ? 'border-azul-borda bg-azul-claro' : 'border-borda bg-fundo-suave')}>
                  <p className={cn('t-selo', b.rotulo === 'Exemplo resolvido' ? 'text-azul-texto' : 'text-sutil')}>{b.rotulo}</p>
                  <p className="mt-1.5">{b.x}</p>
                  {b.fonte && <p className="mt-2 text-[13px] font-bold uppercase tracking-[.04em] text-sutil">{b.fonte}</p>}
                </div>
              )
              if (b.t === 'questao') { const q = qs.find((x) => x.n === b.n); return q ? <Questao key={i} q={q} gabarito={false} prefixo="q" abertas={3} misto={ehMisto(qs)} /> : null }
              if (b.t === 'nota') return <p key={i} className="text-[15px] leading-[22px] text-apoio">{b.x}</p>
              return null
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

/** A proposta de redação: o tema em destaque, os textos motivadores numerados, a proposta e as instruções. */
function CorpoRedacao({ doc }: { doc: ItemBiblioteca }) {
  const tema = doc.blocos.find((b): b is Extract<Bloco, { t: 'destaque' }> => b.t === 'destaque')?.x.replace(/^Tema:\s*/, '')
  const textos = doc.blocos.filter((b): b is Extract<Bloco, { t: 'caixa' }> => b.t === 'caixa')
  const proposta = doc.blocos.filter((b): b is Extract<Bloco, { t: 'p' }> => b.t === 'p')
  const notas = doc.blocos.filter((b): b is Extract<Bloco, { t: 'nota' }> => b.t === 'nota')
  return (
    <div className="grid gap-8">
      {tema && (
        <section id="tema" className="scroll-mt-6 rounded-[12px] border-2 border-borda bg-fundo-suave px-5 py-4">
          <p className="t-selo text-sutil">Tema</p>
          <p className="mt-1 text-[20px] font-bold leading-[28px] text-tinta">{tema}</p>
        </section>
      )}
      <section id="textos" className="scroll-mt-6 grid gap-4">
        <h2 className="text-[20px] font-bold leading-[26px] text-tinta">Textos motivadores</h2>
        {textos.map((t) => (
          <div key={t.rotulo} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-t-2 border-borda pt-4 first-of-type:border-t-0 first-of-type:pt-0">
            <p className="t-selo pt-1 text-sutil">{t.rotulo}</p>
            <div><p>{t.x}</p>{t.fonte && <p className="mt-1.5 text-[13px] font-bold uppercase tracking-[.04em] text-sutil">{t.fonte}</p>}</div>
          </div>
        ))}
      </section>
      <section id="proposta" className="scroll-mt-6 grid gap-3">
        <h2 className="text-[20px] font-bold leading-[26px] text-tinta">Proposta</h2>
        {proposta.map((p) => <p key={p.x} className="max-w-[68ch]">{p.x}</p>)}
        {notas.map((n) => <p key={n.x} className="rounded-[12px] bg-fundo-suave px-4 py-3 text-[15px] leading-[22px] text-apoio">{n.x}</p>)}
      </section>
    </div>
  )
}

/* ── Os resultados ───────────────────────────────────────────────────────────────────────────────────────────── */

function VistaResultados({ doc, res, qs }: { doc: ItemBiblioteca; res: Resultados; qs: QuestaoDoc[] }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const fam = familiaDa(doc)
  const envio = res.envio
  const nada = res.responderam === 0
  const itens = [
    { rotulo: 'Receberam', valor: String(res.receberam), apoio: envio?.quando === 'proxima' && envio.abre ? `abre ${envio.abre.rotulo}` : envio && Array.isArray(envio.para) ? 'os escolhidos' : 'a turma toda' },
    { rotulo: 'Abriram', valor: String(res.abriram), apoio: res.abriram === 0 ? 'nenhum abriu' : res.receberam - res.abriram > 0 ? `${res.receberam - res.abriram} não ${res.receberam - res.abriram === 1 ? 'abriu' : 'abriram'}` : 'todos abriram' },
    { rotulo: 'Responderam', valor: String(res.responderam), apoio: res.faltam > 0 ? `${res.faltam === 1 ? 'falta' : 'faltam'} ${res.faltam}` : 'todos responderam' },
    { rotulo: 'Falta corrigir', valor: String(res.faltaCorrigir), apoio: res.faltaCorrigir > 0 ? 'esperam aprovação' : nada ? 'nada entregue' : 'tudo corrigido' },
    { rotulo: 'Acerto médio', valor: res.acerto === null ? '—' : `${res.acerto}%`, apoio: nada ? 'sem respostas' : res.aprovadas ? 'notas aprovadas' : 'falta aprovar' },
  ]
  const marca = (m: 'certa' | 'errada' | null) => m === 'certa'
    ? <Check aria-label="certa" className="mx-auto size-4 text-verde-texto" strokeWidth={3.5} />
    : m === 'errada' ? <Xis aria-label="errada" className="mx-auto size-4 text-sutil" strokeWidth={3} /> : <span aria-label="não fez" className="text-apagado">—</span>
  return (
    <div className="grid w-full max-w-[1080px] gap-8">
      <FaixaResultados itens={itens} />
      {nada ? (
        <div className="rounded-[16px] border-2 border-borda bg-white px-6 py-8 text-center">
          <p className="t-cartao text-tinta">Ninguém respondeu ainda</p>
          <p className="t-apoio mx-auto mt-1 max-w-[52ch]">{res.receberam} {res.receberam === 1 ? 'aluno recebeu' : 'alunos receberam'}. As respostas aparecem aqui conforme chegam, por questão e por aluno.</p>
        </div>
      ) : (
        <>
          <Secao titulo="Por questão" apoio="Clique numa questão para ver o enunciado e como a turma foi.">
            <ol className="overflow-hidden rounded-[16px] border-2 border-borda bg-white" style={estiloFamilia(fam)}>
              {res.questoes.map((q, i) => {
                const qd = qs[i]
                const aberto = aberta === q.n
                return (
                  <li key={q.n} className="border-t-2 border-borda first:border-t-0">
                    <button type="button" aria-expanded={aberto} onClick={() => setAberta(aberto ? null : q.n)}
                      className="grid min-h-12 w-full grid-cols-[minmax(0,240px)_minmax(0,1fr)_56px_24px] items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-fundo-suave max-sm:grid-cols-[minmax(0,1fr)_72px_48px_20px]">
                      <span className="flex min-w-0 items-baseline gap-2 text-[15px] font-bold text-tinta">
                        <span className="w-6 shrink-0 tabular-nums">{q.n}</span>
                        {qd?.tema && <span className="truncate font-medium text-apoio">{qd.tema}</span>}
                      </span>
                      <span className="relative h-3 overflow-hidden rounded-full bg-fundo-suave">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-(--face)" style={{ width: `${q.acerto ?? 0}%` }} />
                      </span>
                      <span className="text-right text-[15px] font-bold tabular-nums text-tinta">{q.acerto === null ? '—' : `${q.acerto}%`}</span>
                      <ChevronDown aria-hidden className={cn('size-4 text-sutil transition-transform', aberto && 'rotate-180')} strokeWidth={3} />
                    </button>
                    {aberto && qd && (
                      <div className="grid gap-3 border-t-2 border-borda bg-fundo-suave px-4 py-4 md:pl-[68px]">
                        <p className="text-[15px] leading-[22px] text-tinta">{qd.enunciado}</p>
                        {qd.alternativas ? (
                          <ul className="grid gap-2">
                            {qd.alternativas.map((a, j) => {
                              const certa = q.certa === j
                              return (
                                <li key={j} className="grid grid-cols-[28px_minmax(0,1fr)_minmax(80px,200px)_48px] items-center gap-3 text-[15px]">
                                  <span className={cn('grid size-7 place-items-center rounded-full border-2 text-[13px] font-bold', certa ? 'border-verde-degrau bg-verde text-sobre-cor' : 'border-borda-forte text-apoio')}>{LETRAS[j]}</span>
                                  <span className={cn('min-w-0 truncate', certa ? 'font-bold text-verde-texto' : 'text-tinta')}>{a}{certa && ' ✓'}</span>
                                  <span className="relative h-2.5 overflow-hidden rounded-full bg-white"><span className={cn('absolute inset-y-0 left-0 rounded-full', certa ? 'bg-verde' : 'bg-borda-forte')} style={{ width: `${q.marcacoes[j] ?? 0}%` }} /></span>
                                  <span className="text-right font-bold tabular-nums text-apoio">{q.marcacoes[j] ?? 0}%</span>
                                </li>
                              )
                            })}
                          </ul>
                        ) : <p className="t-apoio">Questão aberta: {q.acerto ?? 0}% resolveram certo{qd.resolucao ? `. ${qd.resolucao}` : '.'}</p>}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </Secao>
          <Secao titulo="Por aluno" apoio="Em ordem alfabética. ✓ certa · × errada · — não fez.">
            {/* o cabeçalho (ALUNO · 1…8 · ACERTOS) e a Média da turma ficam presos no topo da mesa ao rolar: sem
                overflow que prenda a rolagem (overflow-clip guarda os cantos); no celular a tabela rola de lado */}
            <div className="rounded-[16px] border-2 border-borda bg-white max-md:overflow-x-auto md:overflow-clip">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[15px]">
                <thead className="md:sticky md:top-0 md:z-[2]">
                  <tr className="h-10 bg-fundo-suave">
                    <th scope="col" className="t-selo sticky left-0 z-[1] bg-fundo-suave px-4 text-left text-sutil">Aluno</th>
                    {res.questoes.map((q) => <th key={q.n} scope="col" className="t-selo w-10 bg-fundo-suave text-center tabular-nums text-sutil">{q.n}</th>)}
                    <th scope="col" className="t-selo w-24 bg-fundo-suave px-4 text-right text-sutil">Acertos</th>
                  </tr>
                  <tr className="h-10 bg-fundo-suave">
                    <th scope="row" className="sticky left-0 z-[1] border-y-2 border-borda bg-fundo-suave px-4 text-left font-bold text-tinta">Média da turma</th>
                    {res.questoes.map((q) => <td key={q.n} className="border-y-2 border-borda bg-fundo-suave text-center text-[13px] font-bold tabular-nums text-apoio">{q.acerto ?? '—'}</td>)}
                    <td className="border-y-2 border-borda bg-fundo-suave px-4 text-right font-bold tabular-nums text-tinta">{res.acerto === null ? '—' : `${res.acerto}%`}</td>
                  </tr>
                </thead>
                <tbody>
                  {res.alunos.map((a, i) => (
                    <tr key={a.id} className={cn('h-10', i > 0 && '[&>*]:border-t-2 [&>*]:border-borda')}>
                      <th scope="row" className="sticky left-0 z-[1] bg-white px-4 text-left font-medium">
                        <Link to={`/professor/turmas/${doc.turmaId}?aba=alunos&aluno=${a.id}`} className="text-tinta hover:underline">{a.nome}</Link>
                      </th>
                      {a.marcas.map((m, i) => <td key={i} className="text-center">{marca(m)}</td>)}
                      <td className="px-4 text-right font-bold tabular-nums text-apoio">{a.acertos === null ? '—' : `${a.acertos} de ${res.total}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Secao>
        </>
      )}
    </div>
  )
}

/* ── Os diálogos ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** Aprovar e enviar em dois passos (Plurall): 1. Para quem → CONTINUAR → 2. Quando, com a prévia → APROVAR E ENVIAR. */
function DialogoEnviar({ aberto, aoMudar, turmaId, turma, adaptada, nomesAdaptacao, adaptadaDaTurma, comNota, aoEnviar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; turmaId: string; turma: string
  adaptada: boolean; nomesAdaptacao: string[]
  /** na original: a versão adaptada dos alunos com adaptação (o estado dela) */
  adaptadaDaTurma?: { n: number; aprovada: boolean }
  comNota: boolean
  aoEnviar: (o: { quando: 'agora' | 'proxima'; para: 'turma' | string[] }) => void
}) {
  const todos = useAlunosDaTurma(turmaId)
  const naTurma = todos.filter((a) => a.situacao === 'na-turma')
  const total = todos.length || turmaDaProfessora(turmaId)?.alunos || 0
  const faltam = todos.length - naTurma.length
  const proxima = proximaAulaDe(turmaId)
  const [passo, setPasso] = useState<1 | 2>(1)
  const [quando, setQuando] = useState<'agora' | 'proxima'>('agora')
  const [para, setPara] = useState<'turma' | 'escolher'>('turma')
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  useEffect(() => { if (aberto) { setPasso(1); setQuando('agora') } }, [aberto])
  const pronto = adaptada || para === 'turma' || escolhidos.length > 0
  const alterna = (nome: string) => setEscolhidos((l) => (l.includes(nome) ? l.filter((x) => x !== nome) : [...l, nome]))
  const n = adaptada ? nomesAdaptacao.length : para === 'turma' ? total : escolhidos.length
  const quem = adaptada ? (n === 1 ? nomesAdaptacao[0] : `aos ${n} alunos`) : para === 'turma' ? `ao ${turma}` : `a ${n} ${n === 1 ? 'aluno' : 'alunos'} do ${turma}`
  const quandoTexto = quando === 'agora' ? 'agora' : proxima?.rotulo ?? 'na próxima aula'
  const titulo = adaptada ? (nomesAdaptacao.length === 1 ? `Enviar a ${nomesAdaptacao[0]}` : `Enviar aos ${nomesAdaptacao.length} alunos`) : `Enviar ao ${turma}`
  return (
    /* preso no topo (não centrado): ao CONTINUAR, o passo 2 cresce para baixo e a janela não pula */
    <Dialogo aberto={aberto} aoMudar={aoMudar} largura={520} titulo={titulo} descricao="Para quem vai e quando chega." className="sm:top-[14vh] sm:translate-y-0"
      rodape={passo === 1 ? (
        <>
          <Botao variante="secundario" tamanho="m" onClick={() => aoMudar(false)}>Cancelar</Botao>
          <Botao variante="oficial" tamanho="m" disabled={!pronto} onClick={() => setPasso(2)}>Continuar</Botao>
        </>
      ) : (
        <>
          <Botao variante="secundario" tamanho="m" onClick={() => setPasso(1)}>Voltar</Botao>
          <Botao variante="oficial" tamanho="m" onClick={() => { aoEnviar({ quando, para: adaptada || para === 'turma' ? 'turma' : escolhidos }); aoMudar(false) }}>Aprovar e enviar</Botao>
        </>
      )}>
      <div className="grid gap-5">
        <p className="t-selo text-sutil">Passo {passo} de 2 · {passo === 1 ? 'Para quem' : 'Quando'}</p>
        {passo === 1 ? (
          adaptada ? (
            <div className="rounded-[12px] border-2 border-borda px-4 py-3">
              <p className="t-cartao text-tinta">{nomesAdaptacao.length === 1 ? 'O aluno escolhido no Adaptar' : `Os ${nomesAdaptacao.length} alunos escolhidos no Adaptar`}</p>
              <p className="t-apoio mt-0.5">{emLista(nomesAdaptacao)}</p>
            </div>
          ) : (
            <fieldset className="grid gap-2">
              <legend className="sr-only">Para quem</legend>
              <Opcao nome="para" valor="turma" marcado={para === 'turma'} aoMudar={(v) => { if (v) setPara('turma') }}>
                <span className="flex min-w-0 flex-col">
                  <span>A turma toda ({total})</span>
                  {faltam > 0 && <span className="t-apoio font-medium">{naTurma.length} já entraram; {faltam === 1 ? 'quem falta recebe' : `os outros ${faltam} recebem`} ao entrar</span>}
                </span>
              </Opcao>
              <Opcao nome="para" valor="escolher" marcado={para === 'escolher'} aoMudar={(v) => { if (v) setPara('escolher') }}>Escolher alunos</Opcao>
              {para === 'escolher' && (
                <ul className="mt-1 grid max-h-56 grid-cols-1 gap-x-4 overflow-y-auto rounded-[12px] border-2 border-borda px-3 py-2 min-[480px]:grid-cols-2" aria-label="Alunos">
                  {naTurma.map((a) => (
                    <li key={a.id}>
                      <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] font-medium text-tinta">
                        <input type="checkbox" checked={escolhidos.includes(a.nome)} onChange={() => alterna(a.nome)} className="size-5 accent-[var(--color-azul)]" />
                        <span className="truncate">{a.nome}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
          )
        ) : (
          <>
            <fieldset className="grid gap-2">
              <legend className="sr-only">Quando</legend>
              <Opcao nome="quando" valor="agora" marcado={quando === 'agora'} aoMudar={(v) => { if (v) setQuando('agora') }}>Agora</Opcao>
              <Opcao nome="quando" valor="proxima" marcado={quando === 'proxima'} disabled={!proxima} aoMudar={(v) => { if (v) setQuando('proxima') }}>
                Na próxima aula{proxima ? `: ${proxima.rotulo}` : ''}
              </Opcao>
            </fieldset>
            <div className="rounded-[12px] border-2 border-borda bg-fundo-suave px-4 py-3">
              <p className="t-selo text-sutil">Prévia</p>
              <p className="mt-1 text-[16px] font-medium leading-[23px] text-tinta">
                Chega {quem} {quandoTexto}{!adaptada && para === 'turma' ? `: ${total} alunos` : ''}.
                {/* o que o envio faz de fato: a turma toda recebe esta versão agora; os alunos com adaptação recebem
                    também a adaptada (que toma o lugar desta) quando ela estiver aprovada */}
                {adaptadaDaTurma && adaptadaDaTurma.n > 0 && para === 'turma' && (adaptadaDaTurma.aprovada
                  ? ` Os ${adaptadaDaTurma.n} com adaptação recebem a versão adaptada.`
                  : ` Os ${adaptadaDaTurma.n} com adaptação recebem esta agora e a versão adaptada quando você aprovar a aba Adaptada.`)}
                {comNota && ' A nota só aparece depois que você aprovar.'}
              </p>
            </div>
          </>
        )}
      </div>
    </Dialogo>
  )
}

function DialogoSobre({ doc, turma, aberto, aoMudar }: { doc: ItemBiblioteca; turma: string; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const meta = metadadosDe(doc)
  const e = estruturaDe(doc)
  const proxima = proximaAulaDe(doc.turmaId)
  const habs = e.habilidades?.map((h) => h.codigo) ?? [...new Set(questoesDoDocumento(doc).map((q) => q.habilidade).filter(Boolean))]
  const linhas: [string, ReactNode][] = [
    ['Turma', `${turma}${meta.materia ? ` · ${meta.materia}` : ''}`],
    ...(meta.capitulo ? [['Material', meta.capitulo] as [string, ReactNode]] : []),
    ...(habs.length ? [['BNCC', habs.join(' · ')] as [string, ReactNode]] : []),
    ['Aula ligada', proxima ? `${proxima.rotulo.charAt(0).toUpperCase()}${proxima.rotulo.slice(1)}` : 'Nenhuma'],
    ['Feito por', doc.origem === 'arquivo' ? 'Arquivo que você anexou' : <AssinaturaIA key="a" id="assistente" />],
    ['Criado em', `${String(doc.em[0]).padStart(2, '0')}/${String(doc.em[1]).padStart(2, '0')}${ferramenta(tipoDeAgora(doc.de)) ? ` pela ferramenta ${ferramenta(tipoDeAgora(doc.de))!.nome}` : ''}`],
  ]
  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} largura={460} titulo="Sobre este documento">
      <dl className="grid gap-3">
        {linhas.map(([r, v]) => (
          <div key={r} className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3">
            <dt className="t-selo text-sutil">{r}</dt><dd className="text-[16px] font-medium text-tinta">{v}</dd>
          </div>
        ))}
      </dl>
    </Dialogo>
  )
}

function DialogoRecusar({ aberto, aoMudar, adaptada, aoRecusar }: { aberto: boolean; aoMudar: (v: boolean) => void; adaptada: boolean; aoRecusar: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  return (
    <DialogoConfirmar aberto={aberto} aoMudar={aoMudar} titulo={adaptada ? 'Recusar a versão adaptada' : 'Recusar com motivo'}
      frase="Nada chega à turma. O motivo fica registrado."
      confirmar={{ rotulo: 'Recusar', variante: 'perigoCheio', desligado: !motivo, aoConfirmar: () => aoRecusar([motivo, texto.trim()].filter(Boolean).join(': ')) }}>
      <GrupoToques rotulo="Motivo" opcoes={MOTIVOS.map((m) => ({ id: m, rotulo: m }))} valor={motivo} aoMudar={(v) => setMotivo(v as string)} />
      <CampoTexto rotulo="O que precisa mudar (opcional)" valor={texto} aoMudar={setTexto} linhas={2} placeholder="Ex.: a questão 4 perdeu a massa do cloro." />
    </DialogoConfirmar>
  )
}

/* ── O documento ─────────────────────────────────────────────────────────────────────────────────────────────── */

export type AbaDocumento = 'questoes' | 'adaptada' | 'resultados'

export function Documento({ id, versao, aba, aoMudarAba, voltar }: {
  id: string
  /** ?versao=adaptada: abre na aba ADAPTADA (o item do sino chega por aqui) */
  versao?: Versao
  /** ?aba= */
  aba?: string | null
  aoMudarAba?: (aba: AbaDocumento) => void
  /** ‹ Conversa · ‹ Início · ‹ Criados */
  voltar: { para: string; rotulo: string }
}) {
  const navegar = useNavigate()
  const doc = useDocumentoBiblioteca(id)
  if (!doc) return (
    <div className="altura-tela grid grid-rows-[1fr_auto_2fr] px-4">
      <span />
      <EstadoVazio titulo="Este documento não existe mais" acao={<Botao variante="secundario" tamanho="m" onClick={() => navegar('/professor/criados')}>Ver Criados</Botao>} />
      <span />
    </div>
  )
  return <DocumentoAberto key={doc.id} doc={doc} versao={versao} aba={aba} aoMudarAba={aoMudarAba} voltar={voltar} />
}

function DocumentoAberto({ doc, versao, aba, aoMudarAba, voltar }: {
  doc: ItemBiblioteca; versao?: Versao; aba?: string | null; aoMudarAba?: (aba: AbaDocumento) => void; voltar: { para: string; rotulo: string }
}) {
  const navegar = useNavigate()
  const prof = useProfessorAtual()
  const celular = useIsMobile()
  const larga = useLargura(1280)
  const comSumario = useLargura(1200)
  const vivo = useEstadoDocumento(doc.id)
  const info = useInfoDocumento(doc.id)
  const adaptacoesDaTurma = useAdaptacoes(doc.turmaId)
  const nAdaptacao = adaptacoesDaTurma.length
  const tiposDaTurma = useMemo(() => {
    const t = new Set(adaptacoesDaTurma.flatMap((a) => a.tipos))
    const ordem = TIPOS_ADAPTACAO.map((o) => o.id).filter((x) => t.has(x))
    return ordem.length > 0 ? ordem : ADAPTACOES_REGISTRADAS
  }, [adaptacoesDaTurma])
  const turma = turmaDaProfessora(doc.turmaId)?.nome ?? doc.turma
  const tipo = tipoDocumento(doc)
  const meta = metadadosDe(doc)
  const qs = useMemo(() => questoesDoDocumento(doc), [doc])
  const temQuestoes = qs.length > 0 && (tipo === 'prova' || tipo === 'atividade' || tipo === 'simulado')
  const de = tipoDeAgora(doc.de)
  /* vai à turma (e por isso passa por APROVAR E ENVIAR): o que a ferramenta manda, e a proposta de redação (a
     rubrica fica com o professor) */
  const vaiParaTurma = VAI_PARA_TURMA.includes(de) || tipo === 'redacao'

  /* o estado: o vivo (envios), ou o de partida (biblioteca). A adaptada de partida é a que mora em versoesDe. */
  const original: EstadoDaVersao = vivo?.original ?? { estado: estadoDe(doc), quando: doc.estado === 'aprovado' ? `${String(doc.em[0]).padStart(2, '0')}/${String(doc.em[1]).padStart(2, '0')}` : undefined }
  const adaptadaEstado: EstadoDaVersao | undefined = vivo?.adaptada ?? (versoesDe(doc.n)[0] ? { estado: 'espera', tipos: tiposDaTurma } : undefined)
  const resultados = useResultados(temQuestoes ? doc : undefined)

  const abas: { id: AbaDocumento; rotulo: string; n?: number }[] = []
  const paraAdaptada = adaptadaEstado?.para && adaptadaEstado.para.length > 0 ? adaptadaEstado.para : adaptacoesDaTurma.map((a) => a.aluno)
  const nPara = paraAdaptada.length
  /* a adaptada já foi aprovada e alguém ganhou adaptação depois: ele ainda não recebeu, e a tela diz isso à parte */
  const faltantes = adaptadaEstado?.estado === 'aprovado' && adaptadaEstado.para?.length
    ? adaptacoesDaTurma.map((a) => a.aluno).filter((n) => !paraAdaptada.includes(n))
    : []
  if (temQuestoes || adaptadaEstado) {
    abas.push({ id: 'questoes', rotulo: temQuestoes ? 'Questões' : 'Original', n: temQuestoes ? qs.length : undefined })
    if (adaptadaEstado) abas.push({ id: 'adaptada', rotulo: 'Adaptada', n: nPara })
    if (resultados) abas.push({ id: 'resultados', rotulo: 'Resultados' })
  }
  const pedida: AbaDocumento = aba === 'questoes' || aba === 'adaptada' || aba === 'resultados' ? aba : versao === 'adaptada' ? 'adaptada' : 'questoes'
  const [abaLocal, setAbaLocal] = useState<AbaDocumento>(pedida)
  useEffect(() => { setAbaLocal(pedida) }, [pedida])
  const atual: AbaDocumento = abas.some((a) => a.id === abaLocal) ? abaLocal : 'questoes'
  const mudarAba = (a: AbaDocumento) => { setAbaLocal(a); aoMudarAba?.(a) }
  const ver: Versao = atual === 'adaptada' ? 'adaptada' : 'original'
  const v = ver === 'adaptada' ? adaptadaEstado : original

  const [gabarito, setGabarito] = useState(false)
  const [ladoALadoEscolhido, setLadoALado] = useState(true)
  const ladoALado = ladoALadoEscolhido && larga && atual === 'adaptada' && temQuestoes
  const [enviar, setEnviar] = useState(false)
  const [enviarFaltantes, setEnviarFaltantes] = useState(false)
  const [adaptar, setAdaptar] = useState(false)
  const [sobre, setSobre] = useState(false)
  const [recusar, setRecusar] = useState(false)
  const [apagar, setApagar] = useState(false)
  const [slide, setSlide] = useState<number | null>(null)
  /* a tela de foco tem o seu próprio slide: avançar nela não abre o slide comum por baixo */
  const [apresentando, setApresentando] = useState(false)
  const [slideFoco, setSlideFoco] = useState(1)
  const momento = useAgora()
  const [recado, setRecado] = useState<string | null>(null)
  const mesa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!recado) return
    const t = window.setTimeout(() => setRecado(null), 2600)
    return () => window.clearTimeout(t)
  }, [recado])
  /* trocar de aba volta a mesa ao topo */
  useEffect(() => { mesa.current?.scrollTo({ top: 0 }) }, [atual])

  const nQuestoes = info?.questoes ?? (qs.length || undefined)
  const tipos = adaptadaEstado?.tipos ?? tiposDaTurma
  const podeAdaptar = vaiParaTurma && ['prova', 'atividade', 'material'].includes(de) && nAdaptacao > 0
  const esperando = v?.estado === 'espera' || v?.estado === 'rascunho'
  const podeAprovar = vaiParaTurma && esperando && atual !== 'resultados' && (ver === 'original' || nPara > 0)
  const aos = ver === 'adaptada' ? `aos ${nPara} ${nPara === 1 ? 'aluno' : 'alunos'}` : `ao ${turma}`
  const envio = useEnvios(doc.turmaId).find((e) => e.docId === doc.id && e.versao === ver)
  const foiPara = ver === 'adaptada' && adaptadaEstado?.estado === 'aprovado' && adaptadaEstado.para?.length ? `aos ${nPara} ${nPara === 1 ? 'aluno' : 'alunos'}`
    : envio && Array.isArray(envio.para) ? `aos ${envio.para.length} ${envio.para.length === 1 ? 'aluno' : 'alunos'}` : envio ? `ao ${turma}` : aos

  const aprovarEEnviar = ({ quando, para }: { quando: 'agora' | 'proxima'; para: 'turma' | string[] }) => {
    envios.aprovarEEnviar({ docId: doc.id, versao: ver, titulo: doc.titulo, tipo: tipoDoEnvio(doc), turmaId: doc.turmaId, para, quando, questoes: nQuestoes })
  }
  /* VERSÃO ADAPTADA: a janela Adaptar, já com este documento; gerada, a página passa para a aba ADAPTADA */
  const gerarAdaptada = (r: ResultadoAdaptar) => {
    if (!info) envios.novoRascunho(doc.id, { titulo: doc.titulo, tipo: tipoDoEnvio(doc), turmaId: doc.turmaId, questoes: nQuestoes }, original.estado === 'aprovado' ? 'aprovado' : 'espera')
    envios.gerarAdaptada(doc.id, r.tipos, r.para)
    mudarAba('adaptada')
    setRecado('Pronto: a versão adaptada está na aba Adaptada.')
  }
  /* Pedir ajuste ao Assistente: volta à conversa que gerou o documento; sem ela, abre uma nova ligada a ele */
  const pedirAjuste = () => {
    const daConversa = voltar.para.startsWith('/professor/conversa/') ? voltar.para.split('/').pop() : conversaDoDocumento(doc.id)
    if (daConversa) { navegar(`/professor/conversa/${daConversa}`, { state: { ajuste: true } }); return }
    const c = acervo.criarConversa({ pedido: `Ajustar “${doc.titulo}”`, ferramenta: de === 'redacao' ? 'conversa' : de, turmaId: doc.turmaId })
    documentos.ligarConversa(c.id, doc.id)
    navegar(`/professor/conversa/${c.id}`, { state: { ajuste: true } })
  }
  const temaDoPlano = (doc.titulo.split(' · ')[1] ?? doc.titulo).trim()

  /* ── o selo e a linha do estado ── */
  let selo: ReactNode
  let linhaEstado: ReactNode
  if (!vaiParaTurma) {
    selo = <SeloEstadoDocumento estado="so-voce" />
    linhaEstado = 'Fica com você em Criados: não vai à turma.'
  } else if (v?.estado === 'aprovado') {
    const chega = envio || v.chega ? (v.chega && v.chega !== 'agora' ? `chega ${foiPara} ${v.chega}` : `chegou ${foiPara}`) : `enviado ${foiPara}`
    selo = <SeloEstadoDocumento estado="aprovado" />
    const foi = quandoFoi(v, momento.ordem, momento.dia)
    linhaEstado = `Aprovado por ${v.por ?? prof.nome}${foi ? ` · ${foi}` : ''} · ${chega}.`
  } else if (v?.estado === 'recusado') {
    selo = <SeloEstadoDocumento estado="recusado" />
    linhaEstado = `Recusado por ${v.por ?? prof.nome} · ${quandoFoi(v, momento.ordem, momento.dia) ?? ''}${v.motivo ? ` · ${v.motivo}` : ''}. Nada chegou à turma.`
  } else if (ver === 'adaptada') {
    selo = <SeloEstadoDocumento estado="espera" />
    linhaEstado = nPara > 0 ? 'Só você vê até aprovar.' : 'Ninguém da turma tem adaptação registrada agora.'
  } else {
    selo = <SeloEstadoDocumento estado="espera" />
    linhaEstado = `Só você vê. Chega ao ${turma} quando você aprovar.`
  }

  /* ── as ações ── */
  const exportar = (f: string) => () => setRecado(`Baixando o ${f}…`)
  const imprimir = () => setRecado('Mandei para a impressora.')
  const itensMenu: ItemMenuMais[] = [
    /* no celular, IMPRIMIR desce para o ⋯ quando a barra de baixo tem a ação cheia */
    ...(celular && (podeAprovar || tipo === 'apresentacao') ? [{ rotulo: 'Imprimir', aoEscolher: imprimir }] : []),
    { rotulo: 'Pedir ajuste ao Assistente', aoEscolher: pedirAjuste },
    ...(podeAdaptar ? [{ rotulo: adaptadaEstado?.estado === 'aprovado' ? 'Nova versão adaptada' : adaptadaEstado ? 'Refazer versão adaptada' : 'Versão adaptada', aoEscolher: () => setAdaptar(true) }] : []),
    ...(tipo === 'plano' || tipo === 'sequencia' ? [
      { rotulo: 'Gerar a lista desta aula', aoEscolher: () => navegar(`/professor/conversa/nova?ferramenta=atividade&turma=${doc.turmaId}&pedido=${encodeURIComponent(temaDoPlano)}`) },
      { rotulo: 'Gerar os slides desta aula', aoEscolher: () => navegar(`/professor/conversa/nova?ferramenta=apresentacao&turma=${doc.turmaId}&pedido=${encodeURIComponent(temaDoPlano)}`) },
    ] : []),
    ...(tipo === 'rubrica' ? [{ rotulo: 'Corrigir com esta rubrica', aoEscolher: () => navegar('/professor/ferramentas/redacao') }] : []),
    { rotulo: 'Exportar PDF', aoEscolher: exportar('PDF') },
    ...(tipo === 'apresentacao' ? [{ rotulo: 'Exportar PPTX', aoEscolher: exportar('PPTX') }] : []),
    { rotulo: 'Sobre este documento', aoEscolher: () => setSobre(true) },
    ...(vaiParaTurma && esperando ? [{ rotulo: 'Recusar com motivo', aoEscolher: () => setRecusar(true) }] : []),
    { rotulo: 'Apagar', perigo: true, aoEscolher: () => setApagar(true) },
  ]
  const menu = <MenuMais rotulo="Mais opções do documento" itens={itensMenu} />
  const botaoAprovar = podeAprovar && <Botao variante="oficial" tamanho="m" onClick={() => setEnviar(true)}>Aprovar e enviar {aos}</Botao>
  const botaoApresentar = tipo === 'apresentacao' && (
    <Botao variante={podeAprovar ? 'secundario' : 'primario'} tamanho="m" icone={<Play strokeWidth={2.5} />} onClick={() => { setSlideFoco(1); setApresentando(true) }}>Apresentar</Botao>
  )
  const acoes = !celular && (
    <>
      <Botao variante="secundario" tamanho="m" icone={<Printer strokeWidth={2.5} />} onClick={imprimir}>Imprimir</Botao>
      {menu}
      {botaoAprovar}
    </>
  )

  /* o que é da aba, na ponta direita da linha: o gabarito (modo de ver) ou o lado a lado */
  const interruptorGabarito = (
    <label className="flex shrink-0 items-center gap-2.5">
      <span className="t-rotulo text-apoio">Gabarito</span>
      <Interruptor ligado={gabarito} aoMudar={setGabarito} rotulo="Mostrar o gabarito" />
    </label>
  )
  /* no celular, o gabarito sai da linha das abas (ali ele cobria ADAPTADA) e desce para a faixa das questões */
  const fimDasAbas = celular ? undefined : atual === 'questoes' && temQuestoes ? interruptorGabarito : atual === 'adaptada' && temQuestoes && larga ? (
    <label className="flex items-center gap-2.5">
      <span className="t-rotulo text-apoio">Lado a lado</span>
      <Interruptor ligado={ladoALadoEscolhido} aoMudar={setLadoALado} rotulo="Original e adaptada lado a lado" />
    </label>
  ) : undefined

  /* ── o corpo, por tipo ── */
  let sumario: ReactNode
  let corpo: ReactNode
  let ladoALadoCorpo: ReactNode
  const sumarioDe = (titulo: string, itens: { id: string; rotulo: string }[], grade?: boolean) =>
    comSumario && itens.length > 1 ? <Sumario titulo={titulo} itens={itens} grade={grade} rolagem={mesa} /> : undefined

  if (atual === 'resultados' && resultados) {
    corpo = <VistaResultados doc={doc} res={resultados} qs={qs} />
  } else if (temQuestoes) {
    const adaptada = atual === 'adaptada'
    const prefixo = adaptada ? 'qa' : 'q'
    const misto = ehMisto(qs)
    sumario = !ladoALado ? sumarioDe('Questões', qs.map((q) => ({ id: `${prefixo}-${q.n}`, rotulo: String(q.n) })), true) : undefined
    const faixa = adaptada && (
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border-2 border-borda bg-white px-4 py-3">
        <p className="text-[15px] font-bold text-tinta">{nPara > 0 ? `Para ${emLista(paraAdaptada)}` : 'Ninguém com adaptação registrada'}</p>
        <span className="flex flex-wrap gap-1.5">{tipos.map((x) => <Selo key={x} familia="roxo">{TIPOS_ADAPTACAO.find((o) => o.id === x)?.nome ?? x}</Selo>)}</span>
        {faltantes.length > 0 && (
          <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t-2 border-borda pt-3">
            <p className="text-[15px] font-medium text-tinta">{emLista(faltantes)} ainda não {faltantes.length === 1 ? 'recebeu' : 'receberam'}: a adaptação foi registrada depois do envio.</p>
            <Botao variante="oficial" tamanho="m" onClick={() => setEnviarFaltantes(true)}>Enviar a {faltantes.length} {faltantes.length === 1 ? 'aluno' : 'alunos'}</Botao>
          </div>
        )}
      </div>
    )
    if (ladoALado) {
      /* as duas folhas de 560: a mesma questão na mesma altura (uma linha da grade por questão) */
      ladoALadoCorpo = (
        <div className="w-full max-w-[1080px]">
          {faixa}
          <div className="grid grid-cols-[repeat(2,minmax(0,560px))] justify-center gap-x-6">
            <div style={{ gridRow: `1 / ${qs.length + 2}` }} className="col-start-1 flex"><Folha estreita className="h-full max-w-none"><span /></Folha></div>
            <div style={{ gridRow: `1 / ${qs.length + 2}` }} className="col-start-2 flex"><Folha estreita className="h-full max-w-none"><span /></Folha></div>
            <div className="col-start-1 row-start-1 px-10 pt-10 text-[17px] font-medium leading-[1.6] text-tinta">
              <p className="t-selo mb-3 text-sutil">Original</p>
              <CabecalhoDaFolha doc={doc} />
            </div>
            <div className="col-start-2 row-start-1 px-10 pt-10 text-[19px] font-medium leading-[1.6] text-tinta">
              <p className="t-selo mb-3 text-roxo-texto">Adaptada</p>
              <CabecalhoDaFolha doc={doc} adaptada tipos={tipos} />
            </div>
            {qs.map((q, i) => (
              <Fragment key={q.n}>
                <div style={{ gridRowStart: i + 2 }} className={cn('col-start-1 px-10 text-[17px] font-medium leading-[1.6] text-tinta', i > 0 && 'border-t-2 border-borda pt-6', i === qs.length - 1 && 'pb-10')}>
                  <Questao q={q} gabarito={false} prefixo="q" misto={misto} />
                </div>
                <div style={{ gridRowStart: i + 2 }} className={cn('col-start-2 px-10 text-[19px] font-medium leading-[1.6] text-tinta', i > 0 && 'border-t-2 border-borda pt-6', i === qs.length - 1 && 'pb-10')}>
                  <Questao q={q} gabarito={false} tipos={tipos} prefixo="qa" misto={misto} />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      )
    } else {
      corpo = (
        <div className="flex w-full max-w-[760px] flex-col">
          {faixa}
          <Folha ampliada={adaptada && tipos.includes('fonte')}>
            <CabecalhoDaFolha doc={doc} adaptada={adaptada} tipos={tipos} />
            {qs.map((q) => <Questao key={q.n} q={q} gabarito={gabarito && !adaptada} tipos={adaptada ? tipos : undefined} prefixo={prefixo} misto={misto} />)}
          </Folha>
        </div>
      )
    }
  } else if (tipo === 'plano' || (tipo === 'sequencia' && !semanasDoPlano(doc).length)) {
    const aulas = aulasDoPlano(doc)
    const temObjetivos = !!(estruturaDe(doc).objetivos?.length || estruturaDe(doc).habilidades?.length)
    sumario = sumarioDe('Sumário', [...(temObjetivos ? [{ id: 'objetivos', rotulo: 'Objetivos' }] : []), ...aulas.map((a) => ({ id: a.id, rotulo: a.titulo.split(' · ')[0] })), ...itensFixos(doc)])
    corpo = <Folha><CorpoPlano doc={doc} /></Folha>
  } else if (tipo === 'sequencia') {
    sumario = sumarioDe('Sumário', [{ id: 'objetivos', rotulo: 'Objetivos' }, { id: 'aulas', rotulo: 'Aulas por semana' }, ...itensFixos(doc)])
    corpo = <Folha><CorpoBimestre doc={doc} /></Folha>
  } else if (tipo === 'apresentacao') {
    const slides = slidesDe(doc)
    corpo = (
      <div className="grid w-full max-w-[1080px] gap-4">
        <div className="flex min-h-10 items-center gap-3">
          <h2 className="t-selo flex-1 text-sutil">Slides ({slides.length})</h2>
          {!celular && botaoApresentar}
        </div>
        <GradeSlides slides={slides} aoAbrir={setSlide} />
      </div>
    )
  } else if (tipo === 'rubrica') {
    const r = rubricaDe(doc)
    corpo = (
      <Folha className="sm:max-w-[1080px]">
        {r ? <TabelaRubrica enunciado={r.enunciado && <><p className="t-selo mb-1 text-sutil">Questão</p>{r.enunciado}</>} niveis={r.niveis} criterios={r.criterios} total={r.total} nota={r.nota} /> : null}
      </Folha>
    )
  } else if (tipo === 'redacao') {
    sumario = sumarioDe('Sumário', [{ id: 'tema', rotulo: 'Tema' }, { id: 'textos', rotulo: 'Textos motivadores' }, { id: 'proposta', rotulo: 'Proposta' }])
    corpo = <Folha><CorpoRedacao doc={doc} /></Folha>
  } else {
    const mapa = doc.blocos.find((b): b is Extract<Bloco, { t: 'mapa' }> => b.t === 'mapa')
    if (mapa) {
      corpo = <Folha className="sm:flex sm:min-h-[calc(100svh-240px)] sm:max-w-[1080px] sm:items-center"><MapaMental centro={mapa.centro} ramos={mapa.ramos} /></Folha>
    } else {
      const secoes = secoesDo(doc).filter((s) => s.titulo)
      sumario = sumarioDe('Sumário', secoes.map((s) => ({ id: s.id, rotulo: s.titulo })))
      corpo = <Folha><CorpoMaterial doc={doc} /></Folha>
    }
  }

  /* no celular, o sumário vira uma faixa presa no topo da mesa: as bolinhas das questões rolam de lado, e o gabarito
     fica na ponta */
  const irPara = (alvo: string) => {
    const m = mesa.current
    const el = document.getElementById(alvo)
    if (!m || !el) return
    m.scrollTo({ top: m.scrollTop + el.getBoundingClientRect().top - m.getBoundingClientRect().top - 72, behavior: 'smooth' })
  }
  const faixaCelular = celular && temQuestoes && atual !== 'resultados' && !ladoALado ? (
    <div className="sticky top-0 z-10 -mx-4 mb-1 grid gap-2 border-b-2 border-borda bg-white px-4 py-2">
      {atual === 'questoes' && (
        <div className="flex min-h-9 items-center justify-between gap-3">
          <p className="t-selo text-sutil">Ir para a questão</p>
          {interruptorGabarito}
        </div>
      )}
      <ol aria-label="Questões" className="flex min-w-0 gap-1.5 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)] [scrollbar-width:none]">
        {qs.map((q) => (
          <li key={q.n} className="shrink-0">
            <button type="button" onClick={() => irPara(`${atual === 'adaptada' ? 'qa' : 'q'}-${q.n}`)} aria-label={`Questão ${q.n}`}
              className="grid size-9 place-items-center rounded-full border-2 border-borda text-[14px] font-bold tabular-nums text-apoio active:bg-fundo-suave">{q.n}</button>
          </li>
        ))}
      </ol>
    </div>
  ) : undefined

  /* a linha de dados quebra só entre os itens ("Química 2, cap. 7" não se parte); o autor e a data ficam no Sobre */
  const linhaDeDados = meta.linha.filter((x) => !/^(Assistente|Do arquivo),/.test(x)).map((x, i) => `${i ? '\u200B' : ''}${x.replace(/ /g, '\u00A0')}`)
  const cabecalho = (
    <CabecalhoDocumento voltar={voltar} icone={<IconeFerramenta id={tipo === 'adaptada' ? 'adaptacao' : de} className="size-10" />}
      tipo={meta.tipo} titulo={doc.titulo}
      aoRenomear={(t) => documentos.renomear(doc.id, t)} selo={selo}
      estado={linhaEstado} metadados={linhaDeDados} acoes={acoes || undefined}
      abas={abas.length ? { abas, valor: atual, aoMudar: (x) => mudarAba(x as AbaDocumento), fim: fimDasAbas } : undefined} />
  )

  const rodape = celular ? (
    <div className="flex w-full items-center justify-between gap-2">
      {menu}
      {botaoAprovar || (tipo === 'apresentacao' ? botaoApresentar : <Botao variante="secundario" tamanho="m" icone={<Printer strokeWidth={2.5} />} onClick={imprimir}>Imprimir</Botao>)}
    </div>
  ) : undefined

  return (
    <>
      {/* o cabeçalho guarda o canto do sino (--reserva-sino): as ações terminam antes dele, sem empilhar no canto */}
      <Pagina tipo="documento" cabecalho={cabecalho} rodape={rodape} rolagem="nenhuma">
        <MesaDocumento ref={mesa} ladoALado={ladoALadoCorpo}>
          <div className="flex w-full justify-center max-sm:pt-5">
          {sumario ? (
            /* um eixo só, o da coluna de 1080: o sumário de 200 na borda esquerda (a do ícone e das abas), 24 de espaço e
               a folha até a borda direita (a das ações e do interruptor) */
            <div className="flex w-full max-w-[1080px] items-start gap-6">
              <aside className="sticky top-6 w-[200px] shrink-0">{sumario}</aside>
              <div className="flex min-w-0 flex-1 *:max-w-none [&_article]:max-w-none">{corpo}</div>
            </div>
          ) : faixaCelular ? (
            <div className="flex w-full min-w-0 flex-col">{faixaCelular}{corpo}</div>
          ) : corpo}
          </div>
        </MesaDocumento>
      </Pagina>
      {recado && (
        <p role="status" className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-entra whitespace-nowrap rounded-[12px] bg-tinta px-4 py-2 text-[15px] font-bold text-white">{recado}</p>
      )}
      {tipo === 'apresentacao' && slide !== null && !apresentando && <SlideAberto slides={slidesDe(doc)} atual={slide} aoMudar={setSlide} aoFechar={() => setSlide(null)} />}
      {tipo === 'apresentacao' && apresentando && <SlideAberto telaCheia slides={slidesDe(doc)} atual={slideFoco} aoMudar={setSlideFoco} aoFechar={() => setApresentando(false)} />}
      <DialogoEnviar aberto={enviar} aoMudar={setEnviar} turmaId={doc.turmaId} turma={turma} adaptada={ver === 'adaptada'} nomesAdaptacao={paraAdaptada}
        adaptadaDaTurma={ver === 'original' && adaptadaEstado ? { n: nPara, aprovada: adaptadaEstado.estado === 'aprovado' } : undefined}
        comNota={temQuestoes} aoEnviar={aprovarEEnviar} />
      {faltantes.length > 0 && (
        <DialogoEnviar aberto={enviarFaltantes} aoMudar={setEnviarFaltantes} turmaId={doc.turmaId} turma={turma} adaptada nomesAdaptacao={faltantes}
          comNota={temQuestoes} aoEnviar={({ quando }) => envios.aprovarEEnviar({ docId: doc.id, versao: 'adaptada', titulo: doc.titulo, tipo: tipoDoEnvio(doc), turmaId: doc.turmaId, para: faltantes, quando, questoes: nQuestoes })} />
      )}
      <DialogoAdaptar aberto={adaptar} aoMudar={setAdaptar} turmaId={doc.turmaId} docId={doc.id} passoInicial={1} aoGerar={gerarAdaptada} />
      <DialogoSobre doc={doc} turma={turma} aberto={sobre} aoMudar={setSobre} />
      {recusar && <DialogoRecusar aberto={recusar} aoMudar={setRecusar} adaptada={ver === 'adaptada'} aoRecusar={(m) => envios.recusar(doc.id, ver, m)} />}
      <DialogoConfirmar aberto={apagar} aoMudar={setApagar} titulo="Apagar este documento?" frase="Ele sai de Criados. O que já foi enviado à turma continua com ela."
        confirmar={{ rotulo: 'Apagar', variante: 'perigoCheio', aoConfirmar: () => { documentos.apagar(doc.id); navegar('/professor/criados') } }} />
    </>
  )
}

/** O selo do estado de um documento, como Criados e o cartão da conversa mostram (o mesmo da página). */
export function estadoDoDocumento(doc: ItemBiblioteca, vivo?: { original?: EstadoDaVersao; adaptada?: EstadoDaVersao }): 'espera' | 'aprovado' | 'recusado' | 'so-voce' {
  const t = tipoDocumento(doc)
  if (!VAI_PARA_TURMA.includes(tipoDeAgora(doc.de)) && t !== 'redacao') return 'so-voce'
  const o = vivo?.original?.estado ?? estadoDe(doc)
  return o === 'rascunho' ? 'espera' : o
}

