import { ArrowLeft } from 'lucide-react'
import { useLayoutEffect } from 'react'
import { Link, useSearch } from 'wouter'
import { PARAMETRO_DA_ORIGEM, ROTAS_DO_PROFESSOR } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Tela } from '../../componentes/Tela'
import { useTituloDaTela } from '../../titulo'
import { CartaoDeFerramenta } from './CartaoDeFerramenta'
import { ehFerramenta, ferramentaDoCatalogo } from './ferramentas'
import { esquecerGeracaoTerminada } from './memoria-do-professor'

/** Um id de artefato tem a forma de UUID: o que vier diferente no endereço não vira escolha no formulário. */
const FORMA_DE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Formulario({ ferramenta }: { ferramenta: Parameters<typeof ferramentaDoCatalogo>[0] }) {
  const item = ferramentaDoCatalogo(ferramenta)
  useTituloDaTela(item.nome)
  // O formulário aberto de novo começa em branco: a geração que já terminou fica em "O que você já gerou", e a que ainda
  // está no ar continua aqui. Antes da primeira pintura, para o resultado antigo não piscar na tela.
  useLayoutEffect(() => esquecerGeracaoTerminada(ferramenta), [ferramenta])
  // "Pedir versão adaptada", no artefato, traz a atividade de origem no endereço: só o id dela, e nada sobre aluno.
  const origem = new URLSearchParams(useSearch()).get(PARAMETRO_DA_ORIGEM)
  const iniciais = ferramenta === 'adaptacao' && origem !== null && FORMA_DE_ID.test(origem) ? { origem } : undefined
  return (
    <Tela
      largura="formulario"
      titulo={item.nome}
      objeto
      descricao={item.descricao}
      antes={
        // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
        <Link to={ROTAS_DO_PROFESSOR.ferramentas} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
          <ArrowLeft aria-hidden="true" size={18} />
          Voltar para Ferramentas
        </Link>
      }
    >
      <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
        {/* O título da ferramenta já é o `h1` da tela: o do formulário vem um nível abaixo. */}
        <CartaoDeFerramenta ferramenta={ferramenta} nivel={2} {...(iniciais === undefined ? {} : { iniciais })} />
      </div>
    </Tela>
  )
}

/**
 * O formulário de uma ferramenta (D18, D74; P23): **o mesmo motor do cartão da conversa**, com os mesmos campos e o
 * mesmo pedido, para quem prefere não conversar. O endereço de uma ferramenta que não existe (as do desenho que ficaram
 * fora do MVP, ou qualquer outra coisa) responde como página não encontrada.
 */
export default function Ferramenta({ ferramenta }: { ferramenta: string }) {
  if (!ehFerramenta(ferramenta)) return <ConteudoNaoEncontrado />
  return <Formulario ferramenta={ferramenta} />
}
