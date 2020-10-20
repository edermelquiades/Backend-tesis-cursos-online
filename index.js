const chalk = require("chalk");
const mongoose = require("mongoose");
const app = require("./app");
const port = process.env.PORT || 2002;
const portDb = 20017;
const { API_VERSION } = require("./config");

mongoose.set("useFindAndModify", false);

mongoose.connect(
  "mongodb+srv://facci:facciUleam2020@cluster0.3gxvw.mongodb.net/facci-cursos-online?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, res) => {
    if (err) {
      throw err;
    } else {
      console.log("La conexión a la base de datos es correcta");
      app.listen(port, () => {
        console.log(`STATUS: ${chalk.greenBright("ONLINE")}`);
        console.log(
          `MESSAGE: ${chalk.greenBright("API MERN - CURSOS VIRTUAL")}`
        );

        console.log(`http://localhost:${port}/api/${API_VERSION}/`);
      });
    }
  }
);
