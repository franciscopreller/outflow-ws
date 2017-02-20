class AnsiHTML {
    static get styles() {
        return {
            bold: "font-weight",
            underline: "text-decoration",
            color: "color",
            background: "background"
      };
    }
    // not implemented: italic, blink, invert, strikethrough
    static get table() {
        return {
            0: null,
            1: { bold: true },
            3: { italic: true },
            4: { underline: true },
            5: { blink: true },
            6: { blink: true },
            7: { invert: true },
            9: { strikethrough: true },
            23: { italic: false },
            24: { underline: false },
            25: { blink: false },
            27: { invert: false },
            29: { strikethrough: false },
            30: { color: 'grey' },
            31: { color: 'red' },
            32: { color: 'green' },
            33: { color: 'yellow' },
            34: { color: 'blue' },
            35: { color: 'magenta' },
            36: { color: 'cyan' },
            37: { color: 'white' },
            39: { color: null },
            40: { background: 'black' },
            41: { background: 'red' },
            42: { background: 'green' },
            43: { background: 'yellow' },
            44: { background: 'blue' },
            45: { background: 'magenta' },
            46: { background: 'cyan' },
            47: { background: 'white' },
            49: { background: null },
        }
    };
    static parse(str) {
        let char;
        let collect = false;
        let openTags = 0;
        let props = {};
        let collected = '';
        let parsed = '';
        let styledText = '';
        for (let i = 0; i < str.length; i++) {
            char = str[i];
            switch (char) {
                case ' ':
                    if (!collect) {
                        parsed += '&nbsp;';
                    }
                    break;
                case '\u001b':
                    collect = (str[i+1] && str[i+1] === '[');
                    break;
                case '[':
                    if (collect) break;
                case 'm':
                    if (collect) {
                        collect = false;
                        if (collected !== '0') {
                            props = {};
                            openTags++
                            props = Object.assign(props, collected.split(';').map(c => this.table[c]).reduce((a, b) => {
                                for (let k in b) {
                                    a[k] = b[k];
                                }
                                return a;
                            }, {}));
                            parsed += this.openTag(props);
                        } else {
                            parsed += this.closeTags(openTags);
                            openTags = 0;
                        }
                        collected = '';
                        break;
                    }
                default:
                    if (collect) collected += char;
                    else parsed += char;
                    break;
            }
        }
        return parsed.replace(/(?:\r\n|\r|\n)/g, '<br>');
    }
    static style(props) {
        let key, val, style = [];
        for (let key in props) {
            val = props[key];
            if (!val) continue;
            if (val == true) {
                style.push(this.styles[key] + ':' + key);
            } else {
                style.push(this.styles[key] + ':' + val);
            }
        }
        return style.join(';');
    }
    static openTag(props) {
        return '<span style="' + this.style(props) + '">';
    }
    static closeTags(num) {
        let output = [];
        for (let i = 0; i < num; i++) {
            output.push('</span>');
        }
        return output.join('');
    }
}
module.exports = AnsiHTML;
