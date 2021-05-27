import { GenericCommands } from '../commands/generic-commands';
import { TruthOrDareCommands } from '../commands/truth-or-dare-commands';
import { KeywordCommands } from '../commands/keyword-commands';
import { HoroscopeCommands } from '../commands/horoscope-commands';

export default {
    help: { class: GenericCommands, method: 'help' },
    addadmin: { class: GenericCommands, method: 'addAdmin' },
    removeadmin: { class: GenericCommands, method: 'removeAdmin' },

    truth: { class: TruthOrDareCommands, method: 'truth' },
    truthadd: { class: TruthOrDareCommands, method: 'addTruth' },
    truthremove: { class: TruthOrDareCommands, method: 'deleteTruth' },
    truthdelete: { class: TruthOrDareCommands, method: 'deleteTruth' },
    dare: { class: TruthOrDareCommands, method: 'dare' },
    dareadd: { class: TruthOrDareCommands, method: 'addDare' },
    dareremove: { class: TruthOrDareCommands, method: 'deleteDare' },
    darerdelete: { class: TruthOrDareCommands, method: 'deleteDare' },

    keywordadd: { class: KeywordCommands, method: 'addKeyword' },
    keywordremove: { class: KeywordCommands, method: 'deleteKeyword' },
    keyworddelete: { class: KeywordCommands, method: 'deleteKeyword' },
    keywords: { class: KeywordCommands, method: 'keywords' },

    horoscope: { class: HoroscopeCommands, method: 'getHoroscope' },
    star: { class: HoroscopeCommands, method: 'getHoroscope' },
    crystalball: { class: HoroscopeCommands, method: 'crystalBall' },
    cb: { class: HoroscopeCommands, method: 'crystalBall' },
}
