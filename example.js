var dwREF = require('./')
var alloc = require('buffer-alloc-unsafe')

var dPackFile = dwREF('dpack.json', {length: 0})

var buf = alloc(1024)
buf.fill('lo')
dPackWrite()

function write () {
  if (dPackFile.length >= 5 * 1024 * 1024) return done()
  dPackFile.dPackWrite(dPackFile.length, buf, dPackWrite)
}

function done () {
  console.log('Successfuly wrote to dpack.json File.')
}
