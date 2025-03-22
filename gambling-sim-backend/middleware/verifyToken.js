function verifyToken(req, res, next) {
  
  // Check if the token exists to begin with
  if (!req.headers.authorization) {
    return res.status(401).json({
      error: "No token found"
    });
  }

  // Grab the token itself - in the format of Authorization: bearer <token>
  const token = req.headers.authorization.split(' ')[1];

  // Try to see if we can verify the JWT
    // If verified, we attach the requested user to our verified user
  try {
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedUser;

    console.log(req.user.username);

    // Tells express that the middleware is done, and time to go to the next middleware or route in the stack
    next();

  } catch (error) {
    return res.status(401).json( {
      error: "Token cannot be verified",
      details: error
    });
  }

}