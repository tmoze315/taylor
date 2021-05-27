import BaseCommands from "./base-commands";
import { makeSuccessMessage } from "../messages/success";
import { makeErrorMessage } from "../messages/error";
import { CollectorFilter, Message, MessageEmbed, MessageReaction } from "discord.js";
import { Question } from "../models/Question";
import { Dare } from "../models/Dare";
import { ray } from "node-ray";
import { DiscordService } from "../services/discord-service";

class TruthOrDareCommands extends BaseCommands {
    async truth(type: string = 'sfw') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

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
            return DiscordService.send(guildId, channelId, makeErrorMessage('Oops, I couldn\'t find any questions. Try adding one with `?t truthadd`'));
        }

        const question = questions[0];

        const messageEmbed = new MessageEmbed()
            .setTitle(question.question)
            .setFooter(`Truth - category: ${question.type} - id: #${question.questionId}`)
            .setColor('#FBCFE8');

        return DiscordService.send(guildId, channelId, messageEmbed);
    }

    async addTruth(questionText: string = '') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!questionText) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`You can add a question using the following format (use \`sfw\` or \`r\` as the categories)

            \`?t truthadd "This is the question" r\``));
        }

        const regex = new RegExp(/"(.*)" (.*)/gm);
        const matches = regex.exec(questionText);

        if (!matches || matches.length !== 3) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`You can add a question using the following format (use \`sfw\` or \`r\` as the categories)

            \`?t truthadd "This is the question" r\``));
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

        return DiscordService.send(guildId, channelId, makeSuccessMessage(`Question (#${questionId}) successfully added!`));
    }

    async deleteTruth(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Please add a question id (e.g. 3).'));
        }

        const question = await Question.findOne({ guildId: guildId, questionId: parseInt(params) });

        if (!question) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Question not found with that id'));
        }

        await question.remove();

        return DiscordService.send(guildId, channelId, makeSuccessMessage('Question was successfully deleted'));
    }

    async dare(type: string = 'sfw') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

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
            return DiscordService.send(guildId, channelId, makeErrorMessage('Oops, I couldn\'t find any dares. Try adding one with `?t dareadd`'));
        }

        const dare = dares[0];

        const messageEmbed = new MessageEmbed()
            .setTitle(dare.dare)
            .setFooter(`Dare - category: ${dare.type} - id: #${dare.dareId}`)
            .setColor('#FBCFE8');

        return DiscordService.send(guildId, channelId, messageEmbed);
    }

    async addDare(dareText: string = '') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!dareText) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`You can add a dare using the following format (use \`sfw\` or \`r\` as the categories)

            \`?t dareadd "This is the dare" r\``));
        }

        const regex = new RegExp(/"(.*)" (.*)/gm);
        const matches = regex.exec(dareText);

        if (!matches || matches.length !== 3) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`You can add a dare using the following format (use \`sfw\` or \`r\` as the categories)

            \`?t dareadd "This is the dare" r\``));
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

        return DiscordService.send(guildId, channelId, makeSuccessMessage(`Dare (#${dareId}) successfully added!`));
    }

    async deleteDare(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Please add a dare id (e.g. 3).'));
        }

        const dare = await Dare.findOne({ guildId: guildId, dareId: parseInt(params) });

        if (!dare) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Dare not found with that id'));
        }

        await dare.remove();

        return DiscordService.send(guildId, channelId, makeSuccessMessage('Dare was successfully deleted'));
    }
}

export { TruthOrDareCommands };
