# Não me esqueça — versão 4

Agenda pessoal responsiva feita com React + Vite.

## Executar

1. Instale Node.js 20.19+ ou 22.12+.
2. Extraia o ZIP e abra a pasta no terminal.
3. Rode `npm install`.
4. Rode `npm run dev` e abra o endereço informado pelo Vite.

## Funcionalidades

- Calendário mensal com marcação dos dias que têm compromissos.
- Agenda do dia com horários e status.
- Cadastro, edição, conclusão, exclusão e duplicação de compromissos.
- Repetição diária, semanal, mensal ou anual com quantidade limitada de ocorrências (2 a 24).
- Aviso visual quando dois compromissos do mesmo dia se sobrepõem, considerando a duração cadastrada.
- Painel dos próximos sete dias.
- Busca por texto, filtros por status e categoria.
- Prioridade, categoria, local, duração e anotações.
- Impressão da agenda, exportação `.ics` e backup/restauração JSON.
- Notificações locais do navegador para o dia anterior e o dia do compromisso.
- Persistência local via `localStorage`.

## Limitações importantes

Os dados ficam neste navegador e dispositivo; ainda não há login ou sincronização na nuvem. As notificações locais só são verificadas enquanto o app está aberto. Para notificações confiáveis com o navegador fechado e sincronização entre aparelhos, é necessária uma etapa de backend/PWA com Firebase Cloud Messaging e agendamento no servidor.

Ao editar um compromisso recorrente, a alteração afeta somente aquela ocorrência. As ocorrências são criadas individualmente na quantidade escolhida, não como uma regra infinita.
