const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt-nodejs");
const jwt = require("../services/jwt");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const moment = require("moment");
const chalk = require("chalk");
const URL_CLIENT = "http://localhost:3000";

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

function getUsers(req, res) {
  // const { role } = req.body;
  const page = 1;

  const limit = 1;

  // User.find(req.query).then((users) => {
  //   if (!users) {
  //     res.status(404).send({ message: "No se ha encontrado ningun usuario" });
  //   } else {
  //     res.status(200).send({ users });
  //   }
  // });
  User.find(req.query.role, (err, Stored) => {
    if (err) {
      res.status(500).send({ message: "Error de servidor" });
      //
    } else {
      if (!Stored) {
        resp.status(200).send({
          code: 404,
          message: "El usuario aun no se encuentra activo",
        });
      } else {
        res.status(200).send({ Stored });
      }
    }
  })
    .limit(limit)
    .skip(page)
    .sort("desc");
}

function getUsersActive(req, res) {
  // const { role } = req.body;

  // const limit = parseInt(req.query.limit); // Asegúrate de parsear el límite a número
  // const skip = parseInt(req.query.skip);// Asegúrate de parsear el salto a número
  const { page = 1, limit = 10 } = req.query;
  let query = req.query;
  const options = {
    page,
    limit: parseInt(limit),
    sort: { date: "desc" },
  };
  User.paginate(
    { active: query.active, role: query.role },
    options,
    (err, userStored) => {
      if (err) {
        res.status(500).send({ message: "Error del servidor." });
      } else {
        if (!userStored) {
          res.status(404).send({ message: "No se ha encontrado ningun post." });
        } else {
          res.status(200).send({ user: userStored });
        }
      }
    }
  );

  // console.log(query)
  // User.find({ active: query.active, role: query.role }, (err, Stored) => {

  //   if (err) {
  //     res.status(500).send({ message: "Error de servidor" });
  //   } else {
  //     if (!Stored) {
  //       resp.status(200).send({
  //         code: 404,
  //         message: "El usuario aun no se encuentra activo",
  //       });
  //     } else {
  //       res.status(200).send({ Stored });
  //     }
  //   }
  // })
  // .skip(skip) // Siempre aplicar "salto" antes de "límite
  // .limit(limit)
  // .sort("desc")

  // User.find({ active: query.active, role: query.role }).then((users) => {
  //   if (!users) {
  //     res.status(404).send({ message: "No se ha encontrado ningun usuario" });
  //   } else {
  //     res.status(200).send({ users });
  //   }
  // })
}
function uploadAvatar(req, res) {
  const params = req.params;

  User.findById({ _id: params.id }, (err, userData) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor." });
    } else {
      if (!userData) {
        res
          .status(404)
          .send({ message: "No se ha encontrado ningun usuario." });
      } else {
        let user = userData;

        if (req.files) {
          let filePath = req.files.avatar.path;
          let fileSplit = filePath.split("\\");
          let fileName = fileSplit[2];

          let extSplit = fileName.split(".");
          console.log(extSplit);
          let fileExt = extSplit[1];

          if (fileExt !== "png" && fileExt !== "jpg") {
            res.status(400).send({
              message:
                "La extension de la imagen no es valida. (Extensiones permitidas: .png y .jpg)",
            });
          } else {
            user.avatar = fileName;
            User.findByIdAndUpdate(
              { _id: params.id },
              user,
              (err, userResult) => {
                if (err) {
                  res.status(500).send({ message: "Error del servidor." });
                } else {
                  if (!userResult) {
                    res
                      .status(404)
                      .send({ message: "No se ha encontrado ningun usuario." });
                  } else {
                    res.status(200).send({ avatarName: fileName });
                  }
                }
              }
            );
          }
        }
      }
    }
  });
}

function getAvatar(req, res) {
  const avatarName = req.params.avatarName;
  const filePath = "./uploads/avatar/" + avatarName;
  fs.exists(filePath, (exists) => {
    if (!exists) {
      res.status(404).send({ message: "El avatar que buscas no existe" });
    } else {
      res.sendFile(path.resolve(filePath));
    }
  });
}

async function updateUser(req, res) {
  let userData = req.body;
  userData.email = req.body.email.toLowerCase();
  const params = req.params;

  if (userData.password) {
    await bcrypt.hash(userData.password, null, null, (err, hash) => {
      console.log(userData.password);
      if (err) {
        res.status(500).send({ message: "Error al encriptar la contraseña" });
      } else {
        userData.password = hash;
      }
    });
  }

  User.findByIdAndUpdate({ _id: params.id }, userData, (err, userUpdate) => {
    if (err) {
      res.status(500).send({ message: "Email ya existe" });
    } else {
      if (!userUpdate) {
        res
          .status(404)
          .send({ message: "No  se ha encontrado ningun usuario" });
      } else {
        res
          .status(200)
          .send({ message: "Usuario se ha actualizado correctamente" });
      }
    }
  });
}

function activateUser(req, res) {
  const { id } = req.params;
  const { active } = req.body;

  User.findByIdAndUpdate(id, { active }, (err, useStored) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor" });
    } else {
      if (!useStored) {
        res.status(404).send({ message: "No se ha encontrado el usuario" });
      } else {
        if (active === true) {
          res.status(200).send({ message: "Usuario activado correctamente" });
        } else {
          res
            .status(200)
            .send({ message: "Usuario desactivado correctamente" });
        }
      }
    }
  });
}

function deleteUser(req, res) {
  const { id } = req.params;

  User.findByIdAndRemove(id, (err, userDelete) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor" });
    } else {
      if (!userDelete) {
        res.status(404).send({ message: "Usuario no encontrado" });
      } else {
        res
          .status(200)
          .send({ message: "El usuario ha sido eliminado correctamente" });
      }
    }
  });
}

function registerAdmin(req, res) {
  const user = new User();

  const { email, password, name, lastname, birthday, role } = req.body;

  user.active = false;

  if (!email || email === "") {
    res.status(404).send({ message: "email no definido, procura definirlo" });
    return null;
  } else {
    user.email = email.toLowerCase();
  }
  if (!name || name === "") {
    res.status(404).send({ message: "nombre no definido, procura definirlo" });
    return null;
  } else {
    user.name = name;
  }
  if (!lastname || lastname === "") {
    res
      .status(404)
      .send({ message: "apellido no definido, procura definirlo" });
    return null;
  } else {
    user.lastname = lastname;
  }
  if (!birthday || birthday === "") {
    res
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
      res
        .status(404)
        .send({ message: "eres menor de edad no puedes registrarte" });
      return null;
    } else {
      user.birthday = birthday;
    }
  }
  if (!role || role === "") {
    res.status(404).send({ message: "rol no definido, procura definirlo" });
    return null;
  } else {
    user.role = role;
  }

  if (!password) {
    res.status(404).send({ message: "las contraseñas son obligatoria" });
  } else {
    bcrypt.hash(password, null, null, function (err, hash) {
      if (err) {
        res.status(500).send({ message: "error al ecriptar la contraseña" });
      } else {
        user.password = hash;
        (user.registerDate = new Date().toISOString()), (user.active = false);

        user.save((err, userStored) => {
          if (err) {
            res.status(500).send({ message: "Usuario ya existe" });
          } else {
            if (!userStored) {
              res.status(404).send({ message: "Error al crear el usuario" });
            } else {
              const token = jwt.createAccessTokenActiveEmail(userStored);

              const html = `Para activar la cuenta haz click sobre esto : <a href="${URL_CLIENT}/active/${token}">Click aqui</a>  `;
              const transport = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                  user: "faciiuleam2020@gmail.com",
                  pass: "tjflklmeshapgdbz",
                },
              });

              transport
                .verify()
                .then(() => {
                  console.log(
                    "==============================NODEMAILER CONFIG=============================="
                  );
                  console.log(`STATUS: ${chalk.greenBright("ONLINE")}`);
                  console.log(`STATUS: ${chalk.greenBright("MAILER CONNECT")}`);
                })
                .catch((error) => {
                  console.log(
                    "==============================NODEMAILER CONFIG=============================="
                  );
                  console.log(`STATUS: ${chalk.greenBright("OFFILE")}`);
                  console.log(`STATUS: ${chalk.redBright(error)}`);
                });

              transport.sendMail({
                from: '"🛍️ Facci Cursos" <faciiuleam2020@gmail.com>',
                to: userStored.email,
                subject: "activa tu usuario ",
                text: " activa tu usuario",
                html,
              });
              res.status(200).send({
                message: `Usuario creado correctamente se a enviado un email al correo ${userStored.email} para su activacion`,
              });
            }
          }
        });
      }
    });
  }
}

async function verificarActivarUsuario(req, res) {
  const token = req.body.token;
  let pass = req.body.password;
  const check = jwt.verifyToken(token);

  const { email } = check;
  if (pass) {
    await bcrypt.hash(pass, null, null, (err, hash) => {
      if (err) {
        res.status(500).send({ message: "Error al encriptar la contraseña" });
      } else {
        pass = hash;
      }
    });
  }

  if (check === "invalido") {
    res.status(404).send({ message: "El token es invalido" });
  } else {
    User.findOne({ email }, (error, data) => {
      const active = true;

      if (data.email !== email) {
        res.status(404).send({ message: "el token no pertenece a sus datos" });
      } else {
        if (!data) {
          res
            .status(404)
            .send({ message: "No  se ha encontrado ningun usuario" });
        } else {
          const password = pass;
          User.findByIdAndUpdate(
            data._id,
            { active, password },
            (err, useStored) => {
              if (err) {
                res.status(500).send({ message: "Error del servidor" });
              } else {
                if (!useStored) {
                  res
                    .status(404)
                    .send({ message: "No se ha encontrado el usuario" });
                } else {
                  if (active === true) {
                    res
                      .status(200)
                      .send({ message: "Usuario activado correctamente" });
                  } else {
                    res
                      .status(200)
                      .send({ message: "Usuario desactivado correctamente" });
                  }
                }
              }
            }
          );
        }
      }
    });
    // res.status(404).send({ message: "El token es valido" });
  }
}

function inquietudes(req, res) {
  const { email, subject, text } = req.body; // const html = `Para activar la cuenta haz click sobre esto : <a href="${URL_CLIENT}/active/${token}">Click aqui</a>  `;
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "faciiuleam2020@gmail.com",
      pass: "tjflklmeshapgdbz",
    },
  });
  console.log(email);
  transport
    .verify()
    .then(() => {
      console.log(
        "==============================NODEMAILER CONFIG=============================="
      );
      console.log(`STATUS: ${chalk.greenBright("ONLINE")}`);
      console.log(`STATUS: ${chalk.greenBright("MAILER CONNECT")}`);
    })
    .catch((error) => {
      console.log(
        "==============================NODEMAILER CONFIG=============================="
      );
      console.log(`STATUS: ${chalk.greenBright("OFFILE")}`);
      console.log(`STATUS: ${chalk.redBright(error)}`);
    });

  transport.sendMail({
    from: " <faciiuleam2020@gmail.com>",
    to: "faciiuleam2020@gmail.com",
    subject: subject,
    html: `el email ${email} emite el siguiente mensaje: 
    <br/>
    <br/>
    <br/>
     ${text} 
     <br/>
     <br/>
     <br/>
     <b> es hora de responder da click en el siguiente email ${email}</b> `,
  });
  res.status(200).send({
    message: `${email} su correo fue enviado correctamente`,
  });
}
function registerEstudiante(req, res) {
  const user = new User();

  const { email, password, name, lastname, birthday, role } = req.body;

  user.active = false;

  if (!email || email === "") {
    res.status(404).send({ message: "email no definido, procura definirlo" });
    return null;
  } else {
    user.email = email.toLowerCase();
  }
  if (!name || name === "") {
    res.status(404).send({ message: "nombre no definido, procura definirlo" });
    return null;
  } else {
    user.name = name;
  }
  if (!lastname || lastname === "") {
    res
      .status(404)
      .send({ message: "apellido no definido, procura definirlo" });
    return null;
  } else {
    user.lastname = lastname;
  }
  if (!birthday || birthday === "") {
    res
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
      res
        .status(404)
        .send({ message: "eres menor de edad no puedes registrarte" });
      return null;
    } else {
      user.birthday = birthday;
    }
  }
  if (!role || role === "") {
    res.status(404).send({ message: "rol no definido, procura definirlo" });
    return null;
  } else {
    user.role = role;
  }

  if (!password) {
    res.status(404).send({ message: "las contraseñas son obligatoria" });
  } else {
    bcrypt.hash(password, null, null, function (err, hash) {
      if (err) {
        res.status(500).send({ message: "error al ecriptar la contraseña" });
      } else {
        user.password = hash;
        (user.registerDate = new Date().toISOString()), (user.active = false);

        user.save((err, userStored) => {
          if (err) {
            res.status(500).send({ message: "Usuario ya existe" });
          } else {
            if (!userStored) {
              res.status(404).send({ message: "Error al crear el usuario" });
            } else {
              const token = jwt.createAccessTokenActiveEmail(userStored);

              const html = `Para activar la cuenta haz click sobre esto : <a href="${URL_CLIENT}/active/${token}">Click aqui</a>  `;
              const transport = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                  user: "faciiuleam2020@gmail.com",
                  pass: "tjflklmeshapgdbz",
                },
              });

              transport
                .verify()
                .then(() => {
                  console.log(
                    "==============================NODEMAILER CONFIG=============================="
                  );
                  console.log(`STATUS: ${chalk.greenBright("ONLINE")}`);
                  console.log(`STATUS: ${chalk.greenBright("MAILER CONNECT")}`);
                })
                .catch((error) => {
                  console.log(
                    "==============================NODEMAILER CONFIG=============================="
                  );
                  console.log(`STATUS: ${chalk.greenBright("OFFILE")}`);
                  console.log(`STATUS: ${chalk.redBright(error)}`);
                });

              transport.sendMail({
                from: '"🛍️ Facci Cursos" <faciiuleam2020@gmail.com>',
                to: userStored.email,
                subject: "activa tu usuario ",
                text: " activa tu usuario",
                html,
              });
              res.status(200).send({
                message: `Usuario creado correctamente se a enviado un email al correo ${userStored.email} para su activacion`,
              });
            }
          }
        });
      }
    });
  }
}
function getPerfil(req, resp) {
  User.findById({ _id: req.params.id }, (err, Stored) => {
    if (err) {
      resp.status(500).send({ message: "Error de servidor" });
    } else {
      if (!Stored) {
        resp.status(200).send({
          code: 404,
          message: "El usuario aun no se encuentra activo",
        });
      } else {
        resp.status(200).send({ Stored });
      }
    }
  });
}

module.exports = {
  register,
  login,
  getUsers,
  getUsersActive,
  uploadAvatar,
  getAvatar,
  updateUser,
  activateUser,
  deleteUser,
  registerAdmin,
  verificarActivarUsuario,
  inquietudes,
  registerEstudiante,
  getPerfil,
};
