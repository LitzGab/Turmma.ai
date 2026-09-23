import { useId, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Check, ChevronDown, Info, Minus, Paperclip, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUpload, type ArquivoAnexado } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { BIBLIOTECA } from '@/dados/biblioteca'
import { HABILIDADES, MATERIAIS, TURMAS, turmaDe } from '@/dados/escola'
import {
  CAPITULO_ATUAL, CAPITULOS, PREREQUISITOS, TURMA_CARREGA, ferramenta,
  type CampoDef, type Extra, type Grupo,
} from '@/dados/ferramentas'
import { cn } from '@/lib/utils'

/* O MOTOR DE FORMULÁRIO DAS FERRAMENTAS (sétima rodada, 20/09/2026).

   Cada ferramenta tem UM contrato de entrada (D18): o cartão dentro da conversa e o formulário da tela Ferramentas
   são o MESMO formulário. Por isso o motor mora aqui, e as duas telas importam daqui. Ele lê os `campos` de
   `dados/ferramentas` e desenha — Prova e Adaptação deixaram de ter formulário escrito à mão (`FormProva` e
   `FormAdaptacao` continuam existindo, com as mesmas props, e são só o motor com os campos delas).

   O desenho, a pedido do Gabriel ("muito feio ao ser preenchido", "confirmar que tem todas as infos com base na
   Teachy"), é o de um formulário de configurações (ChatGPT, Linear, Notion):
   · GRUPOS com o nome à esquerda e os campos à direita, separados por um fio: "Para quem" (turma, material) ·
     "O quê" (o campo digitado, o arquivo, o seletor de modo) · "Como" (chips, cartões, chaves, contadores) ·
     "Mais opções" (BNCC, detalhes, anexar, buscar na web), recolhido. O grupo sai do TIPO do campo; grupo vazio
     não aparece. Em coluna estreita (cartão da conversa, celular) o nome do grupo sobe para cima dos campos —
     quem decide é a largura do próprio formulário (container query), não a da janela.
   · marcado é LEVE: cartão com fio preto de 1,5 px e um visto pequeno, fundo branco; chip preto cheio de 32 px;
     o não marcado tem fio `linha`. Campo e seletor com 40 px; texto longo começa com 3 linhas.
   · os campos de texto nascem VAZIOS, com um pedido-modelo no placeholder; "Preencher exemplo" (estático, de
     graça) escreve o `valor` do catálogo. Por isso tudo aqui é controlado: o estado é um dicionário `Valores`.
   · rodapé fixo: o aviso à esquerda, o botão com o verbo da ferramenta à direita. Na tela (`variante="tela"`) o
     miolo rola por dentro; no cartão da conversa o formulário tem a altura que tiver.
   · extras transversais no fim de "Mais opções": "Anexar arquivo" (o `ui/file-upload`, e SEMPRE a pergunta "de
     quem é este material", sem opção pré-marcada — D5) e "Buscar na web" (desligada, vale só para aquela geração,
     e o que vier sai rotulado — D68). São só dois campos a mais no fim da lista.
   Peças: shadcn/input, select, switch, textarea, label, button e o file-upload (21st.dev). */

export function Campo({ rotulo, children, className, dica }: { rotulo: string; children: (id: string) => ReactNode; className?: string; dica?: string }) {
  const id = useId()
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold text-apoio">{rotulo}</Label>
      {children(id)}
      {dica && <p className="text-xs text-sutil">{dica}</p>}
    </div>
  )
}

const campo = 'h-11 rounded-controle border-borda-campo bg-superficie text-[15px] placeholder:text-inativo md:h-10'

export function SelectTurma({ id, padrao = '2b', valor, aoMudar }: { id?: string; padrao?: string; valor?: string; aoMudar?: (v: string) => void }) {
  return (
    <Select defaultValue={valor === undefined ? padrao : undefined} value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-controle">
        {TURMAS.map((t) => <SelectItem key={t.id} value={t.id} className="rounded-linha">{t.nome} · {t.disciplina}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function SelectMaterial({ id, valor, aoMudar, semCapitulo }: { id?: string; valor?: string; aoMudar?: (v: string) => void; semCapitulo?: boolean }) {
  return (
    <Select defaultValue={valor === undefined ? 'q2' : undefined} value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-controle">
        {MATERIAIS.filter((m) => m.estado === 'pronto').map((m) => (
          <SelectItem key={m.id} value={m.id} className="rounded-linha">{m.titulo.split(' — ')[0]}{!semCapitulo && ` — ${m.capitulo.split(' · ')[0]}`}</SelectItem>
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

/** Os itens da biblioteca que um campo `artefato` oferece: os que a ferramenta certa gerou, do mais novo ao mais velho. */
const artefatosDe = (c: Extract<CampoDef, { tipo: 'artefato' }>, extra?: string) => {
  const itens = BIBLIOTECA.filter((b) => c.de.includes(b.de) && !b.ampliada).map((b) => ({
    valor: `${b.titulo} · ${b.turma}`, apoio: `${ferramenta(b.de)?.nome ?? ''} · ${String(b.em[0]).padStart(2, '0')}/${String(b.em[1]).padStart(2, '0')}`,
  }))
  const falta = [extra, c.padrao].filter((x): x is string => !!x && !itens.some((i) => i.valor === x))
  return [...falta.map((valor) => ({ valor, apoio: '' })), ...itens]
}

function valoresIniciais(campos: CampoDef[], dados: Valores = {}): Valores {
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
      case 'artefato': v[k] = (typeof dados[k] === 'string' && dados[k]) || c.padrao || artefatosDe(c)[0]?.valor || ''; break
    }
  })
  const turma = (dados.turma ?? v.turma) as string | undefined
  const material = TURMA_CARREGA[turma ?? '2b']?.material ?? 'q2'
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

const rotuloCampo = 'text-[12.5px] font-medium leading-none text-sutil'
const chip = (marcado: boolean) => cn('inline-flex h-8 items-center rounded-full border px-3 text-[13px] leading-none transition-colors duration-150',
  marcado ? 'border-tinta bg-tinta font-medium text-white' : 'border-linha bg-superficie text-tinta hover:border-borda-campo hover:bg-realce-suave')

function Bloco({ para, rotulo, opcional, dica, erro, lado, children }: {
  para?: string; rotulo?: string; opcional?: boolean; dica?: string; erro?: string; lado?: ReactNode; children: ReactNode
}) {
  const rid = useId()
  return (
    <div role={para ? undefined : 'group'} aria-labelledby={para || !rotulo ? undefined : rid} data-erro={erro ? '' : undefined} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      {rotulo && (
        <div className="flex items-baseline justify-between gap-3">
          {para
            ? <Label htmlFor={para} className={rotuloCampo}>{rotulo}{opcional && <span className="ml-1.5 font-normal text-inativo">opcional</span>}</Label>
            : <span id={rid} className={rotuloCampo}>{rotulo}{opcional && <span className="ml-1.5 font-normal text-inativo">opcional</span>}</span>}
          {lado}
        </div>
      )}
      {children}
      {erro ? <p role="alert" className="text-[12.5px] leading-snug text-erro">{erro}</p> : dica && <p className="text-[12px] leading-snug text-sutil">{dica}</p>}
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
        {opcoes.map((o) => <button key={o} type="button" aria-pressed={marcado(o)} onClick={() => clicar(o)} className={chip(marcado(o))}>{o}</button>)}
        {valor === 'Outro' && (
          <Input autoFocus type={numero ? 'number' : 'text'} inputMode={numero ? 'numeric' : undefined} min={numero ? 1 : undefined} value={outro} onChange={(e) => aoMudarOutro(e.target.value)}
            aria-label={`${c.rotulo}: outro valor`} placeholder={c.outro ?? (numero ? 'Quantos?' : 'Qual?')}
            className={cn('h-8 rounded-full border-borda-campo px-3 text-[13px] placeholder:text-inativo', numero ? 'w-[132px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none' : 'w-52')} />
        )}
       </div>
        {c.dica && <p className="text-[12px] leading-snug text-sutil">{c.dica}</p>}
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
            <label key={o.id} className={cn('relative flex flex-col rounded-controle border-[1.5px] bg-superficie px-3 py-2.5 transition-colors duration-150',
              off ? 'cursor-not-allowed border-linha opacity-55' : on ? 'cursor-pointer border-tinta' : 'cursor-pointer border-linha hover:border-borda-campo hover:bg-lateral')}>
              <input type={c.multiplo ? 'checkbox' : 'radio'} name={nome} value={o.id} checked={on} disabled={!!off} onChange={() => clicar(o.id)} className="peer sr-only" />
              <span className="pr-6 text-[13.5px] font-semibold leading-snug text-tinta">{o.nome}</span>
              <span className="mt-0.5 text-[12px] leading-snug text-sutil">{o.detalhe}</span>
              {'etiqueta' in o && o.etiqueta && <span className="mt-1.5 inline-flex h-[18px] w-fit items-center whitespace-nowrap rounded-full bg-realce-suave px-2 text-[10.5px] font-medium leading-none text-apoio">{o.etiqueta}</span>}
              <span aria-hidden className={cn('absolute right-2.5 top-2.5 grid size-4 place-items-center border transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta',
                c.multiplo ? 'rounded-[5px]' : 'rounded-full', on ? 'border-tinta bg-tinta text-white' : 'border-borda-campo bg-superficie')}>{on && <Check className="size-2.5" strokeWidth={3.5} />}</span>
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
    <label className="relative flex min-h-9 cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium leading-snug text-tinta">{c.rotulo}</span>
        {c.detalhe && <span className="mt-0.5 block text-[12px] leading-snug text-sutil">{c.detalhe}</span>}
      </span>
      <Switch checked={ligada} onCheckedChange={aoMudar} className="origin-right scale-[.84] data-[state=checked]:bg-tinta data-[state=unchecked]:bg-borda-campo" />
    </label>
  )
}

/** O total É o número de questões: não existe outro campo de quantidade para divergir deste. */
function Contadores({ c, n, erro, aoMudar }: { c: Extract<CampoDef, { tipo: 'contadores' }>; n: number[]; erro?: string; aoMudar: (v: number[]) => void }) {
  const soma = n.reduce((a, b) => a + b, 0)
  const muda = (i: number, d: number) => aoMudar(n.map((x, j) => (j === i ? Math.max(0, x + d) : x)))
  const botao = 'grid size-6 place-items-center rounded-full border border-linha text-tinta transition-colors duration-150 hover:border-borda-campo hover:bg-realce-suave disabled:opacity-35'
  return (
    <Bloco rotulo={c.rotulo} dica={c.dica} erro={erro} lado={<span className="text-[12.5px] leading-none text-sutil"><b className="font-semibold text-tinta">{soma}</b> no total</span>}>
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-controle border border-linha bg-linha @[460px]:grid-cols-2">
        {c.itens.map((item, i) => (
          <li key={item.nome} className={cn('flex h-9 items-center justify-between gap-3 bg-superficie pl-3 pr-2', c.itens.length % 2 === 1 && i === c.itens.length - 1 && '@[460px]:col-span-2')}>
            <span className={cn('truncate text-[13.5px]', n[i] ? 'font-medium text-tinta' : 'text-sutil')}>{item.nome}</span>
            <span className="flex shrink-0 items-center gap-1">
              <button type="button" aria-label={`Menos ${item.nome}`} disabled={!n[i]} onClick={() => muda(i, -1)} className={botao}><Minus className="size-3" /></button>
              <span className={cn('w-6 text-center text-[13.5px] font-semibold', n[i] ? 'text-tinta' : 'text-inativo')}>{n[i]}</span>
              <button type="button" aria-label={`Mais ${item.nome}`} onClick={() => muda(i, 1)} className={botao}><Plus className="size-3" /></button>
            </span>
          </li>
        ))}
      </ul>
    </Bloco>
  )
}

const caixaMarcar = (on: boolean) => cn('grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors duration-150', on ? 'border-tinta bg-tinta text-white' : 'border-borda-campo bg-superficie')

/** BNCC: as habilidades do capítulo, em chips. Diagnóstico: as da turma, da que tem menos acerto para a que tem mais.
    Pré-requisito: o que o capítulo exige de ANTES, com o lugar do material de onde sai. */
function Habilidades({ c, marcadas, turma, aoMudar }: { c: Extract<CampoDef, { tipo: 'habilidades' }>; marcadas: string[]; turma: string; aoMudar: (v: string[]) => void }) {
  const alterna = (k: string) => aoMudar(marcadas.includes(k) ? marcadas.filter((x) => x !== k) : [...marcadas, k])
  if (c.modo === 'bncc') return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional} dica="São as habilidades que o capítulo escolhido cobre. Sem marcar, o Assistente usa as do capítulo.">
      <div className="flex flex-wrap gap-1.5">
        {HABILIDADES.map((h) => (
          <button key={h.codigo} type="button" aria-pressed={marcadas.includes(h.codigo)} onClick={() => alterna(h.codigo)} title={h.nome} className={cn(chip(marcadas.includes(h.codigo)), 'gap-1.5 text-[12.5px]')}>
            <b className="font-semibold">{h.codigo}</b><span className={cn('hidden max-w-[20ch] truncate @[460px]:inline', !marcadas.includes(h.codigo) && 'text-sutil')}>{h.nome}</span>
          </button>
        ))}
      </div>
    </Bloco>
  )
  if (c.modo === 'diagnostico' && !TURMA_CARREGA[turma]?.diagnostico) return (
    <Bloco rotulo={c.rotulo}>
      <p className="flex items-start gap-2 rounded-controle bg-lateral px-3 py-2.5 text-[13px] leading-snug text-apoio"><Info className="mt-px size-4 shrink-0 text-sutil" /> O {turmaDe(turma).nome} ainda não tem avaliação corrigida e aprovada, então não há diagnóstico para partir.</p>
    </Bloco>
  )
  const linhas = c.modo === 'diagnostico'
    ? [...HABILIDADES].sort((a, b) => a.acerto - b.acerto).map((h) => ({ k: h.codigo, nome: h.nome, apoio: h.codigo, acerto: h.acerto as number | null }))
    : PREREQUISITOS.map((p) => ({ k: p.codigo, nome: p.nome, apoio: `${p.origem} · ${p.codigo}`, acerto: null }))
  return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional}
      dica={c.modo === 'diagnostico' ? 'Acerto da turma na prova de 18/09, que você aprovou. É dado da turma, não de um aluno.' : 'O que o capítulo exige de antes. O Assistente sugeriu estes; tire o que a turma já domina.'}>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden rounded-controle border border-linha bg-linha">
        {linhas.map((h) => {
          const on = marcadas.includes(h.k)
          return (
            <li key={h.k}>
              <label className="relative flex h-10 cursor-pointer items-center gap-3 bg-superficie px-3 transition-colors duration-150 hover:bg-lateral">
                <input type="checkbox" checked={on} onChange={() => alterna(h.k)} className="sr-only" />
                <span aria-hidden className={caixaMarcar(on)}>{on && <Check className="size-2.5" strokeWidth={3.5} />}</span>
                <span className={cn('min-w-0 flex-1 truncate text-[13.5px]', on ? 'font-medium text-tinta' : 'text-apoio')}>{h.nome}</span>
                <span className="hidden shrink-0 text-[12px] text-sutil @[460px]:inline">{h.apoio}</span>
                {h.acerto !== null && (
                  <span className="flex shrink-0 items-center gap-2 @[460px]:w-24"><span className="hidden h-1 flex-1 overflow-hidden rounded-full bg-realce @[460px]:block"><i className={cn('block h-full rounded-full', h.acerto < 50 ? 'bg-caramelo' : 'bg-tinta')} style={{ width: `${h.acerto}%` }} /></span><b className="w-8 text-right text-[12.5px] font-semibold text-tinta">{h.acerto}%</b></span>
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
    <button type="button" onClick={() => setAberto(true)} className="group flex min-h-10 w-full items-center gap-2.5 rounded-controle border border-dashed border-borda-campo px-3 py-1.5 text-left transition-colors duration-150 hover:border-inativo hover:bg-lateral">
      <Paperclip className="size-4 shrink-0 text-sutil" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-tinta">{c.rotulo} <span className="font-normal text-inativo">opcional</span></span>
      <span className="hidden shrink-0 text-[12.5px] font-medium text-sutil group-hover:text-tinta @[460px]:inline">Enviar arquivo</span>
    </button>
  )
  return (
    <Bloco rotulo={c.rotulo} opcional={c.opcional} erro={erro}>
      <FileUpload files={arquivos} onFilesChange={aoMudar} multiple={false} accept=".pdf,.docx" title="Clique ou solte o arquivo aqui" description={c.dica}
        className={cn('space-y-2 [&>div:first-child]:min-h-0 [&>div:first-child]:gap-2.5 [&>div:first-child]:rounded-controle [&>div:first-child]:py-4', arquivos.length > 0 && '[&>div:first-child]:hidden')} />
      {c.declaracao && (
        <div role="group" aria-label="De quem é este material" className="grid gap-2 rounded-controle bg-lateral px-3 py-2.5">
          <p className="text-[12.5px] font-medium leading-snug text-tinta">De quem é este material <span className="font-normal text-sutil">· você declara; nada vem marcado</span></p>
          <div className="flex flex-wrap gap-1.5">
            {DONOS.map((o) => <button key={o} type="button" aria-pressed={dono === o} onClick={() => aoMudarDono(o)} className={chip(dono === o)}>{o}</button>)}
          </div>
          {dono === DONOS[2] && <Input value={licenca} onChange={(e) => aoMudarLicenca(e.target.value)} aria-label="Qual licença" placeholder="Qual licença? Ex.: CC BY 4.0, ou autorização por escrito da editora" className={cn(campo, 'md:h-9 text-[13.5px]')} />}
          <p className="text-[12px] leading-snug text-sutil">Material de sistema de ensino sem licença não entra.</p>
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

export function MotorFormulario({ campos, extras = [], verbo, iniciais, aviso = AVISO_PADRAO, variante = 'cartao', aoGerar, aoCancelar, ref, className }: {
  campos: CampoDef[]; extras?: Extra[]; verbo: string
  /** valores que já vêm de fora: o que a conversa entendeu do pedido, ou o que a pessoa tinha preenchido antes de gerar */
  iniciais?: Valores; aviso?: string
  /** `tela`: ocupa o cartão da tela, o miolo rola por dentro e o rodapé fica fixo. `cartao`: altura natural, sem respiro próprio */
  variante?: 'tela' | 'cartao'
  aoGerar: (valores: Valores) => void; aoCancelar?: () => void; ref?: Ref<MotorHandle>; className?: string
}) {
  const todos = useMemo(() => [...campos, ...extras.map((e) => EXTRA[e])], [campos, extras])
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(todos, iniciais))
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
          if (c.tipo === 'texto' || c.tipo === 'longo') n[k] = c.valor ?? c.exemplo.replace(/^Ex\.: /, '')
          if (c.tipo === 'arquivo' && c.amostra) n[k] = [{ id: 'amostra', name: c.amostra, type: 'application/pdf', size: 1_258_291 }]
        })
        return n
      })
      setErros({})
    },
    limpar: () => { setValores(valoresIniciais(todos)); setErros({}) },
  }), [todos])

  const enviar = () => {
    const e = validar(todos, valores)
    setErros(e)
    if (Object.keys(e).length === 0) return aoGerar(valores)
    if (todos.some((c, i) => e[chaveDe(c, i)] && grupoDe(c) === 'extras')) setMaisAberto(true)
    window.setTimeout(() => form.current?.querySelector('[data-erro]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 30)
  }

  const mudarTurma = (t: string) => {
    const material = TURMA_CARREGA[t]?.material ?? 'q2'
    setValores((a) => ({ ...a, turma: t, ...(a.material !== undefined && a.material !== material
      ? { material, 'material:de': String(CAPITULO_ATUAL[material] ?? 0), 'material:ate': String((CAPITULOS[material]?.length ?? 1) - 1) } : {}) }))
  }

  const desenha = (c: CampoDef, i: number): { peca: ReactNode; larga: boolean } => {
    const k = chaveDe(c, i)
    const id = `${uid}-${k}`
    const erro = erros[k] || undefined
    switch (c.tipo) {
      case 'turma': {
        const t = turmaDe(texto(k))
        const n = TURMA_CARREGA[t.id]?.adaptacoes ?? 0
        const comMaterial = todos.some((x) => x.tipo === 'material')
        return { larga: !comMaterial, peca: (
          <Bloco para={id} rotulo="Turma" dica={comMaterial ? undefined : `A turma carrega: ${t.disciplina} · ${t.serie} · ${t.alunos} alunos${n ? ` · ${n} ${n === 1 ? 'adaptação registrada' : 'adaptações registradas'}` : ''}.`}>
            <SelectTurma id={id} valor={texto(k)} aoMudar={mudarTurma} />
          </Bloco>
        ) }
      }
      case 'material': {
        const t = turmaDe(texto('turma'))
        const n = TURMA_CARREGA[t.id]?.adaptacoes ?? 0
        const caps = CAPITULOS[texto(k)] ?? []
        const carrega = <p className="text-[12px] leading-snug text-sutil @[560px]:col-span-2">A turma carrega: {t.disciplina} · {t.serie} · {t.alunos} alunos{n ? ` · ${n} ${n === 1 ? 'adaptação registrada' : 'adaptações registradas'}` : ''}.{c.dica && ` ${c.dica}`}</p>
        return { larga: false, peca: (
          <>
            <Bloco para={id} rotulo="Material"><SelectMaterial id={id} valor={texto(k)} semCapitulo={c.varios} aoMudar={(m) => setValores((a) => ({ ...a, [k]: m, 'material:de': String(CAPITULO_ATUAL[m] ?? 0), 'material:ate': String((CAPITULOS[m]?.length ?? 1) - 1) }))} /></Bloco>
            {c.varios && (['de', 'ate'] as const).map((ponta) => (
              <Bloco key={ponta} para={`${id}-${ponta}`} rotulo={ponta === 'de' ? 'Do capítulo' : 'Ao capítulo'}>
                <Select value={texto(`${k}:${ponta}`)} onValueChange={(v) => por(`${k}:${ponta}`, v)}>
                  <SelectTrigger id={`${id}-${ponta}`} className={campo}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-controle">
                    {caps.map((cap, j) => <SelectItem key={cap} value={String(j)} disabled={ponta === 'ate' ? j < Number(texto(`${k}:de`)) : j > Number(texto(`${k}:ate`))} className="rounded-linha">{cap}</SelectItem>)}
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
          <Input id={id} value={texto(k)} onChange={(e) => por(k, e.target.value)} placeholder={c.exemplo} aria-invalid={!!erro} className={cn(campo, erro && 'border-erro')} />
        </Bloco>
      ) }
      case 'longo': return { larga: true, peca: (
        <Bloco para={id} rotulo={c.rotulo} opcional={c.opcional} dica={c.dica} erro={erro}>
          <Textarea id={id} rows={3} value={texto(k)} onChange={(e) => por(k, e.target.value)} placeholder={c.exemplo} aria-invalid={!!erro}
            className={cn('min-h-0 rounded-controle border-borda-campo bg-superficie px-3 py-2 text-[15px] leading-[1.45] placeholder:text-inativo', erro && 'border-erro')} />
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
        <Bloco para={id} rotulo={c.rotulo} dica={c.dica}>
          <Select value={texto(k)} onValueChange={(v) => por(k, v)}>
            <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 rounded-controle">
              {artefatosDe(c, typeof iniciais?.[k] === 'string' ? (iniciais[k] as string) : undefined).map((a) => <SelectItem key={a.valor} value={a.valor} className="rounded-linha">{a.valor}</SelectItem>)}
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

  return (
    <form ref={form} noValidate onSubmit={(e) => { e.preventDefault(); enviar() }} className={cn('flex min-h-0 min-w-0 flex-col', tela && 'max-h-full', className)}>
      <div className={cn('@container relative min-h-0', tela && 'flex-1 overflow-y-auto overscroll-contain px-4 lg:px-5')}>
        {noTopo.length > 0 && <div className={cn('grid gap-2', tela ? 'pt-4' : 'pb-1')}>{noTopo.map(({ c, i }) => <div key={i}>{desenha(c, i).peca}</div>)}</div>}
        <div className="divide-y divide-linha">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.nome} className={cn('grid grid-cols-1 gap-x-6 gap-y-2.5 py-3 @[700px]:grid-cols-[168px_minmax(0,1fr)]', !tela && 'first:pt-0')}>
              <header className="flex flex-wrap items-baseline gap-x-2 @[700px]:block @[700px]:pt-0.5">
                <h3 className="font-corpo text-[13.5px] font-semibold leading-snug text-tinta">{g.nome}</h3>
                <p className="text-[12px] leading-snug text-sutil @[700px]:mt-0.5">{g.apoio}</p>
              </header>
              {recolhe(g) && !maisAberto ? (
                <button type="button" data-mais-opcoes onClick={() => setMaisAberto(true)} aria-expanded={false}
                  className="group flex h-10 min-w-0 items-center gap-3 rounded-controle border border-linha px-3 text-left transition-colors duration-150 hover:border-borda-campo hover:bg-lateral">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-sutil">{g.itens.map(({ c }) => nomeCurto(c)).join(' · ')}</span>
                  {preenchidos(g) > 0 && <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-tinta"><i className="size-1.5 rounded-full bg-tinta" />{preenchidos(g)} {preenchidos(g) === 1 ? 'preenchido' : 'preenchidos'}</span>}
                  <ChevronDown className="size-4 shrink-0 text-sutil transition-colors duration-150 group-hover:text-tinta" strokeWidth={1.75} />
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
                    <button type="button" onClick={() => setMaisAberto(false)} aria-expanded className="inline-flex h-7 w-fit items-center gap-1 text-[12.5px] font-medium text-sutil transition-colors duration-150 hover:text-tinta @[560px]:col-span-2">
                      <ChevronDown className="size-3.5 rotate-180" strokeWidth={1.75} /> Recolher
                    </button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
      <footer className={cn('flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2.5 border-t border-linha', tela ? 'px-4 py-2.5 lg:px-5' : 'pt-4')}>
        {recado
          ? <p role="alert" className="min-w-0 flex-1 basis-56 text-[12.5px] leading-snug text-erro">{recado}</p>
          : <p className="min-w-0 flex-1 basis-56 text-[12.5px] leading-snug text-sutil">{aviso}</p>}
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
          {aoCancelar && <Button type="button" variant="discreto" onClick={aoCancelar}>Cancelar</Button>}
          <Button type="submit"><Sparkles /> {verbo}</Button>
        </div>
      </footer>
    </form>
  )
}

export function Aviso({ children }: { children: ReactNode }) {
  return <p className="flex items-start gap-2 rounded-controle bg-lateral px-3 py-2 text-[12.5px] leading-snug text-apoio"><Info className="mt-px size-4 shrink-0 text-sutil" strokeWidth={1.75} /> <span>{children}</span></p>
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

export const AVISO_ADAPTACAO = 'A versão nasce pendente: só chega ao aluno depois que você aprovar.'

export function FormAdaptacao({ origem = 'Prova de estequiometria · 2ºB', aoCancelar, aoGerar }: { origem?: string; aoCancelar?: () => void; aoGerar: (tipos: string[]) => void }) {
  const f = ferramenta('adaptacao')!
  return <MotorFormulario campos={f.campos} extras={f.extras} verbo={f.verbo} aviso={AVISO_ADAPTACAO} iniciais={{ origem }} aoCancelar={aoCancelar} aoGerar={(v) => aoGerar(v.tipos as string[])} />
}
