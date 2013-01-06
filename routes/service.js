
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
	  res.writeHead(200, {"Content-Type": "application/atom+xml"});
	  res.write(data);
	  res.end();
	}
	
      });      

    } else {
      //generate the atom feed
      var uuid = require('node-uuid');
      var date = new Date();
      var data = '<?xml version="1.0" encoding="utf-8"?>\n'
		+'<feed xmlns="http://www.w3.org/2005/Atom"'
		+'xmlns:app="http://www.w3.org/2007/app">\n'
		+'<title>Collections</title>\n'
		+'<updated>'+date.toISOString()+'</updated>\n'
		+'<id>urn:uuid:'+uuid.v1()+'</id>\n' 
		+'<app:collection href="collection">\n'
		+'<title>Collections</title>\n'
		+'<app:accept>application/atom+xml;type=entry</app:accept>\n'
		+'</app:collection>\n'
		+'</feed>\n';
	res.writeHead(200, {"Content-Type": "application/atom+xml"});
	res.write(data);
	res.end();
	fs.writeFile('./media/collections.atom', data, function (err) {
  	  if (!err)
  	    console.log('./media/collections.atom created');
	});
	
    }
  }); 
};

exports.newCollection = function(req, res){
  var xml2js = require('xml2js');
  var js2xml = require('obj2xml');
  var parser = new xml2js.Parser();
  var newEntry;
  req.on("data", function(data) {
    parser.parseString(data, function(err, result){
      if (err) errorResponse(INTERNAL_ERROR,err, res);
      newEntry=result;
    });
  });
  
  req.on("end", function(){
    var content_type = req.headers['content-type'];
    if (content_type == 'application/atom+xml;type=entry') {
      var uuid = require('node-uuid');
      var id = 'urn:uuid:'+uuid.v1();
      //newEntry.entry["id"] = [id];
      var date = new Date();
      //newEntry.entry["updated"] = [date.toISOString()];
      var inspect = require('eyes').inspector({maxLength: false})	
      console.log(inspect(newEntry));
      //console.log(js2xml.convert(newEntry));
    } else {
      errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 
											res);s
    }
  });

  /*
  var fs = require('fs');
  
  fs.readdir('./media/', function (err, files) {
    if (err) {
      //unexpected internal error
      errorResponse(INTERNAL_ERROR,err, res);
    } else {
      //console.log(files);
      //assign id
      var max = 1;
      var intRegex = /^\d+$/;
      for (var i in files) {
	if(intRegex.test(files[i]) && (parseInt(files[i]) > max)) 
 	  max = parseInt(files[i]);
         
      }
      max++; 
            var content_type = req.headers['content-type'];
      if (content_type == 'application/atom+xml;type=entry') {
        
	
        fs.mkdir('./media/' + max, function(err){
	  if (err) errorResponse(INTERNAL_ERROR,err, res);
	  console.log('created folder ./media/' + max);
        });
      } else {
        errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 
											res);
      }
    }
  }); */
};
