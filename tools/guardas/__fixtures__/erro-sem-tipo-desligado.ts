// A tentativa de desligar a guarda por comentário. A marca "reprova:" fica na descrição da própria diretiva.
declare const condicao: boolean
// eslint-disable-next-line guardas/erro-tipado -- reprova: @eslint-community/eslint-comments/no-restricted-disable
if (condicao) throw new Error('x')
