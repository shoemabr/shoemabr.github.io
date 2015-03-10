/* jslint asi:true, browser:true */

var current_scroll_target = 0;
var current_scroll_velocity = 0;
var current_scroll_hash = "#";
var should_push_state = false;
var Request = new XMLHttpRequest();

var scripts = [
    "http://home.benjam.xyz/scripts/export-js/export.js"
]
var scripts_loaded = 0;

function loadSnippets() {
    Request.open("get", "/!DATA!/snippets/snippets.html", true);
    Request.responseType = "document";
    Request.addEventListener("load", function(){
        var snippet;
        var clone;
        var i;
        snippet = this.responseXML.getElementById("global-nav");
        clone = document.createElement("NAV");
        for (i = 0; i < snippet.childElementCount; i++) {
            if (snippet.children.item(i).lang == document.documentElement.lang) {
                clone.appendChild(document.importNode(snippet.children.item(i), true));
                break;
            }
        }
        if (clone.childElementCount !== 0) document.body.insertBefore(clone, document.body.firstElementChild);
    }, false);
    Request.send();
}

function displayAltLinks() {
    var i;
    var j;
    var alts;
    var altnav;
    var alt;
    if (!document.getElementById("alts")) return;
    alts = document.getElementById("alts").text.split(/\s*\n\s*/g);
    altnav = document.createElement("NAV");
    altnav.className = "alts";
    alt = document.createElement("A");
    alt.className = "alts-current";
    alt.href = document.location.href;
    alt.hreflang = document.documentElement.lang;
    alt.textContent = document.documentElement.lang.toUpperCase();
    altnav.appendChild(alt);
    for (i = 0; i < alts.length; i++) {
        if (alts[i].search(/\s*:\s*/) === -1) continue;
        alt = document.createElement("A");
        alt.href = alts[i].split(/\s*:\s*/g)[1];
        alt.hreflang = alts[i].split(/\s*:\s*/g)[0];
        alt.textContent = alts[i].split(/\s*:\s*/g)[0].toUpperCase();
        j = altnav.firstElementChild;
        while (j && j.textContent < alt.textContent) {
            j = j.nextElementSibling;
        }
        altnav.insertBefore(alt, j);
    }
    document.body.insertBefore(altnav, document.body.firstElementChild);
}

function scroll() {
    var max_scroll = window.scrollMaxY;
    if (max_scroll === undefined) max_scroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var current_scroll_location = window.scrollY + window.innerHeight / 3;
    if (Math.abs(current_scroll_location - current_scroll_target) > 1 && max_scroll - window.scrollY >= current_scroll_velocity && -1 * window.scrollY <= current_scroll_velocity) {
        current_scroll_velocity = (current_scroll_velocity + (current_scroll_target - current_scroll_location) * 1023 / document.body.scrollHeight) / 2;
        if (current_scroll_velocity > 0) window.scrollBy(0, Math.ceil(current_scroll_velocity));
        else window.scrollBy(0, Math.floor(current_scroll_velocity));
        window.requestAnimationFrame(scroll);
    }
    else {
        window.scrollBy(0, current_scroll_target - current_scroll_location);
        current_scroll_velocity = 0;
        if (should_push_state) window.history.pushState(null, "", current_scroll_hash);
    }
}

function navHashFromLink(e) {
    if (document.getElementById(this.hash.substr(1))) {
        current_scroll_target = document.getElementById(this.hash.substr(1)).getBoundingClientRect().top + window.scrollY;
        current_scroll_velocity = 0;
        current_scroll_hash = this.hash;
        should_push_state = true;
        window.requestAnimationFrame(scroll);
        e.preventDefault();
    }
}

function navHashFromLocation() {
    if (window.location.hash && document.getElementById(window.location.hash.substr(1))) {
        current_scroll_target = document.getElementById(window.location.hash.substr(1)).getBoundingClientRect().top + window.scrollY;
        current_scroll_velocity = 0;
        current_scroll_hash = window.location.hash;
        should_push_state = false;
        window.requestAnimationFrame(scroll);
    }
}

function checkLinks() {
    if (!document.documentElement.lang) return;
    var links = document.getElementsByTagName("A");
    var i;
    var append;
    for (i = 0; i < links.length; i++) {
        if (links.item(i).hreflang && links.item(i).hreflang != document.documentElement.lang) {
            append = document.createElement("small");
            append.textContent = " [" + links.item(i).hreflang + "]";
            links.item(i).appendChild(append);
        }
    }
}

function init() {

    loadSnippets();

    checkLinks();

    //  export-js
    var footer = document.createElement("FOOTER");
    Export.init(footer);
    document.getElementsByTagName("MAIN").item(0).appendChild(footer);
    document.styleSheets.item(0).insertRule("@media print{main > footer:last-child {display: none;}}", document.styleSheets.item(0).cssRules.length);

    displayAltLinks();

    var hashLinks = document.querySelectorAll('a[href^="#"]');

    for (var i = 0; i < hashLinks.length; i++) {
        hashLinks.item(i).addEventListener("click", navHashFromLink, false);
    }

    navHashFromLocation();
    window.addEventListener("popstate", navHashFromLocation, false);

}

function scriptLoaded() {
    scripts_loaded |= (1 << scripts.indexOf(this.src));
    if (scripts_loaded === ~(~0 << scripts.length)) init();
}

function loadScripts() {
    var i;
    var tag;
    for (i = 0; i < scripts.length; i++) {
        tag = document.createElement('script');
        tag.addEventListener("load", scriptLoaded, false);
        tag.type = "text/javascript";
        tag.src = scripts[i];
        document.head.insertBefore(tag, document.scripts.item(0));
    }
}

document.addEventListener("DOMContentLoaded", loadScripts, false);
