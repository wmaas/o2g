/**
 * @desc Das Modul O2G.TCntrl stellt die Funktionen für die Transaktionssteuerung bereit.
 *
 */
O2G.TCntrl = (function () {
    'use strict';

    // @private

    var _export,
        _spaces,
        _transid,
        _uc,
        _program,
        _afterloadtffn,
        _tfstack,
        _tfstacksave,
        _tfpgmfound,_cond,
        _condlist,
        _tfolge,
        _sysvar,
        _slevel,
        _inetfolge,
        _savedid;

    _slevel = 'S0';
    _spaces = O2G.Util.fillString(" ", 512);
    _tfstack = {
        S0: []
    };
    _tfstacksave = {
        S0: []
    };
    _cond = {
        S0: []
    };
    _inetfolge = {};
    _condlist = {
        S0: []
    };
    _tfolge = {
        S0: {}
    };

    _sysvar = {
        PID: O2G.Util.fillString(" ", 8),
        RET: O2G.Util.fillString(" ", 4),
        FROM: " ",
        PARM: O2G.Util.fillString(" ", 512),
        ID1: "   ",
        ID2: "   ",
        FGB: "   ",
        VRG: "   ",
        ID4: O2G.Util.fillString(" ", 80),
        ID5: O2G.Util.fillString(" ", 80),
        FNR: "0000",
        VORW: " ",
        MPPTR: "001",
        ERASE: " ",
        FPARM: [O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64),
            O2G.Util.fillString(" ", 64)
        ],
        SAVE: "0",
        SAVEOB: O2G.Util.fillString(" ", 80),
        FPARMI: O2G.Util.fillString(" ", 2),
        EXCODE: O2G.Util.fillString(" ", 4)
    };

    /**
     * @param {object} sysvar
     * @desc stores SYSVARIABLEN from HOST to local
     */
    var setSYSVAR = function (sysvar) {
        _sysvar = JSON.parse(JSON.stringify(sysvar));
        _sysvar.ID4 = O2G.Util.convert2ASCII(_sysvar.ID4);
        _sysvar.ID5 = O2G.Util.convert2ASCII(_sysvar.ID5);
        _sysvar.SAVEOB = O2G.Util.convert2ASCII(_sysvar.SAVEOB);
        _sysvar.PARM = O2G.Util.convert2ASCII(_sysvar.PARM);
        _sysvar.ID1 = _sysvar.ID1.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.ID2 = _sysvar.ID2.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.FGB = _sysvar.FGB.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.VRG = _sysvar.VRG.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.ID4 = _sysvar.ID4.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.ID5 = _sysvar.ID5.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        _sysvar.SAVEOB = _sysvar.SAVEOB.replace("ß", '\n').toUpperCase().replace("\n", 'ß');
    };

    /**
     * @desc set initial values of SYSVARIABLEN
     */
    var init = function () {
        setSLevel(_slevel);
        setPID(getProgram());
        setFROM("M");
        _sysvar.RET = "ENTR";
        setPARM(" ");
        setFGB(O2G.Config.MASTER);
        setVRG(O2G.Config.MASTERMENUE);
        setID1(O2G.Config.MASTER);
        setID2(O2G.Config.MASTERMENUE);
        setID4(" ");
        setID5(" ");
        setSAVE(_slevel);
        setSAVEOB(" ");
        setFNR("0000");
        setEXCODE(" ");
        this.SYSVAR = JSON.stringify(_sysvar);
    };

    /**
     * @desc set initial values of SYSVARIABLEN from stack and prepare
     * it for HOST
     */
    var _fillSYSVAR = function () {

        var current, tf, step, tfstep;

        current = _tfstack[_slevel].length - 1;
        tf = _tfstack[_slevel][current][0];
        step = _tfstack[_slevel][current][1];
        tfstep = _tfolge[_slevel][tf][step];

        setProgram(tfstep.pgm);
        setPID(getProgram());
        setFROM("M");
        _sysvar.RET = 'ENTR';
        if (tfstep.parm){
            setPARM(tfstep.parm);
        } else {
            setPARM(" ");
        }
        setFGB(O2G.TCntrl.getID1());
        setVRG(O2G.TCntrl.getID2());
        if (tfstep.txid){
            O2G.TCntrl.LASTTXID = tfstep.txid;
            setTransId(tfstep.txid);
            if (tfstep.lc){
                setUC(false);
            } else {
                setUC(true);
            }
        } else {
            setTransId(O2G.TCntrl.LASTTXID);
        }
        O2G.GUI.screenid = tfstep.screen || "";
        setSAVE(_slevel);
        createSYSVAR();
    };

    /**
     * @desc set values of SYSVARIABLEN for HOST
     */
    var createSYSVAR = function () {
        var _temp;
        _temp = JSON.stringify(_sysvar);
        setMPPTR(getMPPTR());
        _sysvar.ID4 = O2G.Util.convert2HexEBCDIC(_sysvar.ID4 + _spaces.substr(0, 40 - _sysvar.ID4.length));
        _sysvar.ID5 = O2G.Util.convert2HexEBCDIC(_sysvar.ID5 + _spaces.substr(0, 40 - _sysvar.ID5.length));
        _sysvar.SAVEOB = O2G.Util.convert2HexEBCDIC(_sysvar.SAVEOB + _spaces.substr(0, 40 - _sysvar.SAVEOB.length));
        _sysvar.PARM = O2G.Util.convert2HexEBCDIC(_sysvar.PARM + _spaces.substr(0, 256 - _sysvar.PARM.length));
        O2G.TCntrl.SYSVAR = JSON.stringify(_sysvar);
        _sysvar = JSON.parse(_temp);
        return O2G.TCntrl.SYSVAR;
    };

    /**
     * @desc set list of possible conditions for the current tfolge
     */
    var createCONDLIST = function () {
        if (_condlist[_slevel].length){
            return _condlist[_slevel].join(',') + ',';
        } else {

        }
    };

    /**
     * @param {string} cond (conditionstring from HOST)
     * @desc stores condition array to local
     */
    var setCOND = function (cond) {
        if (cond && cond.length > 1){
            _cond[_slevel] = cond.substr(0, cond.length - 1).split(',');
        } else {
            _cond[_slevel] = [];
        }
    };

    /**
     * @param {string} parm
     * @param {number} num
     * @desc stores/retrieve parm/num to/from SYSVARIABELN of HOST
     *       (fills trailing spaces for cobol copy)
     */

    /**
     * @desc error number for error text
     */
    var getFNR = function () {
        var _fnr = parseInt(_sysvar.FNR, 10);
        _fnr = "0000" + _fnr.toString();
        return _fnr.substr(_fnr.length - 4);
    };
    var setFNR = function (parm) {
        _sysvar.FNR = parm || '0000';
    };
    /**
     * @desc error text parameter from application program
     */
    var getFPARM = function (num) {
        return _sysvar.FPARM[num - 1].trim();
    };
    /**
     * @desc set/reset error text parameter from application program
     */
    var setFPARM = function (num, text) {
        if (num && text) {
            _sysvar.FPARM[num - 1] = text + _spaces.substr(0, 64 - text.length);
            return;
        }
        _sysvar.FPARM[0] = O2G.Util.fillString(" ", 64);
        _sysvar.FPARM[1] = _sysvar.FPARM[0];
        _sysvar.FPARM[2] = _sysvar.FPARM[0];
        _sysvar.FPARM[3] = _sysvar.FPARM[0];
        _sysvar.FPARM[4] = _sysvar.FPARM[0];
        _sysvar.FPARM[5] = _sysvar.FPARM[0];
        _sysvar.FPARM[6] = _sysvar.FPARM[0];
        _sysvar.FPARM[7] = _sysvar.FPARM[0];
        _sysvar.FPARM[8] = _sysvar.FPARM[0];
    };
    /**
     * @desc map page number for paging
     */
    var getMPPTR = function () {
        var _page = parseInt(_sysvar.MPPTR, 10);
        _page = "000" + _page.toString();
        return _page.substr(_page.length - 3);
    };
    var setMPPTR = function (parm) {
        _sysvar.MPPTR = parm;
    };
    /**
     * @desc control data (paging stop) from application program
     */
    var getVORW = function () {
        return _sysvar.VORW;
    };
    var setVORW = function (parm) {
        _sysvar.VORW = parm;
    };
    /**
     * @desc control data (save level) from application program
     */
    var getSLevel = function () {
        return O2G.TCntrl.slevel;
    };
    var setSLevel = function (parm) {
        if (parm[0] === '+') {
            _slevel = parseInt(parm.substr(1), 10) + parseInt(_slevel.substr(1), 10);
        } else if (parm[0] === '-') {
            _slevel = parseInt(_slevel.substr(1), 10) - parseInt(parm.substr(1), 10);
        } else {
            _slevel = parseInt(parm.substr(1), 10);
        }
        O2G.TCntrl.slevel = _slevel = 'S' + _slevel.toString();
    };

    var getERASE = function () {
        return _sysvar.ERASE.trim();
    };

    /**
     * @desc EXIT Code
     */
    var setEXCODE = function (parm) {
        if (parm) {
            if (parm === "F11") {
                parm = "PF11";
            } else if (parm === "F3") {
                parm = "PF03";
            }
            _sysvar.EXCODE = parm + _spaces.substr(0, 4 - parm.length);
        } else {
            _sysvar.EXCODE = _spaces.substr(0, 4);
        }
    };

    /**
     * @desc program name
     */
    var setPID = function (parm) {
        if (parm) {
            _sysvar.PID = parm + _spaces.substr(0, 8 - parm.length);
        } else {
            _sysvar.PID = " ";
        }
    };
    var getPID = function () {
        return _sysvar.PID;
    };

    /**
     * @desc control data output from application program or tcntrl
     */
    var setRETDbg = function (parm) {
        O2G.Util.traceDbg('setRET', 'O2G.TCntrl');
        var ret = setRET(parm);
        O2G.Util.traceDbg('<<< setRET', 'O2G.TCntrl');
        return ret;
    };

    var setRET = function (parm) {
        if (parm === 'ENTR') {
            if (getFGB() !== getID1() || getVRG() !== getID2()) {
                parm = _runCANCEL(parm);
            }
        } else if (parm === 'F2') {
            setID1(getFGB());
            setID2(getVRG());
            if (_checkUndo()) {
                parm = 'UNDO';
            } else {
                parm = 'SHOW';
                setFNR('9003');
            }
        } else if (parm === 'F3') {
            parm = _runCANCEL(parm);
        } else if (parm === 'F5') {
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF05";
        } else if (parm === 'F6'){
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF06";
        } else if (parm === 'F7'){
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF07";
            setMPPTR(parseInt(_sysvar.MPPTR, 10) - 1);
            if (getCopy()) {
                setMPPTRForShow(getMPPTR());
                parm = 'SHOW';
                if (O2G.Config.DEBUG) {
                    console.debug("RUECKW(F7) to page " + getMPPTR())
                }
            }
        } else if (parm === 'F8'){
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF08";
            setMPPTR(parseInt(_sysvar.MPPTR, 10) + 1);
            if (getCopy()){
                setMPPTRForShow(getMPPTR());
                parm = 'SHOW';
                if (O2G.Config.DEBUG){
                    console.debug("VORW(F8) to page " + getMPPTR())
                }
            }
        } else if (parm === 'F9'){
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF09";
        } else if (parm === 'F10'){
            setID1(getFGB());
            setID2(getVRG());
            parm = "PF10";
        } else if (parm === 'F11'){
            parm = _runCANCEL(parm);
        }
        _sysvar.RET = parm + _spaces.substr(0, 4 - parm.length);
        return _sysvar.RET;
    };

    /*
     * @private
     */

    var _runCANCEL = function (parm){
        var fparm;

        if (getFGB() !== getID1() || getVRG() !== getID2()){
            if (!O2G.Resource.menue.vorgang[getID1() + getID2()]){
                parm = 'SHOW';
                setFNR('9040');
                setFPARM(1, getID1() + getID2());
                setID1(getFGB());
                setID2(getVRG());
                return parm;
            }
        }

        if (O2G.Resource.tfolge[getFGB() + getVRG()] && O2G.Resource.tfolge[getFGB() + getVRG()].exitnr && !_inetfolge[_slevel].aktiv){
            _inetfolge[_slevel].fkey = parm;
            parm = 'ETFO';
            _savedid = getID1() + getID2() + getID4();
            setID1(getFGB());
            setID2(getVRG());
        } else {
            if (parm === 'F11'){
                if (getID2() === O2G.Config.MASTERMENUE){
                    setID1(O2G.Config.MASTER);
                } else {
                    setID1(getFGB());
                    setID2(O2G.Config.MASTERMENUE);
                }
                if (O2G.Config.DEBUG){
                    console.debug("MENUE(F11) " + getID1() + getID2())
                }
            }
            parm = 'CANC';
            if (_slevel === "S0"){
                if (getFGB() !== getID1() || getVRG() !== getID2()){
                    setFGB(getID1());
                    setVRG(getID2());
                }
            } else {
                fparm = getID1() + getID2();
                if (O2G.Config.DEBUG){
                    console.debug("goback from savefolge[" + _slevel + "]" + O2G.Resource.tfolge[getID1() + getID2()]);
                }
                delete _tfstack[_slevel];
                delete _tfstacksave[_slevel];
                setSLevel("-1");
                setTFStepFromSave();
                setFROM('A');
                setCopyMPPTR();
                parm = 'SAVE';
                setFNR('9054');
                setFPARM(9, fparm);
            }
        }
        if (parm !== "SHOW" && parm !== "SAVE"){
            getCurrentTFStep().started = false;
            setVORW(' ');
        }
        return parm;
    };

    var getRET = function (){
        return _sysvar.RET;
    };
    /**
     * @desc control data input for application program
     */
    var setFROM = function (parm) {
        _sysvar.FROM = parm.substr(0, 1);
    };
    var getFROM = function () {
        return _sysvar.FROM;
    };
    /**
     * @desc Parameter from tfolge
     */
    var setPARM = function (parm) {
        if (parm.length > 256) {
            parm = parm.substr(0, 256);
        }
        _sysvar.PARM = parm + _spaces.substr(0, 256 - parm.length);
    };
    /**
     * @desc Save Level
     */
    var setSAVE = function (parm) {
        _sysvar.SAVE = parm.substr(1);
    };
    /**
     * @desc Fachgebiet
     */
    var setFGB = function (parm) {
        _sysvar.FGB = (parm + _spaces.substr(0, 3 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        if (_sysvar.FGB === "   ") {
            _sysvar.FGB = O2G.Config.MASTER;
        }
    };
    var getFGB = function () {
        return _sysvar.FGB;
    };
    /**
     * @desc Vorgang
     */
    var setVRG = function (parm) {
        _sysvar.VRG = (parm + _spaces.substr(0, 3 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        if (_sysvar.VRG === "   ") {
            _sysvar.VRG = O2G.Config.MASTERMENUE;
        }
    };
    var getVRG = function () {
        return _sysvar.VRG;
    };
    /**
     * @desc Fachgebiet
     */
    var setID1 = function (parm) {
        _sysvar.ID1 = (parm + _spaces.substr(0, 3 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        if (_sysvar.ID1 === "   ") {
            _sysvar.ID1 = O2G.Config.MASTER;
        }
    };
    var getID1 = function () {
        return _sysvar.ID1;
    };
    /**
     * @desc Vorgang
     */
    var setID2 = function (parm) {
        _sysvar.ID2 = (parm + _spaces.substr(0, 3 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
        if (_sysvar.ID2 === "   ") {
            _sysvar.ID2 = O2G.Config.MASTERMENUE;
        }
    };
    var getID2 = function () {
        return _sysvar.ID2;
    };
    /**
     * @desc OB for SAVE
     */
    var setSAVEOB = function (parm) {
        _sysvar.SAVEOB = (parm + _spaces.substr(0, 40 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
    };

    var getSAVEOB = function () {
        return _sysvar.SAVEOB.substr(0, 40);
    };

    /**
     * @desc new OB
     */
    var setID4 = function (parm) {
        if (!parm) {
            parm = ' ';
        }
        if (parm.trim() === '-' && getID5().trim()) {
            parm = getID5().trim();

            /*      } else if (parm.trim() && parm.trim().toUpperCase() === 'X') {
             setID4(' ');
             setID5(' ');
             */
        } else if (parm.length < 3 && parseInt(parm, 10) > 0 && parseInt(parm, 10) < 99) {
            var value;
            value = '';
            O2G.GUI.$Screen.children('div[class="lineob"]').each(
                function () {
                    var obfieldid, singlevalue;
                    if (value) {
                        return;
                    }
                    if (parseInt($(this).attr('linenr'), 10) === parseInt(parm, 10)) {
                        obfieldid = $(this).attr('ob').split(',');
                        obfieldid.forEach(function (fieldid) {
                            singlevalue = $('#' + fieldid, O2G.GUI.$Screen).text();
                            if (singlevalue) {
                                value += singlevalue + ',';
                            }
                        });
                        if (value) {
                            parm = value.substr(0, value.length - 1);
                        }
                    }
                }
            );

            if (!value) {
                O2G.GUI.$Screen.children('div[class="linefieldob"]').each(
                    function () {
                        if (value) {
                            return;
                        }
                        $('div', $(this)).each(
                            function () {
                                if ($(this).hasClass('fieldob') && parseInt($(this).attr('fieldob'), 10) === parseInt(parm, 10)) {
                                    value += $(this).text() + ',';
                                }
                            }
                        );
                        if (value) {
                            parm = value.substr(0, value.length - 1);
                        }
                    }
                );

            }
        }

        if (parm.trim() && parm.trim() !== '-'){
            setID5(parm.trim());
        }
        _sysvar.ID4 = (parm + _spaces.substr(0, 40 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
    };

    var getID4 = function () {
        return _sysvar.ID4.substr(0, 40);
    };
    /**
     * @desc old OB
     */
    var setID5 = function (parm) {
        _sysvar.ID5 = (parm + _spaces.substr(0, 40 - parm.length)).replace("ß", '\n').toUpperCase().replace("\n", 'ß');
    };
    var getID5 = function () {
        return _sysvar.ID5.substr(0, 40);
    };

    /**
     * @desc CICSTransactionID from TFolge
     */
    var setTransId = function (parm) {
        _transid = parm + _spaces.substr(0, 4 - parm.length);
    };
    var getTransId = function () {
        return _transid;
    };

    /**
     * @desc CICSTransactionID Uppercase Setting from TFolge
     */
    var setUC = function (parm) {
        _uc = parm;
    };
    var getUC = function () {
        return _uc;
    };

    /**
     * @param {string} parm
     * @desc stores/retrieve CICSProgramName from TFolge
     */
    var setProgram = function (parm) {
        _program = parm;
    };
    var getProgram = function () {
        return _program;
    };

    var setCopy = function (parm) {
        if (!parm && O2G.GUI.screenid){
            parm = O2G.Util.setHexString(parseInt(O2G.GUI.screenlist[O2G.GUI.screenid].iCopyLength, 10), '00');
        }
        var mpptr = getMPPTR();
        var stackentry = O2G.TCntrl.getCurrentTFStackEntry();
        if (!stackentry[2]) {
            stackentry[2] = {};
        }
        var page = {};
        page.P = parm;
        page.V = getVORW();
        stackentry[2]['P' + mpptr] = page.P;
        stackentry[2]['V' + mpptr] = page.V;
        if (getID2() === O2G.Config.MASTERMENUE){
            O2G.LocalStorage.set(O2G.Config.SYSENV + '_' + getID1() + getID2() + '_' + mpptr, page);
        }
        stackentry[2].mdb = O2G.TCntrl.offsetsmdb;
        stackentry[2].sysvar = JSON.stringify(_sysvar);
        var undo = _tfolge[_slevel][stackentry[0]][stackentry[1]].undo;
        if (undo === 'J' || undo === 'S') {
            stackentry[2].undo = undo;
        } else {
            stackentry[2].undo = '';
        }
        if (undo === 'S'){
            while (_tfstack[_slevel].length > 1){
                _tfstack[_slevel].shift();
            }
        }
    };

    var setOldCopy = function (parm) {
        O2G.TCntrl.getCurrentTFStackEntry()[2]['O' + getMPPTR()] = parm;
    };

    var getOldCopy = function () {
        return O2G.TCntrl.getCurrentTFStackEntry()[2]['O' + getMPPTR()];
    };

    var setCopyMPPTR = function () {
        if (getCurrentTFStackEntry()[2].sysvar){
            var sysvar = JSON.parse(getCurrentTFStackEntry()[2].sysvar);
            _sysvar.MPPTR = sysvar.MPPTR;
        }
    };

    var setMPPTRForShow = function (mpptr) {
        if (getCurrentTFStackEntry()[2].sysvar){
            var sysvar = JSON.parse(getCurrentTFStackEntry()[2].sysvar);
            sysvar.MPPTR = mpptr;
            getCurrentTFStackEntry()[2].sysvar = JSON.stringify(sysvar);
        }
    };

    var getCopy = function () {
        var screentmp, mpptr, page;
        screentmp = getCurrentTFStackEntry()[2];
        mpptr = getMPPTR();
        if (getID2() === O2G.Config.MASTERMENUE && (!screentmp || !screentmp['V' + mpptr])){
            page = O2G.LocalStorage.get(O2G.Config.SYSENV + '_' + getID1() + getID2() + '_' + mpptr);
            if (page){
                screentmp['V' + mpptr] = page.V;
                screentmp['P' + mpptr] = page.P;
            }
        }
        if (screentmp['V' + mpptr]) {
            setVORW(screentmp['V' + mpptr]);
        }
        return screentmp['P' + mpptr];
    };

    var loadTFolgeDbg = function (fgb, vrg, lastfn) {
        O2G.Util.traceDbg('loadTFolge', 'O2G.TCntrl');
        var ret = loadTFolge(fgb, vrg, lastfn);
        O2G.Util.traceDbg('<<< loadTFolge', 'O2G.TCntrl');
        return ret;
    };
    var loadTFolge = function (fgb, vrg, lastfn) {
        _afterloadtffn = lastfn;
        if (!O2G.Resource.menue.vorgang[fgb + vrg]){
            _afterloadtffn([]);
        } else {
            setID1(fgb);
            setID2(vrg);
            O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
        }
    };
    var checkScreensDbg = function () {
        O2G.Util.traceDbg('checkScreens', 'O2G.TCntrl');
        var ret = checkScreens();
        O2G.Util.traceDbg('<<< checkScreens', 'O2G.TCntrl');
        return ret;
    };

    var checkScreens = function () {
        _tfolge[_slevel] = O2G.Resource.tfolge[getID1() + getID2()].tf;
        O2G.TCntrl.loadScreens(O2G.TCntrl.getScreensFromTFolge(_tfolge[_slevel]), _getFirstTFStep);
    };

    var _getLastTF = function (current) {
        var _current = current - 1;
        if (!current) {
            return _current;
        }
        if (_tfstack[_slevel][current][0] === _tfstack[_slevel][_current][0]) {
            return _getLastTF(_current);
        } else {
            return _current;
        }
    };

    var _getFirstPgm = function (tf, step){
        if ((_tfolge[_slevel][tf][step].cond && _tfolge[_slevel][tf][step].cond[0] !== '^' && $.inArray(_tfolge[_slevel][tf][step].cond, _cond[_slevel]) !== -1) || (_tfolge[_slevel][tf][step].cond && _tfolge[_slevel][tf][step].cond[0] === '^' && $.inArray(_tfolge[_slevel][tf][step].cond.substr(1), _cond[_slevel]) === -1)){
            if (O2G.Config.DEBUG){
                console.debug('jump over ' + _tfolge[_slevel][tf][step].typ + ' ' + _tfolge[_slevel][tf][step].pgm + ' ' + _tfolge[_slevel][tf][step].tfnr + ' because cond ' + _tfolge[_slevel][tf][step].cond)
            }
            if (_tfolge[_slevel][tf].length > step + 1){
                _getFirstPgm(tf, step + 1);
            }
        } else {
            _tfstacksave[_slevel].push([tf, step]);
            if (O2G.Config.DEBUG){
                console.debug("push TC save " + _tfolge[_slevel][tf][step].typ + ' ' + _tfolge[_slevel][tf][step].pgm + ' ' + _tfolge[_slevel][tf][step].tfnr + ' ' + _tfolge[_slevel][tf][step].cond)
            }
            if (_tfolge[_slevel][tf][step].typ === 'F'){
                _getFirstPgm(_tfolge[_slevel][tf][step].tfnr, 0);
            } else {
                _tfstack[_slevel] = _tfstack[_slevel].concat(_tfstacksave[_slevel]);
                if (O2G.Config.DEBUG){
                    console.debug("push saved TC " + _tfstacksave[_slevel].length)
                }
                _tfstacksave[_slevel] = [];
                _tfpgmfound = true;
                _fillSYSVAR();
                if (O2G.Config.DEBUG){
                    console.debug("next PGM found " + getPID())
                }
            }
        }
    };

    var _getFirstPgmFromExit = function () {
        _inetfolge[_slevel].aktiv = true;
        setEXCODE(_inetfolge[_slevel].fkey);
        _tfstack[_slevel] = [];
        _getFirstPgm(O2G.Resource.tfolge[getFGB() + getVRG()].exitnr, 0);
        _afterloadtffn();
        return false;
    };

    var getNextTFStepDbg = function (sysret, current) {
        O2G.Util.traceDbg('getNextTFStep', 'O2G.TCntrl');
        var ret = getNextTFStep(sysret, current);
        O2G.Util.traceDbg('<<< getNextTFStep', 'O2G.TCntrl');
        return ret;
    };
    var getNextTFStep = function (sysret, current) {
        var _current, _tf, _step;

        if (current === -1){
            if (O2G.Resource.tfolge[getFGB() + getVRG()].exitnr && !_inetfolge[_slevel].aktiv){
                if (O2G.Config.DEBUG){
                    console.debug("skip to exitfolge " + O2G.Resource.tfolge[getID1() + getID2()].exitnr);
                }
                _inetfolge[_slevel].fkey = 'ENTR';
                return _getFirstPgmFromExit();
            } else if (_slevel === "S0"){
                if (_inetfolge[_slevel].fkey === 'F11'){
                    if (getID2() === O2G.Config.MASTERMENUE){
                        setFGB(O2G.Config.MASTER);
                        setID1(O2G.Config.MASTER);
                    } else {
                        setID1(getFGB());
                        setVRG(O2G.Config.MASTERMENUE);
                        setID2(O2G.Config.MASTERMENUE);
                    }
                    if (O2G.Config.DEBUG){
                        console.debug("MENUE(F11) " + getID1() + getID2())
                    }
                    O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
                    return false;
                } else {
                    if (_savedid){
                        setFGB(_savedid.substr(0, 3));
                        setID1(_savedid.substr(0, 3));
                        setVRG(_savedid.substr(3, 3));
                        setID2(_savedid.substr(3, 3));
                        _savedid = '';
                        O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
                    } else {
                        _getFirstTFStep();
                    }
                    return false;
                }
            } else {
                if (O2G.Config.DEBUG){
                    console.debug("goback from savefolge[" + _slevel + "]" + O2G.Resource.tfolge[getFGB() + getVRG()]);
                }
                delete _tfstack[_slevel];
                delete _tfstacksave[_slevel];
                setSLevel("-1");
                setTFStepFromSave();
                setRET('SAVE');
                setFROM('A');
                setCopyMPPTR();
                return true;
            }
        }

        if (sysret === "ETFO" && !_inetfolge[_slevel].aktiv){
            if (O2G.Config.DEBUG){
                console.debug("skip to exit folge(F3) " + O2G.Resource.tfolge[getFGB() + getVRG()].exitnr);
            }
            return _getFirstPgmFromExit();
        } else if (sysret === "ETFO" && _inetfolge[_slevel].aktiv){
            if (_slevel === "S0"){
                if (_inetfolge[_slevel].fkey === 'F11'){
                    if (getID2() === O2G.Config.MASTERMENUE){
                        setFGB(O2G.Config.MASTER);
                        setID1(O2G.Config.MASTER);
                    } else {
                        setID1(getFGB());
                        setVRG(O2G.Config.MASTERMENUE);
                        setID2(O2G.Config.MASTERMENUE);
                    }
                    if (O2G.Config.DEBUG){
                        console.debug("MENUE(F11) " + getID1() + getID2())
                    }
                    O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
                    return false;
                } else {
                    if (_savedid){
                        setFGB(_savedid.substr(0, 3));
                        setID1(_savedid.substr(0, 3));
                        setVRG(_savedid.substr(3, 3));
                        setID2(_savedid.substr(3, 3));
                        _savedid = '';
                        O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
                    } else {
                        _getFirstTFStep();
                    }
                    return false;
                }
            } else {
                if (O2G.Config.DEBUG){
                    console.debug("goback from savefolge[" + _slevel + "]" + O2G.Resource.tfolge[getFGB() + getVRG()]);
                }
                delete _tfstack[_slevel];
                delete _tfstacksave[_slevel];
                setSLevel("-1");
                setTFStepFromSave();
                setRET('SAVE');
                setFROM('A');
                setCopyMPPTR();
                return true;
            }
        } else if (sysret === "SAVE"){
            if (getSLevel() === 'S8'){
                setFNR('9035');
                return true;
            }
            setSLevel("+1");
            setID4(getSAVEOB().trim());
            setID5(' ');
            if (O2G.Config.DEBUG){
                console.debug("goto to savefolge[" + _slevel + "]" + O2G.Resource.tfolge[getFGB() + getVRG()]);
            }
            _tfstack[_slevel] = [];
            _tfstacksave[_slevel] = [];
            loadTFolge(getFGB(), getVRG(), _afterloadtffn);
            return false;
        } else if (sysret === "EXIT" && getID1() === getFGB() && getID2() === getVRG()){
            _current = current;
            if (_current === "start") {
                _current = _tfstack[_slevel].length - 1;
            }
            _tf = _tfstack[_slevel][_current][0];
            _step = _tfstack[_slevel][_current][1];
            _tfpgmfound = '';
            if (_tfolge[_slevel][_tf].length > _step + 1){
                _getFirstPgm(_tf, _step + 1);
                if (_tfpgmfound){
                    _afterloadtffn();
                    return false;
                } else {
                    if (O2G.Config.DEBUG){
                        console.debug("delete saved TC " + _tfstacksave[_slevel].length)
                    }
                    _tfstacksave[_slevel] = [];
                }
            }
            _current = _getLastTF(_current);

            return getNextTFStep(sysret, _current);
        } else if (sysret === "PF03"){
            if (O2G.Resource.tfolge[getID1() + getID2()].exitnr && !_inetfolge[_slevel].aktiv){
                if (O2G.Config.DEBUG){
                    console.debug("skip to exitfolge " + O2G.Resource.tfolge[getID1() + getID2()].exitnr);
                }
                _inetfolge[_slevel].fkey = 'PF03';
                _savedid = getFGB() + getVRG() + getID4();
                setFGB(getID1());
                setVRG(getID2());
                return _getFirstPgmFromExit();
            } else {
                setID1(getFGB());
                setID2(getVRG());
                if (O2G.Config.DEBUG){
                    console.debug("PF03(from PGM) " + getID1() + getID2())
                }
                O2G.Resource.loadTFolge(O2G.TCntrl.checkScreens);
                return false;
            }
        }
        return true;
    };

    var _checkUndo = function () {
        if (_tfstack[_slevel].length === 1) {
            return false;
        }
        return true;
    };


    var setTFStepFromUndoDbg = function (iter) {
        O2G.Util.traceDbg('setTFStepFromUndo', 'O2G.TCntrl');
        var ret = setTFStepFromUndo(iter);
        O2G.Util.traceDbg('<<< setTFStepFromUndo', 'O2G.TCntrl');
        return ret;
    };

    var setTFStepFromUndo = function (iter) {
        var pool;
        if (iter === -1){
            iter = _tfstack[_slevel].length;
            _tfstacksave[_slevel] = [];
        }

        if (iter){
            _tfstacksave[_slevel].unshift(_tfstack[_slevel].pop());
            iter = _tfstack[_slevel].length;
            if (iter && _tfstack[_slevel][_tfstack[_slevel].length - 1][2]
                //              && _tfstack[_slevel][_tfstack.length-1][2].mdb 
                && _tfstack[_slevel][_tfstack[_slevel].length - 1][2].undo){
                _tfstacksave[_slevel] = [];
                _tfstacksave[_slevel] = _tfstacksave[_slevel].concat(_tfstack[_slevel]);
                iter = 0;
            }
            return O2G.TCntrl.setTFStepFromUndo(iter);
        } else if (_tfstacksave[_slevel].length){
            _tfstack[_slevel] = [];
            _tfstack[_slevel] = _tfstack[_slevel].concat(_tfstacksave[_slevel]);
            _tfstacksave[_slevel] = [];
            pool = _tfstack[_slevel][_tfstack[_slevel].length - 1][2].mdb;
            _sysvar = JSON.parse(_tfstack[_slevel][_tfstack[_slevel].length - 1][2].sysvar);
            _fillSYSVAR();
            if (O2G.Config.DEBUG){
                console.debug("PGM for undo found " + getPID())
            }
        }
        return pool;
    };

    var setTFStepFromSave = function () {
        O2G.TCntrl.offsetsmdb = _tfstack[_slevel][_tfstack[_slevel].length - 1][2].mdb;
        _sysvar = JSON.parse(_tfstack[_slevel][_tfstack[_slevel].length - 1][2].sysvar);
        _fillSYSVAR();
        if (O2G.Config.DEBUG){
            console.debug("PGM after SAVE Cancel found " + getPID())
        }

    };

    var getCurrentTFStepDbg = function () {
        O2G.Util.traceDbg('getCurrentTFStep', 'O2G.TCntrl');
        var ret = getCurrentTFStep();
        O2G.Util.traceDbg('<<< getCurrentTFStep', 'O2G.TCntrl');
        return ret;
    };

    var getCurrentTFStep = function () {
        var _current;
        _current = _tfstack[_slevel].length - 1;
        return _tfolge[_slevel][_tfstack[_slevel][_current][0]][_tfstack[_slevel][_current][1]];
    };

    var getCurrentTFStackEntryDbg = function () {
        O2G.Util.traceDbg('getCurrentTFStackEntry', 'O2G.TCntrl');
        var ret = getCurrentTFStackEntry();
        O2G.Util.traceDbg('<<< getCurrentTFStackEntry', 'O2G.TCntrl');
        return ret;
    };

    var getCurrentTFStackEntry = function () {
        return _tfstack[_slevel][_tfstack[_slevel].length - 1];
    };

    var _getFirstTFStep = function () {
        _savedid = '';
        _inetfolge[_slevel] = {
            aktiv: false,
            fkey: ''
        };
        _sysvar.RET = 'ENTR';
        O2G.TCntrl.offsetsmdb = '';
        _tfstack[_slevel] = [];
        _getCondFromTFolge(_tfolge[_slevel]);
        _getFirstPgm(0, 0);
        _afterloadtffn();
    };

    var loadScreensDbg = function (screenlist, nextfn) {
        O2G.Util.traceDbg('loadScreens', 'O2G.TCntrl');
        var ret = loadScreens(screenlist, nextfn);
        O2G.Util.traceDbg('<<< loadScreens', 'O2G.TCntrl');
        return ret;
    };

    var loadScreens = function (screenlist, nextfn) {
        var _screen, _nextscreenfn;

        if (screenlist.length) {
            _screen = screenlist.shift();
            _nextscreenfn = function () {
                O2G.TCntrl.loadScreens(screenlist, nextfn);
            };
            if (O2G.GUI.screenlist[_screen]){
                _nextscreenfn();
            } else {
                O2G.GUI.screenid = _screen;
                O2G.Resource.prepareScreen(_nextscreenfn);
            }
        } else {
            nextfn();
        }
    };

    var getScreensFromTFolgeDbg = function (tfolge) {
        O2G.Util.traceDbg('getScreensFromTFolge', 'O2G.TCntrl');
        var ret = getScreensFromTFolge(tfolge);
        O2G.Util.traceDbg('<<< getScreensFromTFolge', 'O2G.TCntrl');
        return ret;
    };

    var getScreensFromTFolge = function (tfolge) {
        var _screenlist;
        _screenlist = [];
        $.each(tfolge, function (key, tf) {
            $.each(tf, function (key, tfstep) {
                if (tfstep.screen){
                    _screenlist.push(tfstep.screen)
                }
            });
        });
        return _screenlist;
    };

    var _getCondFromTFolge = function (tfolge) {
        var _cond;
        _condlist[_slevel] = [];
        $.each(tfolge, function (key, tf) {
            $.each(tf, function (key, tfstep) {
                if (tfstep.cond){
                    if (tfstep.cond[0] === '^'){
                        _cond = tfstep.cond.substr(1);
                    } else {
                        _cond = tfstep.cond;
                    }
                    if ($.inArray(_cond, _condlist[_slevel]) === -1){
                        _condlist[_slevel].push(_cond);
                    }
                }
            });
        });
    };

    _export = {

        VERSION: '$Revision: 35 $',

        // Variablen, die von anderen Modulen des O2G Paketes verwendet werden
        SYSVAR: '',
        LASTTXID: '',
        offsetsmdb: '',
        slevel: 'S0',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        setSYSVAR: setSYSVAR,
        init: init,
        loadTFolge: loadTFolge,
        checkScreens: checkScreens,
        loadScreens: loadScreens,
        getNextTFStep: getNextTFStep,
        createSYSVAR: createSYSVAR,
        createCONDLIST: createCONDLIST,
        setCOND: setCOND,
        setTransId: setTransId,
        setProgram: setProgram,
        getCurrentTFStep: getCurrentTFStep,
        getScreensFromTFolge: getScreensFromTFolge,
        getCurrentTFStackEntry: getCurrentTFStackEntry,
        setTFStepFromUndo: setTFStepFromUndo,
        getTransId: getTransId,
        getSLevel: getSLevel,
        setSLevel: setSLevel,
        getUC: getUC,
        getProgram: getProgram,
        setPID: setPID,
        getPID: getPID,
        setFROM: setFROM,
        getFROM: getFROM,
        setRET: setRET,
        getRET: getRET,
        setPARM: setPARM,
        setFGB: setFGB,
        setVRG: setVRG,
        getFGB: getFGB,
        getVRG: getVRG,
        setID1: setID1,
        setID2: setID2,
        setID4: setID4,
        getID1: getID1,
        getID2: getID2,
        getID4: getID4,
        setID5: setID5,
        getID5: getID5,
        getVORW: getVORW,
        setVORW: setVORW,
        getERASE: getERASE,
        setMPPTR: setMPPTR,
        getMPPTR: getMPPTR,
        setCopy: setCopy,
        setOldCopy: setOldCopy,
        setCopyMPPTR: setCopyMPPTR,
        setMPPTRForShow: setMPPTRForShow,
        getCopy: getCopy,
        getOldCopy: getOldCopy,
        getFPARM: getFPARM,
        setFPARM: setFPARM,
        setFNR: setFNR,
        getFNR: getFNR
    };

    if (O2G.Config.DEBUG){
        _export.loadTFolge = loadTFolgeDbg;
        _export.checkScreens = checkScreensDbg;
        _export.loadScreens = loadScreensDbg;
        _export.getNextTFStep = getNextTFStepDbg;
        _export.getCurrentTFStep = getCurrentTFStepDbg;
        _export.getScreensFromTFolge = getScreensFromTFolgeDbg;
        _export.getCurrentTFStackEntry = getCurrentTFStackEntryDbg;
        _export.setTFStepFromUndo = setTFStepFromUndoDbg;
        _export.setRET = setRETDbg;
    }

    return _export;

})();

O2G.TCntrl.init();