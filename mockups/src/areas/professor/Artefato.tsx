import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Documento, type AbaDocumento } from '@/components/turmma/documento'
import { useParametro } from '@/components/turmma/tela'
import { BIBLIOTECA, useDocumentoBiblioteca } from '@/dados/biblioteca'

/* O DOCUMENTO COMO PÁGINA (/professor/criados/:id), 14ª rodada (05/10/2026; plano ux-composicao, 3.2 e 3.3).
   A página é o próprio documento (CabecalhoDocumento + MesaDocumento, em turmma/documento.tsx), sem cartão em volta e
   sem "Criados" como título: o nome dele é o título, e "Criados" é o voltar.

   · O voltar segue o `?de=`: `conversa` (com `&c=<id>`) → "‹ Conversa", para /professor/conversa/<id>; `inicio` →
     "‹ Início" (o item do sino); sem `de` → "‹ Criados", de volta à lista com os filtros e a busca que estavam (o link
     de Criados manda o endereço dele no `state`).
   · `?aba=questoes|adaptada|resultados` guarda a aba; `?versao=adaptada` abre na ADAPTADA (o item "Prova adaptada"
     do sino chega por aí). A versão adaptada continua morando dentro da original: o endereço da adaptada de partida
     abre a original, na aba ADAPTADA.
   · Aceita o slug ou o número do item. A página não rola: rola a mesa. */

export function Artefato() {
  const { id } = useParams()
  const local = useLocation()
  /* guardado na chegada: trocar de aba troca o endereço e o `state` se perde */
  const [listaDeOrigem] = useState(() => (local.state as { voltar?: string } | null)?.voltar)
  const [de] = useParametro('de')
  const [conversa] = useParametro('c')
  const [aba, setAba] = useParametro('aba')
  const [versao, setVersao] = useParametro('versao')
  const doc = useDocumentoBiblioteca(id)
  /* a versão adaptada não tem página própria: abre dentro do documento de origem */
  const origem = doc?.versaoDe ? BIBLIOTECA.find((b) => b.n === doc.versaoDe) ?? doc : doc
  const ver = versao === 'adaptada' || doc?.versaoDe ? 'adaptada' : 'original'

  const voltar = de === 'conversa' && conversa ? { para: `/professor/conversa/${conversa}`, rotulo: 'Conversa' }
    : de === 'inicio' ? { para: '/professor', rotulo: 'Início' }
      : { para: listaDeOrigem?.startsWith('/professor/criados') ? listaDeOrigem : '/professor/criados', rotulo: 'Criados' }

  /* trocar de aba guarda a nova no endereço e tira o `versao` (a aba manda daqui em diante) */
  const mudarAba = (a: AbaDocumento) => {
    if (versao) setVersao(null)
    setAba(a === 'questoes' && !doc?.versaoDe ? null : a)
  }

  return (
    <Documento key={origem?.id ?? id} id={origem?.id ?? id ?? ''} versao={ver} aba={aba} aoMudarAba={mudarAba} voltar={voltar} />
  )
}
