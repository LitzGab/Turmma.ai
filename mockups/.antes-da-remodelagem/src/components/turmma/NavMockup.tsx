import { Link } from 'react-router-dom'
import { Map } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/* Não faz parte do produto: é o atalho de quem está revisando os mockups para pular entre papéis. */
const ATALHOS = [
  ['/', 'Mapa de todas as telas'],
  ['/entrar', 'Entrada'],
  ['/professor', 'Professor'],
  ['/aluno', 'Aluno'],
  ['/coordenacao', 'Coordenação'],
  ['/rede', 'Rede'],
  ['/familia', 'Família'],
] as const

export function NavMockup() {
  return (
    <div className="fixed right-3 top-2 z-50 md:bottom-4 md:right-4 md:top-auto print:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex h-10 items-center gap-2 rounded-full bg-noite-baixo px-3.5 text-[13px] font-semibold text-white shadow-flutua transition-colors duration-150 hover:bg-noite">
            <Map className="size-4 text-caramelo-noite" strokeWidth={2} /> Mockup
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-60 rounded-controle">
          <DropdownMenuLabel className="rotulo px-2 py-2">Navegar nos mockups</DropdownMenuLabel>
          {ATALHOS.map(([para, rotulo], i) => (
            <div key={para}>
              {i === 1 && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild className="h-10 rounded-linha"><Link to={para}>{rotulo}</Link></DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
