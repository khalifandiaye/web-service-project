
/**
 * Module dependencies.
 */

var express = require('express')
  , collections = require('./routes/service')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , comments = require('./routes/comments')
  , images = require('./routes/images');
   

var app = express();


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', collections.collections); //discover collections
app.get('/:id', collections.collection); //get a collection
app.post('/', collections.newCollection); //add new collection
app.delete('/:id', collections.deleteCollection); //delete existing collection
app.put('/:id', collections.changeCollectionMetadata); //Change collection's metadata

app.get('/:col_id/comments', comments.list); //list comments
//app.get('/:col_id/comments/:com_id', comments.getComment); //get a comment
app.post('/:col_id/comments', comments.addComment); //add new comment
app.delete('/:col_id/comments/:com_id', comments.deleteComment); //delete existing comment
app.put('/:col_id/comments/:com_id', comments.replaceComment); //replace comment (edit)

app.get('/:col_id/images', images.list); //list images
app.get('/:col_id/images/:img_id/meta', images.getImageMeta); //get image metadata
app.get('/:col_id/images/:img_id/image', images.getImageFile); //get image file
app.post('/:col_id/images', images.addImage); //add new image
app.delete('/:col_id/images/:img_id/meta', images.deleteImage); //delete image (file + metadata)
app.put('/:col_id/images/:img_id/meta', images.replaceImageMeta); //replace (edit) image meta
app.put('/:col_id/images/:img_id/image', images.replaceImageFile); //replace image file



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
