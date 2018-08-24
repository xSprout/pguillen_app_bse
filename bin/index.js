let epub = require("epub");
const fs = require('fs');
const path = require('path');
const async = require('async');
const request = require('requestretry');
let wdir = process.argv.slice(2)[0].replace(/\\/g,"/");
let book_directory = path.resolve(path.normalize(wdir + "/" + "./../books/"));
let xml_directory = path.resolve(path.normalize(wdir + "/" + "./../.xml_ebooks/"));
let written_files = path.resolve(path.normalize(wdir + "/" + "./writtenFiles.txt"));
let q_requests = async.queue(PostMetadata,1);
let q_output = async.queue(OutputXml,10);
let known_files = fs.readFileSync(written_files);

main();

function main()
{
	console.log(book_directory);
	console.log(xml_directory);
	console.log(written_files);
	//let fields = [];
	//filewalker(book_directory, loopThroughEbooks);
}

function loopThroughEbooks(err, files)
{
	if ( err )
			return err;
	let numBooks = 0;
	for (let i = 0; i < files.length; i++) 
	{
		let file = files[i].replace(/\\/g,"/");
		if ( file.indexOf(".epub") < 0 )
			continue;
		let book_file = file;
		let book = new epub(book_file);
		let j = numBooks;
		book.on("end", () => { handleBook(j, file, book); });
		book.on("error", (err) => { console.error(err); });
		setTimeout( () => {book.parse();}, numBooks*500);
		numBooks++;
	}
}

function handleBook(i, file, book)
{
	let folderName = file.split('/').pop();
	for ( let j = 0; j < book.flow.length; j++)
	{
		let chapter = book.flow[j];
		let already_known = known_files.indexOf(path.normalize(xml_directory + folderName + "/" + chapter.id + ".xml")) >= 0 ;
		if ( already_known ) continue;
		setTimeout( () => { handleChapter(file, book, chapter); }, (i*500) + (j*250) );
	}
}

function handleChapter(file, book, chapter)
{
	book.getChapterRaw(chapter.id, (err, txt) => { handleChapterText(file, book, chapter, err, txt); });
}

function handleChapterText(file, book, chapter, err, txt)
{
	let metadata = {};
	let bookData = {};
	let folderName = file.split('/').pop();
	for(let property in book.metadata)
	{
		metadata["book_" + property] = book.metadata[property];
	}
	metadata["book_chapter"] = chapter.id;
	metadata["sourceFile"] = path.normalize(xml_directory + folderName + "/" + chapter.id + ".xml");

	bookData.chapter = chapter;
	bookData.chapterRaw = txt;
	bookData.source = metadata["sourceFile"];
	bookData.folder = xml_directory + folderName + "/";
	fs.appendFileSync(written_files, metadata["sourceFile"] + "\n");
	q_requests.push(metadata, (err) => { });
	q_output.push(bookData, (err) => { });

}

function OutputXml(bookObj, callback)
{
	// console.log("***SPLUNK*** source=\"" + bookObj.source + "\"");
	// console.log(bookObj.chapterRaw);
	// metadata["sourceFile"] = "/Applications/splunk/etc/apps/pguillen_app_bse/.xml_ebooks/" + folderName + "/" + chapter.id + ".xml";
	if (!fs.existsSync(bookObj.folder))
		fs.mkdirSync(bookObj.folder);
	fs.writeFile(bookObj.source, bookObj.chapterRaw, function(err) 
	{
	    if(err) 
	        throw console.log(err);
	});
	callback();
}

function PostMetadata(jsonObj, callback)
{
	let post_data = JSON.stringify(jsonObj);
	let options = {
		uri:"https://localhost:8089/servicesNS/nobody/pguillen_app_bse/storage/collections/data/book_metadata/",
		headers:{
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(post_data),
			'Authorization': 'Basic YWRtaW46ZmRmamtqZnNmamxqZmFmajtqZg=='
		},
		maxAttempts: 5,
  		retryDelay: 5000,
  		retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
  		strictSSL: false,
		body:post_data
	};
	request.post(options, (err,res,body) => 
	{
		if (err )
			throw err;
		// console.log(body);
		// console.log(res.statusCode);
		callback();
	});
}

function filewalker(dir, done) {
    let results = [];

    fs.readdir(dir, function(err, list) {
        if (err) return done(err);

        let pending = list.length;

        if (!pending) return done(null, results);

        list.forEach(function(file){
            file = path.resolve(dir, file);

            fs.stat(file, function(err, stat){
                // If directory, execute a recursive call
                if (stat && stat.isDirectory()) {
                    // Add directory to array [comment if you need to remove the directories from the array]
                    results.push(file);

                    filewalker(file, function(err, res){
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);

                    if (!--pending) done(null, results);
                }
            });
        });
    });
};