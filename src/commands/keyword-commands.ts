import { MessageEmbed } from "discord.js";
import { upperFirst } from "lodash";
import { makeErrorMessage } from "../messages/error";
import { makeSuccessMessage } from "../messages/success";
import { Keyword } from "../models/Keyword";
import { DiscordService } from "../services/discord-service";
import BaseCommands from "./base-commands";
import slugify from "slugify"

class KeywordCommands extends BaseCommands {
    async keywords() {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

        const keywords = await Keyword.find({
            guildId: guildId,
        }).sort({ keywordId: 1 });

        const desc = [];

        for (const keyword of keywords) {
            desc.push(`\`${upperFirst(keyword.keyword)}\` (#${keyword.keywordId})`);
        }

        const response = new MessageEmbed()
            .setTitle('Phrases that I respond to')
            .setFooter('Punctuation is optional')
            .setDescription(desc.join('\n\n'))
            .setColor('#FBCFE8');

        return DiscordService.send(guildId, channelId, response);
    }

    async addKeyword(keywordText: string = '') {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        const desc = [
            `You can add a keyword using the format below. Note that when matching the keywords, punctuation is ignored.`,
            ``,
            `**Text Response**`,
            `\`?t keywordadd "This is some keyword" "This is my response"\``,
            ``,
            `**Text Response (mention user who sent the message)**`,
            `\`?t keywordadd "Will you marry me?" "Yes {user}, I would love to!"\``,
            ``,
            `**GIF Response**`,
            `\`?t keywordadd "This is some keyword" "https://media.giphy.com/media/PFc4ohINrJWCY/giphy.gif"\``,
        ];

        const helpMessage = new MessageEmbed()
            .setTitle('Adding keywords')
            .setDescription(desc.join('\n'))
            .setColor('#FBCFE8');

        if (!keywordText) {
            return DiscordService.send(guildId, channelId, helpMessage);
        }

        const regex = new RegExp(/"(.*)" "([\s\S]*)"/gm);
        const matches = regex.exec(keywordText);

        if (!matches || matches.length !== 3) {
            return DiscordService.send(guildId, channelId, helpMessage);
        }

        const [, keywordString, keywordResponse] = matches;

        const existingKeywords = await Keyword.find({ guildId: guildId, searchableKeyword: slugify(keywordString, { lower: true, strict: true }) }).limit(1);

        if (existingKeywords.length > 0) {
            const existingKeyword = existingKeywords[0];

            await existingKeyword.addResponse(keywordResponse);

            return DiscordService.send(guildId, channelId, makeSuccessMessage(`Response successfully added to the keyword (#${existingKeyword.keywordId})!`));
        }

        const itemWithBiggestId = await Keyword.find({ guildId: guildId }).sort({ keywordId: -1 }).limit(1);
        let biggestId = 0;

        if (itemWithBiggestId.length > 0) {
            biggestId = itemWithBiggestId[0]?.keywordId || 0;
        }

        const keywordId = biggestId + 1;

        const keyword = new Keyword({
            guildId: guildId,
            keywordId,
            keyword: keywordString.trim(),
            searchableKeyword: slugify(keywordString, { lower: true, strict: true }),
            responses: [keywordResponse],
        });

        await keyword.save();

        return DiscordService.send(guildId, channelId, makeSuccessMessage(`Keyword (#${keywordId}) successfully added!`));
    }

    async deleteKeyword(params: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const authorId = this.message.author().id;

        if (!this.guild.isAdmin(authorId)) {
            return
        }

        if (!params) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Please add a keyword id (e.g. 3).'));
        }

        const keyword = await Keyword.findOne({ guildId: guildId, keywordId: parseInt(params) });

        if (!keyword) {
            return DiscordService.send(guildId, channelId, makeErrorMessage('Keyword not found with that id'));
        }

        await keyword.remove();

        return DiscordService.send(guildId, channelId, makeSuccessMessage('Keyword was successfully deleted'));
    }
}

export { KeywordCommands };
