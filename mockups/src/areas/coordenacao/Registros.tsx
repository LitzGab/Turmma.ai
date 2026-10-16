import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Botao, CabecalhoPagina, Pagina } from '@/components/duo'
import { useParametro } from '@/components/turmma/tela'
import { Auditoria } from './Auditoria'
import { Dossie } from './Conformidade'
import { AvisosEPedidos } from './Denuncias'
import { PainelExportar } from './Exportar'
import { Governanca, ResumoDoMes } from './Governanca'
import { CABECALHO_NO_SINO, CorpoNoSino } from './_estrutura-pecas'

/* REGISTROS (/coordenacao/registros; 14ª rodada, 05/10/2026; plano ux-composicao, 1.4, 1.8 e 5.2; fluxo F40).
   Página de painel, com o cabeçalho de sempre: "Registros" e, à direita, DOSSIÊ e EXPORTAR DADOS (os dois de
   contorno; a 375 vão para o ⋯). Três abas, nenhuma dentro da outra (R3):
   · IA (a primeira): o que a IA gerou e quem aprovou. Na ponta direita da linha das abas, os 3 números do mês e
     COMO CADA IA TRABALHA (?ver=como). É um registro: o que a IA fez e quem aprovou.
   · AVISOS E PEDIDOS · AUDITORIA.
   Cada aba rola por dentro; a página não rola. O DOSSIÊ abre num painel de 640 ao lado (?dossie=1), por cima de
   qualquer aba; o EXPORTAR também (?exportar=1&conjunto=<id>).
   Endereços antigos: ?aba=dossie (e /coordenacao/conformidade) → ?dossie=1, sobre a aba IA. */

const ABAS = [
  { id: 'ia', rotulo: 'IA' },
  { id: 'avisos', rotulo: 'Avisos e pedidos' },
  { id: 'auditoria', rotulo: 'Auditoria' },
]
type Aba = 'ia' | 'avisos' | 'auditoria'

/** O que um painel ou um filtro deixam na URL; trocar de aba tira tudo isso. */
const DA_ABA = ['item', 'aviso', 'ver', 'ia', 'serie']

export function Registros() {
  const [params, setParams] = useSearchParams()
  const pedida = params.get('aba')
  const aba: Aba = pedida === 'avisos' || pedida === 'auditoria' ? pedida : 'ia'
  const [dossie, setDossie] = useParametro('dossie')
  const [exportar] = useParametro('exportar')
  const [conjunto] = useParametro('conjunto')

  // o endereço antigo: ?aba=dossie abre o painel do Dossiê sobre a aba IA
  useEffect(() => {
    if (pedida !== 'dossie') return
    setParams((atual) => { const p = new URLSearchParams(atual); p.delete('aba'); p.set('dossie', '1'); return p }, { replace: true })
  }, [pedida, setParams])

  const mudarAba = (id: string) => setParams((atual) => {
    const p = new URLSearchParams(atual)
    DA_ABA.forEach((k) => p.delete(k))
    if (id === 'ia') p.delete('aba'); else p.set('aba', id)
    return p
  }, { replace: true })
  const abrirExportar = () => setParams((p) => { const n = new URLSearchParams(p); n.set('exportar', '1'); return n }, { replace: true })
  // fechar tira os dois parâmetros de uma vez (duas chamadas seguidas leriam a URL velha)
  const fecharExportar = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('exportar'); n.delete('conjunto'); return n }, { replace: true })

  return (
    <Pagina tipo="painel" rolagem="nenhuma" cabecalho={(
      <CabecalhoPagina titulo="Registros" className={CABECALHO_NO_SINO}
        acoes={(
          <>
            <span className="flex items-center gap-2 max-sm:hidden">
              <Botao variante="secundario" tamanho="m" onClick={() => setDossie('1')}>Dossiê</Botao>
              <Botao variante="secundario" tamanho="m" onClick={abrirExportar}>Exportar dados</Botao>
            </span>
            {/* no celular, dois botões pequenos em vez de um segundo ⋯ embaixo do ⋯ da barra do topo */}
            <span className="flex items-center gap-2 sm:hidden">
              <Botao variante="secundario" tamanho="p" onClick={() => setDossie('1')}>Dossiê</Botao>
              <Botao variante="secundario" tamanho="p" onClick={abrirExportar}>Exportar</Botao>
            </span>
          </>
        )}
        abas={{ abas: ABAS, valor: aba, aoMudar: mudarAba, fim: aba === 'ia' ? <ResumoDoMes /> : undefined }} />
    )}>
      <CorpoNoSino>{aba === 'auditoria' ? <Auditoria /> : aba === 'avisos' ? <AvisosEPedidos /> : <Governanca />}</CorpoNoSino>

      <Dossie aberto={dossie === '1'} aoFechar={() => setDossie(null)} />
      <PainelExportar key={conjunto ?? 'padrao'} aberto={exportar === '1'} conjuntoInicial={conjunto} aoFechar={fecharExportar} />
    </Pagina>
  )
}
