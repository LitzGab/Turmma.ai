import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, Check } from 'lucide-react'
import {
  ChatDados, Interruptor, Introducao, LadrilhoIcone, Opcao, Selo, casar, type Familia, type RespostaDados, type RoteiroDados,
} from '@/components/duo'
import { Icone, type IconeId } from '@/components/duo/icones'
import { inteiro } from '@/dados/numeros-escola'
import { FAIXAS, painelDa, textoDaContagem } from '@/dados/gestao'
import { LISTA_REDES, REDES_DO_PAINEL, useRedeAtual, type RedeId } from '@/dados/rede-atual'
import { preferencias } from '@/dados/preferencias'
import { sessao, useIntroducaoVista } from '@/dados/sessao'

/* A INTRODUÇÃO DA REDE (/rede/bem-vindo), alinhada aos painéis de gestão (06/10/2026; pesquisa/paineis-gestao/plano.md).
   Cinco telas:
   1. o que o Painel tem: o que pede ação, a frequência por faixa, as notas abaixo de 6,0 e os indicadores do INEP;
   2. o que vê e o que não vê: contagens de alunos por limiar; nunca nome, número de professor, ranking nem média;
      grupo pequeno vira "menos de 5";
   3. o Analista na prática, com os números da rede de agora: a contagem abaixo de 75%, a pergunta de média respondida
      com a distribuição e a recusa do nome;
   4. qual rede acompanhar (Prefeitura de Joinville · Estado de SC, Regional Joinville: o mesmo seletor da lateral) e o
      relatório do mês por e-mail;
   5. o fim, com o resumo; COMEÇAR vai ao Painel.
   · já vista, e sem ?rever=1 nem ?como= → o Painel; o X → o Painel. */

const VE = ['Quantos alunos passaram de cada limiar', 'Frequência por faixa e APOIA', 'Notas abaixo de 6,0', 'Escolas de A a Z', 'Ideb e Censo (INEP)']
const NAO_VE = ['Nome de aluno', 'Conversas', 'Nota de uma pessoa', 'Número de professor', 'Ranking de escola', 'Média']

const PERGUNTA_75 = 'Quantos alunos estão abaixo de 75%?'
const PERGUNTA_MEDIA = 'Qual a frequência média?'
const PERGUNTA_NOME = 'Quais alunos faltam mais?'

function Ladrilho({ id, familia, children }: { id: IconeId; familia: Familia; children: ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-[16px] border-2 border-borda bg-white px-2 py-3 text-center">
      <LadrilhoIcone familia={familia} tamanho={56} icone={<Icone id={id} familia={familia} />} />
      <span className="t-cartao text-tinta">{children}</span>
    </li>
  )
}

function Lista({ titulo, itens, ve }: { titulo: string; itens: string[]; ve: boolean }) {
  return (
    <section aria-label={titulo} className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
      <h2 className={ve
        ? 'flex h-11 items-center gap-2 bg-verde-claro px-3 text-[15px] font-bold uppercase tracking-[.04em] text-verde-texto'
        : 'flex h-11 items-center gap-2 bg-fundo-suave px-3 text-[15px] font-bold uppercase tracking-[.04em] text-apoio'}>
        {ve ? <Check aria-hidden className="size-5" strokeWidth={3.5} /> : <Ban aria-hidden className="size-5" strokeWidth={2.5} />}
        {titulo}
      </h2>
      <ul className="grid gap-1.5 px-3 py-2.5">
        {itens.map((i) => <li key={i} className="text-[15px] font-medium leading-5 text-tinta">{i}</li>)}
      </ul>
    </section>
  )
}

export function BemVindoRede() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  // lido uma vez: a raiz do app tira o ?como= da barra logo depois
  const [forcada] = useState(() => params.has('rever') || params.has('como'))
  const vista = useIntroducaoVista('rede')
  // Lida uma vez, ao abrir: o COMEÇAR marca a introdução como vista antes de navegar, e a guarda não pode passar por cima do destino.
  const [vistaAoAbrir] = useState(() => vista)
  const [redeAtual, mudarRede] = useRedeAtual()
  const [respondeu, setRespondeu] = useState(false)
  const [escolhida, setEscolhida] = useState<RedeId | null>(null)
  const [relatorio, setRelatorio] = useState(false)

  const roteiro = useMemo<RoteiroDados>(() => {
    const p = painelDa(redeAtual)
    const f = p.frequencia
    const faixa = (id: string) => f.faixas.find((x) => x.id === id)!.alunos
    const conta = (n: number) => textoDaContagem(n, redeAtual)
    const abaixo: RespostaDados = {
      id: 'intro-rede-75',
      frase: <><b>{conta(faixa('reprova'))} dos {inteiro(f.total)}</b> alunos estão abaixo de 75% de frequência: se o ano fechar assim, reprovam por falta.</>,
      visual: { tipo: 'barras', max: f.total, familia: 'anil', itens: FAIXAS.map((x) => ({ rotulo: x.rotulo, valor: faixa(x.id), texto: `${conta(faixa(x.id))} alunos` })) },
      fonte: `Oficial · ${f.origem.fonte} · ${REDES_DO_PAINEL[redeAtual].nome}`,
    }
    const media: RespostaDados = {
      id: 'intro-rede-media',
      frase: <>A média esconde quem mais precisa. Em vez dela: <b>{conta(faixa('reprova'))} alunos</b> abaixo de 75% e <b>{conta(faixa('cronica'))}</b> entre 75 e 90%.</>,
      fonte: `Oficial · ${f.origem.fonte}`,
    }
    const recusa: RespostaDados = {
      id: 'intro-rede-recusa',
      tom: 'recusa',
      frase: <><b>Na rede eu só vejo números agregados.</b> Quem acompanha cada aluno é a escola.</>,
    }
    return {
      abertura: '',
      placeholder: 'Pergunte sobre a rede',
      selo: { rotulo: 'Só agregado', titulo: 'Na rede, só contagens de alunos.' },
      sugestoes: [
        { rotulo: PERGUNTA_75, pergunta: PERGUNTA_75 },
        { rotulo: PERGUNTA_MEDIA, pergunta: PERGUNTA_MEDIA },
        { rotulo: PERGUNTA_NOME, pergunta: PERGUNTA_NOME },
      ],
      responder: (q) => casar(q, [[/quais alunos|nome|quem/, recusa], [/media/, media]]) ?? abaixo,
    }
  }, [redeAtual])

  if (vistaAoAbrir && !forcada) return <Navigate to="/rede" replace />

  const comecar = () => { sessao.verIntroducao('rede'); navegar('/rede', { replace: true }) }

  return (
    <Introducao rotulo="Introdução da rede" agente="analista" aoSair={() => navegar('/rede', { replace: true })}
      passos={[
        {
          id: 'oi', pose: 'acenando',
          fala: 'Olá! Aqui você vê a rede em contagens de alunos, sem médias.',
          conteudo: (
            <ul className="grid grid-cols-2 gap-3">
              <Ladrilho id="alerta" familia="vermelho">O que pede ação</Ladrilho>
              <Ladrilho id="alunos" familia="anil">Frequência por faixa</Ladrilho>
              <Ladrilho id="notas" familia="amarelo">Notas abaixo de 6,0</Ladrilho>
              <Ladrilho id="painel" familia="azul">Indicadores do INEP</Ladrilho>
            </ul>
          ),
        },
        {
          id: 'recorte', pose: 'pensando', rotuloContinuar: 'Entendi',
          fala: 'O que você vê, e o que não vê.',
          conteudo: (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Lista titulo="Vê" itens={VE} ve />
                <Lista titulo="Não vê" itens={NAO_VE} ve={false} />
              </div>
              <p className="text-[15px] font-medium leading-5 text-apoio">Grupo com menos de 5 alunos aparece como “menos de 5”.</p>
            </div>
          ),
        },
        {
          id: 'analista', pose: 'apontando',
          fala: 'Pergunte ao Analista. Ele mostra de onde vem cada número.',
          pronto: respondeu,
          conteudo: (
            <div className="max-h-[400px] overflow-y-auto overscroll-contain max-md:max-h-none">
              <ChatDados compacto roteiro={roteiro} aoResponder={() => setRespondeu(true)} />
            </div>
          ),
        },
        {
          id: 'rede', pose: 'pensando',
          fala: 'Qual rede você acompanha?',
          pronto: escolhida !== null,
          reacao: 'Anotado!',
          aoContinuar: () => {
            if (escolhida) mudarRede(escolhida)
            preferencias.mudar({ rede: { relatorioMensal: relatorio } })
          },
          conteudo: (
            <div className="grid gap-3">
              <fieldset className="grid gap-2">
                <legend className="sr-only">A rede do Painel</legend>
                {LISTA_REDES.map((id) => {
                  const r = REDES_DO_PAINEL[id]
                  return (
                    <Opcao key={id} nome="rede-escolhida" valor={id} marcado={escolhida === id} aoMudar={() => setEscolhida(id)}
                      icone={<Icone id={id === 'estado' ? 'escola' : 'rede'} familia={id === 'estado' ? 'verde' : 'anil'} />}>
                      <span className="flex flex-col">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>{r.nome}</span>
                          {escolhida === id && <Selo familia="azul" tamanho="p">No Painel</Selo>}
                        </span>
                        <span className="text-[14px] font-medium leading-5 text-sutil">{r.etapas} · diário {r.sistema}</span>
                      </span>
                    </Opcao>
                  )
                })}
              </fieldset>
              <p className="text-[14px] font-medium leading-5 text-apoio">Dá para trocar a qualquer hora, no topo da lateral.</p>
              <div className="flex min-h-14 items-center gap-3 rounded-[12px] border-2 border-borda px-3 py-2">
                <span className="t-cartao min-w-0 flex-1 text-tinta">Relatório do mês por e-mail, dia 1º</span>
                <Interruptor ligado={relatorio} aoMudar={setRelatorio} rotulo="Relatório do mês por e-mail, dia 1º" />
              </div>
            </div>
          ),
        },
      ]}
      fim={{
        fala: 'Pronto! O que pede ação esta semana está no Painel.',
        resumo: [
          ...(escolhida ? [`Rede: ${REDES_DO_PAINEL[escolhida].nome}`] : []),
          ...(relatorio ? ['Relatório no dia 1º, por e-mail'] : []),
        ],
        aoComecar: comecar,
      }} />
  )
}
