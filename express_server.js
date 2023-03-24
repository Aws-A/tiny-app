const { getUserByEmail } = require("./helpers.js");
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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Getting Cookies
app.get("/urls", (req, res) => {
  const idUser = req.session.user_id;
  const templateVars = { urls: urlDatabase, user: usersDatabase[idUser] };
  res.render("urls_index", templateVars);
});

//Creating URL

app.get("/urls/new", (req, res) => {
  const idUser = Number(req.session.user_id);
  const user = usersDatabase[idUser];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  const newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  res.redirect("/urls");
});

// Editing URL

app.get("/urls/:id", (req, res) => {
  const idUser = Number(req.session.user_id);
  const user = usersDatabase[idUser];
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    user 
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
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

app.get("/register", (req, res) => {
  const templateVars = {user: ""};
  res.render("register.ejs", templateVars);
})

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
  const longURL = urlDatabase[urlId];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.send("In your dream!");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Creating unique Id
function generateRandomString() {
  let r = (Math.random() + 1).toString(36).substring(6);
  return r;
}
