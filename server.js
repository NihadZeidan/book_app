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


// app.use(express.urlencoded());

// To set the view engine to server-side template   
app.set('view engine', 'ejs');
app.use(express.static("public"));


app.get('/', (request, response) => {
    response.render('pages/index');
});







// -------------------------------------------
app.listen(PORT, () => {
    console.log(`Listening to PORT ${PORT}`);
});