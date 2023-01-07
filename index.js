var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = 'smart-keyring-login'
require('dotenv').config()

const request = require('request');

app.use(cors( {
    credentials: true,
    origin: "http://localhost:5173/"
}))
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL)



app.post('/register', jsonParser , function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    connection.execute(
      'INSERT INTO users (`email`, `password`, `fname` , `lname` ,`age` ,`foodallergies` ,`drugallergy` ,`emergencynumber` ,`congenitaldisease` ,`bloodtype` ,`phonenumber`) VALUES (?, ?, ?, ? ,? ,? ,? ,? ,? ,? ,?)',
      [req.body.email ,hash ,req.body.fname ,req.body.lname,req.body.age,req.body.foodallergies,req.body.drugallergy,req.body.emergencynumber,req.body.congenitaldisease,req.body.bloodtype,req.body.phonenumber],
      function(err, results, fields) {
        if (err) {
          res.json({status :"error" , massage: err })
          return
        }
        res.json({status: "ok", message: "Register succes"})
      }
    );
  });
  
});

app.post('/login', jsonParser , function (req, res, next) {
  connection.execute(
    'SELECT * FROM users WHERE email=?',
    [req.body.email],
    function(err, users, fields) {
      if (err) { res.json({status :"error" , massage: err }); return }
      if (users.length == 0 ) { res.json({status :"error" , massage: "no users found" }); return }
      bcrypt.compare(req.body.password, users[0].password, function(err, isLogin) {
        if (isLogin) {
          var token = jwt.sign({ email: users[0].email }, secret, {expiresIn: '3h'});
          res.json({status: 'ok', message: 'login success', token})
        } else {
          res.json({status: 'error', message: 'login failed'})
        }
      });
    }
  );
});

app.post('/authen', jsonParser , function (req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token, secret)
    connection.execute(
      'SELECT * FROM users WHERE email=?',
      [decoded.email],
      function(err, results, fields) {
        res.json({status : 'ok',user: results[0]})
      }
    );
   

  } catch(err){
    res.json({status: 'error', message: err.massage})
  }
  
});

app.post('/profile', jsonParser , function (req, res, next) {
  connection.execute(
    'SELECT * FROM `users` WHERE id=?',
    [req.body.id]
   ,
    function(err, result, fields) {
      res.json({user: result[0]})
    })
});

app.get("/employees", (req, res) => {
  connection.execute("SELECT * FROM users", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

const lineNotify = require('line-notify-nodejs')('qBlR2OJPR8wk2ZE4X6ctml27EVYV3AAUe0iWpWiiWR7');

app.post('/send',jsonParser, (req, res, next) => {
  
  res.send(req.body.password)
  lineNotify.notify({
    message: req.body.password,
  }).then(() => {
    console.log('send completed!');
  });
})




app.post("/update", jsonParser , function (req, res, next) {
  const fname =req.body.fname;
  const lname = req.body.lname;
  const foodallergies = req.body.foodallergies;
  const drugallergy = req.body.drugallergy;
  const emergencynumber = req.body.emergencynumber
  const congenitaldisease = req.body.congenitaldisease
  const bloodtype  = req.body.bloodtype
  const phonenumber = req.body.phonenumber
  const age = req.body.age;

  connection.query(
    "UPDATE `users` SET `fname`=?,`lname`=?,`age`=?,`foodallergies`=?,`drugallergy`=?,`emergencynumber`=?,`congenitaldisease`=?,`bloodtype`=?,`phonenumber`=? WHERE id = ?",
    [fname , lname ,age ,foodallergies ,drugallergy ,emergencynumber ,congenitaldisease ,bloodtype ,phonenumber,req.body.id],
    function(err, result, fields){
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});




app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333')
});