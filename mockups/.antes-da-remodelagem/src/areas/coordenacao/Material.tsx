import { useState, type ReactNode } from 'react'
import { Ban, FileText, RotateCw, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Campo } from '@/components/turmma/ferramentas'
import { Estado } from '@/components/turmma/ia'
import { NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { MATERIAIS } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO } from './_a-pecas'

/* Material: fontes com TITULARIDADE e LICENÇA, e o estado da ingestão — o que entrou, o que está processando,
   o que falhou e o que foi RECUSADO por falta de licença (D5 revista). Envio com haydenbleasel/dropzone (21st.dev · 542):
   a licença é campo obrigatório e, sem ela declarada, a tela recusa ANTES de enviar. */

type EstadoIngestao = 'pronto' | 'processando' | 'falhou' | 'recusado'
type Fonte = { id: string; titulo: string; capitulo: string; paginas: number; titular: string; licenca: string; estado: EstadoIngestao; trechos: number; detalhe?: string }

const FONTES: Fonte[] = [
  ...MATERIAIS.map((m) => ({ ...m, estado: m.estado as EstadoIngestao })),
  { id: 'bio', titulo: 'Biologia 1 — Caderno do professor', capitulo: 'cap. 2 · Citologia', paginas: 164, titular: 'Colégio Aurora',
    licenca: 'Material próprio da escola', estado: 'falhou', trechos: 0, detalhe: 'PDF digitalizado sem texto nas páginas 40 a 72. Envie de novo com o texto reconhecido.' },
]

const LICENCAS = [
  { id: 'proprio', nome: 'Material próprio da escola', entra: true },
  { id: 'contrato', nome: 'Licenciado por contrato com o dono do conteúdo', entra: true },
  { id: 'cc', nome: 'Licença aberta (Creative Commons ou domínio público)', entra: true },
  { id: 'sem', nome: 'Não sei / não tenho a licença', entra: false },
]

const ROTULO: Record<EstadoIngestao, ReactNode> = {
  pronto: <Estado tipo="ok">Pronto</Estado>,
  processando: <Estado tipo="pendente">Processando</Estado>,
  falhou: <Estado tipo="erro">Falhou</Estado>,
  recusado: <Estado tipo="erro">Recusado · sem licença</Estado>,
}

function Envio({ aoFechar, aoEnviar }: { aoFechar: () => void; aoEnviar: (titulo: string) => void }) {
  const [arquivos, setArquivos] = useState<File[] | undefined>()
  const [licenca, setLicenca] = useState('')
  const [declaro, setDeclaro] = useState(false)
  const escolhida = LICENCAS.find((l) => l.id === licenca)
  const recusa = escolhida && !escolhida.entra
  const pode = !!arquivos?.length && !!escolhida?.entra && declaro

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (pode) aoEnviar(arquivos![0].name.replace(/\.pdf$/i, '')) }}>
      <Dropzone src={arquivos} accept={{ 'application/pdf': ['.pdf'] }} maxFiles={1} maxSize={80 * 1024 * 1024} onDrop={setArquivos}
        className="h-auto min-h-[132px] whitespace-normal rounded-cartao border-dashed border-borda-campo bg-fundo p-6 font-normal hover:bg-realce">
        <DropzoneEmptyState>
          <span className="grid size-10 place-items-center rounded-controle bg-ia-cx text-apoio"><Upload className="size-5" /></span>
          <span className="mt-2 text-[15px] font-semibold text-tinta">Arraste o PDF aqui, ou clique para escolher</span>
          <span className="text-[13px] text-sutil">Um arquivo por vez · PDF de até 80 MB</span>
        </DropzoneEmptyState>
        <DropzoneContent>
          <span className="grid size-10 place-items-center rounded-controle bg-ok-cx text-ok"><FileText className="size-5" /></span>
          <span className="mt-2 max-w-full truncate text-[15px] font-semibold text-tinta">{arquivos?.[0]?.name}</span>
          <span className="text-[13px] text-sutil">Clique para trocar o arquivo</span>
        </DropzoneContent>
      </Dropzone>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Quem é o dono do conteúdo">{(id) => <Input id={id} required placeholder="Ex.: Colégio Aurora" autoComplete="organization" className="h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10" />}</Campo>
        <Campo rotulo="Licença de uso (obrigatório)">{(id) => (
          <Select value={licenca} onValueChange={setLicenca}>
            <SelectTrigger id={id} className={cn('h-11 rounded-controle bg-superficie text-[15px] md:h-10', recusa ? 'border-erro' : 'border-borda-campo')}><SelectValue placeholder="Escolha a licença" /></SelectTrigger>
            <SelectContent className="rounded-controle">{LICENCAS.map((l) => <SelectItem key={l.id} value={l.id} className="rounded-linha">{l.nome}</SelectItem>)}</SelectContent>
          </Select>
        )}</Campo>
      </div>

      {recusa ? (
        <Aviso tom="erro" titulo="Este arquivo não vai ser enviado">
          Sem licença declarada, o material não entra — nem por aqui, nem por nenhum outro caminho. Nada foi enviado nem lido.
          Apostila de sistema de ensino precisa de licença ou parceria com o dono do conteúdo. Fale com a gente se a escola tem o contrato.
        </Aviso>
      ) : (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-controle border border-linha p-3 text-[15px] leading-snug text-tinta">
          <Checkbox checked={declaro} onCheckedChange={(v) => setDeclaro(v === true)}
            className="mt-0.5 size-5 rounded-[6px] border-borda-campo data-[state=checked]:border-noite data-[state=checked]:bg-noite data-[state=checked]:text-white" />
          Declaro, em nome da escola, que ela tem o direito de usar este material com os alunos. A declaração fica registrada com meu nome e a data.
        </label>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="discreto" onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" disabled={!pode}>{recusa ? 'Envio recusado' : 'Enviar material'}</Button>
      </div>
    </form>
  )
}

export function Material() {
  const [fontes, setFontes] = useState(FONTES)
  const [enviando, setEnviando] = useState(false)
  const conta = (e: EstadoIngestao) => fontes.filter((f) => f.estado === e).length

  return (
    <Tela titulo="Material"
      descricao="Tudo que os agentes citam sai daqui. Cada fonte tem dono e licença; o que não tem licença não entra."
      acoes={<Button onClick={() => setEnviando(true)}><Upload /> Enviar material</Button>}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumeroPainel rotulo="Prontas para uso" valor={conta('pronto')} apoio="3.052 trechos com página" />
        <NumeroPainel rotulo="Processando" valor={conta('processando')} apoio="fora do horário de aula, quando é lote" />
        <NumeroPainel rotulo="Falharam" valor={conta('falhou')} apoio={<span className="font-medium text-erro">pedem um novo envio</span>} />
        <NumeroPainel rotulo="Recusadas" valor={conta('recusado')} apoio="por falta de licença" />
      </div>

      <Aviso tom="info" className="mt-4" titulo="O material é da escola, e fica na escola">
        O que você envia fica preso ao Colégio Aurora: não vai para outra escola, não vira banco nosso e não treina modelo.
        Apostila de terceiro sem licença não entra por nenhum caminho.
      </Aviso>

      <ul className="mt-4 grid gap-3">
        {fontes.map((f) => (
          <li key={f.id} className={cn('rounded-cartao border bg-superficie p-4 lg:p-5', f.estado === 'recusado' ? 'border-dashed border-borda-campo' : 'border-linha')}>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-controle', f.estado === 'recusado' ? 'bg-erro-cx text-erro' : 'bg-realce-suave text-tinta')}>
                {f.estado === 'recusado' ? <Ban className="size-5" /> : <FileText className="size-5" />}
              </span>
              <div className="min-w-0 flex-1 basis-[260px]">
                <h2 className="font-corpo text-base font-semibold leading-snug text-tinta">{f.titulo}</h2>
                <p className="text-sm text-sutil">{f.capitulo}{f.paginas > 0 && ` · ${f.paginas} páginas`}{f.trechos > 0 && ` · ${f.trechos.toLocaleString('pt-BR')} trechos indexados`}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">{ROTULO[f.estado]}</div>
            </div>

            <dl className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex gap-2"><dt className="shrink-0 text-sutil">Dono do conteúdo</dt><dd className="font-medium text-tinta">{f.titular}</dd></div>
              <div className="flex gap-2"><dt className="shrink-0 text-sutil">Licença</dt>
                <dd className={cn('inline-flex items-center gap-1.5 font-medium', f.estado === 'recusado' ? 'text-erro' : 'text-tinta')}>
                  {f.estado !== 'recusado' && <ShieldCheck className="size-4 text-ok" />}{f.licenca}
                </dd>
              </div>
            </dl>

            {f.estado === 'processando' && (
              <div className="mt-3">
                <Progress value={62} aria-label="62% processado" className="h-2 rounded-full bg-ia-cx [&>div]:bg-caramelo" />
                <p className="mt-1.5 text-[13px] text-sutil">Lendo as páginas e separando por capítulo · 60 de 96 páginas. Você pode sair desta tela.</p>
              </div>
            )}
            {f.estado === 'falhou' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-controle bg-erro-cx p-3">
                <p className="min-w-0 flex-1 basis-[240px] text-sm leading-snug text-erro">{f.detalhe}</p>
                <Button variant="secundario" size="sm" onClick={() => setFontes((l) => l.map((x) => x.id === f.id ? { ...x, estado: 'processando' } : x))}><RotateCw /> Tentar de novo</Button>
              </div>
            )}
            {f.estado === 'recusado' && (
              <p className="mt-3 rounded-controle bg-erro-cx p-3 text-sm leading-snug text-erro">
                Recusado antes de enviar, em 15/09: o arquivo não foi lido nem guardado. Para usar este material, a escola precisa de licença ou parceria com o dono do conteúdo.
              </p>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={enviando} onOpenChange={setEnviando}>
        <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[92svh] max-w-xl overflow-y-auto')}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Enviar material</DialogTitle>
            <DialogDescription className="text-[15px] text-apoio">O arquivo só sai do seu computador depois de a licença estar declarada.</DialogDescription>
          </DialogHeader>
          <Envio aoFechar={() => setEnviando(false)} aoEnviar={(titulo) => {
            setFontes((l) => [{ id: `n${l.length}`, titulo, capitulo: 'na fila de leitura', paginas: 0, titular: 'Colégio Aurora', licenca: 'Material próprio da escola', estado: 'processando', trechos: 0 }, ...l])
            setEnviando(false)
          }} />
        </DialogContent>
      </Dialog>

      <NotaMockup>
        Spec A2 (ingestão mínima, fatia do F4): upload de PDF com titularidade e licença, trechos com página, e recusa sem licença <b>antes</b> de
        extrair. No passo 1 do roteiro a coordenação mostra esta tela já com o material do seed. D5 revista e D22: só material com licença, começando
        pelo upload. Regra 60, item 10: o material pertence ao tenant da escola. Classificação BNCC completa, reprocessamento e adaptadores ficam para o F4.
      </NotaMockup>
    </Tela>
  )
}
