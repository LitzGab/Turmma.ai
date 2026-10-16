import { useCallback, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { Botao, ChatDados, saudacao } from '@/components/duo'
import { ModeSelector } from '@/components/ui/mode-selector'
import { useAgora } from '@/dados/demo/nucleo'
import { PERGUNTAS, criarRoteiroRede } from '@/dados/analista-rede'
import { useNumerosDaRede } from '@/dados/numeros-rede'
import { LISTA_REDES, REDES_DO_PAINEL, useRedeAtual } from '@/dados/rede-atual'
import { useIsMobile } from '@/hooks/use-mobile'
import { ComoProtegemos } from './Rede'

/* PAINÉIS DE GESTÃO (06/10/2026): o Analista é o da rede escolhida no seletor da lateral (useRedeAtual). Trocar de
   rede recomeça a conversa (a memória é uma por rede: "rede-tela-prefeitura" e "rede-tela-estado"). As respostas
   usam as contagens do Painel (dados/analista-rede.ts): pergunta de média vira distribuição; nunca nome.

   O ANALISTA DA SECRETARIA (/rede/analista), 14ª rodada (05/10/2026; plano ux-composicao, 4.4 e 4.5; fluxo F42).
   "Um chat para fazer perguntas e conseguir computar os dados de todas as escolas": a conversa em tela inteira, como
   um assistente de IA (ChatDados layout "tela": barra de 56, coluna de 768, o vazio a 1/3 com 4 perguntas prontas).
   · A barra: "Analista", IA, o selo "Só números agregados", NOVA CONVERSA e RELATÓRIO DO MÊS (secundário: manda a
     pergunta do relatório; o PDF sai na conversa).
   · As respostas prontas (P1 a P7) e as recusas continuam; o resto passa pelo motor de consulta, que calcula sobre
     CELULAS_REDE (a mesma fonte do Painel). ?pergunta=<texto> (dos cartões e do mapa do Painel, e das Escolas) é
     enviada ao abrir.
   · SÓ AGREGADO: nome nunca (nem botão para isso); grupo com menos de 5 alunos vira "menos de 5" e o total que o
     revelaria sai da frase (regra nossa, D45); escolas de A a Z, sem ordenar da melhor para a pior (D64).
     O controlador é o Município (LGPD, arts. 5º e 23: lei); dado de criança e adolescente (LGPD, art. 14: lei).
   · A conversa continua ao voltar à página (memória da aba: "rede-tela"); recomeça ao recarregar. */
export function RedeAnalista() {
  const n = useNumerosDaRede()
  const [rede, mudarRede] = useRedeAtual()
  const agora = useAgora()
  const celular = useIsMobile()
  const [fixadas, setFixadas] = useState<string[]>([])
  const [protecao, setProtecao] = useState(false)
  const [pergunta, setPergunta] = useState<{ texto: string; chave: number } | null>(null)

  const roteiro = useMemo(() => criarRoteiroRede(rede, n, {
    fixadas: () => fixadas,
    aoAbrirProtecao: () => setProtecao(true),
    celular,
  }), [rede, n, fixadas, celular])

  const relatorio = useCallback(() => setPergunta((p) => ({ texto: PERGUNTAS.relatorio, chave: (p?.chave ?? 0) + 1 })), [])

  return (
    <>
      {/* a 375, o selo IA sai para o título não cortar. Na conversa vazia (sem NOVA CONVERSA na barra) fica o cadeado
          com "Só agregados": quem chega vê, antes de perguntar, que só sai número agregado. Com a conversa começada,
          a barra é "Analista" e NOVA CONVERSA, e cada resposta traz o "De onde veio". A barra ganha fundo e um fio
          embaixo, para a conversa não passar por baixo dela sem divisa. */}
      <div className={[
        'contents max-sm:[&_h1+span>span>:first-child]:hidden',
        'max-sm:[&_div:has(>div>h1.t-cartao):not(:has(button))_h1+span>span>:last-child]:!inline-flex',
        'max-sm:[&_h1+span>span>:last-child]:text-[0px] max-sm:[&_h1+span>span>:last-child]:after:text-[13px] max-sm:[&_h1+span>span>:last-child]:after:content-["Só_agregados"]',
        '[&_div:has(>div>h1.t-cartao)]:relative [&_div:has(>div>h1.t-cartao)]:z-[1] [&_div:has(>div>h1.t-cartao)]:bg-white [&_div:has(>div>h1.t-cartao)]:shadow-[0_2px_0_var(--color-borda)]',
      ].join(' ')}>
      <ChatDados key={rede} roteiro={roteiro} layout="tela" memoria={`rede-tela-${rede}`} titulo="Analista"
        vazio={{ titulo: saudacao(agora.hora), fala: rede === 'estado' ? 'Pergunte sobre a rede estadual.' : 'Pergunte sobre a rede municipal.' }}
        /* a rede de que se pergunta, dentro da caixa (como o seletor de modelo das IAs); é a mesma da lateral */
        contexto={<ModeSelector modes={LISTA_REDES.map((id) => ({ id, label: REDES_DO_PAINEL[id].curto, nome: REDES_DO_PAINEL[id].nome, description: REDES_DO_PAINEL[id].etapas }))}
          value={rede} onChange={(id) => mudarRede(id as typeof rede)} side="bottom" align="end" ariaLabel="Escolher a rede" titulo="Perguntar sobre"
          className="h-10 gap-2 rounded-[12px] border-2 border-borda bg-campo px-3 text-[15px] text-tinta hover:border-borda-forte hover:bg-fundo-suave [&>span]:font-bold [&>svg]:size-4 [&>svg]:opacity-100" />}
        pergunta={pergunta} fixadas={fixadas}
        aoFixar={(id) => setFixadas((f) => (f.includes(id) ? f : [...f, id]))}
        /* no celular a barra não cabe: o relatório fica na pílula "Gere o relatório do mês", que no celular está entre as 4 do vazio e nunca sai */
        acoes={celular ? undefined : (
          <Botao variante="secundario" tamanho="m" icone={<FileText strokeWidth={2.5} />} onClick={relatorio}>Relatório do mês</Botao>
        )} />
      </div>
      <ComoProtegemos aberto={protecao} aoFechar={() => setProtecao(false)} />
    </>
  )
}
