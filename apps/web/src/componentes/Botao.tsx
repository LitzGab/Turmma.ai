import type { ButtonHTMLAttributes, Ref } from 'react'
import { classesDoBotao, type TamanhoDeBotao, type VarianteDeBotao } from './botao-secundario'

type PropsDeBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** O tamanho do alvo: 44 px (`principal`) ou 36 px (`compacto`, controle de barra e de linha no computador). */
  tamanho?: TamanhoDeBotao
  /** O botão em si, para quem precisa devolver o foco a ele (o "Renomear" depois de fechar o campo, por exemplo). */
  ref?: Ref<HTMLButtonElement>
} & (
    | { variante?: Exclude<VarianteDeBotao, 'perigo'>; cheio?: never }
    /** `cheio` é o `perigo` em `erro` com texto branco: só o botão que confirma, dentro do diálogo de confirmação. */
    | { variante: 'perigo'; cheio?: boolean }
  )

/**
 * O botão do produto, nas cinco variantes da 11.1 do `docs/interface.md`, todas em pílula (`botao-secundario.ts`). Sem
 * `variante`, é a ação primária, na pele da D72 (9.1): `caramelo` com texto `tinta` (6,4:1), porque branco em cima do
 * laranja dá 3,0:1 e reprova. Hover em `caramelo-claro`, pressionado em `caramelo-fundo` e desligado em `inativo`, com o
 * texto ainda em `tinta`. O preto (`noite`) é a variante `oficial`, e só a decisão oficial o usa.
 *
 * Alvo de toque de 44 × 44 px no mínimo (regra 50, item 2a), foco visível pelo estilo global, e nenhum efeito que só
 * exista no hover: o pressionado muda a cor também no toque.
 */
export function Botao({ className = '', type = 'button', variante = 'primario', tamanho = 'principal', cheio = false, ...props }: PropsDeBotao) {
  return <button type={type} className={`${classesDoBotao({ variante, tamanho, cheio })} ${className}`} {...props} />
}
