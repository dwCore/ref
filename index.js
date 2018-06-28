var inherits = require('util').inherits
var DWRES = require('@dwcore/res')
var fs = require('fs')
var constants = require('fs-constants')
var mkdirp = require('mkdirp')
var path = require('path')

var DPACK_READONLY_PERMS = constants.O_RDONLY
var DPACK_READWRITE_PERMS = constants.O_RDWR | constants.O_CREAT

module.exports = DWRESFile

function DWRESFile (dPackFileName, opts) {
  if (!(this instanceof DWRESFile)) return new DWRESFile(dPackFileName, opts)
  DWRES.call(this)

  if (!opts) opts = {}
  if (opts.dPackDirectory) dPackFileName = path.join(opts.dPackDirectory, dPackFileName)

  this.dPackDirectory = opts.dPackDirectory || null
  this.dPackFileName = dPackFileName
  this.fd = 0

  if (opts.writable || opts.truncate) this.preferReadonly = false

  this._size = opts.size || opts.length || 0
  this._truncate = !!opts.truncate || this._size > 0
  this._rmdir = !!opts.rmdir
}

inherits(DWRESFile, DWRES)

DWRESFile.prototype._dPackOpen = function (req) {
  var self = this

  mkdirp(path.dirname(this.dPackFileName), onDPackDir)

  function onDPackDir (err) {
    if (err) return req.callback(err)
    dPackOpen(self, DPACK_READWRITE_PERMS, req)
  }
}

DWRESFile.prototype._dPackOpenReadOnly = function (req) {
  dPackOpen(this, DPACK_READONLY_PERMS, req)
}

DWRESFile.prototype._dPackWrite = function (req) {
  var data = req.data
  var fd = this.fd

  fs.write(fd, data, 0, req.size, req.offset, dPackOnWrite)

  function dPackOnWrite (err, wrote) {
    if (err) return req.callback(err)

    req.size -= wrote
    req.offset += wrote

    if (!req.size) return req.callback(null)
    fs.write(fd, data, data.length - req.size, req.size, req.offset, dPackOnWrite)
  }
}

DWRESFile.prototype._dPackRead = function (req) {
  var data = req.data || Buffer.allocUnsafe(req.size)
  var fd = this.fd

  if (!req.size) return process.nextTick(readEmpty, req)
  fs.read(fd, data, 0, req.size, req.offset, dPackOnRead)

  function dPackOnRead (err, dPackRead) {
    if (err) return req.callback(err)
    if (!dPackRead) return req.callback(new Error('Could not satisfy length'))

    req.size -= dPackRead
    req.offset += dPackRead

    if (!req.size) return req.callback(null, data)
    fs.read(fd, data, data.length - req.size, req.size, req.offset, dPackOnRead)
  }
}

DWRESFile.prototype._dPackRemove = function (req) {
  var fd = this.fd

  fs.fstat(fd, dPackOnStat)

  function dPackOnStat (err, st) {
    if (err) return req.callback(err)
    if (req.offset + req.size < st.size) return req.callback(null)
    fs.ftruncate(fd, req.offset, ontruncate)
  }

  function ontruncate (err) {
    req.callback(err)
  }
}

DWRESFile.prototype._dPackStat = function (req) {
  fs.fstat(this.fd, dPackOnStat)

  function dPackOnStat (err, st) {
    req.callback(err, st)
  }
}

DWRESFile.prototype._dPackClose = function (req) {
  var self = this

  fs.close(this.fd, dPackOnClose)

  function dPackOnClose (err) {
    if (err) return req.callback(err)
    self.fd = 0
    req.callback(null)
  }
}

DWRESFile.prototype._dPackKill = function (req) {
  var self = this

  var root = this.dPackDirectory && path.resolve(path.join(this.dPackDirectory, '.'))
  var dir = path.resolve(path.dirname(this.dPackFileName))

  fs.unlink(this.dPackFileName, dPackOnUnlink)

  function dPackOnUnlink (err) {
    if (!self._rmdir || !root || dir === root) return req.callback(err)
    fs.rmdir(dir, dPackOnRmDir)
  }

  function dPackOnRmDir (err) {
    dir = path.join(dir, '..')
    if (err || dir === root) return req.callback(null)
    fs.rmdir(dir, dPackOnRmDir)
  }
}

function dPackOpen (self, mode, req) {
  fs.open(self.dPackFileName, mode, dPackOnOpen)

  function dPackOnOpen (err, fd) {
    if (err) return req.callback(err)

    var old = self.fd
    self.fd = fd
    if (!old) return dPackOnCloseOldFD(null)

    // if we are moving from readonly -> readwrite, close the old fd
    fs.close(old, dPackOnCloseOldFD)
  }

  function dPackOnCloseOldFD (err) {
    if (err) return onerrorafteropen(err)
    if (!self._truncate || mode === DPACK_READONLY_PERMS) return req.callback(null)
    fs.ftruncate(self.fd, self._size, ontruncate)
  }

  function ontruncate (err) {
    if (err) return onerrorafteropen(err)
    req.callback(null)
  }

  function onerrorafteropen (err) {
    fs.close(self.fd, function () {
      self.fd = 0
      req.callback(err)
    })
  }
}

function readEmpty (req) {
  req.callback(null, Buffer.alloc(0))
}
