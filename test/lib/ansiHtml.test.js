const ansiHTML = require('../../src/lib/ansiHtml');

const output = `[0;37;40m> [31mWide Hallway[0;37;40m

   This wide hallway is illuminated simply by torch sconces filled with 
dark red coals. No glowing lichen has been used to brighten the passage.
It travels east and west, connecting guild rooms of varying purpose.

[1m[37m     Obvious exits are south, east, west, and north.
[0;37;40m
[0;37;40m>`;
const output2 = '[1m[37m';

describe('Parse ANSI', () => {

    it('should return correct ansiCodes', () => {
        const ansiCodes = ansiHTML.getCodes({ str: output2, index: 0 });
        expect(ansiCodes).to.have.all.keys('code', 'index');
        expect(ansiCodes.code).to.have.all.keys('types', 'background', 'foreground');
        expect(ansiCodes.index).to.equal(8);
        expect(ansiCodes.code.types).to.include('bold');
    });

    it('should transform output into an array of 9 lines', () => {
        const lines = ansiHTML.toLineObjects({ str: output });
        expect(lines).to.have.length.of(9);
    });
});
