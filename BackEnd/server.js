require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // Potresti non aver più bisogno del modulo pg
const sqlite3 = require('sqlite3').verbose(); // Per database locale
import sql from './db.js'; // Import del modulo sql

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

app.use(express.static('FrontEnd'));

// Middleware
app.use(bodyParser.json());

// Configurazione Database (locale e remoto)
let db;
if (process.env.USE_SUPABASE === 'true') {
    db = sql; // Usa il modulo sql per Supabase
} else {
    db = new sqlite3.Database('./localdb.sqlite', (err) => {
        if (err) console.error('Errore durante la connessione al DB locale:', err.message);
        else console.log('Connesso al DB locale.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );`);
}

// Registrazione
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password sono obbligatori.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (process.env.USE_SUPABASE === 'true') {
            const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
            await db.query(query, [username, hashedPassword]);
        } else {
            db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(400).json({ error: 'Errore nella registrazione.' });
                }
            });
        }

        res.status(201).json({ message: 'Utente registrato con successo!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password sono obbligatori.' });
    }

    const query = process.env.USE_SUPABASE === 'true'
        ? 'SELECT * FROM users WHERE username = $1'
        : 'SELECT * FROM users WHERE username = ?';

    const queryCallback = (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Errore interno del server.' });
        }
        if (!row) {
            return res.status(400).json({ error: 'Utente non trovato.' });
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err || !result) {
                return res.status(400).json({ error: 'Password errata.' });
            }

            const token = jwt.sign({ id: row.id, username: row.username }, SECRET_KEY, { expiresIn: '1h' });
            res.status(200).json({ message: 'Login avvenuto con successo!', token });
        });
    };

    if (process.env.USE_SUPABASE === 'true') {
        db.query(query, [username]).then((result) => queryCallback(null, result.rows[0])).catch((err) => queryCallback(err));
    } else {
        db.get(query, [username], queryCallback);
    }
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});