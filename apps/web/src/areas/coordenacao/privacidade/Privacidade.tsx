import { Redirect, useLocation } from 'wouter'
import { ABA_INICIAL_DA_PRIVACIDADE, caminhoDaAbaDaPrivacidade } from '../../../caminhos'
import { Abas } from '../../../componentes/Abas'
import { Tela } from '../../../componentes/Tela'
import { useTituloDaTela } from '../../../titulo'
import { Retencao } from './Retencao'

/**
 * As abas da Privacidade, na ordem em que a coordenação as lê. Nesta tarefa só existe a de retenção: cada aba nasce com a
 * tarefa que a entrega (8.0, 10.0 e 16.0), e nenhuma aparece antes da tela dela (D73).
 */
export const ABAS_DA_PRIVACIDADE = [{ id: 'retencao', rotulo: 'Por quanto tempo guardamos' }] as const

/**
 * "Seus dados e a lei" (F3, 6.0; `docs/interface.md` 3): por quanto tempo a escola guarda cada dado de pessoa. A aba fica
 * no endereço, e um endereço com uma aba que não existe abre a primeira, pela troca e não pelo histórico.
 */
export default function Privacidade({ aba }: { readonly aba: string }) {
  useTituloDaTela('Privacidade')
  const [, navegar] = useLocation()
  if (!ABAS_DA_PRIVACIDADE.some((item) => item.id === aba)) return <Redirect to={caminhoDaAbaDaPrivacidade(ABA_INICIAL_DA_PRIVACIDADE)} replace />

  return (
    <Tela titulo="Privacidade">
      <Abas rotulo="Seções de Privacidade" abas={ABAS_DA_PRIVACIDADE} ativa={aba} aoMudar={(id) => navegar(caminhoDaAbaDaPrivacidade(id))}>
        <Retencao />
      </Abas>
    </Tela>
  )
}
