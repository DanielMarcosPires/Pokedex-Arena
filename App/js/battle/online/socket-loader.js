// Mantemencao da batalha: parte 10 (Organizada e Limpa)

// Carrega dinamicamente o script do cliente Socket.IO caso ainda não esteja disponível na página
function loadSocketIoClient() {
    if (typeof window.io === "function") return Promise.resolve();
    if (socketIoClientPromise) return socketIoClientPromise;
    
    // Valida se o protocolo atual suporta requisições ao servidor Node.js (ex: http/https)
    if (!["http:", "https:"].includes(window.location.protocol)) {
        return Promise.reject(new Error("Abra a página pelo servidor Node.js para jogar online."));
    }

    socketIoClientPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/socket.io/socket.io.js";
        script.async = true;
        
        script.onload = () => {
            if (typeof window.io === "function") {
                resolve();
            } else {
                reject(new Error("O cliente Socket.IO não foi carregado pelo servidor."));
            }
        };
        
        script.onerror = () => reject(new Error("Não foi possível carregar o cliente Socket.IO."));
        document.head.append(script);
    });

    // Reseta a promise em caso de erro para permitir novas tentativas futuras
    return socketIoClientPromise.catch((error) => {
        socketIoClientPromise = null;
        throw error;
    });
}