import { Schema, model, Document } from 'mongoose';

interface IQuestion extends Document {
    guildId: string | null,
    questionId: number | null,
    type: string,
    question: string,
    addedBy: string,
}

const QuestionSchema = new Schema({
    guildId: {
        type: String,
        required: false,
        default: null,
    },
    questionId: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    addedBy: {
        type: String,
        required: true,
    },
});

const Question = model<IQuestion>('Question', QuestionSchema);

export { Question, QuestionSchema, IQuestion };
