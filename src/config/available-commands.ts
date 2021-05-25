import { GenericCommands } from '../commands/generic-commands';
import { TruthOrDareCommands } from '../commands/truth-or-dare-commands';

export default {
    joke: { class: GenericCommands, method: 'playJoke' },
    jokes: { class: GenericCommands, method: 'playJoke' },

    jokeadd: { class: GenericCommands, method: 'addJoke' },
    jadd: { class: GenericCommands, method: 'addJoke' },

    jokedelete: { class: GenericCommands, method: 'deleteJoke' },
    jdelete: { class: GenericCommands, method: 'deleteJoke' },
    jokeremove: { class: GenericCommands, method: 'deleteJoke' },
    jremove: { class: GenericCommands, method: 'deleteJoke' },
    jrm: { class: GenericCommands, method: 'deleteJoke' },

    clear: { class: GenericCommands, method: 'clear' },
    jchannel: { class: GenericCommands, method: 'setMishkaChannel' },
    jbot: { class: GenericCommands, method: 'setMishkaBot' },
    jenable: { class: GenericCommands, method: 'enable' },
    jdisable: { class: GenericCommands, method: 'disable' },
    addadmin: { class: GenericCommands, method: 'addAdmin' },
    removeadmin: { class: GenericCommands, method: 'removeAdmin' },

    jokeimport: { class: GenericCommands, method: 'importJokes' },
    jimport: { class: GenericCommands, method: 'importJokes' },

    jsimilarity: { class: GenericCommands, method: 'testSimilarity' },

    truth: { class: TruthOrDareCommands, method: 'truth' },
    truthadd: { class: TruthOrDareCommands, method: 'addTruth' },
    truthremove: { class: TruthOrDareCommands, method: 'deleteTruth' },
    truthdelete: { class: TruthOrDareCommands, method: 'deleteTruth' },

    dare: { class: TruthOrDareCommands, method: 'dare' },
    dareadd: { class: TruthOrDareCommands, method: 'addDare' },
    dareremove: { class: TruthOrDareCommands, method: 'deleteDare' },
    darerdelete: { class: TruthOrDareCommands, method: 'deleteDare' },

    todchannel: { class: TruthOrDareCommands, method: 'setChannel' },
}
