# Não me esqueça

Aplicação web responsiva para organizar compromissos.

## Rodar localmente
1. Instale o Node.js (versão 20.19+ ou 22.12+).
2. Extraia o projeto e abra a pasta no terminal.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra o endereço local mostrado pelo Vite.

## Recursos
- Calendário mensal com marcação visual dos dias com eventos.
- Criar, editar e excluir compromissos.
- Categorias, horário e observações.
- Busca e lista dos próximos compromissos.
- Persistência no navegador via localStorage.
- Notificações do navegador para o dia anterior e para o dia do evento.

## Importante sobre os avisos
Na versão inicial, os lembretes são disparados enquanto o app está aberto (ou quando é aberto novamente) e a permissão de notificações está concedida. Navegadores não garantem notificações agendadas com o site fechado. Para avisos confiáveis mesmo com o navegador fechado, é necessário evoluir para PWA com push notifications e um backend (por exemplo Firebase Cloud Messaging + Cloud Functions) ou integrar com Google Calendar.

Os dados ficam salvos neste navegador/dispositivo. Não há sincronização entre aparelhos nesta versão.
