import { useRef, useState } from 'react'
import { FileText, Lock, Upload } from 'lucide-react'
import {
  Aviso, Botao, Campo, CampoTexto, Dialogo, DialogoConfirmar, FaixaResultado, LadrilhoIcone, MenuMais, Opcao, Selo,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { DISCIPLINAS, SERIES } from '@/dados/estrutura'
import { material, useMaterial, type EstadoIngestao, type Fonte } from '@/dados/escola-estado'
import { cn } from '@/lib/utils'
import { Escolha, TabelaGrade, type ColunaGrade } from './_estrutura-pecas'

/* MATERIAL (12ª rodada, 04/10/2026; plano 5.3), a terceira aba de Escola.
   · ENVIAR MATERIAL: PDF, dono e licença obrigatórios, mais a declaração. Sem licença, o envio é recusado ANTES de sair
     do computador (D5; Lei 9.610/1998 — lei). A série e a disciplina dizem para que turma a fonte vale (D6).
   · A tabela (linhas de 64; 14ª rodada), com o que falhou primeiro: Material (ícone, título, dono) · Para · Licença ·
     Situação, o selo à direita. A linha abre o painel (?fonte=).
   · No painel: série e disciplina, a licença, ENVIAR OUTRA VERSÃO (PDF escaneado não resolve "tentando de novo") e, no
     ⋯, RETIRAR DO USO com motivo (ECA Digital, arts. 29 e 30 — lei). Saíram os 4 cartões de número e o aviso largo. */

const SELO: Record<EstadoIngestao, { texto: string; familia: 'verde' | 'amarelo' | 'vermelho' }> = {
  falhou: { texto: 'Não carregou', familia: 'vermelho' },
  processando: { texto: 'Processando', familia: 'amarelo' },
  pronto: { texto: 'Pronto', familia: 'verde' },
  recusado: { texto: 'Recusado', familia: 'vermelho' },
}
const ORDEM: Record<EstadoIngestao, number> = { falhou: 0, processando: 1, pronto: 2, recusado: 3 }
const LICENCAS = [
  { valor: 'Material próprio da escola', rotulo: 'Material próprio da escola' },
  { valor: 'Licenciado por contrato', rotulo: 'Licenciado por contrato' },
  { valor: 'Licença aberta', rotulo: 'Licença aberta (CC ou domínio público)' },
  { valor: 'sem', rotulo: 'Não tenho a licença' },
]
/** Série e disciplina das fontes de sempre (D6). As novas guardam no próprio capítulo. */
const PARA: Record<string, string> = {
  bio: '1º ano EM · Biologia', q2: '2º ano EM · Química', c9: '9º ano EF · Ciências', rea: '1º ano EM · Química', ap: '2º ano EM · Matemática',
}
const paraDe = (f: Fonte) => PARA[f.id] ?? f.capitulo
/** A forma curta, para a coluna da tabela ("2º EM · Matemática"). */
const paraCurto = (f: Fonte) => paraDe(f).replace(' ano ', ' ')

export function Material() {
  const lista = useMaterial()
  const [enviando, setEnviando] = useState(false)
  const [fonteId, setFonte] = useParametro('fonte')
  const ordenada = [...lista].sort((a, b) => Number(!!a.retirado) - Number(!!b.retirado) || ORDEM[a.estado] - ORDEM[b.estado])
  const aberta = lista.find((f) => f.id === fonteId) ?? null

  const selo = (f: Fonte) => { const x = f.retirado ? { texto: 'Retirado', familia: 'neutro' as const } : SELO[f.estado]; return <Selo familia={x.familia} tamanho="p">{x.texto}</Selo> }
  const ladrilho = (f: Fonte) => <LadrilhoIcone familia={f.estado === 'falhou' || f.estado === 'recusado' ? 'vermelho' : 'azul'} tamanho={40} icone={<Icone id={f.estado === 'falhou' ? 'material-falhou' : 'leitura'} tamanho={28} />} />
  const colunas: ColunaGrade<Fonte>[] = [
    { titulo: 'Material', largura: 'minmax(0,3.2fr)', celula: (f) => (
      <span className={cn('flex min-w-0 items-center gap-3', f.retirado && 'opacity-70')}>
        {ladrilho(f)}
        <span className="flex min-w-0 flex-col">
          <span className="t-cartao line-clamp-2 text-tinta [overflow-wrap:anywhere]" title={f.titulo}>{f.titulo}</span>
          <span className="t-apoio truncate">{f.titular}</span>
        </span>
      </span>
    ) },
    { titulo: 'Para', largura: 'minmax(0,1.1fr)', celula: (f) => <span className="line-clamp-2 text-apoio">{paraCurto(f)}</span> },
    { titulo: 'Licença', largura: 'minmax(0,1.1fr)', celula: (f) => <span className="line-clamp-2 text-apoio">{f.licenca}</span> },
    { titulo: 'Situação', largura: '120px', alinhar: 'fim', celula: selo },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 max-md:overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <p className="t-apoio flex min-w-0 flex-1 items-center gap-1.5"><Lock aria-hidden className="size-4 shrink-0" strokeWidth={2.5} /> O material fica na escola e não treina IA.</p>
        <Botao tamanho="m" icone={<Upload strokeWidth={2.5} />} className="max-sm:w-full" onClick={() => setEnviando(true)}>Enviar material</Botao>
      </div>

      <TabelaGrade rotulo="Material" colunas={colunas} grupos={[{ id: 'todos', linhas: ordenada }]} chave={(f) => f.id} altura={64}
        aoAbrir={(f) => setFonte(f.id)} ativa={fonteId} vazio="Nenhum material ainda."
        celular={(f) => ({ inicio: ladrilho(f), titulo: f.titulo, apoio: `${paraCurto(f)} · ${f.titular}`, fim: selo(f) })} />

      <PainelFonte key={aberta?.id ?? 'nenhuma'} fonte={aberta} aoFechar={() => setFonte(null)} />
      <DialogoEnviar aberto={enviando} aoFechar={() => setEnviando(false)} />
    </div>
  )
}

/* ── O painel da fonte ─────────────────────────────────────────────────────────────────────────────────── */

function PainelFonte({ fonte: f, aoFechar }: { fonte: Fonte | null; aoFechar: () => void }) {
  const [retirando, setRetirando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [feito, setFeito] = useState<string | null>(null)
  if (!f) return <PainelLado aberto={false} aoFechar={aoFechar} titulo=""><span /></PainelLado>
  const s = f.retirado ? { texto: 'Retirado', familia: 'neutro' as const } : SELO[f.estado]
  const podeReenviar = !f.retirado && f.estado === 'falhou'
  return (
    <>
      <PainelLado aberto aoFechar={aoFechar} titulo={f.titulo}
        rodape={!f.retirado && (
          <>
            <MenuMais rotulo="Mais sobre o material" lado="top" alinhar="start" itens={[{ rotulo: 'Retirar do uso', perigo: true, aoEscolher: () => setRetirando(true) }]} />
            <span className="flex-1" />
            {podeReenviar && <Botao tamanho="m" icone={<Upload strokeWidth={2.5} />} onClick={() => { material.reenviar(f.id); setFeito('Outra versão enviada') }}>Enviar outra versão</Botao>}
          </>
        )}>
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2"><Selo familia={s.familia}>{s.texto}</Selo></div>
          {feito && <FaixaResultado tipo="certo" titulo={feito} className="-mx-6 border-b-2">{f.estado === 'pronto' ? 'Pronto para a IA ler.' : 'Lendo agora.'}</FaixaResultado>}
          {f.estado === 'falhou' && f.falha && !feito && <Aviso tom="erro" titulo={f.falha[0].toUpperCase() + f.falha.slice(1)}>Envie um PDF com texto.</Aviso>}
          {f.retirado && <Aviso tom="info" titulo="Retirado do uso">{f.retirado.motivo} · {f.retirado.quando}</Aviso>}
          <dl className="grid gap-3">
            {[['Para', paraDe(f)], ['Dono', f.titular], ['Licença', f.licenca], ...(f.paginas ? [['Páginas', String(f.paginas)]] : [])].map(([k, v]) => (
              <div key={k} className="grid gap-0.5">
                <dt className="t-selo text-sutil">{k}</dt>
                <dd className="t-corpo text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </PainelLado>
      <DialogoConfirmar aberto={retirando} aoMudar={(v) => { setRetirando(v); if (!v) setMotivo('') }} titulo="Retirar do uso?"
        frase="A IA para de usar este material na hora."
        confirmar={{ rotulo: 'Retirar', variante: 'perigoCheio', desligado: !motivo.trim(), aoConfirmar: () => { material.retirar(f.id, motivo.trim()); setMotivo('') } }}>
        <CampoTexto rotulo="Motivo" valor={motivo} aoMudar={setMotivo} placeholder="Ex.: o dono pediu a retirada" />
      </DialogoConfirmar>
    </>
  )
}

/* ── Enviar material ───────────────────────────────────────────────────────────────────────────────────── */

function DialogoEnviar({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [dono, setDono] = useState('')
  const [licenca, setLicenca] = useState('')
  const [serie, setSerie] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [declaro, setDeclaro] = useState(false)
  const [erro, setErro] = useState('')
  const fechar = () => { aoFechar(); window.setTimeout(() => { setArquivo(null); setDono(''); setLicenca(''); setSerie(''); setDisciplina(''); setDeclaro(false); setErro('') }, 200) }
  const enviar = () => {
    if (!arquivo) return setErro('Escolha o PDF.')
    if (!dono.trim()) return setErro('Diga quem é o dono.')
    if (!licenca || licenca === 'sem') return setErro('Sem licença, não envia. Nada saiu do computador.')
    if (!serie || !disciplina) return setErro('Escolha a série e a disciplina.')
    if (!declaro) return setErro('Marque a declaração.')
    material.enviar({ titulo: arquivo.replace(/\.pdf$/i, ''), capitulo: `${serie} · ${disciplina}`, paginas: 0, titular: dono.trim(), licenca })
    fechar()
  }
  const limpaErro = () => setErro('')
  return (
    <Dialogo aberto={aberto} aoMudar={(v) => { if (!v) fechar() }} titulo="Enviar material" largura={600}
      rodape={<Botao tamanho="m" onClick={enviar}>Enviar</Botao>}>
      <div className="grid gap-4">
        <Campo id="mt-arquivo" rotulo="PDF">
          <input ref={entrada} id="mt-arquivo" type="file" accept="application/pdf,.pdf" className="sr-only"
            onChange={(e) => { setArquivo(e.target.files?.[0]?.name ?? null); limpaErro() }} />
          <Botao variante="secundario" tamanho="m" icone={<FileText strokeWidth={2.5} />} className="justify-self-start" onClick={() => entrada.current?.click()}>
            {arquivo ?? 'Escolher PDF'}
          </Botao>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Dono" valor={dono} aoMudar={(v) => { setDono(v); limpaErro() }} placeholder="Colégio Aurora" />
          <Escolha id="mt-licenca" rotulo="Licença" valor={licenca} aoMudar={(v) => { setLicenca(v); limpaErro() }} marcador="Escolha" opcoes={LICENCAS} />
          <Escolha id="mt-serie" rotulo="Série" valor={serie} aoMudar={(v) => { setSerie(v); limpaErro() }} marcador="Escolha" opcoes={SERIES.map((s) => ({ valor: s, rotulo: s }))} />
          <Escolha id="mt-disc" rotulo="Disciplina" valor={disciplina} aoMudar={(v) => { setDisciplina(v); limpaErro() }} marcador="Escolha" opcoes={DISCIPLINAS.map((d) => ({ valor: d, rotulo: d }))} />
        </div>
        <Opcao tipo="checkbox" marcado={declaro} aoMudar={(m) => { setDeclaro(m); limpaErro() }}>
          <span className="text-[15px] font-medium leading-5">A escola pode usar este material. Fica registrado com meu nome.</span>
        </Opcao>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
      </div>
    </Dialogo>
  )
}
