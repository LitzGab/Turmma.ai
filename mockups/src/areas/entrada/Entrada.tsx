import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { NotaMockup } from '@/components/turmma/tela'

/* Entrada (11.8): tela dividida. À esquerda, a "logo branca" do Gabriel — a pinta laranja sobre o papel
   quase branco, e mais nada. À direita, o formulário no desenho da entrada do ChatGPT: campos e botões em pílula.
   Não existe "Cadastre-se": o cliente é a instituição (D2). Um `primario` só: "Entrar". */

const campo = 'h-12 rounded-full border-borda-campo bg-superficie px-5 text-base'

function CampoEntrada({ id, rotulo, ...props }: { id: string; rotulo: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="pl-1 text-[13px] font-medium text-sutil">{rotulo}</Label>
      <Input id={id} className={campo} {...props} />
    </div>
  )
}

export function Entrada() {
  const navegar = useNavigate()
  const [quem, setQuem] = useState<'professor' | 'coordenacao'>('professor')

  return (
    <div className="grid min-h-svh md:grid-cols-2">
      {/* Esquerda: metade da tela; abaixo de 768 px vira faixa de 96 px */}
      <aside className="relative flex h-24 items-center bg-papel px-6 md:h-auto md:flex-col md:items-stretch md:justify-between md:p-10">
        <Marca className="text-[22px]" />
        <div className="hidden flex-1 flex-col items-center justify-center gap-10 md:flex">
          <Pinta className="h-[clamp(180px,22vw,300px)] w-[clamp(180px,22vw,300px)] text-caramelo" rotulo="Turmma" />
          <p className="text-[15px] tracking-[0.12em] text-inativo">#aiforschools</p>
        </div>
        <p className="hidden text-center text-[13px] text-inativo md:block">Colégio Aurora · Joinville, SC · escola de demonstração com dado sintético</p>
      </aside>

      <main className="flex items-center justify-center bg-fundo px-4 py-10 md:px-10">
        <div className="w-full max-w-[420px]">
          <h1 className="text-[28px] font-normal leading-tight tracking-[-0.01em] text-tinta">Entrar na Turmma</h1>
          <p className="mt-1.5 text-base text-sutil">Use o acesso que a sua escola te deu.</p>

          <Tabs defaultValue="aluno" className="mt-7">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-realce-suave p-1">
              <TabsTrigger value="aluno" className="h-9 rounded-full text-sm font-medium text-sutil data-[state=active]:bg-superficie data-[state=active]:text-tinta data-[state=active]:shadow-sm">Sou aluno</TabsTrigger>
              <TabsTrigger value="equipe" className="h-9 rounded-full text-sm font-medium text-sutil data-[state=active]:bg-superficie data-[state=active]:text-tinta data-[state=active]:shadow-sm">Sou da escola</TabsTrigger>
            </TabsList>

            {/* Aluno: conta da escola, quando existe, ou escola + matrícula + senha (D48). Aluno não tem e-mail aqui. */}
            <TabsContent value="aluno" className="mt-6">
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="grid gap-5 p-0">
                  <div className="grid gap-2.5">
                    <p className="pl-1 text-[13px] font-medium text-sutil">Entrar com a conta da escola</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button variant="secundario" className="h-12" onClick={() => navegar('/aluno')}><img src="/marca/google.svg" alt="" className="size-[18px]" /> Google</Button>
                      <Button variant="secundario" className="h-12" onClick={() => navegar('/aluno')}><img src="/marca/microsoft.svg" alt="" className="size-[18px]" /> Microsoft</Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-sutil"><span className="h-px flex-1 bg-linha" />ou com a sua matrícula<span className="h-px flex-1 bg-linha" /></div>
                  <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); navegar('/aluno') }}>
                    <CampoEntrada id="escola" rotulo="Escola" defaultValue="Colégio Aurora" autoComplete="organization" />
                    <CampoEntrada id="matricula" rotulo="Matrícula" defaultValue="2026-0412" inputMode="numeric" autoComplete="username" />
                    <CampoEntrada id="senha-aluno" rotulo="Senha" type="password" defaultValue="demonstracao" autoComplete="current-password" />
                    <Button type="submit" className="h-12 w-full">Entrar</Button>
                  </form>
                  <p className="text-[15px] leading-snug text-sutil">Esqueceu a senha? Fale com seu professor. Ele consegue liberar uma nova para você.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professor e coordenação: convite da escola; a coordenação passa pelo segundo fator (F1). */}
            <TabsContent value="equipe" className="mt-6">
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="grid gap-5 p-0">
                  <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); navegar(quem === 'professor' ? '/professor' : '/entrar/verificacao') }}>
                    <CampoEntrada id="email" rotulo="E-mail" type="email" inputMode="email" autoComplete="username"
                      key={quem} defaultValue={quem === 'professor' ? 'camila.souza@colegioaurora.example' : 'helena.martins@colegioaurora.example'} />
                    <CampoEntrada id="senha" rotulo="Senha" type="password" defaultValue="demonstracao" autoComplete="current-password" />
                    <Button type="submit" className="h-12 w-full">Entrar</Button>
                  </form>
                  <p className="text-sm leading-snug text-sutil">Não existe cadastro aberto. Quem te dá acesso é a coordenação da sua escola, por convite.</p>
                </CardContent>
              </Card>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-sutil">
                Entrar como
                <Button variant={quem === 'professor' ? 'secundario' : 'discreto'} size="sm" onClick={() => setQuem('professor')}>Professora Camila</Button>
                <Button variant={quem === 'coordenacao' ? 'secundario' : 'discreto'} size="sm" onClick={() => setQuem('coordenacao')}>Coordenadora Helena</Button>
              </div>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-sm text-sutil">
            <a href="#" className="text-tinta underline underline-offset-4 hover:text-sutil">Privacidade</a> ·{' '}
            <a href="#" className="text-tinta underline underline-offset-4 hover:text-sutil">Como a IA funciona aqui</a>
          </p>
          <NotaMockup>A1 · Entrada (11.8). Sem "Cadastre-se" (D2); aluno entra pela conta da escola ou por escola + matrícula + senha (D48); coordenação passa pelo segundo fator (F1). O painel da esquerda é a "logo branca": pinta laranja sobre o papel.</NotaMockup>
        </div>
      </main>
    </div>
  )
}
