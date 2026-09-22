import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* file-card-collections (21st.dev) — a miniatura de arquivo que o Gabriel escolheu (20/09/2026) para documento no chat.
   Fica o desenho: a folhinha com o "esqueleto" do conteúdo (linhas de texto, grade de planilha, slide, imagem) e a
   etiqueta do formato saindo pelo canto. Vestida na adoção:
   · a etiqueta não usa as dez cores do original (PDF vermelho, DOC azul, XLS verde…): o produto tem três cores,
     então ela é preta, cinza ou o laranja da pinta; quem distingue o formato é a SIGLA e o esqueleto;
   · saíram os formatos de código e de pacote (zip, js, css…): professor não anexa isso;
   · entraram os ARTEFATOS do produto (prova, lista, plano, rubrica, slides, material, versão adaptada), para a
     Biblioteca usar a mesma linguagem; e três tamanhos — `sm` no campo do chat, `md` na lista, `lg` na Biblioteca;
   · (20/09, segunda passada: "precisa melhorar eles") a folha ganhou o CANTO DOBRADO, o contorno acompanha o recorte
     (drop-shadow, não ring) e as linhas do esqueleto ficaram mais escuras: de longe já se lê que é um documento. */

export type FormatoArquivo =
  | "pdf" | "doc" | "docx" | "txt" | "md" | "xls" | "xlsx" | "csv" | "ppt" | "pptx" | "png" | "jpg" | "jpeg" | "img"
  | "prova" | "lista" | "plano" | "rubrica" | "slides" | "material" | "adaptada";

type Esqueleto = "texto" | "planilha" | "slide" | "imagem" | "questoes" | "tabela" | "passos";

const FORMATOS: Record<FormatoArquivo, { sigla: string; etiqueta: string; esqueleto: Esqueleto }> = {
  pdf: { sigla: "pdf", etiqueta: "bg-tinta text-white", esqueleto: "texto" },
  doc: { sigla: "doc", etiqueta: "bg-apoio text-white", esqueleto: "texto" },
  docx: { sigla: "docx", etiqueta: "bg-apoio text-white", esqueleto: "texto" },
  txt: { sigla: "txt", etiqueta: "bg-inativo text-white", esqueleto: "texto" },
  md: { sigla: "md", etiqueta: "bg-inativo text-white", esqueleto: "texto" },
  xls: { sigla: "xls", etiqueta: "bg-sutil text-white", esqueleto: "planilha" },
  xlsx: { sigla: "xlsx", etiqueta: "bg-sutil text-white", esqueleto: "planilha" },
  csv: { sigla: "csv", etiqueta: "bg-sutil text-white", esqueleto: "planilha" },
  ppt: { sigla: "ppt", etiqueta: "bg-caramelo text-tinta", esqueleto: "slide" },
  pptx: { sigla: "pptx", etiqueta: "bg-caramelo text-tinta", esqueleto: "slide" },
  png: { sigla: "png", etiqueta: "bg-inativo text-white", esqueleto: "imagem" },
  jpg: { sigla: "jpg", etiqueta: "bg-inativo text-white", esqueleto: "imagem" },
  jpeg: { sigla: "jpg", etiqueta: "bg-inativo text-white", esqueleto: "imagem" },
  img: { sigla: "img", etiqueta: "bg-inativo text-white", esqueleto: "imagem" },
  prova: { sigla: "prova", etiqueta: "bg-tinta text-white", esqueleto: "questoes" },
  lista: { sigla: "lista", etiqueta: "bg-apoio text-white", esqueleto: "questoes" },
  plano: { sigla: "plano", etiqueta: "bg-caramelo text-tinta", esqueleto: "passos" },
  rubrica: { sigla: "rubrica", etiqueta: "bg-sutil text-white", esqueleto: "tabela" },
  slides: { sigla: "slides", etiqueta: "bg-caramelo text-tinta", esqueleto: "slide" },
  material: { sigla: "texto", etiqueta: "bg-apoio text-white", esqueleto: "texto" },
  adaptada: { sigla: "adaptada", etiqueta: "bg-tinta text-white", esqueleto: "questoes" },
};

/** Descobre o formato pelo nome do arquivo. O que não conhece vira "pdf" só para ter folhinha. */
export function formatoDe(nome: string): FormatoArquivo {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  return (ext in FORMATOS ? ext : "pdf") as FormatoArquivo;
}

const L = ({ w, forte = false }: { w: string; forte?: boolean }) => <div className={cn("h-0.5 rounded-full", forte ? "bg-tinta/50" : "bg-tinta/[.16]", w)} />;

const ESQUELETOS: Record<Esqueleto, ReactNode> = {
  texto: (
    <div className="space-y-1.5">
      <L w="w-1/2" forte />
      <div className="flex gap-1"><L w="w-1/3" /><L w="w-1/3" /></div>
      <div className="flex gap-1"><L w="w-1/2" /><L w="w-1/3" /></div>
      <div className="flex gap-1"><L w="w-1/3" /><L w="w-1/2" /></div>
      <L w="w-2/3" />
      <L w="w-1/3" />
    </div>
  ),
  questoes: (
    <div className="space-y-1.5">
      <L w="w-1/2" forte />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <span className={cn("size-1 shrink-0 rounded-full", i === 1 ? "bg-caramelo" : "ring-[0.5px] ring-tinta/40")} />
          <L w={i % 2 ? "w-1/2" : "w-2/3"} />
        </div>
      ))}
    </div>
  ),
  planilha: (
    <div className="space-y-0.5">
      <div className="grid grid-cols-3 gap-0.5">{[0, 1, 2].map((i) => <div key={i} className="h-1.5 bg-tinta/25" />)}</div>
      {[3, 3, 2, 1].map((n, l) => <div key={l} className="grid grid-cols-3 gap-0.5">{Array.from({ length: n }, (_, i) => <div key={i} className="h-1.5 bg-tinta/[.07]" />)}</div>)}
    </div>
  ),
  tabela: (
    <div className="space-y-1">
      <L w="w-1/2" forte />
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[2px] bg-tinta/15 p-px">{Array.from({ length: 9 }, (_, i) => <div key={i} className={cn("h-1.5", i < 3 ? "bg-[#FBD9C3]" : "bg-white")} />)}</div>
    </div>
  ),
  slide: (
    <>
      <div className="mb-1.5 space-y-1 rounded-[3px] bg-tinta/[.05] p-1 ring-[0.5px] ring-tinta/15">
        <div className="flex items-end justify-center gap-0.5"><div className="h-1.5 w-1 rounded-[1px] bg-tinta/25" /><div className="h-2.5 w-1 rounded-[1px] bg-caramelo" /><div className="h-3 w-1 rounded-[1px] bg-tinta/60" /></div>
        <div className="mx-auto h-0.5 w-2/3 rounded-full bg-tinta/20" />
      </div>
      <div className="space-y-1"><L w="w-2/3" /><L w="w-1/2" /></div>
    </>
  ),
  imagem: (
    <div className="space-y-1.5">
      <div className="relative h-7 overflow-hidden rounded-[3px] bg-tinta/[.06] ring-[0.5px] ring-tinta/15">
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-caramelo" />
        <span className="absolute -bottom-2 left-0.5 size-5 rotate-45 bg-tinta/20" /><span className="absolute -bottom-3 left-4 size-5 rotate-45 bg-tinta/35" />
      </div>
      <L w="w-2/3" /><L w="w-1/3" />
    </div>
  ),
  passos: (
    <div className="space-y-1.5">
      <L w="w-1/2" forte />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <span className={cn("grid size-1.5 shrink-0 place-items-center rounded-full", i === 0 ? "bg-tinta" : i === 1 ? "bg-caramelo" : "ring-[0.5px] ring-tinta/40")} />
          <L w={i === 1 ? "w-2/3" : "w-1/2"} />
        </div>
      ))}
    </div>
  ),
};

const TAMANHOS = {
  sm: { folha: "h-11 w-9 p-1.5 rounded-[5px]", dobra: 7, etiqueta: "-right-1.5 bottom-1 px-1 py-px text-[6.5px]", escala: "origin-top-left scale-[.62] w-[160%]" },
  md: { folha: "h-[72px] w-14 p-2 rounded-md", dobra: 11, etiqueta: "-right-2 bottom-1.5 px-1.5 py-0.5 text-[8px]", escala: "" },
  lg: { folha: "h-[112px] w-[88px] p-3 rounded-[10px]", dobra: 17, etiqueta: "-right-2.5 bottom-2.5 px-2 py-0.5 text-[10px]", escala: "origin-top-left scale-[1.5] w-[66.7%]" },
};

export function FileCard({ formatFile, tamanho = "md", className }: { formatFile: FormatoArquivo; tamanho?: keyof typeof TAMANHOS; className?: string }) {
  const f = FORMATOS[formatFile];
  const t = TAMANHOS[tamanho];
  const d = t.dobra;
  return (
    <div aria-hidden className={cn("relative size-fit shrink-0", className)}>
      <div className={cn("absolute z-[2] rounded-[4px] font-semibold uppercase leading-tight tracking-wide shadow-[0_1px_2px_rgba(0,0,0,.18)]", t.etiqueta, f.etiqueta)}>{f.sigla}</div>
      {/* o contorno é drop-shadow para acompanhar o canto recortado */}
      <div className="relative z-[1] [filter:drop-shadow(0_0_0.6px_rgba(0,0,0,.45))_drop-shadow(0_1.5px_2px_rgba(0,0,0,.08))]">
        <div className={cn("relative overflow-hidden bg-white", t.folha)} style={{ clipPath: `polygon(0 0, calc(100% - ${d}px) 0, 100% ${d}px, 100% 100%, 0 100%)` }}>
          <div className={t.escala}>{ESQUELETOS[f.esqueleto]}</div>
          <span className="absolute right-0 top-0 bg-[#D9D9D9]" style={{ width: d, height: d, clipPath: "polygon(0 0, 100% 100%, 0 100%)", borderBottomLeftRadius: 3 }} />
        </div>
      </div>
    </div>
  );
}

export default FileCard;
