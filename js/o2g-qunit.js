/**
 * @desc Das Modul O2G.QUnit stellt die QUNIT Funktionen bereit, die aus den O2G Paketen
 * ausgelagert wurden. Die O2G Module prüfen zuerst ob O2G.QUnit (diese Datei) vorhanden ist und
 * ob via HASH #/qunit ein Test angefordert ist, bevor eine ausgelagerte QUnit Funktion aufgerufen
 * wird.
 *
 * Es werden für UNIT Testläufe und END2END Testläufe ein Paket von Routinen bereitgestellt:
 * 1. Anmeldung
 * 2. Laden und generieren der ODCS MENUE, REGEL und TEXT Resourcen
 * 3. Laden und generiern aller vorhandenen ODCS TFOLGEN und STRUKTUREN
 * 4. Laden und generieren aller CICS BMS Resourcen
 * 5. Aufzeichnen und sichern vollständiger fachlichen ODCS Abläufe
 * 6. Abspielen von aufgezeichneten fachlichen ODCS Abläufen
 * 7. Filtern von Resourcen bis auf Feldebene um Testabläufe unanfällig für Alterung zu gestalten
 * 8. Vergleich der END2END Aufzeichnungen Maskenebene bis auf Feldebene und deren 3270 Attribute
 * 9. Automatische Dokumentation der END2END Testabläufe mit Screenshots
 * 10. Automatische Lasttests
 * 11. Performancestatistiken mit Dimension Jahr, Monat, Tag, Stunde
 *                            mit Dimension Fachgebiet, Vorgang
 *                            mit Dimension Unternehmen, Abteilung
 *                            mit Dimension Standort
 * 12. Umfangreiche UNIT Testabläufe für ODCS COBOL MDB Routinen (in Arbeit/Test)
 *
 * Mit diesen Routinen wird eine 98%ige Testabdeckung erreicht. Nur der Keyboardbuffer wurde bisher
 * nicht mit diesem Verfahren getestet.
 *
 * @todo Anwendung der Routinen beschreiben
 */
O2G.QUnit = (function () {
    'use strict';

    var _qunit,
        _quFn,
        _MDBCmds,
        _testscenario = {id: []},
        _testscenarioid,
        _inRecording,
        _recordingstep,
        _testowner,
        _testcase,
        _testuid,
        _testpw,
        _report,
        _QUNITJSPATH,
        _qunitfile,
        _promptTestLink = true,
        _RequirementIdTestLink = 'quit',
        _QUNITPATH = 'qunit',
        _QUNITJSFILE = 'js/extern/qunit-1.12.0.js',
        _QUNITSTOREPATH = O2G.Config.PATH + 'qunit/store';


    /**
     * @desc Mit dem HASH #/qunit/userid/testscenario kann ein beliebiger UNIT Test oder END2END
     * Testablauf angestossen werden. Der Sourcecode von O2G muss nicht wie bei vielen UNIT Test
     * Verfahren angepasst werden. Die Testscenarien koennen einfach durch die HASH Angaben dynamisch
     * geladen werden.
     *
     */
    var _runQUnit = function () {
        $.ajaxSetup({cache: false});
        O2G.Util.aiMsg = 'get ' + _qunitfile;
        $.ai.setMsg(O2G.Util.aiMsg);
        $.getScript(_qunitfile, function () {
            O2G.Util.aiMsg = 'QUnit run ' + _qunitfile;
            $.ai.setMsg(O2G.Util.aiMsg);
            setTimeout(function () {
                QUnit.start();
            }, 1000);
        }).error(function (jqxhr, exception, error) {
            console.debug("Handling an error for QUnit");
            if (jqxhr.status !== 200) {
                console.debug("There was a problem loading this script");
                console.debug(jqxhr.responseText);
            }
            if (exception) {
                console.debug("The error was of type: " + exception);
            }
            if (error.message) {
                console.debug(error.message);
            }
            alert("Crashed with this QUnit, logged into console");
        });
    };

    /**
     * @desc Initialisierung der QUnit Umgebung
     *
     */

    var init = function () {
        if (O2G.HashUtil.qunit) {
            _testowner = this.testowner = O2G.HashUtil.qunit.testowner;
            this.testowner += '/';
            _testcase = this.testcase = O2G.HashUtil.qunit.testcase;
            _testuid = O2G.HashUtil.qunit.testuid;
            _testpw = O2G.HashUtil.qunit.testpw;
            _report = O2G.HashUtil.qunit.report;
            _qunit = this.isActive = true;
            _QUNITJSPATH = O2G.Config.PATH + _QUNITJSFILE;
            _qunitfile = O2G.Config.PATH + _QUNITPATH + '/' + _testowner + '/' + _testcase + '.js';
            var AJAXErrorFn = function () {
                console.debug(O2G.Util.aiMsg + ' ajax crashed ... ');
                QUnit.ok(false, O2G.Util.aiMsg + ' ajax crashed ...');
                QUnit.start();
            };
            O2G.Config.AJAXCONFIG.error = AJAXErrorFn;
            if (_testuid) {
                O2G.Config.AJAXCONFIG.username = _testuid;
            }
            if (_testpw) {
                O2G.Config.AJAXCONFIG.password = _testpw;
            }

            $.ajaxSetup({cache: false});

            O2G.GUIStatic.initQUnit();

        } else _qunit = false;
    };
    /**
     * @desc Setze QUnitName
     *
     */
    var setQUnitName = function (qunit) {
        O2G.QUnit.QUnitName = _qunit = qunit;
    };
    /**
     * @desc Setze QUnitName
     *
     */
    var setMDBCmds = function (mdbcmds) {
        O2G.QUnit.MDBCmds = _MDBCmds = mdbcmds;
    };
    /**
     * @desc Setze QUnitFunktion. Wird oft gebraucht um nach fachlichen Funktionen wieder den Testablauf
     * fortzusetzen, insbesondere wenn der fachliche Ablauf mit asyncronen Aufrufen arbeitet (AJAX).
     *
     */
    var setQUFn = function (fn) {
        O2G.QUnit.QUnitFn = _quFn = fn;
    };
    /**
     * @desc Hole QUnitFunktion.
     *
     */
    var getQUFn = function (fn) {
        return _quFn;
    };
    /**
     * @desc Holt (AJAX) und startet Testablauf. Aktivert das QUnit Reporting und schaltet
     * O2G GUI Funktionen ab. Stellt HTML Strukturen für Screenshots bereit.
     *
     */
    var run = function () {
        $.ajaxSetup({cache: true});
        $(O2G.GUIStatic.$Body).css({'overflow': 'scroll'});
        $('#widget_sidebar', O2G.GUIStatic.$Body).remove();
        $('#qunit', O2G.GUIStatic.$Body).html('');
        $('#qunit-fixture', O2G.GUIStatic.$Body).html('');
        $('#qunitscreens', O2G.GUIStatic.$Body).html('');
        O2G.Util.aiMsg = 'get ' + _QUNITJSPATH;
        $.ai.setMsg(O2G.Util.aiMsg);
        $.getScript(_QUNITJSPATH, function () {
            $('#qunit-fixture', O2G.GUIStatic.$Body).html('');
            QUnit.config.autostart = false;
            if (_report === 'true') {
                QUnit.testDone(function (details) {
                    $('#qunitscreens', O2G.GUIStatic.$Body).append($.parseHTML('<br /><br /><fieldset class="TEXTRIGHT"><legend align="right">' + details.module + ' ' + details.name + '</legend></fieldset>'));
                    $('#qunitscreens', O2G.GUIStatic.$Body).append(O2G.GUI.getObjScreen().clone());
                });
                QUnit.done(function (details) {
                    $('#qunitscreens div[class="validationEngineContainer"]', O2G.GUIStatic.$Body).each(
                        function () {
                            $(this).attr('class', '').attr('style', '');
                        }
                    );
                    $('#qunit ol[class="qunit-assert-list qunit-collapsed"]', O2G.GUIStatic.$Body).each(
                        function () {
                            $(this).attr('style', 'display: block;');
                        }
                    );
                });
                $(O2G.GUIStatic.$Body).append("<div id='qunitscreens'></div>");
            } else {
                QUnit.testDone(function (details) {
                    console.debug("Finished QUnit: ", details.module, details.name, "Failed/total: ", details.failed, details.total, details.duration);
                });
            }
            _runQUnit();
        });
    };

    var runMDBTest = function (oldmdb, iterate) {
        O2G.Util.aiMsg = 'MDB Test';
        var data = {
            cmd: 'run',
            mdb: JSON.stringify(_MDBCmds),
            trmid: O2G.BasicAuthRacf.terminal,
            sessionid: O2G.GUI.sessionid,
            sessioncode: O2G.GUI.sessioncode
        };

        if (oldmdb) data.oldmdb = oldmdb;
        data.loop = iterate | '0001';

        $.ajax({
            url: O2G.Config.RUNMDBTEST,
            data: data,
            dataType: 'text'
        }).done(function (response) {
            try {
                O2G.QUnit.setMDBCmds(JSON.parse(response.replace(/\ä/g, "{")
                    .replace(/\ü/g, "}")
                    .replace(/\¬/g, "[")
                    .replace(/\|/g, "]")));
            } catch (e) {
                console.debug('JSON error: ' + response.replace(/\ä/g, "{")
                        .replace(/\ü/g, "}")
                        .replace(/\¬/g, "[")
                        .replace(/\|/g, "]"));
            }
            _quFn();
        });
    };

    /**
     * @desc Auslagerung von loadTFolge QUnit Funktionen
     *
     */
    var loadTFolge = function (step, nextfunc, jqxhr, status, error) {
        if (step === 'error') {
            if (_qunit === 'O2GXL_LoadAllResources') {
                if (jqxhr.status === 404 && jqxhr.responseText) {
                    try {
                        var resp = JSON.parse(jqxhr.responseText);
                        O2G.GUI.sessioncode = resp.sessioncode;
                        O2G.QUnit.listTFolgenForTestWithError += 1;
                        nextfunc();
                    } catch (e) {
                        if (O2G.Config.DEBUG) console.debug(jqxhr.responseText + ' ' + status);
                        _quFn();
                    }
                } else {
                    if (O2G.Config.DEBUG) console.debug(jqxhr.responseText + ' ' + status);
                    _quFn();
                }
            }
        } else if (step === 'begin') {
            if (_qunit === 'O2GXL_LoadAllResources') {
                if (O2G.QUnit.listTFolgenForTest.length) {
                    var vrg = O2G.QUnit.listTFolgenForTest.shift();
                    return true;
                } else {
                    O2G.QUnit.countMaskenForTest = O2G.QUnit.listMaskenForTest.length;
                    if (O2G.QUnit.listMaskenForTest.length) {
                        var _funcm = function () {
                            O2G.Resource.prepareScreen(function () {
                                _funcm()
                            })
                        };
                        _funcm();
                    }
                    return false;
                }
            }
            return true;
        } else if (step === 'before') {
            if (_qunit === 'O2GXL_LoadAllResources') { // nextfunc = tfolge
                O2G.Resource.loadheader['x-o2g-tsr'] = 'L' + nextfunc + ' 00/00/00 00.00';
            }
        } else if (step === 'screens') {
            if (_qunit === 'O2GXL_LoadAllResources') {
                return true;
            }
            return false;
        }
    };

    /**
     * @desc Auslagerung von createandsaveMenue QUnit Funktionen
     *
     */
    var createandsaveMenue = function (vrg) {
        if (_qunit === 'O2GXL_LoadAllResources' && !O2G.QUnit.listTFolgenForTest[vrg]) {
            if (!O2G.QUnit.quvrgfilter && O2G.QUnit.quvrgexclude.indexOf(vrg) === -1) {
                O2G.QUnit.listTFolgenForTest.push(vrg);
            } else if (O2G.QUnit.quvrgfilter) {
                O2G.QUnit.quvrgfilter.forEach(function (quvrgfilter) {
                    if (vrg.substr(0, quvrgfilter.length) === quvrgfilter && O2G.QUnit.quvrgexclude.indexOf(vrg) === -1) {
                        O2G.QUnit.listTFolgenForTest.push(vrg);
                    }
                });
            }
        }
    };

    /**
     * @desc Auslagerung von prepareScreen QUnit Funktionen
     *
     */
    var prepareScreen = function (step, nextfunc, jqxhr, status, error) {
        if (step === 'before') {
            if (_qunit !== 'O2GXL_LoadAllResources') {
                O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + O2G.GUI.screenid);
            }
            if (_qunit === 'O2GXL_LoadAllResources') {
                if (O2G.QUnit.listMaskenForTest.length) {
                    O2G.GUI.screenlist = [];
                    O2G.GUI.screenid = O2G.QUnit.listMaskenForTest.shift();
                    if (O2G.QUnit.qumaskexclude.indexOf(O2G.GUI.screenid) !== -1) {
                        nextfunc();
                        return false;
                    }
                    O2G.Resource.loadheader = {};
                    O2G.Resource.loadheader['x-o2g-tsr'] = 'S' + O2G.GUI.screenid.substr(1) + ' 00/00/00 00.00';
                    return true;
                } else {
                    _quFn();
                    return false;
                }
            }
            return true;
        } else if (step === 'error') {
            if (_qunit === 'O2GXL_LoadAllResources') {
                if (jqxhr.status === 404 && jqxhr.responseText) {
                    try {
                        var resp = JSON.parse(jqxhr.responseText);
                        O2G.GUI.sessioncode = resp.sessioncode;
                        O2G.QUnit.listMaskenForTestWithError += 1;
                        nextfunc();
                    } catch (e) {
                        if (O2G.Config.DEBUG) console.debug(jqxhr.responseText + ' ' + status);
                        _quFn();
                    }
                } else {
                    if (O2G.Config.DEBUG) console.debug(jqxhr.responseText + ' ' + status);
                    _quFn();
                }
            }
        }
    };

    /**
     * @desc Auslagerung von Anmeldung QUnit Funktionen
     *
     */
    var login = function (step) {

        if (step === 'before' && _qunit === 'loginWithAllResources') {
            O2G.Resource.menue = O2G.Resource.rules = O2G.Resource.text = {};
            return false;
        }
        if (step === 'after' && (_qunit === 'onlyLogin' || _qunit === 'loginWithAllResources')) {
            console.debug(_qunit + O2G.GUI.screenid);
            _quFn();
            return true;
        }
        if (step === 'before' && _qunit === 'O2GXL_LoadAllResources') {
            O2G.Resource.menue = O2G.Resource.rules = O2G.Resource.text = {};
            O2G.QUnit.listTFolgenForTest = [];
            O2G.QUnit.listMaskenForTest = [];
            O2G.QUnit.listTFolgenForTestWithError = O2G.QUnit.listMaskenForTestWithError = 0;
            O2G.QUnit.countTFolgenForTest = O2G.QUnit.countMaskenForTest = 0;
            return false;
        }
        if (step === 'afterload' && _qunit === 'O2GXL_LoadAllResources') {
            O2G.LocalStorage.clearCache();
            O2G.QUnit.countTFolgenForTest = O2G.QUnit.listTFolgenForTest.length;
            if (O2G.QUnit.listTFolgenForTest.length) {
                var _functf = function () {
                    O2G.Resource.loadTFolge(function () {
                        _functf()
                    })
                };
                _functf();
            }
            return true;
        }
        return false;
    };

    /**
     * @desc JAVASCRPT ERROR QUnit Funktionen
     *
     */
    var upsJS = function (msg) {
        console.debug(O2G.Util.aiMsg + ' crashed with js error ... ' + msg);
        QUnit.ok(false, msg);
        QUnit.start();
    };

    /**
     * @desc Starten END2END Testablauf/Testscenario
     *
     */
    var runE2E = function (_E2E) {
        QUnit.asyncTest('Anmeldung mit gültigem Account', function () {
            setQUnitName('Menue');
            setQUFn(
                function () {
                    QUnit.ok(O2G.BasicAuthRacf.user && O2G.BasicAuthRacf.system[0] !== '.', 'Anmeldung mit USER ' + O2G.BasicAuthRacf.user + ' in ' + O2G.BasicAuthRacf.system + ' ist gültig');
                    QUnit.start();
                }
            );
            O2G.BasicAuthRacf.signon();
        });
        _E2E.forEach(function (step, i) {
            QUnit.asyncTest(
                step.step + ' ' + step.inp.mask + ' ' + step.inp.fkey + ' (' + _iterate + '/' + (i + 1) + ') ' + step.inp.requirementid,
                function () {
                    _quFn = function () {
                        QUnit.ok(O2G.GUI.screenid === step.outp.mask, 'Die erwartete Maske wird angezeigt ' + O2G.GUI.screenid);
                        if (!(_ignoreFields[O2G.GUI.screenid] && _ignoreFields[O2G.GUI.screenid].allfields)) {
                            $.each(step.outp.field, function (key, value) {
                                if (!(_ignoreFields[O2G.GUI.screenid] && _ignoreFields[O2G.GUI.screenid][key])) {
                                    QUnit.strictEqual(_E2EgetValue(key), value.val, 'Inhalt "' + value.val + '" von ' + key + ' ist wie erwartet');
                                    if (key.substr(0, 3) !== 'SYS' && value.attr && value.ext) {
                                        QUnit.ok($('#' + key, O2G.GUI.getObjScreen()).hasClass(value.attr[1]) && $('#' + key, O2G.GUI.getObjScreen()).hasClass(value.ext[1]), 'Attribut, Color und Ext "' + value.attr[1] + ' ' + value.ext[1] + '" von ' + key + ' ist wie erwartet');
                                    }
                                }
                            });
                        }
                        QUnit.start();
                    };
                    _runE2ETestcase(
                        'STEP ' + step.inp.mask + ' ' + step.step + ' ' + step.inp.fkey,
                        step.inp
                    );
                }
            );
        });
    };

    /**
     * @desc Starten END2END Testfall
     *
     */
    var _runE2ETestcase = function (qunit, inp) {
        setQUnitName(qunit);
        var i = 0;
        $(O2G.GUI.getObjScreen()).show();
        $.each(inp.field, function (key, value) {
            $('#' + key + ' input', O2G.GUI.getObjScreen()).val(value.val);
            i++;
        });
        O2G.GUI.setFKey(inp.fkey);
        O2G.GUI.processEnter();
    };

    /**
     * @desc Hilfsroutine für END2END Testroutinen
     *
     */
    var _E2EgetValue = function (id) {
        if (id === 'SYSFNR') {
            return O2G.GUI.getSYSFNR();
        }
        if (id === 'SYSTRAN') {
            return O2G.GUI.getSYSTRAN();
        }
        if (id === 'SYSPAGE') {
            return O2G.GUI.getSYSPAGE();
        }
        var text;
        if ($('#' + id, O2G.GUI.getObjScreen()).hasClass('O')) {
            text = $('#' + id, O2G.GUI.getObjScreen()).html();
        } else {
            text = $('#' + id + ' input', O2G.GUI.getObjScreen()).val();
        }
        if (text) {
            return O2G.Util.reverseXSS(text);
        } else {
            return text;
        }
    };

    /**
     * @desc Hilfsroutinen für END2END Aufzeichnung
     *
     */
    var recordprocessEnter = function (id, FKey) {
        _testscenario.id[_testscenarioid][_recordingstep] = {
            step: O2G.Config.FGB + O2G.Config.VRG + ' ' + O2G.GUI.screenlist[O2G.GUI.screenid].screentitle,
            inp: {},
            outp: {}
        };
        $('div[class="TITLE"]', O2G.GUI.getObjScreen()).validationEngine('showPrompt', 'RECORD: ' + _inRecording
            + ' ' + _testscenarioid, 'load', 'topRight');
        if (_promptTestLink) {
            _RequirementIdTestLink = prompt("AnforderungsID (TestLink) oder 'quit' ", _RequirementIdTestLink);
            if (_RequirementIdTestLink !== 'quit') {
                _promptTestLink = true;
            }
        }

        _testscenario.id[_testscenarioid][_recordingstep].inp = {
            mask: id,
            fkey: FKey,
            field: {},
            html: O2G.GUI.getObjScreen().parent().html()
        };
        if (_promptTestLink && _RequirementIdTestLink) {
            _testscenario.id[_testscenarioid][_recordingstep].inp.requirementid = _RequirementIdTestLink || ' ';
        } else {
            _testscenario.id[_testscenarioid][_recordingstep].inp.requirementid = ' ';
        }
    };

    var recordInput = function (id, fieldid, value, len) {
        _testscenario.id[_testscenarioid][_recordingstep].inp.field[fieldid] = {val: value};
    };

    var recordfillScreen = function (id) {
        _testscenario.id[_testscenarioid][_recordingstep].outp = {mask: id, field: {}, html: ""};
    };

    var recordfinishStep = function () {
        _testscenario.id[_testscenarioid][_recordingstep].outp.html = O2G.GUI.getObjScreen().parent().html();
        _recordingstep++;
    };

    var recordOutput = function (id, fieldid, attr, ext, value, cursor) {
        _testscenario.id[_testscenarioid][_recordingstep].outp.field[fieldid] = {
            val: O2G.Util.reverseXSS(value),
            attr: attr,
            ext: ext
        };
        if (cursor === 'FFFF') {
            _testscenario.id[_testscenarioid][_recordingstep].outp.field[fieldid].cursor = true;
        } else {
            _testscenario.id[_testscenarioid][_recordingstep].outp.field[fieldid].cursor = false;
        }
    };

    var setRecording = function (state) {
        if (state === 'btnsetrcdstart') {
            _inRecording = true;
            _recordingstep = 0;
        } else {
            _inRecording = false;
            _recordingstep++;
        }
        O2G.Config.INRECORDING = _inRecording;
        if (_inRecording) {
            _testscenarioid = O2G.BasicAuthRacf.user
                + '_' + O2G.BasicAuthRacf.system
                + '_' + O2G.Util.getDate().replace(/\./g, "_")
                + '_' + O2G.Util.getTime().replace(/:/g, "")
                + '_' + O2G.GUI.sessioncode;
            _testscenario.id[_testscenarioid] = [{
                step: O2G.Config.FGB + O2G.Config.VRG + ' ' + O2G.GUI.screenlist[O2G.GUI.screenid].screentitle,
                inp: {},
                outp: {}
            }];
            O2G.GUI.isBuffering = true;
        } else if (state === 'btnsetrcdstop' && _recordingstep > 0) {
            _record2edit();
            O2G.GUI.isBuffering = false;
        }
        if (state !== 'btnsetrcdoff') {
            $('div[class="TITLE"]', O2G.GUI.getObjScreen()).validationEngine('showPrompt', 'RECORD: ' + _inRecording
                + ' ' + _testscenarioid, 'load', 'topLeft');
            O2G.GUI.setFKey('F3');
            O2G.GUI.processEnter();
        }
        return state;
    };

    /**
     * @desc Sicherungsdialog für END2END Aufzeichnung
     *
     */
    var _record2edit = function () {
        var moduletitel = prompt("Bitte Titel für QUnit Report festlegen", _testscenarioid);
        var filltextarea = function (_json, _titel) {
            $("#recordingdialog textarea", O2G.GUIStatic.$Body).val(
                "QUnit.config.reorder = false;\n" +
                "O2G.Config.STYLEID = " + parseInt(O2G.LocalStorage.get('o2g_' + O2G.Config.HOSTNAME + '_style'), 10) + ";\n" +
                "O2G.Config.FKEYBUTTONS = " + O2G.LocalStorage.get('o2g_' + O2G.Config.HOSTNAME + '_keyboard') + ";\n" +
                "module('" + _titel + "');\n" +
                "var _ignoreFields = {};\n" +
                "_ignoreFields['MODC003'] = { SYSTIMD:true, SYSDATD:true };\n" +
                "var _iterate = 1;\n" +
                "var E2EAufzeichnung = " +
                JSON.stringify(_json).replace(/\}\,\{\"step\"/g, "\}\,\n\t\{\"step\"")
                    .replace(/\[\{\"step\"/g, "\[\n\t\{\"step\"")
                    .replace(/\"inp\"\:/g, "\n\t\t\"inp\"\:")
                    .replace(/\"outp\"\:/g, "\n\t\t\"outp\"\:")
                    .replace(/\"field\"\:\{/g, "\"field\"\:\{\n\t\t\t")
                    .replace(/\"html\"\:\"\"\,/g, "")
                    .replace(/\,\"html\"\:\"\"/g, "")
                    .replace(/\,\"ext\"\:\"\"/g, "")
                    .replace(/\,\"attr\"\:\"\"/g, "")
                    .replace(/\,\"cursor\"\:false/g, "")
                    .replace(/\}\,\"/g, "\}\,\n\t\t\t\"") +
                ";\n" +
                "do { O2G.QUnit.runE2E(E2EAufzeichnung) } while (--_iterate);\n"
            ).select();
        };
        $("#recordingdialog", O2G.GUIStatic.$Body).dialog({
            position: 'center',
            width: '50%',
            modal: true,
            buttons: [{
                text: "Screenshots entfernen", click: function () {
                    _testscenario.id[_testscenarioid].forEach(function (step) {
                        step.inp.html = step.outp.html = '';
                    });
                    filltextarea(_testscenario.id[_testscenarioid], moduletitel);
                }
            },
                {
                    text: "Attribute entfernen", click: function () {
                    _testscenario.id[_testscenarioid].forEach(function (step) {
                        $.each(step.inp.field, function (key, value) {
                            value.ext = value.attr = '';
                        });
                        $.each(step.outp.field, function (key, value) {
                            value.ext = value.attr = '';
                        });
                    });
                    filltextarea(_testscenario.id[_testscenarioid], moduletitel);
                }
                },
                {
                    text: "Save", click: function () {
                    var qunitfile = prompt("Bitte Pfad/Dateiname für Test angeben", "/" + O2G.BasicAuthRacf.user + "/test");
                    if (qunitfile) {
                        $.ajax({
                            url: _QUNITSTOREPATH + qunitfile,
                            data: {qunit: Base64.encode($("#recordingdialog textarea", O2G.GUIStatic.$Body).val() + '\n/* qunitfile: ' + qunitfile + ' */')},
                            dataType: 'text'
                        }).done(function () {
                            $("#recordingdialog textarea", O2G.GUIStatic.$Body).val("saved to " + qunitfile);
                            _testscenario.id[_testscenarioid] = '';
                        });
                    }
                }
                }]
        });
        filltextarea(_testscenario.id[_testscenarioid], moduletitel);
    };

    return {
        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        VERSION: '$Revision: 26 $',

        isActive: false,

        QUnitName: '',
        QUnitFn: '',
        testowner: '',
        testcase: '',

        quvrgfilter: [],
        quvrgexclude: [],
        qumaskexclude: [],
        listTFolgenForTest: [],
        listMaskenForTest: [],
        listTFolgenForTestWithError: [],
        listMaskenForTestWithError: [],
        countTFolgenForTest: [],
        countMaskenForTest: [],

        MDBCmds: {},

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        init: init,
        setMDBCmds: setMDBCmds,
        setQUnitName: setQUnitName,
        setQUFn: setQUFn,
        getQUFn: getQUFn,
        setRecording: setRecording,
        recordOutput: recordOutput,
        recordInput: recordInput,
        recordfinishStep: recordfinishStep,
        recordfillScreen: recordfillScreen,
        recordprocessEnter: recordprocessEnter,
        run: run,
        runMDBTest: runMDBTest,
        upsJS: upsJS,
        runE2E: runE2E,
        login: login,
        loadTFolge: loadTFolge,
        createandsaveMenue: createandsaveMenue,
        prepareScreen: prepareScreen
    };

})();
