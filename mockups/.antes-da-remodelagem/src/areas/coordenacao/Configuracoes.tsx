import { useState, type ReactNode } from 'react'
import { KeyRound, Lock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PintaTurma } from '@/components/marca/Pinta'
import { Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, Tela } from '@/components/turmma/tela'
import { TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { AvisoInfo, caixaMarca, campo, Interruptor, Segmentos } from './_b-pecas'

/* Configurações da escola (seção 3): política do Tutor, modo casa por turma (D19), busca do Tutor em
   fontes aprovadas (D68), horário útil (D59), retenção e MFA. Um primário só: salvar. */

type Faixa = 'finais' | 'medio'
type Fonte = { id: string; nome: string; endereco: string; finais: boolean; medio: boolean }

const FONTES_INICIAIS: Fonte[] = [
  { id: 'f1', nome: 'IBGE Educa', endereco: 'educa.ibge.gov.br', finais: true, medio: true },
  { id: 'f2', nome: 'Portal Domínio Público', endereco: 'dominiopublico.gov.br', finais: true, medio: true },
  { id: 'f3', nome: 'Khan Academy em português', endereco: 'pt.khanacademy.org', finais: true, medio: true },
  { id: 'f4', nome: 'Biblioteca SciELO', endereco: 'scielo.br', finais: false, medio: true },
  { id: 'f5', nome: 'Wikipédia em português', endereco: 'pt.wikipedia.org', finais: false, medio: true },
]

function Linha({ titulo, apoio, children, htmlFor }: { titulo: string; apoio?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-linha py-3.5 first:border-0 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 basis-64">
        <Label htmlFor={htmlFor} className="text-[15px] font-semibold leading-snug text-tinta">{titulo}</Label>
        {apoio && <p className="mt-0.5 max-w-[60ch] text-sm leading-snug text-sutil">{apoio}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Escolha({ id, valor, aoMudar, opcoes, largura = 'w-44' }: { id: string; valor: string; aoMudar: (v: string) => void; opcoes: [string, string][]; largura?: string }) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={cn(campo, largura)}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-controle">{opcoes.map(([v, n]) => <SelectItem key={v} value={v} className="rounded-linha">{n}</SelectItem>)}</SelectContent>
    </Select>
  )
}

export function Configuracoes() {
  // Descartar volta tudo ao que estava salvo: remonta o formulário
  const [versao, setVersao] = useState(0)
  return <Formulario key={versao} aoDescartar={() => setVersao((v) => v + 1)} />
}

function Formulario({ aoDescartar }: { aoDescartar: () => void }) {
  const [sujo, setSujo] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [freio, setFreio] = useState('60')
  const [casa, setCasa] = useState<Record<string, boolean>>({}) // desligado por padrão em toda turma (D19)
  const [busca, setBusca] = useState(false) // desligada por padrão (D68)
  const [faixa, setFaixa] = useState<Faixa>('medio')
  const [fontes, setFontes] = useState(FONTES_INICIAIS)
  const [nova, setNova] = useState('')
  const [inicio, setInicio] = useState('07:00')
  const [fim, setFim] = useState('18:00')
  const [retTutor, setRetTutor] = useState('90')
  const [retArtefato, setRetArtefato] = useState('5')

  const mudou = <T,>(set: (v: T) => void) => (v: T) => { set(v); setSujo(true); setSalvo(false) }
  const salvar = () => { setSujo(false); setSalvo(true) }

  const alternarFonte = (id: string) => mudou(setFontes)(fontes.map((f) => f.id === id ? { ...f, [faixa]: !f[faixa] } : f))
  const adicionar = () => {
    const endereco = nova.trim().replace(/^https?:\/\//, '')
    if (!endereco) return
    mudou(setFontes)([...fontes, { id: `f${Date.now()}`, nome: endereco, endereco, finais: faixa === 'finais', medio: faixa === 'medio' }])
    setNova('')
  }

  return (
    <Tela titulo="Configurações da escola" largura="media"
      descricao="O que a escola decide sobre o Tutor, a busca, os avisos e a guarda dos dados. Vale para o Colégio Aurora inteiro.">

      <div className="grid gap-4">
        <Cartao titulo="Tutor">
          <Linha titulo="Pacote da turma" apoio="Está no contrato: 300 trocas por aluno por mês, somadas por turma. O uso normal já está incluso; não existe crédito para comprar.">
            <span className="text-[15px] font-semibold tabular-nums text-tinta">300 por aluno / mês</span>
          </Linha>
          <Linha htmlFor="freio" titulo="Freio por dia, por aluno" apoio="É salvaguarda, não punição. O aluno vê quanto ainda dá para usar hoje e onde é o ponto de parada; no fim, a tela diz com calma que amanhã volta.">
            <Escolha id="freio" valor={freio} aoMudar={mudou(setFreio)} opcoes={[['30', '30 trocas por dia'], ['45', '45 trocas por dia'], ['60', '60 trocas por dia']]} largura="w-52" />
          </Linha>
        </Cartao>

        <Cartao titulo="Modo casa, por turma">
          <p className="-mt-2 mb-4 max-w-[68ch] text-sm leading-snug text-sutil">
            Desligado por padrão. Desligado, o aluno que abre em casa vê uma tela explicando que o Tutor funciona em sala. Ligado, cada sessão deixa registro e resumo para o professor da turma.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {TURMAS.map((t) => {
              const ligado = !!casa[t.id]
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-controle border border-linha p-3">
                  <PintaTurma turma={t.nome} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`casa-${t.id}`} className="block truncate text-[15px] font-semibold text-tinta">{t.nome} · {t.serie}</Label>
                    <p className="text-[13px] text-sutil">{ligado ? 'Tutor disponível fora da sala' : 'Tutor só em sala'}</p>
                  </div>
                  <Interruptor id={`casa-${t.id}`} checked={ligado} onCheckedChange={(v) => mudou(setCasa)({ ...casa, [t.id]: v })} />
                </li>
              )
            })}
          </ul>
        </Cartao>

        <Cartao titulo="Busca do Tutor em fontes aprovadas">
          <Linha htmlFor="busca" titulo="Liberar a busca nesta escola" apoio="Esta é a primeira chave. Desligada, nenhum professor consegue ligar a busca para a turma.">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-apoio">{busca ? 'Liberada' : 'Desligada'}</span>
              <Interruptor id="busca" checked={busca} onCheckedChange={mudou(setBusca)} />
            </div>
          </Linha>

          <AvisoInfo icone={KeyRound} className="mt-4" titulo="A segunda chave é do professor">
            Ele liga por turma, com prazo, só no modo sala. Em avaliação a busca fica sempre desligada. O Tutor continua conduzindo por perguntas: traz a
            fonte e pede para comparar, não escreve o trabalho. Web aberta para aluno não existe.
          </AvisoInfo>

          {busca ? (
            <div className="mt-5 animate-entra">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-apoio">Lista de fontes, por faixa etária</p>
                <Segmentos rotulo="Faixa etária" valor={faixa} aoMudar={setFaixa} opcoes={[{ id: 'finais', nome: '6º ao 9º ano' }, { id: 'medio', nome: 'Ensino Médio' }]} />
              </div>
              <ul className="mt-3 grid">
                {fontes.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 border-t border-linha py-1.5 first:border-0">
                    <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <Checkbox checked={f[faixa]} onCheckedChange={() => alternarFonte(f.id)} className={caixaMarca} />
                      <span className="min-w-0"><span className="block truncate text-[15px] font-medium text-tinta">{f.nome}</span><span className="block truncate text-[13px] text-sutil">{f.endereco}</span></span>
                    </label>
                    <Button type="button" variant="discreto" size="icon" className="size-11 md:size-9" aria-label={`Tirar ${f.nome} da lista`} onClick={() => mudou(setFontes)(fontes.filter((x) => x.id !== f.id))}><Trash2 /></Button>
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => { e.preventDefault(); adicionar() }} className="mt-3 flex flex-wrap gap-2">
                <Label htmlFor="nova-fonte" className="sr-only">Endereço da nova fonte</Label>
                <Input id="nova-fonte" value={nova} onChange={(e) => setNova(e.target.value)} inputMode="url" placeholder="endereço do site, ex.: museu.exemplo.org.br" className={cn(campo, 'min-w-0 flex-1 basis-60')} />
                <Button type="submit" variant="secundario" className="h-11 md:h-10"><Plus /> Adicionar fonte</Button>
              </form>
            </div>
          ) : (
            <p className="mt-4 text-sm text-sutil">Com a busca desligada, o Tutor responde só com o material da escola, citando a página.</p>
          )}
        </Cartao>

        <Cartao titulo="Horário dos avisos">
          <Linha titulo="Horário útil da escola" apoio="Nenhum aviso sai fora deste horário, nem em dia sem aula — para aluno, professor ou coordenação. O que os agentes fizerem de noite aparece na manhã seguinte.">
            <div className="flex items-center gap-2">
              <Label htmlFor="h-inicio" className="sr-only">Início</Label>
              <Input id="h-inicio" type="time" value={inicio} onChange={(e) => mudou(setInicio)(e.target.value)} className={cn(campo, 'w-[116px] tabular-nums')} />
              <span className="text-sm text-sutil">às</span>
              <Label htmlFor="h-fim" className="sr-only">Fim</Label>
              <Input id="h-fim" type="time" value={fim} onChange={(e) => mudou(setFim)(e.target.value)} className={cn(campo, 'w-[116px] tabular-nums')} />
            </div>
          </Linha>
        </Cartao>

        <Cartao titulo="Guarda dos dados">
          <Linha htmlFor="ret-tutor" titulo="Conversa do Tutor" apoio="Retenção curta. Só o professor da turma vê. Depois do prazo, a conversa é apagada e fica o resumo da sessão em formato fixo.">
            <Escolha id="ret-tutor" valor={retTutor} aoMudar={mudou(setRetTutor)} opcoes={[['30', '30 dias'], ['60', '60 dias'], ['90', '90 dias']]} />
          </Linha>
          <Linha htmlFor="ret-art" titulo="Artefatos, correções e diagnósticos" apoio="Siga o prazo de guarda de registro escolar da sua rede.">
            <Escolha id="ret-art" valor={retArtefato} aoMudar={mudou(setRetArtefato)} opcoes={[['2', '2 anos'], ['5', '5 anos'], ['10', '10 anos']]} />
          </Linha>
          <Linha titulo="Registro de acesso" apoio="Prazo fixado pelo Marco Civil da Internet (art. 15). Não é configurável.">
            <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-tinta"><Lock className="size-4 text-sutil" /> 6 meses</span>
          </Linha>
        </Cartao>

        <Cartao titulo="Segurança">
          <Linha htmlFor="mfa" titulo="Segundo fator para a coordenação" apoio="Obrigatório. Não dá para desligar: quem vê a escola inteira entra com senha e código. 3 pessoas na coordenação, todas com o segundo fator ativo.">
            <div className="flex items-center gap-3">
              <Estado tipo="ok">Ativo</Estado>
              <Interruptor id="mfa" checked disabled aria-label="Segundo fator obrigatório" />
            </div>
          </Linha>
        </Cartao>
      </div>

      {/* A barra de salvar fica presa embaixo enquanto a tela rola; é o único primário da tela. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-linha bg-fundo px-4 py-3 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button disabled={!sujo} onClick={salvar}>Salvar alterações</Button>
          <Button variant="discreto" disabled={!sujo} onClick={aoDescartar}>Descartar</Button>
          <div className="text-sm text-sutil" role="status">
            {salvo ? <Estado tipo="ok">Salvo · 21/09, 10h42</Estado> : sujo ? 'Há alterações que ainda não foram salvas.' : 'Nenhuma alteração.'}
          </div>
        </div>
      </div>

      <NotaMockup>
        F12, com pedaços do F9 (Tutor, modo casa, busca) e do F3 (retenção) · fora do MVP de apresentação. Aplica D19 (modo casa por turma, desligado por
        padrão), D38 (pacote e freio como salvaguarda), D40 (sem crédito visível), D68 (duas chaves, fontes aprovadas por faixa etária), D59 (aviso só no
        horário útil), regra 20 itens 14 e 16 (retenção curta e configurável) e MFA obrigatório do F1. A lista de fontes é exemplo: a lista padrão ainda é decisão em aberto.
      </NotaMockup>
    </Tela>
  )
}
