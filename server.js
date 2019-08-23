const express = require("express")
const session = require("express-session")
const bodyparser = require("body-parser")
const hbs = require("hbs")
const cookieparser = require("cookie-parser")
const mongoose = require("mongoose")
const url = require("url")

const app = express()
app.use(express.static('public'))
app.use(session({
    resave: true,
    name:"webapdesecret",
    saveUninitialized: true,
    secret : "secretpass",
    cookie:{
        maxAge: 5*60*1000
    }
}))

app.engine('hbs')
app.set('view engine', 'hbs')

mongoose.Promise = global.Promise
mongoose.connect("mongodb+srv://fan34:can34@type-racer-mli3n.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser:true,
    useFindAndModify: false
})

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', function() {
  console.log("Connected Successfully")
});

const User = require(__dirname + "/Model/user.js").userModel
const score = require(__dirname + "/Model/score.js").scoreModel
const words = require(__dirname + "/Model/words.js").wordsModel

const urlencoder = bodyparser.urlencoded({
    extended : false
})


app.get("/", (req, res)=>{ 
    if(req.session.un){
        res.render("/views/MainPage_User.hbs",{
            us : req.session.un
        });
    }
    else{
        res.render("MainPage.hbs")
    }
})
app.post("/startGameUser",urlencoder, (req,res)=>{
    const txt = req.body.selected
    req.session.difficulty = txt
    
    words.find({difficulty: req.session.difficulty}).exec(function(err,words){
        res.render(__dirname + "/views/game.hbs",{
            data :words,
            txt
        })
    })
})

app.post("/startGame",urlencoder, (req,res)=>{
    const txt = req.body.selected
    req.session.difficulty = txt
    if(txt == null){
        score.find({}).exec(function(err,scores){
        res.render("MainPage.hbs")
        })
    }
    else{
        words.find({difficulty: req.session.difficulty}).exec(function(err,words){
        res.render(__dirname + "/views/game.hbs",{
                data :words,
                txt
            })
        })
    }
})

app.post("/login", urlencoder, (req,res)=>{
    var us = req.body.un
    var pw = req.body.pw
    
    if(us == "admin" && pw =="p@ssword"){
        User.find({}).exec(function(err,user){
            res.render(__dirname + "/views/Admin_Users.hbs",{
                us: us,
                data: user
            })
        }) 
    }
    else{
        User.find({u_username:us, u_password:pw}).exec(function(err, user) {  
        console.log(user);
        if(err){
            throw err;
        }
         
        if(user){
            if(!user.length){
                console.log("User not Match")
                score.find({}).exec(function(err,scores){
                res.render("MainPage.hbs")
                })
            }
            else{
                console.log("User Match")
                    req.session.un = us
                    console.log("Session User: " + req.session.un)
                    score.find({}).exec(function(err,scores){
                        res.render(__dirname + "/views/MainPage_User.hbs",{
                            us,
                            data :scores
                        })
                    }) 
                }   
            }
        });   
    }
})

app.post("/signup", urlencoder, (req,res)=>{
    let NewUser = new User({
        u_username : req.body.un,
        u_password : req.body.pw
    })
    
    User.find({u_username: NewUser.u_username}).exec(function(err,user){
        console.log(user)
        if(user){
            if(!user.length){
                NewUser.save().then((doc)=>{
                    console.log(doc)
                    score.find({}).exec(function(err,scores){
                    res.render("MainPage.hbs")
                    })
                }, (err)=>{ 
                    res.send(err)
                }) 
            }
            else if(user.length){
                console.log("Username Taken")
                score.find({}).exec(function(err,scores){
                res.render("MainPage.hbs")
                })
            }
        }
    })
})

app.post("/logout", urlencoder, (req,res)=>{
    req.session.un = null
    score.find({}).exec(function(err,scores){
        res.render(__dirname + "/views/MainPage.hbs",{
        })
    })
})

app.post("/Leaderboards", urlencoder, (req,res)=>{
    if(req.session.un){
        score.find({}).exec(function(err,scores){
            res.render(__dirname + "/views/Leaderboards_User.hbs",{
                us: req.session.un,
                data :scores
            })
        })
    }
    else{
       score.find({}).exec(function(err,scores){
            res.render(__dirname + "/views/Leaderboards.hbs",{
            data :scores
            })
        }) 
    }
})

app.post("/ChangeFilter", urlencoder, (req,res)=>{
    var filter = req.body.difficulty
    console.log(filter)
    if(req.session.un){
        score.find({difficulty: filter}).exec(function(err,scores){
            res.render(__dirname + "/views/Leaderboards_User.hbs",{
                us: req.session.un,
                data :scores
            })
        })
    }
    else{
       score.find({difficulty: filter}).exec(function(err,scores){
           console.log(scores)
            res.render(__dirname + "/views/Leaderboards.hbs",{
            data :scores
            })
        }) 
    }
})

app.post("/BackToMain", urlencoder, (req,res)=>{
    if(req.session.un){
        res.render(__dirname + "/views/MainPage_User.hbs",{
            us: req.session.un,
        })
    }
    else{
        res.render("MainPage.hbs")
    }
})

app.post("/AddUser", urlencoder, (req,res)=>{
    let NewUser = new User({
        u_username : req.body.Admin_Us,
        u_password : req.body.Admin_Pw
    })
    
    User.find({u_username: NewUser.u_username}).exec(function(err,user){
        console.log(user)
        if(user){
            if(!user.length){
                NewUser.save().then((doc)=>{
                    console.log(doc)
                    User.find({}).exec(function(err,user){
                    res.render(__dirname + "/views/Admin_Users.hbs",{
                        data :user
                        })
                    })
                }, (err)=>{ 
                    res.send(err)
                }) 
            }
            else if(user.length){
                console.log("Username Taken")
                User.find({}).exec(function(err,user){
                res.render(__dirname + "/views/Admin_Users.hbs",{
                        data :user
                    })
                })
            }
        }
    })
})

app.post("/AddWords", urlencoder, (req,res)=>{
    let NewWord = new words({
        text : req.body.Admin_text,
        difficulty : req.body.difficulty
    })
    
    words.find({text: NewWord.text}).exec(function(err,user){
        console.log(user)
        if(user){
            if(!user.length){
                NewWord.save().then((doc)=>{
                    console.log(doc)
                    words.find({}).exec(function(err,user){
                    res.render(__dirname + "/views/Admin_Words.hbs",{
                        data :user
                        })
                    })
                }, (err)=>{ 
                    res.send(err)
                }) 
            }
            else if(user.length){
                console.log("Username Taken")
                words.find({}).exec(function(err,user){
                res.render(__dirname + "/views/Admin_Words.hbs",{
                        data :user
                    })
                })
            }
        }
    })
})

app.post("/deleteUser", urlencoder, (req,res)=>{
    var user = req.body.username_Del
    var password = req.body.password_Del
    
    User.deleteOne({u_username: user, u_password: password }, (err, doc)=>{
        if(err){
            console.log("Not working")
        }else{
            console.log(doc)
            User.find({}).exec(function(err,user){
                res.render(__dirname + "/views/Admin_Users.hbs",{
                    us:"admin",
                    data: user
                })
            })
        }
    })
})

app.post("/deleteLeaderboards", urlencoder, (req,res)=>{
    var username = req.body.playername_Del
    var difficulty = req.body.difficulty_Del
    var scores = req.body.score_Del
    
    score.deleteOne({playerusername: username, difficulty: difficulty, score: scores }, (err, doc)=>{
        if(err){
            console.log("Not working")
        }else{
            console.log(doc)
            score.find({}).exec(function(err,score){
                res.render(__dirname + "/views/Admin_Leaderboards.hbs",{
                    us:"admin",
                    data: score
                })
            })
        }
    })
})

app.post("/deleteWords", urlencoder, (req,res)=>{
    var text = req.body.text_Del
    var diff = req.body.difficulty_Del
    
    words.deleteOne({difficulty: diff, text: text }, (err, doc)=>{
        if(err){
            console.log("Not working")
        }else{
            console.log(doc)
            words.find({}).exec(function(err,user){
                res.render(__dirname + "/views/Admin_Words.hbs",{
                    us:"admin",
                    data: user
                })
            })
        }
    })
})

app.post("/admin_Users", urlencoder, (req,res)=>{
    User.find({}).exec(function(err,user){
                res.render(__dirname + "/views/Admin_Users.hbs",{
                    us:"admin",
                    data: user
                })
            })
})

app.post("/admin_leaderboards", urlencoder, (req,res)=>{
    score.find({}).exec(function(err,score){
                res.render(__dirname + "/views/Admin_Leaderboards.hbs",{
                    us:"admin",
                    data: score
                })
            })
})

app.post("/admin_Words", urlencoder, (req,res)=>{
    words.find({}).exec(function(err,words){
                res.render(__dirname + "/views/Admin_Words.hbs",{
                    us:"admin",
                    data: words
                })
            })
})

app.post("/savescore", urlencoder, (req,res)=>{
    if(req.session.un){
        console.log(req.session.un)
        var str= req.body.timeFinished
        
        let NewScore = new score({
            playerusername : req.session.un,
            difficulty :req.session.difficulty,
            score : str
        })
        
        console.log("Finished Time: " + str)
        
        NewScore.save().then((doc)=>{
            console.log(doc)
            score.find({}).exec(function(err,scores){
            res.render(__dirname + "/views/MainPage_User.hbs",{
                    us: req.session.un,
                    data: scores            
                })
            }), (err)=>{ 
                res.send(err)
            } 
        })
    }
    else if(req.session.un == null){
         score.find({}).exec(function(err,scores){
              res.render("MainPage.hbs")
         })
    }
    req.session.difficulty = null
})


app.listen(process.env.PORT || 3000)

