"use client"

/* file-upload (21st.dev) — a área de soltar arquivo que o Gabriel escolheu (20/09/2026) para documento no chat.
   Fica a anatomia: o leque de três ícones que se abre quando o arquivo passa por cima, o contorno tracejado, o
   título, a linha de formatos, a pílula "Procurar arquivos" e a lista do que entrou.
   Vestida na adoção:
   · ícones do lucide (o padrão do produto) no lugar do @hugeicons, como o próprio guia da peça sugere;
   · SAIU o `border-beam`: é um feixe azul girando, fora da paleta e fora da regra de movimento (só transform e
     opacity, sem laço decorativo). Ao arrastar, o contorno fica laranja e o fundo clareia;
   · a miniatura da lista é o `file-card-collections`, a outra peça que ele mandou;
   · português, e a recusa diz por quê. */

import * as React from "react"
import { FileImage, FileSpreadsheet, FileText, Upload, X, type LucideIcon } from "lucide-react"
import { FileCard, formatoDe } from "@/components/ui/file-card-collections"
import { cn } from "@/lib/utils"

export type ArquivoAnexado = { id: string; name: string; type: string; size: number }

type FileUploadProps = {
  accept?: string
  className?: string
  title?: string
  description?: string
  browseLabel?: string
  draggingLabel?: string
  multiple?: boolean
  showFileList?: boolean
  files?: ArquivoAnexado[]
  onFilesChange?: (files: ArquivoAnexado[]) => void
}

const ICONES: { label: string; icon: LucideIcon }[] = [{ label: "Imagem", icon: FileImage }, { label: "PDF", icon: FileText }, { label: "Planilha", icon: FileSpreadsheet }]
const DEFAULT_ACCEPT = [".pdf", ".doc", ".docx", ".pptx", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"].join(",")
const LEQUE = [
  { idle: "translate(-78%, -50%) rotate(-8deg)", active: "translate(-114%, -50%) rotate(-12deg) scale(1.08)" },
  { idle: "translate(-50%, -50%) rotate(0deg)", active: "translate(-50%, -50%) rotate(0deg) scale(1.18)" },
  { idle: "translate(-22%, -50%) rotate(8deg)", active: "translate(14%, -50%) rotate(12deg) scale(1.08)" },
]

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1).replace(".", ",")} ${units[i]}`
}

const aceita = (file: File, accept: string) => accept.split(",").some((t) => file.name.toLowerCase().endsWith(t.trim().toLowerCase()))

export function FileUpload({
  accept = DEFAULT_ACCEPT, className, multiple = true, showFileList = true, files, onFilesChange,
  title = "Clique ou solte os arquivos aqui", description = "PDF, Word, PowerPoint, Excel, CSV, PNG ou JPG · até 20 MB cada",
  browseLabel = "Procurar arquivos", draggingLabel = "Solte para anexar",
}: FileUploadProps) {
  const profundidade = React.useRef(0)
  const input = React.useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = React.useState(false)
  const [internos, setInternos] = React.useState<ArquivoAnexado[]>([])
  const [recusa, setRecusa] = React.useState<string | null>(null)
  const lista = files ?? internos

  const guardar = (proxima: ArquivoAnexado[]) => { if (!files) setInternos(proxima); onFilesChange?.(proxima) }

  const entrar = (novos: FileList | File[]) => {
    const todos = Array.from(novos)
    const bons = todos.filter((f) => aceita(f, accept)).slice(0, multiple ? undefined : 1)
    setRecusa(bons.length < todos.length ? "Alguns arquivos ficaram de fora: o formato não é aceito aqui." : null)
    if (bons.length === 0) return
    const itens = bons.map((f) => ({ id: `${f.name}-${f.size}-${f.lastModified}`, name: f.name, type: f.type, size: f.size }))
    guardar([...lista.filter((a) => !itens.some((i) => i.id === a.id)), ...itens])
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div role="button" tabIndex={0} aria-label={title}
        className={cn("relative flex min-h-52 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[18px] border border-dashed px-6 py-8 text-center transition-[border-color,background-color] duration-200 ease-out motion-reduce:transition-none",
          arrastando ? "border-caramelo bg-pendente-cx" : "border-borda-campo bg-superficie hover:border-inativo hover:bg-lateral")}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click() } }}
        onDragEnter={(e) => { e.preventDefault(); profundidade.current += 1; setArrastando(true) }}
        onDragLeave={(e) => { e.preventDefault(); profundidade.current = Math.max(0, profundidade.current - 1); if (profundidade.current === 0) setArrastando(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); profundidade.current = 0; setArrastando(false); if (e.dataTransfer.files.length) entrar(e.dataTransfer.files) }}>
        <div className="relative h-14 w-36">
          {ICONES.map((item, i) => (
            <div key={item.label} style={{ transform: arrastando ? LEQUE[i].active : LEQUE[i].idle }}
              className={cn("absolute left-1/2 top-1/2 grid size-12 place-items-center rounded-[14px] bg-superficie text-sutil shadow-[0_0_0_1px_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.06)] transition-[transform,color,box-shadow] duration-500 ease-entrada motion-reduce:transition-none",
                i === 1 && "z-10", arrastando && "text-tinta shadow-[0_0_0_1px_rgba(0,0,0,.08),0_6px_16px_-4px_rgba(0,0,0,.18)]")}>
              <item.icon className="size-5" strokeWidth={1.75} />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-tinta">{title}</p>
          <p className="text-xs text-sutil">{description}</p>
          {recusa && <p className="text-xs text-erro">{recusa}</p>}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-borda-campo bg-superficie px-3 py-1 text-xs font-medium text-apoio">
          <Upload className="size-3.5" /> {arrastando ? draggingLabel : browseLabel}
        </span>
        <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={(e) => { if (e.target.files) { entrar(e.target.files); e.currentTarget.value = "" } }} />
      </div>

      {showFileList && lista.length > 0 && (
        <ul className="divide-y divide-linha overflow-hidden rounded-cartao border border-linha bg-superficie">
          {lista.map((a) => (
            <li key={a.id} className="flex items-center gap-3.5 px-3 py-2">
              <FileCard formatFile={formatoDe(a.name)} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{a.name}</p>
                <p className="truncate text-xs text-sutil">{formatBytes(a.size)}</p>
              </div>
              <button type="button" onClick={() => guardar(lista.filter((x) => x.id !== a.id))} aria-label={`Tirar ${a.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta"><X className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileUpload
