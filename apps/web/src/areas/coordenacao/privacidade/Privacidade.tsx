import { Redirect, useLocation } from 'wouter'
import { ABA_INICIAL_DA_PRIVACIDADE, caminhoDaAbaDaPrivacidade } from '../../../caminhos'
import { Abas } from '../../../componentes/Abas'
import { Tela } from '../../../componentes/Tela'
import { useTituloDaTela } from '../../../titulo'
import { EmpresasQueRecebemDados } from './EmpresasQueRecebemDados'
import { Incidentes } from './Incidentes'
import { Retencao } from './Retencao'

/**
 * As abas da Privacidade, na ordem em que a coordenação as lê. Cada aba nasce com a tarefa que a entrega (Pedidos, 16.0),
 * e nenhuma aparece antes da tela dela (D73). Hoje: a retenção (6.0), as empresas que recebem dados (8.0) e os incidentes (10.0).
 */
export const ABAS_DA_PRIVACIDADE = [
  { id: 'retencao', rotulo: 'Por quanto tempo guardamos' },
  { id: 'suboperadores', rotulo: 'Empresas que recebem dados' },
  { id: 'incidentes', rotulo: 'Incidentes' },
] as const

/**
 * "Seus dados e a lei" (F3, 6.0, 8.0 e 10.0; `docs/interface.md` 3): por quanto tempo a escola guarda cada dado de pessoa, quais empresas recebem dado dela e os incidentes de segurança que a afetaram. A aba fica
 * no endereço, e um endereço com uma aba que não existe abre a primeira, pela troca e não pelo histórico.
 */
export default function Privacidade({ aba }: { readonly aba: string }) {
  useTituloDaTela('Privacidade')
  const [, navegar] = useLocation()
  if (!ABAS_DA_PRIVACIDADE.some((item) => item.id === aba)) return <Redirect to={caminhoDaAbaDaPrivacidade(ABA_INICIAL_DA_PRIVACIDADE)} replace />

  return (
    <Tela titulo="Privacidade">
      <Abas rotulo="Seções de Privacidade" abas={ABAS_DA_PRIVACIDADE} ativa={aba} aoMudar={(id) => navegar(caminhoDaAbaDaPrivacidade(id))}>
        {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Incidentes /> : <Retencao />}
      </Abas>
    </Tela>
  )
}
