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
            // Handle incoming messages from the server
        }
    }
}
Socket.init();




function testSend() {
    Socket.send({ fn: "ping" });
}
window.testSend = testSend;