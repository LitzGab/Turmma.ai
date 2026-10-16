import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Globe, Info, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PintaTurma } from '@/components/marca/Pinta'
import { AvatarAgente, ChipFonte, Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { ALUNOS_2B } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { campo, ConversaAberta, DialogoAuditoria, Sinal, type TipoSinal } from './_pecas'

/* Modo sala (1.5, F10): SINAL, não conversa — quem travou, quem pediu resposta pronta, dúvida que se repetiu.
   Abrir a conversa de um aluno é ação explícita e fica em auditoria. Sem inferência de estado emocional,
   sem tempo ocioso e sem acompanhar navegação (regra 70, item 7; D69). */

const MAIS = ['Rafaela Souza', 'Samuel Costa', 'Tainá Oliveira', 'Ulisses Prado', 'Valentina Cruz', 'William Santos', 'Yasmin Ferreira', 'Arthur Moraes',
  'Bianca Teixeira', 'Davi Lopes', 'Helena Prado', 'Igor Martins', 'Júlia Barros', 'Kauã Ribeiro', 'Lívia Campos', 'Miguel Andrade']

const SINAIS: Record<string, { tipo: TipoSinal; detalhe?: string }[]> = {
  'Ana Beatriz': [{ tipo: 'travou', detalhe: 'massa em mol' }],
  'Bruno Tavares': [{ tipo: 'travou', detalhe: 'massa em mol' }],
  'Caio Mendes': [{ tipo: 'travou', detalhe: 'massa em mol' }, { tipo: 'pronta', detalhe: '4 vezes' }],
  'Eduarda Lima': [{ tipo: 'travou', detalhe: 'questão 4' }],
  'Heitor Alves': [{ tipo: 'travou', detalhe: 'reagente limitante' }],
  'Larissa Melo': [{ tipo: 'repetiu', detalhe: 'por que divide pela massa molar' }],
  'Nicolas Dias': [{ tipo: 'travou', detalhe: 'massa em mol' }],
  'Olívia Ramos': [{ tipo: 'atencao' }],
  'Pedro Henrique': [{ tipo: 'pronta', detalhe: '5 vezes' }, { tipo: 'travou', detalhe: 'questão 4' }],
  'Tainá Oliveira': [{ tipo: 'repetiu', detalhe: 'proporção em mol' }],
}
/* O que o aluno está fazendo é fato do sistema: entrou, está na atividade, entregou. Nada de "parado há X min". */
const FAZENDO = ['Na atividade', 'Com o Tutor', 'Na atividade', 'Entregou a atividade', 'Com o Tutor']
const NAO_ENTROU = ['Gabriela Reis', 'Igor Martins', 'Samuel Costa', 'Yasmin Ferreira']

const TURMA = [...ALUNOS_2B, ...MAIS].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  .map((nome, i) => ({ nome, sinais: SINAIS[nome] ?? [], fazendo: NAO_ENTROU.includes(nome) ? 'Não entrou hoje' : FAZENDO[i % FAZENDO.length] }))

const DUVIDAS = [
  { texto: 'Por que eu divido pela massa molar?', vezes: 11, pagina: 145 },
  { texto: 'Como sei qual reagente sobra?', vezes: 7, pagina: 151 },
  { texto: 'O coeficiente é massa ou é mol?', vezes: 5, pagina: 142 },
]

const PESQUISAS = [
  { consulta: 'reagente limitante exemplos do cotidiano', fonte: 'e-Aulas USP', abertas: 6 },
  { consulta: 'massa molar como calcular', fonte: 'Portal do Professor (MEC)', abertas: 4 },
  { consulta: 'lei de Lavoisier sistema fechado', fonte: 'Khan Academy', abertas: 2 },
]

export function Sala() {
  const [filtro, setFiltro] = useState<'todos' | 'sinal'>('sinal')
  const [busca, setBusca] = useState(false)
  const [pedindo, setPedindo] = useState<string | null>(null)
  const [aberta, setAberta] = useState<{ aluno: string; motivo: string } | null>(null)
  const lista = TURMA.filter((a) => filtro === 'todos' || a.sinais.length > 0)

  return (
    <Tela objeto
      titulo={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><PintaTurma turma="2ºB" className="h-9 w-9" /> Modo sala · 2ºB <Estado tipo="pendente">Ao vivo · 4ª aula, 10h30 às 11h20</Estado></span>}
      descricao="Revisão de estequiometria. Você acompanha o uso do Tutor enquanto a turma trabalha. Os alunos sabem disso: o aviso fica fixo na tela deles."
      acoes={<><Button variant="discreto" size="sm" asChild><Link to="/professor/time/tutor"><ArrowLeft /> Thread do Tutor</Link></Button><Button variant="secundario">Encerrar o modo sala</Button></>}>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumeroPainel rotulo="Na sala agora" valor="28 de 32" apoio="4 não entraram hoje" />
        <NumeroPainel rotulo="Travaram" valor="7" apoio="5 no mesmo passo: massa em mol" />
        <NumeroPainel rotulo="Pediram resposta pronta" valor="2" apoio="O Tutor não entregou" />
        <NumeroPainel rotulo="Entregaram a atividade" valor="6" apoio="de 28 que começaram" />
      </div>

      <p className="mt-3 flex items-start gap-2.5 rounded-controle bg-info-cx p-3 text-sm leading-snug text-info">
        <Info className="mt-0.5 size-4 shrink-0" />
        Aqui aparece sinal, não conversa. O sinal vem do que o aluno fez e escreveu na atividade. O sistema não lê humor, não mede tempo parado e não acompanha o que o aluno abre fora daqui.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="alunos" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="alunos" className="font-corpo text-base font-semibold text-tinta">Alunos <span className="font-normal text-sutil">· em ordem alfabética</span></h2>
            <div className="flex gap-1" role="group" aria-label="Filtrar alunos">
              {([['sinal', `Com sinal (${TURMA.filter((a) => a.sinais.length).length})`], ['todos', 'Todos (32)']] as const).map(([v, r]) => (
                <button key={v} type="button" aria-pressed={filtro === v} onClick={() => setFiltro(v)}
                  className={cn('h-11 rounded-controle border px-3.5 text-sm font-medium transition-colors duration-150 md:h-9', filtro === v ? 'border-noite bg-info-cx font-semibold text-info' : 'border-linha bg-superficie text-apoio hover:bg-realce')}>{r}</button>
              ))}
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((a) => (
              <li key={a.nome} className={cn('flex flex-col gap-2 rounded-cartao border bg-superficie p-3.5', a.sinais.length ? 'border-borda-campo' : 'border-linha')}>
                <div>
                  <p className="text-[15px] font-semibold leading-snug text-tinta">{a.nome}</p>
                  <p className="text-sm text-sutil">{a.fazendo}</p>
                </div>
                {a.sinais.length > 0 && <div className="flex flex-wrap gap-1.5">{a.sinais.map((s, i) => <Sinal key={i} tipo={s.tipo} detalhe={s.detalhe} />)}</div>}
                {a.sinais.some((s) => s.tipo === 'atencao') && <p className="text-xs leading-snug text-sutil">O conteúdo não aparece aqui. O Tutor respondeu com a mensagem combinada com a escola.</p>}
                {a.sinais.length > 0 && (
                  aberta?.aluno === a.nome
                    ? <p className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-ok"><Check className="size-4" /> Conversa aberta · em auditoria</p>
                    : <Button variant="discreto" size="sm" className="mt-auto justify-start px-2" onClick={() => setPedindo(a.nome)}>Abrir a conversa…</Button>
                )}
              </li>
            ))}
          </ul>
          {aberta && <div className="mt-4"><ConversaAberta aluno={aberta.aluno} motivo={aberta.motivo} /></div>}
        </section>

        <aside className="grid content-start gap-4">
          <Cartao titulo={<span className="flex items-center gap-2"><AvatarAgente id="tutor" tamanho={24} /> Dúvidas que se repetiram</span>}>
            <ul className="grid gap-2.5">
              {DUVIDAS.map((d) => (
                <li key={d.texto} className="rounded-controle border border-linha p-3">
                  <p className="text-[15px] leading-snug text-tinta">"{d.texto}"</p>
                  <p className="mt-1 text-sm text-sutil"><b className="font-semibold tabular-nums text-apoio">{d.vezes} vezes</b> <ChipFonte pagina={d.pagina} /></p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-snug text-sutil">Boa hora para parar a turma e explicar a primeira na lousa.</p>
          </Cartao>

          {/* Busca do Tutor em fontes aprovadas (D68): duas chaves, só em sala, com prazo, sempre desligada em avaliação */}
          <Cartao titulo={<span className="flex items-center gap-2"><Globe className="size-[18px] text-sutil" /> Busca do Tutor</span>}>
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-2 text-apoio"><span className="grid size-5 place-items-center rounded-full bg-ok-cx text-ok"><Check className="size-3" strokeWidth={3} /></span> 1ª chave: a escola liberou, com a lista de fontes dela</li>
              <li className="flex items-center justify-between gap-3 rounded-controle border border-linha p-3">
                <label htmlFor="busca" className="min-w-0 text-[15px] font-semibold text-tinta">2ª chave: ligar para o 2ºB<span className="block text-sm font-normal text-sutil">{busca ? 'Ligada por você · 21/09, 10h42' : 'Desligada, como vem de fábrica'}</span></label>
                <Switch id="busca" checked={busca} onCheckedChange={setBusca} className="data-[state=checked]:bg-noite data-[state=unchecked]:bg-borda-campo" />
              </li>
            </ul>
            {busca && (
              <div className="mt-3 grid animate-entra gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="prazo" className="text-[13px] font-semibold text-apoio">Até quando</label>
                  <Select defaultValue="aula">
                    <SelectTrigger id="prazo" className={campo}><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-controle">
                      <SelectItem value="aula" className="rounded-linha">Só nesta aula</SelectItem>
                      <SelectItem value="semana" className="rounded-linha">Até sexta, 25/09</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="rotulo mb-2">O que a turma pesquisou</p>
                  <ul className="grid gap-1.5">
                    {PESQUISAS.map((p) => (
                      <li key={p.consulta} className="rounded-controle bg-ia-cx p-2.5 text-sm leading-snug">
                        <p className="flex items-start gap-1.5 text-tinta"><Search className="mt-0.5 size-3.5 shrink-0 text-sutil" /> {p.consulta}</p>
                        <p className="mt-0.5 pl-5 text-sutil">{p.fonte} · aberta por {p.abertas} alunos</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <p className="mt-3 text-sm leading-snug text-sutil">O Tutor pesquisa só nas fontes aprovadas, traz a fonte e pergunta de volta: não escreve o trabalho. A consulta é escrita por ele, sem nome nem texto do aluno. Em avaliação, fica sempre desligada.</p>
          </Cartao>
        </aside>
      </div>

      <DialogoAuditoria aluno={pedindo} aberto={pedindo !== null} aoMudar={(v) => !v && setPedindo(null)}
        aoConfirmar={(motivo) => { if (pedindo) setAberta({ aluno: pedindo, motivo }); setPedindo(null) }} />

      <NotaMockup>
        F10 (modo sala em tempo real), fora do MVP; a fatia da A4 é o sinal chegando à thread do Tutor. Regra 50, item 10, e regra 70, item 7: sinal, não conversa; abrir conversa é ação auditada.
        D36: "atenção humana" sem o conteúdo. D68: busca com duas chaves, prazo e fontes aprovadas; as três fontes da lista são só exemplo, a lista padrão é decisão em aberto.
        D69 e D70: sem tempo ocioso e sem acompanhar navegação fora de avaliação. Peças: shadcn/switch, select, alert-dialog, radio-group.
      </NotaMockup>
    </Tela>
  )
}
