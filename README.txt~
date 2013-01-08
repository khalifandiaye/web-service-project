Installation guide

Our solution was tested on Node.js v 0.8.15.
Once zip file is unpacked "npm install" must be run to install packages defined in package.json.




URI Schema and Hypermedia. [How to test]

Our solution listens to port 3000. 


GET request to http://localhost:3000 will return ATOM feed document that contains entries describing all collections.
[Run test_get_collections.sh in client folder to test] 

POST request to http://localhost:3000 will result in creation of new collection. Body of the request MUST be an ENTRY element. Client provides metadata in the entry by using tags <title>, <author>, <rights> and <summary>. If title is not provided by client, "no name" title to the collection will be assigned by server. Response will have location header showing the URI of the new entry. Body of response will be the populated entry element. It WILL contain id, title, and updated tags, as well as links with rel attributes assigned "self", "edit", "images", "comments" links. "self" and "edit" links will point to the entry, and "images", "comments" links will point to collections listing images and comments of the collection respectively. [test_post_new_collection.sh]

GET, PUT requests to http://localhost:3000/:id used to retrieve and edit metadata of a collection linked to :id. DELETE request to the URI will result in delete of entire collection (including images and comments).
[test_get_collection_meta_in_json.sh (content negotiation example), test_get_collection_meta_in_xml.sh
 test_update_collection_meta.sh
 test_delete_collection.sh]

GET request to http://localhost:3000/:col_id/images will return ATOM feed document that contains entries describing all images in col_id collection.
