import { doesConnectionExist, getConnection, ConnectionList } from "../classes/ws/Connection.js";

const APIRoutes = {
    "ping": {
        isPrivate: true,
        fn: (req, res, token) => {
            console.log(`Ping received from ${token}`);
            return "pong";
        }
    },
    "connect": {
        isPrivate: false,
        fn: (req, res, token) => {
            // res.send("Connected");
            return "Connected";
        }
    },
    "login": {
        isPrivate: false,
        fn: (req, res, token) => {
            // get req

            const data = req.query;

            const connectionReference = getConnection(token);
            // username, password, token
            const authInput = {
                username: data.username,
                password: data.password,
                token: token
            }

            // this doesnt exist
            // console.log(connectionReference)
            if(!connectionReference) {
                res.status(401).send("Unauthorized");
                return;
            }
            const isAuthenticated = connectionReference.authenticate(authInput);
            if(!isAuthenticated) {
                res.status(401).send("Unauthorized");
                return;
            }
            return "Successfully logged in";
        }
    }
};

export default APIRoutes