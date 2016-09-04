'use strict';
const path = require('path');
const fs = require('fs');
const mime = require('mime-type/with-db');

const m = {};

m.translate_path = fileName => {
    const wd = process.cwd();

    const newPath = path.join(wd, fileName);

    const absPath = newPath.normalize();

    if (absPath.startsWith(wd)) {
        return absPath;
    }

    return wd;
}

m.list_directory = p => {
    return new Promise((resolve, reject) => {
        fs.readdir(p, (err, files) => {
            if (err) return reject(err);
            const sortedFiles = files.sort();
            //TODO refactor this to be an async map.
            const fileObjs = sortedFiles.map(file => {
                let name = file;
                let href = file;

                const fullpath = path.join(p, file);
                const stat = fs.lstatSync(fullpath);

                if (stat.isDirectory()) {
                    name = file + '/';
                    href = file + '/';
                }

                if (stat.isSymbolicLink()) {
                    name = name + '@';
                }

                return { href, name };
            });

            resolve(fileObjs);
        });
    });
}

m.get_index_file = (fullPath) => {
    return new Promise((resolve, reject) => {
        const htmlPath = path.join(fullPath, 'index.html');
        fs.stat(htmlPath, (err, stat) => {
            if (stat && stat.isFile()) return resolve(htmlPath);

            const htmPath = path.join(fullPath, 'index.htm');
            fs.stat(htmPath, (err, stat) => {
                if (stat && stat.isFile()) return resolve(htmPath);

                return reject(new Error('Could not find index file'));
            });
        })
    })
}

m.send_head = (fileName, res) => {
    console.log('Attempting to retrieve file', fileName);
    const fullPath = m.translate_path(fileName);

    console.log('Resolved path to', fullPath);

    fs.stat(fullPath, (err, stat) => {
        if (err) {
            return res.sendStatus(404);
        }

        if (stat.isDirectory()) {
            console.log('File is a directory');
            if (fileName && !fileName.endsWith('/')) {
                console.log('Redirecting');
                //Redirects to a url with a slash on the end if its a directory.
                return res.redirect(301, fileName + '/');
            }

            console.log('Looking for index file inside directory', fullPath);

            return m.get_index_file(fullPath)
                .then((indexPath) => {
                    console.log('Found index file', indexPath);
                    return res.sendFile(indexPath)
                })
                .catch(err => {
                    console.log('Did not find index file. Listing files.');

                    m.list_directory(fullPath)
                        .then(files => {
                            console.log('Rendering files');
                            res.render('main', { files })
                        })
                        .catch(err => {
                            console.error(err);
                            res.status(404).send('File not found');
                        })
                })
        }

        const ext = path.extname(fullPath);

        const type = mime.lookup(ext) || 'application/octet-stream';
        res.type(type);
        res.download(fullPath, fileName, err => {
            if (err) console.error(err);
        })
    })
}

module.exports = m;