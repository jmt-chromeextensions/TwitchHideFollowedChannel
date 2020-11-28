function salutator() {
    alert('eeee');
}

function localizeAllTexts() {
    document.querySelectorAll('[data-localize]').forEach(elem => {
        if (elem.getAttribute('data-localize') === "title")
            elem.title = getLocalizedText(elem.title);
        else
            elem.innerHTML = getLocalizedText(elem.innerHTML);
    });
}

function getLocalizedText(textWithKey) {
    let key = textWithKey.indexOf("__MSG_") != -1 ? textWithKey.substring(6) : textWithKey; //__MSG_
    return chrome.i18n.getMessage(key);
}
 
// https://stackoverflow.com/a/1909508/9252531
function delayFunction (callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

