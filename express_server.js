const { getUserByEmail } = require("./helpers.js");
const { generateRandomString } = require("./helpers.js");
const express = require("express");
const cookieSession = require('cookie-session');
const { emit } = require("nodemon");
const bcrypt = require("bcryptjs");


const app = express();
const PORT = 8080; // default port 8080

app.use(cookieSession({
  name: 'session',
  keys: ["hguhjjl;j.n.nsa"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.set("view engine", "ejs");

//Simulation of Database
const usersDatabase = {};

const urlDatabase = {};

app.get("/", function(req,res){
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Function that will accept a userId and then it actually goes through
// all the urls and then create a resultant object with urls belonging to that user
const urlsUser = function (idUser) {
  let results = {};
  for (let key in urlDatabase) {
    if (idUser === urlDatabase[key].userID) {
      results[key] = urlDatabase[key];
    }
  }
  return results;
}

// Getting Cookies
app.get("/urls", (req, res) => {
  const idUser = req.session.user_id;
  const templateVars = { urls: urlsUser(idUser), user: usersDatabase[idUser] };
  const user = usersDatabase[idUser];
  if (!user) { res.redirect("/login")};
  res.render("urls_index", templateVars);
});

//Creating URL

app.get("/urls/new", (req, res) => {
  const idUser = req.session.user_id;
  const user = usersDatabase[idUser];
  if (!user) { res.redirect("/login")};
  const templateVars = { user };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const idUser = req.session.user_id;
  const newId = generateRandomString();
  urlDatabase[newId] = { "longURL" : req.body.longURL , "userID" : idUser};
  if (req.body.longURL === '') {
    return res.send("Please enter valid URL!");
  }
  res.redirect("/urls");
});

// Editing URL

app.get("/urls/:id", (req, res) => {
  const session_user_id = req.session["user_id"];

  // the if block of code is working as required ============================================================
  if (session_user_id == null) {
    return res.redirect("/login");
  }
  const shortUrl = req.params.id;
  const user = usersDatabase[`${session_user_id}`];
  const templateVars = {
    user: user,
    id: shortUrl,
    longURL: urlDatabase[shortUrl].longURL
  };
  res.status(200).render("urls_show", templateVars); 
});

app.post("/urls/:id", (req, res) => {
  const idUser = req.session.user_id;
  urlDatabase[req.params.id] = { "longURL" : req.body.longURL , "userID" : idUser};
  if (req.body.longURL === '') {
    return res.send("Please enter valid URL!");
  }
  res.redirect("/urls");
});

//Delete URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls"); 
});


//Home Page
app.get('/', (req, res) => {
  const idUser = req.session.user_id;
  if (!idUser) {
    return res.render('index', {user: false});
  }
  
  return res.render('index', {userObject});

});

//Register

app.get("/register", (req, res) => {
  const templateVars = {user: ""};
  res.render("register.ejs", templateVars);
})

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = getUserByEmail(email, usersDatabase);
    const hashedPassword = bcrypt.hashSync(password, 10);
    if (user) {
      return res.send("You already have an account!");
    }
    const userId = generateRandomString();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword
    }
    usersDatabase[userId] = newUser;
    req.session.user_id = userId;
    res.redirect('/urls');
  } else {
    const errorMessage = 'Empty username or password. Please make sure you fill out both fields.';
    return res.send(errorMessage);
  }
});

//Login

app.get("/login", (req, res) => {
  const templateVars = {user: ""};
  res.render("login.ejs", templateVars);
})


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.send("Please! Enter email & password");
  if (email && password) {
    const user = getUserByEmail(email, usersDatabase);
    if(!user) return res.send('User is not registered :(');
    if(bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    const errorMessage = 'Login credentials not valid. Please make sure you enter the correct username and password.';
    return res.send(errorMessage);
    }
  }
});

//Sign-out
app.post('/sign-out', (req, res) => {
  req.session = null;
  res.redirect('/login');
});


// Checking exisiting URL
app.get("/u/:id", (req, res) => {
  const urlId = req.params.id;
  const longURL = urlDatabase[urlId].longURL;
  console.log("LongURL",longURL);
  console.log("ID",urlId);
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.send("URL doesn't exist!");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});