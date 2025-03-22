import express from "express";
import registerSchema from '../validators/registerSchema.js';
import vine from '@vinejs/vine';
import sql from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/register', async (req, res) => {
  // Getting data
  const data = req.body;

  // Validating the user using Vine
  try {
    const output = await vine.validate({
      schema: registerSchema,
      data
    });
    console.log("Validation passed:", output);
  } catch (error) {
    console.error("Validation error:", error.messages);
    return res.status(400).json({ error: "Validation failed", details: error });
  }

  // Check if user already exists

  const { username, email } = req.body;

  const duplicate_output = await sql`
    select
      *
    from users
    where username = ${username} or email = ${email}  
  `

  if (duplicate_output.length > 0) {
    console.log("Username or Email already exists")
    return res.status(409).json({error: "User already exists",
                          message: "This username or email is already in use"});
  }

  // Hashing to prevent people (even myself) from accessing the password directly via the DB
  const {password} = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  await sql`
    INSERT INTO users (username, email, password, balance, created_at, last_visit)
    VALUES (${username}, ${email}, ${hash}, 0, NOW(), NOW())  
  `;

  return res.status(201).json({message: "User registration success!"});

  // res.send("register account success");
  
});


router.post('/login', async (req, res) => {
  const data = req.body;

  const {login, password} = req.body;

  const userExists = await sql`
    select
      *
    from users
    where username = ${login} or email = ${login}
  `

  if (userExists.length <= 0) {
    console.log("User does not exist, please register an account")
    return res.status(404).json({error: "User does not exist", message: "This user does not exist, please register an account!"});
  }

  const user = userExists[0];
  bcrypt.compare(password, hash, (err, res) => {
    if (res === true) {
      sql`
        update users
        set last_visit = NOW()
        where username = ${login} or email = ${login}
      `
      console.log("Login success");
    } else {
      console.log("Login fail");
    }
  });

});


export default router;


