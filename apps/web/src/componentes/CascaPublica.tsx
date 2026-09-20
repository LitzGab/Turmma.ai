import type { ReactNode } from 'react'

/**
 * A casca das telas de fora da sessão: entrada da equipe, endereço da escola, segundo fator e convite. Coluna única
 * a partir de 360 px, com a largura presa em `max-w-md` para o Chromebook de 1366 px não espalhar um formulário de
 * dois campos pela tela inteira (regra 50, item 2a).
 *
 * Nenhuma delas tem "Sair": não há sessão ainda. O cabeçalho é só a marca, para a pessoa saber onde está.
 */
export function CascaPublica({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <p className="mx-auto max-w-5xl px-4 py-3 text-lg font-semibold sm:px-6">Educa.ia</p>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
        {children}
      </main>
    </div>
  )
}
