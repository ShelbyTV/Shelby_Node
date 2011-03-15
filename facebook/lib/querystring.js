// Query String Utilities

var QueryString = exports;
var urlDecode = process.binding('http_parser').urlDecode;


function charCode(c) {
  return c.charCodeAt(0);
}


// a safe fast alternative to decodeURIComponent
QueryString.unescapeBuffer = function(s, decodeSpaces) {
  var out = new Buffer(s.length);
  var state = 'CHAR'; // states: CHAR, HEX0, HEX1
  var n, m, hexchar;

  for (var inIndex = 0, outIndex = 0; inIndex <= s.length; inIndex++) {
    var c = s.charCodeAt(inIndex);
    switch (state) {
      case 'CHAR':
        switch (c) {
          case charCode('%'):
            n = 0;
            m = 0;
            state = 'HEX0';
            break;
          case charCode('+'):
            if (decodeSpaces) c = charCode(' ');
            // pass thru
          default:
            out[outIndex++] = c;
            break;
        }
        break;

      case 'HEX0':
        state = 'HEX1';
        hexchar = c;
        if (charCode('0') <= c && c <= charCode('9')) {
          n = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          n = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          n = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = c;
          state = 'CHAR';
          break;
        }
        break;

      case 'HEX1':
        state = 'CHAR';
        if (charCode('0') <= c && c <= charCode('9')) {
          m = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          m = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          m = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = hexchar;
          out[outIndex++] = c;
          break;
        }
        out[outIndex++] = 16 * n + m;
        break;
    }
  }

  // TODO support returning arbitrary buffers.

  return out.slice(0, outIndex - 1);
};

function DecodeOctets(octets, result) {
  var i = 0,
      c = c1 = c2 = 0;

  // Perform byte-order check.
  if (octets.length >= 3) {
    if ((octets[0] & 0xef) == 0xef &&
        (octets[1] & 0xbb) == 0xbb &&
        (octets[2] & 0xbf) == 0xbf) {
      // Hmm byte stream has a BOM at the start, we'll skip this.
      i = 3;
    }
  }

  while (i < octets.length) {
    c = octets[i] & 0xff;

    if (c < 128) {
      result += String.fromCharCode(c);
      i++;
    } else if ((c > 191) && (c < 224)) {
      if (i + 1 < octets.length) {
        c2 = octets[i + 1] & 0xff;
        result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i++;
      }
      i++;
    } else {
      if (i + 2 < octets.length || i + 1 < octets.length) {
        c2 = octets[i + 1] & 0xff;
        c3 = octets[i + 2] & 0xff;
        result += String.fromCharCode(
            ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 2;
      }
      i++;
    }
  }

  return result;
}

function Decode(str) {
  var strLength = str.length;
  var result = '';

  for (var k = 0; k < strLength; k++) {
    var ch = str.charAt(k);

    if (ch == '%') {
      if (strLength >= k + 2) {
        var cc = parseInt(str.charAt(++k) + str.charAt(++k), 16);
        if (cc >> 7) {

          var n = 0;
          while (((cc << ++n) & 0x80) != 0);

          var octets = [cc];

          for (var i = 1; i < n; i++) {
            k++;
            octets[i] = parseInt(str.charAt(++k) + str.charAt(++k), 16);
          }
          result = DecodeOctets(octets, result);
        } else {
          result += String.fromCharCode(cc);
        }
      } else {
        while (k < strLength) {
          result += str.charAt(k++);
        }
      }
    } else {
      result += ch.charAt(0);
    }
  }
  return result;
}


QueryString.unescape = function(s, decodeSpaces) {
  return Decode(s);
};


QueryString.escape = function(str) {
  return encodeURIComponent(str);
};

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};


/**
 * Converts an arbitrary value to a Query String representation. Objects with
 * cyclical references will trigger an exception.
 *
 * @param {Variant=}  obj   Any arbitrary value to convert to query string.
 * @param {String=}   sep   Character that should join param k=v pairs together.
 *                          Default: '&'.
 * @param {String=}   eq    Character that should join keys to their values.
 *                          Default: '='.
 * @param {String=}   name  Name of the current key, for handling children
 *                          recursively.
 */
QueryString.stringify = QueryString.encode = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  obj = (obj === null) ? undefined : obj;

  switch (typeof obj) {
    case 'object':
      return Object.keys(obj).map(function(k) {
        if (Array.isArray(obj[k])) {
          return obj[k].map(function(v) {
            return QueryString.escape(stringifyPrimitive(k)) +
                   eq +
                   QueryString.escape(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return QueryString.escape(stringifyPrimitive(k)) +
                 eq +
                 QueryString.escape(stringifyPrimitive(obj[k]));
        }
      }).join(sep);

    default:
      return (name) ?
          QueryString.escape(stringifyPrimitive(name)) + eq +
          QueryString.escape(stringifyPrimitive(obj)) :
          '';
  }
};

// Parse a key=val string.
QueryString.parse = QueryString.decode = function(qs, sep, eq) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string') {
    return obj;
  }

  qs.split(sep).forEach(function(kvp) {
    var x = kvp.split(eq);
    var k = QueryString.unescape(x[0], true);
    var v = QueryString.unescape(x.slice(1).join(eq), true);

    if (!(k in obj)) {
      obj[k] = v;
    } else if (!Array.isArray(obj[k])) {
      obj[k] = [obj[k], v];
    } else {
      obj[k].push(v);
    }
  });

  return obj;
};
