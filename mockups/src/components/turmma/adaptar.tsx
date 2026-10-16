import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, Paperclip, X } from 'lucide-react'
import { Botao, BotaoIcone, CampoTexto, Dialogo, EstadoVazio, GrupoToques, Opcao, Passos, Selo, SeloTurma } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { documentoDe, documentos, estadoDe, useCriados, type ItemBiblioteca } from '@/dados/biblioteca'
import { acervo } from '@/dados/conversas'
import { envios, lerEnvios, useEstadoEnvios, type TipoDoc } from '@/dados/envios'
import { adaptacoesDe, useAdaptacoes, type Adaptacao } from '@/dados/escola-estado'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { TIPOS_ADAPTACAO, tipoDeAgora } from '@/dados/ferramentas'
import { turmaDaProfessora, useTurmasDoProfessor } from '@/dados/turmas-professora'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* ADAPTAR (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 3; pedido A do dono: "quando o professor cria
   uma prova no sistema ela fica salva, então ele seleciona a prova que quer adaptar. Ou clica para anexar.").

   Três passos, uma coisa por tela, com os Passos no topo: O QUÊ · COMO · PARA QUEM.
   1. O que adaptar: o que o professor criou (Criados, inclusive o que nasceu nesta demonstração), prova, atividade ou
      material, o mais novo primeiro; ou ANEXAR UM ARQUIVO, que pergunta de quem é o material, sem nada marcado (D5;
      apostila de terceiro sem licença não entra: Lei 9.610/1998, lei) e para qual turma.
   2. Que adaptação: a LISTA FECHADA de tipos, já marcados os que a coordenação registrou para os alunos da turma.
      Nenhum campo de texto sobre aluno, e o sistema não pede nem guarda diagnóstico (D35, D67).
   3. Para quem: só os alunos com adaptação registrada na turma, todos marcados. Ninguém: a onça diz, e GERAR desliga.
   GERAR VERSÃO ADAPTADA abre a conversa com o cartão da versão (que leva à aba Adaptada do documento), PARA APROVAR: nada chega ao aluno sem APROVAR E ENVIAR
   (regra 70; D56). O anexo vira um documento em Criados (o arquivo não é lido aqui: o corpo é um modelo de prova).

   Quatro entradas usam esta peça: o atalho ADAPTAR do Início (`?adaptar=1`, com `&doc=` já escolhido), o VERSÃO
   ADAPTADA do documento (começa no passo 2), o pedido escrito na caixa ("adapta a lista de mol"), cujo cartão na
   conversa é esta peça em linha, e o endereço antigo da ferramenta. */

const PASSOS = ['O quê', 'Como', 'Para quem']
const TIPOS_QUE_ADAPTAM = ['prova', 'atividade', 'material']
const ORIGENS = [
  { id: 'meu', nome: 'É meu' },
  { id: 'escola', nome: 'É da escola' },
  { id: 'licenca', nome: 'De terceiro, com licença' },
]

const dataDe = (em: [number, number]) => `${String(em[0]).padStart(2, '0')}/${String(em[1]).padStart(2, '0')}`
const juntar = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`)
const nomeDoTipo = (id: string) => TIPOS_ADAPTACAO.find((t) => t.id === id)?.nome ?? id
const semAcento = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** O tipo do envio, para a tarefa do aluno. */
function tipoDoEnvio(doc: Pick<ItemBiblioteca, 'de' | 'titulo'>): TipoDoc {
  const de = tipoDeAgora(doc.de)
  if (de === 'prova' || de === 'simulado') return 'prova'
  if (de === 'atividade') return /^lista/i.test(doc.titulo) ? 'lista' : 'atividade'
  return 'material'
}

/** O que pode ser adaptado: prova, atividade e material de Criados (nunca uma versão adaptada), do mais novo para o
    mais velho. No mesmo dia, o que nasceu nesta demonstração vem antes, e depois a turma do pedido. */
export function useAdaptaveis(turmaId?: string): ItemBiblioteca[] {
  const criados = useCriados()
  const vivos = useEstadoEnvios()
  const espera = (id: string) => Number((vivos.docs[id]?.original?.estado ?? 'espera') === 'espera')
  return useMemo(() => criados
    .filter((b) => !b.versaoDe && TIPOS_QUE_ADAPTAM.includes(tipoDeAgora(b.de)))
    .map((b, i) => ({ b, i }))
    .sort((x, y) => (y.b.em[1] * 100 + y.b.em[0]) - (x.b.em[1] * 100 + x.b.em[0])
      || Number(y.b.n >= 1000) - Number(x.b.n >= 1000)
      /* entre os que nasceram nesta demonstração, o que espera aprovação e, nele, o criado por último vem primeiro */
      || (y.b.n >= 1000 ? espera(y.b.id) - espera(x.b.id) || y.b.n - x.b.n : 0)
      || Number(y.b.turmaId === turmaId) - Number(x.b.turmaId === turmaId)
      || x.i - y.i)
    .map(({ b }) => b), [criados, turmaId, vivos])
}

/** O documento de Criados que um pedido escrito cita ("adapta a lista de mol" → "Lista de mol e massa molar"). */
export function documentoDoPedido(pedido: string, lista: ItemBiblioteca[]): string | undefined {
  const p = semAcento(pedido)
  const palavras = (t: string) => semAcento(t).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !['das', 'dos', 'para', 'com'].includes(w))
  let melhor: { id: string; pontos: number } | undefined
  for (const b of lista) {
    const pontos = palavras(b.titulo).filter((w) => p.includes(w)).length + (p.includes(semAcento(b.turma)) ? 0.5 : 0)
    if (pontos >= 1 && (!melhor || pontos > melhor.pontos)) melhor = { id: b.id, pontos }
  }
  return melhor?.id
}

export type ResultadoAdaptar = { docId: string; tipos: string[]; para: string[]; turmaId: string; titulo: string }

type Anexo = { nome: string; tamanho: number }

/** O estado e as telas dos 3 passos; quem desenha decide onde vai o rodapé (no Dialogo, ou embaixo, em linha). */
function useAdaptar({ turmaId, docId, passoInicial = 0, aoGerar }: {
  turmaId?: string; docId?: string; passoInicial?: number
  /** em linha (dentro da conversa) ou no documento: quem chama cuida do resto. Sem ele, abre a conversa nova */
  aoGerar?: (r: ResultadoAdaptar) => void
}) {
  const navegar = useNavigate()
  const lista = useAdaptaveis(turmaId)
  const vivos = useEstadoEnvios()
  const escola = useEscolaAtiva()
  /* o anexo vai para uma turma da escola aberta no seletor (não mistura a Rio Cachoeira com o Colégio Aurora) */
  const turmas = useTurmasDoProfessor(escola.id)
  const celular = useIsMobile()
  const [passo, setPasso] = useState(docId ? passoInicial : 0)
  const [escolhido, setEscolhido] = useState<string | null>(docId ?? null)
  const [anexando, setAnexando] = useState(false)
  const [anexo, setAnexo] = useState<Anexo | null>(null)
  const [origem, setOrigem] = useState<string | null>(null)
  const [licenca, setLicenca] = useState('')
  const [turmaAnexo, setTurmaAnexo] = useState<string | null>(turmaId && turmas.some((t) => t.id === turmaId) ? turmaId : null)
  const entrada = useRef<HTMLInputElement>(null)

  /* o documento que já veio escolhido (VERSÃO ADAPTADA) vale mesmo se não estiver na lista */
  const doc = !anexando && escolhido ? lista.find((b) => b.id === escolhido) ?? (escolhido === docId ? documentoDe(docId) : undefined) : undefined
  const turmaAlvo = anexando ? turmaAnexo ?? '' : doc?.turmaId ?? ''
  const nomeTurma = turmaDaProfessora(turmaAlvo)?.nome ?? doc?.turma ?? ''
  const registrados: Adaptacao[] = useAdaptacoes(turmaAlvo || '—')
  const daCoordenacao = useMemo(() => [...new Set(registrados.flatMap((a) => a.tipos))], [registrados])

  /* os tipos e as pessoas nascem do que a coordenação registrou para a turma escolhida; mudou a turma, recomeçam */
  const [tipos, setTipos] = useState<string[] | null>(null)
  const [para, setPara] = useState<string[] | null>(null)
  const [turmaDosTipos, setTurmaDosTipos] = useState(turmaAlvo)
  if (turmaDosTipos !== turmaAlvo) { setTurmaDosTipos(turmaAlvo); setTipos(null); setPara(null) }
  const tiposVivos = tipos ?? daCoordenacao
  const paraVivo = para ?? registrados.map((a) => a.aluno)

  const anexoPronto = !!anexo && !!origem && (origem !== 'licenca' || licenca.trim().length > 0) && !!turmaAnexo
  const pronto = [anexando ? anexoPronto : !!doc, registrados.length > 0 && tiposVivos.length > 0, registrados.length > 0 && paraVivo.length > 0][passo]
  const ultimo = passo === PASSOS.length - 1

  const gerar = () => {
    if (!turmaAlvo) return
    let id = doc?.id
    let titulo = doc?.titulo ?? ''
    if (anexando && anexo) {
      titulo = anexo.nome.replace(/\.[a-z0-9]+$/i, '').trim() || 'Prova anexada'
      id = documentos.criar('modelo-prova-anexada', { turmaId: turmaAlvo, de: 'prova', titulo, origem: 'arquivo' })
      if (!lerEnvios().info[id]) envios.novoRascunho(id, { titulo, tipo: 'prova', turmaId: turmaAlvo, questoes: 8, materia: turmaDaProfessora(turmaAlvo)?.disciplina })
    } else if (doc && !lerEnvios().info[doc.id]) {
      const questoes = doc.blocos.filter((b) => b.t === 'questao').length || undefined
      envios.novoRascunho(doc.id, { titulo: doc.titulo, tipo: tipoDoEnvio(doc), turmaId: doc.turmaId, questoes: doc.id === 'prova-estequiometria' ? 10 : questoes }, estadoDe(doc))
    }
    if (!id) return
    const r: ResultadoAdaptar = { docId: id, tipos: tiposVivos, para: paraVivo, turmaId: turmaAlvo, titulo }
    if (aoGerar) { aoGerar(r); return }
    const n = paraVivo.length
    const c = acervo.criarConversa({
      pedido: `Adaptar: ${titulo} · ${nomeTurma} · ${juntar(tiposVivos.map((t) => nomeDoTipo(t).toLowerCase()))} · para ${n} ${n === 1 ? 'aluno' : 'alunos'}`,
      ferramenta: 'adaptacao', turmaId: turmaAlvo,
    })
    envios.gerarAdaptada(id, tiposVivos, paraVivo)
    documentos.ligarConversa(c.id, id, { tipos: tiposVivos, para: paraVivo })
    navegar(`/professor/conversa/${c.id}`, { state: { gerando: true } })
  }

  /* ── Passo 1: o que adaptar ── */
  const estadoDoItem = (b: ItemBiblioteca) => (vivos.docs[b.id]?.original?.estado ?? estadoDe(b)) === 'aprovado' ? 'aprovado' : 'espera'
  const escolherArquivo = (f: File | undefined) => { if (f) setAnexo({ nome: f.name, tamanho: f.size }) }
  const oQue = anexando ? (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex items-center gap-2">
        <Botao variante="fantasma" tamanho="p" icone={<ChevronLeft strokeWidth={2.5} />} onClick={() => setAnexando(false)} className="-ml-3">Escolher de Criados</Botao>
      </div>
      {anexo ? (
        <div className="flex min-h-16 min-w-0 items-center gap-3 rounded-[12px] border-2 border-borda px-3 py-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-fundo-suave text-apoio"><FileText className="size-5" strokeWidth={2.5} /></span>
          <span className="min-w-0 flex-1">
            <span className="t-cartao block truncate text-tinta">{anexo.nome}</span>
            <span className="t-apoio block">{anexo.tamanho < 1024 * 1024 ? `${Math.max(1, Math.round(anexo.tamanho / 1024))} KB` : `${(anexo.tamanho / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`}</span>
          </span>
          <BotaoIcone rotulo="Tirar o arquivo" onClick={() => setAnexo(null)} className="shrink-0"><X strokeWidth={2.5} /></BotaoIcone>
        </div>
      ) : (
        <label className="flex min-h-16 min-w-0 cursor-pointer items-center gap-3 rounded-[12px] border-2 border-dashed border-borda-forte bg-white px-3 py-2 transition-colors duration-150 hover:bg-fundo-suave has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-azul-texto">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-azul-claro text-azul-texto"><Paperclip className="size-5" strokeWidth={2.5} /></span>
          <span className="min-w-0 flex-1">
            <span className="t-cartao block text-tinta">Escolher o arquivo</span>
            <span className="t-apoio block">PDF ou Word (.docx), até 30 MB</span>
          </span>
          <input ref={entrada} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only" onChange={(e) => { escolherArquivo(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} />
        </label>
      )}
      {/* a turma antes da origem: as duas perguntas em toques, para o passo caber na janela sem rolar */}
      <div className="grid gap-2">
        <p className="t-cartao text-tinta">Para qual turma?</p>
        <GrupoToques rotulo="Para qual turma?" valor={turmaAnexo} aoMudar={(v) => setTurmaAnexo(v as string)}
          opcoes={turmas.map((t) => ({ id: t.id, rotulo: t.nome }))} />
      </div>
      <div className="grid gap-2">
        <p className="t-cartao text-tinta">De quem é este material?</p>
        <GrupoToques rotulo="De quem é este material?" valor={origem} aoMudar={(v) => setOrigem(v as string)}
          opcoes={ORIGENS.map((o) => ({ id: o.id, rotulo: o.nome }))} />
        {origem === 'licenca' && (
          <CampoTexto rotulo="Qual é a licença?" valor={licenca} aoMudar={setLicenca} placeholder="Ex.: CC BY 4.0, ou o contrato da escola com a editora" />
        )}
        <p className="t-apoio">Apostila de terceiro sem licença não entra.</p>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {lista.length === 0 ? (
        <div className="rounded-[12px] border-2 border-borda px-4 py-4">
          <p className="t-cartao text-tinta">Nada criado ainda</p>
          <p className="t-apoio mt-0.5">A prova que você gerar fica em Criados e aparece aqui.</p>
        </div>
      ) : (
        <div role="radiogroup" aria-label="O que adaptar" className="grid max-h-[352px] grid-cols-[minmax(0,1fr)] gap-2 overflow-y-auto overscroll-contain p-0.5 pb-1.5">
          {lista.map((b) => {
            const estado = estadoDoItem(b)
            const t = turmaDaProfessora(b.turmaId)
            return (
              <Opcao key={b.id} nome="o-que-adaptar" valor={b.id} marcado={escolhido === b.id} aoMudar={(v) => { if (v) setEscolhido(b.id) }}
                icone={<IconeFerramenta id={tipoDeAgora(b.de)} className="size-10" />}>
                <span className="block truncate">{b.titulo}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <SeloTurma turma={t?.nome ?? b.turma} materia={t?.disciplina} tamanho="p" />
                  <span className="text-[14px] font-medium text-sutil">{dataDe(b.em)}</span>
                  <Selo tamanho="p" familia={estado === 'aprovado' ? 'verde' : 'amarelo'}>{estado === 'aprovado' ? 'Aprovado' : 'Para aprovar'}</Selo>
                  {/* o que nasceu agora (a prova da introdução, a do anexo) se distingue da semelhante de outra turma */}
                  {b.n >= 1000 && <Selo tamanho="p" familia="azul">Novo</Selo>}
                  {b.origem === 'arquivo' && <Selo tamanho="p">Do arquivo</Selo>}
                </span>
              </Opcao>
            )
          })}
        </div>
      )}
      <button type="button" onClick={() => { setAnexando(true); setEscolhido(null) }}
        className="flex min-h-16 w-full items-center gap-3 rounded-[12px] border-2 border-dashed border-borda-forte bg-white px-3 py-2 text-left transition-colors duration-150 hover:bg-fundo-suave">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-azul-claro text-azul-texto"><Paperclip className="size-5" strokeWidth={2.5} /></span>
        <span className="t-cartao min-w-0 flex-1 text-tinta">Anexar um arquivo <span className="font-medium text-sutil">· PDF ou Word</span></span>
      </button>
    </div>
  )

  /* ── Ninguém da turma tem adaptação registrada: a onça avisa já no passo 2, com a saída (outra prova) e as turmas
     que têm registro ── */
  const turmasComRegistro = turmas.filter((t) => t.id !== turmaAlvo && adaptacoesDe(t.id).length > 0).map((t) => t.nome)
  const ninguem = (
    <EstadoVazio ilustracao={<Onca pose="apontando" tamanho={72} />} titulo={`Ninguém do ${nomeTurma} tem adaptação registrada`} className="py-4"
      acao={(
        <div className="-mt-2 grid justify-items-center gap-3">
          <p className="t-apoio">Quem registra é a coordenação.{turmasComRegistro.length > 0 ? ` Têm registro: ${juntar(turmasComRegistro)}.` : ''}</p>
          <Botao variante="secundario" tamanho="m" onClick={() => { setPasso(0); setEscolhido(null); setAnexando(false) }}>Escolher outra prova</Botao>
        </div>
      )} />
  )

  /* ── Passo 2: que adaptação ── */
  const alternaTipo = (id: string, on: boolean) => setTipos((l) => { const b = l ?? daCoordenacao; return on ? [...b.filter((x) => x !== id), id] : b.filter((x) => x !== id) })
  const como = registrados.length === 0 ? ninguem : (
    <div className="grid gap-3">
      <p className="t-apoio">Muda a forma, nunca o que é cobrado. Não pede nem guarda diagnóstico.</p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-2">
        {TIPOS_ADAPTACAO.map((t) => (
          <Opcao key={t.id} tipo="checkbox" marcado={tiposVivos.includes(t.id)} aoMudar={(on) => alternaTipo(t.id, on)}>
            <span className="block">{t.nome}</span>
            {daCoordenacao.includes(t.id) && <Selo tamanho="p" familia="roxo" className="mt-1">Da coordenação</Selo>}
          </Opcao>
        ))}
      </div>
    </div>
  )

  /* ── Passo 3: para quem ── */
  const alternaAluno = (nome: string, on: boolean) => setPara((l) => { const b = l ?? registrados.map((a) => a.aluno); return on ? [...b.filter((x) => x !== nome), nome] : b.filter((x) => x !== nome) })
  /* um tipo marcado que nenhum dos escolhidos tem registrado: avisa, e um toque tira do pedido */
  const tiposSemNinguem = tiposVivos.filter((t) => daCoordenacao.includes(t) && !registrados.some((a) => paraVivo.includes(a.aluno) && a.tipos.includes(t)))
  const quem = registrados.length === 0 ? ninguem : (
    <div className="grid gap-3">
      <p className="t-apoio">Só quem tem adaptação registrada pela coordenação.</p>
      {tiposSemNinguem.length > 0 && paraVivo.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border-2 border-amarelo-borda bg-amarelo-claro px-3 py-2">
          <p className="min-w-0 flex-1 text-[15px] font-bold text-tinta">
            {juntar(tiposSemNinguem.map(nomeDoTipo))} {tiposSemNinguem.length === 1 ? 'não está registrado' : 'não estão registrados'} para quem vai receber.
          </p>
          <Botao variante="fantasma" tamanho="p" onClick={() => setTipos(tiposVivos.filter((t) => !tiposSemNinguem.includes(t)))}>Tirar do pedido</Botao>
        </div>
      )}
      <div className="grid max-h-[352px] grid-cols-[minmax(0,1fr)] gap-2 overflow-y-auto overscroll-contain p-0.5 pb-1.5">
        {registrados.map((a) => (
          <Opcao key={a.aluno} tipo="checkbox" marcado={paraVivo.includes(a.aluno)} aoMudar={(on) => alternaAluno(a.aluno, on)}>
            <span className="block truncate">{a.aluno}</span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              {a.tipos.map((t) => <Selo key={t} tamanho="p" familia="roxo">{nomeDoTipo(t)}</Selo>)}
              <span className="text-[14px] font-medium text-sutil">{a.validade}</span>
            </span>
          </Opcao>
        ))}
      </div>
    </div>
  )

  const perguntas = ['O que você quer adaptar?', 'Que adaptação?', 'Para quem?']
  const conteudo = (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {/* a janela põe o foco no primeiro campo; este, invisível, segura o foco para o primeiro cartão não abrir já
          contornado como se estivesse escolhido (o Tab leva ao primeiro cartão) */}
      <input type="hidden" aria-hidden />
      <Passos passos={PASSOS} atual={passo} aoIr={setPasso} className="mx-auto max-w-[440px]" />
      <div className="grid gap-3">
        <h3 className="t-secao text-tinta">
          {perguntas[passo]}
          {passo > 0 && nomeTurma && <span className="ml-2 align-middle"><SeloTurma turma={nomeTurma} materia={turmaDaProfessora(turmaAlvo)?.disciplina} /></span>}
        </h3>
        {[oQue, como, quem][passo]}
      </div>
    </div>
  )

  const rodape: ReactNode = (
    <>
      {/* no celular, VOLTAR vira ícone e o primário ocupa a linha: o rodapé não quebra em duas */}
      {passo > 0 && (celular
        ? <BotaoIcone rotulo="Voltar" onClick={() => setPasso((p) => p - 1)} className="shrink-0"><ChevronLeft strokeWidth={2.5} /></BotaoIcone>
        : <Botao variante="secundario" tamanho="m" onClick={() => setPasso((p) => p - 1)}>Voltar</Botao>)}
      <Botao variante="primario" tamanho="m" disabled={!pronto} onClick={() => (ultimo ? gerar() : setPasso((p) => p + 1))} className={celular ? 'min-w-0 flex-1' : undefined}>
        {ultimo ? 'Gerar versão adaptada' : 'Continuar'}
      </Botao>
    </>
  )
  return { conteudo, rodape, passo }
}

/** Os 3 passos em linha (o cartão da ferramenta dentro da conversa). */
export function PassosAdaptar({ turmaId, docId, passoInicial, aoGerar, className }: {
  turmaId?: string; docId?: string; passoInicial?: number
  /** dentro da conversa (ou da página do documento): quem chama gera a versão. Sem ele, abre a conversa nova */
  aoGerar?: (r: ResultadoAdaptar) => void
  /** sem efeito: a peça em linha é sempre em linha */
  emLinha?: boolean
  className?: string
}) {
  const { conteudo, rodape } = useAdaptar({ turmaId, docId, passoInicial, aoGerar })
  return (
    <section className={cn('animate-entra rounded-[16px] border-2 border-borda bg-white', className)}>
      <header className="flex items-center gap-3 border-b-2 border-borda px-4 py-3">
        <IconeFerramenta id="adaptacao" className="size-8 shrink-0" />
        <h2 className="t-cartao text-tinta">Adaptar</h2>
      </header>
      <div className="px-4 py-4">{conteudo}</div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-borda px-4 py-3">{rodape}</footer>
    </section>
  )
}

function MioloDialogo({ turmaId, docId, passoInicial, aoGerar, aoMudar }: {
  turmaId?: string; docId?: string; passoInicial?: number; aoGerar?: (r: ResultadoAdaptar) => void; aoMudar: (v: boolean) => void
}) {
  const celular = useIsMobile()
  const { conteudo, rodape } = useAdaptar({ turmaId, docId, passoInicial, aoGerar: aoGerar ? (r) => { aoGerar(r); aoMudar(false) } : undefined })
  return (
    <Dialogo aberto aoMudar={aoMudar} titulo="Adaptar" largura={640} descricao="O que adaptar, que adaptação e para quem. Nada chega ao aluno sem você aprovar."
      className={celular ? 'inset-0 h-svh max-h-svh w-screen translate-x-0 translate-y-0 rounded-none border-0' : undefined}
      rodape={rodape}>
      {conteudo}
    </Dialogo>
  )
}

/** A janela Adaptar: 640 px no computador, tela inteira no celular. Fechada, ela esquece o que foi escolhido. */
export function DialogoAdaptar({ aberto, aoMudar, turmaId, docId, passoInicial, aoGerar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; turmaId?: string; docId?: string
  /** 1 abre no "Que adaptação?" (o VERSÃO ADAPTADA do documento, com `docId`) */
  passoInicial?: number
  /** a página do documento gera ali mesmo (aba Adaptada); sem ele, abre a conversa nova */
  aoGerar?: (r: ResultadoAdaptar) => void
}) {
  if (!aberto) return null
  return <MioloDialogo key={`${turmaId}-${docId}-${passoInicial}`} turmaId={turmaId} docId={docId} passoInicial={passoInicial} aoGerar={aoGerar} aoMudar={aoMudar} />
}
