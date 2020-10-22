const jwt = require("jwt-simple");
const moment = require("moment");
const SECRET_KEY = "FacciUleamCursosOnline2020VentasOnline";

exports.ensureAuth = (req, res, next) => {
    if(!req.headers.authorization){
        return res.status(403).send({message: "la peticion no tiene cabecera de autenticacion"});
    }
    const token  = req.headers.authorization.replace(/['"]+/g, "");

    try {
        var payload = jwt.decode(token, SECRET_KEY);
        if(payload.exp <= moment.unix()){
            return res.status(404).send({message: "el token ha expirado"})
        }
    } catch (err) {
        // console.log(err)

        return res.status(404).send({message: "el token es invalido"})
        
    }

    req.user = payload;
    next();
}



