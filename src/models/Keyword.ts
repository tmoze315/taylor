import { Schema, model, Document } from 'mongoose';

interface IKeyword extends Document {
    guildId: string | null,
    keywordId: number | null,
    keyword: string,
    searchableKeyword: string,
    responses: [string],

    addResponse: Function
}

const KeywordSchema = new Schema({
    guildId: {
        type: String,
        required: false,
        default: null,
    },
    keywordId: Number,
    keyword: String,
    searchableKeyword: String,
    responses: [String],
});

KeywordSchema.methods.addResponse = function (response: string) {
    this.responses.push(response);

    this.responses = [...new Set(this.responses)];

    return this.save();
}

const Keyword = model<IKeyword>('Keyword', KeywordSchema);

export { Keyword, KeywordSchema, IKeyword };
