import { Star } from 'lucide-react'
import { IconeFerramenta, LadrilhoFerramenta } from '@/components/turmma/icones-ferramenta'
import { CATALOGO } from '@/dados/ferramentas'

/* Bancada dos ícones das ferramentas (oitava rodada): os 17, fora de qualquer tela. Não está no menu.
   `/pecas/icones` mostra os tamanhos de uso — 40 px sobre o branco, que é o uso real (o cartão de 96 px do
   catálogo), 56 px e 104 px; `/pecas/icones?lupa` mostra os 17 ampliados, para conferir o desenho
   (`/pecas/icones?lupa&grande` amplia mais, em página que rola). */
export function PecasIcones() {
  if (window.location.search.includes('lupa')) {
    const grande = window.location.search.includes('grande')
    return (
      <ul className={grande ? 'grid grid-cols-2 gap-2 bg-superficie p-4 sm:grid-cols-3 xl:grid-cols-6' : 'grid grid-cols-2 gap-x-2 gap-y-3 bg-superficie p-4 sm:grid-cols-4 xl:grid-cols-9'}>
        {CATALOGO.map((f) => (
          <li key={f.id} className="flex flex-col items-center gap-1 rounded-cartao border border-linha p-2">
            <IconeFerramenta id={f.id} className={grande ? 'aspect-square w-full max-w-[220px]' : 'size-[136px]'} />
            <span className="text-[12px] text-sutil">{f.id}</span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="mx-auto grid min-h-full max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-3 bg-superficie p-4 sm:px-6">
      {/* 40 px, sem legenda, soltos sobre o branco: dá para saber o que é? */}
      <div className="flex flex-wrap items-center gap-x-[38px] gap-y-3">
        {CATALOGO.map((f) => <IconeFerramenta key={f.id} id={f.id} className="size-10" />)}
      </div>
      {/* 40 px no cartão do catálogo: 96 px de altura, área de 109 × 40 com o ícone no centro, nome e duas linhas */}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CATALOGO.slice(0, 9).map((f) => (
          <li key={f.id} className="group relative flex h-24 min-w-0 items-center gap-4 rounded-[8px] border border-linha bg-superficie p-4 font-teachy-corpo transition-colors hover:border-borda-campo">
            <span className="grid h-10 w-[109px] shrink-0 place-items-center"><LadrilhoFerramenta id={f.id} tamanho="sm" /></span>
            <span className="min-w-0 flex-1 pr-5">
              <span className="block truncate font-teachy text-[16px] font-bold leading-7 text-noite-alto">{f.nome}</span>
              <span className="line-clamp-2 text-[12px] leading-4 text-sutil">{f.texto}</span>
            </span>
            <Star aria-hidden className="absolute right-3 top-3 size-5 text-inativo" strokeWidth={1.75} />
          </li>
        ))}
      </ul>
      {/* 32 px: o tamanho das listas de Recursos e do Mural */}
      <div className="flex flex-wrap items-center gap-x-[46px] gap-y-3">
        {CATALOGO.map((f) => <IconeFerramenta key={f.id} id={f.id} className="size-8" />)}
      </div>
      {/* 56 px, com o nome */}
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-[repeat(17,minmax(0,1fr))]">
        {CATALOGO.map((f) => (
          <li key={f.id} className="flex flex-col items-center gap-1.5 text-center">
            <IconeFerramenta id={f.id} className="size-14" />
            <span className="text-[11px] leading-tight text-sutil">{f.nome}</span>
          </li>
        ))}
      </ul>
      {/* 104 px: o desenho de perto */}
      <div className="flex flex-wrap items-center gap-x-[42px] gap-y-3">
        {CATALOGO.map((f) => <IconeFerramenta key={f.id} id={f.id} className="size-[104px]" />)}
      </div>
    </div>
  )
}
