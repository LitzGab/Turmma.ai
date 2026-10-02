import { nomeDaSerie } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Link } from 'wouter'
import { consultaTurmaAberta } from '../../api/estrutura'
import { consultaEu } from '../../api/eu'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { useTituloDaTela } from '../../titulo'
import { TEXTO_DA_TURMA_INDISPONIVEL, turmaIndisponivel } from './acesso-da-turma'
import { AcessoDaTurma } from './AcessoDaTurma'

/**
 * A turma aberta pelo professor, dentro de Turmas (A1, 15.0; `docs/interface.md` 1 e 11.1): o nome e a série, e o acesso
 * dos alunos. Os pedidos chegam na 16.0, e as abas, com a A3 (P28).
 *
 * Só abre a turma em que o vínculo dele está confirmado, no ano em curso: quem decide é a API (`GET /v1/turmas/:id`), e
 * a turma de outro professor, a de outra escola, a pendente e a que não existe respondem igual (regra 10, item 6). A tela
 * diz uma coisa só para as quatro, com a quem recorrer.
 *
 * A seção do acesso só existe com a turma e a escola da sessão lidas. Toda sessão que acaba ou muda esvazia as duas
 * leituras (`main.tsx`), e a seção sai com o que estiver aberto nela — o link e o código inclusive. A releitura que cai
 * por rede ou servidor com o dado já na tela não desmonta nada: a professora pode estar com o código projetado.
 */
export function Turma({ turmaId }: { turmaId: string }) {
  const turma = useQuery(consultaTurmaAberta(turmaId))
  const eu = useQuery(consultaEu)
  const idDoTitulo = useId()
  // A turma que a API deixou de achar sai também do título da aba.
  const indisponivel = turmaIndisponivel(turma.error)
  useTituloDaTela(turma.data === undefined || indisponivel ? 'Turma' : `Turma ${turma.data.nome}`)

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
    <Link to={ROTAS_DO_PROFESSOR.turmas} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para Turmas
    </Link>
  )

  // A turma que a API deixou de achar (o vínculo encerrado com a tela aberta) sai da página mesmo com o nome já lido: o
  // título da página e o da aba não continuam afirmando uma turma que a seção diz não estar disponível.
  if (turma.data === undefined || eu.data === undefined || indisponivel) {
    // A que falhou, a turma primeiro: sem ela não há o que mostrar, e é dela o "não está disponível".
    const falha = turma.isError ? turma : eu.isError ? eu : undefined
    return (
      <section className="flex min-w-0 flex-col gap-4">
        {voltar}
        {falha === undefined ? (
          <EstadoCarregando rotulo="Carregando a turma…" />
        ) : indisponivel ? (
          <TurmaIndisponivel porReleitura={turma.data !== undefined} />
        ) : (
          <EstadoErro erro={falha.error} tentando={falha.isFetching} aoTentarDeNovo={() => void falha.refetch({ cancelRefetch: false })} />
        )}
      </section>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby={idDoTitulo}>
      {voltar}
      <div>
        <h1 id={idDoTitulo} className="text-xl font-semibold break-words sm:text-2xl">
          Turma {turma.data.nome}
        </h1>
        <p className="text-apoio">{nomeDaSerie(turma.data.serie)}</p>
      </div>
      <AcessoDaTurma turmaId={turmaId} escola={eu.data.escola} />
    </section>
  )
}

/**
 * O aviso da turma que a API não acha. Quando ele chega por releitura, com a turma já na tela, tudo o que tinha o foco
 * saiu com ela (o diálogo aberto, os botões da seção): o foco vem para o aviso, e não cai no `body`. Na página que abre
 * já sem a turma, o foco fica onde o navegador o pôs, antes do "Voltar para Turmas".
 */
function TurmaIndisponivel({ porReleitura }: { porReleitura: boolean }) {
  const aviso = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (porReleitura) aviso.current?.focus()
  }, [porReleitura])
  return (
    <p ref={aviso} tabIndex={-1} role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
      {TEXTO_DA_TURMA_INDISPONIVEL}
    </p>
  )
}
