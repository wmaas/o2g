/**
 * @desc Das Modul O2G.GUI stellt die JAVASCRIPT Funktionen für die Oberfläche des O2G Fensters
 * zur Verfügung.
 *
 */
O2G.GUI = (function () {
    'use strict';

    // @private

    var _inRecording, // Aufzeichnungsflag für QUNIT E2E 
        _poolback, //
        _tsnewcpy, // timestamp vom letzten NEWCOPY in CICS
        _cursorkbBuffer, //
        _searchNL,
        _isInBufferShift,
        _wasInBufferShift,
        _export; // Modul Globale Variablen und Funktion 

    _inRecording = false;
    _cursorkbBuffer = false;
    _searchNL = '';
    _isInBufferShift = false;
    _wasInBufferShift = false;

    /**
     * @private
     * @param {string} uctxid
     * @desc Funktion prüft ob Screen in Uppercase übersetzt werden soll
     * Tabelle/JSON XZCIN (O2G.Config.XZCIN) wird von SLV bereitgestellt.
     */

    var _checkUppercaseTxid = function (uctxid) {
        if ($.inArray(uctxid, O2G.Config.XZCIN) !== -1 || $.inArray(uctxid.substr(0, 1) + '***', O2G.Config.XZCIN) !== -1 || $.inArray(uctxid.substr(0, 2) + '**', O2G.Config.XZCIN) !== -1 || $.inArray(uctxid.substr(0, 3) + '*', O2G.Config.XZCIN) !== -1) {
            return '';
        }
        return uctxid;
    };

    /**
     * @param
     * @desc Start der GUI mit Anmeldung
     *
     */
    var run = function () {
        O2G.GUIStatic.init();
        O2G.AjaxUtil.init();
        O2G.BasicAuthRacf.signon();
    };

    /**
     * @public
     * @desc Der Response vom HOST wird hier verarbeitet. Die Felder aus dem HOST Copybook werden
     * in das HTML Gerüst eingearbeitet (_fillScreen). Der Cursor wird gesetzt. Daten aus dem
     * Keyboardbuffer werden mit eingearbeitet. Falls ENTER oder eine Funktionstaste im Keyboardbuffer
     * liegt wird die so gefüllte Maske gleich wieder dem HOST übergeben (processEnter). Im Normalfall
     * wird die Maske angezeigt und auf Tastatur oder Mausereignisse gewartet. Der Text in der Browser
     * TAB Lasche wird mit dem Namen des aktiven Vorganges und dem Ordnungsbegriff befüllt.
     *
     */

    // Debug Only 
    var showDataFromHostDbg = function () {
        var ret;
        O2G.Util.traceDbg('showDataFromHost', 'O2G.GUI');
        ret = showDataFromHost();
        O2G.Util.traceDbg('<<< showDataFromHost', 'O2G.GUI');
        return ret;
    };

    var showDataFromHost = function () {
        var $Screenhtml, title, FKey;

        O2G.GUI.cursorField = '';

        $Screenhtml = O2G.GUI.screenlist[O2G.GUI.screenid].html.clone();
        O2G.GUI.$Screen = $Screenhtml.children();

        if (!O2G.QUnit || !O2G.QUnit.isActive) {
            O2G.GUI.$Screen.validationEngine('attach', O2G.Config.VALIDATIONENGINE_OPTIONS);
        }

        _fillScreen(O2G.TCntrl.getCopy());

        O2G.GUI.isBuffering = false;
        if (O2G.GUI.kbBuffer.length && typeof O2G.GUI.kbBuffer[0] === 'string') {
            FKey = O2G.GUI.kbBuffer.shift();
        } else {
            O2G.GUI.kbBuffer = [];
        }
        O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.length;

        //Wenn in einer Klasse BLINK definiert wird blinkt der Text,
        // Text soll blinken, bei 0 soll es nicht blinken, eine Zahl >0 wiederholt das Blinken

        _setBlinking(O2G.Config.BLINK);
        _setCursor();

        $('#screen', O2G.GUIStatic.$Body).remove();
        O2G.GUIStatic.$Body.prepend($Screenhtml);
        O2G.GUI.$Screen = $('#screen', O2G.GUIStatic.$Body).children();
        _hideFields();

        O2G.GUIStatic.resizeFirstWindow();

        if (O2G.TCntrl.getID1() === O2G.Config.MASTER && O2G.TCntrl.getID2() === O2G.Config.MASTERMENUE) {
            title = O2G.Config.TEXTE.MASTERMENUETITLE;
        } else if (O2G.TCntrl.getID2() === O2G.Config.MASTERMENUE) {
            title = O2G.TCntrl.getID1() + O2G.Config.TEXTE.MENUETITLE;
        } else {
            title = O2G.TCntrl.getID1() + O2G.TCntrl.getID2();
        }
        $(document).attr('title', title + ' ' + O2G.TCntrl.getID5());

        O2G.GUIStatic.setMdbSize();

        if (FKey) {
            processEnter(FKey);
        }

        if (O2G.QUnit && O2G.QUnit.isActive) {
            (O2G.QUnit.getQUFn())(O2G.GUI.$Screen);
            O2G.GUI.$Screen.hide();
        }
        _wasInBufferShift = false;
    };

    /**
     * @public
     * @param {string} FKey
     * @desc Prüft ob geblättert werden kann und reagiert eventl. mit einer Fehlermeldung.
     *
     */

    // Debug Only
    var validatePagingDbg = function (FKey) {
        var ret;
        O2G.Util.traceDbg('validatePaging', 'O2G.GUI');
        ret = validatePaging(FKey);
        O2G.Util.traceDbg('<<< validatePaging', 'O2G.GUI');
        return ret;
    };

    var validatePaging = function (FKey) {
        if (FKey === 'F7') {
            if (!O2G.TCntrl.getCurrentTFStep().pages || O2G.TCntrl.getMPPTR() == 1) {
                O2G.TCntrl.setFNR('9028');
                O2G.GUIStatic.setTitleAndFooter();
                O2G.TCntrl.setFNR();
                return true;
            }
        } else if (!O2G.TCntrl.getCurrentTFStep().pages || O2G.TCntrl.getVORW() === 'N') {
            O2G.TCntrl.setFNR('9029');
            O2G.GUIStatic.setTitleAndFooter();
            O2G.TCntrl.setFNR();
            return true;
        }
        return false;
    };

    /**
     * @public
     * @param {string} FKey
     * @desc Prüft ob geblättert werden kann und reagiert eventl. mit einer Fehlermeldung.
     *
     */

    // Debug Only
    var validFieldsDbg = function (){
        var ret;
        O2G.Util.traceDbg('validFields', 'O2G.GUI');
        ret = validFields();
        O2G.Util.traceDbg('<<< validFields', 'O2G.GUI');
        return ret;
    };

    var validFields = function () {
        var $errorfield = $('input[resulterrortext]',O2G.GUI.$Screen);
        if ($errorfield.length){
            $errorfield.select();
            O2G.TCntrl.setFNR('9999');
            O2G.TCntrl.setFPARM(1,$errorfield.attr('resulterrortext'));
            O2G.GUIStatic.setTitleAndFooter();
            O2G.TCntrl.setFNR();
            O2G.TCntrl.setFPARM();
            return false;
        }
        return true;
    };

    /**
     * @public
     * @param {string} FKey
     * @desc Die Maskeneingaben werden validiert (technisch) und im HOST Copybook in hexadezimaler Form 00-FF
     * aufbereitet. Unveränderte Felder werden vom alten HOST Copybook (:copy) übernommen.
     * Da es sich beim HOST Copybook um eine fixe Struktur handelt und unbenutzte Felder mit x'00' und
     * x'40' befüllt werden, wird der erzeugte Datenstrom optimiert. x'FF' kündigt eine solche Optimierung
     * an. Das folgende Längenfeld x'01'-x'7F' legt fest wie oft x'00' verwendet wird. Längenwerte x'80' -
     * x'FF' wird für x'40' verwendet (Die Länge wird entsprechend um 64 reduziert).
     * Abschliessend wird das HOST Copybook an den HOST übertragen.
     *
     */

    // Debug Only
    var processEnterDbg = function (FKey) {
        var ret;
        O2G.Util.traceDbg('processEnter', 'O2G.GUI');
        ret = processEnter(FKey);
        O2G.Util.traceDbg('<<< processEnter', 'O2G.GUI');
        return ret;
    };

    var processEnter = function (FKey) {
        var oldcopy,
            nextFn,
            uctxid,
            copy,
            data,
            offset,
            id,
            input,
            lenval,
            len,
            pool,
            ret,
            usehexstring,
            copylen,
            $Field,
            $errorfield;

        O2G.GUI.isBuffering = true;
        copy = '';
        len = 0;
        copylen = 0;
        oldcopy = O2G.TCntrl.getCopy();
        O2G.TCntrl.setOldCopy(oldcopy);

        if (O2G.Config.DEBUG) {
            console.groupCollapsed("process fields of '%s'", O2G.GUI.screenid);
        }
        if (_inRecording) {
            O2G.QUnit.recordprocessEnter(O2G.GUI.screenid, FKey);
        }

        if (!O2G.TCntrl.getUC()) {
            _checkUppercaseTxid(O2G.TCntrl.getTransId());
        } else {
            uctxid = O2G.TCntrl.getTransId();
        }

        O2G.GUI.$Screen.children().children('div[id]').each(
            function () {
                $Field = $(this);
                id = $Field.attr('id');

                if (id === 'SYSID1') {
                    O2G.TCntrl.setID1($Field.children().val());
                } else if (id === 'SYSID2') {
                    O2G.TCntrl.setID2($Field.children().val());
                } else if (id === 'SYSID4') {
                    O2G.TCntrl.setID4($Field.children().val());
                }

                if (id[0] !== 'F') {
                    return;
                }
                if (!$Field.hasClass('O') && !$Field.hasClass('P')) {
                    input = $Field.children();
                    lenval = 0;
                    len = parseInt(input.attr('maxlength'), 10);
                    if (input.val()) {
                        usehexstring = false;
                        if (input.attr('resultstring')){
                            data = input.attr('resultstring');
                        } else if (input.attr('resultstringhex')){
                            usehexstring = true;
                            data = input.attr('resultstringhex');
                        } else {
                            data = input.val();
                        }

                        if (usehexstring) {
                            lenval = data.length/2;
                        } else {
                            lenval = data.length;
                            if (uctxid) {
                                data = data.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
                            }
                            data = O2G.Util.convert2HexEBCDIC(data);
                        }

                        if (O2G.Config.DEBUG) {
                            console.debug($Field.attr('id') + ' ' + input.val() + ' ' + lenval + ' ' + len + ' N:' + data + ' O:' + oldcopy.substr(copylen + 14, len * 2));
                        }

                        if (oldcopy.substr(copylen + 14, len * 2) === data || (oldcopy.substr(copylen + 14, data.length) === data && data.length < len * 2 && oldcopy.substr(data.length + copylen + 14, (len * 2) - data.length) === O2G.Util.hex40.substr(0, (len * 2) - data.length))) {
                            copy += 'FF07' + data;
                        } else {
                            copy += '00' + O2G.Util.getHexLen(len) + 'FF05' + data;
                            if (_inRecording) {
                                O2G.QUnit.recordInput(O2G.GUI.screenid, $Field.attr('id'), input.val(), lenval);
                            }
                        }
                        copylen += data.length + 14;
                        len -= lenval;
                        if (len > 0) {
                            copy += 'FF' + O2G.Util.convertInt2Hex(128 + len);
                            copylen += len * 2;
                        }
                        if (O2G.Config.DEBUG) {
                            console.debug('hex:' + copy.substr(offset, copy.length - offset));
                        }
                    } else if (id.substr(0, 3) !== 'SYS') {
                        if (oldcopy.substr(copylen + 14, len * 2) === O2G.Util.hex00.substr(0, len * 2)) {
                            copy += 'FF' + O2G.Util.convertInt2Hex(len + 7);
                        } else if (oldcopy.substr(copylen + 14, len * 2) === O2G.Util.hex40.substr(0, len * 2)) {
                            copy += 'FF07FF' + O2G.Util.convertInt2Hex(len + 128);
                        } else {
                            copy += '00' + O2G.Util.getHexLen(len) + 'FF05FF' + O2G.Util.convertInt2Hex(len + 128);
                            if (_inRecording) {
                                O2G.QUnit.recordInput(O2G.GUI.screenid, $Field.attr('id'), input.val(), lenval);
                            }
                        }
                        copylen += (len + 7) * 2;
                        if (O2G.Config.DEBUG) {
                            console.debug('hex:' + copy.substr(offset, copy.length - offset));
                        }
                    }
                } else {
                    len = parseInt($Field.attr('maxlength'), 10);
                    if (oldcopy.substr(copylen + 14, len * 2) === O2G.Util.hex00.substr(0, len * 2)) {
                        copy += 'FF' + O2G.Util.convertInt2Hex(len + 7);
                    } else if (oldcopy.substr(copylen + 14, len * 2) === O2G.Util.hex40.substr(0, len * 2)) {
                        copy += 'FF07FF' + O2G.Util.convertInt2Hex(len + 128);
                    } else {
                        if (uctxid) {
                            data = O2G.Util.convert2ASCII(oldcopy.substr(copylen + 14, len * 2));
                            data = data.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
                            data = O2G.Util.convert2HexEBCDIC(data);
                            copy += 'FF07' + data;
                            len -= data.length / 2;
                            if (len > 0) {
                                copy += 'FF' + O2G.Util.convertInt2Hex(128 + len);
                            }
                            len += data.length / 2;
                        } else {
                            copy += 'FF07' + oldcopy.substr(copylen + 14, len * 2);
                        }
                    }
                    copylen += (len + 7) * 2;

                    if (O2G.Config.DEBUG) {
                        console.debug(id + ' ' + 'hex:' + copy.substr(offset, copy.length - offset));
                    }
                }
            }
        );

        if (O2G.Config.DEBUG) {
            console.groupEnd();
        }

        O2G.GUIStatic.$LastFieldUsed = '';

        ret = O2G.TCntrl.setRET(FKey);
        if (ret === 'SHOW') {
            O2G.Resource.prepareScreen(O2G.GUI.showDataFromHost);
        } else if (ret === 'CANC') {
            O2G.GUI.sendDataToHost();

        } else if (ret === 'SAVE') {
            O2G.GUI.sendDataToHost(O2G.TCntrl.getCopy(), true);

        } else if (ret === 'UNDO') {
            pool = O2G.TCntrl.setTFStepFromUndo(-1);
            if (pool !== O2G.TCntrl.offsetsmdb.toString()) {
                _poolback = pool;
            } else {
                _poolback = '';
            }
            O2G.TCntrl.setCopyMPPTR();
            O2G.Resource.prepareScreen(O2G.GUI.showDataFromHost);
        } else if (ret === 'ETFO') {
            if (O2G.TCntrl.getNextTFStep(ret, 'start')) {
                O2G.GUI.sendDataToHost();
            }
        } else {
            nextFn = function () {
                O2G.GUI.sendDataToHost(copy, true);
            };
            O2G.Resource.prepareScreen(nextFn);
        }
    };

    /**
     * @public
     * @desc Die Übertragung an den Host wird gestartet und der Response der Funktion 'showDataFromHost'
     * zur Verfügung gestellt.
     *
     */
    var sendDataToHostDbg = function (copy, fromTCntrl) {
        var ret;
        O2G.Util.traceDbg('sendDataToHost', 'O2G.GUI');
        ret = sendDataToHost(copy, fromTCntrl);
        if (ret && O2G.Config.DEBUG) {
            console.debug('... async started: ' + ret + ' ' + O2G.TCntrl.getID1() + O2G.TCntrl.getID2());
        }
        O2G.Util.traceDbg('<<< sendDataToHost', 'O2G.GUI');

    };

    var sendDataToHost = function (copy, fromTCntrl) {
        var nextFn, tfolge, options, receiveDataFromHostFn, prepareDataFromHostFn;

        if (O2G.GUI.screenid && (!O2G.QUnit || !O2G.QUnit.isActive)) {
            $('#' + O2G.GUI.screenid, O2G.GUIStatic.$Body).validationEngine('detach');
        }

        tfolge = O2G.TCntrl.getID1() + O2G.TCntrl.getID2();
        if (!fromTCntrl) {
            nextFn = function () {
                O2G.GUI.sendDataToHost(copy, true);
            };
            O2G.TCntrl.loadTFolge(tfolge.substr(0, 3), tfolge.substr(3), nextFn);
            return;
        }

        if (!O2G.Resource.tfolge[tfolge]) {
            O2G.Resource.tfolge[tfolge] = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + tfolge);
        }

        if ((O2G.TCntrl.getCurrentTFStep().typ === 'N' || O2G.TCntrl.getCurrentTFStep().typ === 'O' || O2G.TCntrl.getCurrentTFStep().typ === 'P') && !O2G.TCntrl.getCurrentTFStep().started) {

            prepareDataFromHostFn = function () {
                O2G.TCntrl.getCurrentTFStep().started = true;
                O2G.TCntrl.setVORW(' ');
                O2G.TCntrl.setMPPTR('001');
                O2G.TCntrl.setPID(O2G.TCntrl.getProgram());
                O2G.TCntrl.setCopy();
                O2G.GUI.showDataFromHost();
            };
            O2G.Resource.prepareScreen(prepareDataFromHostFn);
            return;
        }

        if (!O2G.QUnit || !O2G.QUnit.isActive) {
            O2G.BasicAuthRacf.setSessionTimeout();
        }
        O2G.Util.setMsgAI(O2G.BasicAuthRacf.user + ' ruft ' + O2G.BasicAuthRacf.system + ' ' + O2G.TCntrl.getID1() + O2G.TCntrl.getID2());

        // @ASYNC

        receiveDataFromHostFn = function (response) {

            if (response.tsnewcpy) {
                _tsnewcpy = response.tsnewcpy;
                if (_deleteCache(response.newcpy, response.sysvar.ID1 + response.sysvar.ID2)) {
                    response.sysvar.RET = 'PF03';
                    response.sysvar.FNR = '9999';
                }
            }

            O2G.TCntrl.offsetsmdb = response.offsetsmdb;
            O2G.TCntrl.setCOND(response.cond);
            O2G.TCntrl.setSYSVAR(response.sysvar);
            O2G.TCntrl.setCopy(response.copy);

            if (O2G.TCntrl.getERASE) {
                O2G.TCntrl.setOldCopy('');
            }
            if (O2G.TCntrl.getFROM() === 'A') {
                O2G.TCntrl.setFROM('R');
            }
            if (O2G.TCntrl.getNextTFStep(O2G.TCntrl.getRET(), 'start')) {
                O2G.Resource.prepareScreen(O2G.GUI.showDataFromHost);
            }
        };

        options = {
            data: {
                cmd: 'run',
                id: O2G.GUI.screenid,
                tstfolge: (O2G.Resource.tfolge[tfolge]) ? O2G.Resource.tfolge[tfolge].ts : ""
            }
        };
        if (O2G.GUI.screenlist[O2G.GUI.screenid]) {
            options.data.tsmask = O2G.GUI.screenlist[O2G.GUI.screenid].tsmask;
            options.data.copylen = '00000';
            options.data.copylen = options.data.copylen.substr(0, 5 - O2G.GUI.screenlist[O2G.GUI.screenid].iCopyLength.length) + O2G.GUI.screenlist[O2G.GUI.screenid].iCopyLength;
        }
        if (O2G.QUnit.testowner) {
            options.data.testcase = O2G.QUnit.testowner + O2G.QUnit.testcase;
        }
        if (copy) {
            if (O2G.TCntrl.getFROM() === 'A') {
                O2G.TCntrl.setRET("ENTR");
            } else {
                O2G.TCntrl.setFROM("R");
            }
            if (O2G.TCntrl.getRET() !== 'PF08') {
                options.data.copy = copy;
            }
        } else {
            if (O2G.TCntrl.getFROM() === "M") {
                O2G.TCntrl.setMPPTR("001");
            }
        }
        if (O2G.Config.DEBUG) {
            options.data.debug = 'true';
        }
        if (_tsnewcpy) {
            options.data.tsnewcpy = _tsnewcpy;
        }
        if (O2G.TCntrl.offsetsmdb) {
            options.data.offsetsmdb = O2G.TCntrl.offsetsmdb;
        }
        if (_poolback) {
            options.data.pool = parseInt(_poolback.substr(0, 5), 10);
            options.data.pool -= 1;
            options.data.pool = '00000'.substr(0, 5 - options.data.pool.toString().length) +
                options.data.pool;
            _poolback = '';
        }
        options.data.sysvar = O2G.TCntrl.createSYSVAR();
        options.data.condlist = O2G.TCntrl.createCONDLIST();

        return O2G.AjaxUtil.run(options, receiveDataFromHostFn);
    };


    /**
     * @private
     * @param {string} copy
     * @desc Die Anwendungsfelder im HTML Gerüst sind mit den Ids F1 - Fn gekennzeichnet.
     * Der 3270 Datenstrom (HOST Copybook CICS BMS Format) erlaubt es das aus Eingabefeldern
     * Ausgabefelder und umgekehrt werden. Cursor koennen mit x'FFFF' gesetzt werden.
     * Style Attribute wie Farbe und Unterstrichen zum Beispiel koennen gesetzt beziehungsweise
     * geändert werden. Die Felder SYSxxx des Kopf bzw. Fussbereiches werden gesondert mit der
     * Funktion '_fillSYSFieldsFromTCntrl' befüllt.
     *
     */

    var _fillScreen = function (copy) {
        var FieldId,
            iFieldName,
            $Field,
            FieldAttr,
            FieldColor,
            FieldExt,
            FieldValue,
            valuelen,
            oldcopy,
            i;

        _cursorkbBuffer = false;
        _searchNL = '';

        if (!copy) {
            return;
        }
        if (_inRecording) {
            O2G.QUnit.recordfillScreen(O2G.GUI.screenid);
            O2G.QUnit.recordOutput(O2G.GUI.screenid, 'SYSFNR', ["O", "O"], ["GN", "GN"], O2G.TCntrl.getFNR(), false);
            O2G.QUnit.recordOutput(O2G.GUI.screenid, 'SYSPAGE', ["O", "O"], ["GN", "GN"], O2G.TCntrl.getMPPTR(), false);
        }

        oldcopy = O2G.TCntrl.getOldCopy();

        i = 0;
        iFieldName = 0;
        valuelen = 0;

        for (FieldId = 'F0'; FieldId !== O2G.GUI.screenlist[O2G.GUI.screenid].lastFieldId; i += valuelen + 14) {
            iFieldName += 1;
            FieldId = 'F' + iFieldName;
            $Field = $('#' + FieldId, O2G.GUI.$Screen);

            if (copy.substr(i + 4, 2) === '00' && oldcopy && oldcopy.substr(i + 4, 2) !== '00') {
                FieldAttr = O2G.BMS2HTML.getFieldAttr(oldcopy.substr(i + 4, 2));
            } else if (copy.substr(i + 4, 2) !== '00') {
                FieldAttr = O2G.BMS2HTML.getFieldAttr(copy.substr(i + 4, 2));
            } else {
                FieldAttr = '';
            }
            if (copy.substr(i + 6, 2) === '00' && oldcopy && oldcopy.substr(i + 6, 2) !== '00') {
                FieldColor = O2G.BMS2HTML.getFieldColor(oldcopy.substr(i + 6, 2));
            } else if (copy.substr(i + 6, 2) !== '00') {
                FieldColor = O2G.BMS2HTML.getFieldColor(copy.substr(i + 6, 2));
            } else {
                FieldColor = '';
            }
            if (copy.substr(i + 10, 2) === '00' && oldcopy && oldcopy.substr(i + 10, 2) !== '00') {
                FieldExt = O2G.BMS2HTML.getFieldExt(oldcopy.substr(i + 10, 2));
            } else if (copy.substr(i + 10, 2) !== '00') {
                FieldExt = O2G.BMS2HTML.getFieldExt(copy.substr(i + 10, 2));
            } else {
                FieldExt = '';
            }

            valuelen = parseInt($Field.attr('maxlength'), 10) * 2;
            FieldValue = copy.substr(i + 14, valuelen);
            if (FieldValue === O2G.Util.hex00.substr(0, valuelen) || FieldValue === O2G.Util.hex40.substr(0, valuelen)) {
                FieldValue = '';
            }
            if (FieldAttr !== '' || FieldColor !== '' || FieldExt !== '') {
                _setFieldfromHost($Field, FieldAttr, FieldColor, FieldExt, FieldValue, copy.substr(i, 4), FieldId);
            } else {
                O2G.GUI.setFieldValue($Field, FieldId, FieldValue, copy.substr(i, 4));
            }
            if (copy.substr(i, 4) === 'FFFF' && !O2G.GUI.cursorField) {
                O2G.GUI.saveCursor(FieldId);
            }
        }

        O2G.GUIStatic.setTitleAndFooter();
        O2G.HashUtil.setHash();

        if (_inRecording) {
            O2G.QUnit.recordfinishStep();
        }
    };


    /**
     * @private
     * @desc Wenn die CURSOR Position durch den HOST gesetzt wurde wird das entsprechende Feld
     * fokusiert, dabei werden die Daten als 'selektiert' zum Überschreiben gekennzeichnet. Wurde
     * kein CURSOR von der Anwendung gesetzt wird standardmässig das Ordnungsbegrifffeld (SYSID4)
     * selektiert.
     * Ausnahme: Wurden die Felddaten über den Keyboardbuffer befüllt wird das letzte Feld
     * nicht selektiert, sondern nur fokusiert. Es findet kein Überschreiben statt.
     *
     */
    var _setCursor = function () {
        var $cursor;
        if (O2G.GUI.cursorField) {
            $cursor = $('#' + O2G.GUI.cursorField + ' input', O2G.GUI.$Screen);
        } else {
            $cursor = $('#SYSID4 input', O2G.GUI.$Screen);
        }
        if (_wasInBufferShift) {
            setTimeout(function () {
                $cursor.focus();
            }, 10);
        } else {
            setTimeout(function () {
                $cursor.select();
            }, 10);
        }
    };

    /**
     * @private
     * @desc Im 3270 Umfeld gibt es die Möglichkeit Felder mit besonderer Wichtigkeit
     * blinken zu lassen. Dieses Verhalten ist nicht aktiv.
     * Bei Bedarf kann ein BLINKEN für kurze Zeit (konfigurierbar) aktiviert werden.
     *
     */
    var _setBlinking = function (blinken) {
        if (blinken) {
            $(O2G.GUI.$Screen.getElementsByClassName('BLINK')).each(
                function () {
                    var i;
                    for (i = 0; i < blinken; i += 1) {
                        $(this).hide('normal').show('normal');
                    }
                }
            );
        }
    };

    /**
     * @private
     * @param {string} strResources (8 byte pro Resource)
     * @desc Loeschen aller angeforderten Resourcen (Anforderung durch CICS NEWCOPY)
     *
     */

    var _deleteCache = function (strResources, tfolge) {
        var i,
            offset,
            res,
            activtf;

        activtf = false;
        i = strResources.length / 8;
        offset = 0;

        while (i) {
            i -= 1;
            res = strResources.substr(offset, 8).trim();
            if (res[0] === 'L') {
                res = res.substr(1);
                if (res === tfolge) {
                    activtf = true;
                }
                if (O2G.Resource.tfolge[res]) {
                    O2G.Resource.tfolge[res] = '';
                }
                O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + res);
            } else if (res[0] === 'S') {
                res = 'M' + res.substr(1);
                if (O2G.GUI.screenlist[res]) {
                    O2G.GUI.screenlist[res] = '';
                }
                O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + res);
            }
        }
        return activtf;
    };

    /**
     * @private
     * @param {object} $Field
     * @param {string} ioAttr
     * @param {string} baseColor
     * @param {string} extColor
     * @param {string} valuehex
     * @param {string} cursor
     * @param {string} FieldId
     * @desc Über 3270 Attribute koennen Styles (Farben, Hervorhebungen) dynamisch geändert werden.
     * Eingabe kann zur Ausgabe werden und umgekehrt.
     *
     */

    var _setFieldfromHost = function ($Field, ioAttr, baseColor, extColor, valuehex, cursor, FieldId) {
        var classattr,
            value,
            htmlColor;

        classattr = $Field.attr('class');
        htmlColor = classattr.substr(2, 2);
        value = '';
        ioAttr = ioAttr || classattr[0];

        if (baseColor) {
            htmlColor = baseColor + htmlColor[1];
        }
        if (extColor) {
            htmlColor = htmlColor[0] + extColor;
        }
        if (ioAttr !== 'O' && ioAttr !== 'P' && ($Field.hasClass('O') || $Field.hasClass('P'))) {
            if (valuehex) {
                value = O2G.Util.convert2ASCII(valuehex, false);
                value = " value='" + value + "'";
            } else {
                value = valuehex = $Field.text();
                if (value) {
                    value = " value='" + value + "'";
                } else {
                    value = ' ';
                }
            }
            $Field.html($.parseHTML("<input type='text' maxlength=" + $Field.attr('maxlength') + value + "/>"));
            if (ioAttr === 'N' || ioAttr === 'K') {
                _setRuleNumeric($Field.children());
            }
            if (_inRecording) {
                O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [classattr.substr(0, 1), ioAttr], [classattr.substr(2, 2), htmlColor], O2G.Util.convert2ASCII(valuehex, false), cursor);
            }
        } else if ((ioAttr === 'O' || ioAttr === 'P') && !$Field.hasClass('O') && !$Field.hasClass('P')) {
            if (valuehex) {
                $Field.html($.parseHTML(O2G.Util.convert2ASCII(valuehex, true)));
                if (_inRecording) {
                    O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [classattr.substr(0, 1), ioAttr], [classattr.substr(2, 2), htmlColor], O2G.Util.convert2ASCII(valuehex, true), cursor);
                }
            } else {
                $Field.html($.parseHTML($Field.children().val()));
            }
        } else {
            if (!$Field.hasClass('O') && !$Field.hasClass('P')) {
                if (valuehex) {
                    value = O2G.Util.convert2ASCII(valuehex, false);
                    $Field.children().val(value);
                    if (_inRecording) {
                        O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [classattr.substr(0, 1), ioAttr], [classattr.substr(2, 2), htmlColor], value, cursor);
                    }
                }
                if (ioAttr === 'N' || ioAttr === 'K') {
                    _setRuleNumeric($Field.children());
                }
            } else {
                if (valuehex) {
                    value = O2G.Util.convert2ASCII(valuehex, true);
                    $Field.html($.parseHTML(value));
                    if (_inRecording) {
                        O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [classattr.substr(0, 1), ioAttr], [classattr.substr(2, 2), htmlColor], value, cursor);
                    }
                }
            }
        }
        $Field.attr('class', ioAttr + ' ' + htmlColor);
        if (ioAttr !== 'O' && ioAttr !== 'P' && _wasInBufferShift && _cursorkbBuffer) {
            _cursorkbBuffer = false;
            O2G.GUI.cursorField = $Field.attr('id');
        }
        if (ioAttr !== 'O' && ioAttr !== 'P' && ((cursor === 'FFFF' && O2G.GUI.kbBuffer.length && O2G.GUI.isBuffering) || _isInBufferShift)) {
            if (O2G.GUI.kbBuffer[0] === 'NL' && !_searchNL) {
                _searchNL = 'NL';
            } else if (O2G.GUI.kbBuffer[0] === 'NL' && _searchNL === $Field.attr('name')) {
                _searchNL = $Field.attr('id');
            }
            if (O2G.GUI.kbBuffer[0] === 'NL' && _searchNL && _searchNL !== 'NL') {
                O2G.GUI.kbBuffer.shift();
                if (O2G.GUI.kbBuffer.length) {
                    _searchNL = '';
                }
            }
            if (_searchNL && _searchNL !== 'NL' && !O2G.GUI.kbBuffer.length) {
                _isInBufferShift = false;
                _wasInBufferShift = true;
                O2G.GUI.cursorField = $Field.attr('id');
                _searchNL = '';
            }
        }
        if (ioAttr !== 'O' && ioAttr !== 'P' && ((cursor === 'FFFF' && O2G.GUI.kbBuffer.length && O2G.GUI.isBuffering) || _isInBufferShift)) {
            _setValueFromkbBuffer($Field);
        }
    };

    /**
     * @private
     * @desc Im 3270 Umfeld gibt es die Möglichkeit Felder numerisch zu definieren.
     * Diese Einstellung wirkt sich auf die Tastaturhardware/software aus. Das kann
     * im Browser durch die Feldvalidierungsregeln abgebildet werden. Auf ein Sperren
     * einzelner Tasten wird hier verzichtet.
     *
     */

    var _setRuleNumeric = function (input) {
        var rulenumeric;
        rulenumeric = input.attr("data-validation-engine");
        if (rulenumeric) {
            if (rulenumeric.search(/onlyNumberSp/) === -1) {
                if (rulenumeric.search(/custom\[/) === -1) {
                    rulenumeric = rulenumeric.substr(0, rulenumeric.length - 1) + ",custom[onlyNumberSp]]";
                } else {
                    rulenumeric = rulenumeric.substr(0, rulenumeric.length - 2) + ",onlyNumberSp]]";
                }
            }
        } else {
            rulenumeric = 'validate[custom[onlyNumberSp]]';
        }
        input.attr("data-validation-engine", rulenumeric);
    };

    /**
     * @private
     * @param {string} FieldId
     * @desc Setzte Cursor auf Feld (FieldId). Setzte O2G.GUI.cursor auf gesetzt. Wenn der CURSOR auf
     * mehrere Felder gesetz wird, wird nur das erste Feld berücksichtigt.
     *
     */

    var saveCursor = function (FieldId) {
        if (!_isInBufferShift && !_wasInBufferShift) {
            O2G.GUI.cursorField = FieldId;
        }
    };

    /**
     * @private
     * @param {object} $Field
     * @param {string} FieldId
     * @param {string} valuehex
     * @param {string} cursor
     * @desc Feldinhalte koennen auch ohne Styleänderungen vorkommen, hier werden nur Felder
     * befüllt. Bei SYSID1 und SYSID2 (Fachgebiet und Vorgang) werden auch zentrale Felder befüllt.
     * Daten des Keyboardbuffers werden ab der ersten Cursorpositionierung zur Feldbefüllung mit verwendet.
     * Die Felddaten (valuehex) werden hexadezimal übergeben und nach ASCII übersetzt.
     *
     */

    var setFieldValue = function ($Field, FieldId, valuehex, cursor) {
        var value,
            ioattr;

        if (_inRecording) {
            ioattr = $Field.attr('class').substr(0, 1);
        }

        if ($Field.hasClass('O') || $Field.hasClass('P')) {
            if (valuehex) {
                value = O2G.Util.convert2ASCII(valuehex, true);
                $Field.html($.parseHTML(value));
                if (_inRecording) {
                    O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [ioattr, ioattr], [$Field.attr('class').substr(2, 2), $Field.attr('class').substr(2, 2)], value, cursor);
                }
            }
        } else {
            if (valuehex) {
                if (FieldId.substr(0, 3) !== 'SYS') {
                    value = O2G.Util.convert2ASCII(valuehex, false);
                } else {
                    value = valuehex;
                }
                $Field.children().val(value);
                if (_inRecording) {
                    O2G.QUnit.recordOutput(O2G.GUI.screenid, FieldId, [ioattr, ioattr], [$Field.attr('class').substr(2, 2), $Field.attr('class').substr(2, 2)], value, cursor);
                }
            } else {
                if (FieldId.substr(0, 3) === 'SYS') {
                    $Field.children().val('');
                }
            }
            if (_wasInBufferShift && _cursorkbBuffer) {
                _cursorkbBuffer = false;
                O2G.GUI.cursorField = $Field.attr('id');
            }
            if ((O2G.GUI.kbBuffer.length && O2G.GUI.isBuffering && cursor === 'FFFF') || _isInBufferShift) {
                if (O2G.GUI.kbBuffer[0] === 'NL' && !_searchNL) {
                    _searchNL = 'NL';
                } else if (O2G.GUI.kbBuffer[0] === 'NL' && _searchNL === $Field.attr('name')) {
                    _searchNL = $Field.attr('id');
                }
                if (O2G.GUI.kbBuffer[0] === 'NL' && _searchNL && _searchNL !== 'NL') {
                    O2G.GUI.kbBuffer.shift();
                    if (O2G.GUI.kbBuffer.length) {
                        _searchNL = '';
                    }
                }
                if (_searchNL && _searchNL !== 'NL' && !O2G.GUI.kbBuffer.length) {
                    _isInBufferShift = false;
                    _wasInBufferShift = true;
                    O2G.GUI.cursorField = $Field.attr('id');
                    _searchNL = '';
                }
            }
            if ((O2G.GUI.kbBuffer.length && O2G.GUI.isBuffering && cursor === 'FFFF') || _isInBufferShift) {
                _setValueFromkbBuffer($Field);
            }
        }
    };

    /**
     * @private
     * @param {object} $Field
     * @desc Feldinhalte koennen auch aus dem Keyboardbuffer befüllt werden. Der Keyboardbuffer ist dafür
     * gedacht, die Tastatureingaben zwischenzuspeichern, während der HOST die Verarbeitung der letzten
     * Maske noch nicht abgeschlossen hat. Tastaturereignisee wie TAB, BACKSPACE und NEWLINE werden
     * berücksichtigt. Es koennen die Daten von mehreren Masken gebuffert werden.
     *
     */
    var _setValueFromkbBuffer = function ($Field) {
        var length,
            maxlen,
            value,
            i;

        if (O2G.Config.DEBUG) {
            console.debug('Start using kbBuffer: ' + O2G.GUI.kbBuffer.join() + ' for ' + $Field.attr('id') + ' ' + $Field.attr('name') + ' searchNL:' + _searchNL);
        }

        _isInBufferShift = true;
        _wasInBufferShift = true;

        if (_searchNL === 'NL') {
            return;
        }

        length = parseInt($Field.attr('maxlength'), 10);
        maxlen = length;
        value = [];
        i = 0;

        _isInBufferShift = true;
        while (length) {
            length -= 1;
            if (O2G.GUI.kbBuffer.length && typeof O2G.GUI.kbBuffer[0] !== 'string') {
                value[i] = String.fromCharCode(O2G.GUI.kbBuffer.shift());
                i += 1;
            }
        }
        if (value.length) {
            $Field.children().val(value.join(""));
        }
        if (O2G.GUI.kbBuffer.length && O2G.GUI.kbBuffer[0] === 'TAB') {
            if (value.length !== maxlen) {
                O2G.GUI.kbBuffer.shift(); // bei ASKIP TAB erst beim nächsten Feld verwenden
            }
            if (!O2G.GUI.kbBuffer.length) {
                _cursorkbBuffer = true;
            }
        }
        if (!O2G.GUI.kbBuffer.length || (typeof O2G.GUI.kbBuffer[0] === 'string' && O2G.GUI.kbBuffer[0] !== 'TAB' && O2G.GUI.kbBuffer[0] !== 'NL')) {
            _isInBufferShift = !_isInBufferShift;
        }
        if (!_isInBufferShift) {
            if (value.length === maxlen) {
                _cursorkbBuffer = true;
            } else {
                O2G.GUI.cursorField = $Field.attr('id');
            }
        }
        if (O2G.Config.DEBUG) {
            console.debug('End using kbBuffer: ' + O2G.GUI.kbBuffer.join() + ' for ' + $Field.attr('id') + ' ' + $Field.attr('name') + ' Cursor: ' + O2G.GUI.cursorField);
        }
    };

    /**
     * @private
     * @desc Feldinhalte koennen unsichtbar sein. Gelöst wurde das durch
     * Setzen der Farbe des Fonts auf die Farbe des Hintergrunds.
     *
     */
    var _hideFields = function () {
        O2G.GUI.$Screen.children().children('div[id]').each(
            function () {
                if ($(this).hasClass('P') || $(this).hasClass('J') || $(this).hasClass('K')) {
                    $(this).css('color', $(this).css('background-color'));
                }
            }
        );
    };

    // Variablen und Funktionen, die von anderen Modulen des O2G Paketes verwendet werden

    _export = {

        $Screen: '',
        isBuffering: false,
        kbBuffer: [],
        kbBufferLen: 0,
        cursorField: '',
        screenlist: {},
        screenid: '',
        VERSION: '$Revision: 36 $',

        run: run,
        processEnter: processEnter,
        validatePaging: validatePaging,
        validFields: validFields,
        saveCursor: saveCursor,
        setFieldValue: setFieldValue,
        sendDataToHost: sendDataToHost,
        showDataFromHost: showDataFromHost
    };

    if (O2G.Config.DEBUG) {
        _export.processEnter = processEnterDbg;
        _export.validatePaging = validatePagingDbg;
        _export.validFields = validFieldsDbg;
        _export.sendDataToHost = sendDataToHostDbg;
        _export.showDataFromHost = showDataFromHostDbg;
    }

    return _export;

})();