/**
 * @desc Dieses Modul O2G.Config stellt die Konfigurationsvariablen für alle O2G Module bereit.
 *
 */
var O2G = {};

O2G.Config = (function () {
    'use strict';

    /**
     * @public
     * @desc Initialisierung Konfigurationsvariablen
     *
     */
    var init = function () {
        console.debug("O2G Version " + this.VERSION.substr(1, this.VERSION.length-2));

        // In JQuery nicht definiert

        $.ui.keyCode.SHIFT = 16;
        $.ui.keyCode.CNTRL = 17; // GERMAN Strg
        $.ui.keyCode.CAPSLOCK = 20;

        this.CAPSLOCK = $.ui.keyCode.CAPSLOCK;
        this.SHIFT = $.ui.keyCode.SHIFT;
        this.PAGE_UP = $.ui.keyCode.PAGE_UP;
        this.PAGE_DOWN = $.ui.keyCode.PAGE_DOWN;
        this.TAB = $.ui.keyCode.TAB;
        this.ESCAPE = $.ui.keyCode.ESCAPE;
        this.BACKSPACE = $.ui.keyCode.BACKSPACE;
        this.LEFT = $.ui.keyCode.LEFT;
        this.RIGHT = $.ui.keyCode.RIGHT;
        this.DOWN = $.ui.keyCode.DOWN;
        this.UP = $.ui.keyCode.UP;
    };

    return {

        VERSION: '$Revision: 34 $',
        PRINTCSS: '/odcs/css/o2g.css',
        MASTER: 'MST',
        MASTERMENUE: 'MNU',
        PRODUCTION: ['PROD'], //@todo REGIONs von Produktion eintragen (für O2G Fensterhintergrund)
        HOSTNAME: window.location.hostname,
        DEBUG: false,
        SESSIONTIME: 1800000, // 30 Minuten
        SYSENV: '',

        XZCIN: '', // Uppercase Transaktionen SLV aus o2g-setuctranlist

        SIGNOFFUID: ' ', //
        SIGNOFFPW: ' ', //

        STYLEID: 8, // OXSEED IV

        STYLE: [{
            name: 'FATWHITE COURIER',
            css: 'STYLEWB BOLD'
        }, {
            name: 'WHITE COURIER',
            css: 'STYLEWB NORMAL'
        }, {
            name: 'BLACK COURIER',
            css: 'STYLEBW NORMAL'
        }, {
            name: 'FATBLACK COURIER',
            css: 'STYLEBW BOLD'
        }, {
            name: 'OXSEED I',
            css: 'OXS01 BOLD'
        }, {
            name: 'OXSEED II',
            css: 'OXS01 NORMAL'
        }, {
            name: 'OXSEED III',
            css: 'OXS02 NORMAL'
        }, {
            name: 'OXSEED IV',
            css: 'OXS03 BOLD'
        }],

        //codepage EBCDIC 1141 german/austria
        EBCDICTAB: '                ' + //16
            '                ' + //32
            '                ' + //48
            '                ' + //64
            '  â{àáãåçñÄ.<(+!' + //80
            '&éêëèíîïì~Ü$*);^' + //96
            '-/Â[ÀÁÃÅÇÑö,%_>?' + //112
            'øÉÊËÈÍÎÏÌ`:#§\'="' + //128
            'Øabcdefghi«»ðýþ±' + //144
            '°jklmnopqrªºæ¸Æ€' + //160
            ' ßstuvwxyz¡¿ÐÝÞ®' + //176
            '¢£¥·©@¶¼½¾¬|¯¨´×' + //192
            'äABCDEFGHI ô¦òóõ' + //208
            'üJKLMNOPQR¹û}ùúÿ' + //224
            'Ö÷STUVWXYZ²Ô\\ÒÓÕ' + //240
            '0123456789³Û]ÙÚ ', //256

        XSS: true,
        COLUMNFACTOR: 0.61,
        NEWSESSIONURL: window.location.protocol + "//" + window.location.host + '/odcs#/run/',
        LOGINPATH: '/CICS/O2GL/PO2GXXL',
        MDBTESTPATH: '/CICS/?/PO2GXXL',
        LOADPATH: '/CICS/?/PO2GXXL',
        RUNPATH: '/CICS/?',

        CACHEPATH: '/odcs/cache/',

        VALIDATIONENGINE_OPTIONS: {
            promptPosition: 'topLeft',
            autoHidePrompt: true,
            autoHideDelay: 2000
        },

        CAPSLOCK: 0,
        SHIFT: 0,
        PAGE_UP: 0,
        PAGE_DOWN: 0,
        TAB: 0,
        ESCAPE: 0,
        BACKSPACE: 0,
        LEFT: 0,
        RIGHT: 0,
        DOWN: 0,
        UP: 0,
        ENTER: 0,
        CNTRL: 0,

        BLINK: 0, //Blinken wird ignoriert

        TEXTE: {
            STORAGE_ERROR: 'Ihr Browser unterstützt nicht alle O2G Vorausetzungen,' + ' bitte setzen Sie sich mit dem IT Support in Verbindung',
            MASTERMENUETITLE: 'O2G Menue',
            MENUETITLE: ' Menue',
            DATEALERTTEXT1: 'Ungültiges Datumsformat, gültige Formate sind ',
            DATEALERTTEXT2: 'Ungültiger Zeitraum, gültig ist '
        },

        SLV: {
            REMOVEFIRSTSLASH: false
        },

        init: init // public
    };

})();

O2G.Config.init();