// require and instantiate express
var express = require('express');
var app = express();
// we'll need the path module to correctly concatenate our paths
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
// base58 for encoding and decoding functions
var base58 = require('./base58.js');

// grab the url model
var Url = require('./models/url');

mongoose.connect('mongodb://user1:123456@ds139959.mlab.com:39959/url-shortener');

// handles JSON bodies
app.use(bodyParser.json());
// handles URL encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// tell Express to serve files from our public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  // route to serve up the homepage (index.html)
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/api/shorten', function(req, res){
  var longUrl = req.body.url;
  var shortUrl = '';

  // check if url already exists in database
  Url.findOne({long_url: longUrl}, function (err, doc){
    if (doc){
      // base58 encode the unique _id of that document and construct the short URL
      shortUrl = config.webhost + base58.encode(doc._id);

      // since the document exists, we return it without creating a new entry
      res.send({'shortUrl': shortUrl});
    } else {
      // The long URL was not found in the long_url field in our urls
      // collection, so we need to create a new entry:
      var newUrl = Url({
        long_url: longUrl
      });

      // save the new link
      newUrl.save(function(err) {
        if (err){
          console.log(err);
        }

        // construct the short URL
        shortUrl = config.webhost + base58.encode(newUrl._id);

        res.send({'shortUrl': shortUrl});
      });
    }

  });

});

//to redirect when the user keys in the base58 url
app.get('/:encoded_id', function(req, res){
  var base58Id = req.params.encoded_id;
  var id = base58.decode(base58Id);

  // check if url already exists in database
  Url.findOne({_id: id}, function (err, doc){
    if (doc) {
      // found an entry in the DB, redirect the user to their destination
      res.redirect(doc.long_url);
    } else {
      // nothing found, take 'em home
      res.redirect(config.webhost);
    }
  });

});

var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});