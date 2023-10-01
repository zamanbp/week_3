
const express = require('express');
const app = express();
const ejs = require('ejs');
const { getDb, connectToDb } = require('./db')
const path = require('path')
const session = require('express-session');;
const passport = require('passport');
const { copyFileSync } = require('fs');
const { redirect } = require('express/lib/response');
const facebookStrategy = require('passport-facebook').Strategy
const googleStrategy = require('passport-google-oauth').OAuth2Strategy
const ObjectId = require('mongodb').ObjectId;
let db
let collection
let message


// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// setting up middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
}))
// passport.use(new facebookStrategy({
//     clientID:,
//     clientSecret:,
//     callbackURL:,
// },
// (accessTocken, refreshTocken, profile, cb)=>{
//     return cb(profile)
// }
// ))
passport.use('google-login', new googleStrategy({
    clientID: "373111911396-amg0ff7viu45aeoa1had3lmt3fjod9g6.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: '/login/google/cb'
},
    (accessTockens, refreshTockens, profile, cb) => {
        return cb(null, profile)
    }))
passport.use('google-signup', new googleStrategy({
    clientID: "373111911396-4q4qoma962mdjbvinjnrgfl7eumu5p6s.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: '/signup/google/cb'
},
    (accessTockens, refreshTockens, profile, cb) => {
        return cb(null, profile)
    }))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user); // Serialize user ID into the session
});

passport.deserializeUser((user, done) => {
    done(null, user); // Serialize user ID into the session
});

// demo page that loads the ejs engine
app.get('/sample', function (req, res) {

    // rendering the view and passing data
    res.render("Demo", { title: "View Engine Demo" })
})

// defining the view for the card page
// app.get('/card', (req, res) => {
//     const items = [
//         { title: "title1", body: 'body1' },
//         { title: 'title2', body: 'body2' },
//         { title: 'title3', body: 'body3' }
//     ]
//     res.render("card", { items: items })
// })


// creating the demo view for the table view
// app.get('/table', (req, res) => {
//     // definig the data for the table page
//     const students = [
//         { name: "Aman", phone: 9876543210 },
//         { name: "Shabbas", phone: 8967452301 },
//         { name: "Karanath", phone: 7894561230 },
//         { name: "Unnikuttan", phone: 6789234560 },
//         { name: "Rameshan", phone: 895678674561 }
//     ]
//     res.render("table", { students: students })
// })


// creating view for the login page
app.get('/', (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect('/home')
    } else {
        // res.render('login',{message:message});
        const showMessage = req.query.error === 'invalid';
        res.render('login', { message: showMessage ? 'Invalid credentials, try again' : '' });
    }
})

// creating view for home page
app.post('/login', async (req, res) => {
    const mail = req.body.email;
    const pass = req.body.password;
    let users = []
    const cursor = await collection.find();
    await cursor.forEach(element => {
        users.push(element)
    });
    var i = 0;
    if (mail == 'admin@admin.in' && pass == 'pass'){
        i = i + 1;
        return res.redirect('/admin');
    }
    users.forEach(user => {
        if (user.email == mail) {
            if (user.password == pass) {
                i = i + 1;
                req.session.user = user;
                req.session.isLoggedIn = true;
                res.redirect('/home');
            }
        }
    });
    
    console.log(mail, pass);

    if (i == 0) {
        // Redirect with a query parameter to indicate invalid credentials
        res.redirect('/?error=invalid');
    }


});

// creating signup view
app.post('/signup', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pass = req.body.pass;
    new_user = {
        name: name,
        email: email,
        password: pass
    }
    users = getDb().collection('users')
    users.findOne({ email: email })
        .then((user) => {
            if (user) {
                res.send({ message: "Username already in use, try Another one" })
            } else {
                users.insertOne(new_user)
                    .catch((error) => { res.send({ message: "Signup failed, try again" }) })
                console.log(name)
                req.session.user = users = getDb().collection('users').findOne({email:new_user.email})

                req.session.isLoggedIn = true
                res.redirect('/home')
            }

        }).catch((error, user) => {
            users.insertOne(new_user)
                .catch((error) => { res.send({ message: "Signup failed, try again" }) })
            console.log(name)
            req.session.user = new_user
            req.session.isLoggedIn = true
            res.redirect('/home')
        })

})

// creating view for home page
app.get('/home', async(req, res) => {
    if (req.session.isLoggedIn) {
        // res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        let name
        if (req.session.user) {
            name = req.session.user.name
        }
        console.log(req.session.user._id)
        res.render("home", { name: name });
    } else {
        res.redirect('/')
    }
});

// creating user editing page
app.get('/user/edit',async(req, res)=>{
    console.log(new ObjectId(req.session.user._id))
    users =await getDb().collection('users').findOne({_id:new ObjectId(req.session.user._id)})
    res.render('edit',{user:users})
})

// // defining user update
// app.post('/user/update', async (req, res) => {
//     const newEmail = req.body.email;
//     const newName = req.body.name;
//     const newPassword = req.body.pass;
  
//     if (!newEmail || !newName || !newPassword) {
//       // Handle validation or error cases here (e.g., fields are empty)
//       res.redirect('/user/edit');
//       return;
//     }
  
//     const userId = new ObjectId(req.session.user._id);
//     const users = getDb().collection('users');
  
//     try {
//       // Update the user's information
//       await users.updateOne({ _id: userId }, { $set: { email: newEmail, name: newName, password: newPassword } });
  
//       // Refresh the user's session data (optional)
//       req.session.user = await users.findOne({ _id: userId });
//       req.session.isLoggedIn = true;
  
//       res.redirect('/home'); // Redirect to the home page after successful update
//     } catch (error) {
//       // Handle database or update errors here
//       console.error(error);
//       res.redirect('/user/edit');
//     }
//   });
app.post('/user/update', async (req, res) => {
    const newEmail = req.body.email;
    const newName = req.body.name;
    const newPassword = req.body.pass;
  
    if (!newEmail || !newName || !newPassword) {
      // Handle validation or error cases here (e.g., fields are empty)
      res.redirect('/user/edit');
      return;
    }
  
    const userId = new ObjectId(req.session.user._id);
    const users = getDb().collection('users');
  
    try {
      // Check if the new email is already in use by another user
      const existingUser = await users.findOne({ email: newEmail, _id: { $ne: userId } });
  
      if (existingUser) {
        // Email is already in use by another user
        res.redirect('/user/edit?error=email-in-use');
        return;
      }
  
      // Update the user's information
      await users.updateOne({ _id: userId }, { $set: { email: newEmail, name: newName, password: newPassword } });
  
      // Refresh the user's session data (optional)
      req.session.user = await users.findOne({ _id: userId });
      req.session.isLoggedIn = true;
  
      res.redirect('/home'); // Redirect to the home page after successful update
    } catch (error) {
      // Handle database or update errors here
      console.error(error);
      res.redirect('/user/edit');
    }
  });
  
  








// creating admin view
app.get('/admin', async (req, res) => {
    let user_list = []
    users = getDb().collection('users')
    const cursor = await users.find()
    await cursor.forEach((one_user) => {
        user_list.push(one_user)
    })
    res.render('admin', { users: user_list })

})

// defining view for /user/delete
app.post('/user/delete',(req,res)=>{
    const user_mail = req.body.user
    users = getDb().collection('users')
    users.deleteOne({email: user_mail})
    .then((result)=>{
        res.redirect('/admin')
    })
})

// defining view for /user/add
app.post('/user/add',(req, res)=>{
    user_data = {
        name:req.body.name,
        email:req.body.email,
        password: 'password'
    }
    users = getDb().collection('users')
    users.insertOne(user_data)
    .then((_)=>{
        res.redirect('/admin')
    })
})


// creating facebook login
// app.get('login/facebook', passport.authenticate('facebook'));

// creating facebook callback url
// app.get('/login/facebook/cb', passport.authenticate('facebook',{failureRedirect: '/'}),(req, res)=>{res.redirect('/home')})

// creating google login
app.get('/login/google', passport.authenticate('google-login', { scope: ['profile email'] }));

// creating google callback url
app.get('/login/google/cb', passport.authenticate('google-login'), (req, res) => {
    // vagiationg the bd to the collections
    users = getDb().collection('users')
    // fetching the users data that is logged in using google
    users.findOne({ email: req.user.emails[0].value })
        .then((user) => {
            if (user) {
                req.session.user = user
                console.log(req.session.user._id)
                req.session.isLoggedIn = true;
                return res.redirect('/home')
            }
            else {
                message = 'Account not found'
                return res.redirect('/')
            }
        })
        .catch((error) => {
            console.log('error: ', error)
        })
})

// creating signup view for google
app.get('/signup/google', passport.authenticate('google-signup', { scope: ['profile email'] }))

app.get('/signup/google/cb', passport.authenticate('google-signup'), (req, res) => {
    users = getDb().collection('users')
    user_data = {
        name: req.user.displayName,
        email: req.user.emails[0].value,
        password: req.user.emails[0].value
    }
    users.findOne({ email: user_data.email })
        .then((user) => {
            if (user) {
                console.log("User already found, try logging in")
                res.send({ message: "User already found, try loggin" })
            } else {
                users.insertOne(user_data)
                    .then((result) => {
                        req.session.isLoggedIn = true;
                        return res.redirect('/home')
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }
        })
        .catch((error) => {
            console.log(error)
        })

})

// connecting with mongodb
connectToDb(() => {
    // setting the host address
    app.listen(8080, function (error) {
        if (error) throw error
        console.log("Server created successfully")
    }),
        db = getDb()
    collection = db.collection('users')
})


// // defining logout view
app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false;

    // Prevent caching to disable the back button
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    res.render('login', { message: '' });
})
