require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

// Create an instance of express app
const app = express();

// Middleware
app.use(bodyParser.json()); // to parse JSON requests
app.use(cors());

// Serve static files from the 'public' folder (this is where you will put your HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
  res.send('API is running');
});

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

// 1. Register User
app.post('/api/register', (req, res) => {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields.' });
    }

    // Query to check if the user with email or username already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';

    db.query(checkUserQuery, [email, username], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (result.length > 0) {
            // If user already exists
            return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
        }

        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert the new user into the database
        const insertUserQuery = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [email, username, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            res.json({ success: true, message: 'User registered successfully' });
        });
    });
});


// 2. Login User
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide all fields.' });
  }

  // Find user in the database
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) throw err;

    if (result.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const user = result[0];

    // Compare hashed passwords
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        // Generate a JWT token
      /*  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
          expiresIn: '1h'
        }); */

        res.json({ message: 'Login successful!' });
      } else {
        res.status(400).json({ message: 'Invalid username or password.' });
      }
    });
  });
});

// 3. Add a Transaction
app.post('/api/transactions', (req, res) => {
  const { type, particulars, amount, date, } = req.body; // Expect userId to be sent in request body

  if (!type || !particulars || !amount || !date) {
    return res.status(400).json({ message: 'Please provide all fields.' });
  }

  const sql = 'INSERT INTO transactions (type, particulars, amount, date) VALUES (?, ?, ?, ?)';
  db.query(sql, [ type, particulars, amount, date], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Transaction added successfully!' });
  });
});


// 4. Get All Transactions
app.get('/api/transactions', (req, res) => {
  const sql = 'SELECT * FROM transactions'; 

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
    res.json(results);
  });
});


// 5. Get User Balance
/*app.get('/api/balance', (req, res) => {
  const sqlIncome = 'SELECT SUM(amount) as totalIncome FROM transactions WHERE type = "income"';
  const sqlExpense = 'SELECT SUM(amount) as totalExpense FROM transactions WHERE type = "expense"';

  db.query(sqlIncome, (err, incomeResult) => {
    if (err) throw err;

    db.query(sqlExpense, (err, expenseResult) => {
      if (err) throw err;

      const balance = (incomeResult[0].totalIncome || 0) - (expenseResult[0].totalExpense || 0);
      res.json({
        balance,
        totalIncome: incomeResult[0].totalIncome || 0,
        totalExpense: expenseResult[0].totalExpense || 0
      });
    });
  });
}); */

// Server listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
