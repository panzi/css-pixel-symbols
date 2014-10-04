var CSSPixelSymbols = (function () {
	"use strict";

	var observe = document.addEventListener ?
		function (element, event, handler) {
			element.addEventListener(event, handler, false);
		} :
		function (element, event, handler) {
			var wrapper = '_eventHandlingWrapper' in handler ?
				handler._eventHandlingWrapper :
				(handler._eventHandlingWrapper = function () {
					return handler.call(this,window.event);
				});
			element.attachEvent('on'+event, wrapper);
		};

	var stopObserving = document.removeEventListener ?
		function (element, event, handler) {
			element.removeEventListener(event, handler, false);
		} :
		function (element, event, handler) {
			if ('_eventHandlingWrapper' in handler) {
				element.detachEvent('on'+event, handler._eventHandlingWrapper);
			}
		};

	var symbol = [];
	var mode = null;

	observe(window, 'mouseup', stopDrawing);
	observe(document, 'mouseup', stopDrawing);
	observe(window, 'beforeunload', function (event) {
		event.returnValue = "Discard changes?";
	});

	var CSSPixelSymbols = {
		init: function () {
			var edit = document.getElementById("symbol-edit");
			var wrapper = document.getElementById("symbol-edit-wrapper");

			for (var y = 0; y < 16; ++ y) {
				var row = document.createElement("tr");
				var state = new Array(16);
				for (var x = 0; x < 16; ++ x) {
					var cell = document.createElement("td");
					cell.id = 'symbol-edit-cell-'+x+'-'+y;
					observe(cell, 'mouseover', drawer(x, y));
					observe(cell, 'mousedown', drawStarter(x, y));
					row.appendChild(cell);
					state[x] = false;
				}
				symbol.push(state);
				edit.appendChild(row);
			}

			observe(document.getElementById('clear-button'), 'click', function (event) {
				CSSPixelSymbols.clear();
			});

			observe(document.getElementById('invert-button'), 'click', function (event) {
				CSSPixelSymbols.invert();
			});

			observe(document.getElementById('save-button'), 'click', function (event) {
				CSSPixelSymbols.save();
			});

			observe(document.getElementById('save-image-button'), 'click', function (event) {
				CSSPixelSymbols.saveImage();
			});

			observe(document.getElementById('open-button'), 'change', fileChanged);
			observe(document.getElementById('class-name'), 'change', classChanged);
			observe(document.getElementById('symbol-class-name'), 'change', classChanged);

			observe(document.getElementById('examples'), 'change', function (event) {
				if (this.value === '') {
					CSSPixelSymbols.clear();
				}
				else {
					CSSPixelSymbols.load({symbol: this.value});
				}
			});

			observe(window, 'popstate', function (event) {
				CSSPixelSymbols.load(event.state);
			});

			observe(wrapper, 'dragover', function (event) {
				event.dataTransfer.effectsAllowed = 'link';
				stopEvent(event);
			});

			observe(wrapper, 'dragenter', function (event) {
				this.className = 'over';
			});

			observe(wrapper, 'dragleave', function (event) {
				if (event.target === this || event.target.contains(this)) {
					this.className = '';
				}
			});

			observe(wrapper, 'drop', function (event) {
				if (event.dataTransfer.files.length > 0) {
					CSSPixelSymbols.loadFile(event.dataTransfer.files[0]);
				}
				else if (event.dataTransfer.getData("Url")) {
					alert("Cannot directly load files from urls. Please download them first and drag them in from your file browser.");
				}
				this.className = '';
				stopEvent(event);
			});

			observe(document.getElementById("bg-image-kind"), 'change', function (event) {
				var controls = document.getElementById("controls");
				if (this.value === "none") {
					controls.className = "";
					CSSPixelSymbols.setBackgroundUrl(null);
				}
				else if (this.value === "url") {
					controls.className = "use-bg-image-url";
					CSSPixelSymbols.setBackgroundUrl(document.getElementById("bg-image-url").value);
				}
				else if (this.value === "file") {
					controls.className = "use-bg-image-file";
					loadBackgroundImage();
				}
			});

			observe(document.getElementById("bg-image-url"), 'change', function (event) {
				if (document.getElementById("bg-image-kind").value === "url") {
					CSSPixelSymbols.setBackgroundUrl(document.getElementById("bg-image-url").value);
				}
			});
			
			observe(document.getElementById("bg-image-url"), 'keypress', function (event) {
				if (event.keyCode === 13) {
					stopEvent(event);
					if (document.getElementById("bg-image-kind").value === "url") {
						CSSPixelSymbols.setBackgroundUrl(document.getElementById("bg-image-url").value);
					}
				}
			});
			
			observe(document.getElementById("bg-image-file"), 'change', function (event) {
				if (document.getElementById("bg-image-kind").value === "file") {
					loadBackgroundImage();
				}
			});

			observe(document.getElementById("preview-style"), 'submit', function (event) {
				var preview = document.getElementById("preview");
				preview.style.color      = document.getElementById("color").value;
				preview.style.fontFamily = document.getElementById("font-family").value;
				preview.style.fontWeight = document.getElementById("font-weight").value;
				preview.style.fontStyle  = document.getElementById("font-style").value;
				preview.style.textAlign  = document.getElementById("text-align").value;
				preview.style.fontSize   = document.getElementById("font-size").value +
				                           document.getElementById("font-size-unit").value;
			});

			observe(document.getElementById("color"), 'change', function (event) {
				document.getElementById("preview").style.color = this.value;
			});

			observe(document.getElementById("font-family"), 'change', function (event) {
				document.getElementById("preview").style.fontFamily = this.value;
			});

			observe(document.getElementById("font-weight"), 'change', function (event) {
				document.getElementById("preview").style.fontWeight = this.value;
			});

			observe(document.getElementById("font-style"), 'change', function (event) {
				document.getElementById("preview").style.fontStyle = this.value;
			});

			observe(document.getElementById("text-align"), 'change', function (event) {
				document.getElementById("preview").style.textAlign = this.value;
			});

			observe(document.getElementById("font-size"), 'change', function (event) {
				document.getElementById("preview").style.fontSize =
					this.value + document.getElementById("font-size-unit").value;
			});

			observe(document.getElementById("font-size-unit"), 'change', function (event) {
				document.getElementById("preview").style.fontSize =
					document.getElementById("font-size").value + this.value;
			});


			this.load(parseParams(location.search.replace(/^\?/,'')));
		},
		clear: function () {
			for (var y = 0; y < symbol.length; ++ y) {
				var row = symbol[y];
				for (var x = 0; x < row.length; ++ x) {
					row[x] = false;
					document.getElementById('symbol-edit-cell-'+x+'-'+y).className = '';
				}
			}
			this.updateStyle();
		},
		toggle: function (x, y) {
			var isset = (symbol[y][x] = !symbol[y][x]);
			document.getElementById('symbol-edit-cell-'+x+'-'+y).className =
				isset ? 'css-pixel-symbol-pixel-set' : '';
			this.updateStyle();
		},
		invert: function () {
			for (var y = 0; y < symbol.length; ++ y) {
				var row = symbol[y];
				for (var x = 0; x < row.length; ++ x) {
					var isset = row[x] = !row[x];
					document.getElementById('symbol-edit-cell-'+x+'-'+y).className =
						isset ? 'css-pixel-symbol-pixel-set' : '';
				}
			}
			this.updateStyle();
		},
		draw: function (x, y) {
			symbol[y][x] = true;
			document.getElementById('symbol-edit-cell-'+x+'-'+y).className =
				'css-pixel-symbol-pixel-set';
			this.updateStyle();
		},
		erase: function (x, y) {
			symbol[y][x] = false;
			document.getElementById('symbol-edit-cell-'+x+'-'+y).className = '';
			this.updateStyle();
		},
		updateStyle: function () {
			var className    = document.getElementById('class-name').value.trim();
			var symClassName = document.getElementById('symbol-class-name').value.trim();
			var css = [
				'.'+escapeCSS(className)+' {',
				'\tdisplay: inline-block;',
				'\twidth: 1em;',
				'\theight: 1em;',
				'\ttext-align:left;',
				'}',
				''
			];

			var pix = 1/16;
			var boxes = [];
			for (var y = 0; y < symbol.length; ++ y) {
				var row = symbol[y];
				for (var x = 0; x < row.length; ++ x) {
					if (row[x]) {
						boxes.push(cssFloat(pix*x)+'em '+cssFloat(pix+pix*y)+'em currentcolor');
					}
				}
			}

			boxes = boxes.join(', ');
			
			css.push(
				'.'+escapeCSS(className)+'.'+escapeCSS(symClassName)+':after {',
				'\tdisplay:inline-block;',
				'\tposition:relative;',
				'\ttop:-0.9em;',
				'\twidth:'+pix+'em;',
				'\theight:'+pix+'em;',
				'\tcolor:currentcolor;',
				'\tcontent:"";',
				'\tbox-shadow: '+boxes+';',
				'}'
			);

			css = css.join('\n');

			var style = document.getElementById('symbol-style');
			if (style) {
				style.parentNode.removeChild(style);
			}

			var sym = document.getElementById('symbol');
			sym.className = className+' '+symClassName;

			style = document.createElement('style');
			style.id = 'symbol-style';
			style.type = 'text/css';
			if (style.styleSheet) { // IE
				style.styleSheet.cssText = css;
			}
			else {
				style.appendChild(document.createTextNode(css));
			}

			(document.head||document.body).appendChild(style);

			document.getElementById('style-out').value = css;
			document.getElementById('html-out').value = '<span class="'+className+' '+symClassName+'"></span>';

			pushHistoryState();
		},
		toJSON: function () {
			var symClassName = document.getElementById('symbol-class-name').value;
			var className = document.getElementById('class-name').value;
			var bitfield = new BitField(16*16);
			for (var y = 0; y < symbol.length; ++ y) {
				var row = symbol[y];
				for (var x = 0; x < row.length; ++ x) {
					if (row[x]) {
						bitfield.set(y * 16 + x, true);
					}
				}
			}
			return {
				"class-name": className,
				"symbol-class-name": symClassName,
				"symbol": bitfield.toBase64()
			};
		},
		save: function () {
			var json = this.toJSON();
			var data = new Blob([JSON.stringify(json,null,'\t')],{type: 'application/json'});
			var url = URL.createObjectURL(data);
			var link = document.createElement('a');
			link.href = url;
			link.setAttribute("download",(json['symbol-class-name']||json["css-pixel-symbol-example"])+".json");
			link.style.visibility = 'hidden';
			link.style.position = 'absolute';
			document.body.appendChild(link);
			link.click();
			setTimeout(function () {
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}, 0);
		},
		saveImage: function () {
			var canvas = document.createElement("canvas");
			canvas.width  = 16;
			canvas.height = 16;
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = 'rgba(255,255,255,0)';
			ctx.fillRect(0, 0, 16, 16);

			ctx.fillStyle = 'rgba(0,0,0,1)';
			for (var y = 0; y < 16; ++ y) {
				var row = symbol[y];
				for (var x = 0; x < 16; ++ x) {
					if (row[x]) {
						ctx.fillRect(x, y, 1, 1);
					}
				}
			}

			var className    = document.getElementById('class-name').value;
			var symClassName = document.getElementById('symbol-class-name').value;
			var url = canvas.toDataURL("image/png");
			var link = document.createElement('a');
			link.href = url;
			link.setAttribute("download",(symClassName||className)+".png");
			link.style.visibility = 'hidden';
			link.style.position = 'absolute';
			document.body.appendChild(link);
			link.click();
			setTimeout(function () {
				document.body.removeChild(link);
			}, 0);
		},
		load: function (data) {
			document.getElementById('class-name').value =
				'class-name' in data ? data['class-name'] : 'css-pixel-symbol';

			document.getElementById('symbol-class-name').value =
				'symbol-class-name' in data ? data['symbol-class-name'] : 'css-pixel-symbol-example';

			if (data.symbol) {
				var bitfield = BitField.fromBase64(data.symbol);
				for (var y = 0; y < symbol.length; ++ y) {
					var row = symbol[y];
					for (var x = 0; x < row.length; ++ x) {
						var isset = row[x] = bitfield.get(y * 16 + x);
						document.getElementById('symbol-edit-cell-'+x+'-'+y).className =
							isset ? 'css-pixel-symbol-pixel-set' : '';
					}
				}
			}
			this.updateStyle();
		},
		loadFile: function (file) {
			if (/^image\//.test(file.type)) {
				var url = URL.createObjectURL(file);
				var img = document.createElement("img");
				img.src = url;
				img.onload = function () {
					CSSPixelSymbols.loadImage(this);
				};
			}
			else {
				var reader = new FileReader();
				reader.onload = function () {
					try {
						var data = JSON.parse(this.result);
						CSSPixelSymbols.load(data);
					}
					catch (e) {
						alert("Error reading file: "+e);
					}
				};
				reader.onerror = function () {
					alert("Error reading file: "+this.error);
				};
				reader.readAsText(file);
			}
		},
		loadImage: function (img) {
			var canvas = document.createElement("canvas");
			canvas.width  = 16;
			canvas.height = 16;
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = 'rgba(255,255,255,0)';
			ctx.fillRect(0, 0, 16, 16);
			ctx.drawImage(img, 0, 0, 16, 16);
			var data = ctx.getImageData(0, 0, 16, 16).data;
			for (var y = 0; y < 16; ++ y) {
				var yoff = y * 16;
				var row = symbol[y];
				for (var x = 0; x < 16; ++ x) {
					var off = (yoff + x) * 4;
					var r = data[off + 0];
					var g = data[off + 1];
					var b = data[off + 2];
					var a = data[off + 3];
					var isset = row[x] = a >= 255/2 && (r + g + b) <= 255*3/2;

					document.getElementById('symbol-edit-cell-'+x+'-'+y).className =
						isset ? 'css-pixel-symbol-pixel-set' : '';
				}
			}
			this.updateStyle();
		},
		setBackgroundUrl: function (url) {
			document.getElementById("symbol-edit").style.backgroundImage = url ? 'url("'+url+'")' : 'none';
		},
		setBackgroundFile: function (file) {
			var edit = document.getElementById("symbol-edit");
			if (file) {
				var url = URL.createObjectURL(file);
				var img = document.createElement("img");
				img.src = url;
				img.onload = function () {
					var w = this.naturalWidth  || this.width;
					var h = this.naturalHeight || this.height;
					if (w > 16 || h > 16) {
						edit.style.backgroundImage = 'url("'+url+'")';
					}
					else {
						var canvas = document.createElement("canvas");
						canvas.width  = 16;
						canvas.height = 16;
						var ctx = canvas.getContext("2d");
						ctx.fillStyle = 'rgba(255,255,255,0)';
						ctx.fillRect(0, 0, 16, 16);
						ctx.drawImage(img, 0, 0, 16, 16);
						var data = ctx.getImageData(0, 0, 16, 16).data;

						canvas.width  = edit.clientWidth;
						canvas.height = edit.clientHeight;
						ctx = canvas.getContext("2d");
						ctx.fillStyle = 'rgba(255,255,255,0)';
						ctx.fillRect(0, 0, canvas.width, canvas.height);

						var pixw = canvas.width  / 16;
						var pixh = canvas.height / 16;

						for (var y = 0; y < 16; ++ y) {
							var yoff = y * 16;
							for (var x = 0; x < 16; ++ x) {
								var off = (yoff + x) * 4;
								var r = data[off + 0];
								var g = data[off + 1];
								var b = data[off + 2];
								var a = data[off + 3];
								ctx.fillStyle = 'rgba('+r+','+g+','+b+','+cssFloat(a/255)+')';
								ctx.fillRect(pixw * x, pixh * y, pixw, pixh);
							}
						}

						edit.style.backgroundImage = 'url("'+canvas.toDataURL()+'")';
					}
				};
			}
			else {
				edit.style.backgroundImage = 'none';
			}
		}
	};

	function cssFloat (value) {
		return value.toFixed(20).replace(/\.(([0-9]*[^0])0*|(0)0*)$/,'.$2$3');
	}

	function escapeCSS (s) {
		return s.replace(/[^-\w]/g, function (ch) {
			var hex = ch.charCodeAt(0).toString(16);
			return '\\'+new Array(7-hex.length).join('0')+hex;
		});
	}

	function drawer (x, y) {
		return function (event) {
			if (mode) {
				CSSPixelSymbols[mode](x, y);
				stopEvent(event);
				document.getElementById("examples").value = "";
			}
		};
	}

	function drawStarter (x, y) {
		return function (event) {
			var isleft = 'buttons' in event ? event.buttons & 1  :
			             'which'   in event ? event.which  === 1 :
			                                  event.button === 0;
			if (isleft) {
				mode = symbol[y][x] ? 'erase' : 'draw';
				CSSPixelSymbols[mode](x, y);
				stopEvent(event);
			}
		};
	}

	function stopDrawing (event) {
		mode = null;
	}

	function stopEvent (event) {
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		else {
			event.cancelBubble = true;
		}

		if (event.preventDefault) {
			event.preventDefault();
		}
		else {
			event.returnValue = false;
		}
	}

	function fileChanged (event) {
		CSSPixelSymbols.loadFile(this.files[0]);

		// clear value
		var fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.id = 'open-button';
		observe(fileInput, 'change', fileChanged);
		this.parentNode.replaceChild(fileInput, this);
	}

	function classChanged (event) {
		CSSPixelSymbols.updateStyle();
	}

	function toParams (params) {
		var buf = [];
		for (var name in params) {
			buf.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
		}
		return buf.join("&");
	}

	function parseParams (str) {
		var params = {};
		if (str) {
			var parts = str.split("&");
			for (var i = 0; i < parts.length; ++ i) {
				var part = parts[i].split("=");
				params[decodeURIComponent(part[0])] = decodeURIComponent(part.slice(1).join("="));
			}
		}
		return params;
	}

	function debounce (f, ms) {
		var timer = null;
		var args = null;
		var self = null;
		return function () {
			self = this;
			args = Array.prototype.slice(arguments);
			if (timer !== null) {
				clearTimeout(timer);
			}
			timer = setTimeout(function () {
				timer = null;
				f.apply(self,args);
			}, ms||250);
		};
	}

	function isEmpty (obj) {
		for (var name in obj) {
			return false;
		}
		return true;
	}

	var pushHistoryState = history.pushState ? debounce(function () {
		var json = CSSPixelSymbols.toJSON();
		if (json['class-name'] === 'css-pixel-symbol') {
			delete json['class-name'];
		}
		if (json['symbol-class-name'] === 'css-pixel-symbol-example') {
			delete json['symbol-class-name'];
		}
		if (json.symbol === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') {
			delete json.symbol;
		}
		if (!sameState(json, history.state||{})) {
			if (isEmpty(json)) {
				if (location.search.replace(/^\?/,'')) {
					history.pushState(json, null, location.pathname);
				}
			}
			else {
				history.pushState(json, null, '?'+toParams(json));
			}
		}
	}) : function () {};

	function loadBackgroundImage () {
		var file = document.getElementById("bg-image-file").files[0];
		CSSPixelSymbols.setBackgroundFile(file ? file : null);
	}

	function sameState (obj1, obj2) {
		if (obj1 === obj2) return true;
		if (!obj1 || !obj2) return false;
		var keymap = {};
		for (var name in obj1) {
			if (obj1[name] !== obj2[name]) {
				return false;
			}
			keymap[name] = true;
		}
		for (var name in obj2) {
			if (keymap[name] !== true) {
				return false;
			}
		}
		return true;
	}

	return CSSPixelSymbols;
})();
