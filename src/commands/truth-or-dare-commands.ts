import BaseCommands from "./base-commands";
import { makeSuccessMessage } from "../messages/success";
import { makeErrorMessage } from "../messages/error";
import { CollectorFilter, Message, MessageEmbed, MessageReaction } from "discord.js";
import { Question } from "../models/Question";
import { Dare } from "../models/Dare";

class TruthOrDareCommands extends BaseCommands {
    async truth(type: string = 'sfw') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!type || type.trim() === '') {
            type = 'sfw';
        }

        const query = <any>{
            guildId: guildId,
            type,
        };

        const questions = await Question.aggregate([
            { $match: query },
            { $sample: { size: 1 } },
        ]);

        if (!questions || questions.length < 1) {
            return channel.send(makeErrorMessage('Oops, I couldn\'t find any questions. Try adding one with `m/truthadd`'));
        }

        const question = questions[0];

        const messageEmbed = new MessageEmbed()
            .setTitle(question.question)
            .setFooter(`Truth - category: ${question.type} - id: #${question.questionId}`)
            .setColor('RANDOM');

        return channel.send(messageEmbed);
    }

    async addTruth(questionText: string = '') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!questionText) {
            return channel.send(makeErrorMessage(`You can add a question using the following format (use \`sfw\` or \`r\` as the categories)

            \`m/truthadd "This is the question" r\``));
        }

        const regex = new RegExp(/"(.*)" (.*)/gm);
        const matches = regex.exec(questionText);

        if (!matches || matches.length !== 3) {
            return channel.send(makeErrorMessage(`You can add a question using the following format (use \`sfw\` or \`r\` as the categories)

            \`m/truthadd "This is the question" r\``));
        }

        const [, questionString, type] = matches;

        const questionWithBiggestId = await Question.find({ guildId: guildId }).sort({ questionId: -1 }).limit(1);
        let biggestId = 0;

        if (questionWithBiggestId.length > 0) {
            biggestId = questionWithBiggestId[0]?.questionId || 0;
        }

        const questionId = biggestId + 1;

        const question = new Question({
            guildId: guildId,
            questionId,
            addedBy: authorId,
            question: questionString,
            type
        });

        await question.save();

        return channel.send(makeSuccessMessage(`Question (#${questionId}) successfully added!`));
    }

    async deleteTruth(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return channel.send(makeErrorMessage('Please add a question id (e.g. 3).'));
        }

        const question = await Question.findOne({ guildId: guildId, questionId: parseInt(params) });

        if (!question) {
            return channel.send(makeErrorMessage('Question not found with that id'));
        }

        await question.remove();

        return channel.send(makeSuccessMessage('Question was successfully deleted'));
    }

    async dare(type: string = 'sfw') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        const query = <any>{
            guildId: guildId,
        };

        if (type) {
            query.type = type;
        }

        const dares = await Dare.aggregate([
            { $match: query },
            { $sample: { size: 1 } },
        ]);

        if (!dares || dares.length < 1) {
            return channel.send(makeErrorMessage('Oops, I couldn\'t find any dares. Try adding one with `m/dareadd`'));
        }

        const dare = dares[0];

        const messageEmbed = new MessageEmbed()
            .setTitle(dare.dare)
            .setFooter(`Dare - category: ${dare.type} - id: #${dare.dareId}`)
            .setColor('RANDOM');

        return channel.send(messageEmbed);
    }

    async addDare(dareText: string = '') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!dareText) {
            return channel.send(makeErrorMessage(`You can add a dare using the following format (use \`sfw\` or \`r\` as the categories)

            \`m/dareadd "This is the dare" r\``));
        }

        const regex = new RegExp(/"(.*)" (.*)/gm);
        const matches = regex.exec(dareText);

        if (!matches || matches.length !== 3) {
            return channel.send(makeErrorMessage(`You can add a dare using the following format (use \`sfw\` or \`r\` as the categories)

            \`m/dareadd "This is the dare" r\``));
        }

        const [, dareString, type] = matches;

        const dareWithBiggestId = await Dare.find({ guildId: guildId }).sort({ dareId: -1 }).limit(1);
        let biggestId = 0;

        if (dareWithBiggestId.length > 0) {
            biggestId = dareWithBiggestId[0]?.dareId || 0;
        }

        const dareId = biggestId + 1;

        const dare = new Dare({
            guildId: guildId,
            dareId,
            addedBy: authorId,
            dare: dareString,
            type
        });

        await dare.save();

        return channel.send(makeSuccessMessage(`Dare (#${dareId}) successfully added!`));
    }

    async deleteDare(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        const guildFound = this.client?.guilds.cache.find((guild: any) => {
            return guild.id === guildId;
        });

        const channel: any = guildFound?.channels.cache.find((channel: any) => {
            return channel.id === channelId;
        });

        if (this.guild.enabled !== true || !channel) {
            return;
        }

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return channel.send(makeErrorMessage('Please add a dare id (e.g. 3).'));
        }

        const dare = await Dare.findOne({ guildId: guildId, dareId: parseInt(params) });

        if (!dare) {
            return channel.send(makeErrorMessage('Dare not found with that id'));
        }

        await dare.remove();

        return channel.send(makeSuccessMessage('Dare was successfully deleted'));
    }
}

export { TruthOrDareCommands };
