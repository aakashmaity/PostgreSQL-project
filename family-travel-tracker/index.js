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
});
db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


let currentUserId = 1;
let users = [];

async function fetchVisitedCountries() {
    const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1;",[currentUserId]);
    
    let countries = [];
    result.rows.forEach((country) => {
        countries.push(country.country_code);
    });
    return countries;
}
async function fetchCurrentUser() {
    const result = await db.query("SELECT * FROM users");
    users = result.rows;
    
    const currUser = users.find((user) => user.id == currentUserId);
    return currUser;
}

app.get("/",async (req,res) => {
    const countries = await fetchVisitedCountries();
    const currentUser = await fetchCurrentUser();
    console.log(currentUser);
    
    res.render("index.ejs",{
        users,
        countries,
        total: countries.length,
        color: currentUser.color
    });
})
app.post("/add",async (req,res) => {
    const input = req.body["country"];
    const currentUser = await fetchCurrentUser();
    
    try {
        const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) = LOWER($1);",[input]);
        const data = result.rows[0];
        const countryCode = data.country_code;
    
        try {
            await db.query("INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)",[countryCode, currentUser.id])
            res.redirect("/");
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});

app.post("/user",(req,res) => {
    if(req.body.addUser == "new"){
        res.render("new.ejs")
    } else {
        currentUserId = req.body.userId;
        res.redirect("/");
    }
});

app.post("/new",async (req,res) => {
    const name = req.body.name;
    const color = req.body.color;

    const result = await db.query("INSERT INTO users (name,color) VALUES($1, $2) RETURNING *;",
        [name,color]
    );

    const id = result.rows[0].id;
    currentUserId = id;
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});