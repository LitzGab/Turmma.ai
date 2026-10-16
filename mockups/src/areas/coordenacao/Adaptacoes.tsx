import { useState } from 'react'
import { Lock } from 'lucide-react'
import {
  Botao, DialogoConfirmar, FaixaResultado, MenuMais, Opcao, Selo, Toque, type ItemMenuMais,
} from '@/components/duo'
import { PainelLado } from '@/components/turmma/painel-lado'
import { listas, type AlunoDaTurma } from '@/dados/acesso'
import { adaptacoes, useAdaptacoes, useTurmasDaEscola, type TurmaViva } from '@/dados/escola-estado'
import { TIPOS_ADAPTACAO } from '@/dados/ferramentas'
import { Escolha, matriculas, porSerie } from './_estrutura-pecas'

/* O PAINEL DO ALUNO (12ª rodada, 04/10/2026; plano 5.3), aberto pela página da turma (?aluno=).
   A escola registra a ADAPTAÇÃO NECESSÁRIA (a forma da prova), nunca o diagnóstico, o laudo ou o CID (D35): os tipos
   são a lista fechada da ferramenta Adaptar, sem texto livre. Registrar põe o selo ADAPTAÇÃO na turma do professor, e
   a versão adaptada passa a dizer "vai para N" (dados/escola-estado.ts). O raro mora no ⋯ (regra 20, itens 15 e 18):
   Mudar de turma (a conta segue), Encerrar matrícula (a conta é desativada) e, só para o nome livre, Retirar da lista. */

const VALIDADES = [
  { id: 'ano', rotulo: 'Até o fim do ano', grava: 'Ano letivo de 2026' },
  { id: 'bimestre', rotulo: 'Até o fim do bimestre (11/12)', grava: 'Até 11/12/2026' },
]
const nomeTipo = (id: string) => TIPOS_ADAPTACAO.find((t) => t.id === id)?.nome ?? id
const SITUACAO = { 'na-turma': 'Na turma', pediu: 'Pediu para entrar', livre: 'Livre' } as const

export function PainelAluno({ turma, aluno, aoFechar }: { turma: TurmaViva; aluno: AlunoDaTurma | null; aoFechar: () => void }) {
  const daTurma = useAdaptacoes(turma.id)
  const todas = useTurmasDaEscola()
  const atual = aluno ? daTurma.find((a) => a.aluno === aluno.nome) : undefined
  const [tipos, setTipos] = useState<string[]>([])
  const [validade, setValidade] = useState(VALIDADES[0].id)
  const [feito, setFeito] = useState<string | null>(null)
  const [encerrando, setEncerrando] = useState(false)
  const [mudando, setMudando] = useState(false)
  const [destino, setDestino] = useState('')
  const [retirando, setRetirando] = useState(false)
  const [encerrandoMatricula, setEncerrandoMatricula] = useState(false)

  const fechar = () => { setTipos([]); setValidade(VALIDADES[0].id); setFeito(null); setDestino(''); aoFechar() }
  const registrar = () => {
    if (!aluno) return
    adaptacoes.registrar({ turmaId: turma.id, aluno: aluno.nome, tipos, validade: VALIDADES.find((v) => v.id === validade)!.grava })
    setTipos([]); setFeito('Adaptação registrada')
  }
  const livre = aluno?.situacao === 'livre'
  const menu: ItemMenuMais[] = [
    { rotulo: 'Mudar de turma', aoEscolher: () => setMudando(true) },
    livre
      ? { rotulo: 'Retirar da lista', perigo: true, aoEscolher: () => setRetirando(true) }
      : { rotulo: 'Encerrar matrícula', perigo: true, aoEscolher: () => setEncerrandoMatricula(true) },
  ]
  const outras = todas.filter((t) => t.id !== turma.id && t.nomes > 0).sort(porSerie)

  return (
    <>
      <PainelLado aberto={!!aluno} aoFechar={fechar} titulo={aluno?.nome ?? ''}
        rodape={aluno && (
          <>
            <MenuMais itens={menu} rotulo="Mais sobre o aluno" lado="top" alinhar="start" />
            <span className="flex-1" />
            {atual
              ? <Botao variante="secundario" tamanho="m" onClick={() => setEncerrando(true)}>Encerrar adaptação</Botao>
              : <Botao variante="oficial" tamanho="m" disabled={tipos.length === 0} onClick={registrar}>Registrar adaptação</Botao>}
          </>
        )}>
        {aluno && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Selo className="normal-case tabular-nums tracking-normal">{aluno.matricula}</Selo>
              <Selo familia={aluno.situacao === 'na-turma' ? 'verde' : aluno.situacao === 'pediu' ? 'amarelo' : 'neutro'}>{SITUACAO[aluno.situacao]}</Selo>
            </div>
            {feito && <FaixaResultado tipo="certo" titulo={feito} className="-mx-6 border-b-2">O professor da turma já vê.</FaixaResultado>}

            {atual ? (
              <section className="grid gap-3">
                <h3 className="t-rotulo text-sutil">Adaptação</h3>
                <div className="flex flex-wrap gap-2">{atual.tipos.map((t) => <Selo key={t} familia="roxo" className="normal-case tracking-normal">{nomeTipo(t)}</Selo>)}</div>
                <p className="t-apoio">{atual.validade} · {atual.por}</p>
              </section>
            ) : (
              <section className="grid gap-3">
                <h3 className="t-rotulo text-sutil">Adaptação</h3>
                <div className="grid gap-2.5">
                  {TIPOS_ADAPTACAO.map((t) => (
                    <Opcao key={t.id} tipo="checkbox" marcado={tipos.includes(t.id)}
                      aoMudar={(m) => setTipos((x) => (m ? [...x, t.id] : x.filter((y) => y !== t.id)))}>{t.nome}</Opcao>
                  ))}
                </div>
                <div role="group" aria-label="Validade" className="flex flex-wrap gap-2 pt-1">
                  {VALIDADES.map((v) => <Toque key={v.id} selecionado={validade === v.id} aoMudar={() => setValidade(v.id)}>{v.rotulo}</Toque>)}
                </div>
              </section>
            )}

            <p className="t-apoio flex items-start gap-2"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />Só o tipo. Sem laudo nem diagnóstico.</p>
          </div>
        )}
      </PainelLado>

      <DialogoConfirmar aberto={encerrando} aoMudar={setEncerrando} titulo="Encerrar a adaptação?"
        frase="A próxima prova adaptada já não vai para este aluno."
        confirmar={{ rotulo: 'Encerrar', aoConfirmar: () => { if (aluno) { adaptacoes.encerrar(turma.id, aluno.nome); setFeito('Adaptação encerrada') } } }} />

      <DialogoConfirmar aberto={mudando} aoMudar={(v) => { setMudando(v); if (!v) setDestino('') }} titulo={`Mudar ${aluno?.nome.split(' ')[0] ?? ''} de turma`}
        frase={livre ? undefined : 'A conta e a senha seguem as mesmas.'}
        confirmar={{ rotulo: 'Mudar', desligado: !destino, aoConfirmar: () => {
          if (!aluno || !destino) return
          if (livre) {
            listas.retirar(turma.id, aluno.id)
            listas.acrescentar(destino, [{ nome: aluno.nome, matricula: aluno.matricula }])
          } else matriculas.mudarDeTurma(turma.id, destino, aluno)
          fechar()
        } }}>
        <Escolha id="al-destino" rotulo="Para a turma" valor={destino} aoMudar={setDestino} marcador="Escolha"
          opcoes={outras.map((t) => ({ valor: t.id, rotulo: `${t.nome} · ${t.serie}` }))} />
      </DialogoConfirmar>

      <DialogoConfirmar aberto={encerrandoMatricula} aoMudar={setEncerrandoMatricula} titulo={`Encerrar a matrícula de ${aluno?.nome ?? ''}?`}
        frase="A conta é desativada."
        confirmar={{ rotulo: 'Encerrar matrícula', variante: 'perigoCheio', aoConfirmar: () => { if (aluno) { matriculas.encerrar(turma.id, aluno); fechar() } } }} />

      <DialogoConfirmar aberto={retirando} aoMudar={setRetirando} titulo={`Retirar ${aluno?.nome ?? ''}?`}
        frase="Ninguém pediu este nome. Se foi engano, acrescente de novo."
        confirmar={{ rotulo: 'Retirar', variante: 'perigoCheio', aoConfirmar: () => { if (aluno) { listas.retirar(turma.id, aluno.id); fechar() } } }} />
    </>
  )
}
