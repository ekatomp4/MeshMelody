import http from "http";
import { WebSocketServer } from "ws";

import {Connection, ConnectionList} from "./classes/ws/Connection.js";
import SocketResponse from "./classes/ws/SocketResponse.js";

class Socket {
    static server = null;
    static wss = null;
    static connections = ConnectionList;

    static getConnectionAmount() {
        return this.connections.size;
    }

    static init(app, port) {
        this.server = http.createServer(app);
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on("connection", (ws) => {
            const connection = new Connection(ws);
            this.connections.add(connection);

            console.log("New WebSocket connection established");

            ws.on("message", (data) => {
                connection.handleMessage(data);
            });

            ws.on("close", () => Socket.removeConnection(connection));
        });

        this.server.listen(port, () => {
            console.log(`HTTP + WS listening on ${port}`);
        });
    }

    static removeConnection(connection) {
        this.connections.delete(connection);
        console.log("WebSocket connection removed");
    }

    static broadcast(data) {
        for (const conn of this.connections) {
            conn.send(new SocketResponse({
                message: data,
                from: "broadcast"
            }).stringify());
        }
    }
}

// setInterval(() => {
//     console.log(`WebSocket connections: ${Socket.getConnectionAmount()}`);
// }, 1000 * 60);

export default Socket;
