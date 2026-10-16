import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* sean0205/badge-2 (21st.dev · 3560, MIT). Veio com uma dúzia de variantes em cor viva e 26 `dark:`.
   Na adoção ficam só as cinco famílias da 9.1 — pendente, ok, erro, info, ia — e o resto sai (10.2).
   Estado nunca é só cor: o selo sempre leva texto ou ícone. */
const badgeVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap border border-transparent font-medium [&_svg]:-ms-px [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        pendente: 'bg-pendente-cx text-pendente',
        ok: 'bg-ok-cx text-ok',
        erro: 'bg-erro-cx text-erro',
        info: 'bg-info-cx text-info',
        ia: 'bg-ia-cx text-ia',
        contorno: 'border-borda-campo bg-superficie text-sutil',
      },
      size: {
        lg: 'rounded-full px-3 h-7 min-w-7 gap-1.5 text-[13px] [&_svg]:size-3.5',
        md: 'rounded-full px-2.5 h-6 min-w-6 gap-1.5 text-xs [&_svg]:size-3.5',
        sm: 'rounded-full px-2 h-5 min-w-5 gap-1 text-[11.5px] leading-none [&_svg]:size-3',
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
