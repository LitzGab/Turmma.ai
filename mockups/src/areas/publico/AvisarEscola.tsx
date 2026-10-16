import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { Botao, CampoTexto } from '@/components/duo'
import { avisos } from '@/dados/avisos'
import { useAcolhimento } from '../coordenacao/Configuracoes'
import { Acompanhar, CanalDaEscola, CascaPublica, useCodigoDoNumero, EscolaInexistente, SeloCerto, Titulo, Voltar, classeDoLink, escolaPublica, useTituloDaAba } from './_casca'

/* AVISAR A ESCOLA, SEM CONTA (/e/:escola/avisar). O canal de notificação que a lei pede para quem não tem conta: a
   família, um colega, alguém da comunidade (ECA Digital, art. 28 — lei). Quem avisou acompanha pelo número e lê a
   resposta da escola (ECA Digital, art. 29 — lei; D79). Entra em Registros › Avisos e pedidos como "Canal da escola ·
   sem conta", com prazo de 5 dias úteis. O 188 e o 190 ficam à vista: o canal não substitui o socorro. */

type Etapa = { tipo: 'escrever' } | { tipo: 'enviado'; numero: number } | { tipo: 'acompanhar'; numero?: number }

export function AvisarEscola() {
  const { escola: slug } = useParams()
  const escola = escolaPublica(slug)
  useTituloDaAba(`Avisar a escola · ${escola?.nome ?? 'Turmma'}`)
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'escrever' })
  const acolhimento = useAcolhimento()
  const codigo = useCodigoDoNumero(etapa.tipo === 'enviado' ? etapa.numero : undefined)
  const [texto, setTexto] = useState('')
  const [turma, setTurma] = useState('')
  const [contato, setContato] = useState('')
  const [erro, setErro] = useState('')

  if (!escola) return <EscolaInexistente />

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) { setErro('Conte o que aconteceu.'); return }
    const numero = avisos.enviar({ origem: 'publico', texto, turma, contato })
    setTexto(''); setTurma(''); setContato('')
    setEtapa({ tipo: 'enviado', numero })
  }

  return (
    <CascaPublica rodape={`${escola.nome} · ${escola.cidade}`} canal={<CanalDaEscola escola={escola} atual="avisar" />}>
      {etapa.tipo === 'escrever' && (
        <div className="animate-entra">
          <Voltar para={`/e/${escola.slug}`}>{escola.nome}</Voltar>
          <Titulo titulo="Avisar a escola" />
          <form className="mt-5 grid gap-4" onSubmit={enviar} noValidate>
            {/* o texto de acolhimento que a coordenação escreve em Configurações › Canal da escola */}
            {acolhimento.trim() && <p className="t-corpo -mt-2 text-apoio">{acolhimento}</p>}
            <CampoTexto rotulo="O que aconteceu?" valor={texto} linhas={4} maxLength={2000} erro={erro} autoFocus
              aoMudar={(v) => { setTexto(v); setErro('') }} />
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <CampoTexto rotulo="Turma" valor={turma} aoMudar={setTurma} placeholder="Opcional" maxLength={12} autoComplete="off" />
              <CampoTexto rotulo="Contato para a resposta" valor={contato} aoMudar={setContato} placeholder="Opcional" maxLength={120} autoComplete="email" />
            </div>
            <Botao type="submit" largura="cheia">Enviar</Botao>
          </form>
          <p className="t-apoio mt-5 flex items-start gap-2">
            <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-vermelho-texto" strokeWidth={2.5} />
            <span>Se alguém corre perigo agora, ligue <a href="tel:188" className={classeDoLink}>188</a> (CVV) ou <a href="tel:190" className={classeDoLink}>190</a>.</span>
          </p>
          <p className="t-apoio mt-3">Já avisou? <button type="button" className={classeDoLink} onClick={() => setEtapa({ tipo: 'acompanhar' })}>Acompanhar</button></p>
        </div>
      )}

      {etapa.tipo === 'enviado' && (
        <div className="animate-entra">
          <SeloCerto />
          <Titulo titulo={`Recebido. Número ${etapa.numero}, código ${codigo ?? ''}.`} linha="A escola responde em até 5 dias úteis. Guarde o número e o código." />
          <Botao variante="secundario" largura="cheia" className="mt-7" onClick={() => setEtapa({ tipo: 'acompanhar', numero: etapa.numero })}>Acompanhar</Botao>
          <p className="t-apoio mt-5"><Link to={`/e/${escola.slug}`} className={classeDoLink}>{escola.nome}</Link></p>
        </div>
      )}

      {etapa.tipo === 'acompanhar' && (
        <Acompanhar key={etapa.numero ?? 'vazio'} tipo="aviso" inicial={etapa.numero} aoVoltar={() => setEtapa({ tipo: 'escrever' })} />
      )}
    </CascaPublica>
  )
}
