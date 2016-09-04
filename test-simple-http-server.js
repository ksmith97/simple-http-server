'use strict';
const path = require('path');
const expect = require('chai').expect;
const server = require('./simple-http-server');
const fs = require('fs');
const os = require('os');

describe('Simple Http Server', () => {
    describe('translate_path', () => {
        it('Simple success with leading slash', () => {
            const url = server.translate_path('/a');

            expect(url).to.eql(path.join(process.cwd(), 'a'));
        })

        it('Simple success without slash', () => {
            const url = server.translate_path('a');

            expect(url).to.eql(path.join(process.cwd(), 'a'));
        })

        it('Test nested path', () => {
            const url = server.translate_path('/a/b/c');

            expect(url).to.eql(path.join(process.cwd(), 'a', 'b', 'c'));
        })

        it('Test nested relative path', () => {
            const url = server.translate_path('/a/b/../c');

            expect(url).to.eql(path.join(process.cwd(), 'a', 'c'));
        })

        it('Test relative path that escapes root dir', () => {
            const url = server.translate_path('../../../c');

            expect(url).to.eql(process.cwd());
        })

        it('Spaces are resolved properly', () => {
            const url = server.translate_path('a b');

            expect(url).to.eql(path.join(process.cwd(), 'a b'));
        })
    })

    describe('list_directory', () => {
        it('Simple test to check the proper number of files are retrieved.', (done) => {
            server
                .list_directory(process.cwd())
                .then(objs => {
                    expect(objs).to.be.length.above(3);
                    //Verify basic files
                    expect(objs).to.have.deep.property('3.name', 'app.js');
                    expect(objs).to.have.deep.property('3.href', 'app.js');
                    //Verify directory behavior
                    expect(objs).to.have.deep.property('0.name', '.eslintrc.json');
                    expect(objs).to.have.deep.property('0.href', '.eslintrc.json');
                })
                .then(done)
                .catch(done);
        })
    })

    function createTempFiles() {
        const files = Array.apply(null, arguments);
        return new Promise((resolve, reject) => {
            fs.mkdtemp(os.tmpdir() + path.sep, (err, dir) => {
                if (err) return reject(err);

                console.log('Created test Temp dir', dir);

                const tempFiles = files.map(file => {
                    return path.join(dir, file);
                })
                tempFiles.forEach(file => {
                    try {
                        fs.writeFileSync(file, '<html></html>');
                    } catch (e) {
                        return reject(e);
                    }
                });

                return resolve({ dir, tempFiles });
            });
        });
    }

    describe('get_index_file', () => {
        it('Single index.html file', done => {
            createTempFiles('index.html')
                .then(result => {
                    return server.get_index_file(result.dir)
                })
                .then(filePath => {
                    expect(filePath).to.match(/index\.html$/);
                })
                .then(done)
                .catch(done);
        });

        it('Single index.htm file', done => {
            createTempFiles('index.htm')
                .then(result => {
                    return server.get_index_file(result.dir)
                })
                .then(filePath => {
                    expect(filePath).to.match(/index\.htm$/);
                })
                .then(done)
                .catch(done);
        });

        it('Both index.htm and index.html files', done => {
            createTempFiles('index.htm', 'index.html')
                .then(result => {
                    return server.get_index_file(result.dir)
                })
                .then(filePath => {
                    expect(filePath).to.match(/index\.html$/);
                })
                .then(done)
                .catch(done);
        });

        it('No index files', done => {
            createTempFiles()
                .then(result => {
                    return server.get_index_file(result.dir)
                })
                .catch(e => {
                    expect(e).to.exist;
                    done();
                });
        });
    });
})
