// let's get this

require('dotenv').config()
const express = require("express")
const session = require("express-session")
const passport = require("passport")
const MongoStore = require('connect-mongo')
const helmet = require('helmet')
const cors = require('cors')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')
const path = require('node:path')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')

// configurations import
const connectDB = require('./config/database')
require('./config/passport')(passport)





// routes import 
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/userRoutes')

// connect to database
connectDB()

const app = express()

// security middleware
app.use(helmet())


const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map(s=> s.trim()).filter(Boolean)
const corsOptions = {
origin: (origin, callback) => {
// Allow requests with no origin (like Postman) or same-origin
if (!origin) return callback(null, true);
if (allowedOrigins.includes(origin)) return callback(null, true);
return callback(new Error('CORS: Origin not allowed'), false);
},
credentials: true, // allow cookies
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
maxAge: 600 // cache preflight for 10 minutes
};
app.use(cookieParser())
app.use(cors(corsOptions))
app.options(/^\/api(?:\/.*)?$/, cors(corsOptions));




// body parsing middleware
app.use(express.json())
app.use(express.urlencoded({
    extended: false
}))

// Mongostore for persistent session storage
const store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, 
    collectionName: "sessions", 
    ttl: 86400
})

// handle store errors
store.on('error', function(error){
    console.error('MongoStore Error:', error)
})



// configure the session
app.use(session({
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false, 
    saveUninitialized: false, 
    rolling: false,
    store: store,
    cookie: {
        httpOnly: true, 
        sameSite: "lax",
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 //24 hours
    }
}))


// csrf protection
// cookie based csrf secret to be generated per request via req.csrfToken()
const csrfProtection = csrf({
    cookie: {
        httpOnly: true, //mitigates XSS stealing the secret
        sameSite: 'lax', //upgrade to none + secure for strict cross-site
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60*60,//1 hour
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] //protect state chaning requests only
})

// mounting for all /api routes
app.use('/api', csrfProtection)


// passport middleware
app.use(passport.initialize())
app.use(passport.session());

// documentation with swaggerui
const openapi = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'))
app.use('/api/docs', ...swaggerUi.serve, swaggerUi.setup(openapi, {explorer:true}))
app.get('/api/openapi.json', (req, res)=> res.json(openapi))


// ROUTES
// app.use("/", indexRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)


// handle 404
app.use((req, res) =>{
    res.status(404).json( {message: 'Page not FOUND, my ski!'});
})


// error handler
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
    error: {
    code: 'invalid_csrf_token',
    message: 'Invalid or missing CSRF token'
}
});
}
    console.error(err.stack);
    res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
});

})


// they shall listen
const PORT = process.env.PORT||3000;
app.listen(PORT, () =>{
    console.log("the bell rings on port 3000 for all it's USERS!")
})