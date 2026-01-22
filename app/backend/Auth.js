class Auth {
    static authenticate(username, password, token) {
        if(token) {
            // revive a token 
            let isTokenValid = true;
            if(isTokenValid) {
                return true;
            }
        }
        if(username && password) {
            // normal login
            let isCredentialsValid = true;
            if(isCredentialsValid) {
                return true;
            }
        }
    }
}

export default Auth