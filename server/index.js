const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;
const compression = require('compression');
const authController = require('./controllers/authController');

// const corsOptions = {
//     origin: 'http://localhost:3000',  // Allow requests only from this origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true,  // Allow cookies or credentials if needed
//   };
  
//   app.use(cors(corsOptions));  // Use this CORS configuration

app.use(cors())
app.use(express.json());
// app.use(compression()); //TODO what is this doing?


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


app.get('/api', (req, res) => {
    res.json({ message: 'Hello from server!' });
});


app.get('/api/auth/google', authController.googleAuth);
