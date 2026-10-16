import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Aviso, Botao, CabecalhoPagina, CampoTexto, Cartao, Dialogo, Linha, Opcao, Pagina, Selo, SeloNovo } from '@/components/duo'
import { IssoEstaErrado } from './_pecas'
import { revisoes, useItensMemoriaApagados, useRevisoes, useTarefasDoAluno, type Revisao } from '@/dados/avaliacoes'
import { avisos, useAvisosDoAluno, type Aviso as AvisoT, type OQueTitular } from '@/dados/avisos'
import { useConversasDoAluno } from '@/dados/conversas-aluno'
import { sessao, useAlunoAtual, useVistos } from '@/dados/sessao'
import { useAlocacoes } from '@/dados/escola-estado'

/* PRIVACIDADE (/aluno/eu/privacidade), 14ª rodada, 05/10/2026 (plano ux-composicao, 5.2). Página de leitura (880) com o
   cabeçalho padrão (‹ Eu) e, logo abaixo, as âncoras MEUS DADOS · O QUE O TUTOR LEMBRA · O QUE GUARDAMOS; o corpo
   rola por dentro (a página não). Na palavra de quem tem 11 anos (D43, D61):
   · O que o Tutor lembra (#memoria; D66): a memória é do TRABALHO, não da pessoa. Uma frase por conversa, montada SÓ
     dos 5 campos fixos (quando, matéria, assunto, onde travou, como terminou). Tocar abre "Isso está errado?"; o item
     fica com A PROFESSORA VAI OLHAR e, depois, com o que ela decidiu. Se ela apagar, a frase some e fica a linha
     "A professora apagou da memória do Tutor." (com NOVO até ele ver).
   · O que guardamos e o que não temos; quem vê o quê, num texto só; como o Tutor funciona (#tutor).
   · PEDIR MEUS DADOS (LGPD, art. 18 — lei): ver, corrigir, apagar ou levar; a escola responde em 15 dias. Atendido, o
     aluno baixa um arquivo de verdade. (Antes era a tela "O que o Tutor lembra", em /aluno/eu/memoria.) */

/* As listas fechadas de onde as frases são montadas. */
const TRAVOU = {
  'massa-mol': 'passar massa para mol',
  limitante: 'achar o reagente limitante',
  simplificar: 'achar o número que divide os dois',
  causas: 'separar as causas da revolução',
} as const
const TERMINOU = {
  acertou: 'depois acertou',
  'aula-acabou': 'a aula acabou antes',
  'com-ajuda': 'terminou com uma dica',
} as const

type SessaoMemoria = { id: string; quando: string; materia: string; assunto: string; travou: keyof typeof TRAVOU; terminou: keyof typeof TERMINOU }

const SESSOES: SessaoMemoria[] = [
  { id: 's4', quando: 'Ontem', materia: 'Matemática', assunto: 'Frações equivalentes', travou: 'simplificar', terminou: 'acertou' },
  { id: 's3', quando: '18/09', materia: 'Química', assunto: 'Reagente limitante', travou: 'limitante', terminou: 'aula-acabou' },
  { id: 's2', quando: '18/09', materia: 'História', assunto: 'Revolução Francesa', travou: 'causas', terminou: 'com-ajuda' },
  { id: 's1', quando: '16/09', materia: 'Química', assunto: 'Massa molar', travou: 'massa-mol', terminou: 'acertou' },
]

/** A frase de uma conversa: só os campos fixos, sempre na mesma forma. */
const frase = (s: SessaoMemoria) => `Travou em ${TRAVOU[s.travou]} e ${TERMINOU[s.terminou]}.`

const MOTIVOS_MEMORIA = ['Isso não aconteceu assim', 'Não quero que o Tutor use isso', 'Outra coisa']

const GUARDAMOS = ['Seu nome, sua turma e sua matrícula', 'As tarefas e as notas aprovadas', 'O que você estudou com o Tutor']
const NAO_TEMOS = ['E-mail, telefone ou foto', 'Endereço ou data de nascimento', 'Nada sobre sua saúde ou seu humor']
const QUEM_VE: [string, string][] = [
  ['Você', 'tudo o que é seu.'],
  ['Seus professores', 'tarefas, notas e quando você trava. A conversa inteira só abre com um motivo, que fica registrado.'],
  ['A coordenação', 'os números da turma toda; para ver algo seu, fica registrado.'],
  ['Seus colegas', 'nada.'],
  ['A Turmma', 'cuida do sistema e não vende nem treina IA com seus dados.'],
]
const TUTOR = [
  'É um programa, não uma pessoa.',
  'Lê o material da sua turma e pergunta para você pensar.',
  'Pode errar. Confira na página que ele mostra.',
  'Na prova, ele descansa.',
]

const PEDIDOS: { id: OQueTitular; rotulo: string }[] = [
  { id: 'ver', rotulo: 'Ver meus dados' },
  { id: 'corrigir', rotulo: 'Corrigir algo' },
  { id: 'apagar', rotulo: 'Apagar meus dados' },
  { id: 'levar', rotulo: 'Levar meus dados' },
]

function Secao({ id, titulo, children }: { id?: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-t` : undefined} className="grid min-w-0 scroll-mt-2 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <h2 id={id ? `${id}-t` : undefined} className="t-secao text-tinta">{titulo}</h2>
      {children}
    </section>
  )
}

function Glifo({ sim }: { sim: boolean }) {
  return sim
    ? <span aria-label="Guardamos" role="img" className="grid size-7 place-items-center rounded-full bg-verde-claro text-verde-texto"><Check className="size-4" strokeWidth={3.5} /></span>
    : <span aria-label="Não temos" role="img" className="grid size-7 place-items-center rounded-full bg-fundo-suave text-apoio"><X className="size-4" strokeWidth={3.5} /></span>
}

/* ── O que o Tutor lembra ── */

function decisao(r: Revisao, quem: string): string {
  const d = r.resposta!
  return d.decisao === 'manter' ? `${quem} olhou e manteve: "${d.motivo}"` : `${quem} corrigiu: "${d.motivo}"`
}

/** Quem olha a contestação de um item da memória: quem dá a matéria na turma (pelo primeiro nome) ou a coordenação. */
function useQuemOlha(turmaId: string): (materia: string) => string {
  const aloc = useAlocacoes()
  return (materia) => aloc.find((a) => a.turmaId === turmaId && a.disciplina === materia && a.estado === 'confirmado')?.professor.split(' ')[0] ?? 'A coordenação'
}

function Memoria() {
  const aluno = useAlunoAtual()
  const apagados = useItensMemoriaApagados()
  const minhas = useRevisoes({ alunoId: aluno.id }).filter((r) => r.tipo === 'memoria')
  const vistos = useVistos()
  const [aberto, setAberto] = useState<SessaoMemoria | null>(null)
  const quemOlha = useQuemOlha(aluno.turmaId)

  // o item apagado pela professora fica só com o registro de que saiu (sem a frase), para o aluno ler a resposta
  const itens = aluno.novo ? [] : SESSOES
  const revDe = (id: string) => [...minhas].reverse().find((r) => r.itemId === id)
  const enviar = (motivo: string, texto: string) => {
    if (!aberto) return
    revisoes.pedir({ tipo: 'memoria', itemId: aberto.id, itemTexto: `${aberto.assunto}: ${frase(aberto)}`, materia: aberto.materia, motivo, texto })
  }
  const restam = itens.filter((s) => !apagados.includes(s.id)).length

  return (
    <Secao id="memoria" titulo="O que o Tutor lembra">
      <p className="t-corpo text-tinta">Guardo o que você estudou, não quem você é.</p>
      {itens.length === 0 ? (
        <Cartao><p className="t-apoio">Nada ainda.</p></Cartao>
      ) : (
        <Cartao semRespiro className="overflow-hidden">
          {itens.map((s) => {
            const r = revDe(s.id)
            const chave = r ? `memoria:${r.id}` : ''
            const novo = !!r?.resposta && !vistos[chave]
            const apagado = apagados.includes(s.id)
            if (apagado) {
              return (
                <div key={s.id} className="border-t-2 border-borda first:border-t-0">
                  <Linha titulo={s.assunto} className="border-t-0" onClick={novo ? () => sessao.marcarVisto(chave) : undefined}
                    aria-label={`${s.assunto}. ${quemOlha(s.materia)} apagou da memória do Tutor.`}
                    abaixo={(
                      <>
                        <span>{quemOlha(s.materia)} apagou da memória do Tutor.</span>
                        {novo && <SeloNovo tamanho="p" />}
                      </>
                    )} />
                </div>
              )
            }
            return (
              <div key={s.id} className="border-t-2 border-borda first:border-t-0">
                <Linha titulo={s.assunto} className="border-t-0"
                  onClick={r?.estado === 'esperando' ? undefined : r?.resposta ? () => sessao.marcarVisto(chave) : () => setAberto(s)}
                  aria-label={`${s.assunto}. ${frase(s)}${r ? '' : ' Toque se estiver errado.'}`}
                  abaixo={(
                    <>
                      <span>{s.quando} · {frase(s)}</span>
                      {r?.estado === 'esperando' && <Selo familia="amarelo" tamanho="p">{quemOlha(s.materia)} vai olhar</Selo>}
                      {novo && <SeloNovo tamanho="p" />}
                    </>
                  )} />
                {r?.resposta && <div className="px-4 pb-3"><Aviso tom={r.resposta.decisao === 'manter' ? 'info' : 'certo'}>{decisao(r, quemOlha(s.materia))}</Aviso></div>}
              </div>
            )
          })}
        </Cartao>
      )}
      {restam > 0 && <p className="t-apoio">Algo errado? Toque no item.</p>}

      <IssoEstaErrado aberto={aberto !== null} aoMudar={(v) => { if (!v) setAberto(null) }} motivos={MOTIVOS_MEMORIA}
        oQue={aberto ? `${aberto.assunto} · ${frase(aberto)}` : undefined} aoEnviar={enviar}
        quemOlha={aberto ? (quemOlha(aberto.materia) === 'A coordenação' ? 'a coordenação' : `${quemOlha(aberto.materia)}, que dá ${aberto.materia} na sua turma`) : undefined} />
    </Secao>
  )
}

/* ── Pedir meus dados (LGPD, art. 18 — lei) ── */

/** O arquivo do pedido atendido: os dados sintéticos do aluno, num JSON de verdade. */
function useArquivo() {
  const aluno = useAlunoAtual()
  const tarefas = useTarefasDoAluno()
  const conversas = useConversasDoAluno()
  const apagados = useItensMemoriaApagados()
  return (a: AvisoT) => JSON.stringify({
    pedido: `Pedido ${a.numero}`,
    atendidoEm: a.resposta?.quando,
    escola: aluno.escola,
    aluno: { nome: aluno.nome, matricula: aluno.matricula, turma: aluno.turma, serie: aluno.serie },
    tarefas: tarefas.map((t) => ({ titulo: t.titulo, materia: t.materia, situacao: t.selo, ...(t.resultado ? { nota: `${t.resultado.acertos} de ${t.resultado.total}` } : {}) })),
    // a conversa de hoje (mol) abre com 2 falas desenhadas antes de guardar; conversa sem fala não é dado guardado
    conversasComOTutor: conversas
      .map((c) => ({ titulo: c.titulo, materia: c.materia, quando: c.quando, falas: c.trocas.length || (c.id === 'mol' ? 2 : 0) }))
      .filter((c) => c.falas > 0),
    oQueOTutorLembra: aluno.novo ? [] : SESSOES.filter((s) => !apagados.includes(s.id)).map((s) => `${s.quando} · ${s.materia} · ${s.assunto}: ${frase(s)}`),
    oQueNaoTemos: ['e-mail', 'telefone', 'foto', 'endereço', 'data de nascimento', 'dados de saúde'],
  }, null, 2)
}

function baixar(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function PedirDados() {
  const [aberto, setAberto] = useState(false)
  const [pedido, setPedido] = useState<OQueTitular | null>(null)
  const [texto, setTexto] = useState('')
  const [numero, setNumero] = useState<number | null>(null)
  const fechar = (v: boolean) => { setAberto(v); if (!v) { setPedido(null); setTexto(''); setNumero(null) } }
  const enviar = () => { if (pedido) setNumero(avisos.pedirDados({ oQue: pedido, texto, origem: 'aluno' })) }

  return (
    <>
      <div><Botao onClick={() => setAberto(true)}>Pedir meus dados</Botao></div>
      <Dialogo aberto={aberto} aoMudar={fechar} titulo="Pedir meus dados" largura={480}
        rodape={numero ? <Botao variante="secundario" onClick={() => fechar(false)}>Fechar</Botao> : <Botao variante="primario" disabled={!pedido} onClick={enviar}>Enviar</Botao>}>
        {numero ? (
          <Aviso tom="certo" titulo={`Pedido ${numero}`}>A escola responde até 06/10.</Aviso>
        ) : (
          <div className="grid gap-3">
            <div role="radiogroup" aria-label="O que você quer" className="grid gap-2">
              {PEDIDOS.map((p) => <Opcao key={p.id} nome="pedido-dados" valor={p.id} marcado={pedido === p.id} aoMudar={() => setPedido(p.id)}>{p.rotulo}</Opcao>)}
            </div>
            <CampoTexto rotulo="Quer explicar? Não precisa." valor={texto} aoMudar={setTexto} linhas={2} />
          </div>
        )}
      </Dialogo>
    </>
  )
}

function SeusPedidos() {
  const pedidos = useAvisosDoAluno().filter((a) => a.tipo === 'titular')
  const arquivo = useArquivo()
  if (pedidos.length === 0) return null
  return (
    <Secao titulo="Seus pedidos">
      <Cartao semRespiro className="overflow-hidden">
        {pedidos.map((a) => {
          const atendido = !!a.resposta
          return (
            <Linha key={a.id} titulo={`Pedido ${a.numero}`}
              abaixo={(
                <>
                  <span>{PEDIDOS.find((p) => p.id === (a.pedidoTitular?.oQue ?? 'ver'))?.rotulo}</span>
                  {atendido ? <Selo familia="verde" tamanho="p" icone={<Check strokeWidth={3.5} />}>Atendido</Selo> : <Selo familia="amarelo" tamanho="p">{`Resposta ${a.prazo}`}</Selo>}
                  {atendido && !a.lido && <SeloNovo tamanho="p" />}
                </>
              )}
              fim={atendido ? (
                <Botao variante="secundario" tamanho="p" onClick={() => { baixar(`meus-dados-pedido-${a.numero}.json`, arquivo(a)); avisos.marcarLido(a.id) }}>Baixar meus dados</Botao>
              ) : undefined} />
          )
        })}
      </Cartao>
    </Secao>
  )
}

const ANCORAS = [
  { id: 'dados', rotulo: 'Meus dados' },
  { id: 'memoria', rotulo: 'O que o Tutor lembra' },
  { id: 'guardamos', rotulo: 'O que guardamos' },
]

/** As âncoras no topo: levam à seção dentro do corpo (que rola por dentro). */
function Ancoras() {
  const ir = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    window.history.replaceState(window.history.state, '', `#${id}`)
  }
  return (
    <nav aria-label="Nesta página" className="flex flex-wrap gap-2">
      {ANCORAS.map((a) => (
        <button key={a.id} type="button" onClick={() => ir(a.id)}
          className="t-selo h-8 rounded-full border-2 border-borda px-3 text-apoio transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta">
          {a.rotulo}
        </button>
      ))}
    </nav>
  )
}

export function Privacidade() {
  const { hash } = useLocation()
  // o "Como funciona" da linha fixa chega em #tutor; o endereço antigo da memória, em #memoria
  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [hash])

  return (
    <Pagina tipo="leitura"
      cabecalho={<CabecalhoPagina voltar={{ para: '/aluno/eu', rotulo: 'Eu' }} titulo="Privacidade" linha={<Ancoras />} />}>
      <div className="grid content-start gap-8">
        {/* a ação de lei (LGPD, art. 18) logo no topo, com os pedidos junto */}
        <Secao id="dados" titulo="Meus dados">
          <Cartao className="flex flex-wrap items-center justify-between gap-3">
            <p className="t-corpo text-tinta">Você pode ver, corrigir, apagar ou levar os seus dados.</p>
            <PedirDados />
          </Cartao>
        </Secao>
        <SeusPedidos />

        <Memoria />

        <Secao id="guardamos" titulo="O que guardamos">
          <div className="grid gap-4 md:grid-cols-2">
            <Cartao semRespiro className="overflow-hidden">
              <p className="t-selo px-4 pb-2 pt-3 text-sutil">Guardamos</p>
              {GUARDAMOS.map((g) => <Linha key={g} inicio={<Glifo sim />} titulo={g} className="min-h-14 [&_.t-cartao]:whitespace-normal" />)}
            </Cartao>
            <Cartao semRespiro className="overflow-hidden">
              <p className="t-selo px-4 pb-2 pt-3 text-sutil">Não temos</p>
              {NAO_TEMOS.map((g) => <Linha key={g} inicio={<Glifo sim={false} />} titulo={g} className="min-h-14 [&_.t-cartao]:whitespace-normal" />)}
            </Cartao>
          </div>
        </Secao>

        <Secao titulo="Quem vê o quê">
          <Cartao semRespiro className="overflow-hidden">
            {QUEM_VE.map(([quem, oQue]) => (
              <div key={quem} className="grid gap-1 border-t-2 border-borda px-4 py-3 first:border-t-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
                <p className="t-cartao text-tinta">{quem}</p>
                <p className="t-corpo text-apoio">{oQue.charAt(0).toUpperCase() + oQue.slice(1)}</p>
              </div>
            ))}
          </Cartao>
        </Secao>

        <Secao id="tutor" titulo="Como o Tutor funciona">
          <Cartao>
            <ul className="t-corpo grid list-disc gap-1.5 pl-5 text-tinta">{TUTOR.map((t) => <li key={t}>{t}</li>)}</ul>
          </Cartao>
        </Secao>
      </div>
    </Pagina>
  )
}
