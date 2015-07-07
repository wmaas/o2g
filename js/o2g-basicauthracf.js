/**
 * @desc Das Modul O2G.BasicAuthRacf stellt die JAVASCRIPT Funktionen für die Anmeldung am
 * CICS RACF zur Verfügung.
 *
 */
O2G.BasicAuthRacf = (function () {
    'use strict';

    var _export, _sessiontimeout;

    /**
     * @private
     * @desc Ein Signon soll mit einer neuen Instanz des Dokuments arbeiten. Deshalb wird das gesamte
     * Dokument mit reload() neu geladen. Zur Unterscheidung zwischen normalem Start per start.html und
     * diesem Reload wird der HASH auf '#/signon' gesetzt. Dem Reload wird kein Parameter mitgegeben.
     * Der Reload wird deshalb aus dem Browsercache bedient.
     *
     */

    var _reloadSignon = function () {
        O2G.Util.reload(false, '#/signon');
    };

    /**
     * @public
     * @desc Hier werden die Vorbereitungen für die RACF Anmeldung durchgeführt. Ausgehend von verschiedenen
     * Aufrufsituationen werden entsprechende Variablen gesetzt.
     * Beim '#/signon' werden die Inhalte von USERID und PASSWORT abgelöscht.
     * Beim '#/signoff' wird das 'terminal' und die zuletzt verwendeten Sessionvariablen gesetzt.
     * Mit '#/FGB/VRG' kann der Startvorgang nach dem LOGIN gesetzt werden.
     * Beim Login werden auch die Timestamps der Resourcen MENUE, RULES und TEXT mitgegeben. Wurden im
     * CICS diese Resourcen geändert, wird in der Antwort die geänderten Resourcen mitgeliefert. Die
     * Vorgangsberechtigungen werden immer mitgeliefert.
     *
     */
    var signonDbg = function () {
        O2G.Util.traceDbg('signon', 'O2g.BasicAuthRacf');
        console.debug('... async started: ' + signon());
        O2G.Util.traceDbg('<<< signon', 'O2g.BasicAuthRacf');

    };

    var signon = function () {
        var options;

        options = {data: {}, headers: {}};

        if (O2G.HashUtil.signoff) {
            O2G.AjaxUtil.setSignoffKontext(O2G.HashUtil.signoff);
        }

        if (!O2G.QUnit || !O2G.QUnit.isActive) {
            window.location.hash = '#';
        }
        if (O2G.QUnit && O2G.QUnit.isActive && O2G.QUnit.login('before')) {
            return;
        }

        options.headers['x-o2g-signon'] = true;
        options.data.cmd = 'login';

        return O2G.AjaxUtil.run(options, _processRACFFn);
    };


    /**
     * @private async
     * @param {object} login (RACF/Anwendungsresponse JSON)
     * @desc Nach erfolgreicher RACF Anmeldung werden die geänderten Resourcen aufbereitet.
     * RMS Grundeinstellungen werden befüllt. Der O2G Fensterhintergrund wird abhängig vom CICS
     * Servernamen (login.server.region) auf 'TESTSYSTEM' gesetzt. Die Sessionid wird hier gesetzt
     * und bis zum Signoff nicht geändert. Zur Behandlung der Tastatur und Mausereignisse wird
     * die GUI Funktion O2G.GUI.enableScreenEventHandler aufgerufen. Das O2G Menue und der
     * Einstellungsdialog wird mit den Anmeldedaten (user, system und terminal) versorgt. Abschliessend
     * wird das erste Anwendungsprogramm mit der Funktion O2G.GUI.sendDataToHost aufgerufen.
     *
     */
    var _processRACFFn = function (login) {
        O2G.BasicAuthRacf.system = login.server.region;
        O2G.GUIStatic.setStyle();
        O2G.BasicAuthRacf.user = login.client.racf_userid;
        O2G.BasicAuthRacf.orgunit = login.orgunit;
        O2G.Config.SYSENV = 'o2g_' + login.server.region;
        O2G.Resource.loadheader = {};

        if (O2G.QUnit && O2G.QUnit.isActive && O2G.QUnit.login('after')) {
            return;
        }

        O2G.Resource.init(login);

        if (O2G.QUnit && O2G.QUnit.isActive && O2G.QUnit.login('afterload')) {
            return;
        }

        O2G.TCntrl.setID1(O2G.HashUtil.startparm.fgb);
        O2G.TCntrl.setID2(O2G.HashUtil.startparm.vrg);
        O2G.TCntrl.setID4(O2G.HashUtil.startparm.ob);

        O2G.GUI.sendDataToHost();

        O2G.GUIStatic.initSideBar();
    };

    /**
     * @desc Ein Signon soll mit einer neuen Instanz des Dokuments arbeiten. Deshalb wird das gesamte
     * Dokument mit reload() neu geladen. Zur Unterscheidung zwischen normalem Start per start.html und
     * diesem Reload wird der HASH auf '#/signon' gesetzt. Dem Reload wird kein Parameter mitgegeben.
     * Der Reload wird deshalb aus dem Browsercache bedient.
     *
     */
    var signoff = function (cache) {
        setTimeout(function () {
            O2G.Util.reload(cache, '#/signoff/' + O2G.AjaxUtil.sessionid + '/' + O2G.AjaxUtil.sessioncode + '/' + O2G.AjaxUtil.terminal)
        }, 100);
    };

    /**
     * @desc Mit der SWAP-Taste(F4) wird eine neue Session angelegt. In der Browseroberfläche wird
     * hierfür ein neuer TAB angelegt. FGB, VRG und OB werden vom aktiven TAB mitgenommen.
     *
     */
    var newSession = function () {
        var url
            , id4
            , id5
            , vartxt;

        id4 = O2G.TCntrl.getID4();
        id5 = O2G.TCntrl.getID5();

        url = O2G.Config.NEWSESSIONURL;

        O2G.TCntrl.setID1($('#SYSID1 input', O2G.GUIStatic.$Body).val());
        O2G.TCntrl.setID2($('#SYSID2 input', O2G.GUIStatic.$Body).val());
        O2G.TCntrl.setID4($('#SYSID4 input', O2G.GUIStatic.$Body).val());

        if (O2G.Resource.menue.vorgang[O2G.TCntrl.getID1() + O2G.TCntrl.getID2()]) {
            url += O2G.TCntrl.getID1() + '/' + O2G.TCntrl.getID2();
            if (O2G.TCntrl.getID4().trim()) {
                url += '/' + O2G.TCntrl.getID4();
            }
            setTimeout(function () {
                window.open(url)
            }, 100);
        } else {
            vartxt = O2G.TCntrl.getID1() + O2G.TCntrl.getID2();
        }

        O2G.TCntrl.setID1(O2G.TCntrl.getFGB());
        O2G.TCntrl.setID2(O2G.TCntrl.getVRG());
        O2G.TCntrl.setID4(id4);
        O2G.TCntrl.setID5(id5);

        $('#SYSID4 input', O2G.GUIStatic.$Body).val(O2G.TCntrl.getID4());

        if (vartxt) {
            O2G.TCntrl.setFNR('9040');
            O2G.TCntrl.setFPARM(1, vartxt);
        }

        O2G.GUIStatic.setTitleAndFooter();
    };

    /**
     * @desc Der SessionTimeout soll ein erneutes Login nach Ablauf einer konfigierbaren Zeit
     * erzwungen werden. Der Timeout ist standardmässig auf 30 Minuten eingestellt.
     * Konfiguration: O2G.Config.SESSIONTIME
     *
     */

    var setSessionTimeout = function () {
        clearTimeout(_sessiontimeout);
        _sessiontimeout = setTimeout(function () {
            alert("Ihre Sitzung ist nach " + Math.floor(O2G.Config.SESSIONTIME / 60000) + " Minuten abgelaufen.");
            signoff();
        }, O2G.Config.SESSIONTIME);
    };

    _export = {

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        system: '... started',
        user: '',
        orgunit: '',
        VERSION: '$Revision: 35 $',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        signon: signon,
        signoff: signoff,
        newSession: newSession,
        setSessionTimeout: setSessionTimeout
    };

    if (O2G.Config.DEBUG){
        _export.signon = signonDbg;
    }

    return _export;

})();