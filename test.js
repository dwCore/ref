var dwREF = require('./')
var tape = require('tape')
var os = require('os')
var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')

var tmp = path.join(os.tmpdir(), 'dwref-' + process.pid + '-' + Date.now())
var i = 0

mkdirp.sync(tmp)

tape('dwREF Tests: dPack File Read/Write', function (t) {
  var dPackFile = dwREF(gen())

  dPackFile.dPackWrite(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackRead(0, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('dpack'))
      dPackFile.dPackKill(() => t.end())
    })
  })
})

tape('dwREF Tests: dPack File Empty Read', function (t) {
  var dPackFile = dwREF(gen(), {writable: true})

  dPackFile.dPackRead(0, 0, function (err, buf) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    t.same(buf, Buffer.alloc(0), 'dwREF Tests Error: Empty Buffer')
    dPackFile.dPackKill(() => t.end())
  })
})

tape('dwREF Tests: Read Range > dPack File', function (t) {
  var dPackFile = dwREF(gen())

  dPackFile.dPackRead(0, 5, function (err, buf) {
    t.ok(err, 'dwREF Tests Error: Not Perfect, Needs Work')
    dPackFile.dPackKill(() => t.end())
  })
})

tape('dwREF Tests: Read Range > dPack File With Data', function (t) {
  var dPackFile = dwREF(gen())

  dPackFile.dPackWrite(0, Buffer.from('dpack'), function (err) {
    t.error(err, 'dwREF Tests: Passed Without Error')
    dPackFile.dPackRead(0, 10, function (err, buf) {
      t.ok(err, 'dwREF Tests Error : Not Perfect, Needs Work')
      dPackFile.dPackKill(() => t.end())
    })
  })
})

tape('dwREF Tests: dPack File Read/Write w/ Random Entry ', function (t) {
  var dPackFile = dwREF(gen())

  dPackFile.dPackWrite(10, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackWrite(0, Buffer.from('hello'), function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dPackFile.dPackRead(10, 2, function (err, buf) {
        t.error(err, 'dwREF Tests: Success! No Errors.')
        t.same(buf, Buffer.from('hi'))
        dPackFile.dPackRead(0, 5, function (err, buf) {
          t.error(err, 'dwREF Tests: Success! No Errors.')
          t.same(buf, Buffer.from('hello'))
          dPackFile.dPackRead(5, 5, function (err, buf) {
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
  var dPackFileName = gen()
  var dPackFile = dwREF(dPackFileName)

  dPackFile.dPackWrite(10, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    var dPackFile2 = dwREF(dPackFileName)
    dPackFile2.dPackRead(10, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
    })
  })
})

tape('dwREF Tests: Re-Open and Truncate', function (t) {
  var dPackFileName = gen()
  var dPackFile = dwREF(dPackFileName)

  dPackFile.dPackWrite(10, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    var dPackFile2 = dwREF(dPackFileName, {truncate: true})
    dPackFile2.dPackRead(10, 5, function (err, buf) {
      t.ok(err, 'dwREF Tests Issue: dPack File Should Be Truncated')
      t.end()
    })
  })
})

tape('dwREF Tests: Truncate With Size', function (t) {
  var dPackFile = dwREF(gen(), {size: 100, writable: true})

  dPackFile.dPackStat(function (err, st) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    t.same(st.size, 100)
    dPackFile.dPackKill(() => t.end())
  })
})

tape('dwREF Tests: dPack File Did Not Open', function (t) {
  var dPackFile = dwREF(tmp, {writable: true})

  dPackFile.dPackOpen(function (err) {
    t.ok(err)
    dPackFile.dPackClose(() => t.end())
  })
})

tape('dwREF Tests: Bad dPack File Truncate.', function (t) {
  var dPackFile = dwREF(gen(), {writable: true, size: -1, truncate: true})

  dPackFile.dPackOpen(function (err) {
    t.ok(err)
    dPackFile.dPackKill(() => t.end())
  })
})

tape('dwREF Tests: mkdir Path', function (t) {
  var dPackFileName = path.join(tmp, ++i + '-folder', 'test.txt')
  var dPackFile = dwREF(dPackFileName)

  dPackFile.dPackWrite(0, Buffer.from('hello'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackRead(0, 5, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hello'))
      t.end()
      dPackFile.dPackKill()
    })
  })
})

tape('dwREF Tests: dPack File Read/Write Big Chunks', function (t) {
  var dPackFile = dwREF(gen())
  var bigBuffer = Buffer.alloc(10 * 1024 * 1024)
  var missing = 2

  bigBuffer.fill('hey. hey. how are you doing?. i am good thanks how about you? i am good')

  dPackFile.dPackWrite(0, bigBuffer, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackRead(0, bigBuffer.length, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })
  dPackFile.dPackWrite(bigBuffer.length * 2, bigBuffer, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackRead(bigBuffer.length * 2, bigBuffer.length, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, bigBuffer)
      done()
    })
  })

  function done () {
    if (!--missing) dPackFile.dPackKill(() => t.end())
  }
})

tape('dwREF Tests: rmdir Option', function (t) {
  var dPackFileName = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var dPackFile = dwREF(dPackFileName, {rmdir: true, dPackDirectory: tmp})

  dPackFile.dPackWrite(0, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackRead(0, 2, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      dPackFile.dPackKill(dPackOnDestroy)
    })
  })

  function dPackOnDestroy (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    fs.stat(path.join(tmp, 'rmdir'), function (err) {
      t.same(err && err.code, 'ENOENT', 'dwREF Tests Error: Should Be Removed')
      t.end()
    })
  }
})

tape('dwREF Tests: rmdir Option Where Parent Is Not Empty', function (t) {
  var dPackFileName = path.join('rmdir', ++i + '', 'folder', 'test.txt')
  var nonEmpty = path.join(tmp, dPackFileName, '../..')
  var dPackFile = dwREF(dPackFileName, {rmdir: true, dPackDirectory: tmp})

  dPackFile.dPackWrite(0, Buffer.from('hi'), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    fs.writeFileSync(path.join(nonEmpty, 'thing'), '')
    dPackFile.dPackRead(0, 2, function (err, buf) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(buf, Buffer.from('hi'))
      dPackFile.dPackKill(dPackOnDestroy)
    })
  })

  function dPackOnDestroy (err) {
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

tape('dwREF Tests Error: dPack Delete', function (t) {
  var dPackFile = dwREF(gen())

  dPackFile.dPackWrite(0, Buffer.alloc(100), function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    dPackFile.dPackStat(function (err, st) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      t.same(st.size, 100)
      dPackFile.dPackRemove(0, 40, function (err) {
        t.error(err, 'dwREF Tests: Success! No Errors.')
        dPackFile.dPackStat(function (err, st) {
          t.error(err, 'dwREF Tests: Success! No Errors.')
          t.same(st.size, 100, 'inplace del, same size')
          dPackFile.dPackRemove(50, 50, function (err) {
            t.error(err, 'dwREF Tests: Success! No Errors.')
            dPackFile.dPackStat(function (err, st) {
              t.error(err, 'dwREF Tests: Success! No Errors.')
              t.same(st.size, 50)
              dPackFile.dPackKill(() => t.end())
            })
          })
        })
      })
    })
  })
})

tape('dwREF Tests: Open and Close dPack File Many Times.', function (t) {
  var dPackFileName = gen()
  var dPackFile = dwREF(dPackFileName)
  var buf = Buffer.alloc(4)

  dPackFile.dPackWrite(0, buf, function (err) {
    t.error(err, 'dwREF Tests: Success! No Errors.')
    loop(5000, function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dPackFile.dPackKill(() => t.end())
    })
  })

  function loop (n, cb) {
    var dPackFile = dwREF(dPackFileName)
    dPackFile.dPackRead(0, 4, function (err, buffer) {
      if (err) return cb(err)
      if (!buf.equals(buffer)) {
        t.same(buffer, buf)
        return cb()
      }
      buf.writeUInt32BE(n)
      dPackFile.dPackWrite(0, buf, function (err) {
        if (err) return cb(err)
        dPackFile.dPackClose(function (err) {
          if (!n || err) return cb(err)
          loop(n - 1, cb)
        })
      })
    })
  }
})

tape('dwREF Tests: dPack File Open Error Trigger', function (t) {
  var dPackFile = dwREF(gen(), {writable: true})

  dPackFile.fd = -1
  dPackFile.dPackOpen(function (err) {
    t.ok(err, 'dwREF Tests Error: Errored Out Trying to Close Previous File Directory')
    dPackFile.dPackOpen(function (err) {
      t.error(err, 'dwREF Tests: Success! No Errors.')
      dPackFile.dPackKill(() => t.end())
    })
  })
})

function gen () {
  return path.join(tmp, ++i + '.txt')
}
