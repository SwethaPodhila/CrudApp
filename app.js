const mysql = require('mysql2');
const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const con = mysql.createConnection({
    host: 'localhost',
    port: '3307',
    user: 'root',
    password: 'Swetha@143',
    database: 'my_db'
});

con.connect(function (err) {
    if (err) {
        console.error('MYSQL connecting error: ' + err);
        return;
    }
    console.log('connected successfully');
    createAdminTable(); // Call the function to create the admin table
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to create the admin table
function createAdminTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fName VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phno VARCHAR(15) NOT NULL,
            uName VARCHAR(50) NOT NULL,
            pword VARCHAR(255) NOT NULL,
            profileImage VARCHAR(255) NULL
        )
    `;
    con.query(query, (err, result) => {
        if (err) {
            console.error('Error creating admin table: ' + err);
            return;
        }
        console.log('Admin table created or already exists.');
    });
}

// Root route to redirect to /register
app.get('/', (req, res) => {
    res.redirect('/register');
});

// Route to serve the register form
app.get('/register', (req, res) => {
    res.render('register'); // Render the register.ejs file
});

// Route to serve the login form
app.get('/login', (req, res) => {
    res.render('login'); // Render the login.ejs file
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.post('/register', upload.single('profileImage'), (req, res) => {
    const { id, fName, email, phno, uName, pword } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    const query = 'INSERT INTO admin (id, fName, email, phno, uName, pword, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?)';

    con.query(query, [id, fName, email, phno, uName, pword, profileImage], (err, result) => {
        if (err) {
            console.error('Error registering user: ' + err);
            res.status(500).send('Error registering user');
            return;
        }
        console.log('Added new admin with id:', result.insertId);
        res.redirect('/login'); // Redirect to the login page
    });
});

// POST route to handle login
app.post('/login', (req, res) => {
    const { uName, pword } = req.body;
    const query = 'SELECT * FROM admin WHERE uName = ? AND pword = ?';

    con.query(query, [uName, pword], (err, results) => {
        if (err) {
            console.error('Error logging in: ' + err);
            res.status(500).send('Error logging in');
            return;
        }

        if (results.length > 0) {
            const username = results[0].uName; // Assuming uName is the field for username
            res.redirect(`/index?username=${username}`);
        } else {
            // Login failed
            res.send(`<script>alert('Incorrect username or password. Please try again.'); window.location.href = '/login';</script>`);
        }
    });
});

// Route to serve the add user form
app.get('/addUser', (req, res) => {
    res.render('addUser', { username: req.query.username }); // Render the addUser.ejs file with username
});

// Fetch student data and render index page
app.get('/index', (req, res) => {
    const query = 'SELECT sId, sName, sDept, sFee FROM student';
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err);
            res.status(500).send('Error fetching data');
            return;
        }
        const username = req.query.username; // Retrieve username from query parameters
        res.render('index', { students: results, username: username });
    });
});

// Route to serve the edit form
app.get('/edit', (req, res) => {
    const studentId = req.query.id; // Fetch studentId from query parameters
    const query = 'SELECT sId, sName, sDept, sFee FROM student WHERE sId = ?';

    con.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Error fetching student data: ' + err);
            res.status(500).send('Error fetching student data');
            return;
        }
        res.render('edit', { student: results[0], username: req.query.username }); // Render the edit.ejs file with username
    });
});

// DELETE route for deleting a student
app.post('/delete/:id', (req, res) => {
    const studentId = req.params.id;
    const query = 'DELETE FROM student WHERE sId = ?';

    con.query(query, [studentId], (err, result) => {
        if (err) {
            console.error('Error deleting student: ' + err);
            res.status(500).send('Error deleting student');
            return;
        }
        console.log('Deleted student with ID:', studentId);
        res.redirect('/index'); // Redirect back to the student list page
    });
});

// Update route for updating student data
app.post('/update/:id', (req, res) => {
    const studentId = req.params.id;
    const { sName, sDept, sFee } = req.body;
    const query = 'UPDATE student SET sName = ?, sDept = ?, sFee = ? WHERE sId = ?';

    con.query(query, [sName, sDept, sFee, studentId], (err, result) => {
        if (err) {
            console.error('Error updating student: ' + err);
            res.status(500).send('Error updating student');
            return;
        }
        console.log('Updated student with ID:', studentId);
        res.redirect('/index'); // Redirect back to the student list page
    });
});

// POST route to add a new student record
app.post('/addUser', (req, res) => {
    const { sId, sName, sDept, sFee } = req.body;
    const query = 'INSERT INTO student (sId, sName, sDept, sFee) VALUES (?, ?, ?, ?)';

    con.query(query, [sId, sName, sDept, sFee], (err, result) => {
        if (err) {
            console.error('Error adding user: ' + err);
            res.status(500).send('Error adding user');
            return;
        }
        console.log('Added new student with sId:', result.insertId);
        res.redirect('/index'); // Redirect back to the student list page
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
