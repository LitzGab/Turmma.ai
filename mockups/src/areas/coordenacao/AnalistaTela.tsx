import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Botao, BotaoIcone, ChatDados, saudacao, type RespostaDados } from '@/components/duo'
import { useAgora } from '@/dados/demo/nucleo'
import { COORDENADORA } from '@/dados/escola'
import { criarRoteiroEscola, PERGUNTAS_ESCOLA } from '@/dados/analista-escola'
import { usePreferencias } from '@/dados/preferencias'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMesIA } from './Governanca'

/* O ANALISTA DA COORDENAÇÃO em tela inteira (14ª rodada, 05/10/2026; plano ux-composicao, 4.4 e 4.5). A conversa como um
   assistente de IA, no lugar próprio da lateral (antes ela dividia a tela com o painel):
   · a barra de 56 px: a onça de anel anil, "Analista", o selo IA e "Nome só com motivo registrado"; NOVA CONVERSA
     (depois da primeira pergunta) e RELATÓRIO DO MÊS (manda a R6: o cartão do arquivo, VER ANTES, BAIXAR);
   · vazia, a 1/3 da altura: a onça, "Pergunte sobre a sua escola.", o Resumo de segunda, a caixa e 4 pílulas;
   · o roteiro (dados/analista-escola.ts) responde as perguntas prontas e, com recorte, CALCULA pelo motor sobre as
     mesmas células do Painel; ?pergunta= (os PERGUNTAR do Painel) é enviada uma vez e sai do endereço (ChatDados).
   A conversa continua ao trocar de lugar (memoria "coordenacao"); as fixadas e as respostas que elas apontam moram
   aqui, fora do componente, e recomeçam ao recarregar. Entram no relatório do mês. */

const CONVERSA: { fixadas: string[]; respostas: Map<string, RespostaDados> } = { fixadas: [], respostas: new Map() }

const SELO = { rotulo: 'Nome só com motivo registrado', titulo: 'Nome de aluno só com motivo registrado: o motivo fica na auditoria.' }

export function AnalistaCoordenacao() {
  const navegar = useNavigate()
  const celular = useIsMobile()
  const resumoLigado = usePreferencias().coordenacao.resumo
  const [fixadas, setFixadas] = useState<string[]>(() => CONVERSA.fixadas)
  const [pergunta, setPergunta] = useState<{ texto: string; chave: number } | null>(null)
  const chave = useRef(0)
  const navegarRef = useRef(navegar)
  const mes = useMesIA()
  const agora = useAgora()
  const mesRef = useRef(mes)
  useEffect(() => { CONVERSA.fixadas = fixadas; navegarRef.current = navegar; mesRef.current = mes })

  const roteiro = useMemo(() => ({
    ...criarRoteiroEscola({
      resumoLigado,
      // lê a conversa guardada (e não o estado desta montagem): o relatório vê as fixadas de agora
      fixadas: () => CONVERSA.fixadas.map((id) => CONVERSA.respostas.get(id)).filter((r): r is RespostaDados => !!r),
      abrir: (rota) => navegarRef.current(rota),
      mes: () => mesRef.current,
    }),
    selo: SELO,
  }), [resumoLigado])

  const relatorio = () => setPergunta({ texto: PERGUNTAS_ESCOLA.R6, chave: ++chave.current })
  // com a conversa começada, NOVA CONVERSA entra na barra; a 375 o relatório sai dela (fica na pílula fixa)
  const [comecou, setComecou] = useState(() => CONVERSA.respostas.size > 0 || new URLSearchParams(window.location.search).has('pergunta'))

  return (
    /* o mesmo esqueleto do Analista da secretaria: a barra ganha fundo e um fio embaixo (a conversa não passa por
       baixo dela sem divisa); a 375 o selo IA sai da barra. Na conversa vazia fica o cadeado com "Nome com motivo"
       (o limite da coordenação à vista antes de perguntar, como o "Só agregados" da secretaria); com a conversa
       começada, NOVA CONVERSA entra e o selo sai, para "Analista" caber inteiro */
    <div className={[
      'contents max-sm:[&_h1+span>span>:first-child]:hidden',
      comecou
        ? 'max-sm:[&_h1+span]:hidden'
        : 'max-sm:[&_h1+span>span>:last-child]:!inline-flex max-sm:[&_h1+span>span>:last-child]:text-[0px] max-sm:[&_h1+span>span>:last-child]:after:text-[13px] max-sm:[&_h1+span>span>:last-child]:after:content-["Nome_com_motivo"]',
      '[&_div:has(>div>h1.t-cartao)]:relative [&_div:has(>div>h1.t-cartao)]:z-[1] [&_div:has(>div>h1.t-cartao)]:bg-white [&_div:has(>div>h1.t-cartao)]:shadow-[0_2px_0_var(--color-borda)]',
    ].join(' ')}>
      <ChatDados roteiro={roteiro} layout="tela" memoria="coordenacao" titulo="Analista"
        vazio={{ titulo: `${saudacao(agora.hora)}, ${COORDENADORA.nome.split(' ')[0]}`, fala: 'Pergunte sobre a sua escola.' }}
        pergunta={pergunta} fixadas={fixadas}
        aoFixar={(id) => setFixadas((f) => (f.includes(id) ? f : [...f, id]))}
        aoResponder={(r) => { CONVERSA.respostas.set(r.id, r); setComecou(true) }}
        acoes={celular
          // a 375, com a conversa começada, o relatório fica só na pílula fixa acima da caixa (o nome cabe na barra)
          ? (comecou ? undefined : <BotaoIcone rotulo="Relatório do mês" variante="secundario" tamanho={40} onClick={relatorio}><FileText strokeWidth={2.5} /></BotaoIcone>)
          // a partir de 768: o botão com texto na conversa vazia; começada, vira ícone (a pílula fixa acima da caixa
          // repete o relatório), para "Analista", o selo inteiro e NOVA CONVERSA caberem na barra de 768
          : comecou
            ? <BotaoIcone rotulo="Relatório do mês" variante="secundario" tamanho={40} onClick={relatorio}><FileText strokeWidth={2.5} /></BotaoIcone>
            : <Botao variante="secundario" tamanho="m" icone={<FileText strokeWidth={2.5} />} onClick={relatorio}>Relatório do mês</Botao>} />
    </div>
  )
}
