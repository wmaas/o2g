/**
 * @desc Das Modul O2G.AjaxUtil stellt die Funktionen und Kontexte
 * für die Kommunikation (HTTP) zum CICS bereit.
 *
 */
O2G.AjaxUtil = (function () {
    'use strict';

    var _nextFn, _login, _logout, _lasttxid, _txid;

    /**
     * @private
     * @desc Bei jedem Ajaxcall werden abhängig von der Aufrufherkunft
     * der Kontext terminal(einmalig bei login),
     * sessionid(einmalig bei login) und sessioncode(jedesmal)      * gesetzt.
     * Sollte der HOST mit den Feldern tsmask und/oder tstfolge eine Diskrepanz
     * zwischen den Softwareständen HOST und O2G feststellen wird ein Fehlerhandling
     * gerufen.
     */

    var _receiveFn = function (response, status, jqXHR) {

        if (O2G.Config.DEBUG){
            console.debug('... async received data from: ' + O2G.AjaxUtil.lastaction);
        }

        if (_login) {
            try {
                response = JSON.parse(response);
            } catch (e) {
                if (response[0] === '<') {
                    _upsRACF(response, status, jqXHR);
                } else {
                    _upsLOGIN(response, e, status, jqXHR);
                }
            }
            O2G.AjaxUtil.sessionid = response.server.sessionid;
            O2G.AjaxUtil.terminal = response.client.o2g_terminal;
            O2G.AjaxUtil.sessioncode = response.server.sessioncode;
            _setupForGUI();
        } else {
            if (jqXHR.getResponseHeader('x-o2g-cache') !== 'true') {
                O2G.AjaxUtil.sessioncode = response.sessioncode;
            }
            if (response.tsmask) {
                O2G.AjaxUtil.loadheader = {};
                if (O2G.GUI.screenlist[response.id]) {
                    if (O2G.GUI.screenlist[response.id].tsmask !== response.tsmask.substr(0, 22)) {
                        O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + response.id);
                        O2G.AjaxUtil.loadheader['x-o2g-screenid'] = response.id;
                        O2G.AjaxUtil.loadheader['x-o2g-tsr'] = response.tsmask.substr(0, 22);
                        O2G.AjaxUtil.loadheader['x-o2g-otsr'] = O2G.GUI.screenlist[response.id].tsmask;
                        O2G.GUI.screenlist[response.id] = {};
                    }
                } else {
                    store = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + response.id);
                    if (store && store.ts !== response.tsmask.substr(0, 22)) {
                        O2G.AjaxUtil.loadheader['x-o2g-otsr'] = store.ts;
                        O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + response.id);
                    }
                    O2G.AjaxUtil.loadheader['x-o2g-screenid'] = response.id;
                    O2G.AjaxUtil.loadheader['x-o2g-tsr'] = response.tsmask.substr(0, 22);
                }
            }
            if (response.tstfolge && response.tstfolge.substr(4, 3) !== O2G.Config.MASTERMENUE && O2G.Resource.tfolge[O2G.TCntrl.getID1() + O2G.TCntrl.getID2()].ts) {
                O2G.LocalStorage.remove(O2G.Config.SYSENV + '_' + response.tstfolge.substr(1, 6));
                alert('Ups... der Vorgang ' + response.tstfolge.substr(1, 6) + ' wurde im laufenden Betrieb geändert, bitte neu anmelden. Alt:' + O2G.Resource.tfolge[O2G.TCntrl.getID1() + O2G.TCntrl.getID2()].ts + ' Neu:' + response.tstfolge);
                delete O2G.Resource.tfolge[response.tstfolge.substr(1, 6)];
                O2G.BasicAuthRacf.signoff(false);
            }
        }
        _nextFn(response, status, jqXHR);
    };

    /**
     * @private
     * @param {string} login
     * @desc Fehlerbehandlung für: 'RACF Error oder RACF eigene HTML Seite für PASSWORT abgelaufen'
     * RACF hat verschiedene Error HTML Seiten. Deshalb wird aus dem RACF Response (login) der HTML
     * Teil extrahiert und in das O2G Fenster geladen.
     *
     */

    var _upsRACF = function (login) {
        // RACF use his own screens for password expired etc.
        // with indexOf we remove some <...doctype...> line
        document.write(login.substr(login.indexOf('<html>')));
    };

    /**
     * @private
     * @param {string} login
     * @param {object} e
     * @desc Fehlerbehandlung für: 'LOGIN hat nicht den erwartete JSON Loginobjekt zurückgeliefert'
     *
     */
    var _upsLOGIN = function (login, e) {
        document.write(JSON.stringify(e) + ' ' + login);
    };

    /**
     * @desc Stellt allgemeine AJAX Errorbehandlung bereit
     */
    var _upsAJAX = function (jqxhr, exception, settings, request) {
        var details = '';
        if (settings.data) {
            details += settings.data.substr(0, 100) + ' <br /><br /> ';
        }
        if (exception) {
            details += JSON.stringify(exception);
        }
        details += ' ' + JSON.stringify(request);
        if (jqxhr === 'error') {
            details += JSON.stringify(settings);
        }
        if (O2G.HashUtil.signon && request.status == 401) {
            reload();
        }

        $("body").show().flippy({
            verso: '<h1>ups... ' + exception + '  :-(</h1><br /> ' +
                settings.type + ' ' + settings.url + ' <br /><br /> ' +
                details + ' <br /><br /> ' +
                'letzte Aktion: ' + O2G.Util.aiMsg + ' <br /><br /> ' +
                'o2g version: ' + O2G.Config.VERSION + ' <br /><br /> ' +
                O2G.Util.getDate() + ' ' + O2G.Util.getTime() + ' <br /><br /> ' +
                navigator.userAgent
        });
    };
    /**
     * @public
     * @desc
     */

    var setSignoffUser = function () {
        _logout = true;
    };

    var setSignoffKontext = function (signoff) {
        O2G.AjaxUtil.sessionid = signoff.sessionid;
        O2G.AjaxUtil.sessioncode = signoff.sessioncode;
        O2G.AjaxUtil.terminal = signoff.terminal;
    };

    var _setupForLogin = function () {
        if (_logout) {
            $.ajaxSetup({
                type: 'POST',
                dataType: 'text',
                username: O2G.Config.SIGNOFFUID,
                password: O2G.Config.SIGNOFFPW
            });
        } else {
            $.ajaxSetup({
                type: 'POST',
                dataType: 'text'
            });
        }
    };
    /**
     * @desc JQuery GUI AJAX Setup.
     *
     */
    var init = function () {
        var errorFn = function (event, jqXHR, settings, exception) {
            if (O2G.HashUtil.signoff) {
                document.write('<html>Session beendet (Drücken Sie F5 für RESTART oder schliessen Sie das Fenster/Tab)</html>');
                window.location.hash = '';
                setTimeout(window.close(), 2000);
                setTimeout(function () {
                    window.close()
                }, 2000);
            } else {
                _upsAJAX(jqXHR, exception, settings, event);
            }
        };
        $.ajaxSetup({
            cache: true,
            error: errorFn
        });
    };

    var _setupForGUI = function () {
        $.ajaxSetup({
            type: 'POST',
            dataType: 'json'
        });
    };

    var run = function (options, nextFn) {
        if (options.data.cmd === 'login') {
            _setupForLogin();
            options.url = O2G.Config.LOGINPATH;
            if (O2G.HashUtil.signoff) {
                options.data.cmd = 'dsession';
                _login = false;
                O2G.AjaxUtil.lastaction = ' delete session ';
            } else {
                _login = true;
                O2G.AjaxUtil.lastaction = ' login session ';
            }
        } else if (options.data.cmd === 'run') {
            options.data.orgunit = O2G.BasicAuthRacf.orgunit;
            _txid = O2G.TCntrl.getTransId();
            if (!_txid) {
                _txid = _lasttxid;
            }
            options.url = O2G.Config.RUNPATH.replace("?", _txid + '/' + O2G.TCntrl.getProgram());
            _login = false;
            O2G.AjaxUtil.lastaction = ' run ' + _txid + ' ' + O2G.TCntrl.getPID() + ' ' + O2G.AjaxUtil.lastactionkey;
        } else if (options.data.cmd === 'load') {
            options.url = O2G.Config.LOADPATH.replace("?", _lasttxid);
            _login = false;
            O2G.AjaxUtil.lastaction = ' load ' + options.data.resource;
        }

        _lasttxid = options.url.split('/');
        _lasttxid = _lasttxid[2];

        if (O2G.AjaxUtil.sessionid){
            options.data.sessionid = O2G.AjaxUtil.sessionid;
        }
        if (O2G.AjaxUtil.sessioncode){
            options.data.sessioncode = O2G.AjaxUtil.sessioncode;
        }
        if (O2G.AjaxUtil.terminal){
            options.data.trmid = O2G.AjaxUtil.terminal;
        }
        if (O2G.QUnit.testowner){
            options.data.testcase = O2G.QUnit.testowner + O2G.QUnit.testcase;
        }
        if (O2G.Config.DEBUG){
            options.data.debug = 'true';
        }

        options.data.save = O2G.TCntrl.slevel;
        options.xhrFields = {
            withCredentials: true
        };

        _nextFn = nextFn;

        if (O2G.Config.SLV.REMOVEFIRSTSLASH){
            options.url = options.url.substr(1);
        }

        $.ajax(options).done(_receiveFn);

        return O2G.AjaxUtil.lastaction;

    };

    return {

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        loadheader: {}, // Todo
        terminal: '',
        sessionid: '',
        sessioncode: '',
        lastaction: '',
        lastactionkey: '',
        VERSION: '$Revision: 35 $',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        setSignoffUser: setSignoffUser,
        setSignoffKontext: setSignoffKontext,
        init: init,
        run: run
    };

})();