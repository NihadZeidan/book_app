'use strict';

require('dotenv').config();
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
const { response } = require('express');
const pg = require('pg');
const app = express();

// ---------------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 4444
const ENV = process.env.ENV;
// MiddleWare to direct your express
app.use(express.urlencoded({ extended: true }));

// pg setup

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


// creat path for form
app.get('/searches/new', formHandler)
app.post('/searches', resultHandler)
app.get('/', renderFromDB);
app.get('/books/:id', makeRequest);
app.post('/books', formRequest);


// To set the view engine to server-side template   
app.use(express.static('public/styles'));
app.set('view engine', 'ejs');
app.use("*", errorHandler)

// ----------------------------------------------------------------------------------

function formRequest(request, response) {
   const {author, title, isbn, image_url, description1} = request.body;
   const safeValues = [author, title, isbn, image_url, description1];
    const sqlQuery = `INSERT INTO shelf(author, title, isbn, image_url, description1) 
    VALUES($1,$2,$3,$4,$5);`;
client.query(sqlQuery,safeValues).then(
response.redirect('/')).catch(error => {
    errorHandler(error,response)
}
)
}


function makeRequest(request, response) {
    const id = request.body.id;
    const sqlQuery = 'SELECT * FROM shelf WHERE id=$1;';
    const safeValues = [id];

    client.query(sqlQuery, safeValues).then(result => {
        console.log(result.rows);
        response.render('pages/books/show2', { oneBook: result.rows })
    }).catch(res => {
        res.render("HELLOOO");
    })

}



function renderFromDB(request, response) {
    const sqlQuery = `SELECT * FROM shelf;`;
    client.query(sqlQuery).then(
        result => {
            response.render('pages/index', { SeedData: result.rows })
        }
    )
}
// .catch( error => 
//     errorHandler(error,response)
// )

function formHandler(req, res) {
    res.render('pages/searches/new')
}


function resultHandler(req, res) {
    let url = `https://www.googleapis.com/books/v1/volumes`
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
    })
}


function errorHandler(req, res) {
    res.render('pages/error');
}


// -------------------------------------------------------------------------------------------
function Book(dataBook) {

    const check = dataBook.volumeInfo.industryIdentifiers.map(obj => {
        if (obj.type === 'ISBN_13') {
            return `${obj.type} ${obj.identifier}`
        }
    });

    this.isbn = check[0];
    this.authors = dataBook.volumeInfo.authors ? dataBook.volumeInfo.authors : 'No Author Found';
    this.title = dataBook.volumeInfo.title ? dataBook.volumeInfo.title : "NO Title Found";
    this.description1 = dataBook.volumeInfo.description1 ? dataBook.volumeInfo.description1 : "No Description Found";
    this.image_url = dataBook.volumeInfo.imageLinks.thumbnail ? dataBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}



// -------------------------------------------------------------------------------------

// connectapp to DB
client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);