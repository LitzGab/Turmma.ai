import { CodigoDeErro, nomeDaSerie } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Lock, LogOut, Settings } from 'lucide-react'
import { useContext, useState } from 'react'
import { ErroDaApi } from '../../api/cliente'
import { consultaMinhaTurma } from '../../api/minha-turma'
import { ROTAS_DO_ALUNO } from '../../caminhos'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { ContextoDaSaida } from '../../componentes/saida-da-casca'
import { Ladrilho } from '../../componentes/ui/Ladrilho'
import { Linha } from '../../componentes/ui/Linha'
import { Tela } from '../../componentes/ui/Tela'
import { useTituloDaTela } from '../../titulo'
import { ComoEstouIndo } from './ComoEstouIndo'
import { DialogoDeAjustes } from './DialogoDeAjustes'

/**
 * O que a tela diz quando a API não acha turma para o aluno no ano em curso (`NAO_ENCONTRADO`): o ano virou e a turma
 * nova ainda não existe, ou o vínculo dele não está confirmado. Não é falha da rede, e "Tentar de novo" não mudaria
 * nada: o texto diz a quem recorrer.
 */
const SEM_TURMA_NO_ANO = 'Você ainda não está em uma turma neste ano letivo. Fale com quem dá a aula ou com a coordenação.'

/** As linhas da conta, que existem em todos os estados da tela: o "Sair" nunca depende da leitura da turma (D59). */
function LinhasDaConta({ aoAbrirAjustes }: { readonly aoAbrirAjustes: () => void }) {
  const { sair, saindo } = useContext(ContextoDaSaida)
  return (
    <ul aria-label="Conta" className="divide-y-2 divide-borda overflow-hidden rounded-cartao border-2 border-borda bg-superficie">
      <li>
        <Linha
          titulo="Privacidade"
          inicio={
            <Ladrilho familia="verde" tamanho={40}>
              <Lock aria-hidden="true" />
            </Ladrilho>
          }
          para={ROTAS_DO_ALUNO.privacidade}
        />
      </li>
      <li>
        <Linha
          titulo="Ajustes"
          inicio={
            <Ladrilho familia="turquesa" tamanho={40}>
              <Settings aria-hidden="true" />
            </Ladrilho>
          }
          aoAcionar={aoAbrirAjustes}
        />
      </li>
      <li>
        <Linha
          titulo="Rever a introdução"
          tituloEmDuasLinhas
          inicio={
            <Ladrilho familia="lima" tamanho={40}>
              <BookOpen aria-hidden="true" />
            </Ladrilho>
          }
          para={ROTAS_DO_ALUNO.bemVindo}
        />
      </li>
      <li>
        <Linha
          titulo={saindo ? 'Saindo…' : 'Sair'}
          inicio={
            <Ladrilho familia="anil" tamanho={40}>
              <LogOut aria-hidden="true" />
            </Ladrilho>
          }
          aoAcionar={sair}
        />
      </li>
    </ul>
  )
}

/**
 * "Eu" do aluno (telas do aluno e primeiro acesso, 2.0, 7.0 e 8.0; RF9): o cartão da turma, que era "Minha turma" (A1, 12.0; RF13),
 * "Como estou indo" (`ComoEstouIndo`, com os quatro estados dele) e as linhas **Privacidade**, **Ajustes** (o diálogo com a aparência e o tamanho da letra, que só grava ao escolher), **Rever a introdução** (9.0; RF9, RF17: o mesmo endereço da primeira entrada, e revendo todo passo fecha) e **Sair**. Sem colegas, sem professor, sem matrícula (regra 50, item 9): o contrato de
 * `GET /v1/minha-turma` não traz nada disso, e a tela não tem de onde tirar.
 *
 * Os estados do cartão são carregando, com dado, o erro com "Tentar de novo" (queda de rede não é logout, regra 80, item 6)
 * e, à parte, o aluno sem turma no ano, que não é erro de ninguém e diz o que fazer. **As linhas existem em todos os
 * estados**: o "Sair" nunca depende de a leitura da turma ter dado certo (D59).
 *
 * O "Sair" é o da casca, pelo contexto (`ContextoDaSaida`): a mesma saída do botão da lateral, a um clique.
 */
export default function Eu() {
  useTituloDaTela('Eu')
  const minhaTurma = useQuery(consultaMinhaTurma)
  const [ajustesAbertos, definirAjustesAbertos] = useState(false)

  function cartaoDaTurma() {
    if (minhaTurma.isPending) return <EstadoCarregando rotulo="Carregando a sua turma…" />
    if (minhaTurma.isError) {
      if (minhaTurma.error instanceof ErroDaApi && minhaTurma.error.codigo === CodigoDeErro.NAO_ENCONTRADO)
        return (
          <p role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
            {SEM_TURMA_NO_ANO}
          </p>
        )
      return <EstadoErro erro={minhaTurma.error} tentando={minhaTurma.isFetching} aoTentarDeNovo={() => void minhaTurma.refetch({ cancelRefetch: false })} />
    }
    const { escola, turma, serie } = minhaTurma.data
    return (
      <div className="rounded-cartao border border-linha bg-superficie p-4">
        <p className="text-sm text-apoio">Sua turma</p>
        {/* Título de verdade, e não só letra grande: é o ponto de navegação por títulos de quem usa leitor de tela. */}
        <h2 className="mt-1 text-2xl font-semibold break-words text-tinta">{turma.nome}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="text-sm text-apoio">Série</dt>
          <dd className="-mt-2 break-words sm:mt-0">{nomeDaSerie(serie)}</dd>
          <dt className="text-sm text-apoio">Escola</dt>
          <dd className="-mt-2 break-words sm:mt-0">{escola.nome}</dd>
        </dl>
      </div>
    )
  }

  return (
    <Tela titulo="Eu" idDoTitulo="titulo-eu" largura="conversa">
      <section className="flex min-w-0 flex-col gap-6" aria-labelledby="titulo-eu">
        {cartaoDaTurma()}
      </section>
      <ComoEstouIndo />
      <LinhasDaConta aoAbrirAjustes={() => definirAjustesAbertos(true)} />
      {ajustesAbertos && <DialogoDeAjustes aoFechar={() => definirAjustesAbertos(false)} />}
    </Tela>
  )
}
