(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xapiValidator = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || arguments.callee;
  if (ssf && Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":2,"ieee754":37,"isarray":38}],4:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":5}],5:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = []
  , exports = module.exports = {};

/*!
 * Chai version
 */

exports.version = '3.5.0';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }

  return this;
};

/*!
 * Utility Functions
 */

exports.util = util;

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":6,"./chai/config":7,"./chai/core/assertions":8,"./chai/interface/assert":9,"./chai/interface/expect":10,"./chai/interface/should":11,"./chai/utils":25,"assertion-error":1}],6:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * @api private
   */

  function Assertion (obj, msg, stack) {
    flag(this, 'ssfi', stack || arguments.callee);
    flag(this, 'object', obj);
    flag(this, 'message', msg);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (true !== showDiff) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      var msg = util.getMessage(this, arguments)
        , actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":7}],7:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

   includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40

};

},{}],8:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to
   * improve the readability of your assertions. They
   * do not provide testing capabilities unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'which', 'at'
  , 'of', 'same' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });

  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * `.deep.property` special characters can be escaped
   * by adding two slashes before the `.` or `[]`.
   *
   *     var deepCss = { '.link': { '[target]': 42 }};
   *     expect(deepCss).to.have.deep.property('\\.link.\\[target\\]', 42);
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .any
   *
   * Sets the `any` flag, (opposite of the `all` flag)
   * later used in the `keys` assertion.
   *
   *     expect(foo).to.have.any.keys('bar', 'baz');
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false)
  });


  /**
   * ### .all
   *
   * Sets the `all` flag (opposite of the `any` flag)
   * later used by the `keys` assertion.
   *
   *     expect(foo).to.have.all.keys('bar', 'baz');
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type.
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(new Promise).to.be.a('promise');
   *     expect(new Float32Array()).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   *     // es6 overrides
   *     expect({[Symbol.toStringTag]:()=>'foo'}).to.be.a('foo');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contains` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    _.expectTypes(this, ['array', 'object', 'string']);

    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var expected = false;

    if (_.type(obj) === 'array' && _.type(val) === 'object') {
      for (var i in obj) {
        if (_.eql(obj[i], val)) {
          expected = true;
          break;
        }
      }
    } else if (_.type(val) === 'object') {
      if (!flag(this, 'negate')) {
        for (var k in val) new Assertion(obj).property(k, val[k]);
        return;
      }
      var subset = {};
      for (var k in val) subset[k] = obj[k];
      expected = _.eql(subset, val);
    } else {
      expected = (obj != undefined) && ~obj.indexOf(val);
    }
    this.assert(
        expected
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everything').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).to.not.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *     expect(null).to.not.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   * Asserts that the target is `NaN`.
   *
   *     expect('foo').to.be.NaN;
   *     expect(4).not.to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * @name exist
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });


  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays and strings, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;

    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }

    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be at most ' + n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(value)
   *
   * Asserts that the target is greater than or equal to `value`.
   *
   *     expect(10).to.be.at.least(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.least(2);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);
   *
   * @name least
   * @alias gte
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be at least ' + n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(value)
   *
   * Asserts that the target is less than or equal to `value`.
   *
   *     expect(5).to.be.at.most(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.most(4);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);
   *
   * @name most
   * @alias lte
   * @param {Number} value
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };
   *
   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * Note that dots and bracket in `name` must be backslash-escaped when
   * the `deep` flag is set, while they must NOT be escaped when the `deep`
   * flag is not set.
   *
   *     // simple referencing
   *     var css = { '.link[target]': 42 };
   *     expect(css).to.have.property('.link[target]', 42);
   *
   *     // deep referencing
   *     var deepCss = { '.link': { '[target]': 42 }};
   *     expect(deepCss).to.have.deep.property('\\.link.\\[target\\]', 42);
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isDeep = !!flag(this, 'deep')
      , descriptor = isDeep ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , pathInfo = isDeep ? _.getPathInfo(name, obj) : null
      , hasProperty = isDeep
        ? pathInfo.exists
        : _.hasProperty(name, obj)
      , value = isDeep
        ? pathInfo.value
        : obj[name];

    if (negate && arguments.length > 1) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          hasProperty
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  });


  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, message]])
   *
   * Asserts that the target has an own property descriptor `name`, that optionally matches `descriptor`.
   *
   *     expect('test').to.have.ownPropertyDescriptor('length');
   *     expect('test').to.have.ownPropertyDescriptor('length', { enumerable: false, configurable: false, writable: false, value: 4 });
   *     expect('test').not.to.have.ownPropertyDescriptor('length', { enumerable: false, configurable: false, writable: false, value: 3 });
   *     expect('test').ownPropertyDescriptor('length').to.have.property('enumerable', false);
   *     expect('test').ownPropertyDescriptor('length').to.have.keys('value');
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .length
   *
   * Sets the `doLength` flag later used as a chain precursor to a value
   * comparison for the `length` property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * *Deprecation notice:* Using `length` as an assertion will be deprecated
   * in version 2.4.0 and removed in 3.0.0. Code using the old style of
   * asserting for `length` property value using `length(value)` should be
   * switched to use `lengthOf(value)` instead.
   *
   * @name length
   * @namespace BDD
   * @api public
   */

  /**
   * ### .lengthOf(value[, message])
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.lengthOf(3);
   *     expect('foobar').to.have.lengthOf(6);
   *
   * @name lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength);

  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @alias matches
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });


  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target contains any or all of the passed-in keys.
   * Use in combination with `any`, `all`, `contains`, or `have` will affect
   * what will pass.
   *
   * When used in conjunction with `any`, at least one key that is passed
   * in must exist in the target object. This is regardless whether or not
   * the `have` or `contain` qualifiers are used. Note, either `any` or `all`
   * should be used in the assertion. If neither are used, the assertion is
   * defaulted to `all`.
   *
   * When both `all` and `contain` are used, the target object must have at
   * least all of the passed-in keys but may have more keys not listed.
   *
   * When both `all` and `have` are used, the target object must both contain
   * all of the passed-in keys AND the number of keys in the target object must
   * match the number of keys passed in (in other words, a target object must
   * have all and only all of the passed-in keys).
   *
   *     expect({ foo: 1, bar: 2 }).to.have.any.keys('foo', 'baz');
   *     expect({ foo: 1, bar: 2 }).to.have.any.keys('foo');
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys('bar', 'baz');
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys(['foo']);
   *     expect({ foo: 1, bar: 2 }).to.contain.any.keys({'foo': 6});
   *     expect({ foo: 1, bar: 2 }).to.have.all.keys(['bar', 'foo']);
   *     expect({ foo: 1, bar: 2 }).to.have.all.keys({'bar': 6, 'foo': 7});
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.all.keys(['bar', 'foo']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.all.keys({'bar': 6});
   *
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true
      , mixedArgsMsg = 'keys must be given single argument of Array|Object|String, or multiple String arguments';

    switch (_.type(keys)) {
      case "array":
        if (arguments.length > 1) throw (new Error(mixedArgsMsg));
        break;
      case "object":
        if (arguments.length > 1) throw (new Error(mixedArgsMsg));
        keys = Object.keys(keys);
        break;
      default:
        keys = Array.prototype.slice.call(arguments);
    }

    if (!keys.length) throw new Error('keys required');

    var actual = Object.keys(obj)
      , expected = keys
      , len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all');

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      var intersection = expected.filter(function(key) {
        return ~actual.indexOf(key);
      });
      ok = intersection.length > 0;
    }

    // Has all
    if (all) {
      ok = keys.every(function(key){
        return ~actual.indexOf(key);
      });
      if (!flag(this, 'negate') && !flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
      , expected.slice(0).sort()
      , actual.sort()
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');

    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;

    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = constructor.prototype.name;
      if (!name || (name === 'Error' && constructor !== Error)) {
        name = constructor.name || (new constructor()).name;
      }
    } else {
      constructor = null;
    }

    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp}'
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)
          , (err instanceof Error ? err.toString() : err)
        );

        flag(this, 'object', err);
        return this;
      }

      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'
          , name
          , (err instanceof Error ? err.toString() : err)
        );

        if (!errMsg) {
          flag(this, 'object', err);
          return this;
        }
      }

      // next, check message
      var message = 'error' === _.type(err) && "message" in err
        ? err.message
        : '' + err;

      if ((message != null) && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(message)
          , 'expected #{this} to throw error matching #{exp} but got #{act}'
          , 'expected #{this} to throw error not matching #{exp}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }

    var actuallyGot = ''
      , expectedThrown = name !== null
        ? name
        : desiredError
          ? '#{exp}' //_.inspect(desiredError)
          : 'an error';

    if (thrown) {
      actuallyGot = ' but #{act} was thrown'
    }

    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)
    );

    flag(this, 'object', thrownError);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *     Klass.baz = function(){};
   *     expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === _.type(obj) && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *     function Foo() {}
   *     Foo.bar = function() {}
   *     Foo.prototype.baz = function() {}
   *
   *     expect(Foo).itself.to.respondTo('bar');
   *     expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , this.negate ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj, msg).is.a('number');
    if (_.type(expected) !== 'number' || _.type(delta) !== 'number') {
      throw new Error('the arguments to closeTo or approximately must be numbers');
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  function isSubsetOf(subset, superset, cmp) {
    return subset.every(function(elem) {
      if (!cmp) return superset.indexOf(elem) !== -1;

      return superset.some(function(elem2) {
        return cmp(elem, elem2);
      });
    })
  }

  /**
   * ### .members(set)
   *
   * Asserts that the target is a superset of `set`,
   * or that the target and `set` have the same strictly-equal (===) members.
   * Alternately, if the `deep` flag is set, set members are compared for deep
   * equality.
   *
   *     expect([1, 2, 3]).to.include.members([3, 2]);
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);
   *
   *     expect([4, 2]).to.have.members([2, 4]);
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);
   *
   *     expect([{ id: 1 }]).to.deep.include.members([{ id: 1 }]);
   *
   * @name members
   * @param {Array} set
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj).to.be.an('array');
    new Assertion(subset).to.be.an('array');

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    if (flag(this, 'contains')) {
      return this.assert(
          isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to be a superset of #{act}'
        , 'expected #{this} to not be a superset of #{act}'
        , obj
        , subset
      );
    }

    this.assert(
        isSubsetOf(obj, subset, cmp) && isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to have the same members as #{act}'
        , 'expected #{this} to not have the same members as #{act}'
        , obj
        , subset
    );
  });

  /**
   * ### .oneOf(list)
   *
   * Assert that a value appears somewhere in the top level of array `list`.
   *
   *     expect('a').to.be.oneOf(['a', 'b', 'c']);
   *     expect(9).to.not.be.oneOf(['z']);
   *     expect([3]).to.not.be.oneOf([1, 2, [3]]);
   *
   *     var three = [3];
   *     // for object-types, contents are not compared
   *     expect(three).to.not.be.oneOf([1, 2, [3]]);
   *     // comparing references works
   *     expect(three).to.be.oneOf([1, 2, three]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object');
    new Assertion(list).to.be.an('array');

    this.assert(
        list.indexOf(expected) > -1
      , 'expected #{this} to be one of #{exp}'
      , 'expected #{this} to not be one of #{exp}'
      , list
      , expected
    );
  }

  Assertion.addMethod('oneOf', oneOf);


  /**
   * ### .change(function)
   *
   * Asserts that a function changes an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 3 };
   *     var noChangeFn = function() { return 'foo' + 'bar'; }
   *     expect(fn).to.change(obj, 'val');
   *     expect(noChangeFn).to.not.change(obj, 'val')
   *
   * @name change
   * @alias changes
   * @alias Change
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      initial !== object[prop]
      , 'expected .' + prop + ' to change'
      , 'expected .' + prop + ' to not change'
    );
  }

  Assertion.addChainableMethod('change', assertChanges);
  Assertion.addChainableMethod('changes', assertChanges);

  /**
   * ### .increase(function)
   *
   * Asserts that a function increases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     expect(fn).to.increase(obj, 'val');
   *
   * @name increase
   * @alias increases
   * @alias Increase
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      object[prop] - initial > 0
      , 'expected .' + prop + ' to increase'
      , 'expected .' + prop + ' to not increase'
    );
  }

  Assertion.addChainableMethod('increase', assertIncreases);
  Assertion.addChainableMethod('increases', assertIncreases);

  /**
   * ### .decrease(function)
   *
   * Asserts that a function decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     expect(fn).to.decrease(obj, 'val');
   *
   * @name decrease
   * @alias decreases
   * @alias Decrease
   * @param {String} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (object, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object');
    new Assertion(object, msg).to.have.property(prop);
    new Assertion(fn).is.a('function');

    var initial = object[prop];
    fn();

    this.assert(
      object[prop] - initial < 0
      , 'expected .' + prop + ' to decrease'
      , 'expected .' + prop + ' to not decrease'
    );
  }

  Assertion.addChainableMethod('decrease', assertDecreases);
  Assertion.addChainableMethod('decreases', assertDecreases);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible (can have new properties added to
   * it).
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect({}).to.be.extensible;
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isExtensible;

    try {
      isExtensible = Object.isExtensible(obj);
    } catch (err) {
      if (err instanceof TypeError) isExtensible = false;
      else throw err;
    }

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect({}).to.not.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isSealed;

    try {
      isSealed = Object.isSealed(obj);
    } catch (err) {
      if (err instanceof TypeError) isSealed = true;
      else throw err;
    }

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect({}).to.not.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is not an object (a primitive), then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior when a TypeError is thrown under ES5.

    var isFrozen;

    try {
      isFrozen = Object.isFrozen(obj);
    } catch (err) {
      if (err instanceof TypeError) isFrozen = true;
      else throw err;
    }

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });
};

},{}],9:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isOk = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotOk = function (val, msg) {
    new Assertion(val, msg).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAbove = function (val, abv, msg) {
    new Assertion(val, msg).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBelow = function (val, blw, msg) {
    new Assertion(val, msg).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotTrue = function (val, msg) {
    new Assertion(val, msg).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFalse = function (val, msg) {
    new Assertion(val, msg).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };

  /**
   * ### .isNaN
   * Asserts that value is NaN
   *
   *    assert.isNaN('foo', 'foo is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNaN = function (val, msg) {
    new Assertion(val, msg).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   * Asserts that value is not NaN
   *
   *    assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert.isNotNaN = function (val, msg) {
    new Assertion(val, msg).not.to.be.NaN;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Works
   * for strings and arrays.
   *
   *     assert.notInclude('foobar', 'baz', 'string not include substring');
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude).not.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };

  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };

  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };

  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };

  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };

  /**
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throws(fn, 'function throws a reference error');
   *     assert.throws(fn, /function throws a reference error/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, ReferenceError, 'function throws a reference error');
   *     assert.throws(fn, ReferenceError, /function throws a reference error/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.throws = function (fn, errt, errs, msg) {
    if ('string' === typeof errt || errt instanceof RegExp) {
      errs = errt;
      errt = null;
    }

    var assertErr = new Assertion(fn, msg).to.throw(errt, errs);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }

    new Assertion(fn, msg).to.not.Throw(type);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(ok, msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members.
   * Order is not taken into account.
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.members(set2);
  }

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members - using a deep equality checking.
   * Order is not taken into account.
   *
   *     assert.sameDeepMembers([ {b: 3}, {a: 2}, {c: 5} ], [ {c: 5}, {b: 3}, {a: 2} ], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.deep.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset`.
   * Order is not taken into account.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.members(subset);
  }

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` - using deep equality checking.
   * Order is not taken into account.
   * Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ {a: 1}, {b: 2}, {c: 3} ], [ {b: 2}, {a: 1}, {b: 2} ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.deep.members(subset);
  }

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg).to.be.oneOf(list);
  }

   /**
   * ### .changes(function, object, property)
   *
   * Asserts that a function changes the value of a property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changes = function (fn, obj, prop) {
    new Assertion(fn).to.change(obj, prop);
  }

   /**
   * ### .doesNotChange(function, object, property)
   *
   * Asserts that a function does not changes the value of a property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotChange = function (fn, obj, prop) {
    new Assertion(fn).to.not.change(obj, prop);
  }

   /**
   * ### .increases(function, object, property)
   *
   * Asserts that a function increases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increases = function (fn, obj, prop) {
    new Assertion(fn).to.increase(obj, prop);
  }

   /**
   * ### .doesNotIncrease(function, object, property)
   *
   * Asserts that a function does not increase object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotIncrease = function (fn, obj, prop) {
    new Assertion(fn).to.not.increase(obj, prop);
  }

   /**
   * ### .decreases(function, object, property)
   *
   * Asserts that a function decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreases = function (fn, obj, prop) {
    new Assertion(fn).to.decrease(obj, prop);
  }

   /**
   * ### .doesNotDecrease(function, object, property)
   *
   * Asserts that a function does not decreases an object property
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object
   * @param {String} property name
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecrease = function (fn, obj, prop) {
    new Assertion(fn).to.not.decrease(obj, prop);
  }

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isExtensible = function (obj, msg) {
    new Assertion(obj, msg).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freese({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isSealed = function (obj, msg) {
    new Assertion(obj, msg).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isFrozen = function (obj, msg) {
    new Assertion(obj, msg).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg).to.not.be.frozen;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen');
};

},{}],10:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Expect
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};

},{}],11:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String || this instanceof Number || this instanceof Boolean ) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace Should
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],12:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var transferFlags = require('./transferFlags');
var flag = require('./flag');
var config = require('../config');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function () {
        chainableBehavior.chainingBehavior.call(this);

        var assert = function assert() {
          var old_ssfi = flag(this, 'ssfi');
          if (old_ssfi && config.includeStack === false)
            flag(this, 'ssfi', assert);
          var result = chainableBehavior.method.apply(this, arguments);
          return result === undefined ? this : result;
        };

        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = assert.__proto__ = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (!excludeNames.test(asserterName)) {
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
              Object.defineProperty(assert, asserterName, pd);
            }
          });
        }

        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};

},{"../config":7,"./flag":16,"./transferFlags":32}],13:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');

/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */
var flag = require('./flag');

module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var old_ssfi = flag(this, 'ssfi');
    if (old_ssfi && config.includeStack === false)
      flag(this, 'ssfi', ctx[name]);
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{"../config":7,"./flag":16}],14:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');
var flag = require('./flag');

/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function addProperty() {
        var old_ssfi = flag(this, 'ssfi');
        if (old_ssfi && config.includeStack === false)
          flag(this, 'ssfi', addProperty);

        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{"../config":7,"./flag":16}],15:[function(require,module,exports){
/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */

var AssertionError = require('assertion-error');
var flag = require('./flag');
var type = require('type-detect');

module.exports = function (obj, types) {
  var obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lirum, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  if (!types.some(function (expected) { return type(obj) === expected; })) {
    throw new AssertionError(
      'object tested must be ' + str + ', but ' + type(obj) + ' given'
    );
  }
};

},{"./flag":16,"assertion-error":1,"type-detect":39}],16:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],17:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

module.exports = function (obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],18:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],19:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":16,"./getActual":17,"./inspect":26,"./objDisplay":27}],20:[function(require,module,exports){
/*!
 * Chai - getName utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 * @namespace Utils
 * @name getName
 */

module.exports = function (func) {
  if (func.name) return func.name;

  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};

},{}],21:[function(require,module,exports){
/*!
 * Chai - getPathInfo utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var hasProperty = require('./hasProperty');

/**
 * ### .getPathInfo(path, object)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

module.exports = function getPathInfo(path, obj) {
  var parsed = parsePath(path),
      last = parsed[parsed.length - 1];

  var info = {
    parent: parsed.length > 1 ? _getPathValue(parsed, obj, parsed.length - 1) : obj,
    name: last.p || last.i,
    value: _getPathValue(parsed, obj)
  };
  info.exists = hasProperty(info.name, info.parent);

  return info;
};


/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath (path) {
  var str = path.replace(/([^\\])\[/g, '$1.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /^\[(\d+)\]$/
      , mArr = re.exec(value);
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value.replace(/\\([.\[\]])/g, '$1') };
  });
}


/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @param {Number} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */

function _getPathValue (parsed, obj, index) {
  var tmp = obj
    , res;

  index = (index === undefined ? parsed.length : index);

  for (var i = 0, l = index; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
}

},{"./hasProperty":24}],22:[function(require,module,exports){
/*!
 * Chai - getPathValue utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

var getPathInfo = require('./getPathInfo');

/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */
module.exports = function(path, obj) {
  var info = getPathInfo(path, obj);
  return info.value;
};

},{"./getPathInfo":21}],23:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],24:[function(require,module,exports){
/*!
 * Chai - hasProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var type = require('type-detect');

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has
 * named property or numeric array index.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with natives
 * and null/undefined values.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty('str', obj);  // true
 *     hasProperty('constructor', obj);  // true
 *     hasProperty('bar', obj);  // false
 *
 *     hasProperty('length', obj.str); // true
 *     hasProperty(1, obj.str);  // true
 *     hasProperty(5, obj.str);  // false
 *
 *     hasProperty('length', obj.arr);  // true
 *     hasProperty(2, obj.arr);  // true
 *     hasProperty(3, obj.arr);  // false
 *
 * @param {Objuect} object
 * @param {String|Number} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

var literals = {
    'number': Number
  , 'string': String
};

module.exports = function hasProperty(name, obj) {
  var ot = type(obj);

  // Bad Object, obviously no props at all
  if(ot === 'null' || ot === 'undefined')
    return false;

  // The `in` operator does not work with certain literals
  // box these before the check
  if(literals[ot] && typeof obj !== 'object')
    obj = new literals[ot](obj);

  return name in obj;
};

},{"type-detect":39}],25:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Main exports
 */

var exports = module.exports = {};

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('type-detect');

/*!
 * expectTypes utility
 */
exports.expectTypes = require('./expectTypes');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path value
 */

exports.getPathValue = require('./getPathValue');

/*!
 * Deep path info
 */

exports.getPathInfo = require('./getPathInfo');

/*!
 * Check if a property exists
 */

exports.hasProperty = require('./hasProperty');

/*!
 * Function name
 */

exports.getName = require('./getName');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');

},{"./addChainableMethod":12,"./addMethod":13,"./addProperty":14,"./expectTypes":15,"./flag":16,"./getActual":17,"./getMessage":19,"./getName":20,"./getPathInfo":21,"./getPathValue":22,"./hasProperty":24,"./inspect":26,"./objDisplay":27,"./overwriteChainableMethod":28,"./overwriteMethod":29,"./overwriteProperty":30,"./test":31,"./transferFlags":32,"deep-eql":33,"type-detect":39}],26:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('./getName');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"./getEnumerableProperties":18,"./getName":20,"./getProperties":23}],27:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":7,"./inspect":26}],28:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'length',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.length(3);
 *     expect(myFoo).to.have.length.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function () {
    var result = chainingBehavior(_chainingBehavior).call(this);
    return result === undefined ? this : result;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function () {
    var result = method(_method).apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{}],29:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };

  if (_method && 'function' === typeof _method)
    _super = _method;

  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};

},{}],30:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],31:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":16}],32:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],33:[function(require,module,exports){
module.exports = require('./lib/eql');

},{"./lib/eql":34}],34:[function(require,module,exports){
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var type = require('type-detect');

/*!
 * Buffer.isBuffer browser shim
 */

var Buffer;
try { Buffer = require('buffer').Buffer; }
catch(ex) {
  Buffer = {};
  Buffer.isBuffer = function() { return false; }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;

/**
 * Assert super-strict (egal) equality between
 * two objects of any type.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Array} memoised (optional)
 * @return {Boolean} equal match
 */

function deepEqual(a, b, m) {
  if (sameValue(a, b)) {
    return true;
  } else if ('date' === type(a)) {
    return dateEqual(a, b);
  } else if ('regexp' === type(a)) {
    return regexpEqual(a, b);
  } else if (Buffer.isBuffer(a)) {
    return bufferEqual(a, b);
  } else if ('arguments' === type(a)) {
    return argumentsEqual(a, b, m);
  } else if (!typeEqual(a, b)) {
    return false;
  } else if (('object' !== type(a) && 'object' !== type(b))
  && ('array' !== type(a) && 'array' !== type(b))) {
    return sameValue(a, b);
  } else {
    return objectEqual(a, b, m);
  }
}

/*!
 * Strict (egal) equality test. Ensures that NaN always
 * equals NaN and `-0` does not equal `+0`.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} equal match
 */

function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

/*!
 * Compare the types of two given objects and
 * return if they are equal. Note that an Array
 * has a type of `array` (not `object`) and arguments
 * have a type of `arguments` (not `array`/`object`).
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function typeEqual(a, b) {
  return type(a) === type(b);
}

/*!
 * Compare two Date objects by asserting that
 * the time values are equal using `saveValue`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {Boolean} result
 */

function dateEqual(a, b) {
  if ('date' !== type(b)) return false;
  return sameValue(a.getTime(), b.getTime());
}

/*!
 * Compare two regular expressions by converting them
 * to string and checking for `sameValue`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean} result
 */

function regexpEqual(a, b) {
  if ('regexp' !== type(b)) return false;
  return sameValue(a.toString(), b.toString());
}

/*!
 * Assert deep equality of two `arguments` objects.
 * Unfortunately, these must be sliced to arrays
 * prior to test to ensure no bad behavior.
 *
 * @param {Arguments} a
 * @param {Arguments} b
 * @param {Array} memoize (optional)
 * @return {Boolean} result
 */

function argumentsEqual(a, b, m) {
  if ('arguments' !== type(b)) return false;
  a = [].slice.call(a);
  b = [].slice.call(b);
  return deepEqual(a, b, m);
}

/*!
 * Get enumerable properties of a given object.
 *
 * @param {Object} a
 * @return {Array} property names
 */

function enumerable(a) {
  var res = [];
  for (var key in a) res.push(key);
  return res;
}

/*!
 * Simple equality for flat iterable objects
 * such as Arrays or Node.js buffers.
 *
 * @param {Iterable} a
 * @param {Iterable} b
 * @return {Boolean} result
 */

function iterableEqual(a, b) {
  if (a.length !==  b.length) return false;

  var i = 0;
  var match = true;

  for (; i < a.length; i++) {
    if (a[i] !== b[i]) {
      match = false;
      break;
    }
  }

  return match;
}

/*!
 * Extension to `iterableEqual` specifically
 * for Node.js Buffers.
 *
 * @param {Buffer} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(b)) return false;
  return iterableEqual(a, b);
}

/*!
 * Block for `objectEqual` ensuring non-existing
 * values don't get in.
 *
 * @param {Mixed} object
 * @return {Boolean} result
 */

function isValue(a) {
  return a !== null && a !== undefined;
}

/*!
 * Recursively check the equality of two objects.
 * Once basic sameness has been established it will
 * defer to `deepEqual` for each enumerable key
 * in the object.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function objectEqual(a, b, m) {
  if (!isValue(a) || !isValue(b)) {
    return false;
  }

  if (a.prototype !== b.prototype) {
    return false;
  }

  var i;
  if (m) {
    for (i = 0; i < m.length; i++) {
      if ((m[i][0] === a && m[i][1] === b)
      ||  (m[i][0] === b && m[i][1] === a)) {
        return true;
      }
    }
  } else {
    m = [];
  }

  try {
    var ka = enumerable(a);
    var kb = enumerable(b);
  } catch (ex) {
    return false;
  }

  ka.sort();
  kb.sort();

  if (!iterableEqual(ka, kb)) {
    return false;
  }

  m.push([ a, b ]);

  var key;
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], m)) {
      return false;
    }
  }

  return true;
}

},{"buffer":3,"type-detect":35}],35:[function(require,module,exports){
module.exports = require('./lib/type');

},{"./lib/type":36}],36:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Array]': 'array'
  , '[object RegExp]': 'regexp'
  , '[object Function]': 'function'
  , '[object Arguments]': 'arguments'
  , '[object Date]': 'date'
};

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */

function getType (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library () {
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function (type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function (obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],37:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],38:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],39:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"./lib/type":40,"dup":35}],40:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
var objectTypeRegexp = /^\[object (.*)\]$/;

function getType(obj) {
  var type = Object.prototype.toString.call(obj).match(objectTypeRegexp)[1].toLowerCase();
  // Let "new String('')" return 'object'
  if (typeof Promise === 'function' && obj instanceof Promise) return 'promise';
  // PhantomJS has type "DOMWindow" for null
  if (obj === null) return 'null';
  // PhantomJS has type "DOMWindow" for undefined
  if (obj === undefined) return 'undefined';
  return type;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library() {
  if (!(this instanceof Library)) return new Library();
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function(type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function(obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],41:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var xapiErrorLevels = Object.freeze({
  MAY_VIOLATION: 'MAY_VIOLATION',
  MUST_VIOLATION: 'MUST_VIOLATION',
  SHOULD_VIOLATION: 'SHOULD_VIOLATION'
});

var xapiValidationErrors = Object.freeze({
  ACTIVITIES_MUST_NOT_BE_NULL_MAP_OBJECTS: 'Activities must be non-null map objects',
  ACTOR_MUST_BE_PROVIDED: 'Actor must be provided.',
  AGENT_IFI_PROPERTIES_MUST_BE_SPECIFIED: 'Exactly one Inverse Functional Identifier property must be specified for an "agent".',
  AGENT_MUST_BE_NON_NULL_MAP_OBJECT: '"agent" must be a non-null map object',
  AGENT_MUST_NOT_HAVE_GROUP_CHARACTERISTICS: 'Invalid object with characteristics of a Group when an Agent was expected.',
  ATTACHMENTS_MUST_BE_NOT_NULL_ARRAY: '"attachments" must be a non-null Array.',
  ATTACHMENTS_MUST_NOT_BE_NULL_MAP_OBJECTS: '"attachment" instances must be non-null map objects.',
  AUTHORITY_MUST_BE_NON_NULL_MAP_OBJECT: 'If present, the "authority" property must be a non-null map object.',
  CONTEXT_ACTIVITIES_MUST_BE_ARRAY_OR_ACTIVITY_OBJ: 'Context Activities property values must be an array of Activity Objects or a single Activity Object.',
  CONTEXT_ACTIVITIES_MUST_BE_NON_NULL_MAP_OBJECT: 'The Context Activities instances must be a non-null map object.',
  CONTEXT_ACTIVITIES_MUST_NOT_BE_NULL: '"Context Activities" property values must not be null.',
  CONTEXT_ACTIVITIES_SHOULD_BE_AN_ARRAY: 'Context Activities property values should prefer to be an array of Activities rather than a single Activity object.',
  CONTEXT_MUST_BE_NON_NUL_MAP_OBJECT: 'If present, the "context" property must be a non-null map object.',
  CORRECT_RESPONSES_PATTERN_MUST_BE_ARRAY: 'If present, the "correctResponsesPattern" value must be an Array of strings.',
  CORRECT_RESPONSES_PATTERN_MUST_BE_STRINGS: '"correctResponsesPattern" items must be strings.',
  DATE_MUST_BE_VALID: 'This propertys string value must be conformant to ISO 8601 for Date Times.',
  DATE_SHOULD_INCLUDE_ZONE_INFORMATION: 'ISO 8601 date time strings used in the xAPI should include time zone information.',
  DEFINITIONS_MUST_BE_OBJECTS: '"definitions", when present, must be map objects',
  DISPLAY_SHOULD_BE_PROVIDED: '"display" property should be provided.',
  DURATION_MUST_BE_VALID: 'If present, the "duration" property value must be an ISO 8601 duration',
  EXTENSIONS_MUST_NOT_BE_NULL: 'If present, the extensions property must be a non-null map object.',
  GROUP_AUTHORITY_AGENT_MEMBERS_MUST_BE_TWO: 'If used as a Group, the "authority" property must contain a "member" property that is an array containing exactly two Agent objects.',
  GROUP_IFI_PROPERTIES_MUST_BE_SPECIFIED: 'Exactly one Inverse Functional Identifier property must be specified for a "group".',
  GROUP_MEMBER_MUST_BE_ARRAY: 'If present, the member property of a Group must be an Array',
  GROUP_MUST_BE_NON_NULL_MAP_OBJECT: '"group" must be a non-null map object',
  ID_MUST_BE_UNIQUE: '"id" properties must be unique within each interaction component array',
  ID_MUST_BE_VALID_UUID_REF: '"id" property value must be a valid UUID string for statement reference objects.',
  ID_MUST_BE_VALID: 'Id was not a valid UUID',
  ID_SHOULD_NOT_CONTAIN_WHITESPACES: '"id" properties on interaction components should not contain whitespace',
  IDS_SHOULD_BE_GENERATED_BY_LRS: 'Ids should be generated by the Activity Provider, and must be generated by the LRS',
  IFI_MUST_BE_MBOX_URI: '"mbox" property was required to be a mailto URI string but was not a string at all.',
  IFI_MUST_BE_VALID_MBOX_FORMAT: '"mbox" property was required to be a mailto URI string but did not match the mailto format.',
  INTERACTION_ACTIVITY_SHOULD_HAVE: 'Interaction Activity Definitions should have a type property of',
  INTERACTION_COMPONENT_MUST_NOT_BE_NULL: 'This interaction component collection member must be a non-null map object',
  INTERACTION_COMPONENT_SHOULD_BE_ARRAY: 'This interaction component collection property should be an array.',
  INTERACTION_TYPE_MUST_BE_CMI: 'If present, the "interactionType" value must be a CMI interaction type option.',
  INTERACTION_TYPE_MUST_BE_VALID: 'This interaction component collection property is not associated with the present interactionType of: ',
  INVALID_JSON: 'Invalid JSON. The statement could not be parsed.',
  LANGUAGE_MAP_KEY_INVALID: 'key, Language does not conform to RFC 5646',
  LANGUAGE_MAP_KEY_MUST_BE_STRING: 'key: Language Map value should be a String, but was not',
  LANGUAGE_MAPS_MUST_NOT_BE_NULL: 'Language Maps, when present, must be non-null map objects',
  LANGUAGE_MUST_BE_STRING: 'The language property must be encoded as an RFC 5646 compliant string, but was not.',
  LENGTH_MUST_BE_INTEGER: '"length" property must be provided with an integer value',
  MAX_MUST_BE_GREATER_THAN_MIN: 'If both "max" and "min" are present, the max property value should be greater than min',
  MEMBER_MUST_BE_PROVIDED_FOR_ANONYMOUS_GROUPS: '"member" property must be provided for Anonymous Groups.',
  MUST_BE_BOOLEAN_PRESENT: 'property was required to be a Boolean but was absent.',
  MUST_BE_BOOLEAN: 'property, if present, must be a Boolean.',
  MUST_BE_IRI_STRING: 'property, if present, should be a IRI-like absolute URI per RFC 3987.',
  MUST_BE_NUMBER_PRESENT: 'property was required to be a Number but was absent.',
  MUST_BE_NUMBER: 'property, if present, must be a Number.',
  MUST_BE_PRESENT: 'property was required to be a string but was absent.',
  MUST_BE_STRING: 'property, if present, must be a string.',
  MUST_BE_URI_PRESENT: 'property was required to be a URI string but was absent.',
  MUST_BE_URI_STRING: 'property, if present, must be a URI string.',
  OBJECT_MUST_BE_DEFINED: '"object" property must be provided.',
  OBJECT_MUST_BE_NON_NULL_MAP_OBJECT: '"object" property must be a non-null map object.',
  OBJECT_TYPE_MUST_BE_STATEMENT_REF: '"objectType" property value must be "StatementRef" for statement reference objects.',
  OBJECT_TYPE_MUST_BE_VALID_OPTION: 'object\'s "objectType" did not match a valid option',
  RAW_MUST_BE_GREATER_THAN_MIN: 'If both "raw" and "min" are present, the raw property value should be greater than min',
  RAW_MUST_BE_LESS_THAN_MAX: 'If both "raw" and "max" are present, the raw property value should be less than max',
  REGISTRATION_MUST_BE_UUID_STRING: 'If present, the registration property must be a UUID string.',
  RESULT_MUST_BE_MAP_OBJECT: 'If present, the result must be a map object',
  REVISION_MUST_BE_AGENT_OR_GROUP: 'The revision property must not be used if the Statement\'s Object is an Agent or Group.',
  SCALED_MUST_BE_BETWEEN_0_1: 'If present, the scaled property value must be between 0 and 1',
  SHA2_MUST_BE_PROVIDED_ON_ATTACHMENT_OBJECTS: '"sha2" property must be provided on attachment objects',
  SHA2_MUST_CONTAIN_BASE_64_STRING: '"sha2" property must contain a string with base64 contents',
  STATEMENT_ARGUMENT_IS_NOT_VALID: 'Statement argument provided was not a valid object or a valid JSON string.',
  STATEMENT_ARGUMENT_MUST_BE_PROVIDED: 'No statement argument provided.',
  STATEMENT_MUST_BE_PARSED_CORRECTLY: 'Null or non-object statement value parsed from provided statment JSON.',
  STATEMENT_MUST_NOT_BE_NULL: 'Null statement argument provided.',
  STATEMENT_REF_MUST_NOT_BE_NULL_MAP_OBJECTS: 'StatementRef instances must be non-null map objects',
  SUB_STATEMENT_MUST_NOT_CONTAIN_SUB_STATEMENT: 'A SubStatement must not contain a SubStatement',
  UNEXPECTED: 'Unexpected property not permitted',
  VERB_MUST_BE_PROVIDED: 'Verb must be provided',
  VERB_MUST_NOT_BE_NULL: 'Verb property value must a non-null map object.',
  VERSION_MUST_COMPLY_SEMANTIC_VERSIONING: '"version" must be a non-null string that complies with Semantic Versioning 1.0.0'
});

exports.xapiErrorLevels = xapiErrorLevels;
exports.xapiValidationErrors = xapiValidationErrors;

},{}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var xapiGeneral = Object.freeze({
  FIRST_REPORT_VERSTION: '1.0.0',
  GROUP_AUTHORITY_AGENT_MEMBERS: 2,
  INTERACTION_DEFINITION_TYPE: 'http://adlnet.gov/expapi/activities/cmi.interaction',
  MAX_SCALED_VALUE: 1,
  MIN_SCALED_VALUE: 0,
  NO_INDEX_FOUND: -1,
  NUMER_OF_SPECIFIED_IFI_PROPERTIES: 1
});

exports.xapiGeneral = xapiGeneral;

},{}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var interactionTypes = exports.interactionTypes = Object.freeze({
  CHOICE: 'choice',
  FILL_IN: 'fill-in',
  LIKERT: 'likert',
  LONG_FILL_IN: 'long-fill-in',
  MATCHING: 'matching',
  NUMERIC: 'numeric',
  OTHER: 'other',
  PERFORMANCE: 'performance',
  SEQUENCING: 'sequencing',
  TRUE_FALSE: 'true-false'
});

var xapiValidationInteractionTypes = exports.xapiValidationInteractionTypes = Object.freeze([interactionTypes.CHOICE, interactionTypes.FILL_IN, interactionTypes.LIKERT, interactionTypes.LONG_FILL_IN, interactionTypes.MATCHING, interactionTypes.NUMERIC, interactionTypes.OTHER, interactionTypes.PERFORMANCE, interactionTypes.SEQUENCING, interactionTypes.TRUE_FALSE]);

},{}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var properties = Object.freeze({
  ACCOUNT: 'account',
  ACTIVITY: 'activity',
  ACTOR: 'actor',
  AGENT: 'agent',
  ATTACHMENT: 'attachment',
  ATTACHMENTS: 'attachments',
  AUTHORITY: 'authority',
  CATEGORY: 'category',
  CHOICE: 'choice',
  CHOICES: 'choices',
  COMPLETION: 'completion',
  CONTENT_TYPE: 'contentType',
  CONTEXT_ACTIVITIES: 'contextActivities',
  CONTEXT: 'context',
  CORRECT_RESPONSES_PATTERN: 'correctResponsesPattern',
  DATE_TIME: 'dateTime',
  DEFINITION: 'definition',
  DESCRIPTION: 'description',
  DISPLAY: 'display',
  DURATION: 'duration',
  EXTENSIONS: 'extensions',
  FILE_URL: 'fileUrl',
  GROUP: 'group',
  GROUPING: 'grouping',
  HOME_PAGE: 'homePage',
  ID: 'id',
  INSTRUCTOR: 'instructor',
  INTERACTION_COMPONENTS: 'interactionComponents',
  INTERACTION_TYPE: 'interactionType',
  LANGUAGE_MAP: 'languageMap',
  LANGUAGE: 'language',
  LENGTH: 'length',
  LIKERT: 'likert',
  MATCHING: 'matching',
  MAX: 'max',
  MBOX_SHA_1_SUM: 'mbox_sha1sum',
  MBOX: 'mbox',
  MEMBER: 'member',
  MIN: 'min',
  MORE_INFO: 'moreInfo',
  NAME: 'name',
  OBJECT_TYPE: 'objectType',
  OBJECT: 'object',
  OPEN_ID: 'openID',
  OTHER: 'other',
  PARENT: 'parent',
  PERFORMANCE: 'performance',
  PLATFORM: 'platform',
  RAW: 'raw',
  REGISTRATION: 'registration',
  RESPONSE: 'response',
  RESULT: 'result',
  REVISION: 'revision',
  SCALE: 'scale',
  SCALED: 'scaled',
  SCORE: 'score',
  SEQUENCING: 'sequencing',
  SHA2: 'sha2',
  SOURCE: 'source',
  STATEMENT_REF: 'statementRef',
  STATEMENT: 'statement',
  STEPS: 'steps',
  STORED: 'stored',
  SUB_CONTEXT: 'subContext',
  SUCCESS: 'success',
  TARGET: 'target',
  TEAM: 'team',
  TIMESTAMP: 'timestamp',
  TYPE: 'type',
  USAGE_TYPE: 'usageType',
  VERB: 'verb',
  VERSION: 'version'
});

var objectTypes = Object.freeze({
  GROUP: 'Group',
  AGENT: 'Agent',
  ACTIVITY: 'Activity',
  STATEMENT_REF: 'StatementRef',
  SUB_STATEMENT: 'SubStatement'
});

var xapiValidationIfiPropertyNames = Object.freeze([properties.ACCOUNT, properties.MBOX_SHA_1_SUM, properties.MBOX, properties.OPEN_ID]);

var xApiValidObjectTypes = Object.freeze([objectTypes.GROUP, objectTypes.AGENT, objectTypes.ACTIVITY, objectTypes.STATEMENT_REF, objectTypes.SUB_STATEMENT]);

exports.properties = properties;
exports.objectTypes = objectTypes;
exports.xapiValidationIfiPropertyNames = xapiValidationIfiPropertyNames;
exports.xApiValidObjectTypes = xApiValidObjectTypes;

},{}],46:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var xapiValidationRegex = Object.freeze({
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ISO_8601_DURATION: /^P((\d+([\.,]\d+)?Y)?(\d+([\.,]\d+)?M)?(\d+([\.,]\d+)?W)?(\d+([\.,]\d+)?D)?)?(T(\d+([\.,]\d+)?H)?(\d+([\.,]\d+)?M)?(\d+([\.,]\d+)?S)?)?$/,
  ISO_8601_DATE_TIME: /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/,
  MAILTO_URI: /^mailto:/,
  CONTAINS_WHITESPACE: /\s/g,
  SEMVER_1_P_0_P_0: /^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+))?$/,
  BASE_64: /^(?:[A-Za-z0-9\+\/]{4})*(?:[A-Za-z0-9\+\/]{2}==|[A-Za-z0-9\+\/]{3}=|[A-Za-z0-9\+\/]{4})$/,
  IRI: /^[a-z](?:[\-a-z0-9\+\.])*:(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4}:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+[\-a-z0-9\._~!\$&'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=@])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*)?|(?:(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])))(?:\?(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\uE000-\uF8FF\uF0000-\uFFFFD|\u100000-\u10FFFD\/\?])*)?(?:\#(?:(?:%[0-9a-f][0-9a-f]|[\-a-z0-9\._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\/\?])*)?$/i,
  BCP_47: /^(?:(en-GB-oed|i-(?:ami|bnn|default|enochian|hak|klingon|lux|mingo|navajo|pwn|tao|tay|tsu)|sgn-(?:BE-FR|BE-NL|CH-DE))|(art-lojban|cel-gaulish|no-(?:bok|nyn)|zh-(?:guoyu|hakka|min|min-nan|xiang)))$|^(x(?:-[0-9a-z]{1,8})+)$|^(?:((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*)?((?:-[0-9a-wy-z](?:-[a-z0-9]{2,8}){1,})*)?(-x(?:-[0-9a-z]{1,8})+)?)$/i
});

var dateFormatRegexPositions = Object.freeze({
  YEAR: 1,
  MONTH: 2,
  DAY: 3,
  HOUR: 4,
  MINUTE: 5,
  SECOND: 6,
  MSECOND: 7,
  ZONE: 8,
  RELATIVE_TIME: 9,
  TIME_ZONE_HOUR: 10,
  TIME_ZONE_MINUTE: 11
});

exports.xapiValidationRegex = xapiValidationRegex;
exports.dateFormatRegexPositions = dateFormatRegexPositions;

},{}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.xapiWhiteListProperties = undefined;

var _properties = require('../constants/properties');

var xapiWhiteListProperties = Object.freeze({
  IFI: [_properties.properties.HOME_PAGE, _properties.properties.NAME],
  URI: [_properties.properties.ID, _properties.properties.DISPLAY],
  COMPONENT_ARRAY: [_properties.properties.ID, _properties.properties.DESCRIPTION],
  ACTIVITY_DEFINITION: [_properties.properties.NAME, _properties.properties.DESCRIPTION, _properties.properties.TYPE, _properties.properties.MORE_INFO, _properties.properties.EXTENSIONS, _properties.properties.INTERACTION_TYPE, _properties.properties.CORRECT_RESPONSES_PATTERN, _properties.properties.CHOICES, _properties.properties.SCALE, _properties.properties.SOURCE, _properties.properties.TARGET, _properties.properties.STEPS],
  ACTIVITY: [_properties.properties.OBJECT_TYPE, _properties.properties.ID, _properties.properties.DEFINITION],
  STATEMENT_REF: [_properties.properties.ID, _properties.properties.OBJECT_TYPE],
  SCORE: [_properties.properties.SCALED, _properties.properties.RAW, _properties.properties.MIN, _properties.properties.MAX],
  RESULT: [_properties.properties.SCORE, _properties.properties.SUCCESS, _properties.properties.COMPLETION, _properties.properties.RESPONSE, _properties.properties.DURATION, _properties.properties.EXTENSIONS],
  ATTACHMENT: [_properties.properties.USAGE_TYPE, _properties.properties.DISPLAY, _properties.properties.DESCRIPTION, _properties.properties.CONTENT_TYPE, _properties.properties.LENGTH, _properties.properties.SHA2, _properties.properties.FILE_URL],
  AGENT: [_properties.properties.OBJECT_TYPE, _properties.properties.NAME, _properties.properties.ACCOUNT, _properties.properties.MBOX_SHA_1_SUM, _properties.properties.MBOX, _properties.properties.OPEN_ID],
  GROUP: [_properties.properties.OBJECT_TYPE, _properties.properties.NAME, _properties.properties.MEMBER, _properties.properties.ACCOUNT, _properties.properties.MBOX_SHA_1_SUM, _properties.properties.MBOX, _properties.properties.OPEN_ID],
  CONTEXT_ACTIVITIES: [_properties.properties.PARENT, _properties.properties.GROUPING, _properties.properties.CATEGORY, _properties.properties.OTHER],
  STATEMENT: [_properties.properties.ID, _properties.properties.ACTOR, _properties.properties.VERB, _properties.properties.OBJECT, _properties.properties.RESULT, _properties.properties.CONTEXT, _properties.properties.TIMESTAMP, _properties.properties.STORED, _properties.properties.AUTHORITY, _properties.properties.VERSION, _properties.properties.ATTACHMENTS],
  SUB_STATEMENT: [_properties.properties.ACTOR, _properties.properties.VERB, _properties.properties.OBJECT, _properties.properties.RESULT, _properties.properties.CONTEXT, _properties.properties.TIMESTAMP, _properties.properties.ATTACHMENTS, _properties.properties.OBJECT_TYPE],
  EXTENSIONS: [_properties.properties.REGISTRATION, _properties.properties.INSTRUCTOR, _properties.properties.TEAM, _properties.properties.CONTEXT_ACTIVITIES, _properties.properties.REVISION, _properties.properties.PLATFORM, _properties.properties.LANGUAGE, _properties.properties.STATEMENT, _properties.properties.EXTENSIONS]
});

exports.xapiWhiteListProperties = xapiWhiteListProperties;

},{"../constants/properties":45}],48:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.xapiValidationUtils = undefined;

var _regex = require('../constants/regex');

var _properties = require('../constants/properties');

var IS_STRING = '[object String]',
    IS_ARRAY = '[object Array]',
    IS_BOOLEAN = '[object Boolean]',
    IS_NUMBER = '[object Number]';

var toString = Object.prototype.toString;
var xapiValidationUtils;

exports.xapiValidationUtils = xapiValidationUtils = {
  isString: function isString(obj) {
    return toString.call(obj) === IS_STRING;
  },
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },


  isArray: Array.isArray || function (obj) {
    return toString.call(obj) === IS_ARRAY;
  },

  isBoolean: function isBoolean(obj) {
    return obj === true || obj === false || toString.call(obj) === IS_BOOLEAN;
  },
  isNumber: function isNumber(obj) {
    return toString.call(obj) === IS_NUMBER;
  },
  isDefined: function isDefined(obj) {
    return obj !== null || obj !== undefined;
  },
  isNonNullMapObject: function isNonNullMapObject(target) {
    return this.isDefined(target) && this.isObject(target) && !this.isArray(target);
  },
  isValidLanguageTag: function isValidLanguageTag(target) {
    // TODO - use more precise 5646 handling, rather than this simplified BCP 47 regex, which combines RFC 5646 and RFC 4647.
    return this.isDefined(target) && this.isString(target) && _regex.xapiValidationRegex.BCP_47.test(target);
  },
  addPropToTrace: function addPropToTrace(trace, addendum) {
    return this.isDefined(addendum) ? trace + '.' + addendum : trace;
  },
  addLookupToTrace: function addLookupToTrace(trace, key) {
    return !this.isDefined(key) ? trace : this.isNumber(key) ? trace + '[' + key + ']' : trace + '["' + key + '"]';
  },
  localTraceToString: function localTraceToString(trace, addendum) {
    return this.addPropToTrace(trace, addendum);
  },
  isGroup: function isGroup(actorOrGroup) {
    return actorOrGroup.member !== null && actorOrGroup.member !== undefined || actorOrGroup.objectType === _properties.objectTypes.GROUP;
  }
};

exports.xapiValidationUtils = xapiValidationUtils;

},{"../constants/properties":45,"../constants/regex":46}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateStatement = undefined;

var _properties = require('./constants/properties');

var _whitelists = require('./constants/whitelists');

var _errors = require('./constants/errors');

var _regex = require('./constants/regex');

var _interactionTypes = require('./constants/interaction-types');

var _general = require('./constants/general');

var _utils = require('./utils/utils');

function makeV1Report(instance, errors) {
  var version;

  instance = instance || null;
  errors = errors || null;
  version = _general.xapiGeneral.FIRST_REPORT_VERSTION;
  return { instance: instance, errors: errors, version: version };
}

function makeV1SingleErrorReport(instance, error) {
  return makeV1Report(instance, error === null || error === undefined ? [] : [error]);
}

function validateAbsenceOfNonWhitelistedProperties(target, allowedProperties, trace, errors) {
  var localErrors, localTrace, propertyName;

  localErrors = errors || [];
  localTrace = trace || '';

  for (propertyName in target) {
    if (target.hasOwnProperty(propertyName) && allowedProperties.indexOf(propertyName) === _general.xapiGeneral.NO_INDEX_FOUND) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, propertyName),
        message: _errors.xapiValidationErrors.UNEXPECTED,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  return localErrors;
}

function validatePropertyIsString(parent, propertyName, trace, errors, isRequired, violationType) {
  var localErrors, localTrace, propValue, localViolationType;

  localErrors = errors || [];
  localTrace = trace || '';
  propValue = parent[propertyName], localViolationType = violationType || _errors.xapiErrorLevels.MUST_VIOLATION;

  if (propValue !== undefined) {
    if (propValue === null || !_utils.xapiValidationUtils.isString(propValue)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_STRING,
        level: localViolationType
      });
    }
  } else if (isRequired) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_PRESENT,
      level: localViolationType
    });
  }

  return localErrors;
}

function validatePropertyIsUri(target, propertyName, trace, errors, isRequired) {
  var localErrors, localTrace, propValue;

  localErrors = errors || [];
  localTrace = trace || '';
  propValue = target[propertyName];

  if (propValue !== undefined) {
    if (propValue === null || !_utils.xapiValidationUtils.isString(propValue)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_URI_STRING,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    } else if (!_regex.xapiValidationRegex.IRI.test(propValue)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_IRI_STRING,
        level: _errors.xapiErrorLevels.SHOULD_VIOLATION
      });
    }
  } else if (isRequired) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_URI_PRESENT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }
  return localErrors;
}

function validatePropertyIsUrl(target, propertyName, trace, errors, isRequired) {
  // TODO - check whether a formal URL format definition is recommended/enforced for xAPI
  return validatePropertyIsString(target, propertyName, trace, errors, isRequired);
}

function validatePropertyIsBoolean(parent, propertyName, trace, errors, isRequired) {
  var localErrors, localTrace, propValue;

  localErrors = errors || [];
  localTrace = trace || '';
  propValue = parent[propertyName];

  if (propValue !== undefined) {
    if (propValue === null || !_utils.xapiValidationUtils.isBoolean(propValue)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_BOOLEAN,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  } else if (isRequired) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_BOOLEAN_PRESENT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }
  return localErrors;
}

function validatePropertyIsNumber(parent, propertyName, trace, errors, isRequired) {
  var localErrors, localTrace, propValue;

  localErrors = errors || [];
  localTrace = trace || '';
  propValue = parent[propertyName];

  if (propValue !== undefined) {
    if (propValue === null || !_utils.xapiValidationUtils.isNumber(propValue)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_NUMBER,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  } else if (isRequired) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_NUMBER_PRESENT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }
  return localErrors;
}

function validateIFIProperties(target, trace, errors) {
  var localErrors, localTrace, accountTrace;

  localErrors = errors || [];
  localTrace = trace || '';

  if (target.mbox !== undefined && target.mbox !== null) {
    if (!_utils.xapiValidationUtils.isString(target.mbox)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.MBOX),
        message: _errors.xapiValidationErrors.IFI_MUST_BE_MBOX_URI,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    } else if (!_regex.xapiValidationRegex.MAILTO_URI.test(target.mbox)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.MBOX),
        message: _errors.xapiValidationErrors.IFI_MUST_BE_VALID_MBOX_FORMAT,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  validatePropertyIsString(target, _properties.properties.MBOX_SHA_1_SUM, localTrace, localErrors, /*isRequired*/false);
  validatePropertyIsUri(target, _properties.properties.OPEN_ID, localTrace, localErrors, /*isRequired*/false);

  if (target.account !== undefined && target.account !== null) {
    accountTrace = _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.ACCOUNT);
    validatePropertyIsUri(target.account, _properties.properties.HOME_PAGE, accountTrace, localErrors, /*isRequired*/true);
    validatePropertyIsString(target.account, _properties.properties.NAME, accountTrace, localErrors, /*isRequired*/true);
    validateAbsenceOfNonWhitelistedProperties(target.account, _whitelists.xapiWhiteListProperties.IFI, accountTrace, localErrors);
  }

  return localErrors;
}

function getIFIs(target) {
  var ifis;

  if (target === null || target === undefined) {
    return [];
  }

  ifis = _properties.xapiValidationIfiPropertyNames.filter(function (name) {
    if (target[name] !== undefined && target[name] !== null) {
      return { key: name, value: target[name] };
    }
  });

  return ifis;
}

function getIFICount(target) {
  return getIFIs(target).length;
}

function validateExtensions(extensions, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [], localTrace = trace || _properties.properties.EXTENSIONS;

  if (extensions === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(extensions)) {
    localErrors.push({
      trace: localTrace,
      message: _errors.xapiValidationErrors.EXTENSIONS_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }
  // TODO - double-check what further enforceable constraints exist on extension object properties
  return localErrors;
}

function validateLanguageMap(languageMap, trace, errors) {
  var localErrors, localTrace, propName, mappedValue;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.LANGUAGE_MAP;

  if (languageMap === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(languageMap)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace),
      message: _errors.xapiValidationErrors.LANGUAGE_MAPS_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  for (propName in languageMap) {

    if (languageMap.hasOwnProperty(propName)) {
      if (!_utils.xapiValidationUtils.isValidLanguageTag(propName)) {
        localErrors.push({
          trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, propName),
          message: propName + ' ' + _errors.xapiValidationErrors.LANGUAGE_MAP_KEY_INVALID,
          level: _errors.xapiErrorLevels.MUST_VIOLATION
        });
      }

      mappedValue = languageMap[propName];

      if (mappedValue === null || mappedValue === undefined || !_utils.xapiValidationUtils.isString(mappedValue)) {
        localErrors.push({
          trace: _utils.xapiValidationUtils.addLookupToTrace(localTrace, propName),
          message: propName + ' ' + _errors.xapiValidationErrors.LANGUAGE_MAP_KEY_MUST_BE_STRING,
          level: _errors.xapiErrorLevels.MUST_VIOLATION
        });
      }
    }
  }

  return localErrors;
}

function validateVerb(verb, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.VERB;

  if (verb === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.VERB_MUST_BE_PROVIDED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(verb)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.VERB_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  validatePropertyIsUri(verb, _properties.properties.ID, localTrace, localErrors, /*isRequired*/true);

  if (verb.display === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DISPLAY),
      message: _errors.xapiValidationErrors.DISPLAY_SHOULD_BE_PROVIDED,
      level: _errors.xapiErrorLevels.SHOULD_VIOLATION
    });
  } else {
    validateLanguageMap(verb.display, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DISPLAY), localErrors);
  }

  validateAbsenceOfNonWhitelistedProperties(verb, _whitelists.xapiWhiteListProperties.URI, localTrace, localErrors);

  return localErrors;
}

function validateInteractionComponentArray(components, interactionType, allowedInteractionTypes, trace, errors) {
  var localErrors, localTrace, isAllowedComponentType, ids, perComponentTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.INTERACTION_COMPONENTS;
  isAllowedComponentType = allowedInteractionTypes.indexOf(interactionType) !== _general.xapiGeneral.NO_INDEX_FOUND;
  ids = [];

  if (isAllowedComponentType && components !== undefined) {
    if (components === null || !_utils.xapiValidationUtils.isArray(components)) {
      localErrors.push({
        trace: localTrace,
        message: _errors.xapiValidationErrors.INTERACTION_COMPONENT_SHOULD_BE_ARRAY,
        level: _errors.xapiErrorLevels.SHOULD_VIOLATION
      });
    } else {
      components.forEach(function (interactionComponent, i) {
        perComponentTrace = _utils.xapiValidationUtils.addLookupToTrace(localTrace, i);

        if (!_utils.xapiValidationUtils.isNonNullMapObject(interactionComponent)) {
          localErrors.push({
            trace: perComponentTrace,
            message: _errors.xapiValidationErrors.INTERACTION_COMPONENT_MUST_NOT_BE_NULL,
            level: _errors.xapiErrorLevels.MUST_VIOLATION
          });
        } else {
          validatePropertyIsString(interactionComponent, _properties.properties.ID, perComponentTrace, localErrors, /*isRequired*/true, _errors.xapiErrorLevels.MUST_VIOLATION);
          if (ids.indexOf(interactionComponent.id) !== _general.xapiGeneral.NO_INDEX_FOUND) {
            localErrors.push({
              trace: _utils.xapiValidationUtils.addPropToTrace(perComponentTrace, _properties.properties.ID),
              message: _errors.xapiValidationErrors.ID_MUST_BE_UNIQUE,
              level: _errors.xapiErrorLevels.MUST_VIOLATION
            });
          } else {
            ids.push(interactionComponent.id);
          }

          if (interactionComponent.id && _regex.xapiValidationRegex.CONTAINS_WHITESPACE.test(interactionComponent.id)) {
            localErrors.push({
              trace: _utils.xapiValidationUtils.addPropToTrace(perComponentTrace, _properties.properties.ID),
              message: _errors.xapiValidationErrors.ID_SHOULD_NOT_CONTAIN_WHITESPACES,
              level: _errors.xapiErrorLevels.SHOULD_VIOLATION
            });
          }

          validateLanguageMap(interactionComponent.description, _utils.xapiValidationUtils.addPropToTrace(perComponentTrace, _properties.properties.DESCRIPTION), localErrors);
          validateAbsenceOfNonWhitelistedProperties(interactionComponent, _whitelists.xapiWhiteListProperties.COMPONENT_ARRAY, perComponentTrace, localErrors);
        }
      });
    }
  } else if (interactionType && components) {
    localErrors.push({
      trace: localTrace,
      message: _errors.xapiValidationErrors.INTERACTION_TYPE_MUST_BE_VALID + ' ' + interactionType,
      level: _errors.xapiErrorLevels.SHOULD_VIOLATION
    });
  }

  return localErrors;
}

function validateActivityDefintion(definition, trace, errors) {
  var localErrors, localTrace, correctResponsesPatternTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.DEFINITION;
  correctResponsesPatternTrace = _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.CORRECT_RESPONSES_PATTERN);

  if (!_utils.xapiValidationUtils.isNonNullMapObject(definition)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace),
      message: _errors.xapiValidationErrors.DEFINITIONS_MUST_BE_OBJECTS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  validateLanguageMap(definition.name, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.NAME), localErrors);
  validateLanguageMap(definition.description, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DESCRIPTION), localErrors);

  validatePropertyIsUri(definition, _properties.properties.TYPE, localTrace, localErrors, /*isRequired*/false);
  validatePropertyIsUrl(definition, _properties.properties.MORE_INFO, localTrace, localErrors, /*isRequired*/false);
  validateExtensions(definition.extensions, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.EXTENSIONS), localErrors);

  if (definition.interactionType !== undefined) {
    if (definition.type !== _general.xapiGeneral.INTERACTION_DEFINITION_TYPE) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.TYPE),
        message: _errors.xapiValidationErrors.INTERACTION_ACTIVITY_SHOULD_HAVE + ' "' + _general.xapiGeneral.INTERACTION_DEFINITION_TYPE + '"',
        level: _errors.xapiErrorLevels.SHOULD_VIOLATION
      });
    }

    if (_interactionTypes.xapiValidationInteractionTypes.indexOf(definition.interactionType) === _general.xapiGeneral.NO_INDEX_FOUND) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.INTERACTION_TYPE),
        message: _errors.xapiValidationErrors.INTERACTION_TYPE_MUST_BE_CMI,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  if (definition.correctResponsesPattern !== undefined) {
    if (!_utils.xapiValidationUtils.isArray(definition.correctResponsesPattern)) {
      localErrors.push({
        trace: correctResponsesPatternTrace,
        message: _errors.xapiValidationErrors.CORRECT_RESPONSES_PATTERN_MUST_BE_ARRAY,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    } else {
      definition.correctResponsesPattern.forEach(function (response, i) {
        if (response === null || response === undefined || !_utils.xapiValidationUtils.isString(response)) {
          localErrors.push({
            trace: _utils.xapiValidationUtils.addLookupToTrace(correctResponsesPatternTrace, i),
            message: _errors.xapiValidationErrors.CORRECT_RESPONSES_PATTERN_MUST_BE_STRINGS,
            level: _errors.xapiErrorLevels.MUST_VIOLATION
          });
        }
      });
    }
  }

  validateInteractionComponentArray(definition.choices, definition.interactionType, [_properties.properties.CHOICE, _properties.properties.SEQUENCING], _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.CHOICES), localErrors);

  validateInteractionComponentArray(definition.scale, definition.interactionType, [_properties.properties.LIKERT], _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.SCALE), localErrors);

  validateInteractionComponentArray(definition.source, definition.interactionType, [_properties.properties.MATCHING], _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.SOURCE), localErrors);

  validateInteractionComponentArray(definition.target, definition.interactionType, [_properties.properties.MATCHING], _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.TARGET), localErrors);

  validateInteractionComponentArray(definition.steps, definition.interactionType, [_properties.properties.PERFORMANCE], _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.STEPS), localErrors);

  validateAbsenceOfNonWhitelistedProperties(definition, _whitelists.xapiWhiteListProperties.ACTIVITY_DEFINITION, localTrace, localErrors);
  return localErrors;
}

function validateActivity(activity, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.ACTIVITY;

  if (!_utils.xapiValidationUtils.isNonNullMapObject(activity)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.ACTIVITIES_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  validatePropertyIsUri(activity, _properties.properties.ID, localTrace, localErrors, /*isRequired*/true);

  if (activity.definition !== undefined) {
    validateActivityDefintion(activity.definition, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DEFINITION), localErrors);
  }

  validateAbsenceOfNonWhitelistedProperties(activity, _whitelists.xapiWhiteListProperties.ACTIVITY, localTrace, localErrors);

  return localErrors;
}

function validateStatementRef(statementRef, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.STATEMENT_REF;

  if (!_utils.xapiValidationUtils.isNonNullMapObject(statementRef)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.STATEMENT_REF_MUST_NOT_BE_NULL_MAP_OBJECTS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
    return localErrors;
  }

  if (statementRef.objectType !== _properties.objectTypes.STATEMENT_REF) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.OBJECT_TYPE),
      message: _errors.xapiValidationErrors.OBJECT_TYPE_MUST_BE_STATEMENT_REF,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (!statementRef.id || !_regex.xapiValidationRegex.UUID.test(statementRef.id)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.ID),
      message: _errors.xapiValidationErrors.ID_MUST_BE_VALID_UUID_REF,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  validateAbsenceOfNonWhitelistedProperties(statementRef, _whitelists.xapiWhiteListProperties.STATEMENT_REF, localTrace, localErrors);

  return localErrors;
}

function validateScore(score, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.SCORE;

  if (score === undefined) {
    return localErrors;
  }

  validatePropertyIsNumber(score, _properties.properties.SCALED, localTrace, localErrors, /*isRequired*/false);

  if (score.scaled !== undefined) {
    if (score.scaled < _general.xapiGeneral.MIN_SCALED_VALUE || score.scaled > _general.xapiGeneral.MAX_SCALED_VALUE) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.SCALED),
        message: _errors.xapiValidationErrors.SCALED_MUST_BE_BETWEEN_0_1,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  if (score.min !== undefined) {
    validatePropertyIsNumber(score, _properties.properties.MIN, localTrace, localErrors, /*isRequired*/false);

    if (score.raw !== undefined && score.raw < score.min) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.RAW),
        message: _errors.xapiValidationErrors.RAW_MUST_BE_GREATER_THAN_MIN,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }

    if (score.max !== undefined && score.max < score.min) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.MAX),
        message: _errors.xapiValidationErrors.MAX_MUST_BE_GREATER_THAN_MIN,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  if (score.max !== undefined) {
    validatePropertyIsNumber(score, _properties.properties.MAX, localTrace, localErrors, /*isRequired*/false);

    if (score.raw !== undefined && score.raw > score.max) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.RAW),
        message: _errors.xapiValidationErrors.RAW_MUST_BE_LESS_THAN_MAX,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  validatePropertyIsNumber(score, _properties.properties.RAW, localTrace, localErrors, /*isRequired*/false);
  validateAbsenceOfNonWhitelistedProperties(score, _whitelists.xapiWhiteListProperties.SCORE, localTrace, localErrors);

  return localErrors;
}

function validateResult(result, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.RESULT;

  if (result === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(result)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace),
      message: _errors.xapiValidationErrors.RESULT_MUST_BE_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  validateScore(result.score, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.SCORE), localErrors);
  validatePropertyIsBoolean(result, _properties.properties.SUCCESS, localTrace, localErrors, /*isRequired*/false);
  validatePropertyIsBoolean(result, _properties.properties.COMPLETION, localTrace, localErrors, /*isRequired*/false);
  validatePropertyIsString(result, _properties.properties.RESPONSE, localTrace, localErrors, /*isRequired*/false);
  validateExtensions(result.extensions, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.EXTENSIONS), localErrors);

  if (result.duration !== undefined && (result.duration === null || !_utils.xapiValidationUtils.isString(result.duration) || !_regex.xapiValidationRegex.ISO_8601_DURATION.test(result.duration))) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DURATION),
      message: _errors.xapiValidationErrors.DURATION_MUST_BE_VALID,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  validateAbsenceOfNonWhitelistedProperties(result, _whitelists.xapiWhiteListProperties.RESULT, localTrace, localErrors);

  return localErrors;
}

function validatePropertyIsISO8601String(parent, propertyName, trace, errors) {
  var localErrors, localTrace, matched, datetime;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.DATE_TIME;
  datetime = parent[propertyName];

  if (datetime === undefined) {
    return localErrors;
  }

  if (datetime === null || !_utils.xapiValidationUtils.isString(datetime)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: propertyName + ' ' + _errors.xapiValidationErrors.MUST_BE_STRING,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  matched = _regex.xapiValidationRegex.ISO_8601_DATE_TIME.exec(datetime);

  if (matched) {
    if (!dateIncludesZoneInformation(matched)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
        message: _errors.xapiValidationErrors.DATE_SHOULD_INCLUDE_ZONE_INFORMATION,
        level: _errors.xapiErrorLevels.SHOULD_VIOLATION
      });
    }
  } else {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, propertyName),
      message: _errors.xapiValidationErrors.DATE_MUST_BE_VALID,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  return localErrors;
}

function validateVersion(version, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.VERSION;

  if (version === undefined) {
    return localErrors;
  }

  if (version === null || !_utils.xapiValidationUtils.isString(version) || !_regex.xapiValidationRegex.SEMVER_1_P_0_P_0.test(version)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.VERSION_MUST_COMPLY_SEMANTIC_VERSIONING,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  return localErrors;
}

function validateAttachmentObject(attachment, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.ATTACHMENT;

  if (!_utils.xapiValidationUtils.isNonNullMapObject(attachment)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.ATTACHMENTS_MUST_NOT_BE_NULL_MAP_OBJECTS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (attachment.display === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.DISPLAY),
      message: _errors.xapiValidationErrors.DISPLAY_SHOULD_BE_PROVIDED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  } else {
    validateLanguageMap(attachment.display, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DISPLAY), localErrors);
  }

  validateLanguageMap(attachment.description, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.DESCRIPTION), localErrors);
  validatePropertyIsUri(attachment, _properties.properties.USAGE_TYPE, localTrace, localErrors, /*isRequired*/true, _errors.xapiErrorLevels.MUST_VIOLATION);
  validatePropertyIsUri(attachment, _properties.properties.FILE_URL, localTrace, localErrors, /*isRequired*/false, _errors.xapiErrorLevels.MUST_VIOLATION);

  // TODO - more complete validation for Internet Media Type via RFC 2046
  validatePropertyIsString(attachment, _properties.properties.CONTENT_TYPE, localTrace, localErrors, /*isRequired*/true, _errors.xapiErrorLevels.MUST_VIOLATION);

  if (attachment.length === undefined || attachment.length === null || !_utils.xapiValidationUtils.isNumber(attachment.length) || attachment.length % 1 !== 0) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.LENGTH),
      message: _errors.xapiValidationErrors.LENGTH_MUST_BE_INTEGER,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (attachment.sha2 === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.SHA2),
      message: _errors.xapiValidationErrors.SHA2_MUST_BE_PROVIDED_ON_ATTACHMENT_OBJECTS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  } else if (attachment.sha2 === null || !_utils.xapiValidationUtils.isString(attachment.sha2) || !_regex.xapiValidationRegex.BASE_64.test(attachment.sha2)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.SHA2),
      message: _errors.xapiValidationErrors.SHA2_MUST_CONTAIN_BASE_64_STRING,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  validateAbsenceOfNonWhitelistedProperties(attachment, _whitelists.xapiWhiteListProperties.ATTACHMENT, localTrace, localErrors);
  return localErrors;
}

function validateAttachments(attachments, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.ATTACHMENTS;

  if (attachments === undefined) {
    return localErrors;
  }

  if (attachments === null || !_utils.xapiValidationUtils.isArray(attachments)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.ATTACHMENTS_MUST_BE_NOT_NULL_ARRAY,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  attachments.forEach(function (attachment, i) {
    validateAttachmentObject(attachment, _utils.xapiValidationUtils.addLookupToTrace(localTrace, i), localErrors);
  });

  return localErrors;
}

function validateAgent(agent, trace, errors) {
  var localErrors, localTrace, ifiCount;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.AGENT;

  if (!_utils.xapiValidationUtils.isNonNullMapObject(agent)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.AGENT_MUST_BE_NON_NULL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
    return localErrors;
  }

  ifiCount = getIFICount(agent);

  if (ifiCount !== _general.xapiGeneral.NUMER_OF_SPECIFIED_IFI_PROPERTIES) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.AGENT_IFI_PROPERTIES_MUST_BE_SPECIFIED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (agent.objectType === _properties.objectTypes.GROUP) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.AGENT_MUST_NOT_HAVE_GROUP_CHARACTERISTICS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  validateIFIProperties(agent, localTrace, localErrors);
  validatePropertyIsString(agent, _properties.properties.NAME, localTrace, localErrors, /*isRequired*/false);

  validateAbsenceOfNonWhitelistedProperties(agent, _whitelists.xapiWhiteListProperties.AGENT, localTrace, localErrors);

  return localErrors;
}

function validateGroup(group, trace, errors) {
  var localErrors, localTrace, memberTrace, ifiCount;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.GROUP;
  memberTrace = _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.MEMBER);

  if (!_utils.xapiValidationUtils.isNonNullMapObject(group)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.GROUP_MUST_BE_NON_NULL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  ifiCount = getIFICount(group);

  if (ifiCount === 0) {
    if (group.member === null || group.member === undefined) {
      localErrors.push({
        trace: memberTrace,
        message: _errors.xapiValidationErrors.MEMBER_MUST_BE_PROVIDED_FOR_ANONYMOUS_GROUPS,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  } else if (ifiCount > _general.xapiGeneral.NUMER_OF_SPECIFIED_IFI_PROPERTIES) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.GROUP_IFI_PROPERTIES_MUST_BE_SPECIFIED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  validateIFIProperties(group, localTrace, localErrors);

  validatePropertyIsString(group, _properties.properties.NAME, localTrace, localErrors, /*isRequired*/false);

  if (group.member !== undefined) {
    if (group.member === null || !_utils.xapiValidationUtils.isArray(group.member)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.MEMBER),
        message: _errors.xapiValidationErrors.GROUP_MEMBER_MUST_BE_ARRAY,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    } else {
      group.member.forEach(function (member, i) {
        validateAgent(member, _utils.xapiValidationUtils.addLookupToTrace(memberTrace, i), localErrors);
      });
    }
  }

  validateAbsenceOfNonWhitelistedProperties(group, _whitelists.xapiWhiteListProperties.GROUP, localTrace, localErrors);

  return localErrors;
}

function validateActor(actor, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.ACTOR;

  if (actor === null || actor === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.ACTOR_MUST_BE_PROVIDED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (_utils.xapiValidationUtils.isGroup(actor)) {
    validateGroup(actor, localTrace, localErrors);
  } else {
    validateAgent(actor, localTrace, localErrors);
  }

  return localErrors;
}

function validateAuthority(authority, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.AUTHORITY;

  if (authority === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(authority)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.AUTHORITY_MUST_BE_NON_NULL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }
  if (_utils.xapiValidationUtils.isGroup(authority)) {
    validateGroup(authority, localTrace, localErrors);
    if (!authority.member || !authority.member.length || authority.member.length !== _general.xapiGeneral.GROUP_AUTHORITY_AGENT_MEMBERS) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.MEMBER),
        message: _errors.xapiValidationErrors.GROUP_AUTHORITY_AGENT_MEMBERS_MUST_BE_TWO,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  } else {
    validateAgent(authority, localTrace, localErrors);
  }

  return localErrors;
}

function validateContextActivitySubContext(subContext, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.SUB_CONTEXT;

  if (subContext === undefined) {
    return localErrors;
  }

  if (subContext === null) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.CONTEXT_ACTIVITIES_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  } else if (_utils.xapiValidationUtils.isArray(subContext)) {
    subContext.forEach(function (activity, i) {
      validateActivity(activity, _utils.xapiValidationUtils.addLookupToTrace(localTrace, i), localErrors);
    });
  } else if (_utils.xapiValidationUtils.isObject(subContext)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.CONTEXT_ACTIVITIES_SHOULD_BE_AN_ARRAY,
      level: _errors.xapiErrorLevels.SHOULD_VIOLATION
    });

    validateActivity(subContext, localTrace, localErrors);
  } else {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.CONTEXT_ACTIVITIES_MUST_BE_ARRAY_OR_ACTIVITY_OBJ,
      level: _errors.xapiErrorLevels.MUST_VIOLATION });
  }
  return localErrors;
}

function validateContextActivities(contextActivities, trace, errors) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.CONTEXT_ACTIVITIES;

  if (contextActivities === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(contextActivities)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.CONTEXT_ACTIVITIES_MUST_BE_NON_NULL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
    return localErrors;
  }

  validateContextActivitySubContext(contextActivities.parent, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.PARENT), localErrors);
  validateContextActivitySubContext(contextActivities.grouping, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.GROUPING), localErrors);
  validateContextActivitySubContext(contextActivities.category, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.CATEGORY), localErrors);
  validateContextActivitySubContext(contextActivities.other, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.OTHER), localErrors);

  validateAbsenceOfNonWhitelistedProperties(contextActivities, _whitelists.xapiWhiteListProperties.CONTEXT_ACTIVITIES, localTrace, localErrors);

  return localErrors;
}

function validateContext(context, trace, errors, statementObjectObjectType) {
  var localErrors, localTrace;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.CONTEXT;

  if (context === undefined) {
    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(context)) {
    localErrors.push({
      trace: localTrace,
      message: _errors.xapiValidationErrors.CONTEXT_MUST_BE_NON_NUL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (context.registration !== undefined && (context.registration === null || !_utils.xapiValidationUtils.isString(context.registration) || !_regex.xapiValidationRegex.UUID.test(context.registration))) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.REGISTRATION),
      message: _errors.xapiValidationErrors.REGISTRATION_MUST_BE_UUID_STRING,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if ([_properties.objectTypes.GROUP, _properties.objectTypes.AGENT].indexOf(statementObjectObjectType) !== _general.xapiGeneral.NO_INDEX_FOUND) {
    if (context.revision !== undefined) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.REVISION),
        message: _errors.xapiValidationErrors.REVISION_MUST_BE_AGENT_OR_GROUP,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }

    if (context.platform !== undefined) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.PLATFORM),
        message: _errors.xapiValidationErrors.PLATFORM_MUST_NOT_BE_USED_WITH_REVISION_AGENT_OR_GROUP,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  }

  validatePropertyIsString(context, _properties.properties.REVISION, localTrace, localErrors, /*isRequired*/false, _errors.xapiErrorLevels.MUST_VIOLATION);
  validatePropertyIsString(context, _properties.properties.PLATFORM, localTrace, localErrors, /*isRequired*/false, _errors.xapiErrorLevels.MUST_VIOLATION);

  if (context.team !== undefined) {
    validateGroup(context.team, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.TEAM), localErrors);
  }

  if (context.contextActivities !== undefined) {
    validateContextActivities(context.contextActivities, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.CONTEXT_ACTIVITIES), localErrors);
  }

  if (context.language !== undefined && !_utils.xapiValidationUtils.isValidLanguageTag(context.language)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.LANGUAGE),
      message: _errors.xapiValidationErrors.LANGUAGE_MUST_BE_STRING,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (context.statement !== undefined) {
    validateStatementRef(context.statement, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.STATEMENT), localErrors);
  }

  if (context.instructor !== undefined) {
    if (_utils.xapiValidationUtils.isGroup(context.instructor)) {
      validateGroup(context.instructor, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.INSTRUCTOR), localErrors);
    } else {
      validateAgent(context.instructor, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.INSTRUCTOR), localErrors);
    }
  }

  validateExtensions(context.extensions, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.EXTENSIONS), localErrors);
  validateAbsenceOfNonWhitelistedProperties(context, _whitelists.xapiWhiteListProperties.EXTENSIONS, localTrace, localErrors);

  return localErrors;
}

function validateObject(object, trace, errors, isWithinSubStatement) {
  var localErrors, localTrace, objectType;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.OBJECT;

  if (object === undefined) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.OBJECT_MUST_BE_DEFINED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (!_utils.xapiValidationUtils.isNonNullMapObject(object)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.OBJECT_MUST_BE_NON_NULL_MAP_OBJECT,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  validatePropertyIsString(object, _properties.properties.OBJECT_TYPE, localTrace, localErrors, /*isRequired*/true, _errors.xapiErrorLevels.SHOULD_VIOLATION);

  objectType = object.objectType || _properties.objectTypes.ACTIVITY;

  switch (objectType) {
    case _properties.objectTypes.ACTIVITY:
      validateActivity(object, localTrace, localErrors);
      break;
    case _properties.objectTypes.AGENT:
      validateAgent(object, localTrace, localErrors);
      break;
    case _properties.objectTypes.GROUP:
      validateGroup(object, localTrace, localErrors);
      break;
    case _properties.objectTypes.STATEMENT_REF:
      validateStatementRef(object, localTrace, localErrors);
      break;
    case _properties.objectTypes.SUB_STATEMENT:
      if (isWithinSubStatement) {
        localErrors.push({
          trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.OBJECT_TYPE),
          message: _errors.xapiValidationErrors.SUB_STATEMENT_MUST_NOT_CONTAIN_SUB_STATEMENT,
          level: _errors.xapiErrorLevels.MUST_VIOLATION
        });
      }
      validate(object, localTrace, localErrors, /*isSubStatement*/true);
      break;
    default:
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.OBJECT_TYPE),
        message: _errors.xapiValidationErrors.OBJECT_TYPE_MUST_BE_VALID_OPTION + ' ' + _properties.xApiValidObjectTypes.toString(),
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
  }

  return localErrors;
}

function validate(statement, trace, errors, isSubStatement) {
  var localErrors, localTrace, statementObjectObjectType, whitelistedProperties;

  localErrors = errors || [];
  localTrace = trace || _properties.properties.STATEMENT;

  whitelistedProperties = _whitelists.xapiWhiteListProperties.STATEMENT;

  if (!_utils.xapiValidationUtils.isNonNullMapObject(statement)) {
    localErrors.push({
      trace: _utils.xapiValidationUtils.localTraceToString(localTrace),
      message: _errors.xapiValidationErrors.STATEMENT_REF_MUST_NOT_BE_NULL_MAP_OBJECTS,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });

    return localErrors;
  }

  if (!isSubStatement) {
    if (statement.id === null || statement.id === undefined || !_utils.xapiValidationUtils.isString(statement.id)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.ID),
        message: _errors.xapiValidationErrors.IDS_SHOULD_BE_GENERATED_BY_LRS,
        level: _errors.xapiErrorLevels.SHOULD_VIOLATION
      });
    } else if (!_regex.xapiValidationRegex.UUID.test(statement.id)) {
      localErrors.push({
        trace: _utils.xapiValidationUtils.localTraceToString(localTrace, _properties.properties.ID),
        message: _errors.xapiValidationErrors.ID_MUST_BE_VALID,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }
  } else {
    whitelistedProperties = _whitelists.xapiWhiteListProperties.SUB_STATEMENT;
  }

  validateActor(statement.actor, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.ACTOR), localErrors);
  validateVerb(statement.verb, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.VERB), localErrors);
  validateObject(statement.object, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.OBJECT), localErrors, isSubStatement);
  validateResult(statement.result, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.RESULT), localErrors);

  statementObjectObjectType = statement.object && statement.object.objectType ? statement.object.objectType : _properties.objectTypes.ACTIVITY;

  validateContext(statement.context, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.CONTEXT), localErrors, statementObjectObjectType);
  validatePropertyIsISO8601String(statement, _properties.properties.TIMESTAMP, localTrace, localErrors);
  validatePropertyIsISO8601String(statement, _properties.properties.STORED, localTrace, localErrors);

  validateAuthority(statement.authority, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.AUTHORITY), localErrors);
  validateVersion(statement.version, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.VERSION), localErrors);
  validateAttachments(statement.attachments, _utils.xapiValidationUtils.addPropToTrace(localTrace, _properties.properties.ATTACHMENTS), localErrors);

  validateAbsenceOfNonWhitelistedProperties(statement, whitelistedProperties, localTrace, localErrors);

  return localErrors;
}

function makeStatementReport(statement) {
  var localErrors;

  localErrors = [];
  validate(statement, _properties.properties.STATEMENT, localErrors, /*isRequired*/false);

  return makeV1Report(statement, localErrors);
}

function validateAmbiguousTypeStatement(statement) {
  var statementObject;

  if (statement === undefined) {
    return makeV1SingleErrorReport( /*instance*/null, {
      trace: _properties.properties.STATEMENT,
      message: _errors.xapiValidationErrors.STATEMENT_ARGUMENT_MUST_BE_PROVIDED,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (statement === null) {
    return makeV1SingleErrorReport( /*instance*/null, {
      trace: _properties.properties.STATEMENT,
      message: _errors.xapiValidationErrors.STATEMENT_MUST_NOT_BE_NULL,
      level: _errors.xapiErrorLevels.MUST_VIOLATION
    });
  }

  if (_utils.xapiValidationUtils.isString(statement)) {
    try {
      statementObject = JSON.parse(statement);
      if (statementObject === null || !_utils.xapiValidationUtils.isObject(statementObject) || _utils.xapiValidationUtils.isArray(statementObject)) {
        return makeV1SingleErrorReport(statementObject, {
          trace: _properties.properties.STATEMENT,
          message: _errors.xapiValidationErrors.STATEMENT_MUST_BE_PARSED_CORRECTLY,
          level: _errors.xapiErrorLevels.MUST_VIOLATION
        });
      }
    } catch (e) {
      return makeV1SingleErrorReport(statementObject, {
        trace: _properties.properties.STATEMENT,
        message: _errors.xapiValidationErrors.INVALID_JSON + ': ' + e.message,
        level: _errors.xapiErrorLevels.MUST_VIOLATION
      });
    }

    return makeStatementReport(statementObject);
  }

  if (_utils.xapiValidationUtils.isObject(statement) && !_utils.xapiValidationUtils.isArray(statement)) {
    return makeStatementReport(statement);
  }

  return makeV1SingleErrorReport( /*instance*/null, {
    trace: _properties.properties.STATEMENT,
    message: _errors.xapiValidationErrors.STATEMENT_ARGUMENT_IS_NOT_VALID,
    level: _errors.xapiErrorLevels.MUST_VIOLATION
  });
}

function dateIncludesZoneInformation(matched) {
  return matched[_regex.dateFormatRegexPositions.ZONE] || matched[_regex.dateFormatRegexPositions.RELATIVE_TIME] && matched[_regex.dateFormatRegexPositions.TIME_ZONE_HOUR];
}

var validateStatement = exports.validateStatement = validateAmbiguousTypeStatement;

},{"./constants/errors":42,"./constants/general":43,"./constants/interaction-types":44,"./constants/properties":45,"./constants/regex":46,"./constants/whitelists":47,"./utils/utils":48}],50:[function(require,module,exports){
'use strict';var _underscore=require('underscore');var _chai=require('chai');var _xapiValidator=require('../src/xapiValidator');var xapiValidator;xapiValidator={validateStatement:_xapiValidator.validateStatement};describe("xapiValidator",function(){describe("#validateStatement",function(){function reportHasErrorWithTracePrefix(report,prefix,targetLevel){if(report===null||report===undefined||report.errors===null||report.errors===undefined){return false;}var hasTargetLevel=targetLevel!==null&&targetLevel!==undefined;return _underscore._.any(report.errors,function(err){var foundPrefix=err.trace.indexOf(prefix)===0;return hasTargetLevel?targetLevel===err.level&&foundPrefix:foundPrefix;});}describe("when passed no arguments",function(){it("returns non-null report",function(){var result=xapiValidator.validateStatement();(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");});it("includes one error",function(){var result=xapiValidator.validateStatement();var errors=result.errors;(0,_chai.expect)(errors).to.be.instanceOf(Array);(0,_chai.expect)(errors).to.have.length(1);(0,_chai.expect)(errors[0]).to.have.property("message").that.is.a('string').that.equals('No statement argument provided.');(0,_chai.expect)(errors[0]).to.have.property("level").that.equals("MUST_VIOLATION");});it("has a null instance property in the report",function(){(0,_chai.expect)(xapiValidator.validateStatement()).to.have.property("instance").that.is.null;});});describe("when passed a null argument",function(){it("returns non-null report",function(){var result=xapiValidator.validateStatement(null);(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");(0,_chai.expect)(result).to.have.property("errors").that.is.a("Array");(0,_chai.expect)(result).to.have.property("instance");});it("includes one error",function(){var result=xapiValidator.validateStatement(null);var errors=result.errors;(0,_chai.expect)(errors).to.be.instanceOf(Array);(0,_chai.expect)(errors).to.have.length(1);(0,_chai.expect)(errors[0]).to.have.property("message").that.is.a('string').that.equals('Null statement argument provided.');(0,_chai.expect)(errors[0]).to.have.property("level").that.equals("MUST_VIOLATION");});it("has a null instance property in the report",function(){(0,_chai.expect)(xapiValidator.validateStatement(null)).to.have.property("instance").that.is.null;});});describe("when passed a json string argument",function(){var minimalJsonString="{\"id\":\"whatever\"}";it("returns non-null report",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");(0,_chai.expect)(result).to.have.property("errors").that.is.a("Array");(0,_chai.expect)(result).to.have.property("instance");});it("has an instance property with the deserialized JSON in the report",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.have.property("instance").that.is.an("Object").that.deep.equals({"id":"whatever"});});});describe("when passed a json string argument encoding null",function(){var minimalJsonString="null";it("returns non-null report",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");(0,_chai.expect)(result).to.have.property("errors").that.is.a("Array");(0,_chai.expect)(result).to.have.property("instance");});it("includes one error",function(){var result=xapiValidator.validateStatement(minimalJsonString);var errors=result.errors;(0,_chai.expect)(errors).to.be.instanceOf(Array);(0,_chai.expect)(errors).to.have.length(1);(0,_chai.expect)(errors[0]).to.have.property("message");(0,_chai.expect)(errors[0]).to.have.property("level").that.equals("MUST_VIOLATION");});it("has an instance property with null value",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.have.property("instance").that.is.null;});});describe("when passed an invalid json string argument",function(){var minimalJsonString="derp";it("returns non-null report",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");(0,_chai.expect)(result).to.have.property("errors").that.is.a("Array");(0,_chai.expect)(result).to.have.property("instance");});it("includes one error",function(){var result=xapiValidator.validateStatement(minimalJsonString);var errors=result.errors;(0,_chai.expect)(errors).to.be.instanceOf(Array);(0,_chai.expect)(errors).to.have.length(1);(0,_chai.expect)(errors[0]).to.have.property("message");(0,_chai.expect)(errors[0]).to.have.property("level").that.equals("MUST_VIOLATION");});it("has an instance property with null value",function(){var result=xapiValidator.validateStatement(minimalJsonString);(0,_chai.expect)(result).to.have.property("instance").that.is.null;});});describe("when passed a statement object",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("returns non-null report",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(result).to.be.not.null;(0,_chai.expect)(result).to.be.a("Object");(0,_chai.expect)(result).to.have.property("errors").that.is.a("Array");(0,_chai.expect)(result).to.have.property("instance");});it("has an instance property that matches the input object",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(result).to.have.property("instance").that.deep.equals(inputStatement);});});describe("when given a null id property",function(){var inputStatement={id:null,actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("has an error about the id property",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.id")).to.be.true;});});describe("when given an invalid UUID id property",function(){var inputStatement={id:"abc123",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("has an error about the id property",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.id")).to.be.true;});});describe("when given a valid UUID id property",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("has an error about the id property",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.id")).to.be.false;});});describe("when given a null actor property",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:null,verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("has an error about the actor property",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor")).to.be.true;});});describe("when given an empty non-null actor property",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("has an error about the actor property",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor")).to.be.true;});});describe("when given an otherwise valid actor",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:group@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("the name property is optional",function(){var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(result.errors).to.have.property("length",0);});it("the name property produces no errors when a simple string",function(){inputStatement.actor.name="hello";var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(result.errors).to.have.property("length",0);});it("the name property produces no errors when a simple string",function(){inputStatement.actor.name=1.23;var result=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor.name")).to.be.true;(0,_chai.expect)(result.errors).to.have.property("length",1);});});describe("when given an actor with an objectType of 'Group'",function(){var moreValidStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{objectType:"Group",member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("the member property has no errors about it when present",function(){var result=xapiValidator.validateStatement(moreValidStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor.member")).to.be.false;});it("the member property is required to be present if the actor is unidentified, and produces an error when absent",function(){var inputInvalidStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{objectType:"Group"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var result=xapiValidator.validateStatement(inputInvalidStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor.member")).to.be.true;});it("the member property is not required to be present if the actor is identified",function(){var result=xapiValidator.validateStatement({id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{objectType:"Group",mbox:"mailto:group@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}});(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor.member")).to.be.false;});it("the member property is allowed to be present if the actor is identified",function(){var result=xapiValidator.validateStatement({id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{objectType:"Group",mbox:"mailto:group@example.com",member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}});(0,_chai.expect)(reportHasErrorWithTracePrefix(result,"statement.actor.member")).to.be.false;});});describe("when given an actor with a members property",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};it("the member property has no errors about it when present but empty",function(){(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.be.empty;});it("the member property has no errors when populated with a simple agent",function(){inputStatement.actor.member=[{mbox:"mailto:group@example.com"}];(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.be.empty;});it("the member property reports an error when populated with a Group object via objectType",function(){inputStatement.actor.member=[{mbox:"mailto:group@example.com",objectType:"Group"}];(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",1);});it("the member property's agent reports an error when given an account missing its homePage",function(){inputStatement.actor.member=[{account:{name:"bob"}}];(0,_chai.expect)(reportHasErrorWithTracePrefix(xapiValidator.validateStatement(inputStatement),"statement.actor.member[0].account.homePage")).to.be.true;});it("the member property's agent reports an error when given an account missing its name",function(){inputStatement.actor.member=[{account:{homePage:"http://example.com"}}];(0,_chai.expect)(reportHasErrorWithTracePrefix(xapiValidator.validateStatement(inputStatement),"statement.actor.member[0].account.name")).to.be.true;});it("the member property's agent reports an error when given an account with an all-lowercase homepage",function(){inputStatement.actor.member=[{account:{homepage:"http://example.com",name:"bob"}}];var report=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(report,"statement.actor.member[0].account.homepage")).to.be.true;(0,_chai.expect)(report.errors).to.have.property("length",2);});it("the member property's agent reports no error when given a full account",function(){inputStatement.actor.member=[{account:{homePage:"http://example.com",name:"bob"}}];(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",0);});it("the member property's agent reports no error when given a valid mbox",function(){inputStatement.actor.member=[{mbox:"mailto:bob@example.com"}];(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",0);});it("the member property's agent reports an error when given an invalid mbox",function(){inputStatement.actor.member=[{mbox:"SOMETHINGWRONG:bob@example.com"}];var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.actor.member[0].mbox")).to.be.true;(0,_chai.expect)(results.errors).to.have.property("length",1);});it("the member property reports an error when populated with a Group object via member",function(){inputStatement.actor.member=[{mbox:"mailto:group@example.com",member:[]}];(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",1);});});describe("when given a statement without a verb property",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb")).to.be.true;});});describe("when given a verb without an id property",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.id","MUST_VIOLATION")).to.be.true;});});describe("when given a verb with a non-string id property",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":12.34,"display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.id","MUST_VIOLATION")).to.be.true;});});describe("when given a verb with a relative URI id property",function(){it("reports an SHOULD_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"fragment","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.id","SHOULD_VIOLATION")).to.be.true;});});describe("when given a verb without a display property",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created"},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.display","SHOULD_VIOLATION")).to.be.true;});});describe("when given a verb with an empty display property",function(){it("reports no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",0);});});describe("when given a verb.display with RFC 5646 key and string value",function(){it("reports no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};(0,_chai.expect)(xapiValidator.validateStatement(inputStatement).errors).to.have.property("length",0);});});describe("when given a verb.display with RFC 5646 key and non-string value",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":1.23}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.display[\"en-US\"]","MUST_VIOLATION")).to.be.true;});});describe("when given a verb.display with invalid key and string value",function(){it("reports an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"123totallyWrong":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.verb.display.123totallyWrong","MUST_VIOLATION")).to.be.true;});});describe("when the object property is absent",function(){it("reports a MUST_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object","MUST_VIOLATION")).to.be.true;});});describe("when the object property is null",function(){it("reports a MUST_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object","MUST_VIOLATION")).to.be.true;});});describe("when the object lacks an objectType property",function(){it("reports a SHOULD_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.objectType","SHOULD_VIOLATION")).to.be.true;});});describe("when the object is an activity with a null definition property",function(){it("reports a MUST_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition","MUST_VIOLATION")).to.be.true;});});describe("when the object is an activity with an array definition property",function(){it("reports a MUST_VIOLATION error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:[]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition","MUST_VIOLATION")).to.be.true;});});describe("when the object is an Activity with a definition",function(){it("an array for the name property produces a must violation error.",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{name:[]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.name","MUST_VIOLATION")).to.be.true;});it("a number for the name property produces a must violation error.",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{name:1.23}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.name","MUST_VIOLATION")).to.be.true;});it("an invalid language Map key for the name property produces a must violation error.",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{name:{"123 totally not a language code":"created"}}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.name","MUST_VIOLATION")).to.be.true;});it("a CMI interactionType value produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"true-false"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.name","MUST_VIOLATION")).to.be.false;});it("a non-CMI interactionType value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"graphicGapMatchInteraction"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.interactionType","MUST_VIOLATION")).to.be.true;});it("a numeric correctResponsesPattern value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{correctResponsesPattern:1.23}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.correctResponsesPattern","MUST_VIOLATION")).to.be.true;});it("a flat string correctResponsesPattern value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{correctResponsesPattern:"1.23"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.correctResponsesPattern","MUST_VIOLATION")).to.be.true;});it("a nested number in a correctResponsesPattern Array value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{correctResponsesPattern:[1.23]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.correctResponsesPattern[0]","MUST_VIOLATION")).to.be.true;});it("a nested string in a correctResponsesPattern Array value produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{correctResponsesPattern:["1.23"]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.correctResponsesPattern","MUST_VIOLATION")).to.be.false;});it("an interaction activity without the standard \"http://adlnet.gov/expapi/activities/cmi.interaction\" value for the type property should produce a SHOULD error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://example.com/somethingElse",interactionType:"choice",choices:[]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.type","SHOULD_VIOLATION")).to.be.true;});it("an interaction component array property not associated with the current interactionType produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"choice",steps:[]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.steps","SHOULD_VIOLATION")).to.be.true;});it("an interaction component with whitespace in the id property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"choice",choices:[{id:"hello invalid id",description:{}}]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.choices[0]","SHOULD_VIOLATION")).to.be.true;});it("an interaction component with repeated non-unique id produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{member:[]},verb:{"id":"http://adlnet.gov/expapi/verbs/created",display:{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity",definition:{type:"http://adlnet.gov/expapi/activities/cmi.interaction",interactionType:"choice",choices:[{id:"idA",description:{}},{id:"idA",description:{}}]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.definition.choices[1]","MUST_VIOLATION")).to.be.true;});describe("given a statement reference type object",function(){it("reports a MUST error when the id property is missing",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{objectType:"StatementRef"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.id","MUST_VIOLATION")).to.be.true;});it("reports a MUST error when the id property is not a UUID",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"not a UUID",objectType:"StatementRef"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.id","MUST_VIOLATION")).to.be.true;});});describe("given a substatement type object",function(){it("should not report an error when valid",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{objectType:"SubStatement",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("reports a MUST error when the id property is present",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa1",objectType:"SubStatement",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.id","MUST_VIOLATION")).to.be.true;});it("reports a MUST error when the version property is present",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{version:"1.0.0",objectType:"SubStatement",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.version","MUST_VIOLATION")).to.be.true;});it("reports a MUST error when the stored property is present",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{stored:"2013-05-28T07:12:57.245Z",objectType:"SubStatement",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.stored","MUST_VIOLATION")).to.be.true;});it("reports a MUST error when the authority property is present",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{authority:{mbox:"mailto:agent@example.com"},objectType:"SubStatement",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.object.authority","MUST_VIOLATION")).to.be.true;});});describe("given a non-Object results property",function(){it("if null, produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result","MUST_VIOLATION")).to.be.true;});it("if an Array, produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:[]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result","MUST_VIOLATION")).to.be.true;});it("if an number, produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:1.23};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result","MUST_VIOLATION")).to.be.true;});});describe("given a results property that is an object",function(){it("if empty, all is okay, no properties were required",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-Boolean success property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{success:123}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.success","MUST_VIOLATION")).to.be.true;});it("a Boolean success property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{success:false}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-Boolean completion property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{completion:123}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.completion","MUST_VIOLATION")).to.be.true;});it("a Boolean completion property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{completion:false}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-String response property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{response:123}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.response","MUST_VIOLATION")).to.be.true;});it("a String response property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{response:"idA"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-String duration property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{duration:123}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.duration","MUST_VIOLATION")).to.be.true;});it("a non-ISO 8601 duration String duration property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{duration:"not an ISO compliant duration"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.duration","MUST_VIOLATION")).to.be.true;});it("an ISO 8601 duration String response property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{duration:"P3Y6M4DT12H30M5S"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an ISO 8601 duration String response property with fractional seconds produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{duration:"P3Y6M4DT12H30M5.01S"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});});describe("given a score property on the results",function(){it("a non-Number raw property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{raw:"123"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.raw","MUST_VIOLATION")).to.be.true;});it("a Number raw property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{raw:123}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Number raw property below min produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{raw:123,min:200}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.raw","MUST_VIOLATION")).to.be.true;});it("a Number raw property above max produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{raw:123,max:100}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.raw","MUST_VIOLATION")).to.be.true;});it("a Number raw property between min and max produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{raw:123,min:120,max:125}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-Number scaled property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{scaled:"0.5"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.scaled","MUST_VIOLATION")).to.be.true;});it("a Number scaled property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{scaled:0.5}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Number scaled property below 0 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{scaled:-0.5}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.scaled","MUST_VIOLATION")).to.be.true;});it("a Number scaled property above 1 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{scaled:2}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.scaled","MUST_VIOLATION")).to.be.true;});it("a non-Number max property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{max:"123"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.max","MUST_VIOLATION")).to.be.true;});it("a Number max property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{max:123}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Number max property below min produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{max:123,min:200}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.max","MUST_VIOLATION")).to.be.true;});it("a non-Number min property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{min:"123"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.min","MUST_VIOLATION")).to.be.true;});it("a Number min property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{min:123}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Number min property above max produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},result:{score:{max:123,min:200}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.result.score.max","MUST_VIOLATION")).to.be.true;});});describe("for a given defined context property",function(){it("an empty object produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an non-object context value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:123};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context","MUST_VIOLATION")).to.be.true;});it("an array context value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:[]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context","MUST_VIOLATION")).to.be.true;});it("a non-UUID registration value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{registration:"not a UUID"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.registration","MUST_VIOLATION")).to.be.true;});it("a UUID registration value produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{registration:"ed41c918-b88b-4b20-a0a5-a4c32391aaa0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an empty map for an instructor value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.instructor","MUST_VIOLATION")).to.be.true;});it("an unidentified Agent for an instructor value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{objectType:"Agent"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.instructor","MUST_VIOLATION")).to.be.true;});it("an unidentified Group with no member property for an instructor value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{objectType:"Group"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.instructor","MUST_VIOLATION")).to.be.true;});it("an Agent instructor value produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{mbox:"mailto:bob@example.com"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Group instructor identified by member property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{mbox:"mailto:bob@example.com",member:[]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a Group instructor identified by objectType property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{instructor:{mbox:"mailto:bob@example.com",objectType:"Group"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("if the statement's object is an Agent, the presence of the revision property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{mbox:"mailto:bob@example.com",objectType:"Agent"},context:{revision:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.revision","MUST_VIOLATION")).to.be.true;});it("if the statement's object is an Group, the presence of the revision property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{mbox:"mailto:group@example.com",objectType:"Group"},context:{revision:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.revision","MUST_VIOLATION")).to.be.true;});it("a String revision property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{revision:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-String numeric revision property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{revision:1.0}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.revision","MUST_VIOLATION")).to.be.true;});it("a null revision property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{revision:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.revision","MUST_VIOLATION")).to.be.true;});///
it("if the statement's object is an Agent, the presence of the platform property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{mbox:"mailto:bob@example.com",objectType:"Agent"},context:{platform:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.platform","MUST_VIOLATION")).to.be.true;});it("if the statement's object is an Group, the presence of the platform property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{mbox:"mailto:group@example.com",objectType:"Group"},context:{platform:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.platform","MUST_VIOLATION")).to.be.true;});it("a String platform property produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{platform:"1.0"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-String numeric platform property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{platform:1.0}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.platform","MUST_VIOLATION")).to.be.true;});it("a null platform property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{platform:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.platform","MUST_VIOLATION")).to.be.true;});it("a null team property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{team:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.team","MUST_VIOLATION")).to.be.true;});it("a Group object team property will result in no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{team:{objectType:"Group",mbox:"mailto:group@example.com"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a RFC 5646 string value for the language property will result in no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{language:"en-US"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a non-RFC 5646 string value for the language property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{language:"123 totally not RFC compliant"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.language","MUST_VIOLATION")).to.be.true;});it("a null value for the language property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{language:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.language","MUST_VIOLATION")).to.be.true;});it("a non-String value for the language property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{language:1}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.language","MUST_VIOLATION")).to.be.true;});it("a null value for the context's statement property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{statement:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.statement","MUST_VIOLATION")).to.be.true;});it("an Array value for the context's statement property will result in an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{statement:[]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.statement","MUST_VIOLATION")).to.be.true;});it("an empty object value for the context's statement property will result in errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{statement:{}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",2);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.statement.objectType","MUST_VIOLATION")).to.be.true;(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.statement.id","MUST_VIOLATION")).to.be.true;});it("a valid statement reference for the context's statement property will result in no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{statement:{objectType:"StatementRef",id:"abcdc918-b88b-4b20-a0a5-a4c32391aaa0"}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});});describe("for a context property with a contextActivities property",function(){it("a null contextActivities value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:null}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.contextActivities","MUST_VIOLATION")).to.be.true;});it("an Array contextActivities value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:[]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.contextActivities","MUST_VIOLATION")).to.be.true;});it("an Numeric contextActivities value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:1.23}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.contextActivities","MUST_VIOLATION")).to.be.true;});it("an empty contextActivities object value produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:{}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a single Activity parent property value produces a SHOULD warning",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:{parent:{id:"http://example.com/myOtherActivityUniqueId",objectType:"Activity"}}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.contextActivities","SHOULD_VIOLATION")).to.be.true;});it("an empty Array parent property value produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:{parent:[]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an Array with a valid Activity in the parent property produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:{parent:[{id:"http://example.com/myOtherActivityUniqueId",objectType:"Activity"}]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an Array with a invalid Activity in the parent property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},context:{contextActivities:{parent:[{objectType:"Activity"}]}}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.context.contextActivities.parent[0].id","MUST_VIOLATION")).to.be.true;});});describe("given a timestamp property on the statement",function(){it("a null value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.timestamp","MUST_VIOLATION")).to.be.true;});it("a numeric value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:1.23};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.timestamp","MUST_VIOLATION")).to.be.true;});it("a Date value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:new Date()};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.timestamp","MUST_VIOLATION")).to.be.true;});it("a String value not in ISO 8601 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"totally wrong"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.timestamp","MUST_VIOLATION")).to.be.true;});it("a String value with ISO 8601 at UTC via Z produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15Z"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 at UTC via Z with millisecond precision produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15.008Z"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a positive timezone offset hour produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15+01"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a positive timezone offset hour and minutes produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15+01:02"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a negative timezone offset hour produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15-01"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a negative timezone offset hour and minutes produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15-01:02"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO8601 with no timezone offset or Z produces a SHOULD error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},timestamp:"2013-05-09T14:45:15"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.timestamp","SHOULD_VIOLATION")).to.be.true;});});describe("given a stored property on the statement",function(){it("a null value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.stored","MUST_VIOLATION")).to.be.true;});it("a numeric value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:1.23};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.stored","MUST_VIOLATION")).to.be.true;});it("a Date value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:new Date()};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.stored","MUST_VIOLATION")).to.be.true;});it("a String value not in ISO 8601 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"totally wrong"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.stored","MUST_VIOLATION")).to.be.true;});it("a String value with ISO 8601 at UTC via Z produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15Z"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 at UTC via Z with millisecond precision produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15.008Z"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a positive timezone offset hour produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15+01"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a positive timezone offset hour and minutes produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15+01:02"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a negative timezone offset hour produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15-01"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO 8601 with a negative timezone offset hour and minutes produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15-01:02"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a String value with ISO8601 with no timezone offset or Z produces a SHOULD error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},stored:"2013-05-09T14:45:15"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.stored","SHOULD_VIOLATION")).to.be.true;});});describe("for a non-object authority property on the statement",function(){it("a null authority value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority","MUST_VIOLATION")).to.be.true;});it("an Array authority value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:[]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority","MUST_VIOLATION")).to.be.true;});it("an Numeric authority value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:[]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority","MUST_VIOLATION")).to.be.true;});});describe("for an authority property with an object value on the statement",function(){it("an Agent authority value produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Agent",mbox:"mailto:bob@example.com"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an Agent authority value produces an error if an invalid Agent",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Agent"}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority","MUST_VIOLATION")).to.be.true;});it("an Group authority value with two members produces no errors",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Group",member:[{objectType:"Agent",mbox:"mailto:bob@example.com"},{objectType:"Agent",mbox:"mailto:tom@example.com"}]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an Group authority value with less than two members produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Group",member:[{objectType:"Agent",mbox:"mailto:bob@example.com"}]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority.member","MUST_VIOLATION")).to.be.true;});it("an Group authority value with more than two members produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Group",member:[{objectType:"Agent",mbox:"mailto:bob@example.com"},{objectType:"Agent",mbox:"mailto:tom@example.com"},{objectType:"Agent",mbox:"mailto:frank@example.com"}]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority.member","MUST_VIOLATION")).to.be.true;});it("an Group authority value with an invalid member produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},authority:{objectType:"Group",member:[{objectType:"Agent",mbox:"mailto:bob@example.com"},{objectType:"Agent"}]}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.authority.member[1]","MUST_VIOLATION")).to.be.true;});});describe("for an version property on the statement with a non-string value",function(){it("a null value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});it("a numeric value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:1.0};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});});describe("for an version property with a string value",function(){it("a simple semantic version produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.0"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a semantic version with intermixed non-numbers in the major/minor/patch produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.a"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});it("a semantic version with valid pre-release info produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.0-rc1"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("a semantic version with invalid pre-release info produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.0-rc.1"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});it("a semantic version with SemVer 2.0.0 build release info characters not in SemVer 1.0.0 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.0-alpha.1"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});it("a semantic version with SemVer 2.0.0 build release metadata not in SemVer 1.0.0 produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},version:"1.0.0-alpha+001"};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.version","MUST_VIOLATION")).to.be.true;});});describe("for an attachments property on the statement with a non-Array value",function(){it("a null value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:null};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments","MUST_VIOLATION")).to.be.true;});it("a numeric value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:1.0};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments","MUST_VIOLATION")).to.be.true;});it("an object map value produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:{}};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments","MUST_VIOLATION")).to.be.true;});});describe("for an attachments property on the statement with an Array value",function(){it("an empty Array produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});});describe("for an attachment object within the attachments property's Array on the statement",function(){it("a null object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[null]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0]","MUST_VIOLATION")).to.be.true;});it("minimal valid attachment object produces no error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",0);});it("an absent usageType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{display:{},contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].usageType","MUST_VIOLATION")).to.be.true;});it("a null usageType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:null,display:{},contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].usageType","MUST_VIOLATION")).to.be.true;});it("a numeric usageType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:123,display:{},contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].usageType","MUST_VIOLATION")).to.be.true;});it("an object usageType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:{},display:{},contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].usageType","MUST_VIOLATION")).to.be.true;});it("an absent contentType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].contentType","MUST_VIOLATION")).to.be.true;});it("a null contentType property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:null,length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].contentType","MUST_VIOLATION")).to.be.true;});it("an absent length property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].length","MUST_VIOLATION")).to.be.true;});it("a null length property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:null,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].length","MUST_VIOLATION")).to.be.true;});it("a string length property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:"11",sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].length","MUST_VIOLATION")).to.be.true;});it("a non-integer length property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11.5,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].length","MUST_VIOLATION")).to.be.true;});it("a null sha2 property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11,sha2:null}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].sha2","MUST_VIOLATION")).to.be.true;});it("an absent sha2 property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].sha2","MUST_VIOLATION")).to.be.true;});it("a numeric sha2 property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11,sha2:1.23}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].sha2","MUST_VIOLATION")).to.be.true;});it("a non-base64 sha2 property object produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},contentType:"text/plain",length:11,sha2:"uses ~ - characters &^% not in base64"}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].sha2","MUST_VIOLATION")).to.be.true;});it("a null fileUrl property produces an error",function(){var inputStatement={id:"fd41c918-b88b-4b20-a0a5-a4c32391aaa0",actor:{mbox:"mailto:agent@example.com"},verb:{"id":"http://adlnet.gov/expapi/verbs/created","display":{"en-US":"created"}},object:{id:"http://example.com/myUniqueId",objectType:"Activity"},attachments:[{usageType:"http://example.com/usage/info/A",display:{},fileUrl:null,contentType:"text/plain",length:11,sha2:"uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek="}]};var results=xapiValidator.validateStatement(inputStatement);(0,_chai.expect)(results.errors).to.have.property("length",1);(0,_chai.expect)(reportHasErrorWithTracePrefix(results,"statement.attachments[0].fileUrl","MUST_VIOLATION")).to.be.true;});});});});});

},{"../src/xapiValidator":49,"chai":4,"underscore":41}]},{},[50])(50)
});