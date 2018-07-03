var DWREF = require('./')
var tape = require('tape')
var os = require('os')
var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')

var tmp = path.join(os.tmpdir(), 'dwref-' + process.pid + '-' + Date.now())
var i = 0

mkdirp.sync(tmp)

tape('DWREF Tests: dWeb File Read/Write', function (t) {
  var file = DWREF(gen())

  file.write(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.read(0, 5, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('dpack'))
      file.destroy(() => t.end())
    })
  })
})

tape('DWREF Tests: dWeb File Empty Read', function (t) {
  var file = DWREF(gen(), {writable: true})

  file.read(0, 0, function (err, buf) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    t.same(buf, Buffer.alloc(0), 'DWREF Tests Error: Empty Buffer')
    file.destroy(() => t.end())
  })
})

tape('DWREF Tests: Read Range > dWeb File', function (t) {
  var file = DWREF(gen())

  file.read(0, 5, function (err, buf) {
    t.ok(err, 'DWREF Tests Error: Not Perfect, Needs Work')
    file.destroy(() => t.end())
  })
})

tape('DWREF Tests: Read Range > dWeb File With Data', function (t) {
  var file = DWREF(gen())

  file.write(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'DWREF Tests: Passed Without Error')
    file.read(0, 10, function (err, buf) {
      t.ok(err, 'DWREF Tests Error : Not Perfect, Needs Work')
      file.destroy(() => t.end())
    })
  })
})

tape('DWREF Tests: dWeb File Read/Write w/ Random Entry ', function (t) {
  var file = DWREF(gen())

  file.write(10, Buffer.from('hi'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.write(0, Buffer.from('hello'), function (err) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      file.read(10, 2, function (err, buf) {
        t.error(err, 'DWREF Tests: Success! No Errors.')
        t.same(buf, Buffer.from('hi'))
        file.read(0, 5, function (err, buf) {
          t.error(err, 'DWREF Tests: Success! No Errors.')
          t.same(buf, Buffer.from('hello'))
          file.read(5, 5, function (err, buf) {
            t.error(err, 'DWREF Tests: Success! No Errors.')
            t.same(buf, Buffer.from([0, 0, 0, 0, 0]))
            t.end()
          })
        })
      })
    })
  })
})

tape('DWREF Tests: Re-open', function (t) {
  var name = gen()
  var file = DWREF(name)

  file.write(10, Buffer.from('hello'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    var file2 = DWREF(name)
    file2.read(10, 5, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
    })
  })
})

tape('DWREF Tests: Re-Open and Truncate', function (t) {
  var name = gen()
  var file = DWREF(name)

  file.write(10, Buffer.from('hello'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    var file2 = DWREF(name, {truncate: true})
    file2.read(10, 5, function (err, buf) {
      t.ok(err, 'DWREF Tests Issue: dWeb File Should Be Truncated')
      t.end()
    })
  })
})

tape('DWREF Tests: Truncate With Size', function (t) {
  var file = DWREF(gen(), {size: 100, writable: true})

  file.stat(function (err, st) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    t.same(st.size, 100)
    file.destroy(() => t.end())
  })
})

tape('DWREF Tests: dWeb File Did Not Open', function (t) {
  var file = DWREF(tmp, {writable: true})

  file.open(function (err) {
    t.ok(err)
    file.close(() => t.end())
  })
})

tape('DWREF Tests: Bad dWeb File Truncate.', function (t) {
  var file = DWREF(gen(), {writable: true, size: -1, truncate: true})

  file.open(function (err) {
    t.ok(err)
    file.destroy(() => t.end())
  })
})

tape('DWREF Tests: mkdir Path', function (t) {
  var name = path.join(tmp, ++i + '-folder', 'test.txt')
  var file = DWREF(name)

  file.write(0, Buffer.from('hello'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.read(0, 5, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
      file.destroy()
    })
  })
})

tape('DWREF Tests: dWeb File Read/Write Big Chunks', function (t) {
  var file = DWREF(gen())
  var bigBuffer = Buffer.alloc(10 * 1024 * 1024)
  var missing = 2

  bigBuffer.fill('hey. hey. how are you doing?. i am good thanks how about you? i am good')

  file.write(0, bigBuffer, function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.read(0, bigBuffer.length, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })
  file.write(bigBuffer.length * 2, bigBuffer, function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.read(bigBuffer.length * 2, bigBuffer.length, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })

  function done () {
    if (!--missing) file.destroy(() => t.end())
  }
})

tape('DWREF Tests: rmdir Option', function (t) {
  var name = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var file = DWREF(name, {rmdir: true, directory: tmp})

  file.write(0, Buffer.from('hi'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    file.read(0, 2, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      file.destroy(onDestroy)
    })
  })

  function onDestroy (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    fs.stat(path.join(tmp, 'rmdir'), function (err) {
      t.same(err && err.code, 'ENOENT', 'DWREF Tests Error: Should Be Removed')
      t.end()
    })
  }
})

tape('DWREF Tests: rmdir Option Where Parent Is Not Empty', function (t) {
  var name = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var nonEmpty = path.join(tmp, name, '../..')
  var file = DWREF(name, {rmdir: true, directory: tmp})

  file.write(0, Buffer.from('hi'), function (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    fs.writeFileSync(path.join(nonEmpty, 'thing'), '')
    file.read(0, 2, function (err, buf) {
      t.error(err, 'DWREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      file.destroy(onDestroy)
    })
  })

  function onDestroy (err) {
    t.error(err, 'DWREF Tests: Success! No Errors.')
    fs.stat(path.join(tmp, 'rmdir'), function (err) {
      t.error(err, 'DWREF Tests Error: Should Not Be Removed!')
      fs.readdir(nonEmpty, function (err, list) {
        t.error(err, 'DWREF Tests: Success! No Errors.')
        t.same(list, ['thing'], 'DWREF Tests Error: There Should Only Be One Entry!')
        t.end()
      })
    })
  }
})

tape('DWREF Tests: Delete File', function (t) {
  var file = DWREF(gen())

  file.write(0, Buffer.alloc(100), function (err) {
    t.error(err, 'no error')
    file.stat(function (err, st) {
      t.error(err, 'no error')
      t.same(st.size, 100)
      file.del(0, 40, function (err) {
        t.error(err, 'no error')
        file.stat(function (err, st) {
          t.error(err, 'no error')
          t.same(st.size, 100, 'inplace del, same size')
          file.del(50, 50, function (err) {
            t.error(err, 'no error')
            file.stat(function (err, st) {
              t.error(err, 'no error')
              t.same(st.size, 50)
              file.destroy(() => t.end())
            })
          })
        })
      })
    })
  })
})

tape('DWREF Tests: Open/Close File Many Times', function (t) {
  var name = gen()
  var file = DWREF(name)
  var buf = Buffer.alloc(4)

  file.write(0, buf, function (err) {
    t.error(err, 'no error')
    loop(5000, function (err) {
      t.error(err, 'no error')
      file.destroy(() => t.end())
    })
  })

  function loop (n, cb) {
    var file = DWREF(name)
    file.read(0, 4, function (err, buffer) {
      if (err) return cb(err)
      if (!buf.equals(buffer)) {
        t.same(buffer, buf)
        return cb()
      }
      buf.writeUInt32BE(n)
      file.write(0, buf, function (err) {
        if (err) return cb(err)
        file.close(function (err) {
          if (!n || err) return cb(err)
          loop(n - 1, cb)
        })
      })
    })
  }
})

tape('DWREF Tests: Trigger Bad Open', function (t) {
  var file = DWREF(gen(), {writable: true})

  file.fd = -1
  file.open(function (err) {
    t.ok(err, 'should error trying to close old fd')
    file.open(function (err) {
      t.error(err, 'no error')
      file.destroy(() => t.end())
    })
  })
})

function gen () {
  return path.join(tmp, ++i + '.txt')
}
