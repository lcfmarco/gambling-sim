import express from "express";
import registerSchema from '../validators/registerSchema.js';
import vine from '@vinejs/vine';
import sql from '../config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from "dotenv";

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

  // Gets the login data
  const data = req.body;

  // Stores the login info and password received
  const {login, password} = req.body;

  // Checks if the user exists in DB
  const userExists = await sql`
    select
      *
    from users
    where username = ${login} or email = ${login}
  `
  // If user doesn't exist, error out
  if (userExists.length <= 0) {
    console.log("User does not exist, please register an account")
    return res.status(404).json({error: "User does not exist", message: "This user does not exist, please register an account!"});
  }

  // Store the user row (should only have one user, so the first index)
  const user = userExists[0];

  // Start checking if the password matches the hashed password
  const isMatch = await bcrypt.compare(password, user.password);

  // If it matches, update the last_visit time
  if (isMatch) {
    await sql`
      update users
      set last_visit = NOW()
      where uid = ${user.uid}
    `
    // Return a successful status code

    // Token given to user, so when they login we don't have to keep authenticating everytime
    // User is authenticated until the token expires
    const token = jwt.sign( {uid: user.uid, username: user.username, email: user.email}, process.env.JWT_SECRET, {expiresIn: "1h"});

    // Testing purposes
    console.log(token)

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          uid: user.uid,
          username: user.username,
          email: user.email
        }
      }
    });
  } else {
    return res.status(401).json({
      error: "Invalid password",
      message: "Incorrect password, please try again."
    })
  }
});


export default router;


