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

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let items = [];
let currentTimeline = "today";


async function getItems(timeline) {
  try {
    let result=[];
    switch (timeline) {
      
      // only today
      case "today":  
        result = await db.query("SELECT * FROM todolist WHERE task_date = CURRENT_DATE ORDER BY task_date ASC");
        items = result.rows;
        break;

      // only this week - day difference <= 7 AND not today
      case "week":
        result = await db.query("SELECT * FROM todolist WHERE EXTRACT(DAY FROM AGE(CURRENT_DATE, task_date)) <= 7 AND task_date != CURRENT_DATE ORDER BY task_date ASC");
        items = result.rows;
        break;

      // only this month - month difference = 0 AND day difference > 7
      case "month":
        result = await db.query("SELECT * FROM todolist WHERE EXTRACT(MONTH FROM AGE(CURRENT_DATE, task_date)) = 0 AND EXTRACT(DAY FROM AGE(CURRENT_DATE, task_date)) > 7 ORDER BY task_date ASC");
        items = result.rows;
        break;

      // all past - month difference > 0
      case "past":
        result = await db.query("SELECT * FROM todolist WHERE EXTRACT(MONTH FROM AGE(CURRENT_DATE, task_date)) > 0 ORDER BY task_date ASC");
        items = result.rows;
        break;
      default:
        break;
    }
    console.log("items: ",items);
    return items;
  } catch (error) {
    console.log(error);
    return items;
  }
}

app.get("/", async (req,res) => {
  const listItems = await getItems(currentTimeline);
  res.render("index.ejs",{
    listItems,
    currentTimeline
  })
});

app.post("/add", async (req,res) => {
  const item = req.body.newItem;
  const taskDate = req.body.taskDate;

  const text =  item.trim();
  if(text.length > 0 || text !== "") {
    try {
      await db.query("INSERT INTO todolist (title, task_date) VALUES ($1,$2);",[text, taskDate]);
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/");
  }
});

app.post("/edit", async (req,res) => {
  const updatedTitle = req.body.updatedItemTitle;
  const updatedId = req.body.updatedItemId;
  
  try {
    await db.query("UPDATE todolist SET title = $1 WHERE id = $2;",[updatedTitle, updatedId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async (req,res) => {
  const deletedId = req.body.deleteItemId
  console.log(deletedId);
  try {
    await db.query("DELETE FROM todolist WHERE id = $1;",[deletedId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/timeline", async (req,res) => {
  const timeline = req.body.taskTimeline;
  console.log("timeline: ",timeline);

  currentTimeline = timeline;
  const listItems = await getItems(timeline);
  res.render("index.ejs",{
    listItems,
    currentTimeline
  })
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})