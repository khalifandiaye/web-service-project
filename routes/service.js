
/*
 * GET home page.
 */

exports.collections = function(req, res){
  var fs = require('fs');

  fs.exists('./media/collections.atom', function (exists) {
    if (exists) {
      //we have the file
      fs.readFile('./media/collections.atom', function (err, data) {
        if (err) {
          //unexpected internal error
	  res.writeHead(500, {"Content-Type": "text/plain"});
          res.write(errs + "\n");
          res.end();
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
  	  if (err) throw err;
  	  console.log('./media/collections.atom created');
	});
	
    }
  }); 	
};
