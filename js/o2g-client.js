/**
 * @desc Das ist das Einstiegsscript in O2G. Im Normalfall wird die Funktion
 * O2G.BasicAuthRacf.signon (RACF Anmeldung) aufgerufen.
 * PING und QUNIT Testläufe werden durch spezielle URL HASH #/ping/... oder #/qunit/...
 * angestossen. Eine Anmeldung wird in diesen Sonderfällen von den Funktionen
 * selbst angesteuert.
 *
 */
$(document).ready(function () {
    'use strict';
    // QUnit
    if (O2G.QUnit) {
        O2G.QUnit.init();
        if (O2G.QUnit.isActive) {
            $('#settingsdialog', O2G.GUIStatic.$Body).remove();
            O2G.QUnit.run();
            return;
        }
    }
    // GUI Starten (mit RACF Anmeldung)
    O2G.GUI.run();
});