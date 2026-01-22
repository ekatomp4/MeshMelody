import { doesConnectionExist, getConnection } from "../classes/ws/Connection.js";
import Auth from "../Auth.js";

const APIRoutes = {
    "ping": {
        isPrivate: true,
        fn: (req, res, token) => {
            console.log(`Ping received from ${token}`);
            res.send("pong")
        }
    },
    "connect": {
        isPrivate: true,
        fn: (req, res, token) => {
            res.send("Connected");
        }
    },
    "login": {
        isPrivate: true,
        fn: (req, res, token) => {
            // get req

            const data = req.query;

            console.log(data);
            const connectionReference = getConnection(token);
            // username, password, token
            const authInput = {
                username: data.username,
                password: data.password,
                token: token
            }

            // this doesnt exist
            // console.log(connectionReference)
            // connectionReference.authenticate(authInput);
        }
    }
};

export default APIRoutes