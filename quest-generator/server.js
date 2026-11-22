require("dotenv").config();

const express = require("express");
const authroutes = require("./Authentication/authroutes");

const app = express();

app.use(express.json());

app.use("/auth", authroutes);

app.get("/", (req, res) => {
  res.json({
    message: "Quest Generator API Running"
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;