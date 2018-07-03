var dwREF = require('./')
var tape = require('tape')
var os = require('os')
var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')

var tmp = path.join(os.tmpdir(), 'dwref-' + process.pid + '-' + Date.now())
var i = 0

mkdirp.sync(tmp)

tape('dwREF Tests: dWeb File Read/Write', function (t) {
  var dWebFile = dwREF(gen())

  dWebFile.dWebWrite(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebRead(0, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('dpack'))
      dWebFile.dWebKill(() => t.end())
    })
  })
})

tape('dwREF Tests: dWeb File Empty Read', function (t) {
  var dWebFile = dwREF(gen(), {writable: true})

  dWebFile.dWebRead(0, 0, function (err, buf) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    t.same(buf, Buffer.alloc(0), 'dwREF Tests Error: Empty Buffer')
    dWebFile.dWebKill(() => t.end())
  })
})

tape('dwREF Tests: Read Range > dWeb File', function (t) {
  var dWebFile = dwREF(gen())

  dWebFile.dWebRead(0, 5, function (err, buf) {
    t.ok(err, 'dwREF Tests Error: Not Perfect, Needs Work')
    dWebFile.dWebKill(() => t.end())
  })
})

tape('dwREF Tests: Read Range > dWeb File With Data', function (t) {
  var dWebFile = dwREF(gen())

  dWebFile.dWebWrite(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'dwREF Tests: Passed Without Error')
    dWebFile.dWebRead(0, 10, function (err, buf) {
      t.ok(err, 'dwREF Tests Error : Not Perfect, Needs Work')
      dWebFile.dWebKill(() => t.end())
    })
  })
})

tape('dwREF Tests: dWeb File Read/Write w/ Random Entry ', function (t) {
  var dWebFile = dwREF(gen())

  dWebFile.dWebWrite(10, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebWrite(0, Buffer.from('hello'), function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dWebFile.dWebRead(10, 2, function (err, buf) {
        t.error(err, 'dwREF Tests: Success! No Errors.')
        t.same(buf, Buffer.from('hi'))
        dWebFile.dWebRead(0, 5, function (err, buf) {
          t.error(err, 'dwREF Tests: Success! No Errors.')
          t.same(buf, Buffer.from('hello'))
          dWebFile.dWebRead(5, 5, function (err, buf) {
            t.error(err, 'dwREF Tests: Success! No Errors.')
            t.same(buf, Buffer.from([0, 0, 0, 0, 0]))
            t.end()
          })
        })
      })
    })
  })
})

tape('dwREF Tests: Re-open', function (t) {
  var dWebFileName = gen()
  var dWebFile = dwREF(dWebFileName)

  dWebFile.dWebWrite(10, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    var dWebFile2 = dwREF(dWebFileName)
    dWebFile2.dWebRead(10, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
    })
  })
})

tape('dwREF Tests: Re-Open and Truncate', function (t) {
  var dWebFileName = gen()
  var dWebFile = dwREF(dWebFileName)

  dWebFile.dWebWrite(10, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    var dWebFile2 = dwREF(dWebFileName, {truncate: true})
    dWebFile2.dWebRead(10, 5, function (err, buf) {
      t.ok(err, 'dwREF Tests Issue: dWeb File Should Be Truncated')
      t.end()
    })
  })
})

tape('dwREF Tests: Truncate With Size', function (t) {
  var dWebFile = dwREF(gen(), {size: 100, writable: true})

  dWebFile.dWebStat(function (err, st) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    t.same(st.size, 100)
    dWebFile.dWebKill(() => t.end())
  })
})

tape('dwREF Tests: dWeb File Did Not Open', function (t) {
  var dWebFile = dwREF(tmp, {writable: true})

  dWebFile.dWebOpen(function (err) {
    t.ok(err)
    dWebFile.dWebClose(() => t.end())
  })
})

tape('dwREF Tests: Bad dWeb File Truncate.', function (t) {
  var dWebFile = dwREF(gen(), {writable: true, size: -1, truncate: true})

  dWebFile.dWebOpen(function (err) {
    t.ok(err)
    dWebFile.dWebKill(() => t.end())
  })
})

tape('dwREF Tests: mkdir Path', function (t) {
  var dWebFileName = path.join(tmp, ++i + '-folder', 'test.txt')
  var dWebFile = dwREF(dWebFileName)

  dWebFile.dWebWrite(0, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebRead(0, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
      dWebFile.dWebKill()
    })
  })
})

tape('dwREF Tests: dWeb File Read/Write Big Chunks', function (t) {
  var dWebFile = dwREF(gen())
  var bigBuffer = Buffer.alloc(10 * 1024 * 1024)
  var missing = 2

  bigBuffer.fill('hey. hey. how are you doing?. i am good thanks how about you? i am good')

  dWebFile.dWebWrite(0, bigBuffer, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebRead(0, bigBuffer.length, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })
  dWebFile.dWebWrite(bigBuffer.length * 2, bigBuffer, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebRead(bigBuffer.length * 2, bigBuffer.length, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })

  function done () {
    if (!--missing) dWebFile.dWebKill(() => t.end())
  }
})

tape('dwREF Tests: rmdir Option', function (t) {
  var dWebFileName = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var dWebFile = dwREF(dWebFileName, {rmdir: true, dWebDirectory: tmp})

  dWebFile.dWebWrite(0, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebRead(0, 2, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      dWebFile.dWebKill(dWebOnDestroy)
    })
  })

  function dWebOnDestroy (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    fs.stat(path.join(tmp, 'rmdir'), function (err) {
      t.same(err && err.code, 'ENOENT', 'dwREF Tests Error: Should Be Removed')
      t.end()
    })
  }
})

tape('dwREF Tests: rmdir Option Where Parent Is Not Empty', function (t) {
  var dWebFileName = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var nonEmpty = path.join(tmp, dWebFileName, '../..')
  var dWebFile = dwREF(dWebFileName, {rmdir: true, dWebDirectory: tmp})

  dWebFile.dWebWrite(0, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    fs.writeFileSync(path.join(nonEmpty, 'thing'), '')
    dWebFile.dWebRead(0, 2, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      dWebFile.dWebKill(dWebOnDestroy)
    })
  })

  function dWebOnDestroy (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    fs.stat(path.join(tmp, 'rmdir'), function (err) {
      t.error(err, 'dwREF Tests Error: Should Not Be Removed!')
      fs.readdir(nonEmpty, function (err, list) {
        t.error(err, 'dwREF Tests: Success! No Errors.')
        t.same(list, ['thing'], 'dwREF Tests Error: There Should Only Be One Entry!')
        t.end()
      })
    })
  }
})

tape('dwREF Tests Error: dWeb Delete', function (t) {
  var dWebFile = dwREF(gen())

  dWebFile.dWebWrite(0, Buffer.alloc(100), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dWebFile.dWebStat(function (err, st) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(st.size, 100)
      dWebFile.dWebRemove(0, 40, function (err) {
        t.error(err, 'dwREF Tests: Success! No Errors.')
        dWebFile.dWebStat(function (err, st) {
          t.error(err, 'dwREF Tests: Success! No Errors.')
          t.same(st.size, 100, 'inplace del, same size')
          dWebFile.dWebRemove(50, 50, function (err) {
            t.error(err, 'dwREF Tests: Success! No Errors.')
            dWebFile.dWebStat(function (err, st) {
              t.error(err, 'dwREF Tests: Success! No Errors.')
              t.same(st.size, 50)
              dWebFile.dWebKill(() => t.end())
            })
          })
        })
      })
    })
  })
})

tape('dwREF Tests: Open and Close dWeb File Many Times.', function (t) {
  var dWebFileName = gen()
  var dWebFile = dwREF(dWebFileName)
  var buf = Buffer.alloc(4)

  dWebFile.dWebWrite(0, buf, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    loop(5000, function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dWebFile.dWebKill(() => t.end())
    })
  })

  function loop (n, cb) {
    var dWebFile = dwREF(dWebFileName)
    dWebFile.dWebRead(0, 4, function (err, buffer) {
      if (err) return cb(err)
      if (!buf.equals(buffer)) {
        t.same(buffer, buf)
        return cb()
      }
      buf.writeUInt32BE(n)
      dWebFile.dWebWrite(0, buf, function (err) {
        if (err) return cb(err)
        dWebFile.dWebClose(function (err) {
          if (!n || err) return cb(err)
          loop(n - 1, cb)
        })
      })
    })
  }
})

tape('dwREF Tests: dWeb File Open Error Trigger', function (t) {
  var dWebFile = dwREF(gen(), {writable: true})

  dWebFile.fd = -1
  dWebFile.dWebOpen(function (err) {
    t.ok(err, 'dwREF Tests Error: Errored Out Trying to Close Previous File Directory')
    dWebFile.dWebOpen(function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dWebFile.dWebKill(() => t.end())
    })
  })
})

function gen () {
  return path.join(tmp, ++i + '.txt')
}
