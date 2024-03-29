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



var collectionsFeedSender=function(res,feed,colId){
//console.log("hello World");
   var fs = require('fs');
   var path = './media/'+colId+'/comments/';
//console.log(path);
fs.readdir(path,function(err,files){
var intRegex = /^\d+$/;
    for(var i in files) {
	if(intRegex.test(files[i])) {
    
     if(fs.existsSync(path + files[i])){
      
	feed=feed+fs.readFileSync(path + files[i]);
        //console.log(feed);
        }
    }
  }
    feed = feed + '</feed>';
    res.writeHead(200, {"Content-Type": "application/atom+xml"});
    res.write(feed);
    res.end();	
});
}

/*
var collectionsFeedSender = function(res, feed) {
var fs = require('fs');
  fs.readdir('./media/', function(err, files){
    var intRegex = /^\d+$/;
    
    for (var i in files) {  
      if(intRegex.test(files[i])) {
        
        var file = './media/' + files[i] +'/entry.xml';
	if (fs.existsSync(file)) {
          console.log(file);
          feed = feed + fs.readFileSync(file) + '\n';
	}
      }
    }
    feed = feed + '</feed>';
    res.writeHead(200, {"Content-Type": "application/atom+xml"});
    res.write(feed);
    res.end();	
  });
  
}
*/

exports.list=function(req,res){
var fs = require('fs');
var colId  = req.params.col_id;
var path = './media/'+colId+'/comments.atom';

       //console.log("hello");
       fs.exists(path,function(exists){

if (exists) {
console.log("exist srabotal");
      //we have the file
      fs.readFile(path, function (err, data) {
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
	      collectionsFeedSender(res, data, colId);
	    } 
          });
	}
      });      
    } else {
	console.log("else srabotal");
      //generate the atom feed
      var uuid = require('node-uuid');
      var date = new Date();
      var data = '<?xml version="1.0" encoding="utf-8"?>\n'
		+'<feed xmlns="http://www.w3.org/2005/Atom"\n'
		+'xmlns:app="http://www.w3.org/2007/app">\n'
		+'<title>Collections</title>\n'
		+'<id>urn:uuid:'+uuid.v1()+'</id>\n' 
		+'<app:collection href="">\n'
		  +'<title>Collections</title>\n'
		  +'<app:accept>application/atom+xml;type=entry</app:accept>\n'
		+'</app:collection>\n';

	fs.writeFile('./media/'+colId+'/comments.atom', data, function (err) {
  	  if (!err)
  	    console.log('./media/'+colId+'/comments.atom created');
	});
        var update = date.toISOString();
	data = data + '<updated>'+update+'</updated>\n';
        fs.writeFile('./media/update_time', update, function (err){
          if (!err)
	    console.log("update_time file is renewed");
	});
        collectionsFeedSender(res, data);	
    }
});
}

//delete comment
exports.deleteComment = function(req, res) {
  var fs = require('fs');
  var collection = './media/' + req.params.col_id+'/comments/'+req.params.com_id;
  fs.exists(collection, function (exists) {
    if (exists) {
     // var wrench = require('wrench'),
       //     util = require('util');

fs.unlink(collection,function (err) {
  if (err) throw err;
  console.log('successfully deleted'+collection);
});

  //    wrench.rmdirSyncRecursive(collection, true);

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


//replace comment
exports.replaceComment = function(req, res) {
  var fs = require('fs');
  var path = './media/'+req.params.col_id+'/comments/'+req.params.com_id;

  //var folder = req.params.id;
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
        console.log("hello");
        if ((content_type == 'application/atom+xml;type=entry') && newEntry.entry) {
          fs.readFile(path, "utf8", function (err, data) {
            if (err) {
              //unexpected internal error
	      errorResponse(INTERNAL_ERROR,err, res);
	    } else {
var content = newEntry.entry['content'];

if(content)
{
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
                             +'<content>'+content+'</content>\n'   
                             + '<updated>' + update + '</updated>\n';
                if (newEntry.entry['author'])
	          xmlEntry = xmlEntry + '<author>' + newEntry.entry['author'] + '</author>';
                if (newEntry.entry['rights'])
	          xmlEntry = xmlEntry + '<rights>' + newEntry.entry['rights'] + '</rights>';
                if (newEntry.entry['summary'])
                  xmlEntry = xmlEntry + '<summary>' + newEntry.entry['rights'] + '</summary>';
                xmlEntry = xmlEntry + '<link rel="self" href=""/>\n'
		       + '<link rel="edit" type="application/atom+xml;type=entry" href=""/>\n';
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
else{
errorResponse(506, "no content\n",res);
}
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


//add new Comment
exports.addComment = function(req, res){
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var newEntry;
var colId=req.params.col_id;
//console.log(commId+"Kz");
req.on("data", function(data) {

    parser.parseString(data, function(err, result){
       newEntry = result;
    });
  });

req.on("end", function(){

    var content_type = req.headers['content-type'];
    if ((content_type == 'application/atom+xml;type=entry') && newEntry.entry) {

var content = newEntry.entry['content'];

if(content) // if there is comment   
{
      var xmlEntry;
      var uuid = require('node-uuid');
      var id = 'urn:uuid:'+uuid.v1();
      var date = new Date();
      var update = date.toISOString();
      var title;
      
      if (newEntry.entry['title'])
	title = newEntry.entry['title']
      else title = "no name";

      xmlEntry = '<entry>\n'
               + '<id>' + id + '</id>\n'
               + '<title>' + title + '</title>\n'
               + '<comment>'+content+'</comment>\n'    
               + '<updated>' + update + '</updated>\n'
               

      if (newEntry.entry['author'])
	xmlEntry = xmlEntry + '<author>' + newEntry.entry['author'] + '</author>';
      if (newEntry.entry['rights'])
	xmlEntry = xmlEntry + '<rights>' + newEntry.entry['rights'] + '</rights>';
      if (newEntry.entry['summary'])
	xmlEntry = xmlEntry + '<summary>' + newEntry.entry['rights'] + '</summary>';


      var fs = require('fs');
      fs.readdir('./media/'+colId+'/comments/', function(err, files){
	if (err) {
          //unexpected internal error
          errorResponse(INTERNAL_ERROR,err, res);
        } else {
          var file = nextFolder(files);
          //fs.mkdir('./media/'+colId+'/comments', function(err){
	   // if (err) errorResponse(INTERNAL_ERROR,err, res);
	 //   else { 
	     // console.log('created comment ./media/' + folder);

	      xmlEntry = xmlEntry + '<link rel="self" href=""/>'
	              // + folder + '"/>\n'
		       + '<link rel="edit" type="application/atom+xml;type=entry" href=""/>\n'
		      // + folder + '"/>\n';
	      xmlEntry = xmlEntry + '</entry>';
	      //send response
	      var location = req.headers['host']; //+ '/' + folder;	
	      res.writeHead(201, {"Content-Type": "application/atom+xml;type=entry",
				  "Location": location});
              res.write('<?xml version="1.0" encoding="utf-8"?>\n' + xmlEntry + "\n");
              res.end();

	      //save into file			
	      fs.writeFile('./media/'+colId+'/comments/'+file, xmlEntry, function (err) {
	        if (!err)
		  console.log("created "+file);
	      });
	      fs.writeFile('./media/update_time', update, function (err){
                if (!err)
		  console.log("update_time file is renewed");
});
	    }  
          
      });   
    } 
else 
errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 									           res);
}
else 
      errorResponse(UNSUPPORTED_MEDIA, "only application/atom+xml;type=entry accepted\n", 
											res);
  });

};

