import { useState } from 'react'
import type * as React from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Botao, CabecalhoPagina, CampoTexto, Pagina, Passos, Segmentado, Selo } from '@/components/duo'
import { AvatarIA } from '@/components/duo/onca'
import { MotorFormulario, chaveDe, type Valores } from '@/components/turmma/ferramentas'
import { AssinaturaIA, ChipPagina } from '@/components/turmma/ia'
import { useTurmaDaSessao } from '@/components/turmma/pedido'
import { ferramenta, ferramentaDoEndereco, type CampoDef } from '@/dados/ferramentas'
import { MATERIAIS, turmaDe } from '@/dados/escola'
import { cn } from '@/lib/utils'

/* REDAÇÃO E DISCURSIVA (/professor/ferramentas/redacao), 12ª rodada (04/10/2026; plano de polimento, 5.2).
   É a única ferramenta com página própria: as outras abrem como cartão na conversa, e /professor/ferramentas/:id
   redireciona para /professor/conversa/nova?ferramenta=:id.
   · 14ª rodada (05/10/2026; plano ux-composicao 5.2): o cabeçalho padrão (‹ Ferramentas), os Passos 1 RUBRICA ·
     2 LOTE ANÔNIMO · 3 CORRIGIR à direita dele e a frase da D55 embaixo; o botão cheio de cada passo na barra presa
     embaixo. A rubrica é uma tabela (critério | um nível por coluna). Duas colunas SÓ na correção: a questão e a
     rubrica | o texto do aluno, sem nome. Nenhum nível vem marcado: a IA não pré-marca nota de discursiva (regra
     nossa; o Geekie faz, nós não).
   · A linha da D55: a IA prepara a rubrica ANTES. Ela não lê, não corrige e não dá nota a texto de aluno. Nenhum
     campo desta tela é preenchido por IA a partir do texto de um aluno; a devolutiva começa vazia e é do professor.
   · O enunciado já vem pela turma (13ª rodada): no 2ºB e no 2ºA, a discursiva de reagente limitante; no 1ºC e no 9ºA,
     a de Lavoisier. "O que você cobra", os critérios da rubrica e os 3 textos do lote seguem o mesmo conjunto. Trocar
     de turma troca o enunciado que não foi editado. `?turma=1c&atividade=lavoisier` continua abrindo a atividade
     discursiva de Lavoisier (é para cá que a atividade da turma manda). Saiu "Preencher exemplo". */

type Criterio = { nome: string; niveis: string[] }

/* Cada critério tem quatro níveis escritos; com três níveis saem o primeiro, o segundo e o último. */
const CRITERIOS_LAVOISIER: Criterio[] = [
  { nome: 'Enuncia a lei de Lavoisier', niveis: ['Não enuncia', 'Enuncia com imprecisão', 'Enuncia corretamente, com as palavras do livro', 'Enuncia corretamente, com as próprias palavras'] },
  { nome: 'Relaciona com um exemplo de reação', niveis: ['Sem exemplo', 'Exemplo sem as massas', 'Exemplo com as massas, sem fechar a conta', 'Exemplo com as massas de reagentes e produtos'] },
  { nome: 'Explica o sistema fechado', niveis: ['Não menciona', 'Menciona sem explicar', 'Explica o sistema fechado, sem comparar com o aberto', 'Explica por que a massa parece mudar em sistema aberto'] },
  { nome: 'Clareza e organização do texto', niveis: ['Ideias soltas', 'Ordem compreensível', 'Texto encadeado, sem conclusão', 'Texto encadeado, com conclusão'] },
  { nome: 'Usa a linguagem da Química', niveis: ['Não usa os termos', 'Usa os termos com erro', 'Usa reagente, produto e massa corretamente', 'Usa os termos e escreve a equação'] },
]
const CRITERIOS_LIMITANTE: Criterio[] = [
  { nome: 'Define o reagente limitante', niveis: ['Não define', 'Confunde com o reagente em excesso', 'Define como o que acaba primeiro', 'Define como o que acaba primeiro e para a reação'] },
  { nome: 'Liga o limitante à massa de produto', niveis: ['Não liga', 'Diz que influencia, sem explicar', 'Diz que a massa de produto sai do limitante', 'Explica que a proporção do limitante fixa a massa máxima de produto'] },
  { nome: 'Dá um exemplo com números', niveis: ['Sem exemplo', 'Exemplo sem as massas', 'Exemplo com as massas, sem achar o limitante', 'Exemplo com as massas, o limitante e o excesso'] },
  { nome: 'Usa a proporção da equação', niveis: ['Não usa a equação', 'Cita a equação sem a proporção', 'Usa a proporção em mol, com erro de conta', 'Usa a proporção em mol corretamente'] },
  { nome: 'Clareza e linguagem da Química', niveis: ['Ideias soltas', 'Ordem compreensível, termos com erro', 'Texto encadeado, com reagente, produto e excesso', 'Texto encadeado, com os termos e a equação balanceada'] },
]
const COMPETENCIAS: Criterio[] = [
  { nome: 'Domínio da escrita formal', niveis: ['Muitos desvios, que atrapalham a leitura', 'Desvios frequentes', 'Poucos desvios', 'Escrita formal, com desvios raros'] },
  { nome: 'Compreensão do tema e do gênero', niveis: ['Foge ao tema', 'Tangencia o tema', 'Desenvolve o tema de modo previsível', 'Desenvolve o tema com repertório do capítulo'] },
  { nome: 'Seleção e organização dos argumentos', niveis: ['Sem ponto de vista', 'Argumentos soltos', 'Argumentos organizados, pouco desenvolvidos', 'Argumentos organizados e desenvolvidos'] },
  { nome: 'Coesão', niveis: ['Frases sem ligação', 'Ligação repetitiva', 'Ligação adequada, com falhas', 'Ligação variada entre frases e parágrafos'] },
  { nome: 'Proposta de intervenção', niveis: ['Sem proposta', 'Proposta vaga', 'Proposta com ação e agente', 'Proposta detalhada: ação, agente, meio e efeito'] },
]
const montarRubrica = (para: string, criterios: number, niveis: number, conjunto: Conjunto): Criterio[] =>
  (para === 'redacao' ? COMPETENCIAS : conjunto.criterios.slice(0, criterios)).map((c) => ({ nome: c.nome, niveis: niveis === 4 ? c.niveis : [c.niveis[0], c.niveis[1], c.niveis[3]] }))

/** A rubrica em tabela (o modelo do Geekie e do Plurall): o critério na primeira coluna (180 px) e um nível por
    coluna, com o nome do nível no cabeçalho. A 375, um cartão por critério, com os níveis um embaixo do outro. */
function Rubrica({ criterios, editando = false, aoMudar }: { criterios: Criterio[]; editando?: boolean; aoMudar?: (c: Criterio[]) => void }) {
  const muda = (i: number, novo: Criterio) => aoMudar?.(criterios.map((c, j) => (j === i ? novo : c)))
  const nNiveis = criterios[0]?.niveis.length ?? 3
  const colunas = { gridTemplateColumns: `180px repeat(${nNiveis}, minmax(0, 1fr))` }
  return (
    <div className="overflow-hidden rounded-[16px] border-2 border-borda">
      <div role="row" className="grid bg-fundo-suave max-md:hidden" style={colunas}>
        <span role="columnheader" className="t-selo px-4 py-2.5 text-sutil">Critério</span>
        {Array.from({ length: nNiveis }, (_, j) => (
          <span key={j} role="columnheader" className="t-selo border-l-2 border-borda px-4 py-2.5 text-sutil">Nível {j + 1}</span>
        ))}
      </div>
      <div role="rowgroup">
        {criterios.map((c, i) => (
          <div key={i} role="row" className="grid border-t-2 border-borda max-md:grid-cols-1 max-md:first:border-t-0 md:[grid-template-columns:var(--colunas)]"
            style={{ '--colunas': colunas.gridTemplateColumns } as React.CSSProperties}>
            <div role="rowheader" className="px-4 py-3">
              {editando
                ? <CampoTexto rotulo={`Critério ${i + 1}`} rotuloOculto valor={c.nome} aoMudar={(x) => muda(i, { ...c, nome: x })} />
                : <p className="text-[15px] font-bold leading-5 text-tinta"><span className="mr-1.5 text-sutil tabular-nums">{i + 1}.</span>{c.nome}</p>}
            </div>
            {c.niveis.map((n, j) => (
              <div key={j} role="cell" className="px-4 py-3 text-[15px] font-medium leading-5 text-apoio md:border-l-2 md:border-borda max-md:pt-0">
                <b className="t-selo mb-0.5 block text-sutil md:hidden">Nível {j + 1}</b>
                {editando
                  ? <textarea rows={3} value={n} aria-label={`Critério ${i + 1}, nível ${j + 1}`} onChange={(e) => muda(i, { ...c, niveis: c.niveis.map((x, k) => (k === j ? e.target.value : x)) })}
                      className="w-full resize-none rounded-[8px] border-2 border-borda bg-campo px-2 py-1 text-[15px] text-tinta outline-none focus:border-azul-borda" />
                  : n}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Os textos do lote, na ordem embaralhada. O nome só aparece depois de salvar a devolutiva. */
const TEXTOS_LAVOISIER = [
  { autor: 'Helena Prado', x: 'A lei de Lavoisier diz que na natureza nada se cria e nada se perde, tudo se transforma. Isso quer dizer que a massa do começo é igual a massa do final. Quando a gente queima papel parece que some, mas é porque a fumaça foi embora. Se fosse num pote fechado o peso ia ser o mesmo.' },
  { autor: 'Rafael Costa', x: 'Lavoisier mostrou que a massa dos reagentes é igual à massa dos produtos. Por exemplo, 4 g de hidrogênio com 32 g de oxigênio formam 36 g de água. No palito de fósforo parece que a massa diminui, mas os gases saíram para o ar.' },
  { autor: 'Bianca Moreira', x: 'Nada se cria, nada se perde. A massa não muda numa reação. Quando o ferro enferruja ele fica mais pesado porque pegou oxigênio do ar, então a massa total é a mesma se contar o oxigênio.' },
]
const TEXTOS_LIMITANTE = [
  { autor: 'Lucas Ferreira', x: 'O reagente limitante é o que acaba primeiro. Quando ele acaba a reação para, então a quantidade de produto depende dele. Tipo uma receita: se tenho 2 ovos e a receita pede 1 ovo por bolo, só faço 2 bolos, mesmo tendo muita farinha.' },
  { autor: 'Mariana Lopes', x: 'Na reação 2 H₂ + O₂ → 2 H₂O, se tenho 4 g de H₂ e 40 g de O₂, o hidrogênio dá 2 mol e precisa de 1 mol de O₂, que é 32 g. Sobram 8 g de oxigênio. O H₂ é o limitante e forma 36 g de água, não mais.' },
  { autor: 'Pedro Henrique', x: 'O limitante é o reagente que tem menos massa, por isso ele define o produto. O outro fica sobrando e não reage. A massa do produto é a soma das massas que reagiram.' },
]

/* O CONJUNTO de cada turma: o enunciado da discursiva, o que se cobra, os critérios e os textos do lote. A IA prepara
   tudo isso ANTES da aplicação; os textos são sintéticos e quem corrige é o professor (D55). */
type Conjunto = { enunciado: string; cobra: string; criterios: Criterio[]; textos: { autor: string; x: string }[]; pagina: number }
const LAVOISIER: Conjunto = {
  enunciado: 'Explique a lei de Lavoisier e mostre, com um exemplo de reação, por que ela vale em sistema fechado.',
  cobra: 'Enunciar a lei com as próprias palavras, dar um exemplo com as massas e explicar o sistema fechado. Ortografia não entra.',
  criterios: CRITERIOS_LAVOISIER, textos: TEXTOS_LAVOISIER, pagina: 141,
}
const LIMITANTE: Conjunto = {
  enunciado: 'Explique por que o reagente limitante define a massa de produto, com um exemplo.',
  cobra: 'Definir o reagente limitante, ligar a ele a massa de produto e dar um exemplo com as massas e a proporção da equação. Ortografia não entra.',
  criterios: CRITERIOS_LIMITANTE, textos: TEXTOS_LIMITANTE, pagina: 151,
}
/** O conjunto da turma: 2ºB e 2ºA estão em reagente limitante; o 1ºC e o 9ºA, em Lavoisier. */
const conjuntoDa = (turmaId: string) => (turmaId === '2b' || turmaId === '2a' ? LIMITANTE : LAVOISIER)

const D55 = 'A IA prepara a rubrica antes. Ela não lê, não corrige e não dá nota a texto de aluno.'

const indiceDe = (campos: CampoDef[], f: (c: CampoDef) => boolean) => campos.findIndex(f)

/** A escolha do nível de UM critério, com o descritor da rubrica em cada opção (quem corrige não precisa voltar ao
    passo 1). Nada vem marcado. Lado a lado a partir de 640; a 375, um embaixo do outro. */
function EscolherNivel({ criterio, valor, aoMudar }: { criterio: Criterio; valor: string | null; aoMudar: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label={criterio.nome} className="grid gap-2 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ '--n': criterio.niveis.length } as React.CSSProperties}>
      {criterio.niveis.map((d, j) => {
        const id = String(j + 1)
        const sel = valor === id
        return (
          <button key={id} type="button" role="radio" aria-checked={sel} onClick={() => aoMudar(id)}
            className={cn('flex flex-col items-start gap-0.5 rounded-[12px] border-2 px-3 py-2 text-left transition-colors duration-150 outline-none focus-visible:border-azul-borda',
              sel ? 'border-azul-borda bg-azul-claro' : 'border-borda bg-white hover:bg-fundo-suave')}>
            <span className={cn('t-selo', sel ? 'text-azul-texto' : 'text-sutil')}>Nível {id}</span>
            <span className={cn('text-[14px] font-medium leading-[18px]', sel ? 'text-azul-texto' : 'text-apoio')}>{d}</span>
          </button>
        )
      })}
    </div>
  )
}

function Redacao() {
  const f = ferramenta('redacao')!
  const [params] = useSearchParams()
  const daSessao = useTurmaDaSessao()
  const turmaPedida = params.get('turma') || daSessao || '1c'
  /* a atividade de Lavoisier (o link da aba Atividades) vale em qualquer turma; sem ela, o conjunto é o da turma */
  const lavoisier = params.get('atividade') === 'lavoisier'
  /* A escolha (discursiva ou redação) fica no topo do cartão, num Segmentado; o motor recebe os outros campos, no
     cartão compacto da Prova: turma e enunciado (ou tema) à vista, o resto em "Mais opções", fechado. */
  const [para, setPara] = useState<'discursiva' | 'redacao'>('discursiva')
  const campos = f.campos.filter((c) => c.id !== 'para')
  const ie = indiceDe(campos, (c) => c.id === 'enunciado')
  const ic = indiceDe(campos, (c) => 'rotulo' in c && c.rotulo === 'O que você cobra')
  /* o enunciado e o que se cobra, pela turma: trocar de turma troca os que não foram editados */
  const porTurma = (turmaId: string): Valores => {
    const cj = lavoisier ? LAVOISIER : conjuntoDa(turmaId)
    const v: Valores = {}
    if (ie >= 0) v[chaveDe(campos[ie], ie)] = cj.enunciado
    if (ic >= 0) v[chaveDe(campos[ic], ic)] = cj.cobra
    return v
  }
  const iniciais: Valores = { turma: turmaPedida, para, ...porTurma(turmaPedida) }

  const [passo, setPasso] = useState(0)
  const [fase, setFase] = useState<'formulario' | 'gerando' | 'pronto'>('formulario')
  const [valores, setValores] = useState<Valores>()
  const [rubrica, setRubrica] = useState<Criterio[] | null>(null)
  const [editando, setEditando] = useState(false)
  const [niveis, setNiveis] = useState<Record<number, string>>({})
  const [devolutiva, setDevolutiva] = useState('')
  const [salva, setSalva] = useState(false)
  /* quantos textos já foram corrigidos antes do atual: o lote começa do zero, logo depois de criar a rubrica */
  const [feitos, setFeitos] = useState(0)
  const conjunto = lavoisier ? LAVOISIER : conjuntoDa(String(valores?.turma ?? turmaPedida))
  const TEXTOS = conjunto.textos
  const emUso = rubrica ?? montarRubrica('discursiva', 4, 3, conjunto)

  /* o lote tem o tamanho da turma escolhida: quem não entregou não entra (não é falta: chamada não é daqui) */
  const turmaEscolhida = turmaDe(String(valores?.turma ?? turmaPedida))
  const naoEntregaram = Math.min(2, turmaEscolhida.alunos)
  const entregues = turmaEscolhida.alunos - naoEntregaram
  const atual = Math.min(feitos + 1, TEXTOS.length)
  const corrigidos = feitos + (salva ? 1 : 0)
  const texto = TEXTOS[atual - 1]
  const nomeTexto = (n: number) => `Texto ${String(n).padStart(2, '0')}`
  const proximo = salva && atual < TEXTOS.length && corrigidos < entregues
  const irAoProximo = () => { setFeitos(corrigidos); setSalva(false); setNiveis({}); setDevolutiva(''); setPasso(2) }
  /* a base da rubrica é o material da turma (o que está marcado no formulário) */
  const chaveMaterial = (() => { const i = campos.findIndex((c) => c.tipo === 'material'); return i >= 0 ? chaveDe(campos[i], i) : '' })()
  const material = MATERIAIS.find((m) => m.id === String(valores?.[chaveMaterial] ?? ''))
  const base = (material?.titulo ?? 'Química 2').split(' — ')[0]

  const gerar = (v: Valores) => {
    setValores(v); setFase('gerando'); setEditando(false)
    const cj = lavoisier ? LAVOISIER : conjuntoDa(String(v.turma ?? turmaPedida))
    window.setTimeout(() => { setRubrica(montarRubrica(String(v.para), Number(v.criterios ?? 4), Number(v.niveis ?? 3), cj)); setFase('pronto') }, 1500)
  }
  const todosNiveis = emUso.every((_, i) => niveis[i])

  const turmaNome = turmaEscolhida.nome

  /* a barra presa embaixo: o botão cheio de cada passo */
  const rodape = passo === 0 && fase === 'pronto' && rubrica ? (
    <>
      <Botao variante="secundario" tamanho="m" className="mr-auto" onClick={() => setFase('formulario')}>Mudar os campos</Botao>
      <Botao variante="secundario" tamanho="m" onClick={() => setEditando(!editando)}>{editando ? 'Concluir edição' : 'Editar'}</Botao>
      <Botao variante="primario" tamanho="m" onClick={() => { setEditando(false); setPasso(1) }}>Usar esta rubrica</Botao>
    </>
  ) : passo === 1 ? (
    <>
      <p className="t-apoio mr-auto min-w-0">Você corrigiu <b className="font-bold text-tinta">{corrigidos} de {entregues}</b>. {naoEntregaram === 1 ? '1 aluno não entregou' : `${naoEntregaram} alunos não entregaram`}.</p>
      {proximo
        ? <Botao variante="primario" tamanho="m" onClick={irAoProximo}>Corrigir o {nomeTexto(atual + 1)}</Botao>
        : !salva && <Botao variante="primario" tamanho="m" onClick={() => setPasso(2)}>Corrigir o {nomeTexto(atual)}</Botao>}
    </>
  ) : passo === 2 ? (
    <>
      {salva
        ? <p className="t-apoio mr-auto min-w-0 font-bold text-verde-texto">Salvo. Era o texto de {texto.autor}.</p>
        : <p className="t-apoio mr-auto min-w-0">{todosNiveis ? 'O nome aparece depois de salvar.' : `Marque o nível dos ${emUso.length} critérios.`}</p>}
      {!salva && <Botao variante="oficial" tamanho="m" disabled={!todosNiveis} onClick={() => setSalva(true)}>Salvar devolutiva</Botao>}
      {proximo && <Botao variante="primario" tamanho="m" onClick={irAoProximo}>Corrigir o {nomeTexto(atual + 1)}</Botao>}
    </>
  ) : undefined

  return (
    <Pagina tipo="leitura" rodape={rodape}
      cabecalho={(
        <CabecalhoPagina voltar={{ para: '/professor/ferramentas', rotulo: 'Ferramentas' }} titulo="Redação e discursiva"
          complemento={passo > 0 ? `${turmaNome} · ${entregues} textos` : undefined}
          acoes={<Passos passos={['Rubrica', 'Lote anônimo', 'Corrigir']} atual={passo} aoIr={setPasso} className="w-[380px] max-md:w-[calc(100vw-32px)]" />}
          linha={<span className="flex items-center gap-2"><ShieldCheck aria-hidden className="size-5 shrink-0 text-verde-texto" strokeWidth={2.5} />{D55}</span>} />
      )}>
      {passo === 0 && fase === 'formulario' && (
        <section className="w-full rounded-[16px] border-2 border-borda bg-white p-4 md:p-5">
          <div className="mb-3 grid justify-items-start gap-3">
            <AssinaturaIA id="assistente" />
            <Segmentado rotulo="Rubrica para" valor={para} aoMudar={(x) => { setPara(x as 'discursiva' | 'redacao'); setValores(undefined) }}
              opcoes={[{ id: 'discursiva', rotulo: 'Discursiva' }, { id: 'redacao', rotulo: 'Redação' }]} className="w-full sm:w-[320px]" />
          </div>
          <MotorFormulario key={para} compacto campos={campos} extras={f.extras} verbo={rubrica ? 'Gerar outra rubrica' : f.verbo}
            aviso="Do enunciado e do capítulo, antes de qualquer aluno responder." iniciais={valores ? { ...valores, para } : iniciais} porTurma={porTurma} aoGerar={(v) => gerar({ ...v, para })} />
        </section>
      )}
      {passo === 0 && fase === 'gerando' && (
        <div role="status" className="flex items-center gap-3 pt-2"><AvatarIA agente="assistente" tamanho={40} pensando /><span className="t-corpo text-sutil">Montando a rubrica…</span></div>
      )}
      {passo === 0 && fase === 'pronto' && rubrica && (
        <div className="grid content-start gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <AssinaturaIA id="assistente" />
            <span className="t-apoio">Base: {base} <ChipPagina pagina={conjunto.pagina} /></span>
          </div>
          <div className="rounded-[12px] bg-fundo-suave px-4 py-3">
            <p className="t-selo mb-1 text-sutil">A questão</p>
            <p className="t-corpo text-tinta">{valores?.[chaveDe(campos[ie], ie)] ? String(valores[chaveDe(campos[ie], ie)]) : conjunto.enunciado}</p>
          </div>
          <Rubrica criterios={rubrica} editando={editando} aoMudar={setRubrica} />
          <p className="t-apoio">Quem corrige e escreve a devolutiva é você.</p>
        </div>
      )}

      {passo === 1 && (
        <div className="grid content-start gap-4">
          <p className="t-corpo text-apoio">Sem nome e em ordem embaralhada. O Assistente só conferiu as entregas.</p>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: entregues }, (_, i) => nomeTexto(i + 1)).map((t, i) => (
              <li key={t} className="flex h-14 items-center justify-between gap-2 rounded-[12px] border-2 border-borda px-3 text-[15px] font-bold text-tinta">
                {t} {i < corrigidos ? <Selo familia="verde" tamanho="p">Corrigido</Selo> : <span className="text-[14px] font-medium text-sutil">A corrigir</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {passo === 2 && (
        /* duas colunas só aqui: a questão e a rubrica | o texto do aluno, sem nome. A 375, a ordem é a de quem
           corrige: a questão, o texto do aluno, os critérios e a devolutiva. */
        <div className="grid content-start gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="rounded-[12px] bg-fundo-suave px-4 py-3 lg:col-start-1 lg:row-start-1">
            <p className="t-selo mb-1 text-sutil">A questão</p>
            <p className="t-corpo text-tinta">{conjunto.enunciado}</p>
          </div>
          <div className="grid content-start gap-4 self-start lg:sticky lg:top-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="rounded-[16px] border-2 border-borda bg-white p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2"><h2 className="t-cartao text-tinta">{nomeTexto(atual)}</h2><Selo>Sem nome</Selo></div>
              <p className="max-w-[68ch] text-[17px] font-medium leading-[1.6] text-tinta">{texto.x}</p>
            </div>
            <CampoTexto rotulo="Sua devolutiva" valor={devolutiva} aoMudar={setDevolutiva} linhas={4} placeholder="O que o aluno acertou e o que falta." className="max-lg:hidden" />
          </div>
          <div className="grid content-start gap-4 lg:col-start-1 lg:row-start-2">
            <p className="t-apoio">A rubrica, critério por critério. Nenhum nível vem marcado: a nota é sua.</p>
            {emUso.map((c, i) => (
              <div key={c.nome} className="grid gap-2">
                <p className="text-[15px] font-bold leading-5 text-tinta"><span className="mr-1.5 text-sutil tabular-nums">{i + 1}.</span>{c.nome}</p>
                <EscolherNivel criterio={c} valor={niveis[i] ?? null} aoMudar={(x) => setNiveis((n) => ({ ...n, [i]: x }))} />
              </div>
            ))}
            <CampoTexto rotulo="Sua devolutiva" valor={devolutiva} aoMudar={setDevolutiva} linhas={4} placeholder="O que o aluno acertou e o que falta." className="lg:hidden" />
          </div>
        </div>
      )}
    </Pagina>
  )
}

export function FerramentaForm() {
  const { id = 'redacao' } = useParams()
  const [params] = useSearchParams()
  if (id === 'redacao') return <Redacao />
  const turma = params.get('turma')
  /* endereço antigo: o que juntou vai para a ferramenta de agora; o que saiu abre a página Ferramentas */
  const achou = ferramentaDoEndereco(id)
  if (!achou) return <Navigate to="/professor/ferramentas" replace />
  if (achou.id === 'redacao') return <Navigate to={`/professor/ferramentas/redacao${params.toString() ? `?${params}` : ''}`} replace />
  return <Navigate to={`/professor/conversa/nova?ferramenta=${encodeURIComponent(achou.mapa ? 'mapa' : achou.id)}${turma ? `&turma=${encodeURIComponent(turma)}` : ''}`} replace />
}
