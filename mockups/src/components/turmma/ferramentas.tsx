import { useId, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Check, ChevronDown, Info, Minus, Paperclip, Plus, Sparkles } from 'lucide-react'
import { Botao, Interruptor } from '@/components/duo'
import { FileUpload, type ArquivoAnexado } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCriados, type ItemBiblioteca } from '@/dados/biblioteca'
import { HABILIDADES, MATERIAIS, TURMAS, turmaDe } from '@/dados/escola'
import { useAdaptacoes } from '@/dados/escola-estado'
import { turmaDaProfessora, useTurmasDoProfessor } from '@/dados/turmas-professora'
import {
  CAPITULO_ATUAL, CAPITULOS, PREREQUISITOS, TURMA_CARREGA, ferramenta, tipoDeAgora,
  type CampoDef, type Extra, type Grupo,
} from '@/dados/ferramentas'
import { cn } from '@/lib/utils'

/* O MOTOR DE FORMULÁRIO DAS FERRAMENTAS (sétima rodada, 20/09/2026; pele duo na 12ª rodada, 04/10/2026).

   Cada ferramenta tem UM contrato de entrada (D18): o cartão dentro da conversa e a página da Redação usam o MESMO
   formulário, que lê os `campos` de `dados/ferramentas` e desenha. `FormProva` e `FormAdaptacao` são o motor com os
   campos delas.
   · Grupos "Para quem" · "O quê" · "Como" · "Mais opções" (recolhido); no cartão compacto da conversa, só o
     essencial à vista (turma, tema, quantidade) e o resto em "Mais opções", fechado.
   · Pele duo (sistema-turmma-duolingo.md): borda de 2 px, canto 12, letra de 15 a 17; escolhido em azul (claro,
     borda e texto), como a Opcao e o Segmentado; liga-desliga no Interruptor; o botão é o Botao primário (criar).
   · Os campos de texto nascem vazios, com um pedido-modelo no placeholder; quem preenche é a conversa (o tema do
     pedido) ou o professor. Anexo sempre com a pergunta "de quem é este material", sem nada marcado (D5); busca na
     web desligada e rotulada (D68). Nenhum campo recebe texto sobre aluno (D35, D57). */

export function Campo({ rotulo, children, className, dica }: { rotulo: string; children: (id: string) => ReactNode; className?: string; dica?: string }) {
  const id = useId()
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className="text-[15px] font-bold text-tinta">{rotulo}</Label>
      {children(id)}
      {dica && <p className="text-[14px] font-medium text-sutil">{dica}</p>}
    </div>
  )
}

const campo = 'h-11 rounded-[12px] border-2 border-borda bg-campo text-[16px] font-medium text-tinta shadow-none placeholder:text-sutil hover:border-borda-forte focus-visible:border-azul-borda focus-visible:ring-0 focus:ring-0'

export function SelectTurma({ id, padrao = '2b', valor, aoMudar }: { id?: string; padrao?: string; valor?: string; aoMudar?: (v: string) => void }) {
  const doProfessor = useTurmasDoProfessor()
  const turmas = doProfessor.length > 0 ? doProfessor : TURMAS
  return (
    <Select defaultValue={valor === undefined ? padrao : undefined} value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-[12px] border-2 border-borda shadow-[0_4px_0_0_var(--color-borda)]">
        {turmas.map((t) => <SelectItem key={t.id} value={t.id} className="rounded-[8px] text-[15px]">{t.nome} · {t.disciplina}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function SelectMaterial({ id, valor, aoMudar, semCapitulo }: { id?: string; valor?: string; aoMudar?: (v: string) => void; semCapitulo?: boolean }) {
  return (
    <Select defaultValue={valor === undefined ? 'q2' : undefined} value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-[12px] border-2 border-borda shadow-[0_4px_0_0_var(--color-borda)]">
        {MATERIAIS.filter((m) => m.estado === 'pronto').map((m) => (
          <SelectItem key={m.id} value={m.id} className="rounded-[8px] text-[15px]">{m.titulo.split(' — ')[0]}{!semCapitulo && ` — ${m.capitulo.split(' · ')[0]}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ─── O estado do formulário ─────────────────────────────────────────────────────────────────── */

export type Valor = string | string[] | boolean | number[] | ArquivoAnexado[]
export type Valores = Record<string, Valor>
export type MotorHandle = { preencherExemplo: () => void; limpar: () => void }

const EXTRA: Record<Extra, CampoDef> = {
  anexo: { tipo: 'arquivo', id: 'anexo', rotulo: 'Anexar arquivo', opcional: true, declaracao: true, avancado: true,
    dica: 'PDF ou Word (.docx), até 30 MB. Entra como apoio: a base continua sendo o material da escola.' },
  web: { tipo: 'chave', id: 'web', rotulo: 'Buscar na web', ligada: false, avancado: true,
    detalhe: 'Vale só para esta geração. O que vier de fora sai rotulado “da web”.' },
}

export const chaveDe = (c: CampoDef, i: number) => c.id ?? (c.tipo === 'turma' || c.tipo === 'material' ? c.tipo : `c${i}`)

/** Os itens de Criados que um campo `artefato` oferece: os que a ferramenta certa gerou, do mais novo ao mais velho.
    Lê Criados (e não só os documentos de partida), para o que nasceu nesta demonstração também aparecer. */
const artefatosDe = (c: Extract<CampoDef, { tipo: 'artefato' }>, criados: ItemBiblioteca[], extra?: string) => {
  const itens = criados.filter((b) => c.de.includes(tipoDeAgora(b.de)) && !b.ampliada && !b.versaoDe).map((b) => ({
    valor: `${b.titulo} · ${b.turma}`, apoio: `${ferramenta(b.de)?.nome ?? ''} · ${String(b.em[0]).padStart(2, '0')}/${String(b.em[1]).padStart(2, '0')}`,
  }))
  const falta = [extra, c.padrao].filter((x): x is string => !!x && !itens.some((i) => i.valor === x))
  return [...falta.map((valor) => ({ valor, apoio: '' })), ...itens]
}

function valoresIniciais(campos: CampoDef[], dados: Valores = {}, criados: ItemBiblioteca[] = []): Valores {
  const v: Valores = {}
  campos.forEach((c, i) => {
    const k = chaveDe(c, i)
    switch (c.tipo) {
      case 'turma': v[k] = c.padrao ?? '2b'; break
      case 'texto': case 'longo': v[k] = ''; break
      case 'chips': case 'cartoes': v[k] = c.multiplo ? c.padroes ?? [] : c.padrao ?? ''; break
      case 'chave': v[k] = !!c.ligada; break
      case 'contadores': v[k] = c.itens.map((x) => x.valor); break
      case 'habilidades':
        v[k] = c.modo === 'diagnostico' ? [...HABILIDADES].sort((a, b) => a.acerto - b.acerto).slice(0, 2).map((h) => h.codigo)
          : c.modo === 'prerequisito' ? PREREQUISITOS.map((p) => p.codigo) : []
        break
      case 'arquivo': v[k] = []; break
      case 'artefato': v[k] = (typeof dados[k] === 'string' && dados[k]) || c.padrao || artefatosDe(c, criados)[0]?.valor || ''; break
    }
  })
  const turma = (dados.turma ?? v.turma) as string | undefined
  const material = materialDa(turma ?? '2b')
  if (campos.some((c) => c.tipo === 'material')) {
    v.material = material
    v['material:de'] = String(CAPITULO_ATUAL[material] ?? 0)
    v['material:ate'] = String((CAPITULOS[material]?.length ?? 1) - 1)
  }
  return { ...v, ...dados }
}

export function visivel(c: CampoDef, valores: Valores) {
  const q = c.quando
  if (!q) return true
  const bruto = valores[q.campo]
  const atual = typeof bruto === 'boolean' ? (bruto ? 'sim' : 'nao') : bruto
  const tem = (alvo: string | string[]) => [alvo].flat().some((a) => (Array.isArray(atual) ? (atual as unknown[]).includes(a) : atual === a))
  return q.igual !== undefined ? tem(q.igual) : q.diferente !== undefined ? !tem(q.diferente) : true
}

function grupoDe(c: CampoDef): Grupo {
  if (c.avancado) return 'extras'
  if (c.grupo) return c.grupo
  switch (c.tipo) {
    case 'turma': case 'material': return 'quem'
    case 'texto': case 'arquivo': case 'artefato': return 'oque'
    case 'longo': case 'habilidades': return c.opcional ? 'extras' : 'oque'
    default: return 'como'
  }
}

const GRUPOS: { id: Grupo; nome: string; apoio: string }[] = [
  { id: 'quem', nome: 'Para quem', apoio: 'A turma já diz a disciplina e o ano.' },
  { id: 'oque', nome: 'O quê', apoio: 'O que vai ser gerado.' },
  { id: 'como', nome: 'Como', apoio: 'O padrão já vem marcado.' },
  { id: 'extras', nome: 'Mais opções', apoio: 'Opcional. Sem isso já dá para gerar.' },
]

const DONOS = ['É meu', 'É da escola', 'De terceiro, com licença']

const FALTA = 'Falta preencher.'

function validar(campos: CampoDef[], valores: Valores) {
  const erros: Record<string, string> = {}
  campos.forEach((c, i) => {
    if (!visivel(c, valores)) return
    const k = chaveDe(c, i)
    const v = valores[k]
    if ((c.tipo === 'texto' || c.tipo === 'longo') && !c.opcional && !(v as string).trim()) erros[k] = FALTA
    if (c.tipo === 'chips' && !c.multiplo && c.obrigatorio && !v) erros[k] = 'Escolha uma opção.'
    if (c.tipo === 'cartoes' && c.multiplo && (v as string[]).length === 0) erros[k] = 'Escolha pelo menos um.'
    if (c.tipo === 'contadores' && (v as number[]).reduce((a, b) => a + b, 0) === 0) erros[k] = 'Ponha pelo menos uma questão.'
    if (c.tipo === 'arquivo') {
      const tem = (v as ArquivoAnexado[]).length > 0
      if (!c.opcional && !tem) erros[k] = 'Envie o arquivo.'
      else if (tem && c.declaracao && !valores[`${k}:dono`]) erros[k] = 'Diga de quem é este material.'
      else if (tem && c.declaracao && valores[`${k}:dono`] === DONOS[2] && !String(valores[`${k}:licenca`] ?? '').trim()) erros[k] = 'Diga qual é a licença.'
    }
  })
  return erros
}

/* ─── As peças ───────────────────────────────────────────────────────────────────────────────── */

const rotuloCampo = 'text-[15px] font-bold leading-5 text-tinta'
/* R4: o preto cheio fica só no botão principal; marcado é cinza, como o Segmentado (tela.tsx). */
const chip = (marcado: boolean) => cn('inline-flex h-10 items-center rounded-full border-2 px-3.5 text-[15px] font-bold leading-none transition-colors duration-150',
  marcado ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-borda bg-white text-apoio hover:bg-fundo-suave hover:text-tinta')
/** Escolha única: o trilho cinza do Segmentado, com a opção marcada em branco. */
const trilho = 'inline-flex max-w-full flex-wrap items-stretch gap-0.5 rounded-[12px] border-2 border-borda bg-white p-0.5'
const opcaoTrilho = (marcado: boolean) => cn('h-9 rounded-[9px] border-2 px-3 text-[15px] font-bold leading-none transition-colors duration-150',
  marcado ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta')

function Bloco({ para, rotulo, opcional, dica, erro, lado, children }: {
  para?: string; rotulo?: string; opcional?: boolean; dica?: string; erro?: string; lado?: ReactNode; children: ReactNode
}) {
  const rid = useId()
  return (
    <div role={para ? undefined : 'group'} aria-labelledby={para || !rotulo ? undefined : rid} data-erro={erro ? '' : undefined} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      {rotulo && (
        <div className="flex items-baseline justify-between gap-3">
          {para
            ? <Label htmlFor={para} className={rotuloCampo}>{rotulo}{opcional && <span className="ml-1.5 font-medium text-sutil">opcional</span>}</Label>
            : <span id={rid} className={rotuloCampo}>{rotulo}{opcional && <span className="ml-1.5 font-medium text-sutil">opcional</span>}</span>}
          {lado}
        </div>
      )}
      {children}
      {erro ? <p role="alert" className="text-[14px] font-bold leading-snug text-vermelho-texto">{erro}</p> : dica && <p className="text-[14px] font-medium leading-snug text-sutil">{dica}</p>}
    </div>
  )
}

function Chips({ c, valor, outro, erro, aoMudar, aoMudarOutro }: {
  c: Extract<CampoDef, { tipo: 'chips' }>; valor: string | string[]; outro: string; erro?: string
  aoMudar: (v: string | string[]) => void; aoMudarOutro: (v: string) => void
}) {
  const opcoes = c.personalizado ? [...c.opcoes, 'Outro'] : c.opcoes
  const marcado = (o: string) => (Array.isArray(valor) ? valor.includes(o) : valor === o)
  const clicar = (o: string) => aoMudar(Array.isArray(valor) ? (valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o]) : o)
  const numero = c.personalizado !== 'texto'
  return (
    <Bloco rotulo={c.rotulo} erro={erro}>
      {/* a dica vai na mesma linha dos chips quando cabe; quando não cabe, desce sozinha */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
       <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {c.multiplo
          ? opcoes.map((o) => <button key={o} type="button" aria-pressed={marcado(o)} onClick={() => clicar(o)} className={chip(marcado(o))}>{o}</button>)
          : <div role="radiogroup" aria-label={c.rotulo} className={trilho}>
              {opcoes.map((o) => <button key={o} type="button" role="radio" aria-checked={marcado(o)} onClick={() => clicar(o)} className={opcaoTrilho(marcado(o))}>{o}</button>)}
            </div>}
        {valor === 'Outro' && (
          <Input autoFocus type={numero ? 'number' : 'text'} inputMode={numero ? 'numeric' : undefined} min={numero ? 1 : undefined} value={outro} onChange={(e) => aoMudarOutro(e.target.value)}
            aria-label={`${c.rotulo}: outro valor`} placeholder={c.outro ?? (numero ? 'Quantos?' : 'Qual?')}
            className={cn('h-10 rounded-full border-2 border-borda bg-campo px-3 text-[15px] font-medium text-tinta placeholder:text-sutil focus-visible:border-azul-borda focus-visible:ring-0', numero ? 'w-[132px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none' : 'w-52')} />
        )}
       </div>
        {c.dica && <p className="text-[14px] font-medium leading-snug text-sutil">{c.dica}</p>}
      </div>
    </Bloco>
  )
}

/** Cartão de opção: diz a consequência na própria frase. Marcado = fio preto de 1,5 px e um visto pequeno, fundo branco. */
function Cartoes({ c, valor, outro, erro, aoMudar, aoMudarOutro }: {
  c: Extract<CampoDef, { tipo: 'cartoes' }>; valor: string | string[]; outro: string; erro?: string
  aoMudar: (v: string | string[]) => void; aoMudarOutro: (v: string) => void
}) {
  const nome = useId()
  const opcoes = c.personalizado ? [...c.opcoes, { id: 'outro', nome: c.personalizado.nome, detalhe: c.personalizado.detalhe }] : c.opcoes
  const marcado = (o: string) => (Array.isArray(valor) ? valor.includes(o) : valor === o)
  const clicar = (o: string) => aoMudar(Array.isArray(valor) ? (valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o]) : o)
  return (
    <Bloco rotulo={c.rotulo} dica={c.dica} erro={erro}>
      <div className={cn('grid grid-cols-1 gap-2 @[460px]:auto-rows-fr', opcoes.length % 3 === 0 ? '@[460px]:grid-cols-2 @[640px]:grid-cols-3' : '@[460px]:grid-cols-2')}>
        {opcoes.map((o) => {
          const on = marcado(o.id)
          const off = 'desabilitado' in o && o.desabilitado
          return (
            <label key={o.id} className={cn('relative flex flex-col rounded-[12px] border-2 px-3.5 py-3 transition-colors duration-150',
              off ? 'cursor-not-allowed border-borda bg-white opacity-55' : on ? 'cursor-pointer border-azul-borda bg-azul-claro' : 'cursor-pointer border-borda bg-white hover:bg-fundo-suave')}>
              <input type={c.multiplo ? 'checkbox' : 'radio'} name={nome} value={o.id} checked={on} disabled={!!off} onChange={() => clicar(o.id)} className="peer sr-only" />
              <span className={cn('pr-7 text-[15px] font-bold leading-snug', on ? 'text-azul-texto' : 'text-tinta')}>{o.nome}</span>
              <span className="mt-0.5 text-[14px] font-medium leading-snug text-sutil">{o.detalhe}</span>
              {'etiqueta' in o && o.etiqueta && <span className="t-selo mt-1.5 inline-flex h-5 w-fit items-center whitespace-nowrap rounded-[8px] bg-fundo-suave px-1.5 text-[12px] text-apoio">{o.etiqueta}</span>}
              <span aria-hidden className={cn('absolute right-3 top-3 grid size-5 place-items-center border-2 transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-azul-texto',
                c.multiplo ? 'rounded-[6px]' : 'rounded-full', on ? 'border-azul bg-azul text-sobre-cor' : 'border-borda bg-white')}>{on && <Check className="size-3" strokeWidth={4} />}</span>
            </label>
          )
        })}
      </div>
      {c.personalizado && valor === 'outro' && (
        <Input autoFocus value={outro} onChange={(e) => aoMudarOutro(e.target.value)} aria-label={c.personalizado.nome} placeholder={c.personalizado.exemplo} className={campo} />
      )}
    </Bloco>
  )
}

function Chave({ c, ligada, aoMudar }: { c: Extract<CampoDef, { tipo: 'chave' }>; ligada: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <div className="relative flex min-h-11 items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-snug text-tinta">{c.rotulo}</span>
        {c.detalhe && <span className="mt-0.5 block text-[14px] font-medium leading-snug text-sutil">{c.detalhe}</span>}
      </span>
      <Interruptor ligado={ligada} aoMudar={aoMudar} rotulo={c.rotulo} />
    </div>
  )
}

/** O total É o número de questões: não existe outro campo de quantidade para divergir deste. */
function Contadores({ c, n, erro, aoMudar, so, rotulo, plural }: {
  c: Extract<CampoDef, { tipo: 'contadores' }>; n: number[]; erro?: string; aoMudar: (v: number[]) => void
  /** cartão compacto: só estes índices (os outros vão para "Mais opções") */
  so?: number[]; rotulo?: string; plural?: boolean
}) {
  const soma = n.reduce((a, b) => a + b, 0)
  const muda = (i: number, d: number) => aoMudar(n.map((x, j) => (j === i ? Math.max(0, x + d) : x)))
  const botao = 'grid size-8 place-items-center rounded-full border-2 border-borda bg-white text-tinta transition-colors duration-150 hover:bg-fundo-suave disabled:opacity-35'
  const itens = c.itens.map((item, i) => ({ item, i })).filter(({ i }) => !so || so.includes(i))
  /* "Objetiva" vira "Objetivas" no cartão compacto: a linha lê "Objetivas 10 · Discursivas 0" */
  const nome = (x: string) => (plural ? x.replace(/([aeo])\b/g, '$1s') : x)
  return (
    <Bloco rotulo={rotulo ?? c.rotulo} dica={so ? undefined : c.dica} erro={erro} lado={<span className="text-[14px] font-medium leading-none text-sutil"><b className="font-bold text-tinta">{soma}</b> no total</span>}>
      <ul className="grid grid-cols-1 gap-0.5 overflow-hidden rounded-[12px] border-2 border-borda bg-borda @[460px]:grid-cols-2">
        {itens.map(({ item, i }, j) => (
          <li key={item.nome} className={cn('flex h-12 items-center justify-between gap-3 bg-white pl-3.5 pr-2', itens.length % 2 === 1 && j === itens.length - 1 && '@[460px]:col-span-2')}>
            <span className={cn('truncate text-[15px] font-bold', n[i] ? 'text-tinta' : 'text-sutil')}>{nome(item.nome)}</span>
            <span className="flex shrink-0 items-center gap-1">
              <button type="button" aria-label={`Menos ${item.nome}`} disabled={!n[i]} onClick={() => muda(i, -1)} className={botao}><Minus className="size-4" strokeWidth={2.5} /></button>
              <span className={cn('w-7 text-center text-[16px] font-bold tabular-nums', n[i] ? 'text-tinta' : 'text-sutil')}>{n[i]}</span>
              <button type="button" aria-label={`Mais ${item.nome}`} onClick={() => muda(i, 1)} className={botao}><Plus className="size-4" strokeWidth={2.5} /></button>
            </span>
          </li>
        ))}
      </ul>
    </Bloco>
  )
}

const caixaMarcar = (on: boolean) => cn('grid size-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors duration-150', on ? 'border-azul bg-azul text-sobre-cor' : 'border-borda bg-white')

/** BNCC: as habilidades do capítulo, em chips. Diagnóstico: as da turma, da que tem menos acerto para a que tem mais.
    Pré-requisito: o que o capítulo exige de ANTES, com o lugar do material de onde sai. */
function Habilidades({ c, marcadas, turma, aoMudar }: { c: Extract<CampoDef, { tipo: 'habilidades' }>; marcadas: string[]; turma: string; aoMudar: (v: string[]) => void }) {
  const alterna = (k: string) => aoMudar(marcadas.includes(k) ? marcadas.filter((x) => x !== k) : [...marcadas, k])
  if (c.modo === 'bncc') return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional} dica="São as habilidades que o capítulo escolhido cobre. Sem marcar, o Assistente usa as do capítulo.">
      <div className="flex flex-wrap gap-1.5">
        {HABILIDADES.map((h) => (
          <button key={h.codigo} type="button" aria-pressed={marcadas.includes(h.codigo)} onClick={() => alterna(h.codigo)} title={h.nome} className={cn(chip(marcadas.includes(h.codigo)), 'gap-1.5 text-[14px]')}>
            <b className="font-semibold">{h.codigo}</b><span className={cn('hidden max-w-[20ch] truncate @[460px]:inline', !marcadas.includes(h.codigo) && 'text-sutil')}>{h.nome}</span>
          </button>
        ))}
      </div>
    </Bloco>
  )
  if (c.modo === 'diagnostico' && !TURMA_CARREGA[turma]?.diagnostico) return (
    <Bloco rotulo={c.rotulo}>
      <p className="flex items-start gap-2 rounded-[12px] bg-fundo-suave px-3 py-2.5 text-[15px] font-medium leading-snug text-apoio"><Info className="mt-px size-4 shrink-0 text-sutil" /> O {(turmaDaProfessora(turma) ?? turmaDe(turma)).nome} ainda não tem avaliação corrigida e aprovada, então não há diagnóstico para partir.</p>
    </Bloco>
  )
  const linhas = c.modo === 'diagnostico'
    ? [...HABILIDADES].sort((a, b) => a.acerto - b.acerto).map((h) => ({ k: h.codigo, nome: h.nome, apoio: h.codigo, acerto: h.acerto as number | null }))
    : PREREQUISITOS.map((p) => ({ k: p.codigo, nome: p.nome, apoio: `${p.origem} · ${p.codigo}`, acerto: null }))
  return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional}
      dica={c.modo === 'diagnostico' ? 'Acerto da turma na prova de 18/09, que você aprovou. É dado da turma, não de um aluno.' : 'O que o capítulo exige de antes. O Assistente sugeriu estes; tire o que a turma já domina.'}>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5 overflow-hidden rounded-[12px] border-2 border-borda bg-borda">
        {linhas.map((h) => {
          const on = marcadas.includes(h.k)
          return (
            <li key={h.k}>
              <label className="relative flex h-12 cursor-pointer items-center gap-3 bg-white px-3 transition-colors duration-150 hover:bg-fundo-suave">
                <input type="checkbox" checked={on} onChange={() => alterna(h.k)} className="sr-only" />
                <span aria-hidden className={caixaMarcar(on)}>{on && <Check className="size-2.5" strokeWidth={3.5} />}</span>
                <span className={cn('min-w-0 flex-1 truncate text-[15px] font-bold', on ? 'text-tinta' : 'text-apoio')}>{h.nome}</span>
                <span className="hidden shrink-0 text-[14px] font-medium text-sutil @[460px]:inline">{h.apoio}</span>
                {h.acerto !== null && (
                  <span className="flex shrink-0 items-center gap-2 @[460px]:w-24"><span className="hidden h-1 flex-1 overflow-hidden rounded-full bg-realce @[460px]:block"><i className={cn('block h-full rounded-full', h.acerto < 50 ? 'bg-caramelo' : 'bg-tinta')} style={{ width: `${h.acerto}%` }} /></span><b className="w-10 text-right text-[14px] font-bold text-tinta">{h.acerto}%</b></span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
    </Bloco>
  )
}

/** Arquivo. O opcional é uma linha que se abre; o obrigatório já vem aberto. Com `declaracao`, pergunta de quem é o
    material — e NADA vem marcado: declarar é ato da professora (D5). */
function Arquivo({ c, arquivos, dono, licenca, erro, aoMudar, aoMudarDono, aoMudarLicenca }: {
  c: Extract<CampoDef, { tipo: 'arquivo' }>; arquivos: ArquivoAnexado[]; dono: string; licenca: string; erro?: string
  aoMudar: (v: ArquivoAnexado[]) => void; aoMudarDono: (v: string) => void; aoMudarLicenca: (v: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const mostra = !c.opcional || aberto || arquivos.length > 0 || !!erro
  if (!mostra) return (
    <button type="button" onClick={() => setAberto(true)} className="group flex min-h-12 w-full items-center gap-2.5 rounded-[12px] border-2 border-dashed border-borda px-3 py-1.5 text-left transition-colors duration-150 hover:bg-fundo-suave">
      <Paperclip className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-tinta">{c.rotulo} <span className="font-medium text-sutil">opcional</span></span>
      <span className="hidden shrink-0 text-[14px] font-bold text-azul-texto @[460px]:inline">Enviar arquivo</span>
    </button>
  )
  return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional} erro={erro}>
      <FileUpload files={arquivos} onFilesChange={aoMudar} multiple={false} accept=".pdf,.docx" title="Clique ou solte o arquivo aqui" description={c.dica}
        className={cn('space-y-2 [&>div:first-child]:min-h-0 [&>div:first-child]:gap-2.5 [&>div:first-child]:rounded-[12px] [&>div:first-child]:py-4', arquivos.length > 0 && '[&>div:first-child]:hidden')} />
      {c.declaracao && (
        <div role="group" aria-label="De quem é este material" className="grid gap-2 rounded-[12px] bg-fundo-suave px-3 py-3">
          <p className="text-[15px] font-bold leading-snug text-tinta">De quem é este material?</p>
          <div className="flex flex-wrap gap-1.5">
            {DONOS.map((o) => <button key={o} type="button" aria-pressed={dono === o} onClick={() => aoMudarDono(o)} className={chip(dono === o)}>{o}</button>)}
          </div>
          {dono === DONOS[2] && <Input value={licenca} onChange={(e) => aoMudarLicenca(e.target.value)} aria-label="Qual licença" placeholder="Qual licença? Ex.: CC BY 4.0, ou autorização por escrito da editora" className={campo} />}
          <p className="text-[14px] font-medium leading-snug text-sutil">Material de sistema de ensino sem licença não entra.</p>
        </div>
      )}
    </Bloco>
  )
}

/** Chip curto ocupa meia linha, para dois caberem lado a lado; o comprido ocupa a linha. */
const chipsCabemNaMetade = (c: Extract<CampoDef, { tipo: 'chips' }>) => {
  const opcoes = c.personalizado ? [...c.opcoes, 'Outro'] : c.opcoes
  return !c.larga && opcoes.reduce((px, o) => px + 26 + o.length * 7.3 + 6, 0) < 250
}

/** Os índices dos chips curtos que formam par com o vizinho (dois a dois, na ordem). */
const pares = (campos: CampoDef[]) => {
  const curto = (c?: CampoDef) => !!c && c.tipo === 'chips' && chipsCabemNaMetade(c)
  const em = new Set<number>()
  for (let j = 0; j < campos.length - 1; j++) if (curto(campos[j]) && curto(campos[j + 1])) { em.add(j); em.add(j + 1); j++ }
  return em
}

/* ─── O motor ────────────────────────────────────────────────────────────────────────────────── */

export const AVISO_PADRAO = 'A IA pode errar. Você revisa antes de usar, e nada vai para a turma sem você.'

/* O CARTÃO COMPACTO (décima rodada, 04/10/2026): o mesmo formulário dentro da conversa, só com o essencial à vista —
   a turma, o tema (ou as páginas) e a quantidade — e todo o resto em "Mais opções", fechado. Na Prova, os seis
   contadores viram "Objetivas · Discursivas", e os outros quatro tipos descem para "Mais opções". Sem os nomes de
   grupo ("Para quem", "O quê"…): é um cartão de conversa, não uma página de configurações. */

const QUANTIDADE = /^(aulas|questões|duração|tempo|tamanho|ramos|em quanto tempo)/i

/** O material licenciado que a turma carrega. Turma da escola fora das de sempre (a 3ºA de Física do Marcos): nenhum,
    porque a escola não tem material de Física. */
const materialDa = (turma: string) => TURMA_CARREGA[turma]?.material ?? (TURMAS.some((t) => t.id === turma) ? 'q2' : '')

/* Os pedidos-modelo dos campos de texto são de Química (a Camila). Para turma de outra disciplina, um exemplo dela. */
const TEMA_POR_DISCIPLINA: Record<string, string> = {
  'Física': 'Cinemática, do MRU ao MRUV', 'Matemática': 'Função do 1º grau, do gráfico ao problema', 'Biologia': 'Citologia, da membrana ao núcleo',
  'Língua Portuguesa': 'Interpretação de texto argumentativo', 'História': 'Revolução Industrial e trabalho', 'Geografia': 'Clima e vegetação do Brasil',
}
const DETALHE_POR_DISCIPLINA: Record<string, string> = {
  'Física': 'Duas questões com gráfico de posição por tempo e nenhuma que dependa de decorar fórmula. Uma contextualizada com o trânsito da cidade.',
}
function exemploDa(c: CampoDef, disciplina: string): string {
  if (c.tipo !== 'texto' && c.tipo !== 'longo') return ''
  if (disciplina === 'Química' || disciplina === 'Ciências') return c.exemplo
  if (c.rotulo === 'Tema' || c.rotulo === 'Assunto') return `Ex.: ${TEMA_POR_DISCIPLINA[disciplina] ?? 'o conteúdo da próxima aula'}`
  if (c.rotulo === 'Detalhes') return DETALHE_POR_DISCIPLINA[disciplina] ?? 'Ex.: o que a turma precisa praticar mais, e o que deixar de fora.'
  return c.exemplo
}

/** Os índices (em `visiveis`) do que fica à vista no cartão compacto. */
function essenciais(visiveis: { c: CampoDef; i: number }[]) {
  const em = new Set<number>()
  const achar = (f: (c: CampoDef) => boolean) => visiveis.find(({ c }) => f(c))
  const turma = achar((c) => c.tipo === 'turma')
  const tema = achar((c) => (c.tipo === 'texto' || c.tipo === 'longo') && !c.avancado)
  const material = tema ? undefined : achar((c) => c.tipo === 'material')
  const qtd = achar((c) => c.tipo === 'chips' && !c.avancado && QUANTIDADE.test(c.rotulo))
  ;[turma, tema, material, qtd].forEach((x) => x && em.add(x.i))
  visiveis.forEach(({ c, i }) => {
    if (c.tipo === 'contadores' || c.tipo === 'artefato' || (c.tipo === 'cartoes' && c.multiplo)) em.add(i)
  })
  return em
}

export function MotorFormulario({ campos, extras = [], verbo, iniciais, aviso = AVISO_PADRAO, variante = 'cartao', compacto = false, porTurma, aoGerar, aoCancelar, ref, className }: {
  campos: CampoDef[]; extras?: Extra[]; verbo: string
  /** cartão compacto da conversa: só o essencial à vista, o resto em "Mais opções" fechado */
  compacto?: boolean
  /** valores que já vêm de fora: o que a conversa entendeu do pedido, ou o que a pessoa tinha preenchido antes de gerar */
  iniciais?: Valores; aviso?: string
  /** `tela`: ocupa o cartão da tela, o miolo rola por dentro e o rodapé fica fixo. `cartao`: altura natural, sem respiro próprio */
  variante?: 'tela' | 'cartao'
  /** o que muda com a turma (o enunciado da Redação): trocar de turma troca o campo que não foi editado */
  porTurma?: (turmaId: string) => Valores
  aoGerar: (valores: Valores) => void; aoCancelar?: () => void; ref?: Ref<MotorHandle>; className?: string
}) {
  const todos = useMemo(() => [...campos, ...extras.map((e) => EXTRA[e])], [campos, extras])
  const criados = useCriados()
  const minhas = useTurmasDoProfessor()
  // as adaptações registradas pela coordenação (as mesmas que o Adaptar lista no passo 3)
  const registros = useAdaptacoes()
  /** a turma como o professor da sessão a vê (a 3ºA é de Física para o Marcos), e não a grade fixa da Camila */
  const turmaInfo = (id: string) => {
    const p = minhas.find((x) => x.id === id)
    return p ? { id: p.id, nome: p.nome, disciplina: p.disciplina, serie: p.serie, alunos: p.alunos } : turmaDe(id)
  }
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(todos, iniciais, criados))
  const [erros, setErros] = useState<Record<string, string>>({})
  const [maisAberto, setMaisAberto] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const uid = useId()

  const por = (k: string, v: Valor) => { setValores((a) => ({ ...a, [k]: v })); setErros((e) => (e[k] ? { ...e, [k]: '' } : e)) }
  const texto = (k: string) => String(valores[k] ?? '')

  useImperativeHandle(ref, () => ({
    preencherExemplo: () => {
      setValores((a) => {
        const n = { ...a }
        todos.forEach((c, i) => {
          const k = chaveDe(c, i)
          const disc = turmaInfo(String(a.turma ?? '2b')).disciplina
          if (c.tipo === 'texto' || c.tipo === 'longo') n[k] = (disc === 'Química' || disc === 'Ciências' ? c.valor : undefined) ?? exemploDa(c, disc).replace(/^Ex\.: /, '')
          if (c.tipo === 'arquivo' && c.amostra) n[k] = [{ id: 'amostra', name: c.amostra, type: 'application/pdf', size: 1_258_291 }]
        })
        return n
      })
      setErros({})
    },
    limpar: () => { setValores(valoresIniciais(todos, {}, criados)); setErros({}) },
  }), [todos, criados, minhas])

  const enviar = () => {
    const e = validar(todos, valores)
    setErros(e)
    if (Object.keys(e).length === 0) return aoGerar(valores)
    if (todos.some((c, i) => e[chaveDe(c, i)] && grupoDe(c) === 'extras')) setMaisAberto(true)
    window.setTimeout(() => form.current?.querySelector('[data-erro]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 30)
  }

  const mudarTurma = (t: string) => {
    const material = materialDa(t)
    setValores((a) => {
      /* o que veio da turma de antes e não foi editado passa a ser o da turma nova */
      const antes = porTurma ? porTurma(String(a.turma ?? '')) : {}
      const depois = porTurma ? porTurma(t) : {}
      const trocados = Object.fromEntries(Object.entries(depois).filter(([k]) => a[k] === undefined || a[k] === '' || a[k] === antes[k]))
      return { ...a, ...trocados, turma: t, ...(a.material !== undefined && a.material !== material
        ? { material, 'material:de': String(CAPITULO_ATUAL[material] ?? 0), 'material:ate': String((CAPITULOS[material]?.length ?? 1) - 1) } : {}) }
    })
  }

  /** `curto`: o campo à vista no cartão compacto, sem a frase de apoio embaixo (ela fica em "Mais opções") */
  const desenha = (c: CampoDef, i: number, curto = false): { peca: ReactNode; larga: boolean } => {
    const k = chaveDe(c, i)
    const id = `${uid}-${k}`
    const erro = erros[k] || undefined
    switch (c.tipo) {
      case 'turma': {
        const t = turmaInfo(texto(k))
        const n = registros.filter((a) => a.turmaId === t.id).length
        const comMaterial = todos.some((x) => x.tipo === 'material')
        return { larga: !comMaterial, peca: (
          <Bloco para={id} rotulo="Turma" dica={comMaterial || curto ? undefined : `A turma carrega: ${t.disciplina} · ${t.serie} · ${t.alunos} alunos${n ? ` · ${n} ${n === 1 ? 'adaptação registrada' : 'adaptações registradas'}` : ''}.`}>
            <SelectTurma id={id} valor={texto(k)} aoMudar={mudarTurma} />
          </Bloco>
        ) }
      }
      case 'material': {
        const t = turmaInfo(texto('turma'))
        const n = registros.filter((a) => a.turmaId === t.id).length
        const caps = CAPITULOS[texto(k)] ?? []
        const carrega = <p className="text-[14px] font-medium leading-snug text-sutil @[560px]:col-span-2">A turma carrega: {t.disciplina} · {t.serie} · {t.alunos ? `${t.alunos} ${t.alunos === 1 ? 'aluno' : 'alunos'}` : 'sem lista'}{n ? ` · ${n} ${n === 1 ? 'adaptação registrada' : 'adaptações registradas'}` : ''}.{c.dica && ` ${c.dica}`}</p>
        if (!texto(k)) return { larga: true, peca: (
          <>
            <div className="grid gap-1.5 @[560px]:col-span-2">
              <span className="text-[15px] font-bold text-tinta">Material</span>
              <p className="flex items-start gap-2 rounded-[12px] bg-fundo-suave px-3 py-2.5 text-[15px] font-medium leading-snug text-apoio"><Info className="mt-px size-4 shrink-0 text-sutil" /> A escola ainda não tem material de {t.disciplina} no Turmma. O Assistente parte do tema que você escrever.</p>
            </div>
            {carrega}
          </>
        ) }
        return { larga: false, peca: (
          <>
            <Bloco para={id} rotulo="Material"><SelectMaterial id={id} valor={texto(k)} semCapitulo={c.varios} aoMudar={(m) => setValores((a) => ({ ...a, [k]: m, 'material:de': String(CAPITULO_ATUAL[m] ?? 0), 'material:ate': String((CAPITULOS[m]?.length ?? 1) - 1) }))} /></Bloco>
            {c.varios && (['de', 'ate'] as const).map((ponta) => (
              <Bloco key={ponta} para={`${id}-${ponta}`} rotulo={ponta === 'de' ? 'Do capítulo' : 'Ao capítulo'}>
                <Select value={texto(`${k}:${ponta}`)} onValueChange={(v) => por(`${k}:${ponta}`, v)}>
                  <SelectTrigger id={`${id}-${ponta}`} className={campo}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[12px] border-2 border-borda shadow-[0_4px_0_0_var(--color-borda)]">
                    {caps.map((cap, j) => <SelectItem key={cap} value={String(j)} disabled={ponta === 'ate' ? j < Number(texto(`${k}:de`)) : j > Number(texto(`${k}:ate`))} className="rounded-[8px] text-[15px]">{cap}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Bloco>
            ))}
            {carrega}
          </>
        ) }
      }
      case 'texto': return { larga: !!c.larga, peca: (
        <Bloco para={id} rotulo={c.rotulo} opcional={c.opcional} dica={c.dica} erro={erro}>
          <Input id={id} value={texto(k)} onChange={(e) => por(k, e.target.value)} placeholder={exemploDa(c, turmaInfo(texto('turma') || '2b').disciplina)} aria-invalid={!!erro} className={cn(campo, erro && 'border-vermelho-borda')} />
        </Bloco>
      ) }
      case 'longo': return { larga: true, peca: (
        <Bloco para={id} rotulo={c.rotulo} opcional={c.opcional} dica={c.dica} erro={erro}>
          <Textarea id={id} rows={3} value={texto(k)} onChange={(e) => por(k, e.target.value)} placeholder={exemploDa(c, turmaInfo(texto('turma') || '2b').disciplina)} aria-invalid={!!erro}
            className={cn('min-h-0 rounded-[12px] border-2 border-borda bg-campo px-3.5 py-2.5 text-[16px] font-medium leading-[1.45] text-tinta shadow-none placeholder:text-sutil focus-visible:border-azul-borda focus-visible:ring-0', erro && 'border-vermelho-borda')} />
        </Bloco>
      ) }
      case 'chips': return { larga: !chipsCabemNaMetade(c), peca: <Chips c={c} valor={valores[k] as string | string[]} outro={texto(`${k}:outro`)} erro={erro} aoMudar={(v) => por(k, v)} aoMudarOutro={(v) => por(`${k}:outro`, v)} /> }
      case 'cartoes': return { larga: true, peca: <Cartoes c={c} valor={valores[k] as string | string[]} outro={texto(`${k}:outro`)} erro={erro} aoMudar={(v) => por(k, v)} aoMudarOutro={(v) => por(`${k}:outro`, v)} /> }
      case 'chave': return { larga: true, peca: <Chave c={c} ligada={!!valores[k]} aoMudar={(v) => por(k, v)} /> }
      case 'contadores': return { larga: true, peca: <Contadores c={c} n={valores[k] as number[]} erro={erro} aoMudar={(v) => por(k, v)} /> }
      case 'habilidades': return { larga: true, peca: <Habilidades c={c} marcadas={valores[k] as string[]} turma={texto('turma') || '2b'} aoMudar={(v) => por(k, v)} /> }
      case 'arquivo': return { larga: true, peca: (
        <Arquivo c={c} arquivos={valores[k] as ArquivoAnexado[]} dono={texto(`${k}:dono`)} licenca={texto(`${k}:licenca`)} erro={erro}
          aoMudar={(v) => por(k, v)} aoMudarDono={(v) => { por(`${k}:dono`, v); setErros((e) => ({ ...e, [k]: '' })) }} aoMudarLicenca={(v) => { por(`${k}:licenca`, v); setErros((e) => ({ ...e, [k]: '' })) }} />
      ) }
      case 'artefato': return { larga: true, peca: (
        <Bloco para={id} rotulo={c.rotulo} dica={curto ? undefined : c.dica}>
          <Select value={texto(k)} onValueChange={(v) => por(k, v)}>
            <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 rounded-[12px] border-2 border-borda shadow-[0_4px_0_0_var(--color-borda)]">
              {artefatosDe(c, criados, typeof iniciais?.[k] === 'string' ? (iniciais[k] as string) : undefined).map((a) => <SelectItem key={a.valor} value={a.valor} className="rounded-[8px] text-[15px]">{a.valor}</SelectItem>)}
            </SelectContent>
          </Select>
        </Bloco>
      ) }
      case 'aviso': return { larga: true, peca: <Aviso>{c.texto}</Aviso> }
    }
  }

  const visiveis = todos.map((c, i) => ({ c, i })).filter(({ c }) => visivel(c, valores))
  const noTopo = visiveis.filter(({ c }) => c.tipo === 'aviso' && c.topo)
  const grupos = GRUPOS.map((g) => ({ ...g, itens: visiveis.filter(({ c }) => grupoDe(c) === g.id && !(c.tipo === 'aviso' && c.topo)) })).filter((g) => g.itens.length > 0)

  /* "Mais opções" só se recolhe quando tem o que recolher: com um campo só, ele aparece direto. */
  const recolhe = (g: (typeof grupos)[number]) => g.id === 'extras' && g.itens.length > 1
  const preenchidos = (g: (typeof grupos)[number]) => g.itens.filter(({ c, i }) => {
    const v = valores[chaveDe(c, i)]
    if (c.tipo === 'chave') return v !== !!c.ligada
    if (c.tipo === 'chips' || c.tipo === 'cartoes') return false
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== ''
  }).length
  const nomeCurto = (c: CampoDef) => ('rotulo' in c ? c.rotulo : '').replace('Habilidades da BNCC', 'BNCC').replace(/^Com (.)/, (_, l: string) => l.toUpperCase())
  /* o rodapé repete o que falta, porque o campo pode estar fora da vista: "Falta: assunto." ou a própria frase do erro */
  const comErro = todos.map((c, i) => ({ c, e: erros[chaveDe(c, i)] })).filter((x) => x.e)
  const faltam = comErro.filter((x) => x.e === FALTA).map(({ c }) => ('rotulo' in c ? c.rotulo.toLowerCase() : ''))
  const recado = [faltam.length > 0 && `Falta: ${faltam.join(', ')}.`, ...comErro.filter((x) => x.e !== FALTA).map((x) => x.e)].filter(Boolean).join(' ')
  const tela = variante === 'tela'

  if (compacto) {
    const vista = essenciais(visiveis)
    const doContador = (c: CampoDef) => (c.tipo === 'contadores' && c.itens.length > 2 ? c : null)
    /* os cartões de múltipla escolha (os tipos de adaptação) ficam à vista como chips de uma linha, já marcados;
       os cartões com a explicação de cada tipo e a frase de apoio descem para "Mais opções" */
    const multiplos = (c: CampoDef) => (c.tipo === 'cartoes' && c.multiplo ? c : null)
    const resto = visiveis.filter(({ c, i }) => !(c.tipo === 'aviso' && c.topo) && (!vista.has(i) || doContador(c) || multiplos(c)))
    const peca = (c: CampoDef, i: number, parte: 'vista' | 'resto') => {
      const mult = multiplos(c)
      if (mult && parte === 'vista') {
        const k = chaveDe(c, i)
        const marcados = (valores[k] as string[]) ?? []
        const alterna = (o: string) => por(k, marcados.includes(o) ? marcados.filter((x) => x !== o) : [...marcados, o])
        return (
          <Bloco rotulo={mult.rotulo} erro={erros[k] || undefined}>
            <div className="flex flex-wrap gap-1.5">
              {mult.opcoes.map((o) => <button key={o.id} type="button" aria-pressed={marcados.includes(o.id)} onClick={() => alterna(o.id)} className={chip(marcados.includes(o.id))}>{o.nome}</button>)}
            </div>
          </Bloco>
        )
      }
      const cont = c.tipo === 'contadores' ? c : null
      if (cont && cont.itens.length > 2) {
        const k = chaveDe(c, i)
        return parte === 'vista'
          ? <Contadores c={cont} n={valores[k] as number[]} erro={erros[k] || undefined} aoMudar={(v) => por(k, v)} so={[0, 1]} rotulo="Questões" plural />
          : <Contadores c={cont} n={valores[k] as number[]} aoMudar={(v) => por(k, v)} so={cont.itens.map((_, j) => j).slice(2)} rotulo="Outros tipos de questão" />
      }
      return desenha(c, i, parte === 'vista').peca
    }
    return (
      <form ref={form} noValidate onSubmit={(e) => { e.preventDefault(); enviar() }} className={cn('flex min-w-0 flex-col', className)}>
        <div className="@container grid min-w-0 gap-3">
          {noTopo.map(({ c, i }) => <div key={i}>{desenha(c, i).peca}</div>)}
          <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 @[460px]:grid-cols-2">
            {visiveis.filter(({ i }) => vista.has(i)).map(({ c, i }) => {
              const larga = c.tipo !== 'turma' && c.tipo !== 'material' && !(c.tipo === 'texto' && !c.larga)
              return <div key={i} className={cn('min-w-0', larga && c.tipo !== 'texto' && '@[460px]:col-span-2')}>{peca(c, i, 'vista')}</div>
            })}
          </div>
          {resto.length > 0 && (maisAberto ? (
            <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-4 border-t-2 border-borda pt-4 @[460px]:grid-cols-2">
              {resto.map(({ c, i }) => {
                const { larga } = c.tipo === 'contadores' ? { larga: true } : desenha(c, i)
                return c.tipo === 'material' ? <div key={i} className="contents">{peca(c, i, 'resto')}</div> : <div key={i} className={cn('min-w-0', larga && '@[460px]:col-span-2')}>{peca(c, i, 'resto')}</div>
              })}
              <button type="button" onClick={() => setMaisAberto(false)} aria-expanded className="inline-flex h-9 w-fit items-center gap-1 text-[15px] font-bold text-azul-texto @[460px]:col-span-2">
                <ChevronDown className="size-4 rotate-180" strokeWidth={2.5} /> Menos opções
              </button>
            </div>
          ) : (
            <button type="button" data-mais-opcoes onClick={() => setMaisAberto(true)} aria-expanded={false}
              className="group flex h-10 min-w-0 items-center gap-2 rounded-[12px] text-left text-[15px] font-medium text-sutil">
              <ChevronDown className="size-5 shrink-0 text-azul-texto" strokeWidth={2.5} />
              <span className="shrink-0 font-bold text-azul-texto">Mais opções</span>
            </button>
          ))}
        </div>
        <footer className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t-2 border-borda pt-4">
          {recado
            ? <p role="alert" className="min-w-0 flex-1 basis-48 text-[14px] font-bold leading-snug text-vermelho-texto">{recado}</p>
            : <p className="min-w-0 flex-1 basis-48 text-[14px] font-medium leading-snug text-sutil">{aviso}</p>}
          <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
            {aoCancelar && <Botao type="button" variante="fantasma" tamanho="m" onClick={aoCancelar}>Cancelar</Botao>}
            <Botao type="submit" variante="primario" tamanho="m" icone={<Sparkles strokeWidth={2.5} />}>{verbo}</Botao>
          </div>
        </footer>
      </form>
    )
  }

  return (
    <form ref={form} noValidate onSubmit={(e) => { e.preventDefault(); enviar() }} className={cn('flex min-h-0 min-w-0 flex-col', tela && 'max-h-full', className)}>
      <div className={cn('@container relative min-h-0', tela && 'flex-1 px-4 md:overflow-y-auto md:overscroll-contain lg:px-5')}>
        {noTopo.length > 0 && <div className={cn('grid gap-2', tela ? 'pt-4' : 'pb-1')}>{noTopo.map(({ c, i }) => <div key={i}>{desenha(c, i).peca}</div>)}</div>}
        <div className="divide-y-2 divide-borda">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.nome} className={cn('grid grid-cols-1 gap-x-6 gap-y-3 py-4 @[700px]:grid-cols-[150px_minmax(0,1fr)]', !tela && 'first:pt-0')}>
              <header className="flex flex-wrap items-baseline gap-x-2 @[700px]:block @[700px]:pt-0.5">
                <h3 className="t-selo text-sutil">{g.nome}</h3>
              </header>
              {recolhe(g) && !maisAberto ? (
                <button type="button" data-mais-opcoes onClick={() => setMaisAberto(true)} aria-expanded={false}
                  className="group flex h-12 min-w-0 items-center gap-3 rounded-[12px] border-2 border-borda px-3.5 text-left transition-colors duration-150 hover:bg-fundo-suave">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-sutil">{g.itens.map(({ c }) => nomeCurto(c)).join(' · ')}</span>
                  {preenchidos(g) > 0 && <span className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-tinta">{preenchidos(g)} {preenchidos(g) === 1 ? 'preenchido' : 'preenchidos'}</span>}
                  <ChevronDown className="size-5 shrink-0 text-azul-texto" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 @[560px]:grid-cols-2">
                  {g.itens.map(({ c, i }, j) => {
                    const { peca, larga } = desenha(c, i)
                    /* chips curtos só dividem a linha quando têm par; sozinhos ocupam a linha, e a dica cabe ao lado */
                    const semPar = c.tipo === 'chips' && !larga && !pares(g.itens.map((x) => x.c)).has(j)
                    return c.tipo === 'material' ? <div key={i} className="contents">{peca}</div> : <div key={i} className={cn('min-w-0', (larga || semPar) && '@[560px]:col-span-2')}>{peca}</div>
                  })}
                  {recolhe(g) && (
                    <button type="button" onClick={() => setMaisAberto(false)} aria-expanded className="inline-flex h-9 w-fit items-center gap-1 text-[15px] font-bold text-azul-texto @[560px]:col-span-2">
                      <ChevronDown className="size-4 rotate-180" strokeWidth={2.5} /> Recolher
                    </button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
      <footer className={cn('flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t-2 border-borda', tela ? 'rounded-b-[14px] bg-white px-4 py-3 max-md:sticky max-md:bottom-0 max-md:z-[1] lg:px-5' : 'pt-4')}>
        {recado
          ? <p role="alert" className="min-w-0 flex-1 basis-56 text-[14px] font-bold leading-snug text-vermelho-texto">{recado}</p>
          : <p className="min-w-0 flex-1 basis-56 text-[14px] font-medium leading-snug text-sutil">{aviso}</p>}
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
          {aoCancelar && <Botao type="button" variante="fantasma" tamanho="m" onClick={aoCancelar}>Cancelar</Botao>}
          <Botao type="submit" variante="primario" tamanho="m" icone={<Sparkles strokeWidth={2.5} />}>{verbo}</Botao>
        </div>
      </footer>
    </form>
  )
}

export function Aviso({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 rounded-[12px] border-2 border-azul-borda bg-azul-claro px-3.5 py-2.5 text-[15px] font-medium leading-snug text-tinta"><Info className="mt-0.5 size-4 shrink-0 text-azul-texto" strokeWidth={2.5} /> <span>{children}</span></p>
}

/* ─── Os dois formulários que também vivem no cartão da conversa ─────────────────────────────── */

/** Ferramenta Prova. O que a conversa entendeu do pedido (tema, número de questões) já vem preenchido. */
export function FormProva({ tema = 'Estequiometria', questoes = 10, aoCancelar, aoGerar, rotuloGerar = 'Gerar prova' }: {
  tema?: string; questoes?: number; aoCancelar?: () => void; aoGerar: () => void; rotuloGerar?: string
}) {
  const f = ferramenta('prova')!
  const discursivas = Math.min(2, Math.floor(questoes / 5))
  const tipos = f.campos.find((c) => c.tipo === 'contadores')
  const contagem = (tipos?.tipo === 'contadores' ? tipos.itens : []).map((_, i) => (i === 0 ? questoes - discursivas : i === 1 ? discursivas : 0))
  return <MotorFormulario campos={f.campos} extras={f.extras} verbo={rotuloGerar} iniciais={{ tema, questoes: contagem }} aoCancelar={aoCancelar} aoGerar={() => aoGerar()} />
}

/* Os tipos de adaptação moram no catálogo (`dados/ferramentas`), e saem por aqui para quem já importava daqui. */
export { TIPOS_ADAPTACAO } from '@/dados/ferramentas'

export const AVISO_ADAPTACAO = 'A versão nasce para aprovar: só chega ao aluno depois que você aprovar.'

export function FormAdaptacao({ origem = 'Prova de estequiometria · 2ºB', aoCancelar, aoGerar }: { origem?: string; aoCancelar?: () => void; aoGerar: (tipos: string[]) => void }) {
  const f = ferramenta('adaptacao')!
  return <MotorFormulario campos={f.campos} extras={f.extras} verbo={f.verbo} aviso={AVISO_ADAPTACAO} iniciais={{ origem }} aoCancelar={aoCancelar} aoGerar={(v) => aoGerar(v.tipos as string[])} />
}
