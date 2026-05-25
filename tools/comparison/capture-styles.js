// Computed-style capture for the comparison harness, evaluated in-page by
// `agent-browser eval`. Returns JSON: { "<data-compare key>": { <prop>: <value> } }.
//
// Why the gymnastics: analyst-ui emits colors as rgb() while Blueprint v6.15 emits
// oklch()/oklab()/color(srgb …). To compare apples-to-apples we render every color
// token to a 1×1 canvas and read the pixel back as rgb — getComputedStyle/canvas
// fillStyle now PRESERVE the authored color space, so only getImageData normalizes.
// We also drop noise that differs by implementation strategy but not by appearance:
// invisible (zero-width) border colors, and Tailwind's transparent no-op shadow layers.
(() => {
    // Props that are both meaningful AND comparable across the two implementations.
    // Deliberately omitted: fontFamily / lineHeight / vertical padding / borderStyle —
    // analyst (flex + fixed height) and Blueprint (padding + line-height) diverge there
    // structurally while looking identical; height + the screenshots cover sizing.
    var PROPS = [
        "color",
        "backgroundColor",
        "borderTopColor",
        "borderTopWidth",
        "borderBottomColor",
        "borderBottomWidth",
        "borderRightColor",
        "borderRightWidth",
        "borderRadius",
        "boxShadow",
        "fontSize",
        "fontWeight",
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",
        "paddingLeft",
        "paddingRight",
        "height",
        "minWidth",
        // SVG/stroke props — for Spinner track/head path elements.
        "stroke",
        "strokeWidth",
        "strokeDasharray",
        "strokeDashoffset",
        "strokeLinecap",
        "fillOpacity",
    ];

    var cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    var cx = cv.getContext("2d");
    function toRgb(color) {
        cx.clearRect(0, 0, 1, 1);
        cx.fillStyle = "#000";
        cx.fillStyle = color; // ignored if unparseable, leaving the #000 reset
        cx.fillRect(0, 0, 1, 1);
        var d = cx.getImageData(0, 0, 1, 1).data;
        if (d[3] === 255) return "rgb(" + d[0] + ", " + d[1] + ", " + d[2] + ")";
        return "rgba(" + d[0] + ", " + d[1] + ", " + d[2] + ", " + +(d[3] / 255).toFixed(3) + ")";
    }

    // Replace each color token anywhere in a value (incl. inside box-shadow) with rgb().
    var COLOR_RE = /(?:oklch|oklab|lab|lch|color|rgba?|hsla?)\([^)]*\)|#[0-9a-fA-F]{3,8}/g;
    function normColors(v) {
        return typeof v === "string"
            ? v.replace(COLOR_RE, function (m) {
                  try {
                      return toRgb(m);
                  } catch (e) {
                      return m;
                  }
              })
            : v;
    }

    // Split a multi-layer box-shadow on top-level commas (not the commas inside rgba()).
    function cleanShadow(v) {
        if (v === "none" || !v) return v;
        var layers = v.split(/,(?![^(]*\))/g).map(function (s) {
            return s.trim();
        });
        var kept = layers.filter(function (l) {
            // Drop Tailwind's transparent no-op layers: rgba(0, 0, 0, 0) 0px 0px 0px 0px
            return !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(l);
        });
        return kept.length ? kept.join(", ") : "none";
    }

    var out = {};
    var els = document.querySelectorAll("[data-compare]");
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var s = getComputedStyle(el);
        var rec = {};
        for (var j = 0; j < PROPS.length; j++) {
            var p = PROPS[j];
            rec[p] = normColors(s[p]);
        }
        rec.boxShadow = cleanShadow(rec.boxShadow);
        // A zero-width border's color is invisible — comparing it is pure noise.
        if (parseFloat(s.borderTopWidth) === 0) delete rec.borderTopColor;
        if (parseFloat(s.borderBottomWidth) === 0) delete rec.borderBottomColor;
        if (parseFloat(s.borderRightWidth) === 0) delete rec.borderRightColor;
        // SVG guard: if strokeWidth is 0 (or absent / not an SVG element), drop stroke
        // color props so non-SVG specimens of other components don't generate false diffs.
        if (parseFloat(s.strokeWidth) === 0 || !s.strokeWidth || s.strokeWidth === "") {
            delete rec.stroke;
            delete rec.strokeWidth;
            delete rec.strokeDasharray;
            delete rec.strokeDashoffset;
            delete rec.strokeLinecap;
            delete rec.fillOpacity;
        }
        out[el.getAttribute("data-compare")] = rec;
    }
    return JSON.stringify(out);
})();
