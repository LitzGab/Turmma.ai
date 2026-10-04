import { MENSAGENS_DE_ERRO, type ChaveDeFuncao, type CodigoDeErro } from '@educa/shared'
import { PauseCircle } from 'lucide-react'
import { aparenciaDaFalha } from '../../api/ciclo-de-execucao'
import { Faixa } from '../../componentes/Faixa'
import { AvisoFila } from '../../componentes/ia/AvisoFila'

/**
 * O que a tela diz quando a escola suspendeu uma função do Assistente (D60): o que parou, que foi a coordenação, e o que
 * continua valendo. É a mesma frase antes de pedir (a tela já sabe, por `GET /v1/time`) e depois de o servidor recusar
 * (`FUNCAO_SUSPENSA`).
 */
export const TEXTO_DA_SUSPENSAO: Readonly<Partial<Record<ChaveDeFuncao, string>>> = {
  conversa_e_ferramentas: 'A coordenação suspendeu a conversa e as ferramentas do Assistente nesta escola. Enquanto isso ele não responde a pedidos novos; o que você já gerou continua em Ferramentas. Fale com a coordenação para saber quando volta.',
  adaptacao: 'A coordenação suspendeu a Adaptação nesta escola. Enquanto isso o Assistente não prepara versão adaptada nova; as que você já aprovou continuam valendo. Fale com a coordenação para saber quando volta.',
}

/** A função suspensa pela escola: **aviso que explica, e não erro** — cinza, sem alarme, sem "Tentar de novo". */
export function AvisoDeSuspensao({ funcao }: { funcao: ChaveDeFuncao }) {
  return <Faixa icone={PauseCircle}>{TEXTO_DA_SUSPENSAO[funcao] ?? MENSAGENS_DE_ERRO.FUNCAO_SUSPENSA}</Faixa>
}

interface PropsDaFalha {
  readonly erro: CodigoDeErro
  /** A função que o pedido usa: é dela a frase da suspensão. */
  readonly funcao: ChaveDeFuncao
  readonly aoTentarDeNovo: () => void
}

/**
 * A falha de um pedido de IA, dentro da conversa e do cartão: **nunca o código nem o erro cru** (regra 80, item 4). O que
 * passa sozinho vira o `AvisoFila`, com "Tentar de novo"; a função suspensa vira o aviso que explica; e o que pede que
 * algo mude antes (o tema que não está no material, o limite de IA da escola) vem com a mensagem do catálogo.
 */
export function FalhaDoPedido({ erro, funcao, aoTentarDeNovo }: PropsDaFalha) {
  const aparencia = aparenciaDaFalha(erro)
  if (aparencia === 'fila') return <AvisoFila situacao="falha" aoTentarDeNovo={aoTentarDeNovo} />
  if (aparencia === 'suspensa') return <AvisoDeSuspensao funcao={funcao} />
  return (
    <p role="alert" data-falha-do-pedido="" className="min-w-0 rounded-controle bg-erro-cx p-3 break-words text-erro">
      {MENSAGENS_DE_ERRO[erro]}
    </p>
  )
}
