/**
 * @desc Das Modul O2G.Util stellt allgemeine JAVASCRIPT Hilfsfunktionen bereit.
 *
 */
O2G.Util = (function () {
    'use strict';
    // @private
    var _hex,
        _xss,
        _tracedbg,
        _tracelevel,
        _EBCDICTab;

    _hex = '0123456789ABCDEF';
    _xss = O2G.Config.XSS;
    _tracedbg = {};
    _tracelevel = 0;
    _EBCDICTab = O2G.Config.EBCDICTAB;

    var _upsJS = function (error, file, row) {
        var msg = 'o2g JSError: ' + error + ' in: ' + file + ' ( ' + row + ' )';
        if (O2G.QUnit && O2G.QUnit.isActive) {
            O2G.QUnit.upsJS(msg);
        }
        alert(msg);
        return false;
    };
    window.onerror = _upsJS;
    /**
     * @private
     * @param {string} ascii
     * @ returns {string}
     * @desc Sicherheitsfeature XSS: Ersetzt JAVSCRIPT Einfügungen durch HTML Entities
     */
    var _replaceXSS = function (ascii) {
        return ascii.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;").replace(/x2F/g, "&#x2F;");
    };
    /**
     * @private
     * @param {number} len
     * @param {number} hex
     * @returns {string}
     * @desc Erzeugt einen String (Beispiel: hex=40 len=3 >>>> 404040)
     */
    var setHexString = function (len, hex) {
        return new Array(len + 1).join(hex);
    };

    var fillString = function (str, len) {
        return str + new Array(len - str.length + 1).join(" ");
    };

    /**
     * @private
     * @param {boolean} cache
     * @desc Lädt Window/Dokument neu mit Cache(false) oder ohne Cache(true)
     */
    var reload = function (cache, hash) {
        window.location.hash = hash || '#';
        setTimeout(function () {
            window.location.reload(cache);
        }, 100);
    };

    /**
     * @desc Umrechnung eines Integers in Hexadezimale Darstellung
     *
     */
    var getHexLen = function (len) {
        return _hex.substr((len / 16), 1) + _hex[len % 16];
    };
    /**
     * @desc Konvertieren EBCIDC Hex in ASCII Char
     *
     */
    var convert2ASCII = function (EBCDICString, nbsp) {
        var ASCII = '',
            len = EBCDICString.length,
            chr = '',
            trimstart = 0,
            i;
        for (i = 0; i < len; i += 2){
            chr = parseInt(EBCDICString.substr(i, 2), 16);
            if (!nbsp && !trimstart && chr > 64 && i){
                trimstart = ((i + 2) / 2);
            }
            ASCII += _EBCDICTab.charAt(chr);
        }
        if (nbsp){
            if (_xss){
                ASCII = _replaceXSS(ASCII);
            }
            return ASCII.replace(/ /g, "&nbsp;").replace(/x00/g, "&nbsp;");
        } else {
            if (trimstart > 0){
                return ASCII = ASCII.substr(0, trimstart - 1) + ASCII.substr(trimstart - 1, len - trimstart - 1).trim();
            }
            return ASCII = ASCII.trim();
        }
    };
    /**
     * @param {string} ASCIIString
     * @ returns {string}
     * @desc Sicherheitsfeature XSS: Ersetzt HTML Entities durch JAVSCRIPT Einfügungen
     */
    var reverseXSS = function (ASCIIString) {
        var ascii = ASCIIString.replace(/\&amp;/g, "&").replace(/\&lt;/g, "<")
            .replace(/\&gt;/g, ">").replace(/\&quot;/g, '"')
            .replace(/\&#x27;/g, "'").replace(/\&#x2F;/g, "/")
            .replace(/\&nbsp;/g, " ");
        var i = ascii.length;
        do {
            if (ascii[i - 1] !== ' '){
                break;
            }
        } while (i--);
        return ascii.substr(0, i);
    };
    /**
     * @desc Konvertieren ASCII Char in EBCIDC Hex
     *
     */
    var convert2HexEBCDIC = function (ASCIIString) {
        var ind = 0,
            chr = '',
            rest = 0,
            ergebnis = 0,
            len = ASCIIString.length,
            hex = '',
            i = 0;
        while (len){
            len -= 1;
            chr = ASCIIString[i];
            i += 1;
            if (chr.charCodeAt(0) === 32 || chr.charCodeAt(0) === 160 || chr.charCodeAt(0) === 0) {
                ind = 64;
            } else {
                ind = _EBCDICTab.indexOf(chr);
            }
            rest = ind % 16;
            ergebnis = (ind - rest) / 16;
            hex += _hex[ergebnis] + _hex[rest];
        }
        return hex;
    };
    /**
     * @desc Konvertieren von Integer nach Hex
     *
     */
    var convertInt2Hex = function (i) {
        var s2 = 0,
            s1 = 0;
        s2 = i % 16;
        s1 = (i - s2) / 16;
        return _hex[s1] + _hex[s2];
    };
    /**
     * @desc Datumsaufbereitung
     *
     */
    var getDate = function () {
        var date = new Date(),
            dd = date.getDate(),
            mm = date.getMonth() + 1,
            yy = date.getYear() + 1900;
        if (dd < 10){
            dd = '0' + dd;
        }
        if (mm < 10){
            mm = '0' + mm;
        }
        return dd + '.' + mm + '.' + yy;
    };
    /**
     * @desc Uhrzeitaufbereitung
     *
     */
    var getTime = function () {
        var date = new Date(),
            HH = date.getHours(),
            MM = date.getMinutes();
        if (HH < 10){
            HH = '0' + HH;
        }
        if (MM < 10){
            MM = '0' + MM;
        }
        return HH + ':' + MM;
    };
    /**
     * @desc Füllzeichen '-' aus String entfernen
     *
     */
    var removeFillerMinus = function (string) {
        var i = string.length;
        do {
            if (string[i - 1] !== '-' && string[i - 1] !== ' '){
                break;
            }
        } while (i--);
        return string.substr(0, i);
    };
    /**
     * @desc Message des AJAX Indikators setzen
     *
     */
    var setMsgAI = function (msg) {
        this.aiMsg = msg;
        $.ai.setMsg(this.aiMsg);
    };

    var traceDbg = function (label, modul) {
        if (label.substr(0, 4) === '<<< '){
            console.count(new Array((_tracelevel + 1) * 3).join('.') + ' (' + _tracedbg[label.substr(4)] + ') <<< ' + modul + '.' + label.substr(4));
            _tracedbg[label.substr(4)] -= 1;
            _tracelevel -= 1;
        } else {
            _tracelevel += 1;
            if (!_tracedbg[label]) {
                _tracedbg[label] = 1;
            } else {
                _tracedbg[label] += 1;
            }
            console.count(new Array((_tracelevel + 1) * 3).join('.') + ' (' + _tracedbg[label] + ') ' + modul + '.' + label);
        }
    };

    return {

        VERSION: '$Revision: 36 $',

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        hex00: setHexString(80 + 14, '00'), // geht von Inputfelder mit max. 80 Zeichen aus ACHTUNG
        hex40: setHexString(80 + 14, '40'),
        aiMsg: '',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        getHexLen: getHexLen,
        setHexString: setHexString,
        fillString: fillString,
        convert2ASCII: convert2ASCII,
        reverseXSS: reverseXSS,
        convert2HexEBCDIC: convert2HexEBCDIC,
        convertInt2Hex: convertInt2Hex,
        getDate: getDate,
        getTime: getTime,
        removeFillerMinus: removeFillerMinus,
        reload: reload,
        traceDbg: traceDbg,
        setMsgAI: setMsgAI
    };

})();