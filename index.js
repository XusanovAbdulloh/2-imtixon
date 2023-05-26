import express from "express";
import Routes from "./routes/rout.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(Routes);

app.listen(3000, () => {
  console.log('3000port');
});
