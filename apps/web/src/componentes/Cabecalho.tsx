import { useState } from 'react'
import { useLocation } from 'wouter'
import { sair } from '../api/sessao'
import { ROTAS } from '../caminhos'
import { Botao } from './Botao'

/**
 * O cabeçalho de toda tela autenticada, com o "Sair" que a RF13 exige em toda tela. O seletor de escola entra aqui
 * na tarefa 20.0.
 *
 * "Sair" encerra a sessão na API, o que apaga o cookie de renovação, e só então volta à entrada: no Chromebook do
 * carrinho, o aluno seguinte não herda nada do anterior.
 */
export function Cabecalho() {
  const [, navegar] = useLocation()
  const [saindo, definirSaindo] = useState(false)

  async function encerrar(): Promise<void> {
    if (saindo) return
    definirSaindo(true)
    // `sair` não lança: a sessão desta aba é esquecida mesmo se a API não respondeu, e a entrada é o lugar certo de
    // qualquer jeito. Quando o encerramento não foi confirmado, é lá que o aviso aparece.
    await sair()
    navegar(ROTAS.entrar, { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-lg font-semibold">Educa.ia</p>
        <Botao onClick={() => void encerrar()} disabled={saindo} className="disabled:bg-slate-600">
          {saindo ? 'Saindo…' : 'Sair'}
        </Botao>
      </div>
    </header>
  )
}
