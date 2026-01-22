console.log('Loaded all.js');

// frontend socket connector
class Socket {
    static socket = null;

    static send(data) {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error("WebSocket is not open. Unable to send message.");
        }
    }

    static init() {
        this.socket = new WebSocket(`ws://${window.location.hostname}:5949`);

        this.socket.onopen = () => {
            console.log("WebSocket connection established");

            // this.send({
            //     fn: "ping"
            // });
        }

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if(message.error) {
                console.error("Error from server:", message.error);
            }

            console.log("Received message from server:", message);
            if(message.token) {
                sessionStorage.setItem("token", message.token);
            }
            // Handle incoming messages from the server
        }
    }
}

Socket.init();
window.Socket = Socket;


function testSend() {
    Socket.send({ fn: "ping" });
}
window.testSend = testSend;


class Backend {
    static async fetch(path, data) {

        const token = sessionStorage.getItem("token");
        data = data || {};
        data.token = token;

        let formattedPath = path.startsWith("/") ? path : "/" + path;

        if(data) {
            formattedPath += "?";
            for(const param in data) {
                formattedPath += `${param}=${data[param]}&`;
            }
        }
        


        const res = await fetch(`/api${formattedPath}`, data);
        const txt = await res.text();
        return txt;
    }
}
window.Backend = Backend;