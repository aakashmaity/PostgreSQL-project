import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "011098",
  port: 5432,
})
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function fetchVisited(){
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];

  result.rows.forEach((country) => {
    countries.push(country.country_code)
  })

  return countries;
}

// GET home page
app.get("/", async (req, res) => {
  const countries = await fetchVisited();
  res.render("index.ejs", {countries: countries, total: countries.length});
  
});


//INSERT new country
app.post("/add", async (req,res) => {
  // console.log(req.body);
  const input = req.body["country"];

  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ;", [input.toLowerCase()]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/");
    } catch (error) {
      console.log(error);
      const countries = await fetchVisited();
      res.render("index.ejs", {
        countries,
        total: countries.length,
        error: "Country has already been added, try more"
      });
    }
  } catch (error) {
    console.log(error);
    const countries = await fetchVisited();
    res.render("index.ejs", {
      countries,
      total: countries.length,
      error: "Country name does not exist, try again..."
    });
  }
})



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
