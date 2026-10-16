import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Lock } from 'lucide-react'
import {
  Aviso as AvisoTela, Botao, CampoTexto, Carimbo, Dialogo, FaixaResultado, GrupoToques, LadrilhoIcone, MenuMais, Opcao, Selo,
  type VarianteBotao,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { avisos, alunoDoPedido, arquivoDoTitular, useAvisos, type Aviso, type SituacaoAviso, type TipoAviso } from '@/dados/avisos'
import { agora, useAgora } from '@/dados/demo/nucleo'
import { MEMORIA_DO_TUTOR, useItensMemoriaApagados } from '@/dados/avaliacoes'
import { useEquipe } from '@/dados/escola-estado'
import { baixarArquivo } from './Exportar'
import { useRetencaoTutor } from './Configuracoes'
import { TabelaGrade, type ColunaGrade } from './_estrutura-pecas'
import { cn } from '@/lib/utils'

/* AVISOS E PEDIDOS, a aba de Registros (12ª rodada, polimento C1, 04/10/2026; plano 5.3; fluxos F5, F6, F7, F14;
   14ª rodada, 05/10/2026: a lista virou a tabela Assunto · Origem · Prazo · Estado, em linhas de 64 — o prazo como
   texto, vermelho só se venceu; o estado como selo, sempre à direita).

   Tudo o que chega por canal de pessoa para pessoa, lido da base (`useAvisos`): o "Avisar um adulto" do aluno, o canal
   público da escola sem conta (ECA Digital, art. 28 — lei), o encaminhamento de risco à vida (Lei 13.819/2019 — lei) e
   o pedido do titular (LGPD, arts. 18 e 19 — lei). O depósito local antigo saiu.
   · A linha: o ícone do tipo (aviso vermelho · encaminhamento roxo · pedido de dados anil), a categoria, o número, a
     origem, "análise humana", o prazo e a situação (ABERTO · EM ANÁLISE · CONCLUÍDO).
   · O painel (?aviso=): o que foi escrito, VER O TRECHO (motivo de lista fechada, registrado), a linha do tempo e
     RESPONDER E CONCLUIR, que pede o texto que quem avisou vai ler (antes "Concluir" afirmava uma resposta que
     ninguém escreveu; ECA Digital, art. 29 — lei). No ⋯: Registrar ação · Encaminhar à orientação · Retirar o
     conteúdo (ECA Digital, arts. 29 e 30 — lei) · Pausar a função.
   · Encaminhamento: só para quem tem "Recebe risco à vida" (D78), com REGISTRAR NOTIFICAÇÃO AO CONSELHO TUTELAR.
   · Pedido de dados: o que o sistema guarda deste aluno, ATENDER → GERAR O ARQUIVO → a resposta, em 15 dias.
   As ações quebram linha no rodapé: nada fica cortado à direita. */

const SITUACAO: Record<SituacaoAviso, { rotulo: string; familia: 'amarelo' | 'azul' | 'verde' }> = {
  aberto: { rotulo: 'Aberto', familia: 'amarelo' },
  analise: { rotulo: 'Em análise', familia: 'azul' },
  concluido: { rotulo: 'Concluído', familia: 'verde' },
}

const TIPO: Record<TipoAviso, { nome: string; familia: 'vermelho' | 'roxo' | 'anil'; icone: 'aviso' | 'atencao' | 'titular' }> = {
  aviso: { nome: 'Aviso', familia: 'vermelho', icone: 'aviso' },
  risco: { nome: 'Encaminhamento', familia: 'roxo', icone: 'atencao' },
  titular: { nome: 'Pedido', familia: 'anil', icone: 'titular' },
}

const ANALISE = { humana: 'análise humana', automatizada: 'automática, revista por gente' }

const MOTIVOS_TRECHO: Record<TipoAviso, string[]> = {
  aviso: ['Entender o que o aluno avisou', 'Conferir se a resposta da IA estava errada', 'Pedido da família ou do aluno'],
  risco: ['Avaliar risco', 'Combinar o acolhimento com a orientação', 'Pedido da família ou do aluno'],
  titular: ['Atender o pedido do titular'],
}
const MOTIVOS_RETIRAR = ['Informação errada', 'Conteúdo impróprio para a idade', 'Pedido de quem avisou']
const MEIOS = ['Telefone', 'E-mail', 'Presencial', 'Ofício']

/** O que o sistema guarda de um aluno, para o pedido do titular (LGPD, art. 18 — lei). */
const guarda = (dias: string, memoria: number) => ['Nome, matrícula e turma', 'Tarefas e notas aprovadas', `Conversas do Tutor dos últimos ${dias} dias`,
  memoria === 0 ? 'Memória do trabalho (nada guardado)' : `Memória do trabalho (${memoria} ${memoria === 1 ? 'frase' : 'frases'})`]

/** A última fala do Tutor no trecho (a que se retira). */
const ultimaDoTutor = (trecho: NonNullable<Aviso['trecho']>) => trecho.map((t) => t.quem).lastIndexOf('Tutor')

/** Quem lê a resposta. */
const leitor = (a: Aviso) => (a.alunoId || a.tipo === 'risco' || /aluno/i.test(a.origem) ? 'o aluno' : a.tipo === 'titular' ? 'a família' : 'quem avisou')

/* ── Peças que Início e IA também usam ─────────────────────────────────────────────────────────────────── */

/** A pergunta com motivo de lista fechada, antes de uma ação que fica registrada (ver o trecho, ver dados com nome,
    retirar o conteúdo, pausar). Os dois botões têm o mesmo tamanho (D70). */
export function DialogoMotivo({ aberto, aoMudar, titulo, frase, motivos, rotuloMotivo = 'Motivo', confirmar, variante = 'oficial', aoConfirmar, children, className }: {
  aberto: boolean
  aoMudar: (v: boolean) => void
  titulo: ReactNode
  frase?: ReactNode
  motivos: string[]
  rotuloMotivo?: string
  confirmar: string
  variante?: VarianteBotao
  aoConfirmar: (motivo: string) => void
  children?: ReactNode
  /** para tirar a janela de cima de uma gaveta aberta */
  className?: string
}) {
  const [motivo, setMotivo] = useState<string | null>(null)
  const mudar = (v: boolean) => { aoMudar(v); if (!v) setMotivo(null) }
  return (
    <Dialogo aberto={aberto} aoMudar={mudar} titulo={titulo} largura={480} className={className}
      rodape={(
        <div className="grid w-full grid-cols-2 gap-3">
          <Botao variante="secundario" largura="cheia" onClick={() => mudar(false)}>Voltar</Botao>
          <Botao variante={variante} largura="cheia" disabled={!motivo} onClick={() => { if (motivo) aoConfirmar(motivo); mudar(false) }}>{confirmar}</Botao>
        </div>
      )}>
      <div className="grid gap-4">
        {frase && <p className="t-corpo text-apoio">{frase}</p>}
        {children}
        <fieldset className="grid gap-2.5">
          <legend className="t-selo mb-2.5 text-sutil">{rotuloMotivo}</legend>
          {motivos.map((m) => (
            <Opcao key={m} nome="motivo" valor={m} marcado={motivo === m} aoMudar={() => setMotivo(m)}>{m}</Opcao>
          ))}
        </fieldset>
      </div>
    </Dialogo>
  )
}

/** Um bloco do painel, com o nome em t-selo. */
function Bloco({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h3 className="t-selo mb-2 text-sutil">{titulo}</h3>
      {children}
    </section>
  )
}

function LinhaDoTempo({ passos }: { passos: Aviso['feito'] }) {
  return (
    <ol className="ml-1.5 grid gap-3 border-l-2 border-borda pl-4">
      {passos.map((f, i) => (
        <li key={`${f.quando}-${i}`} className="relative text-[15px] font-medium leading-5 text-apoio before:absolute before:-left-[23px] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-white before:bg-apagado">
          <span className="block text-[13px] font-bold tabular-nums text-sutil">{f.quando}</span>{f.oQue.replace(/\bia\b/g, 'IA').replace('à orientação educacional (Helena Martins)', 'a Helena Martins, que recebe risco à vida')}
        </li>
      ))}
    </ol>
  )
}

/* ── O painel ──────────────────────────────────────────────────────────────────────────────────────────── */

type Dialogos = 'trecho' | 'retirar' | 'acao' | 'conselho' | 'atender' | null

function PainelAviso({ aviso: a, aoFechar }: { aviso: Aviso | undefined; aoFechar: () => void }) {
  const navegar = useNavigate()
  const helena = useEquipe().find((m) => m.id === 'helena')
  const retTutor = useRetencaoTutor()
  // a memória conta o que existe agora no aluno do pedido (o item que a professora apagou já não entra)
  const alvo = a && a.tipo === 'titular' ? alunoDoPedido(a) : null
  const apagados = useItensMemoriaApagados(alvo?.id ?? 'nenhum')
  const nMemoria = alvo ? MEMORIA_DO_TUTOR.filter((m) => !apagados.includes(m.id)).length : 0
  const [respondendo, setRespondendo] = useState(false)
  const [resposta, setResposta] = useState('')
  const [dialogo, setDialogo] = useState<Dialogos>(null)
  const [acao, setAcao] = useState('')
  const [dataCT, setDataCT] = useState(`hoje, ${agora().dia}`)
  const [meio, setMeio] = useState<string | null>(null)
  const [conferido, setConferido] = useState(false)

  if (!a) return <PainelLado aberto={false} aoFechar={aoFechar} titulo=""><span /></PainelLado>

  const concluido = a.situacao === 'concluido'
  const tipo = TIPO[a.tipo]
  const podeRisco = a.tipo !== 'risco' || !!helena?.atribuicoes.includes('risco')
  const podeTitular = a.tipo !== 'titular' || !!helena?.atribuicoes.includes('titular')
  const permitido = podeRisco && podeTitular
  const precisaArquivo = a.tipo === 'titular' && !a.pedidoTitular?.arquivo
  const quemLe = leitor(a)
  const semConta = /sem conta/i.test(a.origem)

  const comecarResposta = () => {
    if (a.tipo === 'titular' && !resposta) {
      // a resposta aparece no Acompanhar público: nunca repete o contato de quem pediu
      setResposta(a.alunoId ? 'Seus dados estão prontos. Baixe em Privacidade › Seus pedidos.' : (a.contato ? 'O arquivo com os dados foi enviado para o contato que você deixou.' : 'O arquivo com os dados está pronto. Busque na secretaria com este número.'))
    }
    setRespondendo(true)
  }
  const enviar = () => { avisos.responderEConcluir(a.id, resposta); setRespondendo(false); setResposta('') }

  const menu = !concluido && permitido ? (
    <MenuMais alinhar="start" lado="top" itens={[
      { rotulo: 'Registrar ação', aoEscolher: () => setDialogo('acao') },
      ...(a.tipo === 'aviso' ? [{ rotulo: 'Encaminhar à orientação', aoEscolher: () => avisos.registrarAcao(a.id, 'Encaminhado à orientação educacional') }] : []),
      ...(a.trecho && a.tipo === 'aviso' && !a.conteudoRetirado ? [{ rotulo: 'Retirar o conteúdo', perigo: true, aoEscolher: () => setDialogo('retirar') }] : []),
      ...(a.tipo !== 'titular' ? [{ rotulo: 'Pausar a função', aoEscolher: () => navegar('/coordenacao/registros?aba=ia&ver=como&ia=tutor') }] : []),
    ]} />
  ) : null

  const rodape = concluido
    ? (
      <FaixaResultado tipo="certo" titulo="Concluído" className="-mx-6 -mt-3 -mb-[calc(12px+env(safe-area-inset-bottom,0px))] basis-[calc(100%+48px)] border-t-0">
        {a.resposta ? `Resposta enviada · ${a.resposta.quando}` : 'Análise feita por uma pessoa'}
      </FaixaResultado>
    )
    : !permitido ? null
    : respondendo
      ? (
        <div className="grid w-full grid-cols-2 gap-3">
          <Botao variante="secundario" largura="cheia" onClick={() => setRespondendo(false)}>Voltar</Botao>
          <Botao variante="oficial" largura="cheia" disabled={!resposta.trim()} onClick={enviar}>Enviar</Botao>
        </div>
      )
      : (
        <>
          {menu}
          <span className="flex-1" />
          {precisaArquivo
            ? <Botao variante="oficial" onClick={() => setDialogo('atender')}>Atender</Botao>
            : <Botao variante="oficial" onClick={comecarResposta}>Responder e concluir</Botao>}
        </>
      )

  return (
    <>
      <PainelLado aberto aoFechar={aoFechar} titulo={`${tipo.nome} ${a.numero}`} rodape={rodape}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
          <div className="grid min-w-0 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Selo familia={SITUACAO[a.situacao].familia}>{SITUACAO[a.situacao].rotulo}</Selo>
              <span className="t-apoio">Prazo: <Prazo a={a} hoje={agora().dia} /></span>
              {a.turma && <Selo className="normal-case">{a.turma}</Selo>}
            </div>
            <p className="t-cartao text-tinta">{a.categoria}</p>
            <p className="t-apoio">{a.origem} · {a.recebido} · {ANALISE[a.analise]}</p>
          </div>

          {!permitido ? (
            <AvisoTela tom="info" titulo="Fechado para você">
              {a.tipo === 'risco' ? 'Só quem recebe risco à vida abre este caso.' : 'Só quem atende o titular abre este pedido.'}
            </AvisoTela>
          ) : (
            <>
              {respondendo && (
                <CampoTexto rotulo={`O que ${quemLe} vai ler`} valor={resposta} aoMudar={setResposta} linhas={3} autoFocus
                  dica="Sem nome de colega. Fica na linha do tempo." />
              )}

              {a.resposta && (
                <Bloco titulo={`O que ${quemLe} leu`}>
                  <p className="rounded-[12px] border-2 border-verde-borda bg-verde-claro px-4 py-3 t-corpo text-tinta">{a.resposta.texto}</p>
                  <p className="t-apoio mt-1.5">{a.resposta.por} · {a.resposta.quando}{a.lido ? ' · lido' : ''}</p>
                  {a.tipo === 'aviso' && <p className="t-apoio mt-0.5">Quem avisou pode recorrer em até 10 dias.</p>}
                </Bloco>
              )}

              {(a.tipo === 'risco' || a.tipo === 'aviso') && a.alunoNome && (
                <Bloco titulo="Quem é">
                  <p className="t-cartao text-tinta">{a.alunoNome}{a.turma ? ` · ${a.turma}` : ''}</p>
                  <p className="t-apoio mt-0.5">{a.tipo === 'risco' ? 'Só quem recebe risco à vida vê o nome.' : 'Só a orientação e a coordenação veem o nome.'}</p>
                </Bloco>
              )}

              <Bloco titulo={a.tipo === 'titular' ? 'O pedido' : a.tipo === 'risco' ? 'O que aconteceu' : 'O que foi escrito'}>
                <p className="rounded-[12px] bg-fundo-suave px-4 py-3 t-corpo text-tinta">{a.apontado}</p>
                {a.contato
                  ? <p className="t-apoio mt-1.5">Contato para a resposta: <b className="font-bold text-tinta">{a.contato}</b></p>
                  : semConta && <p className="t-apoio mt-1.5">Sem contato: a resposta fica só no Acompanhar, pelo número {a.numero}.</p>}
              </Bloco>

              {a.trecho && (a.trechoAberto ? (
                <Bloco titulo="O trecho da conversa">
                  <ul className="grid gap-1.5 rounded-[12px] bg-fundo-suave px-4 py-3">
                    {a.trecho.map((t, i) => (
                      <li key={i} className="text-[15px] font-medium leading-5 text-apoio">
                        <b className="font-bold text-tinta">{t.quem}:</b> {a.conteudoRetirado && i === ultimaDoTutor(a.trecho!) ? <s>{t.texto}</s> : t.texto}
                      </li>
                    ))}
                  </ul>
                  <p className="t-apoio mt-1.5 flex items-center gap-1.5"><Lock aria-hidden className="size-4" strokeWidth={2.5} /> Aberto por {a.trechoAberto.por} · {a.trechoAberto.motivo}</p>
                </Bloco>
              ) : (
                <Botao variante="secundario" tamanho="m" icone={<Lock strokeWidth={2.5} />} className="justify-self-start" onClick={() => setDialogo('trecho')}>
                  Ver o trecho
                </Botao>
              ))}

              {a.conteudoRetirado && (
                <AvisoTela tom="certo" titulo="Conteúdo retirado">{a.conteudoRetirado.motivo} · {a.conteudoRetirado.quando}</AvisoTela>
              )}

              {a.tipo === 'risco' && (a.conselhoTutelar
                ? <Carimbo verbo="Conselho Tutelar notificado:" por={a.conselhoTutelar.data} quando={a.conselhoTutelar.meio.toLowerCase()} className="justify-self-start" />
                : !concluido && (
                  <Botao variante="secundario" tamanho="m" className="w-full sm:w-auto sm:justify-self-start" onClick={() => setDialogo('conselho')}>
                    Notificar o Conselho Tutelar
                  </Botao>
                ))}

              {a.tipo === 'titular' && (
                <Bloco titulo="O que o sistema guarda deste aluno">
                  {semConta && (() => {
                    const achado = alunoDoPedido(a)
                    return achado
                      ? <p className="t-apoio mb-2">Aluno: <b className="font-bold text-tinta">{achado.nome} · {achado.turma}</b></p>
                      : <p className="t-apoio mb-2">Nenhum aluno com o nome e a turma informados. O arquivo sai sem dados; fale com a família.</p>
                  })()}
                  <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
                    {guarda(retTutor, nMemoria).map((g) => <li key={g} className="flex min-h-11 items-center border-t-2 border-borda px-4 text-[15px] font-medium text-tinta first:border-t-0">{g}</li>)}
                  </ul>
                  <p className="t-apoio mt-1.5">Compartilhado com: provedor de IA, sem nome.</p>
                  {a.pedidoTitular?.arquivo && (
                    <Botao variante="fantasma" tamanho="m" icone={<Download strokeWidth={2.5} />} className="-ml-3.5 mt-1"
                      onClick={() => baixarArquivo(`pedido-${a.numero}.json`, arquivoDoTitular(a), 'application/json')}>
                      Baixar o arquivo
                    </Botao>
                  )}
                </Bloco>
              )}

              <Bloco titulo="Linha do tempo"><LinhaDoTempo passos={a.feito} /></Bloco>

            </>
          )}
        </div>
      </PainelLado>

      <DialogoMotivo aberto={dialogo === 'trecho'} aoMudar={(v) => setDialogo(v ? 'trecho' : null)} titulo="Ver o trecho"
        frase="Fica registrado com seu nome, a hora e o motivo." motivos={MOTIVOS_TRECHO[a.tipo]} confirmar="Ver e registrar"
        aoConfirmar={(m) => avisos.verTrecho(a.id, m)} />

      <DialogoMotivo aberto={dialogo === 'retirar'} aoMudar={(v) => setDialogo(v ? 'retirar' : null)} titulo="Retirar o conteúdo?"
        frase="A resposta do Tutor sai da conversa do aluno. Fica registrado." motivos={MOTIVOS_RETIRAR} confirmar="Retirar" variante="perigoCheio"
        aoConfirmar={(m) => avisos.retirarConteudo(a.id, m)} />

      <Dialogo aberto={dialogo === 'acao'} aoMudar={(v) => { setDialogo(v ? 'acao' : null); if (!v) setAcao('') }} titulo="Registrar ação" largura={480}
        rodape={(
          <div className="grid w-full grid-cols-2 gap-3">
            <Botao variante="secundario" largura="cheia" onClick={() => { setDialogo(null); setAcao('') }}>Voltar</Botao>
            <Botao variante="oficial" largura="cheia" disabled={!acao.trim()} onClick={() => { avisos.registrarAcao(a.id, acao); setAcao(''); setDialogo(null) }}>Registrar</Botao>
          </div>
        )}>
        <CampoTexto rotulo="O que foi feito" valor={acao} aoMudar={setAcao} linhas={3} placeholder="Ex.: conversei com o professor da turma." dica="Não escreva o nome do aluno." />
      </Dialogo>

      <Dialogo aberto={dialogo === 'conselho'} aoMudar={(v) => { setDialogo(v ? 'conselho' : null); if (!v) setMeio(null) }} titulo="Notificação ao Conselho Tutelar" largura={480}
        rodape={(
          <div className="grid w-full grid-cols-2 gap-3">
            <Botao variante="secundario" largura="cheia" onClick={() => { setDialogo(null); setMeio(null) }}>Voltar</Botao>
            <Botao variante="oficial" largura="cheia" disabled={!meio || !dataCT.trim()}
              onClick={() => { if (meio) avisos.registrarConselhoTutelar(a.id, { data: dataCT.trim(), meio }); setDialogo(null); setMeio(null) }}>Registrar</Botao>
          </div>
        )}>
        <div className="grid gap-5">
          <p className="t-corpo text-apoio">Lei 13.819/2019, art. 6º. Fica na linha do tempo.</p>
          <CampoTexto rotulo="Quando" valor={dataCT} aoMudar={setDataCT} />
          <div className="grid gap-2.5">
            <p className="text-[15px] font-bold leading-5 text-tinta">Por qual meio</p>
            <GrupoToques rotulo="Por qual meio" valor={meio} aoMudar={(v) => setMeio(v as string)} opcoes={MEIOS.map((m) => ({ id: m, rotulo: m }))} />
          </div>
        </div>
      </Dialogo>

      <Dialogo aberto={dialogo === 'atender'} aoMudar={(v) => { setDialogo(v ? 'atender' : null); if (!v) setConferido(false) }} titulo={`Atender o pedido ${a.numero}`} largura={480}
        rodape={(
          <div className="grid w-full grid-cols-2 gap-3">
            <Botao variante="secundario" largura="cheia" onClick={() => { setDialogo(null); setConferido(false) }}>Voltar</Botao>
            <Botao variante="oficial" largura="cheia" disabled={semConta && !conferido}
              onClick={() => {
                if (semConta) avisos.registrarAcao(a.id, 'Conferido: é o responsável, com documento na secretaria')
                avisos.atenderTitular(a.id); setDialogo(null); setConferido(false)
              }}>Gerar o arquivo</Botao>
          </div>
        )}>
        <div className="grid gap-4">
          <p className="t-corpo text-apoio">Um arquivo com tudo o que o sistema guarda deste aluno. Responda {a.prazo} (15 dias).</p>
          {semConta && (
            <Opcao tipo="checkbox" marcado={conferido} aoMudar={setConferido}>
              Confirmei que é o responsável (documento na secretaria)
            </Opcao>
          )}
        </div>
      </Dialogo>
    </>
  )
}

/* ── A lista ───────────────────────────────────────────────────────────────────────────────────────────── */

const peso = (a: Aviso) => (a.situacao === 'concluido' ? 2 : a.tipo === 'risco' ? 0 : 1)

/** O prazo como texto: "Hoje", "Até 23/09"; vermelho só quando venceu (e o caso ainda está aberto). */
function Prazo({ a, hoje }: { a: Aviso; hoje: string }) {
  const concluido = a.situacao === 'concluido'
  const data = a.prazo.match(/(\d{2})\/(\d{2})/)
  const [dh, mh] = hoje.split('/').map(Number)
  const venceu = !concluido && !!data && (Number(data[2]) < mh || (Number(data[2]) === mh && Number(data[1]) < dh))
  const texto = a.prazo === 'hoje' ? 'Hoje' : a.prazo.replace(/^até/, 'Até')
  return (
    <span className={cn('whitespace-nowrap tabular-nums', venceu ? 'font-bold text-vermelho-texto' : concluido ? 'text-sutil' : a.prazo === 'hoje' ? 'font-bold text-tinta' : 'text-apoio')}>
      {venceu ? `Venceu ${data![0]}` : texto}
    </span>
  )
}

/** A aba "Avisos e pedidos" de Registros: Assunto · Origem · Prazo · Estado, em linhas de 64. */
export function AvisosEPedidos() {
  const lista = useAvisos()
  const hoje = useAgora().dia
  const [avisoId, setAvisoId] = useParametro('aviso')
  const aberto = lista.find((a) => a.id === avisoId)
  const ordenada = [...lista].sort((x, y) => peso(x) - peso(y) || y.numero - x.numero)
  const abertos = ordenada.filter((a) => a.situacao !== 'concluido')
  const grupos = [
    { id: 'abertos', titulo: `Abertos e em análise · ${abertos.length}`, linhas: abertos },
    { id: 'concluidos', titulo: 'Concluídos', linhas: ordenada.filter((a) => a.situacao === 'concluido') },
  ]
  const estado = (a: Aviso) => <Selo familia={SITUACAO[a.situacao].familia} tamanho="p">{SITUACAO[a.situacao].rotulo}</Selo>
  const ladrilho = (a: Aviso) => <LadrilhoIcone familia={TIPO[a.tipo].familia} tamanho={40} icone={<Icone id={TIPO[a.tipo].icone} tamanho={28} familia={TIPO[a.tipo].familia} />} />

  const colunas: ColunaGrade<Aviso>[] = [
    { titulo: 'Assunto', largura: 'minmax(0,2.4fr)', celula: (a) => (
      <span className="flex min-w-0 items-center gap-3">
        {ladrilho(a)}
        <span className="flex min-w-0 flex-col">
          <span className="t-cartao truncate text-tinta">{a.categoria}</span>
          <span className="t-apoio truncate">{TIPO[a.tipo].nome} {a.numero} · {ANALISE[a.analise]}</span>
        </span>
      </span>
    ) },
    { titulo: 'Origem', largura: 'minmax(0,1.6fr)', celula: (a) => <span className="truncate text-apoio" title={a.origem}>{a.origem}</span> },
    { titulo: 'Prazo', largura: 'minmax(96px,.7fr)', celula: (a) => <Prazo a={a} hoje={hoje} /> },
    { titulo: 'Estado', largura: '120px', alinhar: 'fim', celula: estado },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:overflow-y-auto">
      <TabelaGrade rotulo="Avisos e pedidos" colunas={colunas} grupos={grupos} chave={(a) => a.id} altura={64}
        aoAbrir={(a) => setAvisoId(a.id)} ativa={avisoId} vazio="Nenhum aviso nem pedido."
        celular={(a) => ({ inicio: ladrilho(a), titulo: a.categoria, apoio: <Prazo a={a} hoje={hoje} />, fim: estado(a) })} />
      <p className="t-apoio mt-2.5 flex shrink-0 items-start gap-1.5 px-1">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> A conversa do aluno não aparece aqui. Ver o trecho pede o motivo.
      </p>
      <PainelAviso key={aberto?.id ?? 'nenhum'} aviso={aberto} aoFechar={() => setAvisoId(null)} />
    </div>
  )
}
