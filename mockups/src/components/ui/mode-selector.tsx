"use client";

/* serafimcloud/mode-selector (21st.dev, MIT) — o seletor em pílula da caixa de pedido. Vestido na adoção:
   o menu deixou de ser uma lista solta, que crescia até sair da tela, e virou um RETÂNGULO DE TAMANHO FIXO
   (320 px de largura, até 292 px de lista) com rolagem por dentro (shadcn/scroll-area). Quem posiciona é o
   shadcn/popover (Radix): ele mede o espaço livre, encolhe a lista quando a janela é baixa e vira para cima
   se não couber embaixo. A sexta linha aparece cortada de propósito, com um esfumado: é o aviso de que há mais.

   20/09/2026 — o Gabriel pediu o menu "Para qual turma" mais bonito (eram quatro linhas só de texto). A opção ganhou
   três campos OPCIONAIS, e quem não usa nenhum (o menu de Ferramentas) sai exatamente como saía:
   · `selo`  — texto curto no ladrilho de 32 px, no lugar do ícone ("2ºB"); preto com letra branca na escolhida;
   · `nome`  — a primeira linha DENTRO do menu, quando ela é diferente do que a pílula mostra (pílula "2ºB · Química",
               linha "Química", porque o "2ºB" já está no ladrilho);
   · `grupo` — rótulo cinza que abre um grupo (a escola). Opções seguidas com o mesmo `grupo` ficam juntas, e um fio
               separa um grupo do outro. */

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check as IconCheck, ChevronDown as IconChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ModeOption = {
  id: string;
  /** o que a pílula mostra quando esta é a opção escolhida */
  label: string;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
  /** texto curto no ladrilho, no lugar do ícone (ex.: o código da turma, "2ºB") */
  selo?: string;
  /** a primeira linha dentro do menu, quando é diferente de `label` */
  nome?: string;
  /** rótulo do grupo a que a opção pertence (ex.: a escola) */
  grupo?: string;
};

export type ModeSelectorProps = {
  modes: ModeOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (modeId: string) => void;
  className?: string;
  /** para onde o menu abre: na Home abre para baixo, na conversa (caixa presa embaixo) para cima */
  side?: "top" | "bottom";
  align?: "start" | "end";
  ariaLabel?: string;
  /** título pequeno no topo do retângulo, ex.: "Ferramentas" */
  titulo?: string;
  /** enquanto o valor for este, a pílula mostra outro rótulo (ex.: "Ferramenta"), e a lista o nome de verdade */
  neutro?: { id: string; label: string; icon?: ComponentType<{ className?: string }> };
  /** separa a primeira opção das outras com um fio: ela é de outra natureza ("Só conversar") */
  separarPrimeira?: boolean;
};

export const ModeSelector = memo(function ModeSelector({
  modes,
  value,
  defaultValue,
  onChange,
  className,
  side = "top",
  align = "start",
  ariaLabel,
  titulo,
  neutro,
  separarPrimeira,
}: ModeSelectorProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeMode = modes.find((m) => m.id === activeId) ?? modes[0];
  const [open, setOpen] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const viewport = useRef<HTMLDivElement | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      if (!isControlled) setInternalValue(id);
      onChange?.(id);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  const medir = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    setTemMais(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  // Ao abrir: leva a opção marcada para dentro do retângulo e confere se sobra lista abaixo.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      viewport.current?.querySelector<HTMLElement>("[data-ativo=true]")?.scrollIntoView({ block: "nearest" });
      medir();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, medir]);

  if (modes.length === 0) return null;
  const hasMultiple = modes.length > 1;
  const noNeutro = neutro && activeMode?.id === neutro.id;
  const TriggerIcon = noNeutro ? neutro.icon : activeMode?.icon;

  const trigger = (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] leading-4 text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta cursor-pointer",
        !hasMultiple && "pointer-events-none",
        className,
      )}
      aria-label={ariaLabel ?? "Escolher"}
    >
      {TriggerIcon && <TriggerIcon className="size-4 shrink-0" />}
      <span className="font-medium">{noNeutro ? neutro.label : activeMode?.label}</span>
      {hasMultiple && (
        <IconChevronDown className={cn("size-3.5 opacity-60 transition-transform duration-150", open && "rotate-180")} />
      )}
    </button>
  );

  if (!hasMultiple) return trigger;

  const linha = (mode: ModeOption) => {
    const isActive = mode.id === activeMode?.id;
    const Icon = mode.icon;
    return (
      <button
        type="button"
        role="option"
        aria-selected={isActive}
        aria-label={mode.nome ? `${mode.label}${mode.description ? `, ${mode.description}` : ""}` : undefined}
        data-ativo={isActive}
        onClick={() => handleSelect(mode.id)}
        className="flex w-full items-center gap-3 rounded-linha px-2 py-2 text-left transition-colors duration-150 hover:bg-realce-suave cursor-pointer"
      >
        {(Icon || mode.selo) && (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-[9px] transition-colors duration-150", isActive ? "bg-tinta text-white" : "bg-realce-suave text-tinta")}>
            {Icon ? <Icon className="size-4" /> : <span className="text-xs font-semibold leading-none">{mode.selo}</span>}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium leading-[1.35] text-tinta">{mode.nome ?? mode.label}</span>
          {mode.description && (
            <span className="block truncate text-[12.5px] leading-[1.35] text-sutil">{mode.description}</span>
          )}
        </span>
        {isActive && <IconCheck className="size-4 shrink-0 text-tinta" />}
      </button>
    );
  };

  // Opções seguidas com o mesmo `grupo` formam um bloco com rótulo. Sem `grupo`, a lista sai corrida, como sempre saiu.
  const blocos: { grupo?: string; itens: ModeOption[] }[] = [];
  for (const m of modes) {
    const ultimo = blocos[blocos.length - 1];
    if (ultimo && ultimo.grupo === m.grupo) ultimo.itens.push(m);
    else blocos.push({ grupo: m.grupo, itens: [m] });
  }
  const agrupado = blocos.some((b) => b.grupo);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-cartao border-0 bg-superficie p-0 text-tinta shadow-flutua"
      >
        {titulo && <p className="rotulo px-3.5 pb-1 pt-3">{titulo}</p>}
        <div className="relative">
          <ScrollArea
            viewportRef={viewport}
            onViewportScroll={medir}
            viewportClassName="max-h-[min(292px,calc(var(--radix-popover-content-available-height)_-_44px))]"
          >
            <div role="listbox" aria-label={ariaLabel} className="grid gap-0.5 p-1.5">
              {agrupado
                ? blocos.map((b, i) => (
                    <div key={b.grupo ?? i} role="group" aria-label={b.grupo} className="grid gap-0.5">
                      {i > 0 && <div aria-hidden className="mx-2 my-1 h-px bg-linha" />}
                      {b.grupo && <p aria-hidden className="truncate px-2 pb-0.5 pt-1.5 text-xs leading-4 text-inativo">{b.grupo}</p>}
                      {b.itens.map((mode) => <div key={mode.id}>{linha(mode)}</div>)}
                    </div>
                  ))
                : modes.map((mode, i) => (
                    <div key={mode.id} className="grid gap-0.5">
                      {linha(mode)}
                      {separarPrimeira && i === 0 && <div aria-hidden className="mx-2 my-1 h-px bg-linha" />}
                    </div>
                  ))}
            </div>
          </ScrollArea>
          <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-cartao bg-linear-to-t from-superficie to-transparent transition-opacity duration-150", temMais ? "opacity-100" : "opacity-0")} />
        </div>
      </PopoverContent>
    </Popover>
  );
});
