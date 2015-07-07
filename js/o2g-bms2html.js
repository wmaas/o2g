/**
 * @desc Das Modul O2G.BMS2HTML stellt die JAVASCRIPT Funktionen für die Generierung der HTML
 * Gerüste zur Verfügung. Basis sind LADEMODULE, die von CICS BMS zur Verfügung gestellt werden.
 * Dort findet sich die Beschreibung der 3270 Maske, es wird fest von einer 24x80 Maske ausgegangen.
 * Beschreibungen zu Feldregeln finden sich in den von ODCS generierten Strukturlademodulen. Feldregeln
 * werden in den HTML Gerüsten durch zusätzlich Attribute definiert. Das JQuery Plugin stellt die
 * Basisroutinen für die Feldvalidierung bereit. Diese werden durch die Beschreibungen aus den
 * ODCS Regeltabellen erweitert.
 *
 */
O2G.BMS2HTML = (function () {
    'use strict';


    // @private

    var _FieldNL;

    /**
     * @private
     * @param {number} FieldRow
     * @param {number} FieldColumn
     * @param {number} ValueLength
     * @param {string} FieldInitial
     * @param {string} FieldAttr
     * @param {string} FieldColor
     * @param {string} FieldExt
     * @param {string} id
     * @param {number} iFieldName
     * @param {string} ruleref
     * @returns {string} html
     * @desc Pro Maskenfeld (id) wird HTML Code erzeugt. Die Masken arbeiten mit einer absoluten Positionierung.
     * Als Einheit wird 'em' verwendet, damit ist ein 'responsives' Verhalten der Anwendung möglich. Der Inhalt
     * der Maske passt sich dem Fenster an, in Grösse und Positierung der Maskenelemente und Fonts.
     * Eingabefelder werden mit <input type=text> abgebildet. Die Länge der Eingabe wird mit 'maxlength' wird gesetzt.
     *
     */
    var _createHTML = function (FieldRow, FieldColumn, ValueLength,
        FieldInitial, FieldAttr, FieldColor, FieldExt,
        id, iFieldName, ruleref) {
        var StyleClass = "style='position:absolute; " + 'left:' + (Math.round(parseInt(FieldColumn, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em; ' + 'width:' + (Math.round(parseInt(ValueLength, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + "em;' " + "class='" + FieldAttr + " " + FieldColor + FieldExt + "' ";
        if (FieldAttr === 'I' || FieldAttr === 'N') {
            var value = '',
                _nl = ' ',
                rule = _setFieldRule(id, FieldAttr, ruleref);
            if (FieldInitial !== '') {
                value = ' value=' + "'" + FieldInitial + "'";
            }
            if (_FieldNL === 'NL') {
                _nl += "name='NL' ";
                _FieldNL = '';
            }
            if (O2G.Config.DEBUG){
                console.debug('F' + iFieldName + ' ' + FieldAttr + FieldColor + FieldExt + ' R:' + FieldRow + ' C:' + FieldColumn + ' L:' + ValueLength + ' ' + (Math.round(parseInt(FieldColumn, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + (Math.round(parseInt(ValueLength, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + JSON.stringify(ruleref) + ' ' + ' ' + FieldInitial.length + ': ' + ' "' + FieldInitial + '"');
            }
            return "<div id='F" + iFieldName + "' " + _nl + StyleClass + 'maxlength=' + ValueLength + " >" + "<input type='text'" + value + ' maxlength=' + ValueLength + rule + "/></div>";
        } else {
            if (FieldAttr === 'C') {
                if (O2G.Config.DEBUG){
                    console.debug('C' + ' ' + FieldAttr + FieldColor + FieldExt + ' R:' + FieldRow + ' C:' + FieldColumn + ' L:' + ValueLength + ' ' + (Math.round(parseInt(FieldColumn, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + (Math.round(parseInt(ValueLength, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + FieldInitial.length + ': ' + ' "' + FieldInitial + '"');
                }
                return '<div ' + StyleClass + '>' + FieldInitial + '</div>';
            } else {
                if (O2G.Config.DEBUG){
                    console.debug('F' + iFieldName + ' ' + FieldAttr + FieldColor + FieldExt + ' R:' + FieldRow + ' C:' + FieldColumn + ' L:' + ValueLength + ' ' + (Math.round(parseInt(FieldColumn, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + (Math.round(parseInt(ValueLength, 10) * O2G.Config.COLUMNFACTOR * 100) / 100) + 'em' + ' ' + JSON.stringify(ruleref) + ' ' + ' ' + FieldInitial.length + ': ' + ' "' + FieldInitial + '"');
                }
                if (ruleref.ob) {
                    O2G.GUI.screenlist[O2G.GUI.screenid].ob.push(['F' + iFieldName, ruleref.ob]);
                }
                return "<div id='F" + iFieldName + "' " + StyleClass + 'maxlength=' + ValueLength + " >" + FieldInitial + '</div>';
            }
        }
    };

    /**
     * @private
     * @param {string} id
     * @param {number} attr
     * @param {string} ruleref
     * @returns {string} htmlattribute
     * @desc Pro Maskenfeld (id) wird das für das für die Feldvalidierunf verantwortliche Attribut
     * 'data-validation-engine' erzeugt.
     *
     */
    var _setFieldRule = function (id, attr, ruleref) {
        var rule = " ";
        var num = "";
        if (attr === "N") {
            num = "onlyNumberSp,";
        }
        if (ruleref.mandatory) {
            rule += "required,";
        }
        if (ruleref.id && !num) {
            rule += "custom[" + ruleref.id + "]";
        }
        if (ruleref.id && num) {
            rule += "custom[" + ruleref.id + "," + num + "]";
        }
        if (!ruleref.id && num) {
            rule += "custom[" + num + "]";
        }
        if (rule !== " " && rule[rule.length - 1] === ',') {
            rule = rule.substr(0, rule.length - 1) + " ";
        }
        if (rule !== " ") {
            rule = " data-validation-engine='validate[" + rule.substr(1) + "]'";
        }
        return rule;
    };

    /**
     * @private
     * @param {number} FieldRow
     * @param {number} RowGap
     * @returns {string} html
     * @desc Alle Maskenfelder einer Zeile werden in einer Gruppe (class='line') zusammengefasst.
     * Eine Leerzeile besteht nur aus einem Tag "<div class='line'/>".
     *
     */
    var _fillLineTags = function (FieldRow, RowGap) {
        var html = '';
        if ((FieldRow - RowGap) >= 4) {
            html += '</div>';
        }
        RowGap -= 1;
        while (RowGap) {
            RowGap -= 1;
            html += "<div class='line'/>";
        }
        if (FieldRow <= 22) {
            html += "<div class='line'>";
        }
        return html;
    };


    /**
     * @param {string} FieldAttr
     * @returns {string}
     * @desc Ein 3270 Attribut (FieldAttr) besteht aus 8 Bits und dient dazu ein Ausgabefeld,
     * ein normales Eingabefeld und ein numerisches Eingabefeld zu definieren.
     * Die Rückgabe kann den Wert 'I' für Eingabe, 'O' für Ausgabe und 'N' für numerische Eingabe bekommen.
     *
     */
    var getFieldAttr = function (FieldAttr) {
        // ________________________________________________________________________
        //| Table 4-4. Bit Definitions for 3270 Field Attributes                   |
        //|_____ __________________________________________________________________|
        //| Bit | Description                                                      |
        //|_____|__________________________________________________________________|
        //| 0,1 | The function of bits 0 and 1 is to make the field attribute an   |
        //|     | EBCDIC/ASCII translatable graphic character. Bits 0 and 1 are    |
        //|     | set in accordance with Figure C-1 in topic C.0.                  |
        //|_____|__________________________________________________________________|
        //| 2   | 0 Field is unprotected                                           |
        //|     | 1 Field is protected                                             |
        //|_____|__________________________________________________________________|
        //| 3   | 0 Alphanumeric                                                   |
        //|     | 1 Numeric (causes an automatic upshift of data entry keyboard)   |
        //|     | Note: Bits 2 and 3 equal to B’11’ cause an automatic skip of a   |
        //|     | protected field.                                                 |
        //|_____|__________________________________________________________________|
        //| 4,5 | 00 Display/not selector pen detectable                           |
        //|     | 01 Display/selector pen detectable                               |
        //|     | 10 Intensified display/selector pen detectable                   |
        //|     | 11 Nondisplay, nondetectable (not printable)                     |
        //|_____|__________________________________________________________________|
        //| 6   | Reserved. Must always be 0.                                      |
        //|_____|__________________________________________________________________|
        //| 7   | MDT identifies modified fields during Read Modified command      |
        //|     | operations.                                                      |
        //|     | 0 Field has not been modified.                                   |
        //|     | 1 Field has been modified by the operator. MDT can also be set   |
        //|     | by a program in the data stream.                                 |
        //|_____|__________________________________________________________________|
        if (FieldAttr === '00') {
            return 'C';
        }
        var a = parseInt(FieldAttr, 16);
        var attr = (a & 32) ? 'O' : (a & 16) ? 'N' : 'I';
        if (attr === 'O' && (a & 8) && (a & 4)) {
            attr = 'P';
        } else if (attr === 'I' && (a & 8) && (a & 4)) {
            attr = 'J';
        } else if (attr === 'N' && (a & 8) && (a & 4)) {
            attr = 'K';
        }
        return attr;
    };

    /**
     * @param {string} FieldColor
     * @returns {string}
     * @desc Ein 3270 Farbattribut (FieldColor) besteht aus einem Byte (hex). Ein 3270 Bildschirm
     * hat 7 mögliche Textfarben.
     *
     */
    var getFieldColor = function (FieldColor) {
        // color:
        // F1       blue
        // F2       red
        // F3       pink
        // F4       green
        // F5       turquoise
        // F6       yellow
        // F7       neutral(white)
        switch (FieldColor) {
        case "F1":
            return 'B';
        case "F2":
            return 'R';
        case "F3":
            return 'P';
        case "F4":
            return 'G';
        case "F5":
            return 'T';
        case "F6":
            return 'Y';
        case "F7":
            return 'N';
        default:
            return 'G';
        }
    };

    /**
     * @param {string} FieldExt
     * @returns {string}
     * @desc Ein 3270 Hervorhebungsattribut (FieldExt) besteht aus einem Byte (hex). Ein 3270 Bildschirm
     * hat 4 verschiedene Hervorhebungsarten.
     *
     */
    var getFieldExt = function (FieldExt) {
        // ext:
        // F0       normal(attr is relevant)
        // F1       blink
        // F2       reverse
        // F4       underscore
        switch (FieldExt) {
        case "F0":
            return 'N';
        case "F1":
            return 'N';
        case "F2":
            return 'V';
        case "F4":
            return 'U';
        default:
            return 'N';
        }
    };

    /**
     * @param {array} arrBMSFromHostid
     * @param {array} arrRulesRef
     * @param {string} id
     * @returns {string} html
     * @desc Für die Maske (id) wird das HTML Gerüst für die Anwendung ohne die Kopf- und Fusszeilen erzeugt.
     * Hierfür stehen das CICS BMS Lademodul (arrBMSFromHostid) und das ODCS STRUKTUR Lademodul (arrRulesRef)
     * zur Verfügung. Im ODCS STRUKTUR Array werden die Feldregeln, mögliche Ordnungsbegriffe, Mussfelder und
     * zu benutzende Fehlernummern definiert.
     *
     */
    var initScreen = function (arrBMSFromHost, arrRulesRef, id) {
        var iFieldName = 0,
            objFieldId = '',
            FieldRow = 0,
            FieldColumn = 0,
            FieldAttr = '',
            FieldColor = '',
            FieldExt = '',
            iCopyLength = 0,
            ValueLength = 0,
            FieldInitial = '',
            nbsp = false,
            LastFieldRow = 3,
            html = '',
            obzone = 0,
            offset = 0,
            j = parseInt(arrBMSFromHost.substr(24, 4), 16) * 2,
            jrule = 84,
            ruleref = {},
            typ = '',
            rtyp = '',
            rlen = 0,
            i,
            ScreenOffset,
            lengthNextLine = 0;

        if (arrRulesRef.substr(58, 2) === '00') {
            jrule -= 16;
        }
        O2G.GUI.screenlist[id].screentitle = ' ';
        O2G.GUI.screenlist[id].ob = [];
        _FieldNL = '';

        if (O2G.Config.DEBUG){
            console.groupCollapsed("generate html for '%s'", id);
        }

        for (i = j; arrBMSFromHost.substr(i, 4) === '0000'; i += 24) {
            typ = arrBMSFromHost.substr(i + 8, 2);
            if (O2G.Config.DEBUG){
                console.debug('BMS Typ:' + typ);
            }
            if (typ !== '00') {
                ScreenOffset = parseInt(arrBMSFromHost.substr(i + 12, 4), 16) + 1;
                FieldColumn = ScreenOffset % 80;
                FieldRow = ((ScreenOffset - FieldColumn) / 80) + 1;
                ValueLength = parseInt(arrBMSFromHost.substr(i + 4, 4), 16);
                FieldInitial = '';

                if (FieldRow < 4 || FieldRow > 22) {
                    if (typ === '02') {
                        if (FieldRow === 2 && FieldColumn > 10 && FieldColumn < 60) {
                            O2G.GUI.screenlist[id].screentitle = O2G.Util.convert2ASCII(arrBMSFromHost.substr(i + 24, ValueLength * 2), false);
                        }
                        i += ValueLength * 2;
                    }
                    if (FieldRow === 23 && (FieldRow - LastFieldRow)) {
                        html += _fillLineTags(FieldRow, (FieldRow - LastFieldRow));
                        _FieldNL = 'NL';
                        LastFieldRow = FieldRow;
                    }
                    continue;
                }
                if ((FieldColumn + ValueLength) > 80) {
                    lengthNextLine = FieldColumn + ValueLength - 80;
                    ValueLength = 80 - FieldColumn;
                }
                if (typ === '02') {
                    FieldAttr = 'C';
                } else {
                    FieldAttr = getFieldAttr(arrBMSFromHost.substr(i + 10, 2));
                }

                FieldColor = getFieldColor(arrBMSFromHost.substr(i + 16, 2));
                FieldExt = getFieldExt(arrBMSFromHost.substr(i + 20, 2));

                if (FieldColor && !FieldExt) {
                    FieldExt = 'N';
                }
                if (!FieldColor && FieldExt) {
                    FieldColor = 'G';
                }
                if (FieldAttr === 'I' || FieldAttr === 'N' || FieldAttr === 'J' || FieldAttr === 'K') {
                    nbsp = false;
                } else {
                    nbsp = true;
                }
                if (typ === '02' || typ === '03') {
                    FieldInitial = O2G.Util.convert2ASCII(arrBMSFromHost.substr(i + 24, ValueLength * 2), nbsp);
                    i += ValueLength * 2;
                }
                if (FieldAttr !== 'C') {
                    iFieldName += 1;
                    iCopyLength += ValueLength + 7; // Cursor,Attr,Color,Ext,2ByteNotUsed
                }

                ruleref = {
                    ob: 0
                };

                if (arrRulesRef.substr(jrule, 4) !== 'FFFF' && FieldAttr !== 'C') {
                    while (arrRulesRef.substr(jrule, 4) !== 'FFFF' && ScreenOffset - 1 !== parseInt(arrRulesRef.substr(jrule, 4), 16)) {
                        rtyp = arrRulesRef.substr(jrule + 56, 2);
                        rlen = parseInt(arrRulesRef.substr(jrule + 6, 2), 16) * 2;
                        if (arrRulesRef.substr(jrule + 62, 2) === '01') {
                            rlen += 6;
                        }
                        if (rtyp === 'D2' && arrRulesRef.substr(jrule + 12, 2) === 'D5') {
                            rlen += 4;
                        }
                        jrule += 42 + rlen;
                        if (isNaN(jrule)) {
                            alert('loop');
                        }
                    }
                    if (arrRulesRef.substr(jrule, 4) !== 'FFFF') {
                        if (FieldAttr === 'I' || FieldAttr === 'N') {
                            ruleref.id = O2G.Util.convert2ASCII(arrRulesRef.substr(jrule + 40, 16), false);
                            if (O2G.Util.convert2ASCII(arrRulesRef.substr(jrule + 56, 2), false) === 'K') {
                                ruleref.mandatory = false;
                            } else {
                                ruleref.mandatory = true;
                            }
                            ruleref.fnr = parseInt(arrRulesRef.substr(jrule + 58, 4), 16);
                        }
                        ruleref.ob = parseInt(arrRulesRef.substr(jrule + 10, 2), 16);
                    }
                }

                if (FieldRow - LastFieldRow) {
                    html += _fillLineTags(FieldRow, (FieldRow - LastFieldRow));
                    _FieldNL = 'NL';
                    LastFieldRow = FieldRow;
                }
                html += _createHTML(FieldRow, FieldColumn, ValueLength,
                    FieldInitial, FieldAttr, FieldColor, FieldExt,
                    id, iFieldName, ruleref);

                if (FieldAttr === 'C' && lengthNextLine) {
                    if (typ === '02') {
                        FieldInitial = O2G.Util.convert2ASCII(arrBMSFromHost.substr(i + 24, lengthNextLine * 2), nbsp);
                        i += lengthNextLine * 2;
                    }
                    FieldRow += 1;
                    FieldColumn = 0;
                    LastFieldRow = FieldRow;
                    html += _fillLineTags(FieldRow, 1);
                    _FieldNL = 'NL';
                    html += _createHTML(FieldRow, FieldColumn, lengthNextLine,
                        FieldInitial, FieldAttr, FieldColor, FieldExt,
                        id, iFieldName, {});
                    lengthNextLine = 0;
                }

            }
        }
        O2G.GUI.screenlist[O2G.GUI.screenid].lastFieldId = 'F' + iFieldName;
        O2G.GUI.screenlist[O2G.GUI.screenid].iCopyLength = iCopyLength.toString();
        if (O2G.Config.DEBUG){
            console.groupEnd();
            console.debug(O2G.GUI.screenid + ':' + O2G.GUI.screenlist[O2G.GUI.screenid].iCopyLength);
        }
        return html;
    };


    return {
        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        VERSION: '$Revision: 36 $',
        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        initScreen: initScreen,
        getFieldAttr: getFieldAttr,
        getFieldExt: getFieldExt,
        getFieldColor: getFieldColor
    };

})();