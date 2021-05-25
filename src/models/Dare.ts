import { Schema, model, Document } from 'mongoose';

interface IDare extends Document {
    guildId: string | null,
    dareId: number | null,
    type: string,
    dare: string,
    addedBy: string,
}

const DareSchema = new Schema({
    guildId: {
        type: String,
        required: false,
        default: null,
    },
    dareId: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    dare: {
        type: String,
        required: true,
    },
    addedBy: {
        type: String,
        required: true,
    },
});

const Dare = model<IDare>('Dare', DareSchema);

export { Dare, DareSchema, IDare };
