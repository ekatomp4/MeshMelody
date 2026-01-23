import SocketResponse from "./SocketResponse.js";
import Socket from "../../Socket.js";
import Auth from "../../Auth.js";
import Security from "../security/Security.js";

class Connection {
    constructor(ws) {
        this.ws = ws;

        this.authenticated = false;

        this.token = Security.generateToken();

        ws.on("close", () => Socket.removeConnection(this));
        ws.on("error", () => Socket.removeConnection(this));
    }

    authenticate({ username, password, token }) {
        // console.log("Authenticating connection...", username, password, token);
        // TODO: make this actually auth with hash
        if (Auth.authenticate(username, password, token)) {
            this.authenticated = true;
        }
        return this.authenticated;
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

        // TODO: private commands as well
        switch(message.fn) {
            case "ping":
                response = new SocketResponse({
                    message: "pong"
                });
                break;
            case "connect":
                response = new SocketResponse({
                    message: "connected"
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
    if(!token) throw new Error("No token provided");

    for(const connection of ConnectionList) {
        if(connection.token === token) {
            return true;
        }
    }
    return false;
}
function getConnection(token) {
    if(!token) throw new Error("No token provided");

    for(const connection of ConnectionList) {
        if(connection.token === token) {
            return connection;
        }
    }
    return null;
}

export { Connection, ConnectionList, doesConnectionExist, getConnection };