/**
 * @desc Das Modul O2G.Resource stellt die JAVASCRIPT Funktionen für  das Laden, Interpretieren und
 * Generieren von JSON aus ODCS Resourcen bereit. Auch das Caching im Speicher, LOCALSTORAGE und im
 * O2G Server wird von diesen Funktionen übernommen.
 *
 */
O2G.Resource = (function () {
    'use strict';

    var _export;

    /**
     * @param {object} login
     * @desc
     *
     */
    var init = function (login) {
        _createandsaveMenue(login.menue);
        _createandsaveRules(login.rules);
        _createandsaveText(login.text);
    };
    /**
     * @param {function} nextFn
     * @desc Für die Masken wird das CICS BMS Lademodul und das ODCS Struktur Lademodul benötigt.
     * Es wird geprüft ob diese Resourcen im Speicher oder LOCALSTORAGE vorhanden sind, wenn nicht,
     * wird im O2G Server Cache geschaut, ansonsten werden die Lademodule vom HOST geladen.
     * Wenn die Lademodule aus dem O2G Cache oder dem HOST kommen werden die Resourcen neu erzeugt
     * HTML Gerüst etc.
     * Abschliessend wird die nächste Funktion (nextFn) aufgerufen.
     *
     */
    var prepareScreenDbg = function (nextFn) {
        O2G.Util.traceDbg('prepareScreen', 'O2G.Resource');
        var ret = prepareScreen(nextFn);
        if (ret){
            console.debug('... async started: ' + ret);
        }
        O2G.Util.traceDbg('<<< prepareScreen', 'O2G.Resource');
        return ret;
    };

    var prepareScreen = function (nextFn) {
        if (O2G.QUnit && O2G.QUnit.isActive && !O2G.QUnit.prepareScreen('before', nextFn)){
            return;
        }
        if (!O2G.GUI.screenlist[O2G.GUI.screenid]) {
            var store = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + O2G.GUI.screenid);
            if (store) {
                O2G.GUI.screenlist[O2G.GUI.screenid] = {
                    tsmask: store.ts,
                    screentitle: store.title,
                    lastFieldId: store.lastFieldId,
                    iCopyLength: store.iCopyLength,
                    ob: store.ob,
                    html: $('<div id="screen" ><div id="' + O2G.GUI.screenid + '" class="validationEngineContainer"></div></div>')
                };
                _createDocumentScreen(store.html, O2G.GUI.screenid, false);
            }
        }
        if (O2G.GUI.screenlist[O2G.GUI.screenid]) {
            nextFn();
        } else {
            O2G.Util.setMsgAI(O2G.BasicAuthRacf.user + ' lädt ' + O2G.GUI.screenid + ' von ' + O2G.BasicAuthRacf.system);
            var _processScreenFn = function (resource, status, jqXHR) {
                O2G.GUI.screenlist[resource.id] = {
                    tsmask: O2G.Util.convert2ASCII(resource.rulesref.substr(10, 44), false),
                    html: $('<div id="screen" ><div id="' + resource.id + '" class="validationEngineContainer"></div></div>')
                };
                var inithtml = _createDocumentScreen(O2G.BMS2HTML.initScreen(resource.data, resource.rulesref, resource.id), resource.id, true);
                O2G.LocalStorage.set(O2G.Config.SYSENV + '_' + resource.id, {
                    html: inithtml,
                    title: O2G.GUI.screenlist[resource.id].screentitle,
                    ts: O2G.GUI.screenlist[resource.id].tsmask,
                    lastFieldId: O2G.GUI.screenlist[resource.id].lastFieldId,
                    ob: O2G.GUI.screenlist[resource.id].ob,
                    iCopyLength: O2G.GUI.screenlist[resource.id].iCopyLength
                });
                nextFn();
            };

            var _prepareScreenErrorFn = function (jqxhr, status, error) {
                if (O2G.Config.DEBUG){
                    console.debug('Can\'t load MASK ' + O2G.GUI.screenid);
                }
                if (O2G.QUnit && O2G.QUnit.isActive){
                    O2G.QUnit.prepareScreen('error', nextFn, jqxhr, status, error);
                }
            };

            return O2G.AjaxUtil.run({
                data: {
                    cmd: 'load',
                    resource: O2G.GUI.screenid,
                }
            }, _processScreenFn);
        }
    };

    /**
     * @param {string} html
     * @param {string} id
     * @param {string} init
     * @returns {string} html
     * @desc Für die Maske (id) wird das gesamte HTML Gerüst mit den Kopf-, Fuss- und Anwendungszeilen (html),
     * abhängig vom Layout (FKEY Buttons), erzeugt. Beim ersten Aufbau des HTML Gerüst werden die Kopf und
     * Fusszeilen für die Speicherung (returns html) im Speicher bzw. LOCALSTORAGE wieder entfernt. Damit koennen
     * die Masken im Cache auch bei Änderung des Styles durch den Benutzer weiter verwendet werden.
     *
     */
    var _createDocumentScreen = function (html, id, init) {
        var linenr, $line, group, field, i;

        O2G.GUI.screenlist[id].html.children().append($.parseHTML(O2G.GUIStatic.header + html + O2G.GUIStatic.footer));

        if (init) {
            linenr = 1;
            O2G.GUI.screenlist[id].ob.forEach(function (field) {
                $line = $('#' + field[0], O2G.GUI.screenlist[id].html).parent();
                if (!$line.hasClass('lineob')) {
                    $line.removeClass().addClass('lineob').attr('linenr', linenr);
                    linenr += 1;
                    $line.attr('ob', field[0]);
                    $line.attr('obgroup', field[1]);
                } else {
                    $line.attr('ob', $line.attr('ob') + ',' + field[0]);
                    $line.attr('obgroup', $line.attr('obgroup') + ',' + field[1]);
                }
            });

            $('div[class="lineob"]', O2G.GUI.screenlist[id].html).each(
                function () {
                    group = $(this).attr('obgroup').split(',');
                    if (group[0] !== group[group.length - 1]) {
                        $(this).removeClass('lineob').addClass('linefieldob');
                    }
                }
            );

            $('div[class="linefieldob"]', O2G.GUI.screenlist[id].html).each(
                function () {
                    group = $(this).attr('obgroup').split(',');
                    field = $(this).attr('ob').split(',');
                    i = group.length;
                    while (i) {
                        i -= 1;
                        $('#' + field[i], this).attr('fieldob', group[i]).addClass('fieldob');
                    }
                }
            );

            var inithtml = $(O2G.GUI.screenlist[id].html).children().clone();
            $('hr[class="buttonline"]:eq(0)', inithtml).remove();
            $('div[class="line"]:eq(0)', inithtml).remove();
            $('div[class="line"]:eq(0)', inithtml).remove();
            $('div[class="line"]:eq(0)', inithtml).remove();
            $('div[class="line"]:eq(-1)', inithtml).remove();
            $('div[class="line"]:eq(-1)', inithtml).remove();
            return $(inithtml).html();
        }

    };

    /**
     * @param {function} nextFn
     * @desc Für die TFolgen Steuerung wird das ODCS TFolge Lademodul benötigt.
     * Es wird geprüft ob diese Resourcen im Speicher oder LOCALSTORAGE vorhanden sind, wenn nicht,
     * wird im O2G Server Cache geschaut, ansonsten werden die Lademodule vom HOST geladen.
     * Wenn die Lademodule aus dem O2G Cache oder dem HOST kommen werden die Resourcen neu erzeugt
     * HTML Gerüst etc.
     * Abschliessend wird die nächste Funktion (nextFn) aufgerufen.
     *
     */
    var loadTFolgeDbg = function (nextFn) {
        O2G.Util.traceDbg('loadTFolge', 'O2G.Resource');
        var ret = loadTFolge(nextFn);
        if (ret){
            console.debug('... async started: ' + ret);
        }
        O2G.Util.traceDbg('<<< loadTFolge', 'O2G.Resource');

    };

    var loadTFolge = function (nextFn) {
        if (O2G.QUnit && O2G.QUnit.isActive) {
            if (!O2G.QUnit.loadTFolge('begin')){
                return;
            }
        }

        var tfolge = O2G.TCntrl.getID1() + O2G.TCntrl.getID2(),
            store;

        if (O2G.Config.DEBUG){
            console.debug('run O2GLoadTFolge ' + tfolge);
        }
        if (O2G.QUnit && O2G.QUnit.isActive){
            O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + tfolge);
        }
        if (!O2G.Resource.tfolge[tfolge]) {
            if (O2G.Config.SYSID2 === O2G.Config.MASTERMENUE) {
                store = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + O2G.Config.MASTER + O2G.Config.MASTERMENUE);
            } else {
                store = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + tfolge);
            }
            if (store) {
                O2G.Resource.tfolge[tfolge] = store;
            }
        }
        if (O2G.Resource.tfolge[tfolge]) {
            nextFn();
        } else {
            if (O2G.QUnit && O2G.QUnit.isActive){
                O2G.QUnit.loadTFolge('before', tfolge);
            }
            O2G.Resource.resourceloaded = '';
            O2G.Util.setMsgAI(O2G.BasicAuthRacf.user + ' lädt L' + tfolge + ' von ' + O2G.BasicAuthRacf.system);

            var processTFolgeFn = function (resource, status, jqXHR) {
                store = {
                    hex: resource.data
                };
                store = CreateTFolge(store, tfolge);
                O2G.LocalStorage.set(O2G.Config.SYSENV + '_' + resource.id.substr(1, 6), store);
                O2G.Resource.tfolge[resource.id.substr(1, 6)] = store;
                O2G.Resource.resourceloaded = tfolge;
                if (store.etfolge) {
                    loadExternTFolge(store.etfolge, store, nextFn);
                } else {
                    nextFn();
                }
            };

            /* todo qunit
             var loadTFolgeErrorFn = function(jqxhr, status, error) {
             if (O2G.Config.DEBUG) console.debug('Can\'t load TFOLGE ' + tfolge);
             if (O2G.QUnit && O2G.QUnit.isActive)
             O2G.QUnit.loadTFolge('error', nextFn, jqxhr, status, error);
             }; */
            return O2G.AjaxUtil.run({
                data: {
                    cmd: 'load',
                    resource: 'L' + tfolge
                }
            }, processTFolgeFn);
        }
    };

    var processTFolgeFn = function (resource, status, jqXHR) {
        store = {
            hex: resource.data
        };
        store = CreateTFolge(store, tfolge);
        O2G.LocalStorage.set(O2G.Config.SYSENV + '_' + resource.id.substr(1, 6), store);
        O2G.Resource.tfolge[resource.id.substr(1, 6)] = store;
        O2G.Resource.resourceloaded = tfolge;
        if (store.etfolge) {
            loadExternTFolge(store.etfolge, store, nextFn);
        } else {
            nextFn();
        }
    };

    var loadExternTFolge = function (tfolge, store, nextFn) {
        if (O2G.QUnit && O2G.QUnit.isActive) {
            if (!O2G.QUnit.loadExternTFolge('begin')){
                return;
            }
        }
        if (O2G.Config.DEBUG){
            console.debug('run O2GLoadExternTFolge ' + tfolge);
        }
        if (O2G.QUnit && O2G.QUnit.isActive){
            O2G.QUnit.loadExternTFolge('before', tfolge);
        }

        O2G.Util.setMsgAI(O2G.BasicAuthRacf.user + ' lädt EXIT L' + tfolge + ' von ' + O2G.BasicAuthRacf.system);

        /* async */

        var processExternTFolgeFn = function (resource, status, jqXHR) {
            store.hex = resource.data;
            store.exitnr = store.tf.length;
            store = CreateTFolge(store, tfolge);
            O2G.LocalStorage.set(O2G.Config.SYSENV + '_' + store.ts.substr(1, 6).toUpperCase(), store);
            O2G.Resource.tfolge[store.ts.substr(1, 6).toUpperCase()] = store;
            nextFn();
        };

        /*      var loadExternTFolgeErrorFn = function(jqxhr, status, error) {
         if (O2G.Config.DEBUG) console.debug('Can\'t load EXIT TFOLGE ' + tfolge);
         if (O2G.QUnit && O2G.QUnit.isActive)
         O2G.QUnit.loadExternTFolge('error', nextFn, jqxhr, status, error);
         }; */

        O2G.AjaxUtil.run({
            data: {
                cmd: 'load',
                resource: 'F' + tfolge
            }
        }, processExternTFolgeFn);

    };

    /**
     * @param {object} store
     * @param {string} tfolgesrc
     * @desc Für die TFolgen Steuerung wird ein JS Object erzeugt.
     *
     */
    var CreateTFolge = function (store, tfolgesrc) {
        if (store.tf) {
            if (O2G.Util.convert2ASCII(store.hex.substr(12, 12), false).toUpperCase() !== tfolgesrc) {
                alert('EXIT TFolge ' + tfolgesrc + ' not proper loaded ' + store.ts);
            }
        } else {
            store.ts = O2G.Util.convert2ASCII(store.hex.substr(10, 44), false);
            if (store.ts.substr(1, 6).toUpperCase() !== tfolgesrc) {
                alert('TFolge ' + tfolgesrc + ' not proper loaded ' + store.ts);
            }
        }

        var hex = store.hex,
            tfolge = [],
            exittfolgenr = 0,
            tfolgenr = 0,
            otfolgenr = -1,
            tfstep = 0,
            entry = {},
            exit,
            i, j, k,
            etfolge = ' ',
            start = (parseInt(hex.substr(56, 4), 16) * 2) + 56,
            ende = parseInt(hex.substr(60, 4), 16) * 2;

        if (store.tf) {
            tfolge = store.tf;
            exittfolgenr = tfolgenr = store.tf.length;

        }
        if (!exittfolgenr) {
            etfolge = O2G.Util.convert2ASCII(hex.substr(158, 12), false);
            if (etfolge[0] !== ' ') {
                store.etfolge = etfolge;
            }
        }

        if (O2G.Config.DEBUG){
            console.groupCollapsed("generate TFolge ", tfolgesrc);
        }

        while (ende) {
            ende -= parseInt(hex.substr(start, 4), 16) * 2;
            tfolgenr = parseInt(hex.substr(start + 4, 4), 16) - 1;
            if (exittfolgenr) {
                tfolgenr += exittfolgenr;
            }
            if (!tfolge[tfolgenr]) {
                tfolge[tfolgenr] = [];
            }
            if (tfolgenr !== otfolgenr) {
                otfolgenr = tfolgenr;
                tfstep = -1;
            }
            entry = tfolge[tfolgenr][tfstep += 1] = {};
            if (!tfstep) {
                entry.tf = start / 2 - 86;
            }
            entry.undo = O2G.Util.convert2ASCII(hex.substr(start + 8, 2), false);
            if (entry.undo === 'N') {
                delete entry.undo;
            }
            if (hex.substr(start + 10, 2) === '20' || hex.substr(start + 10, 2) === '60') {
                entry.swap = true;
            }
            if (hex.substr(start + 10, 2) === '40' || hex.substr(start + 10, 2) === '60') {
                entry.lc = true;
            }
            entry.txid = O2G.Util.convert2ASCII(hex.substr(start + 12, 8), false);

            if (!entry.txid) {
                delete entry.txid;
            }

            entry.typ = O2G.Util.convert2ASCII(hex.substr(start + 20, 2), false);

            start += 22;
            if (entry.typ === 'F' || entry.typ === 'G') {
                entry.tfnr = parseInt(hex.substr(start, 4), 16);
            } else {
                entry.pgm = O2G.Util.convert2ASCII(hex.substr(start, 16), false);
            }
            if (entry.pgm) {
                start += 16;
            } else {
                start += 4;
            }

            if (entry.pgm && entry.typ !== 'V') {
                i = parseInt(hex.substr(start, 2), 16) * 2;
                if (i){
                    entry.pages = true;
                }
                i = parseInt(hex.substr(start + 2, 2), 16) * 2;
                if (i) {
                    entry.screen = O2G.Util.convert2ASCII(hex.substr(start + 4, i), false);
                }
                start += 4 + i;
                if (O2G.QUnit && O2G.QUnit.isActive){
                    if (O2G.QUnit.loadTFolge('screens') && entry.screen && O2G.QUnit.listMaskenForTest.indexOf(entry.screen) === -1){
                        O2G.QUnit.listMaskenForTest.push(entry.screen);
                    }
                }
            }

            i = parseInt(hex.substr(start, 2), 16) * 2;
            if (i) {
                entry.cond = O2G.Util.convert2ASCII(hex.substr(start + 2, i), false);
            }
            start += 2 + i;

            i = parseInt(hex.substr(start, 2), 16) * 2;
            if (i) {
                entry.parm = O2G.Util.convert2ASCII(hex.substr(start + 2, i), false);
            }
            start += 2 + i;

            j = parseInt(hex.substr(start, 2), 16);
            start += 2;
            if (j) {
                exit = entry.exit = [];
                k = 0;
                while (j) {
                    j -= 1;
                    i = parseInt(hex.substr(start, 2), 16) * 2;
                    if (i) {
                        exit[k] = O2G.Util.convert2ASCII(hex.substr(start + 2, i), false);
                    }
                    start += 2 + i;
                    k += 1;
                }
            }
            if (O2G.Config.DEBUG){
                console.debug(JSON.stringify(entry));
            }
        }

        $.each(tfolge, function (key, tf) {
            $.each(tf, function (key, tfstep) {
                if (tfstep.tfnr) {
                    i = tfolge.length;
                    while (i) {
                        i -= 1;
                        if (tfolge[i][0].tf === tfstep.tfnr) {
                            tfstep.tfnr = i;
                            i = 0;
                        }
                    }
                }
            });
        });

        $.each(tfolge, function (key, tf) {
            delete tf[0].tf;
        });

        if (!exittfolgenr) {
            store.tf = tfolge;
        } else {
            delete store.etfolge;
        }

        delete store.hex;
        if (O2G.Config.DEBUG){
            console.debug(JSON.stringify(store));
            console.groupEnd();
        }
        return store;
    };

    /**
     * @param {string} ts
     * @param {string} hex
     * @desc Für die MENUE Anzeige und die Berechtigungsprüfung VORGANG wird ein JS Object erzeugt.
     *
     */
    var _createandsaveMenue = function (hex) {
        O2G.Resource.menue = {
            "titel": {},
            "vorgang": {}
        };
        var startindex = 72,
            i = parseInt(hex.substr(56, 8), 16);
        var startvrg = startindex + (2 * i) - 16;
        i += parseInt(hex.substr(64, 8), 16);
        var startmenutxt = startindex + (2 * i) - 16;

        if (O2G.Config.DEBUG){
            console.groupCollapsed("generate menue ");
        }

        i = parseInt(hex.substr(startindex, 4), 16);
        var j = startindex + 4,
            k;
        startindex += (i * 6) + 4;
        while (i) {
            i -= 1;
            k = (parseInt(hex.substr(j + 2, 4), 16) * 2) + startmenutxt;
            O2G.Resource.menue.titel[hex.substr(j, 2)] = O2G.Util.convert2ASCII(hex.substr(k + 2, parseInt(hex.substr(k, 2), 16) * 2), false);
            if (O2G.Config.DEBUG){
                console.debug(O2G.Resource.menue.titel[hex.substr(j, 2)]);
            }
            j += 6;
        }

        var l = parseInt(hex.substr(startindex, 4), 16),
            fgb;
        j = startindex + 4;
        while (l) {
            l -= 1;
            fgb = O2G.Util.convert2ASCII(hex.substr(j, 6), false);
            i = parseInt(hex.substr(j + 6, 4), 16);
            j += 10;
            startindex += (i * 6) + 10;
            while (i) {
                i -= 1;
                k = (parseInt(hex.substr(j + 2, 4), 16) * 2) + startmenutxt;
                O2G.Resource.menue.titel[fgb + hex.substr(j, 2)] = O2G.Util.convert2ASCII(hex.substr(k + 2, parseInt(hex.substr(k, 2), 16) * 2),
                    false);
                if (O2G.Config.DEBUG){
                    console.debug(fgb + ' ' + hex.substr(j, 2) + ' ' + O2G.Resource.menue.titel[fgb + hex.substr(j, 2)]);
                }
                j += 6;
            }
        }
        var vrg;
        i = (startmenutxt - startvrg) / 16;
        j = startvrg;
        while (i) {
            i -= 1;
            vrg = O2G.Util.convert2ASCII(hex.substr(j, 12), false);
            k = (parseInt(hex.substr(j + 12, 4), 16) * 2) + startmenutxt;
            j += 16;
            O2G.Resource.menue.vorgang[vrg] = O2G.Util.convert2ASCII(hex.substr(k + 22, parseInt(hex.substr(k + 20, 2), 16) * 2), false);
            if (O2G.QUnit && O2G.QUnit.isActive){
                O2G.QUnit.createandsaveMenue(vrg);
            }
            if (O2G.Config.DEBUG){
                console.debug(vrg + ' ' + O2G.Resource.menue.vorgang[vrg]);
            }
        }

        if (O2G.Config.DEBUG){
            console.debug(JSON.stringify(O2G.Resource.menue));
            console.groupEnd();
        }
    };

    /**
     * @param {string} hex
     * @desc Für die Feldplausibilisierung wird ein JS Object erzeugt.
     *
     */
    var _createandsaveRules = function (hex) {
        var startindex = 64,
            i = parseInt(hex.substr(56, 8), 16),
            startrules = startindex + (2 * i) - 8,
            id, typ, sizesubrules, lenrules, profil, hex00, decimalsign, delimitersign,
            before, after, minus, plus, sizeempty, empty, iempty, asis,
            sizerange, range1, range2, op, op1, op2, irange, strRange, strEmpty, rule,
            sizeindate, rangedate, irangedate, iindate, strindate, outdate, indate,
            len, sizelist, ilist, strList, list, daterule,
            offset = 0;
        if (!$.validationEngineLanguage){
            $.validationEngineLanguage = {};
        }  

        if (!$.validationEngineLanguage.allRules){
            $.validationEngineLanguage['allRules'] = {};
        }

        if (O2G.Config.DEBUG){
            console.groupCollapsed("generate rules ");
        }

        i = (i - 4) / 12;

        while (i) {
            i -= 1;
            id = O2G.Util.convert2ASCII(hex.substr(startindex, 16), false);
            offset = startrules + (2 * parseInt(hex.substr(startindex + 16, 8), 16));
            startindex += 24;
            typ = O2G.Util.convert2ASCII(hex.substr(offset, 2), false);
            sizesubrules = parseInt(hex.substr(offset + 2, 4), 16);
            lenrules = parseInt(hex.substr(offset + 6, 4), 16) - 2;
            rule = hex.substr(offset + 10, lenrules * 2);
            if (typ === 'B') {
                profil = O2G.Util.convert2ASCII(rule.substr(0, 4), false);
                hex00 = rule.substr(4, 2);
                if (hex00 !== '00') {
                    delimitersign = O2G.Util.convert2ASCII(hex00, false);
                } else {
                    delimitersign = '';
                }
                hex00 = rule.substr(6, 2);
                if (hex00 !== '00') {
                    decimalsign = O2G.Util.convert2ASCII(hex00, false);
                } else {
                    decimalsign = '';
                }
                after = parseInt(rule.substr(8, 4), 16);
                before = parseInt(rule.substr(12, 4), 16);
                minus = rule.substr(16, 12);
                if (minus === '0000000000000') {
                    minus = '';
                } else {
                    minus = O2G.Util.convert2ASCII(minus.replace(/00/g, ''), false);
                }
                plus = rule.substr(28, 12);
                if (plus === '0000000000000') {
                    plus = '';
                } else {
                    plus = O2G.Util.convert2ASCII(plus.replace(/00/g, ''), false);
                }
                sizeempty = parseInt(rule.substr(40, 4), 16);
                empty = [];
                iempty = 0;
                strEmpty = '';
                while (sizeempty) {
                    sizeempty -= 1;
                    empty[iempty] = rule.substr(44 + (iempty * 2), 2);
                    strEmpty += empty[iempty] + ' ';
                    iempty += 1;
                }
                sizeempty = parseInt(rule.substr(40, 4), 16);
                offset = 44 + (sizeempty * 2);

                sizerange = parseInt(rule.substr(offset, 4), 16);
                range1 = range2 = '';
                irange = 0;
                strRange = '';
                while (sizerange) {
                    sizerange -= 1;
                    strRange += ' [';
                    range1 = O2G.Util.convert2ASCII(rule.substr(offset + 4 + (irange * 36), 16), false);
                    range2 = O2G.Util.convert2ASCII(rule.substr(offset + 22 + (irange * 36), 16), false);
                    op1 = rule.substr(offset + 20 + (irange * 36), 2);
                    op2 = rule.substr(offset + 38 + (irange * 36), 2);
                    op = '';
                    if (rule.substr(offset + 4 + (irange * 36), 16) === rule.substr(offset + 22 + (irange * 36), 16)) {
                        op = '=';
                    }
                    if (!op && range1[0] !== '$' && range2[0] !== '$') {
                        op = ':';
                    }
                    if (!op && range1[0] !== '$' && op1 === '80') {
                        op = '!=';
                    }
                    if (!op && range1[0] !== '$' && op1 === 'D0') {
                        op = '>';
                    }
                    if (!op && range1[0] !== '$' && op1 === '40') {
                        op = '>=';
                    }
                    if (!op && range2[0] !== '$' && op2 === 'B0') {
                        op = '<';
                    }
                    if (!op && range2[0] !== '$' && op2 === '20') {
                        op = '<=';
                    }
                    if (range1[0] === '$') {
                        range1 = '';
                    } else {
                        parseInt(rule.substr(offset + 4 + (irange * 36), 15), 10);
                    }
                    if (range1 && rule.substr(offset + 19 + (irange * 36), 1) !== 'C') {
                        range1 = range1 * -1;
                    }
                    if (range1 && after > 0) {
                        range1 = range1 / Math.pow(10, after);
                    }
                    if (op === '=') {
                        range2 = ' ';
                    } else {
                        if (range2[0] === '$') {
                            range2 = '';
                        } else {
                            range2 = parseInt(rule.substr(offset + 22 + (irange * 36), 15), 10);
                        }
                        if (range2 && rule.substr(offset + 37 + (irange * 36), 1) !== 'C') {
                            range2 = range2 * -1;
                        }
                        if (range2 && after > 0) {
                            range2 = range2 / Math.pow(10, after);
                        }
                    }
                    strRange += op + ' ';
                    if (range1[0] === '$') {
                        strRange += ' ';
                    } else {
                        strRange += range1 + ' ';
                    }
                    if (range2[0] === '$') {
                        strRange += ' ';
                    } else {
                        strRange += range2 + ']';
                    }
                    irange += 1;
                }
                sizerange = parseInt(rule.substr(offset, 4), 16);
                offset += 4 + (sizerange * 36);
                asis = O2G.Util.convert2ASCII(rule.substr(offset + 4, 2), false);

                if (O2G.Config.DEBUG){
                    console.debug(typ + ':' + id + ' sub:' + sizesubrules + ' len:' + lenrules + ' prof: ' + profil + ' del:  ' + delimitersign + ' dec: ' + decimalsign + ' vork: ' + before + ' nachk: ' + after + ' minus: ' + minus + ' plus: ' + plus + ' ' + sizeempty + ':' + strEmpty + ' ' + sizerange + ':' + strRange + ' asis:' + asis);
                }    
            } else if (typ === 'D') {
                profil = O2G.Util.convert2ASCII(rule.substr(0, 4), false);
                sizeindate = parseInt(rule.substr(4, 4), 16);
                indate = [];
                iindate = 0;
                strindate = '[';
                while (sizeindate) {
                    sizeindate -= 1;
                    strindate += '"';
                    indate[iindate] = O2G.Util.convert2ASCII(rule.substr(8 + (iindate * 32), 30), false).replace(/ /g, "");
                    strindate += indate[iindate] + '"';
                    if (sizeindate){
                        strindate += ", ";
                    } else {
                        strindate += "]";
                    }
                    iindate += 1;
                }
                sizeindate = parseInt(rule.substr(4, 4), 16);
                offset = 8 + (sizeindate * 32);

                sizerange = parseInt(rule.substr(offset, 4), 16);
                rangedate = '';
                irangedate = 0;
                strRange = '';
                while (sizerange) {
                    sizerange -= 1;
                    strRange += ' ["';
                    rangedate = O2G.Util.convert2ASCII(rule.substr(offset + 4 + (irangedate * 36), 36), false);
                    strRange += rangedate + '"]';
                    irangedate += 1;
                }
                sizerange = parseInt(rule.substr(offset, 4), 16);
                offset += 4 + (sizerange * 36);
                outdate = O2G.Util.convert2ASCII(rule.substr(offset, 30), false).replace(/ /g, "");

                daterule = '{"dateFormat":' + strindate + ', ';
                if (sizerange){
                    daterule += '"dateRange":' + strRange + ',';       
                }
                daterule += '"dateFormatOutput":"' + outdate + '", ';       
                daterule += '"alertText":"' + O2G.Config.TEXTE.DATEALERTTEXT1 + '"';       
                if (sizerange){
                    daterule += ', "alertTextRange":"' + O2G.Config.TEXTE.DATEALERTTEXT2 + strRange.replace(/\"/g, "'") + '"';
                }
                daterule += ' }';

                if (O2G.Config.DEBUG){
                    console.debug(typ + ":" + id + " sub:" + sizesubrules + " len:" + lenrules + " prof: " + profil + " in " + sizeindate + ":" + strindate + " range " + sizerange + ":" + strRange + " out:" + outdate);
                }

                $.validationEngineLanguage.allRules[id] = JSON.parse(daterule);
                $.validationEngineLanguage.allRules[id].typ = 'date';

            } else if (typ === 'L') {
                profil = O2G.Util.convert2ASCII(rule.substr(0, 4), false);
                sizelist = parseInt(rule.substr(4, 4), 16);
                list = [];
                ilist = offset = 0;
                if (sizelist) {
                    strList = '[';
                } else {
                    strList = '';
                }
                while (sizelist) {
                    sizelist -= 1;
                    strList += '"';
                    len = 2 * parseInt(rule.substr(8 + offset, 2), 16);
                    list[ilist] = O2G.Util.convert2ASCII(rule.substr(10 + offset, len), false);
                    strList += list[ilist];
                    ilist += 1;
                    if (sizelist) {
                        strList += '", ';
                    } else {
                        strList += '"';
                    }
                    offset += len + 2;
                }
                sizelist = parseInt(rule.substr(4, 4), 16);
                if (sizelist) {
                    strList += ']';
                }

                O2G.Resource.rules[id] = list;

                if (O2G.Config.DEBUG){
                    console.debug(typ + ':' + id + ' sub:' + sizesubrules + ' len:' + lenrules + ' prof: ' + profil + ' list ' + sizelist + ':' + strList);
                }
            } else if (typ === 'S') {
                profil = O2G.Util.convert2ASCII(rule.substr(0, 4), false);
                sizelist = parseInt(rule.substr(4, 4), 16);
                list = [];
                ilist = offset = 0;
                if (sizelist) {
                    strList = '[';
                } else {
                    strList = '';
                }
                while (sizelist) {
                    sizelist -= 1;
                    strList += '"';
                    len = 2 * parseInt(rule.substr(8 + offset, 2), 16);
                    list[ilist] = O2G.Util.convert2ASCII(rule.substr(10 + offset, len), false);
                    strList += list[ilist];
                    ilist += 1;
                    if (sizelist) {
                        strList += '", ';
                    } else {
                        strList += '"';
                    }
                    offset += len + 2;
                }
                sizelist = parseInt(rule.substr(4, 4), 16);
                if (sizelist) {
                    strList += ']';
                }

                O2G.Resource.rules[id] = list;

                if (O2G.Config.DEBUG){
                    console.debug(typ + ':' + id + ' sub:' + sizesubrules + ' len:' + lenrules + ' prof: ' + profil + ' slist ' + sizelist + ':' + strList);
                }
            } else {
                if (O2G.Config.DEBUG){
                    console.debug(typ + ':' + id + ' sub:' + sizesubrules + ' len:' + lenrules);
                }
            }
        }
        if (O2G.Config.DEBUG){
            console.groupEnd();
        }

        O2G.Resource.rules = {};
    };

    /**
     * @param {string} hex
     * @desc Für die TEXT Anzeige (Fehler und Hinweise) wird ein JS Object erzeugt.
     *
     */
    var _createandsaveText = function (hex) {
        var startindex = 64,
            i = parseInt(hex.substr(56, 8), 16),
            starttext = startindex + (2 * i) - 8,
            id, typ, text, placeholder,
            offset = 0;

        if (O2G.Config.DEBUG){
            console.groupCollapsed("generate text ");
        }
        O2G.Resource.text = {};
        i = (i - 4) / 6;

        while (i) {
            i -= 1;
            id = "000" + parseInt(hex.substr(startindex, 4), 16).toString();
            id = id.substr(id.length - 4);
            offset = starttext + (2 * parseInt(hex.substr(startindex + 4, 8), 16));
            typ = O2G.Util.convert2ASCII(hex.substr(offset + 2, 2), false);
            text = O2G.Util.convert2ASCII(hex.substr(offset + 4, 2 * parseInt(hex.substr(offset, 2), 16)), false);
            if (text.indexOf('#') >= 0 && !isNaN(text.substr(text.indexOf('#') + 1, 1))) {
                placeholder = true;
            } else {
                placeholder = false;
            }
            O2G.Resource.text["F" + id] = {
                "typ": typ,
                "ftxt": text,
                "var": placeholder
            };
            startindex += 12;
        }

        if (O2G.Config.DEBUG){
            console.debug(O2G.Resource.text.F0001);
            console.debug(JSON.stringify(O2G.Resource.text));
            console.groupEnd();
        }
    };
    _export = {

        VERSION: '$Revision: 36 $',

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        loadheader: {},
        tfolge: {},
        menue: {},
        rules: {},
        text: {},
        resourceloaded: '',
        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        init: init,
        loadTFolge: loadTFolge,
        prepareScreen: prepareScreen
    };

    if (O2G.Config.DEBUG){
        _export.loadTFolge = loadTFolgeDbg;
        _export.prepareScreen = prepareScreenDbg;
    }

    return _export;

})();