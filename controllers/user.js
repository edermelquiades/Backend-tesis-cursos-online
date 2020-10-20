const bcrypt = require("bcrypt-nodejs");
const jwt = require("../services/jwt");
const User = require("../models/user");

function register(req, resp) {
  const user = new User();

  const {
    email,
    password,
    repeatPassword,
    name,
    lastname,
    birthday,
    role,
  } = req.body;

  if (!email || email === "") {
    resp.status(404).send({ message: "email no definido, procura definirlo" });
    return null;
  } else {
    user.email = email.toLowerCase();
  }
  if (!name || name === "") {
    resp.status(404).send({ message: "nombre no definido, procura definirlo" });
    return null;
  } else {
    user.name = name;
  }
  if (!lastname || lastname === "") {
    resp
      .status(404)
      .send({ message: "apellido no definido, procura definirlo" });
    return null;
  } else {
    user.lastname = lastname;
  }
  if (!birthday || birthday === "") {
    resp
      .status(404)
      .send({ message: "fecha de nacimieno no definido, procura definirlo" });
    return null;
  } else {
    var fechaNace = new Date(birthday);
    var fechaActual = new Date();

    var mes = fechaActual.getMonth();
    var dia = fechaActual.getDate();
    var año = fechaActual.getFullYear();

    fechaActual.setDate(dia);
    fechaActual.setMonth(mes);
    fechaActual.setFullYear(año);

    edad = Math.floor((fechaActual - fechaNace) / (1000 * 60 * 60 * 24) / 365);

    if (edad < 18) {
      resp
        .status(404)
        .send({ message: "eres menor de edad no puedes registrarte" });
      return null;
    } else {
      user.birthday = birthday;
    }
  }
  if (!role || role === "") {
    resp.status(404).send({ message: "rol no definido, procura definirlo" });
    return null;
  } else {
    user.role = role;
  }
  if (!password || !repeatPassword) {
    resp.status(404).send({ message: "las contraseñas son obligatoria" });
  } else {
    if (password !== repeatPassword) {
      resp
        .status(404)
        .send({ message: "las contraseñas tienen que ser iguales" });
    } else {
      bcrypt.hash(password, null, null, function (err, hash) {
        if (err) {
          res.status(500).send({ message: "error al ecriptar la contraseña" });
        } else {
          user.password = hash;
          (user.registerDate = new Date().toISOString()), (user.active = false);

          user.save((err, userStored) => {
            if (err) {
              resp.status(500).send({ message: "Usuario ya existe" });
            } else {
              if (!userStored) {
                resp.status(404).send({ message: "Error al crear el usuario" });
              } else {
                resp.status(200).send({ user: userStored });
              }
            }
          });
        }
      });
    }
  }
}

function login(req, resp) {
  const params = req.body;
  const email = params.email.toLowerCase();
  const password = params.password;
  User.findOne({ email }, (err, userStored) => {
    if (err) {
      resp.status(500).send({ message: "Error del servidor" });
    } else {
      if (!userStored) {
        resp.status(404).send({ message: "Su Usuario no fue encontrado" });
      } else {
        bcrypt.compare(password, userStored.password, (err, check) => {
          if (err) {
            resp.status(500).send({ message: "Error del servidor" });
          } else if (!check) {
            resp.status(404).send({ message: "La contraseña es incorrecta" });
          } else {
            if (!userStored.active) {
              resp.status(200).send({
                code: 200,
                message: "El usuario aun no se encuentra activo",
              });
            } else {
              resp.status(200).send({
                accessToken: jwt.createAccessToken(userStored),
                refreshToken: jwt.createRefreshToken(userStored),
              });
            }
          }
        });
      }
    }
  });
}

module.exports = {
  register,
  login,
};