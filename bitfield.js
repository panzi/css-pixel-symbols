var BitField = (function () {
	"use strict";

	function BitField (bits) {
		if (Array.isArray(bits)) {
			return BitField.fromJSON(bits);
		}
		else if (typeof bits === "string") {
			return BitField.fromBase64(bits);
		}
		else if (bits instanceof BitField) {
			if (window.Uint8Array) {
				this.values = new Uint8Array(bits.values);
			}
			else {
				this.values = new Array(bits.values.length);
				for (var i = 0; i < bits.values.length; ++ i) {
					this.values[i] = bits.values[i];
				}
			}
		}
		else if (typeof bits === "number") {
			var cells = Math.ceil(bits/8);
			if (window.Uint8Array) {
				this.values = new Uint8Array(cells);
			}
			else {
				this.values = new Array(cells);
				for (var i = 0; i < cells; ++ i) {
					this.values[i] = 0;
				}
			}
		}
		else {
			throw new TypeError("illegal bits argument: "+bits);
		}
	}

	BitField.prototype = {
		get: function (index) {
			var i = (index / 8) | 0;
			var bit = index % 8;
			return (this.values[i] & (1 << bit)) !== 0;
		},
		set: function (index, value) {
			var i = (index / 8) | 0;
			var bit = index % 8;
			if (value) {
				this.values[i] |= 1 << bit;
			}
			else {
				this.values[i] &= ~(1 << bit);
			}
		},
		toBase64: function () {
			return Base64.encodeUrl(this.values);
		},
		toJSON: function () {
			var json = new Array(this.values.length*8);
			for (var i = 0; i < json.length; ++ i) {
				json[i] = this.get(i)?1:0;
			}
			return json;
		},
		toString: function () {
			return this.toBase64();
		}
	};

	BitField.fromBase64 = function (sBase64) {
		var bytes    = Base64.decodeUrl(sBase64);
		var bitfield = new BitField(bytes.length*8);
		for (var i = 0; i < bytes.length; ++ i) {
			bitfield.values[i] = bytes[i];
		}
		return bitfield;
	};

	BitField.fromJSON = function (json) {
		var bitfield = new BitField(json.length);
		for (var i = 0; i < json.length; ++ i) {
			if (json[i]) {
				bitfield.set(i, true);
			}
		}
		return bitfield;
	};

	return BitField;
})();
