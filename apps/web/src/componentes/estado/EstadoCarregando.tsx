interface Props {
  /** O que está sendo carregado, em pt-BR: "Carregando os avisos…". */
  rotulo: string
}

/** Estado de carregamento. Texto e não animação: nada que custe CPU no computador fraco da escola. */
export function EstadoCarregando({ rotulo }: Props) {
  return (
    <p role="status" className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
      {rotulo}
    </p>
  )
}
