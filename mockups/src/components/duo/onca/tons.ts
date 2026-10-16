import { useTema } from '@/dados/tema'
import { TONS, TONS_ESCURO, type FamiliaCor, type TonsFamilia } from './paleta'

/** Os tons das famílias no tema que está valendo (hex), para os ícones e gráficos que leem por JavaScript. */
export function useTons(): Record<FamiliaCor, TonsFamilia> {
  return useTema() === 'escuro' ? TONS_ESCURO : TONS
}
