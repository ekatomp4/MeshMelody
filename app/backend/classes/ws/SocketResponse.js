class SocketResponse {
    constructor(data = {}) {
        this.error = data.error || undefined;
        this.message = data.message || undefined;
        this.from = data.from || "server";
    }

    stringify() {
        return JSON.stringify(this);
    }
}

export default SocketResponse;