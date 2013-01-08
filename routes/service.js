
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

//Too much blocking change later
var collectionsFeedSender = function(res, feed) {
  var fs = require('fs');
  fs.readdir('./media/', function(err, files){
    var intRegex = /^\d+$/;
    
    for (var i in files) {  
      if(intRegex.test(files[i])) {
        
        var file = './media/' + files[i] +'/entry.xml';
	if (fs.existsSync(file)) {
          console.log(file);
          feed = feed + fs.readFileSync(file);
	}
      }
    }
    feed = feed + '</feed>';
    res.writeHead(200, {"Content-Type": "application/atom+xml"});
    res.write(feed);
    res.end();	
  });
  
}

exports.collections = function(req, res){
  var fs = require('fs');

  fs.exists('./media/collections.atom', function (exists) {
   
    if (exists) {
      //we have the file
      fs.readFile('./media/collections.atom', function (err, data) {
        if (err) {
          //unexpected internal error
	  errorResponse(INTERNAL_ERROR,err, res);
	} else {
          fs.readFile('./media/update_time', function (err, time) {
	    if (err) {
              //unexpected internal error
	      errorResponse(INTERNAL_ERROR,err, res);
	    } else {
	      data = data + '<updated>'+time+'</updated>\n';
	      collectionsFeedSender(res, data);
	    } 
          });
	}
      });      
    } else {
      //generate the atom feed
      var uuid = require('node-uuid');
      var date = new Date();
      var data = '<?xml version="1.0" encoding="utf-8"?>'
		+'<feed xmlns="http://www.w3.org/2005/Atom"'
		+'xmlns:app="http://www.w3.org/2007/app">'
		+'<title>Collections</title>'
		+'<id>urn:uuid:'+uuid.v1()+'</id>' 
		+'<app:collection href="">'
		  +'<title>Collections</title>'
		  +'<app:accept>application/atom+xml;type=entry</app:accept>'
		+'</app:collection>';

	fs.writeFile('./media/collections.atom', data, function (err) {
  	  if (!err)
  	    console.log('./media/collections.atom created');
	});
        var update = date.toISOString();
	data = data + '<updated>'+update+'</updated>';
        fs.writeFile('./media/update_time', update, function (err){
          if (!err)
	    console.log("update_time file is renewed");
	});
        collectionsFeedSender(res, data);	
    }
  }); 
};

exports.collection = function(req, res) {
  var fs = require('fs');
  var accept = req.headers["accept"];
  var path = './media/' + req.params.id + '/entry.xml';
  
  fs.exists(path, function (exists) {
    if(exists) {
      fs.readFile(path, function (err, data) {
        if (err) {
          //unexpected internal error
	  errorResponse(INTERNAL_ERROR,err, res);
	} else {
          if (accept.indexOf("application/json") != -1) {
            //send json
            var xml2js = require('xml2js');
            var parser = new xml2js.Parser();
            //console.log (data);
            parser.parseString(data, function(err, result){
              
              res.writeHead(200, {"Content-Type": "application/json"});
              res.write(JSON.stringify(result));
              res.end();
            });
          } else { 
            res.writeHead(200, {"Content-Type": "application/atom+xml;type=entry"});
            res.write('<?xml version="1.0" encoding="utf-8"?>' + data);
            res.end();
          }
        }
      }); 
    } else {
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



exports.newCollection = function(req, res){
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
    if ((content_type == 'application/atom+xml;type=entry') && newEntry.entry) {
      var xmlEntry;
      var uuid = require('node-uuid');
      var id = 'urn:uuid:'+uuid.v1();
      var date = new Date();
      var update = date.toISOString();
      var title;
      
      if (newEntry.entry['title'])
	title = newEntry.entry['title']
      else title = "no name"; 
      xmlEntry = '<entry>'
               + '<id>' + id + '</id>'
               + '<title>' + title + '</title>'    
               + '<updated>' + update + '</updated>';
      if (newEntry.entry['author'])
	xmlEntry = xmlEntry + '<author>' + newEntry.entry['author'] + '</author>';
      if (newEntry.entry['rights'])
	xmlEntry = xmlEntry + '<rights>' + newEntry.entry['rights'] + '</rights>';
      if (newEntry.entry['summary'])
	xmlEntry = xmlEntry + '<summary>' + newEntry.entry['rights'] + '</summary>';
      var fs = require('fs');
      fs.readdir('./media/', function(err, files){
	if (err) {
          //unexpected internal error
          errorResponse(INTERNAL_ERROR,err, res);
        } else {
          var folder = nextFolder(files);
          fs.mkdir('./media/' + folder, function(err){
	    if (err) errorResponse(INTERNAL_ERROR,err, res);
	    else { 
	      console.log('created folder ./media/' + folder);
	      xmlEntry = xmlEntry + '<link rel="self" href="' + folder + '"/>'
		       + '<link rel="edit" type="application/atom+xml;type=entry" href="' + folder + '"/>'
                       + '<link rel="images" href="' + folder + '/images"/>'
                       + '<link rel="comments" href="' + folder + '/comments"/>';
	      xmlEntry = xmlEntry + '</entry>';
	      //send response
	      var location = req.headers['host'] + '/' + folder;	
	      res.writeHead(201, {"Content-Type": "application/atom+xml;type=entry",
				  "Location": location});
              res.write('<?xml version="1.0" encoding="utf-8"?>' + xmlEntry);
              res.end();

	      //save into file			
	      fs.writeFile('./media/' + folder + '/entry.xml', xmlEntry, function (err) {
	        if (!err)
		  console.log("created entry.xml");
	      });
	      fs.writeFile('./media/update_time', update, function (err){
                if (!err)
		  console.log("update_time file is renewed");
	      });
	      fs.mkdir('./media/' + folder + '/comments', function (err){
		if (!err)
		  console.log("comments foder is created"); 
              });
            }
          });
        }
      });
      
    } else {
      errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 
											res);
    }
  });
};

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
                var xmlEntry = '<entry>'
                             + '<id>' + oldEntry.entry['id'] + '</id>'
                             + '<title>' + title + '</title>'    
                             + '<updated>' + update + '</updated>';
                if (newEntry.entry['author'])
	          xmlEntry = xmlEntry + '<author>' + newEntry.entry['author'] + '</author>';
                if (newEntry.entry['rights'])
	          xmlEntry = xmlEntry + '<rights>' + newEntry.entry['rights'] + '</rights>';
                if (newEntry.entry['summary'])
                  xmlEntry = xmlEntry + '<summary>' + newEntry.entry['summary'] + '</summary>';
                xmlEntry = xmlEntry + '<link rel="self" href="' + folder + '"/>'
		       + '<link rel="edit" type="application/atom+xml;type=entry" href="' + folder + '"/>'
                       + '<link rel="images" href="' + folder + '/images"/>'
                       + '<link rel="comments" href="' + folder + '/comments"/>';
                xmlEntry = xmlEntry + '</entry>';

 	        //send response
                res.writeHead(204);
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


