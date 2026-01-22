
const APIRoutes = {
    "ping": {
        isPrivate: true,
        fn: (req, res, token) => {
            console.log(`Ping received from ${token}`);
            res.send("pong")
        }
    }
};

export default APIRoutes