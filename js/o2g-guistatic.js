/**
 * @desc Das Modul O2G.GUIStatic stellt die JAVASCRIPT Funktionen für die weitgehend
 * statischen Teile der Oberfläche des O2G Fensters und Sidebar mit Ihren
 * Mouse- und Keyboardhandlern zur Verfügung.
 *
 */
O2G.GUIStatic = (function () {
    'use strict';

    // @private
    var _bodyHeight, _bodyWidth, _alreadyResized, _change2Dot4NumPad, _FKey;

    _alreadyResized = false;

    /**
     * @private
     * @desc Abhängig von der O2G Fenstergrösse wird dass CSS-Attribute 'font-size' in Prozent
     * berechnet. O2G arbeitet mit der Einheit 'em' und passt die Fontgrösse der Grösse des Fensters an.
     *
     */
    var _recalculateFont = function () {
        var ratioHeight, ratioWidth;
        ratioHeight = Math.floor(($(window).height() / _bodyHeight) * 100);
        ratioWidth = Math.floor(($(window).width() / _bodyWidth) * 100);
        if (ratioWidth < ratioHeight) {
            ratioHeight = ratioWidth;
        }
        O2G.GUIStatic.$Body.css({
            'font-size': ratioHeight + '%'
        });
    };

    /**
     * @private
     * @desc Zurücksetzen(Default) der Buttons im Einstellungsdialog.
     *
     */
    var _resetSetting = function () {
        O2G.LocalStorage.set('o2g_' + O2G.Config.HOSTNAME + '_enter', 'btnsetenter');
        $('#btnsetenter').click();
        $('#btnsetdbgoff').click();
        $('#btnsetrcdoff').click();
    };

    /**
     * @private
     * @desc JQuery GUI initialisieren. Einbindung der Feldplausibilisierungsroutinen und AJAX
     * Fehlerroutine. Benutzereinstellungen GUI-Style und ENTER-Tastenbelegung aus
     * LOCALSTORAGE bereitstellen. Templates "Header" und "Footer" bereitstellen und aus Body löschen.
     *
     */
    var _init = function () {

        O2G.GUIStatic.$Body = $('body');

        O2G.GUIStatic.header = $('#o2gheader', O2G.GUIStatic.$Body).html();
        O2G.GUIStatic.footer = $('#o2gfooter', O2G.GUIStatic.$Body).html();

        $('#o2gheader', O2G.GUIStatic.$Body).remove();
        $('#o2gfooter', O2G.GUIStatic.$Body).remove();

        O2G.GUIStatic.$Body.validationEngine({
            binded: false
        });

        _bodyHeight = O2G.GUIStatic.$Body.height();
        _bodyWidth = O2G.GUIStatic.$Body.width();

        if (!O2G.LocalStorage.get('o2g_' + O2G.Config.HOSTNAME + '_enter')) {
            O2G.LocalStorage.set('o2g_' + O2G.Config.HOSTNAME + '_enter', _setEnterKey('btnsetenter'));
        }
        O2G.Config.STYLEID = parseInt(O2G.LocalStorage.get('o2g_' + O2G.Config.HOSTNAME + '_style'), 10);
        O2G.Config.STYLEID = O2G.Config.STYLEID || 8; // default OXSEED IV
    };

    /**
     * @public
     * @desc GUI Fonts auf die vorgefunden Fenstergrösse einmalig einstellen.
     *
     */
    var resizeFirstWindow = function () {
        // wird nur einmal (bei der ersten Anzeige einer Maske) durchgeführt
        if (!_alreadyResized) {
            $(window).resize();
            _alreadyResized = true;
        }
    };

    /**
     * @public
     * @desc Minimal QUNIT GUI initialisieren
     *
     */
    var initQUnit = function () {
        O2G.Util.setMsgAI('QUNIT GUI initialisieren ... ');
        _init();
    };

    /**
     * @public
     * @desc GUI Initialisierung und Eventhandler (Tastatur und Maus)
     *
     */
    var init = function () {
        O2G.Util.setMsgAI('GUI initialisieren ... ');
        _init();
        _enableScreenEventHandler();
    };

    /**
     * @public
     * @desc GUI Seitenmenue Initialisierung (Anmeldeinformationen und O2G-Versionen)
     *
     */

    var initSideBar = function () {
        $('#sb_user', O2G.GUIStatic.$Body).text(O2G.BasicAuthRacf.user);
        $('#sb_system', O2G.GUIStatic.$Body).text(O2G.BasicAuthRacf.system);
        $('#terminal', O2G.GUIStatic.$Body).text(O2G.AjaxUtil.terminal);
        $('#config', O2G.GUIStatic.$Body).text(O2G.Config.VERSION.substr(1, O2G.Config.VERSION.length - 2));
        $('#basicauthracf', O2G.GUIStatic.$Body).text(O2G.BasicAuthRacf.VERSION.substr(1, O2G.BasicAuthRacf.VERSION.length - 2));
        $('#ajaxutil', O2G.GUIStatic.$Body).text(O2G.AjaxUtil.VERSION.substr(1, O2G.AjaxUtil.VERSION.length - 2));
        $('#hashutil', O2G.GUIStatic.$Body).text(O2G.HashUtil.VERSION.substr(1, O2G.HashUtil.VERSION.length - 2));
        $('#gui', O2G.GUIStatic.$Body).text(O2G.GUI.VERSION.substr(1, O2G.GUI.VERSION.length - 2));
        $('#guistatic', O2G.GUIStatic.$Body).text(O2G.GUIStatic.VERSION.substr(1, O2G.GUIStatic.VERSION.length - 2));
        $('#resource', O2G.GUIStatic.$Body).text(O2G.Resource.VERSION.substr(1, O2G.Resource.VERSION.length - 2));
        $('#util', O2G.GUIStatic.$Body).text(O2G.Util.VERSION.substr(1, O2G.Util.VERSION.length - 2));
        $('#bms2html', O2G.GUIStatic.$Body).text(O2G.BMS2HTML.VERSION.substr(1, O2G.BMS2HTML.VERSION.length - 2));
        $('#tcntrl', O2G.GUIStatic.$Body).text(O2G.TCntrl.VERSION.substr(1, O2G.TCntrl.VERSION.length - 2));
        $('#localstorage', O2G.GUIStatic.$Body).text(O2G.LocalStorage.VERSION.substr(1, O2G.LocalStorage.VERSION.length - 2));
        $('#qunit', O2G.GUIStatic.$Body).text(O2G.QUnit.VERSION.substr(1, O2G.QUnit.VERSION.length - 2));
    };

    /**
     * @desc Aktiviert(einmalig) alle Tastatur- und Mausereignisroutinen. Das ist an den Body des Dokumentes
     * geknüpft. Es wird aus Performancegründen vermieden auf Zeilen oder Feldebene diese Ereignisse
     * zu definieren. Generell werden hier alle Verfahren für TAB, NEWLINE, ENTR und Funktionstasten
     * F1 bis F12 behandelt. Im Speziellen werden 3270 Emulationsbesonderheiten wie ASKIP, Keyboardbuffer,
     * CURSOR und NUMPAD Besonderheiten weitmöglichst nachgebildet.
     * Mausereignisse für das Seitenmenue und die Einstellungsdialog und die Dialoge selbst werden
     * ebenfalls behandelt.
     * Eine Fenstergrössenänderung und die damit verbundene Fontberechnung wird ebenfalls behandelt.
     *
     */
    var _enableScreenEventHandler = function () {
        var _keydownFn = function (event) {
            _change2Dot4NumPad = '';
            if (O2G.Config.DEBUG && event.target.type && event.target.type[0] === 't'){
                console.debug(event.type + " (1) w:" + event.which + " cC:" + event.charCode + " kC:" + event.keyCode + " dir:" + event.target.selectionDirection + " sel:" + event.target.selectionStart + ' ' + event.target.selectionEnd + " buf:" + O2G.GUI.isBuffering + ' ' + O2G.GUI.kbBuffer.length + ' c:' + event.ctrlKey + ' a:' + event.altKey);
            }

            if (O2G.GUI.isBuffering && (event.which === O2G.Config.BACKSPACE || event.which === O2G.Config.TAB)) {
                if (event.which === O2G.Config.BACKSPACE && O2G.GUI.kbBufferLen) {
                    O2G.GUI.kbBuffer.pop();
                    O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.length;
                    if (O2G.Config.DEBUG){
                        console.debug("kbBuffer removed last entry by BACKSPACE");
                    }
                }
                if (event.which === O2G.Config.TAB) {
                    O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.push('TAB');
                    if (O2G.Config.DEBUG){
                        console.debug("kbBuffer pushed with TAB");
                    }
                }
                return false;
            }

            // NEWLINE BUFFERING
            if (O2G.GUI.isBuffering && O2G.Config.Enter && (event.which === O2G.Config.ENTER || event.which === O2G.Config.NUMPAD_ENTER)) {
                if (O2G.Config.DEBUG){
                    console.debug(event.type + " kbBuffer pushed with NL");
                }
                O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.push('NL');
                return false;
            }

            if (_isFKeyOrEnter(event)) {
                if (O2G.Config.DEBUG){
                    console.debug(event.type + event.which + " FkeyOrEnter fired");
                }
                return false;
            }

            if ((!event.ctrlKey && !event.altKey && !O2G.GUI.isBuffering) || (event.ctrlKey && !event.altKey && !O2G.GUI.isBuffering && O2G.Config.ENTER && event.which === O2G.Config.ENTER)) {
                if (O2G.Config.DEBUG){
                    console.debug(event.type + " (2) ");
                }
                // NEWLINE
                if (O2G.Config.ENTER && (event.which === O2G.Config.ENTER || event.which === O2G.Config.NUMPAD_ENTER)) {
                    if (O2G.Config.DEBUG){
                        console.debug(event.type + ' ' + event.which + " NewLine ");
                    }
                    var nextLine = $(event.target).parent().parent(),
                        nextInput;
                    do {
                        nextLine = $(nextLine, O2G.GUI.$Screen).next();
                        if (!nextLine.length) {
                            nextLine = O2G.GUI.$Screen.first();
                        }
                        nextInput = $("div input", nextLine).first();
                    } while (!nextInput.length);
                    var doit;
                    clearTimeout(doit);
                    doit = setTimeout(function () {
                        $(nextInput).select();
                    }, 10);
                    return true;
                }
                // ASKIP
                if (!_isIgnoredKey(event.which)) {
                    var input = $(event.target),
                        _max = parseInt(input.attr('maxlength'), 10) - 1;
                    O2G.GUIStatic.$LastFieldUsed = input;
                    if ((input.val().length == _max && event.target.selectionStart == _max && event.target.selectionEnd == _max) || (_max == 0 && input.val().length === 1)) {
                        var id = input.parent().attr('id'),
                            lastField = O2G.GUI.screenlist[O2G.GUI.screenid].lastFieldId;
                        if (O2G.Config.DEBUG){
                            console.debug("skip from " + id + " len:" + (input.val().length + 1) + " max:" + _max);
                        }
                        if (id.substr(0, 1) === 'F') {
                            var last = parseInt(lastField.substr(-(lastField.length - 1)), 10),
                                i = parseInt(id.substr(1, id.length - 1), 10) + 1;
                            id = 'SYSID1';
                            for (; i <= last; i += 1) {
                                if (!$('#F' + i, O2G.GUI.$Screen).hasClass('O')) {
                                    id = 'F' + i;
                                    break;
                                }
                            }
                        } else if (id === 'SYSID1') {
                            id = 'SYSID2';
                        } else if (id === 'SYSID2') {
                            id = 'SYSID4';
                        } else if (id === 'SYSID4') {
                            id = 'F1';
                        }
                        if (O2G.Config.DEBUG){
                            console.debug("skip to " + id);
                        }
                        var skipTo = $('#' + id + ' input', O2G.GUI.$Screen),
                            doit;
                        clearTimeout(doit);
                        doit = setTimeout(function () {
                            skipTo.select();
                        }, 10);
                    }
                }
            }
            if (event.which === 106) {
                _change2Dot4NumPad = true;
            }
            return true;
        };
        var _keyupFn = function (event) {

            if (O2G.Config.DEBUG){
                console.debug(event.type + " w:" + event.which + " c:" + event.charCode + " k:" + event.keyCode + " buf:" + O2G.GUI.isBuffering + ' ' + O2G.GUI.kbBuffer.length);
            }
            if (O2G.GUI.isBuffering) {
                if (_FKey) {
                    if (_isFKeyOrEnter(event)) {
                        if (_FKey) {
                            O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.push(_FKey);
                            if (O2G.Config.DEBUG){
                                console.debug("kbBuffer pushed with " + _FKey);
                            }
                        }
                    }
                }
                return false;
            }
            if (_FKey) {
                if (_isFKeyOrEnter(event)) {
                    if (_FKey) {
                        O2G.GUI.processEnter(_FKey);
                    }
                    return false;
                }
            }
        };
        var _keypressFn = function (event) {
            if (O2G.Config.DEBUG){
                console.debug(event.type + " w:" + event.which + " c:" + event.charCode + " k:" + event.keyCode + " buf:" + O2G.GUI.isBuffering + ' ' + O2G.GUI.kbBuffer.length);
            }
            if (event.charCode === 42 && _change2Dot4NumPad) {
                _change2Dot4NumPad = '';
                if (O2G.GUI.isBuffering) {
                    O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.push(46);
                    if (O2G.Config.DEBUG){
                        console.debug("kbBuffer filled with " + O2G.GUI.kbBufferLen);
                    }
                } else {
                    var input = $(event.target);
                    input.val(input.val() + '.');
                }
                return false;
            }

            if (O2G.GUI.isBuffering) {
                if (!_isIgnoredKey(event.which)) {
                    O2G.GUI.kbBufferLen = O2G.GUI.kbBuffer.push(event.which);
                }
                if (O2G.Config.DEBUG){
                    console.debug("kbBuffer filled with " + event.which + ' ' + O2G.GUI.kbBufferLen + ' from ' + $(event.target).parent().attr('id'));
                }
                return false;
            }
            return true;
        };

        //      Mausereignisse werden von den FKEY Buttons, O2G Seitenmenue, Ordnungsbegriffzeilen und
        //      den Einstellungsdialogen benötigt               

        var _clickFn = function (event) {
            var select, _target, id;

            if (O2G.GUI.isBuffering) {
                return true;
            }
            _target = $(event.target);
            id = _target.attr('id');
            if (id === 'btnsetenter' || id === 'btnsetstrg') {
                _setEnterKey(id);
                O2G.LocalStorage.set('o2g_' + O2G.Config.HOSTNAME + '_enter', id);
            }
            if (id === 'btnsetdbgoff' || id === 'btnsetdbgall') {
                _setDebug(id);
            }
            if (id === 'btnsetrcdoff' || id === 'btnsetrcdstart' || id === 'btnsetrcdstop') {
                O2G.QUnit.setRecording(id);
            }
            if (_target.is('button') || _target.parent().is('button')) {
                var _icon = _target.attr('class');
                if (_icon === undefined) {
                    _icon = $('span', _target).attr('class');
                }
                _FKey = '';
                switch (_icon) {
                case "icon-help":
                    _FKey = 'F1';
                    break;
                case "icon-undo":
                    _FKey = 'F2';
                    break;
                case "icon-cancel":
                    _FKey = 'F3';
                    break;
                case "icon-pageup":
                    if (!O2G.GUI.validFields()) {
                        return true;
                    }
                    _FKey = 'F7';
                    break;
                case "icon-pagedown":
                    if (!O2G.GUI.validFields()) {
                        return true;
                    }
                    _FKey = 'F8';
                    break;
                case "icon-commit":
                    if (!O2G.GUI.validFields()) {
                        return true;
                    }
                    _FKey = 'F10';
                    break;
                case "icon-menus":
                    _FKey = 'F11';
                    break;
                case "icon-enter":
                    if (!O2G.GUI.validFields()) {
                        return true;
                    }
                    _FKey = 'ENTR';
                    break;
                default:
                    _FKey = '';
                }

                if (_FKey) {
                    O2G.GUI.processEnter(_FKey);
                }
                return true;
            }

            if (!document.getSelection().isCollapsed) {
                return true;
            }

            if (_target.parent().is('div[class="lineob"]')) {
                var obfieldid, value, singlevalue;
                value = '';
                obfieldid = $(_target).parent().attr('ob').split(',');
                obfieldid.forEach(function (fieldid) {
                    singlevalue = $('#' + fieldid, O2G.GUIStatic.$Body).text();
                    if (singlevalue) {
                        value += singlevalue + ',';
                    }
                });
                if (value) {
                    $('#SYSID4 input', O2G.GUIStatic.$Body).val(value.substr(0, value.length - 1));
                    O2G.GUI.processEnter('ENTR');
                }
                return true;
            }
            if (_target.parent().is('div[class="linefieldob"]')) {
                var value, fieldob;
                value = '';
                fieldob = $(_target).attr('fieldob');
                $('div', $(_target).parent()).each(
                    function () {
                        if ($(this).hasClass('fieldob') && parseInt($(this).attr('fieldob'), 10) === parseInt(fieldob, 10)) {
                            value += $(this).text() + ',';
                        }
                    }
                );
                if (value) {
                    $('#SYSID4 input', O2G.GUIStatic.$Body).val(value.substr(0, value.length - 1));
                    O2G.GUI.processEnter('ENTR');
                }
                return true;
            }
            return true;
        };

        // Menue Funktion Fensterfarbenlayout anpassen

        var _sidebarstyleFn = function () {
            if (O2G.Config.STYLEID === O2G.Config.STYLE.length) {
                O2G.Config.STYLEID = 0;
            }
            O2G.Config.STYLEID += 1;
            $('div[class="TITLE"]', O2G.GUI.$Screen).validationEngine('showPrompt',
                'STYLE: ' + O2G.Config.STYLE[O2G.Config.STYLEID - 1].name,
                'load',
                'topLeft');
            setStyle();
            O2G.LocalStorage.set('o2g_' + O2G.Config.HOSTNAME + '_style', O2G.Config.STYLEID);
        };

        // Menue Funktion Drucken

        var _sidebarprintFn = function () {
            O2G.GUI.$Screen.printThis({
                loadCSS: O2G.Config.PRINTCSS
            });
        };

        // Menue Funktion Abmelden

        var _sidebarsignoffFn = function () {
            O2G.BasicAuthRacf.signoff();
        };

        // Menue Funktion Einstellungen

        var _sidebarsettingsFn = function () {
            $("#settingsdialog", O2G.GUIStatic.$Body).dialog({
                position: 'center',
                width: '50%',
                modal: true,
                buttons: [{
                    text: "alles löschen",
                    click: function () {
                        O2G.LocalStorage.clearCache();
                        O2G.BasicAuthRacf.signoff(true);
                    }
                }, {
                    text: "zurücksetzen",
                    click: function () {
                        _resetSetting();
                    }
                }]
            });

        };

        // Tastatur und Mausbeahandlung aktivieren

        $(O2G.GUIStatic.$Body).on({
            keydown: _keydownFn,
            keyup: _keyupFn,
            keypress: _keypressFn,
            click: _clickFn
        });

        // Fenstergrössenanpassung

        $(window).resize(function () {
            var doit;
            clearTimeout(doit);
            doit = setTimeout(function () {
                _recalculateFont();
            }, 10);
        });

        // Seitenmenue aktivieren

        $('#widget_sidebar .icon-style', O2G.GUIStatic.$Body).parent().click(_sidebarstyleFn);
        $('#widget_sidebar .icon-print', O2G.GUIStatic.$Body).parent().click(_sidebarprintFn);
        $('#widget_sidebar .icon-signoff', O2G.GUIStatic.$Body).parent().click(_sidebarsignoffFn);
        $('#widget_sidebar .icon-settings', O2G.GUIStatic.$Body).parent().click(_sidebarsettingsFn);

        // Seitenmenue Funktion Einstellungen Buttons vorbelegen

        $('#setenter').buttonset();
        $('#setdebug').buttonset();
        $('#setrecording').buttonset();

        setTimeout(function () {
            $('#' + (O2G.LocalStorage.get('o2g_' + O2G.Config.HOSTNAME + '_enter') || 'btnsetenter')).click();
        }, 20);
        if (O2G.Config.DEBUG) {
            setTimeout(function () {
                $('#btnsetdbgall').click();
            }, 40);
        } else {
            setTimeout(function () {
                $('#btnsetdbgoff').click();
            }, 40);
        }
        setTimeout(function () {
            $('#btnsetrcdoff').click();
        }, 60);
    };

    /**
     * @private
     * @param {string} enter
     * @desc Diese Funktion schaltet zwischen den ENTER Tasteneinstellung STRG und ENTER hin und her.
     *
     */

    var _setEnterKey = function (enter) {
        if (enter === 'btnsetstrg') {
            O2G.Config.CNTRL = $.ui.keyCode.CNTRL;
            O2G.Config.ENTER = O2G.Config.NUMPAD_ENTER = $.ui.keyCode.ENTER;
        } else {
            O2G.Config.CNTRL = $.ui.keyCode.ENTER;
            O2G.Config.ENTER = O2G.Config.NUMPAD_ENTER = 0;
        }
        return enter;
    };

    /**
     * @private
     * @param {string} state
     * @desc Diese Funktion schaltet zwischen den DEBUG Einstellungen ALL und OFF um.
     *
     */
    var _setDebug = function (state) {
        var vstate = 'off';
        if (state === 'btnsetdbgall') {
            O2G.Config.DEBUG = true;
            vstate = 'all';
        } else {
            O2G.Config.DEBUG = false;
        }
        $('div[class="TITLE"]', O2G.GUI.$Screen).validationEngine('showPrompt', 'DEBUG: ' + vstate, 'load', 'topLeft');
        return state;
    };

    /**
     * @private
     * @param {number} keycode
     * @desc Bestimmte Tastaturereignisse lößen eine HOST Übertragung aus.
     * Das sind die Tasten F1 bis F12 (ohne ALT oder CNTRL/STRG) und die ENTER/CTRL/STRG Taste.
     * Die Tasten F4 und F12 (Sessionbehandlung) werden abgefangen und mit der Browser TAB Laschen
     * Funktionalität abgebildet. Hierfür werden die Funktionen 'BasicAuthRacf.newSession'(F4) und
     * 'BasicAuthRacf.signoff'(F12) verwendet. Die Tasten F5, F6, F9 sind gesperrt. Es erfolgt
     * keine Reaktion.
     *
     */
    var _isFKeyOrEnter = function (e) {
        if (O2G.Config.DEBUG){
            console.debug(_FKey + ' ' + e.which + ' c:' + e.ctrlKey + ' a:' + e.altKey);
        }
        if (!e.ctrlKey && !e.altKey) {
            if ((e.which > 111 && e.which < 116) || (e.which > 120 && e.which < 124)) {
                _FKey = 'F' + (e.which - 111);
            } else if (e.which === 116 || e.which === 117 || e.which === 120) {
                O2G.AjaxUtil.lastactionkey = _FKey;
                _FKey = '';
                if (O2G.GUIStatic.$LastFieldUsed){
                    O2G.GUIStatic.$LastFieldUsed.blur();
                }
                if (!O2G.GUI.validFields()) {
                    return false;
                }
                return true;
            } else if (e.which === O2G.Config.PAGE_UP || e.which === 118) {
                _FKey = 'F7';
                if (O2G.GUI.validatePaging(_FKey)) {
                    O2G.AjaxUtil.lastactionkey = _FKey;
                    _FKey = '';
                    if (O2G.GUIStatic.$LastFieldUsed){
                        O2G.GUIStatic.$LastFieldUsed.blur();
                    }
                    if (!O2G.GUI.validFields()) {
                        return false;
                    }
                    return true;
                }
            } else if (e.which === O2G.Config.PAGE_DOWN || e.which === 119) {
                _FKey = 'F8';
                if (O2G.GUI.validatePaging(_FKey)) {
                    O2G.AjaxUtil.lastactionkey = _FKey;
                    _FKey = '';
                    if (O2G.GUIStatic.$LastFieldUsed){
                        O2G.GUIStatic.$LastFieldUsed.blur();
                    }
                    if (!O2G.GUI.validFields()) {
                        return false;
                    }
                    return true;
                }
            } else if (e.which === O2G.Config.CNTRL) {
                _FKey = 'ENTR';
            } else {
                O2G.AjaxUtil.lastactionkey = _FKey;
                _FKey = '';
                if (O2G.Config.DEBUG){
                    console.debug(_FKey + ' false');
                }
                return false;
            }
        } else if (e.which === O2G.Config.CNTRL && e.ctrlKey) {
            _FKey = 'ENTR';
        } else {
            O2G.AjaxUtil.lastactionkey = _FKey;
            _FKey = '';
            if (O2G.Config.DEBUG){
                console.debug('FKey:' + _FKey + ' false');
            }
            return false;
        }
        if (_FKey === 'F4') {
            _FKey = '';
            O2G.BasicAuthRacf.newSession();
        } else if (_FKey === 'F12') {
            _FKey = '';
            O2G.BasicAuthRacf.signoff();
        }
        if (O2G.Config.DEBUG){
            console.debug(_FKey + ' true');
        }
        O2G.AjaxUtil.lastactionkey = _FKey;
        if (O2G.GUIStatic.$LastFieldUsed){
            O2G.GUIStatic.$LastFieldUsed.blur();
        }
        if (!O2G.GUI.validFields()) {
             _FKey = '';
            return false;
        }
        return true;
    };

    /**
     * @private
     * @param {number} keycode
     * @desc Bestimmte Tastaturereignisse koennen in der Tastaturereignissteuerung unberücksichtigt
     * bleiben.
     *
     */
    var _isIgnoredKey = function (keycode) {
        switch (keycode) {
        case O2G.Config.BACKSPACE:
        case O2G.Config.TAB:
        case O2G.Config.SHIFT:
        case O2G.Config.CAPSLOCK:
        case O2G.Config.LEFT:
        case O2G.Config.UP:
        case O2G.Config.RIGHT:
        case O2G.Config.DOWN:
        case O2G.Config.ESCAPE:
        case 3:
        case 19:
        case 35:
        case 36:
        case 45:
        case 46:
        case 144:
        case 145:
        case 255:
            return true;
        default:
            return false;
        }
    };

    /**
     * @public
     * @desc Das Wasserzeichen "Testsystem" wird für die Systeme angezeigt, die
     * in der Array O2G.Config.PRODUCTION "nicht" definiert wurden.
     *
     */
    var setStyle = function () {
        var testwatermark;
        if (!O2G.Config.PRODUCTION[O2G.BasicAuthRacf.system]) {
            if (O2G.Config.STYLEID > 2) {
                testwatermark = ' TESTBW';
            } else {
                testwatermark = ' TEST';
            }
        }
        O2G.GUIStatic.$Body.removeClass().addClass(O2G.Config.STYLE[O2G.Config.STYLEID - 1].css + testwatermark);
    };

    /**
     * @public
     * @desc Die Grösse des verbrauchten MEMORY der HOST Anwendung wird im Einstellungsdialog
     * angezeigt (nach jedem Datenaustausch mit dem Host).
     *
     */
    var setMdbSize = function () {
        $('#mdb', O2G.GUIStatic.$Body).text(Math.ceil((parseInt(O2G.TCntrl.offsetsmdb.substr(23, 9), 10) + parseInt(O2G.TCntrl.offsetsmdb.substr(32, 9), 10) - 2) / 1024));
    };

    /**
     * @public
     * @desc Es gibt den Kopf- (3 Zeilen) und Fussbereich (2 Zeilen). Die Feldids
     * beginnen mit SYSxxx. Nach jedem Datenaustausch mit dem HOST werden diese Bereiche
     * aktualisiert..
     *
     */
    var setTitleAndFooter = function () {
        var fnr, value, oba;

        oba = O2G.TCntrl.getID5().trim();
        if (oba) {
            oba = '[' + oba + ']';
        } else {
            oba = ' ';
        }
        $('#SYSTITLE', O2G.GUI.$Screen).html('<span class="RN">' + O2G.TCntrl.LASTTXID + '</span> ' + O2G.GUI.screenlist[O2G.GUI.screenid].screentitle + '&nbsp;' + oba);
        if (O2G.TCntrl.getCurrentTFStep().pages) {
            //    $('#SYSPAGE', O2G.GUI.$Screen).html('<fieldset class="TEXTRIGHT"><legend class="RN TEXTRIGHT">&nbsp;Seite: ' + O2G.TCntrl.getMPPTR() + '&nbsp;</legend></fieldset>');
            $('#SYSPAGE', O2G.GUI.$Screen).html('<fieldset class="TEXTRIGHT"><legend class="RN" align="right">&nbsp;Seite: ' + O2G.TCntrl.getMPPTR() + '&nbsp;</legend></fieldset>');
        } else {
            $('#SYSPAGE', O2G.GUI.$Screen).html('<fieldset class="TEXTRIGHT" />')
        }
        fnr = O2G.TCntrl.getFNR();
        if (fnr === '0000') {
            $('#SYSFTXT', O2G.GUI.$Screen).html('<fieldset class="TEXTLEFT" />');
        } else {
            value = (O2G.Resource.text["F" + fnr]) ? O2G.Resource.text["F" + fnr].ftxt : "";
            if (!value) {
                value = "F" + fnr + ' ?';
            } else if (value) {
                if (O2G.Resource.text["F" + fnr].var) {
                    if (O2G.TCntrl.getFPARM(1)) {
                        value = value.replace("#1", O2G.TCntrl.getFPARM(1));
                    }
                    if (O2G.TCntrl.getFPARM(2)) {
                        value = value.replace("#2", O2G.TCntrl.getFPARM(2));
                    }
                    if (O2G.TCntrl.getFPARM(3)) {
                        value = value.replace("#3", O2G.TCntrl.getFPARM(3));
                    }
                    if (O2G.TCntrl.getFPARM(4)) {
                        value = value.replace("#4", O2G.TCntrl.getFPARM(4));
                    }
                    if (O2G.TCntrl.getFPARM(5)) {
                        value = value.replace("#5", O2G.TCntrl.getFPARM(5));
                    }
                    if (O2G.TCntrl.getFPARM(6)) {
                        value = value.replace("#6", O2G.TCntrl.getFPARM(6));
                    }
                    if (O2G.TCntrl.getFPARM(7)) {
                        value = value.replace("#7", O2G.TCntrl.getFPARM(7));
                    }
                    if (O2G.TCntrl.getFPARM(8)) {
                        value = value.replace("#8", O2G.TCntrl.getFPARM(8));
                    }
                    if (O2G.TCntrl.getFPARM(9)) {
                        value = value.replace("#9", O2G.TCntrl.getFPARM(9));
                    }
                }
                value = O2G.Resource.text["F" + fnr].typ + fnr + ' ' + value;
            }
            if (value) {
                value = value.replace(/\&/g, "&amp;").replace(/\</g, "&lt;");
                $('#SYSFTXT', O2G.GUI.$Screen).html('<fieldset class="TEXTLEFT"><legend class="RN">&nbsp;' + value + '&nbsp;</legend></fieldset>');
            }
            O2G.TCntrl.setFPARM();
        }

        if (O2G.TCntrl.getID1() === O2G.Config.MASTER) {
            O2G.GUI.setFieldValue($('#SYSID1', O2G.GUI.$Screen), 'SYSID1', '', '0000');
            O2G.GUI.saveCursor('SYSID1');
        } else {
            O2G.GUI.setFieldValue($('#SYSID1', O2G.GUI.$Screen), 'SYSID1', O2G.TCntrl.getID1(), '0000');
            if (O2G.TCntrl.getID2() === O2G.Config.MASTERMENUE) {
                O2G.GUI.setFieldValue($('#SYSID2', O2G.GUI.$Screen), 'SYSID2', '', '0000');
                O2G.GUI.saveCursor('SYSID2');
            } else {
                O2G.GUI.setFieldValue($('#SYSID2', O2G.GUI.$Screen), 'SYSID2', O2G.TCntrl.getID2(), '0000');
                O2G.GUI.setFieldValue($('#SYSID4', O2G.GUI.$Screen), 'SYSID4', O2G.TCntrl.getID4().trim(), '0000');
            }
            if (!O2G.GUI.cursorField) {
                O2G.GUI.saveCursor('SYSID4');
            }
        }
    };

    return {

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        $Body: '',
        $LastFieldUsed: '',
        header: '',
        footer: '',
        VERSION: '$Revision: 35 $',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden

        resizeFirstWindow: resizeFirstWindow,
        setStyle: setStyle,
        setMdbSize: setMdbSize,
        setTitleAndFooter: setTitleAndFooter,
        initSideBar: initSideBar,
        initQUnit: initQUnit,
        init: init
    };

})();