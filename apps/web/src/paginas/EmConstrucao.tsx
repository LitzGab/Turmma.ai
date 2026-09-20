/**
 * As telas do segundo fator e da escolha de escola chegam nas tarefas 19.0 e 20.0. Esta página existe para que o
 * login que termina numa dessas etapas (Tech Spec, seção 5, "Etapas") caia numa tela que explica o que houve, em vez
 * de numa página em branco ou num endereço que não existe.
 */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <p className="mx-auto max-w-5xl px-4 py-3 text-lg font-semibold sm:px-6">Educa.ia</p>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
        <p className="rounded-lg border border-dashed border-slate-400 bg-white p-4 text-slate-700">
          Esta tela ainda está sendo construída. Se você precisa dela agora, procure a coordenação da sua escola.
        </p>
      </main>
    </div>
  )
}
