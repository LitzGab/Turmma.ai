import { useQuery } from '@tanstack/react-query'
import { consultaEu } from '../api/eu'
import { EstadoCarregando, EstadoErro } from '../componentes/estado'
import { NOME_DO_PAPEL } from '../papeis'

/**
 * A primeira tela de quem entrou. No F1 ela mostra quem está na sessão e em qual escola, que é o que prova, para a
 * pessoa e para o teste, que a sessão vale de verdade. O menu da área do professor (chat, ferramentas, calendário,
 * feed dos agentes) é do F7 em diante; os vínculos, da 20.0.
 *
 * Não há estado vazio: a resposta de `/v1/eu` sempre traz a pessoa e a escola. Carregando, erro e com dado estão
 * aqui, e o erro mantém a tela em pé com "Tentar de novo" — queda de rede não é logout (regra 80, item 6).
 */
export function Inicio() {
  const eu = useQuery(consultaEu)

  if (eu.isPending) return <EstadoCarregando rotulo="Carregando a sua escola…" />
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio" className="text-xl font-semibold sm:text-2xl">
        {eu.data ? `Olá, ${eu.data.nome}` : 'Início'}
      </h1>
      {eu.isError && <EstadoErro erro={eu.error} tentando={eu.isFetching} aoTentarDeNovo={() => void eu.refetch({ cancelRefetch: false })} />}
      {eu.data && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="break-words text-slate-700">
            Você está em <span className="font-medium text-slate-900">{eu.data.escola.nome}</span> como{' '}
            <span className="font-medium text-slate-900">{NOME_DO_PAPEL[eu.data.papel]}</span>.
          </p>
          <p className="mt-2 text-slate-700">As suas turmas, o calendário e as ferramentas aparecem aqui nas próximas versões.</p>
        </div>
      )}
    </section>
  )
}
