/* jslint asi:true, browser:true */
/* global CSSRule */

var Export = {
    exportNode: null,
    getHTML: null,
    init: null,
    readStyleSheet: null,
}

Export.readStyleSheet = function(ss) {
    var i;
    var styles = "";
    var imports = "";
    if (!ss.cssRules) return;
    for (i = 0; i < ss.cssRules.length; i++) {
        if (ss.cssRules.item(i).type === CSSRule.IMPORT_RULE) {
            if (ss.cssRules.item(i).href.indexOf(":") === -1 || ss.cssRules.item(i).href.substr(0, window.location.origin) === window.location.origin) {
                styles += Export.readStyleSheet(ss.cssRules.item(i).styleSheet).styles;
                imports += Export.readStyleSheet(ss.cssRules.item(i).styleSheet).imports;
            }
            else imports += ss.cssRules.item(i).cssText;
        }
        else styles += ss.cssRules.item(i).cssText;
    }
    return {styles: styles, imports: imports};
}

Export.getHTML = function() {
    var i;
    var s = "<!DOCTYPE html>\n<!--  " + document.title + ", originally located at " + window.location.href + '  -->\n<html lang="' + document.documentElement.lang + '">\n    <head>\n';
    for (i = 0; i < document.head.children.length; i++) {
        switch (document.head.children.item(i).tagName) {
            case "LINK":
                if (document.head.children.item(i).type == "text/css") s += "        <style>" + Export.readStyleSheet(document.head.children.item(i).sheet).imports + Export.readStyleSheet(document.head.children.item(i).sheet).styles + "</style>\n";
                break;

            case "SCRIPT":
                s += "        <!--  script omitted  -->\n";
                break;

            default:
                s += "        " + document.head.children.item(i).outerHTML + "\n";
                break;
        }
    }
    s += "    </head>\n    " + document.body.outerHTML + "\n</html>";
    return s;
}

Export.exportNode = function(node) {
    var s = "";
    var i;
    switch (node.nodeType) {

        case Node.TEXT_NODE:
            s = node.textContent.replace(/\s+/, " ");
            break;

        case Node.ELEMENT_NODE:
            if (node.classList.contains("export-link") || node.classList.contains("export-hidden")) break;
            for (i = 0; i < node.childNodes.length; i++) {
                s += Export.exportNode(node.childNodes.item(i))
            }
            switch (node.tagName) {

                case "A":
                    s += " [" + node.href + "]";
                    break;

                case "ASIDE":
                    s = "\n[[" + s + "]]\n";
                    break;

                case "B":
                    s = "#" + s.replace(/\s+/g, "-");
                    break;

                case "BLOCKQUOTE":
                    s = ("\n" + s.replace(/\s+$/, "").replace(/^\s+/, "")).replace(/\s*\n\s*/g, "\n").replace(/\n/g, "\n > ");
                    break;

                case "BR":
                    s = "\n";
                    break;

                case "CODE":
                    s = "'" + s.trim() + "'";
                    break;

                case "DEL":
                    s = "[deleted]";
                    break;

                case "DFN":
                    s = "_" + s.trim() + "_";
                    break;

                case "DT":
                    s = "\n" + s + ": ";
                    break;

                case "EM":
                    s = "~" + s.trim() + "~";
                    break;

                case "FIGCAPTION":
                    s = "\n– " + s + "\n";
                    break;

                case "FIGURE":
                    s = "\n" + s + "\n";
                    break;

                case "H1":
                    s = "\n" + s.toLocaleUpperCase() + "\n";
                    break;

                case "H2":
                    s = "\n~ " + s + " ~\n";
                    break;

                case "H3":
                    s = "\n> " + s + ":\n";
                    break;

                case "H4":
                    s = "\n>> " + s + ":\n";
                    break;

                case "H5":
                    s = "\n>>> " + s + ":\n";
                    break;

                case "H6":
                    s = "\n>>>> " + s + ":\n";
                    break;

                case "HR":
                    s = "\n* * *\n";
                    break;

                case "I":
                    s = "'" + s.trim() + "'";
                    break;

                case "IFRAME":
                    s = "\n[" + node.src + "]\n";
                    break;

                case "IMG":
                    if (node.alt) s = "[image, " + node.alt + "]";
                    else s = "[image]";
                    break;

                case "INS":
                    s = "_" + s.replace(/\s+/g, "_") + "_";
                    break;

                case "LI":
                    if (node.parentElement.tagName === "OL") {
                        for (i = 0; i < node.parentElement.children.length; i++) {
                            if (node.parentElement.children.item(i) === node) break;
                        }
                        s = "\n" + (i + 1) + ". " + s + "\n";
                    }
                    else s = "\n· " + s + "\n";
                    break;

                case "P":
                    if (window.getComputedStyle(node, "::before").getPropertyValue("content") == '"¶"') s = "\n¶ " + s + "\n";
                    else if (window.getComputedStyle(node, "::after").getPropertyValue("content") == "no-close-quote") s = "\n“" + s + "\n";
                    else if (window.getComputedStyle(node, "::after").getPropertyValue("content") == "close-quote") s = "\n“" + s + "”\n";
                    else s = "\n" + s + "\n";
                    break;

                case "Q":
                    s = "“" + s + "”";
                    break;

                case "SMALL":
                    s = "((" + s.trim() + "))";
                    break;

                case "S":
                    s = "-" + s.replace(/\s+/, "-") + "-";
                    break;

                case "STRONG":
                    s = s.toLocaleUpperCase();
                    break;

                case "SUB":
                    s = "_[" + s.trim() + "]";
                    break;

                case "SUP":
                    s = "^[" + s.trim() + "]";
                    break;
            }
            break;

        default:
            break;

    }
    return s.replace(/ +/g, " ").replace(/ *\n */g, "\n").replace(/\n+/g, "\n");
}

Export.init = function() {
    if (document.documentElement.dataset.noDownload !== undefined || !document.getElementsByTagName("MAIN")) return;
    var plaintext = Export.exportNode(document.getElementsByTagName("MAIN").item(0)).trim()
    var html = Export.getHTML();
    var footer = document.createElement("FOOTER");
    footer.innerHTML = 'download: <a href="data:text/plain;charset=utf-8,' + encodeURIComponent(plaintext) + '" target="_blank">plain text</a> / <a href="data:text/html;charset=utf-8,' + encodeURIComponent(html) + '" target="_blank">html</a>';
    document.getElementsByTagName("MAIN").item(0).appendChild(footer);
    document.styleSheets.item(0).insertRule("@media print{main > footer:last-child {display: none;}}", document.styleSheets.item(0).cssRules.length);
}
