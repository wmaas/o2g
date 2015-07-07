/**
 * @desc Das Modul O2G.HashUtil stellt die Werte des Hash
 * aus der URL zur Verfügung.
 *
 */
O2G.HashUtil = (function () {
    'use strict';

    var _hash;

    /**
     * @public
     * @desc Hier werden die Vorbereitungen für die HASH Steuerung
     * getroffen. Die HASH Steuerung wird in Sondersituationen wie
     * qunit, signoff, newsession und start mit Vorgang verwendet
     *
     */
    var init = function () {

        if (window.location.hash.substr(0, 2) === '#/') {

            _hash = window.location.hash.substr(2).split('/');

            if (_hash[0] === 'signoff') {
                this.signoff = {
                    sessionid: _hash[1],
                    sessioncode: _hash[2],
                    terminal: _hash[3]
                }
            } else if (_hash[0] === 'signon') {
                this.signon = true;
            } else if (_hash[0] === 'run') {
                this.startparm = {};
                if (_hash[1]) {
                    this.startparm.fgb = _hash[1];
                }
                if (_hash[2]) {
                    this.startparm.vrg = _hash[2];
                }
                if (_hash[3]) {
                    this.startparm.ob = _hash[3];
                }
            } else if (_hash[0] === 'qunit') {
                this.qunit.testowner = hash[1];
                this.qunit.testcase = hash[2];
                this.qunit.testuid = hash[3];
                this.qunit.testpw = hash[4];
                this.qunit.report = hash[5];
            } else if (_hash[0] === 'debug') {
                O2G.Config.DEBUG = true;
            }
        }

        if (!this.startparm) {
            this.startparm = {
                fgb: O2G.Config.MASTER,
                vrg: O2G.Config.MASTERMENUE
            }
        }
    };

    var setHash = function () {
        if (!O2G.QUnit || !O2G.QUnit.isActive){
            window.location.hash = '#/run/' + O2G.TCntrl.getID1() + '/' + O2G.TCntrl.getID2();
        }
    };

    return {

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        signon: '',
        startparm: '',
        signoff: '',
        qunit: '',
        VERSION: '$Revision: 35 $',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        init: init,
        setHash: setHash
    };

})();

O2G.HashUtil.init();