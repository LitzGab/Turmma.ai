interface Props {
  /** O que está sendo carregado, em pt-BR: "Carregando os avisos…". */
  rotulo: string
}

/** Estado de carregamento. Texto e não animação: nada que custe CPU no computador fraco da escola. */
export function EstadoCarregando({ rotulo }: Props) {
  return (
    <p role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
      {rotulo}
    </p>
  )
}
