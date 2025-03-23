import sql from "./config/db.js";
import express from 'express';
import authRoutes from "./routes/auth.js";
import oddRoutes from "./routes/odds.js";

const app = express();
// Json parser middleware -- runs during the request or response cycle
// Basically takes all json type headers, and parses it into the request
app.use(express.json());
app.use("/api", authRoutes);
app.use("/odds", oddRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

