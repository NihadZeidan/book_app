'use strict';

require('dotenv').config();
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
const { response } = require('express');
const app = express();
// ------------------------------------------

const PORT = process.env.PORT || 4444

// MiddleWare to direct your express
app.use(express.urlencoded());


// creat path for form
app.get('/searches/new', formHandler)
app.post('/searches', resultHandler)


// To set the view engine to server-side template   
app.use(express.static('public/styles'));

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
    response.render('pages/index');
});

app.use("*", errorHandler)

// ---------------------------------------

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
                if (newBook.image_url === '') {
                    newBook.image_url = 'https://i.imgur.com/J5LVHEL.jpg'
                };
                return newBook;
            }
        )
    }).then(resultNew => {
        res.render('pages/show', { UserBooks: resultNew.slice(0, 11) })
    }).catch(res => {
        res.render("pages/error");
    })
}

function errorHandler(req, res) {
    res.render("pages/error");
}


// -----------------------------------------
function Book(dataBook) {
    this.authors = dataBook.volumeInfo.authors;
    this.title = dataBook.volumeInfo.title;
    this.description = dataBook.volumeInfo.description;
    this.image_url = dataBook.volumeInfo.imageLinks.smallThumbnail;
}



// -------------------------------------------
app.listen(PORT, () => {
    console.log(`Listening to PORT ${PORT}`);
});