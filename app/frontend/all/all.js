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

            this.send({
                fn: "connect"
            });
        }

        this.socket.onmessage = (event) => {
            let message = JSON.parse(event.data);

            if(message.error) {
                console.error("Error from server:", message.error);
            }

            try {
                message = JSON.parse(message.data);
            } catch(e) {}

            // console.log("Received message from server:", message);
            if(message.token && message.token !== sessionStorage.getItem("token")) {
                console.log("Saving session token:", message.token);
                sessionStorage.setItem("token", message.token);
            }
            // Handle incoming messages from the server
        }
    }
}

Socket.init();
window.Socket = Socket;

// constantly check connection and try to refresh
setInterval(() => {
    if (Socket.socket && Socket.socket.readyState === Socket.socket.CLOSED) {
        console.log("WebSocket connection closed. Attempting to reconnect...");
        Socket.init();
    }
}, 1000);


function testSend() {
    Socket.send({ fn: "ping" });
}
window.testSend = testSend;


class Backend {

    static async post(path, data) {
        const token = sessionStorage.getItem("token");
        data = data || {};
        data.token = token;    

        let formattedPath = path.startsWith("/") ? path : "/" + path;

        const res = await fetch(`/api${formattedPath}`, { method: "POST", body: JSON.stringify(data) });
        const txt = await res.text();
        return txt;
    }

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
        let txt = await res.text();

        if(txt) {
            try {
                txt = JSON.parse(txt);
            } catch(e) {}
        }

        return txt;
    }
    
}
Backend.fetch("connect").then(txt => console.log(txt));
window.Backend = Backend;






class User {
    static keys = {};
    static mouse = {
        x: 0,
        y: 0,
        down: false,
        dx: 0, // initial click down
        dy: 0 // initial click down
    }
    static init() {
        document.addEventListener("keydown", (e) => {
            User.keys[e.key] = true;
        });
        document.addEventListener("keyup", (e) => {
            User.keys[e.key] = false;
        });
        document.addEventListener("mousemove", (e) => {
            User.mouse.x = e.clientX;
            User.mouse.y = e.clientY;
        });
        document.addEventListener("mousedown", (e) => {
            User.mouse.down = true;
            User.mouse.dx = e.clientX;
            User.mouse.dy = e.clientY;
        });
        document.addEventListener("mouseup", (e) => {
            User.mouse.down = false;
            User.mouse.dx = null;
            User.mouse.dy = null;
        });
    }
}
window.User = User;
window.User.init();
