# Partidas online

A aplicação continua oferecendo partidas locais. Para criar uma sala online, execute o servidor Node.js e abra a página pelo endereço servido por ele.

## Executar

Requer Node.js 20 ou superior.

```powershell
npm install
npm start
```

Abra `http://localhost:3000/batalha.html`. Um jogador cria a sala e compartilha o código de seis caracteres; o outro entra com esse código. Cada jogador escolhe seis Pokémon e envia o próprio time. As jogadas acontecem por turnos, e o servidor mantém a conexão entre os dois navegadores.

Para jogar em computadores diferentes, publique o projeto em um host Node.js que aceite conexões WebSocket e use HTTPS. O host serve tanto a página quanto o Socket.IO; não abra `batalha.html` diretamente como arquivo.

As salas são temporárias e usam memória do servidor. Se o servidor cair ou o host desconectar, a partida termina. O navegador do criador da sala executa as regras da batalha; o servidor encaminha as ações e mantém a sala privada pelo código de convite.
