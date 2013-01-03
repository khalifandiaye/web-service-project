
/*
 * GET home page.
 */

exports.collections = function(req, res){
  res.render('index', { title: 'Express' });
};
