import type { RespostaSaude } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'

async function buscarSaude(): Promise<RespostaSaude> {
  const resposta = await fetch('/saude', { headers: { Accept: 'application/json' } })
  if (resposta.status !== 200 && resposta.status !== 503) {
    throw new Error('resposta inesperada da API')
  }
  return (await resposta.json()) as RespostaSaude
}

/** Página de fumaça do F0: prova que a web alcança a API. A casca real vem na tarefa 14.0. */
export function Saude() {
  const consulta = useQuery({ queryKey: ['saude'], queryFn: buscarSaude, retry: false })

  let situacao = 'Verificando a API…'
  if (consulta.isError) situacao = 'Não foi possível falar com a API. Tente de novo em instantes.'
  else if (consulta.data) situacao = consulta.data.ok ? 'API respondendo, banco disponível.' : 'API respondendo, banco indisponível.'

  return (
    <main>
      <h1>Educa.ia</h1>
      <p role="status" data-saude={consulta.data ? String(consulta.data.ok) : undefined}>
        {situacao}
      </p>
    </main>
  )
}
