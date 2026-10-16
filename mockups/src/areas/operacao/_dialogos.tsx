import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import {
  Aviso, Botao, Campo, CampoTexto, CLASSE_CAMPO, Dialogo, DialogoConfirmar, Opcao, Segmentado,
} from '@/components/duo'
import type { EscolaDaOperacao, Rede } from '@/dados/rede'
import { cn } from '@/lib/utils'
import { TIPOS, digitarEndereco, paraEndereco, reais, type Tipo } from './_dados'

/* Os diálogos da operação (12ª rodada, peças duo): Nova escola, Convidar (coordenação ou secretaria: só o e-mail,
   e o link aparece uma vez), Revogar e Teto de IA. Cada um é montado só enquanto está aberto: fechou, o que tinha
   dentro some (nada guarda o link). */

/* ── Nova escola ──────────────────────────────────────────────────────────────────────────────────────── */

type ParteDeRede = 'nao' | 'escolher' | 'nova'
const OPCOES_DE_REDE: { id: ParteDeRede; nome: string }[] = [
  { id: 'nao', nome: 'Não' }, { id: 'escolher', nome: 'Escolher' }, { id: 'nova', nome: 'Nova rede' },
]

/** O link sugerido: o nome sem o "E. M." / "E. E." da frente ("E. M. Pirabeiraba" → pirabeiraba). */
const sugerir = (nome: string) => paraEndereco(nome.replace(/^\s*E\.\s*[MEe]\.\s*/i, ''))

export type NovaEscola = { nome: string; slug: string; cidade: string; redeId?: string; novaRede?: { nome: string; tipo: Tipo } }

export function DialogoNovaEscola({ redes, redeInicial, linksUsados, aoFechar, aoCriar }: {
  redes: Rede[]
  redeInicial?: string
  linksUsados: string[]
  aoFechar: () => void
  aoCriar: (e: NovaEscola) => void
}) {
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [mexido, setMexido] = useState(false)
  const [cidade, setCidade] = useState('Joinville · SC')
  const [parte, setParte] = useState<ParteDeRede>(redeInicial ? 'escolher' : 'nao')
  const [redeId, setRedeId] = useState(redeInicial ?? '')
  const [nomeRede, setNomeRede] = useState('')
  const [tipoRede, setTipoRede] = useState<Tipo>('Municipal')

  const final = paraEndereco(slug)
  const repetido = final !== '' && linksUsados.includes(final)
  const redeRepetida = parte === 'nova' && redes.some((r) => r.nome.toLowerCase() === nomeRede.trim().toLowerCase())
  const redeOk = parte === 'nao' || (parte === 'escolher' && !!redes.find((r) => r.id === redeId))
    || (parte === 'nova' && nomeRede.trim().length >= 3 && !redeRepetida)
  const pode = nome.trim().length >= 3 && final.length >= 3 && !repetido && cidade.trim().length >= 3 && redeOk

  function criar() {
    if (!pode) return
    aoCriar({
      nome: nome.trim(), slug: final, cidade: cidade.trim(),
      redeId: parte === 'escolher' ? redeId : undefined,
      novaRede: parte === 'nova' ? { nome: nomeRede.trim(), tipo: tipoRede } : undefined,
    })
  }

  return (
    <Dialogo aberto aoMudar={(v) => { if (!v) aoFechar() }} titulo="Nova escola" largura={540}
      descricao="Nome, link, cidade e rede da escola."
      rodape={<Botao type="submit" form="form-escola" disabled={!pode}>Criar escola</Botao>}>
      <form id="form-escola" noValidate className="grid gap-4" onSubmit={(e) => { e.preventDefault(); criar() }}>
        <CampoTexto rotulo="Nome da escola" valor={nome} placeholder="E. M. Vila Nova" autoComplete="off"
          aoMudar={(v) => { setNome(v); if (!mexido) setSlug(sugerir(v)) }} />
        <Campo id="escola-link" rotulo="Link da escola" erro={repetido ? 'Este link já é de outra escola.' : undefined}>
          <div className={cn(CLASSE_CAMPO, 'flex h-12 items-center gap-0 px-0 focus-within:border-azul-borda', repetido && 'border-vermelho-borda')}>
            <span className="shrink-0 pl-3.5 text-sutil">turmma.com/e/</span>
            <input id="escola-link" value={slug} spellCheck={false} autoComplete="off" placeholder="nome-da-escola"
              aria-invalid={repetido || undefined}
              onChange={(e) => { setMexido(true); setSlug(digitarEndereco(e.target.value)) }}
              onBlur={() => setSlug((s) => paraEndereco(s))}
              className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-tinta outline-none placeholder:text-sutil" />
          </div>
        </Campo>
        <CampoTexto rotulo="Cidade" valor={cidade} aoMudar={setCidade} placeholder="Cidade · UF" autoComplete="off" />

        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[15px] font-bold leading-5 text-tinta">Faz parte de uma rede?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {OPCOES_DE_REDE.map((o) => (
              <Opcao key={o.id} nome="parte-rede" valor={o.id} marcado={parte === o.id} aoMudar={() => setParte(o.id)}>{o.nome}</Opcao>
            ))}
          </div>
          {parte === 'escolher' && (
            <div role="radiogroup" aria-label="Rede" className="mt-1 grid gap-2">
              {redes.map((r) => (
                <Opcao key={r.id} nome="rede" valor={r.id} marcado={redeId === r.id} aoMudar={() => setRedeId(r.id)}>
                  {r.nome}<span className="block text-[14px] font-medium text-sutil">{r.tipo}</span>
                </Opcao>
              ))}
            </div>
          )}
          {parte === 'nova' && (
            <div className="mt-1 grid gap-3">
              <CampoTexto rotulo="Nome da rede" valor={nomeRede} aoMudar={setNomeRede} autoComplete="off"
                placeholder="Secretaria Municipal de Educação de Araquari"
                erro={redeRepetida ? 'Já existe. Use Escolher.' : undefined} />
              <Segmentado rotulo="Tipo da rede" valor={tipoRede} aoMudar={(v) => setTipoRede(v as Tipo)} className="flex w-full"
                opcoes={TIPOS.map((t) => ({ id: t, rotulo: t }))} />
            </div>
          )}
        </fieldset>
      </form>
    </Dialogo>
  )
}

/* ── Convidar: só o e-mail; o link aparece uma vez ────────────────────────────────────────────────────── */

export function DialogoConvite({ titulo, para, refazer, emailInicial = '', aoFechar, gerar }: {
  /** "Convidar coordenação" · "Convidar a secretaria" */
  titulo: string
  /** a escola ou a rede, embaixo do título */
  para: string
  refazer?: boolean
  emailInicial?: string
  aoFechar: () => void
  /** gera o convite e devolve o link (caminho) e a validade */
  gerar: (email: string) => { link: string; ate: string }
}) {
  const [email, setEmail] = useState(emailInicial)
  const [convite, setConvite] = useState<{ link: string; ate: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [conferir, setConferir] = useState(false)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  const visivel = convite ? `turmma.com${convite.link}` : ''
  async function copiar() {
    if (!convite) return
    try { await navigator.clipboard.writeText(`${window.location.origin}${convite.link}`) } catch { /* o campo continua selecionável */ }
    setCopiado(true)
  }
  const tentarFechar = () => { if (convite && !copiado) setConferir(true); else aoFechar() }

  return (
    <>
      <Dialogo aberto aoMudar={(v) => { if (!v) tentarFechar() }} largura={520}
        titulo={<>{convite ? 'Convite gerado' : refazer ? 'Refazer convite' : titulo}<span className="block text-[15px] font-medium text-sutil">{para}</span></>}
        rodape={convite
          ? <Botao variante={copiado ? 'oficial' : 'secundario'} onClick={tentarFechar}>Fechar</Botao>
          : <Botao type="submit" form="form-convite" disabled={!emailOk}>Gerar convite</Botao>}>
        {!convite ? (
          <form id="form-convite" noValidate className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (emailOk) setConvite(gerar(email.trim())) }}>
            <CampoTexto rotulo="E-mail" type="email" inputMode="email" autoComplete="off" valor={email} aoMudar={setEmail}
              placeholder="coordenacao@escola.example"
              erro={email.trim() && !emailOk ? 'Confira o e-mail.' : undefined}
              dica="Só o e-mail. Você envia o link." />
          </form>
        ) : (
          <div className="grid gap-4">
            <Aviso tom="atencao" titulo="O link aparece uma vez.">{`Vale até ${convite.ate}.`}</Aviso>
            <div className="flex flex-wrap items-center gap-2">
              <input readOnly value={visivel} aria-label="Link do convite" onFocus={(e) => e.currentTarget.select()}
                className={cn(CLASSE_CAMPO, 'h-12 min-w-0 flex-1 basis-56 bg-fundo-suave text-[15px]')} />
              <Botao variante="secundario" onClick={copiar} aria-live="polite"
                icone={copiado ? <Check strokeWidth={3} className="text-verde-texto" /> : <Copy strokeWidth={2.5} />}>
                {copiado ? 'Copiado' : 'Copiar link'}
              </Botao>
            </div>
            <p className="t-apoio flex items-center gap-2"><KeyRound aria-hidden className="size-4 shrink-0" strokeWidth={2.5} />A Turmma não vê a senha nem o segundo fator.</p>
          </div>
        )}
      </Dialogo>
      <DialogoConfirmar aberto={conferir} aoMudar={setConferir} titulo="Fechar sem copiar?"
        frase="O link não aparece de novo. Será preciso refazer o convite."
        voltar="Voltar ao link" confirmar={{ rotulo: 'Fechar', variante: 'perigoCheio', aoConfirmar: aoFechar }} />
    </>
  )
}

/* ── Revogar ──────────────────────────────────────────────────────────────────────────────────────────── */

export function DialogoRevogar({ escola, aoFechar, aoConfirmar }: { escola: EscolaDaOperacao; aoFechar: () => void; aoConfirmar: () => void }) {
  return (
    <DialogoConfirmar aberto aoMudar={(v) => { if (!v) aoFechar() }} titulo="Revogar o convite?"
      frase={`O link da ${escola.nome} deixa de valer na hora.`}
      confirmar={{ rotulo: 'Revogar', variante: 'perigoCheio', aoConfirmar }} />
  )
}

/* ── Teto de IA (da escola ou da rede) ────────────────────────────────────────────────────────────────── */

export function DialogoTeto({ de, valorInicial, aoFechar, aoSalvar }: {
  de: string
  valorInicial: number
  aoFechar: () => void
  aoSalvar: (valor: number) => void
}) {
  const [valor, setValor] = useState(String(Math.round(valorInicial)))
  const n = Number(valor.replace(/\D/g, ''))
  return (
    <Dialogo aberto aoMudar={(v) => { if (!v) aoFechar() }} largura={460}
      titulo={<>Teto de IA<span className="block text-[15px] font-medium text-sutil">{de}</span></>}
      rodape={<Botao variante="oficial" disabled={!n} onClick={() => { aoSalvar(n); aoFechar() }}>Salvar</Botao>}>
      <CampoTexto rotulo="Por mês, em reais" inputMode="numeric" valor={valor} aoMudar={(v) => setValor(v.replace(/\D/g, ''))}
        dica={n ? `R$ ${reais(n)}. Aviso em 80%. Corte suave em 100%.` : 'Aviso em 80%. Corte suave em 100%.'} />
    </Dialogo>
  )
}
