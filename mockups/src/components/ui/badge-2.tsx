import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* sean0205/badge-2 (21st.dev · 3560, MIT). Veio com uma dúzia de variantes em cor viva e 26 `dark:`.
   Na adoção ficam só as cinco famílias da 9.1 — pendente, ok, erro, info, ia — e o resto sai (10.2).
   Estado nunca é só cor: o selo sempre leva texto ou ícone.
   12ª rodada (04/10/2026), a PONTE VISUAL: o selo do sistema duo (canto 8, caixa alta, 700, fundo claro e texto da
   família: amarelo para pendente, verde para ok, vermelho para erro, azul para info). As props não mudam. */
const badgeVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-bold uppercase tracking-[.04em] [&_svg]:-ms-px [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        pendente: 'bg-amarelo-claro text-amarelo-texto',
        ok: 'bg-verde-claro text-verde-texto',
        erro: 'bg-vermelho-claro text-vermelho-texto',
        info: 'bg-azul-claro text-azul-texto',
        ia: 'bg-fundo-suave text-apoio',
        contorno: 'border-2 border-borda bg-white text-sutil',
      },
      size: {
        lg: 'rounded-[8px] px-2.5 h-7 min-w-7 gap-1.5 text-[14px] [&_svg]:size-4',
        md: 'rounded-[8px] px-2 h-6 min-w-6 gap-1 text-[13px] [&_svg]:size-3.5',
        sm: 'rounded-[8px] px-1.5 h-5 min-w-5 gap-1 text-[12px] leading-none [&_svg]:size-3',
      },
      shape: { default: '', circle: 'rounded-full' },
    },
    defaultVariants: { variant: 'ia', size: 'md', shape: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, shape, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, size, shape }), className)} {...props} />;
}

export { Badge, badgeVariants };
