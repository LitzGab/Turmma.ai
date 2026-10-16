import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useSidebar } from '@/components/blocks/sidebar'
import {
  Aviso, Botao, BotaoIcone, CabecalhoPagina, Carimbo, Cartao, Comemoracao, DialogoConfirmar, Pagina, Selo, SeloIA, SeloNovo, ConversaVazia,
} from '@/components/duo'
import { AvatarIA, CabecaOnca, Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { avaliacoes, revisoes, useTarefa, useTutorTravado, type TarefaViva } from '@/dados/avaliacoes'
import { bancoDaTarefa } from '@/dados/questoes'
import { sessao } from '@/dados/sessao'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { ConversaTutor, motivoDoTravado, type ContextoTutor, type Materia } from './_conversa-tutor'
import { Alternativas, AnteriorProxima, IssoEstaErrado, LadrilhoMateria, MOTIVOS_NOTA, MapaQuestoes, RespostaSalva, SeloEstado, type MarcaQuestao } from './_pecas'

/* A TAREFA (/aluno/tarefas/:id), 14ª rodada, 05/10/2026 (plano ux-composicao, 1.2 e 5.2; Geekie One: a questão como
   unidade, o mapa no topo). Tudo vem do estado da demonstração (`useTarefa`), que anda entre abas.
   · O cabeçalho de página: ‹ Tarefas · o título · "Química · até quinta" e, à direita, o MAPA de questões (bolinhas
     de 28) e "2 de 8 feitas" (uma vez só; "feitas" para não se ler como "questão 2 de 8").
   · A questão em Leitura 880: "Questão 3" e o Salvo na mesma linha, o enunciado e as alternativas (marcar salva na
     hora, `avaliacoes.responder`). Logo abaixo, UMA barra: TIRAR DÚVIDA COM O TUTOR (o Tutor ao lado, já na questão;
     a lateral recolhe e volta) à esquerda e ANTERIOR · PRÓXIMA à direita. Na última, ENTREGAR; entregue, a onça
     comemora A ENTREGA (nunca a nota).
   · LEITURA: o capítulo e as páginas; TIRAR DÚVIDA à esquerda e MARCAR COMO LIDA à direita.
   · ESPERANDO: "Entregue em 21/09. Sua professora vê antes de você." e as respostas só para ler (regra 70).
   · CORRIGIDA (só depois que a professora aprovou): "4 de 8 certas" no cabeçalho, com o mapa de certas e erradas;
     O RECADO (quem escreveu, quem aprovou; D55, D56) e VALE REVISAR lado a lado; a questão com a certa; ISSO ESTÁ
     ERRADO? (D60) na barra da questão, já nela.
   · NOVO some ao abrir (`sessao.marcarVisto`). Nunca: a onça sobre a nota, média da turma ou de colega. */

const MATERIAS_TUTOR: Materia[] = ['Química', 'Matemática', 'História', 'Física', 'Biologia', 'Português']
const materiaTutor = (m: string): Materia | undefined => MATERIAS_TUTOR.find((x) => x === m)

/** O assunto de cada página do material de Química, para o "Vale revisar" das tarefas que chegaram agora. */
const ASSUNTO_DA_PAGINA: Record<number, { assunto: string; slug: string }> = {
  141: { assunto: 'Conservação da massa', slug: 'conservacao-da-massa' },
  142: { assunto: 'Proporção na equação', slug: 'proporcao' },
  144: { assunto: 'Massa molar', slug: 'massa-molar' },
  145: { assunto: 'Massa molar', slug: 'massa-molar' },
  146: { assunto: 'Massa molar', slug: 'massa-molar' },
  151: { assunto: 'Reagente limitante', slug: 'reagente-limitante' },
  152: { assunto: 'Rendimento', slug: 'rendimento' },
}

/** O que vale revisar: o reforço que a professora deixou, ou o assunto da primeira questão errada. */
function valeRevisar(t: TarefaViva): { assunto: string; pagina: number; slug: string } | undefined {
  const r = t.resultado
  if (!r || r.acertos === r.total) return undefined
  if (t.reforcar?.[0]) return t.reforcar[0]
  const errada = r.certo.findIndex((c) => !c)
  const pagina = bancoDaTarefa(t.id, t.tipo).questoes[errada]?.pagina ?? 145
  const a = ASSUNTO_DA_PAGINA[pagina] ?? ASSUNTO_DA_PAGINA[145]
  return { ...a, pagina }
}

/** O recado sem o "Revise a página 145…": a página fica só no VALE REVISAR, ao lado. */
const semPagina = (texto: string) => texto.replace(/\s*Revise a página \d+[^.]*\.?/i, '').trim()

/** "entregue em 21/09" → "21/09" */
const dataDaEntrega = (prazo: string) => prazo.replace(/^entregue em\s*/i, '')

/** "Química · até quinta" (o prazo sem a data, como a criança fala). */
const complemento = (t: TarefaViva) => {
  const prazo = t.estadoVivo === 'corrigida' ? 'corrigida' : t.estadoVivo === 'entregue' ? t.prazo : t.prazo.split(',')[0]
  return `${t.materia} · ${prazo}`
}

/** A moldura de toda tarefa: a página de leitura com o cabeçalho; com o Tutor aberto ao lado, abre espaço para ele. */
function Moldura({ t, acoes, selo, children, recuo = false }: { t: TarefaViva; acoes?: ReactNode; selo?: ReactNode; children: ReactNode; recuo?: boolean }) {
  return (
    <Pagina tipo="leitura" className={cn('transition-[padding] duration-200', recuo && 'md:pr-[480px]')}
      cabecalho={<CabecalhoPagina voltar={{ para: '/aluno/tarefas', rotulo: 'Tarefas' }} titulo={t.titulo} complemento={complemento(t)} selo={selo} acoes={acoes} />}>
      {children}
    </Pagina>
  )
}

/** O mapa de questões e "2 de 8 feitas", à direita do cabeçalho. */
function MapaNoCabecalho({ total, atual, aoIr, marcas, texto }: { total: number; atual: number; aoIr: (i: number) => void; marcas: Record<number, MarcaQuestao>; texto: string }) {
  return (
    <div className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-x-3 gap-y-1">
      <MapaQuestoes pequeno total={total} atual={atual} aoIr={aoIr} marcas={marcas} />
      <span className="whitespace-nowrap text-[15px] font-bold tabular-nums text-apoio">{texto}</span>
    </div>
  )
}

/** A questão como unidade: o número (e o que vai na mesma linha), o enunciado e as alternativas. */
function Questao({ n, lado, enunciado, children }: { n: number; lado?: ReactNode; enunciado: string; children: ReactNode }) {
  return (
    <section aria-label={`Questão ${n}`} className="grid gap-4">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <h2 className="t-selo text-sutil">Questão {n}</h2>
        {lado}
      </div>
      <p className="t-corpo max-w-[68ch] text-tinta">{enunciado}</p>
      {children}
    </section>
  )
}

/** A barra única sob as alternativas: o que é da questão à esquerda, ANTERIOR · PRÓXIMA à direita. */
function BarraQuestao({ esquerda, direita }: { esquerda?: ReactNode; direita: ReactNode }) {
  return (
    // no celular, a barra fica presa embaixo da área (logo acima da barra de baixo): é a ação mais usada da tarefa
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-borda pt-4 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-4 max-md:bg-fundo max-md:px-4 max-md:pb-3">
      <div className="flex min-w-0 items-center gap-2">{esquerda}</div>
      <div className="ml-auto flex items-center gap-2">{direita}</div>
    </div>
  )
}

/** A ajuda do Tutor ao lado. Abre pela URL (?ajuda=3); enquanto aberta, a lateral recolhe e depois volta como estava. */
function useAjuda() {
  const [ajuda, setAjuda] = useParametro('ajuda')
  const { open, setOpen, isMobile } = useSidebar()
  const antes = useRef<boolean | null>(null)
  const aberta = ajuda !== null
  useEffect(() => {
    if (aberta && antes.current === null && !isMobile) { antes.current = open; if (open) setOpen(false) }
    if (!aberta && antes.current !== null) { if (antes.current) setOpen(true); antes.current = null }
  }, [aberta, isMobile, open, setOpen])
  return { aberta, abrir: (n: number) => setAjuda(String(n)), fechar: () => setAjuda(null) }
}

/** O Tutor ao lado da questão (folha de baixo no celular). Com o Tutor travado, a onça dorme ali dentro (Q-3). */
function PainelAjuda({ aberto, aoFechar, titulo, contexto }: { aberto: boolean; aoFechar: () => void; titulo: string; contexto: ContextoTutor }) {
  const travado = useTutorTravado()
  const motivo = travado ? motivoDoTravado(travado) : null
  const celular = useIsMobile()
  const miolo = motivo ? (
        // travado (prova aberta, escola pausou): nenhuma dica, só a onça dormindo e o caminho (Q-3)
        <div className="grid h-full grid-rows-[1fr_auto_2fr] justify-items-center px-4 text-center">
          <span aria-hidden />
          <div className="grid justify-items-center gap-4">
            <Onca pose="dormindo" tamanho={96} animada={false} />
            <p className="t-cartao text-tinta">{motivo.frase}</p>
            {motivo.botao && <Botao variante="primario" asChild><Link to={motivo.botao.para}>{motivo.botao.rotulo}</Link></Botao>}
          </div>
          <span aria-hidden />
        </div>
      ) : (
        <ConversaTutor key={`${contexto.tarefa}-${contexto.questao}`} compacta contexto={contexto} className="h-full" />
      )
  // No celular, a folha de baixo (não cabe lado a lado). No computador, um painel SEM véu ao lado: a questão continua
  // à vista e clicável enquanto o Tutor ajuda (blueprint; plano 5.1).
  if (celular) {
    return (
      <PainelLado aberto={aberto} aoFechar={aoFechar} titulo={titulo} descricao="O Tutor ao lado da questão. Feche com Esc.">
        {miolo}
      </PainelLado>
    )
  }
  return <AjudaAoLado aberto={aberto} aoFechar={aoFechar} titulo={titulo}>{miolo}</AjudaAoLado>
}

/** O painel do Tutor no computador: preso à direita, 480 px, sem véu e sem prender o foco. Fecha com o X e com Esc. */
function AjudaAoLado({ aberto, aoFechar, titulo, children }: { aberto: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  const fechar = useRef(aoFechar)
  useEffect(() => { fechar.current = aoFechar })
  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => {
      // o Esc de um diálogo aberto por cima (Entregar?) é dele
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) fechar.current()
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [aberto])
  if (!aberto) return null
  return (
    <aside aria-label={titulo} className="fixed inset-y-0 right-0 z-40 flex w-[480px] max-w-full flex-col border-l-2 border-borda bg-white">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-borda pl-6 pr-3">
        <h2 className="min-w-0 flex-1 truncate text-[20px] font-bold leading-[26px] text-tinta">{titulo}</h2>
        <BotaoIcone rotulo="Fechar" dica={false} onClick={aoFechar}><X strokeWidth={2.5} /></BotaoIcone>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
    </aside>
  )
}

const BotaoAjuda = ({ aoClicar }: { aoClicar: () => void }) => (
  <Botao variante="secundario" tamanho="m" onClick={aoClicar} icone={<CabecaOnca tamanho={24} />} aria-label="Tirar dúvida com o Tutor">
    <span><span className="max-sm:hidden">Tirar dúvida com o Tutor</span><span className="sm:hidden">Dúvida</span></span>
  </Botao>
)

/* ── entregue agora: a onça comemora a ENTREGA ── */
function Entregue() {
  return (
    <ConversaVazia caixa={null} topo={(
      <div className="grid justify-items-center gap-3 text-center">
        <Comemoracao ilustracao={<Onca pose="comemorando" tamanho={96} />} titulo="Entregue!" />
        <p className="t-corpo text-apoio">Sua professora vê antes de você.</p>
        <Botao variante="primario" className="mt-2" asChild><Link to="/aluno/tarefas">Voltar às tarefas</Link></Botao>
      </div>
    )} />
  )
}

/* ── fazer (lista) ── */
function Fazer({ t, aoEntregar }: { t: TarefaViva; aoEntregar: () => void }) {
  const banco = bancoDaTarefa(t.id, t.tipo)
  const questoes = banco.questoes
  const respostas = t.respostas ?? {}
  const [atual, setAtual] = useState(() => { const i = questoes.findIndex((_, k) => !respostas[k]); return i < 0 ? 0 : i })
  const [confirmar, setConfirmar] = useState(false)
  const { aberta, abrir, fechar } = useAjuda()
  const feitasN = Object.keys(respostas).length
  const q = questoes[atual]
  const marcada = respostas[atual]
  const marcas: Record<number, MarcaQuestao> = Object.fromEntries(Object.keys(respostas).map((k) => [Number(k), 'feita' as const]))

  const entregar = <Botao variante="primario" tamanho="m" onClick={() => setConfirmar(true)}>Entregar</Botao>

  return (
    <Moldura t={t} recuo={aberta} acoes={<MapaNoCabecalho total={questoes.length} atual={atual} aoIr={setAtual} marcas={marcas} texto={`${feitasN} de ${questoes.length} feitas`} />}>
      <Questao n={atual + 1} enunciado={q.enunciado} lado={<RespostaSalva salvo={!!marcada} texto={<>Salvo.<span className="max-sm:hidden"> Pode parar quando quiser.</span></>} />}>
        <Alternativas questao={q} nome={`q${atual}`} valor={marcada} aoEscolher={(v) => avaliacoes.responder(t.id, atual, v)} />
      </Questao>
      <BarraQuestao esquerda={<BotaoAjuda aoClicar={() => abrir(atual + 1)} />}
        direita={<AnteriorProxima total={questoes.length} atual={atual} aoIr={setAtual} fim={entregar} />} />

      <DialogoConfirmar aberto={confirmar} aoMudar={setConfirmar} titulo="Entregar?"
        frase={`Você respondeu ${feitasN} de ${questoes.length}. Depois não dá para mudar.`}
        confirmar={{ rotulo: 'Entregar', variante: 'primario', aoConfirmar: () => { avaliacoes.entregar(t.id); aoEntregar() } }} />

      <PainelAjuda aberto={aberta} aoFechar={fechar} titulo={`Tutor · Questão ${atual + 1}`}
        contexto={{ tarefa: t.titulo, questao: atual + 1, resposta: marcada ? q.alternativas['ABCDE'.indexOf(marcada)] : undefined, pagina: q.pagina, materia: materiaTutor(t.materia) }} />
    </Moldura>
  )
}

/* ── leitura ── */
function Leitura({ t }: { t: TarefaViva }) {
  const { aberta, abrir, fechar } = useAjuda()
  const lida = t.estadoVivo !== 'pra-fazer' && t.estadoVivo !== 'atrasada'
  const pagina = Number((t.paginas ?? '84').split(' ')[0]) || 84
  return (
    <Moldura t={t} recuo={aberta} selo={lida ? <SeloEstado t={t} /> : undefined}>
      <section aria-label="O que ler" className="flex items-center gap-4">
        <LadrilhoMateria materia={t.materia} tipo="leitura" tamanho={56} />
        <div className="min-w-0">
          <p className="t-cartao text-tinta">Capítulo 4 · páginas {t.paginas ?? '84 a 97'}</p>
          <p className="t-apoio">No livro de {t.materia}. Leia com calma; se travar, pergunte ao Tutor.</p>
        </div>
      </section>
      <BarraQuestao esquerda={<BotaoAjuda aoClicar={() => abrir(1)} />}
        direita={!lida ? <Botao variante="primario" tamanho="m" onClick={() => avaliacoes.marcarLida(t.id)}>Marcar como lida</Botao> : <span className="t-apoio">Lida. Bom trabalho.</span>} />
      <PainelAjuda aberto={aberta} aoFechar={fechar} titulo="Tutor · Capítulo 4"
        contexto={{ tarefa: t.titulo, questao: 0, materia: materiaTutor(t.materia), pagina, passo: 'O que o título do capítulo faz você pensar?' }} />
    </Moldura>
  )
}

/* ── entregue, esperando a professora ── */
function Esperando({ t }: { t: TarefaViva }) {
  const banco = bancoDaTarefa(t.id, t.tipo)
  const respostas = t.respostas ?? {}
  const [atual, setAtual] = useState(0)
  const marcas: Record<number, MarcaQuestao> = Object.fromEntries(Object.keys(respostas).map((k) => [Number(k), 'feita' as const]))
  const q = banco.questoes[atual]
  const total = banco.questoes.length
  return (
    <Moldura t={t}
      acoes={q ? <MapaNoCabecalho total={total} atual={atual} aoIr={setAtual} marcas={marcas} texto={`${Object.keys(respostas).length} de ${total} respondidas`} /> : undefined}>
      <p className="mb-5 flex items-center gap-2 rounded-[12px] bg-fundo-suave px-4 py-3 text-[15px] font-bold text-apoio">
        <Check aria-hidden className="size-4 shrink-0 text-verde-texto" strokeWidth={3.5} /> Entregue em {dataDaEntrega(t.prazo)}. A professora está vendo; a nota chega aqui depois que ela aprovar.
      </p>
      {q && (
        <>
          <Questao n={atual + 1} enunciado={q.enunciado}>
            <Alternativas questao={q} nome={`e${atual}`} valor={respostas[atual]} aoEscolher={() => {}} travada />
          </Questao>
          <BarraQuestao direita={<AnteriorProxima total={total} atual={atual} aoIr={setAtual} />} />
        </>
      )}
    </Moldura>
  )
}

/* ── corrigida e aprovada ── */
function Resultado({ t, novoAoAbrir }: { t: TarefaViva; novoAoAbrir: boolean }) {
  const r = t.resultado!
  const banco = bancoDaTarefa(t.id, t.tipo)
  const total = Math.min(banco.questoes.length, r.certo.length)
  const primeiraErrada = r.certo.findIndex((c) => !c)
  const [atual, setAtual] = useState(primeiraErrada < 0 ? 0 : primeiraErrada)
  const [errado, setErrado] = useState(false)
  const q = banco.questoes[atual]
  const reforco = valeRevisar(t)
  const rev = t.revisao?.tipo === 'nota' ? t.revisao : undefined
  const marcas: Record<number, MarcaQuestao> = Object.fromEntries(r.certo.slice(0, total).map((c, i) => [i, c ? 'certa' : 'errada'] as const))

  return (
    <Moldura t={t} acoes={<MapaNoCabecalho total={total} atual={atual} aoIr={setAtual} marcas={marcas} texto={`${r.acertos} de ${r.total} certas`} />}>
      <div className="grid gap-6">
        {rev?.estado === 'esperando' && <Aviso tom="info">A professora vai olhar a questão que você apontou.</Aviso>}
        {rev?.resposta && (
          <Aviso tom="certo" titulo={`A professora olhou: ${rev.resposta.decisao === 'mudar' ? 'mudou a nota.' : 'manteve a nota.'}`}
            acao={novoAoAbrir ? <SeloNovo tamanho="p" /> : undefined}>
            “{rev.resposta.motivo}”
          </Aviso>
        )}

        <div className={cn('grid gap-4', reforco && 'md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]')}>
          <Cartao className="grid content-start gap-3">
            <h2 className="t-selo text-sutil">O recado</h2>
            <p className="t-corpo text-tinta">{reforco ? semPagina(r.recado.texto) : r.recado.texto}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {r.recado.autor === 'tutor'
                ? <p className="flex items-center gap-2 text-[15px] font-bold text-apoio"><AvatarIA agente="tutor" tamanho={24} /> Escrito pelo Tutor <SeloIA tamanho="p" /></p>
                : <p className="text-[15px] font-bold text-apoio">Escrito pela professora</p>}
              <Carimbo por={r.recado.aprovadoPor} quando={r.recado.quando || undefined} className="flex-nowrap items-start [&>svg]:mt-0.5" />
            </div>
          </Cartao>

          {reforco && (
            <Cartao className="grid content-between gap-3">
              <div className="flex items-center gap-3">
                <Onca pose="apontando" tamanho={56} animada={false} />
                <div className="min-w-0">
                  <h2 className="t-selo text-sutil">Vale revisar</h2>
                  <p className="t-cartao text-tinta">{reforco.assunto} · p. {reforco.pagina}</p>
                </div>
              </div>
              <Botao variante="primario" tamanho="m" largura="cheia" asChild><Link to={`/aluno?assunto=${reforco.slug}`}>Estudar com o Tutor</Link></Botao>
            </Cartao>
          )}
        </div>

        {q && (
          <div>
            <Questao n={atual + 1} enunciado={q.enunciado}
              lado={r.certo[atual]
                ? <Selo familia="verde" icone={<Check strokeWidth={3.5} />}>Certa</Selo>
                : <Selo familia="vermelho" icone={<X strokeWidth={3.5} />}>Errada</Selo>}>
              <Alternativas questao={q} nome={`r${atual}`} valor={r.respostas[atual]} certa={r.gabarito[atual]} aoEscolher={() => {}} />
            </Questao>
            <BarraQuestao
              esquerda={rev?.estado !== 'esperando' ? <Botao variante="fantasma" tamanho="m" className="-ml-3" onClick={() => setErrado(true)}>Isso está errado?</Botao> : undefined}
              direita={<AnteriorProxima total={total} atual={atual} aoIr={setAtual} />} />
          </div>
        )}
      </div>

      <IssoEstaErrado aberto={errado} aoMudar={setErrado} motivos={MOTIVOS_NOTA} questoes={total} questaoInicial={atual}
        aoEnviar={(motivo, texto, questao) => { revisoes.pedir({ tipo: 'nota', tarefaId: t.id, questao: questao ?? atual, motivo, texto }) }} />
    </Moldura>
  )
}

function NaoAchei() {
  return (
    <Pagina tipo="leitura" cabecalho={<CabecalhoPagina voltar={{ para: '/aluno/tarefas', rotulo: 'Tarefas' }} titulo="Tarefa" />}>
      <div className="grid min-h-full flex-1 grid-rows-[1fr_auto_2fr] justify-items-center">
        <span aria-hidden />
        <div className="grid justify-items-center gap-3 text-center">
          <Onca pose="pensando" tamanho={96} animada={false} />
          <h2 className="t-secao text-tinta">Não achei esta tarefa</h2>
          <Botao variante="secundario" tamanho="m" asChild><Link to="/aluno/tarefas">Ver as tarefas</Link></Botao>
        </div>
        <span aria-hidden />
      </div>
    </Pagina>
  )
}

export function Atividade() {
  const { id = '' } = useParams()
  return <AtividadeDe key={id} id={id} />
}

function AtividadeDe({ id }: { id: string }) {
  const t = useTarefa(id)
  const [entregou, setEntregou] = useState(false)
  // O NOVO de quando abriu vale para esta visita (o aviso da professora mostra o selo) e some da lista. O que chegar
  // com a tela aberta (a professora respondeu noutra aba) fica NOVO até a próxima visita.
  const [chave] = useState(() => (t?.novo ? t.chaveNovo : ''))
  useEffect(() => { if (chave) sessao.marcarVisto(chave) }, [chave])
  const novoAoAbrir = !!chave || !!t?.novo

  if (entregou) return <Entregue />
  if (!t) return <NaoAchei />
  if (t.tipo === 'prova' && t.estadoVivo !== 'entregue' && t.estadoVivo !== 'corrigida') return <Navigate to={`/aluno/prova/${t.id}`} replace />
  if (t.estadoVivo === 'corrigida' && t.resultado) return <Resultado t={t} novoAoAbrir={novoAoAbrir} />
  if (t.tipo === 'leitura') return <Leitura t={t} />
  if (t.estadoVivo === 'entregue' || t.estadoVivo === 'corrigida') return <Esperando t={t} />
  return <Fazer t={t} aoEntregar={() => setEntregou(true)} />
}
