import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Botao, CampoTexto, Opcao } from '@/components/duo'
import { avisos, type OQueTitular } from '@/dados/avisos'
import { Acompanhar, CanalDaEscola, CascaPublica, useCodigoDoNumero, EscolaInexistente, SeloCerto, Titulo, Voltar, classeDoLink, escolaPublica, useTituloDaAba } from './_casca'

/* PEDIDO SOBRE DADOS DE UM ALUNO, SEM CONTA (/e/:escola/dados). A família ainda não tem conta (D80), e a lei garante
   ao titular, ou ao responsável pelo menor, ver, corrigir, apagar e levar os dados (LGPD, art. 18 — lei). O pedido
   entra em Registros › Avisos e pedidos como "Canal da escola · sem conta", para quem tem a atribuição "Atende o
   titular" (D78), com prazo de 15 dias. Quem pediu acompanha pelo número. */

type Etapa = { tipo: 'pedir' } | { tipo: 'enviado'; numero: number } | { tipo: 'acompanhar'; numero?: number }
const OPCOES: { id: OQueTitular; rotulo: string }[] = [
  { id: 'ver', rotulo: 'Ver os dados' },
  { id: 'corrigir', rotulo: 'Corrigir' },
  { id: 'apagar', rotulo: 'Apagar' },
  { id: 'levar', rotulo: 'Levar os dados' },
]

export function PedidoDados() {
  const { escola: slug } = useParams()
  const escola = escolaPublica(slug)
  useTituloDaAba(`Pedido sobre dados · ${escola?.nome ?? 'Turmma'}`)
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'pedir' })
  const codigo = useCodigoDoNumero(etapa.tipo === 'enviado' ? etapa.numero : undefined)
  const [aluno, setAluno] = useState('')
  const [turma, setTurma] = useState('')
  const [oQue, setOQue] = useState<OQueTitular | null>(null)
  const [contato, setContato] = useState('')
  const [erros, setErros] = useState<{ aluno?: string; oQue?: string; contato?: string }>({})

  if (!escola) return <EscolaInexistente />

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!aluno.trim()) novos.aluno = 'Escreva o nome do aluno.'
    if (!oQue) novos.oQue = 'Escolha o que você quer.'
    if (!contato.trim()) novos.contato = 'Deixe um e-mail ou telefone.'
    setErros(novos)
    if (Object.keys(novos).length || !oQue) return
    const numero = avisos.pedirDados({ origem: 'publico', oQue, alunoNome: aluno, turma, contato })
    setAluno(''); setTurma(''); setOQue(null); setContato('')
    setEtapa({ tipo: 'enviado', numero })
  }

  return (
    <CascaPublica rodape={`${escola.nome} · ${escola.cidade}`} canal={<CanalDaEscola escola={escola} atual="dados" />}>
      {etapa.tipo === 'pedir' && (
        <div className="animate-entra">
          <Voltar para={`/e/${escola.slug}`}>{escola.nome}</Voltar>
          <Titulo titulo="Pedido sobre dados de um aluno" />
          <form className="mt-5 grid gap-4" onSubmit={enviar} noValidate>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <CampoTexto rotulo="Nome do aluno" valor={aluno} erro={erros.aluno} maxLength={120} autoComplete="off" autoFocus
                aoMudar={(v) => { setAluno(v); setErros((x) => ({ ...x, aluno: undefined })) }} />
              <CampoTexto rotulo="Turma" valor={turma} aoMudar={setTurma} placeholder="7ºA" maxLength={12} autoComplete="off" />
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-1.5 text-[15px] font-bold leading-5 text-tinta">O que você quer?</legend>
              <div className="grid grid-cols-2 gap-2">
                {OPCOES.map((o) => (
                  <Opcao key={o.id} nome="o-que" valor={o.id} marcado={oQue === o.id}
                    aoMudar={() => { setOQue(o.id); setErros((x) => ({ ...x, oQue: undefined })) }}>
                    {o.rotulo}
                  </Opcao>
                ))}
              </div>
              {erros.oQue && <p role="alert" className="text-[15px] font-bold leading-5 text-vermelho-texto">{erros.oQue}</p>}
            </fieldset>
            <CampoTexto rotulo="Contato do responsável" valor={contato} erro={erros.contato} placeholder="E-mail ou telefone" maxLength={120} autoComplete="email"
              aoMudar={(v) => { setContato(v); setErros((x) => ({ ...x, contato: undefined })) }} />
            <Botao type="submit" largura="cheia">Enviar</Botao>
          </form>
          <p className="t-apoio mt-5">Já pediu? <button type="button" className={classeDoLink} onClick={() => setEtapa({ tipo: 'acompanhar' })}>Acompanhar</button></p>
        </div>
      )}

      {etapa.tipo === 'enviado' && (
        <div className="animate-entra">
          <SeloCerto />
          <Titulo titulo={`Recebido. Pedido ${etapa.numero}, código ${codigo ?? ''}.`} linha="A escola responde em até 15 dias, até 06/10. Guarde o número e o código." />
          <Botao variante="secundario" largura="cheia" className="mt-7" onClick={() => setEtapa({ tipo: 'acompanhar', numero: etapa.numero })}>Acompanhar</Botao>
          <p className="t-apoio mt-5"><Link to={`/e/${escola.slug}`} className={classeDoLink}>{escola.nome}</Link></p>
        </div>
      )}

      {etapa.tipo === 'acompanhar' && (
        <Acompanhar key={etapa.numero ?? 'vazio'} tipo="titular" inicial={etapa.numero} aoVoltar={() => setEtapa({ tipo: 'pedir' })} />
      )}
    </CascaPublica>
  )
}
