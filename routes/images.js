
/*
 * GET home page.
 */



var UNSUPPORTED_MEDIA = 415,
    INTERNAL_ERROR = 500;


var errorResponse = function(code, err, res) {
  res.writeHead(code, {"Content-Type": "text/plain"});
  res.write(err + "\n");
  res.end();
}

//Too much blocking, change later
var imagesFeedSender = function(res, feed, path) {
  var fs = require('fs');
  fs.readdir(path, function(err, files){
    var intRegex = /^\d+$/;
    
    for (var i in files) {  
      if(intRegex.test(files[i])) {
        
        var file = path + files[i] +'/entry.xml';
	if (fs.existsSync(file)) {
          feed = feed + fs.readFileSync(file) + '\n';
	}
      }
    }
    feed = feed + '</feed>';
    res.writeHead(200, {"Content-Type": "application/atom+xml"});
    res.write(feed);
    res.end();	
  });
  
};

exports.list = function(req, res){
  var fs = require('fs');
  var collectionNo = req.params.col_id;
  var path = './media/' + collectionNo + '/';
  var imageFeedPath = './media/' + collectionNo + '/images';
  var imageUpdatePath = './media/' + collectionNo + '/update_time';
  fs.exists('./media/' + collectionNo, function (exists) {
    if(!exists) {
      errorResponse(404, "not found\n",res);
    } else {
      fs.exists(imageFeedPath, function(exists) {
        if (exists) {
          //we have the file
          fs.readFile(imageFeedPath, function (err, data) {
            if (err) {
              //unexpected internal error
	      errorResponse(INTERNAL_ERROR,err, res);
	    } else {
              fs.readFile(imageUpdatePath, function (err, time) {
	        if (err) {
                  //unexpected internal error
	          errorResponse(INTERNAL_ERROR,err, res);
	        } else {
	          data = data + '<updated>'+time+'</updated>\n';
	          imagesFeedSender(res, data, path);
	        } 
              });
	    }
          });      
        } else {
          //generate the atom feed
          var uuid = require('node-uuid');
          var date = new Date();
          var data = '<?xml version="1.0" encoding="utf-8"?>\n'
	            +'<feed xmlns="http://www.w3.org/2005/Atom"\n'
		    +'xmlns:app="http://www.w3.org/2007/app">\n'
		    +'<title>Images</title>\n'
		    +'<id>urn:uuid:'+uuid.v1()+'</id>\n' 
		    +'<app:collection href="/' + collectionNo + '/images">\n'
		    +'<title>Images</title>\n'
		    +'<app:accept>image/jpeg</app:accept>\n'
                    +'<app:accept>image/png</app:accept>\n'
		    +'</app:collection>\n';

	  fs.writeFile(imageFeedPath, data, function (err) {
  	    if (!err)
  	      console.log(imageFeedPath + ' created');
	  });
          var update = date.toISOString();
	  data = data + '<updated>'+update+'</updated>\n';
          fs.writeFile(imageUpdatePath, update, function (err){
            if (!err)
	      console.log("update_time file is renewed");
	  });
          imagesFeedSender(res, data, path);
        } 
      });
    }
  }); 
}
  
exports.getImageMeta = function(req, res) {
  var fs = require('fs');
  var path = './media/' + req.params.col_id + '/' + req.params.img_id + '/entry.xml';
  fs.exists(path, function (exists) {
    if(exists) {
      fs.readFile(path, "utf8", function (err, data) {
        if (err) {
          //unexpected internal error
	  errorResponse(INTERNAL_ERROR,err, res);
	} else {
          res.writeHead(200, {"Content-Type": "application/atom+xml;type=entry"});
          res.write('<?xml version="1.0" encoding="utf-8"?>\n' + data);
          res.end();
          
        }
      }); 
    } else {
      errorResponse(404, "not found\n",res);
    }
  });
}


exports.getImageFile = function(req, res) {
  var fs = require('fs');
  var path = './media/' + req.params.col_id + '/' + req.params.img_id;
  fs.exists(path, function (exists) {
    if(exists) {
      fs.exists(path + '/image.jpeg', function(err, data) {
        var type;
        if (exists) type = "jpeg"; else type = "png";
        fs.readFile(path + '/image.' + type, function (err, data) {
          if (err) {
            //unexpected internal error
	    errorResponse(INTERNAL_ERROR,err, res);
	  } else {
            type = 'image/' + type;
            res.writeHead(200, {"Content-Type": type});
            res.write(data);
            res.end();
          }
        }); 
      });
      
    } else {
      console.log(path);
      errorResponse(404, "not found\n",res);
    }
  });
}

var nextFolder = function (files) {
  var max = 0;
  var intRegex = /^\d+$/;
  for (var i in files) {
    if(intRegex.test(files[i]) && (parseInt(files[i]) > max)) 
      max = parseInt(files[i]);
        
  }
  max++;
  return max; 
};

var makeImageEntry = function (title, update, ct, metaURI, imageURI) {
  var uuid = require('node-uuid');
  var id = 'urn:uuid:'+uuid.v1();
  var xmlEntry = '<entry>\n'
               + '<id>' + id + '</id>\n'
               + '<title>' + title + '</title>\n'    
               + '<updated>' + update + '</updated>\n'
               + '<summary type="text" />\n'
               + '<content type="' + ct + '" src="' + imageURI + '"/>\n'
               + '<link rel="edit-media" href="' + imageURI + '"/>\n'
               + '<link rel="edit" href="' + metaURI + '"/>\n'
	       + '</entry>';
  return xmlEntry
};

exports.addImage = function(req, res) {
  var fs = require('fs');
  var imageData;
  var collectionNo = req.params.col_id;
  req.on("data", function(data) {
    imageData = data;
  });
  
  req.on("end", function(){
    var ct = req.headers['content-type']; 
    var title = "no name";
    if (req.headers['slug']) title = req.headers['slug'];
    if ((ct = "image/jpeg") || (ct = "image/png")) {
      fs.exists('./media/' + collectionNo, function (exists) {
        if(!exists) {
          errorResponse(404, "not found\n",res);
        } else {
          fs.readdir('./media/' + collectionNo + '/', function(err, files){
            if (err) {
              //unexpected internal error
              errorResponse(INTERNAL_ERROR,err, res);
            } else {
              var folder = nextFolder(files);
              fs.mkdir('./media/' + collectionNo + '/' + folder, function(err){
                if (err) errorResponse(INTERNAL_ERROR,err, res);
                else {
                  var file;
                  var path = './media/' + collectionNo + '/' + folder;
                  var metaURI = collectionNo + '/images/' + folder + '/meta';
                  var imageURI = collectionNo + '/images/' + folder + '/image';
                  if (ct = "image/jpeg") file = "image.jpeg";
                  else if (ct = "image/png") file = "image.png";
                  fs.writeFile(path + '/image' + file, imageData, function (err) {
	            if (err) errorResponse(INTERNAL_ERROR,err, res);
		    else {  
                      console.log("created image file");
                      var date = new Date();
                      var update = date.toISOString();
                      var xmlEntry = makeImageEntry(title, update, ct, metaURI, imageURI);

                      //save into file			
	              fs.writeFile(path + '/entry.xml', xmlEntry, function (err) {
	                if (!err)
		          console.log("created entry.xml");
	              });
	              fs.writeFile('./media/' + collectionNo + '/update_time', update, function (err){
                        if (!err)
		          console.log("update_time file is renewed");
	              });

		      //send response
	              var location = req.headers['host'] + '/' + folder;	
	              res.writeHead(201, {"Content-Type": "application/atom+xml;type=entry",
			            	      "Location": location});
                      res.write('<?xml version="1.0" encoding="utf-8"?>\n' + xmlEntry + "\n");
                      res.end();
                    }
	          });
                }
              });
            }
          });
        }
      });
      
    } else {
      errorResponse(UNSUPPORTED_MEDIA, "only image/jpeg or image/png accepted accepted\n", 
											res);
    }
  });
}


exports.deleteCollection = function(req, res) {
  var fs = require('fs');
  var collection = './media/' + req.params.id;
  fs.exists(collection, function (exists) {
    if (exists) {
      var wrench = require('wrench'),
            util = require('util');
      wrench.rmdirSyncRecursive(collection, true);
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.write("OK\n");
      res.end();
      var date = new Date();
      var update = date.toISOString();
      fs.writeFile('./media/update_time', update, function (err){
        if (!err)
	  console.log("update_time file is renewed");
      });
    } else {
      errorResponse(404, "not found\n",res);
     
    }
  });
};

exports.changeCollectionMetadata = function(req, res) {
  var fs = require('fs');
  var path = './media/' + req.params.id + '/entry.xml';
  var folder = req.params.id;
  var xml2js = require('xml2js');
  var parser = new xml2js.Parser();
  var newEntry;
  req.on("data", function(data) {
    parser.parseString(data, function(err, result){
       newEntry = result;
    });
  });

  req.on("end", function(){
    var content_type = req.headers['content-type'];
    fs.exists(path, function (exists) {
      if (exists) {
        
        if ((content_type == 'application/atom+xml;type=entry') && newEntry.entry) {
          fs.readFile(path, "utf8", function (err, data) {
            if (err) {
              //unexpected internal error
	      errorResponse(INTERNAL_ERROR,err, res);
	    } else {
              data = '<?xml version="1.0" encoding="utf-8"?>\n' + data;
              var parser2 = new xml2js.Parser();
              parser2.parseString(data, function(err, oldEntry){
                if (err) console.log ("ERROR");
                var date = new Date();
                var update = date.toISOString();
                var title;
                if (newEntry.entry['title'])
	          title = newEntry.entry['title']
                else title = "no name"; 
                var xmlEntry = '<entry>\n'
                             + '<id>' + oldEntry.entry['id'] + '</id>\n'
                             + '<title>' + title + '</title>\n'    
                             + '<updated>' + update + '</updated>\n';
                if (newEntry.entry['author'])
	          xmlEntry = xmlEntry + '<author>' + newEntry.entry['author'] + '</author>';
                if (newEntry.entry['rights'])
	          xmlEntry = xmlEntry + '<rights>' + newEntry.entry['rights'] + '</rights>';
                if (newEntry.entry['summary'])
                  xmlEntry = xmlEntry + '<summary>' + newEntry.entry['rights'] + '</summary>';
                xmlEntry = xmlEntry + '<link rel="self" href="'
	               + folder + '"/>\n'
		       + '<link rel="edit" type="application/atom+xml;type=entry" href="'
		       + folder + '"/>\n';
                xmlEntry = xmlEntry + '</entry>';

 	        //send response
                res.writeHead(200);
                res.end();

	        //save into file			
	        fs.writeFile(path, xmlEntry, function (err) {
	          if (!err)
		    console.log("updated entry.xml");
	        });
	        fs.writeFile('./media/update_time', update, function (err){
                  if (!err)
		    console.log("update_time file is renewed");
	        });
              });
            }
          });   
        } else {
          errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 
											res);
        }
      } else {
        errorResponse(404, "not found\n",res);
      }
    });
    
  });
};


