// base64 code is from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
var Base64 = (function () {
	"use strict";

	var ByteArray = window.Uint8Array || Array;

	function b64ToUint6 (nChr) {
		return (
			nChr > 64 && nChr < 91  ? nChr - 65 :
			nChr > 96 && nChr < 123 ? nChr - 71 :
			nChr > 47 && nChr < 58  ? nChr + 4  :
			nChr === 43             ? 62        :
			nChr === 47             ? 63        :
			                          0);
	}

	function uint6ToB64 (nUint6) {
		return (
			nUint6 < 26   ? nUint6 + 65 :
			nUint6 < 52   ? nUint6 + 71 :
			nUint6 < 62   ? nUint6 - 4  :
			nUint6 === 62 ? 43          :
			nUint6 === 63 ? 47          :
			                65);
	}

	var Base64 = {
		encode: function (aBytes, noPadd) {
			var nMod3 = 2;
			var sB64Enc = "";

			for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
				nMod3 = nIdx % 3;
				nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
				if (nMod3 === 2 || aBytes.length - nIdx === 1) {
					sB64Enc += String.fromCharCode(
						uint6ToB64(nUint24 >>> 18 & 63),
						uint6ToB64(nUint24 >>> 12 & 63),
						uint6ToB64(nUint24 >>>  6 & 63),
						uint6ToB64(nUint24        & 63));
					nUint24 = 0;
				}
			}

			sB64Enc = sB64Enc.substr(0, sB64Enc.length - 2 + nMod3);

			if (!noPadd && nMod3 !== 2) {
				sB64Enc += nMod3 === 1 ? '=' : '==';
			}

			return sB64Enc;
		},

		encodeUrl: function (aBytes) {
			var map = {'+': '-', '/': '_'};
			return this.encode(aBytes, true).replace(/[+\/]/g, function (ch) {
				return map[ch];
			});
		},

		decode: function (sBase64) {
			var sB64Enc  = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
			var nInLen   = sB64Enc.length;
			var nOutLen  = nInLen * 3 + 1 >> 2;
			var bitField = new BitField(nOutLen*8);
			var taBytes  = new ByteArray(nOutLen);

			for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
				nMod4 = nInIdx & 3;
				nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
				if (nMod4 === 3 || nInLen - nInIdx === 1) {
					for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
						taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
					}
					nUint24 = 0;
				}
			}

			return taBytes;
		},
		
		decodeUrl: function (sBase64) {
			var map = {'-': '+', '_': '/'};
			return this.decode(sBase64.replace(/[-_]/g, function (ch) {
				return map[ch];
			}));
		}
	};

	return Base64;
})();
