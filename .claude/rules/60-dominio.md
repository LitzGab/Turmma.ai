# Regra 60 — Domínio

## Por que esta regra existe

Software escolar erra de um jeito característico: alguém modela "turma" como algo
permanente, "nota" como um número solto, e "aula" como um evento que o professor cria. Em
janeiro, quando o ano vira, o sistema quebra inteiro. Quando um professor sai em março, sua
turma fica órfã. Quando dois módulos chamam a mesma coisa de `class` e `turma`, ninguém
percebe que são a mesma coisa até o bug aparecer em produção.

Estas regras existem para que o código fale a língua da escola, e para que as poucas
invariantes que realmente importam estejam garantidas por estrutura, não por atenção.

Contexto completo do domínio: `docs/visao-produto.md` e `docs/fluxos.md`. Vocabulário:
`docs/glossario.md`.

## As regras

1. **Use o vocabulário do glossário** no código, no banco e na interface. `turma`, não
   `class`. `nota`, não `grade`. `matricula`, não `enrollmentNumber`. E não misture os dois
   idiomas dentro da mesma entidade: `turmaId` e `gradeValue` na mesma tabela é como
   começam os mal-entendidos.

2. **Nota só existe com autor humano.** Ver regra 70. É a invariante mais importante do
   sistema e deve ser impossível de violar por construção, não por convenção.

3. **Avaliação tem modo**, e o modo define a trilha de aplicação e correção: online
   objetiva, online discursiva, papel com foto, trabalho de entrega, presencial. O núcleo é
   o mesmo nos cinco; o que muda é a entrada e a correção.

4. **Em todos os modos, a nota termina dentro do sistema.** Um modo que deixa a nota de fora
   quebra o painel do coordenador e a notificação da família, que são justamente as partes
   que fecham o loop e vendem o produto.

5. **Turma, vínculo e nota pertencem a um ano letivo.** Nada é perpétuo. Modelar o ano
   letivo como dimensão desde o começo custa pouco; adicionar depois custa uma migration em
   quase todas as tabelas.

6. **Matrícula é única por escola, nunca globalmente.** Dois alunos em cidades diferentes
   podem ter a mesma matrícula, e isso é normal.

7. **O aluno entra por reivindicação de nome aprovada pelo professor**, nunca por
   autocadastro. Ver fluxo 1 em `docs/fluxos.md`.

8. **O calendário do professor deriva da estrutura da escola.** Ele preenche o que vai dar
   em cada aula; ele não inventa a grade.

9. **Agente é thread com histórico e nível de autonomia declarado.** A entrega nasce
   pendente sempre que houver nota, comunicação com família ou decisão sobre o aluno.

10. **Material ingerido pertence ao tenant da escola** e nunca cruza para outra, nem vira
    banco nosso. Ver `docs/regulacao.md` seção 4.

11. **A matriz de visibilidade é esta, e exceção se discute antes:** rede vê agregado;
    coordenação vê a unidade; professor vê suas turmas; aluno vê a si; responsável vê o
    filho.

12. **Toda funcionalidade nova responde a uma pergunta:** isso melhora o loop escola →
    professor → aluno → coordenação → família? Se não melhora, provavelmente é distração,
    por mais interessante que seja construir.
