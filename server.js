'use strict';

require('dotenv').config();
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
const { response } = require('express');
const pg = require('pg');
const app = express();
const methodoverride = require('method-override');

// ---------------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 4444
const ENV = process.env.ENV;



// MiddleWare to direct your express
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/styles'));
app.set('view engine', 'ejs');
app.use(methodoverride('_method'));


// client pg setup
let client = '';
if (ENV === 'DEV') {
    client = new pg.Client({
        connectionString: DATABASE_URL,
    })

} else {
    client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
};




// create Routes 
app.get('/searches/new', formHandler)
app.get('/', renderFromDB);
app.get('/books/:id', makeRequest);

app.post('/books', saveBook);
app.post('/searches', resultHandler)
app.use("*", errorHandler)

app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteForm);

// ----------------------------------------------------------------------------------


function deleteForm(request, response) {
    const id = request.body.id;

    safeValue = [id];

    const deleteQuery = 'DELETE FROM shelf WHERE id=$1;';

    client.query(deleteQuery, safeValue).then(() => {
        response.redirect('/');
    })
}



function updateBook(request, response) {
    const id = request.params.id;
    const { title, author, isbn, image_url, description1 } = request.body;
    const safeValues = [title, author, isbn, image_url, description1, id];

    const sqlQuery = `UPDATE shelf SET author=$1, title=$2, isbn=$3, image_url=$4, description1=$5 WHERE id=$6;`;

    client.query(sqlQuery, safeValues).then(result => {
        response.redirect(`/books/${id}`);
    }).catch((error, res) => {
        res.send("I AM HERE !");
    })
}




function saveBook(request, response) {
    const query = request.body;
    const safeValues = [query.author, query.title, query.isbn, query.image_url, query.description];
    const sqlQuery = `INSERT INTO shelf(author, title, isbn, image_url, description1) VALUES($1,$2,$3,$4,$5) RETURNING id;`;
    client.query(sqlQuery, safeValues).then(result => {
        response.redirect(`/books/${result.rows[0].id}`)
    });
}



function makeRequest(request, response) {
    const id = request.params.id;
    const sqlQuery = 'SELECT * FROM shelf WHERE id=$1;';
    const safeValues = [id];
    client.query(sqlQuery, safeValues).then(result => {
        response.render('pages/books/detail', { oneBook: result.rows })
    }).catch(res => {
        res.render("HELLOOO");
    });
}




function renderFromDB(request, response) {
    const sqlQuery = `SELECT * FROM shelf;`;
    client.query(sqlQuery).then(
        result => {
            response.render('pages/index', { SeedData: result.rows })
        }
    )
}




function formHandler(req, res) {
    res.render('pages/searches/new')
}




function resultHandler(req, res) {
    let url = `https://www.googleapis.com/books/v1/volumes`;
    const { searchBy, search } = req.body;
    let searchQuery = {};

    if (searchBy === 'title') {
        searchQuery['q'] = `+intitle:${search}`
    } else if (searchBy === 'author') {
        searchQuery['q'] = `+inauthor:${search}`
    }

    superAgent.get(url).query(searchQuery).then((result) => {
        return result.body.items.map(
            book => {
                let newBook = new Book(book);
                return newBook;
            }
        )
    }).then(resultNew => {
        res.render('pages/searches/show', { UserBooks: resultNew.slice(0, 11) })
    }).catch(res => {
        res.render('pages/error');
    });
}



function errorHandler(req, res) {
    res.render('pages/error');
};


// -------------------------------------------------------------------------------------------
function Book(dataBook) {

    const check = dataBook.volumeInfo.industryIdentifiers.map(obj => {
        if (obj.type === 'ISBN_13') {
            return `${obj.type} ${obj.identifier}`
        }
    });

    this.isbn = check[0];
    this.author = dataBook.volumeInfo.author ? dataBook.volumeInfo.author : 'No Author Found';
    this.title = dataBook.volumeInfo.title ? dataBook.volumeInfo.title : "NO Title Found";
    this.description1 = dataBook.volumeInfo.description ? dataBook.volumeInfo.description : "No Description Found";
    this.image_url = dataBook.volumeInfo.imageLinks.thumbnail ? dataBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}


// -------------------------------------------------------------------------------------

// connect to DB and port
client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);