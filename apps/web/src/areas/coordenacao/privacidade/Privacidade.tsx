import { Redirect, useLocation } from 'wouter'
import { caminhoDaAbaDaPrivacidade, ehTelaDoSeletorDaPrivacidade, ROTAS_DA_COORDENACAO, type TelaDoSeletorDaPrivacidade } from '../../../caminhos'
import { Segmentado, type OpcoesDoSegmentado } from '../../../componentes/Segmentado'
import { EmpresasQueRecebemDados } from './EmpresasQueRecebemDados'
import { Incidentes } from './Incidentes'
import { Retencao } from './Retencao'

/**
 * As três telas da aba Privacidade de Registros (X2, 3.0; RF17), no seletor: os prazos de guarda (6.0), as empresas que
 * recebem dados (8.0) e os incidentes (10.0). **Seletor, e não aba**: aba dentro de aba é o que o RF17 proíbe, e a tela escolhida
 * continua no endereço de hoje (`/privacidade/retencao`, `/suboperadores`, `/incidentes`). O `valor` é o do endereço.
 */
const TELAS_DA_PRIVACIDADE: OpcoesDoSegmentado<TelaDoSeletorDaPrivacidade> = [
  { valor: 'retencao', rotulo: 'Prazos de guarda' },
  { valor: 'suboperadores', rotulo: 'Empresas' },
  { valor: 'incidentes', rotulo: 'Incidentes' },
]

/**
 * "Seus dados e a lei" (F3, 6.0, 8.0 e 10.0; `docs/interface.md` 3), dentro da aba Privacidade de Registros: por quanto tempo a escola
 * guarda cada dado de pessoa, quais empresas recebem dado dela e os incidentes de segurança que a afetaram. A escolha fica no
 * endereço, e um endereço com uma tela que não existe abre a aba Pedidos, pela troca e não pelo histórico. Os pedidos dos
 * titulares são a aba ao lado (`Pedidos.tsx`).
 */
export default function Privacidade({ aba }: { readonly aba: string }) {
  const [, navegar] = useLocation()
  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.pedidos} replace />

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Segmentado rotulo="O que ver em Privacidade" opcoes={TELAS_DA_PRIVACIDADE} valor={aba} aoMudar={(id) => navegar(caminhoDaAbaDaPrivacidade(id))} />
      {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Incidentes /> : <Retencao />}
    </div>
  )
}
