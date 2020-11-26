var dbslice = (function (exports) {
	'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _global = createCommonjsModule(function (module) {
	  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	  var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	  if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
	});

	var _core = createCommonjsModule(function (module) {
	  var core = module.exports = { version: '2.5.3' };
	  if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
	});
	var _core_1 = _core.version;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _isObject = function _isObject(it) {
	  return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) === 'object' ? it !== null : typeof it === 'function';
	};

	var _anObject = function _anObject(it) {
	  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};

	var _fails = function _fails(exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};

	// Thank's IE8 for his funny defineProperty
	var _descriptors = !_fails(function () {
	  return Object.defineProperty({}, 'a', { get: function get() {
	      return 7;
	    } }).a != 7;
	});

	var document$1 = _global.document;
	// typeof document.createElement is 'object' in old IE
	var is = _isObject(document$1) && _isObject(document$1.createElement);
	var _domCreate = function _domCreate(it) {
	  return is ? document$1.createElement(it) : {};
	};

	var _ie8DomDefine = !_descriptors && !_fails(function () {
	  return Object.defineProperty(_domCreate('div'), 'a', { get: function get() {
	      return 7;
	    } }).a != 7;
	});

	// 7.1.1 ToPrimitive(input [, PreferredType])

	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var _toPrimitive = function _toPrimitive(it, S) {
	  if (!_isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var dP = Object.defineProperty;

	var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  _anObject(O);
	  P = _toPrimitive(P, true);
	  _anObject(Attributes);
	  if (_ie8DomDefine) try {
	    return dP(O, P, Attributes);
	  } catch (e) {/* empty */}
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

	var _objectDp = {
	  f: f
	};

	var _propertyDesc = function _propertyDesc(bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var _hide = _descriptors ? function (object, key, value) {
	  return _objectDp.f(object, key, _propertyDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var hasOwnProperty = {}.hasOwnProperty;
	var _has = function _has(it, key) {
	  return hasOwnProperty.call(it, key);
	};

	var id = 0;
	var px = Math.random();
	var _uid = function _uid(key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

	var _redefine = createCommonjsModule(function (module) {
	  var SRC = _uid('src');
	  var TO_STRING = 'toString';
	  var $toString = Function[TO_STRING];
	  var TPL = ('' + $toString).split(TO_STRING);

	  _core.inspectSource = function (it) {
	    return $toString.call(it);
	  };

	  (module.exports = function (O, key, val, safe) {
	    var isFunction = typeof val == 'function';
	    if (isFunction) _has(val, 'name') || _hide(val, 'name', key);
	    if (O[key] === val) return;
	    if (isFunction) _has(val, SRC) || _hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
	    if (O === _global) {
	      O[key] = val;
	    } else if (!safe) {
	      delete O[key];
	      _hide(O, key, val);
	    } else if (O[key]) {
	      O[key] = val;
	    } else {
	      _hide(O, key, val);
	    }
	    // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	  })(Function.prototype, TO_STRING, function toString() {
	    return typeof this == 'function' && this[SRC] || $toString.call(this);
	  });
	});

	var _aFunction = function _aFunction(it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};

	// optional / simple context binding

	var _ctx = function _ctx(fn, that, length) {
	  _aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1:
	      return function (a) {
	        return fn.call(that, a);
	      };
	    case 2:
	      return function (a, b) {
	        return fn.call(that, a, b);
	      };
	    case 3:
	      return function (a, b, c) {
	        return fn.call(that, a, b, c);
	      };
	  }
	  return function () /* ...args */{
	    return fn.apply(that, arguments);
	  };
	};

	var PROTOTYPE = 'prototype';

	var $export = function $export(type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] || (_global[name] = {}) : (_global[name] || {})[PROTOTYPE];
	  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
	  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
	  var key, own, out, exp;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    // export native or passed
	    out = (own ? target : source)[key];
	    // bind timers to global for call from export context
	    exp = IS_BIND && own ? _ctx(out, _global) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
	    // extend global
	    if (target) _redefine(target, key, out, type & $export.U);
	    // export
	    if (exports[key] != out) _hide(exports, key, exp);
	    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
	  }
	};
	_global.core = _core;
	// type bitmap
	$export.F = 1; // forced
	$export.G = 2; // global
	$export.S = 4; // static
	$export.P = 8; // proto
	$export.B = 16; // bind
	$export.W = 32; // wrap
	$export.U = 64; // safe
	$export.R = 128; // real proto method for `library`
	var _export = $export;

	var TYPED = _uid('typed_array');
	var VIEW = _uid('view');
	var ABV = !!(_global.ArrayBuffer && _global.DataView);
	var CONSTR = ABV;
	var i = 0;
	var l = 9;
	var Typed;

	var TypedArrayConstructors = 'Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array'.split(',');

	while (i < l) {
	  if (Typed = _global[TypedArrayConstructors[i++]]) {
	    _hide(Typed.prototype, TYPED, true);
	    _hide(Typed.prototype, VIEW, true);
	  } else CONSTR = false;
	}

	var _typed = {
	  ABV: ABV,
	  CONSTR: CONSTR,
	  TYPED: TYPED,
	  VIEW: VIEW
	};

	var _library = false;

	var _redefineAll = function _redefineAll(target, src, safe) {
	  for (var key in src) {
	    _redefine(target, key, src[key], safe);
	  }return target;
	};

	var _anInstance = function _anInstance(it, Constructor, name, forbiddenField) {
	  if (!(it instanceof Constructor) || forbiddenField !== undefined && forbiddenField in it) {
	    throw TypeError(name + ': incorrect invocation!');
	  }return it;
	};

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	var _toInteger = function _toInteger(it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

	// 7.1.15 ToLength

	var min = Math.min;
	var _toLength = function _toLength(it) {
	  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

	// https://tc39.github.io/ecma262/#sec-toindex


	var _toIndex = function _toIndex(it) {
	  if (it === undefined) return 0;
	  var number = _toInteger(it);
	  var length = _toLength(number);
	  if (number !== length) throw RangeError('Wrong length!');
	  return length;
	};

	var toString = {}.toString;

	var _cof = function _cof(it) {
	  return toString.call(it).slice(8, -1);
	};

	// fallback for non-array-like ES3 and non-enumerable old V8 strings

	// eslint-disable-next-line no-prototype-builtins
	var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return _cof(it) == 'String' ? it.split('') : Object(it);
	};

	// 7.2.1 RequireObjectCoercible(argument)
	var _defined = function _defined(it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};

	// to indexed object, toObject with fallback for non-array-like ES3 strings


	var _toIobject = function _toIobject(it) {
	  return _iobject(_defined(it));
	};

	var max = Math.max;
	var min$1 = Math.min;
	var _toAbsoluteIndex = function _toAbsoluteIndex(index, length) {
	  index = _toInteger(index);
	  return index < 0 ? max(index + length, 0) : min$1(index, length);
	};

	// false -> Array#indexOf
	// true  -> Array#includes


	var _arrayIncludes = function _arrayIncludes(IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = _toIobject($this);
	    var length = _toLength(O.length);
	    var index = _toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	      // Array#indexOf ignores holes, Array#includes - not
	    } else for (; length > index; index++) {
	      if (IS_INCLUDES || index in O) {
	        if (O[index] === el) return IS_INCLUDES || index || 0;
	      }
	    }return !IS_INCLUDES && -1;
	  };
	};

	var SHARED = '__core-js_shared__';
	var store = _global[SHARED] || (_global[SHARED] = {});
	var _shared = function _shared(key) {
	  return store[key] || (store[key] = {});
	};

	var shared = _shared('keys');

	var _sharedKey = function _sharedKey(key) {
	  return shared[key] || (shared[key] = _uid(key));
	};

	var arrayIndexOf = _arrayIncludes(false);
	var IE_PROTO = _sharedKey('IE_PROTO');

	var _objectKeysInternal = function _objectKeysInternal(object, names) {
	  var O = _toIobject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) {
	    if (key != IE_PROTO) _has(O, key) && result.push(key);
	  } // Don't enum bug & hidden keys
	  while (names.length > i) {
	    if (_has(O, key = names[i++])) {
	      ~arrayIndexOf(result, key) || result.push(key);
	    }
	  }return result;
	};

	// IE 8- don't enum bug keys
	var _enumBugKeys = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');

	// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)

	var hiddenKeys = _enumBugKeys.concat('length', 'prototype');

	var f$1 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return _objectKeysInternal(O, hiddenKeys);
	};

	var _objectGopn = {
	  f: f$1
	};

	// 7.1.13 ToObject(argument)

	var _toObject = function _toObject(it) {
	  return Object(_defined(it));
	};

	var _arrayFill = function fill(value /* , start = 0, end = @length */) {
	  var O = _toObject(this);
	  var length = _toLength(O.length);
	  var aLen = arguments.length;
	  var index = _toAbsoluteIndex(aLen > 1 ? arguments[1] : undefined, length);
	  var end = aLen > 2 ? arguments[2] : undefined;
	  var endPos = end === undefined ? length : _toAbsoluteIndex(end, length);
	  while (endPos > index) {
	    O[index++] = value;
	  }return O;
	};

	var _wks = createCommonjsModule(function (module) {
	  var store = _shared('wks');

	  var _Symbol = _global.Symbol;
	  var USE_SYMBOL = typeof _Symbol == 'function';

	  var $exports = module.exports = function (name) {
	    return store[name] || (store[name] = USE_SYMBOL && _Symbol[name] || (USE_SYMBOL ? _Symbol : _uid)('Symbol.' + name));
	  };

	  $exports.store = store;
	});

	var def = _objectDp.f;

	var TAG = _wks('toStringTag');

	var _setToStringTag = function _setToStringTag(it, tag, stat) {
	  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
	};

	var _typedBuffer = createCommonjsModule(function (module, exports) {

	  var gOPN = _objectGopn.f;
	  var dP = _objectDp.f;

	  var ARRAY_BUFFER = 'ArrayBuffer';
	  var DATA_VIEW = 'DataView';
	  var PROTOTYPE = 'prototype';
	  var WRONG_LENGTH = 'Wrong length!';
	  var WRONG_INDEX = 'Wrong index!';
	  var $ArrayBuffer = _global[ARRAY_BUFFER];
	  var $DataView = _global[DATA_VIEW];
	  var Math = _global.Math;
	  var RangeError = _global.RangeError;
	  // eslint-disable-next-line no-shadow-restricted-names
	  var Infinity = _global.Infinity;
	  var BaseBuffer = $ArrayBuffer;
	  var abs = Math.abs;
	  var pow = Math.pow;
	  var floor = Math.floor;
	  var log = Math.log;
	  var LN2 = Math.LN2;
	  var BUFFER = 'buffer';
	  var BYTE_LENGTH = 'byteLength';
	  var BYTE_OFFSET = 'byteOffset';
	  var $BUFFER = _descriptors ? '_b' : BUFFER;
	  var $LENGTH = _descriptors ? '_l' : BYTE_LENGTH;
	  var $OFFSET = _descriptors ? '_o' : BYTE_OFFSET;

	  // IEEE754 conversions based on https://github.com/feross/ieee754
	  function packIEEE754(value, mLen, nBytes) {
	    var buffer = new Array(nBytes);
	    var eLen = nBytes * 8 - mLen - 1;
	    var eMax = (1 << eLen) - 1;
	    var eBias = eMax >> 1;
	    var rt = mLen === 23 ? pow(2, -24) - pow(2, -77) : 0;
	    var i = 0;
	    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
	    var e, m, c;
	    value = abs(value);
	    // eslint-disable-next-line no-self-compare
	    if (value != value || value === Infinity) {
	      // eslint-disable-next-line no-self-compare
	      m = value != value ? 1 : 0;
	      e = eMax;
	    } else {
	      e = floor(log(value) / LN2);
	      if (value * (c = pow(2, -e)) < 1) {
	        e--;
	        c *= 2;
	      }
	      if (e + eBias >= 1) {
	        value += rt / c;
	      } else {
	        value += rt * pow(2, 1 - eBias);
	      }
	      if (value * c >= 2) {
	        e++;
	        c /= 2;
	      }
	      if (e + eBias >= eMax) {
	        m = 0;
	        e = eMax;
	      } else if (e + eBias >= 1) {
	        m = (value * c - 1) * pow(2, mLen);
	        e = e + eBias;
	      } else {
	        m = value * pow(2, eBias - 1) * pow(2, mLen);
	        e = 0;
	      }
	    }
	    for (; mLen >= 8; buffer[i++] = m & 255, m /= 256, mLen -= 8) {}
	    e = e << mLen | m;
	    eLen += mLen;
	    for (; eLen > 0; buffer[i++] = e & 255, e /= 256, eLen -= 8) {}
	    buffer[--i] |= s * 128;
	    return buffer;
	  }
	  function unpackIEEE754(buffer, mLen, nBytes) {
	    var eLen = nBytes * 8 - mLen - 1;
	    var eMax = (1 << eLen) - 1;
	    var eBias = eMax >> 1;
	    var nBits = eLen - 7;
	    var i = nBytes - 1;
	    var s = buffer[i--];
	    var e = s & 127;
	    var m;
	    s >>= 7;
	    for (; nBits > 0; e = e * 256 + buffer[i], i--, nBits -= 8) {}
	    m = e & (1 << -nBits) - 1;
	    e >>= -nBits;
	    nBits += mLen;
	    for (; nBits > 0; m = m * 256 + buffer[i], i--, nBits -= 8) {}
	    if (e === 0) {
	      e = 1 - eBias;
	    } else if (e === eMax) {
	      return m ? NaN : s ? -Infinity : Infinity;
	    } else {
	      m = m + pow(2, mLen);
	      e = e - eBias;
	    }return (s ? -1 : 1) * m * pow(2, e - mLen);
	  }

	  function unpackI32(bytes) {
	    return bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
	  }
	  function packI8(it) {
	    return [it & 0xff];
	  }
	  function packI16(it) {
	    return [it & 0xff, it >> 8 & 0xff];
	  }
	  function packI32(it) {
	    return [it & 0xff, it >> 8 & 0xff, it >> 16 & 0xff, it >> 24 & 0xff];
	  }
	  function packF64(it) {
	    return packIEEE754(it, 52, 8);
	  }
	  function packF32(it) {
	    return packIEEE754(it, 23, 4);
	  }

	  function addGetter(C, key, internal) {
	    dP(C[PROTOTYPE], key, { get: function get() {
	        return this[internal];
	      } });
	  }

	  function get(view, bytes, index, isLittleEndian) {
	    var numIndex = +index;
	    var intIndex = _toIndex(numIndex);
	    if (intIndex + bytes > view[$LENGTH]) throw RangeError(WRONG_INDEX);
	    var store = view[$BUFFER]._b;
	    var start = intIndex + view[$OFFSET];
	    var pack = store.slice(start, start + bytes);
	    return isLittleEndian ? pack : pack.reverse();
	  }
	  function set(view, bytes, index, conversion, value, isLittleEndian) {
	    var numIndex = +index;
	    var intIndex = _toIndex(numIndex);
	    if (intIndex + bytes > view[$LENGTH]) throw RangeError(WRONG_INDEX);
	    var store = view[$BUFFER]._b;
	    var start = intIndex + view[$OFFSET];
	    var pack = conversion(+value);
	    for (var i = 0; i < bytes; i++) {
	      store[start + i] = pack[isLittleEndian ? i : bytes - i - 1];
	    }
	  }

	  if (!_typed.ABV) {
	    $ArrayBuffer = function ArrayBuffer(length) {
	      _anInstance(this, $ArrayBuffer, ARRAY_BUFFER);
	      var byteLength = _toIndex(length);
	      this._b = _arrayFill.call(new Array(byteLength), 0);
	      this[$LENGTH] = byteLength;
	    };

	    $DataView = function DataView(buffer, byteOffset, byteLength) {
	      _anInstance(this, $DataView, DATA_VIEW);
	      _anInstance(buffer, $ArrayBuffer, DATA_VIEW);
	      var bufferLength = buffer[$LENGTH];
	      var offset = _toInteger(byteOffset);
	      if (offset < 0 || offset > bufferLength) throw RangeError('Wrong offset!');
	      byteLength = byteLength === undefined ? bufferLength - offset : _toLength(byteLength);
	      if (offset + byteLength > bufferLength) throw RangeError(WRONG_LENGTH);
	      this[$BUFFER] = buffer;
	      this[$OFFSET] = offset;
	      this[$LENGTH] = byteLength;
	    };

	    if (_descriptors) {
	      addGetter($ArrayBuffer, BYTE_LENGTH, '_l');
	      addGetter($DataView, BUFFER, '_b');
	      addGetter($DataView, BYTE_LENGTH, '_l');
	      addGetter($DataView, BYTE_OFFSET, '_o');
	    }

	    _redefineAll($DataView[PROTOTYPE], {
	      getInt8: function getInt8(byteOffset) {
	        return get(this, 1, byteOffset)[0] << 24 >> 24;
	      },
	      getUint8: function getUint8(byteOffset) {
	        return get(this, 1, byteOffset)[0];
	      },
	      getInt16: function getInt16(byteOffset /* , littleEndian */) {
	        var bytes = get(this, 2, byteOffset, arguments[1]);
	        return (bytes[1] << 8 | bytes[0]) << 16 >> 16;
	      },
	      getUint16: function getUint16(byteOffset /* , littleEndian */) {
	        var bytes = get(this, 2, byteOffset, arguments[1]);
	        return bytes[1] << 8 | bytes[0];
	      },
	      getInt32: function getInt32(byteOffset /* , littleEndian */) {
	        return unpackI32(get(this, 4, byteOffset, arguments[1]));
	      },
	      getUint32: function getUint32(byteOffset /* , littleEndian */) {
	        return unpackI32(get(this, 4, byteOffset, arguments[1])) >>> 0;
	      },
	      getFloat32: function getFloat32(byteOffset /* , littleEndian */) {
	        return unpackIEEE754(get(this, 4, byteOffset, arguments[1]), 23, 4);
	      },
	      getFloat64: function getFloat64(byteOffset /* , littleEndian */) {
	        return unpackIEEE754(get(this, 8, byteOffset, arguments[1]), 52, 8);
	      },
	      setInt8: function setInt8(byteOffset, value) {
	        set(this, 1, byteOffset, packI8, value);
	      },
	      setUint8: function setUint8(byteOffset, value) {
	        set(this, 1, byteOffset, packI8, value);
	      },
	      setInt16: function setInt16(byteOffset, value /* , littleEndian */) {
	        set(this, 2, byteOffset, packI16, value, arguments[2]);
	      },
	      setUint16: function setUint16(byteOffset, value /* , littleEndian */) {
	        set(this, 2, byteOffset, packI16, value, arguments[2]);
	      },
	      setInt32: function setInt32(byteOffset, value /* , littleEndian */) {
	        set(this, 4, byteOffset, packI32, value, arguments[2]);
	      },
	      setUint32: function setUint32(byteOffset, value /* , littleEndian */) {
	        set(this, 4, byteOffset, packI32, value, arguments[2]);
	      },
	      setFloat32: function setFloat32(byteOffset, value /* , littleEndian */) {
	        set(this, 4, byteOffset, packF32, value, arguments[2]);
	      },
	      setFloat64: function setFloat64(byteOffset, value /* , littleEndian */) {
	        set(this, 8, byteOffset, packF64, value, arguments[2]);
	      }
	    });
	  } else {
	    if (!_fails(function () {
	      $ArrayBuffer(1);
	    }) || !_fails(function () {
	      new $ArrayBuffer(-1); // eslint-disable-line no-new
	    }) || _fails(function () {
	      new $ArrayBuffer(); // eslint-disable-line no-new
	      new $ArrayBuffer(1.5); // eslint-disable-line no-new
	      new $ArrayBuffer(NaN); // eslint-disable-line no-new
	      return $ArrayBuffer.name != ARRAY_BUFFER;
	    })) {
	      $ArrayBuffer = function ArrayBuffer(length) {
	        _anInstance(this, $ArrayBuffer);
	        return new BaseBuffer(_toIndex(length));
	      };
	      var ArrayBufferProto = $ArrayBuffer[PROTOTYPE] = BaseBuffer[PROTOTYPE];
	      for (var keys = gOPN(BaseBuffer), j = 0, key; keys.length > j;) {
	        if (!((key = keys[j++]) in $ArrayBuffer)) _hide($ArrayBuffer, key, BaseBuffer[key]);
	      }
	      if (!_library) ArrayBufferProto.constructor = $ArrayBuffer;
	    }
	    // iOS Safari 7.x bug
	    var view = new $DataView(new $ArrayBuffer(2));
	    var $setInt8 = $DataView[PROTOTYPE].setInt8;
	    view.setInt8(0, 2147483648);
	    view.setInt8(1, 2147483649);
	    if (view.getInt8(0) || !view.getInt8(1)) _redefineAll($DataView[PROTOTYPE], {
	      setInt8: function setInt8(byteOffset, value) {
	        $setInt8.call(this, byteOffset, value << 24 >> 24);
	      },
	      setUint8: function setUint8(byteOffset, value) {
	        $setInt8.call(this, byteOffset, value << 24 >> 24);
	      }
	    }, true);
	  }
	  _setToStringTag($ArrayBuffer, ARRAY_BUFFER);
	  _setToStringTag($DataView, DATA_VIEW);
	  _hide($DataView[PROTOTYPE], _typed.VIEW, true);
	  exports[ARRAY_BUFFER] = $ArrayBuffer;
	  exports[DATA_VIEW] = $DataView;
	});

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)


	var SPECIES = _wks('species');
	var _speciesConstructor = function _speciesConstructor(O, D) {
	  var C = _anObject(O).constructor;
	  var S;
	  return C === undefined || (S = _anObject(C)[SPECIES]) == undefined ? D : _aFunction(S);
	};

	var SPECIES$1 = _wks('species');

	var _setSpecies = function _setSpecies(KEY) {
	  var C = _global[KEY];
	  if (_descriptors && C && !C[SPECIES$1]) _objectDp.f(C, SPECIES$1, {
	    configurable: true,
	    get: function get() {
	      return this;
	    }
	  });
	};

	var ArrayBuffer$1 = _global.ArrayBuffer;

	var $ArrayBuffer = _typedBuffer.ArrayBuffer;
	var $DataView = _typedBuffer.DataView;
	var $isView = _typed.ABV && ArrayBuffer$1.isView;
	var $slice = $ArrayBuffer.prototype.slice;
	var VIEW$1 = _typed.VIEW;
	var ARRAY_BUFFER = 'ArrayBuffer';

	_export(_export.G + _export.W + _export.F * (ArrayBuffer$1 !== $ArrayBuffer), { ArrayBuffer: $ArrayBuffer });

	_export(_export.S + _export.F * !_typed.CONSTR, ARRAY_BUFFER, {
	  // 24.1.3.1 ArrayBuffer.isView(arg)
	  isView: function isView(it) {
	    return $isView && $isView(it) || _isObject(it) && VIEW$1 in it;
	  }
	});

	_export(_export.P + _export.U + _export.F * _fails(function () {
	  return !new $ArrayBuffer(2).slice(1, undefined).byteLength;
	}), ARRAY_BUFFER, {
	  // 24.1.4.3 ArrayBuffer.prototype.slice(start, end)
	  slice: function slice(start, end) {
	    if ($slice !== undefined && end === undefined) return $slice.call(_anObject(this), start); // FF fix
	    var len = _anObject(this).byteLength;
	    var first = _toAbsoluteIndex(start, len);
	    var final = _toAbsoluteIndex(end === undefined ? len : end, len);
	    var result = new (_speciesConstructor(this, $ArrayBuffer))(_toLength(final - first));
	    var viewS = new $DataView(this);
	    var viewT = new $DataView(result);
	    var index = 0;
	    while (first < final) {
	      viewT.setUint8(index++, viewS.getUint8(first++));
	    }return result;
	  }
	});

	_setSpecies(ARRAY_BUFFER);

	_export(_export.G + _export.W + _export.F * !_typed.ABV, {
	  DataView: _typedBuffer.DataView
	});

	// getting tag from 19.1.3.6 Object.prototype.toString()

	var TAG$1 = _wks('toStringTag');
	// ES3 wrong here
	var ARG = _cof(function () {
	  return arguments;
	}()) == 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function tryGet(it, key) {
	  try {
	    return it[key];
	  } catch (e) {/* empty */}
	};

	var _classof = function _classof(it) {
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	  // @@toStringTag case
	  : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
	  // builtinTag case
	  : ARG ? _cof(O)
	  // ES3 arguments fallback
	  : (B = _cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

	var _iterators = {};

	// check on default Array iterator

	var ITERATOR = _wks('iterator');
	var ArrayProto = Array.prototype;

	var _isArrayIter = function _isArrayIter(it) {
	  return it !== undefined && (_iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)


	var _objectKeys = Object.keys || function keys(O) {
	  return _objectKeysInternal(O, _enumBugKeys);
	};

	var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  _anObject(O);
	  var keys = _objectKeys(Properties);
	  var length = keys.length;
	  var i = 0;
	  var P;
	  while (length > i) {
	    _objectDp.f(O, P = keys[i++], Properties[P]);
	  }return O;
	};

	var document$2 = _global.document;
	var _html = document$2 && document$2.documentElement;

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])


	var IE_PROTO$1 = _sharedKey('IE_PROTO');
	var Empty = function Empty() {/* empty */};
	var PROTOTYPE$1 = 'prototype';

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var _createDict = function createDict() {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = _domCreate('iframe');
	  var i = _enumBugKeys.length;
	  var lt = '<';
	  var gt = '>';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  _html.appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  _createDict = iframeDocument.F;
	  while (i--) {
	    delete _createDict[PROTOTYPE$1][_enumBugKeys[i]];
	  }return _createDict();
	};

	var _objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    Empty[PROTOTYPE$1] = _anObject(O);
	    result = new Empty();
	    Empty[PROTOTYPE$1] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO$1] = O;
	  } else result = _createDict();
	  return Properties === undefined ? result : _objectDps(result, Properties);
	};

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


	var IE_PROTO$2 = _sharedKey('IE_PROTO');
	var ObjectProto = Object.prototype;

	var _objectGpo = Object.getPrototypeOf || function (O) {
	  O = _toObject(O);
	  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  }return O instanceof Object ? ObjectProto : null;
	};

	var ITERATOR$1 = _wks('iterator');

	var core_getIteratorMethod = _core.getIteratorMethod = function (it) {
	  if (it != undefined) return it[ITERATOR$1] || it['@@iterator'] || _iterators[_classof(it)];
	};

	// 7.2.2 IsArray(argument)

	var _isArray = Array.isArray || function isArray(arg) {
	  return _cof(arg) == 'Array';
	};

	var SPECIES$2 = _wks('species');

	var _arraySpeciesConstructor = function _arraySpeciesConstructor(original) {
	  var C;
	  if (_isArray(original)) {
	    C = original.constructor;
	    // cross-realm fallback
	    if (typeof C == 'function' && (C === Array || _isArray(C.prototype))) C = undefined;
	    if (_isObject(C)) {
	      C = C[SPECIES$2];
	      if (C === null) C = undefined;
	    }
	  }return C === undefined ? Array : C;
	};

	// 9.4.2.3 ArraySpeciesCreate(originalArray, length)


	var _arraySpeciesCreate = function _arraySpeciesCreate(original, length) {
	  return new (_arraySpeciesConstructor(original))(length);
	};

	// 0 -> Array#forEach
	// 1 -> Array#map
	// 2 -> Array#filter
	// 3 -> Array#some
	// 4 -> Array#every
	// 5 -> Array#find
	// 6 -> Array#findIndex


	var _arrayMethods = function _arrayMethods(TYPE, $create) {
	  var IS_MAP = TYPE == 1;
	  var IS_FILTER = TYPE == 2;
	  var IS_SOME = TYPE == 3;
	  var IS_EVERY = TYPE == 4;
	  var IS_FIND_INDEX = TYPE == 6;
	  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
	  var create = $create || _arraySpeciesCreate;
	  return function ($this, callbackfn, that) {
	    var O = _toObject($this);
	    var self = _iobject(O);
	    var f = _ctx(callbackfn, that, 3);
	    var length = _toLength(self.length);
	    var index = 0;
	    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
	    var val, res;
	    for (; length > index; index++) {
	      if (NO_HOLES || index in self) {
	        val = self[index];
	        res = f(val, index, O);
	        if (TYPE) {
	          if (IS_MAP) result[index] = res; // map
	          else if (res) switch (TYPE) {
	              case 3:
	                return true; // some
	              case 5:
	                return val; // find
	              case 6:
	                return index; // findIndex
	              case 2:
	                result.push(val); // filter
	            } else if (IS_EVERY) return false; // every
	        }
	      }
	    }return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
	  };
	};

	// 22.1.3.31 Array.prototype[@@unscopables]
	var UNSCOPABLES = _wks('unscopables');
	var ArrayProto$1 = Array.prototype;
	if (ArrayProto$1[UNSCOPABLES] == undefined) _hide(ArrayProto$1, UNSCOPABLES, {});
	var _addToUnscopables = function _addToUnscopables(key) {
	  ArrayProto$1[UNSCOPABLES][key] = true;
	};

	var _iterStep = function _iterStep(done, value) {
	  return { value: value, done: !!done };
	};

	var IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	_hide(IteratorPrototype, _wks('iterator'), function () {
	  return this;
	});

	var _iterCreate = function _iterCreate(Constructor, NAME, next) {
	  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
	  _setToStringTag(Constructor, NAME + ' Iterator');
	};

	var ITERATOR$2 = _wks('iterator');
	var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
	var FF_ITERATOR = '@@iterator';
	var KEYS = 'keys';
	var VALUES = 'values';

	var returnThis = function returnThis() {
	  return this;
	};

	var _iterDefine = function _iterDefine(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
	  _iterCreate(Constructor, NAME, next);
	  var getMethod = function getMethod(kind) {
	    if (!BUGGY && kind in proto) return proto[kind];
	    switch (kind) {
	      case KEYS:
	        return function keys() {
	          return new Constructor(this, kind);
	        };
	      case VALUES:
	        return function values() {
	          return new Constructor(this, kind);
	        };
	    }return function entries() {
	      return new Constructor(this, kind);
	    };
	  };
	  var TAG = NAME + ' Iterator';
	  var DEF_VALUES = DEFAULT == VALUES;
	  var VALUES_BUG = false;
	  var proto = Base.prototype;
	  var $native = proto[ITERATOR$2] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
	  var $default = !BUGGY && $native || getMethod(DEFAULT);
	  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
	  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
	  var methods, key, IteratorPrototype;
	  // Fix native
	  if ($anyNative) {
	    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
	    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
	      // Set @@toStringTag to native iterators
	      _setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if (!_library && !_has(IteratorPrototype, ITERATOR$2)) _hide(IteratorPrototype, ITERATOR$2, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if (DEF_VALUES && $native && $native.name !== VALUES) {
	    VALUES_BUG = true;
	    $default = function values() {
	      return $native.call(this);
	    };
	  }
	  // Define iterator
	  if ((!_library || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR$2])) {
	    _hide(proto, ITERATOR$2, $default);
	  }
	  // Plug for library
	  _iterators[NAME] = $default;
	  _iterators[TAG] = returnThis;
	  if (DEFAULT) {
	    methods = {
	      values: DEF_VALUES ? $default : getMethod(VALUES),
	      keys: IS_SET ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if (FORCED) for (key in methods) {
	      if (!(key in proto)) _redefine(proto, key, methods[key]);
	    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
	  this._t = _toIobject(iterated); // target
	  this._i = 0; // next index
	  this._k = kind; // kind
	  // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var kind = this._k;
	  var index = this._i++;
	  if (!O || index >= O.length) {
	    this._t = undefined;
	    return _iterStep(1);
	  }
	  if (kind == 'keys') return _iterStep(0, index);
	  if (kind == 'values') return _iterStep(0, O[index]);
	  return _iterStep(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	_iterators.Arguments = _iterators.Array;

	_addToUnscopables('keys');
	_addToUnscopables('values');
	_addToUnscopables('entries');

	var ITERATOR$3 = _wks('iterator');
	var SAFE_CLOSING = false;

	try {
	  var riter = [7][ITERATOR$3]();
	  riter['return'] = function () {
	    SAFE_CLOSING = true;
	  };
	} catch (e) {/* empty */}

	var _iterDetect = function _iterDetect(exec, skipClosing) {
	  if (!skipClosing && !SAFE_CLOSING) return false;
	  var safe = false;
	  try {
	    var arr = [7];
	    var iter = arr[ITERATOR$3]();
	    iter.next = function () {
	      return { done: safe = true };
	    };
	    arr[ITERATOR$3] = function () {
	      return iter;
	    };
	    exec(arr);
	  } catch (e) {/* empty */}
	  return safe;
	};

	var _arrayCopyWithin = [].copyWithin || function copyWithin(target /* = 0 */, start /* = 0, end = @length */) {
	  var O = _toObject(this);
	  var len = _toLength(O.length);
	  var to = _toAbsoluteIndex(target, len);
	  var from = _toAbsoluteIndex(start, len);
	  var end = arguments.length > 2 ? arguments[2] : undefined;
	  var count = Math.min((end === undefined ? len : _toAbsoluteIndex(end, len)) - from, len - to);
	  var inc = 1;
	  if (from < to && to < from + count) {
	    inc = -1;
	    from += count - 1;
	    to += count - 1;
	  }
	  while (count-- > 0) {
	    if (from in O) O[to] = O[from];else delete O[to];
	    to += inc;
	    from += inc;
	  }return O;
	};

	var f$2 = {}.propertyIsEnumerable;

	var _objectPie = {
		f: f$2
	};

	var gOPD = Object.getOwnPropertyDescriptor;

	var f$3 = _descriptors ? gOPD : function getOwnPropertyDescriptor(O, P) {
	  O = _toIobject(O);
	  P = _toPrimitive(P, true);
	  if (_ie8DomDefine) try {
	    return gOPD(O, P);
	  } catch (e) {/* empty */}
	  if (_has(O, P)) return _propertyDesc(!_objectPie.f.call(O, P), O[P]);
	};

	var _objectGopd = {
	  f: f$3
	};

	var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _typedArray = createCommonjsModule(function (module) {

	  if (_descriptors) {
	    var LIBRARY = _library;
	    var global = _global;
	    var fails = _fails;
	    var $export = _export;
	    var $typed = _typed;
	    var $buffer = _typedBuffer;
	    var ctx = _ctx;
	    var anInstance = _anInstance;
	    var propertyDesc = _propertyDesc;
	    var hide = _hide;
	    var redefineAll = _redefineAll;
	    var toInteger = _toInteger;
	    var toLength = _toLength;
	    var toIndex = _toIndex;
	    var toAbsoluteIndex = _toAbsoluteIndex;
	    var toPrimitive = _toPrimitive;
	    var has = _has;
	    var classof = _classof;
	    var isObject = _isObject;
	    var toObject = _toObject;
	    var isArrayIter = _isArrayIter;
	    var create = _objectCreate;
	    var getPrototypeOf = _objectGpo;
	    var gOPN = _objectGopn.f;
	    var getIterFn = core_getIteratorMethod;
	    var uid = _uid;
	    var wks = _wks;
	    var createArrayMethod = _arrayMethods;
	    var createArrayIncludes = _arrayIncludes;
	    var speciesConstructor = _speciesConstructor;
	    var ArrayIterators = es6_array_iterator;
	    var Iterators = _iterators;
	    var $iterDetect = _iterDetect;
	    var setSpecies = _setSpecies;
	    var arrayFill = _arrayFill;
	    var arrayCopyWithin = _arrayCopyWithin;
	    var $DP = _objectDp;
	    var $GOPD = _objectGopd;
	    var dP = $DP.f;
	    var gOPD = $GOPD.f;
	    var RangeError = global.RangeError;
	    var TypeError = global.TypeError;
	    var Uint8Array = global.Uint8Array;
	    var ARRAY_BUFFER = 'ArrayBuffer';
	    var SHARED_BUFFER = 'Shared' + ARRAY_BUFFER;
	    var BYTES_PER_ELEMENT = 'BYTES_PER_ELEMENT';
	    var PROTOTYPE = 'prototype';
	    var ArrayProto = Array[PROTOTYPE];
	    var $ArrayBuffer = $buffer.ArrayBuffer;
	    var $DataView = $buffer.DataView;
	    var arrayForEach = createArrayMethod(0);
	    var arrayFilter = createArrayMethod(2);
	    var arraySome = createArrayMethod(3);
	    var arrayEvery = createArrayMethod(4);
	    var arrayFind = createArrayMethod(5);
	    var arrayFindIndex = createArrayMethod(6);
	    var arrayIncludes = createArrayIncludes(true);
	    var arrayIndexOf = createArrayIncludes(false);
	    var arrayValues = ArrayIterators.values;
	    var arrayKeys = ArrayIterators.keys;
	    var arrayEntries = ArrayIterators.entries;
	    var arrayLastIndexOf = ArrayProto.lastIndexOf;
	    var arrayReduce = ArrayProto.reduce;
	    var arrayReduceRight = ArrayProto.reduceRight;
	    var arrayJoin = ArrayProto.join;
	    var arraySort = ArrayProto.sort;
	    var arraySlice = ArrayProto.slice;
	    var arrayToString = ArrayProto.toString;
	    var arrayToLocaleString = ArrayProto.toLocaleString;
	    var ITERATOR = wks('iterator');
	    var TAG = wks('toStringTag');
	    var TYPED_CONSTRUCTOR = uid('typed_constructor');
	    var DEF_CONSTRUCTOR = uid('def_constructor');
	    var ALL_CONSTRUCTORS = $typed.CONSTR;
	    var TYPED_ARRAY = $typed.TYPED;
	    var VIEW = $typed.VIEW;
	    var WRONG_LENGTH = 'Wrong length!';

	    var $map = createArrayMethod(1, function (O, length) {
	      return allocate(speciesConstructor(O, O[DEF_CONSTRUCTOR]), length);
	    });

	    var LITTLE_ENDIAN = fails(function () {
	      // eslint-disable-next-line no-undef
	      return new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
	    });

	    var FORCED_SET = !!Uint8Array && !!Uint8Array[PROTOTYPE].set && fails(function () {
	      new Uint8Array(1).set({});
	    });

	    var toOffset = function toOffset(it, BYTES) {
	      var offset = toInteger(it);
	      if (offset < 0 || offset % BYTES) throw RangeError('Wrong offset!');
	      return offset;
	    };

	    var validate = function validate(it) {
	      if (isObject(it) && TYPED_ARRAY in it) return it;
	      throw TypeError(it + ' is not a typed array!');
	    };

	    var allocate = function allocate(C, length) {
	      if (!(isObject(C) && TYPED_CONSTRUCTOR in C)) {
	        throw TypeError('It is not a typed array constructor!');
	      }return new C(length);
	    };

	    var speciesFromList = function speciesFromList(O, list) {
	      return fromList(speciesConstructor(O, O[DEF_CONSTRUCTOR]), list);
	    };

	    var fromList = function fromList(C, list) {
	      var index = 0;
	      var length = list.length;
	      var result = allocate(C, length);
	      while (length > index) {
	        result[index] = list[index++];
	      }return result;
	    };

	    var addGetter = function addGetter(it, key, internal) {
	      dP(it, key, { get: function get() {
	          return this._d[internal];
	        } });
	    };

	    var $from = function from(source /* , mapfn, thisArg */) {
	      var O = toObject(source);
	      var aLen = arguments.length;
	      var mapfn = aLen > 1 ? arguments[1] : undefined;
	      var mapping = mapfn !== undefined;
	      var iterFn = getIterFn(O);
	      var i, length, values, result, step, iterator;
	      if (iterFn != undefined && !isArrayIter(iterFn)) {
	        for (iterator = iterFn.call(O), values = [], i = 0; !(step = iterator.next()).done; i++) {
	          values.push(step.value);
	        }O = values;
	      }
	      if (mapping && aLen > 2) mapfn = ctx(mapfn, arguments[2], 2);
	      for (i = 0, length = toLength(O.length), result = allocate(this, length); length > i; i++) {
	        result[i] = mapping ? mapfn(O[i], i) : O[i];
	      }
	      return result;
	    };

	    var $of = function of() /* ...items */{
	      var index = 0;
	      var length = arguments.length;
	      var result = allocate(this, length);
	      while (length > index) {
	        result[index] = arguments[index++];
	      }return result;
	    };

	    // iOS Safari 6.x fails here
	    var TO_LOCALE_BUG = !!Uint8Array && fails(function () {
	      arrayToLocaleString.call(new Uint8Array(1));
	    });

	    var $toLocaleString = function toLocaleString() {
	      return arrayToLocaleString.apply(TO_LOCALE_BUG ? arraySlice.call(validate(this)) : validate(this), arguments);
	    };

	    var proto = {
	      copyWithin: function copyWithin(target, start /* , end */) {
	        return arrayCopyWithin.call(validate(this), target, start, arguments.length > 2 ? arguments[2] : undefined);
	      },
	      every: function every(callbackfn /* , thisArg */) {
	        return arrayEvery(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      fill: function fill(value /* , start, end */) {
	        // eslint-disable-line no-unused-vars
	        return arrayFill.apply(validate(this), arguments);
	      },
	      filter: function filter(callbackfn /* , thisArg */) {
	        return speciesFromList(this, arrayFilter(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined));
	      },
	      find: function find(predicate /* , thisArg */) {
	        return arrayFind(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      findIndex: function findIndex(predicate /* , thisArg */) {
	        return arrayFindIndex(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      forEach: function forEach(callbackfn /* , thisArg */) {
	        arrayForEach(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      indexOf: function indexOf(searchElement /* , fromIndex */) {
	        return arrayIndexOf(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      includes: function includes(searchElement /* , fromIndex */) {
	        return arrayIncludes(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      join: function join(separator) {
	        // eslint-disable-line no-unused-vars
	        return arrayJoin.apply(validate(this), arguments);
	      },
	      lastIndexOf: function lastIndexOf(searchElement /* , fromIndex */) {
	        // eslint-disable-line no-unused-vars
	        return arrayLastIndexOf.apply(validate(this), arguments);
	      },
	      map: function map(mapfn /* , thisArg */) {
	        return $map(validate(this), mapfn, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      reduce: function reduce(callbackfn /* , initialValue */) {
	        // eslint-disable-line no-unused-vars
	        return arrayReduce.apply(validate(this), arguments);
	      },
	      reduceRight: function reduceRight(callbackfn /* , initialValue */) {
	        // eslint-disable-line no-unused-vars
	        return arrayReduceRight.apply(validate(this), arguments);
	      },
	      reverse: function reverse() {
	        var that = this;
	        var length = validate(that).length;
	        var middle = Math.floor(length / 2);
	        var index = 0;
	        var value;
	        while (index < middle) {
	          value = that[index];
	          that[index++] = that[--length];
	          that[length] = value;
	        }return that;
	      },
	      some: function some(callbackfn /* , thisArg */) {
	        return arraySome(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	      },
	      sort: function sort(comparefn) {
	        return arraySort.call(validate(this), comparefn);
	      },
	      subarray: function subarray(begin, end) {
	        var O = validate(this);
	        var length = O.length;
	        var $begin = toAbsoluteIndex(begin, length);
	        return new (speciesConstructor(O, O[DEF_CONSTRUCTOR]))(O.buffer, O.byteOffset + $begin * O.BYTES_PER_ELEMENT, toLength((end === undefined ? length : toAbsoluteIndex(end, length)) - $begin));
	      }
	    };

	    var $slice = function slice(start, end) {
	      return speciesFromList(this, arraySlice.call(validate(this), start, end));
	    };

	    var $set = function set(arrayLike /* , offset */) {
	      validate(this);
	      var offset = toOffset(arguments[1], 1);
	      var length = this.length;
	      var src = toObject(arrayLike);
	      var len = toLength(src.length);
	      var index = 0;
	      if (len + offset > length) throw RangeError(WRONG_LENGTH);
	      while (index < len) {
	        this[offset + index] = src[index++];
	      }
	    };

	    var $iterators = {
	      entries: function entries() {
	        return arrayEntries.call(validate(this));
	      },
	      keys: function keys() {
	        return arrayKeys.call(validate(this));
	      },
	      values: function values() {
	        return arrayValues.call(validate(this));
	      }
	    };

	    var isTAIndex = function isTAIndex(target, key) {
	      return isObject(target) && target[TYPED_ARRAY] && (typeof key === 'undefined' ? 'undefined' : _typeof$1(key)) != 'symbol' && key in target && String(+key) == String(key);
	    };
	    var $getDesc = function getOwnPropertyDescriptor(target, key) {
	      return isTAIndex(target, key = toPrimitive(key, true)) ? propertyDesc(2, target[key]) : gOPD(target, key);
	    };
	    var $setDesc = function defineProperty(target, key, desc) {
	      if (isTAIndex(target, key = toPrimitive(key, true)) && isObject(desc) && has(desc, 'value') && !has(desc, 'get') && !has(desc, 'set')
	      // TODO: add validation descriptor w/o calling accessors
	      && !desc.configurable && (!has(desc, 'writable') || desc.writable) && (!has(desc, 'enumerable') || desc.enumerable)) {
	        target[key] = desc.value;
	        return target;
	      }return dP(target, key, desc);
	    };

	    if (!ALL_CONSTRUCTORS) {
	      $GOPD.f = $getDesc;
	      $DP.f = $setDesc;
	    }

	    $export($export.S + $export.F * !ALL_CONSTRUCTORS, 'Object', {
	      getOwnPropertyDescriptor: $getDesc,
	      defineProperty: $setDesc
	    });

	    if (fails(function () {
	      arrayToString.call({});
	    })) {
	      arrayToString = arrayToLocaleString = function toString() {
	        return arrayJoin.call(this);
	      };
	    }

	    var $TypedArrayPrototype$ = redefineAll({}, proto);
	    redefineAll($TypedArrayPrototype$, $iterators);
	    hide($TypedArrayPrototype$, ITERATOR, $iterators.values);
	    redefineAll($TypedArrayPrototype$, {
	      slice: $slice,
	      set: $set,
	      constructor: function constructor() {/* noop */},
	      toString: arrayToString,
	      toLocaleString: $toLocaleString
	    });
	    addGetter($TypedArrayPrototype$, 'buffer', 'b');
	    addGetter($TypedArrayPrototype$, 'byteOffset', 'o');
	    addGetter($TypedArrayPrototype$, 'byteLength', 'l');
	    addGetter($TypedArrayPrototype$, 'length', 'e');
	    dP($TypedArrayPrototype$, TAG, {
	      get: function get() {
	        return this[TYPED_ARRAY];
	      }
	    });

	    // eslint-disable-next-line max-statements
	    module.exports = function (KEY, BYTES, wrapper, CLAMPED) {
	      CLAMPED = !!CLAMPED;
	      var NAME = KEY + (CLAMPED ? 'Clamped' : '') + 'Array';
	      var GETTER = 'get' + KEY;
	      var SETTER = 'set' + KEY;
	      var TypedArray = global[NAME];
	      var Base = TypedArray || {};
	      var TAC = TypedArray && getPrototypeOf(TypedArray);
	      var FORCED = !TypedArray || !$typed.ABV;
	      var O = {};
	      var TypedArrayPrototype = TypedArray && TypedArray[PROTOTYPE];
	      var getter = function getter(that, index) {
	        var data = that._d;
	        return data.v[GETTER](index * BYTES + data.o, LITTLE_ENDIAN);
	      };
	      var setter = function setter(that, index, value) {
	        var data = that._d;
	        if (CLAMPED) value = (value = Math.round(value)) < 0 ? 0 : value > 0xff ? 0xff : value & 0xff;
	        data.v[SETTER](index * BYTES + data.o, value, LITTLE_ENDIAN);
	      };
	      var addElement = function addElement(that, index) {
	        dP(that, index, {
	          get: function get() {
	            return getter(this, index);
	          },
	          set: function set(value) {
	            return setter(this, index, value);
	          },
	          enumerable: true
	        });
	      };
	      if (FORCED) {
	        TypedArray = wrapper(function (that, data, $offset, $length) {
	          anInstance(that, TypedArray, NAME, '_d');
	          var index = 0;
	          var offset = 0;
	          var buffer, byteLength, length, klass;
	          if (!isObject(data)) {
	            length = toIndex(data);
	            byteLength = length * BYTES;
	            buffer = new $ArrayBuffer(byteLength);
	          } else if (data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER) {
	            buffer = data;
	            offset = toOffset($offset, BYTES);
	            var $len = data.byteLength;
	            if ($length === undefined) {
	              if ($len % BYTES) throw RangeError(WRONG_LENGTH);
	              byteLength = $len - offset;
	              if (byteLength < 0) throw RangeError(WRONG_LENGTH);
	            } else {
	              byteLength = toLength($length) * BYTES;
	              if (byteLength + offset > $len) throw RangeError(WRONG_LENGTH);
	            }
	            length = byteLength / BYTES;
	          } else if (TYPED_ARRAY in data) {
	            return fromList(TypedArray, data);
	          } else {
	            return $from.call(TypedArray, data);
	          }
	          hide(that, '_d', {
	            b: buffer,
	            o: offset,
	            l: byteLength,
	            e: length,
	            v: new $DataView(buffer)
	          });
	          while (index < length) {
	            addElement(that, index++);
	          }
	        });
	        TypedArrayPrototype = TypedArray[PROTOTYPE] = create($TypedArrayPrototype$);
	        hide(TypedArrayPrototype, 'constructor', TypedArray);
	      } else if (!fails(function () {
	        TypedArray(1);
	      }) || !fails(function () {
	        new TypedArray(-1); // eslint-disable-line no-new
	      }) || !$iterDetect(function (iter) {
	        new TypedArray(); // eslint-disable-line no-new
	        new TypedArray(null); // eslint-disable-line no-new
	        new TypedArray(1.5); // eslint-disable-line no-new
	        new TypedArray(iter); // eslint-disable-line no-new
	      }, true)) {
	        TypedArray = wrapper(function (that, data, $offset, $length) {
	          anInstance(that, TypedArray, NAME);
	          var klass;
	          // `ws` module bug, temporarily remove validation length for Uint8Array
	          // https://github.com/websockets/ws/pull/645
	          if (!isObject(data)) return new Base(toIndex(data));
	          if (data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER) {
	            return $length !== undefined ? new Base(data, toOffset($offset, BYTES), $length) : $offset !== undefined ? new Base(data, toOffset($offset, BYTES)) : new Base(data);
	          }
	          if (TYPED_ARRAY in data) return fromList(TypedArray, data);
	          return $from.call(TypedArray, data);
	        });
	        arrayForEach(TAC !== Function.prototype ? gOPN(Base).concat(gOPN(TAC)) : gOPN(Base), function (key) {
	          if (!(key in TypedArray)) hide(TypedArray, key, Base[key]);
	        });
	        TypedArray[PROTOTYPE] = TypedArrayPrototype;
	        if (!LIBRARY) TypedArrayPrototype.constructor = TypedArray;
	      }
	      var $nativeIterator = TypedArrayPrototype[ITERATOR];
	      var CORRECT_ITER_NAME = !!$nativeIterator && ($nativeIterator.name == 'values' || $nativeIterator.name == undefined);
	      var $iterator = $iterators.values;
	      hide(TypedArray, TYPED_CONSTRUCTOR, true);
	      hide(TypedArrayPrototype, TYPED_ARRAY, NAME);
	      hide(TypedArrayPrototype, VIEW, true);
	      hide(TypedArrayPrototype, DEF_CONSTRUCTOR, TypedArray);

	      if (CLAMPED ? new TypedArray(1)[TAG] != NAME : !(TAG in TypedArrayPrototype)) {
	        dP(TypedArrayPrototype, TAG, {
	          get: function get() {
	            return NAME;
	          }
	        });
	      }

	      O[NAME] = TypedArray;

	      $export($export.G + $export.W + $export.F * (TypedArray != Base), O);

	      $export($export.S, NAME, {
	        BYTES_PER_ELEMENT: BYTES
	      });

	      $export($export.S + $export.F * fails(function () {
	        Base.of.call(TypedArray, 1);
	      }), NAME, {
	        from: $from,
	        of: $of
	      });

	      if (!(BYTES_PER_ELEMENT in TypedArrayPrototype)) hide(TypedArrayPrototype, BYTES_PER_ELEMENT, BYTES);

	      $export($export.P, NAME, proto);

	      setSpecies(NAME);

	      $export($export.P + $export.F * FORCED_SET, NAME, { set: $set });

	      $export($export.P + $export.F * !CORRECT_ITER_NAME, NAME, $iterators);

	      if (!LIBRARY && TypedArrayPrototype.toString != arrayToString) TypedArrayPrototype.toString = arrayToString;

	      $export($export.P + $export.F * fails(function () {
	        new TypedArray(1).slice();
	      }), NAME, { slice: $slice });

	      $export($export.P + $export.F * (fails(function () {
	        return [1, 2].toLocaleString() != new TypedArray([1, 2]).toLocaleString();
	      }) || !fails(function () {
	        TypedArrayPrototype.toLocaleString.call([1, 2]);
	      })), NAME, { toLocaleString: $toLocaleString });

	      Iterators[NAME] = CORRECT_ITER_NAME ? $nativeIterator : $iterator;
	      if (!LIBRARY && !CORRECT_ITER_NAME) hide(TypedArrayPrototype, ITERATOR, $iterator);
	    };
	  } else module.exports = function () {/* empty */};
	});

	_typedArray('Int8', 1, function (init) {
	  return function Int8Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Uint8', 1, function (init) {
	  return function Uint8Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Uint8', 1, function (init) {
	  return function Uint8ClampedArray(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	}, true);

	_typedArray('Int16', 2, function (init) {
	  return function Int16Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Uint16', 2, function (init) {
	  return function Uint16Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Int32', 4, function (init) {
	  return function Int32Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Uint32', 4, function (init) {
	  return function Uint32Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Float32', 4, function (init) {
	  return function Float32Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	_typedArray('Float64', 8, function (init) {
	  return function Float64Array(data, byteOffset, length) {
	    return init(this, data, byteOffset, length);
	  };
	});

	// call something on iterator step with safe closing on error

	var _iterCall = function _iterCall(iterator, fn, value, entries) {
	  try {
	    return entries ? fn(_anObject(value)[0], value[1]) : fn(value);
	    // 7.4.6 IteratorClose(iterator, completion)
	  } catch (e) {
	    var ret = iterator['return'];
	    if (ret !== undefined) _anObject(ret.call(iterator));
	    throw e;
	  }
	};

	var _forOf = createCommonjsModule(function (module) {
	  var BREAK = {};
	  var RETURN = {};
	  var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
	    var iterFn = ITERATOR ? function () {
	      return iterable;
	    } : core_getIteratorMethod(iterable);
	    var f = _ctx(fn, that, entries ? 2 : 1);
	    var index = 0;
	    var length, step, iterator, result;
	    if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
	    // fast case for arrays with default iterator
	    if (_isArrayIter(iterFn)) for (length = _toLength(iterable.length); length > index; index++) {
	      result = entries ? f(_anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	      if (result === BREAK || result === RETURN) return result;
	    } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
	      result = _iterCall(iterator, f, step.value, entries);
	      if (result === BREAK || result === RETURN) return result;
	    }
	  };
	  exports.BREAK = BREAK;
	  exports.RETURN = RETURN;
	});

	var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _meta = createCommonjsModule(function (module) {
	  var META = _uid('meta');

	  var setDesc = _objectDp.f;
	  var id = 0;
	  var isExtensible = Object.isExtensible || function () {
	    return true;
	  };
	  var FREEZE = !_fails(function () {
	    return isExtensible(Object.preventExtensions({}));
	  });
	  var setMeta = function setMeta(it) {
	    setDesc(it, META, { value: {
	        i: 'O' + ++id, // object ID
	        w: {} // weak collections IDs
	      } });
	  };
	  var fastKey = function fastKey(it, create) {
	    // return primitive with prefix
	    if (!_isObject(it)) return (typeof it === 'undefined' ? 'undefined' : _typeof$2(it)) == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	    if (!_has(it, META)) {
	      // can't set metadata to uncaught frozen object
	      if (!isExtensible(it)) return 'F';
	      // not necessary to add metadata
	      if (!create) return 'E';
	      // add missing metadata
	      setMeta(it);
	      // return object ID
	    }return it[META].i;
	  };
	  var getWeak = function getWeak(it, create) {
	    if (!_has(it, META)) {
	      // can't set metadata to uncaught frozen object
	      if (!isExtensible(it)) return true;
	      // not necessary to add metadata
	      if (!create) return false;
	      // add missing metadata
	      setMeta(it);
	      // return hash weak collections IDs
	    }return it[META].w;
	  };
	  // add metadata on freeze-family methods calling
	  var onFreeze = function onFreeze(it) {
	    if (FREEZE && meta.NEED && isExtensible(it) && !_has(it, META)) setMeta(it);
	    return it;
	  };
	  var meta = module.exports = {
	    KEY: META,
	    NEED: false,
	    fastKey: fastKey,
	    getWeak: getWeak,
	    onFreeze: onFreeze
	  };
	});
	var _meta_1 = _meta.KEY;
	var _meta_2 = _meta.NEED;
	var _meta_3 = _meta.fastKey;
	var _meta_4 = _meta.getWeak;
	var _meta_5 = _meta.onFreeze;

	var _validateCollection = function _validateCollection(it, TYPE) {
	  if (!_isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
	  return it;
	};

	var dP$1 = _objectDp.f;

	var fastKey = _meta.fastKey;

	var SIZE = _descriptors ? '_s' : 'size';

	var getEntry = function getEntry(that, key) {
	  // fast case
	  var index = fastKey(key);
	  var entry;
	  if (index !== 'F') return that._i[index];
	  // frozen object case
	  for (entry = that._f; entry; entry = entry.n) {
	    if (entry.k == key) return entry;
	  }
	};

	var _collectionStrong = {
	  getConstructor: function getConstructor(wrapper, NAME, IS_MAP, ADDER) {
	    var C = wrapper(function (that, iterable) {
	      _anInstance(that, C, NAME, '_i');
	      that._t = NAME; // collection type
	      that._i = _objectCreate(null); // index
	      that._f = undefined; // first entry
	      that._l = undefined; // last entry
	      that[SIZE] = 0; // size
	      if (iterable != undefined) _forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    _redefineAll(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear() {
	        for (var that = _validateCollection(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
	          entry.r = true;
	          if (entry.p) entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function _delete(key) {
	        var that = _validateCollection(this, NAME);
	        var entry = getEntry(that, key);
	        if (entry) {
	          var next = entry.n;
	          var prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if (prev) prev.n = next;
	          if (next) next.p = prev;
	          if (that._f == entry) that._f = next;
	          if (that._l == entry) that._l = prev;
	          that[SIZE]--;
	        }return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /* , that = undefined */) {
	        _validateCollection(this, NAME);
	        var f = _ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
	        var entry;
	        while (entry = entry ? entry.n : this._f) {
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while (entry && entry.r) {
	            entry = entry.p;
	          }
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key) {
	        return !!getEntry(_validateCollection(this, NAME), key);
	      }
	    });
	    if (_descriptors) dP$1(C.prototype, 'size', {
	      get: function get() {
	        return _validateCollection(this, NAME)[SIZE];
	      }
	    });
	    return C;
	  },
	  def: function def(that, key, value) {
	    var entry = getEntry(that, key);
	    var prev, index;
	    // change existing entry
	    if (entry) {
	      entry.v = value;
	      // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key, // <- key
	        v: value, // <- value
	        p: prev = that._l, // <- previous entry
	        n: undefined, // <- next entry
	        r: false // <- removed
	      };
	      if (!that._f) that._f = entry;
	      if (prev) prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if (index !== 'F') that._i[index] = entry;
	    }return that;
	  },
	  getEntry: getEntry,
	  setStrong: function setStrong(C, NAME, IS_MAP) {
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    _iterDefine(C, NAME, function (iterated, kind) {
	      this._t = _validateCollection(iterated, NAME); // target
	      this._k = kind; // kind
	      this._l = undefined; // previous
	    }, function () {
	      var that = this;
	      var kind = that._k;
	      var entry = that._l;
	      // revert to the last existing entry
	      while (entry && entry.r) {
	        entry = entry.p;
	      } // get next entry
	      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
	        // or finish the iteration
	        that._t = undefined;
	        return _iterStep(1);
	      }
	      // return step by kind
	      if (kind == 'keys') return _iterStep(0, entry.k);
	      if (kind == 'values') return _iterStep(0, entry.v);
	      return _iterStep(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

	    // add [@@species], 23.1.2.2, 23.2.2.2
	    _setSpecies(NAME);
	  }
	};

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */

	var check = function check(O, proto) {
	  _anObject(O);
	  if (!_isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
	};
	var _setProto = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
	  function (test, buggy, set) {
	    try {
	      set = _ctx(Function.call, _objectGopd.f(Object.prototype, '__proto__').set, 2);
	      set(test, []);
	      buggy = !(test instanceof Array);
	    } catch (e) {
	      buggy = true;
	    }
	    return function setPrototypeOf(O, proto) {
	      check(O, proto);
	      if (buggy) O.__proto__ = proto;else set(O, proto);
	      return O;
	    };
	  }({}, false) : undefined),
	  check: check
	};

	var setPrototypeOf = _setProto.set;
	var _inheritIfRequired = function _inheritIfRequired(that, target, C) {
	  var S = target.constructor;
	  var P;
	  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && _isObject(P) && setPrototypeOf) {
	    setPrototypeOf(that, P);
	  }return that;
	};

	var _collection = function _collection(NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
	  var Base = _global[NAME];
	  var C = Base;
	  var ADDER = IS_MAP ? 'set' : 'add';
	  var proto = C && C.prototype;
	  var O = {};
	  var fixMethod = function fixMethod(KEY) {
	    var fn = proto[KEY];
	    _redefine(proto, KEY, KEY == 'delete' ? function (a) {
	      return IS_WEAK && !_isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
	    } : KEY == 'has' ? function has(a) {
	      return IS_WEAK && !_isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
	    } : KEY == 'get' ? function get(a) {
	      return IS_WEAK && !_isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
	    } : KEY == 'add' ? function add(a) {
	      fn.call(this, a === 0 ? 0 : a);return this;
	    } : function set(a, b) {
	      fn.call(this, a === 0 ? 0 : a, b);return this;
	    });
	  };
	  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !_fails(function () {
	    new C().entries().next();
	  }))) {
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    _redefineAll(C.prototype, methods);
	    _meta.NEED = true;
	  } else {
	    var instance = new C();
	    // early implementations not supports chaining
	    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
	    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
	    var THROWS_ON_PRIMITIVES = _fails(function () {
	      instance.has(1);
	    });
	    // most early implementations doesn't supports iterables, most modern - not close it correctly
	    var ACCEPT_ITERABLES = _iterDetect(function (iter) {
	      new C(iter);
	    }); // eslint-disable-line no-new
	    // for early implementations -0 and +0 not the same
	    var BUGGY_ZERO = !IS_WEAK && _fails(function () {
	      // V8 ~ Chromium 42- fails only with 5+ elements
	      var $instance = new C();
	      var index = 5;
	      while (index--) {
	        $instance[ADDER](index, index);
	      }return !$instance.has(-0);
	    });
	    if (!ACCEPT_ITERABLES) {
	      C = wrapper(function (target, iterable) {
	        _anInstance(target, C, NAME);
	        var that = _inheritIfRequired(new Base(), target, C);
	        if (iterable != undefined) _forOf(iterable, IS_MAP, that[ADDER], that);
	        return that;
	      });
	      C.prototype = proto;
	      proto.constructor = C;
	    }
	    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
	      fixMethod('delete');
	      fixMethod('has');
	      IS_MAP && fixMethod('get');
	    }
	    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
	    // weak collections should not contains .clear method
	    if (IS_WEAK && proto.clear) delete proto.clear;
	  }

	  _setToStringTag(C, NAME);

	  O[NAME] = C;
	  _export(_export.G + _export.W + _export.F * (C != Base), O);

	  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

	  return C;
	};

	var MAP = 'Map';

	// 23.1 Map Objects
	var es6_map = _collection(MAP, function (get) {
	  return function Map() {
	    return get(this, arguments.length > 0 ? arguments[0] : undefined);
	  };
	}, {
	  // 23.1.3.6 Map.prototype.get(key)
	  get: function get(key) {
	    var entry = _collectionStrong.getEntry(_validateCollection(this, MAP), key);
	    return entry && entry.v;
	  },
	  // 23.1.3.9 Map.prototype.set(key, value)
	  set: function set(key, value) {
	    return _collectionStrong.def(_validateCollection(this, MAP), key === 0 ? 0 : key, value);
	  }
	}, _collectionStrong, true);

	var SET = 'Set';

	// 23.2 Set Objects
	var es6_set = _collection(SET, function (get) {
	  return function Set() {
	    return get(this, arguments.length > 0 ? arguments[0] : undefined);
	  };
	}, {
	  // 23.2.3.1 Set.prototype.add(value)
	  add: function add(value) {
	    return _collectionStrong.def(_validateCollection(this, SET), value = value === 0 ? 0 : value, value);
	  }
	}, _collectionStrong);

	var f$4 = Object.getOwnPropertySymbols;

	var _objectGops = {
		f: f$4
	};

	// 19.1.2.1 Object.assign(target, source, ...)


	var $assign = Object.assign;

	// should work with symbols and should have deterministic property order (V8 bug)
	var _objectAssign = !$assign || _fails(function () {
	  var A = {};
	  var B = {};
	  // eslint-disable-next-line no-undef
	  var S = Symbol();
	  var K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function (k) {
	    B[k] = k;
	  });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source) {
	  // eslint-disable-line no-unused-vars
	  var T = _toObject(target);
	  var aLen = arguments.length;
	  var index = 1;
	  var getSymbols = _objectGops.f;
	  var isEnum = _objectPie.f;
	  while (aLen > index) {
	    var S = _iobject(arguments[index++]);
	    var keys = getSymbols ? _objectKeys(S).concat(getSymbols(S)) : _objectKeys(S);
	    var length = keys.length;
	    var j = 0;
	    var key;
	    while (length > j) {
	      if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
	    }
	  }return T;
	} : $assign;

	var getWeak = _meta.getWeak;

	var arrayFind = _arrayMethods(5);
	var arrayFindIndex = _arrayMethods(6);
	var id$1 = 0;

	// fallback for uncaught frozen keys
	var uncaughtFrozenStore = function uncaughtFrozenStore(that) {
	  return that._l || (that._l = new UncaughtFrozenStore());
	};
	var UncaughtFrozenStore = function UncaughtFrozenStore() {
	  this.a = [];
	};
	var findUncaughtFrozen = function findUncaughtFrozen(store, key) {
	  return arrayFind(store.a, function (it) {
	    return it[0] === key;
	  });
	};
	UncaughtFrozenStore.prototype = {
	  get: function get(key) {
	    var entry = findUncaughtFrozen(this, key);
	    if (entry) return entry[1];
	  },
	  has: function has(key) {
	    return !!findUncaughtFrozen(this, key);
	  },
	  set: function set(key, value) {
	    var entry = findUncaughtFrozen(this, key);
	    if (entry) entry[1] = value;else this.a.push([key, value]);
	  },
	  'delete': function _delete(key) {
	    var index = arrayFindIndex(this.a, function (it) {
	      return it[0] === key;
	    });
	    if (~index) this.a.splice(index, 1);
	    return !!~index;
	  }
	};

	var _collectionWeak = {
	  getConstructor: function getConstructor(wrapper, NAME, IS_MAP, ADDER) {
	    var C = wrapper(function (that, iterable) {
	      _anInstance(that, C, NAME, '_i');
	      that._t = NAME; // collection type
	      that._i = id$1++; // collection id
	      that._l = undefined; // leak store for uncaught frozen objects
	      if (iterable != undefined) _forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    _redefineAll(C.prototype, {
	      // 23.3.3.2 WeakMap.prototype.delete(key)
	      // 23.4.3.3 WeakSet.prototype.delete(value)
	      'delete': function _delete(key) {
	        if (!_isObject(key)) return false;
	        var data = getWeak(key);
	        if (data === true) return uncaughtFrozenStore(_validateCollection(this, NAME))['delete'](key);
	        return data && _has(data, this._i) && delete data[this._i];
	      },
	      // 23.3.3.4 WeakMap.prototype.has(key)
	      // 23.4.3.4 WeakSet.prototype.has(value)
	      has: function has(key) {
	        if (!_isObject(key)) return false;
	        var data = getWeak(key);
	        if (data === true) return uncaughtFrozenStore(_validateCollection(this, NAME)).has(key);
	        return data && _has(data, this._i);
	      }
	    });
	    return C;
	  },
	  def: function def(that, key, value) {
	    var data = getWeak(_anObject(key), true);
	    if (data === true) uncaughtFrozenStore(that).set(key, value);else data[that._i] = value;
	    return that;
	  },
	  ufstore: uncaughtFrozenStore
	};

	var es6_weakMap = createCommonjsModule(function (module) {

	  var each = _arrayMethods(0);

	  var WEAK_MAP = 'WeakMap';
	  var getWeak = _meta.getWeak;
	  var isExtensible = Object.isExtensible;
	  var uncaughtFrozenStore = _collectionWeak.ufstore;
	  var tmp = {};
	  var InternalMap;

	  var wrapper = function wrapper(get) {
	    return function WeakMap() {
	      return get(this, arguments.length > 0 ? arguments[0] : undefined);
	    };
	  };

	  var methods = {
	    // 23.3.3.3 WeakMap.prototype.get(key)
	    get: function get(key) {
	      if (_isObject(key)) {
	        var data = getWeak(key);
	        if (data === true) return uncaughtFrozenStore(_validateCollection(this, WEAK_MAP)).get(key);
	        return data ? data[this._i] : undefined;
	      }
	    },
	    // 23.3.3.5 WeakMap.prototype.set(key, value)
	    set: function set(key, value) {
	      return _collectionWeak.def(_validateCollection(this, WEAK_MAP), key, value);
	    }
	  };

	  // 23.3 WeakMap Objects
	  var $WeakMap = module.exports = _collection(WEAK_MAP, wrapper, methods, _collectionWeak, true, true);

	  // IE11 WeakMap frozen keys fix
	  if (_fails(function () {
	    return new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7;
	  })) {
	    InternalMap = _collectionWeak.getConstructor(wrapper, WEAK_MAP);
	    _objectAssign(InternalMap.prototype, methods);
	    _meta.NEED = true;
	    each(['delete', 'has', 'get', 'set'], function (key) {
	      var proto = $WeakMap.prototype;
	      var method = proto[key];
	      _redefine(proto, key, function (a, b) {
	        // store frozen objects on internal weakmap shim
	        if (_isObject(a) && !isExtensible(a)) {
	          if (!this._f) this._f = new InternalMap();
	          var result = this._f[key](a, b);
	          return key == 'set' ? this : result;
	          // store all the rest on native weakmap
	        }return method.call(this, a, b);
	      });
	    });
	  }
	});

	var WEAK_SET = 'WeakSet';

	// 23.4 WeakSet Objects
	_collection(WEAK_SET, function (get) {
	  return function WeakSet() {
	    return get(this, arguments.length > 0 ? arguments[0] : undefined);
	  };
	}, {
	  // 23.4.3.1 WeakSet.prototype.add(value)
	  add: function add(value) {
	    return _collectionWeak.def(_validateCollection(this, WEAK_SET), value, true);
	  }
	}, _collectionWeak, false, true);

	// 26.1.1 Reflect.apply(target, thisArgument, argumentsList)


	var rApply = (_global.Reflect || {}).apply;
	var fApply = Function.apply;
	// MS Edge argumentsList argument is optional
	_export(_export.S + _export.F * !_fails(function () {
	  rApply(function () {/* empty */});
	}), 'Reflect', {
	  apply: function apply(target, thisArgument, argumentsList) {
	    var T = _aFunction(target);
	    var L = _anObject(argumentsList);
	    return rApply ? rApply(T, thisArgument, L) : fApply.call(T, thisArgument, L);
	  }
	});

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	var _invoke = function _invoke(fn, args, that) {
	                  var un = that === undefined;
	                  switch (args.length) {
	                                    case 0:
	                                                      return un ? fn() : fn.call(that);
	                                    case 1:
	                                                      return un ? fn(args[0]) : fn.call(that, args[0]);
	                                    case 2:
	                                                      return un ? fn(args[0], args[1]) : fn.call(that, args[0], args[1]);
	                                    case 3:
	                                                      return un ? fn(args[0], args[1], args[2]) : fn.call(that, args[0], args[1], args[2]);
	                                    case 4:
	                                                      return un ? fn(args[0], args[1], args[2], args[3]) : fn.call(that, args[0], args[1], args[2], args[3]);
	                  }return fn.apply(that, args);
	};

	var arraySlice = [].slice;
	var factories = {};

	var construct = function construct(F, len, args) {
	  if (!(len in factories)) {
	    for (var n = [], i = 0; i < len; i++) {
	      n[i] = 'a[' + i + ']';
	    } // eslint-disable-next-line no-new-func
	    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
	  }return factories[len](F, args);
	};

	var _bind = Function.bind || function bind(that /* , ...args */) {
	  var fn = _aFunction(this);
	  var partArgs = arraySlice.call(arguments, 1);
	  var bound = function bound() /* args... */{
	    var args = partArgs.concat(arraySlice.call(arguments));
	    return this instanceof bound ? construct(fn, args.length, args) : _invoke(fn, args, that);
	  };
	  if (_isObject(fn.prototype)) bound.prototype = fn.prototype;
	  return bound;
	};

	// 26.1.2 Reflect.construct(target, argumentsList [, newTarget])


	var rConstruct = (_global.Reflect || {}).construct;

	// MS Edge supports only 2 arguments and argumentsList argument is optional
	// FF Nightly sets third argument as `new.target`, but does not create `this` from it
	var NEW_TARGET_BUG = _fails(function () {
	  function F() {/* empty */}
	  return !(rConstruct(function () {/* empty */}, [], F) instanceof F);
	});
	var ARGS_BUG = !_fails(function () {
	  rConstruct(function () {/* empty */});
	});

	_export(_export.S + _export.F * (NEW_TARGET_BUG || ARGS_BUG), 'Reflect', {
	  construct: function construct(Target, args /* , newTarget */) {
	    _aFunction(Target);
	    _anObject(args);
	    var newTarget = arguments.length < 3 ? Target : _aFunction(arguments[2]);
	    if (ARGS_BUG && !NEW_TARGET_BUG) return rConstruct(Target, args, newTarget);
	    if (Target == newTarget) {
	      // w/o altered newTarget, optimization for 0-4 arguments
	      switch (args.length) {
	        case 0:
	          return new Target();
	        case 1:
	          return new Target(args[0]);
	        case 2:
	          return new Target(args[0], args[1]);
	        case 3:
	          return new Target(args[0], args[1], args[2]);
	        case 4:
	          return new Target(args[0], args[1], args[2], args[3]);
	      }
	      // w/o altered newTarget, lot of arguments case
	      var $args = [null];
	      $args.push.apply($args, args);
	      return new (_bind.apply(Target, $args))();
	    }
	    // with altered newTarget, not support built-in constructors
	    var proto = newTarget.prototype;
	    var instance = _objectCreate(_isObject(proto) ? proto : Object.prototype);
	    var result = Function.apply.call(Target, instance, args);
	    return _isObject(result) ? result : instance;
	  }
	});

	// 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)


	// MS Edge has broken Reflect.defineProperty - throwing instead of returning false
	_export(_export.S + _export.F * _fails(function () {
	  // eslint-disable-next-line no-undef
	  Reflect.defineProperty(_objectDp.f({}, 1, { value: 1 }), 1, { value: 2 });
	}), 'Reflect', {
	  defineProperty: function defineProperty(target, propertyKey, attributes) {
	    _anObject(target);
	    propertyKey = _toPrimitive(propertyKey, true);
	    _anObject(attributes);
	    try {
	      _objectDp.f(target, propertyKey, attributes);
	      return true;
	    } catch (e) {
	      return false;
	    }
	  }
	});

	// 26.1.4 Reflect.deleteProperty(target, propertyKey)

	var gOPD$1 = _objectGopd.f;

	_export(_export.S, 'Reflect', {
	  deleteProperty: function deleteProperty(target, propertyKey) {
	    var desc = gOPD$1(_anObject(target), propertyKey);
	    return desc && !desc.configurable ? false : delete target[propertyKey];
	  }
	});

	// 26.1.6 Reflect.get(target, propertyKey [, receiver])


	function get(target, propertyKey /* , receiver */) {
	  var receiver = arguments.length < 3 ? target : arguments[2];
	  var desc, proto;
	  if (_anObject(target) === receiver) return target[propertyKey];
	  if (desc = _objectGopd.f(target, propertyKey)) return _has(desc, 'value') ? desc.value : desc.get !== undefined ? desc.get.call(receiver) : undefined;
	  if (_isObject(proto = _objectGpo(target))) return get(proto, propertyKey, receiver);
	}

	_export(_export.S, 'Reflect', { get: get });

	// 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)


	_export(_export.S, 'Reflect', {
	  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, propertyKey) {
	    return _objectGopd.f(_anObject(target), propertyKey);
	  }
	});

	// 26.1.8 Reflect.getPrototypeOf(target)


	_export(_export.S, 'Reflect', {
	  getPrototypeOf: function getPrototypeOf(target) {
	    return _objectGpo(_anObject(target));
	  }
	});

	// 26.1.9 Reflect.has(target, propertyKey)


	_export(_export.S, 'Reflect', {
	  has: function has(target, propertyKey) {
	    return propertyKey in target;
	  }
	});

	// 26.1.10 Reflect.isExtensible(target)


	var $isExtensible = Object.isExtensible;

	_export(_export.S, 'Reflect', {
	  isExtensible: function isExtensible(target) {
	    _anObject(target);
	    return $isExtensible ? $isExtensible(target) : true;
	  }
	});

	// all object keys, includes non-enumerable and symbols


	var Reflect$1 = _global.Reflect;
	var _ownKeys = Reflect$1 && Reflect$1.ownKeys || function ownKeys(it) {
	  var keys = _objectGopn.f(_anObject(it));
	  var getSymbols = _objectGops.f;
	  return getSymbols ? keys.concat(getSymbols(it)) : keys;
	};

	// 26.1.11 Reflect.ownKeys(target)


	_export(_export.S, 'Reflect', { ownKeys: _ownKeys });

	// 26.1.12 Reflect.preventExtensions(target)


	var $preventExtensions = Object.preventExtensions;

	_export(_export.S, 'Reflect', {
	  preventExtensions: function preventExtensions(target) {
	    _anObject(target);
	    try {
	      if ($preventExtensions) $preventExtensions(target);
	      return true;
	    } catch (e) {
	      return false;
	    }
	  }
	});

	// 26.1.13 Reflect.set(target, propertyKey, V [, receiver])


	function set(target, propertyKey, V /* , receiver */) {
	  var receiver = arguments.length < 4 ? target : arguments[3];
	  var ownDesc = _objectGopd.f(_anObject(target), propertyKey);
	  var existingDescriptor, proto;
	  if (!ownDesc) {
	    if (_isObject(proto = _objectGpo(target))) {
	      return set(proto, propertyKey, V, receiver);
	    }
	    ownDesc = _propertyDesc(0);
	  }
	  if (_has(ownDesc, 'value')) {
	    if (ownDesc.writable === false || !_isObject(receiver)) return false;
	    existingDescriptor = _objectGopd.f(receiver, propertyKey) || _propertyDesc(0);
	    existingDescriptor.value = V;
	    _objectDp.f(receiver, propertyKey, existingDescriptor);
	    return true;
	  }
	  return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
	}

	_export(_export.S, 'Reflect', { set: set });

	// 26.1.14 Reflect.setPrototypeOf(target, proto)


	if (_setProto) _export(_export.S, 'Reflect', {
	  setPrototypeOf: function setPrototypeOf(target, proto) {
	    _setProto.check(target, proto);
	    try {
	      _setProto.set(target, proto);
	      return true;
	    } catch (e) {
	      return false;
	    }
	  }
	});

	var process = _global.process;
	var setTask = _global.setImmediate;
	var clearTask = _global.clearImmediate;
	var MessageChannel = _global.MessageChannel;
	var Dispatch = _global.Dispatch;
	var counter = 0;
	var queue = {};
	var ONREADYSTATECHANGE = 'onreadystatechange';
	var defer, channel, port;
	var run = function run() {
	  var id = +this;
	  // eslint-disable-next-line no-prototype-builtins
	  if (queue.hasOwnProperty(id)) {
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listener = function listener(event) {
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if (!setTask || !clearTask) {
	  setTask = function setImmediate(fn) {
	    var args = [];
	    var i = 1;
	    while (arguments.length > i) {
	      args.push(arguments[i++]);
	    }queue[++counter] = function () {
	      // eslint-disable-next-line no-new-func
	      _invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id) {
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if (_cof(process) == 'process') {
	    defer = function defer(id) {
	      process.nextTick(_ctx(run, id, 1));
	    };
	    // Sphere (JS game engine) Dispatch API
	  } else if (Dispatch && Dispatch.now) {
	    defer = function defer(id) {
	      Dispatch.now(_ctx(run, id, 1));
	    };
	    // Browsers with MessageChannel, includes WebWorkers
	  } else if (MessageChannel) {
	    channel = new MessageChannel();
	    port = channel.port2;
	    channel.port1.onmessage = listener;
	    defer = _ctx(port.postMessage, port, 1);
	    // Browsers with postMessage, skip WebWorkers
	    // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if (_global.addEventListener && typeof postMessage == 'function' && !_global.importScripts) {
	    defer = function defer(id) {
	      _global.postMessage(id + '', '*');
	    };
	    _global.addEventListener('message', listener, false);
	    // IE8-
	  } else if (ONREADYSTATECHANGE in _domCreate('script')) {
	    defer = function defer(id) {
	      _html.appendChild(_domCreate('script'))[ONREADYSTATECHANGE] = function () {
	        _html.removeChild(this);
	        run.call(id);
	      };
	    };
	    // Rest old browsers
	  } else {
	    defer = function defer(id) {
	      setTimeout(_ctx(run, id, 1), 0);
	    };
	  }
	}
	var _task = {
	  set: setTask,
	  clear: clearTask
	};

	var macrotask = _task.set;
	var Observer = _global.MutationObserver || _global.WebKitMutationObserver;
	var process$1 = _global.process;
	var Promise$1 = _global.Promise;
	var isNode = _cof(process$1) == 'process';

	var _microtask = function _microtask() {
	  var head, last, notify;

	  var flush = function flush() {
	    var parent, fn;
	    if (isNode && (parent = process$1.domain)) parent.exit();
	    while (head) {
	      fn = head.fn;
	      head = head.next;
	      try {
	        fn();
	      } catch (e) {
	        if (head) notify();else last = undefined;
	        throw e;
	      }
	    }last = undefined;
	    if (parent) parent.enter();
	  };

	  // Node.js
	  if (isNode) {
	    notify = function notify() {
	      process$1.nextTick(flush);
	    };
	    // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339
	  } else if (Observer && !(_global.navigator && _global.navigator.standalone)) {
	    var toggle = true;
	    var node = document.createTextNode('');
	    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
	    notify = function notify() {
	      node.data = toggle = !toggle;
	    };
	    // environments with maybe non-completely correct, but existent Promise
	  } else if (Promise$1 && Promise$1.resolve) {
	    var promise = Promise$1.resolve();
	    notify = function notify() {
	      promise.then(flush);
	    };
	    // for other environments - macrotask based on:
	    // - setImmediate
	    // - MessageChannel
	    // - window.postMessag
	    // - onreadystatechange
	    // - setTimeout
	  } else {
	    notify = function notify() {
	      // strange IE + webpack dev server bug - use .call(global)
	      macrotask.call(_global, flush);
	    };
	  }

	  return function (fn) {
	    var task = { fn: fn, next: undefined };
	    if (last) last.next = task;
	    if (!head) {
	      head = task;
	      notify();
	    }last = task;
	  };
	};

	// 25.4.1.5 NewPromiseCapability(C)


	function PromiseCapability(C) {
	  var resolve, reject;
	  this.promise = new C(function ($$resolve, $$reject) {
	    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject = $$reject;
	  });
	  this.resolve = _aFunction(resolve);
	  this.reject = _aFunction(reject);
	}

	var f$5 = function f(C) {
	  return new PromiseCapability(C);
	};

	var _newPromiseCapability = {
	  f: f$5
	};

	var _perform = function _perform(exec) {
	  try {
	    return { e: false, v: exec() };
	  } catch (e) {
	    return { e: true, v: e };
	  }
	};

	var _promiseResolve = function _promiseResolve(C, x) {
	  _anObject(C);
	  if (_isObject(x) && x.constructor === C) return x;
	  var promiseCapability = _newPromiseCapability.f(C);
	  var resolve = promiseCapability.resolve;
	  resolve(x);
	  return promiseCapability.promise;
	};

	var task = _task.set;
	var microtask = _microtask();

	var PROMISE = 'Promise';
	var TypeError$1 = _global.TypeError;
	var process$2 = _global.process;
	var $Promise = _global[PROMISE];
	var isNode$1 = _classof(process$2) == 'process';
	var empty = function empty() {/* empty */};
	var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
	var newPromiseCapability = newGenericPromiseCapability = _newPromiseCapability.f;

	var USE_NATIVE = !!function () {
	  try {
	    // correct subclassing with @@species support
	    var promise = $Promise.resolve(1);
	    var FakePromise = (promise.constructor = {})[_wks('species')] = function (exec) {
	      exec(empty, empty);
	    };
	    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
	    return (isNode$1 || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
	  } catch (e) {/* empty */}
	}();

	// helpers
	var isThenable = function isThenable(it) {
	  var then;
	  return _isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var notify = function notify(promise, isReject) {
	  if (promise._n) return;
	  promise._n = true;
	  var chain = promise._c;
	  microtask(function () {
	    var value = promise._v;
	    var ok = promise._s == 1;
	    var i = 0;
	    var run = function run(reaction) {
	      var handler = ok ? reaction.ok : reaction.fail;
	      var resolve = reaction.resolve;
	      var reject = reaction.reject;
	      var domain = reaction.domain;
	      var result, then;
	      try {
	        if (handler) {
	          if (!ok) {
	            if (promise._h == 2) onHandleUnhandled(promise);
	            promise._h = 1;
	          }
	          if (handler === true) result = value;else {
	            if (domain) domain.enter();
	            result = handler(value);
	            if (domain) domain.exit();
	          }
	          if (result === reaction.promise) {
	            reject(TypeError$1('Promise-chain cycle'));
	          } else if (then = isThenable(result)) {
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch (e) {
	        reject(e);
	      }
	    };
	    while (chain.length > i) {
	      run(chain[i++]);
	    } // variable length - can't use forEach
	    promise._c = [];
	    promise._n = false;
	    if (isReject && !promise._h) onUnhandled(promise);
	  });
	};
	var onUnhandled = function onUnhandled(promise) {
	  task.call(_global, function () {
	    var value = promise._v;
	    var unhandled = isUnhandled(promise);
	    var result, handler, console;
	    if (unhandled) {
	      result = _perform(function () {
	        if (isNode$1) {
	          process$2.emit('unhandledRejection', value, promise);
	        } else if (handler = _global.onunhandledrejection) {
	          handler({ promise: promise, reason: value });
	        } else if ((console = _global.console) && console.error) {
	          console.error('Unhandled promise rejection', value);
	        }
	      });
	      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
	      promise._h = isNode$1 || isUnhandled(promise) ? 2 : 1;
	    }promise._a = undefined;
	    if (unhandled && result.e) throw result.v;
	  });
	};
	var isUnhandled = function isUnhandled(promise) {
	  return promise._h !== 1 && (promise._a || promise._c).length === 0;
	};
	var onHandleUnhandled = function onHandleUnhandled(promise) {
	  task.call(_global, function () {
	    var handler;
	    if (isNode$1) {
	      process$2.emit('rejectionHandled', promise);
	    } else if (handler = _global.onrejectionhandled) {
	      handler({ promise: promise, reason: promise._v });
	    }
	  });
	};
	var $reject = function $reject(value) {
	  var promise = this;
	  if (promise._d) return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  promise._v = value;
	  promise._s = 2;
	  if (!promise._a) promise._a = promise._c.slice();
	  notify(promise, true);
	};
	var $resolve = function $resolve(value) {
	  var promise = this;
	  var then;
	  if (promise._d) return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  try {
	    if (promise === value) throw TypeError$1("Promise can't be resolved itself");
	    if (then = isThenable(value)) {
	      microtask(function () {
	        var wrapper = { _w: promise, _d: false }; // wrap
	        try {
	          then.call(value, _ctx($resolve, wrapper, 1), _ctx($reject, wrapper, 1));
	        } catch (e) {
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      promise._v = value;
	      promise._s = 1;
	      notify(promise, false);
	    }
	  } catch (e) {
	    $reject.call({ _w: promise, _d: false }, e); // wrap
	  }
	};

	// constructor polyfill
	if (!USE_NATIVE) {
	  // 25.4.3.1 Promise(executor)
	  $Promise = function Promise(executor) {
	    _anInstance(this, $Promise, PROMISE, '_h');
	    _aFunction(executor);
	    Internal.call(this);
	    try {
	      executor(_ctx($resolve, this, 1), _ctx($reject, this, 1));
	    } catch (err) {
	      $reject.call(this, err);
	    }
	  };
	  // eslint-disable-next-line no-unused-vars
	  Internal = function Promise(executor) {
	    this._c = []; // <- awaiting reactions
	    this._a = undefined; // <- checked in isUnhandled reactions
	    this._s = 0; // <- state
	    this._d = false; // <- done
	    this._v = undefined; // <- value
	    this._h = 0; // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
	    this._n = false; // <- notify
	  };
	  Internal.prototype = _redefineAll($Promise.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected) {
	      var reaction = newPromiseCapability(_speciesConstructor(this, $Promise));
	      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail = typeof onRejected == 'function' && onRejected;
	      reaction.domain = isNode$1 ? process$2.domain : undefined;
	      this._c.push(reaction);
	      if (this._a) this._a.push(reaction);
	      if (this._s) notify(this, false);
	      return reaction.promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function _catch(onRejected) {
	      return this.then(undefined, onRejected);
	    }
	  });
	  OwnPromiseCapability = function OwnPromiseCapability() {
	    var promise = new Internal();
	    this.promise = promise;
	    this.resolve = _ctx($resolve, promise, 1);
	    this.reject = _ctx($reject, promise, 1);
	  };
	  _newPromiseCapability.f = newPromiseCapability = function newPromiseCapability(C) {
	    return C === $Promise || C === Wrapper ? new OwnPromiseCapability(C) : newGenericPromiseCapability(C);
	  };
	}

	_export(_export.G + _export.W + _export.F * !USE_NATIVE, { Promise: $Promise });
	_setToStringTag($Promise, PROMISE);
	_setSpecies(PROMISE);
	Wrapper = _core[PROMISE];

	// statics
	_export(_export.S + _export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r) {
	    var capability = newPromiseCapability(this);
	    var $$reject = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	_export(_export.S + _export.F * (_library || !USE_NATIVE), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x) {
	    return _promiseResolve(_library && this === Wrapper ? $Promise : this, x);
	  }
	});
	_export(_export.S + _export.F * !(USE_NATIVE && _iterDetect(function (iter) {
	  $Promise.all(iter)['catch'](empty);
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable) {
	    var C = this;
	    var capability = newPromiseCapability(C);
	    var resolve = capability.resolve;
	    var reject = capability.reject;
	    var result = _perform(function () {
	      var values = [];
	      var index = 0;
	      var remaining = 1;
	      _forOf(iterable, false, function (promise) {
	        var $index = index++;
	        var alreadyCalled = false;
	        values.push(undefined);
	        remaining++;
	        C.resolve(promise).then(function (value) {
	          if (alreadyCalled) return;
	          alreadyCalled = true;
	          values[$index] = value;
	          --remaining || resolve(values);
	        }, reject);
	      });
	      --remaining || resolve(values);
	    });
	    if (result.e) reject(result.v);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable) {
	    var C = this;
	    var capability = newPromiseCapability(C);
	    var reject = capability.reject;
	    var result = _perform(function () {
	      _forOf(iterable, false, function (promise) {
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if (result.e) reject(result.v);
	    return capability.promise;
	  }
	});

	var f$6 = _wks;

	var _wksExt = {
		f: f$6
	};

	var defineProperty = _objectDp.f;
	var _wksDefine = function _wksDefine(name) {
	  var $Symbol = _core.Symbol || (_core.Symbol = _library ? {} : _global.Symbol || {});
	  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: _wksExt.f(name) });
	};

	// all enumerable object keys, includes symbols


	var _enumKeys = function _enumKeys(it) {
	  var result = _objectKeys(it);
	  var getSymbols = _objectGops.f;
	  if (getSymbols) {
	    var symbols = getSymbols(it);
	    var isEnum = _objectPie.f;
	    var i = 0;
	    var key;
	    while (symbols.length > i) {
	      if (isEnum.call(it, key = symbols[i++])) result.push(key);
	    }
	  }return result;
	};

	var _typeof$3 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window

	var gOPN = _objectGopn.f;
	var toString$1 = {}.toString;

	var windowNames = (typeof window === 'undefined' ? 'undefined' : _typeof$3(window)) == 'object' && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function getWindowNames(it) {
	  try {
	    return gOPN(it);
	  } catch (e) {
	    return windowNames.slice();
	  }
	};

	var f$7 = function getOwnPropertyNames(it) {
	  return windowNames && toString$1.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(_toIobject(it));
	};

	var _objectGopnExt = {
	  f: f$7
	};

	var _typeof$4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	// ECMAScript 6 symbols shim


	var META = _meta.KEY;

	var gOPD$2 = _objectGopd.f;
	var dP$2 = _objectDp.f;
	var gOPN$1 = _objectGopnExt.f;
	var $Symbol = _global.Symbol;
	var $JSON = _global.JSON;
	var _stringify = $JSON && $JSON.stringify;
	var PROTOTYPE$2 = 'prototype';
	var HIDDEN = _wks('_hidden');
	var TO_PRIMITIVE = _wks('toPrimitive');
	var isEnum = {}.propertyIsEnumerable;
	var SymbolRegistry = _shared('symbol-registry');
	var AllSymbols = _shared('symbols');
	var OPSymbols = _shared('op-symbols');
	var ObjectProto$1 = Object[PROTOTYPE$2];
	var USE_NATIVE$1 = typeof $Symbol == 'function';
	var QObject = _global.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var setter = !QObject || !QObject[PROTOTYPE$2] || !QObject[PROTOTYPE$2].findChild;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = _descriptors && _fails(function () {
	  return _objectCreate(dP$2({}, 'a', {
	    get: function get() {
	      return dP$2(this, 'a', { value: 7 }).a;
	    }
	  })).a != 7;
	}) ? function (it, key, D) {
	  var protoDesc = gOPD$2(ObjectProto$1, key);
	  if (protoDesc) delete ObjectProto$1[key];
	  dP$2(it, key, D);
	  if (protoDesc && it !== ObjectProto$1) dP$2(ObjectProto$1, key, protoDesc);
	} : dP$2;

	var wrap = function wrap(tag) {
	  var sym = AllSymbols[tag] = _objectCreate($Symbol[PROTOTYPE$2]);
	  sym._k = tag;
	  return sym;
	};

	var isSymbol = USE_NATIVE$1 && _typeof$4($Symbol.iterator) == 'symbol' ? function (it) {
	  return (typeof it === 'undefined' ? 'undefined' : _typeof$4(it)) == 'symbol';
	} : function (it) {
	  return it instanceof $Symbol;
	};

	var $defineProperty = function defineProperty(it, key, D) {
	  if (it === ObjectProto$1) $defineProperty(OPSymbols, key, D);
	  _anObject(it);
	  key = _toPrimitive(key, true);
	  _anObject(D);
	  if (_has(AllSymbols, key)) {
	    if (!D.enumerable) {
	      if (!_has(it, HIDDEN)) dP$2(it, HIDDEN, _propertyDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if (_has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
	      D = _objectCreate(D, { enumerable: _propertyDesc(0, false) });
	    }return setSymbolDesc(it, key, D);
	  }return dP$2(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P) {
	  _anObject(it);
	  var keys = _enumKeys(P = _toIobject(P));
	  var i = 0;
	  var l = keys.length;
	  var key;
	  while (l > i) {
	    $defineProperty(it, key = keys[i++], P[key]);
	  }return it;
	};
	var $create = function create(it, P) {
	  return P === undefined ? _objectCreate(it) : $defineProperties(_objectCreate(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key) {
	  var E = isEnum.call(this, key = _toPrimitive(key, true));
	  if (this === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return false;
	  return E || !_has(this, key) || !_has(AllSymbols, key) || _has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
	  it = _toIobject(it);
	  key = _toPrimitive(key, true);
	  if (it === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return;
	  var D = gOPD$2(it, key);
	  if (D && _has(AllSymbols, key) && !(_has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it) {
	  var names = gOPN$1(_toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (!_has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
	  }return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
	  var IS_OP = it === ObjectProto$1;
	  var names = gOPN$1(IS_OP ? OPSymbols : _toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (_has(AllSymbols, key = names[i++]) && (IS_OP ? _has(ObjectProto$1, key) : true)) result.push(AllSymbols[key]);
	  }return result;
	};

	// 19.4.1.1 Symbol([description])
	if (!USE_NATIVE$1) {
	  $Symbol = function _Symbol() {
	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
	    var tag = _uid(arguments.length > 0 ? arguments[0] : undefined);
	    var $set = function $set(value) {
	      if (this === ObjectProto$1) $set.call(OPSymbols, value);
	      if (_has(this, HIDDEN) && _has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, _propertyDesc(1, value));
	    };
	    if (_descriptors && setter) setSymbolDesc(ObjectProto$1, tag, { configurable: true, set: $set });
	    return wrap(tag);
	  };
	  _redefine($Symbol[PROTOTYPE$2], 'toString', function toString() {
	    return this._k;
	  });

	  _objectGopd.f = $getOwnPropertyDescriptor;
	  _objectDp.f = $defineProperty;
	  _objectGopn.f = _objectGopnExt.f = $getOwnPropertyNames;
	  _objectPie.f = $propertyIsEnumerable;
	  _objectGops.f = $getOwnPropertySymbols;

	  if (_descriptors && !_library) {
	    _redefine(ObjectProto$1, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }

	  _wksExt.f = function (name) {
	    return wrap(_wks(name));
	  };
	}

	_export(_export.G + _export.W + _export.F * !USE_NATIVE$1, { Symbol: $Symbol });

	for (var es6Symbols =
	// 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
	'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'.split(','), j = 0; es6Symbols.length > j;) {
	  _wks(es6Symbols[j++]);
	}for (var wellKnownSymbols = _objectKeys(_wks.store), k = 0; wellKnownSymbols.length > k;) {
	  _wksDefine(wellKnownSymbols[k++]);
	}_export(_export.S + _export.F * !USE_NATIVE$1, 'Symbol', {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function _for(key) {
	    return _has(SymbolRegistry, key += '') ? SymbolRegistry[key] : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(sym) {
	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
	    for (var key in SymbolRegistry) {
	      if (SymbolRegistry[key] === sym) return key;
	    }
	  },
	  useSetter: function useSetter() {
	    setter = true;
	  },
	  useSimple: function useSimple() {
	    setter = false;
	  }
	});

	_export(_export.S + _export.F * !USE_NATIVE$1, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// 24.3.2 JSON.stringify(value [, replacer [, space]])
	$JSON && _export(_export.S + _export.F * (!USE_NATIVE$1 || _fails(function () {
	  var S = $Symbol();
	  // MS Edge converts symbol values to JSON as {}
	  // WebKit converts symbol values to JSON as null
	  // V8 throws on boxed symbols
	  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
	})), 'JSON', {
	  stringify: function stringify(it) {
	    var args = [it];
	    var i = 1;
	    var replacer, $replacer;
	    while (arguments.length > i) {
	      args.push(arguments[i++]);
	    }$replacer = replacer = args[1];
	    if (!_isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
	    if (!_isArray(replacer)) replacer = function replacer(key, value) {
	      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
	      if (!isSymbol(value)) return value;
	    };
	    args[1] = replacer;
	    return _stringify.apply($JSON, args);
	  }
	});

	// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
	$Symbol[PROTOTYPE$2][TO_PRIMITIVE] || _hide($Symbol[PROTOTYPE$2], TO_PRIMITIVE, $Symbol[PROTOTYPE$2].valueOf);
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	_setToStringTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	_setToStringTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	_setToStringTag(_global.JSON, 'JSON', true);

	// most Object methods by ES6 should accept primitives


	var _objectSap = function _objectSap(KEY, exec) {
	  var fn = (_core.Object || {})[KEY] || Object[KEY];
	  var exp = {};
	  exp[KEY] = exec(fn);
	  _export(_export.S + _export.F * _fails(function () {
	    fn(1);
	  }), 'Object', exp);
	};

	// 19.1.2.5 Object.freeze(O)

	var meta = _meta.onFreeze;

	_objectSap('freeze', function ($freeze) {
	  return function freeze(it) {
	    return $freeze && _isObject(it) ? $freeze(meta(it)) : it;
	  };
	});

	// 19.1.2.17 Object.seal(O)

	var meta$1 = _meta.onFreeze;

	_objectSap('seal', function ($seal) {
	  return function seal(it) {
	    return $seal && _isObject(it) ? $seal(meta$1(it)) : it;
	  };
	});

	// 19.1.2.15 Object.preventExtensions(O)

	var meta$2 = _meta.onFreeze;

	_objectSap('preventExtensions', function ($preventExtensions) {
	  return function preventExtensions(it) {
	    return $preventExtensions && _isObject(it) ? $preventExtensions(meta$2(it)) : it;
	  };
	});

	// 19.1.2.12 Object.isFrozen(O)


	_objectSap('isFrozen', function ($isFrozen) {
	  return function isFrozen(it) {
	    return _isObject(it) ? $isFrozen ? $isFrozen(it) : false : true;
	  };
	});

	// 19.1.2.13 Object.isSealed(O)


	_objectSap('isSealed', function ($isSealed) {
	  return function isSealed(it) {
	    return _isObject(it) ? $isSealed ? $isSealed(it) : false : true;
	  };
	});

	// 19.1.2.11 Object.isExtensible(O)


	_objectSap('isExtensible', function ($isExtensible) {
	  return function isExtensible(it) {
	    return _isObject(it) ? $isExtensible ? $isExtensible(it) : true : false;
	  };
	});

	// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)

	var $getOwnPropertyDescriptor$1 = _objectGopd.f;

	_objectSap('getOwnPropertyDescriptor', function () {
	  return function getOwnPropertyDescriptor(it, key) {
	    return $getOwnPropertyDescriptor$1(_toIobject(it), key);
	  };
	});

	// 19.1.2.9 Object.getPrototypeOf(O)


	_objectSap('getPrototypeOf', function () {
	  return function getPrototypeOf(it) {
	    return _objectGpo(_toObject(it));
	  };
	});

	// 19.1.2.14 Object.keys(O)


	_objectSap('keys', function () {
	  return function keys(it) {
	    return _objectKeys(_toObject(it));
	  };
	});

	// 19.1.2.7 Object.getOwnPropertyNames(O)
	_objectSap('getOwnPropertyNames', function () {
	  return _objectGopnExt.f;
	});

	// 19.1.3.1 Object.assign(target, source)


	_export(_export.S + _export.F, 'Object', { assign: _objectAssign });

	// 7.2.9 SameValue(x, y)
	var _sameValue = Object.is || function is(x, y) {
	  // eslint-disable-next-line no-self-compare
	  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
	};

	// 19.1.3.10 Object.is(value1, value2)

	_export(_export.S, 'Object', { is: _sameValue });

	// 19.1.3.19 Object.setPrototypeOf(O, proto)

	_export(_export.S, 'Object', { setPrototypeOf: _setProto.set });

	var dP$3 = _objectDp.f;
	var FProto = Function.prototype;
	var nameRE = /^\s*function ([^ (]*)/;
	var NAME = 'name';

	// 19.2.4.2 name
	NAME in FProto || _descriptors && dP$3(FProto, NAME, {
	  configurable: true,
	  get: function get() {
	    try {
	      return ('' + this).match(nameRE)[1];
	    } catch (e) {
	      return '';
	    }
	  }
	});

	_export(_export.S, 'String', {
	  // 21.1.2.4 String.raw(callSite, ...substitutions)
	  raw: function raw(callSite) {
	    var tpl = _toIobject(callSite.raw);
	    var len = _toLength(tpl.length);
	    var aLen = arguments.length;
	    var res = [];
	    var i = 0;
	    while (len > i) {
	      res.push(String(tpl[i++]));
	      if (i < aLen) res.push(String(arguments[i]));
	    }return res.join('');
	  }
	});

	var fromCharCode = String.fromCharCode;
	var $fromCodePoint = String.fromCodePoint;

	// length should be 1, old FF problem
	_export(_export.S + _export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
	  // 21.1.2.2 String.fromCodePoint(...codePoints)
	  fromCodePoint: function fromCodePoint(x) {
	    // eslint-disable-line no-unused-vars
	    var res = [];
	    var aLen = arguments.length;
	    var i = 0;
	    var code;
	    while (aLen > i) {
	      code = +arguments[i++];
	      if (_toAbsoluteIndex(code, 0x10ffff) !== code) throw RangeError(code + ' is not a valid code point');
	      res.push(code < 0x10000 ? fromCharCode(code) : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00));
	    }return res.join('');
	  }
	});

	// true  -> String#at
	// false -> String#codePointAt
	var _stringAt = function _stringAt(TO_STRING) {
	  return function (that, pos) {
	    var s = String(_defined(that));
	    var i = _toInteger(pos);
	    var l = s.length;
	    var a, b;
	    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

	var $at = _stringAt(false);
	_export(_export.P, 'String', {
	  // 21.1.3.3 String.prototype.codePointAt(pos)
	  codePointAt: function codePointAt(pos) {
	    return $at(this, pos);
	  }
	});

	var _stringRepeat = function repeat(count) {
	  var str = String(_defined(this));
	  var res = '';
	  var n = _toInteger(count);
	  if (n < 0 || n == Infinity) throw RangeError("Count can't be negative");
	  for (; n > 0; (n >>>= 1) && (str += str)) {
	    if (n & 1) res += str;
	  }return res;
	};

	_export(_export.P, 'String', {
	  // 21.1.3.13 String.prototype.repeat(count)
	  repeat: _stringRepeat
	});

	// 7.2.8 IsRegExp(argument)


	var MATCH = _wks('match');
	var _isRegexp = function _isRegexp(it) {
	  var isRegExp;
	  return _isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : _cof(it) == 'RegExp');
	};

	// helper for String#{startsWith, endsWith, includes}


	var _stringContext = function _stringContext(that, searchString, NAME) {
	  if (_isRegexp(searchString)) throw TypeError('String#' + NAME + " doesn't accept regex!");
	  return String(_defined(that));
	};

	var MATCH$1 = _wks('match');
	var _failsIsRegexp = function _failsIsRegexp(KEY) {
	  var re = /./;
	  try {
	    '/./'[KEY](re);
	  } catch (e) {
	    try {
	      re[MATCH$1] = false;
	      return !'/./'[KEY](re);
	    } catch (f) {/* empty */}
	  }return true;
	};

	var STARTS_WITH = 'startsWith';
	var $startsWith = ''[STARTS_WITH];

	_export(_export.P + _export.F * _failsIsRegexp(STARTS_WITH), 'String', {
	  startsWith: function startsWith(searchString /* , position = 0 */) {
	    var that = _stringContext(this, searchString, STARTS_WITH);
	    var index = _toLength(Math.min(arguments.length > 1 ? arguments[1] : undefined, that.length));
	    var search = String(searchString);
	    return $startsWith ? $startsWith.call(that, search, index) : that.slice(index, index + search.length) === search;
	  }
	});

	var ENDS_WITH = 'endsWith';
	var $endsWith = ''[ENDS_WITH];

	_export(_export.P + _export.F * _failsIsRegexp(ENDS_WITH), 'String', {
	  endsWith: function endsWith(searchString /* , endPosition = @length */) {
	    var that = _stringContext(this, searchString, ENDS_WITH);
	    var endPosition = arguments.length > 1 ? arguments[1] : undefined;
	    var len = _toLength(that.length);
	    var end = endPosition === undefined ? len : Math.min(_toLength(endPosition), len);
	    var search = String(searchString);
	    return $endsWith ? $endsWith.call(that, search, end) : that.slice(end - search.length, end) === search;
	  }
	});

	var INCLUDES = 'includes';

	_export(_export.P + _export.F * _failsIsRegexp(INCLUDES), 'String', {
	  includes: function includes(searchString /* , position = 0 */) {
	    return !!~_stringContext(this, searchString, INCLUDES).indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	// 21.2.5.3 get RegExp.prototype.flags

	var _flags = function _flags() {
	  var that = _anObject(this);
	  var result = '';
	  if (that.global) result += 'g';
	  if (that.ignoreCase) result += 'i';
	  if (that.multiline) result += 'm';
	  if (that.unicode) result += 'u';
	  if (that.sticky) result += 'y';
	  return result;
	};

	// 21.2.5.3 get RegExp.prototype.flags()
	if (_descriptors && /./g.flags != 'g') _objectDp.f(RegExp.prototype, 'flags', {
	  configurable: true,
	  get: _flags
	});

	var _fixReWks = function _fixReWks(KEY, length, exec) {
	  var SYMBOL = _wks(KEY);
	  var fns = exec(_defined, SYMBOL, ''[KEY]);
	  var strfn = fns[0];
	  var rxfn = fns[1];
	  if (_fails(function () {
	    var O = {};
	    O[SYMBOL] = function () {
	      return 7;
	    };
	    return ''[KEY](O) != 7;
	  })) {
	    _redefine(String.prototype, KEY, strfn);
	    _hide(RegExp.prototype, SYMBOL, length == 2
	    // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
	    // 21.2.5.11 RegExp.prototype[@@split](string, limit)
	    ? function (string, arg) {
	      return rxfn.call(string, this, arg);
	    }
	    // 21.2.5.6 RegExp.prototype[@@match](string)
	    // 21.2.5.9 RegExp.prototype[@@search](string)
	    : function (string) {
	      return rxfn.call(string, this);
	    });
	  }
	};

	// @@match logic
	_fixReWks('match', 1, function (defined, MATCH, $match) {
	  // 21.1.3.11 String.prototype.match(regexp)
	  return [function match(regexp) {

	    var O = defined(this);
	    var fn = regexp == undefined ? undefined : regexp[MATCH];
	    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
	  }, $match];
	});

	// @@replace logic
	_fixReWks('replace', 2, function (defined, REPLACE, $replace) {
	  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
	  return [function replace(searchValue, replaceValue) {

	    var O = defined(this);
	    var fn = searchValue == undefined ? undefined : searchValue[REPLACE];
	    return fn !== undefined ? fn.call(searchValue, O, replaceValue) : $replace.call(String(O), searchValue, replaceValue);
	  }, $replace];
	});

	// @@split logic
	_fixReWks('split', 2, function (defined, SPLIT, $split) {

	  var isRegExp = _isRegexp;
	  var _split = $split;
	  var $push = [].push;
	  var $SPLIT = 'split';
	  var LENGTH = 'length';
	  var LAST_INDEX = 'lastIndex';
	  if ('abbc'[$SPLIT](/(b)*/)[1] == 'c' || 'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 || 'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 || '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 || '.'[$SPLIT](/()()/)[LENGTH] > 1 || ''[$SPLIT](/.?/)[LENGTH]) {
	    var NPCG = /()??/.exec('')[1] === undefined; // nonparticipating capturing group
	    // based on es5-shim implementation, need to rework it
	    $split = function $split(separator, limit) {
	      var string = String(this);
	      if (separator === undefined && limit === 0) return [];
	      // If `separator` is not a regex, use native split
	      if (!isRegExp(separator)) return _split.call(string, separator, limit);
	      var output = [];
	      var flags = (separator.ignoreCase ? 'i' : '') + (separator.multiline ? 'm' : '') + (separator.unicode ? 'u' : '') + (separator.sticky ? 'y' : '');
	      var lastLastIndex = 0;
	      var splitLimit = limit === undefined ? 4294967295 : limit >>> 0;
	      // Make `global` and avoid `lastIndex` issues by working with a copy
	      var separatorCopy = new RegExp(separator.source, flags + 'g');
	      var separator2, match, lastIndex, lastLength, i;
	      // Doesn't need flags gy, but they don't hurt
	      if (!NPCG) separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
	      while (match = separatorCopy.exec(string)) {
	        // `separatorCopy.lastIndex` is not reliable cross-browser
	        lastIndex = match.index + match[0][LENGTH];
	        if (lastIndex > lastLastIndex) {
	          output.push(string.slice(lastLastIndex, match.index));
	          // Fix browsers whose `exec` methods don't consistently return `undefined` for NPCG
	          // eslint-disable-next-line no-loop-func
	          if (!NPCG && match[LENGTH] > 1) match[0].replace(separator2, function () {
	            for (i = 1; i < arguments[LENGTH] - 2; i++) {
	              if (arguments[i] === undefined) match[i] = undefined;
	            }
	          });
	          if (match[LENGTH] > 1 && match.index < string[LENGTH]) $push.apply(output, match.slice(1));
	          lastLength = match[0][LENGTH];
	          lastLastIndex = lastIndex;
	          if (output[LENGTH] >= splitLimit) break;
	        }
	        if (separatorCopy[LAST_INDEX] === match.index) separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
	      }
	      if (lastLastIndex === string[LENGTH]) {
	        if (lastLength || !separatorCopy.test('')) output.push('');
	      } else output.push(string.slice(lastLastIndex));
	      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
	    };
	    // Chakra, V8
	  } else if ('0'[$SPLIT](undefined, 0)[LENGTH]) {
	    $split = function $split(separator, limit) {
	      return separator === undefined && limit === 0 ? [] : _split.call(this, separator, limit);
	    };
	  }
	  // 21.1.3.17 String.prototype.split(separator, limit)
	  return [function split(separator, limit) {
	    var O = defined(this);
	    var fn = separator == undefined ? undefined : separator[SPLIT];
	    return fn !== undefined ? fn.call(separator, O, limit) : $split.call(String(O), separator, limit);
	  }, $split];
	});

	// @@search logic
	_fixReWks('search', 1, function (defined, SEARCH, $search) {
	  // 21.1.3.15 String.prototype.search(regexp)
	  return [function search(regexp) {

	    var O = defined(this);
	    var fn = regexp == undefined ? undefined : regexp[SEARCH];
	    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
	  }, $search];
	});

	var _createProperty = function _createProperty(object, index, value) {
	  if (index in object) _objectDp.f(object, index, _propertyDesc(0, value));else object[index] = value;
	};

	_export(_export.S + _export.F * !_iterDetect(function (iter) {
	}), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
	    var O = _toObject(arrayLike);
	    var C = typeof this == 'function' ? this : Array;
	    var aLen = arguments.length;
	    var mapfn = aLen > 1 ? arguments[1] : undefined;
	    var mapping = mapfn !== undefined;
	    var index = 0;
	    var iterFn = core_getIteratorMethod(O);
	    var length, result, step, iterator;
	    if (mapping) mapfn = _ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if (iterFn != undefined && !(C == Array && _isArrayIter(iterFn))) {
	      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
	        _createProperty(result, index, mapping ? _iterCall(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = _toLength(O.length);
	      for (result = new C(length); length > index; index++) {
	        _createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});

	// WebKit Array.of isn't generic
	_export(_export.S + _export.F * _fails(function () {
	  function F() {/* empty */}
	  return !(Array.of.call(F) instanceof F);
	}), 'Array', {
	  // 22.1.2.3 Array.of( ...items)
	  of: function of() /* ...args */{
	    var index = 0;
	    var aLen = arguments.length;
	    var result = new (typeof this == 'function' ? this : Array)(aLen);
	    while (aLen > index) {
	      _createProperty(result, index, arguments[index++]);
	    }result.length = aLen;
	    return result;
	  }
	});

	// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)


	_export(_export.P, 'Array', { copyWithin: _arrayCopyWithin });

	_addToUnscopables('copyWithin');

	// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)

	var $find = _arrayMethods(5);
	var KEY = 'find';
	var forced = true;
	// Shouldn't skip holes
	if (KEY in []) Array(1)[KEY](function () {
	  forced = false;
	});
	_export(_export.P + _export.F * forced, 'Array', {
	  find: function find(callbackfn /* , that = undefined */) {
	    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	_addToUnscopables(KEY);

	// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)

	var $find$1 = _arrayMethods(6);
	var KEY$1 = 'findIndex';
	var forced$1 = true;
	// Shouldn't skip holes
	if (KEY$1 in []) Array(1)[KEY$1](function () {
	  forced$1 = false;
	});
	_export(_export.P + _export.F * forced$1, 'Array', {
	  findIndex: function findIndex(callbackfn /* , that = undefined */) {
	    return $find$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	_addToUnscopables(KEY$1);

	// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)


	_export(_export.P, 'Array', { fill: _arrayFill });

	_addToUnscopables('fill');

	// 20.1.2.2 Number.isFinite(number)

	var _isFinite = _global.isFinite;

	_export(_export.S, 'Number', {
	  isFinite: function isFinite(it) {
	    return typeof it == 'number' && _isFinite(it);
	  }
	});

	// 20.1.2.3 Number.isInteger(number)

	var floor$1 = Math.floor;
	var _isInteger = function isInteger(it) {
	  return !_isObject(it) && isFinite(it) && floor$1(it) === it;
	};

	// 20.1.2.3 Number.isInteger(number)


	_export(_export.S, 'Number', { isInteger: _isInteger });

	// 20.1.2.5 Number.isSafeInteger(number)


	var abs = Math.abs;

	_export(_export.S, 'Number', {
	  isSafeInteger: function isSafeInteger(number) {
	    return _isInteger(number) && abs(number) <= 0x1fffffffffffff;
	  }
	});

	// 20.1.2.4 Number.isNaN(number)


	_export(_export.S, 'Number', {
	  isNaN: function isNaN(number) {
	    // eslint-disable-next-line no-self-compare
	    return number != number;
	  }
	});

	// 20.1.2.1 Number.EPSILON


	_export(_export.S, 'Number', { EPSILON: Math.pow(2, -52) });

	// 20.1.2.10 Number.MIN_SAFE_INTEGER


	_export(_export.S, 'Number', { MIN_SAFE_INTEGER: -0x1fffffffffffff });

	// 20.1.2.6 Number.MAX_SAFE_INTEGER


	_export(_export.S, 'Number', { MAX_SAFE_INTEGER: 0x1fffffffffffff });

	// 20.2.2.20 Math.log1p(x)
	var _mathLog1p = Math.log1p || function log1p(x) {
	  return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : Math.log(1 + x);
	};

	// 20.2.2.3 Math.acosh(x)


	var sqrt = Math.sqrt;
	var $acosh = Math.acosh;

	_export(_export.S + _export.F * !($acosh
	// V8 bug: https://code.google.com/p/v8/issues/detail?id=3509
	&& Math.floor($acosh(Number.MAX_VALUE)) == 710
	// Tor Browser bug: Math.acosh(Infinity) -> NaN
	&& $acosh(Infinity) == Infinity), 'Math', {
	  acosh: function acosh(x) {
	    return (x = +x) < 1 ? NaN : x > 94906265.62425156 ? Math.log(x) + Math.LN2 : _mathLog1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));
	  }
	});

	// 20.2.2.5 Math.asinh(x)

	var $asinh = Math.asinh;

	function asinh(x) {
	  return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : Math.log(x + Math.sqrt(x * x + 1));
	}

	// Tor Browser bug: Math.asinh(0) -> -0
	_export(_export.S + _export.F * !($asinh && 1 / $asinh(0) > 0), 'Math', { asinh: asinh });

	// 20.2.2.7 Math.atanh(x)

	var $atanh = Math.atanh;

	// Tor Browser bug: Math.atanh(-0) -> 0
	_export(_export.S + _export.F * !($atanh && 1 / $atanh(-0) < 0), 'Math', {
	  atanh: function atanh(x) {
	    return (x = +x) == 0 ? x : Math.log((1 + x) / (1 - x)) / 2;
	  }
	});

	// 20.2.2.28 Math.sign(x)
	var _mathSign = Math.sign || function sign(x) {
	  // eslint-disable-next-line no-self-compare
	  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
	};

	// 20.2.2.9 Math.cbrt(x)


	_export(_export.S, 'Math', {
	  cbrt: function cbrt(x) {
	    return _mathSign(x = +x) * Math.pow(Math.abs(x), 1 / 3);
	  }
	});

	// 20.2.2.11 Math.clz32(x)


	_export(_export.S, 'Math', {
	  clz32: function clz32(x) {
	    return (x >>>= 0) ? 31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E) : 32;
	  }
	});

	// 20.2.2.12 Math.cosh(x)

	var exp = Math.exp;

	_export(_export.S, 'Math', {
	  cosh: function cosh(x) {
	    return (exp(x = +x) + exp(-x)) / 2;
	  }
	});

	// 20.2.2.14 Math.expm1(x)
	var $expm1 = Math.expm1;
	var _mathExpm1 = !$expm1
	// Old FF bug
	|| $expm1(10) > 22025.465794806719 || $expm1(10) < 22025.4657948067165168
	// Tor Browser bug
	|| $expm1(-2e-17) != -2e-17 ? function expm1(x) {
	  return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : Math.exp(x) - 1;
	} : $expm1;

	// 20.2.2.14 Math.expm1(x)


	_export(_export.S + _export.F * (_mathExpm1 != Math.expm1), 'Math', { expm1: _mathExpm1 });

	// 20.2.2.16 Math.fround(x)

	var pow = Math.pow;
	var EPSILON = pow(2, -52);
	var EPSILON32 = pow(2, -23);
	var MAX32 = pow(2, 127) * (2 - EPSILON32);
	var MIN32 = pow(2, -126);

	var roundTiesToEven = function roundTiesToEven(n) {
	  return n + 1 / EPSILON - 1 / EPSILON;
	};

	var _mathFround = Math.fround || function fround(x) {
	  var $abs = Math.abs(x);
	  var $sign = _mathSign(x);
	  var a, result;
	  if ($abs < MIN32) return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;
	  a = (1 + EPSILON32 / EPSILON) * $abs;
	  result = a - (a - $abs);
	  // eslint-disable-next-line no-self-compare
	  if (result > MAX32 || result != result) return $sign * Infinity;
	  return $sign * result;
	};

	// 20.2.2.16 Math.fround(x)


	_export(_export.S, 'Math', { fround: _mathFround });

	// 20.2.2.17 Math.hypot([value1[, value2[, … ]]])

	var abs$1 = Math.abs;

	_export(_export.S, 'Math', {
	  hypot: function hypot(value1, value2) {
	    // eslint-disable-line no-unused-vars
	    var sum = 0;
	    var i = 0;
	    var aLen = arguments.length;
	    var larg = 0;
	    var arg, div;
	    while (i < aLen) {
	      arg = abs$1(arguments[i++]);
	      if (larg < arg) {
	        div = larg / arg;
	        sum = sum * div * div + 1;
	        larg = arg;
	      } else if (arg > 0) {
	        div = arg / larg;
	        sum += div * div;
	      } else sum += arg;
	    }
	    return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
	  }
	});

	// 20.2.2.18 Math.imul(x, y)

	var $imul = Math.imul;

	// some WebKit versions fails with big numbers, some has wrong arity
	_export(_export.S + _export.F * _fails(function () {
	  return $imul(0xffffffff, 5) != -5 || $imul.length != 2;
	}), 'Math', {
	  imul: function imul(x, y) {
	    var UINT16 = 0xffff;
	    var xn = +x;
	    var yn = +y;
	    var xl = UINT16 & xn;
	    var yl = UINT16 & yn;
	    return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);
	  }
	});

	// 20.2.2.20 Math.log1p(x)


	_export(_export.S, 'Math', { log1p: _mathLog1p });

	// 20.2.2.21 Math.log10(x)


	_export(_export.S, 'Math', {
	  log10: function log10(x) {
	    return Math.log(x) * Math.LOG10E;
	  }
	});

	// 20.2.2.22 Math.log2(x)


	_export(_export.S, 'Math', {
	  log2: function log2(x) {
	    return Math.log(x) / Math.LN2;
	  }
	});

	// 20.2.2.28 Math.sign(x)


	_export(_export.S, 'Math', { sign: _mathSign });

	// 20.2.2.30 Math.sinh(x)


	var exp$1 = Math.exp;

	// V8 near Chromium 38 has a problem with very small numbers
	_export(_export.S + _export.F * _fails(function () {
	  return !Math.sinh(-2e-17) != -2e-17;
	}), 'Math', {
	  sinh: function sinh(x) {
	    return Math.abs(x = +x) < 1 ? (_mathExpm1(x) - _mathExpm1(-x)) / 2 : (exp$1(x - 1) - exp$1(-x - 1)) * (Math.E / 2);
	  }
	});

	// 20.2.2.33 Math.tanh(x)


	var exp$2 = Math.exp;

	_export(_export.S, 'Math', {
	  tanh: function tanh(x) {
	    var a = _mathExpm1(x = +x);
	    var b = _mathExpm1(-x);
	    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp$2(x) + exp$2(-x));
	  }
	});

	// 20.2.2.34 Math.trunc(x)


	_export(_export.S, 'Math', {
	  trunc: function trunc(it) {
	    return (it > 0 ? Math.floor : Math.ceil)(it);
	  }
	});

	// https://github.com/tc39/Array.prototype.includes

	var $includes = _arrayIncludes(true);

	_export(_export.P, 'Array', {
	  includes: function includes(el /* , fromIndex = 0 */) {
	    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	_addToUnscopables('includes');

	var isEnum$1 = _objectPie.f;
	var _objectToArray = function _objectToArray(isEntries) {
	  return function (it) {
	    var O = _toIobject(it);
	    var keys = _objectKeys(O);
	    var length = keys.length;
	    var i = 0;
	    var result = [];
	    var key;
	    while (length > i) {
	      if (isEnum$1.call(O, key = keys[i++])) {
	        result.push(isEntries ? [key, O[key]] : O[key]);
	      }
	    }return result;
	  };
	};

	// https://github.com/tc39/proposal-object-values-entries

	var $values = _objectToArray(false);

	_export(_export.S, 'Object', {
	  values: function values(it) {
	    return $values(it);
	  }
	});

	// https://github.com/tc39/proposal-object-values-entries

	var $entries = _objectToArray(true);

	_export(_export.S, 'Object', {
	  entries: function entries(it) {
	    return $entries(it);
	  }
	});

	// https://github.com/tc39/proposal-object-getownpropertydescriptors


	_export(_export.S, 'Object', {
	  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
	    var O = _toIobject(object);
	    var getDesc = _objectGopd.f;
	    var keys = _ownKeys(O);
	    var result = {};
	    var i = 0;
	    var key, desc;
	    while (keys.length > i) {
	      desc = getDesc(O, key = keys[i++]);
	      if (desc !== undefined) _createProperty(result, key, desc);
	    }
	    return result;
	  }
	});

	// https://github.com/tc39/proposal-string-pad-start-end


	var _stringPad = function _stringPad(that, maxLength, fillString, left) {
	  var S = String(_defined(that));
	  var stringLength = S.length;
	  var fillStr = fillString === undefined ? ' ' : String(fillString);
	  var intMaxLength = _toLength(maxLength);
	  if (intMaxLength <= stringLength || fillStr == '') return S;
	  var fillLen = intMaxLength - stringLength;
	  var stringFiller = _stringRepeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
	  if (stringFiller.length > fillLen) stringFiller = stringFiller.slice(0, fillLen);
	  return left ? stringFiller + S : S + stringFiller;
	};

	var navigator = _global.navigator;

	var _userAgent = navigator && navigator.userAgent || '';

	// https://github.com/tc39/proposal-string-pad-start-end


	// https://github.com/zloirock/core-js/issues/280
	_export(_export.P + _export.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(_userAgent), 'String', {
	  padStart: function padStart(maxLength /* , fillString = ' ' */) {
	    return _stringPad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
	  }
	});

	// https://github.com/tc39/proposal-string-pad-start-end


	// https://github.com/zloirock/core-js/issues/280
	_export(_export.P + _export.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(_userAgent), 'String', {
	  padEnd: function padEnd(maxLength /* , fillString = ' ' */) {
	    return _stringPad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
	  }
	});

	// ie9- setTimeout & setInterval additional parameters fix


	var slice = [].slice;
	var MSIE = /MSIE .\./.test(_userAgent); // <- dirty ie9- check
	var wrap$1 = function wrap(set) {
	  return function (fn, time /* , ...args */) {
	    var boundArgs = arguments.length > 2;
	    var args = boundArgs ? slice.call(arguments, 2) : false;
	    return set(boundArgs ? function () {
	      // eslint-disable-next-line no-new-func
	      (typeof fn == 'function' ? fn : Function(fn)).apply(this, args);
	    } : fn, time);
	  };
	};
	_export(_export.G + _export.B + _export.F * MSIE, {
	  setTimeout: wrap$1(_global.setTimeout),
	  setInterval: wrap$1(_global.setInterval)
	});

	_export(_export.G + _export.B, {
	  setImmediate: _task.set,
	  clearImmediate: _task.clear
	});

	var ITERATOR$4 = _wks('iterator');
	var TO_STRING_TAG = _wks('toStringTag');
	var ArrayValues = _iterators.Array;

	var DOMIterables = {
	  CSSRuleList: true, // TODO: Not spec compliant, should be false.
	  CSSStyleDeclaration: false,
	  CSSValueList: false,
	  ClientRectList: false,
	  DOMRectList: false,
	  DOMStringList: false,
	  DOMTokenList: true,
	  DataTransferItemList: false,
	  FileList: false,
	  HTMLAllCollection: false,
	  HTMLCollection: false,
	  HTMLFormElement: false,
	  HTMLSelectElement: false,
	  MediaList: true, // TODO: Not spec compliant, should be false.
	  MimeTypeArray: false,
	  NamedNodeMap: false,
	  NodeList: true,
	  PaintRequestList: false,
	  Plugin: false,
	  PluginArray: false,
	  SVGLengthList: false,
	  SVGNumberList: false,
	  SVGPathSegList: false,
	  SVGPointList: false,
	  SVGStringList: false,
	  SVGTransformList: false,
	  SourceBufferList: false,
	  StyleSheetList: true, // TODO: Not spec compliant, should be false.
	  TextTrackCueList: false,
	  TextTrackList: false,
	  TouchList: false
	};

	for (var collections = _objectKeys(DOMIterables), i$1 = 0; i$1 < collections.length; i$1++) {
	  var NAME$1 = collections[i$1];
	  var explicit = DOMIterables[NAME$1];
	  var Collection = _global[NAME$1];
	  var proto = Collection && Collection.prototype;
	  var key;
	  if (proto) {
	    if (!proto[ITERATOR$4]) _hide(proto, ITERATOR$4, ArrayValues);
	    if (!proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME$1);
	    _iterators[NAME$1] = ArrayValues;
	    if (explicit) for (key in es6_array_iterator) {
	      if (!proto[key]) _redefine(proto, key, es6_array_iterator[key], true);
	    }
	  }
	}

	var _typeof$5 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var runtime = createCommonjsModule(function (module) {
	  /**
	   * Copyright (c) 2014-present, Facebook, Inc.
	   *
	   * This source code is licensed under the MIT license found in the
	   * LICENSE file in the root directory of this source tree.
	   */

	  !function (global) {

	    var Op = Object.prototype;
	    var hasOwn = Op.hasOwnProperty;
	    var undefined; // More compressible than void 0.
	    var $Symbol = typeof Symbol === "function" ? Symbol : {};
	    var iteratorSymbol = $Symbol.iterator || "@@iterator";
	    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

	    var inModule = 'object' === "object";
	    var runtime = global.regeneratorRuntime;
	    if (runtime) {
	      if (inModule) {
	        // If regeneratorRuntime is defined globally and we're in a module,
	        // make the exports object identical to regeneratorRuntime.
	        module.exports = runtime;
	      }
	      // Don't bother evaluating the rest of this file if the runtime was
	      // already defined globally.
	      return;
	    }

	    // Define the runtime globally (as expected by generated code) as either
	    // module.exports (if we're in a module) or a new, empty object.
	    runtime = global.regeneratorRuntime = inModule ? module.exports : {};

	    function wrap(innerFn, outerFn, self, tryLocsList) {
	      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	      var generator = Object.create(protoGenerator.prototype);
	      var context = new Context(tryLocsList || []);

	      // The ._invoke method unifies the implementations of the .next,
	      // .throw, and .return methods.
	      generator._invoke = makeInvokeMethod(innerFn, self, context);

	      return generator;
	    }
	    runtime.wrap = wrap;

	    // Try/catch helper to minimize deoptimizations. Returns a completion
	    // record like context.tryEntries[i].completion. This interface could
	    // have been (and was previously) designed to take a closure to be
	    // invoked without arguments, but in all the cases we care about we
	    // already have an existing method we want to call, so there's no need
	    // to create a new function object. We can even get away with assuming
	    // the method takes exactly one argument, since that happens to be true
	    // in every case, so we don't have to touch the arguments object. The
	    // only additional allocation required is the completion record, which
	    // has a stable shape and so hopefully should be cheap to allocate.
	    function tryCatch(fn, obj, arg) {
	      try {
	        return { type: "normal", arg: fn.call(obj, arg) };
	      } catch (err) {
	        return { type: "throw", arg: err };
	      }
	    }

	    var GenStateSuspendedStart = "suspendedStart";
	    var GenStateSuspendedYield = "suspendedYield";
	    var GenStateExecuting = "executing";
	    var GenStateCompleted = "completed";

	    // Returning this object from the innerFn has the same effect as
	    // breaking out of the dispatch switch statement.
	    var ContinueSentinel = {};

	    // Dummy constructor functions that we use as the .constructor and
	    // .constructor.prototype properties for functions that return Generator
	    // objects. For full spec compliance, you may wish to configure your
	    // minifier not to mangle the names of these two functions.
	    function Generator() {}
	    function GeneratorFunction() {}
	    function GeneratorFunctionPrototype() {}

	    // This is a polyfill for %IteratorPrototype% for environments that
	    // don't natively support it.
	    var IteratorPrototype = {};
	    IteratorPrototype[iteratorSymbol] = function () {
	      return this;
	    };

	    var getProto = Object.getPrototypeOf;
	    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	    if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	      // This environment has a native %IteratorPrototype%; use it instead
	      // of the polyfill.
	      IteratorPrototype = NativeIteratorPrototype;
	    }

	    var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
	    GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	    GeneratorFunctionPrototype.constructor = GeneratorFunction;
	    GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

	    // Helper for defining the .next, .throw, and .return methods of the
	    // Iterator interface in terms of a single ._invoke method.
	    function defineIteratorMethods(prototype) {
	      ["next", "throw", "return"].forEach(function (method) {
	        prototype[method] = function (arg) {
	          return this._invoke(method, arg);
	        };
	      });
	    }

	    runtime.isGeneratorFunction = function (genFun) {
	      var ctor = typeof genFun === "function" && genFun.constructor;
	      return ctor ? ctor === GeneratorFunction ||
	      // For the native GeneratorFunction constructor, the best we can
	      // do is to check its .name property.
	      (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
	    };

	    runtime.mark = function (genFun) {
	      if (Object.setPrototypeOf) {
	        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	      } else {
	        genFun.__proto__ = GeneratorFunctionPrototype;
	        if (!(toStringTagSymbol in genFun)) {
	          genFun[toStringTagSymbol] = "GeneratorFunction";
	        }
	      }
	      genFun.prototype = Object.create(Gp);
	      return genFun;
	    };

	    // Within the body of any async function, `await x` is transformed to
	    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	    // `hasOwn.call(value, "__await")` to determine if the yielded value is
	    // meant to be awaited.
	    runtime.awrap = function (arg) {
	      return { __await: arg };
	    };

	    function AsyncIterator(generator) {
	      function invoke(method, arg, resolve, reject) {
	        var record = tryCatch(generator[method], generator, arg);
	        if (record.type === "throw") {
	          reject(record.arg);
	        } else {
	          var result = record.arg;
	          var value = result.value;
	          if (value && (typeof value === "undefined" ? "undefined" : _typeof$5(value)) === "object" && hasOwn.call(value, "__await")) {
	            return Promise.resolve(value.__await).then(function (value) {
	              invoke("next", value, resolve, reject);
	            }, function (err) {
	              invoke("throw", err, resolve, reject);
	            });
	          }

	          return Promise.resolve(value).then(function (unwrapped) {
	            // When a yielded Promise is resolved, its final value becomes
	            // the .value of the Promise<{value,done}> result for the
	            // current iteration. If the Promise is rejected, however, the
	            // result for this iteration will be rejected with the same
	            // reason. Note that rejections of yielded Promises are not
	            // thrown back into the generator function, as is the case
	            // when an awaited Promise is rejected. This difference in
	            // behavior between yield and await is important, because it
	            // allows the consumer to decide what to do with the yielded
	            // rejection (swallow it and continue, manually .throw it back
	            // into the generator, abandon iteration, whatever). With
	            // await, by contrast, there is no opportunity to examine the
	            // rejection reason outside the generator function, so the
	            // only option is to throw it from the await expression, and
	            // let the generator function handle the exception.
	            result.value = unwrapped;
	            resolve(result);
	          }, reject);
	        }
	      }

	      var previousPromise;

	      function enqueue(method, arg) {
	        function callInvokeWithMethodAndArg() {
	          return new Promise(function (resolve, reject) {
	            invoke(method, arg, resolve, reject);
	          });
	        }

	        return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
	        // Avoid propagating failures to Promises returned by later
	        // invocations of the iterator.
	        callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
	      }

	      // Define the unified helper method that is used to implement .next,
	      // .throw, and .return (see defineIteratorMethods).
	      this._invoke = enqueue;
	    }

	    defineIteratorMethods(AsyncIterator.prototype);
	    AsyncIterator.prototype[asyncIteratorSymbol] = function () {
	      return this;
	    };
	    runtime.AsyncIterator = AsyncIterator;

	    // Note that simple async functions are implemented on top of
	    // AsyncIterator objects; they just return a Promise for the value of
	    // the final result produced by the iterator.
	    runtime.async = function (innerFn, outerFn, self, tryLocsList) {
	      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

	      return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function (result) {
	        return result.done ? result.value : iter.next();
	      });
	    };

	    function makeInvokeMethod(innerFn, self, context) {
	      var state = GenStateSuspendedStart;

	      return function invoke(method, arg) {
	        if (state === GenStateExecuting) {
	          throw new Error("Generator is already running");
	        }

	        if (state === GenStateCompleted) {
	          if (method === "throw") {
	            throw arg;
	          }

	          // Be forgiving, per 25.3.3.3.3 of the spec:
	          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	          return doneResult();
	        }

	        context.method = method;
	        context.arg = arg;

	        while (true) {
	          var delegate = context.delegate;
	          if (delegate) {
	            var delegateResult = maybeInvokeDelegate(delegate, context);
	            if (delegateResult) {
	              if (delegateResult === ContinueSentinel) continue;
	              return delegateResult;
	            }
	          }

	          if (context.method === "next") {
	            // Setting context._sent for legacy support of Babel's
	            // function.sent implementation.
	            context.sent = context._sent = context.arg;
	          } else if (context.method === "throw") {
	            if (state === GenStateSuspendedStart) {
	              state = GenStateCompleted;
	              throw context.arg;
	            }

	            context.dispatchException(context.arg);
	          } else if (context.method === "return") {
	            context.abrupt("return", context.arg);
	          }

	          state = GenStateExecuting;

	          var record = tryCatch(innerFn, self, context);
	          if (record.type === "normal") {
	            // If an exception is thrown from innerFn, we leave state ===
	            // GenStateExecuting and loop back for another invocation.
	            state = context.done ? GenStateCompleted : GenStateSuspendedYield;

	            if (record.arg === ContinueSentinel) {
	              continue;
	            }

	            return {
	              value: record.arg,
	              done: context.done
	            };
	          } else if (record.type === "throw") {
	            state = GenStateCompleted;
	            // Dispatch the exception by looping back around to the
	            // context.dispatchException(context.arg) call above.
	            context.method = "throw";
	            context.arg = record.arg;
	          }
	        }
	      };
	    }

	    // Call delegate.iterator[context.method](context.arg) and handle the
	    // result, either by returning a { value, done } result from the
	    // delegate iterator, or by modifying context.method and context.arg,
	    // setting context.delegate to null, and returning the ContinueSentinel.
	    function maybeInvokeDelegate(delegate, context) {
	      var method = delegate.iterator[context.method];
	      if (method === undefined) {
	        // A .throw or .return when the delegate iterator has no .throw
	        // method always terminates the yield* loop.
	        context.delegate = null;

	        if (context.method === "throw") {
	          if (delegate.iterator.return) {
	            // If the delegate iterator has a return method, give it a
	            // chance to clean up.
	            context.method = "return";
	            context.arg = undefined;
	            maybeInvokeDelegate(delegate, context);

	            if (context.method === "throw") {
	              // If maybeInvokeDelegate(context) changed context.method from
	              // "return" to "throw", let that override the TypeError below.
	              return ContinueSentinel;
	            }
	          }

	          context.method = "throw";
	          context.arg = new TypeError("The iterator does not provide a 'throw' method");
	        }

	        return ContinueSentinel;
	      }

	      var record = tryCatch(method, delegate.iterator, context.arg);

	      if (record.type === "throw") {
	        context.method = "throw";
	        context.arg = record.arg;
	        context.delegate = null;
	        return ContinueSentinel;
	      }

	      var info = record.arg;

	      if (!info) {
	        context.method = "throw";
	        context.arg = new TypeError("iterator result is not an object");
	        context.delegate = null;
	        return ContinueSentinel;
	      }

	      if (info.done) {
	        // Assign the result of the finished delegate to the temporary
	        // variable specified by delegate.resultName (see delegateYield).
	        context[delegate.resultName] = info.value;

	        // Resume execution at the desired location (see delegateYield).
	        context.next = delegate.nextLoc;

	        // If context.method was "throw" but the delegate handled the
	        // exception, let the outer generator proceed normally. If
	        // context.method was "next", forget context.arg since it has been
	        // "consumed" by the delegate iterator. If context.method was
	        // "return", allow the original .return call to continue in the
	        // outer generator.
	        if (context.method !== "return") {
	          context.method = "next";
	          context.arg = undefined;
	        }
	      } else {
	        // Re-yield the result returned by the delegate method.
	        return info;
	      }

	      // The delegate iterator is finished, so forget it and continue with
	      // the outer generator.
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    // Define Generator.prototype.{next,throw,return} in terms of the
	    // unified ._invoke helper method.
	    defineIteratorMethods(Gp);

	    Gp[toStringTagSymbol] = "Generator";

	    // A Generator should always return itself as the iterator object when the
	    // @@iterator function is called on it. Some browsers' implementations of the
	    // iterator prototype chain incorrectly implement this, causing the Generator
	    // object to not be returned from this call. This ensures that doesn't happen.
	    // See https://github.com/facebook/regenerator/issues/274 for more details.
	    Gp[iteratorSymbol] = function () {
	      return this;
	    };

	    Gp.toString = function () {
	      return "[object Generator]";
	    };

	    function pushTryEntry(locs) {
	      var entry = { tryLoc: locs[0] };

	      if (1 in locs) {
	        entry.catchLoc = locs[1];
	      }

	      if (2 in locs) {
	        entry.finallyLoc = locs[2];
	        entry.afterLoc = locs[3];
	      }

	      this.tryEntries.push(entry);
	    }

	    function resetTryEntry(entry) {
	      var record = entry.completion || {};
	      record.type = "normal";
	      delete record.arg;
	      entry.completion = record;
	    }

	    function Context(tryLocsList) {
	      // The root entry object (effectively a try statement without a catch
	      // or a finally block) gives us a place to store values thrown from
	      // locations where there is no enclosing try statement.
	      this.tryEntries = [{ tryLoc: "root" }];
	      tryLocsList.forEach(pushTryEntry, this);
	      this.reset(true);
	    }

	    runtime.keys = function (object) {
	      var keys = [];
	      for (var key in object) {
	        keys.push(key);
	      }
	      keys.reverse();

	      // Rather than returning an object with a next method, we keep
	      // things simple and return the next function itself.
	      return function next() {
	        while (keys.length) {
	          var key = keys.pop();
	          if (key in object) {
	            next.value = key;
	            next.done = false;
	            return next;
	          }
	        }

	        // To avoid creating an additional object, we just hang the .value
	        // and .done properties off the next function object itself. This
	        // also ensures that the minifier will not anonymize the function.
	        next.done = true;
	        return next;
	      };
	    };

	    function values(iterable) {
	      if (iterable) {
	        var iteratorMethod = iterable[iteratorSymbol];
	        if (iteratorMethod) {
	          return iteratorMethod.call(iterable);
	        }

	        if (typeof iterable.next === "function") {
	          return iterable;
	        }

	        if (!isNaN(iterable.length)) {
	          var i = -1,
	              next = function next() {
	            while (++i < iterable.length) {
	              if (hasOwn.call(iterable, i)) {
	                next.value = iterable[i];
	                next.done = false;
	                return next;
	              }
	            }

	            next.value = undefined;
	            next.done = true;

	            return next;
	          };

	          return next.next = next;
	        }
	      }

	      // Return an iterator with no values.
	      return { next: doneResult };
	    }
	    runtime.values = values;

	    function doneResult() {
	      return { value: undefined, done: true };
	    }

	    Context.prototype = {
	      constructor: Context,

	      reset: function reset(skipTempReset) {
	        this.prev = 0;
	        this.next = 0;
	        // Resetting context._sent for legacy support of Babel's
	        // function.sent implementation.
	        this.sent = this._sent = undefined;
	        this.done = false;
	        this.delegate = null;

	        this.method = "next";
	        this.arg = undefined;

	        this.tryEntries.forEach(resetTryEntry);

	        if (!skipTempReset) {
	          for (var name in this) {
	            // Not sure about the optimal order of these conditions:
	            if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
	              this[name] = undefined;
	            }
	          }
	        }
	      },

	      stop: function stop() {
	        this.done = true;

	        var rootEntry = this.tryEntries[0];
	        var rootRecord = rootEntry.completion;
	        if (rootRecord.type === "throw") {
	          throw rootRecord.arg;
	        }

	        return this.rval;
	      },

	      dispatchException: function dispatchException(exception) {
	        if (this.done) {
	          throw exception;
	        }

	        var context = this;
	        function handle(loc, caught) {
	          record.type = "throw";
	          record.arg = exception;
	          context.next = loc;

	          if (caught) {
	            // If the dispatched exception was caught by a catch block,
	            // then let that catch block handle the exception normally.
	            context.method = "next";
	            context.arg = undefined;
	          }

	          return !!caught;
	        }

	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	          var entry = this.tryEntries[i];
	          var record = entry.completion;

	          if (entry.tryLoc === "root") {
	            // Exception thrown outside of any try block that could handle
	            // it, so set the completion value of the entire function to
	            // throw the exception.
	            return handle("end");
	          }

	          if (entry.tryLoc <= this.prev) {
	            var hasCatch = hasOwn.call(entry, "catchLoc");
	            var hasFinally = hasOwn.call(entry, "finallyLoc");

	            if (hasCatch && hasFinally) {
	              if (this.prev < entry.catchLoc) {
	                return handle(entry.catchLoc, true);
	              } else if (this.prev < entry.finallyLoc) {
	                return handle(entry.finallyLoc);
	              }
	            } else if (hasCatch) {
	              if (this.prev < entry.catchLoc) {
	                return handle(entry.catchLoc, true);
	              }
	            } else if (hasFinally) {
	              if (this.prev < entry.finallyLoc) {
	                return handle(entry.finallyLoc);
	              }
	            } else {
	              throw new Error("try statement without catch or finally");
	            }
	          }
	        }
	      },

	      abrupt: function abrupt(type, arg) {
	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	          var entry = this.tryEntries[i];
	          if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
	            var finallyEntry = entry;
	            break;
	          }
	        }

	        if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
	          // Ignore the finally entry if control is not jumping to a
	          // location outside the try/catch block.
	          finallyEntry = null;
	        }

	        var record = finallyEntry ? finallyEntry.completion : {};
	        record.type = type;
	        record.arg = arg;

	        if (finallyEntry) {
	          this.method = "next";
	          this.next = finallyEntry.finallyLoc;
	          return ContinueSentinel;
	        }

	        return this.complete(record);
	      },

	      complete: function complete(record, afterLoc) {
	        if (record.type === "throw") {
	          throw record.arg;
	        }

	        if (record.type === "break" || record.type === "continue") {
	          this.next = record.arg;
	        } else if (record.type === "return") {
	          this.rval = this.arg = record.arg;
	          this.method = "return";
	          this.next = "end";
	        } else if (record.type === "normal" && afterLoc) {
	          this.next = afterLoc;
	        }

	        return ContinueSentinel;
	      },

	      finish: function finish(finallyLoc) {
	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	          var entry = this.tryEntries[i];
	          if (entry.finallyLoc === finallyLoc) {
	            this.complete(entry.completion, entry.afterLoc);
	            resetTryEntry(entry);
	            return ContinueSentinel;
	          }
	        }
	      },

	      "catch": function _catch(tryLoc) {
	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	          var entry = this.tryEntries[i];
	          if (entry.tryLoc === tryLoc) {
	            var record = entry.completion;
	            if (record.type === "throw") {
	              var thrown = record.arg;
	              resetTryEntry(entry);
	            }
	            return thrown;
	          }
	        }

	        // The context.catch method must only be called with a location
	        // argument that corresponds to a known catch block.
	        throw new Error("illegal catch attempt");
	      },

	      delegateYield: function delegateYield(iterable, resultName, nextLoc) {
	        this.delegate = {
	          iterator: values(iterable),
	          resultName: resultName,
	          nextLoc: nextLoc
	        };

	        if (this.method === "next") {
	          // Deliberately forget the last sent value so that we don't
	          // accidentally pass it on to the delegate.
	          this.arg = undefined;
	        }

	        return ContinueSentinel;
	      }
	    };
	  }(
	  // In sloppy mode, unbound `this` refers to the global object, fallback to
	  // Function constructor if we're in global strict mode. That is sadly a form
	  // of indirect eval which violates Content Security Policy.
	  function () {
	    return this;
	  }() || Function("return this")());
	});

	(function (self) {

	  if (self.fetch) {
	    return;
	  }

	  var support = {
	    searchParams: 'URLSearchParams' in self,
	    iterable: 'Symbol' in self && 'iterator' in Symbol,
	    blob: 'FileReader' in self && 'Blob' in self && function () {
	      try {
	        new Blob();
	        return true;
	      } catch (e) {
	        return false;
	      }
	    }(),
	    formData: 'FormData' in self,
	    arrayBuffer: 'ArrayBuffer' in self
	  };

	  if (support.arrayBuffer) {
	    var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

	    var isDataView = function isDataView(obj) {
	      return obj && DataView.prototype.isPrototypeOf(obj);
	    };

	    var isArrayBufferView = ArrayBuffer.isView || function (obj) {
	      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
	    };
	  }

	  function normalizeName(name) {
	    if (typeof name !== 'string') {
	      name = String(name);
	    }
	    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
	      throw new TypeError('Invalid character in header field name');
	    }
	    return name.toLowerCase();
	  }

	  function normalizeValue(value) {
	    if (typeof value !== 'string') {
	      value = String(value);
	    }
	    return value;
	  }

	  // Build a destructive iterator for the value list
	  function iteratorFor(items) {
	    var iterator = {
	      next: function next() {
	        var value = items.shift();
	        return { done: value === undefined, value: value };
	      }
	    };

	    if (support.iterable) {
	      iterator[Symbol.iterator] = function () {
	        return iterator;
	      };
	    }

	    return iterator;
	  }

	  function Headers(headers) {
	    this.map = {};

	    if (headers instanceof Headers) {
	      headers.forEach(function (value, name) {
	        this.append(name, value);
	      }, this);
	    } else if (Array.isArray(headers)) {
	      headers.forEach(function (header) {
	        this.append(header[0], header[1]);
	      }, this);
	    } else if (headers) {
	      Object.getOwnPropertyNames(headers).forEach(function (name) {
	        this.append(name, headers[name]);
	      }, this);
	    }
	  }

	  Headers.prototype.append = function (name, value) {
	    name = normalizeName(name);
	    value = normalizeValue(value);
	    var oldValue = this.map[name];
	    this.map[name] = oldValue ? oldValue + ',' + value : value;
	  };

	  Headers.prototype['delete'] = function (name) {
	    delete this.map[normalizeName(name)];
	  };

	  Headers.prototype.get = function (name) {
	    name = normalizeName(name);
	    return this.has(name) ? this.map[name] : null;
	  };

	  Headers.prototype.has = function (name) {
	    return this.map.hasOwnProperty(normalizeName(name));
	  };

	  Headers.prototype.set = function (name, value) {
	    this.map[normalizeName(name)] = normalizeValue(value);
	  };

	  Headers.prototype.forEach = function (callback, thisArg) {
	    for (var name in this.map) {
	      if (this.map.hasOwnProperty(name)) {
	        callback.call(thisArg, this.map[name], name, this);
	      }
	    }
	  };

	  Headers.prototype.keys = function () {
	    var items = [];
	    this.forEach(function (value, name) {
	      items.push(name);
	    });
	    return iteratorFor(items);
	  };

	  Headers.prototype.values = function () {
	    var items = [];
	    this.forEach(function (value) {
	      items.push(value);
	    });
	    return iteratorFor(items);
	  };

	  Headers.prototype.entries = function () {
	    var items = [];
	    this.forEach(function (value, name) {
	      items.push([name, value]);
	    });
	    return iteratorFor(items);
	  };

	  if (support.iterable) {
	    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
	  }

	  function consumed(body) {
	    if (body.bodyUsed) {
	      return Promise.reject(new TypeError('Already read'));
	    }
	    body.bodyUsed = true;
	  }

	  function fileReaderReady(reader) {
	    return new Promise(function (resolve, reject) {
	      reader.onload = function () {
	        resolve(reader.result);
	      };
	      reader.onerror = function () {
	        reject(reader.error);
	      };
	    });
	  }

	  function readBlobAsArrayBuffer(blob) {
	    var reader = new FileReader();
	    var promise = fileReaderReady(reader);
	    reader.readAsArrayBuffer(blob);
	    return promise;
	  }

	  function readBlobAsText(blob) {
	    var reader = new FileReader();
	    var promise = fileReaderReady(reader);
	    reader.readAsText(blob);
	    return promise;
	  }

	  function readArrayBufferAsText(buf) {
	    var view = new Uint8Array(buf);
	    var chars = new Array(view.length);

	    for (var i = 0; i < view.length; i++) {
	      chars[i] = String.fromCharCode(view[i]);
	    }
	    return chars.join('');
	  }

	  function bufferClone(buf) {
	    if (buf.slice) {
	      return buf.slice(0);
	    } else {
	      var view = new Uint8Array(buf.byteLength);
	      view.set(new Uint8Array(buf));
	      return view.buffer;
	    }
	  }

	  function Body() {
	    this.bodyUsed = false;

	    this._initBody = function (body) {
	      this._bodyInit = body;
	      if (!body) {
	        this._bodyText = '';
	      } else if (typeof body === 'string') {
	        this._bodyText = body;
	      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
	        this._bodyBlob = body;
	      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
	        this._bodyFormData = body;
	      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	        this._bodyText = body.toString();
	      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
	        this._bodyArrayBuffer = bufferClone(body.buffer);
	        // IE 10-11 can't handle a DataView body.
	        this._bodyInit = new Blob([this._bodyArrayBuffer]);
	      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
	        this._bodyArrayBuffer = bufferClone(body);
	      } else {
	        throw new Error('unsupported BodyInit type');
	      }

	      if (!this.headers.get('content-type')) {
	        if (typeof body === 'string') {
	          this.headers.set('content-type', 'text/plain;charset=UTF-8');
	        } else if (this._bodyBlob && this._bodyBlob.type) {
	          this.headers.set('content-type', this._bodyBlob.type);
	        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
	        }
	      }
	    };

	    if (support.blob) {
	      this.blob = function () {
	        var rejected = consumed(this);
	        if (rejected) {
	          return rejected;
	        }

	        if (this._bodyBlob) {
	          return Promise.resolve(this._bodyBlob);
	        } else if (this._bodyArrayBuffer) {
	          return Promise.resolve(new Blob([this._bodyArrayBuffer]));
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as blob');
	        } else {
	          return Promise.resolve(new Blob([this._bodyText]));
	        }
	      };

	      this.arrayBuffer = function () {
	        if (this._bodyArrayBuffer) {
	          return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
	        } else {
	          return this.blob().then(readBlobAsArrayBuffer);
	        }
	      };
	    }

	    this.text = function () {
	      var rejected = consumed(this);
	      if (rejected) {
	        return rejected;
	      }

	      if (this._bodyBlob) {
	        return readBlobAsText(this._bodyBlob);
	      } else if (this._bodyArrayBuffer) {
	        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
	      } else if (this._bodyFormData) {
	        throw new Error('could not read FormData body as text');
	      } else {
	        return Promise.resolve(this._bodyText);
	      }
	    };

	    if (support.formData) {
	      this.formData = function () {
	        return this.text().then(decode);
	      };
	    }

	    this.json = function () {
	      return this.text().then(JSON.parse);
	    };

	    return this;
	  }

	  // HTTP methods whose capitalization should be normalized
	  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

	  function normalizeMethod(method) {
	    var upcased = method.toUpperCase();
	    return methods.indexOf(upcased) > -1 ? upcased : method;
	  }

	  function Request(input, options) {
	    options = options || {};
	    var body = options.body;

	    if (input instanceof Request) {
	      if (input.bodyUsed) {
	        throw new TypeError('Already read');
	      }
	      this.url = input.url;
	      this.credentials = input.credentials;
	      if (!options.headers) {
	        this.headers = new Headers(input.headers);
	      }
	      this.method = input.method;
	      this.mode = input.mode;
	      if (!body && input._bodyInit != null) {
	        body = input._bodyInit;
	        input.bodyUsed = true;
	      }
	    } else {
	      this.url = String(input);
	    }

	    this.credentials = options.credentials || this.credentials || 'omit';
	    if (options.headers || !this.headers) {
	      this.headers = new Headers(options.headers);
	    }
	    this.method = normalizeMethod(options.method || this.method || 'GET');
	    this.mode = options.mode || this.mode || null;
	    this.referrer = null;

	    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
	      throw new TypeError('Body not allowed for GET or HEAD requests');
	    }
	    this._initBody(body);
	  }

	  Request.prototype.clone = function () {
	    return new Request(this, { body: this._bodyInit });
	  };

	  function decode(body) {
	    var form = new FormData();
	    body.trim().split('&').forEach(function (bytes) {
	      if (bytes) {
	        var split = bytes.split('=');
	        var name = split.shift().replace(/\+/g, ' ');
	        var value = split.join('=').replace(/\+/g, ' ');
	        form.append(decodeURIComponent(name), decodeURIComponent(value));
	      }
	    });
	    return form;
	  }

	  function parseHeaders(rawHeaders) {
	    var headers = new Headers();
	    rawHeaders.split(/\r?\n/).forEach(function (line) {
	      var parts = line.split(':');
	      var key = parts.shift().trim();
	      if (key) {
	        var value = parts.join(':').trim();
	        headers.append(key, value);
	      }
	    });
	    return headers;
	  }

	  Body.call(Request.prototype);

	  function Response(bodyInit, options) {
	    if (!options) {
	      options = {};
	    }

	    this.type = 'default';
	    this.status = 'status' in options ? options.status : 200;
	    this.ok = this.status >= 200 && this.status < 300;
	    this.statusText = 'statusText' in options ? options.statusText : 'OK';
	    this.headers = new Headers(options.headers);
	    this.url = options.url || '';
	    this._initBody(bodyInit);
	  }

	  Body.call(Response.prototype);

	  Response.prototype.clone = function () {
	    return new Response(this._bodyInit, {
	      status: this.status,
	      statusText: this.statusText,
	      headers: new Headers(this.headers),
	      url: this.url
	    });
	  };

	  Response.error = function () {
	    var response = new Response(null, { status: 0, statusText: '' });
	    response.type = 'error';
	    return response;
	  };

	  var redirectStatuses = [301, 302, 303, 307, 308];

	  Response.redirect = function (url, status) {
	    if (redirectStatuses.indexOf(status) === -1) {
	      throw new RangeError('Invalid status code');
	    }

	    return new Response(null, { status: status, headers: { location: url } });
	  };

	  self.Headers = Headers;
	  self.Request = Request;
	  self.Response = Response;

	  self.fetch = function (input, init) {
	    return new Promise(function (resolve, reject) {
	      var request = new Request(input, init);
	      var xhr = new XMLHttpRequest();

	      xhr.onload = function () {
	        var options = {
	          status: xhr.status,
	          statusText: xhr.statusText,
	          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
	        };
	        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
	        var body = 'response' in xhr ? xhr.response : xhr.responseText;
	        resolve(new Response(body, options));
	      };

	      xhr.onerror = function () {
	        reject(new TypeError('Network request failed'));
	      };

	      xhr.ontimeout = function () {
	        reject(new TypeError('Network request failed'));
	      };

	      xhr.open(request.method, request.url, true);

	      if (request.credentials === 'include') {
	        xhr.withCredentials = true;
	      }

	      if ('responseType' in xhr && support.blob) {
	        xhr.responseType = 'blob';
	      }

	      request.headers.forEach(function (value, name) {
	        xhr.setRequestHeader(name, value);
	      });

	      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
	    });
	  };
	  self.fetch.polyfill = true;
	})(typeof self !== 'undefined' ? self : undefined);

	var threeSurf3d = {

		make: function make(element, geometry, layout) {

			threeSurf3d.update(element, geometry, layout);
		},

		update: function update(element, geometry, layout) {

			if (geometry.newData == false) {
				return;
			}

			if (layout.vScale === undefined) {
				var vScale = geometry.vScale;
			} else {
				var vScale = layout.vScale;
			}

			var color = layout.colourMap === undefined ? d3.scaleSequential(d3.interpolateSpectral) : d3.scaleSequential(layout.colourMap);
			color.domain(vScale);

			geometry.faces.forEach(function (face, index) {
				face.vertexColors[0] = new THREE.Color(color(geometry.faceValues[index][0]));
				face.vertexColors[1] = new THREE.Color(color(geometry.faceValues[index][1]));
				face.vertexColors[2] = new THREE.Color(color(geometry.faceValues[index][2]));
			});

			var container = d3.select(element);

			container.select(".plotArea").remove();

			var div = container.append("div").attr("class", "plotArea");

			var width = container.node().offsetWidth,
			    height = layout.height;

			// Compute normals for shading
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			// Use MeshPhongMaterial for a reflective surface
			var material = new THREE.MeshPhongMaterial({
				side: THREE.DoubleSide,
				color: 0xffffff,
				vertexColors: THREE.VertexColors,
				specular: 0x0,
				shininess: 100.,
				emissive: 0x0
			});

			// Initialise threejs scene
			var scene = new THREE.Scene();

			// Add background colour
			scene.background = new THREE.Color(0xefefef);

			// Add Mesh to scene
			scene.add(new THREE.Mesh(geometry, material));

			// Create renderer
			var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(width, height);

			// Set target DIV for rendering
			//var container = document.getElementById( elementId );
			div.node().appendChild(renderer.domElement);

			// Define the camera
			var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
			camera.position.z = 2;

			// Add controls 
			var controls = new THREE.OrbitControls(camera, renderer.domElement);
			controls.addEventListener('change', function () {
				renderer.render(scene, camera); // re-render if controls move/zoom 
			});
			controls.enableZoom = true;

			var ambientLight = new THREE.AmbientLight(0xaaaaaa);
			scene.add(ambientLight);

			var lights = [];
			lights[0] = new THREE.PointLight(0xffffff, 1, 3);
			lights[1] = new THREE.PointLight(0xffffff, 1, 3);
			lights[2] = new THREE.PointLight(0xffffff, 1, 3);
			lights[3] = new THREE.PointLight(0xffffff, 1, 3);
			lights[4] = new THREE.PointLight(0xffffff, 1, 3);
			lights[5] = new THREE.PointLight(0xffffff, 1, 3);

			lights[0].position.set(0, 2, 0);
			lights[1].position.set(1, 2, 1);
			lights[2].position.set(-1, -2, -1);
			lights[3].position.set(0, 0, 2);
			lights[4].position.set(0, 0, -2);
			lights[5].position.set(0, -2, 0);

			lights.forEach(function (light) {
				scene.add(light);
			});

			// Make initial call to render scene
			renderer.render(scene, camera);

			geometry.newData = false;
		}

	};

	function threeMeshFromStruct(data) {
	  var x, y, z, v, n, m;

	  var xMinAll = d3.min(data.surfaces[0].x);
	  var yMinAll = d3.min(data.surfaces[0].y);
	  var zMinAll = d3.min(data.surfaces[0].z);
	  var vMinAll = d3.min(data.surfaces[0].v);

	  var xMaxAll = d3.max(data.surfaces[0].x);
	  var yMaxAll = d3.max(data.surfaces[0].y);
	  var zMaxAll = d3.max(data.surfaces[0].z);
	  var vMaxAll = d3.max(data.surfaces[0].v);

	  var nDataSets = data.surfaces.length;

	  for (var nds = 1; nds < nDataSets; ++nds) {
	    xMinAll = d3.min(data.surfaces[nds].x) < xMinAll ? d3.min(data.surfaces[nds].x) : xMinAll;
	    yMinAll = d3.min(data.surfaces[nds].y) < yMinAll ? d3.min(data.surfaces[nds].y) : yMinAll;
	    zMinAll = d3.min(data.surfaces[nds].z) < zMinAll ? d3.min(data.surfaces[nds].z) : zMinAll;
	    vMinAll = d3.min(data.surfaces[nds].v) < vMinAll ? d3.min(data.surfaces[nds].v) : vMinAll;
	    xMaxAll = d3.max(data.surfaces[nds].x) > xMaxAll ? d3.max(data.surfaces[nds].x) : xMaxAll;
	    yMaxAll = d3.max(data.surfaces[nds].y) > yMaxAll ? d3.max(data.surfaces[nds].y) : yMaxAll;
	    zMaxAll = d3.max(data.surfaces[nds].z) > zMaxAll ? d3.max(data.surfaces[nds].z) : zMaxAll;
	    vMaxAll = d3.max(data.surfaces[nds].v) > vMaxAll ? d3.max(data.surfaces[nds].v) : vMaxAll;
	  }

	  var xrange = xMaxAll - xMinAll;
	  var yrange = yMaxAll - yMinAll;
	  var zrange = zMaxAll - zMinAll;

	  var xmid = 0.5 * (xMinAll + xMaxAll);
	  var ymid = 0.5 * (yMinAll + yMaxAll);
	  var zmid = 0.5 * (zMinAll + zMaxAll);

	  var scalefac = 1. / d3.max([xrange, yrange, zrange]);

	  // Use d3 for color scale 
	  // vMinAll=0.4;
	  // vMaxAll=1.1;
	  // var color = d3.scaleLinear()
	  //	.domain( [ vMinAll, vMaxAll ] )
	  //	.interpolate(function() { return d3.interpolateRdBu; });

	  // Initialise threejs geometry
	  var geometry = new THREE.Geometry();
	  geometry.faceValues = [];
	  geometry.vScale = [vMinAll, vMaxAll];

	  var noffset = 0;
	  for (nds = 0; nds < nDataSets; ++nds) {
	    x = data.surfaces[nds].x;
	    y = data.surfaces[nds].y;
	    z = data.surfaces[nds].z;
	    v = data.surfaces[nds].v;
	    m = data.surfaces[nds].size[0];
	    n = data.surfaces[nds].size[1];

	    var nverts = n * m;

	    // Add grid vertices to geometry
	    for (var k = 0; k < nverts; ++k) {
	      var newvert = new THREE.Vector3((x[k] - xmid) * scalefac, (y[k] - ymid) * scalefac, (z[k] - zmid) * scalefac);
	      geometry.vertices.push(newvert);
	    }

	    // Add cell faces (2 traingles per cell) to geometry
	    for (var j = 0; j < m - 1; j++) {
	      for (var i = 0; i < n - 1; i++) {
	        var n0 = j * n + i;
	        var n1 = n0 + 1;
	        var n2 = (j + 1) * n + i + 1;
	        var n3 = n2 - 1;
	        var face1 = new THREE.Face3(n0 + noffset, n1 + noffset, n2 + noffset);
	        var face2 = new THREE.Face3(n2 + noffset, n3 + noffset, n0 + noffset);
	        // face1.vertexColors[0] = new THREE.Color( color( v[n0] ) );
	        // face1.vertexColors[1] = new THREE.Color( color( v[n1] ) );
	        // face1.vertexColors[2] = new THREE.Color( color( v[n2] ) );
	        // face2.vertexColors[0] = new THREE.Color( color( v[n2] ) );
	        // face2.vertexColors[1] = new THREE.Color( color( v[n3] ) );
	        // face2.vertexColors[2] = new THREE.Color( color( v[n0] ) );
	        geometry.faces.push(face1);
	        geometry.faces.push(face2);
	        var faceValue1 = [];
	        var faceValue2 = [];
	        faceValue1.push(v[n0]);
	        faceValue1.push(v[n1]);
	        faceValue1.push(v[n2]);
	        faceValue2.push(v[n2]);
	        faceValue2.push(v[n3]);
	        faceValue2.push(v[n0]);
	        geometry.faceValues.push(faceValue1);
	        geometry.faceValues.push(faceValue2);
	      }
	    }
	    noffset = noffset + nverts;
	  }

	  return geometry;
	}

	var d3ContourStruct2d = {

	    make: function make(element, data, layout) {

	        d3ContourStruct2d.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        if (data.newData == false) {
	            return;
	        }

	        var x, y, v, n, m;

	        var marginDefault = { top: 20, right: 65, bottom: 20, left: 10 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        container.select("svg").remove();

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight);

	        var plotArea = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").append("g").attr("class", "plotArea");

	        var scaleMargin = { "left": svgWidth - 60, "top": margin.top };

	        var scaleArea = svg.append("g").attr("class", "scaleArea").attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

	        var xMinAll = d3.min(data.surfaces[0].x);
	        var yMinAll = d3.min(data.surfaces[0].y);
	        var vMinAll = d3.min(data.surfaces[0].v);

	        var xMaxAll = d3.max(data.surfaces[0].x);
	        var yMaxAll = d3.max(data.surfaces[0].y);
	        var vMaxAll = d3.max(data.surfaces[0].v);

	        var nDataSets = data.surfaces.length;

	        for (var nds = 1; nds < nDataSets; ++nds) {
	            xMinAll = d3.min(data.surfaces[nds].x) < xMinAll ? d3.min(data.surfaces[nds].x) : xMinAll;
	            yMinAll = d3.min(data.surfaces[nds].y) < yMinAll ? d3.min(data.surfaces[nds].y) : yMinAll;
	            vMinAll = d3.min(data.surfaces[nds].v) < vMinAll ? d3.min(data.surfaces[nds].v) : vMinAll;
	            xMaxAll = d3.max(data.surfaces[nds].x) > xMaxAll ? d3.max(data.surfaces[nds].x) : xMaxAll;
	            yMaxAll = d3.max(data.surfaces[nds].y) > yMaxAll ? d3.max(data.surfaces[nds].y) : yMaxAll;
	            vMaxAll = d3.max(data.surfaces[nds].v) > vMaxAll ? d3.max(data.surfaces[nds].v) : vMaxAll;
	        }

	        var xRange = xMaxAll - xMinAll;
	        var yRange = yMaxAll - yMinAll;

	        // set x and y scale to maintain 1:1 aspect ratio  
	        var domainAspectRatio = yRange / xRange;
	        var rangeAspectRatio = height / width;

	        if (rangeAspectRatio > domainAspectRatio) {
	            var xscale = d3.scaleLinear().domain([xMinAll, xMaxAll]).range([0, width]);
	            var yscale = d3.scaleLinear().domain([yMinAll, yMaxAll]).range([domainAspectRatio * width, 0]);
	        } else {
	            var xscale = d3.scaleLinear().domain([xMinAll, xMaxAll]).range([0, height / domainAspectRatio]);
	            var yscale = d3.scaleLinear().domain([yMinAll, yMaxAll]).range([height, 0]);
	        }

	        if (layout.vScale !== undefined) {
	            vMinAll = layout.vScale[0];
	            vMaxAll = layout.vScale[1];
	        }

	        // array of threshold values 
	        var thresholds = d3.range(vMinAll, vMaxAll, (vMaxAll - vMinAll) / 21);

	        // colour scale 
	        var colour = layout.colourMap === undefined ? d3.scaleSequential(d3.interpolateSpectral) : d3.scaleSequential(layout.colourMap);
	        colour.domain(d3.extent(thresholds));

	        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);

	        svg.transition().call(zoom.transform, d3.zoomIdentity);
	        svg.call(zoom);

	        for (var nds = 0; nds < nDataSets; ++nds) {
	            x = data.surfaces[nds].x;
	            y = data.surfaces[nds].y;
	            v = data.surfaces[nds].v;
	            m = data.surfaces[nds].size[0];
	            n = data.surfaces[nds].size[1];

	            // configure a projection to map the contour coordinates returned by
	            // d3.contours (px,py) to the input data (xgrid,ygrid)
	            var projection = d3.geoTransform({
	                point: function point(px, py) {
	                    var xfrac, yfrac, xnow, ynow;
	                    var xidx, yidx, idx0, idx1, idx2, idx3;
	                    // remove the 0.5 offset that comes from d3-contour
	                    px = px - 0.5;
	                    py = py - 0.5;
	                    // clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)
	                    px < 0 ? px = 0 : px;
	                    py < 0 ? py = 0 : py;
	                    px > n - 1 ? px = n - 1 : px;
	                    py > m - 1 ? py = m - 1 : py;
	                    // xidx and yidx are the array indices of the "bottom left" corner
	                    // of the cell in which the point (px,py) resides
	                    xidx = Math.floor(px);
	                    yidx = Math.floor(py);
	                    xidx == n - 1 ? xidx = n - 2 : xidx;
	                    yidx == m - 1 ? yidx = m - 2 : yidx;
	                    // xfrac and yfrac give the coordinates, between 0 and 1,
	                    // of the point within the cell 
	                    xfrac = px - xidx;
	                    yfrac = py - yidx;
	                    // indices of the 4 corners of the cell
	                    idx0 = xidx + yidx * n;
	                    idx1 = idx0 + 1;
	                    idx2 = idx0 + n;
	                    idx3 = idx2 + 1;
	                    // bilinear interpolation to find projected coordinates (xnow,ynow)
	                    // of the current contour coordinate
	                    xnow = (1 - xfrac) * (1 - yfrac) * x[idx0] + xfrac * (1 - yfrac) * x[idx1] + yfrac * (1 - xfrac) * x[idx2] + xfrac * yfrac * x[idx3];
	                    ynow = (1 - xfrac) * (1 - yfrac) * y[idx0] + xfrac * (1 - yfrac) * y[idx1] + yfrac * (1 - xfrac) * y[idx2] + xfrac * yfrac * y[idx3];
	                    this.stream.point(xscale(xnow), yscale(ynow));
	                }
	            });

	            // initialise contours
	            var contours = d3.contours().size([n, m]).smooth(true).thresholds(thresholds);

	            // make and project the contours
	            plotArea.selectAll("path").data(contours(v)).enter().append("path").attr("d", d3.geoPath(projection)).attr("fill", function (d) {
	                return colour(d.value);
	            });
	        }

	        // colour scale 
	        var scaleHeight = svgHeight / 2;
	        var colourScale = layout.colourMap === undefined ? d3.scaleSequential(d3.interpolateSpectral) : d3.scaleSequential(layout.colourMap);
	        colourScale.domain([0, scaleHeight]);

	        var scaleBars = scaleArea.selectAll(".scaleBar").data(d3.range(scaleHeight), function (d) {
	            return d;
	        }).enter().append("rect").attr("class", "scaleBar").attr("x", 0).attr("y", function (d, i) {
	            return scaleHeight - i;
	        }).attr("height", 1).attr("width", 20).style("fill", function (d, i) {
	            return colourScale(d);
	        });

	        var cscale = d3.scaleLinear().domain(d3.extent(thresholds)).range([scaleHeight, 0]);

	        var cAxis = d3.axisRight(cscale).ticks(5);

	        scaleArea.append("g").attr("transform", "translate(20,0)").call(cAxis);

	        function zoomed() {
	            var t = d3.event.transform;
	            plotArea.attr("transform", t);
	        }

	        data.newData = false;
	    }
	};

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var DbsliceData = function DbsliceData() {
	  _classCallCheck(this, DbsliceData);
	};

	var dbsliceData = new DbsliceData();

	function makeNewPlot(plotData, index) {

	    var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
	    console.log(plotRowIndex);

	    var plot = d3.select(this).append("div").attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper").append("div").attr("class", "card");

	    var plotHeader = plot.append("div").attr("class", "card-header plotTitle").style("padding", "2px").style("padding-left", "5px").html(plotData.layout.title);

	    var plotBody = plot.append("div").attr("class", "plot").attr("plot-row-index", plotRowIndex).attr("plot-index", index);

	    plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout);
	}

	function updatePlot(plotData, index) {

	    var plot = d3.select(this); // this is the plotBody selection

	    //var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
	    //	 .html( `${plotData.layout.title}` );

	    //var plotBody = plot.append( "div" ).attr( "class", "plot");

	    plotData.plotFunc.update(plot.node(), plotData.data, plotData.layout);
	}

	function update(elementId, session) {

	    var element = d3.select("#" + elementId);

	    if (dbsliceData.filteredTaskIds !== undefined) {
	        element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>");
	    } else {
	        element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
	    }

	    var plotRows = element.selectAll(".plotRow").data(session.plotRows);

	    var newPlotRows = plotRows.enter().append("div").attr("class", "card bg-light plotRow").attr("style", "margin-bottom:20px").attr("plot-row-index", function (d, i) {
	        return i;
	    });

	    var newPlotRowsHeader = newPlotRows.append("div").attr("class", "card-header plotRowTitle").call(function (selection) {
	        selection.html(function (d) {
	            var html = "<h3 style='display:inline'>" + d.title + "</h3>";
	            if (d.headerButton !== undefined) {
	                html += "<button class='btn btn-success float-right' id='" + d.headerButton.id + "'>" + d.headerButton.label + "</button>";
	            }
	            return html;
	        });
	    });

	    var newPlotRowsBody = newPlotRows.append("div").attr("class", "row no-gutters plotRowBody").attr("plot-row-index", function (d, i) {
	        return i;
	    });

	    var newPlots = newPlotRowsBody.selectAll(".plot").data(function (d) {
	        return d.plots;
	    }).enter().each(makeNewPlot);

	    plotRows.selectAll(".plotRowBody").selectAll(".plot").data(function (d) {
	        return d.plots;
	    }).enter().each(makeNewPlot);

	    var plotRowPlots = plotRows.selectAll(".plot").data(function (d) {
	        return d.plots;
	    }).each(updatePlot);

	    var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper").data(function (d) {
	        return d.plots;
	    }).each(function (plotData, index) {
	        var plotWrapper = d3.select(this);
	        var plotTitle = plotWrapper.select(".plotTitle").html(plotData.layout.title);
	    });

	    plotRows.exit().remove();
	    plotRowPlotWrappers.exit().remove();
	}

	function makePlotsFromPlotRowCtrl(ctrl) {

	    var plotPromises = [];

	    if (ctrl.sliceIds === undefined) {

	        var nTasks = ctrl.taskIds.length;

	        if (ctrl.maxTasks !== undefined) nTasks = Math.min(nTasks, ctrl.maxTasks);

	        for (var index = 0; index < nTasks; ++index) {

	            if (ctrl.urlTemplate == null) {

	                var url = ctrl.taskIds[index];
	            } else {

	                var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]);
	            }

	            var title = ctrl.taskLabels[index];

	            var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);

	            plotPromises.push(plotPromise);
	        }
	    } else {

	        ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {

	            var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);

	            plotPromises.push(plotPromise);
	        });
	    }

	    return Promise.all(plotPromises);
	}

	function makePromiseTaskPlot(ctrl, url, title, taskId) {

	    return fetch(url).then(function (response) {

	        if (ctrl.csv === undefined) {

	            return response.json();
	        }

	        if (ctrl.csv == true) {

	            return response.text();
	        }
	    }).then(function (responseJson) {

	        if (ctrl.csv == true) {

	            responseJson = d3.csvParse(responseJson);
	        }

	        var plot = {};

	        if (ctrl.formatDataFunc !== undefined) {

	            plot.data = ctrl.formatDataFunc(responseJson, taskId);
	        } else {

	            plot.data = responseJson;
	        }

	        plot.layout = Object.assign({}, ctrl.layout);

	        plot.plotFunc = ctrl.plotFunc;

	        plot.layout.title = title;

	        plot.data.newData = true;

	        return plot;
	    });
	}

	function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {

	    var slicePromisesPerPlot = [];
	    var tasksOnPlot = [];

	    var nTasks = ctrl.taskIds.length;

	    if (ctrl.maxTasks !== undefined) Math.min(nTasks, ctrl.maxTasks);

	    for (var index = 0; index < nTasks; ++index) {

	        tasksOnPlot.push(ctrl.taskIds[index]);

	        var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]).replace("${sliceId}", sliceId);

	        //console.log(url);

	        var slicePromise = fetch(url).then(function (response) {

	            if (ctrl.csv === undefined) {

	                return response.json();
	            }

	            if (ctrl.csv == true) {

	                return response.text();
	            }
	        });

	        slicePromisesPerPlot.push(slicePromise);
	    }

	    // slicePromises.push( slicePromisesPerPlot );

	    return Promise.all(slicePromisesPerPlot).then(function (responseJson) {

	        if (ctrl.csv == true) {

	            var responseCsv = [];

	            responseJson.forEach(function (d) {

	                responseCsv.push(d3.csvParse(d));
	            });

	            responseJson = responseCsv;
	        }

	        var plot = {};

	        if (ctrl.formatDataFunc !== undefined) {

	            plot.data = ctrl.formatDataFunc(responseJson, tasksOnPlot);
	        } else {

	            plot.data = responseJson;
	        }

	        plot.layout = Object.assign({}, ctrl.layout);

	        if (ctrl.layout.xRange !== undefined) {

	            if (ctrl.layout.xRange[1].length !== undefined) {

	                plot.layout.xRange = ctrl.layout.xRange[sliceIndex];
	            }
	        }

	        if (ctrl.layout.yRange !== undefined) {

	            if (ctrl.layout.yRange[1].length !== undefined) {

	                plot.layout.yRange = ctrl.layout.yRange[sliceIndex];
	            }
	        }

	        plot.plotFunc = ctrl.plotFunc;

	        plot.layout.title = sliceId;

	        plot.data.newData = true;

	        return plot;
	    });
	}

	function refreshTasksInPlotRows() {

		var plotRows = dbsliceData.session.plotRows;

		var plotRowPromises = [];

		plotRows.forEach(function (plotRow) {

			if (plotRow.ctrl !== undefined) {

				var ctrl = plotRow.ctrl;

				if (ctrl.plotFunc !== undefined) {

					if (ctrl.tasksByFilter) {

						ctrl.taskIds = dbsliceData.filteredTaskIds;
						ctrl.taskLabels = dbsliceData.filteredTaskLabels;
					}

					if (ctrl.tasksByList) {

						ctrl.taskIds = dbsliceData.manualListTaskIds;
					}

					var plotRowPromise = makePlotsFromPlotRowCtrl(ctrl).then(function (plots) {
						plotRow.plots = plots;
					});

					plotRowPromises.push(plotRowPromise);
				}
			}
		});

		Promise.all(plotRowPromises).then(function () {

			//console.log("rendering....");

			render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
		});
	}

	function makeSessionHeader(element, title, subtitle, config) {

		element.append("div").attr("class", "row sessionHeader").append("div").attr("class", "col-md-12 sessionTitle");

		var titleHtml = "<br/><h1 style='display:inline'>" + title + "</h1>";

		if (config.plotTasksButton) {

			titleHtml += "<button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/>";
		} else {
			titleHtml += "<br/>";
		}

		if (subtitle === undefined) {

			titleHtml += "<br/>";
		} else {

			titleHtml += "<p>" + subtitle + "</p>";
		}

		element.select(".sessionTitle").html(titleHtml).append("div").attr("class", "filteredTaskCount");

		$("#refreshTasks").on("click", function () {
			refreshTasksInPlotRows();
		});
	}

	function render(elementId, session) {
		var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { plotTasksButton: false };


		dbsliceData.session = session;
		dbsliceData.elementId = elementId;
		dbsliceData.config = config;

		var element = d3.select("#" + elementId);

		var sessionHeader = element.select(".sessionHeader");

		if (sessionHeader.empty()) makeSessionHeader(element, session.title, session.subtitle, config);

		update(elementId, session);
	}

	var d3LineSeries = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

	        d3LineSeries.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var container = d3.select(element);
	        var svg = container.select("svg");
	        var plotArea = svg.select(".plotArea");

	        var colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
	        if (layout.cSet !== undefined) colour.domain(layout.cSet);

	        var lines = plotArea.selectAll(".line");

	        if (layout.highlightTasks == true) {
	            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
	                lines
	                //.style( "opacity" , 1.0 )
	                .style("stroke-width", "2.5px").style("stroke", function (d) {
	                    return colour(d.cKey);
	                });
	            } else {
	                lines
	                //.style( "opacity" , 0.2)
	                .style("stroke-width", "2.5px").style("stroke", "#d3d3d3");
	                dbsliceData.highlightTasks.forEach(function (taskId) {
	                    lines.filter(function (d, i) {
	                        return d.taskId == taskId;
	                    })
	                    //.style( "opacity" , 1.0)
	                    .style("stroke", function (d) {
	                        return colour(d.cKey);
	                    }).style("stroke-width", "4px").each(function () {
	                        this.parentNode.parentNode.appendChild(this.parentNode);
	                    });
	                });
	            }
	        }

	        if (data.newData == false) {
	            return;
	        }

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var plotRowIndex = container.attr("plot-row-index");
	        var plotIndex = container.attr("plot-index");
	        var clipId = "clip-" + plotRowIndex + "-" + plotIndex;

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var nseries = data.series.length;

	        var xmin = d3.min(data.series[0].data, function (d) {
	            return d.x;
	        });
	        var xmax = d3.max(data.series[0].data, function (d) {
	            return d.x;
	        });
	        var ymin = d3.min(data.series[0].data, function (d) {
	            return d.y;
	        });
	        var ymax = d3.max(data.series[0].data, function (d) {
	            return d.y;
	        });

	        for (var n = 1; n < nseries; ++n) {
	            var xminNow = d3.min(data.series[n].data, function (d) {
	                return d.x;
	            });
	            xminNow < xmin ? xmin = xminNow : xmin = xmin;
	            var xmaxNow = d3.max(data.series[n].data, function (d) {
	                return d.x;
	            });
	            xmaxNow > xmax ? xmax = xmaxNow : xmax = xmax;
	            var yminNow = d3.min(data.series[n].data, function (d) {
	                return d.y;
	            });
	            yminNow < ymin ? ymin = yminNow : ymin = ymin;
	            var ymaxNow = d3.max(data.series[n].data, function (d) {
	                return d.y;
	            });
	            ymaxNow > ymax ? ymax = ymaxNow : ymax = ymax;
	        }

	        if (layout.xRange === undefined) {
	            var xRange = [xmin, xmax];
	        } else {
	            var xRange = layout.xRange;
	        }

	        if (layout.yRange === undefined) {
	            var yRange = [ymin, ymax];
	        } else {
	            var yRange = layout.yRange;
	        }

	        if (layout.xscale == "time") {
	            var xscale = d3.scaleTime();
	            var xscale0 = d3.scaleTime();
	        } else {
	            var xscale = d3.scaleLinear();
	            var xscale0 = d3.scaleLinear();
	        }

	        xscale.range([0, width]).domain(xRange);

	        xscale0.range([0, width]).domain(xRange);

	        var yscale = d3.scaleLinear().range([height, 0]).domain(yRange);

	        var yscale0 = d3.scaleLinear().range([height, 0]).domain(yRange);

	        //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
	        //if ( layout.cSet !== undefined) colour.domain( layout.cSet );

	        var line = d3.line().x(function (d) {
	            return xscale(d.x);
	        }).y(function (d) {
	            return yscale(d.y);
	        });

	        var clip = svg.append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", width).attr("height", height);

	        var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);

	        svg.transition().call(zoom.transform, d3.zoomIdentity);
	        svg.call(zoom);

	        var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
	            return "<span>" + d.label + "</span>";
	        });

	        svg.call(tip);

	        var focus = plotArea.append("g").style("display", "none").append("circle").attr("r", 1);

	        var allSeries = plotArea.selectAll(".plotSeries").data(data.series);

	        allSeries.enter().each(function () {
	            var series = d3.select(this);
	            var seriesLine = series.append("g").attr("class", "plotSeries").attr("series-name", function (d) {
	                return d.label;
	            }).attr("clip-path", "url(#" + clipId + ")").append("path").attr("class", "line").attr("d", function (d) {
	                return line(d.data);
	            }).style("stroke", function (d) {
	                return colour(d.cKey);
	            }).style("fill", "none").style("stroke-width", "2.5px")
	            //.attr( "clip-path", "url(#clip)")
	            .on("mouseover", tipOn).on("mouseout", tipOff);
	        });

	        allSeries.each(function () {
	            var series = d3.select(this);
	            var seriesLine = series.select("path.line");
	            seriesLine.transition().attr("d", function (d) {
	                return line(d.data);
	            }).style("stroke", function (d) {
	                return colour(d.cKey);
	            });
	        });

	        allSeries.exit().remove();

	        var xAxis = d3.axisBottom(xscale).ticks(5);
	        var yAxis = d3.axisLeft(yscale);

	        var gX = plotArea.select(".axis--x");
	        if (gX.empty()) {
	            gX = plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "axis--x").call(xAxis);
	            gX.append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom).attr("text-anchor", "end").text(layout.xAxisLabel);
	        } else {
	            gX.transition().call(xAxis);
	        }

	        var gY = plotArea.select(".axis--y");
	        if (gY.empty()) {
	            gY = plotArea.append("g").attr("class", "axis--y").call(yAxis);
	            gY.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(layout.yAxisLabel);
	        } else {
	            gY.transition().call(yAxis);
	        }

	        function zoomed() {
	            var t = d3.event.transform;
	            xscale.domain(t.rescaleX(xscale0).domain());
	            yscale.domain(t.rescaleY(yscale0).domain());
	            gX.call(xAxis);
	            gY.call(yAxis);
	            plotArea.selectAll(".line").attr("d", function (d) {
	                return line(d.data);
	            });
	        }

	        function tipOn(d) {
	            lines.style("opacity", 0.2);
	            d3.select(this).style("opacity", 1.0).style("stroke-width", "4px");
	            focus.attr("cx", d3.mouse(this)[0]).attr("cy", d3.mouse(this)[1]);
	            tip.show(d, focus.node());
	            if (layout.highlightTasks == true) {
	                dbsliceData.highlightTasks = [d.taskId];
	                render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            }
	        }

	        function tipOff() {
	            lines.style("opacity", 1.0);
	            d3.select(this).style("stroke-width", "2.5px");
	            tip.hide();
	            if (layout.highlightTasks == true) {
	                dbsliceData.highlightTasks = [];
	                render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            }
	        }

	        data.newData = false;
	    }
	};

	var d3Scatter = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

	        d3Scatter.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svg = container.select("svg");

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var xscale = d3.scaleLinear().range([0, width]).domain(d3.extent(data.points, function (d) {
	            return d.x;
	        }));
	        var yscale = d3.scaleLinear().range([height, 0]).domain(d3.extent(data.points, function (d) {
	            return d.y;
	        }));

	        var colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);

	        var plotArea = svg.select(".plotArea");

	        var points = plotArea.selectAll("circle").data(data.points);

	        points.enter().append("circle").attr("r", 5).attr("cx", function (d) {
	            return xscale(d.x);
	        }).attr("cy", function (d) {
	            return yscale(d.y);
	        }).style("fill", function (d) {
	            return colour(d.colField);
	        });
	        //.style( "fill-opacity", 1e-6)
	        //.transition()
	        //    .style( "fill-opacity", 1);

	        points.transition()
	        //.duration(5000)
	        .attr("r", 5).attr("cx", function (d) {
	            return xscale(d.x);
	        }).attr("cy", function (d) {
	            return yscale(d.y);
	        }).style("fill", function (d) {
	            return colour(d.colField);
	        });

	        points.exit().remove();

	        var xAxis = plotArea.select(".xAxis");
	        if (xAxis.empty()) {
	            plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "xAxis").call(d3.axisBottom(xscale)).append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom).attr("text-anchor", "end").text(layout.xAxisLabel);
	        } else {
	            xAxis.attr("transform", "translate(0," + height + ")").transition().call(d3.axisBottom(xscale));
	        }

	        var yAxis = plotArea.select(".yAxis");
	        if (yAxis.empty()) {
	            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(yscale)).append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(layout.yAxisLabel);
	        } else {
	            yAxis.transition().call(d3.axisLeft(yscale));
	        }
	    }

	};

	function cfUpdateFilters(crossfilter) {

	  // update crossfilter with the filters selected at the bar charts
	  crossfilter.filterSelected.forEach(function (filters, i) {

	    // if the filters array is empty: ie. all are selected, then reset the dimension
	    if (filters.length === 0) {
	      //reset filter
	      crossfilter.metaDims[i].filterAll();
	    } else {
	      crossfilter.metaDims[i].filter(function (d) {
	        return filters.indexOf(d) > -1;
	      });
	    }
	  });

	  // update crossfilter with the items selected at the histograms
	  crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
	    // first reset all filters
	    crossfilter.dataDims[i].filterAll();
	    if (selectedRange.length !== 0) {
	      crossfilter.dataDims[i].filter(function (d) {
	        return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
	      });
	    }
	  });

	  var currentMetaData = crossfilter.metaDims[0].top(Infinity);

	  dbsliceData.filteredTaskIds = currentMetaData.map(function (d) {
	    return d.taskId;
	  });

	  if (currentMetaData[0].label !== undefined) {

	    dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
	      return d.label;
	    });
	  } else {

	    dbsliceData.filteredTaskLabels = currentMetaData.map(function (d) {
	      return d.taskId;
	    });
	  }

	  //render( dbsliceData.elementId , dbsliceData.session , dbsliceData.config );
	}

	var cfD3BarChart = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 20 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var dimId = data.cfData.metaDataProperties.indexOf(data.property);

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

	        cfD3BarChart.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 20 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svg = container.select("svg");

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var plotArea = svg.select(".plotArea");
	        var dimId = plotArea.attr("dimId");
	        var dim = data.cfData.metaDims[dimId];

	        var bars = plotArea.selectAll("rect");

	        if (layout.highlightTasks == true) {

	            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

	                bars.style("stroke-width", "0px");
	            } else {

	                bars.style("stroke-width", "0px").style("stroke", "red");
	                dbsliceData.highlightTasks.forEach(function (taskId) {
	                    var keyNow = dim.top(Infinity).filter(function (d) {
	                        return d.taskId == taskId;
	                    })[0][data.property];
	                    bars.filter(function (d, i) {
	                        return d.key == keyNow;
	                    }).style("stroke-width", "4px");
	                });
	            }
	        }

	        var cf = data.cfData.cf;
	        var property = data.property;

	        //var dim = data.cfData.metaDims[ dimId ];
	        var group = dim.group();

	        //var items = group.top( Infinity );
	        var items = group.all();

	        var removeZeroBar = layout.removeZeroBar === undefined ? false : layout.removeZeroBar;
	        if (removeZeroBar) items = items.filter(function (item) {
	            return item.value > 0;
	        });

	        var x = d3.scaleLinear().range([0, width]).domain([0, d3.max(items, function (v) {
	            return v.value;
	        })]);

	        var y = d3.scaleBand().range([0, height]).domain(items.map(function (d) {
	            return d.key;
	        })).padding([0.2]).align([0.5]);

	        var colour = layout.colourMap === undefined ? d3.scaleOrdinal().range(["cornflowerblue"]) : d3.scaleOrdinal(layout.colourMap);
	        colour.domain(data.cfData.metaDataUniqueValues[property]);

	        bars = plotArea.selectAll("rect").data(items, function (v) {
	            return v.key;
	        });

	        bars.enter().append("rect").on("click", function (selectedItem) {

	            if (data.cfData.filterSelected[dimId] === undefined) {
	                data.cfData.filterSelected[dimId] = [];
	            }

	            // check if current filter is already active
	            if (data.cfData.filterSelected[dimId].indexOf(selectedItem.key) !== -1) {

	                // already active
	                var ind = data.cfData.filterSelected[dimId].indexOf(selectedItem.key);
	                data.cfData.filterSelected[dimId].splice(ind, 1);
	            } else {

	                data.cfData.filterSelected[dimId].push(selectedItem.key);
	            }

	            cfUpdateFilters(data.cfData);
	            render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	        }).attr("height", y.bandwidth()).attr("y", function (v) {
	            return y(v.key);
	        }).style("fill", function (v) {
	            return colour(v.key);
	        }).transition().attr("width", function (v) {
	            return x(v.value);
	        })
	        // initialise opacity for later transition
	        .attr("opacity", 1);

	        // updating the bar chart bars
	        bars.transition().attr("width", function (v) {
	            return x(v.value);
	        }).attr("y", function (v) {
	            return y(v.key);
	        }).attr("height", y.bandwidth())
	        // change colour depending on whether the bar has been selected
	        .attr("opacity", function (v) {

	            // if no filters then all are selected
	            if (data.cfData.filterSelected[dimId] === undefined || data.cfData.filterSelected[dimId].length === 0) {

	                return 1;
	            } else {

	                return data.cfData.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
	            }
	        });

	        bars.exit().transition().attr("width", 0).remove();

	        var xAxis = plotArea.select(".xAxis");
	        if (xAxis.empty()) {
	            plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "xAxis").call(d3.axisBottom(x)).append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom - 2).attr("text-anchor", "end").text("Number of Cases");
	        } else {
	            xAxis.attr("transform", "translate(0," + height + ")").transition().call(d3.axisBottom(x));
	        }

	        var yAxis = plotArea.select(".yAxis");
	        if (yAxis.empty()) {
	            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(y).tickValues([]));
	        } else {
	            yAxis.transition().call(d3.axisLeft(y).tickValues([]));
	        }

	        var keyLabels = plotArea.selectAll(".keyLabel").data(items, function (v) {
	            return v.key;
	        });

	        keyLabels.enter().append("text").attr("class", "keyLabel").attr("x", 0).attr("y", function (v) {
	            return y(v.key) + 0.5 * y.bandwidth();
	        }).attr("dx", 5).attr("dy", ".35em").attr("text-anchor", "start").text(function (v) {
	            return v.key;
	        });

	        // updating meta Labels
	        keyLabels.transition().attr("y", function (v) {
	            return y(v.key) + 0.5 * y.bandwidth();
	        }).text(function (v) {
	            return v.key;
	        });

	        keyLabels.exit().remove();
	    }
	};

	var cfD3Histogram = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var dimId = data.cfData.dataProperties.indexOf(data.property);

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight);

	        var plotArea = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

	        var dim = data.cfData.dataDims[dimId];
	        var items = dim.top(Infinity);

	        var xDomMax = d3.max(items, function (d) {
	            return d[data.property];
	        }) * 1.1;
	        plotArea.attr("xDomMax", xDomMax);

	        var xDomMin = d3.min(items, function (d) {
	            return d[data.property];
	        }) * 0.9;
	        plotArea.attr("xDomMin", xDomMin);

	        var x = d3.scaleLinear().domain([xDomMin, xDomMax]).rangeRound([0, width]);

	        plotArea.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

	        var brush = d3.brushX().extent([[0, 0], [width, height]]).on("start brush end", brushmoved);

	        var gBrush = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "brush").call(brush);

	        // style brush resize handle
	        // https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466
	        var brushResizePath = function brushResizePath(d) {
	            var e = +(d.type == "e"),
	                x = e ? 1 : -1,
	                y = height / 2;
	            return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
	        };

	        var handle = gBrush.selectAll("handleCustom").data([{ type: "w" }, { type: "e" }]).enter().append("path").attr("class", "handleCustom").attr("stroke", "#000").attr("cursor", "ewResize").attr("d", brushResizePath);

	        var brushInit = true;
	        gBrush.call(brush.move, x.domain().map(x));
	        brushInit = false;

	        function brushmoved() {
	            var s = d3.event.selection;
	            if (s == null) {
	                handle.attr("display", "none");
	                data.cfData.histogramSelectedRanges[dimId] = [];
	                cfUpdateFilters(data.cfData);
	                if (brushInit == false) render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            } else {
	                var sx = s.map(x.invert);
	                handle.attr("display", null).attr("transform", function (d, i) {
	                    return "translate(" + [s[i], -height / 4] + ")";
	                });
	                data.cfData.histogramSelectedRanges[dimId] = sx;
	                cfUpdateFilters(data.cfData);
	                if (brushInit == false) render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            }
	        }

	        cfD3Histogram.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svg = container.select("svg");

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var plotArea = svg.select(".plotArea");
	        var dimId = plotArea.attr("dimId");
	        var dim = data.cfData.dataDims[dimId];
	        var cf = data.cfData.cf;
	        var property = data.property;

	        var bars = plotArea.selectAll("rect");

	        if (layout.highlightTasks == true) {

	            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

	                bars.style("stroke-width", "0px");
	            } else {

	                bars.style("stroke-width", "0px").style("stroke", "red");
	                dbsliceData.highlightTasks.forEach(function (taskId) {
	                    var valueNow = dim.top(Infinity).filter(function (d) {
	                        return d.taskId == taskId;
	                    })[0][data.property];
	                    bars.filter(function (d, i) {
	                        return d.x0 <= valueNow && d.x1 > valueNow;
	                    }).style("stroke-width", "4px");
	                });
	            }
	        }

	        var formatCount = d3.format(",.0f");

	        var items = dim.top(Infinity);

	        var xDomMax = plotArea.attr("xDomMax");
	        var xDomMin = plotArea.attr("xDomMin");
	        var x = d3.scaleLinear().domain([xDomMin, xDomMax]).rangeRound([0, width]);

	        var histogram = d3.histogram().value(function (d) {
	            return d[property];
	        }).domain(x.domain()).thresholds(x.ticks(20));

	        var bins = histogram(items);

	        var y = d3.scaleLinear().domain([0, d3.max(bins, function (d) {
	            return d.length;
	        })]).range([height, 0]);

	        bars = plotArea.selectAll("rect").data(bins);

	        var colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;

	        bars.enter().append("rect").attr("transform", function (d) {
	            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
	        }).attr("x", 1).attr("width", function (d) {
	            return x(d.x1) - x(d.x0) - 1;
	        }).attr("height", function (d) {
	            return height - y(d.length);
	        }).style("fill", colour).attr("opacity", "1");

	        bars.transition().attr("transform", function (d) {
	            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
	        }).attr("x", 1).attr("width", function (d) {
	            return x(d.x1) - x(d.x0) - 1;
	        }).attr("height", function (d) {
	            return height - y(d.length);
	        });

	        bars.exit().remove();

	        var yAxis = plotArea.select(".yAxis");
	        if (yAxis.empty()) {
	            plotArea.append("g").attr("class", "yAxis").call(d3.axisLeft(y));
	        } else {
	            yAxis.transition().call(d3.axisLeft(y));
	        }

	        var yAxisLabel = plotArea.select(".yAxis").select(".yAxisLabel");
	        if (yAxisLabel.empty()) {
	            plotArea.select(".yAxis").append("text").attr("class", "yAxisLabel").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -25).attr("text-anchor", "end").text("Number of tasks");
	        }

	        var xAxisLabel = plotArea.select(".yAxis").select(".xAxisLabel");
	        if (xAxisLabel.empty()) {
	            plotArea.select(".yAxis").append("text").attr("class", "xAxisLabel").attr("fill", "#000").attr("x", width).attr("y", height + margin.bottom - 2).attr("text-anchor", "end").text(property);
	        }
	    }

	};

	var cfD3Scatter = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var dimId = data.cfData.dataProperties.indexOf(data.xProperty);

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea").attr("dimId", dimId);

	        cfD3Scatter.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var plotRowIndex = container.attr("plot-row-index");
	        var plotIndex = container.attr("plot-index");
	        var clipId = "clip-" + plotRowIndex + "-" + plotIndex;

	        var svg = container.select("svg");

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var plotArea = svg.select(".plotArea");
	        var dimId = plotArea.attr("dimId");

	        var cf = data.cfData.cf;
	        var xProperty = data.xProperty;
	        var yProperty = data.yProperty;
	        var cProperty = data.cProperty;

	        var dim = data.cfData.dataDims[dimId];
	        var pointData = dim.top(Infinity);

	        if (layout.xRange === undefined) {
	            var xMin = d3.min(pointData, function (d) {
	                return d[xProperty];
	            });
	            var xMax = d3.max(pointData, function (d) {
	                return d[xProperty];
	            });
	            var xDiff = xMax - xMin;
	            xMin -= 0.1 * xDiff;
	            xMax += 0.1 * xDiff;
	            var xRange = [xMin, xMax];
	        } else {
	            var xRange = layout.xRange;
	        }

	        if (layout.yRange === undefined) {
	            var yMin = d3.min(pointData, function (d) {
	                return d[yProperty];
	            });
	            var yMax = d3.max(pointData, function (d) {
	                return d[yProperty];
	            });
	            var yDiff = yMax - yMin;
	            yMin -= 0.1 * yDiff;
	            yMax += 0.1 * yDiff;
	            var yRange = [yMin, yMax];
	        } else {
	            var yRange = layout.yRange;
	        }

	        var xscale = d3.scaleLinear().range([0, width]).domain(xRange);

	        var xscale0 = d3.scaleLinear().range([0, width]).domain(xRange);

	        var yscale = d3.scaleLinear().range([height, 0]).domain(yRange);

	        var yscale0 = d3.scaleLinear().range([height, 0]).domain(yRange);

	        var colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
	        colour.domain(data.cfData.metaDataUniqueValues[cProperty]);

	        var opacity = layout.opacity === undefined ? 1.0 : layout.opacity;

	        var plotArea = svg.select(".plotArea");

	        var clip = svg.append("clipPath").attr("id", clipId).append("rect").attr("width", width).attr("height", height);

	        var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);

	        svg.transition().call(zoom.transform, d3.zoomIdentity);
	        svg.call(zoom);

	        var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
	            return "<span>" + d.label + "</span>";
	        });

	        svg.call(tip);

	        var points = plotArea.selectAll("circle").data(pointData);

	        points.enter().append("circle").attr("r", 5).attr("cx", function (d) {
	            return xscale(d[xProperty]);
	        }).attr("cy", function (d) {
	            return yscale(d[yProperty]);
	        }).style("fill", function (d) {
	            return colour(d[cProperty]);
	        }).style("opacity", opacity).attr("clip-path", "url(#" + clipId + ")").attr("task-id", function (d) {
	            return d.taskId;
	        }).on("mouseover", tipOn).on("mouseout", tipOff);

	        points.attr("r", 5).attr("cx", function (d) {
	            return xscale(d[xProperty]);
	        }).attr("cy", function (d) {
	            return yscale(d[yProperty]);
	        }).style("fill", function (d) {
	            return colour(d[cProperty]);
	        }).attr("task-id", function (d) {
	            return d.taskId;
	        });

	        points.exit().remove();

	        var xAxis = d3.axisBottom(xscale);
	        var yAxis = d3.axisLeft(yscale);

	        var gX = plotArea.select(".axis--x");
	        if (gX.empty()) {
	            gX = plotArea.append("g").attr("transform", "translate(0," + height + ")").attr("class", "axis--x").call(xAxis);
	            gX.append("text").attr("fill", "#000").attr("x", width).attr("y", margin.bottom - 2).attr("text-anchor", "end").text(xProperty);
	        } else {
	            gX.transition().call(xAxis);
	        }

	        var gY = plotArea.select(".axis--y");
	        if (gY.empty()) {
	            gY = plotArea.append("g").attr("class", "axis--y").call(yAxis);
	            gY.append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -margin.left + 15).attr("text-anchor", "end").text(yProperty);
	        } else {
	            gY.transition().call(yAxis);
	        }

	        if (layout.highlightTasks == true) {
	            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
	                points.style("opacity", opacity).style("stroke-width", "0px").style("fill", function (d) {
	                    return colour(d[cProperty]);
	                });
	            } else {
	                //points.style( "opacity" , 0.2);
	                points.style("fill", "#d3d3d3");
	                dbsliceData.highlightTasks.forEach(function (taskId) {
	                    points.filter(function (d, i) {
	                        return d.taskId == taskId;
	                    }).style("fill", function (d) {
	                        return colour(d[cProperty]);
	                    }).style("opacity", opacity).style("stroke", "red").style("stroke-width", "2px").raise();
	                });
	            }
	        }

	        function zoomed() {
	            var t = d3.event.transform;
	            xscale.domain(t.rescaleX(xscale0).domain());
	            yscale.domain(t.rescaleY(yscale0).domain());
	            gX.call(xAxis);
	            gY.call(yAxis);
	            plotArea.selectAll("circle").attr("cx", function (d) {
	                return xscale(d[xProperty]);
	            }).attr("cy", function (d) {
	                return yscale(d[yProperty]);
	            });
	        }

	        function tipOn(d) {
	            points.style("opacity", 0.2);
	            d3.select(this).style("opacity", 1.0).attr("r", 7);
	            tip.show(d);
	            if (layout.highlightTasks == true) {
	                dbsliceData.highlightTasks = [d.taskId];
	                render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            }
	        }

	        function tipOff() {
	            points.style("opacity", opacity);
	            d3.select(this).attr("r", 5);
	            tip.hide();
	            if (layout.highlightTasks == true) {
	                dbsliceData.highlightTasks = [];
	                render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
	            }
	        }
	    }
	};

	var cfLeafletMapWithMarkers = {

	    make: function make(element, data, layout) {

	        cfLeafletMapWithMarkers.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        //var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
	        //var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

	        var container = d3.select(element);

	        var width = container.node().offsetWidth,
	            height = layout.height;

	        container.select(".plotArea").remove();

	        // always make a new map
	        var mapDiv = container.append("div").attr("id", "mapnow").style("width", width + 'px').style("height", height + 'px').attr("class", "plotArea");

	        var dimId = data.cfData.dataProperties.indexOf(data.property);

	        var cf = data.cfData.cf;
	        var property = data.property;

	        var dim = data.cfData.metaDims[dimId];
	        var items = dim.top(Infinity);

	        var map = L.map('mapnow');

	        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	        }).addTo(map);

	        var markers = [];
	        items.forEach(function (item) {
	            var marker = L.marker([item[property].lat, item[property].long]);
	            if (item.label != undefined) {
	                marker.bindPopup(item.label);
	            }
	            markers.push(marker);
	        });

	        var markerGroup = L.featureGroup(markers).addTo(map);
	        map.fitBounds(markerGroup.getBounds().pad(0.5));
	    }
	};

	var cfAddPlot = {

	    make: function make(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svgWidth = container.node().offsetWidth,
	            svgHeight = layout.height;

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var svg = container.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "plotArea");

	        cfAddPlot.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var marginDefault = { top: 20, right: 20, bottom: 30, left: 50 };
	        var margin = layout.margin === undefined ? marginDefault : layout.margin;

	        var container = d3.select(element);

	        var svg = container.select("svg");

	        var svgWidth = svg.attr("width");
	        var svgHeight = svg.attr("height");

	        var width = svgWidth - margin.left - margin.right;
	        var height = svgHeight - margin.top - margin.bottom;

	        var plotArea = svg.select(".plotArea");

	        container.append("input").attr("type", "button").attr("class", "btn btn-success").attr("type", "button").attr("value", "test button");
	    }

	};

	function cfInit(metaData) {

	    var cfData = {};

	    cfData.metaDataProperties = metaData.header.metaDataProperties;

	    cfData.dataProperties = metaData.header.dataProperties;

	    cfData.cf = crossfilter(metaData.data);

	    cfData.metaDims = [];

	    cfData.metaDataUniqueValues = {};

	    cfData.metaDataProperties.forEach(function (property, i) {

	        cfData.metaDims.push(cfData.cf.dimension(function (d) {
	            return d[property];
	        }));

	        cfData.metaDataUniqueValues[property] = Array.from(new Set(metaData.data.map(function (d) {
	            return d[property];
	        })));
	    });

	    cfData.dataDims = [];

	    cfData.dataProperties.forEach(function (property, i) {

	        cfData.dataDims.push(cfData.cf.dimension(function (d) {
	            return d[property];
	        }));
	    });

	    cfData.filterSelected = [];

	    cfData.histogramSelectedRanges = [];

	    var taskIds = [];

	    metaData.data.forEach(function (task, i) {

	        taskIds.push(task.taskId);
	    });

	    dbsliceData.filteredTaskIds = taskIds;

	    return cfData;
	}

	function getFilteredTaskIds() {

		return dbsliceData.filteredTaskIds;
	}

	function getFilteredTaskLabels() {

		return dbsliceData.session.filteredTaskLabels;
	}

	var triMesh2dRender = {

	    make: function make(element, data, layout) {

	        console.log("make");

	        var container = d3.select(element);

	        var width = container.node().offsetWidth;
	        var height = width; // force square plots for now

	        console.log(width);

	        var canvas = container.append("canvas").attr("width", width).attr("height", height).style("width", width + "px").style("height", height + "px");

	        var overlay = container.append("svg").attr("class", "svg-overlay").style("position", "absolute").style("z-index", 2).style("top", "0px").style("left", "0px").attr("width", width).attr("height", height);

	        triMesh2dRender.update(element, data, layout);
	    },

	    update: function update(element, data, layout) {

	        var container = d3.select(element);
	        var width = container.node().offsetWidth;
	        var height = width; // force square plots for now

	        var canvas = container.select("canvas");

	        var gl = canvas.node().getContext("webgl", { antialias: true, depth: false });
	        twgl.addExtensionsToContext(gl);
	        var programInfo = twgl.createProgramInfo(gl, [triMesh2dRender.vertShader, triMesh2dRender.fragShader]);

	        var tm = data.triMesh;

	        var nTris = tm.indices.length / 3;
	        console.log(nTris);

	        //console.log(tm);

	        var values = void 0,
	            vertices = void 0;

	        // tmp
	        var nVerts = data.nVerts === undefined ? tm.values.length : data.nVerts;

	        if (layout.highlightTasks == true) {

	            if (!Array.isArray(dbsliceData.highlightTasks)) {

	                values = new Float32Array(tm.values.buffer, 0, nVerts);
	                vertices = new Float32Array(tm.vertices.buffer, 0, 2 * nVerts);
	            } else if (dbsliceData.highlightTasks.length != 0) {

	                var taskId = dbsliceData.highlightTasks[0];
	                var nOffset = void 0;

	                if (data.taskIdMap === undefined) {

	                    nOffset = taskId;
	                } else {

	                    nOffset = data.taskIdMap[taskId];
	                }

	                values = new Float32Array(tm.values.buffer, 4 * nOffset * nVerts, nVerts);
	                vertices = new Float32Array(tm.vertices.buffer, 4 * 2 * nOffset * nVerts, 2 * nVerts);
	            } else {

	                return;
	            }
	        }

	        console.log(vertices);
	        console.log(values);

	        var arrays = {
	            a_position: { numComponents: 2, data: vertices },
	            a_val: { numComponents: 1, data: values },
	            indices: { numComponents: 3, data: tm.indices }
	        };
	        var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

	        var viewDefault = { xMin: -1., xMax: 1., yMin: -1., yMax: 1 };
	        var view = layout.view === undefined ? viewDefault : layout.view;

	        var vScaleDefault = [0., 1.];
	        var vScale = layout.vScale === undefined ? vScaleDefault : layout.vScale;

	        var projectionMatrix = glMatrix.mat4.create();
	        glMatrix.mat4.ortho(projectionMatrix, view.xMin, view.xMax, view.yMin, view.yMax, 0, 1.);
	        console.log(projectionMatrix);
	        var cmap = new Uint8Array([158, 1, 66, 255, 185, 31, 72, 255, 209, 60, 75, 255, 228, 86, 73, 255, 240, 112, 74, 255, 248, 142, 83, 255, 252, 172, 99, 255, 253, 198, 118, 255, 254, 221, 141, 255, 254, 238, 163, 255, 251, 248, 176, 255, 241, 249, 171, 255, 224, 243, 160, 255, 200, 233, 159, 255, 169, 220, 162, 255, 137, 207, 165, 255, 105, 189, 169, 255, 78, 164, 176, 255, 66, 136, 181, 255, 74, 108, 174, 255, 94, 79, 162, 255]); //spectral
	        var cmapTex = twgl.createTexture(gl, { mag: gl.LINEAR, min: gl.LINEAR, src: cmap, width: 21, height: 1 });
	        var uniforms = { u_matrix: projectionMatrix, u_cmap: cmapTex, u_cmin: vScale[0], u_cmax: vScale[1] };

	        gl.useProgram(programInfo.program);
	        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	        twgl.setUniforms(programInfo, uniforms);
	        gl.drawElements(gl.TRIANGLES, nTris * 3, gl.UNSIGNED_INT, 0);

	        var overlay = container.select(".svg-overlay");
	        var scaleMargin = { "left": width - 50, "top": height / 2 - 50 };
	        overlay.select(".scaleArea").remove();
	        var scaleArea = overlay.append("g").attr("class", "scaleArea").attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

	        var scaleHeight = 100;
	        var colourScale = d3.scaleSequential(d3.interpolateSpectral);
	        colourScale.domain([0, scaleHeight]);
	        var scaleBars = scaleArea.selectAll(".scaleBar").data(d3.range(scaleHeight), function (d) {
	            return d;
	        }).enter().append("rect").attr("class", "scaleBar").attr("x", 0).attr("y", function (d, i) {
	            return scaleHeight - i;
	        }).attr("height", 1).attr("width", 20).style("fill", function (d, i) {
	            return colourScale(d);
	        });

	        var cscale = d3.scaleLinear().domain(vScale).range([scaleHeight, 0]);

	        var cAxis = d3.axisRight(cscale).ticks(5);

	        scaleArea.append("g").attr("transform", "translate(20,0)").call(cAxis);
	    },

	    vertShader: "attribute vec2 a_position;\nattribute float a_val;\nuniform mat4 u_matrix;\nvarying float v_val;\nvoid main() {\n  gl_Position = u_matrix*vec4(a_position,0,1);\n  v_val = a_val;\n}\n",

	    fragShader: "precision highp float;\nuniform sampler2D u_cmap;\nuniform float u_cmin, u_cmax;\nvarying float v_val;\nvoid main() {\n  gl_FragColor = texture2D(u_cmap, vec2( (v_val-u_cmin)/(u_cmax-u_cmin) ,0.5));\n}\n"

	};

	exports.threeSurf3d = threeSurf3d;
	exports.threeMeshFromStruct = threeMeshFromStruct;
	exports.d3ContourStruct2d = d3ContourStruct2d;
	exports.d3LineSeries = d3LineSeries;
	exports.d3Scatter = d3Scatter;
	exports.cfD3BarChart = cfD3BarChart;
	exports.cfD3Histogram = cfD3Histogram;
	exports.cfD3Scatter = cfD3Scatter;
	exports.cfLeafletMapWithMarkers = cfLeafletMapWithMarkers;
	exports.cfAddPlot = cfAddPlot;
	exports.render = render;
	exports.update = update;
	exports.makeNewPlot = makeNewPlot;
	exports.updatePlot = updatePlot;
	exports.cfInit = cfInit;
	exports.cfUpdateFilters = cfUpdateFilters;
	exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
	exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
	exports.makeSessionHeader = makeSessionHeader;
	exports.getFilteredTaskIds = getFilteredTaskIds;
	exports.getFilteredTaskLabels = getFilteredTaskLabels;
	exports.triMesh2dRender = triMesh2dRender;

	return exports;

}({}));
