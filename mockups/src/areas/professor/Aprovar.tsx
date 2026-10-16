import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import {
  AbasDaPagina, Avatar, Botao, CabecalhoPagina, Carimbo, Cartao, CampoTexto, DialogoConfirmar, EstadoVazio, FaixaResultado, FaixaResultados, Linha,
  Pagina, Ponto, Selo, SeloEstadoDocumento,
} from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { AssinaturaIA } from '@/components/turmma/ia'
import { agente } from '@/dados/agentes'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { lotes, notasDoLote, useLote, type Destaque, type EntregaNoLote, type Lote } from '@/dados/avaliacoes'
import { RESPOSTAS_LUCAS_PROVA_MOL } from '@/dados/demo/lotes-base'
import { bancoDaTarefa } from '@/dados/questoes'
import { cn } from '@/lib/utils'
import { Par } from './_pecas'

/* NOTAS PARA APROVAR (/professor/aprovar/:id) — 14ª rodada (05/10/2026; plano ux-composicao 5.2; antes, 12ª rodada).

   Página genérica de LOTE (`useLote(id)`): o de 26 da prova de mol (prova-2b, com 5 destaques) ou o de uma entrega
   feita na demonstração (lote-<tarefa>). A ação que não pode virar clique reflexo (regra 70; D33, D56; CNE).
   Página de Leitura (880), no esqueleto do documento (Geekie One e Plurall):
   · o cabeçalho com o título da prova, "2ºB · 18/09 · objetiva, 10 questões" e o selo do estado;
   · a FAIXA DE 5 NÚMEROS (corrigidas · para olhar · média · em branco · diferentes do que costumam), cada um com o
     "quem" embaixo; no celular ela mora na aba do resumo;
   · as abas DESTAQUES (5) · TODAS (26) · RESUMO E RECADO. Cada destaque abre ao lado (`lotes.verDestaque`), com as
     letras e o gabarito, TROCAR O GABARITO DESTA QUESTÃO e TIRAR DO LOTE; o botão de aprovar só acende depois de
     todos vistos. TODAS em ordem alfabética, nunca por nota. O RECADO que vai com a nota também é aprovado aqui;
   · no lote de uma entrega, a aba A PROVA, questão a questão; as saídas da aba viram selo (D70);
   · a barra presa embaixo com o único botão cheio, APROVAR AS 26 NOTAS (oficial); depois, o registro (D56). */

/** As letras que cada destaque da prova de 18/09 marcou (o que a professora confere ao abrir). É o único dado que
    ainda mora aqui: o `Destaque` da base não guarda as letras. Todo o resto (o selo, a questão, a média, a questão
    com mais erro, quantos marcaram cada letra) sai do lote e do gabarito ATUAL. */
const MARCADAS: Record<string, string> = { abaixo: 'CADAABCCDB', branco: '----------', q7: 'CBAACBCAAB', acima: 'CBCBCACDAB', aba: 'CBCBCADDAB' }

const minusculo = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
const emTexto = (r: Record<number, string>, n: number) => Array.from({ length: n }, (_, i) => (r[i] ?? '-').toUpperCase()).join('')
const LUCAS = 'Lucas Pereira'
/** O título no celular, que cabe ao lado do voltar: "Notas · prova de mol", "Notas · estequiometria". */
function tituloCurto(titulo: string) {
  const doc = minusculo(titulo).split(' e ')[0]
  return `Notas · ${doc}`.length <= 22 ? `Notas · ${doc}` : `Notas · ${doc.replace(/^(prova|lista|atividade)( de)? /, '')}`
}

/** O selo curto do destaque, tirado do porquê da base: ABAIXO DO COSTUME · EM BRANCO · NO LIMITE · ACIMA DO COSTUME · SAIU DA ABA N VEZES. */
function seloDoDestaque(d: Destaque) {
  const aba = d.porque.match(/aba.*?(\d+) vez/i)
  if (aba) return `Saiu da aba ${aba[1]} ${aba[1] === '1' ? 'vez' : 'vezes'}`
  if (/branco/i.test(d.porque)) return 'Em branco'
  if (/limite/i.test(d.porque)) return 'No limite'
  if (/abaixo/i.test(d.porque)) return 'Abaixo do costume'
  if (/acima/i.test(d.porque)) return 'Acima do costume'
  return d.porque
}
/** A questão que o destaque aponta ("por causa da questão 7" → índice 6), se houver. */
const questaoDoDestaque = (d: Destaque) => { const m = d.porque.match(/quest[aã]o (\d+)/i); return m ? Number(m[1]) - 1 : null }

/** As folhas do lote: quem, as letras que marcou (fixas: não mudam quando o gabarito muda) e se é destaque. */
type Folha = { nome: string; marcadas: string; destaque?: Destaque }

/** Monta as folhas. As letras dos destaques e do Lucas são as reais; as das outras são montadas UMA vez a partir do
    gabarito ORIGINAL da prova e do acerto da base: erram primeiro as questões em que as folhas reais mais erraram,
    marcando o erro mais comum. Por isso trocar o gabarito muda a nota de quem marcou a letra nova, e só dela. */
function folhasDo(lote: Lote): Folha[] {
  const original = bancoDaTarefa(lote.tarefaId, lote.tipo).gabarito.toUpperCase().slice(0, lote.questoes).padEnd(lote.questoes, lote.gabarito[0] ?? 'A')
  const reais: Folha[] = [
    ...lote.destaques.map((d) => ({ nome: d.quem, marcadas: (MARCADAS[d.id] ?? '').padEnd(lote.questoes, '-'), destaque: d })),
    ...lote.outras.filter((o) => o.nome === LUCAS).map((o) => ({ nome: o.nome, marcadas: emTexto(RESPOSTAS_LUCAS_PROVA_MOL, lote.questoes) })),
  ]
  const erros = original.split('').map((g, i) => {
    const contagem: Record<string, number> = {}
    for (const f of reais) { const m = f.marcadas[i]; if (m && m !== '-' && m !== g) contagem[m] = (contagem[m] ?? 0) + 1 }
    const [comum] = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0] ?? ['ABCD'.split('').find((l) => l !== g) ?? 'A']
    return { i, n: Object.values(contagem).reduce((s, x) => s + x, 0), comum }
  })
  const ordem = [...erros].sort((a, b) => b.n - a.n || a.i - b.i)
  const outras = lote.outras.filter((o) => o.nome !== LUCAS).map((o) => {
    const errar = new Set<number>()
    const w = Math.max(0, lote.questoes - o.acertos)
    // a mais errada sempre; as outras giram com o nome, para as folhas não saírem iguais
    if (w) errar.add(ordem[0].i)
    const resto = ordem.slice(1)
    for (let k = 0; errar.size < w && k < resto.length; k++) errar.add(resto[(k + o.nome.length) % resto.length].i)
    return { nome: o.nome, marcadas: original.split('').map((g, i) => (errar.has(i) ? erros[i].comum : g)).join('') }
  })
  return [...reais, ...outras].concat(lote.entregas.map((e) => ({ nome: e.nome, marcadas: emTexto(e.respostas, lote.questoes) })))
}

const acertosNa = (marcadas: string, gabarito: string) => gabarito.split('').filter((g, i) => marcadas[i] === g).length

/** A média, a questão com mais erro e, nela, a letra mais marcada: tudo contado das folhas contra o gabarito ATUAL. */
function resumoDo(lote: Lote, folhas: Folha[]) {
  const contam = folhas.filter((f) => !lote.tirados.includes(f.nome))
  const total = contam.length * lote.questoes
  const media = total ? Math.round((contam.reduce((s, f) => s + acertosNa(f.marcadas, lote.gabarito), 0) / total) * 100) : 0
  const porQuestao = lote.gabarito.split('').map((g, i) => {
    const letras: Record<string, number> = {}
    for (const f of contam) { const m = f.marcadas[i]; if (m && m !== '-') letras[m] = (letras[m] ?? 0) + 1 }
    const [maisMarcada, quantos] = Object.entries(letras).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
    return { i, erros: contam.filter((f) => f.marcadas[i] !== g).length, maisMarcada, quantos }
  })
  const pior = [...porQuestao].sort((a, b) => b.erros - a.erros || a.i - b.i)[0]
  return { media, porQuestao, pior: pior && pior.erros > 0 ? pior : null }
}

/** As respostas em grade de 5: a letra marcada, certa em verde, errada em vermelho com a certa embaixo. */
function Respostas({ marcadas, gabarito }: { marcadas: string; gabarito: string }) {
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Respostas, questão a questão">
      {gabarito.split('').map((g, i) => {
        const m = (marcadas[i] ?? '-').toUpperCase()
        const vazio = m === '-'
        const certo = m === g
        return (
          <li key={i} className={cn('rounded-[12px] border-2 px-1 py-1.5 text-center',
            vazio ? 'border-borda bg-fundo-suave' : certo ? 'border-verde-borda bg-verde-claro' : 'border-vermelho-borda bg-vermelho-claro')}>
            <span className="block text-[12px] font-bold text-sutil">{i + 1}</span>
            <b className={cn('block text-[17px] font-bold', vazio ? 'text-sutil' : certo ? 'text-verde-texto' : 'text-vermelho-texto')}>{vazio ? '—' : m}</b>
            <span className="block text-[12px] font-bold text-sutil">{vazio ? 'vazio' : certo ? 'certa' : `era ${g}`}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** A prova de um aluno, questão a questão (o lote de uma entrega). */
function ProvaInline({ lote, e }: { lote: Lote; e: EntregaNoLote }) {
  const banco = bancoDaTarefa(lote.tarefaId, lote.tipo)
  return (
    <Cartao semRespiro>
      <div className="flex flex-wrap items-center gap-2.5 border-b-2 border-borda px-4 py-3">
        <Avatar nome={e.nome} tamanho={32} />
        <span className="t-cartao min-w-[8rem] flex-1 truncate text-tinta">{e.nome}</span>
        {e.saidas > 0 && <Selo>Saiu da aba {e.saidas} {e.saidas === 1 ? 'vez' : 'vezes'}</Selo>}
        <span className="t-cartao text-tinta">{e.acertos} de {e.total}</span>
      </div>
      <ol>
        {lote.gabarito.split('').map((g, i) => {
          const m = (e.respostas[i] ?? '').toUpperCase()
          const certo = m === g
          return (
            <li key={i} className="flex min-h-11 items-center gap-3 border-t-2 border-borda px-4 py-1.5 first:border-t-0">
              <span aria-label={certo ? 'Certa' : 'Errada'}
                className={cn('grid size-6 shrink-0 place-items-center rounded-full text-white [&_svg]:size-3.5', certo ? 'bg-verde-degrau' : 'bg-vermelho-degrau')}>
                {certo ? <Check strokeWidth={3.5} /> : <X strokeWidth={3.5} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-tinta" title={banco.questoes[i]?.enunciado}>
                {i + 1}. {banco.questoes[i]?.enunciado ?? `Questão ${i + 1}`}
              </span>
              <span className="shrink-0 text-[14px] font-bold text-apoio">{certo ? `Marcou ${m}` : `Marcou ${m || '—'} · certa ${g}`}</span>
            </li>
          )
        })}
      </ol>
    </Cartao>
  )
}

/** O recado que vai com a nota. O modelo tem o número de acertos como campo ("X de 10"): a tela mostra a PRÉVIA de um
    aluno de verdade (o primeiro da lista), com o número dele, e diz que cada um vê o seu. */
function Recado({ texto, exemplo }: { texto: string; exemplo?: { nome: string; acertos: number } }) {
  const variavel = /\bX\b/.test(texto)
  const previa = exemplo && variavel ? texto.replace(/\bX\b/, String(exemplo.acertos)) : texto
  return (
    <>
      {/* o recado da objetiva é escrito pelo Tutor (o aluno lê "Escrito pelo Tutor · Aprovado por …"): o mesmo autor aqui */}
      <AssinaturaIA id="tutor" tamanho={24} className="mb-2" extra={<span className="t-apoio shrink-0">escreveu</span>} />
      {exemplo && variavel && <p className="t-selo mb-1 text-sutil">{exemplo.nome.split(' ')[0]} vai ler</p>}
      <p className={cn('t-corpo text-apoio', exemplo && variavel && 'rounded-[12px] bg-fundo-suave px-3 py-2 text-tinta')}>{previa}</p>
      {exemplo && variavel && <p className="t-apoio mt-2">Cada aluno vê o próprio número de acertos.</p>}
    </>
  )
}

type AbaNotas = 'destaques' | 'todas' | 'resumo'

export function Aprovar() {
  const { id } = useParams()
  const lote = useLote(id)
  const [vendoId, setVendoId] = useParametro('destaque')
  const [provaDe, setProvaDe] = useParametro('prova')
  const [abaPedida, setAba] = useParametro('aba')
  // de onde ela veio: de Ferramentas (Correção de objetiva) volta para lá; do sino ou do Início, ao Início
  const [de] = useParametro('de')
  const voltar = de === 'ferramentas' ? { para: '/professor/ferramentas', rotulo: 'Ferramentas' } : { para: '/professor', rotulo: 'Início' }
  const [recusando, setRecusando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const miolo = useRef<HTMLDivElement>(null)
  // depois de decidir, o resultado aparece no topo: o miolo volta para lá
  const subir = () => requestAnimationFrame(() => miolo.current?.closest('[data-pagina] > div:nth-child(2)')?.scrollTo({ top: 0, behavior: 'smooth' }))

  // o destaque aberto direto pelo endereço (?destaque=) também conta como visto: ela está olhando para ele
  const loteId = lote?.id
  const abertoPeloEndereco = lote?.estado === 'espera' && lote.destaques.some((d) => d.id === vendoId) ? vendoId : null
  useEffect(() => { if (loteId && abertoPeloEndereco) lotes.verDestaque(loteId, abertoPeloEndereco) }, [loteId, abertoPeloEndereco])

  if (!lote) {
    return (
      <Pagina tipo="leitura" cabecalho={<CabecalhoPagina voltar={voltar} titulo="Notas para aprovar" />}>
        <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo="Nada para aprovar aqui" className="pt-[12vh]"
          acao={<Botao asChild variante="secundario"><Link to={voltar.para}>{de === 'ferramentas' ? 'Voltar às Ferramentas' : 'Voltar ao Início'}</Link></Botao>} />
      </Pagina>
    )
  }

  const destaques = lote.destaques
  const n = notasDoLote(lote)
  const nVistos = destaques.filter((d) => lote.vistos.includes(d.id)).length
  const faltam = destaques.length - nVistos
  const umaSo = destaques.length === 0 && lote.entregas.length === 1
  // num lote de entregas ao vivo, quem saiu da aba também precisa do olhar dela (como o Felipe no lote de 26)
  const comSaidas = destaques.length ? [] : lote.entregas.filter((e) => e.saidas > 0)
  const nOlhar = destaques.length || comSaidas.length
  const ehProva = lote.tipo === 'prova' || /^prova/i.test(lote.titulo)
  const folhas = folhasDo(lote)
  const { media, porQuestao, pior } = resumoDo(lote, folhas)
  const folhaDe = (nome: string) => folhas.find((f) => f.nome === nome)
  const notaDe = (nome: string) => acertosNa(folhaDe(nome)?.marcadas ?? '', lote.gabarito)
  const vendo = destaques.find((d) => d.id === vendoId) ?? null
  const qVendo = vendo ? questaoDoDestaque(vendo) : null
  const naQuestao = qVendo !== null ? porQuestao[qVendo] : null
  // trocar o gabarito DESTA questão: para a letra que a turma mais marcou nela
  const novoGabarito = naQuestao && naQuestao.maisMarcada && naQuestao.maisMarcada !== lote.gabarito[naQuestao.i]
    ? lote.gabarito.slice(0, naQuestao.i) + naQuestao.maisMarcada + lote.gabarito.slice(naQuestao.i + 1) : null
  const outra = lote.outras.find((o) => o.nome === provaDe) ?? null
  const entregaDe = lote.entregas.find((e) => e.nome === provaDe) ?? null
  const espera = lote.estado === 'espera'
  const rotuloAprovar = n === 1 ? 'Aprovar a nota' : `Aprovar as ${n} notas`
  const recado = lote.recado ?? lote.entregas[0]?.recado
  const emBranco = folhas.filter((f) => !lote.tirados.includes(f.nome) && /^-+$/.test(f.marcadas.slice(0, lote.questoes))).length
  const foraDoCostume = destaques.filter((d) => /costum/i.test(d.porque)).length
  const contam = folhas.length - lote.tirados.length

  const abrir = (d: Destaque) => { setVendoId(d.id); lotes.verDestaque(lote.id, d.id) }
  /** todas as folhas, em ordem alfabética (nunca por nota) */
  const todas = [...new Set(folhas.map((f) => f.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const abrirAluno = (nome: string) => { const d = destaques.find((x) => x.quem === nome); if (d) abrir(d); else setProvaDe(nome) }

  const abas: { id: AbaNotas; rotulo: string; n?: number }[] = [
    ...(destaques.length ? [{ id: 'destaques' as const, rotulo: 'Destaques', n: destaques.length }] : []),
    { id: 'todas', rotulo: umaSo ? 'A prova' : 'Todas', n: umaSo ? undefined : todas.length },
    { id: 'resumo', rotulo: 'Resumo e recado' },
  ]
  const aba: AbaNotas = abas.some((a) => a.id === abaPedida) ? (abaPedida as AbaNotas) : abas[0].id

  // rótulos curtos: o cartão de número tem ~170 px a 880 (Leitura)
  const numeros = [
    { rotulo: 'Corrigidas', valor: String(n), apoio: `pelo ${agente('assistente').nome}` },
    { rotulo: 'Para olhar', valor: String(nOlhar), apoio: destaques.length ? `${nVistos} de ${destaques.length} vistos` : nOlhar ? 'saíram da aba' : 'nada fora do costume' },
    { rotulo: 'Média', valor: `${media}%`, apoio: pior ? `mais erro na ${pior.i + 1}` : 'de acerto' },
    { rotulo: 'Em branco', valor: String(emBranco), apoio: 'sem marcar nada' },
    { rotulo: 'Diferentes', valor: String(foraDoCostume), apoio: 'do que costumam' },
  ]

  const cabecalho = (
    <>
      <CabecalhoPagina voltar={voltar}
        titulo={<><span className="sm:hidden">{tituloCurto(lote.titulo)}</span><span className="hidden sm:inline">{lote.titulo}</span></>}
        complemento={`${lote.turma} · ${lote.data} · objetiva, ${lote.questoes} questões`}
        selo={<SeloEstadoDocumento estado={lote.estado} />} />
      <div className="mb-4 mt-2 max-md:hidden"><FaixaResultados itens={numeros} /></div>
      {/* no celular, os 3 primeiros números numa faixa compacta (os 5 inteiros estão no resumo) */}
      <dl className="mb-3 mt-1 grid grid-cols-3 gap-2 md:hidden">
        {numeros.slice(0, 3).map((x) => (
          <div key={x.rotulo} className="flex min-w-0 flex-col-reverse rounded-[12px] border-2 border-borda bg-white px-3 py-2">
            <dt className="truncate text-[13px] font-bold leading-4 text-sutil">{x.rotulo.toLowerCase()}</dt>
            <dd className="text-[20px] font-bold leading-7 text-tinta tabular-nums">{x.valor}</dd>
          </div>
        ))}
      </dl>
      <AbasDaPagina abas={abas} valor={aba} aoMudar={(x) => setAba(x === abas[0].id ? null : x)} />
    </>
  )

  const rodape = espera ? (
    <>
      <p className="t-apoio mr-auto min-w-0 truncate max-sm:hidden" aria-live="polite">
        {destaques.length
          ? faltam > 0 ? <>Veja os destaques antes de aprovar: <b className="font-bold text-tinta">{nVistos} de {destaques.length}</b> vistos</> : <><b className="font-bold text-tinta">{nVistos} de {destaques.length}</b> destaques vistos</>
          : 'As notas só chegam aos alunos com a sua aprovação.'}
      </p>
      <Botao variante="perigo" tamanho="m" className="max-sm:flex-1" onClick={() => setRecusando(true)}><span className="sm:hidden">Recusar</span><span className="hidden sm:inline">Recusar com motivo</span></Botao>
      <Botao variante="oficial" tamanho="m" className="max-sm:flex-1" disabled={faltam > 0} onClick={() => { lotes.aprovar(lote.id); subir() }}
        title={faltam > 0 ? `Veja ${faltam === 1 ? 'o destaque que falta' : `os ${faltam} destaques que faltam`}` : undefined}>
        {rotuloAprovar}
      </Botao>
    </>
  ) : (
    <p className="t-apoio mr-auto">{lote.estado === 'aprovado' ? `Já chegou ao ${lote.turma}.` : 'Voltou para o Assistente.'}</p>
  )

  return (
    <Pagina tipo="leitura" cabecalho={cabecalho} rodape={rodape}>
      <div ref={miolo} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
        {lote.estado === 'aprovado' && (
          <FaixaResultado tipo="certo" titulo={n === 1 ? 'Nota aprovada' : `${n} notas aprovadas`} className="animate-entra rounded-[16px] border-2">
            {/* o registro do que foi apresentado e aberto (D56), dentro da própria faixa */}
            Apresentado: {destaques.length ? `${destaques.length} destaques e a lista` : `${n === 1 ? (ehProva ? 'a prova' : 'a lista') : `${n} ${ehProva ? 'provas' : 'listas'}`} e o recado`}
            {destaques.length ? ` · Aberto: ${nVistos} de ${destaques.length}` : ''}
            {lote.gabaritoTrocado ? ' · Gabarito trocado' : ''}
            {lote.tirados.length ? ` · Fora do lote: ${lote.tirados.join(', ')}` : ''}
            {` · Confirmado por ${lote.por ?? ''}${lote.quando ? ` · ${lote.quando}` : ''}`}
          </FaixaResultado>
        )}
        {lote.estado === 'recusado' && (
          <FaixaResultado tipo="erro" titulo="Notas recusadas" className="rounded-[16px] border-2">
            Motivo: “{lote.motivo}”. Nada chegou aos alunos.
          </FaixaResultado>
        )}

        {aba === 'destaques' && (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <AssinaturaIA id="assistente" tamanho={32} className="shrink-0" />
              <p className="t-corpo min-w-0 flex-1 basis-[240px] text-apoio">
                {espera ? `Corrigi ${n} pelo gabarito. Estas ${destaques.length} precisam do seu olhar antes de aprovar.` : `${nVistos} ${nVistos === 1 ? 'destaque visto' : 'destaques vistos'}.`}
              </p>
            </div>
            <Cartao semRespiro>
              <ul aria-label="Destaques" className="[&>li+li]:border-t-2 [&>li+li]:border-borda">
                {destaques.map((d) => {
                  const tirado = lote.tirados.includes(d.quem)
                  const visto = lote.vistos.includes(d.id)
                  return (
                    <li key={d.id}>
                      <Linha onClick={() => abrir(d)} inicio={<Avatar nome={d.quem} />} titulo={d.quem}
                        abaixo={<>
                          {/* a 375, o motivo (o selo) desce para a segunda linha, no lugar do resumo cortado */}
                          <span className="truncate max-sm:hidden">{d.resumo}</span>
                          <Selo familia={d.fato ? 'neutro' : 'amarelo'} tamanho="p" className="mt-0.5 sm:hidden">{seloDoDestaque(d)}</Selo>
                        </>}
                        fim={<>
                          {tirado && <Selo>Fora do lote</Selo>}
                          <Selo familia={d.fato ? 'neutro' : 'amarelo'} className="max-sm:hidden">{seloDoDestaque(d)}</Selo>
                          <span className="text-right text-[15px] font-bold text-apoio tabular-nums sm:w-16">{notaDe(d.quem)}<span className="max-sm:hidden"> de </span><span className="sm:hidden">/</span>{lote.questoes}</span>
                          <span className="flex items-center justify-end gap-1.5 text-[13px] font-bold text-sutil sm:w-[64px]" title={visto ? 'Visto' : 'Ainda não visto'}>
                            <Ponto estado={visto ? 'feito' : 'esperando'} /><span className="max-sm:hidden">{visto ? 'Visto' : 'A ver'}</span>
                          </span>
                        </>} chevron />
                    </li>
                  )
                })}
              </ul>
            </Cartao>
            {/* no celular o estado é só o ícone: a legenda fica embaixo da lista */}
            <p className="t-apoio flex items-center gap-1.5 sm:hidden"><Ponto estado="esperando" /> a ver <span className="ml-2" /><Ponto estado="feito" /> visto</p>
            {/* sair da aba é destaque como os outros: o mesmo fato, a mesma frase */}
            {destaques.some((d) => d.fato) && <p className="t-apoio">Sair da aba é um fato, não um veredito. Só você vê.</p>}
          </>
        )}

        {aba === 'todas' && (umaSo ? <ProvaInline lote={lote} e={lote.entregas[0]} /> : (
          <>
            {!destaques.length && comSaidas.length > 0 && <p className="t-apoio">Sair da aba é um fato, não um veredito. Só você vê.</p>}
            <Cartao semRespiro>
              <ul aria-label="Todas as provas, em ordem alfabética" className="[&>li+li]:border-t-2 [&>li+li]:border-borda">
                {todas.map((nome) => {
                  const d = destaques.find((x) => x.quem === nome)
                  const e = lote.entregas.find((x) => x.nome === nome)
                  return (
                    <li key={nome}>
                      <Linha onClick={() => abrirAluno(nome)} inicio={<Avatar nome={nome} tamanho={32} />} titulo={nome} className="min-h-14 py-1.5"
                        fim={<>
                          {lote.tirados.includes(nome) && <Selo>Fora do lote</Selo>}
                          {d && <Selo familia={d.fato ? 'neutro' : 'amarelo'} className="max-sm:hidden">{seloDoDestaque(d)}</Selo>}
                          {e && e.saidas > 0 && <Selo className="max-sm:hidden">Saiu da aba {e.saidas} {e.saidas === 1 ? 'vez' : 'vezes'}</Selo>}
                          <span className="w-16 text-right text-[15px] font-bold text-apoio">{notaDe(nome)} de {lote.questoes}</span>
                        </>} chevron />
                    </li>
                  )
                })}
              </ul>
            </Cartao>
          </>
        ))}

        {aba === 'resumo' && (
          <>
            <div className="md:hidden"><FaixaResultados itens={numeros} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <Cartao>
                <h2 className="t-cartao mb-1 text-tinta">Por questão</h2>
                <ol className="grid gap-1.5 pt-2" aria-label="Acerto por questão">
                  {porQuestao.map((q) => {
                    const pct = contam ? Math.round(((contam - q.erros) / contam) * 100) : 0
                    return (
                      <li key={q.i} className="grid grid-cols-[28px_minmax(0,1fr)_44px] items-center gap-3">
                        <span className="text-[14px] font-bold text-sutil tabular-nums">{q.i + 1}</span>
                        <span className="h-3 overflow-hidden rounded-full bg-fundo-suave">
                          <span className="block h-full rounded-full bg-azul" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-right text-[14px] font-bold text-apoio tabular-nums">{pct}%</span>
                      </li>
                    )
                  })}
                </ol>
              </Cartao>
              <div className="grid content-start gap-4">
                <Cartao>
                  <h2 className="t-cartao mb-1 text-tinta">Resumo</h2>
                  <dl>
                    <Par rotulo="Notas">{n}{lote.tirados.length ? ` · ${lote.tirados.length} fora do lote` : ''}</Par>
                    <Par rotulo="Acerto médio">{media}%</Par>
                    {pior && <Par rotulo="Questão com mais erro">{pior.i + 1} · {pior.erros} de {contam}</Par>}
                    <Par rotulo="Quem corrigiu">{agente('assistente').nome}, pelo gabarito{lote.gabaritoTrocado ? ' (trocado por você)' : ''}</Par>
                  </dl>
                </Cartao>
                {recado && (
                  <Cartao>
                    <h2 className="t-cartao mb-3 text-tinta">O recado que vai com a nota</h2>
                    <Recado texto={recado} exemplo={todas.filter((x) => !lote.tirados.includes(x)).map((nome) => ({ nome, acertos: notaDe(nome) }))[0]} />
                  </Cartao>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* O destaque, ao lado */}
      <PainelLado aberto={vendo !== null} aoFechar={() => setVendoId(null)} titulo={vendo?.quem ?? ''}
        rodape={vendo && espera && (
          <>
            {novoGabarito && !lote.gabaritoTrocado && (
              <Botao variante="secundario" tamanho="m" onClick={() => lotes.trocarGabarito(lote.id, novoGabarito)}>Trocar o gabarito desta questão</Botao>
            )}
            {!lote.tirados.includes(vendo.quem) && (
              <Botao variante="secundario" tamanho="m" onClick={() => { lotes.tirar(lote.id, vendo.quem); setVendoId(null) }}>Tirar do lote</Botao>
            )}
          </>
        )}>
        {vendo && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Selo familia={vendo.fato ? 'neutro' : 'amarelo'}>{seloDoDestaque(vendo)}</Selo>
              <span className="t-apoio">{notaDe(vendo.quem)} de {lote.questoes}</span>
            </div>
            <p className="t-corpo text-apoio">{vendo.resumo.charAt(0).toUpperCase() + vendo.resumo.slice(1)}.</p>
            <Respostas marcadas={folhaDe(vendo.quem)?.marcadas ?? ''} gabarito={lote.gabarito} />
            {naQuestao && (lote.gabaritoTrocado
              ? <Carimbo por="você" verbo={`Gabarito da ${naQuestao.i + 1} trocado para ${lote.gabarito[naQuestao.i]} por`} extra="as notas foram refeitas" />
              : novoGabarito && <p className="t-corpo text-apoio">{naQuestao.quantos} alunos marcaram {naQuestao.maisMarcada} na {naQuestao.i + 1}. O gabarito diz {lote.gabarito[naQuestao.i]}.</p>)}
            {vendo.fato && <p className="t-corpo text-apoio">É um fato, não um veredito. Só você vê.</p>}
          </div>
        )}
      </PainelLado>

      {/* Uma das outras, ou uma entrega, ao lado */}
      <PainelLado aberto={outra !== null || entregaDe !== null} aoFechar={() => setProvaDe(null)} titulo={provaDe ?? ''}>
        {outra && (
          <div className="grid gap-3">
            <p className="t-cartao text-tinta">{notaDe(outra.nome)} de {lote.questoes}</p>
            <Respostas gabarito={lote.gabarito} marcadas={folhaDe(outra.nome)?.marcadas ?? ''} />
          </div>
        )}
        {entregaDe && <ProvaInline lote={lote} e={entregaDe} />}
      </PainelLado>

      <DialogoConfirmar aberto={recusando} aoMudar={setRecusando} titulo={n === 1 ? 'Recusar a nota?' : `Recusar as ${n} notas?`}
        frase="Nada chega aos alunos. O Assistente refaz com o seu motivo."
        confirmar={{ rotulo: 'Recusar', variante: 'perigoCheio', desligado: motivo.trim().length < 8, aoConfirmar: () => { lotes.recusar(lote.id, motivo.trim()); subir() } }}>
        <CampoTexto rotulo="Por que você está recusando" linhas={3} valor={motivo} aoMudar={setMotivo} autoFocus
          placeholder="Ex.: o gabarito da questão 9 está trocado." dica="Sobre a prova, não sobre um aluno." />
      </DialogoConfirmar>
    </Pagina>
  )
}
