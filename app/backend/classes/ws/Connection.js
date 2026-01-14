import SocketResponse from "./SocketResponse.js";
import Socket from "../../Socket.js";



class Connection {
    constructor(ws) {
        this.ws = ws;

        this.id = Math.random().toString(36).substring(2, 15);

        ws.on("close", () => Socket.removeConnection(this));
        ws.on("error", () => Socket.removeConnection(this));
    }

    send(data) {
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(data);
        }
    }

    close() {
        this.ws.close();
    }

    handleMessage(data) {
        let response = new SocketResponse({
            error: "Unknown command"
        });

        // data is a buffer so far
        const message = JSON.parse(data.toString());
        // console.log("Received message from client:", message);

        switch(message.fn) {
            case "ping":
                response = new SocketResponse({
                    message: "pong"
                });
                break;
            default:
                break;
        }

        // Send a response back to the client
        if(response) {
            this.send(response.stringify());
        }
    }
}

export default Connection;