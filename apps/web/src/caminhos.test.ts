import { describe, expect, it } from 'vitest'
import { caminhoDoPedidoDoTitular, ROTAS_DA_COORDENACAO } from './caminhos'

describe('o endereço do pedido de titular (F3, 17.0)', () => {
  it('leva só o id do pedido, na aba Pedidos da Privacidade, e nada além dele vira trecho do endereço', () => {
    expect(caminhoDoPedidoDoTitular('0197f3b0-6f3e-7c11-9a3e-5d1c2b7a8e41')).toBe('/privacidade/pedidos/0197f3b0-6f3e-7c11-9a3e-5d1c2b7a8e41')
    expect(caminhoDoPedidoDoTitular('../auditoria?x=1')).toBe('/privacidade/pedidos/..%2Fauditoria%3Fx%3D1')
  })

  it('a rota do pedido tem um trecho a mais que a da aba, e por isso é a que o Switch precisa ver primeiro', () => {
    expect(ROTAS_DA_COORDENACAO.pedidoDoTitular.startsWith(ROTAS_DA_COORDENACAO.privacidade)).toBe(true)
    expect(ROTAS_DA_COORDENACAO.pedidoDoTitular.split('/')).toHaveLength(ROTAS_DA_COORDENACAO.privacidadeDaAba.split('/').length + 1)
  })
})
