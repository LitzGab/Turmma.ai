import { useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eraser, EyeOff, FileDown, FolderOpen, PencilLine, RotateCcw, SlidersHorizontal, Sparkles, TextCursorInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GenericTool } from '@/components/ui/generic-tool'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Fontes } from '@/components/turmma/conversa'
import { AVISO_ADAPTACAO, AVISO_PADRAO, Campo, MotorFormulario, chaveDe, visivel, type MotorHandle, type Valores } from '@/components/turmma/ferramentas'
import { AssinaturaIA, ChipFonte, Estado } from '@/components/turmma/ia'
import { LadrilhoFerramenta } from '@/components/turmma/icones-ferramenta'
import { NotaMockup, TelaCheia } from '@/components/turmma/tela'
import { MATERIAIS, turmaDe } from '@/dados/escola'
import { CAPITULOS, ferramenta, type Ferramenta } from '@/dados/ferramentas'
import { cn } from '@/lib/utils'
import { abaGatilho, abasLista } from './_pecas'

/* A TELA DE UMA FERRAMENTA (1.2). Sétima rodada, 20/09/2026 — o Gabriel, vendo o Mapa mental preenchido: "nosso
   formulário está ficando muito feio ao ser preenchido direto pela ferramenta, precisa melhorar para ficar mais
   bonito e confirmar que tem todas as infos necessárias com base na Teachy".

   A tela lê a ferramenta de `dados/ferramentas`; quem desenha os campos é o motor de `components/turmma/ferramentas`
   (o MESMO do cartão da conversa, D18). Aqui mora só a moldura, igual para as 16 ferramentas que têm formulário —
   Prova, Adaptação e Redação inclusive:
   · cabeçalho do objeto: o ladrilho da ferramenta, o nome e a promessa numa linha; à direita, "Preencher exemplo"
     (escreve nos campos de texto o exemplo do catálogo; é estático) e "← Ferramentas". O chip de categoria saiu;
   · a tela ocupa a janela (1440 × 780) e NÃO rola: o formulário é um cartão com o miolo rolando por dentro e o
     rodapé fixo (o aviso à esquerda, o botão com o verbo da ferramenta à direita). Abaixo de 1280 px vira uma
     coluna e a página rola normalmente;
   · a coluna da direita é UMA peça com cara de documento: a folha "Como vai sair" — o título da prévia, as seções
     do que vem no resultado como cabeçalhos, com texto de verdade embaixo e a página citada em chip —, depois os
     formatos e a fonte, e por último, discreto, o mesmo pedido pela conversa. Saíram o ladrilho gigante em degradê
     e as três caixas empilhadas;
   · "gerando" e "pronto" continuam: o formulário vira uma linha com o que foi pedido, e o resultado é um cartão com
     a mesma anatomia (topo, miolo que rola, rodapé com as ações). Entraram "Gerar outra versão", "Mais curto / Mais
     longo" onde o tamanho é texto, e, na coluna da direita, as passagens para outra ferramenta com a turma e o
     tema já preenchidos (os modificadores da Teachy que valem aqui; "adaptar para alunos" virou "Gerar versão
     adaptada", pela lista fechada de tipos);
   · Redação e discursiva (D55) usa a mesma moldura, com as três abas embaixo do cabeçalho. A rubrica agora respeita
     o número de critérios e de níveis escolhido, inclusive na aba Corrigir, e dá para editar antes de aplicar. */

type Fase = 'formulario' | 'gerando' | 'pronto'

/* ─── A moldura ──────────────────────────────────────────────────────────────────────────────── */

function Moldura({ f, acoes, children }: { f: Ferramenta; acoes?: ReactNode; children: ReactNode }) {
  return (
    <TelaCheia titulo={f.nome} className="h-auto pb-8 md:h-auto xl:h-svh xl:pb-4">
      <div className="mx-auto flex min-h-0 w-full max-w-[1240px] flex-1 flex-col">
        <header className="mb-4 flex flex-wrap items-center gap-x-3.5 gap-y-3">
          <LadrilhoFerramenta id={f.id} tamanho="sm" />
          <div aria-hidden className="min-w-0 flex-1 basis-60">
            <p className="font-titulo text-[20px] font-semibold leading-tight tracking-[-0.015em] text-tinta">{f.nome}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-sutil xl:truncate">{f.promessa}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {acoes}
            <Button variant="discreto" size="sm" asChild><Link to="/professor/ferramentas"><ArrowLeft /> Ferramentas</Link></Button>
          </div>
        </header>
        {children}
      </div>
    </TelaCheia>
  )
}

/** Formulário (ou resultado) à esquerda, a folha à direita. A altura é a da janela; quem rola é o miolo de cada cartão. */
function DuasColunas({ children, lado }: { children: ReactNode; lado: ReactNode }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_328px] xl:grid-rows-[minmax(0,1fr)]">
      <div className="flex min-h-0 min-w-0 flex-col gap-3 xl:max-h-full">{children}</div>
      {lado}
    </div>
  )
}

const cartaoTela = 'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-cartao border border-linha bg-superficie'

function CartaoRolavel({ topo, rodape, children, className }: { topo?: ReactNode; rodape?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(cartaoTela, 'animate-entra', className)}>
      {topo && <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-linha px-4 py-3 lg:px-5">{topo}</div>}
      <div className="@container relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 lg:px-5">{children}</div>
      {rodape && <div className="flex shrink-0 flex-wrap items-center gap-1 border-t border-linha px-4 py-3 lg:px-5">{rodape}</div>}
    </section>
  )
}

/** "Química 2, cap. 7", ou "Química 2, cap. 7 ao cap. 9" quando o formulário pede um intervalo de capítulos. */
function materialDoPedido(f: Ferramenta, valores?: Valores) {
  const campo = f.campos.find((c) => c.tipo === 'material')
  const material = MATERIAIS.find((m) => m.id === valores?.material)
  if (!campo || !material) return ''
  const nome = material.titulo.split(' — ')[0]
  if (campo.tipo !== 'material' || !campo.varios) return `${nome}, ${material.capitulo.split(' · ')[0]}`
  const cap = (ponta: 'de' | 'ate') => (CAPITULOS[material.id]?.[Number(valores?.[`material:${ponta}`] ?? 0)] ?? '').split(' · ')[0]
  return cap('de') === cap('ate') ? `${nome}, ${cap('de')}` : `${nome}, ${cap('de')} ao ${cap('ate')}`
}

/** O formulário recolhido numa linha, enquanto gera e depois de pronto. */
function Pedido({ f, valores, aoEditar }: { f: Ferramenta; valores?: Valores; aoEditar?: () => void }) {
  const Icone = f.icon
  /* campo condicional que estava escondido não conta o pedido, mesmo que o "Preencher exemplo" tenha escrito nele */
  const aVista = f.campos.map((c, i) => ({ c, k: chaveDe(c, i) })).filter(({ c }) => !valores || visivel(c, valores))
  const digitado = aVista.map(({ c, k }) => ((c.tipo === 'texto' || c.tipo === 'longo') && !c.avancado ? String(valores?.[k] ?? '') : '')).find((t) => t.trim())
  /* o que foi escolhido da biblioteca e os cartões de múltipla escolha (os tipos de adaptação) também contam o pedido */
  const escolhido = aVista.flatMap(({ c, k }) => {
    const v = valores?.[k]
    if (c.tipo === 'artefato' && typeof v === 'string') return [v]
    if (c.tipo === 'cartoes' && c.multiplo && Array.isArray(v)) return [c.opcoes.filter((o) => (v as string[]).includes(o.id)).map((o) => o.nome).join(' + ')]
    return []
  })
  const turma = valores?.turma && !escolhido.some((e) => e.includes(turmaDe(String(valores.turma)).nome)) && turmaDe(String(valores.turma)).nome
  const partes = [turma, materialDoPedido(f, valores), ...escolhido, digitado].filter(Boolean)
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-cartao border border-linha bg-superficie px-4 py-2.5 text-[14px] text-apoio lg:px-5">
      <Icone className="size-4 shrink-0 text-sutil" strokeWidth={1.75} />
      <p className="min-w-0 flex-1 truncate"><b className="font-semibold text-tinta">{f.nome}</b>{partes.map((p) => ` · ${p}`)}</p>
      {aoEditar && <button type="button" onClick={aoEditar} className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-tinta underline-offset-4 hover:underline"><SlidersHorizontal className="size-3.5" strokeWidth={1.75} /> Editar os campos</button>}
    </div>
  )
}

/* ─── A folha: como vai sair ─────────────────────────────────────────────────────────────────── */

/** O mapa mental sai desenhado: é o único resultado que não é texto. */
function MapaDesenhado({ itens, className }: { itens: { texto: string; pagina?: number }[]; className?: string }) {
  const pos = [[92, 44], [92, 150], [92, 256], [548, 84], [548, 216]]
  return (
    <svg viewBox="0 0 640 300" role="img" aria-label="Mapa mental de estequiometria, com cinco ramos" className={cn('w-full rounded-controle bg-lateral', className)}>
      {pos.map(([x, y], i) => <path key={i} d={`M320 150C${x < 320 ? 230 : 410} 150 ${x < 320 ? 250 : 390} ${y} ${x < 320 ? x + 84 : x - 84} ${y}`} stroke="#0D0D0D" strokeOpacity=".25" strokeWidth="2" fill="none" />)}
      <rect x="236" y="124" width="168" height="52" rx="26" fill="#E8732E" /><text x="320" y="156" textAnchor="middle" fontSize="17" fontWeight="600" fill="#fff">Estequiometria</text>
      {pos.map(([x, y], i) => {
        const [nome] = (itens[i]?.texto ?? '').split(':')
        const escuro = i % 2 === 0
        return (
          <g key={i}>
            <rect x={x - 84} y={y - 22} width="168" height="44" rx="22" fill={escuro ? '#0D0D0D' : '#fff'} stroke={escuro ? 'none' : '#D9D9D9'} />
            <text x={x} y={y - 1} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={escuro ? '#fff' : '#0D0D0D'}>{nome.length > 24 ? `${nome.slice(0, 23)}…` : nome}</text>
            <text x={x} y={y + 14} textAnchor="middle" fontSize="10.5" fill={escuro ? '#ffffff99' : '#5D5D5D'}>p. {itens[i]?.pagina}</text>
          </g>
        )
      })}
    </svg>
  )
}

const PASSAGENS: Record<string, { rotulo: string; para: string }[]> = {
  plano: [{ rotulo: 'Gerar a apresentação desta aula', para: 'apresentacao' }, { rotulo: 'Fazer uma lista disso', para: 'atividade' }, { rotulo: 'Gerar resumo para a turma', para: 'material' }],
  apresentacao: [{ rotulo: 'Fazer uma lista disso', para: 'atividade' }, { rotulo: 'Gerar resumo para a turma', para: 'material' }],
  material: [{ rotulo: 'Fazer uma lista disso', para: 'atividade' }, { rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
  mapa: [{ rotulo: 'Fazer uma lista disso', para: 'atividade' }, { rotulo: 'Gerar resumo para a turma', para: 'material' }],
  experimento: [{ rotulo: 'Fazer uma lista disso', para: 'atividade' }],
  prova: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
  atividade: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
  diagnostica: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
  proposta: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }, { rotulo: 'Preparar a rubrica e o lote', para: 'redacao' }],
  periodo: [{ rotulo: 'Gerar o plano da próxima aula', para: 'plano' }],
  projeto: [{ rotulo: 'Gerar o plano da primeira aula', para: 'plano' }],
  recuperacao: [{ rotulo: 'Fazer uma lista disso', para: 'atividade' }],
  simulado: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
  importar: [{ rotulo: 'Gerar versão adaptada', para: 'adaptacao' }],
}

/** A coluna da direita, uma peça só: a folha em miniatura, os formatos e a fonte, e o mesmo pedido pela conversa. */
function ComoVaiSair({ f, fase, valores }: { f: Ferramenta; fase: Fase; valores?: Valores }) {
  const navegar = useNavigate()
  const secoes = f.vem.map((nome, i) => ({ nome, itens: f.previa.itens.filter((q) => q.em === i), amostra: f.amostra?.[i] ?? null }))
  const passagens = fase === 'pronto' ? PASSAGENS[f.id] ?? [] : []
  const digitado = f.campos.map((c, i) => (c.tipo === 'texto' && !c.avancado ? String(valores?.[c.id ?? `c${i}`] ?? '') : '')).find((t) => t.trim())
  return (
    <aside aria-label="Como vai sair" className={cn(cartaoTela, 'bg-lateral xl:max-h-full')}>
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 px-4">
        <h2 className="rotulo">{fase === 'pronto' ? 'Como saiu' : 'Como vai sair'}</h2>
        {f.pendente && <Estado tipo="pendente" size="sm">Nasce esperando você</Estado>}
      </div>
      <div className="relative max-h-[448px] min-h-0 flex-1 overflow-hidden px-4">
        <div aria-hidden className="rounded-t-[6px] bg-white px-5 pb-12 pt-3.5 shadow-[0_0_0_1px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.05)]">
          <p className="flex items-center justify-between gap-3 border-b border-linha pb-1.5 text-[9.5px] leading-none text-inativo"><span>Colégio Aurora</span><span>{f.nome}</span></p>
          <p className="mt-2.5 text-[13px] font-semibold leading-snug text-tinta">{f.previa.titulo}</p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-sutil">{f.previa.resumo}</p>
          {f.id === 'mapa' && <MapaDesenhado itens={f.previa.itens} className="mt-2.5 rounded-[6px]" />}
          {secoes.map((s, i) => (
            <section key={s.nome} className="mt-2.5">
              <h3 className="flex items-baseline gap-1.5 font-corpo text-[10.5px] font-semibold leading-snug text-tinta"><span className="w-2.5 shrink-0 font-medium text-inativo">{i + 1}</span>{s.nome}</h3>
              <div className="mt-0.5 grid gap-0.5 pl-4 text-[10.5px] leading-[1.45] text-apoio">
                {s.itens.slice(0, f.id === 'mapa' ? 2 : 3).map((q) => (
                  <p key={q.texto} className="line-clamp-2">{q.rotulo && !s.nome.toLowerCase().includes(q.rotulo.toLowerCase()) && <b className="font-semibold text-tinta">{q.rotulo}. </b>}{q.texto}
                    {q.pagina && <span className="ml-1 inline-flex h-[14px] items-center rounded-[4px] bg-realce-suave px-1 align-[1px] text-[9px] font-medium leading-none text-sutil">p. {q.pagina}</span>}</p>
                ))}
                {s.itens.length === 0 && s.amostra && <p className="line-clamp-2">{s.amostra}</p>}
              </div>
            </section>
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-lateral to-transparent" />
      </div>
      <dl className="grid shrink-0 gap-1 border-t border-linha px-4 py-2.5 text-[12.5px] leading-snug">
        <div className="flex gap-2"><dt className="w-12 shrink-0 text-sutil">Sai em</dt><dd className="min-w-0 font-medium text-tinta">{[...f.saida, 'Impressão'].join(' · ')}</dd></div>
        <div className="flex gap-2"><dt className="w-12 shrink-0 text-sutil">Fonte</dt><dd className="min-w-0 font-medium text-tinta">{f.fonte}</dd></div>
      </dl>
      {passagens.length > 0 ? (
        <div className="shrink-0 border-t border-linha px-4 py-3">
          <p className="text-[12px] leading-none text-sutil">Continuar daqui</p>
          <ul className="mt-1.5 grid">
            {passagens.map((p) => (
              <li key={p.rotulo}><button type="button" onClick={() => navegar(`/professor/ferramentas/${p.para}`, { state: { turma: valores?.turma, tema: digitado, origem: f.previa.titulo } })}
                className="group flex h-8 w-full items-center justify-between gap-2 text-left text-[13px] font-medium text-tinta">{p.rotulo} <ArrowRight className="size-3.5 text-inativo transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-tinta" /></button></li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="shrink-0 border-t border-linha px-4 py-3">
          <p className="text-[12px] leading-none text-sutil">Prefere pedir na conversa?</p>
          <p className="mt-1.5 text-[13px] leading-snug text-tinta">“{f.exemplo}”</p>
          <button type="button" onClick={() => navegar('/professor', { state: { pedido: f.exemplo, ferramenta: f.id } })}
            className="group mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-tinta underline-offset-4 hover:underline">
            Pedir na conversa <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </aside>
  )
}

/* ─── O resultado ────────────────────────────────────────────────────────────────────────────── */

const COM_TAMANHO = ['material', 'plano', 'proposta', 'experimento', 'apresentacao']
/** O pedido livre da Teachy vira conversa: uma linha no fim do resultado abre o chat com o artefato no contexto. */
const AJUSTE: Record<string, string> = {
  planejar: 'passa a prática em dupla para a primeira aula', preparar: 'deixa o segundo bloco em linguagem mais simples',
  avaliar: 'troca a questão 3 por uma com tabela', corrigir: 'junta os critérios 1 e 2',
}

function Resultado({ f, aoGerarOutra }: { f: Ferramenta; aoGerarOutra: () => void }) {
  const navegar = useNavigate()
  const p = f.previa
  const emLinhas = p.itens.some((q) => q.rotulo)
  const comPagina = p.itens.filter((q) => q.pagina)
  const origem = (q: { pagina?: number }) => q.pagina
    ? <ChipFonte pagina={q.pagina} />
    : f.id === 'simulado' ? <span className="mx-0.5 inline-flex h-[22px] items-center rounded-[6px] bg-ia-cx px-1.5 align-middle text-xs font-medium text-ia">banco público do ENEM</span> : null
  return (
    <CartaoRolavel
      topo={<>
        <AssinaturaIA id={f.id === 'adaptacao' ? 'adaptador' : 'assistente'} />
        {f.pendente ? <Estado tipo="pendente">Esperando você</Estado> : <Estado tipo="ok">Salvo na biblioteca</Estado>}
      </>}
      rodape={<>
        <Button variant="secundario" size="sm" asChild><Link to="/professor/biblioteca/prova-estequiometria"><FolderOpen /> Abrir na biblioteca</Link></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="discreto" size="sm"><FileDown /> Exportar</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-controle">
            {[...f.saida.map((s) => `Exportar em ${{ PDF: 'PDF', PPTX: 'PowerPoint (PPTX)', XLSX: 'Excel (XLSX)' }[s] ?? s}`), 'Imprimir'].map((o) => <DropdownMenuItem key={o} className="h-10 rounded-linha">{o}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="discreto" size="sm" onClick={aoGerarOutra}><RotateCcw /> Gerar outra versão</Button>
        {COM_TAMANHO.includes(f.id) && <><Button variant="discreto" size="sm" onClick={aoGerarOutra}>Mais curto</Button><Button variant="discreto" size="sm" onClick={aoGerarOutra}>Mais longo</Button></>}
      </>}>
      <h2 className="font-corpo text-lg font-semibold leading-snug text-tinta">{p.titulo}</h2>
      <p className="mt-0.5 text-[14.5px] leading-snug text-sutil">{f.id === 'adaptacao' ? 'Mesmas dez questões, outra forma. Nasce pendente: só chega ao aluno depois que você aprovar.' : p.resumo}</p>
      {f.id === 'mapa' && <MapaDesenhado itens={p.itens} className="mt-4" />}
      {emLinhas ? (
        <dl className="mt-4 grid gap-px overflow-hidden rounded-controle border border-linha bg-linha">
          {p.itens.map((q) => (
            <div key={q.texto} className="grid gap-x-4 gap-y-0.5 bg-superficie px-3.5 py-2.5 @[560px]:grid-cols-[112px_minmax(0,1fr)]">
              <dt className="text-[13px] font-semibold text-tinta">{q.rotulo}</dt>
              <dd className="text-[15px] leading-[1.55] text-tinta">{q.texto} {origem(q)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <ol className="mt-4 grid list-decimal gap-3 pl-6 text-[15.5px] leading-[1.6] text-tinta marker:font-semibold marker:text-sutil">
          {p.itens.map((q) => <li key={q.texto} className="pl-1">{q.texto} {origem(q)}</li>)}
        </ol>
      )}
      {comPagina.length > 0 && <Fontes itens={comPagina.filter((q, i) => comPagina.findIndex((x) => x.pagina === q.pagina) === i).map((q) => ({ tipo: 'material' as const, titulo: 'Química 2 — Material próprio do Colégio Aurora', pagina: q.pagina! }))} />}
      <button type="button" onClick={() => navegar('/professor', { state: { pedido: `Sobre “${p.titulo}”: `, ferramenta: f.id } })}
        className="group mt-4 flex h-10 w-full items-center gap-2.5 rounded-full border border-linha bg-lateral px-4 text-left text-[13.5px] text-sutil transition-colors duration-150 hover:border-borda-campo hover:text-tinta">
        <PencilLine className="size-4 shrink-0" strokeWidth={1.75} /> <span className="min-w-0 flex-1 truncate">Peça um ajuste na conversa: “{f.id === 'adaptacao' ? 'põe uma questão por página' : AJUSTE[f.categoria]}”</span> <ArrowRight className="size-3.5 shrink-0" />
      </button>
    </CartaoRolavel>
  )
}

/* ─── Redação e discursiva (D55) ─────────────────────────────────────────────────────────────
   A ferramenta gera RUBRICA e critérios ANTES da aplicação, organiza o lote e apoia a correção cega.
   A IA não corrige, não avalia, não dá nota nem conceito, não pré-corrige e não escreve devolutiva.
   Nenhum campo desta tela é preenchido por IA a partir do texto de um aluno. */

type Criterio = { nome: string; niveis: string[] }

/* Cada critério tem quatro níveis escritos; com três níveis saem o primeiro, o segundo e o último. */
const CRITERIOS: Criterio[] = [
  { nome: 'Enuncia a lei de Lavoisier', niveis: ['Não enuncia', 'Enuncia com imprecisão', 'Enuncia corretamente, com as palavras do livro', 'Enuncia corretamente, com as próprias palavras'] },
  { nome: 'Relaciona com um exemplo de reação', niveis: ['Sem exemplo', 'Exemplo sem as massas', 'Exemplo com as massas, sem fechar a conta', 'Exemplo com as massas de reagentes e produtos'] },
  { nome: 'Explica o sistema fechado', niveis: ['Não menciona', 'Menciona sem explicar', 'Explica o sistema fechado, sem comparar com o aberto', 'Explica por que a massa parece mudar em sistema aberto'] },
  { nome: 'Clareza e organização do texto', niveis: ['Ideias soltas', 'Ordem compreensível', 'Texto encadeado, sem conclusão', 'Texto encadeado, com conclusão'] },
  { nome: 'Usa a linguagem da Química', niveis: ['Não usa os termos', 'Usa os termos com erro', 'Usa reagente, produto e massa corretamente', 'Usa os termos e escreve a equação'] },
]
const COMPETENCIAS: Criterio[] = [
  { nome: 'Domínio da escrita formal', niveis: ['Muitos desvios, que atrapalham a leitura', 'Desvios frequentes', 'Poucos desvios', 'Escrita formal, com desvios raros'] },
  { nome: 'Compreensão do tema e do gênero', niveis: ['Foge ao tema', 'Tangencia o tema', 'Desenvolve o tema de modo previsível', 'Desenvolve o tema com repertório do capítulo'] },
  { nome: 'Seleção e organização dos argumentos', niveis: ['Sem ponto de vista', 'Argumentos soltos', 'Argumentos organizados, pouco desenvolvidos', 'Argumentos organizados e desenvolvidos'] },
  { nome: 'Coesão', niveis: ['Frases sem ligação', 'Ligação repetitiva', 'Ligação adequada, com falhas', 'Ligação variada entre frases e parágrafos'] },
  { nome: 'Proposta de intervenção', niveis: ['Sem proposta', 'Proposta vaga', 'Proposta com ação e agente', 'Proposta detalhada: ação, agente, meio e efeito'] },
]
const montarRubrica = (para: string, criterios: number, niveis: number): Criterio[] =>
  (para === 'redacao' ? COMPETENCIAS : CRITERIOS.slice(0, criterios)).map((c) => ({ nome: c.nome, niveis: niveis === 4 ? c.niveis : [c.niveis[0], c.niveis[1], c.niveis[3]] }))

function Rubrica({ criterios, compacta = false, editando = false, aoMudar }: { criterios: Criterio[]; compacta?: boolean; editando?: boolean; aoMudar?: (c: Criterio[]) => void }) {
  const muda = (i: number, novo: Criterio) => aoMudar?.(criterios.map((c, j) => (j === i ? novo : c)))
  return (
    <div className="grid gap-2">
      {criterios.map((c, i) => (
        <div key={i} className="rounded-controle border border-linha bg-superficie p-3">
          {editando
            ? <Input value={c.nome} onChange={(e) => muda(i, { ...c, nome: e.target.value })} aria-label={`Critério ${i + 1}`} className="h-9 rounded-linha border-borda-campo text-[14px] font-semibold" />
            : <p className="text-[14px] font-semibold leading-snug text-tinta"><span className="mr-1.5 font-medium text-inativo">{i + 1}</span>{c.nome}</p>}
          <ol className={cn('mt-2 grid gap-1.5', !compacta && (c.niveis.length === 4 ? '@[560px]:grid-cols-4' : '@[560px]:grid-cols-3'))}>
            {c.niveis.map((n, j) => (
              <li key={j} className="rounded-linha bg-realce-suave px-2.5 py-1.5 text-[12.5px] leading-snug text-apoio">
                <b className="block text-[11.5px] font-semibold text-tinta">Nível {j + 1}</b>
                {editando
                  ? <Textarea rows={2} value={n} onChange={(e) => muda(i, { ...c, niveis: c.niveis.map((x, k) => (k === j ? e.target.value : x)) })} aria-label={`Critério ${i + 1}, nível ${j + 1}`} className="mt-1 min-h-0 rounded-[8px] border-borda-campo bg-superficie px-2 py-1 text-[12.5px] leading-snug" />
                  : n}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

const AVISO_REDACAO = 'A IA prepara a rubrica antes da aplicação. Ela não lê, não corrige e não dá nota a texto de aluno.'

function Redacao({ f }: { f: Ferramenta }) {
  const [aba, setAba] = useState('rubrica')
  const [fase, setFase] = useState<Fase>('formulario')
  const [valores, setValores] = useState<Valores>()
  const [rubrica, setRubrica] = useState<Criterio[] | null>(null)
  const [editando, setEditando] = useState(false)
  const [comExemplo, setComExemplo] = useState(false)
  const [salva, setSalva] = useState(false)
  const motor = useRef<MotorHandle>(null)
  const gerar = (v: Valores) => {
    setValores(v); setFase('gerando'); setEditando(false)
    window.setTimeout(() => { setRubrica(montarRubrica(String(v.para), Number(v.criterios), Number(v.niveis))); setFase('pronto') }, 1500)
  }
  const emUso = rubrica ?? montarRubrica('discursiva', 4, 3)

  return (
    <Moldura f={f} acoes={aba === 'rubrica' && fase === 'formulario' && (
      <Button variant="discreto" size="sm" onClick={() => { if (comExemplo) motor.current?.limpar(); else motor.current?.preencherExemplo(); setComExemplo(!comExemplo) }}>
        {comExemplo ? <><Eraser /> Limpar</> : <><TextCursorInput /> Preencher exemplo</>}
      </Button>
    )}>
      <Tabs value={aba} onValueChange={setAba} className="flex min-h-0 flex-1 flex-col">
        <TabsList className={cn(abasLista, 'mb-3 shrink-0 self-start')}>
          <TabsTrigger value="rubrica" className={abaGatilho}>1. Rubrica</TabsTrigger>
          <TabsTrigger value="lote" className={abaGatilho}>2. Lote</TabsTrigger>
          <TabsTrigger value="corrigir" className={abaGatilho}>3. Corrigir</TabsTrigger>
        </TabsList>

        <TabsContent value="rubrica" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <DuasColunas lado={<ComoVaiSair f={f} fase={fase} valores={valores} />}>
            {fase === 'formulario' ? (
              <section className={cartaoTela}>
                <MotorFormulario ref={motor} variante="tela" campos={f.campos} extras={f.extras} verbo={rubrica ? 'Gerar outra rubrica' : f.verbo} aviso={AVISO_REDACAO} iniciais={valores} aoGerar={gerar} />
              </section>
            ) : <Pedido f={f} valores={valores} aoEditar={fase === 'pronto' ? () => setFase('formulario') : undefined} />}
            {fase === 'gerando' && <section className={cn(cartaoTela, 'px-4 py-4 lg:px-5')}><GenericTool icon={Sparkles} title="Montando a rubrica…" subtitle="a partir do enunciado e do material" isPending className="[&_*]:!text-[15px]" /></section>}
            {fase === 'pronto' && rubrica && (
              <CartaoRolavel
                topo={<><AssinaturaIA id="assistente" /><Estado tipo="contorno">Rascunho seu: edite antes de aplicar</Estado>
                  <Button variant={editando ? 'oficial' : 'secundario'} size="sm" className="ml-auto" onClick={() => setEditando(!editando)}>{editando ? <><Check /> Concluir edição</> : <><PencilLine /> Editar rubrica</>}</Button></>}
                rodape={<>
                  <p className="min-w-0 flex-1 basis-56 text-[12.5px] leading-snug text-sutil">Base: Química 2, conservação da massa <ChipFonte pagina={131} />. Feita do enunciado, antes de qualquer aluno responder.</p>
                  <Button variant="secundario" size="sm" onClick={() => setAba('lote')}>Ir para o lote <ArrowRight /></Button>
                </>}>
                <Rubrica criterios={rubrica} editando={editando} aoMudar={setRubrica} />
              </CartaoRolavel>
            )}
          </DuasColunas>
        </TabsContent>

        <TabsContent value="lote" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <CartaoRolavel className="xl:max-h-full"
            topo={<><h2 className="font-corpo text-[15px] font-semibold text-tinta">Lote · discursiva sobre Lavoisier · 1ºC</h2><Estado tipo="info" className="ml-auto">Correção cega ligada</Estado></>}
            rodape={<><p className="min-w-0 flex-1 basis-56 text-[12.5px] leading-snug text-sutil">O Assistente não leu os textos para avaliar: só conferiu as entregas, tirou os nomes e embaralhou a ordem.</p><Button variant="secundario" size="sm" onClick={() => setAba('corrigir')}>Continuar no Texto 07 <ArrowRight /></Button></>}>
            <div className="grid gap-3 @[560px]:grid-cols-3">
              {[['Entregues', '31 de 34'], ['Faltaram à avaliação', '3'], ['Corrigidas por você', '6 de 31']].map(([r, v]) => (
                <div key={r} className="rounded-controle bg-realce-suave p-3"><p className="rotulo">{r}</p><p className="numero-painel mt-2.5 text-tinta">{v}</p></div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[14.5px] leading-snug text-apoio">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-sutil" /> Você corrige "Texto 07", e o nome só volta depois que salvar.
            </p>
            <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1.5 @[560px]:grid-cols-2 @[900px]:grid-cols-4">
              {Array.from({ length: 31 }, (_, i) => `Texto ${String(i + 1).padStart(2, '0')}`).map((t, i) => (
                <li key={t} className="flex h-10 items-center justify-between rounded-controle border border-linha px-3 text-[14.5px] text-tinta">
                  {t} {i < 6 ? <Estado tipo="ok" size="sm">Corrigido por você</Estado> : <Estado tipo="contorno" size="sm">A corrigir</Estado>}
                </li>
              ))}
            </ul>
          </CartaoRolavel>
        </TabsContent>

        <TabsContent value="corrigir" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain data-[state=inactive]:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="grid content-start gap-3">
              <section className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
                <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-corpo text-[15px] font-semibold text-tinta">Texto 07</h2><Estado tipo="info" size="sm">Sem nome: correção cega</Estado></div>
                <p className="text-[15.5px] leading-[1.7] text-tinta">
                  A lei de Lavoisier diz que na natureza nada se cria e nada se perde, tudo se transforma. Isso quer dizer que a massa do começo é igual a massa do final. Quando a gente queima papel parece que some, mas é porque a fumaça foi embora. Se fosse num pote fechado o peso ia ser o mesmo.
                </p>
              </section>
              <section className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
                <h2 className="mb-3 font-corpo text-[15px] font-semibold text-tinta">Sua correção</h2>
                <div className="grid gap-3.5">
                  {emUso.map((c, i) => (
                    <fieldset key={c.nome}>
                      <legend className="mb-1.5 text-[12.5px] font-medium text-sutil">{i + 1}. {c.nome}</legend>
                      <RadioGroup className={cn('gap-1.5', c.niveis.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
                        {c.niveis.map((_, n) => (
                          <Label key={n} className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-controle border-[1.5px] border-linha text-[14px] font-normal text-tinta transition-colors duration-150 hover:border-borda-campo hover:bg-lateral has-[[data-state=checked]]:border-tinta has-[[data-state=checked]]:font-semibold">
                            <RadioGroupItem value={String(n + 1)} className="border-borda-campo text-noite" /> Nível {n + 1}
                          </Label>
                        ))}
                      </RadioGroup>
                    </fieldset>
                  ))}
                  <Campo rotulo="Sua devolutiva para o aluno" dica="Este campo começa vazio e continua seu: a IA não escreve nem sugere devolutiva de discursiva.">
                    {(i) => <Textarea id={i} rows={3} placeholder="Escreva aqui o que o aluno acertou e o que falta." className="min-h-0 rounded-controle border-borda-campo bg-superficie text-[15px] placeholder:text-inativo" />}
                  </Campo>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {salva ? <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ok"><Check className="size-4" /> Salvo. Era o texto de Helena Prado.</p> : <span className="text-[12.5px] text-sutil">O nome aparece depois de salvar.</span>}
                    <Button onClick={() => setSalva(true)}>Salvar devolutiva</Button>
                  </div>
                </div>
              </section>
            </div>
            <div className="grid content-start gap-2.5">
              <p className="rotulo flex h-6 items-center">Rubrica ao lado{!rubrica && <span className="ml-1.5 font-normal text-inativo">· a última que você gerou</span>}</p>
              <Rubrica criterios={emUso} compacta />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <NotaMockup>
        F6/F7, fora do MVP. D55: nada é gerado por IA sobre o texto do aluno — nem nota, nem conceito, nem rascunho de devolutiva. A rubrica nasce do enunciado, antes da aplicação.
        O Assistente só organiza o lote e esconde os nomes. Quando a nota oficial existir (D46, F17), o campo de nota entra aqui, vazio, do professor.
      </NotaMockup>
    </Moldura>
  )
}

/* ─── A tela ─────────────────────────────────────────────────────────────────────────────────── */

function TelaFerramenta({ f }: { f: Ferramenta }) {
  const chegou = useLocation().state as { turma?: string; tema?: string; origem?: string } | null
  const [fase, setFase] = useState<Fase>('formulario')
  const [comExemplo, setComExemplo] = useState(false)
  /* Quem vem de outra ferramenta ("Fazer uma lista disso") já traz a turma e o tema: é o mesmo contrato (D18). */
  const [valores, setValores] = useState<Valores | undefined>(() => {
    if (!chegou) return undefined
    const i = f.campos.findIndex((c) => c.tipo === 'texto' && !c.avancado)
    const k = i >= 0 ? f.campos[i].id ?? `c${i}` : null
    return { ...(chegou.turma ? { turma: chegou.turma } : {}), ...(k && chegou.tema ? { [k]: chegou.tema } : {}), ...(f.id === 'adaptacao' && chegou.origem ? { origem: chegou.origem } : {}) }
  })
  const motor = useRef<MotorHandle>(null)

  const gerar = (v?: Valores) => { if (v) setValores(v); setFase('gerando'); window.setTimeout(() => setFase('pronto'), 1600) }
  const material = MATERIAIS.find((m) => m.id === valores?.material) ?? MATERIAIS[0]
  const lendo = f.id === 'importar' ? 'lendo prova-modelos-2025.pdf' : f.id === 'simulado' ? 'buscando no banco público do ENEM'
    : f.id === 'adaptacao' ? 'mesmo conteúdo, outra forma' : `lendo ${materialDoPedido(f, valores) || `${material.titulo.split(' — ')[0]}, ${material.capitulo.split(' · ')[0]}`}`
  const temExemplo = f.campos.some((c) => c.tipo === 'texto' || c.tipo === 'longo' || (c.tipo === 'arquivo' && !!c.amostra))

  return (
    <Moldura f={f} acoes={fase === 'formulario' && temExemplo && (
      <Button variant="discreto" size="sm" onClick={() => { if (comExemplo) motor.current?.limpar(); else motor.current?.preencherExemplo(); setComExemplo(!comExemplo) }}>
        {comExemplo ? <><Eraser /> Limpar</> : <><TextCursorInput /> Preencher exemplo</>}
      </Button>
    )}>
      <DuasColunas lado={<ComoVaiSair f={f} fase={fase} valores={valores} />}>
        {fase === 'formulario' ? (
          <section className={cartaoTela}>
            <MotorFormulario ref={motor} variante="tela" campos={f.campos} extras={f.extras} verbo={f.verbo} iniciais={valores}
              aviso={f.id === 'adaptacao' ? AVISO_ADAPTACAO : AVISO_PADRAO} aoGerar={gerar} />
          </section>
        ) : <Pedido f={f} valores={valores} aoEditar={fase === 'pronto' ? () => setFase('formulario') : undefined} />}
        {fase === 'gerando' && <section className={cn(cartaoTela, 'px-4 py-4 lg:px-5')}><GenericTool icon={Sparkles} title={`Gerando ${f.nome.toLowerCase()}…`} subtitle={lendo} isPending className="[&_*]:!text-[15px]" /></section>}
        {fase === 'pronto' && <Resultado f={f} aoGerarOutra={() => gerar()} />}
      </DuasColunas>
      <NotaMockup>
        {['prova', 'atividade', 'plano', 'adaptacao'].includes(f.id) ? 'A2 (MVP de apresentação)' : 'F7, depois do MVP'}. D18: este formulário e o cartão dentro da conversa são o mesmo contrato e o mesmo caso de uso.
        {f.id === 'adaptacao' && ' D35 e D67: lista fechada de tipos, nenhum campo de texto livre sobre o aluno, e a versão adaptada nasce pendente.'}
        {f.id === 'simulado' && ' D21: as questões vêm do banco público de provas oficiais do ENEM.'}
        {f.id === 'recuperacao' && ' D57 e D66: o plano é da turma e da habilidade; não há campo em que caiba a descrição de um aluno.'}
      </NotaMockup>
    </Moldura>
  )
}

export function FerramentaForm() {
  const { id = 'prova' } = useParams()
  const f = ferramenta(id) ?? ferramenta('prova')!
  if (f.para) return <Navigate to={f.para} replace />
  return f.especial === 'redacao' ? <Redacao key={f.id} f={f} /> : <TelaFerramenta key={f.id} f={f} />
}
