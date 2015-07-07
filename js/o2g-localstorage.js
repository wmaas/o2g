/**
 * @desc Das Modul O2G.LocalStorage stellt Funktionen für den lokalen Cache bereit.
 *
 */
O2G.LocalStorage = (function () {
    'use strict';
    // @private
    var _storage,
        _failed;

    /**
     * @desc Prüft ob LOCALSTORAGE vom Browser unterstützt wird
     */
    try {
        (_storage = window.localStorage).setItem('TEST', 'TEST');
        _failed = _storage.getItem('TEST') != 'TEST';
        _storage.removeItem('TEST');
        _failed && (_storage = false);
    } catch (e) {}

    if (!_storage) {
        alert(O2G.Config.TEXTE.STORAGE_ERROR);
        return;
    }
    /**
     * @desc Ablegen String(asis) oder Objekt(als JSON) im LOCALSTORAGE
     *
     */
    var set = function (key, value) {
        try {
            if (typeof value === 'object') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.debug(JSON.stringify(e));
            console.debug('Items in LOCALSTORAGE:' + localStorage.length);
            clearCache();
            if (typeof value === 'object') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
        }

    };
    /**
     * @desc Entfernen eines String oder Objekt vom LOCALSTORAGE
     *
     */
    var remove = function (key) {
        return localStorage.removeItem(key);
    };
    /**
     * @desc Entnehmen eines Strings oder Objektes aus dem LOCALSTORAGE
     *
     */
    var get = function (key) {
        var str = localStorage.getItem(key);
        if (str == null) {
            return '';
        }
        if (str && str[0] === '{') {
            str = JSON.parse(str);
        }
        return str;
    };
    /**
     * @desc Lösche alle Resourcen aus dem LOCALSTORAGE.
     */
    var clearCache = function () {
        var save = get('o2g_' + O2G.Config.HOSTNAME + '_style'),
            enter = get('o2g_' + O2G.Config.HOSTNAME + '_enter');
        localStorage.clear();
        save = save || 8;
        set('o2g_' + O2G.Config.HOSTNAME + '_style', save);
        set('o2g_' + O2G.Config.HOSTNAME + '_cachedate', O2G.Util.getDate());
        if (enter) {
            set('o2g_' + O2G.Config.HOSTNAME + '_enter', enter);
        }
    };

    /**
     * @desc Lösche alle Resourcen aus dem LOCALSTORAGE, wenn sich die Version von O2G geändert
     * hat (mit Restart der Anwendung)
     */
    if (!get('o2g_' + O2G.Config.HOSTNAME + '_cachedate') || get('o2g_' + O2G.Config.HOSTNAME + '_cachedate') !== O2G.Util.getDate()) {
        clearCache();
        O2G.Util.reload(true);
    }

    return {

        VERSION: '$Revision: 26 $',

        // Funktionen, die von anderen Modulen des O2G Paketes verwendet werden
        set: set,
        get: get,
        remove: remove,
        clearCache: clearCache
    };
})();