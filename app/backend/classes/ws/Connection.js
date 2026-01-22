import SocketResponse from "./SocketResponse.js";
import Socket from "../../Socket.js";

import Auth from "../../Auth.js";


class Connection {
    constructor(ws) {
        this.ws = ws;

        this.authenticated = false;

        this.token = Math.random().toString(36).substring(2, 15) + `-` + Math.random().toString(36).substring(2, 15) + `-` + Date.now();

        ws.on("close", () => Socket.removeConnection(this));
        ws.on("error", () => Socket.removeConnection(this));
    }

    authenticate({ username, password, token }) {
        if (Auth.authenticate(username, password, token)) {
            this.authenticated = true;
        }
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

        response.token = this.token;
        if(response) {
            this.send(response.stringify());
        }
    }
}

const ConnectionList = new Set(); 
function doesConnectionExist(token) {
    for(const connection of ConnectionList) {
        if(connection.token === token) {
            return true;
        }
    }
    return false;
}
function getConnection(token) {
    for(const connection of ConnectionList) {
        if(connection.token === token) {
            return connection;
        }
    }
    return null;
}

export { Connection, ConnectionList, doesConnectionExist, getConnection };