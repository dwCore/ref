var inherits = require('util').inherits
var DWRES = require('@dwcore/res')
var fs = require('fs')
var constants = require('fs-constants')
var mkdirp = require('mkdirp')
var path = require('path')

var DPACK_READONLY_PERMS = constants.O_RDONLY
var DPACK_READWRITE_PERMS = constants.O_RDWR | constants.O_CREAT

module.exports = DWRESFile

function DWRESFile (dWebFileName, opts) {
  if (!(this instanceof DWRESFile)) return new DWRESFile(dWebFileName, opts)
  DWRES.call(this)

  if (!opts) opts = {}
  if (opts.dWebDirectory) dWebFileName = path.join(opts.dWebDirectory, dWebFileName)

  this.dWebDirectory = opts.dWebDirectory || null
  this.dWebFileName = dWebFileName
  this.fd = 0

  if (opts.writable || opts.truncate) this.preferReadonly = false

  this._size = opts.size || opts.length || 0
  this._truncate = !!opts.truncate || this._size > 0
  this._rmdir = !!opts.rmdir
}

inherits(DWRESFile, DWRES)

DWRESFile.prototype._dWebOpen = function (req) {
  var self = this

  mkdirp(path.dirname(this.dWebFileName), onDPackDir)

  function onDPackDir (err) {
    if (err) return req.callback(err)
    dWebOpen(self, DPACK_READWRITE_PERMS, req)
  }
}

DWRESFile.prototype._dWebOpenReadOnly = function (req) {
  dWebOpen(this, DPACK_READONLY_PERMS, req)
}

DWRESFile.prototype._dWebWrite = function (req) {
  var data = req.data
  var fd = this.fd

  fs.write(fd, data, 0, req.size, req.offset, dWebOnWrite)

  function dWebOnWrite (err, wrote) {
    if (err) return req.callback(err)

    req.size -= wrote
    req.offset += wrote

    if (!req.size) return req.callback(null)
    fs.write(fd, data, data.length - req.size, req.size, req.offset, dWebOnWrite)
  }
}

DWRESFile.prototype._dWebRead = function (req) {
  var data = req.data || Buffer.allocUnsafe(req.size)
  var fd = this.fd

  if (!req.size) return process.nextTick(readEmpty, req)
  fs.read(fd, data, 0, req.size, req.offset, dWebOnRead)

  function dWebOnRead (err, dWebRead) {
    if (err) return req.callback(err)
    if (!dWebRead) return req.callback(new Error('Could not satisfy length'))

    req.size -= dWebRead
    req.offset += dWebRead

    if (!req.size) return req.callback(null, data)
    fs.read(fd, data, data.length - req.size, req.size, req.offset, dWebOnRead)
  }
}

DWRESFile.prototype._dWebRemove = function (req) {
  var fd = this.fd

  fs.fstat(fd, dWebOnStat)

  function dWebOnStat (err, st) {
    if (err) return req.callback(err)
    if (req.offset + req.size < st.size) return req.callback(null)
    fs.ftruncate(fd, req.offset, ontruncate)
  }

  function ontruncate (err) {
    req.callback(err)
  }
}

DWRESFile.prototype._dWebStat = function (req) {
  fs.fstat(this.fd, dWebOnStat)

  function dWebOnStat (err, st) {
    req.callback(err, st)
  }
}

DWRESFile.prototype._dWebClose = function (req) {
  var self = this

  fs.close(this.fd, dWebOnClose)

  function dWebOnClose (err) {
    if (err) return req.callback(err)
    self.fd = 0
    req.callback(null)
  }
}

DWRESFile.prototype._dWebKill = function (req) {
  var self = this

  var root = this.dWebDirectory && path.resolve(path.join(this.dWebDirectory, '.'))
  var dir = path.resolve(path.dirname(this.dWebFileName))

  fs.unlink(this.dWebFileName, dWebOnUnlink)

  function dWebOnUnlink (err) {
    if (!self._rmdir || !root || dir === root) return req.callback(err)
    fs.rmdir(dir, dWebOnRmDir)
  }

  function dWebOnRmDir (err) {
    dir = path.join(dir, '..')
    if (err || dir === root) return req.callback(null)
    fs.rmdir(dir, dWebOnRmDir)
  }
}

function dWebOpen (self, mode, req) {
  fs.open(self.dWebFileName, mode, dWebOnOpen)

  function dWebOnOpen (err, fd) {
    if (err) return req.callback(err)

    var old = self.fd
    self.fd = fd
    if (!old) return dWebOnCloseOldFD(null)

    // if we are moving from readonly -> readwrite, close the old fd
    fs.close(old, dWebOnCloseOldFD)
  }

  function dWebOnCloseOldFD (err) {
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
