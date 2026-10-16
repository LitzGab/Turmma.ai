import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarIA, CabecaOnca, Onca, type AgenteIA, type PoseOnca } from '@/components/duo/onca'
import { FAMILIA_DO_ICONE, Icone, IDS_ICONE } from '@/components/duo/icones'

/* A BANCADA DA ONÇA E DOS ÍCONES (/fundamentos/onca): para olhar, não para ler.
   As 6 poses a 200, 120 e 72 px no branco e nos dois palcos permitidos (azul-claro e verde-claro),
   a cabeça nas 3 expressões, o avatar das 3 IAs e a grade dos ícones a 48, 32 e 24 px. */

const POSES: PoseOnca[] = ['acenando', 'comemorando', 'pensando', 'apontando', 'dormindo', 'acolhendo']
const PALCOS = [
  { nome: 'fundo', cor: 'var(--color-fundo)' },
  { nome: 'azul-claro', cor: 'var(--color-azul-claro)' },
  { nome: 'verde-claro', cor: 'var(--color-verde-claro)' },
]
const AGENTES: { id: AgenteIA; nome: string }[] = [
  { id: 'tutor', nome: 'Tutor' },
  { id: 'assistente', nome: 'Assistente' },
  { id: 'analista', nome: 'Analista' },
]

function Titulo({ children }: { children: string }) {
  return <h2 className="text-[20px] leading-[26px] font-bold text-tinta">{children}</h2>
}

export function BancadaOnca() {
  const [rodada, setRodada] = useState(0)
  const repetir = () => {
    try { sessionStorage.removeItem('turmma-onca-acenou') } catch { /* modo privado */ }
    setRodada((r) => r + 1)
  }
  return (
    <main className="min-h-dvh bg-white px-4 py-6 text-tinta md:px-10">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/fundamentos" className="rounded-xl border-2 border-borda px-3 py-2 text-[15px] font-bold tracking-[.04em] uppercase hover:bg-fundo-suave">← Fundamentos</Link>
            <h1 className="text-[24px] leading-[30px] font-bold">A onça e os ícones</h1>
          </div>
          <button
            type="button"
            onClick={repetir}
            className="rounded-xl bg-laranja px-4 py-2.5 text-[15px] font-bold tracking-[.04em] text-sobre-cor uppercase shadow-[0_4px_0_var(--color-laranja-degrau)] active:translate-y-1 active:shadow-none"
          >
            Repetir animação
          </button>
        </header>

        <section className="flex flex-col gap-4">
          <Titulo>Poses</Titulo>
          {PALCOS.map((p) => (
            <div key={p.nome} className="rounded-2xl border-2 border-borda" style={{ background: p.cor }}>
              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6 lg:p-4">
                {POSES.map((pose) => (
                  <figure key={pose} className="flex flex-col items-center gap-1">
                    <Onca key={`${rodada}-${pose}`} pose={pose} tamanho={p.nome === 'branco' ? 200 : 120} animada={p.nome === 'branco'} rotulo={`Onça ${pose}`} className={p.nome === 'branco' ? 'h-auto w-[150px] lg:w-[200px]' : undefined} />
                    <div className="flex items-end gap-2">
                      <Onca pose={pose} tamanho={72} animada={false} />
                      <Onca pose={pose} tamanho={48} animada={false} />
                    </div>
                    <figcaption className="text-[13px] font-bold tracking-[.04em] text-sutil uppercase">{pose}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Titulo>Cabeça</Titulo>
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-borda p-4">
              {(['frente', 'pensando', 'feliz'] as const).map((e) => (
                <div key={e} className="flex items-center gap-4">
                  {[64, 48, 32, 24].map((t) => <CabecaOnca key={t} tamanho={t} expressao={e} />)}
                  <span className="text-[13px] font-bold tracking-[.04em] text-sutil uppercase">{e}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Titulo>Avatar das IAs</Titulo>
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-borda p-4">
              {AGENTES.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4">
                  {[48, 32, 24].map((t) => (
                    <span key={t} className="flex items-center gap-2">
                      <AvatarIA agente={a.id} tamanho={t} />
                      <span className="text-[15px] font-bold">{a.nome}</span>
                    </span>
                  ))}
                  <span className="flex items-center gap-2">
                    <AvatarIA agente={a.id} tamanho={32} pensando />
                    <span className="text-[15px] font-bold">{a.nome}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Titulo>Ícones</Titulo>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
            {IDS_ICONE.map((id) => (
              <figure key={id} className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-borda p-3">
                <div className="flex items-end gap-2">
                  <Icone id={id} tamanho={48} rotulo={id} />
                  <Icone id={id} tamanho={32} />
                  <Icone id={id} tamanho={24} />
                </div>
                <figcaption className="text-[13px] font-bold text-tinta">{id}</figcaption>
                <span className="text-[12px] font-bold tracking-[.04em] text-sutil uppercase">{FAMILIA_DO_ICONE[id]}</span>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
