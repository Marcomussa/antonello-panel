import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import path, { dirname } from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import flash from 'express-flash';
import session from 'express-session';
import methodOverride from 'method-override';
import bcrypt from 'bcrypt';
import passport from 'passport';
import initializePassport from './passport-config.mjs';
import axios from "axios"

import db from "./db/connect.mjs"
import admin from './routes/admin.mjs';
import login from './routes/login.mjs';
import api from './routes/api.mjs';

const app = express();
const __dirname = path.resolve();
db()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash());
app.use(session({
    secret: '123456',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.use('/', login);
app.use('/admin', admin);
app.use('/api', api);
app.get('*', (req, res) => res.render("404"))

//! Login
const users = [];
const userAlpha = {
    id: Date.now().toString(),
    name: "Antonello",
    email: "a",
    password: "",
};

async function hashPass() {
    const pass = await bcrypt.hash("a", 10);
    userAlpha.password = pass;
    users.push(userAlpha);
    return pass;

}
hashPass();

initializePassport(passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

//! Server
const start = async () => {
    try {
        app.listen(4000, () => {
            console.log('Server on Port 4000')
        })
    } catch (error) {
        console.log('ERROR', error)
    }
};

//! Keep Alive Production Server
function makeGETPetition() {
    axios.get('https://antonello-panel-7mcg.onrender.com/api')
        .then(response => {
            console.log("Peticion Automatica Hecha");
        })
        .catch(error => {
            console.error('Fallo en Peticion Automatica:', error);
        });
}

makeGETPetition();

setInterval(makeGETPetition, 45000);

await start()