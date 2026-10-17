import type { ProfessorDaEscola } from '@educa/shared'
import { useId, type RefObject } from 'react'
import { Botao } from '../../componentes/Botao'
import { Anuncio } from '../../componentes/dialogos'
import { PainelLado } from '../../componentes/PainelLado'
import { Estado } from '../../componentes/SeloDeEstado'
import { acoesDoConviteDeProfessor, FAMILIA_DO_ESTADO_DO_PROFESSOR, TEXTO_DO_ESTADO_DO_PROFESSOR } from './convite-de-professor'

interface Props {
  readonly professor: ProfessorDaEscola
  readonly aoFechar: () => void
  readonly aoRefazer: () => void
  readonly aoRevogar: () => void
  /** O anúncio da ação que terminou: "Convite de … revogado.". Mora aqui, onde a pessoa está, e não na página atrás do painel. */
  readonly anuncio: string
  /** O título da seção da situação, para onde o foco vai quando o botão que abriu um diálogo saiu do rodapé (o "Revogar" do convite revogado). */
  readonly tituloDaSituacao: RefObject<HTMLHeadingElement | null>
  /** Para onde o foco vai ao fechar quando quem abriu o painel já saiu da página. */
  readonly focoDeReserva: () => void
}

/**
 * O painel do professor (X2, 6.0; RF13; `?professor=<usuarioId>`): o nome no título, a situação do convite em texto e, no rodapé,
 * **só as ações que o estado permite** — as matrizes de `@educa/shared`, as mesmas do servidor (`acoesDoConviteDeProfessor`).
 * Estado sem ação (quem entrou, o revogado, o desativado) não tem rodapé. Cadastrar não é daqui: é da tela, e cadastra outra pessoa.
 *
 * **Nada de e-mail** (regra 20, itens 2 e 4; E11): a lista de professores não o traz e o painel não o pede. O link do convite nunca
 * mora aqui: ele vive só no diálogo que o pediu, e o painel não o guarda nem o repete (regra 20, item 8). Os diálogos de refazer e de
 * revogar são os da tela, abertos por cima do painel, que fica onde está. As turmas do professor e o "Acrescentar turma" são da 7.0.
 */
export function PainelDoProfessor({ professor, aoFechar, aoRefazer, aoRevogar, anuncio, tituloDaSituacao, focoDeReserva }: Props) {
  const acoes = acoesDoConviteDeProfessor(professor.estado)
  const idDaSituacao = useId()
  return (
    <PainelLado
      titulo={professor.nome}
      aoFechar={aoFechar}
      focoDeReserva={focoDeReserva}
      rodape={
        acoes.length === 0 ? undefined : (
          <>
            {acoes.map((acao) =>
              acao === 'refazer' ? (
                <Botao key={acao} variante="secundario" onClick={aoRefazer}>
                  Refazer convite
                </Botao>
              ) : (
                <Botao key={acao} variante="perigo" onClick={aoRevogar}>
                  Revogar convite
                </Botao>
              ),
            )}
          </>
        )
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        <section aria-labelledby={idDaSituacao} className="flex min-w-0 flex-col gap-2">
          <h3 ref={tituloDaSituacao} id={idDaSituacao} tabIndex={-1} className="t-selo text-sutil">
            Situação do convite
          </h3>
          <div>
            <Estado familia={FAMILIA_DO_ESTADO_DO_PROFESSOR[professor.estado]}>{TEXTO_DO_ESTADO_DO_PROFESSOR[professor.estado]}</Estado>
          </div>
        </section>
        <Anuncio texto={anuncio} />
      </div>
    </PainelLado>
  )
}
