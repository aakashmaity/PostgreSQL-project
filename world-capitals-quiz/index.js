import express from "express";
import bodyParser from "body-parser";
import pg from "pg"


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "011098",
  port: 5432
});

try {
  db.connect();
  console.log("connected to postgres");
} catch (error) {
  console.log(error.message)
}

const app = express();
const port = 3000;

let quizs = [];

db.query("SELECT * FROM capitals", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    quizs = res.rows;
  }
  db.end();
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let totalCorrect = 0;
let currentQuestion = {};

async function nextQuestion() {
  let idx = Math.floor(Math.random() * quizs.length);
  currentQuestion = quizs[idx];
}

// GET home page
app.get("/",(req, res) => {
  totalCorrect = 0;
  nextQuestion();
  console.log(currentQuestion);
  res.render("index.ejs", { 
    question: currentQuestion
  });
});

// POST a new post
app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;
  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
