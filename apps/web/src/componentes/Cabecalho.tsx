import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'wouter'
import { consultaEu } from '../api/eu'
import { assinarSessao, estadoDaSessao, lembrarQuemEsta, sair } from '../api/sessao'
import { ROTAS } from '../caminhos'
import { useInatividade } from '../sessao/inatividade'
import { Botao } from './Botao'
import { Marca } from './Marca'
import { SeletorDeEscola } from './SeletorDeEscola'

/**
 * O cabeçalho de toda tela autenticada: o seletor de escola (RF14, regra 50, item 13), o caminho para os vínculos do
 * professor (RF4) e o "Sair" que a RF13 exige em toda tela.
 *
 * Ele é o único componente que existe em toda tela com sessão, e por isso é daqui que sai o relógio de inatividade
 * (RF13) e a memória de quem está na aba, que o login por cima usa para reconhecer quem volta. Os dois dependem do
 * `/v1/eu`, que é a mesma consulta do seletor.
 *
 * "Sair" encerra a sessão na API, o que apaga o cookie de renovação, e só então volta à entrada: no Chromebook do
 * carrinho, o aluno seguinte não herda nada do anterior.
 */
export function Cabecalho() {
  const [caminho, navegar] = useLocation()
  const [saindo, definirSaindo] = useState(false)
  const estado = useSyncExternalStore(assinarSessao, estadoDaSessao)
  const eu = useQuery(consultaEu)
  const dados = eu.data

  useEffect(() => {
    if (dados === undefined) return
    // Outra pessoa entrou depois de a sessão anterior vencer: é o Chromebook do carrinho passando de mão. A tela que
    // estava aberta sai da frente dela, e com ela o que a pessoa anterior tinha escrito (RF13).
    if (lembrarQuemEsta(dados)) navegar(ROTAS.inicio, { replace: true })
  }, [dados, navegar])
  // Com a sessão já vencida, o relógio para: quem conta o tempo daí em diante é o login por cima da tela.
  useInatividade({ inatividadeMin: dados?.inatividadeMin, ativa: estado === 'aberta' })

  async function encerrar(): Promise<void> {
    if (saindo) return
    definirSaindo(true)
    // `sair` não lança: a sessão desta aba é esquecida mesmo se a API não respondeu, e a entrada é o lugar certo de
    // qualquer jeito. Quando o encerramento não foi confirmado, é lá que o aviso aparece.
    await sair()
    navegar(ROTAS.entrar, { replace: true })
  }

  return (
    <header className="border-b border-linha bg-fundo">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Marca />
        {dados !== undefined && <SeletorDeEscola escolaAtual={dados.escola.nome} acessos={dados.acessos} usuarioAtual={dados.usuarioId} />}
        {dados?.papel === 'professor' && (
          <nav aria-label="Seções">
            <Link
              to={caminho === ROTAS.vinculos ? ROTAS.inicio : ROTAS.vinculos}
              className="inline-flex min-h-11 items-center rounded-linha px-3 py-2 text-caramelo-texto underline hover:bg-realce-suave active:bg-realce"
            >
              {caminho === ROTAS.vinculos ? 'Início' : 'Meus vínculos'}
            </Link>
          </nav>
        )}
        <Botao onClick={() => void encerrar()} disabled={saindo}>
          {saindo ? 'Saindo…' : 'Sair'}
        </Botao>
      </div>
    </header>
  )
}
