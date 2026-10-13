import { Botao } from '../../componentes/Botao'
import { TAMANHOS_DE_BOTAO, VARIANTES_DE_BOTAO } from '../../componentes/botao-secundario'
import { Menu } from '../../componentes/Menu'
import { Secao } from '../Secao'

export default function SecoesDosBotoes() {
  return (
    <Secao nome="botoes" titulo="Botões">
      {TAMANHOS_DE_BOTAO.filter((tamanho) => tamanho !== 'icone').map((tamanho) => (
        <div key={tamanho} data-tamanho={tamanho} className="flex min-w-0 flex-wrap items-center gap-3">
          {VARIANTES_DE_BOTAO.map((variante) => (
            <Botao key={variante} variante={variante} tamanho={tamanho} data-variante={variante}>
              {variante}
            </Botao>
          ))}
        </div>
      ))}
      <div data-tamanho="desligado" className="flex min-w-0 flex-wrap items-center gap-3">
        {VARIANTES_DE_BOTAO.map((variante) => (
          <Botao key={variante} variante={variante} disabled data-variante={variante}>
            {variante}
          </Botao>
        ))}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Botao variante="perigo" cheio>
          perigo cheio
        </Botao>
        <Menu rotulo="Menu desligado" itens={[{ id: 'nada', rotulo: 'Nada' }]} aoEscolher={() => undefined} desligado />
      </div>
    </Secao>
  )
}
